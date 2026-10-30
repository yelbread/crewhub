import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  signInAnonymously,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase.ts';
import { UserProfile, WorkStyle, TeamPreferences } from '../types.ts';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<UserProfile>;
  signInWithPassword: (email: string, password: string) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_WORK_STYLE: WorkStyle = {
  fastVsPlanning: 5,
  independentVsCollaborative: 5,
  structuredVsFlexible: 5,
};

const DEFAULT_TEAM_PREF: TeamPreferences = {
  desiredSize: 4,
  beginnerFriendly: true,
  leadershipPreference: 'no preference',
  locationPreference: 'hybrid',
};

// WebCrypto salted password hasher (PBKDF2 SHA-256, 10,000 iterations, 32 bytes)
async function computePasswordHash(password: string, salt: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const enc = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );
      const derivedBits = await window.crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: enc.encode(salt),
          iterations: 10000,
          hash: 'SHA-256',
        },
        keyMaterial,
        256
      );
      const hashArray = Array.from(new Uint8Array(derivedBits));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('WebCrypto hash error, falling back to server route:', err);
  }

  // Server API route fallback
  try {
    const res = await fetch('/api/auth/hash-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, salt }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.hash;
    }
  } catch (e) {
    console.warn('Backend password hash error:', e);
  }

  throw new Error('Could not compute secure password hash');
}

