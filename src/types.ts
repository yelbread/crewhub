
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserSkill {
  name: string;
  level: SkillLevel;
  isCustom?: boolean;
  githubEvidence?: string;
}

export interface WorkStyle {
  fastVsPlanning: number; // 1 (Fast prototyping) to 10 (Deep planning)
  independentVsCollaborative: number; // 1 (Solo execution) to 10 (Deeply collaborative)
  structuredVsFlexible: number; // 1 (Structured milestones) to 10 (Fluid flow)
}

export interface TeamPreferences {
  desiredSize: number; // 2 to 6
  beginnerFriendly: boolean;
  leadershipPreference: 'women-led' | 'mixed' | 'no preference';
  locationPreference: 'remote' | 'in-person' | 'hybrid';
}

export interface GitHubEvidence {
  repos: number;
  followers: number;
  topLanguages: string[];
  recentCommits: number;
  bio?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  institution: string;
  avatarUrl: string;
  githubUsername: string;
  githubVerified: boolean;
  githubEvidence?: GitHubEvidence;
  linkedinUrl: string;
  linkedinVerified: boolean;
  skills: UserSkill[];
  preferredRoles: string[];
  domainInterests: string[];
  goal: string;
  workStyle: WorkStyle;
  teamPreferences: TeamPreferences;
  completedProfile: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  userId: string;
  fullName: string;
  avatarUrl: string;
  role: string;
  isLeader: boolean;
  joinedAt?: string;
}

export interface OpenRole {
  role: string;
  description: string;
  filled: boolean;
  filledBy?: string;
}

export interface GitHubProjectCommit {
  sha: string;
  message: string;
  author: string;
  authorAvatar?: string;
  date: string;
}

export interface GitHubProjectStats {
  closedIssues: number;
  totalIssues: number;
  recentCommits: number;
  progressPct: number;
  lastPushed?: string;
  latestCommitMessage?: string;
  latestCommitAuthor?: string;
  commits?: GitHubProjectCommit[];
}

export type ProjectColorTheme =
  | 'moss'
  | 'mauve'
  | 'espresso'
  | 'caramel'
  | 'periwinkle'
  | 'plum'
  | 'violet'
  | 'emerald'
  | 'amber'
  | 'cyan'
  | 'rose'
  | 'indigo'
  | 'coral';

export interface MatchDetails {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  bestFitRole: string | null;
  matchReason: string;
  skillsScore?: number;
  roleScore?: number;
  domainScore?: number;
  fitScore?: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  domain: string;
  domains?: string[];
  type: 'hardware' | 'software' | 'hybrid';
  techStack: string[];
  githubRepo: string;
  githubStats?: GitHubProjectStats;
  deadline: string; // ISO date
  leaderId: string;
  leaderName: string;
  leaderAvatar: string;
  maxMembers: number;
  memberIds: string[];
  members: ProjectMember[];
  openRoles: OpenRole[];
  skillLevelRequired: 'beginner' | 'intermediate' | 'advanced' | 'any';
  location: 'remote' | 'in-person' | 'hybrid';
  colorTheme?: ProjectColorTheme;
  createdAt: string;
  updatedAt: string;

  // Real-time typing status map: userId -> { name, timestamp }
  typing?: Record<string, { name: string; timestamp: number }>;

  // Computed client-side / cached per user
  matchScore?: number;
  matchReason?: string;
  matchDetails?: MatchDetails;
}

export interface JoinRequest {
  id: string;
  projectId: string;
  projectTitle: string;
  applicantId: string;
  applicantName: string;
  applicantAvatar: string;
  applicantRoles: string[];
  applicantSkills: string[];
  leaderId: string;
  roleAppliedFor: string;
  note: string;
  matchScore: number;
  matchReason: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'code'
  | 'file';

export interface CodeSnippet {
  language: string;
  code: string;
}

export interface ProjectMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole?: string;
  text: string;
  type: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  codeSnippet?: CodeSnippet;
  flagged?: boolean;
  readBy?: string[];
  createdAt: string;
}

export interface ChatReport {
  id: string;
  projectId: string;
  messageId: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  details: string;
  createdAt: string;
}
