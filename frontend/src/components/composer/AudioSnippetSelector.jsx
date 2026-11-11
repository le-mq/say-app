import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Clock, Lock, Info } from 'lucide-react';
import { formatTime } from '../../services/musicService';
import { usePlayerStore } from '../../store/playerStore';

// Authentic organic waveform: dynamic musical heights with peaks & valleys, tapered ends, slender bars
function generateOrganicWaveform(count = 54, seedStr = '') {
  let seed = 12345;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) & 0xffffffff;
  }
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  return Array.from({ length: count }, (_, i) => {
    // Symmetrical envelope for gentle taper at far edges
    const edgeFactor = Math.sin((i / count) * Math.PI);

    // Dynamic melodic swells + rhythm section variation
    const melodicWave = Math.sin(i * 0.28) * 16 + Math.cos(i * 0.65) * 8;
    
    // Rhythmic kick / transient pulses every 3-4 bars
    const transientHit = (i % 4 === 1) ? 14 : ((i % 2 === 0) ? 5 : -4);

    // Natural controlled acoustic noise
    const noise = (pseudoRandom() - 0.5) * 20;

    const rawHeight = Math.floor((26 + melodicWave + transientHit + noise) * Math.pow(edgeFactor, 0.42));
    
    // Slender peaks up to 54px, valleys down to 8px
    return Math.max(8, Math.min(54, rawHeight));
  });
}

