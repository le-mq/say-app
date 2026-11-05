import React, { useState, useMemo } from 'react';
import { Sparkles, Play, Disc, Music, Eye, Calendar } from 'lucide-react';

/**
 * Deterministic hash algorithm from Chapter 6:
 * Computes invariant (normX, normY) coordinates from noteId
 * so star positions never shift on viewport resize or when new notes are added.
 */
export function getNormalizedCoords(id) {
  if (!id) return { normX: 50, normY: 50 };
  let hash = 0;
  const str = String(id);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const normX = 12 + (absHash % 76); // 12% - 88%
  const normY = 15 + ((absHash >> 3) % 68); // 15% - 83%
  return { normX, normY };
}

export default function AudioConstellation({
  notes = [],
  onSelectNote,
  onPlayNote,
  activeNoteId = null,
  onCreateNote
}) {
  const [hoveredNote, setHoveredNote] = useState(null);

  // Compute stars with persistent coordinates
  const stars = useMemo(() => {
    return notes.map((note, index) => {
      const coords = getNormalizedCoords(note.id || `temp-note-${index}`);
      return {
        ...note,
        coords,
        index
      };
    });
  }, [notes]);

  // Generate constellation connection lines between adjacent chronological stars
  const constellationLines = useMemo(() => {
    if (stars.length < 2) return [];
    const lines = [];
    for (let i = 0; i < stars.length - 1; i++) {
      lines.push({
        x1: stars[i].coords.normX,
        y1: stars[i].coords.normY,
        x2: stars[i + 1].coords.normX,
        y2: stars[i + 1].coords.normY,
      });
    }
    return lines;
  }, [stars]);

  if (notes.length === 0) {
    return (
      <div className="relative w-full h-[460px] sm:h-[540px] rounded-3xl bg-gradient-to-b from-[#091b2c] via-[#061422] to-[#040e18] border border-[#14324b] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        {/* Subtle background ambient stars */}
        <div className="absolute inset-0 bg-[radial-gradient(#91B9C5_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="w-16 h-16 rounded-2xl bg-[#0f283d] border border-[#1e486b] flex items-center justify-center text-[#91B9C5] mb-4 shadow-[0_0_24px_rgba(145,185,197,0.2)] animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-serif font-bold text-[#E8EEF0] tracking-wide mb-2">
          Your Universe is Silent
        </h3>
        <p className="text-xs text-[#91B9C5]/70 max-w-md mb-6 leading-relaxed">
          Every Music Note you compose will shine here as an enduring star in your celestial map.
        </p>
        {onCreateNote && (
          <button
            type="button"
            onClick={onCreateNote}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#173e5f] to-[#1e527d] hover:from-[#1e527d] hover:to-[#25689e] text-cyan-200 border border-cyan-500/40 text-xs font-bold tracking-wide transition-all shadow-[0_0_16px_rgba(34,211,238,0.25)] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ignite First Star</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-[460px] sm:h-[560px] rounded-3xl bg-gradient-to-b from-[#081827] via-[#05111d] to-[#030a11] border border-[#15344f] overflow-hidden select-none shadow-2xl">
      {/* 1. Deep Space Cosmic Grid & Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#91B9C5_1px,transparent_1px)] [background-size:28px_28px] opacity-15 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#91B9C5]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* 2. Constellation SVG Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        {constellationLines.map((line, idx) => (
          <line
            key={`line-${idx}`}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke="rgba(145, 185, 197, 0.28)"
            strokeWidth="0.3"
            strokeDasharray="1.2, 1.2"
          />
        ))}
      </svg>

      {/* 3. Star Nodes */}
      {stars.map((star) => {
        const isActive = activeNoteId === star.id;
        const isHovered = hoveredNote?.id === star.id;

        return (
          <div
            key={star.id}
            style={{
              left: `${star.coords.normX}%`,
              top: `${star.coords.normY}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute z-20"
            onMouseEnter={() => setHoveredNote(star)}
            onMouseLeave={() => setHoveredNote(null)}
          >
            {/* Star Glow Pulse Ring */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-300 pointer-events-none ${
                isActive
                  ? 'w-10 h-10 -left-2.5 -top-2.5 bg-cyan-400/40 blur-md animate-ping'
                  : isHovered
                  ? 'w-8 h-8 -left-2 -top-2 bg-[#91B9C5]/40 blur-sm'
                  : 'w-4 h-4 -left-0.5 -top-0.5 bg-white/10 blur-xs'
              }`}
            />

            {/* Clickable Interactive Star Button */}
            <button
              type="button"
              onClick={() => {
                if (onPlayNote) onPlayNote(star);
                if (onSelectNote) onSelectNote(star);
              }}
              className={`relative flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'w-6 h-6 bg-cyan-300 text-[#081827] ring-4 ring-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.9)] scale-125'
                  : isHovered
                  ? 'w-5 h-5 bg-[#E8EEF0] text-[#081827] ring-2 ring-[#91B9C5] shadow-[0_0_14px_rgba(232,238,240,0.8)] scale-110'
                  : 'w-3.5 h-3.5 bg-[#91B9C5] hover:bg-white shadow-[0_0_8px_rgba(145,185,197,0.6)]'
              }`}
              title={`${star.songTitle} - ${star.artistName}`}
              aria-label={`Open Note ${star.songTitle}`}
            >
              {isActive ? (
                <Disc className="w-3.5 h-3.5 animate-spin" />
              ) : isHovered ? (
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-white/90" />
              )}
            </button>
          </div>
        );
      })}

      {/* 4. Real-time Floating Stellar Tooltip */}
      {hoveredNote && (
        <div
          style={{
            left: `${Math.min(Math.max(hoveredNote.coords.normX, 15), 85)}%`,
            top: `${Math.min(hoveredNote.coords.normY + 5, 82)}%`,
            transform: 'translate(-50%, 0)',
          }}
          className="absolute z-30 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center gap-2.5 bg-[#0a1f33]/95 backdrop-blur-md border border-[#1f4a70] rounded-xl px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.7)] text-xs min-w-[180px] max-w-[260px]">
            <img
              src={hoveredNote.songImageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
              alt={hoveredNote.songTitle}
              className="w-8 h-8 rounded-lg object-cover border border-[#23537e] shrink-0"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100';
              }}
            />
            <div className="overflow-hidden leading-tight">
              <p className="font-bold text-[#E8EEF0] truncate text-[11px]">
                {hoveredNote.songTitle}
              </p>
              <p className="text-[10px] text-[#91B9C5]/80 truncate">
                {hoveredNote.artistName}
              </p>
              {hoveredNote.emotionTag && (
                <span className="inline-block mt-0.5 text-[9px] text-amber-200/90 font-medium truncate">
                  {hoveredNote.emotionTag}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Bottom Overlay HUD Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#071625]/85 backdrop-blur-md border border-[#14324c] text-[11px] text-[#91B9C5]">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span className="font-medium">{stars.length} Audio Constellation Stars</span>
        </div>
        <p className="text-[10px] text-[#91B9C5]/60 hidden sm:block">
          Tap any star to inspect memory and listen
        </p>
      </div>
    </div>
  );
}

