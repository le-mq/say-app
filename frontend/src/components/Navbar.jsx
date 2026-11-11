import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { noteService } from '../services/noteService';
import { calculateCurrentStreak } from '../utils/streakUtils';
import { toast } from 'react-toastify';
import { 
  Compass, Users, User, Flame, Sparkles, Disc, Plus, 
  LogOut, ChevronDown, Clock, Radio, UserCheck, Settings, Bell 
} from 'lucide-react';

export default function Navbar() {
  const { user, setUser, setStudioOpen, setLoginModalOpen, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Automatically calculate and synchronize the user's authentic daily streak
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;
    const syncStreak = async () => {
      try {
        const res = await noteService.getUserNotes(user.id);
        const userNotes = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
        const computedStreak = calculateCurrentStreak(userNotes);
        if (isMounted && user.streakDays !== computedStreak) {
          setUser({ ...user, streakDays: computedStreak });
        }
      } catch (err) {
        console.warn('Navbar streak sync error:', err);
      }
    };

    syncStreak();
    window.addEventListener('say_note_created', syncStreak);
    return () => {
      isMounted = false;
      window.removeEventListener('say_note_created', syncStreak);
    };
  }, [user?.id, setUser]);

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
    toast.info("You have signed out. See you next time!");
    navigate('/');
  };

  const currentPath = location.pathname;
  const isExplore = currentPath === '/' || currentPath.startsWith('/feed') || currentPath.startsWith('/landing');
  const isFriends = currentPath.startsWith('/friends');
  const isUniverse = currentPath.startsWith('/universe');
  const isProfile = currentPath.startsWith('/profile');

  // Universe view mode synchronized with URL search params ('constellation' | 'timeline')
  const activeUniverseView = (searchParams.get('view') || 'constellation').toLowerCase();
  // Friends tab mode synchronized with URL search params ('feed' | 'hub')
  const activeFriendsTab = (searchParams.get('tab') || 'feed').toLowerCase();

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'MQ';

  const streakDisplay = user?.streakDays ?? 0;

  return (
    <header className="sticky top-0 z-40 bg-[#081724]/95 backdrop-blur-md border-b border-[#142c40]/80 transition-colors">
      <div className="relative max-w-[1520px] w-full mx-auto px-2.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* 1. LEFT SECTION: BRAND IDENTITY & DYNAMIC PAGE TITLE */}
        <div className="flex items-center gap-2 sm:gap-3 select-text shrink-0 z-10">
          {/* Favicon Logo: clicking always returns to Feed */}
          <div 
            onClick={() => navigate('/feed')}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-[12px] sm:rounded-[14px] overflow-hidden bg-[#0f2435] border border-[#1e4463]/90 flex items-center justify-center shadow-md hover:border-[#91B9C5]/80 hover:shadow-[0_0_18px_rgba(145,185,197,0.25)] hover:scale-[1.04] transition-all cursor-pointer shrink-0 group"
            title="SAY - Return to Feed"
          >
            <img
              src="/say-favicon.svg"
              alt="SAY - Sound Around You"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Dynamic Page Context Wordmark (Hidden on compact mobile/window to keep navbar clean) */}
          <div 
            onClick={() => navigate('/feed')}
            className="hidden sm:flex flex-col justify-center leading-none cursor-pointer"
            title="Return to Feed"
          >
            {isUniverse ? (
              <span className="font-serif font-bold text-[14px] sm:text-[15px] tracking-wide text-[#E8EEF0] hover:text-[#91B9C5] transition-colors">
                My Universe
              </span>
            ) : isFriends ? (
              <span className="font-serif font-bold text-[14px] sm:text-[15px] tracking-wide text-[#E8EEF0] hover:text-[#91B9C5] transition-colors">
                Friends
              </span>
            ) : isProfile ? (
              <span className="font-serif font-bold text-[14px] sm:text-[15px] tracking-wide text-[#E8EEF0] hover:text-[#91B9C5] transition-colors">
                Profile
              </span>
            ) : (
              <span 
                className="font-serif font-bold text-[14px] sm:text-[15px] tracking-wide text-[#E8EEF0] hover:text-[#91B9C5] transition-colors"
              >
                Sound Around You
              </span>
            )}
          </div>
        </div>

        {/* 2. CENTER SECTION: 3 MAIN TABS PILL (Always mathematically dead-centered on navbar) */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 sm:gap-1 bg-[#0c1f2e] p-1 rounded-2xl border border-[#16354d]/90 shadow-inner z-20 pointer-events-auto">
          {/* Tab 1: Explore */}
          <button
            onClick={() => navigate('/feed')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              isExplore
                ? 'bg-[#183952] text-[#E8EEF0] shadow-sm border border-[#235073]'
                : 'text-[#91B9C5]/70 hover:text-[#E8EEF0] hover:bg-[#112638]'
            }`}
            title="Explore Feed"
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Explore</span>
          </button>

          {/* Tab 2: Friends */}
          <button
            onClick={() => navigate('/friends')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              isFriends
                ? 'bg-[#183952] text-[#E8EEF0] shadow-sm border border-[#235073]'
                : 'text-[#91B9C5]/70 hover:text-[#E8EEF0] hover:bg-[#112638]'
            }`}
            title="Friends Feed"
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Friends</span>
          </button>

          {/* Tab 3: My Universe */}
          <button
            onClick={() => navigate('/universe')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              isUniverse
                ? 'bg-[#183952] text-cyan-200 shadow-sm border border-cyan-500/50'
                : 'text-[#91B9C5]/70 hover:text-[#E8EEF0] hover:bg-[#112638]'
            }`}
            title="My Universe"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="hidden md:inline">My Universe</span>
          </button>
        </nav>

        {/* 3. RIGHT SECTION: CONTEXTUAL CONTROLS, CREATE NOTE & USER STATUS */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 z-10 ml-auto">
          
          {/* Contextual Toolbar: Constellation / Timeline Switcher directly on Navbar when in My Universe */}
          {isUniverse && (
            <div className="flex items-center gap-0.5 sm:gap-1 bg-[#091e30] p-0.5 sm:p-1 rounded-2xl border border-[#163a56] shadow-sm shrink-0">
              <button
                type="button"
                onClick={() => setSearchParams({ view: 'constellation' })}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  activeUniverseView === 'constellation'
                    ? 'bg-[#184266] text-cyan-200 border border-cyan-500/40 shadow-sm'
                    : 'text-[#91B9C5]/70 hover:text-white'
                }`}
                title="View Audio Constellation"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden md:inline">Constellation</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchParams({ view: 'timeline' })}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  activeUniverseView === 'timeline'
                    ? 'bg-[#184266] text-cyan-200 border border-cyan-500/40 shadow-sm'
                    : 'text-[#91B9C5]/70 hover:text-white'
                }`}
                title="View Memory Timeline"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden md:inline">Timeline</span>
              </button>
            </div>
          )}

          {/* Contextual Toolbar: Friends Feed / Friendship Hub Switcher directly on Navbar when in Friends */}
          {isFriends && (
            <div className="flex items-center gap-0.5 sm:gap-1 bg-[#091e30] p-0.5 sm:p-1 rounded-2xl border border-[#163a56] shadow-sm shrink-0">
              <button
                type="button"
                onClick={() => setSearchParams({ tab: 'feed' })}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  activeFriendsTab === 'feed'
                    ? 'bg-[#184266] text-cyan-200 border border-cyan-500/40 shadow-sm'
                    : 'text-[#91B9C5]/70 hover:text-white'
                }`}
                title="Friends Feed"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden md:inline">Feed</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchParams({ tab: 'hub' })}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  activeFriendsTab === 'hub'
                    ? 'bg-[#184266] text-cyan-200 border border-cyan-500/40 shadow-sm'
                    : 'text-[#91B9C5]/70 hover:text-white'
                }`}
                title="Friendship Hub"
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden md:inline">Hub</span>
              </button>
            </div>
          )}

          {/* Modern Audiophile "Create Note" Action Button (Collapses to icon on compact windows) */}
          <button
            type="button"
            onClick={() => {
              if (!user) {
                toast.info("Please sign in to create a Music Note.");
                setLoginModalOpen(true);
                return;
              }
              setStudioOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 h-9 rounded-full bg-gradient-to-r from-[#122e44] to-[#183e5c] hover:from-[#183d5a] hover:to-[#22557d] border border-[#23527a] hover:border-cyan-400 text-cyan-300 hover:text-white shadow-sm hover:shadow-[0_0_16px_rgba(34,211,238,0.3)] transition-all duration-200 cursor-pointer active:scale-95 group shrink-0"
            title="Create New Audio Note"
            aria-label="Create New Audio Note"
          >
            <Plus className="w-4 h-4 text-cyan-300 group-hover:text-cyan-200 transition-transform duration-300 group-hover:rotate-90 stroke-[2.5]" />
            <span className="hidden md:inline font-grotesk font-semibold text-xs text-[#E8EEF0] tracking-wide">
              Create Note
            </span>
          </button>

          {/* User Profile & Streak Pill with Dropdown Menu / Sign In Button */}
          {user ? (
            <div className="relative shrink-0" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 sm:gap-2 bg-[#0c1f2e] border border-[#193a54] hover:border-[#91B9C5]/50 px-2 sm:px-2.5 h-9 rounded-full cursor-pointer transition-all group shrink-0"
                title="Account & Settings"
              >
                {/* Initials or Real Avatar circle */}
                <div className="w-6 h-6 rounded-full bg-[#142c40] border border-[#224869] overflow-hidden flex items-center justify-center text-[10px] font-display font-bold text-[#E8EEF0] group-hover:text-[#91B9C5] transition-colors shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                {/* Streak Badge: Only fiery orange if streak >= 7 */}
                <div className="hidden xs:flex sm:flex items-center gap-1 text-xs font-grotesk font-bold">
                  <Flame className={`w-3.5 h-3.5 ${Number(streakDisplay) >= 7 ? 'text-orange-400 fill-orange-400 animate-pulse' : 'text-cyan-300 fill-cyan-300/30'}`} />
                  <span className={Number(streakDisplay) >= 7 ? 'text-orange-300' : 'text-cyan-200'}>{streakDisplay}d</span>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-[#91B9C5]/60 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#091827]/98 backdrop-blur-xl border border-[#1a3d5b] shadow-[0_16px_36px_rgba(0,0,0,0.6)] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Header info */}
                  <div className="px-3.5 py-2.5 border-b border-[#142e44] flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#102434] border border-[#1e4566] shrink-0 flex items-center justify-center text-xs font-bold text-[#91B9C5]">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#E8EEF0] truncate leading-tight">
                        {user.displayName || "Audiophile Member"}
                      </p>
                      <p className="text-[10px] font-mono text-[#91B9C5]/70 truncate mt-0.5">
                        @{user.username || "listener"}
                      </p>
                    </div>
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
                      <User className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/profile?modal=edit');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#E8EEF0] hover:bg-[#142C40] hover:text-white text-left transition-colors cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-amber-300" />
                      <span>Settings & Account</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        toast.info("No new notifications.");
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#E8EEF0] hover:bg-[#142C40] hover:text-white text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bell className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Notifications</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">0</span>
                    </button>

                    <div className="h-px bg-[#142e44] my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 text-left transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setLoginModalOpen(true)}
              className="flex items-center justify-center px-4 h-9 rounded-full bg-[#0c1f2e] hover:bg-[#142c40] text-[#E8EEF0] hover:text-white border border-[#1a3d5b] hover:border-[#91B9C5]/50 text-xs font-grotesk font-semibold transition-all shadow-sm cursor-pointer active:scale-95"
            >
              Sign In
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
