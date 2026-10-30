
import React, { useState } from 'react';
import { Project, JoinRequest } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { getProjectTheme } from '../utils/themeStyles.ts';
import {
  X,
  Send,
  MapPin,
  Calendar,
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
  onRequestSubmitted: (newRequest: JoinRequest) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onRequestSubmitted,
}) => {
  const { userProfile } = useAuth();

  const [selectedRole, setSelectedRole] = useState(
    project?.openRoles?.[0]?.role || ''
  );
  const [pitchNote, setPitchNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedStamp, setSubmittedStamp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!project) return null;

  const theme = getProjectTheme(project.colorTheme);

  // Support both legacy memberIds and the members array.
  const isAlreadyMember = Boolean(
    userProfile &&
      (
        project.leaderId === userProfile.id ||
        project.memberIds?.includes(userProfile.id) ||
        project.members?.some((member) => member.userId === userProfile.id)
      )
  );

  const handleRequestToJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userProfile) {
      setError('Please sign in to request to join this project.');
      return;
    }

    if (!selectedRole) {
      setError('Please choose a role you want to apply for.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const requestId = `req_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 7)}`;

    const joinReq: JoinRequest = {
      id: requestId,
      projectId: project.id,
      projectTitle: project.title,
      applicantId: userProfile.id,
      applicantName: userProfile.fullName,
      applicantAvatar: userProfile.avatarUrl,
      applicantRoles: userProfile.preferredRoles,
      applicantSkills: userProfile.skills.map((skill) => skill.name),
      leaderId: project.leaderId,
      roleAppliedFor: selectedRole,
      note: pitchNote.trim() || 'Excited to build this project with your crew!',
      matchScore: project.matchScore || 85,
      matchReason:
        project.matchReason || 'Strong background in project tech stack.',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'joinRequests', requestId), joinReq);

      setSubmittedStamp(true);
      onRequestSubmitted(joinReq);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit join request:', err);
      setError('Unable to submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const members = project.members || [];
  const openRoles = project.openRoles || [];
  const techStack = project.techStack || [];
  const domains =
    project.domains && project.domains.length > 0
      ? project.domains
      : [project.domain];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#36241E]/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      {/* Admit One Ticket Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: theme.cardBg }}
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl border-2 border-[#36241E] shadow-[8px_8px_0px_#36241E] overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Ticket Notch Cutouts */}
        <div className="ticket-notch-left" />
        <div className="ticket-notch-right" />

        <div className="ticket-dashed-frame m-2.5 sm:m-3.5 p-4 sm:p-5 flex flex-col flex-1 overflow-hidden relative">
          {/* Modal Header */}
          <div className="pb-3 border-b-2 border-dashed border-[#36241E]/30 flex items-start justify-between gap-3 shrink-0">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#D9A83A] text-sm">★</span>

                <div className="flex flex-wrap gap-1">
                  {domains.map((domain) => (
                    <span
                      key={domain}
                      className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full border border-[#36241E]"
                      style={{
                        backgroundColor: theme.badgeBg,
                        color: theme.badgeText,
                      }}
                    >
                      {domain}
                    </span>
                  ))}
                </div>

                <span className="text-[#36241E]/50 font-bold">/</span>

                <span className="text-[11px] font-mono text-[#36241E] uppercase font-black tracking-wide">
                  PASS {theme.ticketCode}
                </span>
              </div>

              <h2 className="text-xl font-black font-display text-[#36241E] truncate">
                {project.title}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-[#36241E] text-[#D9A83A] hover:bg-[#5B6838] transition-colors cursor-pointer shrink-0 border-2 border-[#36241E] shadow-[1.5px_1.5px_0px_#231612]"
              aria-label="Close"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-1 py-4 overflow-y-auto space-y-4 text-xs font-mono">
            {submittedStamp ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#36241E] text-[#D9A83A] border-2 border-[#36241E] flex items-center justify-center mx-auto text-2xl font-black shadow-[3px_3px_0px_#5B6838]">
                  ★
                </div>

                <h3 className="text-xl font-black font-display text-[#36241E]">
                  ADMIT ONE PASS REQUESTED!
                </h3>

                <p className="text-[#4A362F] text-xs font-bold font-mono">
                  Your application has been stamped and delivered to the flight
                  captain.
                </p>
              </div>
            ) : (
              <>
                {/* Description */}
                <div className="p-3.5 rounded-2xl bg-[#EFE7D8] border-2 border-[#36241E] text-[#36241E] leading-relaxed text-xs font-medium shadow-[2px_2px_0px_#36241E]">
                  {project.description}
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                  <div className="p-3 rounded-2xl border-2 border-[#36241E] bg-[#EFE7D8] flex items-center gap-2 shadow-[1.5px_1.5px_0px_#36241E]">
                    <Calendar className="w-4 h-4 text-[#36241E] shrink-0" />

                    <div>
                      <span className="text-[#5A453F] block text-[10px] font-bold uppercase">
                        Deadline
                      </span>
                      <span className="font-black text-[#36241E]">
                        {project.deadline
                          ? new Date(project.deadline).toLocaleDateString()
                          : 'Not specified'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl border-2 border-[#36241E] bg-[#EFE7D8] flex items-center gap-2 shadow-[1.5px_1.5px_0px_#36241E]">
                    <MapPin className="w-4 h-4 text-[#36241E] shrink-0" />

                    <div>
                      <span className="text-[#5A453F] block text-[10px] font-bold uppercase">
                        Location
                      </span>
                      <span className="font-black text-[#36241E] capitalize">
                        {project.location || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tech Stack */}
                <div>
                  <span className="text-[#36241E] uppercase text-[10px] font-black block mb-1.5">
                    TECHNICAL REQUIREMENTS:
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    {techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-0.5 rounded-lg bg-[#EFE7D8] text-[#36241E] border border-[#36241E] font-bold text-[11px] shadow-[1px_1px_0px_#36241E]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Current Team Roster */}
                <div>
                  <span className="text-[#36241E] uppercase text-[10px] font-black block mb-1.5">
                    PASSENGERS ON BOARD ({members.length}/{project.maxMembers})
                  </span>

                  <div className="space-y-1.5">
                    {members.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#EFE7D8] border border-[#36241E]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={
                              member.avatarUrl ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                member.fullName || member.userId
                              )}`
                            }
                            alt={member.fullName || 'Team member'}
                            className="w-5 h-5 rounded-full object-cover border border-[#36241E] shrink-0"
                          />

                          <span className="font-black text-[#36241E] truncate text-[11px]">
                            {member.fullName || 'Team member'}
                          </span>
                        </div>

                        <span className="text-[#36241E] text-[10px] shrink-0 font-bold">
                          {member.role} {member.isLeader && '★ (Captain)'}
                        </span>
                      </div>
                    ))}

                    {members.length === 0 && (
                      <p className="text-[#5A453F] text-[11px]">
                        No team members listed yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Apply for an Open Role */}
                {!isAlreadyMember && userProfile && (
                  <form
                    onSubmit={handleRequestToJoin}
                    className="space-y-3 pt-3 border-t-2 border-dashed border-[#36241E]/30"
                  >
                    <div>
                      <label className="block text-[#36241E] font-black mb-1 text-[11px] uppercase">
                        Select Seat Role to Claim *
                      </label>

                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full p-2 text-xs rounded-xl border-2 border-[#36241E] bg-[#EFE7D8] text-[#36241E] font-mono font-bold focus:outline-hidden"
                        required
                      >
                        <option value="" disabled>
                          Choose a role
                        </option>

                        {openRoles.map((role, index) => (
                          <option key={`${role.role}-${index}`} value={role.role}>
                            {role.role} - {role.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#36241E] font-black mb-1 text-[11px] uppercase">
                        Short Pitch Note to Captain
                      </label>

                      <textarea
                        value={pitchNote}
                        onChange={(e) => setPitchNote(e.target.value)}
                        placeholder="Hi! I'd love to join this role. I have experience with..."
                        rows={2}
                        className="w-full p-2.5 text-xs rounded-xl border-2 border-[#36241E] bg-[#EFE7D8] text-[#36241E] font-mono font-medium focus:outline-hidden"
                      />
                    </div>

                    {error && (
                      <p className="text-red-700 font-bold text-xs">{error}</p>
                    )}

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-full btn-retro-parchment cursor-pointer font-bold text-xs"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2 rounded-full btn-retro-chocolate text-[#F5EDE2] font-black disabled:opacity-50 cursor-pointer flex items-center gap-1.5 text-xs"
                      >
                        <Send className="w-3.5 h-3.5 text-[#D9A83A]" />
                        <span>
                          {submitting ? 'Applying...' : 'Claim Seat & Apply'}
                        </span>
                      </button>
                    </div>
                  </form>
                )}

                {!userProfile && (
                  <div className="p-3 rounded-2xl bg-[#EFE7D8] text-[#36241E] border-2 border-[#36241E] text-xs font-bold">
                    Please sign in to request to join this project.
                  </div>
                )}

                {isAlreadyMember && (
                  <div className="p-3 rounded-2xl bg-[#EFE7D8] text-[#36241E] border-2 border-[#36241E] text-xs font-black">
                    ★ You are already a confirmed crew passenger on this
                    flight!
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

