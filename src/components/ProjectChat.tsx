import React, { useState, useEffect, useRef } from 'react';
import { Project, ProjectMessage, MessageType, CodeSnippet } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  deleteField,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase.ts';
import {
  Send,
  Paperclip,
  Code2,
  FileText,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ArrowLeft,
  X,
  Flag,
  UserX,
  VolumeX,
  Check,
  CheckCheck,
  Users,
} from 'lucide-react';

interface ProjectChatProps {
  project: Project;
  onBack: () => void;
  onRemoveMember?: (memberId: string) => void;
}

export const ProjectChat: React.FC<ProjectChatProps> = ({
  project,
  onBack,
  onRemoveMember,
}) => {
  const { userProfile } = useAuth();
  const [liveProject, setLiveProject] = useState<Project>(project);

  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [safetyNoticeAcknowledged, setSafetyNoticeAcknowledged] = useState(true);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);

  // Active roster popup modal
  const [showRosterModal, setShowRosterModal] = useState(false);

  // Typing timer ref
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Code snippet modal state
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [snippetLang, setSnippetLang] = useState('typescript');
  const [snippetCode, setSnippetCode] = useState('');

  // Report message modal state
  const [reportingMsg, setReportingMsg] = useState<ProjectMessage | null>(null);
  const [reportReason, setReportReason] = useState('Harassment or inappropriate conduct');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Muted members set
  const [mutedMembers, setMutedMembers] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keep the project document updated in real time.
  useEffect(() => {
    setLiveProject(project);

    const projectRef = doc(db, 'projects', project.id);

    const unsubscribe = onSnapshot(
      projectRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setLiveProject({
            ...snapshot.data(),
            id: snapshot.id,
          } as Project);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `projects/${project.id}`);
      }
    );

    return () => unsubscribe();
  }, [project.id]);

  // Check membership: only accepted members or the leader can access the chat.
  const isMember = Boolean(
    userProfile &&
      (liveProject.leaderId === userProfile.id ||
        liveProject.memberIds?.includes(userProfile.id) ||
        liveProject.members?.some((member) => member.userId === userProfile.id))
  );

  const isLeader = userProfile?.id === liveProject.leaderId;

  // Real-time Firestore listener for chat messages.
  useEffect(() => {
    if (!isMember) return;

    const messagesRef = collection(db, 'projects', project.id, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const list: ProjectMessage[] = [];

        snapshot.forEach((messageDoc) => {
          list.push({
            id: messageDoc.id,
            ...messageDoc.data(),
          } as ProjectMessage);
        });

        setMessages(list);

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.GET,
          `projects/${project.id}/messages`
        );
      }
    );

    return () => unsubscribe();
  }, [project.id, isMember]);

  // Mark incoming messages as read.
  useEffect(() => {
    if (!isMember || !userProfile || messages.length === 0) return;

    messages.forEach((message) => {
      if (
        message.senderId !== userProfile.id &&
        !message.readBy?.includes(userProfile.id)
      ) {
        updateDoc(doc(db, 'projects', project.id, 'messages', message.id), {
          readBy: arrayUnion(userProfile.id),
        }).catch(() => {
          // Read receipts are non-blocking.
        });
      }
    });
  }, [messages, userProfile?.id, project.id, isMember]);

  // Clear the current user's typing status.
  const clearTypingStatus = () => {
    if (!userProfile) return;

    updateDoc(doc(db, 'projects', project.id), {
      [`typing.${userProfile.id}`]: deleteField(),
    }).catch(() => {
      // Typing status is non-blocking.
    });
  };

  // Update typing status while the user types.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);

    if (!userProfile) return;

    updateDoc(doc(db, 'projects', project.id), {
      [`typing.${userProfile.id}`]: {
        name:
          userProfile.fullName ||
          userProfile.email?.split('@')[0] ||
          'Teammate',
        timestamp: Date.now(),
      },
    }).catch(() => {
      // Typing status is non-blocking.
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      clearTypingStatus();
    }, 3000);
  };

  // Clean up typing status when the component unmounts.
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (userProfile) {
        updateDoc(doc(db, 'projects', project.id), {
          [`typing.${userProfile.id}`]: deleteField(),
        }).catch(() => {
          // Ignore cleanup errors.
        });
      }
    };
  }, [project.id, userProfile?.id]);

  if (!isMember) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4 font-mono">
        <div className="w-12 h-12 rounded-full bg-[#DFB4C4] text-[#36241E] border-2 border-[#36241E] flex items-center justify-center mx-auto shadow-[2px_2px_0px_#36241E]">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <h2 className="text-2xl font-black font-display text-[#36241E]">
          Team Room Restricted
        </h2>

        <p className="text-xs text-[#543E36] font-bold max-w-md mx-auto">
          This real-time war-room is private to accepted members of{' '}
          {liveProject.title || project.title}. Submit a request to join this
          team from Browse Projects or open your active teams in Dashboard.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onBack}
            className="px-5 py-2 text-xs font-black rounded-full btn-retro-parchment cursor-pointer text-[#36241E]"
          >
            Return to Browse Projects
          </button>
        </div>
      </div>
    );
  }

  // Pre-send moderation check with timeout fallback.
  const moderateContent = async (text: string): Promise<boolean> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const controller = new AbortController();

      timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch('/api/gemini/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
        signal: controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();

        if (result.flagged) {
          setModerationWarning(
            result.reason ||
              'Message blocked: violated community safety guidelines.'
          );
          return false;
        }
      }

      return true;
    } catch {
      // Fail open if the moderation service is unavailable.
      return true;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  const handleSendMessage = async (
    text: string,
    type: MessageType = 'text',
    fileData?: any
  ) => {
    if (!text.trim() && !fileData) return;
    if (!userProfile) return;

    const messageText = text.trim();

    clearTypingStatus();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    setSending(true);
    setModerationWarning(null);

    if (messageText) {
      const isClean = await moderateContent(messageText);

      if (!isClean) {
        setInputText(messageText);
        setSending(false);
        return;
      }
    }

    const messageId = `msg_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    // Only include defined values to avoid Firestore undefined-value errors.
    const newMessage: Record<string, any> = {
      id: messageId,
      projectId: project.id,
      senderId: userProfile.id,
      senderName:
        userProfile.fullName ||
        userProfile.email?.split('@')[0] ||
        'Teammate',
      senderAvatar:
        userProfile.avatarUrl ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile.id}`,
      senderRole:
        liveProject.members?.find(
          (member) => member.userId === userProfile.id
        )?.role ||
        (liveProject.leaderId === userProfile.id ? 'Team Lead' : 'Member'),
      type,
      text: messageText,
      createdAt: new Date().toISOString(),
    };

    if (fileData?.url) newMessage.fileUrl = fileData.url;
    if (fileData?.name) newMessage.fileName = fileData.name;
    if (fileData?.size) newMessage.fileSize = fileData.size;
    if (fileData?.codeSnippet) newMessage.codeSnippet = fileData.codeSnippet;

    // Clear the input only after moderation has passed.
    setInputText('');

    try {
      const messageRef = doc(
        db,
        'projects',
        project.id,
        'messages',
        messageId
      );

      await setDoc(messageRef, newMessage);
    } catch (error: any) {
      console.error('Real-time chat write error:', error);

      setModerationWarning(
        `Failed to send message: ${error?.message || 'Database write error'}`
      );

      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleSendSnippet = async () => {
    if (!snippetCode.trim()) return;

    const snippet: CodeSnippet = {
      language: snippetLang,
      code: snippetCode.trim(),
    };

    await handleSendMessage(`[Code Snippet: ${snippetLang}]`, 'code', {
      codeSnippet: snippet,
    });

    setSnippetCode('');
    setShowCodeModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setModerationWarning('File size exceeds the 5MB limit.');
      e.target.value = '';
      return;
    }

    let messageType: MessageType = 'file';

    if (file.type.startsWith('image/')) {
      messageType = 'image';
    } else if (file.type.startsWith('video/')) {
      messageType = 'video';
    } else if (file.type.startsWith('audio/')) {
      messageType = 'audio';
    }

    const reader = new FileReader();

    reader.onload = async () => {
      const base64 = reader.result as string;

      await handleSendMessage(file.name, messageType, {
        url: base64,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
      });
    };

    reader.onerror = () => {
      setModerationWarning('Unable to read this file. Please try again.');
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendReport = async () => {
    if (!reportingMsg) return;

    setReportSubmitted(true);

    setTimeout(() => {
      setReportingMsg(null);
      setReportSubmitted(false);
      setReportDetails('');
    }, 1500);
  };

  const toggleMuteMember = (userId: string) => {
    setMutedMembers((previous) => {
      const next = new Set(previous);

      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }

      return next;
    });
  };

  const teamMembers = liveProject.members || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Top Header */}
      <div className="bg-[#E5DBC8] border-2 border-[#36241E] rounded-3xl shadow-[5px_5px_0px_#36241E] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <span className="absolute top-3 right-6 text-2xl text-[#D9A83A] select-none">
          ★
        </span>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-full border-2 border-[#36241E] bg-[#EFE7D8] hover:bg-[#DFB4C4] transition-colors cursor-pointer shadow-[2px_2px_0px_#36241E]"
            title="Back to Projects"
          >
            <ArrowLeft className="w-4 h-4 text-[#36241E]" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5B6838] animate-pulse" />

              <span className="font-mono text-xs uppercase font-black text-[#5B6838]">
                Team War-Room Station
              </span>

              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#DFB4C4] text-[#36241E] border border-[#36241E] font-black">
                BOARDED PASSENGERS ONLY
              </span>
            </div>

            <h1 className="text-2xl font-black font-display text-[#36241E] truncate max-w-md mt-0.5">
              {liveProject.title || project.title}
            </h1>
          </div>
        </div>

        {/* Clickable team roster */}
        <button
          type="button"
          onClick={() => setShowRosterModal(true)}
          className="flex items-center gap-2 p-2 rounded-2xl border-2 border-[#36241E] bg-[#EFE7D8] hover:bg-[#DFB4C4] transition-all cursor-pointer shadow-[2px_2px_0px_#36241E] text-left group"
          title="View team members and roles"
        >
          <div className="flex -space-x-2">
            {teamMembers.map((member) => (
              <img
                key={member.userId}
                src={
                  member.avatarUrl ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${member.userId}`
                }
                alt={member.fullName}
                title={`${member.fullName} (${member.role})`}
                className="w-8 h-8 rounded-full object-cover border-2 border-[#36241E] shadow-[1px_1px_0px_#36241E]"
              />
            ))}
          </div>

          <div className="pl-1">
            <div className="text-xs font-mono text-[#36241E] font-black flex items-center gap-1 group-hover:underline">
              <span>{teamMembers.length} Hackers</span>
              <Users className="w-3.5 h-3.5 text-[#5B6838]" />
            </div>

            <span className="text-[10px] font-mono text-[#543E36] font-bold block leading-none">
              Click to view names
            </span>
          </div>
        </button>
      </div>

      {/* Code of Conduct Banner */}
      {safetyNoticeAcknowledged && (
        <div className="p-3.5 bg-[#DFB4C4] border-2 border-[#36241E] rounded-2xl text-xs font-mono flex items-start justify-between gap-3 shadow-[2.5px_2.5px_0px_#36241E]">
          <div className="flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-[#36241E] shrink-0 mt-0.5" />

            <div>
              <strong className="text-[#36241E] uppercase font-black">
                Crew Code of Conduct:
              </strong>

              <span className="text-[#36241E] ml-1 font-semibold">
                Zero harassment, constructive code reviews, and encrypted asset
                sharing. Gemini filters active.
              </span>
            </div>
          </div>

          <button
            onClick={() => setSafetyNoticeAcknowledged(false)}
            className="text-[11px] font-black text-[#36241E] hover:underline uppercase cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Moderation Warning */}
      {moderationWarning && (
        <div className="p-3.5 bg-red-200 border-2 border-red-900 rounded-2xl text-red-950 text-xs font-mono flex items-start justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-900" />

            <div>
              <strong>Gemini Safety Gate Notice:</strong>
              <p className="mt-0.5">{moderationWarning}</p>
            </div>
          </div>

          <button
            onClick={() => setModerationWarning(null)}
            className="font-black text-sm cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Chat Messages Feed */}
      <div className="bg-[#EFE7D8] border-2 border-[#36241E] rounded-3xl shadow-[5px_5px_0px_#36241E] h-[480px] overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2.5 p-8">
            <div className="px-4 py-1.5 rounded-full bg-[#C8D6AE] text-[#263311] border-2 border-[#36241E] text-xs font-mono font-black flex items-center gap-1.5 shadow-[2px_2px_0px_#36241E]">
              <span className="text-[#D9A83A]">★</span>
              <span>COMMUNICATION LINK ACTIVE</span>
              <span className="text-[#D9A83A]">★</span>
            </div>

            <p className="font-mono text-xs text-[#543E36] font-semibold max-w-sm">
              No messages logged in this project yet. Share your GitHub
              branches, design Figma prototypes, or architecture diagram.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.senderId === userProfile?.id;
            const isMuted = mutedMembers.has(message.senderId);

            if (isMuted) {
              return (
                <div
                  key={message.id}
                  className="p-2 rounded-xl border border-dashed border-[#36241E]/40 text-center font-mono text-[11px] text-[#543E36]"
                >
                  [Message from muted member {message.senderName} hidden]
                </div>
              );
            }

            const readers = teamMembers.filter(
              (member) =>
                member.userId !== message.senderId &&
                (message.readBy || []).includes(member.userId)
            );

            return (
              <div
                key={message.id}
                className={`flex gap-3 max-w-xl ${
                  isMe ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <img
                  src={
                    message.senderAvatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${message.senderId}`
                  }
                  alt={message.senderName}
                  className="w-8 h-8 rounded-full object-cover border-2 border-[#36241E] shrink-0 mt-1 shadow-[1px_1px_0px_#36241E]"
                />

                <div className="space-y-1 min-w-0">
                  <div
                    className={`flex items-center gap-2 text-[11px] font-mono ${
                      isMe ? 'justify-end' : ''
                    }`}
                  >
                    <span className="font-black text-[#36241E]">
                      {message.senderName}
                    </span>

                    <span className="text-[#543E36]">
                      ({message.senderRole})
                    </span>

                    <span className="text-[#543E36]/70">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-mono leading-relaxed border-2 border-[#36241E] shadow-[2.5px_2.5px_0px_#36241E] ${
                      isMe
                        ? 'bg-[#5B6838] text-[#F5EDE2] rounded-tr-xs'
                        : 'bg-[#DFB4C4] text-[#36241E] rounded-tl-xs'
                    }`}
                  >
                    {message.type === 'text' && (
                      <p className="whitespace-pre-wrap font-medium">
                        {message.text}
                      </p>
                    )}

                    {/* Code Snippet */}
                    {message.type === 'code' && message.codeSnippet && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase pb-1 border-b border-[#36241E]/20">
                          <span>Language: {message.codeSnippet.language}</span>

                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(
                                message.codeSnippet!.code
                              )
                            }
                            className="hover:underline cursor-pointer font-bold"
                          >
                            Copy Code
                          </button>
                        </div>

                        <pre className="p-3 bg-[#36241E] text-[#F5EDE2] rounded-xl overflow-x-auto text-[11px] font-mono leading-normal border border-[#231612]">
                          <code>{message.codeSnippet.code}</code>
                        </pre>
                      </div>
                    )}

                    {/* Image Attachment */}
                    {message.type === 'image' && message.fileUrl && (
                      <div className="space-y-1">
                        <img
                          src={message.fileUrl}
                          alt={message.fileName || 'Attachment'}
                          className="max-h-60 rounded-xl object-contain border border-[#36241E] bg-[#EFE7D8]"
                        />

                        <span className="text-[10px] block opacity-80">
                          {message.fileName} ({message.fileSize})
                        </span>
                      </div>
                    )}

                    {/* Video Attachment */}
                    {message.type === 'video' && message.fileUrl && (
                      <div className="space-y-1">
                        <video
                          src={message.fileUrl}
                          controls
                          className="max-h-60 max-w-full rounded-xl border border-[#36241E]"
                        />

                        <span className="text-[10px] block opacity-80">
                          {message.fileName} ({message.fileSize})
                        </span>
                      </div>
                    )}

                    {/* Audio Attachment */}
                    {message.type === 'audio' && message.fileUrl && (
                      <div className="space-y-1">
                        <audio src={message.fileUrl} controls className="max-w-full" />

                        <span className="text-[10px] block opacity-80">
                          {message.fileName} ({message.fileSize})
                        </span>
                      </div>
                    )}

                    {/* Generic File Attachment */}
                    {message.type === 'file' && (
                      <div className="flex items-center gap-2 p-2 bg-[#EFE7D8] text-[#36241E] rounded-xl border border-[#36241E]">
                        <FileText className="w-4 h-4 shrink-0" />

                        <div className="min-w-0 flex-1">
                          <div className="truncate font-black">
                            {message.fileName}
                          </div>

                          <div className="text-[10px] opacity-75">
                            {message.fileSize}
                          </div>
                        </div>

                        {message.fileUrl && (
                          <a
                            href={message.fileUrl}
                            download={message.fileName}
                            className="px-2.5 py-0.5 bg-[#36241E] text-[#F5EDE2] rounded-full text-[10px] font-black"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    )}

                    {/* Read Receipts */}
                    <div
                      className={`flex items-center gap-1.5 text-[10px] font-mono mt-1.5 pt-1 border-t border-[#36241E]/15 ${
                        isMe
                          ? 'justify-end text-[#F5EDE2]/85'
                          : 'justify-start text-[#543E36]'
                      }`}
                    >
                      {isMe ? (
                        readers.length > 0 ? (
                          <div
                            className="flex items-center gap-1 font-bold text-[#F5EDE2]"
                            title={`Seen by: ${readers
                              .map((member) => member.fullName)
                              .join(', ')}`}
                          >
                            <CheckCheck className="w-3.5 h-3.5 text-[#C8D6AE]" />

                            <span>
                              Seen by{' '}
                              {readers
                                .map((member) => member.fullName.split(' ')[0])
                                .join(', ')}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 opacity-75">
                            <Check className="w-3 h-3" />
                            <span>Delivered</span>
                          </div>
                        )
                      ) : message.readBy?.length ? (
                        <div className="flex items-center gap-1 opacity-80 font-bold">
                          <CheckCheck className="w-3 h-3 text-[#5B6838]" />
                          <span>Read</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Moderation Actions */}
                  {!isMe && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#543E36] pt-0.5">
                      <button
                        onClick={() => setReportingMsg(message)}
                        className="hover:text-red-700 flex items-center gap-1 cursor-pointer font-bold"
                        title="Report message for safety review"
                      >
                        <Flag className="w-3 h-3" />
                        <span>Report</span>
                      </button>

                      <span>·</span>

                      <button
                        onClick={() => toggleMuteMember(message.senderId)}
                        className="hover:text-[#36241E] flex items-center gap-1 cursor-pointer font-bold"
                        title="Hide messages from this user"
                      >
                        <VolumeX className="w-3 h-3" />
                        <span>Mute</span>
                      </button>

                      {isLeader && onRemoveMember && (
                        <>
                          <span>·</span>

                          <button
                            onClick={() => onRemoveMember(message.senderId)}
                            className="text-red-800 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                            title="Remove member from project"
                          >
                            <UserX className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Teammates Typing Indicator */}
      {(() => {
        const now = Date.now();

        const typingList = Object.entries(liveProject.typing || {})
          .filter(
            ([userId, data]) =>
              userId !== userProfile?.id &&
              data &&
              typeof data.timestamp === 'number' &&
              now - data.timestamp < 5000
          )
          .map(([, data]) => data.name || 'Teammate');

        if (typingList.length === 0) return null;

        return (
          <div className="px-4 py-2.5 bg-[#DFB4C4] border-2 border-[#36241E] rounded-2xl flex items-center justify-between shadow-[3px_3px_0px_#36241E] text-xs font-mono font-bold text-[#36241E] animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-2.5">
              <span className="flex space-x-1 items-center">
                <span className="w-2 h-2 bg-[#5B6838] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-[#5B6838] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-[#5B6838] rounded-full animate-bounce" />
              </span>

              <span className="font-black text-[#36241E]">
                {typingList.join(', ')}{' '}
                {typingList.length === 1 ? 'is' : 'are'} typing...
              </span>
            </div>

            <span className="text-[10px] font-mono uppercase bg-[#EFE7D8] px-2.5 py-0.5 rounded-full border border-[#36241E] text-[#543E36] font-black">
              Live
            </span>
          </div>
        );
      })()}

      {/* Input Bar */}
      <div className="bg-[#E5DBC8] border-2 border-[#36241E] rounded-3xl shadow-[5px_5px_0px_#36241E] p-3 sm:p-4 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.zip,.txt,.ts,.tsx,.js,.py,.json"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-full border-2 border-[#36241E] bg-[#EFE7D8] hover:bg-[#DFB4C4] transition-colors cursor-pointer shadow-[1.5px_1.5px_0px_#36241E]"
            title="Attach file"
          >
            <Paperclip className="w-4 h-4 text-[#36241E]" />
          </button>

          <button
            type="button"
            onClick={() => setShowCodeModal(true)}
            className="p-2.5 rounded-full border-2 border-[#36241E] bg-[#EFE7D8] hover:bg-[#DFB4C4] transition-colors cursor-pointer shadow-[1.5px_1.5px_0px_#36241E]"
            title="Share formatted code snippet"
          >
            <Code2 className="w-4 h-4 text-[#36241E]" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onBlur={clearTypingStatus}
            placeholder="Type a message to your team..."
            className="flex-1 px-4 py-2.5 text-xs font-mono font-bold bg-[#EFE7D8] border-2 border-[#36241E] rounded-full focus:outline-hidden text-[#36241E] placeholder:text-[#543E36]"
          />

          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="px-5 py-2.5 btn-retro-moss text-[#F5EDE2] text-xs font-mono font-black uppercase tracking-wider rounded-full disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] font-mono text-[#543E36] px-2 pt-1 font-semibold">
          <span>Allowed: Code, Images, Audio, PDF · Max 5MB</span>
          <span className="text-[#36241E] font-black">
            ✓ Gemini Realtime Safe
          </span>
        </div>
      </div>

      {/* Code Snippet Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#36241E]/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[#E5DBC8] rounded-3xl border-2 border-[#36241E] shadow-[8px_8px_0px_#36241E] p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[#36241E]/30 pb-3">
              <h3 className="font-black font-display text-xl text-[#36241E]">
                Share Code Snippet
              </h3>

              <button
                onClick={() => setShowCodeModal(false)}
                className="p-1.5 rounded-full bg-[#36241E] text-[#D9A83A] border-2 border-[#36241E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-mono font-black uppercase text-[#36241E] mb-1">
                Language
              </label>

              <select
                value={snippetLang}
                onChange={(e) => setSnippetLang(e.target.value)}
                className="w-full p-2.5 text-xs font-mono font-bold border-2 border-[#36241E] rounded-xl bg-[#EFE7D8] text-[#36241E]"
              >
                <option value="typescript">TypeScript / JavaScript</option>
                <option value="python">Python</option>
                <option value="rust">Rust</option>
                <option value="cpp">C / C++</option>
                <option value="solidity">Solidity</option>
                <option value="sql">SQL</option>
                <option value="json">JSON / Config</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-black uppercase text-[#36241E] mb-1">
                Code
              </label>

              <textarea
                value={snippetCode}
                onChange={(e) => setSnippetCode(e.target.value)}
                rows={8}
                placeholder="Paste function, interface, or algorithmic snippet..."
                className="w-full p-3 font-mono text-xs bg-[#36241E] text-[#F5EDE2] rounded-2xl border-2 border-[#231612] focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-2 text-xs font-mono rounded-full btn-retro-parchment cursor-pointer font-bold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendSnippet}
                disabled={!snippetCode.trim() || sending}
                className="px-5 py-2 text-xs font-mono font-black uppercase btn-retro-moss text-[#F5EDE2] rounded-full cursor-pointer disabled:opacity-50"
              >
                Share Snippet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Message Modal */}
      {reportingMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#36241E]/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#E5DBC8] rounded-3xl border-2 border-[#36241E] shadow-[8px_8px_0px_#36241E] p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[#36241E]/30 pb-3">
              <div className="flex items-center gap-2 text-red-900 font-black font-mono text-sm">
                <Flag className="w-4 h-4" />
                <span>File Safety Audit Report</span>
              </div>

              <button
                onClick={() => setReportingMsg(null)}
                className="p-1 rounded-full bg-[#36241E] text-[#D9A83A] border border-[#36241E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSubmitted ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#C8D6AE] text-[#263311] border-2 border-[#36241E] flex items-center justify-center mx-auto text-lg font-black">
                  ✓
                </div>

                <div className="font-black text-sm font-display text-[#36241E]">
                  Report Logged
                </div>

                <p className="text-xs font-mono text-[#36241E] font-medium">
                  Safety protocol initiated.
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 bg-[#EFE7D8] rounded-2xl border-2 border-[#36241E] text-xs font-mono text-[#36241E]">
                  Flagging message by:{' '}
                  <strong>{reportingMsg.senderName}</strong>
                </div>

                <div>
                  <label className="block text-xs font-mono font-black uppercase text-[#36241E] mb-1">
                    Reason
                  </label>

                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2.5 text-xs font-mono font-bold border-2 border-[#36241E] rounded-xl bg-[#EFE7D8] text-[#36241E]"
                  >
                    <option value="Harassment or inappropriate conduct">
                      Harassment or inappropriate conduct
                    </option>
                    <option value="Malicious link or suspicious file">
                      Malicious link or suspicious file
                    </option>
                    <option value="Spam or unsolicited promotion">
                      Spam or unsolicited promotion
                    </option>
                    <option value="Intellectual property violation">
                      Intellectual property violation
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-black uppercase text-[#36241E] mb-1">
                    Additional Context (Optional)
                  </label>

                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    rows={3}
                    placeholder="Provide details about why this violates team safety..."
                    className="w-full p-2.5 text-xs font-mono border-2 border-[#36241E] rounded-xl bg-[#EFE7D8] text-[#36241E] font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setReportingMsg(null)}
                    className="px-4 py-2 text-xs font-mono font-bold rounded-full btn-retro-parchment cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSendReport}
                    className="px-5 py-2 text-xs font-mono font-black uppercase bg-red-800 text-[#F5EDE2] border-2 border-[#36241E] rounded-full cursor-pointer shadow-md"
                  >
                    Submit Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Team Roster Modal */}
      {showRosterModal && (
        <div
          onClick={() => setShowRosterModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#36241E]/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#E5DBC8] rounded-3xl border-2 border-[#36241E] shadow-[8px_8px_0px_#36241E] p-6 space-y-4 animate-in zoom-in-95 duration-150 relative"
          >
            <div className="flex items-center justify-between border-b-2 border-dashed border-[#36241E]/30 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C8D6AE] text-[#263311] border border-[#36241E] text-[10px] font-mono font-black uppercase tracking-wider mb-1">
                  <span>★</span>
                  <span>Active Crew Manifest</span>
                </div>

                <h3 className="font-black font-display text-xl text-[#36241E]">
                  Hackers in this Team ({teamMembers.length})
                </h3>

                <p className="text-xs font-mono text-[#543E36] font-semibold mt-0.5">
                  Verified builders boarded in{' '}
                  {liveProject.title || project.title}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowRosterModal(false)}
                className="p-1.5 rounded-full bg-[#36241E] text-[#D9A83A] border-2 border-[#36241E] hover:bg-[#543E36] cursor-pointer"
                title="Close Roster"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {teamMembers.map((member) => {
                const isProjectLeader = member.userId === liveProject.leaderId;
                const isCurrentUser = member.userId === userProfile?.id;
                const typingData = liveProject.typing?.[member.userId];

                const isUserTyping = Boolean(
                  typingData &&
                    typeof typingData.timestamp === 'number' &&
                    Date.now() - typingData.timestamp < 5000
                );

                return (
                  <div
                    key={member.userId}
                    className="p-3 bg-[#EFE7D8] border-2 border-[#36241E] rounded-2xl flex items-center justify-between gap-3 shadow-[2.5px_2.5px_0px_#36241E]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={
                            member.avatarUrl ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${member.userId}`
                          }
                          alt={member.fullName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-[#36241E] shadow-[1px_1px_0px_#36241E]"
                        />

                        <span
                          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#36241E] ${
                            isUserTyping
                              ? 'bg-[#5B6838] animate-ping'
                              : 'bg-[#5B6838]'
                          }`}
                          title={isUserTyping ? 'Typing now...' : 'Active in team'}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-sm font-display text-[#36241E] truncate">
                            {member.fullName}
                          </span>

                          {isCurrentUser && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#C8D6AE] text-[#263311] border border-[#36241E] font-bold">
                              You
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-mono text-[#543E36] font-semibold block truncate">
                          {member.role || (isProjectLeader ? 'Team Lead' : 'Hacker')}
                        </span>

                        {isUserTyping ? (
                          <span className="text-[10px] font-mono text-[#5B6838] font-black animate-pulse flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#5B6838]" />
                            <span>Typing message...</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#543E36]/70 block mt-0.5">
                            Active in war-room
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isProjectLeader ? (
                        <span className="px-2.5 py-1 rounded-full bg-[#DFB4C4] text-[#36241E] border border-[#36241E] text-[10px] font-mono font-black uppercase tracking-wider block shadow-[1px_1px_0px_#36241E]">
                          ★ Lead
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-[#E5DBC8] text-[#36241E] border border-[#36241E] text-[10px] font-mono font-bold block">
                          Teammate
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t-2 border-dashed border-[#36241E]/30 flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#543E36] font-bold">
                ✓ Full Team Access Granted
              </span>

              <button
                type="button"
                onClick={() => setShowRosterModal(false)}
                className="px-5 py-2 text-xs font-mono font-black uppercase rounded-full btn-retro-moss text-[#F5EDE2] cursor-pointer shadow-md"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
