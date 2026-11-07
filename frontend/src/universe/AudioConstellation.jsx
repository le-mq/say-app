import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles, Play, Pause, Disc, Music, Eye, Calendar,
  Share2, Compass, Layers, Filter, Orbit, Zap, Heart, Clock
} from 'lucide-react';
import { formatTimeDetails } from '../utils/timeFormat';

/**
 * Deterministic hash algorithm from Chapter 6:
 * Computes invariant (normX, normY) coordinates from noteId
 * so star positions never shift on viewport resize or when new notes are added.
 */
export function getNormalizedCoords(id) {
  if (!id) return { normX: 50, normY: 50 };
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  const str = String(id);
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const absX = Math.abs(h1);
  const absY = Math.abs(h2);
  // Distribute organically across the cosmic nebula
  const normX = 15 + (absX % 70);
  const normY = 18 + (absY % 64);
  return { normX, normY, seed: absX };
}

// Generate aesthetic emotion color palettes matching the SAY lavender/cosmic theme
function getEmotionCosmicColor(tag = '') {
  const lower = String(tag).toLowerCase();
  if (lower.includes('lonely') || lower.includes('melanchol')) {
    return {
      core: '#93c5fd', // Soft blue
      glow: 'rgba(147, 197, 253, 0.65)',
      filament: 'rgba(147, 197, 253, 0.45)',
      ring: 'border-blue-400/40',
      label: 'Lonely / Deep Blue'
    };
  }
  if (lower.includes('dreamy') || lower.includes('ethereal') || lower.includes('nostalgic')) {
    return {
      core: '#c084fc', // Lavender / Violet
      glow: 'rgba(192, 132, 252, 0.65)',
      filament: 'rgba(192, 132, 252, 0.45)',
      ring: 'border-purple-400/40',
      label: 'Dreamy / Cosmic Lavender'
    };
  }
  if (lower.includes('energetic') || lower.includes('upbeat') || lower.includes('warm')) {
    return {
      core: '#fcd34d', // Amber Gold
      glow: 'rgba(252, 211, 77, 0.65)',
      filament: 'rgba(252, 211, 77, 0.45)',
      ring: 'border-amber-400/40',
      label: 'Warm / Golden Dust'
    };
  }
  if (lower.includes('peaceful') || lower.includes('calm') || lower.includes('chill')) {
    return {
      core: '#67e8f9', // Cyan / Aquamarine
      glow: 'rgba(103, 232, 249, 0.65)',
      filament: 'rgba(103, 232, 249, 0.45)',
      ring: 'border-cyan-400/40',
      label: 'Peaceful / Aquamarine'
    };
  }
  // Default celestial starlight
  return {
    core: '#e2e8f0', // Diamond white
    glow: 'rgba(226, 232, 240, 0.6)',
    filament: 'rgba(179, 157, 219, 0.35)',
    ring: 'border-slate-300/30',
    label: 'Celestial White'
  };
}

