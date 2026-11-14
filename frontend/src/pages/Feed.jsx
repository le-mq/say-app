import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore, playerStore } from '../store/playerStore';
import { noteService } from '../services/noteService';
import MusicNoteCard from '../components/MusicNoteCard';
import { 
  Disc, Play, Pause, Sparkles, ChevronRight, ChevronLeft, 
  Radio, Volume2, Maximize2, Minimize2, Eye, EyeOff 
} from 'lucide-react';
import { formatTimeDetails } from '../utils/timeFormat';

export default function Feed() {
  const { user, isStudioOpen } = useAuthStore();
  const { currentTrack, isPlaying, playTrack, loadTrack, togglePlay, setLooping } = usePlayerStore(
    (s) => ({ currentTrack: s.currentTrack, isPlaying: s.isPlaying })
  );

  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isAmbientPanelOpen, setIsAmbientPanelOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('say_ambient_panel_open');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

  const toggleAmbientPanel = () => {
    setIsAmbientPanelOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('say_ambient_panel_open', String(next));
      }
      return next;
    });
  };

  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const containerRef = useRef(null);
  const slideRefs = useRef({});
  const debounceTimerRef = useRef(null);
  const isAdvancingRef = useRef(false);

  // Synchronized state references to guarantee zero-miss event handling
  const isAutoPlayRef = useRef(isAutoPlay);
  useEffect(() => {
    isAutoPlayRef.current = isAutoPlay;
    setLooping(!isAutoPlay);
  }, [isAutoPlay, setLooping]);

  const isStudioOpenRef = useRef(isStudioOpen);
  useEffect(() => {
    isStudioOpenRef.current = isStudioOpen;
  }, [isStudioOpen]);

  const activeNoteIdRef = useRef(activeNoteId);
  useEffect(() => {
    activeNoteIdRef.current = activeNoteId;
  }, [activeNoteId]);

  const notesRef = useRef(notes);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  const currentTrackRef = useRef(currentTrack);
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // Mark user interaction on first click/key to satisfy browser autoplay policy
  useEffect(() => {
    const handleFirstInteraction = () => {
      setHasUserInteracted(true);
    };
    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Format note with required feed attributes
  const formatNote = useCallback((n) => {
    const timeInfo = formatTimeDetails(n.createdAt);
    const rawTemplate = (n.templateType || 'RECEIPTIFY').toUpperCase();
    const urlDurMatch = n.externalSongUrl?.match(/[#&?]snippetDur=(\d+)/);
    const snippetDuration = Number(
      n.snippetDuration ||
      (rawTemplate.includes(':') ? rawTemplate.split(':')[1] : null) ||
      (urlDurMatch ? urlDurMatch[1] : null) ||
      30
    );
    const start = Number(n.audioSnippetStart ?? 0);
    const end = start + snippetDuration;

    return {
      ...n,
      id: String(n.id),
      userDisplayName: n.userDisplayName || 'Audiophile',
      handle: n.handle || (n.userDisplayName ? `@${n.userDisplayName.toLowerCase().replace(/\s+/g, '')}` : '@listener'),
      userAvatarUrl: n.userAvatarUrl || (user?.id === n.userId && user?.avatarUrl) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      timeAgo: n.timeAgo || timeInfo.relative || 'Just now',
      timeInfo,
      orderNumber: n.orderNumber || `ORD #${String(n.id).slice(0, 4).toUpperCase()}`,
      audioSnippetStart: start,
      audioSnippetEnd: end,
      snippetDuration,
      likesCount: n.likesCount ?? n.likes ?? 0,
      savesCount: n.savesCount ?? n.saves_count ?? 0,
      isLiked: Boolean(n.isLiked),
      isSaved: Boolean(n.isSaved),
      dialogues: n.dialogues || [],
    };
  }, [user]);

  // Fetch real notes from backend; strictly display authentic database notes
  const loadFeed = useCallback(async () => {
    setIsFeedLoading(true);
    try {
      const res = await noteService.getPublicFeed(user?.id);
      const backendNotes = Array.isArray(res) ? res : (res?.data || []);
      if (backendNotes && backendNotes.length > 0) {
        const formatted = backendNotes.map(formatNote);
        setNotes(formatted);
        setActiveNoteId(formatted[0].id);
      } else {
        setNotes([]);
      }
    } catch (e) {
      console.warn('Feed load fallback error:', e);
      setNotes([]);
    } finally {
      setIsFeedLoading(false);
    }
  }, [formatNote, user?.id]);

  useEffect(() => {
    loadFeed();

    // Instant update when a new note is published from StudioModal
    const handleNoteCreated = (e) => {
      const newNote = e.detail;
      if (newNote) {
        const formatted = formatNote(newNote);
        setNotes((prev) => [formatted, ...prev.filter(n => String(n.id) !== String(formatted.id))]);
        setActiveNoteId(formatted.id);
        if (containerRef.current) {
          containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        loadFeed();
      }
    };

    const handleNoteSynced = (e) => {
      const syncNoteId = String(e?.detail?.noteId || '');
      if (!syncNoteId) return;
      setNotes((prevNotes) =>
        prevNotes.map((item) => {
          if (String(item.id) === syncNoteId) {
            return {
              ...item,
              likesCount: typeof e.detail.likesCount === 'number' ? e.detail.likesCount : item.likesCount,
              savesCount: typeof e.detail.savesCount === 'number' ? e.detail.savesCount : item.savesCount,
            };
          }
          return item;
        })
      );
    };

    window.addEventListener('say_note_created', handleNoteCreated);
    window.addEventListener('say_note_synced', handleNoteSynced);
    window.addEventListener('say_note_liked', handleNoteSynced);
    window.addEventListener('say_note_saved', handleNoteSynced);
    return () => {
      window.removeEventListener('say_note_created', handleNoteCreated);
      window.removeEventListener('say_note_synced', handleNoteSynced);
      window.removeEventListener('say_note_liked', handleNoteSynced);
      window.removeEventListener('say_note_saved', handleNoteSynced);
    };
  }, [loadFeed, formatNote]);

  // Synchronize active feed notes to playerStore playlist for Dock Next/Prev traversal
  useEffect(() => {
    if (notes && notes.length > 0) {
      playerStore.setPlaylist(notes);
    }
  }, [notes]);

  // Listen to GlobalPlayerDock next/prev track changes and smoothly scroll feed
  useEffect(() => {
    const handleNoteChanged = (e) => {
      if (isStudioOpenRef.current) return;
      const noteId = String(e?.detail?.noteId || '');
      if (!noteId) return;
      activeNoteIdRef.current = noteId;
      setActiveNoteId(noteId);
      const targetEl = slideRefs.current[noteId];
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    window.addEventListener('say_note_changed', handleNoteChanged);
    return () => {
      window.removeEventListener('say_note_changed', handleNoteChanged);
    };
  }, []);

  // Auto-Play: Automatically scroll to and play the next note sequentially when current snippet finishes
  useEffect(() => {
    const handleSnippetEnded = () => {
      if (isStudioOpenRef.current || !isAutoPlayRef.current || isAdvancingRef.current) return;
      isAdvancingRef.current = true;
      setTimeout(() => {
        isAdvancingRef.current = false;
      }, 1200);

      playerStore.playNextTrack();
    };

    window.addEventListener('say_snippet_ended', handleSnippetEnded);
    return () => {
      window.removeEventListener('say_snippet_ended', handleSnippetEnded);
    };
  }, []);

  // IntersectionObserver: Threshold 50% (0.5) to identify ActiveNote smoothly
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observerOptions = {
      root: container,
      rootMargin: '0px',
      threshold: 0.5,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          const noteId = entry.target.getAttribute('data-note-id');
          if (noteId && !isAdvancingRef.current) {
            handleNoteBecameActive(noteId);
          }
        }
      });
    }, observerOptions);

    // Observe each note slide
    Object.values(slideRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [notes]);

  // Handle Note Activation: Switch music if Auto-Play is ON or if user is currently playing music
  const handleNoteBecameActive = useCallback((noteId) => {
    if (isStudioOpenRef.current || isAdvancingRef.current) return;
    setActiveNoteId(noteId);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (isStudioOpenRef.current || isAdvancingRef.current) return;
      // If Auto-Play is ON, OR if music is currently playing, switch to the new active card
      if (isAutoPlay || isPlayingRef.current) {
        if (String(currentTrackRef.current?.id) === String(noteId) && isPlayingRef.current) {
          return;
        }
        const targetNote = notes.find((n) => String(n.id) === String(noteId));
        if (targetNote) {
          const start = Number(targetNote.audioSnippetStart ?? 0);
          const dur = Number(targetNote.snippetDuration ?? 30);
          playTrack({
            ...targetNote,
            id: String(targetNote.id),
            songTitle: targetNote.songTitle,
            artistName: targetNote.artistName,
            songImageUrl: targetNote.songImageUrl,
            externalSongUrl: targetNote.externalSongUrl,
            audioSnippetStart: start,
            snippetDuration: dur,
          }, {
            snippetStart: start,
            snippetDuration: dur,
            loop: !isAutoPlay,
          });
        }
      }
    }, 220);
  }, [notes, isAutoPlay, playTrack]);

  // Fallback scroll handler: precisely detect active card based on scroll position
  const handleContainerScroll = () => {
    if (isStudioOpenRef.current) return;
    setHasUserInteracted(true);
    if (!containerRef.current || !notes.length) return;
    const container = containerRef.current;
    const center = container.scrollTop + container.clientHeight / 2;
    for (const note of notes) {
      const el = slideRefs.current[note.id];
      if (el) {
        const top = el.offsetTop;
        const bottom = top + el.clientHeight;
        if (center >= top && center <= bottom) {
          if (activeNoteId !== note.id) {
            handleNoteBecameActive(note.id);
          }
          break;
        }
      }
    }
  };

  // Direct Play toggle on card or turntable (Chapter 4.5: Update PlayingNote)
  const handleDirectPlayToggle = (note) => {
    if (isStudioOpen) return;
    setHasUserInteracted(true);
    setActiveNoteId(note.id);
    if (currentTrack?.id === note.id) {
      togglePlay();
    } else {
      const start = Number(note.audioSnippetStart ?? 0);
      const dur = Number(note.snippetDuration ?? 30);
      playTrack({
        ...note,
        id: note.id,
        songTitle: note.songTitle,
        artistName: note.artistName,
        songImageUrl: note.songImageUrl,
        externalSongUrl: note.externalSongUrl,
        audioSnippetStart: start,
        snippetDuration: dur,
      }, {
        snippetStart: start,
        snippetDuration: dur,
        loop: !isAutoPlay,
      });
    }
  };

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];
  const isTurntablePlaying = !isStudioOpen && currentTrack?.id === activeNote?.id && isPlaying;

  // Auto-Play Toggle Action: Turning ON enables auto-advance without restarting track if already playing
  const handleToggleAutoPlay = () => {
    const nextVal = !isAutoPlay;
    setIsAutoPlay(nextVal);
    setHasUserInteracted(true);
    setLooping(!nextVal);
    // If turning ON and active note is NOT currently playing, start playback
    if (nextVal && activeNote && !isPlayingRef.current) {
      const start = Number(activeNote.audioSnippetStart ?? 0);
      const dur = Number(activeNote.snippetDuration ?? 30);
      playTrack({
        ...activeNote,
        id: activeNote.id,
        songTitle: activeNote.songTitle,
        artistName: activeNote.artistName,
        songImageUrl: activeNote.songImageUrl,
        externalSongUrl: activeNote.externalSongUrl,
        audioSnippetStart: start,
        snippetDuration: dur,
      }, {
        snippetStart: start,
        snippetDuration: dur,
        loop: false,
      });
    }
  };

  // Keep GlobalPlayerDock synchronized with the active note in view
  useEffect(() => {
    if (isStudioOpen) return;
    if (activeNote) {
      // If nothing is playing, update dock to reflect the active note in view
      if (!isPlaying) {
        const start = Number(activeNote.audioSnippetStart ?? 0);
        const dur = Number(activeNote.snippetDuration ?? 30);
        loadTrack({
          ...activeNote,
          id: activeNote.id,
          songTitle: activeNote.songTitle,
          artistName: activeNote.artistName,
          songImageUrl: activeNote.songImageUrl,
          externalSongUrl: activeNote.externalSongUrl,
          audioSnippetStart: start,
          snippetDuration: dur,
        }, {
          snippetStart: start,
          snippetDuration: dur,
        });
      }
    }
  }, [activeNoteId, activeNote?.id, isPlaying, loadTrack]);

  return (
    <div className={`relative w-full h-[calc(100dvh-4rem-4.5rem)] sm:h-[calc(100vh-4rem-4.5rem)] flex items-center justify-center overflow-hidden select-text bg-[#071523] text-[#E8EEF0] selection:bg-[#c4b5fd]/40 selection:text-white ${isStudioOpen ? 'pointer-events-none select-none' : ''}`}>
      
      {/* 1. DYNAMIC AMBIENT AURA - SAY Logo signature brand gradient (Lavender Mist + Champagne Amber + Petrol) */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 50% 15%, rgba(196, 181, 253, 0.08) 0%, rgba(251, 191, 36, 0.03) 25%, rgba(145, 185, 197, 0.02) 50%, transparent 80%)'
        }}
      />
      {/* Secondary accent atmospheric dust */}
      <div 
        className="absolute top-1/4 -left-20 w-96 h-96 rounded-full filter blur-[140px] opacity-25 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.15) 0%, rgba(251, 191, 36, 0.05) 50%, transparent 80%)'
        }}
      />
      <div 
        className="absolute bottom-10 -right-20 w-96 h-96 rounded-full filter blur-[140px] opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(145, 185, 197, 0.15) 0%, rgba(167, 139, 250, 0.08) 50%, transparent 80%)'
        }}
      />
      {activeNote?.songImageUrl && (
        <div className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-out overflow-hidden z-0">
          <div 
            className="absolute -inset-[30%] bg-cover bg-center filter blur-[180px] opacity-[0.07] scale-125 transition-all duration-1000"
            style={{ backgroundImage: `url(${activeNote.songImageUrl})` }}
          />
        </div>
      )}

      {/* 2. THREE-COLUMN DESKTOP RESPONSIVE LAYOUT */}
      <div className="relative z-10 w-full max-w-[1280px] h-full flex items-center justify-center px-4 sm:px-6 gap-6 lg:gap-10 xl:gap-14 transition-all duration-300">
        
        {/* ================================================================= */}
        {/* LEFT COLUMN: TURNTABLE PANEL (Desktop Only, Chapter 4.6)           */}
        {/* ================================================================= */}
        <aside 
          aria-label="Turntable Visualizer"
          className="hidden xl:flex flex-col items-center justify-center w-[300px] shrink-0 text-center animate-in fade-in duration-500"
        >
          {/* Top spacer matching main's control bar so Card 1 top edge matches Card 2 & 3 */}
          <div className="w-full h-8 px-2 py-1.5 shrink-0 invisible pointer-events-none" aria-hidden="true" />

          {/* Unified 500px card container matching Center and Right cards */}
          <div className="relative w-full h-[500px] rounded-3xl p-5 bg-[#0d2035]/75 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between items-center overflow-hidden group backdrop-blur-2xl">
            {/* Top glass gradient edge highlight */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-violet-300/30 to-transparent pointer-events-none" />
            
            {/* Ambient backlight reflection — subtle powdery lavender mist & champagne gold */}
            <div 
              className="absolute -top-12 -left-12 w-48 h-48 rounded-full filter blur-3xl opacity-25 pointer-events-none transition-all duration-1000 group-hover:opacity-35"
              style={{
                background: 'radial-gradient(circle, rgba(196,181,253,0.18) 0%, rgba(251,191,36,0.06) 40%, rgba(145,185,197,0.06) 70%, transparent 100%)'
              }}
            />

            {/* Status Header */}
            <div className="relative z-10 w-full flex items-center justify-between pb-3 border-b border-violet-300/15 shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isTurntablePlaying ? 'bg-violet-300 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E8EEF0]/90">
                  VINYL TURNTABLE
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                isTurntablePlaying ? 'bg-violet-950/60 text-violet-200 border border-violet-300/35 shadow-[0_0_8px_rgba(196,181,253,0.2)]' : 'bg-white/[0.05] text-slate-400 border border-white/10'
              }`}>
                {isTurntablePlaying ? '● PLAYING' : 'READY'}
              </span>
            </div>

            {/* Center Spinning Vinyl Record */}
            <div 
              onClick={() => handleDirectPlayToggle(activeNote)}
              className="relative w-48 h-48 flex items-center justify-center my-auto group cursor-pointer"
              title={isTurntablePlaying ? "Pause Vinyl Record" : "Play Vinyl Record"}
            >
              <div 
                className={`w-44 h-44 rounded-full bg-[#071523] border-4 border-[#142f47] shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex items-center justify-center relative overflow-hidden transition-all duration-700 group-hover:border-violet-300/40 ${
                  isTurntablePlaying ? 'animate-spin-slow ring-2 ring-violet-300/30' : ''
                }`}
              >
                {/* Vinyl sound groove micro-rings */}
                <div className="absolute inset-2.5 rounded-full border border-violet-300/10" />
                <div className="absolute inset-6 rounded-full border border-violet-300/10" />
                <div className="absolute inset-10 rounded-full border border-violet-300/10" />
                <div className="absolute inset-14 rounded-full border border-violet-300/10" />
                
                {/* Center Vinyl Artwork Label */}
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-violet-300/30 shadow-inner relative">
                  <img 
                    src={activeNote?.songImageUrl} 
                    alt={activeNote?.songTitle} 
                    className="w-full h-full object-cover select-none pointer-events-none" 
                  />
                </div>
                <div className="absolute w-3 h-3 rounded-full bg-[#071523] border border-violet-300/30 pointer-events-none" />
              </div>

              {/* Stylus needle arm */}
              <div 
                className={`absolute -top-1 right-2 w-12 h-20 pointer-events-none transition-transform duration-500 origin-top ${
                  isTurntablePlaying ? 'rotate-20' : 'rotate-0 opacity-60'
                }`}
              >
                <div className="w-1.5 h-14 bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500 rounded-full shadow-md" />
                <div className="w-2.5 h-3 bg-violet-300/90 rounded -ml-0.5 shadow-sm" />
              </div>
            </div>

            {/* Turntable Info Box */}
            <div className="relative z-10 w-full text-left pt-3 border-t border-violet-300/15 shrink-0">
              <p className="text-xs font-bold text-[#E8EEF0] truncate">
                {activeNote?.songTitle}
              </p>
              <p className="text-[11px] text-[#91B9C5] truncate font-mono mt-0.5">
                {activeNote?.artistName}
              </p>

              <div className="mt-2.5 pt-2 border-t border-violet-300/10 flex items-center justify-between text-[10px] font-mono text-[#91B9C5]/80">
                <span>PREVIEW: {activeNote?.snippetDuration || 30}s</span>
                <span>TEMPLATE: {activeNote?.templateType || 'RECEIPTIFY'}</span>
              </div>
            </div>

          </div>
        </aside>

        {/* ================================================================= */}
        {/* CENTER COLUMN: VERTICAL SNAP SCROLL CONTAINER (1 Note per viewport)*/}
        {/* ================================================================= */}
        <main className="w-full max-w-[480px] h-full flex flex-col items-center justify-center relative">
          
          {/* Top Control Bar: Auto-Play toggle with SAY Brand Cyan / Petrol Palette */}
          <div className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-mono shrink-0">
            <span className="text-[11px] font-bold text-[#E8EEF0] flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-violet-300 animate-spin-slow" />
              <span>Feed Stream</span>
            </span>

            <div className="flex items-center gap-2">
              {/* Auto-Play Toggle Button */}
              <button
                type="button"
                onClick={handleToggleAutoPlay}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-mono font-bold border transition-all cursor-pointer ${
                  isAutoPlay
                    ? 'bg-gradient-to-r from-[#0e2a44] via-[#152a46] to-[#1e2a4a] text-violet-200 border-violet-300/40 shadow-sm'
                    : 'bg-[#091f33] text-slate-400 hover:text-white border-sky-500/20'
                }`}
                title={isAutoPlay ? 'Auto-play & auto-scroll is ENABLED' : 'Enable auto-play & auto-scroll'}
              >
                {isAutoPlay ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-300 animate-ping" />
                    <span>Auto-Play ON</span>
                  </>
                ) : (
                  <>
                    <Play className="w-2.5 h-2.5 fill-current text-violet-300/80" />
                    <span>Auto-Play OFF</span>
                  </>
                )}
              </button>

              {/* Toggle Ambient Panel button for Desktop with Persistent Memory */}
              <button
                type="button"
                onClick={toggleAmbientPanel}
                className={`hidden xl:flex items-center gap-1 p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isAmbientPanelOpen 
                    ? 'bg-[#0f2842] border-violet-300/40 text-violet-200 shadow-sm'
                    : 'bg-[#091f33] border-sky-500/20 text-[#91B9C5] hover:text-white hover:border-violet-300/40'
                }`}
                title={isAmbientPanelOpen ? "Hide detail lyric card" : "Show detail lyric card"}
              >
                {isAmbientPanelOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* THE MANDATORY CSS SCROLL-SNAP CONTAINER - Completely Invisible Native Scrollbar */}
          <div 
            ref={containerRef}
            tabIndex={0}
            onScroll={handleContainerScroll}
            className="w-full h-full overflow-y-auto overflow-x-hidden scroll-smooth relative focus:outline-none scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{
              scrollSnapType: 'y mandatory',
              overscrollBehaviorY: 'contain',
            }}
          >
            {isFeedLoading && notes.length === 0 ? (
              <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-[#0c1e30] border border-white/10 flex items-center justify-center mb-3 shadow-lg">
                  <Disc className="w-7 h-7 text-cyan-300 animate-spin" />
                </div>
                <p className="text-xs font-mono text-[#91B9C5]">Tuning in to SAY Feed...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-3xl bg-[#0c1e30] border border-white/10 flex items-center justify-center mb-4 shadow-lg text-cyan-300">
                  <Disc className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#E8EEF0] mb-1">No Notes Yet</h3>
                <p className="text-xs text-[#91B9C5]/80 font-sans max-w-xs">Be the first audiophile to ignite a star on SAY!</p>
              </div>
            ) : (
              notes.map((note) => {
                const isActive = activeNoteId === note.id;
                const isNotePlaying = currentTrack?.id === note.id && isPlaying;

                return (
                  <section
                    key={note.id}
                    data-note-id={note.id}
                    ref={(el) => { slideRefs.current[note.id] = el; }}
                    className="w-full h-full min-h-full flex items-center justify-center p-2 sm:p-4 snap-start snap-always shrink-0"
                    style={{
                      scrollSnapAlign: 'start',
                      scrollSnapStop: 'always',
                    }}
                  >
                    <MusicNoteCard 
                      note={note}
                      isActive={isActive}
                      isPlaying={isNotePlaying}
                      onPlayToggle={() => handleDirectPlayToggle(note)}
                    />
                  </section>
                );
              })
            )}
          </div>

        </main>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: AMBIENT PANEL (Desktop Collapsible, Chapter 4.6)     */}
        {/* ================================================================= */}
        {isAmbientPanelOpen && (
          <aside 
            aria-label="Ambient Visualizer Panel"
            className="hidden xl:flex flex-col items-center justify-center w-[300px] shrink-0 animate-in fade-in duration-300"
          >
            {/* Top spacer matching main's control bar so Card 3 top edge matches Card 2 */}
            <div className="w-full h-8 px-2 py-1.5 shrink-0 invisible pointer-events-none" aria-hidden="true" />

            <div className="relative w-full h-[500px] rounded-3xl p-5 bg-[#0d2035]/75 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between overflow-hidden group backdrop-blur-2xl">
              {/* Top glass gradient edge highlight */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-violet-300/30 to-transparent pointer-events-none" />
              
              {/* Backlight reflection from cover art with subtle powdery lavender mist & champagne gold */}
              <div 
                className="absolute -top-12 -right-12 w-48 h-48 rounded-full filter blur-3xl opacity-25 pointer-events-none transition-all duration-1000 group-hover:opacity-35"
                style={{
                  background: 'radial-gradient(circle, rgba(196,181,253,0.18) 0%, rgba(251,191,36,0.06) 40%, rgba(145,185,197,0.06) 70%, transparent 100%)'
                }}
              />

              {/* Status Header */}
              <div className="relative z-10 flex items-center justify-between pb-3 border-b border-violet-300/15">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isTurntablePlaying ? 'bg-violet-300 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E8EEF0]/90">
                    AMBIENT MEMORY
                  </span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-violet-950/60 text-violet-200 border border-violet-300/35">
                  {isTurntablePlaying ? 'PLAYING' : 'FOCUSED'}
                </span>
              </div>

              {/* Center: Poetic Memory Lyric Quote */}
              <div className="relative z-10 my-auto py-4 flex flex-col items-center">
                {activeNote?.lyricSnippet ? (
                  <div className="w-full p-4 rounded-2xl bg-[#071624]/85 border border-violet-300/20 backdrop-blur-md text-center shadow-inner">
                    <span className="text-[9px] font-mono text-violet-300 uppercase tracking-widest block mb-2 font-bold">
                      POETIC MEMORY
                    </span>
                    <p className="text-xs text-[#E8EEF0] italic font-serif leading-relaxed line-clamp-3">
                      "{activeNote.lyricSnippet}"
                    </p>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs font-mono text-[#91B9C5]/60 italic">
                    No lyric snippet attached to this note.
                  </div>
                )}

                {/* Mood Tag Badge */}
                {activeNote?.emotionTag && (
                  <div className="mt-4 px-3.5 py-1 rounded-full bg-gradient-to-r from-violet-500/15 via-[#0d2235] to-amber-500/10 border border-violet-300/30 text-xs font-mono text-violet-200 shadow-sm backdrop-blur-md">
                    {activeNote.emotionTag}
                  </div>
                )}
              </div>

              {/* Bottom: SAY Tactile Branding */}
              <div className="relative z-10 pt-3 border-t border-violet-300/15 flex items-center justify-between text-[10px] font-mono text-[#91B9C5]">
                <span className="flex items-center gap-1.5 text-white/90">
                  <Disc className="w-3.5 h-3.5 text-violet-300" />
                  <span className="font-bold text-[10.5px]">SAY TACTILE</span>
                </span>
                <span className="text-[9px] text-[#91B9C5]/60">HI-RES AUDIO</span>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
