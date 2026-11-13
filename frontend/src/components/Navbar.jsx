import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { authStore, useAuthStore } from '../store/authStore';
import { noteService } from '../services/noteService';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { calculateCurrentStreak } from '../utils/streakUtils';
import { toast } from 'react-toastify';
import { 
  Compass, Users, User, Flame, Sparkles, Disc, Plus, 
  LogOut, ChevronDown, Clock, Radio, UserCheck, Settings, Bell, Shield, Check, X
} from 'lucide-react';

export default function Navbar() {
  const { user, setUser, setStudioOpen, setLoginModalOpen, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [liveStreak, setLiveStreak] = useState(user?.streakDays ?? 0);
  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  // Real-time SSE notifications listener
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadNotifCount(0);
      return;
    }

    // 1. Initial fetch of recent notifications & unread counter
    const fetchNotifs = async () => {
      try {
        const [listRes, countRes] = await Promise.allSettled([
          notificationService.getNotifications(user.id, 15),
          notificationService.getUnreadCount(user.id)
        ]);

        if (listRes.status === 'fulfilled') {
          const list = Array.isArray(listRes.value) ? listRes.value : (listRes.value?.data?.data || listRes.value?.data || []);
          setNotifications(list);
        }
        if (countRes.status === 'fulfilled') {
          const cnt = typeof countRes.value === 'number' ? countRes.value : (countRes.value?.data?.data ?? countRes.value?.data ?? 0);
          setUnreadNotifCount(cnt);
        }
      } catch (err) {
        console.warn('Initial notifications load warning:', err);
      }
    };

    fetchNotifs();

    // 2. Open persistent SSE channel to server
    const sseUrl = notificationService.getStreamUrl(user.id);
    let eventSource = null;
    try {
      eventSource = new EventSource(sseUrl);

      eventSource.addEventListener('NOTIFICATION', (e) => {
        try {
          const notif = JSON.parse(e.data);
          setNotifications((prev) => [notif, ...prev.filter(n => n.id !== notif.id)]);
          setUnreadNotifCount((prev) => prev + 1);
          toast.info(`🔔 ${notif.message}`, {
            icon: '🎵',
            autoClose: 5000,
          });
        } catch (err) {
          console.warn('Error parsing incoming SSE alert:', err);
        }
      });

      eventSource.onerror = () => {
        // EventSource automatically retries connection in standard browser implementations
      };
    } catch (e) {
      console.warn('Could not establish SSE connection:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (typeof user?.streakDays === 'number') {
      setLiveStreak(user.streakDays);
    }
  }, [user?.streakDays]);

  // Automatically calculate and synchronize the user's authentic daily streak
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;
    const syncStreak = async () => {
      try {
        const now = new Date();
        const [notesRes, calendarRes] = await Promise.allSettled([
          noteService.getUserNotes(user.id),
          authService.getStreakCalendar(user.id, now.getFullYear(), now.getMonth() + 1),
        ]);

        let computedStreak = null;

        if (notesRes.status === 'fulfilled') {
          const raw = notesRes.value;
          const userNotes = Array.isArray(raw) ? raw : (raw?.data?.data || raw?.data || []);
          computedStreak = calculateCurrentStreak(userNotes);
        }

        if ((computedStreak === null || computedStreak === 0) && calendarRes.status === 'fulfilled') {
          const cal = calendarRes.value;
          const calData = Array.isArray(cal) ? cal[0] : (cal?.data?.data || cal?.data || cal);
          if (typeof calData?.currentStreakDays === 'number') {
            computedStreak = calData.currentStreakDays;
          }
        }

        if (isMounted && computedStreak !== null) {
          setLiveStreak(computedStreak);
          const latestUser = authStore.getState().user;
          if (latestUser && latestUser.streakDays !== computedStreak) {
            setUser({ ...latestUser, streakDays: computedStreak });
          }
        }
      } catch (err) {
        console.warn('Navbar streak sync error:', err);
      }
    };

    syncStreak();
    window.addEventListener('say_note_created', syncStreak);
    window.addEventListener('say_note_deleted', syncStreak);
    window.addEventListener('focus', syncStreak);
    return () => {
      isMounted = false;
      window.removeEventListener('say_note_created', syncStreak);
      window.removeEventListener('say_note_deleted', syncStreak);
      window.removeEventListener('focus', syncStreak);
    };
  }, [user?.id, setUser]);

  // Synchronize and verify current user's role from backend (e.g. to enable Admin Console)
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;
    const syncProfileRole = async () => {
      try {
        const res = await authService.getProfile(user.id);
        const profile = res?.data?.data || res?.data || res;
        if (isMounted && profile && profile.role && profile.role !== user.role) {
          setUser({ ...user, role: profile.role });
        }
      } catch (err) {
        // Silently preserve current role state
      }
    };
    syncProfileRole();
    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.role, setUser]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setIsNotifMenuOpen(false);
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

  const streakDisplay = liveStreak ?? user?.streakDays ?? 0;

  return (
    <header className="sticky top-0 z-40 bg-[#081724]/95 backdrop-blur-md border-b border-[#142c40]/80 transition-colors">
      <div className="relative max-w-[1520px] w-full mx-auto px-2 sm:px-4 lg:px-8 h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        
        {/* 1. LEFT SECTION: BRAND IDENTITY & DYNAMIC PAGE TITLE */}
        <div className="flex items-center gap-2 sm:gap-3 select-text shrink-0 z-10">
          {/* Favicon Logo: clicking always returns to Feed */}
          <div 
            onClick={() => navigate('/feed')}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[14px] overflow-hidden bg-[#0f2435] border border-[#1e4463]/90 flex items-center justify-center shadow-md hover:border-[#91B9C5]/80 hover:shadow-[0_0_18px_rgba(145,185,197,0.25)] hover:scale-[1.04] transition-all cursor-pointer shrink-0 group"
            title="SAY - Return to Feed"
          >
            <img
              src="/say-favicon.svg"
              alt="SAY - Sound Around You"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Dynamic Page Context Wordmark (Hidden on < lg screens so items never overlap) */}
          <div 
            onClick={() => navigate('/feed')}
            className="hidden lg:flex flex-col justify-center leading-none cursor-pointer"
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

        {/* 2. CENTER SECTION: 3 MAIN TABS PILL (Dead-centered, compact on mobile, icons on small screens) */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 sm:gap-1 bg-[#0c1f2e] p-0.5 sm:p-1 rounded-2xl border border-[#16354d]/90 shadow-inner z-20 pointer-events-auto">
          {/* Tab 1: Explore */}
          <button
            onClick={() => navigate('/feed')}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
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

        {/* 3. RIGHT SECTION: CONTROLS, ADMIN SHORTCUT, CREATE NOTE & USER STATUS */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 z-10 ml-auto">
          
          {/* Contextual Toolbar: Constellation / Timeline Switcher (Visible on desktop >= lg only) */}
          {isUniverse && (
            <div className="hidden lg:flex items-center gap-1 bg-[#091e30] p-1 rounded-2xl border border-[#163a56] shadow-sm shrink-0">
              <button
                type="button"
                onClick={() => setSearchParams({ view: 'constellation' })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  activeUniverseView === 'constellation'
                    ? 'bg-[#184266] text-cyan-200 border border-cyan-500/40 shadow-sm'
                    : 'text-[#91B9C5]/70 hover:text-white'
                }`}
                title="View Audio Constellation"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Constellation</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchParams({ view: 'timeline' })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  activeUniverseView === 'timeline'
                    ? 'bg-[#184266] text-cyan-200 border border-cyan-500/40 shadow-sm'
                    : 'text-[#91B9C5]/70 hover:text-white'
                }`}
                title="View Memory Timeline"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-300" />
                <span>Timeline</span>
              </button>
            </div>
          )}

          {/* Contextual Toolbar: Friends Feed / Friendship Hub Switcher (Visible on desktop >= lg only) */}
          {isFriends && (
            <div className="hidden lg:flex items-center gap-1 bg-[#091e30] p-1 rounded-2xl border border-[#163a56] shadow-sm shrink-0">
              <button
                type="button"
                onClick={() => setSearchParams({ tab: 'feed' })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  activeFriendsTab === 'feed'
                    ? 'bg-[#184266] text-cyan-200 border border-cyan-500/40 shadow-sm'
                    : 'text-[#91B9C5]/70 hover:text-white'
                }`}
                title="Friends Feed"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-300" />
                <span>Feed</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchParams({ tab: 'hub' })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  activeFriendsTab === 'hub'
                    ? 'bg-[#184266] text-cyan-200 border border-cyan-500/40 shadow-sm'
                    : 'text-[#91B9C5]/70 hover:text-white'
                }`}
                title="Friendship Hub"
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-300" />
                <span>Hub</span>
              </button>
            </div>
          )}

          {/* Admin Direct Shortcut Button (Only visible when logged in as ADMIN) */}
          {user?.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 h-8 sm:h-9 rounded-full bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all cursor-pointer text-xs font-bold shrink-0 animate-in fade-in"
              title="Admin Console - Quản trị hệ thống & Cấu hình SAY"
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline font-mono tracking-wide text-[11px]">Admin</span>
            </button>
          )}

          {/* Modern Audiophile "Create Note" Action Button (Icon-only on smaller screens) */}
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
            className="flex items-center justify-center gap-1.5 px-2 sm:px-3.5 h-8 sm:h-9 rounded-full bg-gradient-to-r from-[#122e44] to-[#183e5c] hover:from-[#183d5a] hover:to-[#22557d] border border-[#23527a] hover:border-cyan-400 text-cyan-300 hover:text-white shadow-sm hover:shadow-[0_0_16px_rgba(34,211,238,0.3)] transition-all duration-200 cursor-pointer active:scale-95 group shrink-0"
            title="Create New Audio Note"
            aria-label="Create New Audio Note"
          >
            <Plus className="w-4 h-4 text-cyan-300 group-hover:text-cyan-200 transition-transform duration-300 group-hover:rotate-90 stroke-[2.5]" />
            <span className="hidden lg:inline font-grotesk font-semibold text-xs text-[#E8EEF0] tracking-wide">
              Create Note
            </span>
          </button>

          {/* Notification Bell Dropdown */}
          {user && (
            <div className="relative shrink-0" ref={notifMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsNotifMenuOpen(!isNotifMenuOpen);
                  setIsUserMenuOpen(false);
                }}
                className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0c1f2e] border border-[#193a54] hover:border-[#91B9C5]/50 flex items-center justify-center text-[#91B9C5] hover:text-white transition-all cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-1 rounded-full bg-cyan-400 text-[#071523] text-[9px] sm:text-[10px] font-mono font-bold flex items-center justify-center shadow-lg animate-pulse">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel (Responsive width, no overflowing) */}
              {isNotifMenuOpen && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] sm:w-80 md:w-96 max-w-sm rounded-2xl bg-[#091827]/98 backdrop-blur-xl border border-[#1a3d5b] shadow-[0_20px_50px_rgba(0,0,0,0.7)] py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 pb-2.5 border-b border-[#142e44] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-cyan-300" />
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8EEF0]">
                        Notifications
                      </h4>
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await notificationService.markAllAsRead(user.id);
                            setUnreadNotifCount(0);
                            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                            toast.success('All marked as read');
                          } catch (e) {
                            console.warn(e);
                          }
                        }}
                        className="text-[10px] font-mono text-cyan-300 hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[360px] overflow-y-auto divide-y divide-[#142e44]/60 px-1 py-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs font-mono text-[#91B9C5]/60">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl transition-colors flex items-start gap-3 ${
                            n.read ? 'hover:bg-[#0c1f2e]/60 opacity-80' : 'bg-[#0c2438]/40 hover:bg-[#0c2438]/80'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#102434] border border-[#1e4566] shrink-0 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                            {n.senderAvatarUrl ? (
                              <img src={n.senderAvatarUrl} alt={n.senderDisplayName || 'User'} className="w-full h-full object-cover" />
                            ) : (
                              <span>{(n.senderDisplayName || 'S').slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-[#E8EEF0] leading-snug">
                              {n.message}
                            </p>
                            <span className="text-[10px] font-mono text-[#91B9C5]/60 mt-1 block">
                              {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </span>
                          </div>
                          {!n.read && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await notificationService.markAsRead(n.id, user.id);
                                  setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                                  setUnreadNotifCount(prev => Math.max(0, prev - 1));
                                } catch (e) {
                                  console.warn(e);
                                }
                              }}
                              className="p-1 text-[#91B9C5]/50 hover:text-cyan-300 transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile & Streak Pill with Dropdown Menu / Sign In Button */}
          {user ? (
            <div className="relative shrink-0" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 sm:gap-2 bg-[#0c1f2e] border border-[#193a54] hover:border-[#91B9C5]/50 px-1.5 sm:px-2.5 h-8 sm:h-9 rounded-full cursor-pointer transition-all group shrink-0"
                title="Account & Settings"
              >
                {/* Initials or Real Avatar circle */}
                <div className="relative w-6 h-6 rounded-full bg-[#142c40] border border-[#224869] overflow-hidden flex items-center justify-center text-[10px] font-display font-bold text-[#E8EEF0] group-hover:text-[#91B9C5] transition-colors shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                  {user.role === 'ADMIN' && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-cyan-400 border border-[#081724]" title="Admin Verified" />
                  )}
                </div>

                {/* Streak Badge: Hidden on mobile < sm to save space, only fiery orange if streak >= 7 */}
                <div className="hidden sm:flex items-center gap-1 text-xs font-grotesk font-bold">
                  <Flame className={`w-3.5 h-3.5 ${Number(streakDisplay) >= 7 ? 'text-orange-400 fill-orange-400 animate-pulse' : 'text-cyan-300 fill-cyan-300/30'}`} />
                  <span className={Number(streakDisplay) >= 7 ? 'text-orange-300' : 'text-cyan-200'}>{streakDisplay}d</span>
                </div>

                <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#91B9C5]/60 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-white' : ''}`} />
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
                    {/* Admin Console Entry (Prominently pinned at top for Admins) */}
                    {user.role === 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/30 text-cyan-300 hover:text-cyan-100 text-left transition-colors cursor-pointer font-bold mb-1 shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Admin Console</span>
                        </div>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          ADMIN
                        </span>
                      </button>
                    )}

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
                        setIsNotifMenuOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#E8EEF0] hover:bg-[#142C40] hover:text-white text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bell className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Notifications</span>
                      </div>
                      {unreadNotifCount > 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                          {unreadNotifCount}
                        </span>
                      )}
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
              className="flex items-center justify-center px-3 sm:px-4 h-8 sm:h-9 rounded-full bg-[#0c1f2e] hover:bg-[#142c40] text-[#E8EEF0] hover:text-white border border-[#1a3d5b] hover:border-[#91B9C5]/50 text-xs font-grotesk font-semibold transition-all shadow-sm cursor-pointer active:scale-95"
            >
              Sign In
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
