import React, { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { PlaybackState, SourceType } from '../services/MusicPlaybackService';
import { 
  Play, Pause, SkipBack, SkipForward, ChevronUp, ChevronDown, 
  X, Volume2, Volume1, VolumeX, AlertCircle, RefreshCw, Radio, Music, Disc 
} from 'lucide-react';

const DEFAULT_TRACK = {
  id: 'say-idle-track',
  songTitle: 'Select a Note to Listen',
  artistName: 'SAY Ambient Feed',
  songImageUrl: null,
  audioSnippetStart: 0,
  snippetDuration: 30,
};

function formatTimeMMSS(secs) {
  const total = Math.max(0, Math.floor(Number(secs) || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
}

export default function GlobalPlayerDock() {
  const { 
    currentTrack, 
    isPlaying, 
    isBuffering, 
    currentTime, 
    duration, 
    playbackState, 
    sourceType, 
    errorMessage, 
    volume,
    isMuted,
    setVolume,
    toggleMute,
    togglePlay, 
    playTrack, 
    pauseTrack, 
    seekTo 
  } = usePlayerStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  const track = currentTrack || DEFAULT_TRACK;
  const isYouTube = sourceType === SourceType.YOUTUBE;
  const isItunes = sourceType === SourceType.ITUNES;

  // Lọc sạch các nhãn giả lập theo yêu cầu Chương 3.2 & 14.2 (không có Lossless / 24-bit giả lập)
  const cleanArtist = (track.artistName || 'Unknown Artist')
    .replace(/\s*•\s*Lossless\s*24-Bit\s*DAC/gi, '')
    .replace(/\s*•\s*Lossless/gi, '')
    .replace(/\s*•\s*24-Bit/gi, '')
    .trim();

  const effectiveDuration = duration || 30;
  const displayCurrent = isScrubbing ? scrubValue : currentTime;
  const progressPercent = Math.min(100, Math.max(0, (displayCurrent / effectiveDuration) * 100));

  const handleSeekChange = (e) => {
    const val = Number(e.target.value);
    setScrubValue(val);
  };

  const handleSeekCommit = () => {
    setIsScrubbing(false);
    seekTo(scrubValue);
  };

  const handlePrev = () => {
    seekTo(0);
  };

  const handleNext = () => {
    seekTo(effectiveDuration);
  };

  return (
    <>
      {/* ==================================================================== */}
      {/* 1. MINI PLAYER DOCK (Fixed Bottom)                                   */}
      {/* ==================================================================== */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#07131e]/98 backdrop-blur-xl border-t border-[#122b3e] shadow-[0_-8px_30px_rgba(0,0,0,0.7)]">
        
        {/* Progress Bar (Top border scrubber) - Petrol Mist & subtle Logo lavender/amber gradient */}
        <div className="relative w-full h-1 bg-[#102231] group cursor-pointer">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 via-[#B39DDB] to-amber-300 transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
          <input
            type="range"
            min={0}
            max={effectiveDuration}
            step={0.1}
            value={displayCurrent}
            onMouseDown={() => setIsScrubbing(true)}
            onTouchStart={() => setIsScrubbing(true)}
            onChange={handleSeekChange}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title="Seek preview snippet"
          />
        </div>

        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          
          {/* --- 1. LEFT: Artwork + Title + Artist / Source --- */}
          <div 
            className="flex items-center gap-3 min-w-0 w-[30%] sm:w-[28%] cursor-pointer group shrink-0"
            onClick={() => setIsExpanded(!isExpanded)}
            title="Click to expand player"
          >
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden bg-[#0c1f2e] shrink-0 border border-[#1b3d5b] flex items-center justify-center shadow-md group-hover:border-[#91B9C5] transition-colors">
              {track.songImageUrl ? (
                <img
                  src={track.songImageUrl}
                  alt={track.songTitle}
                  className={`w-full h-full object-cover transition-opacity ${isPlaying ? 'opacity-95' : 'opacity-80'}`}
                />
              ) : (
                <Disc className="w-5 h-5 text-[#91B9C5]/35 animate-pulse" />
              )}
              {isBuffering && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-cyan-300 animate-spin" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs sm:text-sm text-[#E8EEF0] truncate leading-tight group-hover:text-cyan-300 transition-colors">
                {track.songTitle}
              </p>
              <div className="flex items-center gap-2 mt-0.5 truncate">
                <span className="text-[10px] text-[#91B9C5]/80 font-mono truncate">
                  {cleanArtist}
                </span>
              </div>
            </div>
          </div>

          {/* --- 2. CENTER: Playback Controls ONLY (Prev - Play/Pause - Next) --- */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-4 flex-1 min-w-0">
            {/* Desktop Prev Button */}
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 text-[#91B9C5]/70 hover:text-white hover:scale-105 transition-all cursor-pointer shrink-0"
              title="Restart snippet"
            >
              <SkipBack className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Prominent Centered Primary Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-[#91B9C5] to-[#B39DDB] hover:from-white hover:to-white text-[#081724] flex items-center justify-center transition-all hover:scale-105 shadow-lg shadow-violet-950/40 cursor-pointer shrink-0"
              title={isPlaying ? "Pause" : "Play Snippet"}
            >
              {isBuffering ? (
                <RefreshCw className="w-4.5 h-4.5 animate-spin text-[#081724]" />
              ) : isPlaying ? (
                <Pause className="w-4.5 h-4.5 fill-current" />
              ) : (
                <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
              )}
            </button>

            {/* Desktop Next Button */}
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 text-[#91B9C5]/70 hover:text-white hover:scale-105 transition-all cursor-pointer shrink-0"
              title="Skip to end"
            >
              <SkipForward className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>

          {/* --- 3. RIGHT: Timer + Volume Control Slider & Expand Button --- */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-3.5 w-[30%] sm:w-[28%] shrink-0">
            {/* Actual Preview Snippet Timer - Positioned next to volume slider */}
            <div className="text-[11px] font-mono text-[#91B9C5]/90 tracking-wider tabular-nums px-1 shrink-0 hidden sm:inline-block">
              <span className="text-[#E8EEF0]">{formatTimeMMSS(displayCurrent)}</span>
              <span className="text-neutral-500 mx-1">/</span>
              <span>{formatTimeMMSS(effectiveDuration)}</span>
            </div>

            {/* Volume Control Slider with Filled Progress Track */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0c1f2e] border border-[#16354d]">
              <button
                type="button"
                onClick={toggleMute}
                className="text-[#91B9C5] hover:text-white transition-colors cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-3.5 h-3.5 text-[#91B9C5]" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[#91B9C5]" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : (volume ?? 0.85)}
                onChange={(e) => setVolume(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${Math.round((isMuted ? 0 : (volume ?? 0.85)) * 100)}%, #102434 ${Math.round((isMuted ? 0 : (volume ?? 0.85)) * 100)}%, #102434 100%)`
                }}
                className="w-18 h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan-300 hover:accent-cyan-200 transition-all"
                title={`Volume: ${Math.round((isMuted ? 0 : (volume ?? 0.85)) * 100)}%`}
              />
            </div>

            {/* Expand / Collapse Button */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg bg-[#0c1f2e] border border-[#16354d] text-[#91B9C5] hover:text-white hover:border-[#91B9C5]/50 transition-all cursor-pointer"
              title={isExpanded ? "Collapse Player" : "Expand Player"}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Error Notice Banner */}
        {errorMessage && (
          <div className="bg-rose-950/85 border-t border-rose-800/40 px-4 py-1 text-center text-xs font-mono text-rose-300 flex items-center justify-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </footer>

      {/* ==================================================================== */}
      {/* 2. EXPANDED PLAYER MODAL (Pure Audiophile Album Art Stage)            */}
      {/* ==================================================================== */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05111d]/90 backdrop-blur-xl animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop click to close */}
          <div 
            className="absolute inset-0" 
            onClick={() => setIsExpanded(false)} 
          />

          <div className="relative z-10 w-full max-w-[500px] bg-[#091827] border border-[#16354d] rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            
            {/* Close Button [X] */}
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#0c1f2e] hover:bg-[#15344d] text-[#91B9C5] hover:text-white transition-colors cursor-pointer"
              title="Close expanded player"
            >
              <X className="w-4 h-4" />
            </button>

            {/* --- VISUAL STAGE: Pure Album Artwork & Vinyl Disc (Zero Video Overhead) --- */}
            <div className="w-full mb-5 flex items-center justify-center">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden bg-[#0c1f2e] border-2 border-[#1b3d5b] shadow-2xl flex items-center justify-center group">
                {track.songImageUrl ? (
                  <img
                    src={track.songImageUrl}
                    alt={track.songTitle}
                    className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-[#91B9C5]/40">
                    <Disc className="w-16 h-16 animate-[spin_10s_linear_infinite]" />
                    <span className="text-[11px] font-mono tracking-wider uppercase">Select a Note</span>
                  </div>
                )}
                {isBuffering && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-cyan-300 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Song Title & Clean Artist */}
            <h2 className="text-base sm:text-lg font-bold text-[#E8EEF0] tracking-wide truncate max-w-full px-4">
              {track.songTitle}
            </h2>
            <p className="text-xs sm:text-sm text-[#91B9C5] font-mono mt-1 truncate max-w-full px-4">
              {cleanArtist}
            </p>

            {/* Interactive Timeline Scrub Bar */}
            <div className="w-full my-4 px-2">
              <div className="relative w-full h-1.5 bg-[#102231] rounded-full overflow-hidden cursor-pointer group">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-[#91B9C5] rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={effectiveDuration}
                  step={0.1}
                  value={displayCurrent}
                  onMouseDown={() => setIsScrubbing(true)}
                  onTouchStart={() => setIsScrubbing(true)}
                  onChange={handleSeekChange}
                  onMouseUp={handleSeekCommit}
                  onTouchEnd={handleSeekCommit}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Scrub timeline"
                />
              </div>

              {/* Exact Preview Time: 00:15 ━━━━━━━ 00:30 (Chapter 3.2) */}
              <div className="flex items-center justify-between text-xs font-mono text-[#91B9C5]/80 mt-2 px-0.5">
                <span>{formatTimeMMSS(displayCurrent)}</span>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-sans">
                  30s Audio Note Snippet
                </span>
                <span>{formatTimeMMSS(effectiveDuration)}</span>
              </div>
            </div>

            {/* Controls: Prev - Play - Next */}
            <div className="flex items-center justify-center gap-6 mt-1">
              <button
                type="button"
                onClick={handlePrev}
                className="p-2.5 rounded-full bg-[#0c1f2e] hover:bg-[#16364f] text-[#91B9C5] hover:text-white transition-all cursor-pointer"
                title="Restart snippet"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="w-13 h-13 rounded-full bg-[#91B9C5] hover:bg-white text-[#081724] flex items-center justify-center transition-all hover:scale-105 shadow-xl cursor-pointer"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isBuffering ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="p-2.5 rounded-full bg-[#0c1f2e] hover:bg-[#16364f] text-[#91B9C5] hover:text-white transition-all cursor-pointer"
                title="Skip snippet"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Expanded Volume Slider with Filled Progress Track */}
            <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-[#132c40] w-full max-w-[280px]">
              <button
                type="button"
                onClick={toggleMute}
                className="text-[#91B9C5] hover:text-white transition-colors cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4 text-[#91B9C5]" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#91B9C5]" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : (volume ?? 0.85)}
                onChange={(e) => setVolume(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${Math.round((isMuted ? 0 : (volume ?? 0.85)) * 100)}%, #102434 ${Math.round((isMuted ? 0 : (volume ?? 0.85)) * 100)}%, #102434 100%)`
                }}
                className="w-36 h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan-300 hover:accent-cyan-200 transition-all"
                title={`Volume: ${Math.round((isMuted ? 0 : (volume ?? 0.85)) * 100)}%`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

