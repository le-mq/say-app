import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { noteService } from '../services/noteService';
import MusicCard from '../components/MusicCard';
import { ChevronUp, ChevronDown, Sparkles, Disc, Play } from 'lucide-react';

const INITIAL_FEED_NOTES = [
  {
    id: 'note-0492',
    userDisplayName: 'Linh Tran',
    handle: '@linhtran',
    userAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    timeAgo: '10m ago',
    orderNumber: 'ORD #0492 FOR LINH TRAN',
    songTitle: 'NIGHT DRIVE / MIDNIGHT AMBIENT',
    artistName: 'KHRUANGBIN VIBE',
    songImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
    externalSongUrl: 'https://open.spotify.com',
    audioSnippetStart: '0:10',
    audioSnippetEnd: '0:40',
    templateType: 'RECEIPTIFY',
    emotionTag: '🌙 Melancholic',
    lyricSnippet: 'Headlights bounce against the wet cobblestone...',
    caption: 'Headlights reflecting against empty wet asphalt at 2:15 AM.',
    likesCount: 38,
    dialogues: [
      {
        id: 'd1',
        author: 'Sora Tanaka',
        song: 'Alberto Balsalm Tape Dub',
        caption: 'Alberto Balsalm pairs seamlessly with this late night road reflection.',
      },
      {
        id: 'd2',
        author: 'Marcus Webb',
        song: 'Holocene Acoustic Chill',
        caption: 'This intro always gives me chills on dark highway stretches.',
      },
    ],
  },
  {
    id: 'note-0493',
    userDisplayName: 'Marcus Webb',
    handle: '@marcusw',
    userAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    timeAgo: '2h ago',
    songTitle: 'ALBERTO BALSALM TAPE DUB',
    artistName: 'Aphex Vibe',
    songImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500',
    externalSongUrl: 'https://open.spotify.com',
    audioSnippetStart: '0:15',
    audioSnippetEnd: '0:45',
    templateType: 'CASSETTE',
    emotionTag: '💬 Nostalgic',
    visibility: 'FRIENDS',
    lyricSnippet: 'Late night tea, rainy windows in Berlin.',
    caption: 'Cleaning tape heads with isopropyl and savoring quiet.',
    likesCount: 24,
    dialogues: [],
  },
  {
    id: 'note-0494',
    userDisplayName: 'Elena Rostova',
    handle: '@erostova',
    userAvatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
    timeAgo: '5h ago',
    songTitle: 'HOLOCENE ACOUSTIC CHILL',
    artistName: 'Bon Iver Style',
    songImageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500',
    externalSongUrl: 'https://open.spotify.com',
    audioSnippetStart: '0:30',
    audioSnippetEnd: '1:00',
    templateType: 'STAMP',
    emotionTag: '🍃 Peaceful',
    lyricSnippet: 'And at once I knew I was not magnificent.',
    caption: 'Fog rolling off the pines in Bergen. Cold acoustic air.',
    likesCount: 19,
    dialogues: [],
  },
];

