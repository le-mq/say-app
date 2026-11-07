import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, Radio, Play, Pause, Shuffle, Calendar, Quote, Volume2, Clock } from 'lucide-react';
import { formatTimeDetails } from '../utils/timeFormat';

/**
 * Memory Shuffle component (Chapter 6.5):
 * - Prioritizes notes created on the same month & day in past months/years.
 * - Falls back to a random past note.
 * - Strictly excludes locked capsules.
 * - Does not repeat notes sequentially.
 * - Provides "Listen Again" audio playback.
 */
export default function MemoryShuffle({
  notes = [],
  lockedCapsuleIds = new Set(),
  activeNoteId = null,
  isPlaying = false,
  onPlayNote,
  onSelectNote
}) {
  const [currentNote, setCurrentNote] = useState(null);
  const [matchType, setMatchType] = useState('random'); // 'anniversary' | 'day_match' | 'random'
  const [visitedIds, setVisitedIds] = useState(new Set());

  // Filter out any note that is locked or marked as a sealed capsule
  const validNotes = useMemo(() => {
    return notes.filter((n) => {
      if (!n || !n.id) return false;
      if (n.isLocked || n.status === 'SEALED') return false;
      if (lockedCapsuleIds && lockedCapsuleIds.has(n.id)) return false;
      return true;
    });
  }, [notes, lockedCapsuleIds]);

  // Find candidate matches prioritizing anniversaries
  const pickBestMemory = useCallback((excludeIds = new Set()) => {
    if (validNotes.length === 0) return { note: null, type: 'none' };

    const pool = validNotes.filter((n) => !excludeIds.has(n.id));
    const searchPool = pool.length > 0 ? pool : validNotes; // Reset if all visited

    const now = new Date();
    const todayDay = now.getDate();
    const todayMonth = now.getMonth();

    // 1. Priority 1: Same day & same month in previous years
    const anniversaryMatch = searchPool.find((n) => {
      const d = new Date(n.createdAt || Date.now());
      return d.getDate() === todayDay && d.getMonth() === todayMonth && d.getFullYear() < now.getFullYear();
    });
    if (anniversaryMatch) {
      return { note: anniversaryMatch, type: 'anniversary' };
    }

    // 2. Priority 2: Same day of month in previous months
    const dayMatch = searchPool.find((n) => {
      const d = new Date(n.createdAt || Date.now());
      return d.getDate() === todayDay && d.getMonth() !== todayMonth;
    });
    if (dayMatch) {
      return { note: dayMatch, type: 'day_match' };
    }

    // 3. Fallback: Any past note from searchPool at random
    const randomIndex = Math.floor(Math.random() * searchPool.length);
    return { note: searchPool[randomIndex], type: 'random' };
  }, [validNotes]);

  // Initial selection
  useEffect(() => {
    if (validNotes.length > 0 && !currentNote) {
      const { note, type } = pickBestMemory(new Set());
      if (note) {
        setCurrentNote(note);
        setMatchType(type);
        setVisitedIds(new Set([note.id]));
      }
    }
  }, [validNotes, currentNote, pickBestMemory]);

  const handleShuffleNext = () => {
    const nextVisited = new Set(visitedIds);
    if (currentNote) nextVisited.add(currentNote.id);

    const { note, type } = pickBestMemory(nextVisited);
    if (note) {
      setCurrentNote(note);
      setMatchType(type);
      nextVisited.add(note.id);
      setVisitedIds(nextVisited);
    }
  };

  if (!currentNote || validNotes.length === 0) {
    return (
      <div className="w-full p-6 rounded-3xl bg-[#091b2c]/60 border border-[#14324b] text-center flex flex-col items-center justify-center">
        <Sparkles className="w-8 h-8 text-[#91B9C5]/50 mb-2" />
        <h4 className="text-xs font-bold text-[#E8EEF0] uppercase tracking-wider">Memory Shuffle</h4>
        <p className="text-[11px] text-[#91B9C5]/70 max-w-xs mt-1">
          As your music archive grows, past memories will resurface here like vintage radio signals.
        </p>
      </div>
    );
  }

  const isTrackPlaying = isPlaying && activeNoteId === currentNote.id;
  const timeInfo = formatTimeDetails(currentNote.createdAt);

  return (
    <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-[#0c2338] via-[#091b2c] to-[#061421] border border-[#183d5f] p-5 sm:p-6 overflow-hidden shadow-xl select-text group flex flex-col justify-between">
      {/* Background ambient memory wave watermark (Analog Radio Waves instead of oversized disc) */}
      <div className="absolute -right-6 -bottom-6 w-44 h-44 opacity-[0.06] pointer-events-none text-cyan-300">
        <Radio className={`w-full h-full ${isTrackPlaying ? 'animate-pulse' : ''}`} />
      </div>

      {/* Top Banner: Perfectly Balanced Tag Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        {/* Left: Origin & Time Badge in a single neat cluster */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#133552] text-cyan-300 border border-cyan-500/30 shrink-0">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            {matchType === 'anniversary'
              ? 'Past Anniversary'
              : matchType === 'day_match'
              ? 'Past Echo'
              : 'Vault Echo'}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-semibold text-[#91B9C5]/90 bg-[#071726] px-2.5 py-1 rounded-full border border-[#14324c] shrink-0">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>{timeInfo.compact}</span>
          </span>
        </div>

        {/* Right: Shuffle Another Action */}
        {validNotes.length > 1 && (
          <button
            type="button"
            onClick={handleShuffleNext}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0e273d] hover:bg-[#163a59] border border-[#1c456b] text-[11px] font-bold text-[#91B9C5] hover:text-[#E8EEF0] transition-all cursor-pointer active:scale-95 shrink-0"
            title="Discover another memory"
          >
            <Shuffle className="w-3 h-3 text-cyan-400" />
            <span>Shuffle</span>
          </button>
        )}
      </div>

      {/* Main Memory Content Area */}
      <div className="flex flex-col gap-4 my-auto">
        <div className="flex items-center gap-4">
          {/* Vinyl Style Album Art (Clean, unobstructed view with glowing ring when playing) */}
          <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border shrink-0 shadow-lg transition-all bg-[#081724] ${
            isTrackPlaying ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-cyan-900/50' : 'border-[#204c75] group-hover:border-cyan-400/50'
          }`}>
            <img
              src={currentNote.songImageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
              alt={currentNote.songTitle}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200';
              }}
            />
          </div>

          {/* Note Metadata */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm sm:text-base text-[#E8EEF0] truncate">
                {currentNote.songTitle}
              </h4>
              {currentNote.templateType && (
                <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#102e49] text-cyan-200 border border-[#1b4870]">
                  {currentNote.templateType}
                </span>
              )}
            </div>
            <p className="text-xs text-[#91B9C5] font-medium truncate">
              {currentNote.artistName}
            </p>
          </div>
        </div>

        {/* Note Lyric / Caption */}
        {(currentNote.caption || currentNote.lyricSnippet) && (
          <div className="flex items-start gap-2 p-3 rounded-2xl bg-[#061523]/80 border border-[#14334f] text-xs text-[#E8EEF0]/90 italic font-serif">
            <Quote className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <p className="line-clamp-3 leading-relaxed">
              {currentNote.caption || currentNote.lyricSnippet}
            </p>
          </div>
        )}
      </div>

      {/* Bottom: Listen Again CTA */}
      <div className="pt-4 border-t border-[#122c44] mt-2">
        <button
          type="button"
          onClick={() => onPlayNote && onPlayNote(currentNote)}
          className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer ${
            isTrackPlaying
              ? 'bg-cyan-400 text-[#081827] ring-4 ring-cyan-400/30'
              : 'bg-gradient-to-r from-cyan-500 to-[#1e669b] hover:from-cyan-400 hover:to-[#257dbd] text-[#07131e] font-extrabold'
          }`}
        >
          {isTrackPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause Echo</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Listen Again</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

