import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { BrowseProjects } from './components/BrowseProjects.tsx';
import { ProfileSetup } from './components/ProfileSetup.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { ProjectDetailModal } from './components/ProjectDetailModal.tsx';
import { ProjectChat } from './components/ProjectChat.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { CreateProjectModal } from './components/CreateProjectModal.tsx';
import { Project } from './types.ts';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase.ts';

function AppContent() {
  const { userProfile, updateProfile } = useAuth();

  // Navigation tab (defaults to landing for unauthenticated, browse for authenticated)
  const [currentTab, setCurrentTab] = useState<'landing' | 'browse' | 'dashboard' | 'chat'>('landing');
  const [activeChatProject, setActiveChatProject] = useState<Project | null>(null);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<Project | null>(null);

  // Modals & Popups
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isProfileSetupModalOpen, setIsProfileSetupModalOpen] = useState(false);

  // Pure non-white palette setup
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('crewhub_theme');
  }, []);

  // Real-time Firestore database collection (NO STATIC DATA!)
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    // Real-time Firestore listener for live projects
    const unsub = onSnapshot(
      collection(db, 'projects'),
      (snapshot) => {
        const list: Project[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Project));
        setProjects(list);
      },
      (err) => {
        console.warn('Firestore projects listener error:', err);
      }
    );

    return () => unsub();
  }, []);

  // Structural Onboarding Flow:
  // As soon as user signs in, if they haven't completed their profile, trigger the Profile Setup POP UP!
  useEffect(() => {
    if (userProfile && !userProfile.completedProfile) {
      setIsProfileSetupModalOpen(true);
    }
  }, [userProfile?.id, userProfile?.completedProfile]);

  // When a leader accepts an applicant, update the project's roster in Firestore in real time
  const handleUpdateProjectRoster = async (projectId: string, newMember: any, filledRole: string) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id === projectId) {
          const updatedMembers = [...proj.members, newMember];
          const updatedMemberIds = [...(proj.memberIds || []), newMember.userId];
          const updatedOpenRoles = proj.openRoles.map((r) =>
            r.role.toLowerCase() === filledRole.toLowerCase() ? { ...r, filled: true } : r
          );

          try {
            updateDoc(doc(db, 'projects', projectId), {
              members: updatedMembers,
              memberIds: updatedMemberIds,
              openRoles: updatedOpenRoles,
              updatedAt: new Date().toISOString(),
            });
          } catch (e) {
            console.warn('Update project roster error:', e);
          }

          return {
            ...proj,
            members: updatedMembers,
            memberIds: updatedMemberIds,
            openRoles: updatedOpenRoles,
          };
        }
        return proj;
      })
    );
  };

  const handleOpenChat = (project: Project) => {
    setActiveChatProject(project);
    setCurrentTab('chat');
  };

  // Create Project: Persist directly into Firestore database in real time!
  const handleCreateProject = async (newProject: Project) => {
    try {
      await setDoc(doc(db, 'projects', newProject.id), newProject);
    } catch (e) {
      console.warn('Save new project to Firestore error:', e);
    }
    setCurrentTab('dashboard');
  };

  // Nav Switcher with smart chat opener and Profile popup trigger
  const handleSelectTab = (tab: string) => {
    if (tab === 'profile') {
      setIsProfileSetupModalOpen(true);
      return;
    }

    if (tab === 'chat') {
      if (!activeChatProject) {
        // Find a project the user belongs to
        const userProj =
          projects.find(
            (p) => userProfile && (p.leaderId === userProfile.id || p.memberIds?.includes(userProfile.id))
          ) || projects[0];

        if (userProj) {
          setActiveChatProject(userProj);
        }
      }
      setCurrentTab('chat');
      return;
    }

    setCurrentTab(tab as any);
  };

  return (
    <div className="min-h-screen bg-[#EFE7D8] text-[#36241E] flex flex-col selection:bg-[#5B6838] selection:text-[#F5EDE2] relative overflow-x-hidden">
      {/* Scattered Ambient Gold Stars from Picture 1 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <span className="absolute top-12 left-8 text-2xl text-[#D9A83A] opacity-80 animate-pulse">★</span>
        <span className="absolute top-36 right-12 text-3xl text-[#D9A83A] opacity-75">★</span>
        <span className="absolute top-1/3 left-16 text-xl text-[#D9A83A] opacity-60">★</span>
        <span className="absolute top-1/2 right-20 text-2xl text-[#D9A83A] opacity-70">★</span>
        <span className="absolute top-2/3 left-10 text-3xl text-[#D9A83A] opacity-65">★</span>
        <span className="absolute bottom-24 right-16 text-2xl text-[#D9A83A] opacity-80">★</span>
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onOpenCreateModal={() => {
            if (!userProfile) {
              setIsAuthModalOpen(true);
            } else {
              setIsCreateProjectModalOpen(true);
            }
          }}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* Global Banner for incomplete profile */}
        {userProfile && !userProfile.completedProfile && (
          <div className="bg-[#DFB4C4] border-b-2 border-[#36241E] px-4 py-2 text-center text-xs font-mono font-bold text-[#36241E] flex items-center justify-center gap-2">
            <span>★ Action Required: Finish setting up your GitHub & skills profile to activate AI matching.</span>
            <button
              onClick={() => setIsProfileSetupModalOpen(true)}
              className="underline font-black hover:text-[#5B6838] cursor-pointer"
            >
              Complete Profile Now →
            </button>
          </div>
        )}

        <main className="flex-1">
          {currentTab === 'landing' && (
            <LandingPage
              projects={projects}
              onBrowse={() => setCurrentTab('browse')}
              onCreateProject={() => {
                if (!userProfile) setIsAuthModalOpen(true);
                else setIsCreateProjectModalOpen(true);
              }}
              onSelectProject={(p) => setSelectedProjectForDetail(p)}
            />
          )}

          {currentTab === 'browse' && (
            <BrowseProjects
              projects={projects}
              onSelectProject={(p) => setSelectedProjectForDetail(p)}
              onRequestJoin={(p) => setSelectedProjectForDetail(p)}
              onCreateProject={() => {
                if (!userProfile) setIsAuthModalOpen(true);
                else setIsCreateProjectModalOpen(true);
              }}
            />
          )}

          {currentTab === 'dashboard' && (
            <Dashboard
              projects={projects}
              onOpenChat={handleOpenChat}
              onSelectProject={(p) => setSelectedProjectForDetail(p)}
              onCreateProject={() => {
                if (!userProfile) setIsAuthModalOpen(true);
                else setIsCreateProjectModalOpen(true);
              }}
              onUpdateProjectRoster={handleUpdateProjectRoster}
            />
          )}

          {currentTab === 'chat' && activeChatProject && (
            <ProjectChat
              project={activeChatProject}
              onBack={() => setCurrentTab('dashboard')}
              onRemoveMember={(memberId) => {
                const updatedMembers = activeChatProject.members.filter((m) => m.userId !== memberId);
                const updatedMemberIds = activeChatProject.memberIds.filter((id) => id !== memberId);
                const updated = {
                  ...activeChatProject,
                  members: updatedMembers,
                  memberIds: updatedMemberIds,
                };
                setActiveChatProject(updated);
                setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                try {
                  updateDoc(doc(db, 'projects', activeChatProject.id), {
                    members: updatedMembers,
                    memberIds: updatedMemberIds,
                  });
                } catch (e) {
                  console.warn('Remove member fallback:', e);
                }
              }}
            />
          )}
        </main>

        {/* 1. SIGN IN MODAL */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {
            setIsAuthModalOpen(false);
            // As soon as user signs in: Trigger the Complete Profile Pop-up Modal!
            setIsProfileSetupModalOpen(true);
          }}
        />

        {/* 2. COMPLETE PROFILE IN STEPS POP-UP MODAL */}
        <ProfileSetup
          isOpen={isProfileSetupModalOpen}
          onClose={() => setIsProfileSetupModalOpen(false)}
          onComplete={async () => {
            await updateProfile({ completedProfile: true });
            setIsProfileSetupModalOpen(false);
            setCurrentTab('browse');
          }}
        />

        {/* 3. PROJECT DETAIL MODAL */}
        <ProjectDetailModal
          project={selectedProjectForDetail}
          onClose={() => setSelectedProjectForDetail(null)}
          onRequestSubmitted={() => {
            setCurrentTab('dashboard');
          }}
        />

        {/* 4. CREATE PROJECT MODAL */}
        <CreateProjectModal
          isOpen={isCreateProjectModalOpen}
          onClose={() => setIsCreateProjectModalOpen(false)}
          onProjectCreated={handleCreateProject}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
