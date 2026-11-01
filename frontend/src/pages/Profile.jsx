import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import MusicCard from '../components/MusicCard';
import { 
  Flame, Trophy, Music, Lock, Plus, ChevronLeft, ChevronRight, 
  ChevronUp, ChevronDown, Play, Pause,
  Edit3, Bookmark, Grid, List, Sparkles, Disc, ExternalLink, Moon
} from 'lucide-react';
import { toast } from 'react-toastify';

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const WEEKDAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function Profile() {
  const { user, setUser, setStudioOpen } = useAuthStore();
  const { currentTrack, isPlaying, playTrack } = usePlayerStore();
  
  // Real calendar state (defaults to May 2026)
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(5); // 5 = May
  const [selectedDayFilter, setSelectedDayFilter] = useState(null);

  // Profile Edit modal / toggle
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || 'Linh Tran');
  const [editHandle, setEditHandle] = useState(user?.handle || '@linhtran');
  const [editBio, setEditBio] = useState(user?.bio || 'Acoustic archiver & tape bias curator based in Berlin.');
  const [editRank, setEditRank] = useState(user?.audiophileRank || 'Hi-Fi Master');

  // Vault Sub-Tabs: 'archive' (My Notes) | 'saved' (Saved Vault)
  const [activeVaultTab, setActiveVaultTab] = useState('archive');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [listActiveIndex, setListActiveIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const lastScrollTime = React.useRef(0);
  const deckContainerRef = React.useRef(null);
  const carouselStageRef = React.useRef(null);

  // User's Notes Activity (Gen Z Audiophile Memories)
  const [myNotes, setMyNotes] = useState([
    {
      id: 'my-note-1',
      dateKey: '2026-05-14',
      dayNumber: 14,
      streakLength: 7, // Reached 7-day Duolingo Super Streak milestone!
      userDisplayName: user?.displayName || 'Linh Tran',
      handle: user?.handle || '@linhtran',
      userAvatarUrl: user?.avatarUrl,
      timeAgo: '10m ago',
      orderNumber: 'ORD #0492 FOR LINH TRAN',
      songTitle: 'NIGHT DRIVE / MIDNIGHT AMBIENT',
      artistName: 'Khruangbin Vibe',
      songImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
      audioSnippetStart: '0:10',
      audioSnippetEnd: '0:40',
      templateType: 'RECEIPTIFY',
      emotionTag: '🌙 Melancholic',
      visibility: 'PUBLIC',
      lyricSnippet: 'Headlights bounce against the wet cobblestone...',
      caption: 'Headlights reflecting against empty wet asphalt at 2:15 AM.',
      likesCount: 38,
      dialogues: [],
    },
    {
      id: 'my-note-2',
      dateKey: '2026-05-13',
      dayNumber: 13,
      streakLength: 6,
      userDisplayName: user?.displayName || 'Linh Tran',
      handle: user?.handle || '@linhtran',
      userAvatarUrl: user?.avatarUrl,
      timeAgo: '1d ago',
      songTitle: 'PINK MOON ACOUSTIC',
      artistName: 'Nick Drake Style',
      songImageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
      audioSnippetStart: '0:15',
      audioSnippetEnd: '0:45',
      templateType: 'CASSETTE',
      emotionTag: '🍷 Bittersweet',
      visibility: 'FRIENDS',
      lyricSnippet: 'Pink moon is on its way, none stand so tall.',
      caption: 'Morning tea with warm acoustic tones before city wakes up.',
      likesCount: 29,
      dialogues: [],
    },
    {
      id: 'my-note-3',
      dateKey: '2026-05-12',
      dayNumber: 12,
      streakLength: 5,
      userDisplayName: user?.displayName || 'Linh Tran',
      handle: user?.handle || '@linhtran',
      userAvatarUrl: user?.avatarUrl,
      timeAgo: '2d ago',
      songTitle: 'HOLOCENE ACOUSTIC CHILL',
      artistName: 'Bon Iver Style',
      songImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500',
      audioSnippetStart: '0:30',
      audioSnippetEnd: '1:00',
      templateType: 'STAMP',
      emotionTag: '🍃 Peaceful',
      visibility: 'PUBLIC',
      lyricSnippet: 'And at once I knew I was not magnificent.',
      caption: 'Cold acoustic air rolling off the pines in Bergen.',
      likesCount: 42,
      dialogues: [],
    },
    {
      id: 'my-note-4',
      dateKey: '2026-05-07',
      dayNumber: 7,
      streakLength: 7, // Day 7 Super Streak Golden Milestone!
      userDisplayName: user?.displayName || 'Linh Tran',
      handle: user?.handle || '@linhtran',
      userAvatarUrl: user?.avatarUrl,
      timeAgo: '7d ago',
      songTitle: 'WEIGHTLESS CHILL DUB',
      artistName: 'Marconi Union',
      songImageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500',
      audioSnippetStart: '0:20',
      audioSnippetEnd: '0:50',
      templateType: 'RECEIPTIFY',
      emotionTag: '🌊 Ocean Ambient',
      visibility: 'PUBLIC',
      lyricSnippet: 'Submerging completely into zero gravity.',
      caption: 'Day 7 streak milestone achieved with ambient bliss.',
      likesCount: 56,
      dialogues: [],
    },
    {
      id: 'my-note-5',
      dateKey: '2026-05-05',
      dayNumber: 5,
      streakLength: 1,
      userDisplayName: user?.displayName || 'Linh Tran',
      handle: user?.handle || '@linhtran',
      userAvatarUrl: user?.avatarUrl,
      timeAgo: '9d ago',
      songTitle: 'COFFEE & VINYL CRACKLES',
      artistName: 'Otis Redding Vibe',
      songImageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
      audioSnippetStart: '0:10',
      audioSnippetEnd: '0:40',
      templateType: 'CASSETTE',
      emotionTag: '☕ Lo-Fi Warmth',
      visibility: 'FRIENDS',
      lyricSnippet: 'Another cup of coffee on a slow rainy morning.',
      caption: 'Analog tape warmth filling the room.',
      likesCount: 31,
      dialogues: [],
    },
  ]);

  const savedNotes = [
    {
      id: 'saved-note-1',
      userDisplayName: 'Marcus Webb',
      handle: '@marcusw',
      timeAgo: '3d ago',
      songTitle: 'ALBERTO BALSALM TAPE DUB',
      artistName: 'Aphex Vibe',
      songImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500',
      templateType: 'CASSETTE',
      emotionTag: '💬 Nostalgic',
      visibility: 'FRIENDS',
      lyricSnippet: 'Late night tea, rainy windows in Berlin.',
      caption: 'Cleaning tape heads with isopropyl and savoring quiet.',
      likesCount: 16,
      dialogues: [],
    },
    {
      id: 'saved-note-2',
      userDisplayName: 'Elena Rostova',
      handle: '@erostova',
      timeAgo: '5d ago',
      songTitle: 'WEIGHTLESS AMBIENT (VINYL)',
      artistName: 'Marconi Union',
      songImageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500',
      templateType: 'RECEIPTIFY',
      emotionTag: '🌊 Ocean Ambient',
      visibility: 'PUBLIC',
      lyricSnippet: 'Submerging completely into zero gravity.',
      caption: 'Recorded straight from vintage vinyl found in Shibuya.',
      likesCount: 22,
      dialogues: [],
    },
    {
      id: 'saved-note-3',
      userDisplayName: 'Luna Astralis',
      handle: '@lunaa',
      timeAgo: '1w ago',
      songTitle: 'MIDNIGHT CITY (SLOWED)',
      artistName: 'M83 Vibe',
      songImageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
      templateType: 'STAMP',
      emotionTag: '✨ Dream Glow',
      visibility: 'PUBLIC',
      lyricSnippet: 'The city is my church in blinding twilight.',
      caption: 'Late night drive aesthetic.',
      likesCount: 51,
      dialogues: [],
    },
  ];

  // Exact number of days in chosen month (Dynamic: 28, 29, 30, 31)
  const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  // Day of week of the 1st of the month (Mon=0, Tue=1, ..., Sun=6)
  const firstDayOfWeek = (new Date(selectedYear, selectedMonth - 1, 1).getDay() + 6) % 7;

  // Previous month total days (for calendar padding cells)
  const prevMonthDays = new Date(selectedYear, selectedMonth - 1, 0).getDate();

  // Current calendar viewing state
  const isCurrentViewMonth = selectedMonth === 5 && selectedYear === 2026;
  const TODAY_DAY = 14;

  // Navigation handlers for months
  const handlePrevMonth = () => {
    setSelectedDayFilter(null);
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDayFilter(null);
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  // Find note for specific day
  const getNoteForDay = (dayNum) => {
    if (selectedMonth === 5 && selectedYear === 2026) {
      return myNotes.find(n => n.dayNumber === dayNum);
    }
    return null;
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = {
      ...user,
      displayName: editName.trim() || 'Linh Tran',
      handle: editHandle.trim().startsWith('@') ? editHandle.trim() : `@${editHandle.trim()}`,
      bio: editBio.trim(),
      audiophileRank: editRank.trim(),
    };
    setUser(updated);
    setIsEditingProfile(false);
    toast.success("Profile updated successfully! ✨");
  };

  // Filter notes based on selected day (if any)
  const displayedNotes = activeVaultTab === 'archive'
    ? (selectedDayFilter
        ? myNotes.filter(n => n.dayNumber === selectedDayFilter)
        : myNotes)
    : savedNotes;

  // List View auto-music sync: When in list view, active note plays in PlayerDock
  React.useEffect(() => {
    if (viewMode === 'list' && displayedNotes && displayedNotes[listActiveIndex]) {
      const active = displayedNotes[listActiveIndex];
      playTrack({
        id: active.id,
        songTitle: active.songTitle,
        artistName: `${active.artistName} • Lossless 24-Bit DAC`,
        songImageUrl: active.songImageUrl,
        audioSnippetStart: active.audioSnippetStart || '0:10',
        duration: 162,
      });
    }
  }, [viewMode, listActiveIndex, displayedNotes]);

  // Auto-Play: Automatically advances to next note every 5s if active
  React.useEffect(() => {
    if (!isAutoPlay || viewMode !== 'list' || !displayedNotes || displayedNotes.length <= 1) return;
    const timer = setInterval(() => {
      setListActiveIndex((prev) => (prev + 1) % displayedNotes.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlay, viewMode, displayedNotes]);

  // Keyboard navigation (ArrowLeft / ArrowRight or A / D to glide notes horizontally)
  React.useEffect(() => {
    if (viewMode !== 'list') return;
    const handleKeyDown = (e) => {
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (['ArrowRight', 'KeyD'].includes(e.code) || ['ArrowRight', 'd', 'D'].includes(e.key)) {
        setListActiveIndex((prev) => Math.min(prev + 1, displayedNotes.length - 1));
      } else if (['ArrowLeft', 'KeyA'].includes(e.code) || ['ArrowLeft', 'a', 'A'].includes(e.key)) {
        setListActiveIndex((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, displayedNotes.length]);

  const currentStreak = user?.streakDays || 14;
  const bestStreak = user?.bestStreakDays || 28;
  const loggedNotesCount = myNotes.length;

  return (
    <div className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 space-y-6">
      
      {/* ======================================================== */}
      {/* 1. STREAMLINED COMPACT HERO HEADER (Saves Vertical Space) */}
      {/* ======================================================== */}
      <div className="bg-[#0c1f2e] border border-[#16354d]/90 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
        
        {/* Left: Avatar + Details */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-b from-[#142c40] to-[#091724] border-2 border-[#1e4566] flex items-center justify-center shadow-xl">
              <span className="font-display text-2xl font-extrabold text-[#E8EEF0]">
                LT
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#B39DDB] text-[#081724] flex items-center justify-center shadow-md border border-white/40">
              <Sparkles className="w-3.5 h-3.5 text-[#081724]" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-[#E8EEF0] tracking-tight">
                {user?.displayName || "Linh Tran"}
              </h1>
              <span className="text-xs font-grotesk font-semibold text-[#91B9C5] tracking-tight">
                {user?.handle || "@linhtran"}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#142c40] border border-[#204a6d] text-[10px] font-grotesk font-bold text-[#91B9C5] uppercase tracking-wide">
                {user?.audiophileRank || "Hi-Fi Master"}
              </span>
            </div>
            <p className="text-xs text-[#91B9C5]/80 max-w-md line-clamp-1 font-sans">
              {user?.bio || "Acoustic archiver & tape bias curator based in Berlin."}
            </p>
          </div>
        </div>

        {/* Right: Quick Stats & Edit Button */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 text-xs font-grotesk text-[#91B9C5]/90 border-r border-[#16354d] pr-4">
            <span>Member <strong className="text-[#E8EEF0] font-semibold">{user?.memberId || "#0492"}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Streak: <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              <strong className="text-[#E8EEF0] font-semibold">{currentStreak}d</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Published: <strong className="text-[#E8EEF0] font-semibold">{loggedNotesCount} Notes</strong>
            </span>
          </div>

          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#142c40] hover:bg-[#1a3d5b] border border-[#234d70] text-xs font-grotesk font-semibold text-[#E8EEF0] transition-all cursor-pointer shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#91B9C5]" />
            <span>{isEditingProfile ? "Close Edit" : "Edit Profile"}</span>
          </button>
        </div>

      </div>

      {/* Inline Edit Form when active */}
      {isEditingProfile && (
        <form onSubmit={handleSaveProfile} className="bg-[#091827] border border-[#1b3e5a] rounded-2xl p-5 space-y-3 animate-in fade-in duration-200 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-grotesk uppercase text-[#91B9C5]/70 mb-1">Display Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-[#081724] border border-[#1b3d59] rounded-xl px-3 py-2 text-xs text-[#E8EEF0] focus:outline-none focus:border-[#91B9C5]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-grotesk uppercase text-[#91B9C5]/70 mb-1">Handle</label>
              <input
                type="text"
                value={editHandle}
                onChange={(e) => setEditHandle(e.target.value)}
                className="w-full bg-[#081724] border border-[#1b3d59] rounded-xl px-3 py-2 text-xs font-grotesk text-[#E8EEF0] focus:outline-none focus:border-[#91B9C5]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-grotesk uppercase text-[#91B9C5]/70 mb-1">Bio</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={2}
              className="w-full bg-[#081724] border border-[#1b3d59] rounded-xl px-3 py-2 text-xs text-[#E8EEF0] focus:outline-none focus:border-[#91B9C5]"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-[#91B9C5] text-[#081724] font-bold text-xs font-grotesk transition-colors cursor-pointer shadow"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditingProfile(false)}
              className="px-3 py-1.5 rounded-xl bg-[#142c40] text-[#91B9C5] text-xs font-grotesk transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 2. GEN-Z ARTISTIC STREAK CALENDAR (Real Weekday Grid)    */}
      {/* ======================================================== */}
      <section className="bg-[#0c1f2e] border border-[#16354d]/90 rounded-2xl p-5 sm:p-6 shadow-xl snap-start scroll-mt-20 sm:scroll-mt-24">
        
        {/* Top Header & 3 Duolingo Metric Boxes */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-orange-400 fill-orange-400 animate-pulse" />
              <h2 className="text-lg sm:text-xl font-display font-bold text-[#E8EEF0] tracking-tight">
                Sonic Aura Calendar & Music Streak
              </h2>
            </div>
            <p className="text-xs text-[#91B9C5]/70 font-sans">
              Interactive audio diary calendar. Click any highlighted date to filter your notes below.
            </p>
          </div>

          {/* 3 Metrics: Streak, Best, Notes */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-[#081724] border border-[#173852] text-center min-w-[85px] shadow-sm">
              <span className="text-[9px] font-grotesk text-[#91B9C5]/70 uppercase tracking-widest block font-medium">STREAK</span>
              <div className="flex items-center justify-center gap-1 font-grotesk font-bold text-xs text-[#E8EEF0] mt-0.5">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                <span>{currentStreak} Days</span>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-[#081724] border border-[#173852] text-center min-w-[85px] shadow-sm">
              <span className="text-[9px] font-grotesk text-[#91B9C5]/70 uppercase tracking-widest block font-medium">BEST</span>
              <div className="flex items-center justify-center gap-1 font-grotesk font-bold text-xs text-[#E8EEF0] mt-0.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>{bestStreak} Days</span>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-[#081724] border border-[#173852] text-center min-w-[85px] shadow-sm">
              <span className="text-[9px] font-grotesk text-[#91B9C5]/70 uppercase tracking-widest block font-medium">NOTES</span>
              <div className="flex items-center justify-center gap-1 font-grotesk font-bold text-xs text-[#E8EEF0] mt-0.5">
                <Music className="w-3.5 h-3.5 text-[#91B9C5]" />
                <span>{loggedNotesCount} Logged</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-bar: Month Navigation on Left & Legend on Right */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 mb-4 border-b border-[#142c40]">
          
          {/* Month Selector with Prev/Next Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-lg bg-[#081724] hover:bg-[#142c40] border border-[#193a54] flex items-center justify-center text-[#91B9C5] transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-display font-bold text-xs sm:text-sm text-[#E8EEF0] tracking-wider px-2">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>

            <button
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-lg bg-[#081724] hover:bg-[#142c40] border border-[#193a54] flex items-center justify-center text-[#91B9C5] transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Duolingo & Locket Gamified Legend */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-grotesk">
            <span className="px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/60 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.25)] flex items-center gap-1.5 font-bold font-display">
              <Trophy className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>7-Day Gold Streak 🔥</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)] flex items-center gap-1.5 font-bold">
              <Music className="w-3 h-3 text-cyan-300" />
              <span>Note Posted</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-400/60 text-orange-300 shadow-[0_0_10px_rgba(251,146,60,0.2)] flex items-center gap-1.5 font-bold">
              <Flame className="w-3 h-3 text-orange-400 fill-orange-400 animate-pulse" />
              <span>Today</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#050e17] border border-dashed border-[#1a384e] text-slate-400 flex items-center gap-1.5 font-medium">
              <Moon className="w-3 h-3 text-slate-400" />
              <span>Rest Day</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10 text-slate-500 flex items-center gap-1.5 font-medium">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Future</span>
            </span>
          </div>
        </div>

        {/* WEEKDAY COLUMN HEADERS (Mon - Sun True Calendar Alignment) */}
        <div className="grid grid-cols-7 gap-2 sm:gap-2.5 mb-2 px-1 text-center font-grotesk text-[10px] sm:text-[11px] font-bold text-[#91B9C5]/70 tracking-widest uppercase">
          {WEEKDAY_NAMES.map((w) => (
            <div key={w} className="py-0.5">
              {w}
            </div>
          ))}
        </div>

        {/* PANORAMIC CALENDAR MATRIX: 7-Columns Staggered with Weekday Offset */}
        <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
          
          {/* 1. PREVIOUS MONTH PADDING CELLS (Staggers Day 1 to its exact day of the week) */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => {
            const prevDayNum = prevMonthDays - firstDayOfWeek + i + 1;
            return (
              <div
                key={`pad-${i}`}
                className="relative aspect-square rounded-2xl bg-[#06121d]/30 border border-[#0f2436]/40 p-2 flex flex-col justify-between opacity-30 select-none cursor-not-allowed"
              >
                <span className="text-[9px] font-grotesk font-medium text-slate-500">
                  {prevDayNum}
                </span>
                <div className="flex items-center justify-center my-auto">
                  <span className="w-1 h-1 rounded-full bg-slate-800" />
                </div>
                <div />
              </div>
            );
          })}

          {/* 2. CURRENT MONTH DAYS (Square tiles matching 1:1 vinyl album sleeve aspect ratio) */}
          {Array.from({ length: totalDaysInMonth }, (_, i) => {
            const dayNum = i + 1;
            const hasNote = getNoteForDay(dayNum);
            
            // DUOLINGO 7-DAY STREAK RULE: Day 7 & 14 reached 7+ sustained days!
            const is7DayStreak = hasNote && hasNote.streakLength >= 7;
            const isToday = isCurrentViewMonth && dayNum === TODAY_DAY;
            const isPast = isCurrentViewMonth ? dayNum < TODAY_DAY : (selectedYear < 2026 || (selectedYear === 2026 && selectedMonth < 5));
            const isFuture = isCurrentViewMonth ? dayNum > TODAY_DAY : (selectedYear > 2026 || (selectedYear === 2026 && selectedMonth > 5));
            const isSelected = selectedDayFilter === dayNum;

            return (
              <div
                key={dayNum}
                onClick={() => {
                  if (hasNote) {
                    setSelectedDayFilter(selectedDayFilter === dayNum ? null : dayNum);
                    setTimeout(() => {
                      carouselStageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 60);
                  } else if (isToday) {
                    setStudioOpen(true);
                  }
                }}
                className={`relative aspect-square rounded-2xl flex flex-col justify-between p-2 sm:p-2.5 transition-all duration-300 cursor-pointer overflow-hidden group ${
                  isSelected
                    ? 'ring-4 ring-[#91B9C5] shadow-[0_0_28px_rgba(145,185,197,0.7)] scale-105 z-20'
                    : 'hover:scale-[1.03] hover:z-10'
                } ${
                  /* GOLD STREAK: Glowing golden frame when streak >= 7 */
                  is7DayStreak
                    ? 'border-2 border-amber-300 shadow-[0_0_26px_rgba(251,191,36,0.65)] ring-2 ring-amber-400/50 bg-gradient-to-t from-amber-600/35 via-[#0e2436] to-[#0a1b29]'
                    /* Regular note posted: Neon Cyan outline with artwork */
                    : hasNote
                    ? 'border-2 border-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.4)] ring-1 ring-cyan-400/40 bg-[#0e2436]'
                    /* Today without note: Glowing action prompt to save streak */
                    : isToday
                    ? 'border-2 border-dashed border-orange-400/90 bg-gradient-to-t from-orange-500/20 via-[#0c1f2e] to-[#091826] shadow-[0_0_24px_rgba(251,146,60,0.45)] animate-pulse'
                    /* Future locked day: Translucent blueprint glass */
                    : isFuture
                    ? 'bg-white/[0.015] border border-white/[0.07] backdrop-blur-[1px] hover:border-white/20 opacity-55 hover:opacity-80'
                    /* Past unposted missed day: Tactile dark matte slate with dashed border */
                    : 'bg-[#050e17] border border-dashed border-[#1a384e]/90 hover:border-slate-500/60 opacity-80 hover:opacity-100'
                }`}
              >
                {/* 1. CRYSTAL-CLEAR ALBUM ARTWORK FOR LOGGED DAYS */}
                {hasNote && hasNote.songImageUrl && (
                  <>
                    <img
                      src={hasNote.songImageUrl}
                      alt={hasNote.songTitle}
                      className="absolute inset-0 w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-110 z-0"
                    />
                    {/* Aesthetic gradient overlay to preserve image vibrance while keeping labels readable */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 rounded-2xl z-[1]" />
                  </>
                )}

                {/* 2. TOP FLOATING STREAK TAG */}
                <div className="relative z-10 flex items-center justify-between w-full">
                  <span className={`text-[9px] font-grotesk font-extrabold px-1.5 py-0.5 rounded-md backdrop-blur-md shadow-sm border ${
                    is7DayStreak
                      ? 'bg-amber-950/90 text-amber-300 border-amber-400/70'
                      : hasNote
                      ? 'bg-black/75 text-white border-white/20'
                      : isToday
                      ? 'bg-orange-950/90 text-orange-300 border-orange-400/70 font-bold'
                      : isFuture
                      ? 'bg-white/[0.03] text-slate-500 border-white/10'
                      : 'bg-[#091a27] text-slate-400 border-slate-700/60'
                  }`}>
                    {isToday ? 'TODAY' : `DAY ${dayNum}`}
                  </span>

                  {/* Top Right Streak Status Tag */}
                  {is7DayStreak ? (
                    <span className="text-[9px] font-display font-extrabold bg-gradient-to-r from-amber-400 to-yellow-300 text-black px-1.5 py-0.5 rounded-md shadow-md flex items-center gap-1 animate-pulse">
                      <Trophy className="w-2.5 h-2.5 fill-black" />
                      <span>7d Gold</span>
                    </span>
                  ) : hasNote ? (
                    <span className="text-[9px] font-grotesk font-bold text-cyan-200 bg-cyan-950/80 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-cyan-400/50 flex items-center gap-0.5 shadow-sm">
                      <Music className="w-2.5 h-2.5 text-cyan-300" />
                      <span>Logged</span>
                    </span>
                  ) : isToday ? (
                    <span className="text-[9px] font-grotesk font-bold text-orange-300 bg-orange-950/90 border border-orange-400/50 px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow">
                      <Flame className="w-2.5 h-2.5 text-orange-400 fill-orange-400" />
                      <span>Save</span>
                    </span>
                  ) : isPast ? (
                    <span className="text-[8px] font-grotesk text-slate-400 bg-slate-900/80 px-1 py-0.5 rounded border border-slate-800">
                      Rest
                    </span>
                  ) : null}
                </div>

                {/* 3. CENTER STATE */}
                {!hasNote && (
                  <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                    {isToday ? (
                      <div className="flex flex-col items-center gap-1 text-center">
                        <div className="w-7 h-7 rounded-full bg-orange-500/25 border-2 border-orange-400 flex items-center justify-center text-orange-400 shadow-md">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-[8.5px] font-grotesk font-extrabold text-orange-300 tracking-wider">
                          LOG NOTE
                        </span>
                      </div>
                    ) : isFuture ? (
                      <div className="flex flex-col items-center gap-1 text-center">
                        <div className="w-6 h-6 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-slate-300 transition-colors">
                          <Lock className="w-3 h-3 text-slate-500" />
                        </div>
                        <span className="text-[8px] font-grotesk uppercase tracking-wider text-slate-500 font-medium">
                          LOCKED
                        </span>
                      </div>
                    ) : (
                      /* Past missed day: Clear tactile rest moon & label */
                      <div className="flex flex-col items-center gap-1 text-center">
                        <Moon className="w-4 h-4 text-slate-500/90 group-hover:text-cyan-300 transition-colors" />
                        <span className="text-[8px] font-grotesk uppercase tracking-wider text-slate-500 font-semibold">
                          REST DAY
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. BOTTOM ARTISTIC TRACK LABEL */}
                {hasNote ? (
                  <div className="relative z-10 w-full text-left pt-1 flex items-end justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-[9px] font-extrabold text-white truncate leading-tight drop-shadow-md">
                        {hasNote.songTitle}
                      </p>
                      <p className="text-[8px] text-[#91B9C5] truncate font-grotesk drop-shadow">
                        {hasNote.artistName}
                      </p>
                    </div>

                    {/* Animated Mini Equalizer if current track is playing */}
                    {currentTrack?.id === hasNote.id && isPlaying ? (
                      <div className="flex items-end gap-0.5 h-2.5 shrink-0 mb-0.5">
                        <span className="w-0.5 bg-cyan-300 rounded-full h-full animate-bounce" />
                        <span className="w-0.5 bg-cyan-300 rounded-full h-2 animate-bounce delay-75" />
                        <span className="w-0.5 bg-cyan-300 rounded-full h-1.5 animate-bounce delay-150" />
                      </div>
                    ) : (
                      <Disc className="w-3 h-3 text-[#91B9C5]/70 shrink-0 mb-0.5 group-hover:rotate-45 transition-transform" />
                    )}
                  </div>
                ) : isPast ? (
                  <div className="relative z-10 w-full text-center pb-0.5">
                    <span className="text-[7.5px] font-grotesk text-slate-400">
                      No memory logged
                    </span>
                  </div>
                ) : isFuture ? (
                  <div className="relative z-10 w-full text-center pb-0.5">
                    <span className="text-[7.5px] font-grotesk text-slate-500/70">
                      Unlocks midnight
                    </span>
                  </div>
                ) : (
                  <div className="h-2" />
                )}

              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. NOTES VAULT SECTION (Screenshot 3 & 4)                */}
      {/* ======================================================== */}
      <section
        ref={carouselStageRef}
        className={`space-y-3 ${
          viewMode === 'list'
            ? 'min-h-[calc(100vh-148px)] flex flex-col justify-center snap-start scroll-mt-20'
            : ''
        }`}
      >
        
        {/* Vault Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Sub-Tabs: My Music Notes Archive | Saved Notes Vault */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveVaultTab('archive');
                setSelectedDayFilter(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-grotesk font-bold transition-all cursor-pointer ${
                activeVaultTab === 'archive'
                  ? 'bg-[#183952] text-[#E8EEF0] border border-[#235073] shadow-md'
                  : 'bg-[#0c1f2e] text-[#91B9C5]/70 hover:text-white border border-[#16354d]'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-[#91B9C5]" />
              <span>My Music Notes Archive ({myNotes.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveVaultTab('saved');
                setSelectedDayFilter(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-grotesk font-bold transition-all cursor-pointer ${
                activeVaultTab === 'saved'
                  ? 'bg-[#183952] text-[#E8EEF0] border border-[#235073] shadow-md'
                  : 'bg-[#0c1f2e] text-[#91B9C5]/70 hover:text-white border border-[#16354d]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-[#B39DDB]" />
              <span>Saved Notes Vault ({savedNotes.length})</span>
            </button>
          </div>

          {/* View Toggles & Clear Filter */}
          <div className="flex items-center gap-2">
            {selectedDayFilter && (
              <button
                onClick={() => setSelectedDayFilter(null)}
                className="text-[10px] font-grotesk text-[#91B9C5] hover:text-white px-2.5 py-1 bg-[#142c40] rounded-lg border border-[#1d4363] cursor-pointer"
              >
                Clear Day {selectedDayFilter} Filter ×
              </button>
            )}

            <div className="flex items-center gap-1 bg-[#0c1f2e] p-1 rounded-xl border border-[#16354d]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-[#183952] text-white' : 'text-[#91B9C5]/60 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-[#183952] text-white' : 'text-[#91B9C5]/60 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Note Cards Rendering: Grid vs Scroll-to-Listen List */}
        {displayedNotes.length === 0 ? (
          <div className="p-12 text-center bg-[#0c1f2e] border border-[#16354d] rounded-2xl">
            <p className="text-xs font-grotesk text-[#91B9C5]/60">
              No music notes found for Day {selectedDayFilter}.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center w-full">
            {displayedNotes.map((note) => (
              <MusicCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          /* 3D GLASS FLYING COVER FLOW: Smooth horizontal slide & flight between records */
          <div className="relative flex flex-col items-center justify-center py-1 w-full select-none overflow-hidden">
            
            {/* Minimalist Top Control Bar */}
            <div className="flex items-center justify-between w-full max-w-[500px] mb-4 px-2 text-xs font-grotesk z-30">
              {/* Track Counter */}
              <span className="flex items-center gap-2 font-bold text-[#E8EEF0]">
                <Disc className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                <span>Archive Track {listActiveIndex + 1} of {displayedNotes.length}</span>
              </span>

              {/* Minimalist Unified Control Pill: Auto-Play toggle + Navigation Chevrons */}
              <div className="flex items-center bg-[#0c1f2e] border border-[#16354d] rounded-full p-0.5 shadow-lg">
                <button
                  onClick={() => setIsAutoPlay(!isAutoPlay)}
                  className={`flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-grotesk font-semibold transition-all cursor-pointer ${
                    isAutoPlay
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                      : 'text-[#91B9C5]/80 hover:text-white'
                  }`}
                  title={isAutoPlay ? 'Pause Auto-Play' : 'Enable Auto-Play'}
                >
                  {isAutoPlay ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      <span>Auto-Playing</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current text-cyan-400" />
                      <span>Auto-Play</span>
                    </>
                  )}
                </button>

                {/* Subtle Divider */}
                <div className="w-[1px] h-3.5 bg-[#1b3d58] mx-1" />

                {/* Harmonized Left / Right Navigation Chevrons */}
                <div className="flex items-center">
                  <button
                    onClick={() => setListActiveIndex((prev) => Math.max(prev - 1, 0))}
                    disabled={listActiveIndex === 0}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[#91B9C5] hover:text-white hover:bg-[#142c40] disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Previous Record (← / A)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setListActiveIndex((prev) => Math.min(prev + 1, displayedNotes.length - 1))}
                    disabled={listActiveIndex === displayedNotes.length - 1}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[#91B9C5] hover:text-white hover:bg-[#142c40] disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Next Record (→ / D)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 3D Flying Carousel Track with Smooth Physical Momentum */}
            <div className="relative w-full h-[485px] flex items-center justify-center my-1 overflow-hidden [perspective:1400px] [transform-style:preserve-3d]">
              {displayedNotes.map((note, idx) => {
                const offset = idx - listActiveIndex;
                const absOffset = Math.abs(offset);

                // Calculate smooth 3D spatial properties
                let translateX = 0;
                let translateZ = 0;
                let rotateY = 0;
                let scale = 1;
                let opacity = 1;
                let zIndex = 30;

                if (offset === 0) {
                  translateX = 0;
                  translateZ = 30;
                  rotateY = 0;
                  scale = 1;
                  opacity = 1;
                  zIndex = 30;
                } else if (absOffset === 1) {
                  translateX = offset > 0 ? 275 : -275;
                  translateZ = -70;
                  rotateY = offset > 0 ? -16 : 16;
                  scale = 0.88;
                  opacity = 0.55;
                  zIndex = 20;
                } else if (absOffset === 2) {
                  translateX = offset > 0 ? 470 : -470;
                  translateZ = -160;
                  rotateY = offset > 0 ? -25 : 25;
                  scale = 0.74;
                  opacity = 0.18;
                  zIndex = 10;
                } else {
                  // Far off notes stay mounted for seamless entry/exit interpolation
                  translateX = offset * 290;
                  translateZ = -280;
                  rotateY = offset > 0 ? -30 : 30;
                  scale = 0.6;
                  opacity = 0;
                  zIndex = 1;
                }

                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      if (offset !== 0) setListActiveIndex(idx);
                    }}
                    className={`absolute top-0 transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      offset !== 0 ? 'cursor-pointer select-none group' : 'z-30'
                    }`}
                    style={{
                      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                      zIndex,
                      opacity,
                      filter: offset === 0 ? 'none' : 'blur(0.4px)',
                      pointerEvents: absOffset > 2 ? 'none' : 'auto',
                      willChange: 'transform, opacity',
                    }}
                  >
                    <div className={offset !== 0 ? 'pointer-events-none' : ''}>
                      <MusicCard note={note} />
                    </div>

                    {/* Frosted Glass Reflection Overlay on Peeking Preview Notes */}
                    {offset !== 0 && (
                      <div className="absolute inset-0 rounded-[22px] bg-white/[0.04] backdrop-blur-[2px] border border-white/10 group-hover:bg-white/[0.1] transition-all" />
                    )}

                    {/* Ambient Floor Reflection under Active Center Note */}
                    {offset === 0 && (
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-6 bg-gradient-to-t from-transparent via-cyan-400/15 to-transparent blur-md pointer-events-none rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </section>

    </div>
  );
}
