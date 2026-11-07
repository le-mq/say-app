import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
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
  const [isAmbientPanelOpen, setIsAmbientPanelOpen] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const containerRef = useRef(null);
  const slideRefs = useRef({});
  const debounceTimerRef = useRef(null);

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
    return {
      ...n,
      id: String(n.id),
      userDisplayName: n.userDisplayName || 'Audiophile',
      handle: n.handle || (n.userDisplayName ? `@${n.userDisplayName.toLowerCase().replace(/\s+/g, '')}` : '@listener'),
      userAvatarUrl: n.userAvatarUrl || (user?.id === n.userId && user?.avatarUrl) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      timeAgo: n.timeAgo || timeInfo.relative || 'Just now',
      timeInfo,
      orderNumber: n.orderNumber || `ORD #${String(n.id).slice(0, 4).toUpperCase()}`,
      snippetDuration: n.snippetDuration || 30,
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

  // Auto-Play: Automatically scroll to and play the next note when current snippet finishes
  useEffect(() => {
    const handleSnippetEnded = (e) => {
      if (!isAutoPlayRef.current) return;
      const latestNotes = notesRef.current;
      if (!latestNotes || latestNotes.length === 0) return;

      const endedTrackId = e?.detail?.track?.id;
      const curIdx = latestNotes.findIndex((n) => n.id === (endedTrackId || activeNoteIdRef.current));
      const nextIdx = ((curIdx >= 0 ? curIdx : 0) + 1) % latestNotes.length;
      const nextNote = latestNotes[nextIdx];

      if (nextNote) {
        setActiveNoteId(nextNote.id);
        const targetEl = slideRefs.current[nextNote.id];
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        const start = Number(nextNote.audioSnippetStart ?? 0);
        const dur = Number(nextNote.snippetDuration ?? 30);
        playTrack({
          ...nextNote,
          id: nextNote.id,
          songTitle: nextNote.songTitle,
          artistName: nextNote.artistName,
          songImageUrl: nextNote.songImageUrl,
          externalSongUrl: nextNote.externalSongUrl,
          audioSnippetStart: start,
          snippetDuration: dur,
        }, {
          snippetStart: start,
          snippetDuration: dur,
          loop: false,
        });
      }
    };

    window.addEventListener('say_snippet_ended', handleSnippetEnded);
    return () => {
      window.removeEventListener('say_snippet_ended', handleSnippetEnded);
    };
  }, [playTrack]);

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
          if (noteId) {
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
    setActiveNoteId(noteId);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // If Auto-Play is ON, OR if music is currently playing, switch to the new active card
      if (isAutoPlay || isPlayingRef.current) {
        if (currentTrackRef.current?.id === noteId && isPlayingRef.current) {
          return;
        }
        const targetNote = notes.find((n) => n.id === noteId);
        if (targetNote) {
          const start = Number(targetNote.audioSnippetStart ?? 0);
          const dur = Number(targetNote.snippetDuration ?? 30);
          playTrack({
            ...targetNote,
            id: targetNote.id,
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
    <div className="relative w-full h-[calc(100dvh-4rem-4.5rem)] sm:h-[calc(100vh-4rem-4.5rem)] flex items-center justify-center overflow-hidden select-text bg-[#081724]">
      
      {/* 1. DYNAMIC AMBIENT AURA (Dark Petrol canvas with SAY logo lavender shimmer) */}
      {activeNote?.songImageUrl && (
        <div className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-out overflow-hidden z-0">
          <div 
            className="absolute -inset-[30%] bg-cover bg-center filter blur-[120px] opacity-25 scale-125 saturate-150 transition-all duration-1000"
            style={{ backgroundImage: `url(${activeNote.songImageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07131e]/90 via-[#0a1827]/95 to-[#050e18]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(179,157,219,0.16)_0%,rgba(139,92,246,0.08)_35%,transparent_75%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(145,185,197,0.08)_0%,transparent_50%)]" />
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
              className={`w-52 h-52 rounded-full bg-[#091522] border-4 border-[#142c40] shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex items-center justify-center relative overflow-hidden transition-all duration-700 group-hover:border-cyan-400/50 ${
                isTurntablePlaying ? 'animate-spin-slow ring-2 ring-cyan-400/40' : ''
              }`}
            >
              {/* Vinyl sound groove micro-rings */}
              <div className="absolute inset-2.5 rounded-full border border-neutral-700/30" />
              <div className="absolute inset-6 rounded-full border border-neutral-700/20" />
              <div className="absolute inset-10 rounded-full border border-neutral-700/30" />
              <div className="absolute inset-14 rounded-full border border-neutral-700/20" />
              
              {/* Center Vinyl Artwork Label */}
              <div className="w-18 h-18 rounded-full overflow-hidden border-2 border-white/20 shadow-inner relative">
                <img 
                  src={activeNote?.songImageUrl} 
                  alt={activeNote?.songTitle} 
                  className="w-full h-full object-cover select-none pointer-events-none" 
                />
              </div>
              <div className="absolute w-3.5 h-3.5 rounded-full bg-[#081724] border border-white/40 pointer-events-none" />
            </div>

            {/* Stylus needle arm - Silver & subtle Cyan/Amber tip */}
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
          <div className="bg-gradient-to-b from-[#0e2233]/85 via-[#0a1c2b]/90 to-[#071522]/95 border border-white/[0.08] p-4.5 rounded-3xl w-full text-left shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#91B9C5]/80 uppercase tracking-widest mb-1.5 font-bold">
              <span>ACTIVE RECORD</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                isTurntablePlaying ? 'bg-violet-950/80 text-violet-300 border border-violet-500/40' : 'bg-white/[0.05] text-slate-400'
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

            <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-[#91B9C5]/80">
              <span>PREVIEW: 30s</span>
              <span>TEMPLATE: {activeNote?.templateType || 'RECEIPTIFY'}</span>
            </div>
          </div>
        </aside>

        {/* ================================================================= */}
        {/* CENTER COLUMN: VERTICAL SNAP SCROLL CONTAINER (1 Note per viewport)*/}
        {/* ================================================================= */}
        <main className="w-full max-w-[480px] h-full flex flex-col items-center justify-center relative">
          
          {/* Top Control Bar: Auto-Play toggle with SAY Logo Lavender touch */}
          <div className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-mono shrink-0">
            <span className="text-[11px] font-bold text-[#E8EEF0] flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-[#B39DDB] animate-spin-slow" />
              <span>Feed Stream</span>
            </span>

            <div className="flex items-center gap-2">
              {/* Auto-Play Toggle Button */}
              <button
                type="button"
                onClick={handleToggleAutoPlay}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-mono font-bold border transition-all cursor-pointer ${
                  isAutoPlay
                    ? 'bg-gradient-to-r from-violet-950/70 to-indigo-950/70 text-violet-200 border-violet-400/40 shadow-sm shadow-violet-900/30'
                    : 'bg-[#091724] text-[#A59CB5]/80 hover:text-white border-white/10'
                }`}
                title={isAutoPlay ? 'Auto-play & auto-scroll is ENABLED' : 'Enable auto-play & auto-scroll'}
              >
                {isAutoPlay ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                    <span>Auto-Play ON</span>
                  </>
                ) : (
                  <>
                    <Play className="w-2.5 h-2.5 fill-current text-[#A59CB5]" />
                    <span>Auto-Play OFF</span>
                  </>
                )}
              </button>

              {/* Toggle Ambient Panel button for Desktop */}
              <button
                type="button"
                onClick={() => setIsAmbientPanelOpen(!isAmbientPanelOpen)}
                className="hidden xl:flex items-center gap-1 p-1.5 rounded-lg bg-[#091724] border border-white/10 text-[#A59CB5] hover:text-white transition-colors cursor-pointer"
                title={isAmbientPanelOpen ? "Collapse ambient panel" : "Expand ambient panel"}
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

            <div className="relative w-full h-[500px] rounded-3xl p-5 backdrop-blur-2xl bg-gradient-to-b from-[#0e2233]/85 via-[#0a1c2b]/90 to-[#071522]/95 border border-white/[0.08] shadow-2xl flex flex-col justify-between overflow-hidden group">
              
              {/* Backlight reflection from cover art with SAY ethereal palette */}
              <div 
                className="absolute -top-12 -right-12 w-48 h-48 rounded-full filter blur-3xl opacity-25 pointer-events-none transition-all duration-1000 group-hover:opacity-35"
                style={{
                  background: 'radial-gradient(circle, rgba(179,157,219,0.3) 0%, rgba(139,92,246,0.1) 50%, transparent 100%)'
                }}
              />

              {/* Status Header */}
              <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isTurntablePlaying ? 'bg-violet-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E8EEF0]/90">
                    AMBIENT MEMORY
                  </span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-violet-950/60 text-violet-300 border border-violet-500/30">
                  {isTurntablePlaying ? 'PLAYING' : 'FOCUSED'}
                </span>
              </div>

              {/* Center: Poetic Memory Lyric Quote */}
              <div className="relative z-10 my-auto py-4 flex flex-col items-center">
                {activeNote?.lyricSnippet ? (
                  <div className="w-full p-4 rounded-2xl bg-[#06121e]/70 border border-violet-400/20 backdrop-blur-md text-center shadow-inner">
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
                  <div className="mt-4 px-3 py-1 rounded-full bg-[#0a1827] border border-violet-500/30 text-xs font-mono text-violet-200">
                    {activeNote.emotionTag}
                  </div>
                )}
              </div>

              {/* Bottom: SAY Tactile Branding */}
              <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-[#91B9C5]">
                <span className="flex items-center gap-1.5 text-white/90">
                  <Disc className="w-3.5 h-3.5 text-violet-400" />
                  <span>SAY FEED VIBE</span>
                </span>
              </div>

            </div>
          </aside>
        )}

      </div>
    </div>
  );
}
