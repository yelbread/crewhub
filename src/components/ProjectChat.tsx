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

  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [safetyNoticeAcknowledged, setSafetyNoticeAcknowledged] = useState(true);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);

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

  // Check membership: only accepted members or leader can read or write
  const isMember =
    userProfile &&
    (project.leaderId === userProfile.id || project.memberIds.includes(userProfile.id));

  const isLeader = userProfile?.id === project.leaderId;

  // Real-time Firestore Listener
  useEffect(() => {
    if (!isMember) return;

    const messagesRef = collection(db, 'projects', project.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ProjectMessage[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as ProjectMessage);
        });
        setMessages(list);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `projects/${project.id}/messages`);
      }
    );

    return () => unsubscribe();
  }, [project.id, isMember]);

  if (!isMember) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4 font-mono">
        <div className="w-12 h-12 rounded-full bg-[#DFB4C4] text-[#36241E] border-2 border-[#36241E] flex items-center justify-center mx-auto shadow-[2px_2px_0px_#36241E]">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black font-display text-[#36241E]">Team Room Restricted</h2>
        <p className="text-xs text-[#543E36] font-bold max-w-md mx-auto">
          This real-time war-room is private to accepted members of {project.title}.
          Submit a request to join this team from Browse Projects or open your active teams in Dashboard.
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

  // Pre-send Gemini moderation gate
  const moderateContent = async (text: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/gemini/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.flagged) {
          setModerationWarning(
            result.reason || 'Message blocked: violated community safety guidelines.'
          );
          return false;
        }
      }
      return true;
    } catch (e) {
      return true;
    }
  };

  const handleSendMessage = async (text: string, type: MessageType = 'text', fileData?: any) => {
    if (!text.trim() && !fileData) return;
    if (!userProfile) return;

    setSending(true);
    setModerationWarning(null);

    if (text) {
      const isClean = await moderateContent(text);
      if (!isClean) {
        setSending(false);
        return;
      }
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newMsg: ProjectMessage = {
      id: messageId,
      projectId: project.id,
      senderId: userProfile.id,
      senderName: userProfile.fullName,
      senderAvatar: userProfile.avatarUrl,
      senderRole:
        project.members.find((m) => m.userId === userProfile.id)?.role || 'Member',
      type,
      text: text.trim(),
      fileUrl: fileData?.url,
      fileName: fileData?.name,
      fileSize: fileData?.size,
      codeSnippet: fileData?.codeSnippet,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'projects', project.id, 'messages', messageId), newMsg);
      setInputText('');
    } catch (err) {
      console.warn('Fallback saving chat message:', err);
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
      return;
    }

    let msgType: MessageType = 'file';
    if (file.type.startsWith('image/')) msgType = 'image';
    else if (file.type.startsWith('video/')) msgType = 'video';
    else if (file.type.startsWith('audio/')) msgType = 'audio';

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await handleSendMessage(file.name, msgType, {
        url: base64,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
      });
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
    setMutedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Top Header (NO WHITE) */}
      <div className="bg-[#E5DBC8] border-2 border-[#36241E] rounded-3xl shadow-[5px_5px_0px_#36241E] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <span className="absolute top-3 right-6 text-2xl text-[#D9A83A] select-none">★</span>

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
              {project.title}
            </h1>
          </div>
        </div>

        {/* Member Avatars & Active Roster */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {project.members.map((m) => (
              <img
                key={m.userId}
                src={m.avatarUrl}
                alt={m.fullName}
                title={`${m.fullName} (${m.role})`}
                className="w-8 h-8 rounded-full object-cover border-2 border-[#36241E] shadow-[1px_1px_0px_#36241E]"
              />
            ))}
          </div>
          <span className="text-xs font-mono text-[#36241E] pl-1 font-black">
            {project.members.length} Hackers
          </span>
        </div>
      </div>

      {/* Code of Conduct Banner */}
      {safetyNoticeAcknowledged && (
        <div className="p-3.5 bg-[#DFB4C4] border-2 border-[#36241E] rounded-2xl text-xs font-mono flex items-start justify-between gap-3 shadow-[2.5px_2.5px_0px_#36241E]">
          <div className="flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-[#36241E] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#36241E] uppercase font-black">Crew Code of Conduct:</strong>
              <span className="text-[#36241E] ml-1 font-semibold">
                Zero harassment, constructive code reviews, and encrypted asset sharing. Gemini filters active.
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

      {/* Moderation Warning Toast */}
      {moderationWarning && (
        <div className="p-3.5 bg-red-200 border-2 border-red-900 rounded-2xl text-red-950 text-xs font-mono flex items-start justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-900" />
            <div>
              <strong>Gemini Safety Gate Blocked Message:</strong>
              <p className="mt-0.5">{moderationWarning}</p>
            </div>
          </div>
          <button onClick={() => setModerationWarning(null)} className="font-black text-sm cursor-pointer">
            ×
          </button>
        </div>
      )}

      {/* Chat Messages Feed (NO WHITE) */}
      <div className="bg-[#EFE7D8] border-2 border-[#36241E] rounded-3xl shadow-[5px_5px_0px_#36241E] h-[480px] overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2.5 p-8">
            <div className="px-4 py-1.5 rounded-full bg-[#C8D6AE] text-[#263311] border-2 border-[#36241E] text-xs font-mono font-black flex items-center gap-1.5 shadow-[2px_2px_0px_#36241E]">
              <span className="text-[#D9A83A]">★</span>
              <span>COMMUNICATION LINK ACTIVE</span>
              <span className="text-[#D9A83A]">★</span>
            </div>
            <p className="font-mono text-xs text-[#543E36] font-semibold max-w-sm">
              No messages logged in this project yet. Share your GitHub branches, design Figma prototypes, or architecture diagram.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === userProfile?.id;
            const isMuted = mutedMembers.has(msg.senderId);

            if (isMuted) {
              return (
                <div
                  key={msg.id}
                  className="p-2 rounded-xl border border-dashed border-[#36241E]/40 text-center font-mono text-[11px] text-[#543E36]"
                >
                  [Message from muted member {msg.senderName} hidden]
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-xl ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <img
                  src={msg.senderAvatar}
                  alt={msg.senderName}
                  className="w-8 h-8 rounded-full object-cover border-2 border-[#36241E] shrink-0 mt-1 shadow-[1px_1px_0px_#36241E]"
                />

                <div className="space-y-1 min-w-0">
                  <div
                    className={`flex items-center gap-2 text-[11px] font-mono ${
                      isMe ? 'justify-end' : ''
                    }`}
                  >
                    <span className="font-black text-[#36241E]">{msg.senderName}</span>
                    <span className="text-[#543E36]">({msg.senderRole})</span>
                    <span className="text-[#543E36]/70">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Message Bubble (NO WHITE) */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-mono leading-relaxed border-2 border-[#36241E] shadow-[2.5px_2.5px_0px_#36241E] ${
                      isMe
                        ? 'bg-[#5B6838] text-[#F5EDE2] rounded-tr-xs'
                        : 'bg-[#DFB4C4] text-[#36241E] rounded-tl-xs'
                    }`}
                  >
                    {msg.type === 'text' && <p className="whitespace-pre-wrap font-medium">{msg.text}</p>}

                    {/* Code Snippet Box */}
                    {msg.type === 'code' && msg.codeSnippet && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase pb-1 border-b border-[#36241E]/20">
                          <span>Language: {msg.codeSnippet.language}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(msg.codeSnippet!.code)}
                            className="hover:underline cursor-pointer font-bold"
                          >
                            Copy Code
                          </button>
                        </div>
                        <pre className="p-3 bg-[#36241E] text-[#F5EDE2] rounded-xl overflow-x-auto text-[11px] font-mono leading-normal border border-[#231612]">
                          <code>{msg.codeSnippet.code}</code>
                        </pre>
                      </div>
                    )}

                    {/* Image Attachment */}
                    {msg.type === 'image' && msg.fileUrl && (
                      <div className="space-y-1">
                        <img
                          src={msg.fileUrl}
                          alt={msg.fileName || 'Attachment'}
                          className="max-h-60 rounded-xl object-contain border border-[#36241E] bg-[#EFE7D8]"
                        />
                        <span className="text-[10px] block opacity-80">{msg.fileName} ({msg.fileSize})</span>
                      </div>
                    )}

                    {/* Generic File Attachment */}
                    {msg.type === 'file' && (
                      <div className="flex items-center gap-2 p-2 bg-[#EFE7D8] text-[#36241E] rounded-xl border border-[#36241E]">
                        <FileText className="w-4 h-4 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-black">{msg.fileName}</div>
                          <div className="text-[10px] opacity-75">{msg.fileSize}</div>
                        </div>
                        {msg.fileUrl && (
                          <a
                            href={msg.fileUrl}
                            download={msg.fileName}
                            className="px-2.5 py-0.5 bg-[#36241E] text-[#F5EDE2] rounded-full text-[10px] font-black"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Moderation actions per message */}
                  {!isMe && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#543E36] pt-0.5">
                      <button
                        onClick={() => setReportingMsg(msg)}
                        className="hover:text-red-700 flex items-center gap-1 cursor-pointer font-bold"
                        title="Report message for safety review"
                      >
                        <Flag className="w-3 h-3" />
                        <span>Report</span>
                      </button>

                      <span>·</span>

                      <button
                        onClick={() => toggleMuteMember(msg.senderId)}
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
                            onClick={() => onRemoveMember(msg.senderId)}
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

      {/* Input bar (NO WHITE) */}
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
            onChange={(e) => setInputText(e.target.value)}
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
          <span className="text-[#36241E] font-black">✓ Gemini Realtime Safe</span>
        </div>
      </div>

      {/* CODE SNIPPET MODAL (NO WHITE) */}
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
              <label className="block text-xs font-mono font-black uppercase text-[#36241E] mb-1">Language</label>
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
              <label className="block text-xs font-mono font-black uppercase text-[#36241E] mb-1">Code</label>
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
                disabled={!snippetCode.trim()}
                className="px-5 py-2 text-xs font-mono font-black uppercase btn-retro-moss text-[#F5EDE2] rounded-full cursor-pointer disabled:opacity-50"
              >
                Share Snippet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MESSAGE MODAL (NO WHITE) */}
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
                <div className="font-black text-sm font-display text-[#36241E]">Report Logged</div>
                <p className="text-xs font-mono text-[#36241E] font-medium">
                  Safety protocol initiated.
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 bg-[#EFE7D8] rounded-2xl border-2 border-[#36241E] text-xs font-mono text-[#36241E]">
                  Flagging message by: <strong>{reportingMsg.senderName}</strong>
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
                    <option value="Harassment or inappropriate conduct">Harassment or inappropriate conduct</option>
                    <option value="Malicious link or suspicious file">Malicious link or suspicious file</option>
                    <option value="Spam or unsolicited promotion">Spam or unsolicited promotion</option>
                    <option value="Intellectual property violation">Intellectual property violation</option>
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
    </div>
  );
};
