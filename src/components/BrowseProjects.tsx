import React, { useState, useEffect } from 'react';
import { Project, MatchDetails } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { getProjectTheme } from '../utils/themeStyles.ts';
import { FIXED_DOMAINS, computeDeterministicMatch } from '../data/taxonomy.ts';
import {
  Search,
  Clock,
  ArrowRight,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Award,
} from 'lucide-react';

interface BrowseProjectsProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onRequestJoin: (project: Project, role: string) => void;
  onCreateProject: () => void;
}

export const BrowseProjects: React.FC<BrowseProjectsProps> = ({
  projects,
  onSelectProject,
  onRequestJoin,
  onCreateProject,
}) => {
  const { userProfile } = useAuth();

  // Filter and search states
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'software' | 'hardware' | 'hybrid'>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [sortByDeadline, setSortByDeadline] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Cached deterministic AI match results: projectId -> MatchDetails
  const [aiMatches, setAiMatches] = useState<Record<string, MatchDetails>>({});

  // Compute deterministic AI match in code immediately (50% skills, 25% roles, 15% domains, 10% fit)
  // LLM is used ONLY to write a 1-sentence explanation of the computed result, NEVER to produce the score!
  useEffect(() => {
    if (!userProfile) return;

    // 1. Instant deterministic calculation in code
    const initialMatches: Record<string, MatchDetails> = {};
    projects.forEach((proj) => {
      initialMatches[proj.id] = computeDeterministicMatch(userProfile, proj);
    });

    setAiMatches(initialMatches);

    // 2. Call LLM in parallel to write a 1-sentence explanation of the computed score
    const enrichTopMatches = async () => {
      const topProjects = [...projects]
        .sort((a, b) => (initialMatches[b.id]?.matchScore ?? 0) - (initialMatches[a.id]?.matchScore ?? 0))
        .slice(0, 5);

      await Promise.allSettled(
        topProjects.map(async (proj) => {
          const detMatch = initialMatches[proj.id];
          if (!detMatch) return;
          try {
            const res = await fetch('/api/gemini/match', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                computedScore: detMatch.matchScore,
                matchedSkills: detMatch.matchedSkills,
                missingSkills: detMatch.missingSkills,
                bestFitRole: detMatch.bestFitRole,
                userProfile,
                project: proj,
              }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.matchReason) {
                setAiMatches((prev) => ({
                  ...prev,
                  [proj.id]: {
                    ...prev[proj.id],
                    matchReason: data.matchReason,
                  },
                }));
              }
            }
          } catch (e) {
            // Keep deterministic fallback reason
          }
        })
      );
    };

    enrichTopMatches();
  }, [userProfile, projects]);

  // Live countdown utility
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (deadlineStr: string) => {
    const diff = Math.max(0, new Date(deadlineStr).getTime() - now);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    return `${days}d ${hours}h ${minutes}m`;
  };

  const doesRoleMatchUser = (roleName: string) => {
    if (!userProfile?.preferredRoles) return false;
    return userProfile.preferredRoles.some(
      (r) =>
        r.toLowerCase().includes(roleName.toLowerCase()) ||
        roleName.toLowerCase().includes(r.toLowerCase())
    );
  };

  // Filtered & sorted projects
  const filteredProjects = projects.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      const matchText =
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q) ||
        p.techStack.some((t) => t.toLowerCase().includes(q));
      if (!matchText) return false;
    }
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (domainFilter !== 'all') {
      const pDomains = p.domains && p.domains.length > 0 ? p.domains : [p.domain];
      if (!pDomains.some((d) => d.toLowerCase() === domainFilter.toLowerCase())) return false;
    }
    if (levelFilter !== 'all' && p.skillLevelRequired !== levelFilter && p.skillLevelRequired !== 'any')
      return false;
    if (locationFilter !== 'all' && p.location !== locationFilter) return false;
    return true;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortByDeadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    const scoreA = aiMatches[a.id]?.matchScore ?? 50;
    const scoreB = aiMatches[b.id]?.matchScore ?? 50;
    return scoreB - scoreA;
  });

  // "Suggested for you" priority row
  const suggestedProjects = [...projects]
    .filter((p) => (aiMatches[p.id]?.matchScore ?? 0) >= 65)
    .sort((a, b) => (aiMatches[b.id]?.matchScore ?? 0) - (aiMatches[a.id]?.matchScore ?? 0))
    .slice(0, 2);

  const domains = FIXED_DOMAINS;
  const activeFiltersCount =
    (typeFilter !== 'all' ? 1 : 0) +
    (domainFilter !== 'all' ? 1 : 0) +
    (levelFilter !== 'all' ? 1 : 0) +
    (locationFilter !== 'all' ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-20 md:pb-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#36241E] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#DFB4C4] text-[#36241E] border-2 border-[#36241E] text-xs font-mono font-black uppercase tracking-wider mb-2 shadow-[2px_2px_0px_#36241E]">
            <span className="text-[#D9A83A]">★</span>
            <span>Real-Time Team Directory</span>
            <span className="text-[#D9A83A]">★</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black font-display text-[#36241E] tracking-tight">
            Browse Projects
          </h1>
          <p className="text-xs sm:text-sm text-[#543E36] font-mono mt-1 font-semibold">
            Explore authentic project tickets with open seats, verified tech stacks, and real-time AI matching.
          </p>
        </div>

        <button
          onClick={onCreateProject}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-black font-mono btn-retro-moss rounded-full cursor-pointer shrink-0 shadow-[2px_2px_0px_#36241E]"
        >
          <Plus className="w-4 h-4" />
          <span>Post a Project</span>
        </button>
      </div>

      {/* CENTERPIECE FEATURE: REAL-TIME AI TALENT MATCHMAKING */}
      <div className="rounded-3xl border-2 border-[#36241E] bg-[#E3D4C4] p-5 sm:p-7 space-y-4 shadow-[6px_6px_0px_#36241E] relative overflow-hidden">
        {/* Decorative corner stars */}
        <span className="absolute top-2 right-4 text-2xl text-[#D9A83A] select-none">★</span>
        <span className="absolute bottom-2 left-4 text-xl text-[#D9A83A] select-none">★</span>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#36241E]/30 pb-3.5 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#36241E] text-[#D9A83A] border border-[#36241E] text-xs font-mono font-black uppercase tracking-wider mb-1.5 shadow-[1.5px_1.5px_0px_#5B6838]">
              <span>★</span>
              <span>CENTERPIECE: REAL-TIME AI TALENT MATCHER</span>
              <span>★</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black font-display text-[#36241E]">
              Gemini AI Hackathon Synergy Fit
            </h2>
            <p className="text-xs sm:text-sm text-[#543E36] font-mono mt-0.5 font-semibold">
              Autonomous compatibility calculation comparing verified GitHub skills, competition goals, and domain interests.
            </p>
          </div>

          {userProfile && (
            <div className="text-right shrink-0">
              <span className="text-[11px] font-mono font-bold text-[#543E36] block">
                Active Candidate:
              </span>
              <span className="text-xs font-mono font-black text-[#36241E]">
                {userProfile.fullName} ({userProfile.skills?.length || 0} Skills)
              </span>
            </div>
          )}
        </div>

        {userProfile ? (
          <div className="space-y-4 relative z-10">
            {/* User profile tags being analyzed in real-time */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono p-3 rounded-2xl bg-[#EFE7D8] border-2 border-[#36241E]">
              <span className="font-black text-[#36241E] uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#D9A83A]" />
                <span>Verified Match Vector:</span>
              </span>
              {userProfile.skills && userProfile.skills.length > 0 ? (
                userProfile.skills.slice(0, 4).map((s) => (
                  <span
                    key={s.name}
                    className="px-2 py-0.5 rounded-full bg-[#CAD8B4] text-[#263311] border border-[#36241E] font-bold text-[10px]"
                  >
                    ✓ {s.name} ({s.level})
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-[#543E36] italic">
                  No skills listed yet · Complete profile to activate precision scoring
                </span>
              )}

              {userProfile.domainInterests?.slice(0, 3).map((d) => (
                <span
                  key={d}
                  className="px-2 py-0.5 rounded-full bg-[#DFB4C4] text-[#36241E] border border-[#36241E] font-bold text-[10px]"
                >
                  ★ {d}
                </span>
              ))}
            </div>

            {/* Suggested Team Cards */}
            {suggestedProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestedProjects.map((project, idx) => {
                  const match = aiMatches[project.id];
                  const theme = getProjectTheme(project.colorTheme, idx);
                  return (
                    <div
                      key={`sugg_${project.id}`}
                      onClick={() => onSelectProject(project)}
                      style={{ backgroundColor: theme.cardBg }}
                      className="rounded-2xl border-2 border-[#36241E] p-4 sm:p-5 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden shadow-[4px_4px_0px_#36241E] group"
                    >
                      <div className="ticket-dashed-frame p-3 sm:p-3.5 relative space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap gap-1">
                            {(project.domains && project.domains.length > 0
                              ? project.domains
                              : [project.domain]
                            ).map((d) => (
                              <span
                                key={d}
                                className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full border border-[#36241E]"
                                style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                          {match && (
                            <span className="text-xs font-mono font-black text-[#36241E] flex items-center gap-1.5 bg-[#DFB4C4] px-3 py-1 rounded-full border-2 border-[#36241E] shadow-[2px_2px_0px_#36241E] shrink-0">
                              <span className="text-[#D9A83A]">★</span>
                              <span>{match.matchScore}% MATCH</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg sm:text-xl font-black font-display text-[#36241E] group-hover:underline line-clamp-1">
                          {project.title}
                        </h3>

                        {match && (
                          <div className="p-2.5 rounded-xl bg-[#EFE7D8] border-2 border-[#36241E] text-xs font-mono space-y-1.5">
                            {match.bestFitRole && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#DFB4C4] text-[#36241E] border border-[#36241E] text-[10px] font-black uppercase">
                                <Award className="w-3 h-3 text-[#36241E]" />
                                <span>Best-Fit Role: {match.bestFitRole}</span>
                              </div>
                            )}

                            {/* Matched vs Missing Skills */}
                            <div className="space-y-0.5 text-[10px]">
                              {match.matchedSkills.length > 0 && (
                                <div className="flex items-center gap-1 text-[#263311] truncate">
                                  <CheckCircle2 className="w-3 h-3 text-[#5B6838] shrink-0" />
                                  <span className="font-bold">Matched:</span>
                                  <span className="font-medium truncate">{match.matchedSkills.join(', ')}</span>
                                </div>
                              )}
                              {match.missingSkills.length > 0 && (
                                <div className="flex items-center gap-1 text-[#64392E] truncate">
                                  <AlertCircle className="w-3 h-3 text-[#9C4E1E] shrink-0" />
                                  <span className="font-bold">Missing:</span>
                                  <span className="font-medium truncate">{match.missingSkills.slice(0, 3).join(', ')}</span>
                                </div>
                              )}
                            </div>

                            <p className="text-[#36241E] text-[11px] font-semibold leading-relaxed pt-1 border-t border-[#36241E]/15 italic">
                              "{match.matchReason}"
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[#36241E]/20 text-[#36241E]">
                          <span className="font-bold">
                            Seats: {project.members.length}/{project.maxMembers} filled
                          </span>
                          <span className="font-black flex items-center gap-1 hover:underline text-[#5B6838]">
                            <span>Board Crew</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#EFE7D8] border-2 border-dashed border-[#36241E] text-center space-y-2">
                <p className="text-xs font-mono font-bold text-[#36241E]">
                  AI Talent Matcher is evaluating live project requirements.
                </p>
                <p className="text-[11px] font-mono text-[#543E36]">
                  Browse projects below to inspect compatibility scores across all teams.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#EFE7D8] border-2 border-[#36241E] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left relative z-10">
            <div>
              <h3 className="text-base font-black font-display text-[#36241E]">
                Personalized Hackathon Matchmaking
              </h3>
              <p className="text-xs font-mono text-[#543E36] mt-0.5">
                Sign in to analyze your verified skills, tech stack overlap, and team chemistry against all projects in real time.
              </p>
            </div>
            <button
              onClick={() => onSelectProject(projects[0] || ({} as any))}
              className="px-5 py-2.5 rounded-full btn-retro-moss text-[#F5EDE2] font-mono font-black text-xs uppercase tracking-wider cursor-pointer shrink-0 shadow-[2px_2px_0px_#36241E]"
            >
              Sign In to Calculate Match
            </button>
          </div>
        )}
      </div>

      {/* FILTER CONTROLS BAR (Clean & Uncluttered for Mobile) */}
      <div className="rounded-3xl border-2 border-[#36241E] bg-[#E5DBC8] p-3.5 sm:p-5 space-y-3 sm:space-y-4 shadow-[4px_4px_0px_#36241E]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#543E36]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tech stack, roles, keywords (e.g. PyTorch, React, Firmware)..."
              className="w-full pl-10 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-[#EFE7D8] border-2 border-[#36241E] focus:bg-[#FAF5EC] focus:outline-hidden text-[#36241E] placeholder:text-[#7A645D]"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="sm:hidden px-3 py-2 text-xs font-mono font-black uppercase rounded-xl border-2 border-[#36241E] bg-[#DFD2BE] text-[#36241E] flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
              {showMobileFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Segmented Type Control */}
            <div className="hidden sm:flex items-center rounded-xl border-2 border-[#36241E] bg-[#DFD2BE] p-0.5 shrink-0">
              {(['all', 'software', 'hardware', 'hybrid'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 text-xs font-mono font-black uppercase rounded-lg transition-all cursor-pointer ${
                    typeFilter === t
                      ? 'bg-[#36241E] text-[#F5EDE2] shadow-[1px_1px_0px_#231612]'
                      : 'text-[#36241E] hover:text-black'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Filters (Always visible on desktop, toggleable on mobile) */}
        <div className={`${showMobileFilters ? 'block' : 'hidden sm:block'} pt-2 border-t-2 border-dashed border-[#36241E]/20 space-y-3`}>
          {/* Mobile Type Filter */}
          <div className="sm:hidden flex items-center rounded-xl border-2 border-[#36241E] bg-[#DFD2BE] p-0.5">
            {(['all', 'software', 'hardware', 'hybrid'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`flex-1 py-1 text-[11px] font-mono font-black uppercase rounded-lg transition-all cursor-pointer ${
                  typeFilter === t
                    ? 'bg-[#36241E] text-[#F5EDE2]'
                    : 'text-[#36241E]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Domain */}
            <div>
              <label className="block text-[10px] font-mono font-black uppercase text-[#4A362F] mb-1">
                Domain
              </label>
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="w-full text-xs font-mono font-bold py-1.5 px-2 bg-[#EFE7D8] border-2 border-[#36241E] rounded-xl text-[#36241E] focus:outline-hidden"
              >
                <option value="all">All Domains</option>
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Skill Level */}
            <div>
              <label className="block text-[10px] font-mono font-black uppercase text-[#4A362F] mb-1">
                Level
              </label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full text-xs font-mono font-bold py-1.5 px-2 bg-[#EFE7D8] border-2 border-[#36241E] rounded-xl text-[#36241E] focus:outline-hidden"
              >
                <option value="all">All Skill Levels</option>
                <option value="beginner">Beginner Friendly</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced Only</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[10px] font-mono font-black uppercase text-[#4A362F] mb-1">
                Location
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full text-xs font-mono font-bold py-1.5 px-2 bg-[#EFE7D8] border-2 border-[#36241E] rounded-xl text-[#36241E] focus:outline-hidden"
              >
                <option value="all">Any Modality</option>
                <option value="remote">Remote</option>
                <option value="in-person">In-person</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {/* Sort Toggle */}
            <div>
              <label className="block text-[10px] font-mono font-black uppercase text-[#4A362F] mb-1">
                Sort Mode
              </label>
              <button
                onClick={() => setSortByDeadline(!sortByDeadline)}
                className="w-full py-1.5 px-2 text-xs font-mono font-black uppercase rounded-xl border-2 border-[#36241E] bg-[#EFE7D8] text-[#36241E] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Clock className="w-3 h-3 text-[#5B6838]" />
                <span className="truncate">{sortByDeadline ? 'By Deadline' : 'By AI Match'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RESULTS COUNT */}
      <div className="flex items-center justify-between text-xs font-mono font-bold text-[#4A362F] px-1">
        <span>
          Showing <strong>{sortedProjects.length}</strong> matching projects
        </span>
        {activeFiltersCount > 0 && (
          <button
            onClick={() => {
              setTypeFilter('all');
              setDomainFilter('all');
              setLevelFilter('all');
              setLocationFilter('all');
              setSearch('');
            }}
            className="text-[11px] underline text-[#5B6838] font-black cursor-pointer"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* RETRO PROJECT TICKET CARDS (Picture 2 Styling, NO WHITE) */}
      <div className="space-y-6">
        {sortedProjects.length === 0 ? (
          <div className="p-10 rounded-3xl border-2 border-dashed border-[#36241E] text-center space-y-3.5 bg-[#E5DBC8]">
            <p className="font-mono text-base font-black text-[#36241E]">
              {projects.length === 0
                ? 'No projects in the registry yet.'
                : 'No projects match your current filter query.'}
            </p>
            <p className="text-xs font-mono text-[#543E36] max-w-md mx-auto">
              {projects.length === 0
                ? 'Be the pioneer! Create a project ticket to recruit developers, designers, and AI specialists for your hackathon squad.'
                : 'Try resetting your search parameters or issue a new project ticket for your crew.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              {projects.length === 0 ? (
                <button
                  type="button"
                  onClick={onCreateProject}
                  className="px-6 py-2.5 text-xs font-mono font-black uppercase tracking-wider btn-retro-moss text-[#F5EDE2] rounded-full cursor-pointer shadow-md inline-flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Hackathon Project</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setTypeFilter('all');
                    setDomainFilter('all');
                    setLevelFilter('all');
                  }}
                  className="px-4 py-2 text-xs font-mono font-black btn-retro-parchment rounded-full cursor-pointer text-[#36241E]"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          sortedProjects.map((project, idx) => {
            const theme = getProjectTheme(project.colorTheme, idx);
            const match = aiMatches[project.id];
            const remainingSeats = project.maxMembers - project.members.length;
            const totalSeats = project.maxMembers;
            const filledSeats = project.members.length;

            return (
              <div
                key={project.id}
                style={{ backgroundColor: theme.cardBg }}
                className="rounded-3xl border-2 border-[#36241E] shadow-[5px_5px_0px_#36241E] hover:-translate-y-0.5 transition-all relative overflow-hidden group"
              >
                {/* Punch Cutout Notches */}
                <div className="ticket-notch-top hidden lg:block" />
                <div className="ticket-notch-bottom hidden lg:block" />
                <div className="ticket-notch-left" />
                <div className="ticket-notch-right" />

                {/* Inner Dashed Perimeter Border */}
                <div className="ticket-dashed-frame m-2 sm:m-3 p-3 sm:p-5 relative">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
                    
                    {/* Left Side: Project Main Body (8 cols) */}
                    <div className="lg:col-span-8 space-y-3.5 pr-0 lg:pr-3">
                      
                      {/* Top Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-[#36241E]/30 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[#D9A83A] text-lg font-black select-none">★</span>
                          <span className="font-display font-black text-xs sm:text-sm uppercase tracking-widest text-[#36241E]">
                            HACKATHON CREW PROJECT
                          </span>
                          <span className="text-[#D9A83A] text-lg font-black select-none">★</span>
                        </div>

                        {/* Stamped Deadline */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#36241E] text-[#F5EDE2] font-mono text-[10px] sm:text-[11px] font-bold tracking-wide">
                          <Clock className="w-3.5 h-3.5 text-[#D9A83A]" />
                          <span>EXPIRY: {formatCountdown(project.deadline)}</span>
                        </div>
                      </div>

                      {/* Main Title & Stamp */}
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono font-bold mb-1.5">
                          {/* Domains (handles multi-domains or single domain cleanly) */}
                          {(project.domains && project.domains.length > 0
                            ? project.domains
                            : [project.domain]
                          ).map((d) => (
                            <span
                              key={d}
                              className="px-2.5 py-0.5 rounded-full border border-[#36241E] text-[10px] font-black uppercase shadow-[1px_1px_0px_#36241E]"
                              style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                            >
                              {d}
                            </span>
                          ))}
                          <span className="text-[#36241E]/40 font-black">·</span>
                          {/* Fixed: Never renders duplicate HYBRID / HYBRID */}
                          <span className="text-[#36241E] text-[11px] font-bold">
                            {project.type === 'hybrid'
                              ? 'Hardware & Software'
                              : project.type === 'hardware'
                              ? 'Hardware'
                              : 'Software'}
                          </span>
                          <span className="text-[#36241E]/40 font-black">·</span>
                          <span className="text-[#36241E] text-[11px] font-bold capitalize">
                            {project.location === 'hybrid' ? 'Hybrid meetup' : project.location}
                          </span>
                        </div>

                        {/* Headline */}
                        <div className="flex items-center gap-2">
                          <h2
                            onClick={() => onSelectProject(project)}
                            className="text-lg sm:text-2xl font-black font-display text-[#36241E] hover:underline cursor-pointer tracking-tight"
                          >
                            {project.title}
                          </h2>
                        </div>

                        <p className="text-xs sm:text-sm font-mono text-[#4A362F] mt-1 leading-relaxed line-clamp-2 font-medium">
                          {project.description}
                        </p>
                      </div>

                      {/* Tech Stack Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {project.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="px-2.5 py-0.5 text-[10px] sm:text-[11px] font-mono font-bold rounded-lg border border-[#36241E] bg-[#EFE7D8]/80 text-[#36241E] shadow-[1px_1px_0px_#36241E]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>

                      {/* AI Match Fit Stamp: Centerpiece Feature prominence */}
                      {match && (
                        <div
                          className="p-3.5 rounded-2xl border-2 border-[#36241E] text-xs font-mono space-y-2 bg-[#F5EDE2] shadow-[3px_3px_0px_#36241E]"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 font-black text-[#36241E]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#D9A83A] text-sm">★</span>
                              <span className="uppercase tracking-wider text-xs">
                                Match Score: {match.matchScore}% Synergy
                              </span>
                            </div>
                            {match.bestFitRole && (
                              <span className="text-[10px] bg-[#DFB4C4] text-[#36241E] px-2.5 py-0.5 rounded-full border border-[#36241E] font-black uppercase shadow-[1px_1px_0px_#36241E]">
                                Best-Fit Role: {match.bestFitRole}
                              </span>
                            )}
                          </div>

                          {/* Matched vs Missing Skills breakdown */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-[#36241E]/15">
                            {match.matchedSkills.length > 0 ? (
                              <div className="flex items-center gap-1.5 text-[#263311]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#5B6838] shrink-0" />
                                <span>
                                  <strong>Matched:</strong> {match.matchedSkills.join(', ')}
                                </span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-[#543E36] italic">
                                No direct tech stack overlap yet
                              </div>
                            )}

                            {match.missingSkills.length > 0 && (
                              <div className="flex items-center gap-1.5 text-[#64392E]">
                                <AlertCircle className="w-3.5 h-3.5 text-[#9C4E1E] shrink-0" />
                                <span>
                                  <strong>Missing:</strong> {match.missingSkills.slice(0, 3).join(', ')}
                                </span>
                              </div>
                            )}
                          </div>

                          <p className="text-[#4A362F] text-[11px] font-semibold leading-relaxed pt-1.5 border-t border-[#36241E]/15 italic">
                            "{match.matchReason}"
                          </p>
                        </div>
                      )}

                      {/* Leader & Role summary */}
                      <div className="pt-2 border-t-2 border-dashed border-[#36241E]/30 flex flex-wrap items-center justify-between text-xs font-mono font-bold">
                        <div className="flex items-center gap-2 text-[#36241E]">
                          <span className="text-xs sm:text-sm font-black font-display tracking-wider">CREW TICKET</span>
                          <span>·</span>
                          <span className="uppercase text-[11px]">{project.openRoles[0]?.role || 'Any Role'}</span>
                        </div>
                        <div className="text-[11px] text-[#4A362F] font-semibold">
                          Captain: <strong className="text-[#36241E]">{project.leaderName}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Perforated Ticket Stub (4 cols) */}
                    <div
                      style={{ backgroundColor: theme.stubBg }}
                      className="lg:col-span-4 p-3.5 sm:p-5 border-t-2 lg:border-t-0 lg:border-l-2 border-dashed border-[#36241E] rounded-2xl flex flex-col justify-between space-y-3.5 relative"
                    >
                      {/* Vertical Rotated Serial Number Stamp */}
                      <div className="hidden lg:block absolute right-2 top-1/2 -translate-y-1/2">
                        <span className="ticket-vertical-serial text-[11px] text-[#36241E] opacity-75">
                          {theme.ticketCode}
                        </span>
                      </div>

                      <div>
                        {/* Ticket Stub Header */}
                        <div className="flex items-center justify-between mb-2.5 text-xs font-mono">
                          <span className="font-black text-[#36241E] uppercase tracking-wider flex items-center gap-1.5">
                            <Ticket className="w-3.5 h-3.5 text-[#36241E]" />
                            <span>PASS {theme.ticketCode}</span>
                          </span>
                          <span className="font-black text-[10px] px-2 py-0.5 rounded-full border border-[#36241E] bg-[#F5EDE2] text-[#36241E]">
                            {remainingSeats > 0 ? `${remainingSeats} SEAT${remainingSeats > 1 ? 'S' : ''} OPEN` : 'CREW FULL'}
                          </span>
                        </div>

                        {/* Punch Hole Seats */}
                        <div className="space-y-1 mb-2.5">
                          <div className="text-[10px] font-mono font-black uppercase text-[#4A362F]">
                            Crew Seats:
                          </div>
                          <div className="flex items-center gap-1.5">
                            {Array.from({ length: totalSeats }).map((_, i) => {
                              const isOccupied = i < filledSeats;
                              const member = isOccupied ? project.members[i] : null;
                              return (
                                <div
                                  key={i}
                                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-black transition-all border-2 border-[#36241E] shadow-[1px_1px_0px_#36241E] ${
                                    isOccupied
                                      ? 'bg-[#36241E] text-[#F5EDE2]'
                                      : 'bg-[#EFE7D8] text-[#36241E] border-dashed'
                                  }`}
                                  title={member ? `${member.fullName} (${member.role})` : 'Vacant Seat'}
                                >
                                  {isOccupied ? i + 1 : '○'}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Open Roles to fill */}
                        <div className="space-y-1">
                          <div className="text-[10px] font-mono font-black uppercase text-[#4A362F]">
                            Positions to Fill:
                          </div>
                          {project.openRoles.map((r, i) => {
                            const isMatch = doesRoleMatchUser(r.role);
                            return (
                              <div
                                key={i}
                                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono flex items-center justify-between border border-[#36241E] shadow-[1px_1px_0px_#36241E] ${
                                  isMatch
                                    ? 'bg-[#5B6838] text-[#F5EDE2] font-black'
                                    : 'bg-[#EFE7D8] text-[#36241E] font-bold'
                                }`}
                              >
                                <span className="truncate">{r.role}</span>
                                {isMatch && (
                                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-[#D9A83A] text-[#36241E] ml-1 font-black">
                                    ★ Fit
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => onSelectProject(project)}
                        className="w-full py-2.5 px-4 rounded-full font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer btn-retro-chocolate shadow-[2px_2px_0px_#231612]"
                      >
                        <span>View & Join Team</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
