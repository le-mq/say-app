import React, { useRef, useState } from 'react';
import { 
  Sparkles, MessageSquare, Quote, Heart, Moon, Coffee, 
  CloudRain, Disc3, Headphones, Globe, Users, Upload, X, Image as ImageIcon, Flame, Link as LinkIcon
} from 'lucide-react';
import { toast } from 'react-toastify';

const MOOD_TAGS = [
  '🌙 Melancholic',
  '📼 Nostalgic',
  '🍃 Peaceful',
  '✨ Hopeful',
  '🌧️ Lonely',
  '🪐 Cosmic Bliss',
  '☕ Bittersweet',
  '💫 Dreamy',
];

const QUICK_VIBES = [
  { tag: '🎧 2:15 AM Drive', text: 'pov: driving home at 2:15 AM with this on loop' },
  { tag: '🌧️ Cold Rain', text: 'this song feels like cold rain against a dimly lit train window' },
  { tag: '☕ Tape & Coffee', text: 'vintage tape hiss, warm matcha, and absolutely zero drama' },
  { tag: '📼 90s Memory', text: 'sounds like a bittersweet memory from a year I don’t remember' },
  { tag: '🪐 Zero Gravity', text: 'floating somewhere in orbit where no notifications can reach me' },
];

// Curated aesthetic stickers
const CURATED_STICKERS = [
  { id: 'Moon', label: 'Moon', icon: Moon, color: 'text-sky-300' },
  { id: 'Vinyl Spin', label: 'Vinyl Disc', icon: Disc3, color: 'text-slate-200' },
  { id: 'Midnight Coffee', label: 'Coffee', icon: Coffee, color: 'text-amber-200' },
  { id: 'Rain Drops', label: 'Rain', icon: CloudRain, color: 'text-sky-400' },
  { id: 'Star Shimmer', label: 'Sparkle', icon: Sparkles, color: 'text-cyan-300' },
  { id: 'Heartbeat', label: 'Heart', icon: Heart, color: 'text-rose-400' },
  { id: 'Flame Seal', label: 'Flame', icon: Flame, color: 'text-[#00594c]' },
];