function generateSalt(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Clean blank user profile with NO mock/dummy data
function createBlankProfile(uid: string, email: string, displayName?: string): UserProfile {
  const cleanEmail = email.toLowerCase().trim();
  const nameFromEmail = cleanEmail ? cleanEmail.split('@')[0].replace(/[._-]/g, ' ') : '';
  const initialName =
    displayName || (nameFromEmail ? nameFromEmail.replace(/\b\w/g, (c) => c.toUpperCase()) : '');

  return {
    id: uid,
    email: cleanEmail,
    fullName: initialName,
    institution: '',
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`,
    githubUsername: '',
    githubVerified: false,
    linkedinUrl: '',
    linkedinVerified: false,
    skills: [],
    preferredRoles: [],
    domainInterests: [],
    goal: 'win a hackathon',
    workStyle: DEFAULT_WORK_STYLE,
    teamPreferences: DEFAULT_TEAM_PREF,
    completedProfile: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    // Keep user logged in across sessions until they log out
    const cached = localStorage.getItem('crewhub_local_user');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Load user profile from Firestore or sync with server
  const fetchUserProfile = async (uid: string, email: string, displayName?: string) => {
    try {
      const cleanEmail = (email || '').toLowerCase().trim();

      // 1. Check direct UID document
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
        localStorage.setItem('crewhub_local_user', JSON.stringify(data));
        return data;
      }

      // 2. Check by email
      if (cleanEmail) {
        try {
          const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            const foundDoc = querySnap.docs[0];
            const data = { id: foundDoc.id, ...foundDoc.data() } as UserProfile;
            setUserProfile(data);
            localStorage.setItem('crewhub_local_user', JSON.stringify(data));
            return data;
          }
        } catch (e) {
          // ignore
        }
      }

      // 3. Create fresh profile
      const newProfile = createBlankProfile(uid, cleanEmail, displayName);
      try {
        await setDoc(userRef, newProfile);
      } catch (err) {
        console.warn('Initial profile Firestore save warning:', err);
      }

      setUserProfile(newProfile);
      localStorage.setItem('crewhub_local_user', JSON.stringify(newProfile));
      return newProfile;
    } catch (err) {
      console.warn('Profile fetch error, using clean state:', err);
      const fallback = createBlankProfile(uid, email, displayName);
      setUserProfile(fallback);
      return fallback;
    }
  };

  useEffect(() => {
    // Ensure Firebase Anonymous Auth session exists for database security rules
    signInAnonymously(auth).catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && user.email) {
        await fetchUserProfile(user.uid, user.email, user.displayName || undefined);
      } else {
        // If not signed in via Google, maintain persistent session from localStorage
        const saved = localStorage.getItem('crewhub_local_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setUserProfile(parsed);
            // Refresh from Firestore in background
            if (parsed.id) {
              getDoc(doc(db, 'users', parsed.id)).then((d) => {
                if (d.exists()) {
                  const updated = d.data() as UserProfile;
                  setUserProfile(updated);
                  localStorage.setItem('crewhub_local_user', JSON.stringify(updated));
                }
              }).catch(() => {});
            }
          } catch (e) {
            setUserProfile(null);
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Google OAuth Sign-in
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await fetchUserProfile(result.user.uid, result.user.email || '', result.user.displayName || undefined);
      }
    } catch (error) {
      console.error('Google Sign-in failed:', error);
      throw error;
    }
  };

  // Email + Password: Create Account (Passwords are hashed with salt, never plaintext)
  const signUpWithPassword = async (email: string, password: string): Promise<UserProfile> => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // Check if user already exists in Firestore
    try {
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const existingSnap = await getDocs(q);
      if (!existingSnap.empty) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
    } catch (err: any) {
      if (err.message?.includes('already exists')) throw err;
    }

    // Generate salt and hash password
    const salt = generateSalt();
    const passwordHash = await computePasswordHash(password, salt);

    const safeHash = Math.abs(
      cleanEmail.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
    ).toString(36);
    const uid = `usr_${safeHash}_${Date.now().toString(36).slice(-4)}`;

    const newProfile = createBlankProfile(uid, cleanEmail);
    newProfile.completedProfile = false; // Triggers Step-by-Step Profile Setup popup!

    const userDocData = {
      ...newProfile,
      passwordHash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', uid), userDocData);
    } catch (e) {
      console.warn('Save user doc error:', e);
    }

    setUserProfile(newProfile);
    localStorage.setItem('crewhub_local_user', JSON.stringify(newProfile));
    return newProfile;
  };

  // Email + Password: Sign In (Verifies hashed password with stored salt)
  const signInWithPassword = async (email: string, password: string): Promise<UserProfile> => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password) {
      throw new Error('Password is required.');
    }

    // Look up user by email
    const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
    const snap = await getDocs(q);

    if (snap.empty) {
      throw new Error('No account found for this email. Please click "Create Account" below.');
    }

    const userDoc = snap.docs[0];
    const userData = userDoc.data();

    // If user previously signed up with password, verify hash
    if (userData.passwordHash && userData.passwordSalt) {
      const computedHash = await computePasswordHash(password, userData.passwordSalt);
      if (computedHash !== userData.passwordHash) {
        throw new Error('Incorrect password. Please try again.');
      }
    } else {
      // User registered via Google or early session: update password hash on first password login
      const salt = generateSalt();
      const hash = await computePasswordHash(password, salt);
      await setDoc(
        doc(db, 'users', userDoc.id),
        { passwordHash: hash, passwordSalt: salt, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    }

    const profile: UserProfile = {
      id: userDoc.id,
      email: cleanEmail,
      fullName: userData.fullName || cleanEmail.split('@')[0],
      institution: userData.institution || '',
      avatarUrl: userData.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${userDoc.id}`,
      githubUsername: userData.githubUsername || '',
      githubVerified: userData.githubVerified || false,
      githubEvidence: userData.githubEvidence,
      linkedinUrl: userData.linkedinUrl || '',
      linkedinVerified: userData.linkedinVerified || false,
      skills: userData.skills || [],
      preferredRoles: userData.preferredRoles || [],
      domainInterests: userData.domainInterests || [],
      goal: userData.goal || 'win a hackathon',
      workStyle: userData.workStyle || DEFAULT_WORK_STYLE,
      teamPreferences: userData.teamPreferences || DEFAULT_TEAM_PREF,
      completedProfile: userData.completedProfile ?? false,
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUserProfile(profile);
    localStorage.setItem('crewhub_local_user', JSON.stringify(profile));
    return profile;
  };

  // Sign out: clears persistent session
  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('crewhub_local_user');
    setCurrentUser(null);
    setUserProfile(null);
  };

  // Update Profile: persists to Firestore and localStorage
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;

    const updated = {
      ...userProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    setUserProfile(updated);
    localStorage.setItem('crewhub_local_user', JSON.stringify(updated));

    try {
      const userRef = doc(db, 'users', userProfile.id);
      await setDoc(userRef, updated, { merge: true });
    } catch (err) {
      console.warn('Firestore profile update non-blocking error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        signUpWithPassword,
        signInWithPassword,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
