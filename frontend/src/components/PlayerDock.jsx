import React, { useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { Play, Pause } from 'lucide-react';

const DEFAULT_TRACK = {
  id: 'note-0492',
  songTitle: 'Night Drive / Midnight Ambient',
  artistName: 'Khruangbin Vibe • Lossless 24-Bit DAC',
  songImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200',
  durationSec: 162, // 2:42
};

export default function PlayerDock() {
  const { currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const [localPlaying, setLocalPlaying] = useState(false);

  const track = currentTrack || DEFAULT_TRACK;
  const activeIsPlaying = currentTrack ? isPlaying : localPlaying;

  const handleToggle = () => {
    if (currentTrack) {
      togglePlay();
    } else {
      setLocalPlaying(!localPlaying);
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#07131e]/98 backdrop-blur-lg border-t border-[#122b3e] px-4 sm:px-8 py-3 flex items-center justify-between">
      
      {/* 1. Track Info (Left) */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-black shrink-0 border border-[#1b3d5b] shadow-md">
          <img
            src={track.songImageUrl}
            alt={track.songTitle}
            className={`w-full h-full object-cover ${activeIsPlaying ? 'opacity-90' : 'opacity-80'}`}
          />
        </div>

        <div className="min-w-0">
          <p className="font-bold text-xs text-[#E8EEF0] truncate leading-tight">
            {track.songTitle}
          </p>
          <p className="text-[10px] text-[#91B9C5]/80 font-mono truncate mt-0.5">
            {track.artistName}
          </p>
        </div>
      </div>

      {/* 2. Play Control & Time (Right) */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggle}
          className="w-9 h-9 rounded-full bg-[#91B9C5] hover:bg-[#a4cbd7] text-[#081724] flex items-center justify-center transition-all hover:scale-105 shadow-md cursor-pointer"
          title={activeIsPlaying ? "Pause" : "Play Snippet"}
        >
          {activeIsPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        <span className="text-[11px] font-mono text-[#91B9C5]/80">
          0:00 / 2:42
        </span>
      </div>

    </footer>
  );
}
