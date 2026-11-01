import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { usePlayerStore } from '../store/playerStore';
import { Play, Pause, Heart, Bookmark, MessageSquare, Plus, ExternalLink, Disc } from 'lucide-react';

export default function MusicCard({ note, onReplyAdded, compact = false }) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const [likes, setLikes] = useState(note.likesCount || 38);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replySongTitle, setReplySongTitle] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState(note.dialogues || [
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
  ]);

  const isCurrentPlaying = currentTrack?.id === note.id && isPlaying;

  const handlePlayToggle = () => {
    if (currentTrack?.id === note.id) {
      togglePlay();
    } else {
      playTrack({
        id: note.id,
        songTitle: note.songTitle,
        artistName: `${note.artistName} • Lossless 24-Bit DAC`,
        songImageUrl: note.songImageUrl,
        audioSnippetStart: note.audioSnippetStart || 10,
        duration: 162, // 2:42
      });
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast.success(!isSaved ? "Saved to your Notes Vault!" : "Removed from Vault");
  };

  const handleAddReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    const newDialogue = {
      id: 'd-' + Date.now(),
      author: 'Linh Tran',
      song: replySongTitle.trim() || 'Midnight Wave Response',
      caption: replyText.trim(),
    };
    setReplies(prev => [...prev, newDialogue]);
    setReplySongTitle('');
    setReplyText('');
    setShowReplyInput(false);
    toast.success("Song Dialogue reply posted! 🎵");
    if (onReplyAdded) onReplyAdded(note.id);
  };

  const template = (note.templateType || 'RECEIPTIFY').toUpperCase();
  const userInitial = (note.userDisplayName || 'Linh Tran').charAt(0).toUpperCase();

  const renderStickerSeal = () => {
    let badge = note.stickerBadge;
    if (!badge || badge === 'None' || badge === 'NONE') return null;

    // Retrieve custom uploaded sticker from localStorage if persisted as CUSTOM token
    if (typeof badge === 'string' && badge.startsWith('CUSTOM:')) {
      const stored = typeof window !== 'undefined'
        ? (localStorage.getItem(`say_sticker_${note.id}`) || localStorage.getItem(`say_sticker_${badge}`))
        : null;
      if (stored) {
        badge = stored;
      }
    }

    // 1. Direct Image or GIF URL (Aesthetic Tactile Polaroid Sticker)
    if (typeof badge === 'string' && (badge.startsWith('http://') || badge.startsWith('https://') || badge.startsWith('data:image/') || badge.endsWith('.gif') || badge.endsWith('.png') || badge.endsWith('.webp'))) {
      return (
        <div className="absolute top-2 right-2 z-30 group cursor-pointer transition-transform hover:scale-105 hover:rotate-0">
          <div className="relative p-1 bg-white/95 rounded-lg border border-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.55)] -rotate-3 transition-transform">
            {/* Mini translucent washi tape pin */}
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

    // 2. Curated Motion GIFs & Tactile Enamel Badges
    const BADGE_COMPONENTS = {
      // Animated / Motion Badges
      'Vinyl Spin': (
        <div className="w-8 h-8 rounded-full bg-[#0a1520] border-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)] flex items-center justify-center animate-spin-slow">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 border border-white/80" />
        </div>
      ),
      'Neon Pulse': (
        <div className="w-8 h-8 rounded-full bg-rose-950/90 border-2 border-rose-400 shadow-[0_0_14px_rgba(244,63,94,0.7)] flex items-center justify-center">
          <span className="text-xs animate-ping">❤️‍🔥</span>
        </div>
      ),
      'Star Shimmer': (
        <div className="w-8 h-8 rounded-full bg-amber-950/90 border-2 border-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.7)] flex items-center justify-center">
          <span className="text-xs animate-pulse">✨</span>
        </div>
      ),
      'Rain Drops': (
        <div className="w-8 h-8 rounded-full bg-sky-950/90 border-2 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.6)] flex items-center justify-center">
          <span className="text-xs">🌧️</span>
        </div>
      ),
      'Lo-Fi Cat': (
        <div className="w-8 h-8 rounded-full bg-[#1b263b] border-2 border-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.6)] flex items-center justify-center">
          <span className="text-xs">🐱</span>
        </div>
      ),
      'Cassette Reel': (
        <div className="w-8 h-8 rounded-xl bg-[#142330] border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)] flex items-center justify-center">
          <span className="text-xs">📼</span>
        </div>
      ),
      'Cosmic Orbit': (
        <div className="w-8 h-8 rounded-full bg-[#1e1035] border-2 border-indigo-400 shadow-[0_0_14px_rgba(129,140,248,0.7)] flex items-center justify-center">
          <span className="text-xs">🪐</span>
        </div>
      ),
      'Midnight Coffee': (
        <div className="w-8 h-8 rounded-full bg-[#241711] border-2 border-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.5)] flex items-center justify-center">
          <span className="text-xs">☕</span>
        </div>
      ),
      // Tactile Wax Seals & Pins
      'Vinyl 33 RPM': (
        <div className="w-8 h-8 rounded-full bg-[#0a1520] border-2 border-purple-400/80 shadow-[0_0_12px_rgba(168,85,247,0.5)] flex items-center justify-center animate-spin-slow">
          <div className="w-2.5 h-2.5 rounded-full bg-[#B39DDB]" />
        </div>
      ),
      'Crimson Wax': (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-800 to-rose-600 border-2 border-red-300 shadow-[0_4px_12px_rgba(225,29,72,0.7)] flex items-center justify-center font-serif text-[11px] font-bold text-amber-200">
          S
        </div>
      ),
      'Hologram Star': (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-purple-600 to-cyan-400 border border-white/80 shadow-[0_0_12px_rgba(255,255,255,0.7)] flex items-center justify-center">
          <span className="text-xs">⭐</span>
        </div>
      ),
      'Washi Tape': (
        <div className="px-2 py-0.5 bg-amber-200 text-neutral-900 border border-amber-400 text-[8px] font-mono font-bold -rotate-6 shadow-md rounded-xs">
          WASHI
        </div>
      ),
      'Dark Rose': (
        <div className="w-8 h-8 rounded-full bg-[#1a0f14] border-2 border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.4)] flex items-center justify-center">
          <span className="text-xs">🥀</span>
        </div>
      ),
      'Hi-Fi Headphones': (
        <div className="w-8 h-8 rounded-full bg-[#0b1c2b] border-2 border-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.5)] flex items-center justify-center">
          <span className="text-xs">🎧</span>
        </div>
      ),
      'Headphones': (
        <div className="w-8 h-8 rounded-full bg-[#0b1c2b] border-2 border-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.5)] flex items-center justify-center">
          <span className="text-xs">🎧</span>
        </div>
      ),
      'Vinyl': (
        <div className="w-8 h-8 rounded-full bg-[#0a1520] border-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)] flex items-center justify-center animate-spin-slow">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 border border-white/80" />
        </div>
      ),
      'Heartbeat': (
        <div className="w-8 h-8 rounded-full bg-purple-950/90 border-2 border-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.6)] flex items-center justify-center">
          <span className="text-xs animate-pulse">💜</span>
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
          <span className="text-xs">🎵</span>
        </div>
      ),
      'Orbit': (
        <div className="w-8 h-8 rounded-full bg-[#1e1035] border-2 border-indigo-400 shadow-[0_0_14px_rgba(129,140,248,0.7)] flex items-center justify-center">
          <span className="text-xs">🪐</span>
        </div>
      ),
      'Flame Seal': (
        <div className="w-8 h-8 rounded-full bg-[#261005] border-2 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)] flex items-center justify-center">
          <span className="text-xs">🔥</span>
        </div>
      ),
      'Zen Leaf': (
        <div className="w-8 h-8 rounded-full bg-[#0c2417] border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] flex items-center justify-center">
          <span className="text-xs">🍃</span>
        </div>
      ),
      'Ocean Wave': (
        <div className="w-8 h-8 rounded-full bg-[#092233] border-2 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center justify-center">
          <span className="text-xs">🌊</span>
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
    <article className="w-full max-w-[430px] h-[465px] bg-[#0a1826] border border-[#16354d]/90 rounded-[22px] p-3.5 sm:p-4 shadow-2xl transition-all duration-300 hover:border-[#235073] flex flex-col justify-between shrink-0">
      
      {/* 1. AUTHOR ROW */}
      <div className="flex items-center justify-between mb-1.5 shrink-0">
        <div className="flex items-center gap-2">
          {/* Initial Avatar circle */}
          <div className="w-8 h-8 rounded-full bg-[#142c40] border border-[#224869] flex items-center justify-center font-grotesk font-bold text-xs text-[#E8EEF0] shadow-sm">
            {userInitial}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-[#E8EEF0] leading-tight">
                {note.userDisplayName || "Linh Tran"}
              </h4>
            </div>
            <p className="text-[10px] font-grotesk text-[#91B9C5]/70">
              {note.handle || "@linhtran"} · {note.timeAgo || "10m ago"}
            </p>
          </div>
        </div>

        {/* Emotion / Privacy Badges */}
        <div className="flex items-center gap-1.5">
          {note.visibility === 'FRIENDS' && (
            <span className="text-[9px] font-grotesk px-2 py-0.5 rounded-full bg-[#142c40] text-[#91B9C5] border border-[#1e4566]">
              👥 Friends
            </span>
          )}
          {note.emotionTag && (
            <span className="text-[10px] font-grotesk px-2.5 py-0.5 rounded-full bg-[#0e2436] text-[#E8EEF0] border border-[#1a3d5b] shadow-sm">
              {note.emotionTag}
            </span>
          )}
        </div>
      </div>

      {/* 2. CENTER PIECE: STANDARDIZED FIXED-HEIGHT AESTHETIC STAGE */}
      <div className="flex-1 w-full max-h-[235px] flex items-center justify-center my-0.5 overflow-hidden">
        
        {/* TEMPLATE A: RECEIPTIFY TICKET */}
        {template === 'RECEIPTIFY' && (
          <div className="relative w-full max-w-[310px] h-[225px] bg-[#EAE3D2] text-[#1c242c] p-3 font-mono shadow-[0_12px_30px_rgba(0,0,0,0.6)] rounded-sm border-t-4 border-b-4 border-dashed border-[#d5cbba] flex flex-col justify-between overflow-hidden">
            {/* Dynamic Physical Pin / Wax Seal Stamp */}
            {renderStickerSeal()}

            <div className="pr-16">
              <div className="text-center font-extrabold text-[11px] tracking-widest uppercase">
                RECEIPTIFY
              </div>
              <div className="text-center text-[7.5px] tracking-widest text-neutral-600 uppercase mb-1">
                SAY AUDIONOTE ARCHIVE
              </div>

              <div className="border-t border-b border-dashed border-neutral-400 py-0.5 mb-1 flex justify-between text-[7.5px] uppercase tracking-wider text-neutral-700">
                <span className="truncate max-w-[120px]">
                  {note.orderNumber || (note.userDisplayName ? `ORD #${(note.id || '01').toString().slice(-4).toUpperCase()} FOR ${note.userDisplayName.toUpperCase()}` : "ORD ARCHIVE")}
                </span>
                <span className="shrink-0">{note.timeAgo || "10m ago"}</span>
              </div>

              <div>
                <h3 className="font-extrabold text-[11px] tracking-wider uppercase text-neutral-900 leading-tight truncate">
                  {note.songTitle || "NIGHT DRIVE / MIDNIGHT AMBIENT"}
                </h3>
                <p className="text-[9px] tracking-wider uppercase text-neutral-700 font-semibold truncate">
                  {note.artistName || "KHRUANGBIN VIBE"}
                </p>
                <p className="text-[7.5px] text-neutral-600 uppercase mt-0.5">
                  CLIP: {note.audioSnippetStart || "0:10"}-{note.audioSnippetEnd || "0:40"}
                </p>
              </div>

              {/* Lyric Snippet Box (High-Contrast Bold Italic Serif) */}
              {note.lyricSnippet && (
                <div className="my-1.5 p-1.5 bg-[#dfd6c4]/90 border-l-3 border-neutral-900 text-[10.5px] font-serif italic font-bold tracking-wide leading-snug text-neutral-900 line-clamp-2">
                  "{note.lyricSnippet}"
                </div>
              )}

              {/* Personal Reflection */}
              {note.caption && (
                <div className="text-[8px] leading-tight text-neutral-800 flex items-start gap-1 line-clamp-1 mt-0.5">
                  <span>🪐</span>
                  <span>"{note.caption}"</span>
                </div>
              )}
            </div>

            {/* Artistic Spotify-style Acoustic Audio Waveform matching Image */}
            <div className="mt-1 flex flex-col items-center">
              <div className="flex items-center justify-center gap-2 w-full text-neutral-900">
                {/* Crisp Outline Play Triangle matching photo */}
                <svg 
                  className="w-3.5 h-3.5 text-neutral-900 shrink-0" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
                {/* Spotify-style Slender Acoustic Wave Bars */}
                <div className="flex items-center gap-[2.5px] h-6">
                  {[3, 7, 13, 3, 17, 24, 11, 18, 26, 18, 12, 18, 24, 17, 12, 7, 3, 7, 13, 18, 24, 17, 11, 7, 3, 13, 17, 7, 3].map((h, i) => (
                    <div
                      key={i}
                      className="bg-neutral-900 rounded-full w-[2px]"
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-[7px] tracking-[0.2em] text-neutral-700 font-mono mt-1 uppercase font-bold text-center block select-text">
                THANK YOU FOR LISTENING
              </span>
            </div>
          </div>
        )}

        {/* TEMPLATE B: CASSETTE TAPE (Y2K Transparent Acrylic + Washi Tape + Handwritten Vibe) */}
        {template === 'CASSETTE' && (
          <div className="relative w-full max-w-[320px] h-[225px] bg-[#10202e]/80 backdrop-blur-md text-[#E8EEF0] p-3 rounded-2xl border-2 border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.6)] font-mono flex flex-col justify-between overflow-hidden">
            {/* Dynamic Physical Pin / Wax Seal Stamp */}
            {renderStickerSeal()}

            {/* Cassette Screws on corners */}
            <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-slate-500/60 border border-black/40" />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-500/60 border border-black/40" />
            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-slate-500/60 border border-black/40" />
            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-500/60 border border-black/40" />

            {/* Washi Tape Header */}
            <div className="relative mx-auto -mt-1 px-4 py-0.5 bg-[#fce5cd]/95 text-neutral-800 -rotate-1 shadow-md border-x-2 border-dashed border-amber-400/80 rounded-sm flex items-center justify-between w-[92%] z-10 pr-16">
              <span className="text-[9px] font-mono font-bold tracking-widest text-neutral-800">
                A • {note.orderNumber || (note.id ? `TAPE #${note.id.toString().slice(-4).toUpperCase()}` : "TAPE #01")}
              </span>
              <span className="text-[8px] font-mono font-bold text-red-700 uppercase">
                TYPE II CHROME
              </span>
            </div>

            {/* Handwriting / Marker Song Block */}
            <div className="my-1 px-2 py-1.5 bg-[#0a1520]/80 rounded-xl border border-white/10">
              <h3 className="font-serif italic font-extrabold text-[12px] text-amber-200 tracking-wide truncate">
                {note.songTitle || "ALBERTO BALSALM TAPE DUB"}
              </h3>
              <p className="text-[9px] text-[#91B9C5] font-mono tracking-wider truncate">
                {note.artistName || "Aphex Twin"}
              </p>

              {note.lyricSnippet && (
                <p className="mt-1.5 text-[10.5px] font-serif italic font-bold text-amber-100 tracking-wide leading-snug line-clamp-2 border-l-2 border-amber-300 pl-2 drop-shadow-sm">
                  "{note.lyricSnippet}"
                </p>
              )}
            </div>

            {/* Transparent Cassette Spools & Magnetic Tape Window */}
            <div className="bg-[#060e16]/90 rounded-xl p-1.5 flex items-center justify-around border border-white/10 relative">
              <div className={`w-7 h-7 rounded-full border-2 border-dashed border-cyan-400/70 flex items-center justify-center ${isCurrentPlaying ? 'animate-spin' : ''}`}>
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-sm" />
              </div>

              {/* Center Magnetic Tape Spool Window */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-3 bg-[#1e130c] rounded border border-amber-900/60 shadow-inner flex items-center justify-center">
                  <div className="w-8 h-1 bg-amber-700/80 rounded-full" />
                </div>
                <span className="text-[7.5px] font-mono tracking-widest text-slate-400 mt-0.5">
                  60 MIN • HI-BIAS
                </span>
              </div>

              <div className={`w-7 h-7 rounded-full border-2 border-dashed border-cyan-400/70 flex items-center justify-center ${isCurrentPlaying ? 'animate-spin' : ''}`}>
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-sm" />
              </div>
            </div>
          </div>
        )}

        {/* TEMPLATE C: AIRMAIL STAMP */}
        {template === 'STAMP' && (
          <div className="relative w-full max-w-[320px] h-[225px] bg-[#EFECE6] text-[#1c242c] p-3 rounded-sm border-4 border-double border-[#91B9C5]/60 shadow-xl font-mono flex flex-col justify-between overflow-hidden">
            {/* Dynamic Physical Pin / Wax Seal Stamp */}
            {renderStickerSeal()}
            <div>
              <div className="flex justify-between items-center text-[8.5px] font-bold tracking-widest uppercase border-b border-neutral-300 pb-0.5 mb-1.5 pr-16">
                <span>BERGEN AIRMAIL LOG</span>
                <span className="text-neutral-500 font-mono text-[7.5px]">AIR-POST #42</span>
              </div>

              <div className="flex gap-2.5 items-center mb-1.5">
                <div className="w-12 h-12 rounded overflow-hidden shrink-0 shadow border border-neutral-400">
                  <img
                    src={note.songImageUrl || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200"}
                    alt={note.songTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-extrabold text-[11px] text-neutral-900 leading-tight truncate">
                    {note.songTitle || "HOLOCENE ACOUSTIC CHILL"}
                  </h3>
                  <p className="text-[9.5px] text-neutral-600 truncate">
                    {note.artistName || "Bon Iver Style"}
                  </p>
                  <span className="inline-block px-1.5 py-0.2 bg-neutral-800 text-white text-[7.5px] font-mono mt-0.5 rounded">
                    STAMP #42
                  </span>
                </div>
              </div>

              {note.lyricSnippet && (
                <p className="text-[10.5px] font-serif italic font-bold text-neutral-900 border-l-3 border-neutral-800 pl-2 my-1.5 line-clamp-2 leading-snug tracking-wide">
                  "{note.lyricSnippet}"
                </p>
              )}
            </div>

            {note.caption && (
              <p className="text-[8.5px] text-neutral-800 font-sans line-clamp-1 border-t border-neutral-300 pt-0.5">
                "{note.caption}"
              </p>
            )}
          </div>
        )}

        {/* TEMPLATE D: VINYL DISC (33 RPM Microgroove Analog Record) */}
        {template === 'VINYL' && (
          <div className="relative w-full max-w-[320px] h-[225px] bg-[#0c1822] text-[#E8EEF0] p-3 rounded-2xl border-2 border-cyan-500/30 shadow-2xl font-mono flex flex-col justify-between overflow-hidden">
            {/* Dynamic Physical Pin / Wax Seal Stamp */}
            {renderStickerSeal()}
            <div className="flex justify-between items-center text-[8.5px] text-cyan-300 uppercase tracking-widest pb-0.5 border-b border-[#1b3d5c] pr-16">
              <span>ANALOG MICROGROOVE • 33 RPM</span>
              <span className="text-amber-400 font-bold">HI-FI</span>
            </div>

            <div className="flex items-center gap-3 my-1">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-neutral-700 shadow-xl shrink-0 relative animate-spin-slow bg-black">
                {/* Vinyl grooved rings */}
                <div className="absolute inset-1 rounded-full border border-neutral-800" />
                <div className="absolute inset-2.5 rounded-full border border-neutral-700/60" />
                <img
                  src={note.songImageUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500"}
                  alt={note.songTitle}
                  className="w-full h-full object-cover rounded-full opacity-65"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#E8EEF0] border-2 border-black flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-black" />
                </div>
              </div>

              <div className="overflow-hidden flex-1">
                <h3 className="font-extrabold text-[11px] text-[#E8EEF0] uppercase tracking-wider truncate">
                  {note.songTitle}
                </h3>
                <p className="text-[9.5px] text-[#91B9C5] truncate">
                  {note.artistName}
                </p>
                <span className="text-[8px] text-cyan-400 font-mono mt-0.5 inline-block">
                  CLIP: {note.audioSnippetStart || '0:10'} - {note.audioSnippetEnd || '0:40'}
                </span>
              </div>
            </div>

            {note.lyricSnippet && (
              <div className="p-2 rounded-lg bg-[#07131e]/90 border border-[#16354d] border-l-3 border-l-cyan-400 text-[10.5px] font-serif italic font-bold text-cyan-100 leading-snug tracking-wide line-clamp-2 drop-shadow-sm">
                "{note.lyricSnippet}"
              </div>
            )}
          </div>
        )}

        {/* TEMPLATE E: GALAXY / ORBIT (Concentric Planetary Orbits matching Screenshot 4) */}
        {(template === 'GALAXY' || template === 'ORBIT' || note.stickerBadge === 'GALAXY_ORBIT') && (
          <div className="relative w-full max-w-[320px] h-[225px] bg-[#06101c] text-[#E8EEF0] p-3 rounded-2xl border-2 border-indigo-500/40 shadow-[0_12px_35px_rgba(99,102,241,0.25)] font-mono flex flex-col justify-between overflow-hidden">
            {/* Dynamic Physical Pin / Wax Seal Stamp */}
            {renderStickerSeal()}
            {/* Space Star Dust Particles */}
            <div className="absolute top-2 left-6 w-1 h-1 bg-white/70 rounded-full animate-ping" />
            <div className="absolute top-8 right-10 w-0.5 h-0.5 bg-cyan-300/80 rounded-full" />
            <div className="absolute bottom-6 left-12 w-0.5 h-0.5 bg-purple-300/80 rounded-full" />

            <div className="flex justify-between items-center text-[8.5px] text-cyan-300 uppercase tracking-widest pb-0.5 border-b border-[#18314a] z-10 pr-16">
              <span className="flex items-center gap-1">
                <span>🪐</span> COSMIC ORBIT CANVAS
              </span>
              <span className="text-purple-300 font-bold">INTERSTELLAR</span>
            </div>

            {/* Concentric Rounded Square Orbit Matrix Matching Screenshot 4 */}
            <div className="relative w-full h-[125px] flex items-center justify-center my-0.5 overflow-hidden">
              {/* Outer Orbit Rounded Square */}
              <div className="absolute w-[185px] h-[105px] rounded-2xl border border-cyan-500/20 flex items-center justify-center">
                {/* Orbiting Planet 1: Lavender (Khruangbin) */}
                <div className="absolute -top-1.5 left-4 flex items-center gap-1 bg-[#06101c]/90 px-1 rounded-full border border-purple-400/40">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#B39DDB] shadow-[0_0_8px_#B39DDB]" />
                  <span className="text-[7.5px] font-mono text-[#B39DDB] font-bold">Khruangbin</span>
                </div>

                {/* Orbiting Planet 2: Cyan (Bon Iver) */}
                <div className="absolute -bottom-1.5 right-4 flex items-center gap-1 bg-[#06101c]/90 px-1 rounded-full border border-cyan-400/40">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan]" />
                  <span className="text-[7.5px] font-mono text-cyan-300 font-bold">Bon Iver</span>
                </div>
              </div>

              {/* Middle Orbit Rounded Square */}
              <div className="absolute w-[130px] h-[75px] rounded-xl border border-indigo-400/30 flex items-center justify-center">
                {/* Orbiting Planet 3: Pale Gold (Nick Drake) */}
                <div className="absolute -top-1 right-2 flex items-center gap-1 bg-[#06101c]/90 px-1 rounded-full border border-amber-300/40">
                  <div className="w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_6px_#fde68a]" />
                  <span className="text-[7px] font-mono text-amber-200 font-bold">Nick Drake</span>
                </div>
              </div>

              {/* Center Core Hub (Acoustic Gravitational Core) */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-900/60 to-purple-900/60 border border-white/30 flex items-center justify-center shadow-lg z-10">
                <div className="w-3.5 h-3.5 rounded-full bg-cyan-300/80 animate-pulse shadow-[0_0_10px_cyan]" />
              </div>
            </div>

            {/* Bottom Song & Cosmic Lyric snippet */}
            <div className="z-10 bg-[#040a12]/90 p-1.5 rounded-xl border border-indigo-500/20 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-[10px] text-[#E8EEF0] uppercase tracking-wide truncate">
                  {note.songTitle || "COSMIC DEEP SPACE RESONANCE"}
                </h4>
                <p className="text-[8px] text-[#91B9C5] truncate">
                  {note.artistName || "Voyager Space Archive"}
                </p>
              </div>
              {note.lyricSnippet && (
                <span className="text-[9.5px] font-serif italic font-bold text-purple-100 truncate max-w-[140px] ml-1 tracking-wide drop-shadow-sm">
                  "{note.lyricSnippet}"
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. SONG DIALOGUE SECTION (Compact & Non-overflowing) */}
      <div className="mt-2.5 p-2.5 rounded-xl bg-[#07131e] border border-[#142c40]">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-grotesk font-bold text-[#E8EEF0]">
            <MessageSquare className="w-3 h-3 text-[#91B9C5]" />
            <span>Song Dialogue ({replies.length})</span>
          </div>

          <button
            onClick={() => setShowReplyInput(!showReplyInput)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#0e2436] hover:bg-[#15344d] border border-[#1e4566] text-[9px] font-grotesk text-[#91B9C5] hover:text-[#E8EEF0] transition-colors cursor-pointer"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>Reply</span>
          </button>
        </div>

        {/* Show latest dialogue compactly */}
        <div className="space-y-1.5">
          {replies.slice(0, 1).map((reply) => (
            <div
              key={reply.id}
              className="p-2 rounded-lg bg-[#0a1b2a] border border-[#16334a] text-[11px] font-grotesk text-[#c5d8e0] leading-tight flex items-start justify-between gap-1.5"
            >
              <div className="line-clamp-2">
                <span className="font-bold text-[#E8EEF0] mr-1">{reply.author}:</span>
                <span className="text-[#91B9C5] italic mr-1">"🎵 {reply.song} —</span>
                <span>{reply.caption}"</span>
              </div>
              <span className="text-red-400 text-[10px] shrink-0">📌</span>
            </div>
          ))}
        </div>

        {/* Inline Reply Input Form */}
        {showReplyInput && (
          <form onSubmit={handleAddReply} className="mt-3 space-y-2 pt-2 border-t border-[#142c40]">
            <input
              type="text"
              value={replySongTitle}
              onChange={(e) => setReplySongTitle(e.target.value)}
              placeholder="Song title (e.g., Midnight City Dub)"
              className="w-full bg-[#05101a] border border-[#1b3d59] rounded-xl px-3 py-1.5 text-xs text-[#E8EEF0] font-mono focus:outline-none focus:border-[#91B9C5]"
            />
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your dialogue thought..."
              className="w-full bg-[#05101a] border border-[#1b3d59] rounded-xl px-3 py-1.5 text-xs text-[#E8EEF0] font-mono focus:outline-none focus:border-[#91B9C5]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="px-3 py-1 rounded-lg bg-[#91B9C5] text-[#081724] font-mono text-xs font-bold hover:bg-[#a5ccd9] transition-colors cursor-pointer"
              >
                Send Reply
              </button>
              <button
                type="button"
                onClick={() => setShowReplyInput(false)}
                className="px-2.5 py-1 rounded-lg bg-[#142c40] text-[#91B9C5] font-mono text-xs hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 4. FOOTER: ACTIONS & AUDIT NOTE BUTTON */}
      <div className="mt-4 pt-3 border-t border-[#122b3e] flex items-center justify-between">
        
        {/* Left Social Metrics */}
        <div className="flex items-center gap-4 text-xs font-mono text-[#91B9C5]/70">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 transition-colors cursor-pointer ${
              isLiked ? 'text-rose-400' : 'hover:text-[#E8EEF0]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likes}</span>
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center gap-1 transition-colors cursor-pointer ${
              isSaved ? 'text-[#91B9C5]' : 'hover:text-[#E8EEF0]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          <div className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{replies.length}</span>
          </div>
        </div>

        {/* Right Audit Note Button */}
        <button
          onClick={handlePlayToggle}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            isCurrentPlaying
              ? 'bg-[#B39DDB] text-[#081724] shadow-lg scale-105'
              : 'bg-[#142c40] hover:bg-[#1e4261] text-[#E8EEF0] border border-[#234d70]'
          }`}
        >
          {isCurrentPlaying ? (
            <>
              <Pause className="w-3 h-3 fill-current" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              <span>AUDIT NOTE</span>
            </>
          )}
        </button>

      </div>

    </article>
  );
}
