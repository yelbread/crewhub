import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Plus, LogOut, MessageSquare, Compass, Ticket, Users, User, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreateModal: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateModal,
  onOpenAuth,
}) => {
  const { userProfile, signOut } = useAuth();

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#E5DBC8] border-b-2 border-[#36241E] px-4 sm:px-6 py-2.5 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Brand Ticket */}
          <button
            onClick={() => onSelectTab('landing')}
            className="flex items-center gap-2 group text-left cursor-pointer focus:outline-hidden"
          >
            <div className="w-8 h-8 rounded-full border-2 border-[#36241E] bg-[#5B6838] flex items-center justify-center text-[#F5EDE2] font-black text-sm shadow-[2px_2px_0px_#36241E] group-hover:rotate-6 transition-transform">
              ★
            </div>
            <span className="font-black tracking-tight font-display text-xl sm:text-2xl text-[#36241E]">
              Crew<span className="text-[#5B6838]">Hub</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DFB4C4] text-[#36241E] border border-[#36241E] uppercase font-black tracking-wider hidden sm:inline-block shadow-[1px_1px_0px_#36241E]">
              Match Engine
            </span>
          </button>

          {/* Desktop Navigation Links (Boarding Passes replaced with Browse Projects) */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-4 text-xs font-mono font-black uppercase tracking-wider text-[#4A3933]">
            <button
              onClick={() => onSelectTab('landing')}
              className={`transition-all py-1.5 px-3 rounded-xl cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'landing'
                  ? 'bg-[#CAD8B4] text-[#36241E] border-2 border-[#36241E] shadow-[2px_2px_0px_#36241E]'
                  : 'hover:text-[#36241E] hover:bg-[#EFE7D8]'
              }`}
            >
              {currentTab === 'landing' && <span className="text-[#D9A83A]">★</span>}
              <span>Overview</span>
            </button>

            <button
              onClick={() => onSelectTab('browse')}
              className={`transition-all py-1.5 px-3 rounded-xl cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'browse'
                  ? 'bg-[#CAD8B4] text-[#36241E] border-2 border-[#36241E] shadow-[2px_2px_0px_#36241E]'
                  : 'hover:text-[#36241E] hover:bg-[#EFE7D8]'
              }`}
            >
              {currentTab === 'browse' && <span className="text-[#D9A83A]">★</span>}
              <span>Browse Projects</span>
            </button>

            {userProfile && (
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`transition-all py-1.5 px-3 rounded-xl cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'dashboard'
                    ? 'bg-[#CAD8B4] text-[#36241E] border-2 border-[#36241E] shadow-[2px_2px_0px_#36241E]'
                    : 'hover:text-[#36241E] hover:bg-[#EFE7D8]'
                }`}
              >
                {currentTab === 'dashboard' && <span className="text-[#D9A83A]">★</span>}
                <span>My Teams</span>
              </button>
            )}

            {userProfile && (
              <button
                onClick={() => onSelectTab('chat')}
                className={`transition-all py-1.5 px-3 rounded-xl cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'chat'
                    ? 'bg-[#CAD8B4] text-[#36241E] border-2 border-[#36241E] shadow-[2px_2px_0px_#36241E]'
                    : 'hover:text-[#36241E] hover:bg-[#EFE7D8]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#5B6838]" />
                <span>Team Chat</span>
              </button>
            )}

            {userProfile && (
              <button
                onClick={() => onSelectTab('profile')}
                className={`transition-all py-1.5 px-3 rounded-xl cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'profile'
                    ? 'bg-[#CAD8B4] text-[#36241E] border-2 border-[#36241E] shadow-[2px_2px_0px_#36241E]'
                    : 'hover:text-[#36241E] hover:bg-[#EFE7D8]'
                }`}
              >
                {currentTab === 'profile' && <span className="text-[#D9A83A]">★</span>}
                <span>Proof & Profile</span>
              </button>
            )}
          </nav>

          {/* Actions Zone */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {userProfile ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenCreateModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black font-mono btn-retro-moss rounded-full cursor-pointer shadow-[2px_2px_0px_#36241E]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Post Project</span>
                  <span className="sm:hidden">Post</span>
                </button>

                <button
                  onClick={() => onSelectTab('profile')}
                  className="flex items-center gap-1.5 p-1 pl-1.5 pr-2.5 rounded-full border-2 border-[#36241E] bg-[#EFE7D8] hover:bg-[#DFB4C4] transition-all cursor-pointer shadow-[2px_2px_0px_#36241E]"
                  title="View Profile"
                >
                  <img
                    src={userProfile.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=avatar'}
                    alt={userProfile.fullName}
                    className="w-6 h-6 rounded-full object-cover border border-[#36241E]"
                  />
                  <span className="text-xs font-black font-mono hidden xl:inline max-w-[90px] truncate text-[#36241E]">
                    {userProfile.fullName.split(' ')[0]}
                  </span>
                </button>

                <button
                  onClick={signOut}
                  title="Sign out"
                  className="p-1.5 rounded-full border-2 border-[#36241E] bg-[#EFE7D8] text-[#36241E] hover:bg-[#DFB4C4] transition-all cursor-pointer shadow-[2px_2px_0px_#36241E]"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-1.5 text-xs font-mono font-black btn-retro-moss rounded-full cursor-pointer text-[#F5EDE2] shadow-[2px_2px_0px_#36241E]"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Minimised, Clean Mobile Navigation Dock (< md screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#E5DBC8] border-t-2 border-[#36241E] px-2 py-1.5 shadow-[0px_-2px_10px_rgba(54,36,30,0.15)] flex items-center justify-around">
        <button
          onClick={() => onSelectTab('landing')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-mono font-black uppercase transition-all ${
            currentTab === 'landing'
              ? 'bg-[#CAD8B4] text-[#36241E] border border-[#36241E] shadow-[1px_1px_0px_#36241E]'
              : 'text-[#4A3933]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => onSelectTab('browse')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-mono font-black uppercase transition-all ${
            currentTab === 'browse'
              ? 'bg-[#CAD8B4] text-[#36241E] border border-[#36241E] shadow-[1px_1px_0px_#36241E]'
              : 'text-[#4A3933]'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Browse</span>
        </button>

        {userProfile && (
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-mono font-black uppercase transition-all ${
              currentTab === 'dashboard'
                ? 'bg-[#CAD8B4] text-[#36241E] border border-[#36241E] shadow-[1px_1px_0px_#36241E]'
                : 'text-[#4A3933]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Teams</span>
          </button>
        )}

        {userProfile && (
          <button
            onClick={() => onSelectTab('chat')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-mono font-black uppercase transition-all ${
              currentTab === 'chat'
                ? 'bg-[#CAD8B4] text-[#36241E] border border-[#36241E] shadow-[1px_1px_0px_#36241E]'
                : 'text-[#4A3933]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
          </button>
        )}

        {userProfile ? (
          <button
            onClick={() => onSelectTab('profile')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-mono font-black uppercase transition-all ${
              currentTab === 'profile'
                ? 'bg-[#CAD8B4] text-[#36241E] border border-[#36241E] shadow-[1px_1px_0px_#36241E]'
                : 'text-[#4A3933]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-mono font-black uppercase text-[#5B6838]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        )}
      </nav>
    </>
  );
};
