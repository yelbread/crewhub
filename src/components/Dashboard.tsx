import React, { useState, useEffect } from 'react';
import { Project, JoinRequest, GitHubProjectStats } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { getProjectTheme } from '../utils/themeStyles.ts';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase.ts';
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  RefreshCw,
  Github,
  Plus,
  Clock,
  ArrowRight,
  Send,
  Users,
} from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  onOpenChat: (project: Project) => void;
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onUpdateProjectRoster: (projectId: string, newMember: any, filledRole: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onOpenChat,
  onSelectProject,
  onCreateProject,
  onUpdateProjectRoster,
}) => {
  const { userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'active' | 'sent' | 'received'>('active');
  const [receivedRequests, setReceivedRequests] = useState<JoinRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<JoinRequest[]>([]);
  const [syncingGh, setSyncingGh] = useState<string | null>(null);
  const [editingRepoId, setEditingRepoId] = useState<string | null>(null);
  const [customRepoInput, setCustomRepoInput] = useState('');

  // Filter user's active projects (where user is leader OR member)
  const myProjects = projects.filter((p) => {
    if (!userProfile) return false;
    return (
      p.leaderId === userProfile.id ||
      p.memberIds?.includes(userProfile.id) ||
      p.members?.some((m) => m.userId === userProfile.id)
    );
  });

  // Real-time Firestore listeners for Pending Requests
  useEffect(() => {
    if (!userProfile) return;

    const qReceived = query(
      collection(db, 'joinRequests'),
      where('leaderId', '==', userProfile.id)
    );

    const unsubReceived = onSnapshot(
      qReceived,
      (snap) => {
        const list: JoinRequest[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as JoinRequest));
        setReceivedRequests(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'joinRequests');
      }
    );

    const qSent = query(
      collection(db, 'joinRequests'),
      where('applicantId', '==', userProfile.id)
    );

    const unsubSent = onSnapshot(
      qSent,
      (snap) => {
        const list: JoinRequest[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as JoinRequest));
        setSentRequests(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'joinRequests');
      }
    );

    return () => {
      unsubReceived();
      unsubSent();
    };
  }, [userProfile]);

  // Accept Join Request
  const handleAcceptRequest = async (request: JoinRequest) => {
    try {
      await updateDoc(doc(db, 'joinRequests', request.id), {
        status: 'accepted',
        updatedAt: new Date().toISOString(),
      });

      const newMember = {
        userId: request.applicantId,
        fullName: request.applicantName,
        avatarUrl: request.applicantAvatar,
        role: request.roleAppliedFor,
        isLeader: false,
        joinedAt: new Date().toISOString(),
      };

      onUpdateProjectRoster(request.projectId, newMember, request.roleAppliedFor);

      setReceivedRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: 'accepted' } : r))
      );
    } catch (err) {
      console.warn('Accept request fallback:', err);
    }
  };

  // Decline Join Request
  const handleDeclineRequest = async (request: JoinRequest) => {
    try {
      await updateDoc(doc(db, 'joinRequests', request.id), {
        status: 'declined',
        updatedAt: new Date().toISOString(),
      });

      setReceivedRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: 'declined' } : r))
      );
    } catch (err) {
      console.warn('Decline request fallback:', err);
    }
  };

  // Live polling of GitHub progress from real GitHub API
  const handleSyncGithub = async (project: Project, customRepoUrl?: string) => {
    const targetUrl = customRepoUrl || project.githubRepo;
    if (!targetUrl) return;

    setSyncingGh(project.id);
    try {
      const res = await fetch(`/api/sync/github?repoUrl=${encodeURIComponent(targetUrl.trim())}`);
      if (res.ok) {
        const ghData = await res.json();
        const updatedStats: GitHubProjectStats = {
          closedIssues: ghData.openIssues || 0,
          totalIssues: ghData.openIssues || 0,
          recentCommits: ghData.totalCommits || 0,
          progressPct: ghData.progressPct || 0,
          lastPushed: ghData.lastPushed || new Date().toISOString(),
          latestCommitMessage: ghData.latestCommit?.message,
          latestCommitAuthor: ghData.latestCommit?.author,
          commits: ghData.commits || [],
        };

        project.githubStats = updatedStats;
        if (customRepoUrl) {
          project.githubRepo = customRepoUrl.trim();
        }

        // Persist directly to Firestore
        await updateDoc(doc(db, 'projects', project.id), {
          githubStats: updatedStats,
          ...(customRepoUrl ? { githubRepo: customRepoUrl.trim() } : {}),
          updatedAt: new Date().toISOString(),
        });
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('GitHub sync error:', errJson.error);
      }
    } catch (e) {
      console.warn('GitHub API sync request failed:', e);
    } finally {
      setTimeout(() => setSyncingGh(null), 400);
    }
  };

  const pendingReceived = receivedRequests.filter((r) => r.status === 'pending');
  const pendingSent = sentRequests.filter((r) => r.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#36241E] pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#EAEFD8] text-[#3B4823] border border-[#CAD5AF] text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
            <span className="text-[#E5B842]">✦</span>
            <span>My Team Hub</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black font-display text-[#36241E]">
            Dashboard: Projects & Teams
          </h1>
          <p className="text-xs sm:text-sm text-[#543E36] font-mono mt-1 font-semibold">
            Track your active teams, chat in real time, and monitor pending join requests.
          </p>
        </div>

        <button
          onClick={onCreateProject}
          className="px-5 py-2.5 text-xs font-mono font-black btn-retro-moss rounded-full flex items-center gap-1.5 cursor-pointer shrink-0 shadow-[2px_2px_0px_#36241E]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Post a Project</span>
        </button>
      </div>

      {/* Segmented Tab Bar (Active Teams | Sent Requests | Incoming Requests) */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-[#36241E]/20 pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-3.5 sm:px-4 py-2 text-xs font-mono font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'active'
              ? 'bg-[#36241E] text-[#F5EDE2] shadow-[2px_2px_0px_#231612]'
              : 'bg-[#E5DBC8] text-[#36241E] border-2 border-[#36241E] hover:bg-[#DFB4C4]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Active Teams ({myProjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sent')}
          className={`px-3.5 sm:px-4 py-2 text-xs font-mono font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'sent'
              ? 'bg-[#36241E] text-[#F5EDE2] shadow-[2px_2px_0px_#231612]'
              : 'bg-[#E5DBC8] text-[#36241E] border-2 border-[#36241E] hover:bg-[#DFB4C4]'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>My Applications ({sentRequests.length})</span>
          {pendingSent.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-[#9C4E1E] animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('received')}
          className={`px-3.5 sm:px-4 py-2 text-xs font-mono font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'received'
              ? 'bg-[#36241E] text-[#F5EDE2] shadow-[2px_2px_0px_#231612]'
              : 'bg-[#E5DBC8] text-[#36241E] border-2 border-[#36241E] hover:bg-[#DFB4C4]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Incoming Requests</span>
          {pendingReceived.length > 0 && (
            <span className="px-1.5 py-0.2 bg-[#5B6838] text-[#F5EDE2] rounded-full text-[10px] font-black">
              {pendingReceived.length} new
            </span>
          )}
        </button>
      </div>

      {/* 1. ACTIVE PROJECTS */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {myProjects.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-3xl border-2 border-dashed border-[#36241E] text-center space-y-4 bg-[#E5DBC8]">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#DFB4C4] border-2 border-[#36241E] flex items-center justify-center text-xl text-[#36241E]">
                ★
              </div>
              <h2 className="text-xl font-black font-display text-[#36241E]">
                You have no active projects yet
              </h2>
              <p className="text-xs sm:text-sm font-mono text-[#543E36] max-w-md mx-auto font-medium">
                Browse projects to apply for a role, or issue your own project ticket to build a team.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={onCreateProject}
                  className="px-5 py-2.5 text-xs font-mono font-black btn-retro-moss rounded-full text-[#F5EDE2] cursor-pointer shadow-[2px_2px_0px_#36241E]"
                >
                  Create Project
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {myProjects.map((project, idx) => {
                const isLeader = project.leaderId === userProfile?.id;
                const stats = project.githubStats;
                const theme = getProjectTheme(project.colorTheme, idx);

                return (
                  <div
                    key={project.id}
                    style={{ backgroundColor: theme.cardBg }}
                    className="rounded-3xl border-2 border-[#36241E] shadow-[5px_5px_0px_#36241E] p-4 sm:p-6 space-y-4 sm:space-y-5 relative overflow-hidden"
                  >
                    <div className="ticket-dashed-frame p-3 sm:p-4 space-y-4">
                      {/* Top Header Row with prominent Chat Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-dashed border-[#36241E]/30 pb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <div className="flex flex-wrap gap-1">
                              {(project.domains && project.domains.length > 0
                                ? project.domains
                                : [project.domain]
                              ).map((d) => (
                                <span
                                  key={d}
                                  className="font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase border border-[#36241E]"
                                  style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                                >
                                  {d}
                                </span>
                              ))}
                            </div>
                            <span className="text-[#36241E]/40 font-black">/</span>
                            {isLeader ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#36241E] text-[#D9A83A] font-black text-[10px]">
                                ★ PROJECT CAPTAIN
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#EFE7D8] text-[#36241E] border border-[#36241E] font-black text-[10px]">
                                ★ PASSENGER CREW
                              </span>
                            )}
                          </div>
                          <h2 className="text-xl sm:text-2xl font-black font-display text-[#36241E]">
                            {project.title}
                          </h2>
                        </div>

                        {/* HIGH VISIBILITY REAL-TIME CHAT BUTTON */}
                        <button
                          onClick={() => onOpenChat(project)}
                          className="px-5 py-2.5 rounded-full btn-retro-chocolate font-mono text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_#231612]"
                        >
                          <MessageSquare className="w-4 h-4 text-[#D9A83A]" />
                          <span>Open Real-Time Chat</span>
                        </button>
                      </div>

                      {/* LIVE GITHUB PROGRESS TRACKING */}
                      {project.githubRepo ? (
                        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#EFE7D8] border-2 border-[#36241E] space-y-2.5 shadow-[2px_2px_0px_#36241E]">
                          <div className="flex items-center justify-between text-xs font-mono font-bold">
                            <div className="flex items-center gap-2 text-[#36241E]">
                              <Github className="w-4 h-4 text-[#36241E]" />
                              <span className="font-black">
                                GitHub Progress: {stats ? `${stats.progressPct}%` : 'Pending sync'}
                              </span>
                            </div>
                            <button
                              onClick={() => handleSyncGithub(project)}
                              disabled={syncingGh === project.id}
                              className="text-[11px] text-[#36241E] hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer"
                            >
                              <RefreshCw
                                className={`w-3 h-3 ${syncingGh === project.id ? 'animate-spin text-[#5B6838]' : ''}`}
                              />
                              <span>{syncingGh === project.id ? 'Syncing...' : 'Sync Live Git'}</span>
                            </button>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-3.5 rounded-full bg-[#D9CBBA] border-2 border-[#36241E] overflow-hidden p-0.5">
                            <div
                              className="h-full rounded-full transition-all duration-500 ease-out bg-[#5B6838]"
                              style={{
                                width: `${stats?.progressPct || 0}%`,
                              }}
                            />
                          </div>

                          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono font-bold text-[#4A362F] pt-0.5">
                            <span>
                              Live Commits: <strong>{stats?.recentCommits || 0}</strong>
                            </span>
                            {stats?.latestCommitMessage && (
                              <span className="truncate max-w-[260px] text-[#36241E]">
                                Latest: "{stats.latestCommitMessage}"
                              </span>
                            )}
                            <a
                              href={project.githubRepo.startsWith('http') ? project.githubRepo : `https://${project.githubRepo}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-[#5B6838] truncate max-w-[180px]"
                            >
                              View Repo ↗
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-[#EFE7D8] border-2 border-[#36241E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[1.5px_1.5px_0px_#36241E]">
                          <div className="flex items-center gap-2">
                            <Github className="w-4 h-4 text-[#36241E]" />
                            <span className="text-xs font-mono font-bold text-[#36241E]">
                              No GitHub repo connected yet.
                            </span>
                          </div>
                          {isLeader && (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <input
                                type="text"
                                placeholder="e.g. owner/repo or github link"
                                value={editingRepoId === project.id ? customRepoInput : ''}
                                onChange={(e) => {
                                  setEditingRepoId(project.id);
                                  setCustomRepoInput(e.target.value);
                                }}
                                className="px-2.5 py-1 text-xs font-mono bg-[#FAF7F2] border border-[#36241E] rounded-lg flex-1 sm:w-52 text-[#36241E]"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (customRepoInput.trim()) {
                                    handleSyncGithub(project, customRepoInput.trim());
                                    setEditingRepoId(null);
                                    setCustomRepoInput('');
                                  }
                                }}
                                className="px-3 py-1 bg-[#36241E] text-[#F5EDE2] text-xs font-mono font-bold rounded-lg cursor-pointer hover:bg-[#5B6838]"
                              >
                                Link Repo
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Team summary & Manage */}
                      <div className="flex flex-wrap items-center justify-between pt-2 border-t-2 border-dashed border-[#36241E]/20 text-xs font-mono font-bold gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1.5">
                            {project.members.map((m) => (
                              <img
                                key={m.userId}
                                src={m.avatarUrl}
                                alt={m.fullName}
                                title={`${m.fullName} (${m.role})`}
                                className="w-6 h-6 rounded-full object-cover border-2 border-[#36241E]"
                              />
                            ))}
                          </div>
                          <span className="text-[#36241E] text-[11px]">
                            {project.members.length} of {project.maxMembers} seats boarded
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectProject(project)}
                            className="px-3.5 py-1.5 rounded-full bg-[#EFE7D8] text-[#36241E] border-2 border-[#36241E] text-xs font-mono font-black uppercase hover:bg-[#DFB4C4] transition-all cursor-pointer shadow-[1px_1px_0px_#36241E]"
                          >
                            Team Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. PENDING REQUESTS SENT BY ME */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          <div className="border-b-2 border-[#36241E] pb-2">
            <h2 className="text-lg font-black font-display text-[#36241E]">
              Applications I Sent to Other Teams ({sentRequests.length})
            </h2>
            <p className="text-xs font-mono text-[#543E36] font-semibold">
              Live status updates for teams you've applied to join.
            </p>
          </div>

          {sentRequests.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-3xl border-2 border-dashed border-[#36241E] text-center font-mono text-xs text-[#543E36] font-bold bg-[#E5DBC8]">
              You haven't submitted any applications to other teams yet.
            </div>
          ) : (
            <div className="space-y-3">
              {sentRequests.map((req) => {
                const targetProject = projects.find((p) => p.id === req.projectId);
                return (
                  <div
                    key={req.id}
                    className="p-4 sm:p-5 rounded-3xl border-2 border-[#36241E] bg-[#DFB4C4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-[3px_3px_0px_#36241E]"
                  >
                    <div>
                      <div className="font-black text-base text-[#36241E]">
                        {req.projectTitle}
                      </div>
                      <div className="text-[#36241E] mt-0.5 font-bold">
                        Applied Role: <strong>{req.roleAppliedFor}</strong> · Submitted {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                      {req.note && (
                        <div className="text-[11px] text-[#4A362F] mt-1 italic">
                          "{req.note}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border-2 border-[#36241E] shadow-[1px_1px_0px_#36241E] ${
                        req.status === 'accepted'
                          ? 'bg-[#5B6838] text-[#F5EDE2]'
                          : req.status === 'declined'
                          ? 'bg-red-200 text-red-900'
                          : 'bg-[#EFE7D8] text-[#36241E]'
                      }`}>
                        {req.status === 'accepted' ? '✓ Accepted' : req.status === 'declined' ? '✕ Declined' : '⏳ Pending Review'}
                      </span>

                      {req.status === 'accepted' && targetProject && (
                        <button
                          onClick={() => onOpenChat(targetProject)}
                          className="px-3.5 py-1 text-xs font-mono font-black btn-retro-chocolate rounded-full flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#D9A83A]" />
                          <span>Open Chat</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. INCOMING REQUESTS TO MY TEAMS */}
      {activeTab === 'received' && (
        <div className="space-y-4">
          <div className="border-b-2 border-[#36241E] pb-2">
            <h2 className="text-lg font-black font-display text-[#36241E]">
              Incoming Applications to My Projects ({receivedRequests.length})
            </h2>
            <p className="text-xs font-mono text-[#543E36] font-semibold">
              Fellow builders requesting admission to teams you captain.
            </p>
          </div>

          {receivedRequests.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-3xl border-2 border-dashed border-[#36241E] text-center font-mono text-xs text-[#543E36] font-bold bg-[#E5DBC8]">
              No incoming join requests right now.
            </div>
          ) : (
            <div className="space-y-4">
              {receivedRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 sm:p-5 rounded-3xl border-2 border-[#36241E] bg-[#C8D6AE] space-y-3 shadow-[4px_4px_0px_#36241E]"
                >
                  <div className="ticket-dashed-frame p-3 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={req.applicantAvatar}
                          alt={req.applicantName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#36241E]"
                        />
                        <div>
                          <div className="font-black text-sm text-[#36241E]">
                            {req.applicantName}
                          </div>
                          <div className="text-xs font-mono text-[#36241E] font-bold">
                            Applied for: <strong className="text-[#263311] underline">{req.roleAppliedFor}</strong> on {req.projectTitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono font-bold">
                        <span className="px-3 py-0.5 rounded-full bg-[#36241E] text-[#D9A83A]">
                          ★ {req.matchScore}% Fit
                        </span>
                        <span className={`px-3 py-0.5 rounded-full uppercase font-black text-[10px] border border-[#36241E] ${
                          req.status === 'accepted'
                            ? 'bg-[#5B6838] text-[#F5EDE2]'
                            : req.status === 'declined'
                            ? 'bg-red-200 text-red-900'
                            : 'bg-[#DFB4C4] text-[#36241E]'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    </div>

                    {req.note && (
                      <div className="p-3 rounded-xl bg-[#EFE7D8] text-xs font-mono text-[#36241E] border border-[#36241E] font-medium">
                        Note: "{req.note}"
                      </div>
                    )}

                    {req.status === 'pending' && (
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <button
                          onClick={() => handleAcceptRequest(req)}
                          className="px-4 py-2 rounded-full btn-retro-moss text-[#F5EDE2] font-mono font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#36241E]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Admit to Crew</span>
                        </button>

                        <button
                          onClick={() => handleDeclineRequest(req)}
                          className="px-4 py-2 rounded-full btn-retro-mauve font-mono font-bold text-xs cursor-pointer shadow-[2px_2px_0px_#36241E]"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
