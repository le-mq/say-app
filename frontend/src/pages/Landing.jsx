import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Disc3, Sparkles, Headphones, Radio, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const { setStudioOpen } = useAuthStore();

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center text-center px-4 py-12 relative overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#91B9C5]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#B39DDB]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#142C40]/80 border border-[#91B9C5]/30 text-xs font-mono text-[#91B9C5] mb-6 shadow-md">
        <Sparkles className="w-3.5 h-3.5 text-[#B39DDB]" />
        <span>Aesthetic Micro-Blogging for True Audiophiles</span>
      </div>

      {/* Main Heading */}
      <h1 className="text-4xl sm:text-6xl font-black text-[#E8EEF0] tracking-tight max-w-3xl leading-[1.1] mb-6">
        Share the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#91B9C5] to-[#B39DDB]">exact 30 seconds</span> that moves your soul.
      </h1>

      {/* Subtitle */}
      <p className="text-sm sm:text-base text-[#91B9C5]/80 max-w-xl mb-10 leading-relaxed">
        Say goodbye to generic links. SAY transforms music into aesthetic receipts, retro cassettes, postage stamps, and spinning vinyl notes with daily Sonic Aura streaks.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
        <button
          onClick={() => navigate('/feed')}
          className="flex items-center gap-2 bg-[#91B9C5] hover:bg-[#B39DDB] text-[#081724] font-extrabold text-sm px-6 py-3.5 rounded-2xl shadow-xl transition-all hover:scale-105"
        >
          <span>Explore Public Feed</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => setStudioOpen(true)}
          className="flex items-center gap-2 bg-[#142C40] hover:bg-[#31566A] text-[#E8EEF0] border border-[#31566A] font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-all"
        >
          <Disc3 className="w-4 h-4 text-[#91B9C5]" />
          <span>Launch Creative Studio</span>
        </button>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full text-left">
        <div className="p-5 rounded-2xl bg-[#142C40]/60 border border-[#31566A]/30">
          <Headphones className="w-6 h-6 text-[#91B9C5] mb-3" />
          <h3 className="font-bold text-sm text-[#E8EEF0] mb-1">30s Curated Snippet</h3>
          <p className="text-xs text-[#91B9C5]/70">Pick the exact high-fidelity hook, beat drop, or bridge that defines your current emotion.</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#142C40]/60 border border-[#31566A]/30">
          <Disc3 className="w-6 h-6 text-[#B39DDB] mb-3" />
          <h3 className="font-bold text-sm text-[#E8EEF0] mb-1">Sonic Aura Streak</h3>
          <p className="text-xs text-[#91B9C5]/70">Cultivate your daily 31-day music calendar and unlock audiophile status badges.</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#142C40]/60 border border-[#31566A]/30">
          <Radio className="w-6 h-6 text-[#91B9C5] mb-3" />
          <h3 className="font-bold text-sm text-[#E8EEF0] mb-1">Song Dialogues</h3>
          <p className="text-xs text-[#91B9C5]/70">Don't reply with words. Answer your friends' notes with a responding song track.</p>
        </div>
      </div>

    </div>
  );
}
