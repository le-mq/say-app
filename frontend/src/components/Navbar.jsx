import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-toastify';
import { 
  Compass, Users, User, Flame, Sparkles, Disc, Plus, 
  LogOut, ChevronDown 
} from 'lucide-react';

export default function Navbar() {
  const { user, setStudioOpen, setLoginModalOpen, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    toast.info("Logged out from SAY session");
    navigate('/');
  };

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
        
        {/* 1. LEFT SECTION: BRAND IDENTITY (Favicon enlarged for crisp typography + no repetitive SAY/slogan) */}
        <div 
          onClick={() => navigate('/feed')}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          title="SAY - Sound Around You"
        >
          {/* Favicon App Mark (enlarged to 40-44px so the custom serif font & wave are clearly legible) */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] overflow-hidden bg-[#0f2435] border border-[#1e4463]/90 flex items-center justify-center shadow-md group-hover:border-[#91B9C5]/60 group-hover:shadow-[0_0_18px_rgba(145,185,197,0.28)] group-hover:scale-[1.04] transition-all shrink-0">
            <img
              src="/say-favicon.svg"
              alt="SAY - Sound Around You"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Brand Wordmark: "Sound Around You" (Resolves duplicate "SAY" & eliminates repetitive slogan) */}
          <div className="hidden sm:flex flex-col justify-center leading-none">
            <span className="font-serif font-bold text-[14px] sm:text-[15px] tracking-wide text-[#E8EEF0] group-hover:text-[#91B9C5] transition-colors">
              Sound Around You
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

          {/* User Profile & Streak Pill with Dropdown Menu */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 bg-[#0c1f2e] border border-[#193a54] hover:border-[#91B9C5]/50 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all group"
                title="Account & Vault"
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

                <ChevronDown className={`w-3.5 h-3.5 text-[#91B9C5]/60 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#091827]/98 backdrop-blur-xl border border-[#1a3d5b] shadow-[0_16px_36px_rgba(0,0,0,0.6)] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Header info */}
                  <div className="px-3.5 py-2 border-b border-[#142e44]">
                    <p className="text-xs font-bold text-[#E8EEF0] truncate leading-tight">
                      {user.displayName || "Audiophile Member"}
                    </p>
                    <p className="text-[10px] font-mono text-[#91B9C5]/70 truncate mt-0.5">
                      {user.handle || "@listener"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="p-1 space-y-0.5 text-xs font-grotesk">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#E8EEF0] hover:bg-[#142C40] hover:text-white text-left transition-colors cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-[#91B9C5]" />
                      <span>Profile Vault</span>
                    </button>

                    <div className="h-px bg-[#142e44] my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 text-left transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
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