export default function Feed() {
  const { user } = useAuthStore();
  const { playTrack, loadTrack, isPlaying } = usePlayerStore();
  const [notes, setNotes] = useState(INITIAL_FEED_NOTES);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const lastScrollTime = useRef(0);
  const touchStartY = useRef(0);
  const hasUserStartedPlayingRef = useRef(false);

  // Track when user actively triggers playback
  useEffect(() => {
    if (isPlaying) {
      hasUserStartedPlayingRef.current = true;
    }
  }, [isPlaying]);

  // Dynamic Generator for Infinite Audiophile Stream (Never runs out)
  const generateMoreNotes = (batchNum) => [
    {
      id: `inf-${batchNum}-1`,
      userDisplayName: 'Sora Tanaka',
      handle: '@sorat',
      userAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      timeAgo: 'Just now',
      orderNumber: `ORD #${1000 + batchNum * 3} FOR SORA TANAKA`,
      songTitle: 'RESONANCE VINTAGE CASSETTE',
      artistName: 'Home Vibe',
      songImageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
      audioSnippetStart: '0:20',
      audioSnippetEnd: '0:50',
      templateType: 'CASSETTE',
      emotionTag: '🌌 Retro Wave',
      visibility: 'PUBLIC',
      lyricSnippet: 'Neon lights cascading over rainy glass...',
      caption: 'Rewound to 1984 on chrome type II tape.',
      likesCount: 52,
      dialogues: [],
    },
    {
      id: `inf-${batchNum}-2`,
      userDisplayName: 'Julian Gray',
      handle: '@jgray',
      userAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      timeAgo: '15m ago',
      orderNumber: `ORD #${1001 + batchNum * 3} FOR JULIAN GRAY`,
      songTitle: 'SLOW DANCING IN AMBIENT HAZE',
      artistName: 'Joji Style',
      songImageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
      audioSnippetStart: '0:15',
      audioSnippetEnd: '0:45',
      templateType: 'RECEIPTIFY',
      emotionTag: '🍷 Bittersweet',
      visibility: 'FRIENDS',
      lyricSnippet: 'Give me reasons we should be complete...',
      caption: 'Analog piano echoing in an empty warehouse.',
      likesCount: 64,
      dialogues: [],
    },
    {
      id: `inf-${batchNum}-3`,
      userDisplayName: 'Aria Chen',
      handle: '@ariac',
      userAvatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
      timeAgo: '42m ago',
      orderNumber: `ORD #${1002 + batchNum * 3} FOR ARIA CHEN`,
      songTitle: 'A WALK IN THE PACIFIC RAIN',
      artistName: 'Tycho Ambient',
      songImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500',
      audioSnippetStart: '0:30',
      audioSnippetEnd: '1:00',
      templateType: 'STAMP',
      emotionTag: '🌲 Pine Woods',
      visibility: 'PUBLIC',
      lyricSnippet: 'Gentle synths washing over mossy stone...',
      caption: 'Morning rain on coastal redwood trail.',
      likesCount: 71,
      dialogues: [],
    },
  ];

  useEffect(() => {
    async function loadFeed() {
      try {
        const backendNotes = await noteService.getPublicFeed();
        if (backendNotes && backendNotes.length > 0) {
          setNotes(backendNotes);
        }
      } catch (e) {
        // Fallback to initial notes matching screenshots
      }
    }
    loadFeed();
  }, []);

  // Infinite Scroll Trigger: As user approaches end, seamlessly append more notes
  useEffect(() => {
    if (activeIndex >= notes.length - 2) {
      const nextBatch = Math.floor(notes.length / 3) + 1;
      setNotes((prev) => [...prev, ...generateMoreNotes(nextBatch)]);
    }
  }, [activeIndex, notes.length]);

  // Delicate Auto-play for Feed: automatically scrolls down to next note every 6s
  useEffect(() => {
    if (!isAutoPlay) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => prev + 1);
    }, 6000);
    return () => clearInterval(timer);
  }, [isAutoPlay]);

  // Sync music: load paused on entry for user autonomy, or play if user is actively listening
  useEffect(() => {
    if (notes && notes[activeIndex]) {
      const activeNote = notes[activeIndex];
      const trackPayload = {
        id: activeNote.id,
        songTitle: activeNote.songTitle,
        artistName: `${activeNote.artistName} • Lossless 24-Bit DAC`,
        songImageUrl: activeNote.songImageUrl,
        audioSnippetStart: activeNote.audioSnippetStart || '0:10',
        duration: 162,
      };

      if (!hasUserStartedPlayingRef.current) {
        // Initial entry: Keep paused in dock so the user has full control and isn't startled
        loadTrack(trackPayload);
      } else if (isPlaying) {
        playTrack(trackPayload);
      } else {
        loadTrack(trackPayload);
      }
    }
  }, [activeIndex, notes]);

  // Keyboard navigation (Up/Down arrow or J/K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowDown', 'KeyJ'].includes(e.code)) {
        e.preventDefault();
        setActiveIndex((prev) => prev + 1);
      } else if (['ArrowUp', 'KeyK'].includes(e.code)) {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Smooth wheel navigation (throttled like TikTok/Reels)
  const handleWheel = (e) => {
    const now = Date.now();
    if (now - lastScrollTime.current < 380) return;

    if (e.deltaY > 25) {
      setActiveIndex((prev) => prev + 1);
      lastScrollTime.current = now;
    } else if (e.deltaY < -25) {
      setActiveIndex((prev) => Math.max(prev - 1, 0));
      lastScrollTime.current = now;
    }
  };

  // Touch Swipe for mobile/trackpad
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    if (deltaY > 40) {
      setActiveIndex((prev) => prev + 1);
    } else if (deltaY < -40) {
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  const activeNote = notes[activeIndex] || notes[0];

  return (
    <div 
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[calc(100vh-4rem-5rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden select-text"
    >
      {/* 1. DYNAMIC AMBIENT AURA (Spotify Canvas / Apple Music blurred glow) */}
      {activeNote?.songImageUrl && (
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-out overflow-hidden z-0"
        >
          <div 
            className="absolute -inset-[30%] bg-cover bg-center filter blur-[100px] opacity-25 scale-125 saturate-150 transition-all duration-1000"
            style={{ backgroundImage: `url(${activeNote.songImageUrl})` }}
          />
          <div className="absolute inset-0 bg-[#081724]/75" />
        </div>
      )}

      {/* 2. THREE-ZONE DESKTOP AUDIO EXPERIENCE */}
      <div className="relative z-10 w-full max-w-[1380px] flex items-center justify-center xl:justify-between gap-6 lg:gap-8 px-2">
        
        {/* LEFT WING: VINYL TURNTABLE & AUDIOPHILE HARDWARE (Desktop Only) */}
        <div className="hidden xl:flex flex-col items-center justify-center w-[290px] shrink-0 text-center animate-in fade-in duration-500">
          <div className="relative w-52 h-52 flex items-center justify-center mb-5 group">
            {/* Spinning Vinyl Record */}
            <div className={`w-48 h-48 rounded-full bg-[#0a0f14] border-4 border-[#1a2936] shadow-[0_15px_35px_rgba(0,0,0,0.8)] flex items-center justify-center relative overflow-hidden ${
              isPlaying ? 'animate-spin-slow' : ''
            }`}>
              {/* Vinyl grooves rings */}
              <div className="absolute inset-2 rounded-full border border-neutral-700/30" />
              <div className="absolute inset-6 rounded-full border border-neutral-700/20" />
              <div className="absolute inset-10 rounded-full border border-neutral-700/30" />
              <div className="absolute inset-14 rounded-full border border-neutral-700/20" />
              
              {/* Center Vinyl Artwork Label */}
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 shadow-inner">
                <img 
                  src={activeNote.songImageUrl} 
                  alt={activeNote.songTitle} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute w-3.5 h-3.5 rounded-full bg-[#081724] border border-white/40" />
            </div>

            {/* Stylus needle arm */}
            <div className="absolute -top-1 right-2 w-12 h-24 pointer-events-none opacity-80">
              <div className="w-1 h-16 bg-gradient-to-b from-neutral-300 to-neutral-600 rounded-full rotate-20 shadow-md origin-top" />
            </div>
          </div>

          {/* Audiophile Specs Badge */}
          <div className="bg-[#0b1c2b]/90 border border-[#16364f] p-3.5 rounded-2xl w-full text-left shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-[10px] font-grotesk text-[#91B9C5]/70 uppercase tracking-widest mb-1 font-bold">
              <span>ACOUSTIC SPECS</span>
              <span className="text-emerald-400">● HI-RES</span>
            </div>
            <p className="text-xs font-grotesk font-extrabold text-[#E8EEF0] truncate">
              {activeNote.songTitle}
            </p>
            <p className="text-[11px] font-grotesk text-[#91B9C5] truncate">
              {activeNote.artistName}
            </p>
            <div className="mt-2 pt-2 border-t border-[#142c40] flex items-center justify-between text-[9px] font-grotesk text-[#91B9C5]/80">
              <span>DAC: 24-Bit / 96kHz</span>
              <span>BIAS: Type II</span>
            </div>
          </div>
        </div>

        {/* CENTER STAGE: PRESTINE FOCUSED MUSIC CARD (Sleek 440px, Standardized Size) */}
        <div className="w-full max-w-[440px] shrink-0 flex flex-col items-center justify-center transition-all duration-300">
          {/* Subtle Top Bar: Track Index & Delicate Auto-Play Toggle */}
          <div className="w-full flex items-center justify-between mb-2 px-1 text-xs font-grotesk">
            <span className="text-[11px] font-bold text-[#E8EEF0] flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
              <span>Track {activeIndex + 1}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-grotesk font-semibold border transition-all cursor-pointer ${
                  isAutoPlay
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-md shadow-cyan-900/40'
                    : 'bg-[#0c1f2e] text-[#91B9C5]/80 hover:text-white border-[#16354d]'
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
                    <Play className="w-2.5 h-2.5 fill-current text-[#91B9C5]" />
                    <span>Auto-Play</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-0.5 bg-[#0c1f2e] p-0.5 rounded-xl border border-[#16354d]">
                <button
                  onClick={() => setActiveIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={activeIndex === 0}
                  className="p-1 rounded-lg hover:bg-[#142c40] text-[#91B9C5] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Previous Note (Scroll Up / ↑)"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveIndex((prev) => prev + 1)}
                  className="p-1 rounded-lg hover:bg-[#142c40] text-[#91B9C5] hover:text-white cursor-pointer transition-colors"
                  title="Next Note (Scroll Down / ↓)"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div 
            key={activeNote.id}
            className="w-full animate-in fade-in zoom-in-95 duration-250 drop-shadow-[0_20px_45px_rgba(0,0,0,0.65)]"
          >
            <MusicCard note={activeNote} />
          </div>
        </div>

        {/* RIGHT WING: YOUTUBE AMBIENT FROSTED GLASS & WAVEFORM (Translucent Light Reflection) */}
        <div className="hidden xl:flex flex-col justify-between w-[300px] shrink-0 h-[430px] animate-in fade-in duration-500">
          
          {/* Glassmorphism Panel with Ambient Backlight Reflection */}
          <div className="relative w-full h-full rounded-3xl p-5 backdrop-blur-2xl bg-white/[0.04] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] ring-1 ring-white/10 flex flex-col justify-between overflow-hidden group">
            
            {/* Ambient Light Reflection from Cover Art */}
            <div 
              className="absolute -top-12 -right-12 w-48 h-48 rounded-full filter blur-3xl opacity-35 pointer-events-none transition-all duration-1000 group-hover:opacity-50"
              style={{
                background: 'radial-gradient(circle, rgba(145,185,197,0.9) 0%, rgba(179,157,219,0.5) 60%, transparent 100%)'
              }}
            />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-cyan-400/15 filter blur-2xl pointer-events-none" />

            {/* Top: Status & Live indicator */}
            <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span className="text-[10px] font-grotesk font-extrabold uppercase tracking-widest text-[#E8EEF0]/90">
                  AMBIENT WAVEFORM
                </span>
              </div>
              <span className="text-[9px] font-grotesk px-2 py-0.5 rounded-full bg-white/10 text-cyan-200 border border-white/15">
                {isPlaying ? 'ACTIVE' : 'IDLE'}
              </span>
            </div>

            {/* Center: Glowing Equalizer Spectrum Bars */}
            <div className="relative z-10 my-auto py-3 flex flex-col items-center">
              <div className="flex items-end justify-center gap-1.5 h-16 w-full px-3 mb-4">
                {[45, 80, 30, 95, 65, 35, 90, 50, 100, 75, 40, 85, 55, 90, 25].map((h, i) => (
                  <span
                    key={i}
                    className="w-1.5 rounded-full bg-gradient-to-t from-cyan-400 via-sky-300 to-indigo-300 shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-300"
                    style={{
                      height: isPlaying ? `${h}%` : '15%',
                    }}
                  />
                ))}
              </div>

              {/* Poetic Lyric Glow Card */}
              {activeNote?.lyricSnippet && (
                <div className="w-full p-3 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md text-center shadow-inner">
                  <span className="text-[9px] font-grotesk text-cyan-300/80 uppercase tracking-wider block mb-1">
                    POETIC MEMORY
                  </span>
                  <p className="text-xs text-[#E8EEF0] italic font-serif leading-relaxed line-clamp-2">
                    "{activeNote.lyricSnippet}"
                  </p>
                </div>
              )}
            </div>

            {/* Bottom: Fast Audio Mood & Community dialogue badge */}
            <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-grotesk text-[#91B9C5]">
              <span className="flex items-center gap-1.5 text-white/90">
                <Disc className="w-3.5 h-3.5 text-cyan-400" />
                <span>{activeNote?.emotionTag || '🌙 Ambient Reflection'}</span>
              </span>
              <span className="text-[9px] text-[#91B9C5]/60 font-grotesk">
                SAY TACTILE
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
