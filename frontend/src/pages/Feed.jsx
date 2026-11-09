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
  const { user } = useAuthStore();
  const { currentTrack, isPlaying, playTrack, loadTrack, togglePlay, setLooping } = usePlayerStore();

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
      dialogues: n.dialogues || [],
    };
  }, [user]);

  // Fetch real notes from backend; strictly display authentic database notes
  const loadFeed = useCallback(async () => {
    setIsFeedLoading(true);
    try {
      const res = await noteService.getPublicFeed();
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
  }, [formatNote]);

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

    window.addEventListener('say_note_created', handleNoteCreated);
    return () => {
      window.removeEventListener('say_note_created', handleNoteCreated);
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
      if (!isAutoPlayRef.current || isAdvancingRef.current) return;
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
    if (isAdvancingRef.current) return;
    setActiveNoteId(noteId);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (isAdvancingRef.current) return;
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
  const isTurntablePlaying = currentTrack?.id === activeNote?.id && isPlaying;

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
    <div className="relative w-full h-[calc(100dvh-4rem-4.5rem)] sm:h-[calc(100vh-4rem-4.5rem)] flex items-center justify-center overflow-hidden select-text bg-[#061320]">
      
      {/* 1. DYNAMIC AMBIENT AURA (Dark Petrol Canvas with subtle Cyan & Aston Martin Teal glow) */}
      {activeNote?.songImageUrl && (
        <div className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-out overflow-hidden z-0">
          <div 
            className="absolute -inset-[30%] bg-cover bg-center filter blur-[120px] opacity-15 scale-125 saturate-120 transition-all duration-1000"
            style={{ backgroundImage: `url(${activeNote.songImageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#06121d]/95 via-[#081724]/98 to-[#040c14]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.08)_0%,rgba(0,89,76,0.1)_35%,transparent_75%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(145,185,197,0.06)_0%,transparent_50%)]" />
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
          <div 
            onClick={() => handleDirectPlayToggle(activeNote)}
            className="relative w-56 h-56 flex items-center justify-center mb-5 group cursor-pointer"
            title={isTurntablePlaying ? "Pause Vinyl Record" : "Play Vinyl Record"}
          >
            {/* Spinning Vinyl Record */}
            <div 
              className={`w-52 h-52 rounded-full bg-[#071523] border-4 border-[#122e44] shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex items-center justify-center relative overflow-hidden transition-all duration-700 group-hover:border-cyan-400/50 ${
                isTurntablePlaying ? 'animate-spin-slow ring-2 ring-cyan-400/40' : ''
              }`}
            >
              {/* Vinyl sound groove micro-rings */}
              <div className="absolute inset-2.5 rounded-full border border-sky-400/15" />
              <div className="absolute inset-6 rounded-full border border-sky-400/10" />
              <div className="absolute inset-10 rounded-full border border-sky-400/15" />
              <div className="absolute inset-14 rounded-full border border-sky-400/10" />
              
              {/* Center Vinyl Artwork Label */}
              <div className="w-18 h-18 rounded-full overflow-hidden border-2 border-sky-400/40 shadow-inner relative">
                <img 
                  src={activeNote?.songImageUrl} 
                  alt={activeNote?.songTitle} 
                  className="w-full h-full object-cover select-none pointer-events-none" 
                />
              </div>
              <div className="absolute w-3.5 h-3.5 rounded-full bg-[#081724] border border-sky-300/40 pointer-events-none" />
            </div>

            {/* Stylus needle arm - Silver & subtle Cyan tip */}
            <div 
              className={`absolute -top-2 right-2 w-14 h-24 pointer-events-none transition-transform duration-500 origin-top ${
                isTurntablePlaying ? 'rotate-20' : 'rotate-0 opacity-60'
              }`}
            >
              <div className="w-1.5 h-16 bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500 rounded-full shadow-md" />
              <div className="w-2.5 h-3.5 bg-cyan-400/90 rounded -ml-0.5 shadow-sm" />
            </div>
          </div>

          {/* Turntable Info Box - Frosted Petrol Glass */}
          <div className="bg-gradient-to-b from-[#0e253b]/95 via-[#091c2e]/96 to-[#061422]/98 border border-sky-400/25 p-4.5 rounded-3xl w-full text-left shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
            <div className="flex items-center justify-between text-[10px] font-mono text-sky-300 uppercase tracking-widest mb-1.5 font-bold">
              <span>ACTIVE RECORD</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                isTurntablePlaying ? 'bg-sky-950/80 text-sky-200 border border-sky-400/50 shadow-[0_0_8px_rgba(56,189,248,0.3)]' : 'bg-white/[0.05] text-slate-400 border border-white/10'
              }`}>
                {isTurntablePlaying ? '● PLAYING' : 'READY'}
              </span>
            </div>

            <p className="text-xs font-bold text-[#E8EEF0] truncate">
              {activeNote?.songTitle}
            </p>
            <p className="text-[11px] text-[#91B9C5] truncate font-mono mt-0.5">
              {activeNote?.artistName}
            </p>

            <div className="mt-3 pt-2.5 border-t border-sky-500/20 flex items-center justify-between text-[10px] font-mono text-[#91B9C5]/80">
              <span>PREVIEW: {activeNote?.snippetDuration || 30}s</span>
              <span>TEMPLATE: {activeNote?.templateType || 'RECEIPTIFY'}</span>
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
              <Disc className="w-3.5 h-3.5 text-sky-300 animate-spin-slow" />
              <span>Feed Stream</span>
            </span>

            <div className="flex items-center gap-2">
              {/* Auto-Play Toggle Button */}
              <button
                type="button"
                onClick={handleToggleAutoPlay}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-mono font-bold border transition-all cursor-pointer ${
                  isAutoPlay
                    ? 'bg-gradient-to-r from-[#00594c]/90 via-[#07243a] to-sky-950/90 text-sky-200 border-sky-400/50 shadow-sm shadow-sky-950/50'
                    : 'bg-[#091f33] text-slate-400 hover:text-white border-sky-500/20'
                }`}
                title={isAutoPlay ? 'Auto-play & auto-scroll is ENABLED' : 'Enable auto-play & auto-scroll'}
              >
                {isAutoPlay ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                    <span>Auto-Play ON</span>
                  </>
                ) : (
                  <>
                    <Play className="w-2.5 h-2.5 fill-current text-[#91B9C5]" />
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
                    ? 'bg-[#0b243a] border-sky-400/50 text-sky-200 shadow-sm'
                    : 'bg-[#091f33] border-sky-500/20 text-[#91B9C5] hover:text-white hover:border-sky-400/40'
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

            <div className="relative w-full h-[500px] rounded-3xl p-5 backdrop-blur-2xl bg-gradient-to-b from-[#0e253b]/95 via-[#091c2e]/96 to-[#061422]/98 border border-sky-400/25 shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col justify-between overflow-hidden group">
              
              {/* Backlight reflection from cover art with SAY cyan / aston martin palette */}
              <div 
                className="absolute -top-12 -right-12 w-48 h-48 rounded-full filter blur-3xl opacity-20 pointer-events-none transition-all duration-1000 group-hover:opacity-30"
                style={{
                  background: 'radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(0,89,76,0.12) 50%, transparent 100%)'
                }}
              />

              {/* Status Header */}
              <div className="relative z-10 flex items-center justify-between pb-3 border-b border-sky-500/20">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isTurntablePlaying ? 'bg-sky-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E8EEF0]/90">
                    AMBIENT MEMORY
                  </span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-200 border border-sky-400/40">
                  {isTurntablePlaying ? 'PLAYING' : 'FOCUSED'}
                </span>
              </div>

              {/* Center: Poetic Memory Lyric Quote */}
              <div className="relative z-10 my-auto py-4 flex flex-col items-center">
                {activeNote?.lyricSnippet ? (
                  <div className="w-full p-4 rounded-2xl bg-[#06121e]/85 border border-sky-400/25 backdrop-blur-md text-center shadow-inner">
                    <span className="text-[9px] font-mono text-sky-300 uppercase tracking-widest block mb-2 font-bold">
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
                  <div className="mt-4 px-3 py-1 rounded-full bg-[#0a2338] border border-sky-400/30 text-xs font-mono text-sky-200">
                    {activeNote.emotionTag}
                  </div>
                )}
              </div>

              {/* Bottom: SAY Tactile Branding */}
              <div className="relative z-10 pt-3 border-t border-sky-500/20 flex items-center justify-between text-[10px] font-mono text-[#91B9C5]">
                <span className="flex items-center gap-1.5 text-white/90">
                  <Disc className="w-3.5 h-3.5 text-sky-400" />
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
