import React, { useState, useRef, useEffect } from 'react';
import { Project, OpenRole, ProjectColorTheme, GitHubProjectStats } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  FIXED_DOMAINS,
  FIXED_ROLES,
  CANONICAL_SKILLS,
  DOMAIN_SUGGESTED_SKILLS,
  resolveSkill,
} from '../data/taxonomy.ts';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';
import { X, Trash2, Plus, Sparkles, Check } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

const THEME_OPTIONS: { id: ProjectColorTheme; label: string; color: string }[] = [
  { id: 'moss', label: 'Olive Moss', color: '#5B6838' },
  { id: 'mauve', label: 'Dusty Mauve', color: '#CFA4B5' },
  { id: 'coral', label: 'Coral Flame', color: '#F3BBA8' },
  { id: 'espresso', label: 'Roasted Chocolate', color: '#36241E' },
  { id: 'amber', label: 'Vintage Buttercream', color: '#EEDAA2' },
  { id: 'periwinkle', label: 'Misty Blue Fog', color: '#BDD1DF' },
  { id: 'plum', label: 'Blackberry Plum', color: '#D8BCD0' },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const { userProfile } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // 1. Domains: Multi-select from FIXED_DOMAINS with NO default value
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [type, setType] = useState<'software' | 'hardware' | 'hybrid'>('software');
  const [colorTheme, setColorTheme] = useState<ProjectColorTheme>('moss');

  // Tech stack faster input & autocomplete
  const [techStackInput, setTechStackInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsBoxRef = useRef<HTMLDivElement>(null);

  const [githubRepo, setGithubRepo] = useState('');
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [maxMembers, setMaxMembers] = useState(4);
  const [skillLevelRequired, setSkillLevelRequired] = useState<
    'beginner' | 'intermediate' | 'advanced' | 'any'
  >('intermediate');
  const [location, setLocation] = useState<'remote' | 'in-person' | 'hybrid'>('hybrid');

  // 3. Predefined roles: pick from FIXED_ROLES dropdown
  const [openRoles, setOpenRoles] = useState<OpenRole[]>([]);
  const [selectedRoleDropdown, setSelectedRoleDropdown] = useState<string>(FIXED_ROLES[0]);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [roleDescription, setRoleDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close suggestions if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsBoxRef.current &&
        !suggestionsBoxRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Toggle domain in multi-select
  const toggleDomain = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      setSelectedDomains(selectedDomains.filter((d) => d !== domain));
    } else {
      setSelectedDomains([...selectedDomains, domain]);
    }
  };

  // Add a single tech tag (resolves aliases or marks custom)
  const handleAddTechTag = (rawTag: string) => {
    const trimmed = rawTag.trim().replace(/^,+|,+$/g, '');
    if (!trimmed) return;

    const resolved = resolveSkill(trimmed);
    const tagName = resolved.isCustom ? `${resolved.canonicalName} (custom)` : resolved.canonicalName;

    if (!techStack.some((t) => t.toLowerCase() === tagName.toLowerCase())) {
      setTechStack((prev) => [...prev, tagName]);
    }
    setTechStackInput('');
    setShowSuggestions(false);
  };

  // Add multiple tech tags (from comma-separated paste or multiple inputs)
  const handleAddMultipleTags = (rawInput: string) => {
    const parts = rawInput
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return;

    setTechStack((prev) => {
      const next = [...prev];
      parts.forEach((part) => {
        const resolved = resolveSkill(part);
        const tagName = resolved.isCustom ? `${resolved.canonicalName} (custom)` : resolved.canonicalName;
        if (!next.some((t) => t.toLowerCase() === tagName.toLowerCase())) {
          next.push(tagName);
        }
      });
      return next;
    });
    setTechStackInput('');
    setShowSuggestions(false);
  };

  const handleRemoveTech = (t: string) => {
    setTechStack(techStack.filter((item) => item !== t));
  };

  // Autocomplete matching skills
  const autocompleteSkills = techStackInput.trim()
    ? CANONICAL_SKILLS.filter((s) => {
        const q = techStackInput.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesAlias = s.aliases.some((a) => a.toLowerCase().includes(q));
        const notAlreadyAdded = !techStack.some((t) => t.toLowerCase() === s.name.toLowerCase());
        return (matchesName || matchesAlias) && notAlreadyAdded;
      }).slice(0, 8)
    : [];

  // One-click suggested skill chips from selected domains
  const suggestedDomainSkills: string[] = Array.from(
    new Set(
      selectedDomains.flatMap((dom) => DOMAIN_SUGGESTED_SKILLS[dom] || [])
    )
  ).filter((skill) => !techStack.some((t) => t.toLowerCase().startsWith(skill.toLowerCase())));

  // Add Open Role from predefined dropdown
  const handleAddRoleFromDropdown = () => {
    const roleToAdd =
      selectedRoleDropdown === 'Other' && customRoleInput.trim()
        ? customRoleInput.trim()
        : selectedRoleDropdown;

    if (!roleToAdd) return;

    setOpenRoles([
      ...openRoles,
      {
        role: roleToAdd,
        description:
          roleDescription.trim() || 'Collaborate on core project features and team milestones.',
        filled: false,
      },
    ]);
    setCustomRoleInput('');
    setRoleDescription('');
  };

  const handleRemoveRole = (idx: number) => {
    setOpenRoles(openRoles.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }
    if (selectedDomains.length === 0) {
      setError('Please select at least one domain track.');
      return;
    }
    if (openRoles.length === 0) {
      setError('Please add at least 1 open role for teammates to apply for.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + Number(deadlineDays));

    let liveGithubStats: GitHubProjectStats | undefined = undefined;

    // Pull real live GitHub repo progress if repo URL is linked
    if (githubRepo.trim()) {
      try {
        const ghRes = await fetch(`/api/sync/github?repoUrl=${encodeURIComponent(githubRepo.trim())}`);
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          liveGithubStats = {
            closedIssues: ghData.openIssues || 0,
            totalIssues: ghData.openIssues || 0,
            recentCommits: ghData.totalCommits || 0,
            progressPct: ghData.progressPct || 0,
            lastPushed: ghData.lastPushed || new Date().toISOString(),
            latestCommitMessage: ghData.latestCommit?.message,
            latestCommitAuthor: ghData.latestCommit?.author,
            commits: ghData.commits || [],
          };
        }
      } catch (err) {
        // Continue even if GitHub sync fails
      }
    }

    const primaryDomain = selectedDomains[0] || 'Other';

    const newProject: Project = {
      id: projectId,
      title: title.trim(),
      description: description.trim(),
      domain: primaryDomain,
      domains: selectedDomains,
      type,
      techStack,
      githubRepo: githubRepo.trim(),
      deadline: deadlineDate.toISOString(),
      leaderId: userProfile.id,
      leaderName: userProfile.fullName || 'Project Leader',
      leaderAvatar:
        userProfile.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile.id}`,
      maxMembers: Number(maxMembers),
      memberIds: [userProfile.id],
      members: [
        {
          userId: userProfile.id,
          fullName: userProfile.fullName || 'Project Leader',
          avatarUrl:
            userProfile.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile.id}`,
          role: userProfile.preferredRoles?.[0] || 'Project Lead',
          isLeader: true,
          joinedAt: new Date().toISOString(),
        },
      ],
      openRoles,
      skillLevelRequired,
      location,
      colorTheme,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      githubStats: liveGithubStats,
    };

    try {
      await setDoc(doc(db, 'projects', newProject.id), newProject);
    } catch (err) {
      console.warn('Direct Firestore save fallback:', err);
    }

    onProjectCreated(newProject);
    setSubmitting(false);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#36241E]/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[88vh] flex flex-col rounded-3xl border-2 border-[#36241E] bg-[#E5DBC8] shadow-[8px_8px_0px_#36241E] overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="ticket-dashed-frame m-2.5 sm:m-3.5 p-4 sm:p-5 flex flex-col flex-1 overflow-hidden relative">
          {/* Modal Header */}
          <div className="pb-3 border-b-2 border-dashed border-[#36241E]/30 flex items-start justify-between gap-3 shrink-0">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#DFB4C4] text-[#36241E] border border-[#36241E] text-[10px] font-mono font-black uppercase tracking-wider mb-1">
                <span className="text-[#D9A83A]">★</span>
                <span>Team Builder Workspace</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-[#36241E]">
                Create Your Hackathon Team
              </h2>
              <p className="text-xs font-mono text-[#543E36] font-semibold mt-0.5">
                Tell people what you're building and who you need
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-[#36241E] text-[#D9A83A] hover:bg-[#5B6838] transition-colors cursor-pointer shrink-0 border-2 border-[#36241E]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="p-1 py-3 overflow-y-auto space-y-4 text-xs font-mono">
            {error && (
              <div className="p-3 rounded-xl bg-red-200 border-2 border-red-900 text-red-950 font-bold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[#36241E] font-black uppercase text-[11px] mb-1">
                Project Name *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. EcoGrid: Autonomous Microgrid Controller"
                required
                className="w-full px-3 py-2 rounded-xl border-2 border-[#36241E] bg-[#EFE7D8] text-[#36241E] font-bold focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[#36241E] font-black uppercase text-[11px] mb-1">
                Description & Targets *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you building? Which tracks are you aiming to win?"
                rows={2}
                required
                className="w-full p-2.5 rounded-xl border-2 border-[#36241E] bg-[#EFE7D8] text-[#36241E] font-medium focus:outline-hidden"
              />
            </div>

            {/* 1. DOMAINS: Multi-select with NO default value */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[#36241E] font-black uppercase text-[11px]">
                  Domains (Multi-select) *
                </label>
                <span className="text-[10px] text-[#543E36] font-bold">
                  {selectedDomains.length} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-[#EFE7D8] border-2 border-[#36241E]">
                {FIXED_DOMAINS.map((dom) => {
                  const isSelected = selectedDomains.includes(dom);
                  return (
                    <button
                      key={dom}
                      type="button"
                      onClick={() => toggleDomain(dom)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#36241E] text-[#F5EDE2] border-[#36241E] shadow-[1px_1px_0px_#231612]'
                          : 'bg-[#FAF7F2] text-[#36241E] border-[#36241E]/40 hover:border-[#36241E]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-[#D9A83A]" />}
                      <span>{dom}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ticket Color Theme Swatches */}
            <div>
              <label className="block text-[#36241E] font-black uppercase text-[11px] mb-1.5">
                Ticket Paper Color
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {THEME_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setColorTheme(t.id)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer border-2 border-[#36241E] shadow-[1.5px_1.5px_0px_#36241E] ${
                      colorTheme === t.id
                        ? 'scale-120 ring-2 ring-offset-2 ring-[#36241E]'
                        : 'opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: t.color }}
                    title={t.label}
                  >
                    {colorTheme === t.id && (
                      <span className="text-white text-[10px] font-black">★</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Type & Format */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#36241E] font-black uppercase text-[11px] mb-1">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full p-2 rounded-xl border-2 border-[#36241E] bg-[#EFE7D8] text-[#36241E] font-bold text-xs"
                >
                  <option value="software">Software</option>
                  <option value="hardware">Hardware</option>
                  <option value="hybrid">Hardware + Software</option>
                </select>
              </div>

              <div>
                <label className="block text-[#36241E] font-black uppercase text-[11px] mb-1">
                  Format / Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value as any)}
                  className="w-full p-2 rounded-xl border-2 border-[#36241E] bg-[#EFE7D8] text-[#36241E] font-bold text-xs"
                >
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#36241E] font-black uppercase text-[11px] mb-1">
                  Team Capacity
                </label>
                <select
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border-2 border-[#36241E] bg-[#EFE7D8] text-[#36241E] font-bold text-xs"
                >
                  {[2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} builders
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#36241E] font-black uppercase text-[11px] mb-1">
                  Exp. Level
                </label>
                <select
                  value={skillLevelRequired}
                  onChange={(e) => setSkillLevelRequired(e.target.value as any)}
                  className="w-full p-2 rounded-xl border-2 border-[#36241E] bg-[#EFE7D8] text-[#36241E] font-bold text-xs"
                >
                  <option value="any">Any Skill Level</option>
                  <option value="beginner">Beginner Friendly</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* GitHub Repo */}
            <div>
              <label className="block text-[#36241E] font-black uppercase text-[11px] mb-1">
                GitHub Repository (Live Commit Tracker)
              </label>
              <input
                type="text"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="e.g. facebook/react or https://github.com/org/repo"
                className="w-full px-3 py-2 rounded-xl border-2 border-[#36241E] bg-[#EFE7D8] text-[#36241E] font-bold focus:outline-hidden"
              />
            </div>

            {/* 7. FASTER TECH-TAG INPUT */}
            <div>
              <label className="block text-[#36241E] font-black uppercase text-[11px] mb-1">
                Required Skills & Technologies
              </label>

              {/* Tags Display */}
              <div className="flex flex-wrap gap-1.5 mb-2 min-h-7">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-0.5 rounded-lg bg-[#EFE7D8] border border-[#36241E] text-[#36241E] text-[11px] font-bold flex items-center gap-1.5 shadow-[1px_1px_0px_#36241E]"
                  >
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTech(tech)}
                      className="text-[#9C4E1E] hover:text-red-700 font-black cursor-pointer text-xs"
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Fast Autocomplete Tag Input (NO Add button needed, Enter or comma adds, paste adds multiple) */}
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={techStackInput}
                  onChange={(e) => {
                    setTechStackInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddTechTag(techStackInput);
                    } else if (e.key === 'Backspace' && !techStackInput && techStack.length > 0) {
                      handleRemoveTech(techStack[techStack.length - 1]);
                    }
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text');
                    if (text.includes(',') || text.includes('\n')) {
                      e.preventDefault();
                      handleAddMultipleTags(text);
                    }
                  }}
                  placeholder="Type skill & press Enter or comma (e.g. ESP32, React, C++)..."
                  className="w-full px-3 py-2 rounded-xl border-2 border-[#36241E] bg-[#FAF7F2] text-[#36241E] font-bold focus:outline-hidden text-xs"
                />

                {/* Autocomplete Dropdown */}
                {showSuggestions && autocompleteSkills.length > 0 && (
                  <div
                    ref={suggestionsBoxRef}
                    className="absolute left-0 right-0 top-full mt-1 bg-[#FAF7F2] border-2 border-[#36241E] rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto"
                  >
                    {autocompleteSkills.map((skill) => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => handleAddTechTag(skill.name)}
                        className="w-full text-left px-3 py-1.5 hover:bg-[#E5DBC8] transition-colors flex items-center justify-between text-xs font-mono font-bold cursor-pointer border-b border-[#36241E]/10 last:border-none"
                      >
                        <span className="text-[#36241E]">{skill.name}</span>
                        <span className="text-[10px] text-[#543E36] px-1.5 py-0.5 rounded bg-[#EFE7D8] border border-[#36241E]/30">
                          {skill.category}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* One-click suggested skill chips from selected domains */}
              {suggestedDomainSkills.length > 0 && (
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#543E36] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#D9A83A]" />
                    <span>One-click suggested skills for selected domains:</span>
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {suggestedDomainSkills.slice(0, 10).map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleAddTechTag(skill)}
                        className="px-2 py-0.5 rounded-md bg-[#DFD2BE] text-[#36241E] hover:bg-[#CAD8B4] border border-[#36241E]/40 text-[10px] font-mono font-bold transition-all cursor-pointer"
                      >
                        + {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. OPEN ROLES: Predefined Dropdown list */}
            <div>
              <label className="block text-[#36241E] font-black uppercase text-[11px] mb-1">
                Open Roles ({openRoles.length})
              </label>

              {/* Roles List */}
              <div className="space-y-1.5 mb-2">
                {openRoles.map((role, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border-2 border-[#36241E] bg-[#EFE7D8] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-black text-[#36241E] block">{role.role}</span>
                      {role.description && (
                        <span className="text-[10px] text-[#543E36] line-clamp-1">
                          {role.description}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(idx)}
                      className="text-[#36241E] hover:text-red-700 p-1 cursor-pointer"
                      title="Remove Role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Role Section via Fixed Role Dropdown */}
              <div className="space-y-2 p-2.5 rounded-xl bg-[#EFE7D8] border border-[#36241E]">
                <div className="flex gap-2">
                  <select
                    value={selectedRoleDropdown}
                    onChange={(e) => setSelectedRoleDropdown(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border-2 border-[#36241E] bg-[#FAF7F2] text-[#36241E] font-bold text-xs"
                  >
                    {FIXED_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddRoleFromDropdown}
                    className="px-3.5 py-1.5 rounded-xl btn-retro-moss text-[#F5EDE2] font-black cursor-pointer text-xs shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Role</span>
                  </button>
                </div>

                {selectedRoleDropdown === 'Other' && (
                  <input
                    type="text"
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                    placeholder="Specify custom role name..."
                    className="w-full px-3 py-1.5 rounded-xl border-2 border-[#36241E] bg-[#FAF7F2] text-[#36241E] font-bold text-xs"
                  />
                )}
              </div>
            </div>

            {/* Actions: Cancel & Submit with Retro Button */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-dashed border-[#36241E]/30">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full btn-retro-parchment cursor-pointer text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 rounded-full btn-retro-moss text-[#F5EDE2] font-black disabled:opacity-50 cursor-pointer text-xs shadow-md"
              >
                {submitting ? 'Creating Team...' : 'Create Team'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
