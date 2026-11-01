import React from 'react';
import { usePlayerStore } from '../store/playerStore';
import { Play, Pause, Disc, ExternalLink, X } from 'lucide-react';

export default function PlayerDock() {
  const { currentTrack, isPlaying, togglePlay, stopTrack } = usePlayerStore();

  if (!currentTrack) return null;

  const startSec = currentTrack.audioSnippetStart || 0;
  const endSec = startSec + 30;

  return (
    <aside className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-2xl bg-[#142C40]/95 backdrop-blur-xl border border-[#91B9C5]/30 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Vinyl Disk and Song Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-black shrink-0 border border-[#91B9C5]/40 shadow-md">
          <img
            src={currentTrack.songImageUrl}
            alt={currentTrack.songTitle}
            className={`w-full h-full object-cover ${isPlaying ? 'animate-spin' : ''}`}
            style={{ animationDuration: '4s' }}
          />
          <div className="absolute inset-0 m-auto w-3.5 h-3.5 rounded-full bg-[#081724] border border-[#91B9C5]" />
        </div>

        <div className="min-w-0">
          <p className="font-bold text-xs text-[#E8EEF0] truncate leading-tight">
            {currentTrack.songTitle}
          </p>
          <p className="text-[11px] text-[#91B9C5] truncate">
            {currentTrack.artistName}
          </p>
          <span className="text-[9px] font-mono text-[#B39DDB]">
            Snippet: {startSec}s - {endSec}s (30s)
          </span>
        </div>
      </div>

      {/* Center Waveform Audio Animation */}
      <div className="hidden sm:flex items-center gap-1 h-6">
        {[40, 75, 100, 60, 90, 45, 80, 65, 95, 30].map((h, i) => (
          <div
            key={i}
            className={`w-1 bg-[#91B9C5] rounded-full transition-all duration-200 ${
              isPlaying ? 'animate-pulse' : 'opacity-40'
            }`}
            style={{
              height: isPlaying ? `${h}%` : '20%',
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-xl bg-[#91B9C5] text-[#081724] flex items-center justify-center hover:scale-105 transition-transform shadow-md"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        <a
          href={currentTrack.externalSongUrl}
          target="_blank"
          rel="noreferrer"
          className="p-2 text-[#91B9C5]/70 hover:text-white hover:bg-[#31566A]/40 rounded-xl transition-colors"
          title="Open Track Link"
        >
          <ExternalLink className="w-4 h-4" />
        </a>

        <button
          onClick={stopTrack}
          className="p-2 text-[#91B9C5]/70 hover:text-red-400 hover:bg-[#31566A]/40 rounded-xl transition-colors"
          title="Close player"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

    </aside>
  );
}
