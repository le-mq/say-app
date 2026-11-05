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
  const { isPlaying, currentTime, currentTrack, playTrack, pauseTrack, togglePlay, seekSnippet, setLooping, loadTrack } = usePlayerStore();

  const isCurrentSnippetPlaying = currentTrack?.id === selectedTrack?.id && isPlaying;
  const isPlayingRef = useRef(isCurrentSnippetPlaying);
  isPlayingRef.current = isCurrentSnippetPlaying;

  const isYouTube = selectedTrack?.platform === 'YOUTUBE' || Boolean(selectedTrack?.youtubeId) || Boolean(selectedTrack?.externalSongUrl?.includes('youtube') || selectedTrack?.externalSongUrl?.includes('youtu.be'));
  const isFixedSample = selectedTrack?.platform === 'ITUNES' || (!isYouTube && (selectedTrack?.duration || 0) <= 30);
  const canScrub = !isFixedSample;

  const totalDuration = isFixedSample ? 30 : Math.max(30, selectedTrack?.duration || (isYouTube ? 264 : 30));
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
    if (playButtonLabelRef.current) {
      playButtonLabelRef.current.textContent = `${isCurrentSnippetPlaying ? 'Pause' : 'Play'} (${formatTime(clamped)} - ${formatTime(clampedEnd)})`;
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

  // Compute target second from event coordinates
  const computeTargetSecFromEvent = useCallback((clientX) => {
    if (!canScrub || !trackContainerRef.current || totalDuration <= 0) return 0;
    const rect = trackContainerRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const ratio = clickX / rect.width;
    const centerSec = ratio * totalDuration;
    const target = Math.round(centerSec - snippetDuration / 2);
    return Math.max(0, Math.min(target, maxStart));
  }, [canScrub, totalDuration, snippetDuration, maxStart]);

  // Handle pointer down (Click or Drag initiation)
  const handlePointerDown = (e) => {
    if (!canScrub) return;

    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    if (clientX === undefined) return;

    isDraggingRef.current = true;
    dragStartXRef.current = clientX;
    hasMovedRef.current = false;
    wasPlayingBeforeDragRef.current = isPlayingRef.current;

    const targetSec = computeTargetSecFromEvent(clientX);
    currentStartSecRef.current = targetSec;
    updateVisualPosition(targetSec);

    // If currently playing, pause temporarily so old audio stops immediately
    if (isPlayingRef.current) {
      pauseTrack();
    }

    // Hide playhead needle while actively dragging
    if (playheadNeedleRef.current) {
      playheadNeedleRef.current.style.display = 'none';
    }
  };

  // Instant Click-to-Jump handler
  const handleClick = (e) => {
    if (!canScrub) return;
    const clientX = e.clientX;
    if (clientX === undefined) return;

    const targetSec = computeTargetSecFromEvent(clientX);
    currentStartSecRef.current = targetSec;
    updateVisualPosition(targetSec);
    onSnippetStartChange(targetSec);

    const shouldPlay = wasPlayingBeforeDragRef.current || isPlayingRef.current;
    if (shouldPlay && selectedTrack) {
      playTrack({
        ...selectedTrack,
        audioSnippetStart: targetSec,
        snippetDuration,
        loop: true,
      }, {
        snippetStart: targetSec,
        snippetDuration,
        loop: true,
      });
    } else if (selectedTrack) {
      if (currentTrack?.id === selectedTrack?.id) {
        seekSnippet(targetSec, snippetDuration, false);
      } else {
        loadTrack(selectedTrack, {
          snippetStart: targetSec,
          snippetDuration,
          autoPlay: false,
        });
      }
    }
    wasPlayingBeforeDragRef.current = false;
  };

  // Pointer move & release listeners: zero distortion, clean immediate playback from new frame position
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDraggingRef.current || !canScrub) return;
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      if (clientX === undefined) return;

      if (Math.abs(clientX - dragStartXRef.current) > 3) {
        hasMovedRef.current = true;
      }

      const targetSec = computeTargetSecFromEvent(clientX);
      currentStartSecRef.current = targetSec;

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        updateVisualPosition(targetSec);
      });
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;

        const finalSec = currentStartSecRef.current;
        onSnippetStartChange(finalSec);

        // If audio was playing before drag, immediately play from the new frame position!
        if (wasPlayingBeforeDragRef.current && selectedTrack) {
          playTrack({
            ...selectedTrack,
            audioSnippetStart: finalSec,
            snippetDuration,
            loop: true,
          }, {
            snippetStart: finalSec,
            snippetDuration,
            loop: true,
          });
        } else if (selectedTrack) {
          // If paused, prime audio engine at the new frame position without auto-playing
          if (currentTrack?.id === selectedTrack?.id) {
            seekSnippet(finalSec, snippetDuration, false);
          } else {
            loadTrack(selectedTrack, {
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
  }, [canScrub, computeTargetSecFromEvent, updateVisualPosition, onSnippetStartChange, playTrack, selectedTrack, snippetDuration, seekSnippet, loadTrack, currentTrack]);

  // Toggle Play / Pause cleanly
  const handleTogglePlay = () => {
    if (!selectedTrack) return;

    if (isCurrentSnippetPlaying) {
      togglePlay();
    } else {
      setLooping(true);
      playTrack({
        ...selectedTrack,
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
    <div className="space-y-3 bg-[#081724] border border-[#16354d] rounded-2xl p-4 select-none">
      
      {/* 1. Header & Duration Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#91B9C5] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>3. Audio Snippet</span>
        </label>

        {/* 30s vs 45s Duration Picker (Disabled for fixed 30s samples) */}
        {!isFixedSample ? (
          <div className="flex items-center gap-1 bg-[#06121d] p-0.5 rounded-xl border border-[#132c40]">
            <button
              type="button"
              onClick={() => onSnippetDurationChange(30)}
              className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                snippetDuration === 30
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-[#91B9C5]/70 hover:text-white'
              }`}
            >
              30s Snippet
            </button>
            <button
              type="button"
              onClick={() => onSnippetDurationChange(45)}
              className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                snippetDuration === 45
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-[#91B9C5]/70 hover:text-white'
              }`}
            >
              45s Snippet
            </button>
          </div>
        ) : (
          <span className="text-[10px] font-mono text-[#91B9C5]/70">
            30s Audio Window
          </span>
        )}
      </div>

      {!selectedTrack ? (
        <div className="p-4 rounded-xl bg-[#06121d] border border-dashed border-[#16354d] text-center text-xs font-mono text-[#91B9C5]/60">
          Please search or paste a link above to preview your snippet.
        </div>
      ) : (
        <div className="space-y-3">
          
          {/* 2. Instagram-Style Minimalist Time Readout */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#91B9C5]">
              Start: <strong ref={timeStartRef} className="text-white font-bold">{formatTime(startSec)}</strong>
            </span>
            <span className="font-bold text-[11px] font-mono text-cyan-400">
              {snippetDuration}s Audio Window
            </span>
            <span className="text-[#91B9C5]">
              End: <strong ref={timeEndRef} className="text-white font-bold">{formatTime(endSec)}</strong>
            </span>
          </div>

          {/* 3. ARTISTIC SLENDER WAVESONG TRACK */}
          <div
            ref={trackContainerRef}
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            onClick={handleClick}
            style={{ touchAction: 'none' }}
            className={`relative w-full h-22 bg-[#05111d] rounded-2xl overflow-hidden border border-[#14324a] px-3 flex items-center justify-between select-none shadow-inner group ${
              canScrub ? 'cursor-pointer' : 'cursor-default'
            }`}
            title={canScrub ? "Click or drag anywhere to select your 30s snippet" : "Fixed 30s sample"}
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
                    className="w-[2px] sm:w-[2.5px] rounded-full bg-[#15344e]"
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
                    className="w-[2px] sm:w-[2.5px] rounded-full bg-gradient-to-t from-cyan-400 to-[#91B9C5] shadow-[0_0_8px_rgba(34,211,238,0.5)]"
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
                  ? 'border border-amber-400/50 bg-amber-400/[0.04]' 
                  : 'border border-cyan-400/90 bg-cyan-400/[0.08] shadow-[0_0_15px_rgba(34,211,238,0.2)]'
              }`}
            >
              {/* Internal Active Listening Progress Trail */}
              <div
                ref={progressFillRef}
                style={{ width: '0%' }}
                className="absolute top-0 bottom-0 left-0 bg-cyan-400/[0.16] pointer-events-none"
              />

              {/* Internal Real-Time Playhead Needle (strictly clamped inside) */}
              <div
                ref={playheadNeedleRef}
                style={{ display: 'none', left: '0%' }}
                className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_#38bdf8] pointer-events-none z-20"
              >
                <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#38bdf8] -ml-[3px] -mt-0.5" />
              </div>

              {/* Left & Right subtle trimmer handles (Only visible if canScrub) */}
              {canScrub && (
                <>
                  <div className="w-[3px] h-5 rounded-full bg-cyan-300 shadow-[0_0_4px_#22d3ee] ml-1 z-10" />
                  <div className="w-[3px] h-5 rounded-full bg-cyan-300 shadow-[0_0_4px_#22d3ee] mr-1 z-10" />
                </>
              )}
            </div>

          </div>

          {/* Minimalist Play / Pause & Reset Controls */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-md cursor-pointer ${
                isCurrentSnippetPlaying
                  ? 'bg-cyan-400 text-[#07131e] ring-4 ring-cyan-400/30'
                  : 'bg-gradient-to-r from-cyan-500 to-[#195a89] hover:from-cyan-400 hover:to-[#206fa8] text-[#07131e]'
              }`}
            >
              {isCurrentSnippetPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span ref={playButtonLabelRef}>Pause ({formatTime(startSec)} - {formatTime(endSec)})</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  <span ref={playButtonLabelRef}>Play ({formatTime(startSec)} - {formatTime(endSec)})</span>
                </>
              )}
            </button>

            {canScrub && (
              <button
                type="button"
                onClick={() => {
                  onSnippetStartChange(0);
                  if (isCurrentSnippetPlaying) {
                    playTrack({
                      ...selectedTrack,
                      audioSnippetStart: 0,
                      snippetDuration,
                      loop: true,
                    }, {
                      snippetStart: 0,
                      snippetDuration,
                      loop: true,
                    });
                  } else {
                    seekSnippet(0, snippetDuration, false);
                  }
                }}
                className="flex items-center gap-1 text-[11px] font-mono text-[#91B9C5]/70 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset 00:00</span>
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
