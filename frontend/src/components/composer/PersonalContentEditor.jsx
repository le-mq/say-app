import React, { useState } from 'react';
import { 
  Sparkles, MessageSquare, Quote, Heart, Moon, Coffee, 
  CloudRain, Disc3, Headphones, Globe, Users, Smile, X 
} from 'lucide-react';

const MOOD_TAGS = [
  'Nostalgic',
  'Melancholic',
  'Peaceful',
  'Hopeful',
  'Lonely',
  'Dreamy',
  'Cosmic Bliss',
  'Bittersweet',
];

const QUICK_VIBES = [
  { tag: '🎧 2:15 AM Drive', text: 'pov: driving home at 2:15 AM with this on loop' },
  { tag: '🌧️ Cold Rain', text: 'this song feels like cold rain against a dimly lit train window' },
  { tag: '☕ Tape & Coffee', text: 'vintage tape hiss, warm matcha, and absolutely zero drama' },
  { tag: '📼 90s Memory', text: 'sounds like a bittersweet memory from a year I don’t remember' },
  { tag: '🪐 Zero Gravity', text: 'floating somewhere in orbit where no notifications can reach me' },
];

const STICKER_BADGES = [
  { id: 'Moon', label: 'Moon', icon: Moon, color: 'text-amber-200' },
  { id: 'Vinyl Spin', label: 'Vinyl Disc', icon: Disc3, color: 'text-cyan-300' },
  { id: 'Midnight Coffee', label: 'Coffee', icon: Coffee, color: 'text-amber-500' },
  { id: 'Rain Drops', label: 'Rain', icon: CloudRain, color: 'text-sky-400' },
  { id: 'Star Shimmer', label: 'Sparkle', icon: Sparkles, color: 'text-amber-300' },
  { id: 'Heartbeat', label: 'Heart', icon: Heart, color: 'text-rose-400' },
  { id: 'Headphones', label: 'Headphones', icon: Headphones, color: 'text-indigo-300' },
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
  return (
    <div className="space-y-4 bg-[#081724] border border-[#16354d] rounded-2xl p-4">
      
      {/* 4A. PERSONAL NOTE / CAPTION (Chapter 8.6) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#91B9C5] flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>4. Personal Caption</span>
            <span className="text-[10px] text-neutral-500 font-normal">(Optional)</span>
          </label>
          <span className="text-[10px] font-mono text-neutral-500">
            {caption.length}/150
          </span>
        </div>

        <textarea
          rows={2}
          maxLength={150}
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Write your thoughts, memory or feelings connected to this song..."
          className="w-full bg-[#06121d] border border-[#1b3d5b] rounded-xl px-3 py-2 text-xs text-[#E8EEF0] focus:outline-none focus:border-cyan-400 font-sans placeholder:text-neutral-500 resize-none"
        />

        {/* Quick Inspiration Vibes */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {QUICK_VIBES.map((vibe, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onCaptionChange(vibe.text)}
              className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#0c1f2e] hover:bg-[#15344d] text-[#91B9C5] hover:text-white border border-[#16354d] transition-colors cursor-pointer"
            >
              {vibe.tag}
            </button>
          ))}
        </div>
      </div>

      {/* 4B. LYRIC SNIPPET (Chapter 8.6: Strictly separate from Caption) */}
      <div className="space-y-1.5 pt-3 border-t border-[#132c40]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#91B9C5] flex items-center gap-1.5">
            <Quote className="w-3.5 h-3.5 text-amber-300" />
            <span>Lyric Snippet</span>
            <span className="text-[10px] text-neutral-500 font-normal">(Self-typed by user)</span>
          </label>
          <span className="text-[10px] font-mono text-neutral-500">
            {lyricSnippet.length}/120
          </span>
        </div>

        <textarea
          rows={2}
          maxLength={120}
          value={lyricSnippet}
          onChange={(e) => onLyricSnippetChange(e.target.value)}
          placeholder="Quote your favorite lyric line from this track (e.g. 'And at once I knew I was not magnificent...')"
          className="w-full bg-[#06121d] border border-[#1b3d5b] rounded-xl px-3 py-2 text-xs italic font-serif text-amber-100 focus:outline-none focus:border-cyan-400 placeholder:text-neutral-500 resize-none"
        />
      </div>

      {/* 4C. MOOD TAG & ENAMEL STICKER (Chapter 8.7) */}
      <div className="space-y-3 pt-3 border-t border-[#132c40]">
        
        {/* Mood Tags */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#91B9C5] block">
            Mood Tag
          </label>
          <div className="flex flex-wrap gap-1.5">
            {MOOD_TAGS.map((tag) => {
              const isSelected = emotionTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onEmotionTagChange(isSelected ? '' : tag)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500 text-black font-bold shadow-sm'
                      : 'bg-[#0c1f2e] text-[#91B9C5] hover:text-white border border-[#16354d]'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sticker / Seal Badges */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#91B9C5] block">
            Tactile Enamel Badge
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {STICKER_BADGES.map((b) => {
              const Icon = b.icon;
              const isSelected = stickerBadge === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onStickerBadgeChange(b.id)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#183952] border-cyan-400 ring-2 ring-cyan-400/40 scale-105 shadow-md'
                      : 'bg-[#0c1f2e] border-[#16354d] hover:bg-[#15344d]'
                  }`}
                  title={b.label}
                >
                  <Icon className={`w-4 h-4 ${b.color}`} />
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4D. VISIBILITY (Chapter 8.8: Public vs Friends-only) */}
      <div className="pt-3 border-t border-[#132c40] flex items-center justify-between">
        <div>
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#91B9C5] block">
            5. Audience Visibility
          </label>
          <p className="text-[10px] font-mono text-neutral-400">
            {visibility === 'PUBLIC' ? 'Visible to everyone on the Feed' : 'Visible only to accepted friends'}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#06121d] p-1 rounded-xl border border-[#16354d]">
          <button
            type="button"
            onClick={() => onVisibilityChange('PUBLIC')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              visibility === 'PUBLIC'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-[#91B9C5]/70 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Public</span>
          </button>

          <button
            type="button"
            onClick={() => onVisibilityChange('FRIENDS_ONLY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              visibility === 'FRIENDS_ONLY'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-[#91B9C5]/70 hover:text-white'
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