export default function PersonalContentEditor({
  caption,
  onCaptionChange,
  lyricSnippet,
  onLyricSnippetChange,
  emotionTag,
  onEmotionTagChange,
  stickerBadge,
  onStickerBadgeChange,
  visibility,
  onVisibilityChange,
}) {
  const fileInputRef = useRef(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  // Handle local GIF or image file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid GIF or image file.');
      return;
    }

    // Limit size to ~1.5MB for smooth client & DB persistence
    if (file.size > 1.5 * 1024 * 1024) {
      toast.warning('File size is too large (max 1.5MB). Please choose a smaller GIF or image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        onStickerBadgeChange(result);
        toast.success(file.type.includes('gif') ? 'GIF sticker applied to note!' : 'Photo snapshot applied to note!');
      }
    };
    reader.readAsDataURL(file);

    // Reset input so user can re-upload if needed
    e.target.value = '';
  };

  const handleApplyUrl = (e) => {
    e.preventDefault();
    const trimmed = customUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      toast.error('Please enter a valid HTTP/HTTPS link to an image or GIF.');
      return;
    }
    onStickerBadgeChange(trimmed);
    toast.success('Custom GIF / Photo link attached!');
    setCustomUrl('');
    setShowUrlInput(false);
  };

  const isCustomImage = typeof stickerBadge === 'string' && (
    stickerBadge.startsWith('data:image/') || 
    stickerBadge.startsWith('http://') || 
    stickerBadge.startsWith('https://')
  );

  return (
    <div className="space-y-4 bg-[#0a1828]/95 border border-sky-500/20 rounded-2xl p-4 sm:p-5 text-[#E6EDF3] shadow-md">
      
      {/* 1. PERSONAL NOTE / CAPTION */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-sky-200 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            <span>Note Thoughts</span>
            <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
          </label>
          <span className="text-[10px] font-mono text-slate-400 font-semibold">
            {caption.length}/150
          </span>
        </div>

        <textarea
          rows={2}
          maxLength={150}
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="What's on your mind with this track?..."
          className="w-full bg-[#06121e] border border-sky-500/25 rounded-xl px-3 py-2 text-xs text-[#E8EEF0] focus:outline-none focus:border-sky-400/70 font-sans placeholder:text-slate-500 resize-none transition-colors"
        />

        {/* Quick Inspiration Vibes */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {QUICK_VIBES.map((vibe, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onCaptionChange(vibe.text)}
              className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#0c2238] hover:bg-[#123150] text-sky-200 hover:text-white border border-sky-500/25 transition-colors cursor-pointer"
            >
              {vibe.tag}
            </button>
          ))}
        </div>
      </div>

      {/* 2. LYRIC QUOTE */}
      <div className="space-y-1.5 pt-3 border-t border-sky-500/15">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-sky-200 flex items-center gap-1.5">
            <Quote className="w-3.5 h-3.5 text-sky-400" />
            <span>Lyric Quote</span>
            <span className="text-[10px] text-slate-400 font-normal">(Self-typed)</span>
          </label>
          <span className="text-[10px] font-mono text-slate-400 font-semibold">
            {lyricSnippet.length}/120
          </span>
        </div>

        <textarea
          rows={2}
          maxLength={120}
          value={lyricSnippet}
          onChange={(e) => onLyricSnippetChange(e.target.value)}
          placeholder="Tape hiss intertwining with bedroom ceiling shadows..."
          className="w-full bg-[#06121e] border border-sky-500/25 rounded-xl px-3 py-2 text-xs italic font-serif text-sky-100 focus:outline-none focus:border-sky-400/70 placeholder:text-slate-500 resize-none transition-colors"
        />
      </div>

      {/* 3. MOOD TAG & STICKER DECORATION */}
      <div className="space-y-3 pt-3 border-t border-sky-500/15">
        
        {/* Mood Tags */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-sky-200">
              Mood Tag
            </label>
            {emotionTag && (
              <span className="text-[10px] font-mono text-sky-300 font-bold">
                Active: {emotionTag}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MOOD_TAGS.map((tag) => {
              const isSelected = emotionTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onEmotionTagChange(isSelected ? '' : tag)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-400 text-slate-950 font-bold shadow-md shadow-sky-950/50 scale-102'
                      : 'bg-[#0a1c2e] text-sky-200/90 hover:text-white hover:bg-[#102b47] border border-sky-500/25'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tactile Seal Badge & GIF / Image Upload (Chapter 8.7) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <span>Seal Badge & Sticker</span>
            </label>
            {stickerBadge && stickerBadge !== 'None' && (
              <button
                type="button"
                onClick={() => onStickerBadgeChange('None')}
                className="text-[10px] font-mono text-neutral-500 hover:text-rose-400 cursor-pointer"
              >
                Clear Sticker
              </button>
            )}
          </div>

          {/* Sticker Selection Tray */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Option A: None Button */}
            <button
              type="button"
              onClick={() => onStickerBadgeChange('None')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                (!stickerBadge || stickerBadge === 'None')
                  ? 'bg-white/15 border-white text-white font-bold'
                  : 'bg-[#0a0d12] border-white/10 hover:border-white/20 text-neutral-500'
              }`}
              title="No sticker"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Option B: Enamel Badges */}
            {CURATED_STICKERS.map((b) => {
              const Icon = b.icon;
              const isSelected = stickerBadge === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onStickerBadgeChange(b.id)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white/15 border-white shadow-sm scale-105'
                      : 'bg-[#0a0d12] border-white/10 hover:border-white/20'
                  }`}
                  title={b.label}
                >
                  <Icon className={`w-4 h-4 ${b.color}`} />
                </button>
              );
            })}

            {/* Option C: Real GIF / Image File Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.gif"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-[#0b2136] hover:bg-[#123150] border border-dashed border-sky-400/40 hover:border-sky-300 text-sky-200 hover:text-white text-xs font-mono transition-all cursor-pointer shadow-sm"
              title="Upload custom GIF or small photobooth image"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>+ Upload Photo / GIF</span>
            </button>

            {/* Option D: Paste URL Toggle */}
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-xl border text-xs font-mono transition-all cursor-pointer shadow-sm ${
                showUrlInput 
                  ? 'bg-[#102e4c] border-sky-400 text-white shadow-xs' 
                  : 'bg-[#061421] border-sky-500/25 hover:border-sky-400/50 text-sky-300 hover:text-white'
              }`}
              title="Enter an image or GIF URL"
            >
              <LinkIcon className="w-3.5 h-3.5 text-sky-400" />
              <span>Link URL</span>
            </button>
          </div>

          {/* Paste URL Input Form */}
          {showUrlInput && (
            <form onSubmit={handleApplyUrl} className="flex items-center gap-2 pt-1 animate-in fade-in duration-200">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Paste direct GIF or image URL (https://...)"
                className="flex-1 bg-[#061421] border border-sky-500/30 focus:border-sky-400 rounded-xl px-3 py-1.5 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-[#00594c] hover:bg-[#00705f] text-white text-xs font-mono font-bold transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => { setShowUrlInput(false); setCustomUrl(''); }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Active Custom Image / GIF Status Banner */}
          {isCustomImage && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0a2033] border border-sky-400/35 text-xs font-mono relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00594c]/15 via-transparent to-sky-500/10 pointer-events-none" />
              <div className="flex items-center gap-2.5 min-w-0 relative z-10">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-sky-300/60 shrink-0 bg-white p-0.5 shadow-sm">
                  <img src={stickerBadge} alt="Uploaded badge" className="w-full h-full object-cover rounded-xs" />
                </div>
                <span className="text-sky-200 font-semibold truncate text-[11px]">
                  Photobooth Snapshot Attached
                </span>
              </div>
              <button
                type="button"
                onClick={() => onStickerBadgeChange('None')}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer relative z-10"
                title="Remove sticker"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 4. AUDIENCE VISIBILITY */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
        <div>
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 block">
            Audience
          </label>
          <p className="text-[10px] font-mono text-neutral-500">
            {visibility === 'PUBLIC' ? 'Public Soundscape' : 'Friends Circle Only'}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#0a0d12] p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => onVisibilityChange('PUBLIC')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              visibility === 'PUBLIC'
                ? 'bg-neutral-200 text-neutral-900 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Public Feed</span>
          </button>

          <button
            type="button"
            onClick={() => onVisibilityChange('FRIENDS_ONLY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              visibility === 'FRIENDS_ONLY'
                ? 'bg-neutral-200 text-neutral-900 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Friends Only</span>
          </button>
        </div>
      </div>

    </div>
  );
}