export default function AudioSnippetSelector({ 
  selectedTrack, 
  snippetStart, 
  onSnippetStartChange, 
  snippetDuration = 30,
  onSnippetDurationChange 
}) {
  const { isPlaying, currentTime, currentTrack, playTrack, pauseTrack, togglePlay, seekSnippet, setSnippetDuration, setLooping, loadTrack } = usePlayerStore();

  const handleDurationChange = (newDur) => {
    onSnippetDurationChange(newDur);
    if (typeof setSnippetDuration === 'function') {
      setSnippetDuration(newDur);
    }
  };

  const isCurrentSnippetPlaying = Boolean(
    isPlaying && (
      currentTrack?.id === selectedTrack?.id ||
      currentTrack?.id === 'studio-preview-id' ||
      (selectedTrack?.externalSongUrl && currentTrack?.externalSongUrl === selectedTrack?.externalSongUrl) ||
      (selectedTrack?.youtubeId && currentTrack?.youtubeId === selectedTrack?.youtubeId)
    )
  );
  const isPlayingRef = useRef(isCurrentSnippetPlaying);
  isPlayingRef.current = isCurrentSnippetPlaying;

  const isYouTube = selectedTrack?.platform === 'YOUTUBE' || Boolean(selectedTrack?.youtubeId) || Boolean(selectedTrack?.externalSongUrl?.includes('youtube') || selectedTrack?.externalSongUrl?.includes('youtu.be'));
  const isFixedSample = selectedTrack?.platform === 'ITUNES' || (!isYouTube && (selectedTrack?.duration || 0) <= 30);
  const canScrub = !isFixedSample;

  // Listen to exact YouTube duration detected via player (supports videos > 1 hour)
  const [detectedDuration, setDetectedDuration] = React.useState(null);

  useEffect(() => {
    setDetectedDuration(null);
  }, [selectedTrack?.id, selectedTrack?.externalSongUrl]);

  useEffect(() => {
    const handleDurationDetected = (e) => {
      const dur = e?.detail?.duration;
      if (dur && dur > 0) {
        setDetectedDuration(dur);
      }
    };
    window.addEventListener('say_track_duration_detected', handleDurationDetected);
    return () => window.removeEventListener('say_track_duration_detected', handleDurationDetected);
  }, []);

  const effectiveTrackDuration = detectedDuration || selectedTrack?.duration || currentTrack?.fullDuration || currentTrack?.duration;
  const totalDuration = isFixedSample ? 30 : Math.max(30, effectiveTrackDuration || (isYouTube ? 300 : 30));
  const maxStart = isFixedSample ? 0 : Math.max(0, totalDuration - snippetDuration);

  const startSec = isFixedSample ? 0 : Math.min(Math.max(0, Number(snippetStart) || 0), maxStart);
  const endSec = isFixedSample ? 30 : Math.min(totalDuration, startSec + snippetDuration);

  // Generate artistic organic waveform bars with rich acoustic peaks & valleys (consistent per track)
  const waveformBars = useMemo(() => {
    const seed = selectedTrack?.id || selectedTrack?.songTitle || 'track';
    return generateOrganicWaveform(54, seed);
  }, [selectedTrack?.id, selectedTrack?.songTitle]);

  // Direct DOM references for physical 60fps movement (zero composite detachment lag during form scroll)
  const trackContainerRef = useRef(null);
  const selectionFrameRef = useRef(null);
  const highlightLayerRef = useRef(null);
  const playheadNeedleRef = useRef(null);
  const progressFillRef = useRef(null);
  const timeStartRef = useRef(null);
  const timeEndRef = useRef(null);
  const playButtonLabelRef = useRef(null);

  // Drag tracking refs
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartSecRef = useRef(0);
  const isDraggingFrameRef = useRef(false);
  const hasMovedRef = useRef(false);
  const wasPlayingBeforeDragRef = useRef(false);
  const currentStartSecRef = useRef(startSec);
  const rafIdRef = useRef(null);

  // Background auto-loop
  useEffect(() => {
    setLooping(true);
  }, [setLooping]);

  // Sync DOM elements instantly in physical lockstep
  const updateVisualPosition = useCallback((targetSec) => {
    if (isFixedSample) {
      if (selectionFrameRef.current) {
        selectionFrameRef.current.style.left = '0%';
        selectionFrameRef.current.style.width = '100%';
      }
      if (highlightLayerRef.current) {
        highlightLayerRef.current.style.clipPath = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
      }
      return;
    }

    const clamped = Math.max(0, Math.min(targetSec, maxStart));
    const clampedEnd = Math.min(totalDuration, clamped + snippetDuration);
    const leftP = (clamped / totalDuration) * 100;
    const widthP = (snippetDuration / totalDuration) * 100;
    const rightP = leftP + widthP;

    if (selectionFrameRef.current) {
      selectionFrameRef.current.style.left = `${leftP}%`;
      selectionFrameRef.current.style.width = `${widthP}%`;
    }

    if (highlightLayerRef.current) {
      highlightLayerRef.current.style.clipPath = `polygon(${leftP}% 0%, ${rightP}% 0%, ${rightP}% 100%, ${leftP}% 100%)`;
    }

    if (timeStartRef.current) {
      timeStartRef.current.textContent = formatTime(clamped);
    }
    if (timeEndRef.current) {
      timeEndRef.current.textContent = formatTime(clampedEnd);
    }
  }, [isFixedSample, maxStart, totalDuration, snippetDuration, isCurrentSnippetPlaying]);

  // Sync visuals whenever startSec or snippetDuration changes externally
  useEffect(() => {
    if (!isDraggingRef.current) {
      currentStartSecRef.current = startSec;
      updateVisualPosition(startSec);
    }
  }, [startSec, snippetDuration, updateVisualPosition]);

  // Live Playhead Needle: strictly clamped INSIDE the selection frame
  useEffect(() => {
    if (!playheadNeedleRef.current || !progressFillRef.current) return;

    if (isCurrentSnippetPlaying && currentTime !== undefined && !isDraggingRef.current) {
      const activeDuration = isFixedSample ? 30 : snippetDuration;
      const progressSec = Math.max(0, Math.min(activeDuration, Number(currentTime) || 0));
      const progressPercent = (progressSec / activeDuration) * 100;

      playheadNeedleRef.current.style.display = 'block';
      playheadNeedleRef.current.style.left = `${progressPercent}%`;
      progressFillRef.current.style.width = `${progressPercent}%`;
    } else {
      playheadNeedleRef.current.style.display = 'none';
      progressFillRef.current.style.width = '0%';
    }
  }, [isCurrentSnippetPlaying, currentTime, snippetDuration, isFixedSample]);

  // Handle pointer down: differentiate between dragging existing frame vs clicking outside to set start
  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (!canScrub || totalDuration <= 0) return;

    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    if (clientX === undefined) return;

    if (!trackContainerRef.current) return;
    const trackRect = trackContainerRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(trackRect.width, clientX - trackRect.left));
    const clickRatio = clickX / trackRect.width;
    const clickSec = clickRatio * totalDuration;

    isDraggingRef.current = true;
    dragStartXRef.current = clientX;
    dragStartSecRef.current = currentStartSecRef.current;
    hasMovedRef.current = false;
    wasPlayingBeforeDragRef.current = isPlayingRef.current;

    // Check if user clicked inside the current selection window:
    const currentStart = currentStartSecRef.current;
    const currentEnd = currentStart + snippetDuration;
    const isInsideFrame = clickSec >= currentStart && clickSec <= currentEnd;

    if (isInsideFrame) {
      // User grabbed the selection frame: drag from current start position smoothly without jumping
      isDraggingFrameRef.current = true;
    } else {
      // User clicked outside the frame: jump the snippet start directly to the clicked point!
      isDraggingFrameRef.current = false;
      const targetSec = Math.max(0, Math.min(Math.round(clickSec), maxStart));
      currentStartSecRef.current = targetSec;
      dragStartSecRef.current = targetSec;
      updateVisualPosition(targetSec);
    }

    // Hide playhead needle while actively interacting
    if (playheadNeedleRef.current) {
      playheadNeedleRef.current.style.display = 'none';
    }
  };

  // Pointer move & release listeners: zero distortion, clean immediate playback from new frame position
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDraggingRef.current || !canScrub || totalDuration <= 0) return;
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      if (clientX === undefined) return;

      const deltaX = clientX - dragStartXRef.current;
      if (Math.abs(deltaX) > 3) {
        hasMovedRef.current = true;
      }

      if (!trackContainerRef.current) return;
      const trackRect = trackContainerRef.current.getBoundingClientRect();

      let targetSec;
      if (isDraggingFrameRef.current) {
        // Dragging the frame by mouse delta: smooth 1:1 tactile movement!
        const deltaSec = (deltaX / trackRect.width) * totalDuration;
        targetSec = Math.max(0, Math.min(Math.round(dragStartSecRef.current + deltaSec), maxStart));
      } else {
        // Dragging from a new click point:
        const currentX = Math.max(0, Math.min(trackRect.width, clientX - trackRect.left));
        const ratio = currentX / trackRect.width;
        targetSec = Math.max(0, Math.min(Math.round(ratio * totalDuration), maxStart));
      }

      currentStartSecRef.current = targetSec;

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        updateVisualPosition(targetSec);
      });
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        isDraggingFrameRef.current = false;

        const finalSec = currentStartSecRef.current;
        onSnippetStartChange(finalSec);

        // If audio was playing before drag or is currently playing, smoothly seek and play from the new position!
        const shouldPlay = wasPlayingBeforeDragRef.current || isPlayingRef.current;
        if (shouldPlay && selectedTrack) {
          playTrack({
            ...selectedTrack,
            id: 'studio-preview-id',
            audioSnippetStart: finalSec,
            snippetDuration,
            loop: true,
          }, {
            snippetStart: finalSec,
            snippetDuration,
            loop: true,
          });
        } else if (selectedTrack) {
          // If paused, update audio position without auto-starting
          if (currentTrack?.id === selectedTrack?.id || currentTrack?.id === 'studio-preview-id' || currentTrack?.externalSongUrl === selectedTrack?.externalSongUrl) {
            seekSnippet(finalSec, snippetDuration, false);
          } else {
            loadTrack({
              ...selectedTrack,
              id: 'studio-preview-id',
            }, {
              snippetStart: finalSec,
              snippetDuration,
              autoPlay: false,
            });
          }
        }
        wasPlayingBeforeDragRef.current = false;
      }
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [canScrub, totalDuration, maxStart, updateVisualPosition, onSnippetStartChange, playTrack, selectedTrack, snippetDuration, seekSnippet, loadTrack, currentTrack]);

  // Toggle Play / Pause cleanly
  const handleTogglePlay = () => {
    if (!selectedTrack) return;

    if (isCurrentSnippetPlaying) {
      togglePlay();
    } else {
      setLooping(true);
      playTrack({
        ...selectedTrack,
        id: 'studio-preview-id',
        audioSnippetStart: startSec,
        snippetDuration: isFixedSample ? 30 : snippetDuration,
        loop: true,
      }, {
        snippetStart: startSec,
        snippetDuration: isFixedSample ? 30 : snippetDuration,
        loop: true,
      });
    }
  };

  const initialLeftPct = isFixedSample ? 0 : (startSec / totalDuration) * 100;
  const initialWidthPct = isFixedSample ? 100 : (snippetDuration / totalDuration) * 100;
  const initialRightPct = initialLeftPct + initialWidthPct;

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className="space-y-3 bg-[#10141a]/95 border border-white/10 rounded-2xl p-4 select-none"
    >
      
      {/* 1. Header & Duration Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span>Audio Snippet</span>
        </label>

        {/* 30s vs 45s Duration Picker (Disabled for fixed 30s samples) */}
        {!isFixedSample ? (
          <div className="flex items-center gap-1 bg-[#0a0d12] p-0.5 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => handleDurationChange(30)}
              className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                snippetDuration === 30
                  ? 'bg-neutral-200 text-neutral-900 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              30s
            </button>
            <button
              type="button"
              onClick={() => handleDurationChange(45)}
              className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                snippetDuration === 45
                  ? 'bg-neutral-200 text-neutral-900 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              45s
            </button>
          </div>
        ) : (
          <span className="text-[10px] font-mono text-neutral-500">
            30s Audio Window
          </span>
        )}
      </div>

      {!selectedTrack ? (
        <div className="p-4 rounded-xl bg-[#0a0d12] border border-dashed border-white/10 text-center text-xs font-mono text-neutral-500">
          Please search or paste a link above to preview your snippet.
        </div>
      ) : (
        <div className="space-y-3">
          
          {/* 2. Minimalist Time Readout with Integrated Tactile Play Control */}
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                className={`flex items-center justify-center w-6 h-6 rounded-full transition-all shadow-sm cursor-pointer shrink-0 ${
                  isCurrentSnippetPlaying
                    ? 'bg-sky-400 text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.7)] scale-105'
                    : 'bg-[#102a3e] hover:bg-sky-500/20 text-sky-200 border border-sky-400/40 hover:text-white'
                }`}
                title={isCurrentSnippetPlaying ? "Pause snippet preview" : "Play snippet preview"}
              >
                {isCurrentSnippetPlaying ? (
                  <Pause className="w-2.5 h-2.5 fill-current" />
                ) : (
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                )}
              </button>
              <span className="text-neutral-400">
                Start: <strong ref={timeStartRef} className="text-white font-bold">{formatTime(startSec)}</strong>
              </span>
            </div>

            <span className="font-bold text-[11px] font-mono text-sky-300">
              {snippetDuration}s Snippet {effectiveTrackDuration ? `(Total ${formatTime(effectiveTrackDuration)})` : ''}
            </span>

            <span className="text-neutral-400">
              End: <strong ref={timeEndRef} className="text-white font-bold">{formatTime(endSec)}</strong>
            </span>
          </div>

          {/* 3. ARTISTIC SLENDER WAVESONG TRACK */}
          <div
            ref={trackContainerRef}
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            style={{ touchAction: 'none' }}
            className={`relative w-full h-20 bg-[#0a0d12] rounded-2xl overflow-hidden border border-white/10 px-3 flex items-center justify-between select-none shadow-inner group ${
              canScrub ? 'cursor-pointer' : 'cursor-default'
            }`}
            title={canScrub ? "Click or drag anywhere to select your audio snippet" : "Fixed 30s sample"}
          >
            {/* LAYER A: BASE MUTED ORGANIC WAVEFORM BARS */}
            <div className="absolute inset-0 px-3 flex items-center justify-between pointer-events-none">
              {waveformBars.map((height, idx) => (
                <div
                  key={`base-bar-${idx}`}
                  className="flex-1 flex items-center justify-center h-full"
                >
                  <div
                    style={{ height: `${height}px` }}
                    className="w-[2px] sm:w-[2.5px] rounded-full bg-[#1e2633]"
                  />
                </div>
              ))}
            </div>

            {/* LAYER B: HIGHLIGHTED VIBRANT BARS */}
            <div
              ref={highlightLayerRef}
              style={{
                clipPath: `polygon(${initialLeftPct}% 0%, ${initialRightPct}% 0%, ${initialRightPct}% 100%, ${initialLeftPct}% 100%)`,
              }}
              className="absolute inset-0 px-3 flex items-center justify-between pointer-events-none"
            >
              {waveformBars.map((height, idx) => (
                <div
                  key={`hi-bar-${idx}`}
                  className="flex-1 flex items-center justify-center h-full"
                >
                  <div
                    style={{ height: `${height}px` }}
                    className="w-[2px] sm:w-[2.5px] rounded-full bg-neutral-200"
                  />
                </div>
              ))}
            </div>

            {/* LAYER C: SELECTION FRAME WITH INTERNAL PLAYHEAD */}
            <div
              ref={selectionFrameRef}
              style={{
                left: `${initialLeftPct}%`,
                width: `${initialWidthPct}%`,
              }}
              className={`absolute top-1 bottom-1 rounded-xl pointer-events-none overflow-hidden flex items-center justify-between ${
                isFixedSample 
                  ? 'border border-amber-400/40 bg-amber-400/[0.04]' 
                  : 'border border-white/70 bg-white/[0.08] shadow-sm'
              }`}
            >
              {/* Internal Active Listening Progress Trail */}
              <div
                ref={progressFillRef}
                style={{ width: '0%' }}
                className="absolute top-0 bottom-0 left-0 bg-white/[0.12] pointer-events-none"
              />

              {/* Internal Real-Time Playhead Needle */}
              <div
                ref={playheadNeedleRef}
                style={{ display: 'none', left: '0%' }}
                className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none z-20"
              >
                <div className="w-2 h-2 rounded-full bg-white -ml-[3px] -mt-0.5" />
              </div>

              {/* Left & Right subtle trimmer handles */}
              {canScrub && (
                <>
                  <div className="w-[3px] h-4 rounded-full bg-white/80 ml-1 z-10" />
                  <div className="w-[3px] h-4 rounded-full bg-white/80 mr-1 z-10" />
                </>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
