import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ALL_SKILLS,
  SKILL_CATEGORIES,
  PREFERRED_ROLES,
  DOMAIN_INTERESTS,
  GOALS,
  resolveSkill,
} from '../data/taxonomy.ts';
import { UserSkill, SkillLevel } from '../types.ts';
import {
  CheckCircle,
  Github,
  Linkedin,
  ArrowRight,
  ArrowLeft,
  Search,
  ShieldCheck,
  Sliders,
  X,
  Sparkles,
} from 'lucide-react';

interface ProfileSetupProps {
  isOpen?: boolean;
  onClose?: () => void;
  onComplete: () => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({
  isOpen = true,
  onClose,
  onComplete,
}) => {
  const { userProfile, updateProfile } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [showStamp, setShowStamp] = useState(false);

  // Step 1: Identity & Proof state
  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [institution, setInstitution] = useState(userProfile?.institution || '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl || '');
  const [githubUsername, setGithubUsername] = useState(userProfile?.githubUsername || '');
  const [githubVerified, setGithubVerified] = useState(userProfile?.githubVerified || false);
  const [githubEvidence, setGithubEvidence] = useState(userProfile?.githubEvidence || null);
  const [verifyingGithub, setVerifyingGithub] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  const [linkedinUrl, setLinkedinUrl] = useState(userProfile?.linkedinUrl || '');
  const [linkedinVerified, setLinkedinVerified] = useState(userProfile?.linkedinVerified || false);
  const [verifyingLinkedin, setVerifyingLinkedin] = useState(false);
  const [linkedinError, setLinkedinError] = useState<string | null>(null);

  // Step 2: Skills & Roles state
  const [skillSearch, setSkillSearch] = useState('');
  const [skills, setSkills] = useState<UserSkill[]>(userProfile?.skills || []);
  const [preferredRoles, setPreferredRoles] = useState<string[]>(userProfile?.preferredRoles || []);
  const [domainInterests, setDomainInterests] = useState<string[]>(userProfile?.domainInterests || []);

  // Step 3: Goals & Style state
  const [goal, setGoal] = useState(userProfile?.goal || 'win a hackathon');
  const [fastVsPlanning, setFastVsPlanning] = useState(userProfile?.workStyle?.fastVsPlanning ?? 5);
  const [independentVsCollaborative, setIndependentVsCollaborative] = useState(
    userProfile?.workStyle?.independentVsCollaborative ?? 5
  );
  const [structuredVsFlexible, setStructuredVsFlexible] = useState(
    userProfile?.workStyle?.structuredVsFlexible ?? 5
  );

  const [desiredSize, setDesiredSize] = useState(userProfile?.teamPreferences?.desiredSize ?? 4);
  const [beginnerFriendly, setBeginnerFriendly] = useState(
    userProfile?.teamPreferences?.beginnerFriendly ?? true
  );
  const [leadershipPreference, setLeadershipPreference] = useState(
    userProfile?.teamPreferences?.leadershipPreference || 'no preference'
  );
  const [locationPreference, setLocationPreference] = useState(
    userProfile?.teamPreferences?.locationPreference || 'hybrid'
  );

  // Synchronize component state whenever userProfile loads or changes
  React.useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || '');
      setInstitution(userProfile.institution || '');
      setAvatarUrl(userProfile.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile.id}`);
      setGithubUsername(userProfile.githubUsername || '');
      setGithubVerified(userProfile.githubVerified || false);
      setGithubEvidence(userProfile.githubEvidence || null);
      setLinkedinUrl(userProfile.linkedinUrl || '');
      setLinkedinVerified(userProfile.linkedinVerified || false);
      setSkills(userProfile.skills || []);
      setPreferredRoles(userProfile.preferredRoles || []);
      setDomainInterests(userProfile.domainInterests || []);
      setGoal(userProfile.goal || 'win a hackathon');
      if (userProfile.workStyle) {
        setFastVsPlanning(userProfile.workStyle.fastVsPlanning ?? 5);
        setIndependentVsCollaborative(userProfile.workStyle.independentVsCollaborative ?? 5);
        setStructuredVsFlexible(userProfile.workStyle.structuredVsFlexible ?? 5);
      }
      if (userProfile.teamPreferences) {
        setDesiredSize(userProfile.teamPreferences.desiredSize ?? 4);
        setBeginnerFriendly(userProfile.teamPreferences.beginnerFriendly ?? true);
        setLeadershipPreference(userProfile.teamPreferences.leadershipPreference || 'no preference');
        setLocationPreference(userProfile.teamPreferences.locationPreference || 'hybrid');
      }
    }
  }, [userProfile, isOpen]);

  if (!isOpen) return null;

  // Autosave when changing steps or values
  const persistChanges = async (isFinal = false) => {
    setSaving(true);
    const updates = {
      fullName: fullName.trim() || userProfile?.fullName || '',
      institution: institution.trim(),
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile?.id || 'builder'}`,
      githubUsername: githubUsername.trim(),
      githubVerified,
      githubEvidence: githubEvidence || undefined,
      linkedinUrl: linkedinUrl.trim(),
      linkedinVerified,
      skills,
      preferredRoles,
      domainInterests,
      goal,
      workStyle: {
        fastVsPlanning,
        independentVsCollaborative,
        structuredVsFlexible,
      },
      teamPreferences: {
        desiredSize,
        beginnerFriendly,
        leadershipPreference: leadershipPreference as any,
        locationPreference: locationPreference as any,
      },
      completedProfile: isFinal || userProfile?.completedProfile || false,
    };
    await updateProfile(updates);
    setSaving(false);
  };

  // GitHub Verification action (Queries live GitHub API via backend proxy)
  const handleVerifyGithub = async () => {
    if (!githubUsername.trim()) {
      setGithubError('Please enter a GitHub username or link.');
      return;
    }
    setVerifyingGithub(true);
    setGithubError(null);

    try {
      const res = await fetch('/api/verify-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: githubUsername.trim(), type: 'github' }),
      });
      const data = await res.json();

      if (!data.valid) {
        setGithubVerified(false);
        setGithubEvidence(null);
        setGithubError(data.error || 'GitHub account could not be found.');
        return;
      }

      setGithubVerified(true);
      setGithubEvidence(data.evidence);
      setGithubError(null);
    } catch (err: any) {
      setGithubError('Could not reach verification service. Please try again.');
    } finally {
      setVerifyingGithub(false);
    }
  };

  // LinkedIn Verification action (Validates live profile link)
  const handleVerifyLinkedin = async () => {
    if (!linkedinUrl.trim()) {
      setLinkedinError('Please enter a LinkedIn profile link.');
      return;
    }
    setVerifyingLinkedin(true);
    setLinkedinError(null);

    try {
      const res = await fetch('/api/verify-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkedinUrl.trim(), type: 'linkedin' }),
      });
      const data = await res.json();

      if (!data.valid) {
        setLinkedinVerified(false);
        setLinkedinError(
          data.error || 'Please provide a valid LinkedIn URL (e.g. https://www.linkedin.com/in/username)'
        );
        return;
      }

      setLinkedinVerified(true);
      setLinkedinError(null);
    } catch (err: any) {
      setLinkedinError('Could not contact verification service. Please try again.');
    } finally {
      setVerifyingLinkedin(false);
    }
  };

  const toggleSkill = (skillName: string, level: SkillLevel = 'intermediate') => {
    const resolved = resolveSkill(skillName);
    if (!resolved.canonicalName) return;
    const exists = skills.find(
      (s) => s.name.toLowerCase() === resolved.canonicalName.toLowerCase()
    );
    if (exists) {
      setSkills(
        skills.filter(
          (s) => s.name.toLowerCase() !== resolved.canonicalName.toLowerCase()
        )
      );
    } else {
      setSkills([
        ...skills,
        {
          name: resolved.canonicalName,
          level,
          isCustom: resolved.isCustom,
        },
      ]);
    }
  };

  const updateSkillLevel = (skillName: string, level: SkillLevel) => {
    setSkills(
      skills.map((s) => (s.name === skillName ? { ...s, level } : s))
    );
  };

  const toggleRole = (role: string) => {
    if (preferredRoles.includes(role)) {
      setPreferredRoles(preferredRoles.filter((r) => r !== role));
    } else {
      setPreferredRoles([...preferredRoles, role]);
    }
  };

  const toggleDomain = (domain: string) => {
    if (domainInterests.includes(domain)) {
      setDomainInterests(domainInterests.filter((d) => d !== domain));
    } else {
      setDomainInterests([...domainInterests, domain]);
    }
  };

  const handleNext = async () => {
    await persistChanges();
    if (step < 3) {
      setStep((step + 1) as any);
    } else {
      setShowStamp(true);
      await persistChanges(true);
      setTimeout(() => {
        onComplete();
      }, 900);
    }
  };

  const handleBack = async () => {
    await persistChanges();
    if (step > 1) {
      setStep((step - 1) as any);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#36241E]/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border-2 border-[#36241E] bg-[#E5DBC8] shadow-[8px_8px_0px_#36241E] overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Ticket Notch Cutouts */}
        <div className="ticket-notch-left" />
        <div className="ticket-notch-right" />

        {/* Modal Close / Skip Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-[#36241E] text-[#D9A83A] hover:bg-[#5B6838] transition-colors cursor-pointer border-2 border-[#36241E]"
            aria-label="Close"
            title="Skip for now"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Modal Content Scroll Area */}
        <div className="overflow-y-auto p-4 sm:p-7 space-y-6 relative flex-1">
          {/* Header Card */}
          <div className="ticket-dashed-frame p-4 sm:p-5 relative">
            <span className="absolute top-2 right-6 text-2xl text-[#D9A83A] select-none">★</span>
            <span className="absolute bottom-2 left-6 text-xl text-[#D9A83A] select-none">★</span>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#DFB4C4] text-[#36241E] border border-[#36241E] text-[10px] font-mono font-black uppercase tracking-wider mb-1.5 shadow-[1px_1px_0px_#36241E]">
                  <span className="text-[#D9A83A]">★</span>
                  <span>Passenger Passport Setup · Step {step} of 3</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black font-display text-[#36241E]">
                  Complete Your Profile
                </h1>
                <p className="text-xs text-[#543E36] font-mono mt-0.5 font-semibold">
                  Configure your verified credentials, skills, and work style to activate real-time AI talent matching.
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-mono font-black uppercase text-[#36241E]">
                  {saving ? 'Saving...' : 'Auto-Saved'}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full ${saving ? 'bg-[#9C4E1E] animate-ping' : 'bg-[#5B6838]'}`} />
              </div>
            </div>

            {/* 3-Step Interactive Wizard Progress Indicators */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t-2 border-dashed border-[#36241E]/30 relative z-10">
              {[
                { num: 1, title: 'Identity & Links', desc: 'GitHub & LinkedIn' },
                { num: 2, title: 'Skills & Roles', desc: 'Stack & Interests' },
                { num: 3, title: 'Goals & Style', desc: 'Work Chemistry' },
              ].map((s) => {
                const isActive = step === s.num;
                const isPast = step > s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => setStep(s.num as any)}
                    className={`text-left p-2 rounded-xl border-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#36241E] bg-[#36241E] text-[#F5EDE2] shadow-[2px_2px_0px_#231612]'
                        : isPast
                        ? 'border-[#36241E] bg-[#C8D6AE] text-[#263311]'
                        : 'border-[#36241E]/30 bg-[#EFE7D8] text-[#543E36]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono font-black uppercase mb-0.5">
                      <span>Step 0{s.num}</span>
                      {isPast && <span className="text-[#5B6838] font-bold">✓</span>}
                    </div>
                    <div className="text-xs font-black font-display truncate">{s.title}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stamped Success Banner when finishing */}
          {showStamp && (
            <div className="p-4 rounded-2xl bg-[#C8D6AE] border-2 border-[#36241E] text-center space-y-1.5 animate-in zoom-in-95 duration-200 shadow-[4px_4px_0px_#36241E]">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#36241E] text-[#D9A83A] text-xs font-mono font-black uppercase">
                <span>★ PASSPORT STAMPED & ADMITTED ★</span>
              </div>
              <p className="text-xs font-mono font-bold text-[#263311]">
                Profile successfully stored in database. Entering project workspace...
              </p>
            </div>
          )}

          {/* STEP 1: IDENTITY, GITHUB & LINKEDIN */}
          {step === 1 && (
            <div className="p-4 sm:p-5 rounded-2xl border-2 border-[#36241E] bg-[#EFE7D8] space-y-4 shadow-[3px_3px_0px_#36241E]">
              <div className="border-b border-[#36241E]/20 pb-2">
                <h2 className="text-base font-black font-display text-[#36241E]">
                  Step 1: Builder Identity & Public Profiles
                </h2>
                <p className="text-xs font-mono text-[#543E36]">
                  Attach your real GitHub and LinkedIn so captains can review code evidence.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-black font-mono uppercase text-[#36241E] mb-1">
                    Full Legal / Display Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maya Lin"
                    className="w-full py-2 px-3 text-xs font-mono font-bold bg-[#FAF7F2] border-2 border-[#36241E] rounded-xl text-[#36241E] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black font-mono uppercase text-[#36241E] mb-1">
                    University / College / Company
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="w-full py-2 px-3 text-xs font-mono font-bold bg-[#FAF7F2] border-2 border-[#36241E] rounded-xl text-[#36241E] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* GitHub Link & Real-time Verification */}
              <div className="space-y-2 pt-2 border-t border-[#36241E]/20">
                <label className="block text-[11px] font-black font-mono uppercase text-[#36241E]">
                  GitHub Username or Profile Link
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#36241E]" />
                    <input
                      type="text"
                      value={githubUsername}
                      onChange={(e) => {
                        setGithubUsername(e.target.value);
                        setGithubVerified(false);
                        setGithubError(null);
                      }}
                      placeholder="e.g. yelbread or https://github.com/username"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold bg-[#FAF7F2] border-2 border-[#36241E] rounded-xl text-[#36241E] focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyGithub}
                    disabled={verifyingGithub || !githubUsername}
                    className="px-3.5 py-2 rounded-xl btn-retro-chocolate text-[#F5EDE2] font-mono font-black text-xs uppercase cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {verifyingGithub ? 'Verifying...' : githubVerified ? '✓ Verified' : 'Verify'}
                  </button>
                </div>

                {githubError && (
                  <p className="text-[11px] font-mono font-bold text-red-700 bg-red-100 p-2 rounded-lg border border-red-300">
                    ✕ {githubError}
                  </p>
                )}

                {githubVerified && githubEvidence && (
                  <div className="p-3 rounded-xl bg-[#C8D6AE] border-2 border-[#36241E] text-xs font-mono text-[#263311] space-y-1">
                    <div className="flex items-center gap-1.5 font-black uppercase text-[10px]">
                      <CheckCircle className="w-3.5 h-3.5 text-[#5B6838]" />
                      <span>GitHub Verified: {githubEvidence.repos} Repositories · {githubEvidence.followers} Followers</span>
                    </div>
                    <div className="text-[11px] font-semibold">
                      Languages: {githubEvidence.topLanguages?.join(', ')}
                    </div>
                  </div>
                )}
              </div>

              {/* LinkedIn Link */}
              <div className="space-y-2 pt-2 border-t border-[#36241E]/20">
                <label className="block text-[11px] font-black font-mono uppercase text-[#36241E]">
                  LinkedIn Profile URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#36241E]" />
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => {
                        setLinkedinUrl(e.target.value);
                        setLinkedinVerified(false);
                        setLinkedinError(null);
                      }}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold bg-[#FAF7F2] border-2 border-[#36241E] rounded-xl text-[#36241E] focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyLinkedin}
                    disabled={verifyingLinkedin || !linkedinUrl}
                    className="px-3.5 py-2 rounded-xl btn-retro-mauve text-[#36241E] font-mono font-black text-xs uppercase cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {verifyingLinkedin ? 'Verifying...' : linkedinVerified ? '✓ Verified' : 'Verify Link'}
                  </button>
                </div>

                {linkedinError && (
                  <p className="text-[11px] font-mono font-bold text-red-700 bg-red-100 p-2 rounded-lg border border-red-300">
                    ✕ {linkedinError}
                  </p>
                )}

                {linkedinVerified && (
                  <div className="p-2.5 rounded-xl bg-[#C8D6AE] border-2 border-[#36241E] text-xs font-mono text-[#263311] flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#5B6838]" />
                    <span className="font-bold">✓ Active LinkedIn Profile Verified</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: SKILLS, ROLES & INTERESTS */}
          {step === 2 && (
            <div className="p-4 sm:p-5 rounded-2xl border-2 border-[#36241E] bg-[#EFE7D8] space-y-5 shadow-[3px_3px_0px_#36241E]">
              <div className="border-b border-[#36241E]/20 pb-2">
                <h2 className="text-base font-black font-display text-[#36241E]">
                  Step 2: Technical Skills & Domain Passions
                </h2>
                <p className="text-xs font-mono text-[#543E36]">
                  Select the roles you enjoy and the technologies you write code in.
                </p>
              </div>

              {/* Preferred Roles */}
              <div>
                <label className="block text-[11px] font-black font-mono uppercase text-[#36241E] mb-1.5">
                  Preferred Roles in Hackathon Crews
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PREFERRED_ROLES.map((role) => {
                    const isSelected = preferredRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#36241E] text-[#F5EDE2] border-[#36241E] shadow-[1px_1px_0px_#231612]'
                            : 'bg-[#FAF7F2] text-[#36241E] border-[#36241E]/40 hover:border-[#36241E]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Domain Interests */}
              <div>
                <label className="block text-[11px] font-black font-mono uppercase text-[#36241E] mb-1.5">
                  Domain & Category Interests
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DOMAIN_INTERESTS.map((domain) => {
                    const isSelected = domainInterests.includes(domain);
                    return (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => toggleDomain(domain)}
                        className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#5B6838] text-[#F5EDE2] border-[#36241E] shadow-[1px_1px_0px_#36241E]'
                            : 'bg-[#FAF7F2] text-[#36241E] border-[#36241E]/40 hover:border-[#36241E]'
                        }`}
                      >
                        {isSelected ? '★ ' : ''}
                        {domain}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Skills with Levels */}
              <div>
                <label className="block text-[11px] font-black font-mono uppercase text-[#36241E] mb-1.5">
                  Your Core Technical Skills & Proficiency ({skills.length})
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {skills.length === 0 ? (
                    <p className="text-xs font-mono text-[#543E36] italic">
                      No skills added yet. Search or click suggested skills below.
                    </p>
                  ) : (
                    skills.map((s) => (
                      <div
                        key={s.name}
                        className="px-2.5 py-1 rounded-xl bg-[#FAF7F2] border-2 border-[#36241E] text-xs font-mono flex items-center gap-2 shadow-[1px_1px_0px_#36241E]"
                      >
                        <span className="font-bold text-[#36241E] flex items-center gap-1">
                          <span>{s.name}</span>
                          {s.isCustom && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-800 font-bold">
                              custom
                            </span>
                          )}
                        </span>
                        <select
                          value={s.level}
                          onChange={(e) => updateSkillLevel(s.name, e.target.value as SkillLevel)}
                          className="text-[10px] font-mono font-black uppercase bg-[#E5DBC8] border border-[#36241E] rounded-md px-1 py-0.5 text-[#36241E]"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => toggleSkill(s.name)}
                          className="text-[#9C4E1E] hover:text-red-700 font-black ml-1 text-xs cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Skill Search & Fast Add */}
                <div className="space-y-2 pt-2 border-t border-[#36241E]/20">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#543E36]" />
                    <input
                      type="text"
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && skillSearch.trim()) {
                          e.preventDefault();
                          toggleSkill(skillSearch.trim());
                          setSkillSearch('');
                        }
                      }}
                      placeholder="Search or add skill (e.g. ESP32, Arduino, C++, React)..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs font-mono font-bold bg-[#FAF7F2] border-2 border-[#36241E] rounded-xl text-[#36241E] focus:outline-hidden"
                    />
                  </div>

                  {/* Filtered skill pills based on search */}
                  {skillSearch.trim() ? (
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1.5 bg-[#FAF7F2] rounded-xl border border-[#36241E]/30">
                      {ALL_SKILLS.filter((sk) =>
                        sk.toLowerCase().includes(skillSearch.toLowerCase().trim())
                      ).map((sk) => (
                        <button
                          key={sk}
                          type="button"
                          onClick={() => {
                            toggleSkill(sk);
                            setSkillSearch('');
                          }}
                          className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-[#DFD2BE] text-[#36241E] border border-[#36241E]/40 hover:bg-[#CAD8B4] cursor-pointer"
                        >
                          + {sk}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          toggleSkill(skillSearch.trim());
                          setSkillSearch('');
                        }}
                        className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-800 cursor-pointer"
                      >
                        + Add "{skillSearch.trim()}" (custom)
                      </button>
                    </div>
                  ) : (
                    /* Categorized quick add pills */
                    <div className="space-y-2">
                      {SKILL_CATEGORIES.map((cat) => (
                        <div key={cat.name} className="space-y-1">
                          <span className="text-[10px] font-mono font-bold text-[#543E36] uppercase tracking-wider block">
                            {cat.name}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {cat.skills.map((sk) => {
                              const isAdded = skills.some(
                                (s) => s.name.toLowerCase() === sk.toLowerCase()
                              );
                              if (isAdded) return null;
                              return (
                                <button
                                  key={sk}
                                  type="button"
                                  onClick={() => toggleSkill(sk)}
                                  className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-[#DFD2BE] text-[#36241E] border border-[#36241E]/40 hover:border-[#36241E] cursor-pointer"
                                >
                                  + {sk}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: GOALS, WORK STYLE & SUBMISSION */}
          {step === 3 && (
            <div className="p-4 sm:p-5 rounded-2xl border-2 border-[#36241E] bg-[#EFE7D8] space-y-5 shadow-[3px_3px_0px_#36241E]">
              <div className="border-b border-[#36241E]/20 pb-2">
                <h2 className="text-base font-black font-display text-[#36241E]">
                  Step 3: Hackathon Goal & Work Cadence
                </h2>
                <p className="text-xs font-mono text-[#543E36]">
                  Calibrate your team chemistry vectors for AI matchmaking.
                </p>
              </div>

              {/* Goal */}
              <div>
                <label className="block text-[11px] font-black font-mono uppercase text-[#36241E] mb-1.5">
                  Hackathon Ambition / Target
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GOALS.map((g) => {
                    const isSelected = goal === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGoal(g.id)}
                        className={`p-2.5 rounded-xl border-2 text-left font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#36241E] text-[#F5EDE2] border-[#36241E] shadow-[2px_2px_0px_#231612]'
                            : 'bg-[#FAF7F2] text-[#36241E] border-[#36241E]/40'
                        }`}
                      >
                        <div className="text-xs font-black">{g.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-4 pt-2 border-t border-[#36241E]/20">
                <div>
                  <div className="flex justify-between text-xs font-mono font-bold text-[#36241E] mb-1">
                    <span>⚡ Move Fast & Break (1)</span>
                    <span className="font-black text-[#5B6838]">{fastVsPlanning} / 10</span>
                    <span>Structured Planning (10) 📐</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={fastVsPlanning}
                    onChange={(e) => setFastVsPlanning(Number(e.target.value))}
                    className="w-full accent-[#5B6838] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono font-bold text-[#36241E] mb-1">
                    <span>Solo Deep Work (1) 🎧</span>
                    <span className="font-black text-[#5B6838]">{independentVsCollaborative} / 10</span>
                    <span>Constant Pair Programming (10) 🤝</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={independentVsCollaborative}
                    onChange={(e) => setIndependentVsCollaborative(Number(e.target.value))}
                    className="w-full accent-[#5B6838] cursor-pointer"
                  />
                </div>
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#36241E]/20">
                <div>
                  <label className="block text-[10px] font-black font-mono uppercase text-[#36241E] mb-1">
                    Ideal Crew Size
                  </label>
                  <select
                    value={desiredSize}
                    onChange={(e) => setDesiredSize(Number(e.target.value))}
                    className="w-full py-1.5 px-2.5 text-xs font-mono font-bold bg-[#FAF7F2] border-2 border-[#36241E] rounded-xl text-[#36241E] focus:outline-hidden"
                  >
                    <option value={2}>Duo (2 members)</option>
                    <option value={3}>Trio (3 members)</option>
                    <option value={4}>Standard Squad (4 members)</option>
                    <option value={5}>Large Fleet (5 members)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black font-mono uppercase text-[#36241E] mb-1">
                    Modality
                  </label>
                  <select
                    value={locationPreference}
                    onChange={(e) => setLocationPreference(e.target.value as any)}
                    className="w-full py-1.5 px-2.5 text-xs font-mono font-bold bg-[#FAF7F2] border-2 border-[#36241E] rounded-xl text-[#36241E] focus:outline-hidden"
                  >
                    <option value="hybrid">Hybrid (Both)</option>
                    <option value="remote">Remote Only</option>
                    <option value="in-person">In-Person Only</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Modal Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t-2 border-dashed border-[#36241E]/30">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-xs font-mono font-black uppercase btn-retro-parchment rounded-full flex items-center gap-1.5 cursor-pointer text-[#36241E]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 text-xs font-mono font-black uppercase tracking-wider btn-retro-moss text-[#F5EDE2] rounded-full flex items-center gap-2 cursor-pointer shadow-[2px_2px_0px_#36241E] transition-all"
            >
              <span>{step === 3 ? '★ Complete Profile & Enter Website' : 'Next Step →'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