export default function AudioConstellation({
  notes = [],
  onSelectNote,
  onPlayNote,
  activeNoteId = null,
  isPlaying = false,
  onCreateNote
}) {
  const [hoveredNote, setHoveredNote] = useState(null);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'EMOTION' | 'TEMPORAL' | 'SOLITARY'
  const [selectedEmotion, setSelectedEmotion] = useState(null);

  // Compute rich star nodes with deterministic coordinates and cosmic attributes
  const stars = useMemo(() => {
    return notes.map((note, index) => {
      const coords = getNormalizedCoords(note.id || `temp-note-${index}`);
      const cosmicColors = getEmotionCosmicColor(note.emotionTag);
      const timeMs = new Date(note.createdAt || 0).getTime();
      return {
        ...note,
        coords,
        cosmicColors,
        timeMs,
        index
      };
    });
  }, [notes]);

  // Extract unique emotions for quick filtering
  const availableEmotions = useMemo(() => {
    const set = new Set();
    notes.forEach((n) => {
      if (n.emotionTag) set.add(n.emotionTag);
    });
    return Array.from(set);
  }, [notes]);

  // Compute Constellation Links & Solitary Stars
  // Rules:
  // 1. Emotion Resonance: Stars with same or compatible emotionTag within reasonable cosmic distance
  // 2. Temporal Proximity: Stars created within 72 hours of each other
  // 3. Solitary Beacon: Stars with isolated emotion and >72h distance shine as solitary beacons
  const { links, solitaryStarIds, connectedStarIds } = useMemo(() => {
    const linksList = [];
    const connected = new Set();

    if (stars.length >= 2) {
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const s1 = stars[i];
          const s2 = stars[j];

          // Compute Euclidean distance on map
          const dx = s1.coords.normX - s2.coords.normX;
          const dy = s1.coords.normY - s2.coords.normY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const isSameEmotion =
            s1.emotionTag &&
            s2.emotionTag &&
            s1.emotionTag.toLowerCase().trim() === s2.emotionTag.toLowerCase().trim();

          const timeDiffHours = Math.abs(s1.timeMs - s2.timeMs) / (1000 * 60 * 60);
          const isTemporalNeighbor = timeDiffHours <= 72; // within 3 days

          let linkType = null;
          if (isSameEmotion && dist < 65) {
            linkType = 'EMOTION';
          } else if (isTemporalNeighbor && dist < 50) {
            linkType = 'TEMPORAL';
          }

          if (linkType) {
            linksList.push({
              id: `${s1.id}-${s2.id}`,
              s1,
              s2,
              type: linkType,
              strokeColor: linkType === 'EMOTION' ? s1.cosmicColors.filament : 'rgba(255, 255, 255, 0.3)',
              isDashed: linkType === 'TEMPORAL'
            });
            connected.add(s1.id);
            connected.add(s2.id);
          }
        }
      }
    }

    const solitary = new Set();
    stars.forEach((s) => {
      if (!connected.has(s.id)) {
        solitary.add(s.id);
      }
    });

    return {
      links: linksList,
      solitaryStarIds: solitary,
      connectedStarIds: connected
    };
  }, [stars]);

  // Filter links based on user toggle
  const visibleLinks = useMemo(() => {
    if (filterMode === 'SOLITARY') return [];
    return links.filter((link) => {
      if (selectedEmotion) {
        return (
          link.s1.emotionTag?.toLowerCase() === selectedEmotion.toLowerCase() &&
          link.s2.emotionTag?.toLowerCase() === selectedEmotion.toLowerCase()
        );
      }
      if (filterMode === 'EMOTION') return link.type === 'EMOTION';
      if (filterMode === 'TEMPORAL') return link.type === 'TEMPORAL';
      return true; // 'ALL'
    });
  }, [links, filterMode, selectedEmotion]);

  // Precomputed background dust particles (deterministic, 0 extra CPU/GPU load)
  const bgParticles = useMemo(() => {
    const list = [];
    for (let i = 0; i < 48; i++) {
      const x = (i * 37) % 96 + 2;
      const y = (i * 61) % 94 + 3;
      const size = (i % 3 === 0) ? 2 : 1.2;
      const delay = (i % 7) * 0.8;
      const duration = 3.5 + (i % 5);
      const isLavender = i % 4 === 0;
      list.push({ x, y, size, delay, duration, isLavender });
    }
    return list;
  }, []);

  if (notes.length === 0) {
    return (
      <div className="relative w-full h-[500px] sm:h-[580px] rounded-3xl bg-gradient-to-b from-[#080f1d] via-[#050b14] to-[#020509] border border-white/[0.08] flex flex-col items-center justify-center p-8 text-center overflow-hidden shadow-2xl">
        {/* Ethereal Empty Space Nebula */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(139,92,246,0.12),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(56,189,248,0.08),transparent_60%)] pointer-events-none" />

        {/* Ambient Tiny Stardust */}
        {bgParticles.slice(0, 24).map((p, idx) => (
          <div
            key={idx}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `pulse ${p.duration}s infinite ease-in-out ${p.delay}s`,
            }}
            className={`absolute rounded-full pointer-events-none ${
              p.isLavender ? 'bg-purple-300/40' : 'bg-cyan-200/40'
            }`}
          />
        ))}

        <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-purple-900/40 via-[#0e2238] to-cyan-900/30 border border-purple-500/30 flex items-center justify-center text-purple-200 mb-5 shadow-[0_0_35px_rgba(168,85,247,0.25)]">
          <Sparkles className="w-10 h-10 animate-pulse text-purple-300" />
        </div>
        <h3 className="text-xl font-serif font-bold text-white tracking-wide mb-2">
          Your Universe is Silent
        </h3>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed font-sans">
          Every Music Note you compose will shine here as an enduring star in your celestial map.
        </p>
        {onCreateNote && (
          <button
            type="button"
            onClick={onCreateNote}
            className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_24px_rgba(168,85,247,0.4)] hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ignite Your First Star</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-[520px] sm:h-[600px] rounded-3xl bg-[#030712] border border-white/[0.08] overflow-hidden select-text shadow-2xl group/constellation">
      {/* =========================================================================
          1. REALISTIC COSMIC NEBULA BACKDROP (TINH VÂN VŨ TRỤ ĐA TẦNG)
          Ultra-lightweight CSS radial layers - 0% CPU overhead, 60fps GPU acceleration
          ========================================================================= */}
      {/* Deep Space Base */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#091326_0%,#030712_80%)] pointer-events-none" />

      {/* Primary Cosmic Nebula: Lavender / Deep Purple core (SAY logo resonance) */}
      <div className="absolute top-[20%] left-[25%] -translate-x-1/2 -translate-y-1/2 w-[540px] h-[440px] bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.16)_0%,rgba(126,34,206,0.06)_45%,transparent_75%)] blur-2xl pointer-events-none mix-blend-screen" />

      {/* Secondary Cosmic Nebula: Aurora Cyan / Indigo cloud */}
      <div className="absolute top-[65%] right-[15%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[380px] bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.14)_0%,rgba(14,116,144,0.05)_50%,transparent_75%)] blur-2xl pointer-events-none mix-blend-screen" />

      {/* Tertiary Warm Starlight Dust: Amber starlight pocket */}
      <div className="absolute bottom-[10%] left-[45%] w-[380px] h-[260px] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.07)_0%,transparent_70%)] blur-3xl pointer-events-none" />

      {/* Ultra-subtle Micro Cosmic Dust & Distant Starfield */}
      {bgParticles.map((p, idx) => (
        <div
          key={`bg-star-${idx}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.size > 1.5 ? 0.65 : 0.35,
            animation: `pulse ${p.duration}s infinite ease-in-out ${p.delay}s`,
          }}
          className={`absolute rounded-full pointer-events-none ${
            p.isLavender ? 'bg-purple-200' : 'bg-cyan-100'
          }`}
        />
      ))}

      {/* =========================================================================
          2. HUD CONTROLS: CONSTELLATION LINK MODES & MOOD FILTERS
          ========================================================================= */}
      <div className="absolute top-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        {/* Left: Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#091524]/80 backdrop-blur-xl border border-white/[0.08] shadow-lg">
          <button
            type="button"
            onClick={() => {
              setFilterMode('ALL');
              setSelectedEmotion(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'ALL' && !selectedEmotion
                ? 'bg-purple-500/25 text-purple-200 border border-purple-400/30 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Orbit className="w-3.5 h-3.5 text-purple-400" />
            <span>Full Galaxy</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterMode('EMOTION');
              setSelectedEmotion(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'EMOTION'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Resonance Links</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterMode('TEMPORAL');
              setSelectedEmotion(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'TEMPORAL'
                ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/30 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Time Threads</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterMode('SOLITARY');
              setSelectedEmotion(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'SOLITARY'
                ? 'bg-amber-500/25 text-amber-200 border border-amber-400/30 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Solitary Beacons ({solitaryStarIds.size})</span>
          </button>
        </div>

        {/* Right: Quick Emotion Filter Pills */}
        {availableEmotions.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-2xl bg-[#091524]/80 backdrop-blur-xl border border-white/[0.08]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 flex items-center gap-1">
              <Filter className="w-3 h-3 text-purple-400" />
              Mood
            </span>
            {availableEmotions.slice(0, 4).map((emo) => {
              const isSelected = selectedEmotion === emo;
              return (
                <button
                  key={emo}
                  type="button"
                  onClick={() => setSelectedEmotion(isSelected ? null : emo)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600/40 text-purple-200 border border-purple-400/50 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {emo}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          3. ETHEREAL CONSTELLATION FILAMENTS (SVG VECTOR LINES)
          ========================================================================= */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="cosmicFilamentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fcd34d" stopOpacity="0.25" />
          </linearGradient>
          <filter id="starlightGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {visibleLinks.map((line) => {
          const isHighlighted =
            hoveredNote?.id === line.s1.id || hoveredNote?.id === line.s2.id;

          return (
            <line
              key={line.id}
              x1={`${line.s1.coords.normX}%`}
              y1={`${line.s1.coords.normY}%`}
              x2={`${line.s2.coords.normX}%`}
              y2={`${line.s2.coords.normY}%`}
              stroke={isHighlighted ? '#e0e7ff' : line.strokeColor}
              strokeWidth={isHighlighted ? '0.6' : '0.35'}
              strokeDasharray={line.isDashed ? '1.5, 1.5' : undefined}
              filter={isHighlighted ? 'url(#starlightGlow)' : undefined}
              className="transition-all duration-300"
            />
          );
        })}
      </svg>

      {/* =========================================================================
          4. INTERACTIVE STAR NODES (MỖI NGÔI SAO LÀ 1 MUSIC NOTE)
          ========================================================================= */}
      {stars.map((star) => {
        const isActive = activeNoteId === star.id;
        const isHovered = hoveredNote?.id === star.id;
        const isSolitary = solitaryStarIds.has(star.id);
        const matchesFilter =
          !selectedEmotion || star.emotionTag?.toLowerCase() === selectedEmotion.toLowerCase();

        return (
          <div
            key={star.id}
            style={{
              left: `${star.coords.normX}%`,
              top: `${star.coords.normY}%`,
              transform: 'translate(-50%, -50%)',
              opacity: matchesFilter ? 1 : 0.25,
            }}
            className="absolute z-20 transition-opacity duration-300"
            onMouseEnter={() => setHoveredNote(star)}
            onMouseLeave={() => setHoveredNote(null)}
          >
            {/* Outer Radiant Corona / Aura Ring */}
            <div
              style={{
                backgroundColor: star.cosmicColors.glow,
              }}
              className={`absolute inset-0 rounded-full transition-all duration-500 pointer-events-none ${
                isActive
                  ? 'w-12 h-12 -left-3 -top-3 blur-md opacity-80 animate-ping'
                  : isHovered
                  ? 'w-10 h-10 -left-2.5 -top-2.5 blur-md opacity-70 scale-125'
                  : isSolitary
                  ? 'w-7 h-7 -left-1.5 -top-1.5 blur-sm opacity-50 animate-pulse'
                  : 'w-5 h-5 -left-1 -top-1 blur-xs opacity-35'
              }`}
            />

            {/* Solitary Beacon Outer Orbital Ring (Đặc trưng cho ngôi sao độc hành) */}
            {isSolitary && (
              <div
                className={`absolute -inset-2.5 rounded-full border border-dashed pointer-events-none transition-all duration-500 ${
                  star.cosmicColors.ring
                } ${isHovered ? 'scale-125 rotate-45 border-white/60' : 'opacity-40 animate-[spin_18s_linear_infinite]'}`}
              />
            )}

            {/* Clickable Living Star Core */}
            <button
              type="button"
              onClick={() => {
                if (onPlayNote) onPlayNote(star);
                if (onSelectNote) onSelectNote(star);
              }}
              style={{
                boxShadow: isActive
                  ? `0 0 24px ${star.cosmicColors.core}, 0 0 8px #ffffff`
                  : isHovered
                  ? `0 0 18px ${star.cosmicColors.core}`
                  : `0 0 10px ${star.cosmicColors.glow}`,
                backgroundColor: star.cosmicColors.core,
              }}
              className={`relative flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'w-6 h-6 ring-4 ring-white/70 scale-125'
                  : isHovered
                  ? 'w-5 h-5 ring-2 ring-white/90 scale-115'
                  : 'w-3.5 h-3.5 hover:scale-125 ring-1 ring-white/40'
              }`}
              title={`${star.songTitle} - ${star.artistName}`}
            >
              {/* Play symbol inside core when active / playing */}
              {isActive && isPlaying ? (
                <div className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-ping" />
              ) : isHovered ? (
                <Play className="w-2.5 h-2.5 text-slate-950 fill-slate-950" />
              ) : null}
            </button>

            {/* Floating Star Label on Hover or Active */}
            {(isHovered || isActive) && (
              <div className="absolute left-1/2 -bottom-7 -translate-x-1/2 whitespace-nowrap pointer-events-auto select-text z-30">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#091524]/90 backdrop-blur-md border border-white/[0.12] text-white shadow-xl select-text">
                  {star.songTitle?.slice(0, 18)}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* =========================================================================
          5. FLOATING COSMIC NOTE DETAIL CARD (HOVER / INSPECT CARD)
          ========================================================================= */}
      {hoveredNote && (
        <div
          style={{
            left: `${Math.min(Math.max(hoveredNote.coords.normX, 18), 82)}%`,
            top: hoveredNote.coords.normY > 60 ? `${hoveredNote.coords.normY - 18}%` : `${hoveredNote.coords.normY + 16}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="absolute z-40 w-72 rounded-2xl bg-gradient-to-b from-[#0e2233]/95 via-[#0a1c2b]/95 to-[#071522]/98 border border-purple-500/30 p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center gap-3 mb-2.5">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/[0.1] shadow-md">
              {hoveredNote.songImageUrl ? (
                <img
                  src={hoveredNote.songImageUrl}
                  alt={hoveredNote.songTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Music className="w-6 h-6" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate tracking-wide select-text">
                {hoveredNote.songTitle}
              </h4>
              <p className="text-[11px] text-slate-400 truncate select-text">
                {hoveredNote.artistName}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {hoveredNote.emotionTag || 'Cosmic'}
                </span>
                {solitaryStarIds.has(hoveredNote.id) && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Solitary Beacon
                  </span>
                )}
              </div>
            </div>

            {/* Play button beside metadata (no cover obstruction) */}
            <button
              type="button"
              onClick={() => {
                if (onPlayNote) onPlayNote(hoveredNote);
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                isPlaying && activeNoteId === hoveredNote.id
                  ? 'bg-cyan-400 text-[#081827] border-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                  : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/30'
              }`}
              title={isPlaying && activeNoteId === hoveredNote.id ? 'Pause Snippet' : 'Play Snippet'}
            >
              {isPlaying && activeNoteId === hoveredNote.id ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
          </div>

          {hoveredNote.caption && (
            <p className="text-[11px] text-slate-300 italic line-clamp-2 mb-2.5 px-2 py-1.5 rounded-lg bg-black/30 border border-white/[0.05]">
              "{hoveredNote.caption}"
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5 font-mono text-slate-300">
              <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>{formatTimeDetails(hoveredNote.createdAt).full}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                if (onSelectNote) onSelectNote(hoveredNote);
              }}
              className="text-cyan-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Audit Note</span>
              <Eye className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. BOTTOM STATS & AUDIOPHILE FOOTER
          ========================================================================= */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between text-xs text-slate-400 pointer-events-none">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full bg-[#091524]/80 backdrop-blur-md border border-white/[0.08] text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{stars.length} Music Stars</span>
          </span>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-[#091524]/80 backdrop-blur-md border border-white/[0.08] text-[11px] font-medium text-slate-300">
            {links.length} Constellation Filaments
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-400">
            Click star to audit & play
          </span>
        </div>
      </div>
    </div>
  );
}
