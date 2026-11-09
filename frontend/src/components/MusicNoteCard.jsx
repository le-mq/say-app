import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Play, Pause, Heart, Bookmark, MessageSquare, Plus, 
  ExternalLink, Disc, Disc3, Orbit, Sparkles, Flame, Coffee, 
  Waves, Music, Users, Headphones, CloudRain, Star, Radio, Moon
} from 'lucide-react';
import { formatTime } from '../services/musicService';
import { formatTimeDetails } from '../utils/timeFormat';
import { usePlayerStore } from '../store/playerStore';

export default function MusicNoteCard({ 
  note, 
  isActive = false, 
  isPlaying = false, 
  onPlayToggle, 
  onReplyAdded, 
  compact = false 
}) {
  const [likes, setLikes] = useState(note?.likesCount ?? note?.likes ?? 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replySongTitle, setReplySongTitle] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState(note?.dialogues || []);

  const { currentTrack, isPlaying: globalIsPlaying, playTrack, togglePlay } = usePlayerStore();
  const isCardPlaying = typeof isPlaying === 'boolean' && isPlaying
    ? true
    : (currentTrack?.id === note?.id && globalIsPlaying);

  useEffect(() => {
    setLikes(note?.likesCount ?? note?.likes ?? 0);
    setReplies(note?.dialogues || []);
  }, [note?.likesCount, note?.likes, note?.dialogues]);

  const timeInfo = formatTimeDetails(note?.createdAt);
  const formattedTimeAgo = note?.timeAgo || timeInfo.relative || "Just now";

  const handleLike = () => {
    setIsLiked(prev => !prev);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleSave = () => {
    setIsSaved(prev => !prev);
    toast.success(!isSaved ? "Saved to your Notes Vault!" : "Removed from Vault");
  };

  const handleAddReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    const newDialogue = {
      id: 'd-' + Date.now(),
      author: note.userDisplayName || 'Audiophile',
      song: replySongTitle.trim() || 'Midnight Wave Response',
      caption: replyText.trim(),
    };
    setReplies(prev => [...prev, newDialogue]);
    setReplySongTitle('');
    setReplyText('');
    setShowReplyInput(false);
    toast.success("Song Dialogue reply posted!");
    if (onReplyAdded) onReplyAdded(note.id);
  };

  const rawTemplate = (note?.templateType || 'RECEIPTIFY').toUpperCase();
  const template = rawTemplate.includes(':') ? rawTemplate.split(':')[0] : rawTemplate;

  // Extract snippetDuration (45s or 30s) seamlessly
  const urlDurationMatch = note?.externalSongUrl?.match(/[#&?]snippetDur=(\d+)/);
  const snippetDuration = Number(
    note?.snippetDuration ||
    (rawTemplate.includes(':') ? rawTemplate.split(':')[1] : null) ||
    (urlDurationMatch ? urlDurationMatch[1] : null) ||
    (note?.audioSnippetEnd && note?.audioSnippetStart !== undefined ? note.audioSnippetEnd - note.audioSnippetStart : null) ||
    30
  );
  const audioSnippetStart = Number(note?.audioSnippetStart) || 0;
  const audioSnippetEnd = audioSnippetStart + snippetDuration;

  const userInitial = (note?.userDisplayName || 'Audiophile').charAt(0).toUpperCase();

  // Resilient internal play toggle
  const handleInternalPlay = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (onPlayToggle) {
      onPlayToggle(e);
    } else if (note?.externalSongUrl || note?.previewAudioUrl) {
      if (currentTrack?.id === note.id && globalIsPlaying) {
        togglePlay();
      } else {
        playTrack({
          ...note,
          audioSnippetStart,
          snippetDuration,
        }, { 
          snippetStart: audioSnippetStart, 
          snippetDuration: snippetDuration, 
          loop: true 
        });
      }
    }
  };

  // Instant Card Click Playback (play snippet anywhere clicked on the card)
  const handleCardClick = (e) => {
    if (e.target.closest('button, input, textarea, a, form')) {
      return;
    }
    handleInternalPlay(e);
  };

  const renderStickerSeal = () => {
    let badge = note.stickerBadge;
    if (!badge || badge === 'None' || badge === 'NONE') return null;

    if (typeof badge === 'string' && badge.startsWith('CUSTOM:')) {
      const stored = typeof window !== 'undefined'
        ? (localStorage.getItem(`say_sticker_${note.id}`) || localStorage.getItem(`say_sticker_${badge}`))
        : null;
      if (stored) {
        badge = stored;
      }
    }

    // 1. Direct Image or GIF URL (Tactile Photobooth Polaroid / Keepsake Snapshot)
    if (typeof badge === 'string' && (badge.startsWith('http://') || badge.startsWith('https://') || badge.startsWith('data:image/') || badge.endsWith('.gif') || badge.endsWith('.png') || badge.endsWith('.webp'))) {
      return (
        <div className="absolute top-2 right-2 z-30 group cursor-pointer transition-all hover:scale-105 hover:rotate-0 -rotate-3">
          <div className="relative p-1.5 pb-2.5 bg-[#fdfbf7] rounded-sm border border-neutral-300/80 shadow-[0_12px_28px_rgba(0,0,0,0.65)] flex flex-col items-center">
            {/* Washi Tape Strip at top (SAY Ice Blue / Cyan Washi Tape) */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-sky-200/90 backdrop-blur-xs rounded-2xs -rotate-1 border-x border-sky-400/60 shadow-xs" />
            
            {/* Enlarged Photo / Animated GIF Container */}
            <div className="w-20 h-20 sm:w-22 sm:h-22 overflow-hidden rounded-2xs bg-black/60 border border-neutral-200/60">
              <img
                src={badge}
                alt="Photobooth memory sticker"
                className="w-full h-full object-cover select-none"
              />
            </div>

            {/* Subtle Photobooth Print Tag */}
            <span className="text-[6.5px] font-mono font-bold tracking-widest uppercase text-slate-500 mt-1 select-none">
              PHOTOBOOT • MEMORY
            </span>
          </div>
        </div>
      );
    }

    // 2. Curated Enamel Badges & GIF Seals
    const BADGE_COMPONENTS = {
      'Vinyl Spin': (
        <div className="w-8 h-8 rounded-full bg-[#0a1520] border-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)] flex items-center justify-center">
          <Disc3 className="w-5 h-5 text-cyan-300 animate-spin-slow" />
        </div>
      ),
      'Neon Pulse': (
        <div className="w-8 h-8 rounded-full bg-rose-950/90 border-2 border-rose-400 shadow-[0_0_14px_rgba(244,63,94,0.7)] flex items-center justify-center">
          <span className="text-xs animate-ping">❤️‍🔥</span>
        </div>
      ),
      'Star Shimmer': (
        <div className="w-8 h-8 rounded-full bg-[#081f33] border-2 border-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.5)] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-sky-300 animate-pulse" />
        </div>
      ),
      'Rain Drops': (
        <div className="w-8 h-8 rounded-full bg-[#0d2238]/90 border border-sky-400/60 shadow-[0_0_12px_rgba(56,189,248,0.35)] flex items-center justify-center">
          <CloudRain className="w-4 h-4 text-sky-300" />
        </div>
      ),
      'Lo-Fi Cat': (
        <div className="w-8 h-8 rounded-full bg-[#0a2233] border-2 border-[#91B9C5] shadow-[0_0_12px_rgba(145,185,197,0.5)] flex items-center justify-center">
          <Radio className="w-4 h-4 text-[#91B9C5]" />
        </div>
      ),
      'Cassette Reel': (
        <div className="w-8 h-8 rounded-xl bg-[#0a1820] border-2 border-[#00594c] shadow-[0_0_12px_rgba(0,89,76,0.6)] flex items-center justify-center">
          <Disc className="w-4 h-4 text-sky-300" />
        </div>
      ),
      'Cosmic Orbit': (
        <div className="w-8 h-8 rounded-full bg-[#0a2138] border-2 border-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.6)] flex items-center justify-center">
          <Orbit className="w-4 h-4 text-sky-200" />
        </div>
      ),
      'Midnight Coffee': (
        <div className="w-8 h-8 rounded-full bg-[#081b2e] border-2 border-amber-400/70 shadow-[0_0_10px_rgba(251,191,36,0.3)] flex items-center justify-center">
          <Coffee className="w-4 h-4 text-amber-300" />
        </div>
      ),
      'Vinyl 33 RPM': (
        <div className="w-8 h-8 rounded-full bg-[#0a1520] border-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)] flex items-center justify-center animate-spin-slow">
          <Disc3 className="w-5 h-5 text-cyan-300" />
        </div>
      ),
      'Crimson Wax': (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-800 to-rose-600 border-2 border-red-300 shadow-[0_4px_12px_rgba(225,29,72,0.7)] flex items-center justify-center font-serif text-[11px] font-bold text-amber-100">
          S
        </div>
      ),
      'Hologram Star': (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00594c] via-[#09354d] to-sky-400 border border-white/80 shadow-[0_0_12px_rgba(255,255,255,0.7)] flex items-center justify-center">
          <Star className="w-4 h-4 text-sky-200 fill-sky-200" />
        </div>
      ),
      'Washi Tape': (
        <div className="px-2 py-0.5 bg-sky-200 text-slate-900 border border-sky-400 text-[8px] font-mono font-bold -rotate-6 shadow-md rounded-xs">
          WASHI
        </div>
      ),
      'Dark Rose': (
        <div className="w-8 h-8 rounded-full bg-[#1a0f14] border-2 border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.4)] flex items-center justify-center">
          <Flame className="w-4 h-4 text-rose-400" />
        </div>
      ),
      'Hi-Fi Headphones': (
        <div className="w-8 h-8 rounded-full bg-[#0b1c2b] border-2 border-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.5)] flex items-center justify-center">
          <Headphones className="w-4 h-4 text-cyan-400" />
        </div>
      ),
      'Headphones': (
        <div className="w-8 h-8 rounded-full bg-[#0b1c2b] border-2 border-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.5)] flex items-center justify-center">
          <Headphones className="w-4 h-4 text-cyan-400" />
        </div>
      ),
      'Vinyl': (
        <div className="w-8 h-8 rounded-full bg-[#0a1520] border-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)] flex items-center justify-center">
          <Disc3 className="w-5 h-5 text-cyan-300 animate-spin-slow" />
        </div>
      ),
      'Heartbeat': (
        <div className="w-8 h-8 rounded-full bg-rose-950/90 border-2 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.6)] flex items-center justify-center">
          <Heart className="w-4 h-4 text-rose-300 fill-rose-300 animate-pulse" />
        </div>
      ),
      'Equalizer': (
        <div className="w-8 h-8 rounded-full bg-[#07131e] border border-[#1e4c63] shadow-[0_0_8px_rgba(145,185,197,0.3)] flex items-end justify-center gap-px pb-1.5">
          {[1, 3, 2].map((delay, idx) => (
            <div
              key={idx}
              className="w-1 bg-[#91B9C5] rounded-t-sm"
              style={{
                height: `${[10, 14, 8][idx]}px`,
                animation: `eqBar${idx} 0.9s ease-in-out ${delay * 0.15}s infinite alternate`,
                transformOrigin: 'bottom',
              }}
            />
          ))}
          <style>{`
            @keyframes eqBar0 { from { height: 6px; } to { height: 12px; } }
            @keyframes eqBar1 { from { height: 12px; } to { height: 16px; } }
            @keyframes eqBar2 { from { height: 4px; } to { height: 10px; } }
          `}</style>
        </div>
      ),
      'Floating notes': (
        <div className="w-8 h-8 rounded-full bg-[#092236] border-2 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.6)] flex items-center justify-center">
          <Music className="w-4 h-4 text-sky-300" />
        </div>
      ),
      'Moon': (
        <div className="w-8 h-8 rounded-full bg-[#081e33] border-2 border-amber-300/80 shadow-[0_0_12px_rgba(251,191,36,0.4)] flex items-center justify-center">
          <Moon className="w-4 h-4 text-amber-200 fill-amber-200/40" />
        </div>
      ),
      'Orbit': (
        <div className="w-8 h-8 rounded-full bg-[#081e33] border-2 border-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.7)] flex items-center justify-center">
          <Orbit className="w-4 h-4 text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.9)]" />
        </div>
      ),
      'Flame Seal': (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-950 via-[#0a2335] to-[#04121c] border-2 border-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.7)] flex items-center justify-center">
          <Flame className="w-4 h-4 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
        </div>
      ),
      'Zen Leaf': (
        <div className="w-8 h-8 rounded-full bg-[#072417] border-2 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
        </div>
      ),
      'Ocean Wave': (
        <div className="w-8 h-8 rounded-full bg-[#061e30] border-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)] flex items-center justify-center">
          <Waves className="w-4 h-4 text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
        </div>
      ),
    };

    return (
      <div className="absolute top-2.5 right-3 z-30 hover:scale-110 transition-transform">
        {BADGE_COMPONENTS[badge] || (
          <div className="w-8 h-8 rounded-full bg-[#081724]/90 border border-white/20 shadow-md flex items-center justify-center text-base leading-none select-none">
            {badge}
          </div>
        )}
      </div>
    );
  };

  return (
    <article 
      onClick={handleCardClick}
      className={`relative w-full max-w-[440px] rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-500 select-text backdrop-blur-2xl cursor-pointer group/notecard bg-gradient-to-b from-[#0e253b]/95 via-[#091c2e]/96 to-[#061422]/98 border border-sky-400/25 shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden ${
        compact ? 'h-[360px] p-3' : 'h-[500px]'
      } ${
        isActive 
          ? 'opacity-100 ring-1 ring-sky-400/40' 
          : 'opacity-85 hover:opacity-100'
      }`}
    >
      {/* SAY Ambient Navy & Petrol Blue radial glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,89,76,0.2)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.12)_0%,transparent_50%)] pointer-events-none" />
      
      {/* 1. HEADER: User Identity, Time & Emotion Tag (Chapter 4.7) */}
      <div className="relative z-10 flex items-center justify-between gap-2 pb-2.5 border-b border-sky-500/20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#102942] border border-sky-400/40 shrink-0">
            {note.userAvatarUrl ? (
              <img src={note.userAvatarUrl} alt={note.userDisplayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-xs text-sky-200">
                {userInitial}
              </div>
            )}
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-[#E8EEF0] truncate leading-tight flex items-center gap-1">
              <span>{note.userDisplayName || "Audiophile"}</span>
            </h4>
            <p className="text-[10px] font-mono text-[#91B9C5] truncate flex items-center gap-1.5">
              {timeInfo.isToday ? (
                <span>{timeInfo.relative || "Just now"}</span>
              ) : timeInfo.diffDays === 1 ? (
                <>
                  <span>Yesterday</span>
                  {timeInfo.time && <span className="text-sky-400/60">· {timeInfo.time}</span>}
                </>
              ) : (
                <>
                  <span>{timeInfo.date}</span>
                  {timeInfo.time && <span className="text-sky-400/60">· {timeInfo.time}</span>}
                  <span className="text-sky-400/50">({timeInfo.relative})</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Visibility & Emotion Tag */}
        <div className="flex items-center gap-1.5 shrink-0">
          {note.visibility === 'FRIENDS' && (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#0a2338] text-sky-200 border border-sky-400/40 flex items-center gap-1">
              <Users className="w-2.5 h-2.5 text-sky-300" />
              <span>Friends</span>
            </span>
          )}
          {note.emotionTag && (
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#0c243a]/90 text-sky-200 border border-sky-400/40 shadow-xs">
              {note.emotionTag}
            </span>
          )}
        </div>
      </div>

      {/* 2. CENTER PIECE: STANDARDIZED PHYSICAL ARTIFACT TEMPLATE */}
      <div className="relative z-10 flex-1 w-full my-2 flex items-center justify-center overflow-hidden">
        
        {/* TEMPLATE A: RECEIPTIFY TICKET (Space Jazz & Cinema Ticket Stub) */}
        {template === 'RECEIPTIFY' && (
          <div className="relative w-full h-[230px] bg-[#f4efe8] text-[#121316] p-3 font-mono shadow-[0_14px_35px_rgba(0,0,0,0.6)] rounded-xl border border-[#d8d0c0] flex flex-col justify-between overflow-hidden">
            {renderStickerSeal()}

            {/* Left Perforated Tear Notch & Punch Holes */}
            <div className="absolute left-0 top-0 bottom-0 w-3 flex flex-col justify-between py-2 items-center pointer-events-none opacity-40">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#121316]" />
              ))}
            </div>

            <div className="pl-4 pr-12">
              {/* Header: Boarding Pass & Space Jazz / Cinema Archive */}
              <div className="flex items-center justify-between border-b border-dashed border-neutral-400 pb-1 mb-2 text-[8px] font-bold tracking-widest uppercase text-neutral-700">
                <span className="flex items-center gap-1 text-neutral-900">
                  <span>★ VIP BOARDING PASS</span>
                </span>
                <span className="font-mono text-[7.5px] text-neutral-500">
                  {note.orderNumber || (note.id ? `PASS #${note.id.toString().slice(-4).toUpperCase()}` : "TICKET #01")}
                </span>
              </div>

              {/* Main Ticket Area: Clear Album Artwork + Flight/Track Metadata */}
              <div className="flex items-center gap-3">
                {/* Vivid Album Artwork Frame with Play Button */}
                <div className="relative w-15 h-15 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-neutral-800 shadow-sm shrink-0 group bg-neutral-900">
                  <img
                    src={note.songImageUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500"}
                    alt={note.songTitle}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={handleInternalPlay}
                    className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-neutral-900/90 hover:bg-black text-[#f4efe8] flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
                    title={isCardPlaying ? "Pause Audio" : "Play Audio"}
                  >
                    {isCardPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                  </button>
                </div>

                {/* Track Details */}
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif font-black text-[12px] sm:text-[13px] uppercase tracking-wide text-neutral-900 leading-tight truncate">
                    {note.songTitle || "FLY ME TO THE MOON / SPACE JAZZ"}
                  </h3>
                  <p className="text-[9px] font-mono tracking-widest uppercase text-neutral-600 font-bold truncate mt-0.5">
                    {note.artistName || "NEIL ARMSTRONG & THE CREW"}
                  </p>
                  {note.lyricSnippet && (
                    <div className="mt-1 p-1 bg-[#e8e2d5] border-l-2 border-neutral-900 text-[8.5px] font-serif italic font-bold tracking-wide leading-tight text-neutral-900 line-clamp-1 break-words">
                      "{note.lyricSnippet}"
                    </div>
                  )}
                  {note.caption && !note.lyricSnippet && (
                    <div className="mt-1 text-[8px] leading-tight text-neutral-700 flex items-start gap-1 line-clamp-1">
                      <Sparkles className="w-2.5 h-2.5 text-neutral-500 shrink-0 mt-0.5" />
                      <span>"{note.caption}"</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Swiss Metadata Grid + Barcode + Soundwave Indicator */}
            <div className="pl-4 pr-2 pt-1.5 border-t border-dashed border-neutral-400 flex items-end justify-between">
              {/* Grid: Hall, Seat, Clip */}
              <div className="space-y-0.5 text-[7.5px] text-neutral-600 uppercase font-mono">
                <div className="flex items-center gap-2">
                  <span>GATE: <strong className="text-neutral-900">F3</strong></span>
                  <span>SEAT: <strong className="text-neutral-900">21J</strong></span>
                  <span>CLIP: <strong className="text-neutral-900">{formatTime(audioSnippetStart)} - {formatTime(audioSnippetEnd)}</strong></span>
                </div>
                {/* Barcode lines */}
                <div className="flex items-center gap-0.5 h-3.5 pt-0.5 opacity-85">
                  {[2, 4, 1, 3, 5, 2, 6, 1, 4, 2, 5, 3, 2, 6, 1, 3, 4, 2, 5, 1, 3].map((w, idx) => (
                    <div key={idx} className="bg-neutral-900 h-full" style={{ width: `${w % 3 + 1}px` }} />
                  ))}
                  <span className="text-[6.5px] font-mono tracking-tighter ml-1">067416-23J</span>
                </div>
              </div>

              {/* Soundwaves indicator */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 h-3 text-neutral-900">
                  {[3, 7, 12, 16, 11, 6, 14, 18, 10, 5, 12, 8].map((h, i) => (
                    <span 
                      key={i} 
                      className="w-0.5 bg-neutral-800 rounded-full" 
                      style={{ height: isCardPlaying ? `${Math.max(4, (h * 1.2) % 16)}px` : `${h}px` }} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEMPLATE B: CASSETTE TAPE (Memory Anchors Acrylic Tape) */}
        {template === 'CASSETTE' && (
          <div className="relative w-full h-[230px] bg-[#101724]/90 backdrop-blur-md text-[#E8EEF0] p-3 rounded-2xl border-2 border-white/20 shadow-[0_16px_36px_rgba(0,0,0,0.65)] font-mono flex flex-col justify-between overflow-hidden">
            {renderStickerSeal()}

            {/* 4 Precision Metal Screws in Corners */}
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-slate-400/80 border border-black/40 flex items-center justify-center text-[7px] text-slate-800 font-bold select-none">+</div>
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-slate-400/80 border border-black/40 flex items-center justify-center text-[7px] text-slate-800 font-bold select-none">+</div>
            <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-slate-400/80 border border-black/40 flex items-center justify-center text-[7px] text-slate-800 font-bold select-none">+</div>
            <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-slate-400/80 border border-black/40 flex items-center justify-center text-[7px] text-slate-800 font-bold select-none">+</div>

            {/* Top Washi Tape Header: SAY Ice Blue + Aston Martin Duo-tone Label */}
            <div className="relative mx-auto -mt-1 px-3 py-1 bg-gradient-to-r from-[#d2e4f5] via-[#bdd9f2] to-[#00594c]/25 text-slate-900 rounded-sm shadow-sm border border-sky-300/40 flex items-center justify-between w-[94%] z-10 pr-12">
              <span className="text-[9px] font-mono font-bold tracking-widest text-slate-950">
                MEMORY ANCHORS • VOL.0225
              </span>
              <span className="text-[8px] font-mono font-bold text-[#00594c] uppercase">
                RUNTIME 33:33
              </span>
            </div>

            {/* Track Metadata with Clear Album Artwork & Lyric Quote */}
            <div className="my-1 px-2.5 py-1.5 bg-[#081522]/95 rounded-xl border border-sky-400/30 flex items-center gap-2.5">
              {/* Square Album Cover on Cassette Label */}
              <div className="w-13 h-13 rounded-lg overflow-hidden border border-sky-400/50 shrink-0 shadow-md relative group">
                <img
                  src={note.songImageUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500"}
                  alt={note.songTitle}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif italic font-bold text-[12px] sm:text-[13px] text-sky-200 tracking-wide truncate">
                  {note.songTitle || "ALBERTO BALSALM TAPE DUB"}
                </h3>
                <p className="text-[9.5px] text-[#91B9C5] font-mono tracking-wider truncate font-semibold">
                  {note.artistName || "Aphex Twin"}
                </p>
                {note.lyricSnippet && (
                  <p className="mt-0.5 text-[8.5px] font-serif italic font-bold text-sky-100 tracking-wide leading-tight line-clamp-1 border-l-2 border-sky-400 pl-1 break-words">
                    "{note.lyricSnippet}"
                  </p>
                )}
              </div>
            </div>

            {/* Cassette Mechanical Spool Window & Magnetic Tape */}
            <div className="bg-[#040c14]/95 rounded-xl p-2 flex items-center justify-around border border-sky-500/20 relative">
              {/* Left Spool */}
              <div className={`w-8 h-8 rounded-full border-2 border-dashed border-sky-400/50 flex items-center justify-center bg-white/10 ${isCardPlaying ? 'animate-spin' : ''}`}>
                <div className="w-3 h-3 rounded-full bg-white flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-neutral-900" />
                </div>
              </div>

              {/* Center Magnetic Tape Strip + Tactile Ice Blue Play Button */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleInternalPlay}
                  className="w-6 h-6 rounded-full bg-sky-400 hover:bg-sky-300 text-slate-950 flex items-center justify-center font-bold cursor-pointer transition-all shadow-md mb-0.5"
                  title={isCardPlaying ? "Pause Tape" : "Play Tape Snippet"}
                >
                  {isCardPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                </button>
                <span className="text-[7px] font-mono tracking-widest text-sky-300 uppercase">
                  TYPE II CHROME • 60 MIN
                </span>
              </div>

              {/* Right Spool */}
              <div className={`w-8 h-8 rounded-full border-2 border-dashed border-sky-400/50 flex items-center justify-center bg-white/10 ${isCardPlaying ? 'animate-spin' : ''}`}>
                <div className="w-3 h-3 rounded-full bg-white flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-neutral-900" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEMPLATE C: AIRMAIL POSTAGE STAMP & CINEMA PASS */}
        {template === 'STAMP' && (
          <div className="relative w-full h-[230px] bg-[#f5f2eb] text-[#141619] p-3 font-mono shadow-[0_16px_36px_rgba(0,0,0,0.65)] rounded-lg border-2 border-dashed border-[#b8ae9c] flex flex-col justify-between overflow-hidden">
            {renderStickerSeal()}

            {/* Scalloped Perforated Edge Notches (Circular cutouts) */}
            <div className="absolute -left-2 top-0 bottom-0 flex flex-col justify-between py-2 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-3.5 h-3.5 rounded-full bg-[#0a101b] border border-black/30" />
              ))}
            </div>
            <div className="absolute -right-2 top-0 bottom-0 flex flex-col justify-between py-2 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-3.5 h-3.5 rounded-full bg-[#0a101b] border border-black/30" />
              ))}
            </div>

            {/* Inner Header */}
            <div className="pl-3 pr-12 flex items-center justify-between border-b border-neutral-400/80 pb-1 text-[8px] font-bold tracking-widest uppercase text-neutral-700">
              <span className="flex items-center gap-1.5 text-neutral-900">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00594c]" />
                <span>SAY AIRMAIL • POSTAGE 33¢</span>
              </span>
              <span className="font-mono text-[7.5px] text-neutral-600">
                PAR AVION
              </span>
            </div>

            {/* Middle: Prominent Stamp Artwork Frame + Track Info */}
            <div className="pl-3 pr-2 flex items-center gap-3 my-auto">
              {/* Rare Postage Stamp Frame */}
              <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-sm bg-white p-1 border border-neutral-400 shadow-md shrink-0 flex items-center justify-center overflow-hidden group">
                <img
                  src={note.songImageUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500"}
                  alt={note.songTitle}
                  className="w-full h-full object-cover rounded-2xs"
                />
                {/* Circular Postmark Cancellation Ring */}
                <div className="absolute inset-0 border border-neutral-800/40 rounded-full scale-110 pointer-events-none" />
                <button
                  type="button"
                  onClick={handleInternalPlay}
                  className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all cursor-pointer opacity-90 group-hover:opacity-100"
                  title={isCardPlaying ? "Pause Audio" : "Play Audio"}
                >
                  {isCardPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
              </div>

              {/* Title, Artist, and Lyric */}
              <div className="min-w-0 flex-1">
                <h3 className="font-serif font-black text-[12.5px] uppercase tracking-wide text-neutral-900 leading-tight truncate">
                  {note.songTitle || "COHERENCE / MIDNIGHT SOUND"}
                </h3>
                <p className="text-[9.5px] font-mono tracking-wider uppercase text-neutral-600 font-bold truncate mt-0.5">
                  {note.artistName || "James Ward Byrkit"}
                </p>
                {note.lyricSnippet && (
                  <p className="mt-1 text-[8.5px] font-serif italic text-neutral-800 line-clamp-2 border-l-2 border-neutral-900 pl-1.5 leading-snug">
                    "{note.lyricSnippet}"
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Dotted Cinema / Airmail Grid */}
            <div className="pl-3 pr-2 border-t border-dashed border-neutral-400 pt-1 flex items-center justify-between text-[7.5px] text-neutral-600 uppercase font-mono">
              <div className="flex items-center gap-2">
                <span>HALL: <strong className="text-neutral-900">05</strong></span>
                <span>SEAT: <strong className="text-neutral-900">06-10</strong></span>
                <span>PRICE: <strong className="text-neutral-900">33.3</strong></span>
              </div>
              <div className="flex items-center gap-1 text-neutral-800 font-bold">
                <span>CLIP: {formatTime(audioSnippetStart)} - {formatTime(audioSnippetEnd)}</span>
              </div>
            </div>
          </div>
        )}

        {/* TEMPLATE D: CONCERT VINYL RECORD & SLIDING ALBUM JACKET */}
        {template === 'VINYL' && (
          <div className="relative w-full h-[230px] bg-gradient-to-br from-[#0c1e33] via-[#081827] to-[#040e18] text-[#E8EEF0] p-3 rounded-2xl border border-sky-400/30 shadow-[0_18px_40px_rgba(0,0,0,0.85)] font-mono flex flex-col justify-between overflow-hidden group">
            {renderStickerSeal()}

            {/* Ambient Petrol & Aston Martin Teal Lighting */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,89,76,0.3)_0%,transparent_60%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(56,189,248,0.15)_0%,transparent_50%)] pointer-events-none" />

            {/* Top Bar: Audiophile Vinyl Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-sky-500/20 pb-1.5 pr-14 text-[9px] font-mono tracking-wider">
              <div className="flex items-center gap-1.5 text-sky-300">
                <Disc3 className={`w-3.5 h-3.5 text-sky-400 ${isCardPlaying ? 'animate-spin-slow' : ''}`} />
                <span className="font-bold uppercase tracking-widest text-sky-100 text-[9.5px]">CONCERT VINYL • 33⅓ RPM</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border transition-colors ${
                isCardPlaying 
                  ? 'bg-sky-950/80 text-sky-300 border-sky-400/50 shadow-[0_0_8px_rgba(56,189,248,0.3)]' 
                  : 'bg-[#081b2d] text-sky-400/80 border-sky-500/30'
              }`}>
                {isCardPlaying ? 'PLAYING 33 RPM' : 'STEREO ANALOG'}
              </span>
            </div>

            {/* Center Area: Half Vinyl Disc Emerging Gracefully from Behind Album Jacket */}
            <div className="relative z-10 my-auto flex items-center gap-1 px-1">
              
              {/* Part 1: Square Gatefold Album Jacket (Front - z-20) - 100% Clear Artwork */}
              <div 
                onClick={handleInternalPlay}
                className="relative w-[132px] sm:w-[142px] h-[132px] sm:h-[142px] rounded-xl overflow-hidden bg-[#071421] border border-sky-400/40 shadow-[10px_0_25px_rgba(0,0,0,0.85)] shrink-0 z-20 cursor-pointer group/jacket transition-transform duration-300 hover:scale-[1.02]"
              >
                {/* Jacket Cover Art Texture */}
                <img
                  src={note.songImageUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500"}
                  alt={note.songTitle}
                  className="absolute inset-0 w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover/jacket:scale-105"
                />
                {/* Subtle protective sleeve sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/10 pointer-events-none rounded-xl" />
                
                {/* Jacket Spine Info */}
                <div className="absolute top-1.5 left-1.5 right-1.5 z-10 flex items-center justify-between text-[7px] text-sky-200 font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-[#05101a]/80 border border-sky-400/30 backdrop-blur-xs">
                  <span>SAY VINYL</span>
                  <span className="text-white">STEREO</span>
                </div>
              </div>

              {/* Part 2: The Physical 12" Vinyl Disc - 50% Tucked Behind Jacket Sleeve, 50% Visible & Spinning */}
              <div 
                onClick={handleInternalPlay}
                className="relative z-10 -ml-16 sm:-ml-18 w-[128px] sm:w-[136px] h-[128px] sm:h-[136px] rounded-full shrink-0 flex items-center justify-center cursor-pointer group/disc"
                title="Click vinyl to play / pause snippet"
              >
                <div 
                  className={`relative w-full h-full rounded-full border border-neutral-700/80 shadow-[0_12px_30px_rgba(0,0,0,0.95)] flex items-center justify-center transition-transform hover:scale-105 ${
                    isCardPlaying ? 'animate-spin-slow' : ''
                  }`}
                  style={{
                    background: 'radial-gradient(circle, #0e1724 0%, #06090e 28%, #162436 44%, #05080e 58%, #121c2c 74%, #030508 100%)',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.9), inset 0 0 10px rgba(255,255,255,0.08), inset 0 0 20px rgba(56,189,248,0.15)'
                  }}
                >
                  {/* Etched Vinyl Microgrooves */}
                  <div className="absolute inset-2 rounded-full border border-white/[0.07] pointer-events-none" />
                  <div className="absolute inset-4 rounded-full border border-white/[0.09] pointer-events-none" />
                  <div className="absolute inset-6 rounded-full border border-white/[0.07] pointer-events-none" />
                  <div className="absolute inset-8 rounded-full border border-white/[0.09] pointer-events-none" />

                  {/* Vinyl Radial Light Sheen */}
                  <div 
                    className="absolute inset-0 rounded-full pointer-events-none opacity-25"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.3) 45deg, transparent 90deg, rgba(255,255,255,0.3) 135deg, transparent 180deg, rgba(255,255,255,0.3) 225deg, transparent 270deg, rgba(255,255,255,0.3) 315deg, transparent 360deg)'
                    }}
                  />

                  {/* Center Paper Spindle Label */}
                  <div className="relative w-11 h-11 rounded-full overflow-hidden border border-sky-400/60 shadow-inner flex items-center justify-center p-0.5 bg-[#081c2e]">
                    <img
                      src={note.songImageUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500"}
                      alt="Spindle label"
                      className="w-full h-full object-cover rounded-full"
                    />
                    
                    {/* Spindle Center Hole + Tactile Play Button */}
                    <button
                      type="button"
                      onClick={handleInternalPlay}
                      className="absolute inset-0 m-auto w-5.5 h-5.5 rounded-full bg-sky-400 hover:bg-sky-300 text-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer z-30"
                      title={isCardPlaying ? "Pause Vinyl" : "Play Vinyl"}
                    >
                      {isCardPlaying ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current ml-0.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Part 3: Audiophile Track Metadata Sheet (Right) */}
              <div className="relative z-10 flex-1 min-w-0 pl-2 sm:pl-3 flex flex-col justify-center text-left">
                <div className="flex items-center gap-1.5 text-[8px] text-sky-400 font-mono tracking-wider">
                  <span className={`w-1.5 h-1.5 rounded-full ${isCardPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-sky-500'}`} />
                  <span className="font-bold uppercase">{isCardPlaying ? 'NOW SPINNING' : 'ANALOG 33⅓'}</span>
                </div>
                <h3 className="font-serif font-black text-[12px] sm:text-[13px] uppercase tracking-wide text-white leading-tight truncate mt-1">
                  {note.songTitle || "UNTITLED TRACK"}
                </h3>
                <p className="text-[9.5px] font-mono tracking-wider text-sky-300 font-bold truncate mt-0.5">
                  {note.artistName || "Artist Name"}
                </p>
                {note.lyricSnippet && (
                  <p className="mt-1 text-[8px] font-serif italic text-slate-300 line-clamp-2 border-l-2 border-sky-400/60 pl-1.5 leading-snug">
                    "{note.lyricSnippet}"
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInternalPlay}
                    className="px-2 py-0.5 rounded-md bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 text-[8px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    {isCardPlaying ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                    <span>{isCardPlaying ? 'PAUSE' : 'PLAY CLIP'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Bar: Needle / Clip Info & Audio Fidelity Tag */}
            <div className="relative z-10 flex items-center justify-between border-t border-sky-500/20 pt-1 text-[8.5px] font-mono text-sky-400/90">
              <div className="flex items-center gap-1.5 text-sky-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00594c] shadow-[0_0_6px_rgba(0,89,76,0.9)]" />
                <span>CLIP: {formatTime(audioSnippetStart)} - {formatTime(audioSnippetEnd)}</span>
              </div>
              <span className="tracking-widest uppercase text-sky-300 font-bold">
                HIGH FIDELITY • SAY TACTILE
              </span>
            </div>
          </div>
        )}

        {/* TEMPLATE E: CELESTIAL STAR-BELT & 3D OBLIQUE ORBITAL PLANE */}
        {template === 'GALAXY' && (
          <div 
            onClick={handleInternalPlay}
            className="relative w-full h-[230px] bg-gradient-to-b from-[#051220] via-[#030b14] to-[#01050a] text-[#E8EEF0] p-3 rounded-2xl border border-sky-400/35 shadow-[0_20px_45px_rgba(0,0,0,0.9)] font-mono flex flex-col justify-between overflow-hidden cursor-pointer select-none group"
            title="Click cosmic star-belt to play / pause snippet"
          >
            {renderStickerSeal()}

            {/* Cosmic Starfield & Nebula Glows */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.14)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,89,76,0.3)_0%,transparent_55%)] pointer-events-none" />
            <div className="absolute top-3 left-8 w-1 h-1 rounded-full bg-cyan-200/90 shadow-[0_0_6px_rgba(56,189,248,1)] animate-ping pointer-events-none" />
            <div className="absolute top-10 right-20 w-1.5 h-1.5 rounded-full bg-sky-200/80 pointer-events-none" />
            <div className="absolute bottom-6 left-12 w-1 h-1 rounded-full bg-amber-200/90 shadow-[0_0_6px_rgba(251,191,36,0.8)] pointer-events-none" />

            {/* Top Header: Cosmic Orbit Coordinates */}
            <div className="relative z-20 flex items-center justify-between border-b border-sky-500/20 pb-1.5 pr-14 text-[9px] font-mono tracking-wider">
              <div className="flex items-center gap-1.5 text-cyan-300">
                <Orbit className={`w-3.5 h-3.5 text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)] ${isCardPlaying ? 'animate-spin-slow' : ''}`} />
                <span className="font-bold uppercase tracking-widest text-sky-100 text-[9.5px]">CELESTIAL STAR-BELT • GALAXY</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border transition-colors ${
                isCardPlaying 
                  ? 'bg-amber-950/80 text-amber-300 border-amber-400/60 shadow-[0_0_8px_rgba(251,191,36,0.4)]' 
                  : 'bg-[#081b2d] text-cyan-300/90 border-cyan-500/40'
              }`}>
                {isCardPlaying ? 'ORBIT EXPEDITION' : 'DEEP SPACE SYNC'}
              </span>
            </div>

            {/* Main Cosmic Stage: 3D Oblique Star-Belt & Tilted Orbital Plane (Zero Obscuring Cards) */}
            <div className="relative z-10 w-full h-[145px] flex items-center justify-center overflow-hidden [perspective:850px]">
              
              {/* 1. Diagonal Milky Way Stardust Lane (Dãy sao ngân hà xéo) */}
              <div 
                className="absolute w-[360px] h-[70px] -rotate-15 pointer-events-none opacity-45 blur-lg"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.3) 0%, rgba(99,102,241,0.18) 45%, transparent 75%)'
                }}
              />
              <div 
                className="absolute w-[300px] h-[1.5px] -rotate-15 pointer-events-none opacity-60"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(186,230,253,0.85) 50%, transparent 100%)'
                }}
              />

              {/* Twinkling Stardust Constellations along the belt */}
              <div className="absolute top-5 left-14 w-1.5 h-1.5 rounded-full bg-cyan-200 shadow-[0_0_8px_rgba(56,189,248,0.9)] animate-pulse pointer-events-none" />
              <div className="absolute bottom-5 right-16 w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-ping pointer-events-none" />
              <div className="absolute top-8 right-28 w-1 h-1 rounded-full bg-white/90 pointer-events-none" />
              <div className="absolute bottom-8 left-24 w-1 h-1 rounded-full bg-purple-300/90 pointer-events-none" />

              {/* 2. 3D Tilted Orbital Plane (Góc nhìn xéo nghệ thuật, không giống đĩa phẳng) */}
              <div 
                className="relative w-[320px] h-[320px] flex items-center justify-center pointer-events-none"
                style={{
                  transform: 'rotateX(68deg) rotateZ(-22deg)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Concentric Elliptical Orbit Rings Revolving in 3D */}
                <div className={`relative w-full h-full flex items-center justify-center ${isCardPlaying ? 'animate-spin-slow' : ''}`}>
                  
                  {/* Outer Orbit (Neptune Orbit) */}
                  <div className="absolute w-[295px] h-[295px] rounded-full border border-sky-400/25 shadow-[0_0_12px_rgba(56,189,248,0.15)]" />
                  {/* Neptune Planet */}
                  <div className="absolute top-[28px] left-[70px] w-3 h-3 rounded-full bg-gradient-to-tr from-teal-400 to-sky-300 shadow-[0_0_10px_rgba(45,212,191,0.9)] ring-1 ring-white/60" />

                  {/* Orbit 4 (Saturn with Ring) */}
                  <div className="absolute w-[235px] h-[235px] rounded-full border border-amber-400/25 shadow-[0_0_10px_rgba(251,191,36,0.12)]" />
                  {/* Saturn Planet with Ring */}
                  <div className="absolute bottom-[36px] right-[48px] flex items-center justify-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-200 via-amber-400 to-yellow-600 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                    <div className="absolute w-6 h-2 border border-amber-300 rounded-full -rotate-12 pointer-events-none" />
                  </div>

                  {/* Orbit 3 (Jupiter) */}
                  <div className="absolute w-[180px] h-[180px] rounded-full border border-sky-300/25 shadow-[0_0_8px_rgba(56,189,248,0.1)]" />
                  {/* Jupiter Planet */}
                  <div className="absolute top-[38px] right-[45px] w-4 h-4 rounded-full bg-gradient-to-tr from-amber-700 via-orange-400 to-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.8)] ring-1 ring-amber-300/50" />

                  {/* Orbit 2 (Earth + Moon) */}
                  <div className="absolute w-[130px] h-[130px] rounded-full border border-teal-400/30 shadow-[0_0_8px_rgba(20,184,166,0.15)]" />
                  {/* Earth + Moon */}
                  <div className="absolute bottom-[18px] left-[30px] flex items-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#00594c] via-sky-400 to-sky-200 shadow-[0_0_10px_rgba(56,189,248,1)] ring-1 ring-white/80" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 ml-0.5 shadow-sm" />
                  </div>

                  {/* Orbit 1 (Mars) */}
                  <div className="absolute w-[90px] h-[90px] rounded-full border border-rose-400/30" />
                  {/* Mars Planet */}
                  <div className="absolute top-[14px] left-[28px] w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-rose-600 to-red-400 shadow-[0_0_8px_rgba(244,63,94,0.9)]" />

                </div>
              </div>

              {/* 3. Upright Central Solar Star (Sun / Galactic Core facing viewer) */}
              <div 
                onClick={handleInternalPlay}
                className="absolute z-20 w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-orange-400 to-yellow-200 shadow-[0_0_28px_rgba(251,146,60,0.95)] border-2 border-amber-300 flex items-center justify-center cursor-pointer group/sun hover:scale-110 transition-transform"
                title={isCardPlaying ? "Pause Cosmic Orbit" : "Play Cosmic Orbit"}
              >
                <img
                  src={note.songImageUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500"}
                  alt="Solar core"
                  className="w-full h-full object-cover rounded-full"
                />
                {/* Center Solar Tactile Play Button */}
                <button
                  type="button"
                  onClick={handleInternalPlay}
                  className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-115 cursor-pointer z-30"
                  title={isCardPlaying ? "Pause Cosmic Orbit" : "Play Cosmic Orbit"}
                >
                  {isCardPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                </button>
              </div>

            </div>

            {/* Bottom Bar: Clean Single-Line Audiophile Ticker (Zero Screen Blockage) */}
            <div className="relative z-20 flex items-center justify-between border-t border-sky-500/20 pt-1.5 text-[8.5px] font-mono text-sky-400">
              <div className="flex items-center gap-1.5 min-w-0 pr-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] shrink-0 animate-pulse" />
                <span className="font-serif font-black text-[10.5px] uppercase tracking-wide text-white truncate drop-shadow-sm">
                  {note.songTitle || "UNTITLED TRACK"}
                </span>
                <span className="text-sky-300 font-bold truncate">
                  • {note.artistName || "Artist"}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 font-bold">
                <span className="text-amber-200">⏱️ {formatTime(audioSnippetStart)} - {formatTime(audioSnippetEnd)}</span>
                <span className="text-sky-300 tracking-wider uppercase hidden sm:inline">
                  • {note.emotionTag || "Cosmic"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. PERSONAL CAPTION (Chapter 4.7) */}
      {note.caption && (
        <div className="px-1 py-1 text-xs text-[#A59CB5] font-sans line-clamp-2 flex items-start gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#B39DDB] shrink-0 mt-0.5" />
          <span className="italic">"{note.caption}"</span>
        </div>
      )}

      {/* 4. ACTIONS & SONG DIALOGUE (Chapter 4.7) */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2 shrink-0">
        
        {/* Like & Save Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
              isLiked ? 'text-rose-400 bg-rose-950/40' : 'text-[#A59CB5]/80 hover:text-white hover:bg-white/[0.05]'
            }`}
            title="Like Note"
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="text-[10px] text-neutral-300 font-bold">{likes}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isSaved ? 'text-sky-300 bg-sky-950/70 border border-sky-400/40' : 'text-[#91B9C5]/80 hover:text-white hover:bg-white/[0.05]'
            }`}
            title={isSaved ? "Saved" : "Save to Vault"}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Reply with Song Button */}
        <button
          type="button"
          onClick={() => setShowReplyInput(!showReplyInput)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer ${
            showReplyInput 
              ? 'bg-sky-500/20 text-sky-200 border border-sky-400/50 shadow-sm shadow-sky-950/50' 
              : 'bg-white/[0.04] text-[#91B9C5] hover:text-white border border-white/[0.08]'
          }`}
          title="Reply with song dialogue"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold">Reply with Song</span>
          {replies.length > 0 && (
            <span className="text-[9.5px] px-1.5 rounded-full bg-sky-950/90 text-sky-300 border border-sky-400/40">
              {replies.length}
            </span>
          )}
        </button>
      </div>

      {/* Expandable Song Dialogue Input & Thread */}
      {showReplyInput && (
        <div className="mt-2 pt-2 border-t border-white/[0.06] space-y-2 animate-in fade-in duration-150">
          <form onSubmit={handleAddReply} className="space-y-1.5">
            <input
              type="text"
              placeholder="Song title for your reply..."
              value={replySongTitle}
              onChange={(e) => setReplySongTitle(e.target.value)}
              className="w-full bg-[#05101a] border border-sky-500/25 rounded-lg px-2.5 py-1 text-xs text-[#E8EEF0] focus:outline-none focus:border-sky-400 placeholder:text-slate-500 font-mono"
            />
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Write your dialogue note..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-[#05101a] border border-sky-500/25 rounded-lg px-2.5 py-1 text-xs text-[#E8EEF0] focus:outline-none focus:border-sky-400 placeholder:text-slate-500 font-mono"
              />
              <button
                type="submit"
                className="px-3.5 py-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md"
              >
                Send
              </button>
            </div>
          </form>

          {/* Past replies preview */}
          {replies.length > 0 && (
            <div className="max-h-24 overflow-y-auto space-y-1 pr-1 scrollbar-none">
              {replies.map(r => (
                <div key={r.id} className="p-1.5 rounded-lg bg-[#07131e] border border-sky-500/15 text-[10px] font-mono">
                  <span className="text-sky-300 font-bold">{r.author}: </span>
                  <span className="text-sky-100 font-semibold">"{r.song}"</span>
                  <span className="text-slate-300 block truncate mt-0.5">{r.caption}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </article>
  );
}

