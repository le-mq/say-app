import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Play, Pause, Heart, Bookmark, MessageSquare, Plus, 
  ExternalLink, Disc, Disc3, Orbit, Sparkles, Flame, Coffee, 
  Waves, Music, Users, Headphones, CloudRain, Star, Radio, Moon
} from 'lucide-react';
import { formatTime } from '../services/musicService';
import { formatTimeDetails } from '../utils/timeFormat';

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

  const template = (note.templateType || 'RECEIPTIFY').toUpperCase();
  const userInitial = (note.userDisplayName || 'Audiophile').charAt(0).toUpperCase();

  // Instant Card Click Playback (play snippet anywhere clicked on the card)
  const handleCardClick = (e) => {
    if (e.target.closest('button, input, textarea, a, form')) {
      return;
    }
    if (onPlayToggle) {
      onPlayToggle(e);
    }
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

    // 1. Direct Image or GIF URL
    if (typeof badge === 'string' && (badge.startsWith('http://') || badge.startsWith('https://') || badge.startsWith('data:image/') || badge.endsWith('.gif') || badge.endsWith('.png') || badge.endsWith('.webp'))) {
      return (
        <div className="absolute top-2 right-2 z-30 group cursor-pointer transition-transform hover:scale-105 hover:rotate-0">
          <div className="relative p-1 bg-white/95 rounded-lg border border-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.55)] -rotate-3 transition-transform">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-amber-200/90 rounded-xs -rotate-2 border-x border-amber-400/60" />
            <img
              src={badge}
              alt="Sticker"
              className="w-13 h-13 object-cover rounded-md"
            />
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
        <div className="w-8 h-8 rounded-full bg-amber-950/90 border-2 border-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.7)] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
        </div>
      ),
      'Rain Drops': (
        <div className="w-8 h-8 rounded-full bg-[#121c2e]/90 border border-violet-400/60 shadow-[0_0_12px_rgba(179,157,219,0.35)] flex items-center justify-center">
          <CloudRain className="w-4 h-4 text-violet-300" />
        </div>
      ),
      'Lo-Fi Cat': (
        <div className="w-8 h-8 rounded-full bg-[#1b263b] border-2 border-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.6)] flex items-center justify-center">
          <Radio className="w-4 h-4 text-purple-300" />
        </div>
      ),
      'Cassette Reel': (
        <div className="w-8 h-8 rounded-xl bg-[#142330] border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)] flex items-center justify-center">
          <Disc className="w-4 h-4 text-amber-400" />
        </div>
      ),
      'Cosmic Orbit': (
        <div className="w-8 h-8 rounded-full bg-[#1e1035] border-2 border-indigo-400 shadow-[0_0_14px_rgba(129,140,248,0.7)] flex items-center justify-center">
          <Orbit className="w-4 h-4 text-indigo-300" />
        </div>
      ),
      'Midnight Coffee': (
        <div className="w-8 h-8 rounded-full bg-[#241711] border-2 border-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.5)] flex items-center justify-center">
          <Coffee className="w-4 h-4 text-amber-500" />
        </div>
      ),
      'Vinyl 33 RPM': (
        <div className="w-8 h-8 rounded-full bg-[#0a1520] border-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)] flex items-center justify-center animate-spin-slow">
          <Disc3 className="w-5 h-5 text-cyan-300" />
        </div>
      ),
      'Crimson Wax': (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-800 to-rose-600 border-2 border-red-300 shadow-[0_4px_12px_rgba(225,29,72,0.7)] flex items-center justify-center font-serif text-[11px] font-bold text-amber-200">
          S
        </div>
      ),
      'Hologram Star': (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-purple-600 to-cyan-400 border border-white/80 shadow-[0_0_12px_rgba(255,255,255,0.7)] flex items-center justify-center">
          <Star className="w-4 h-4 text-amber-200 fill-amber-200" />
        </div>
      ),
      'Washi Tape': (
        <div className="px-2 py-0.5 bg-amber-200 text-neutral-900 border border-amber-400 text-[8px] font-mono font-bold -rotate-6 shadow-md rounded-xs">
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
        <div className="w-8 h-8 rounded-full bg-purple-950/90 border-2 border-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.6)] flex items-center justify-center">
          <Heart className="w-4 h-4 text-purple-300 fill-purple-300 animate-pulse" />
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
        <div className="w-8 h-8 rounded-full bg-[#101b2b] border-2 border-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.6)] flex items-center justify-center">
          <Music className="w-4 h-4 text-indigo-300" />
        </div>
      ),
      'Moon': (
        <div className="w-8 h-8 rounded-full bg-[#1a1c2e] border-2 border-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.6)] flex items-center justify-center">
          <Moon className="w-4 h-4 text-amber-200 fill-amber-200/40" />
        </div>
      ),
      'Orbit': (
        <div className="w-8 h-8 rounded-full bg-[#1a1c2e] border-2 border-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.6)] flex items-center justify-center">
          <Moon className="w-4 h-4 text-amber-200 fill-amber-200/40" />
        </div>
      ),
      'Flame Seal': (
        <div className="w-8 h-8 rounded-full bg-[#261005] border-2 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)] flex items-center justify-center">
          <Flame className="w-4 h-4 text-orange-400" />
        </div>
      ),
      'Zen Leaf': (
        <div className="w-8 h-8 rounded-full bg-[#0c2417] border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-emerald-400" />
        </div>
      ),
      'Ocean Wave': (
        <div className="w-8 h-8 rounded-full bg-[#092233] border-2 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center justify-center">
          <Waves className="w-4 h-4 text-cyan-400" />
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
      className={`relative w-full max-w-[440px] rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-500 select-text backdrop-blur-2xl cursor-pointer group/notecard bg-gradient-to-b from-[#0e2233]/85 via-[#0a1c2b]/90 to-[#071522]/95 border border-white/[0.08] shadow-2xl ${
        compact ? 'h-[360px] p-3' : 'h-[500px]'
      } ${
        isActive 
          ? 'opacity-100' 
          : 'opacity-70 hover:opacity-90'
      }`}
    >
      
      {/* 1. HEADER: User Identity, Time & Emotion Tag (Chapter 4.7) */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#102434] border border-[#1e4566] shrink-0">
            {note.userAvatarUrl ? (
              <img src={note.userAvatarUrl} alt={note.userDisplayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[#91B9C5]">
                {userInitial}
              </div>
            )}
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-[#E8EEF0] truncate leading-tight flex items-center gap-1">
              <span>{note.userDisplayName || "Audiophile"}</span>
            </h4>
            <p className="text-[10px] font-mono text-[#91B9C5]/70 truncate flex items-center gap-1">
              <span>{formattedTimeAgo}</span>
              {timeInfo.time && !timeInfo.isToday && (
                <span className="text-[#91B9C5]/50">· {timeInfo.date}</span>
              )}
            </p>
          </div>
        </div>

        {/* Visibility & Emotion Tag */}
        <div className="flex items-center gap-1.5 shrink-0">
          {note.visibility === 'FRIENDS' && (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#102434] text-[#91B9C5] border border-[#1e4566] flex items-center gap-1">
              <Users className="w-2.5 h-2.5" />
              <span>Friends</span>
            </span>
          )}
          {note.emotionTag && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-purple-100 border border-white/[0.08]">
              {note.emotionTag}
            </span>
          )}
        </div>
      </div>

      {/* 2. CENTER PIECE: STANDARDIZED PHYSICAL ARTIFACT TEMPLATE */}
      <div className="flex-1 w-full my-2 flex items-center justify-center overflow-hidden">
        
        {/* TEMPLATE A: RECEIPTIFY TICKET */}
        {template === 'RECEIPTIFY' && (
          <div className="relative w-full h-[225px] bg-[#EAE3D2] text-[#1c242c] p-3 font-mono shadow-[0_12px_30px_rgba(0,0,0,0.6)] rounded-sm border-t-4 border-b-4 border-dashed border-[#d5cbba] flex flex-col justify-between overflow-hidden">
            {renderStickerSeal()}

            <div className="pr-14">
              <div className="text-center font-extrabold text-[11px] tracking-widest uppercase">
                RECEIPTIFY
              </div>
              <div className="text-center text-[7.5px] tracking-widest text-neutral-600 uppercase mb-1">
                SAY AUDIONOTE ARCHIVE
              </div>

              <div className="border-t border-b border-dashed border-neutral-400 py-0.5 mb-1 flex justify-between text-[7.5px] uppercase tracking-wider text-neutral-700">
                <span className="truncate max-w-[130px]">
                  {note.orderNumber || (note.userDisplayName ? `ORD #${(note.id || '01').toString().slice(-4).toUpperCase()} FOR ${note.userDisplayName.toUpperCase()}` : "ORD ARCHIVE")}
                </span>
                <span className="shrink-0">{formattedTimeAgo}</span>
              </div>

              <div>
                <h3 className="font-extrabold text-[11px] tracking-wider uppercase text-neutral-900 leading-tight truncate">
                  {note.songTitle || "NIGHT DRIVE / MIDNIGHT AMBIENT"}
                </h3>
                <p className="text-[9px] tracking-wider uppercase text-neutral-700 font-semibold truncate">
                  {note.artistName || "KHRUANGBIN VIBE"}
                </p>
                <p className="text-[7.5px] text-neutral-600 uppercase mt-0.5">
                  CLIP: {formatTime(note.audioSnippetStart || "0:10")} - {formatTime(note.audioSnippetEnd || "0:40")}
                </p>
              </div>

              {/* Lyric Snippet Box (Italic Serif) */}
              {note.lyricSnippet && (
                <div className="my-1 p-1 bg-[#dfd6c4]/90 border-l-3 border-neutral-900 text-[9.5px] font-serif italic font-bold tracking-wide leading-tight text-neutral-900 line-clamp-2 break-words">
                  "{note.lyricSnippet}"
                </div>
              )}

              {/* Personal Caption */}
              {note.caption && (
                <div className="text-[8px] leading-tight text-neutral-800 flex items-start gap-1 line-clamp-1 mt-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-neutral-600 shrink-0 mt-0.5" />
                  <span>"{note.caption}"</span>
                </div>
              )}
            </div>

            {/* Acoustic Waveform preview bars */}
            <div className="mt-1 flex flex-col items-center">
              <div className="flex items-center justify-center gap-2 w-full text-neutral-900">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onPlayToggle(e); }}
                  className="w-5 h-5 rounded-full bg-neutral-900 text-[#EAE3D2] flex items-center justify-center hover:scale-105 transition-all cursor-pointer shrink-0"
                  title={isPlaying ? "Pause Note" : "Play Note Snippet"}
                >
                  {isPlaying ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current ml-0.5" />}
                </button>
                <div className="flex items-center gap-0.5 h-3">
                  {[3, 6, 9, 12, 16, 11, 7, 14, 18, 12, 8, 5, 10, 14, 8, 4].map((h, i) => (
                    <span 
                      key={i} 
                      className="w-0.5 bg-neutral-800 rounded-full" 
                      style={{ height: isPlaying ? `${Math.max(4, (h * 1.2) % 18)}px` : `${h}px` }} 
                    />
                  ))}
                </div>
              </div>
              <span className="text-[7px] tracking-[0.2em] text-neutral-700 font-mono mt-0.5 uppercase font-bold text-center block">
                THANK YOU FOR LISTENING
              </span>
            </div>
          </div>
        )}

        {/* TEMPLATE B: CASSETTE TAPE */}
        {template === 'CASSETTE' && (
          <div className="relative w-full h-[225px] bg-[#10202e]/85 backdrop-blur-md text-[#E8EEF0] p-3 rounded-2xl border-2 border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.6)] font-mono flex flex-col justify-between overflow-hidden">
            {renderStickerSeal()}

            {/* Cassette Screws */}
            <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-slate-500/60 border border-black/40" />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-500/60 border border-black/40" />
            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-slate-500/60 border border-black/40" />
            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-500/60 border border-black/40" />

            {/* Washi Tape Header */}
            <div className="relative mx-auto -mt-1 px-4 py-0.5 bg-[#fce5cd]/95 text-neutral-800 -rotate-1 shadow-md border-x-2 border-dashed border-amber-400/80 rounded-sm flex items-center justify-between w-[92%] z-10 pr-14">
              <span className="text-[9px] font-mono font-bold tracking-widest text-neutral-800">
                A • {note.orderNumber || (note.id ? `TAPE #${note.id.toString().slice(-4).toUpperCase()}` : "TAPE #01")}
              </span>
              <span className="text-[8px] font-mono font-bold text-red-700 uppercase">
                TYPE II CHROME
              </span>
            </div>

            {/* Track metadata */}
            <div className="my-1 px-2.5 py-1.5 bg-[#0a1520]/80 rounded-xl border border-white/10">
              <h3 className="font-serif italic font-extrabold text-[12px] text-amber-200 tracking-wide truncate">
                {note.songTitle || "ALBERTO BALSALM TAPE DUB"}
              </h3>
              <p className="text-[9px] text-[#91B9C5] font-mono tracking-wider truncate">
                {note.artistName || "Aphex Twin"}
              </p>
              {note.lyricSnippet && (
                <p className="mt-1 text-[9px] font-serif italic font-bold text-amber-100 tracking-wide leading-tight line-clamp-2 border-l-2 border-amber-300 pl-1.5 break-words">
                  "{note.lyricSnippet}"
                </p>
              )}
            </div>

            {/* Cassette Spools & Magnetic Tape Window */}
            <div className="bg-[#060e16]/90 rounded-xl p-1.5 flex items-center justify-around border border-white/10 relative">
              <div className={`w-7 h-7 rounded-full border-2 border-dashed border-cyan-400/70 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`}>
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-sm" />
              </div>

              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onPlayToggle(e); }}
                  className="w-5 h-5 rounded-full bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/50 flex items-center justify-center text-amber-200 cursor-pointer transition-all mb-0.5"
                  title={isPlaying ? "Pause Tape" : "Play Tape Snippet"}
                >
                  {isPlaying ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current ml-0.5" />}
                </button>
                <span className="text-[7.5px] font-mono tracking-widest text-slate-400">
                  60 MIN • HI-BIAS
                </span>
              </div>

              <div className={`w-7 h-7 rounded-full border-2 border-dashed border-cyan-400/70 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`}>
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-sm" />
              </div>
            </div>
          </div>
        )}

        {/* TEMPLATE C: AIRMAIL STAMP */}
        {template === 'STAMP' && (
          <div className="relative w-full h-[225px] bg-[#EFECE6] text-[#1c242c] p-3 rounded-sm border-4 border-double border-[#91B9C5]/60 shadow-xl font-mono flex flex-col justify-between overflow-hidden">
            {renderStickerSeal()}
            <div>
              <div className="flex justify-between items-center text-[8.5px] font-bold tracking-widest uppercase border-b border-neutral-300 pb-0.5 mb-1.5 pr-14">
                <span>BERGEN AIRMAIL LOG</span>
                <span className="text-neutral-500 font-mono text-[7.5px]">AIR-POST #42</span>
              </div>

              <div className="flex gap-2.5 items-center mb-1.5">
                <div className="w-12 h-12 rounded overflow-hidden shrink-0 shadow border border-neutral-400 relative">
                  <img
                    src={note.songImageUrl || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300"}
                    alt={note.songTitle}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onPlayToggle(e); }}
                    className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                  </button>
                </div>
                <div className="overflow-hidden flex-1">
                  <h3 className="font-extrabold text-[11px] uppercase tracking-wide truncate text-neutral-900">
                    {note.songTitle}
                  </h3>
                  <p className="text-[9.5px] text-neutral-700 truncate font-semibold">
                    {note.artistName}
                  </p>
                  <p className="text-[8px] text-neutral-500 uppercase mt-0.5">
                    CLIP: {formatTime(note.audioSnippetStart || '0:10')} - {formatTime(note.audioSnippetEnd || '0:40')}
                  </p>
                </div>
              </div>

              {note.lyricSnippet && (
                <div className="p-1.5 bg-[#e4dfd7] border-l-2 border-[#91B9C5] text-[9.5px] font-serif italic text-neutral-800 line-clamp-2 break-words">
                  "{note.lyricSnippet}"
                </div>
              )}
            </div>

            <div className="flex justify-between items-end border-t border-dashed border-neutral-300 pt-1 text-[8px] text-neutral-600">
              <span>POSTAGE PAID • PAR AVION</span>
              <span className="font-bold tracking-wider text-cyan-800">SAY AIRMAIL</span>
            </div>
          </div>
        )}

        {/* TEMPLATE D: VINYL RECORD */}
        {template === 'VINYL' && (
          <div className="relative w-full h-[225px] bg-[#071421]/80 text-[#E8EEF0] p-3 rounded-2xl border border-white/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.45)] font-mono flex flex-col justify-between overflow-hidden">
            {renderStickerSeal()}

            <div className="flex justify-between items-center text-[8.5px] text-[#A59CB5] uppercase tracking-widest pb-0.5 border-b border-white/[0.08] pr-14">
              <span>ANALOG MICROGROOVE • 33 RPM</span>
              <span className="text-[#B39DDB] font-bold">ANALOG</span>
            </div>

            <div className="flex items-center gap-3 my-1">
              <div className={`w-14 h-14 rounded-full overflow-hidden border-2 border-neutral-700 shadow-xl shrink-0 relative bg-black ${isPlaying ? 'animate-spin-slow' : ''}`}>
                <div className="absolute inset-1 rounded-full border border-neutral-800" />
                <div className="absolute inset-2.5 rounded-full border border-neutral-700/60" />
                <img
                  src={note.songImageUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500"}
                  alt={note.songTitle}
                  className="w-full h-full object-cover rounded-full opacity-70"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onPlayToggle(e); }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#E8EEF0] text-black border border-black flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                  title={isPlaying ? "Pause Vinyl" : "Play Vinyl"}
                >
                  {isPlaying ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current ml-0.5" />}
                </button>
              </div>

              <div className="overflow-hidden flex-1">
                <h3 className="font-extrabold text-[11px] text-[#E8EEF0] uppercase tracking-wider truncate">
                  {note.songTitle}
                </h3>
                <p className="text-[9.5px] text-[#A59CB5] truncate">
                  {note.artistName}
                </p>
                <span className="text-[8px] text-[#B39DDB]/90 font-mono mt-0.5 inline-block">
                  CLIP: {formatTime(note.audioSnippetStart || '0:10')} - {formatTime(note.audioSnippetEnd || '0:40')}
                </span>
              </div>
            </div>

            {note.lyricSnippet && (
              <div className="p-1.5 rounded-lg bg-[#050e18]/80 border border-white/[0.06] border-l-3 border-l-[#B39DDB] text-[9.5px] font-serif italic text-purple-100 leading-tight tracking-wide line-clamp-2 break-words">
                "{note.lyricSnippet}"
              </div>
            )}
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
              isSaved ? 'text-amber-300 bg-amber-950/40' : 'text-[#A59CB5]/80 hover:text-white hover:bg-white/[0.05]'
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
              ? 'bg-violet-600/25 text-violet-200 border border-violet-400/50 shadow-sm shadow-violet-950/50' 
              : 'bg-white/[0.04] text-[#A59CB5] hover:text-white border border-white/[0.08]'
          }`}
          title="Reply with song dialogue"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold">Reply with Song</span>
          {replies.length > 0 && (
            <span className="text-[9.5px] px-1.5 rounded-full bg-violet-950/80 text-violet-300 border border-violet-500/30">
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
              className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-[#F3F0F9] focus:outline-none focus:border-violet-400 placeholder:text-neutral-500 font-mono"
            />
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Write your dialogue note..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-black/40 border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-[#F3F0F9] focus:outline-none focus:border-violet-400 placeholder:text-neutral-500 font-mono"
              />
              <button
                type="submit"
                className="px-3.5 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md"
              >
                Send
              </button>
            </div>
          </form>

          {/* Past replies preview */}
          {replies.length > 0 && (
            <div className="max-h-24 overflow-y-auto space-y-1 pr-1 scrollbar-none">
              {replies.map(r => (
                <div key={r.id} className="p-1.5 rounded-lg bg-black/30 border border-white/[0.05] text-[10px] font-mono">
                  <span className="text-violet-300 font-bold">{r.author}: </span>
                  <span className="text-amber-200">"{r.song}"</span>
                  <span className="text-neutral-400 block truncate mt-0.5">{r.caption}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </article>
  );
}

