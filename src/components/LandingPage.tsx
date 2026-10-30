import React, { useState } from 'react';
import { Project } from '../types.ts';
import { getProjectTheme } from '../utils/themeStyles.ts';
import {
  ArrowRight,
  Clock,
  Ticket,
} from 'lucide-react';

interface LandingPageProps {
  projects: Project[];
  onBrowse: () => void;
  onCreateProject: () => void;
  onSelectProject: (project: Project) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  projects,
  onBrowse,
  onCreateProject,
  onSelectProject,
}) => {
  const [demoRole, setDemoRole] = useState('ML Engineer');

  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* 1. HERO SECTION WITH PICTURE 1 COLOR COMBOS & GOLD STARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border-2 border-[#36241E] bg-[#E5DBC8] p-8 sm:p-12 shadow-[6px_6px_0px_#36241E] relative overflow-hidden">
          {/* Inner Dashed Border like Picture 2 Ticket */}
          <div className="ticket-dashed-frame m-1 sm:m-2 p-6 sm:p-8 relative">
            {/* Vintage decorative stars from Picture 1 */}
            <span className="absolute -top-3 left-6 text-2xl text-[#D9A83A] select-none">★</span>
            <span className="absolute -top-3 right-10 text-3xl text-[#D9A83A] select-none">★</span>
            <span className="absolute -bottom-3 right-8 text-2xl text-[#D9A83A] select-none">★</span>
            <span className="absolute -bottom-3 left-12 text-xl text-[#D9A83A] select-none">★</span>

            <div className="max-w-3xl space-y-6 relative z-10">
              {/* Styling color combos headline banner from Picture 1 */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DFB4C4] text-[#36241E] border-2 border-[#36241E] text-xs font-mono font-black uppercase tracking-wider shadow-[2px_2px_0px_#36241E]">
                <span className="text-[#D9A83A]">★</span>
                <span>Hackathon Flight Matcher</span>
                <span className="text-[#36241E]/50">/</span>
                <span>Spring 2026 Edition</span>
                <span className="text-[#D9A83A]">★</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-[#36241E] leading-[1.08] text-balance">
                Assemble your hackathon <span className="text-[#5B6838] underline decoration-[#36241E] decoration-wavy decoration-2">dream crew</span> in minutes.
              </h1>

              <p className="text-base sm:text-lg text-[#523E37] font-semibold leading-relaxed max-w-2xl font-sans">
                Pair up with fellow student builders based on verified GitHub activity, preferred competition roles, and instant Gemini AI synergy fit.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={onBrowse}
                  className="px-6 py-3 font-mono font-black text-xs uppercase tracking-wider rounded-full btn-retro-moss flex items-center gap-2 cursor-pointer"
                >
                  <span>Admit & Find Teammates</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onCreateProject}
                  className="px-6 py-3 font-mono font-black text-xs uppercase tracking-wider rounded-full btn-retro-mauve cursor-pointer"
                >
                  <span>Post Team Flight Pass</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics styled as Colored Ticket Stubs (NO WHITE) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t-2 border-dashed border-[#36241E]/30 text-xs font-mono relative z-10">
              <div className="p-4 rounded-2xl bg-[#C8D6AE] border-2 border-[#36241E] shadow-[2.5px_2.5px_0px_#36241E]">
                <div className="text-2xl sm:text-3xl font-black text-[#263311] tabular-nums font-display">
                  {projects.length}
                </div>
                <div className="text-[#36241E] font-bold mt-0.5 uppercase tracking-wide">Active Flights</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#DFB4C4] border-2 border-[#36241E] shadow-[2.5px_2.5px_0px_#36241E]">
                <div className="text-2xl sm:text-3xl font-black text-[#36241E] tabular-nums font-display">
                  180+
                </div>
                <div className="text-[#36241E] font-bold mt-0.5 uppercase tracking-wide">Seeking Crews</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F3BBA8] border-2 border-[#36241E] shadow-[2.5px_2.5px_0px_#36241E]">
                <div className="text-2xl sm:text-3xl font-black text-[#36241E] tabular-nums font-display">
                  100%
                </div>
                <div className="text-[#36241E] font-bold mt-0.5 uppercase tracking-wide">GitHub Verified</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#BDD1DF] border-2 border-[#36241E] shadow-[2.5px_2.5px_0px_#36241E]">
                <div className="text-2xl sm:text-3xl font-black text-[#1E2F3B] tabular-nums font-display">
                  48
                </div>
                <div className="text-[#36241E] font-bold mt-0.5 uppercase tracking-wide">Teams Formed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS (4 COLORED RETRO TICKETS - NO WHITE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase font-black text-[#5B6838] mb-1">
            <span className="text-[#D9A83A]">★</span>
            <span>Standard Flight Flow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-[#36241E]">
            How CrewHub Works
          </h2>
          <p className="text-xs sm:text-sm text-[#543E36] font-mono mt-1 font-semibold">
            A 4-step path from discovering a teammate to shipping on deadline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[
            {
              step: '01',
              title: 'Explore or Post',
              description: 'Create a project post with vacant seats or browse open student projects.',
              bg: 'bg-[#C8D6AE]',
              badge: 'bg-[#5B6838] text-[#F5EDE2]',
            },
            {
              step: '02',
              title: 'Verified Skills',
              description: 'Verify your GitHub activity, languages, and commit history automatically.',
              bg: 'bg-[#DFB4C4]',
              badge: 'bg-[#36241E] text-[#DFB4C4]',
            },
            {
              step: '03',
              title: 'AI Matching',
              description: 'Gemini compares technical stacks, working style, and goals to compute fit %.',
              bg: 'bg-[#F3BBA8]',
              badge: 'bg-[#36241E] text-[#F3BBA8]',
            },
            {
              step: '04',
              title: 'Team War-Room',
              description: 'Collaborate in real-time project chat with code snippets and safe file sharing.',
              bg: 'bg-[#BDD1DF]',
              badge: 'bg-[#1E2F3B] text-[#BDD1DF]',
            },
          ].map((card) => (
            <div
              key={card.step}
              className={`p-6 rounded-3xl border-2 border-[#36241E] ${card.bg} space-y-3 shadow-[4px_4px_0px_#36241E] relative overflow-hidden group hover:-translate-y-1 transition-all`}
            >
              <div className="ticket-dashed-frame p-2.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-full ${card.badge} border border-[#36241E] flex items-center justify-center font-mono text-sm font-black shadow-[1.5px_1.5px_0px_#36241E]`}>
                    {card.step}
                  </div>
                  <span className="text-lg text-[#D9A83A]">★</span>
                </div>
                <h3 className="text-base font-black font-display text-[#36241E]">
                  {card.title}
                </h3>
                <p className="text-xs text-[#36241E] font-mono leading-relaxed font-semibold">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. HEADLINE FEATURE: THE AI TEAM MATCHER (Picture 1 & 2 Aesthetic - NO WHITE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border-2 border-[#36241E] bg-[#E3D6C3] p-6 sm:p-10 shadow-[6px_6px_0px_#36241E] relative overflow-hidden">
          <span className="absolute top-6 right-8 text-3xl text-[#D9A83A] select-none">★</span>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full btn-retro-moss text-[#F5EDE2] text-[11px] font-mono font-bold uppercase tracking-wider">
                <span className="text-[#D9A83A]">★</span>
                <span>Gemini Match Engine</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black font-display text-[#36241E]">
                Match with teams where your skills shine.
              </h2>
              <p className="text-xs sm:text-sm text-[#4E3932] font-mono leading-relaxed font-semibold">
                Instead of guessing if you're a fit, Gemini analyzes your verified code repositories and preferred role to provide an honest, one-line compatibility reason.
              </p>

              {/* Demo selector buttons */}
              <div className="pt-2 space-y-2">
                <span className="text-xs font-mono font-black text-[#36241E] uppercase tracking-wide block">
                  Select your role to test match synergy:
                </span>
                <div className="flex flex-wrap gap-2">
                  {['ML Engineer', 'Full-stack', 'Firmware Dev', 'UI/UX Designer'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setDemoRole(r)}
                      className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-xl border-2 border-[#36241E] transition-all cursor-pointer ${
                        demoRole === r
                          ? 'bg-[#36241E] text-[#F5EDE2] shadow-[2px_2px_0px_#231612]'
                          : 'bg-[#EFE7D8] text-[#36241E] hover:bg-[#DFB4C4]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Matcher Output Preview (Styled as an authentic Stand Up Show ticket - NO WHITE) */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border-2 border-[#36241E] bg-[#F3BBA8] p-6 space-y-4 shadow-[5px_5px_0px_#36241E] relative">
                <div className="ticket-dashed-frame p-4 space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-dashed border-[#36241E]/30 pb-2">
                    <div className="flex items-center gap-1.5 font-mono text-xs uppercase font-black text-[#36241E]">
                      <span className="text-[#D9A83A]">★</span>
                      <span>Compatibility Flight Ticket</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#36241E] text-[#F5EDE2] font-mono text-[10px] font-black">
                      GEMINI 3.8
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#36241E] text-[#F5EDE2] border-2 border-[#36241E] flex flex-col items-center justify-center font-mono shrink-0 shadow-[2px_2px_0px_#D9A83A]">
                      <span className="text-xl font-black text-[#D9A83A]">
                        {demoRole === 'ML Engineer' ? '96%' : demoRole === 'Firmware Dev' ? '92%' : '84%'}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-bold">MATCH</span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="font-black text-sm font-display text-[#36241E]">
                        NeuroPulse: EEG Virtual Keyboard
                      </div>
                      <p className="text-xs font-mono text-[#36241E] font-bold leading-snug">
                        "{demoRole === 'ML Engineer'
                          ? 'High synergy with signal analyst role; verified PyTorch repos match edge inference needs.'
                          : demoRole === 'Firmware Dev'
                          ? 'Strong C++ and microcontroller background directly solves OpenBCI sensor latency.'
                          : 'Complementary design skills to build the accessibility keyboard UI before sprint deadline.'}"
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono font-bold text-[#36241E] border-t border-[#36241E]/20">
                    <span>Work Pace: 8/10 Planning</span>
                    <span>Track: Health prize</span>
                    <span>Seats: 4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED PROJECTS BOARD (RETRO TICKETS FROM PICTURE 2) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase font-black text-[#5B6838] mb-1">
              <span className="text-[#D9A83A]">★</span>
              <span>Browse Projects</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-[#36241E]">
              Featured Crews & Projects
            </h2>
            <p className="text-xs sm:text-sm text-[#543E36] font-mono mt-1 font-semibold">
              Authentic admission tickets from active student teams.
            </p>
          </div>
          <button
            onClick={onBrowse}
            className="text-xs font-mono font-black uppercase text-[#36241E] hover:underline flex items-center gap-1.5 cursor-pointer bg-[#DFB4C4] px-3.5 py-1.5 rounded-full border-2 border-[#36241E] shadow-[2px_2px_0px_#36241E]"
          >
            <span>Browse All {projects.length} Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 rounded-3xl border-2 border-dashed border-[#36241E] text-center space-y-3 bg-[#E5DBC8]">
            <p className="font-mono text-sm font-black text-[#36241E]">
              No projects registered yet.
            </p>
            <p className="text-xs font-mono text-[#543E36]">
              Be the first captain to list a project and assemble your dream hackathon crew!
            </p>
            <button
              onClick={onCreateProject}
              className="px-5 py-2.5 text-xs font-mono font-black uppercase tracking-wider btn-retro-moss text-[#F5EDE2] rounded-full cursor-pointer shadow-md inline-flex items-center gap-1.5"
            >
              <span>+ Create Project Ticket</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.slice(0, 3).map((project, idx) => {
              const theme = getProjectTheme(project.colorTheme, idx);
              return (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  style={{ backgroundColor: theme.cardBg }}
                  className={`rounded-3xl border-2 border-[#36241E] p-5 flex flex-col justify-between hover:-translate-y-1 transition-all cursor-pointer shadow-[5px_5px_0px_#36241E] relative overflow-hidden group`}
                >
                  <div className="ticket-dashed-frame p-3.5 flex flex-col justify-between flex-1 space-y-3.5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span
                          className="font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase border border-[#36241E] truncate max-w-[180px]"
                          style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                        >
                          {(project.domains && project.domains.length > 0 ? project.domains.join(', ') : project.domain)}
                        </span>
                        <span className="uppercase text-[#36241E] font-black text-[10px] bg-[#EFE7D8]/80 px-2 py-0.5 rounded border border-[#36241E]">
                          PASS {theme.ticketCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[#D9A83A] text-lg select-none">★</span>
                        <h3 className="text-base font-black font-display text-[#36241E] group-hover:underline line-clamp-1">
                          {project.title}
                        </h3>
                        <span className="text-[#D9A83A] text-lg select-none">★</span>
                      </div>

                      <p className="text-xs text-[#4A362F] font-mono font-medium line-clamp-2">
                        {project.description}
                      </p>

                      {/* Open Roles */}
                      <div className="space-y-1 pt-2 border-t-2 border-dashed border-[#36241E]/20">
                        <span className="text-[10px] font-mono font-black text-[#36241E] uppercase">
                          ADMIT ONE:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {project.openRoles.slice(0, 2).map((r, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-[#EFE7D8] border border-[#36241E] text-[#36241E]"
                            >
                              {r.role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t-2 border-dashed border-[#36241E]/20 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <img
                          src={project.leaderAvatar}
                          alt={project.leaderName}
                          className="w-6 h-6 rounded-full object-cover border border-[#36241E]"
                        />
                        <span className="text-[#36241E] font-bold truncate max-w-[100px]">
                          {project.leaderName}
                        </span>
                      </div>
                      <span className="font-black text-[#36241E] group-hover:underline flex items-center gap-1">
                        <span>Board</span>
                        <span>→</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. CALL TO ACTION WITH RETRO PRINT EFFECTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-[#36241E] text-[#F5EDE2] p-8 sm:p-12 text-center space-y-6 shadow-[6px_6px_0px_#231612] border-2 border-[#231612] relative overflow-hidden">
          <span className="absolute top-4 left-8 text-3xl text-[#D9A83A] select-none">★</span>
          <span className="absolute bottom-6 right-10 text-3xl text-[#D9A83A] select-none">★</span>

          <div className="ticket-dashed-frame m-1 p-6 space-y-4">
            <h2 className="text-3xl sm:text-5xl font-black font-display max-w-xl mx-auto leading-tight">
              Ready to start and browse projects?
            </h2>
            <p className="text-[#E7DAC9] font-mono font-medium text-xs sm:text-sm max-w-md mx-auto">
              Browse verified hackathon teams or issue your own project ticket in under two minutes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={onCreateProject}
                className="px-7 py-3 rounded-full btn-retro-moss text-[#F5EDE2] font-mono font-black text-xs uppercase tracking-wider cursor-pointer"
              >
                Post a Project Pass
              </button>
              <button
                onClick={onBrowse}
                className="px-7 py-3 rounded-full btn-retro-mauve font-mono font-black text-xs uppercase tracking-wider cursor-pointer"
              >
                Browse All Tickets
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 border-t-2 border-[#36241E] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono font-bold text-[#36241E]">
        <div className="flex items-center gap-2">
          <span className="text-[#D9A83A]">★</span>
          <span>© 2026 CrewHub. Vintage Ticket Matcher for Student Hackathons.</span>
        </div>
        <div className="flex items-center gap-4">
          <span>AI Match Engine</span>
          <span>/</span>
          <span>Verified GitHub</span>
          <span>/</span>
          <span>Team Rooms</span>
        </div>
      </footer>
    </div>
  );
};
