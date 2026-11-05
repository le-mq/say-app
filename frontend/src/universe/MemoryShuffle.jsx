import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, Disc, Play, Shuffle, Calendar, Quote, Volume2 } from 'lucide-react';

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

  const isPlaying = activeNoteId === currentNote.id;
  const createdDate = new Date(currentNote.createdAt || Date.now());
  const dateFormatted = createdDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="relative w-full rounded-3xl bg-gradient-to-br from-[#0c2338] via-[#091b2c] to-[#061421] border border-[#183d5f] p-5 sm:p-6 overflow-hidden shadow-xl select-none group">
      {/* Background ambient vinyl watermark */}
      <div className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 pointer-events-none text-[#91B9C5]">
        <Disc className={`w-full h-full ${isPlaying ? 'animate-spin' : ''}`} />
      </div>

      {/* Top Banner: Memory Origin */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#133552] text-cyan-300 border border-cyan-500/30">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            {matchType === 'anniversary'
              ? 'On This Day in the Past'
              : matchType === 'day_match'
              ? 'Past Day Echo'
              : 'Echo from the Vault'}
          </span>
          <span className="text-[11px] font-mono text-[#91B9C5]/70 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {dateFormatted}
          </span>
        </div>

        {/* Shuffle Another Button */}
        {validNotes.length > 1 && (
          <button
            type="button"
            onClick={handleShuffleNext}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#091d30] hover:bg-[#102d4a] border border-[#173a5a] text-[11px] font-bold text-[#91B9C5] hover:text-[#E8EEF0] transition-all cursor-pointer active:scale-95"
            title="Discover another memory"
          >
            <Shuffle className="w-3 h-3" />
            <span>Shuffle Another</span>
          </button>
        )}
      </div>

      {/* Main Memory Content Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        
        {/* Vinyl Style Album Art */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-[#204c75] shrink-0 shadow-lg group-hover:border-cyan-400/50 transition-colors bg-[#081724]">
          <img
            src={currentNote.songImageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
            alt={currentNote.songTitle}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200';
            }}
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-[#081724]/60 backdrop-blur-xs flex items-center justify-center">
              <Disc className="w-8 h-8 text-cyan-300 animate-spin" />
            </div>
          )}
        </div>

        {/* Note Metadata and Personal Caption */}
        <div className="flex-1 min-w-0 space-y-1.5">
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

          {(currentNote.caption || currentNote.lyricSnippet) && (
            <div className="flex items-start gap-1.5 pt-1 text-xs text-[#E8EEF0]/90 italic font-serif">
              <Quote className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <p className="line-clamp-2">
                {currentNote.caption || currentNote.lyricSnippet}
              </p>
            </div>
          )}
        </div>

        {/* Listen Again CTA */}
        <div className="w-full sm:w-auto flex items-center justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-[#122c44] shrink-0">
          <button
            type="button"
            onClick={() => onPlayNote && onPlayNote(currentNote)}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              isPlaying
                ? 'bg-cyan-400 text-[#081827] ring-4 ring-cyan-400/30'
                : 'bg-gradient-to-r from-cyan-500 to-[#1e669b] hover:from-cyan-400 hover:to-[#257dbd] text-[#07131e] font-extrabold'
            }`}
          >
            {isPlaying ? (
              <>
                <Volume2 className="w-4 h-4 animate-bounce" />
                <span>Now Playing</span>
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
    </div>
  );
}

