import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Compass, Users, User, Flame, Sparkles, Disc, Plus } from 'lucide-react';

export default function Navbar() {
  const { user, setStudioOpen, setLoginModalOpen } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;
  const isExplore = currentPath === '/' || currentPath.startsWith('/feed') || currentPath.startsWith('/landing');
  const isFriends = currentPath.startsWith('/friends');
  const isProfile = currentPath.startsWith('/profile');

  // Compute initials (e.g. "Linh Tran" -> "LT")
  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'LT';

  const streakDisplay = user?.streakDays || 14;

  return (
    <header className="sticky top-0 z-40 bg-[#07131e]/95 backdrop-blur-md border-b border-[#12283a]/80 transition-colors">
      <div className="relative max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* 1. LEFT SECTION: BRAND & TAGLINE */}
        <div 
          onClick={() => navigate('/feed')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#142c40] to-[#0a1824] border border-[#1e4463] flex items-center justify-center shadow-inner group-hover:border-[#91B9C5]/50 transition-colors">
            <span className="font-display font-bold text-base text-[#E8EEF0]">S</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="font-display font-extrabold text-sm tracking-wider text-[#E8EEF0] group-hover:text-[#91B9C5] transition-colors">
                SAY
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#91B9C5]" />
            </div>
            <span className="text-[8px] sm:text-[9px] block font-grotesk text-[#91B9C5]/60 uppercase tracking-widest leading-tight">
              SOUND AROUND YOU · SAY IT WITHOUT SAYING IT
            </span>
          </div>
        </div>

        {/* 2. CENTER SECTION: 3 MAIN TABS PILL (PERFECTLY CENTERED) */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 bg-[#0c1f2e] p-1 rounded-2xl border border-[#16354d]/90 shadow-inner z-10">
          {/* Tab 1: Explore */}
          <button
            onClick={() => navigate('/feed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              isExplore
                ? 'bg-[#183952] text-[#E8EEF0] shadow-sm border border-[#235073]'
                : 'text-[#91B9C5]/70 hover:text-[#E8EEF0] hover:bg-[#112638]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore</span>
          </button>

          {/* Tab 2: Friends */}
          <button
            onClick={() => navigate('/friends')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              isFriends
                ? 'bg-[#183952] text-[#E8EEF0] shadow-sm border border-[#235073]'
                : 'text-[#91B9C5]/70 hover:text-[#E8EEF0] hover:bg-[#112638]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Friends</span>
          </button>

          {/* Tab 3: Profile */}
          <button
            onClick={() => navigate('/profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              isProfile
                ? 'bg-[#183952] text-[#E8EEF0] shadow-sm border border-[#235073]'
                : 'text-[#91B9C5]/70 hover:text-[#E8EEF0] hover:bg-[#112638]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </nav>

        {/* 3. RIGHT SECTION: STUDIO AUDIO WAVE BUTTON & USER STATUS PILL */}
        <div className="flex items-center gap-3">
          
          {/* Luminous Audiophile "Drop Note" Sonic Emblem Button */}
          <button
            onClick={() => setStudioOpen(true)}
            className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500/20 via-[#122e44] to-purple-600/30 hover:from-cyan-400 hover:to-indigo-500 border border-cyan-400/50 hover:border-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.3)] hover:shadow-[0_0_28px_rgba(34,211,238,0.7)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            title="Press New Audio Note (+)"
            aria-label="Create New Audio Note"
          >
            {/* Spinning ambient vinyl groove */}
            <div className="absolute inset-1 rounded-full border border-dashed border-cyan-300/30 group-hover:border-white/50 group-hover:animate-spin-slow pointer-events-none" />
            
            {/* Center Glowing Plus with Audio Spark */}
            <div className="relative flex items-center justify-center">
              <span className="text-cyan-300 group-hover:text-white font-mono text-lg font-bold leading-none select-none transition-colors">
                +
              </span>
              <Sparkles className="w-2.5 h-2.5 text-cyan-400 group-hover:text-amber-300 absolute -top-1 -right-2 transition-transform duration-300 group-hover:scale-125" />
            </div>

            {/* Subtle sonic aura ping effect on hover */}
            <div className="absolute -inset-0.5 rounded-full bg-cyan-400/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>

          {/* User Profile & Streak Pill */}
          {user ? (
            <div
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 bg-[#0c1f2e] border border-[#193a54] hover:border-[#91B9C5]/50 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all group"
              title="View Profile Vault"
            >
              {/* Initials Avatar circle */}
              <div className="w-7 h-7 rounded-lg bg-[#142c40] border border-[#224869] flex items-center justify-center text-[11px] font-display font-bold text-[#E8EEF0] group-hover:text-[#91B9C5] transition-colors">
                {initials}
              </div>

              {/* Streak Badge */}
              <div className="flex items-center gap-1 text-xs font-grotesk font-bold text-[#E8EEF0]">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" />
                <span>{streakDisplay}d</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setLoginModalOpen(true)}
              className="flex items-center gap-2 bg-[#0c1f2e] hover:bg-[#142c40] text-[#E8EEF0] border border-[#1a3d5b] text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow cursor-pointer"
            >
              Sign In
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
