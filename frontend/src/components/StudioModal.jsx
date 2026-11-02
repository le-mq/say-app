import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { musicService, formatTime, parseDurationToSeconds } from '../services/musicService';
import { noteService } from '../services/noteService';
import MusicCard from './MusicCard';
import {
  X, Search, Sparkles, Disc, Play, Pause,
  Layers, Volume2, Link as LinkIcon, Radio,
  Flame, Music, Check, RefreshCw, Sliders,
  Upload, Image as ImageIcon, Smile, FileUp, MoveHorizontal,
  Headphones, Heart, Coffee, CloudRain, Ban, Globe, Moon,
  Lightbulb, Info, ArrowLeftRight
} from 'lucide-react';



const EMOTIONS = [
  { id: 'Melancholic', label: '🌙 Melancholic' },
  { id: 'Nostalgic', label: '📼 Nostalgic' },
  { id: 'Peaceful', label: '🍃 Peaceful' },
  { id: 'Bittersweet', label: '✨ Bittersweet' },
  { id: 'Cosmic Bliss', label: '🪐 Cosmic Bliss' },
];

// Curated Gen-Z & Indie Audiophile Vibe Captions
const TRENDY_VIBES = [
  { tag: '🎧 2:15 AM Drive', text: 'pov: driving home at 2:15 AM with this on loop' },
  { tag: '🖤 Rent-Free', text: 'no thoughts, just this bassline living rent-free in my head forever' },
  { tag: '🌧️ Cold Rain', text: 'this song feels like cold rain against a dimly lit train window' },
  { tag: '⚡ Main Character', text: 'walking through the city like the final scene of an indie movie' },
  { tag: '🌌 Levitation', text: 'this bridge physically lifted my soul out of my body at 3 AM' },
  { tag: '🥀 Unspoken', text: 'if I ever sent you this track, you already know what it means' },
  { tag: '☕ Tape & Coffee', text: 'vintage tape hiss, warm matcha, and absolutely zero drama' },
  { tag: '📼 90s Memory', text: 'sounds like a bittersweet memory from a year I don’t remember' },
  { tag: '🪐 Zero Gravity', text: 'floating somewhere in orbit where no notifications can reach me' },
  { tag: '🕯️ Midnight Loop', text: 'playing this quietly until my thoughts finally stop racing' },
  { tag: '📻 Secret Soul', text: 'if you know this obscure track, we are already soulmates' },
  { tag: '🫧 Overthinking', text: 'staring at the ceiling letting this acoustic guitar heal me' },
];

// Formik Validation (Allowing flexible track durations up to 24 hours)
const NoteValidationSchema = Yup.object().shape({
  songTitle: Yup.string().required('Song title is required. Pick or search a track.'),
  artistName: Yup.string().required('Artist name is required.'),
  songImageUrl: Yup.string().required('Album artwork is required.'),
  audioSnippetStart: Yup.number().min(0).max(86400).required(),
  templateType: Yup.string().required(),
  emotionTag: Yup.string().required(),
});

// Slender Instagram/Spotify-style acoustic waveform matching user screenshot with rounded capsule bars
const INSTAGRAM_ACOUSTIC_BARS = [
  10, 14, 20, 28, 38, 26, 16, 22, 32, 42,
  34, 24, 16, 20, 28, 38, 46, 36, 26, 18,
  14, 22, 32, 44, 38, 28, 20, 26, 36, 48,
  40, 30, 20, 16, 24, 36, 44, 32, 22, 16,
  12, 18, 26, 36, 40, 30, 20, 14, 10, 8,
  12, 18
];

export default function StudioModal({ onNoteCreated }) {
  const { user, isStudioOpen, setStudioOpen } = useAuthStore();
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore();

  const [activeSearchTab, setActiveSearchTab] = useState('url'); // Default to 'url' to save tokens!
  const [query, setQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [resolvingUrl, setResolvingUrl] = useState(false);
  const [resolvedTrackInfo, setResolvedTrackInfo] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [snippetDuration, setSnippetDuration] = useState(30); // 30s or 45s

  // Real YouTube Audio Preview Engine State
  const [isPreviewAudioPlaying, setIsPreviewAudioPlaying] = useState(false);

  // Dynamic Audio Duration (Calculated dynamically from loaded track, default 210s)
  const [trackDurationSec, setTrackDurationSec] = useState(210);

  // Shared Community Hot Tracks Pool (0 token usage across 1000 users)
  const [sharedHotPool, setSharedHotPool] = useState([]);

  // Note Personalization: Clean drawer toggle (+GIF expands options)
  const [showGifDrawer, setShowGifDrawer] = useState(false);
  const [customStickerUrl, setCustomStickerUrl] = useState('');
  const [nativeEmojiInput, setNativeEmojiInput] = useState('');

  // Refs
  const loopWorkerRef = useRef(null);
  const playerIframeRef = useRef(null);
  const previewTimerRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const waveformRef = useRef(null);
  const highlightedWaveformRef = useRef(null);
  const selectionFrameRef = useRef(null);
  const timeDisplayRef = useRef(null);
  const topTimeDisplayRef = useRef(null);
  const isDraggingRange = useRef(false);
  const dragStartX = useRef(0);
  const dragStartSec = useRef(0);
  const fileInputRef = useRef(null);

  const formik = useFormik({
    initialValues: {
      songTitle: '',
      artistName: '',
      songImageUrl: '',
      externalSongUrl: '',
      audioSnippetStart: 0,
      templateType: 'CASSETTE',
      emotionTag: EMOTIONS[0].label,
      lyricSnippet: '',
      caption: '',
      sealBadge: 'Orbit',
      visibility: 'PUBLIC',
    },
    validationSchema: NoteValidationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const payload = {
          userId: user?.id || '00000000-0000-0000-0000-000000000001',
          songTitle: values.songTitle,
          artistName: values.artistName,
          songImageUrl: values.songImageUrl,
          externalSongUrl: values.externalSongUrl,
          audioSnippetStart: values.audioSnippetStart,
          templateType: values.templateType,
          emotionTag: values.emotionTag,
          lyricSnippet: values.lyricSnippet.trim(),
          caption: values.caption.trim(),
          stickerBadge: values.sealBadge,
          visibility: values.visibility,
        };

        const createdNote = await noteService.createNote(payload);
        toast.success(`Published "${values.songTitle}" note successfully.`);
        resetForm();
        setSearchResults([]);
        setQuery('');
        if (onNoteCreated) onNoteCreated(createdNote);
        setStudioOpen(false);
      } catch (err) {
        toast.error(err.message || 'Failed to publish note');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Fetch shared pool on mount or when studio opens
  useEffect(() => {
    let active = true;
    musicService.getSharedPool()
      .then(pool => {
        if (active && pool && Array.isArray(pool)) {
          setSharedHotPool(pool);
        }
      })
      .catch(err => console.warn('Could not fetch community music pool:', err));
    return () => {
      active = false;
    };
  }, [isStudioOpen]);

  // Clean up audio playback when studio closes
  useEffect(() => {
    if (!isStudioOpen) {
      setIsPreviewAudioPlaying(false);
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    }
  }, [isStudioOpen]);

  // Dynamic Real-time Duration Sync from YouTube IFrame Player API & window.YT
  useEffect(() => {
    let pingInterval = null;
    let attempts = 0;

    const pingIframeForDuration = () => {
      if (playerIframeRef.current?.contentWindow) {
        playerIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'listening', id: 1 }),
          '*'
        );
        playerIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'getDuration', args: [] }),
          '*'
        );
      }
      attempts++;
      if (attempts > 15) {
        clearInterval(pingInterval);
      }
    };

    pingInterval = setInterval(pingIframeForDuration, 600);

    const handlePlayerMessage = (e) => {
      try {
        const payload = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (!payload) return;

        let dur = null;
        if (typeof payload.info?.duration === 'number') {
          dur = payload.info.duration;
        } else if (typeof payload.info?.videoData?.duration === 'number') {
          dur = payload.info.videoData.duration;
        } else if (typeof payload.duration === 'number') {
          dur = payload.duration;
        } else if (typeof payload.data === 'number') {
          dur = payload.data;
        } else if (payload.event === 'onReady') {
          pingIframeForDuration();
        }

        if (dur && typeof dur === 'number' && dur > 0) {
          const exactSec = Math.round(dur);
          if (exactSec > 0 && exactSec !== trackDurationSec) {
            setTrackDurationSec(exactSec);
            clearInterval(pingInterval);
          }
        }
      } catch {}
    };

    window.addEventListener('message', handlePlayerMessage);
    return () => {
      clearInterval(pingInterval);
      window.removeEventListener('message', handlePlayerMessage);
    };
  }, [trackDurationSec, formik.values.externalSongUrl]);

  // Instant Zero-Token YouTube Link Detection Handler
  const handleUrlInputChange = async (val) => {
    setUrlInput(val);
    formik.setFieldValue('externalSongUrl', val);

    const ytId = musicService.extractYoutubeId(val);
    if (ytId) {
      setResolvingUrl(true);
      try {
        const resolved = await musicService.resolveYoutubeUrl(val);
        if (resolved) {
          formik.setFieldValue('songTitle', resolved.songTitle);
          formik.setFieldValue('artistName', resolved.artistName);
          formik.setFieldValue('songImageUrl', resolved.songImageUrl);
          formik.setFieldValue('externalSongUrl', resolved.externalSongUrl);
          setResolvedTrackInfo(resolved);
          if (resolved.duration) {
            const durSec = parseDurationToSeconds(resolved.duration);
            setTrackDurationSec(durSec);
          }
          toast.success(`✨ Detected: ${resolved.songTitle} - ${resolved.artistName}`);
        } else {
          toast.warn('Could not auto-fetch metadata. You can enter title & paste link.');
        }
      } catch (err) {
        console.warn('URL auto-resolve failed:', err);
      } finally {
        setResolvingUrl(false);
      }
    }
  };

  // Clear pasted track button handler
  const handleClearPastedTrack = () => {
    setUrlInput('');
    setResolvedTrackInfo(null);
    formik.setFieldValue('songTitle', '');
    formik.setFieldValue('artistName', '');
    formik.setFieldValue('songImageUrl', '');
    formik.setFieldValue('externalSongUrl', '');
    setIsPreviewAudioPlaying(false);
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    toast.info('Pasted track cleared. You can paste a new YouTube link!');
  };

  // Select track from Shared Hot Pool (0 Token Cost)
  const handleSelectHotTrack = (track) => {
    formik.setFieldValue('songTitle', track.songTitle);
    formik.setFieldValue('artistName', track.artistName);
    formik.setFieldValue('songImageUrl', track.songImageUrl);
    formik.setFieldValue('externalSongUrl', track.externalSongUrl);
    setUrlInput(track.externalSongUrl || '');
    setResolvedTrackInfo(track);
    const durSec = parseDurationToSeconds(track.duration || (track.durationMs ? track.durationMs / 1000 : 210));
    setTrackDurationSec(durSec);
    toast.success(`Picked: ${track.songTitle}`);
  };

  // Seek and play without re-mounting iframe (keeps background media session active in Chrome without triggering autoplay blocks)
  const seekAndPlay = (targetSec) => {
    if (playerIframeRef.current && playerIframeRef.current.contentWindow) {
      playerIframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'seekTo',
          args: [targetSec, true],
        }),
        '*'
      );
      playerIframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'playVideo',
          args: [],
        }),
        '*'
      );
    }
  };

  // Continuous loop snippet playback backed by Web Worker timer
  // Crucial fix: Standard iframe re-mounting in background tabs is BLOCKED by Chrome autoplay policy!
  // By sending postMessage 'seekTo' to the existing mounted iframe without unmounting,
  // audio loops continuously in the background even when Chrome is unfocused or user is working in Antigravity.
  useEffect(() => {
    if (!isPreviewAudioPlaying) {
      if (loopWorkerRef.current) {
        loopWorkerRef.current.postMessage({ type: 'STOP' });
        loopWorkerRef.current.terminate();
        loopWorkerRef.current = null;
      }
      return;
    }

    const workerScript = `
      let intervalId = null;
      let elapsed = 0;
      let duration = 30;

      self.onmessage = function(e) {
        const msg = e.data;
        if (!msg) return;
        if (msg.type === 'START') {
          duration = msg.duration || 30;
          elapsed = 0;
          if (intervalId) clearInterval(intervalId);
          intervalId = setInterval(() => {
            elapsed += 1;
            if (elapsed >= duration) {
              elapsed = 0;
              self.postMessage({ type: 'LOOP_TICK' });
            }
          }, 1000);
        } else if (msg.type === 'RESET') {
          elapsed = 0;
        } else if (msg.type === 'STOP') {
          if (intervalId) clearInterval(intervalId);
          intervalId = null;
          elapsed = 0;
        }
      };
    `;
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    loopWorkerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data && e.data.type === 'LOOP_TICK') {
        seekAndPlay(formik.values.audioSnippetStart);
      }
    };

    worker.postMessage({ type: 'START', duration: snippetDuration });

    return () => {
      worker.postMessage({ type: 'STOP' });
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      loopWorkerRef.current = null;
    };
  }, [isPreviewAudioPlaying, snippetDuration, formik.values.audioSnippetStart]);

  // Helper to update snippet start and seek audio if playing (continuous playback without auto-cut)
  const updateSnippetStart = (newSec) => {
    formik.setFieldValue('audioSnippetStart', newSec);
    if (isPreviewAudioPlaying) {
      seekAndPlay(newSec);
      loopWorkerRef.current?.postMessage({ type: 'RESET' });
    }
  };

  // Search tracks handler (Manual submit & cached API fetch)
  const executeSearch = async (searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) return;
    setSearching(true);
    try {
      const data = await musicService.searchTracks(searchTerm.trim());
      setSearchResults(data || []);
      // Auto-feed top results into shared hot pool
      if (data && data.length > 0) {
        setSharedHotPool(prev => {
          const newItems = data.filter(d => !prev.some(p => p.externalSongUrl === d.externalSongUrl));
          return [...newItems.slice(0, 2), ...prev].slice(0, 15);
        });
      }
    } catch {
      // Graceful fallback
    } finally {
      setSearching(false);
    }
  };

  const handleSearchMusic = (e) => {
    e.preventDefault();
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (query.trim().length >= 1) {
      executeSearch(query.trim());
    }
  };

  // Debounced query change handler: supports short titles like 'IF', 'XO', '7' from 2 chars
  const handleQueryChange = (val) => {
    setQuery(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (val.trim().length >= 2) {
      searchDebounceRef.current = setTimeout(() => {
        executeSearch(val.trim());
      }, 600);
    }
  };

  // Select track dynamically setting actual track duration
  const handleSelectTrack = (track) => {
    formik.setFieldValue('songTitle', track.songTitle);
    formik.setFieldValue('artistName', track.artistName);
    formik.setFieldValue('songImageUrl', track.songImageUrl);
    formik.setFieldValue('externalSongUrl', track.externalSongUrl);
    if (track.defaultLyric) {
      formik.setFieldValue('lyricSnippet', track.defaultLyric);
    }
    const durSec = parseDurationToSeconds(track.duration || (track.durationMs ? track.durationMs / 1000 : 210));
    setTrackDurationSec(durSec);
    setResolvedTrackInfo(track);
    setUrlInput(track.externalSongUrl || '');
    // If current snippet start exceeds safe end, jump to verse
    if (formik.values.audioSnippetStart > Math.max(0, durSec - snippetDuration)) {
      updateSnippetStart(Math.floor(durSec * 0.12));
    }
    setSearchResults([]);
  };

  // Local high-speed snippet state for instant 60fps/120fps Instagram-like dragging without lag
  const [scrubSnippetStart, setScrubSnippetStart] = useState(() => formik.values.audioSnippetStart || 0);

  // Synchronize when formik value updates externally (track selection, milestone clicks, duration toggle)
  useEffect(() => {
    if (!isDraggingRange.current) {
      setScrubSnippetStart(formik.values.audioSnippetStart);
      const leftP = (formik.values.audioSnippetStart / trackDurationSec) * 100;
      const rightP = (Math.min(trackDurationSec, formik.values.audioSnippetStart + snippetDuration) / trackDurationSec) * 100;
      if (selectionFrameRef.current) {
        selectionFrameRef.current.style.left = `${leftP}%`;
        selectionFrameRef.current.style.width = `${(snippetDuration / trackDurationSec) * 100}%`;
      }
      if (highlightedWaveformRef.current) {
        highlightedWaveformRef.current.style.clipPath = `polygon(${leftP}% 0%, ${rightP}% 0%, ${rightP}% 100%, ${leftP}% 100%)`;
      }
    }
  }, [formik.values.audioSnippetStart, snippetDuration, trackDurationSec]);

  const activeSnippetStart = isDraggingRange.current ? scrubSnippetStart : formik.values.audioSnippetStart;
  const activeSnippetEnd = Math.min(trackDurationSec, activeSnippetStart + snippetDuration);

  // Dynamic milestones (Chorus ~35%, Verse ~12% of actual track duration)
  const dynamicChorusTime = Math.floor(trackDurationSec * 0.35);
  const dynamicVerseTime = Math.floor(trackDurationSec * 0.12);

  const handleJumpToChorus = () => {
    const targetSec = Math.min(dynamicChorusTime, Math.max(0, trackDurationSec - snippetDuration));
    setScrubSnippetStart(targetSec);
    formik.setFieldValue('audioSnippetStart', targetSec);
    const leftP = (targetSec / trackDurationSec) * 100;
    const rightP = (Math.min(trackDurationSec, targetSec + snippetDuration) / trackDurationSec) * 100;
    if (selectionFrameRef.current) selectionFrameRef.current.style.left = `${leftP}%`;
    if (highlightedWaveformRef.current) highlightedWaveformRef.current.style.clipPath = `polygon(${leftP}% 0%, ${rightP}% 0%, ${rightP}% 100%, ${leftP}% 100%)`;
    if (isPreviewAudioPlaying) seekAndPlay(targetSec);
  };

  const handleJumpToVerse = () => {
    const targetSec = Math.min(dynamicVerseTime, Math.max(0, trackDurationSec - snippetDuration));
    setScrubSnippetStart(targetSec);
    formik.setFieldValue('audioSnippetStart', targetSec);
    const leftP = (targetSec / trackDurationSec) * 100;
    const rightP = (Math.min(trackDurationSec, targetSec + snippetDuration) / trackDurationSec) * 100;
    if (selectionFrameRef.current) selectionFrameRef.current.style.left = `${leftP}%`;
    if (highlightedWaveformRef.current) highlightedWaveformRef.current.style.clipPath = `polygon(${leftP}% 0%, ${rightP}% 0%, ${rightP}% 100%, ${leftP}% 100%)`;
    if (isPreviewAudioPlaying) seekAndPlay(targetSec);
  };

  // AI Smart Vibe Generator
  const handleGenerateAIVibe = () => {
    const randomVibe = TRENDY_VIBES[Math.floor(Math.random() * TRENDY_VIBES.length)].text;
    formik.setFieldValue('caption', randomVibe);
  };

  // Instant Audio Waveform Click-to-Jump Handler
  const handleWaveformClick = (e) => {
    if (!waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const centerSec = Math.round(ratio * trackDurationSec);
    const targetSec = Math.max(0, Math.min(trackDurationSec - snippetDuration, Math.round(centerSec - snippetDuration / 2)));
    setScrubSnippetStart(targetSec);
    formik.setFieldValue('audioSnippetStart', targetSec);
    const leftP = (targetSec / trackDurationSec) * 100;
    const rightP = (Math.min(trackDurationSec, targetSec + snippetDuration) / trackDurationSec) * 100;
    if (selectionFrameRef.current) selectionFrameRef.current.style.left = `${leftP}%`;
    if (highlightedWaveformRef.current) highlightedWaveformRef.current.style.clipPath = `polygon(${leftP}% 0%, ${rightP}% 0%, ${rightP}% 100%, ${leftP}% 100%)`;
    const startFormatted = formatTime(targetSec);
    const endFormatted = formatTime(Math.min(trackDurationSec, targetSec + snippetDuration));
    if (timeDisplayRef.current) timeDisplayRef.current.innerText = `${startFormatted} – ${endFormatted}`;
    if (topTimeDisplayRef.current) topTimeDisplayRef.current.innerText = `(${startFormatted} – ${endFormatted} / ${formatTime(trackDurationSec)})`;
    if (isPreviewAudioPlaying) seekAndPlay(targetSec);
  };

  // Pure 120 FPS Zero-Lag Direct DOM Scrubber Dragging with Hardware-Accelerated ClipPath
  const handleDragStart = (clientX) => {
    if (!waveformRef.current) return;
    isDraggingRange.current = true;
    document.body.style.userSelect = 'none';

    const rect = waveformRef.current.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const clickSec = Math.round(clickRatio * trackDurationSec);
    const currStart = scrubSnippetStart;
    const currEnd = currStart + snippetDuration;

    let initialStartSec = currStart;
    // If clicked outside current selection window, snap directly to center around click immediately
    if (clickSec < currStart || clickSec > currEnd) {
      initialStartSec = Math.max(0, Math.min(trackDurationSec - snippetDuration, Math.round(clickSec - snippetDuration / 2)));
      const leftP = (initialStartSec / trackDurationSec) * 100;
      const rightP = (Math.min(trackDurationSec, initialStartSec + snippetDuration) / trackDurationSec) * 100;
      if (selectionFrameRef.current) selectionFrameRef.current.style.left = `${leftP}%`;
      if (highlightedWaveformRef.current) highlightedWaveformRef.current.style.clipPath = `polygon(${leftP}% 0%, ${rightP}% 0%, ${rightP}% 100%, ${leftP}% 100%)`;
      const sFormatted = formatTime(initialStartSec);
      const eFormatted = formatTime(Math.min(trackDurationSec, initialStartSec + snippetDuration));
      if (timeDisplayRef.current) timeDisplayRef.current.innerText = `${sFormatted} – ${eFormatted}`;
      if (topTimeDisplayRef.current) topTimeDisplayRef.current.innerText = `(${sFormatted} – ${eFormatted} / ${formatTime(trackDurationSec)})`;
    }

    dragStartX.current = clientX;
    dragStartSec.current = initialStartSec;
    let lastSec = initialStartSec;

    const onMove = (currX) => {
      if (!isDraggingRange.current || !waveformRef.current) return;
      const deltaX = currX - dragStartX.current;
      const deltaSec = (deltaX / rect.width) * trackDurationSec;
      const newSec = Math.max(0, Math.min(trackDurationSec - snippetDuration, Math.round(dragStartSec.current + deltaSec)));

      lastSec = newSec;

      const leftPercent = (newSec / trackDurationSec) * 100;
      const rightPercent = (Math.min(trackDurationSec, newSec + snippetDuration) / trackDurationSec) * 100;

      // 100% In-Sync Direct Hardware ClipPath & Left Position (0ms lag!)
      if (selectionFrameRef.current) {
        selectionFrameRef.current.style.left = `${leftPercent}%`;
      }
      if (highlightedWaveformRef.current) {
        highlightedWaveformRef.current.style.clipPath = `polygon(${leftPercent}% 0%, ${rightPercent}% 0%, ${rightPercent}% 100%, ${leftPercent}% 100%)`;
      }
      const startFormatted = formatTime(newSec);
      const endFormatted = formatTime(Math.min(trackDurationSec, newSec + snippetDuration));
      if (timeDisplayRef.current) {
        timeDisplayRef.current.innerText = `${startFormatted} – ${endFormatted}`;
      }
      if (topTimeDisplayRef.current) {
        topTimeDisplayRef.current.innerText = `(${startFormatted} – ${endFormatted} / ${formatTime(trackDurationSec)})`;
      }
    };

    const onMouseMove = (e) => onMove(e.clientX);
    const onTouchMove = (e) => {
      if (e.touches && e.touches[0]) onMove(e.touches[0].clientX);
    };

    const onDragEnd = () => {
      isDraggingRange.current = false;
      document.body.style.userSelect = '';

      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onDragEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onDragEnd);

      // Commit state once user releases slider
      setScrubSnippetStart(lastSec);
      formik.setFieldValue('audioSnippetStart', lastSec);
      if (isPreviewAudioPlaying) {
        seekAndPlay(lastSec);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onDragEnd);
  };

  const handleDragBoxMouseDown = (e) => {
    e.stopPropagation();
    handleDragStart(e.clientX);
  };

  const handleDragBoxTouchStart = (e) => {
    e.stopPropagation();
    if (e.touches && e.touches[0]) {
      handleDragStart(e.touches[0].clientX);
    }
  };

  // Local File Upload Handler with instant client-side canvas compression (~15KB)
  const handleLocalFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.warning('Please select an image or GIF under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const rawDataUrl = uploadEvent.target?.result;
      if (!rawDataUrl) return;

      // If animated GIF, keep original dataUrl so animation frames are preserved
      if (file.type === 'image/gif') {
        formik.setFieldValue('sealBadge', rawDataUrl);
        toast.success(`Attached "${file.name}" to note.`);
        return;
      }

      // For standard images (JPEG, PNG, WebP), compress to max 240x240px offscreen canvas (~12-20KB)
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 240;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const compressedDataUrl = canvas.toDataURL('image/webp', 0.88);
        formik.setFieldValue('sealBadge', compressedDataUrl);
        toast.success(`Attached "${file.name}" to note.`);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Construct Live Preview Note Object
  const endSeconds = formik.values.audioSnippetStart + snippetDuration;

  const previewNote = {
    id: 'studio-preview-id',
    userDisplayName: user?.displayName || user?.name || (user?.email ? user.email.split('@')[0] : 'You'),
    handle: user?.handle || (user?.email ? `@${user.email.split('@')[0]}` : '@you'),
    timeAgo: 'Just now',
    songTitle: formik.values.songTitle || 'SELECT OR PASTE A TRACK',
    artistName: formik.values.artistName || 'Awaiting Music Link',
    songImageUrl: formik.values.songImageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
    audioSnippetStart: formatTime(activeSnippetStart),
    audioSnippetEnd: formatTime(activeSnippetEnd),
    templateType: formik.values.templateType,
    emotionTag: formik.values.emotionTag,
    lyricSnippet: formik.values.lyricSnippet || (formik.values.songTitle ? '' : 'Paste any video or music link to preview...'),
    caption: formik.values.caption,
    stickerBadge: formik.values.sealBadge,
    visibility: formik.values.visibility,
    likesCount: 0,
    orderNumber: user
      ? `ORD #${user.memberId ? user.memberId.replace('#', '') : (user.id ? user.id.replace(/-/g, '').slice(-4).toUpperCase() : '0101')} FOR ${(user.displayName || user.email?.split('@')[0] || 'ARCHIVER').toUpperCase()}`
      : 'ORD #0101 FOR GUEST ARCHIVER',
    dialogues: [],
  };

  const ytVideoId = musicService.extractYoutubeId(formik.values.externalSongUrl);

  const handleTogglePreviewAudio = () => {
    if (isPreviewAudioPlaying) {
      setIsPreviewAudioPlaying(false);
      if (playerIframeRef.current?.contentWindow) {
        playerIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
          '*'
        );
      }
    } else {
      if (!ytVideoId && !formik.values.externalSongUrl) {
        toast.info('Please paste a link or select a track to preview snippet!');
        return;
      }
      setIsPreviewAudioPlaying(true);
      setTimeout(() => {
        seekAndPlay(formik.values.audioSnippetStart);
      }, 50);
    }
  };

  if (!isStudioOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#040c14]/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200">

      {/* Main Atelier Container */}
      <div className="bg-[#091826] border border-[#16354d] rounded-[24px] max-w-6xl w-full h-[92vh] max-h-[880px] flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden">

        {/* ======================================================== */}
        {/* TOP HEADER: MINIMAL & ELEGANT (Matching Image 1)         */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#142c40] bg-[#07131e] shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStudioOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-[#12283a] text-[#91B9C5] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#E8EEF0] tracking-tight">
              Write your note
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setStudioOpen(false)}
              className="px-3.5 py-1.5 rounded-xl border border-[#1d4363] bg-[#0c1f2e] hover:bg-[#132c40] text-xs font-grotesk text-[#91B9C5] hover:text-white transition-all cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={formik.handleSubmit}
              disabled={formik.isSubmitting}
              className="px-5 py-1.5 rounded-xl bg-[#91B9C5] hover:bg-white text-[#07131e] font-grotesk font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>{formik.isSubmitting ? "Publishing..." : "Publish Note"}</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2-COLUMN MAIN BODY                                       */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* ------------------------------------------------------ */}
          {/* LEFT COLUMN: FORM CONTROLS (Scrollable)                */}
          {/* ------------------------------------------------------ */}
          <div className="w-full lg:w-[58%] overflow-y-auto p-5 space-y-4 pr-3 custom-scrollbar" style={{ willChange: 'transform', overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>

            {/* TEMPLATE PICKER: Rich Tactile Mini-Preview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-[#06111a] rounded-2xl border border-[#142c40]">
              {[
                {
                  id: 'RECEIPTIFY',
                  name: 'Receipt',
                  desc: 'Thermal paper',
                  renderIcon: () => (
                    <div className="w-7 h-8 bg-[#EAE3D2] rounded-xs border-t-2 border-b-2 border-dashed border-[#a89e8c] p-1 flex flex-col justify-between shadow-xs">
                      <div className="w-full h-0.5 bg-neutral-800" />
                      <div className="flex justify-center gap-0.5">
                        <div className="w-0.5 h-2.5 bg-neutral-900" />
                        <div className="w-1 h-2.5 bg-neutral-900" />
                        <div className="w-0.5 h-2.5 bg-neutral-900" />
                        <div className="w-1 h-2.5 bg-neutral-900" />
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'CASSETTE',
                  name: 'Cassette',
                  desc: 'Y2K Tape',
                  renderIcon: () => (
                    <div className="w-9 h-7 bg-[#0c1a24] rounded-sm border border-amber-500/70 p-0.5 flex flex-col justify-between shadow-xs">
                      <div className="w-full h-1 bg-amber-400 rounded-xs" />
                      <div className="flex justify-around items-center px-0.5 my-auto">
                        <div className="w-2 h-2 rounded-full border border-cyan-400 bg-neutral-900 flex items-center justify-center">
                          <div className="w-0.5 h-0.5 rounded-full bg-cyan-300" />
                        </div>
                        <div className="w-2.5 h-1 bg-neutral-800 rounded-xs" />
                        <div className="w-2 h-2 rounded-full border border-cyan-400 bg-neutral-900 flex items-center justify-center">
                          <div className="w-0.5 h-0.5 rounded-full bg-cyan-300" />
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'STAMP',
                  name: 'Airmail',
                  desc: 'Postal stamp',
                  renderIcon: () => (
                    <div className="w-7 h-8 bg-[#EFECE6] border-2 border-dashed border-[#91B9C5] rounded-xs p-1 flex flex-col justify-between shadow-xs">
                      <div className="w-3.5 h-3.5 rounded-full border border-rose-500/80 mx-auto flex items-center justify-center">
                        <span className="text-[5px] text-rose-600 font-bold font-mono">AIR</span>
                      </div>
                      <div className="w-full h-0.5 bg-neutral-400 rounded-full" />
                    </div>
                  ),
                },
                {
                  id: 'VINYL',
                  name: 'Vinyl',
                  desc: '33 RPM Disc',
                  renderIcon: (isSelected) => (
                    <div className={`w-8 h-8 rounded-full bg-[#080d12] border border-cyan-400/80 flex items-center justify-center shadow-xs ${isSelected ? 'animate-spin-slow' : ''}`}>
                      <div className="w-5 h-5 rounded-full border border-neutral-700 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#E8EEF0] border border-black flex items-center justify-center">
                          <div className="w-0.5 h-0.5 rounded-full bg-black" />
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'GALAXY',
                  name: 'Galaxy',
                  desc: 'Orbit ring',
                  renderIcon: () => (
                    <div className="w-8 h-8 rounded-full bg-[#090b1c] border border-indigo-400/80 relative flex items-center justify-center shadow-xs overflow-hidden">
                      <div className="absolute w-9 h-3.5 rounded-full border border-cyan-400/90 -rotate-25" />
                      <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
                    </div>
                  ),
                },
              ].map((tmpl) => {
                const isSelected = formik.values.templateType === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => formik.setFieldValue('templateType', tmpl.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${isSelected
                        ? 'bg-[#142e44] border-[#91B9C5] shadow-[0_0_12px_rgba(145,185,197,0.25)] ring-1 ring-[#91B9C5]/50 scale-[1.02]'
                        : 'bg-[#081724] border-[#16354d] hover:bg-[#0e2336] hover:border-[#1d4363] text-[#91B9C5]/70 hover:text-white'
                      }`}
                  >
                    <div className="h-8 flex items-center justify-center">
                      {tmpl.renderIcon(isSelected)}
                    </div>
                    <div className="text-center leading-tight">
                      <p className={`text-[11px] font-mono font-bold ${isSelected ? 'text-white' : 'text-[#E8EEF0]'}`}>
                        {tmpl.name}
                      </p>
                      <p className="text-[8.5px] font-mono text-[#91B9C5]/60 hidden sm:block">
                        {tmpl.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 1. TRACK SELECTOR (Paste Link Primary + Community Hot Pool to Save Quota) */}
            <div className="bg-[#0c1f2e] border border-[#16354d] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#91B9C5]">
                  Track
                </span>
                {/* Search Mode Tabs: "Paste Link" FIRST (Default), "Search" SECOND */}
                <div className="flex items-center gap-1 bg-[#07131e] p-0.5 rounded-lg border border-[#16354d]">
                  <button
                    type="button"
                    onClick={() => setActiveSearchTab('url')}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1 ${activeSearchTab === 'url'
                        ? 'bg-[#183952] text-white font-bold'
                        : 'text-[#91B9C5]/70 hover:text-white'
                      }`}
                  >
                    <LinkIcon className="w-3 h-3 text-cyan-400" />
                    <span>Paste Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSearchTab('search')}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1 ${activeSearchTab === 'search'
                        ? 'bg-[#183952] text-white font-bold'
                        : 'text-[#91B9C5]/70 hover:text-white'
                      }`}
                  >
                    <Search className="w-3 h-3 text-[#91B9C5]" />
                    <span>Search Music</span>
                  </button>
                </div>
              </div>

              {activeSearchTab === 'url' ? (
                <div className="space-y-2.5">
                  <div className="relative">
                    <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#91B9C5]/50" />
                    <input
                      type="text"
                      placeholder="Paste any YouTube, YouTube Music or track link..."
                      value={urlInput}
                      onChange={(e) => handleUrlInputChange(e.target.value)}
                      className="w-full bg-[#081724] border border-[#1d4363] rounded-xl pl-9 pr-16 py-2 text-xs text-[#E8EEF0] focus:outline-none focus:border-[#91B9C5] font-mono placeholder:text-[#91B9C5]/40 select-text"
                    />
                    <div className="absolute right-2 top-1.5 flex items-center gap-1">
                      {resolvingUrl && (
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin mr-1" />
                      )}
                      {urlInput && (
                        <button
                          type="button"
                          onClick={handleClearPastedTrack}
                          className="px-1.5 py-0.5 rounded bg-[#16354d] hover:bg-rose-950/80 text-[#91B9C5] hover:text-rose-300 text-[10px] font-mono cursor-pointer transition-colors"
                          title="Clear link"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Auto-Resolved YouTube Track Confirmation Card: Prioritizing Song Title + Tools to Swap/Clean */}
                  {resolvedTrackInfo && (
                    <div className="p-3.5 rounded-xl bg-[#081724] border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1 w-full">
                        <img
                          src={formik.values.songImageUrl || resolvedTrackInfo.songImageUrl}
                          alt="Cover"
                          className="w-13 h-13 rounded-xl object-cover border border-cyan-400/40 shadow-sm shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 
                            className="text-sm font-bold text-white font-sans truncate tracking-tight"
                            title={formik.values.artistName ? `${formik.values.songTitle} – ${formik.values.artistName}` : formik.values.songTitle}
                          >
                            <span>{formik.values.songTitle || 'Selected Audio Track'}</span>
                            {formik.values.artistName && (
                              <span className="text-[#91B9C5] font-normal font-grotesk ml-2 opacity-85">
                                – {formik.values.artistName}
                              </span>
                            )}
                          </h4>
                          <p className="text-[10px] font-mono text-[#91B9C5]/60 truncate mt-1 flex items-center gap-2">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            <span>YouTube Audio</span>
                            <span>•</span>
                            <span>{formatTime(trackDurationSec)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Minimal Clear Button */}
                      <button
                        type="button"
                        onClick={handleClearPastedTrack}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-[10px] font-mono text-rose-300 flex items-center gap-1 cursor-pointer transition-colors shadow-xs shrink-0 self-end sm:self-center"
                        title="Clear track"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    </div>
                  )}

                  {/* Shared Community Hot Tracks Pool */}
                  {sharedHotPool.length > 0 && (
                    <div className="pt-2 border-t border-[#16354d]/50 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#91B9C5] font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>Trending Tracks</span>
                        </span>
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          Community
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5 custom-scrollbar">
                        {sharedHotPool.map((t) => {
                          const isChosen = formik.values.externalSongUrl === t.externalSongUrl;
                          return (
                            <div
                              key={t.id || t.externalSongUrl}
                              onClick={() => handleSelectHotTrack(t)}
                              className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${isChosen
                                  ? 'bg-[#183952] border-cyan-400 shadow-sm'
                                  : 'bg-[#081724] border-[#16354d] hover:bg-[#10273a] hover:border-[#91B9C5]/50'
                                }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <img src={t.songImageUrl} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                                <div className="truncate min-w-0">
                                  <p className={`text-[11px] font-bold truncate ${isChosen ? 'text-white' : 'text-[#E8EEF0]'}`}>
                                    {t.songTitle}
                                  </p>
                                  <p className="text-[9.5px] text-[#91B9C5]/70 truncate">{t.artistName}</p>
                                </div>
                              </div>
                              <span className="text-[9.5px] font-mono text-[#91B9C5] px-1.5 py-0.5 rounded bg-[#0d2233] shrink-0 ml-1">
                                Pick
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-[#91B9C5]/80 font-mono flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Paste any video or music link to instantly load title, artwork & audio snippet.</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <form onSubmit={handleSearchMusic} className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#91B9C5]/50" />
                    <input
                      type="text"
                      placeholder="Search title, artist or album (e.g. IF, Coldplay, B Ray)..."
                      value={query}
                      onChange={(e) => handleQueryChange(e.target.value)}
                      className="w-full bg-[#081724] border border-[#1d4363] rounded-xl pl-9 pr-20 py-2 text-xs text-[#E8EEF0] focus:outline-none focus:border-[#91B9C5] font-sans placeholder:text-[#91B9C5]/40"
                    />
                    <button
                      type="submit"
                      disabled={searching || !query.trim()}
                      className="absolute right-1.5 top-1 px-3 py-1 bg-[#183952] hover:bg-[#235073] text-[#91B9C5] hover:text-white text-[10px] font-mono font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {searching ? "Finding..." : "Search"}
                    </button>
                  </form>

                  {/* Dropdown Results */}
                  {searchResults.length > 0 && (
                    <div className="bg-[#07131e] border border-[#1d4363] rounded-xl p-2 space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
                      <p className="text-[9.5px] font-mono text-[#91B9C5]/60 px-1 mb-1">
                        Found {searchResults.length} tracks:
                      </p>
                      {searchResults.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => handleSelectTrack(t)}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-[#12283a] cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img src={t.songImageUrl} alt="" className="w-7 h-7 rounded object-cover" />
                            <div className="truncate">
                              <p className="text-xs font-bold text-[#E8EEF0] truncate">{t.songTitle}</p>
                              <p className="text-[10px] text-[#91B9C5] truncate">{t.artistName}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-[#91B9C5] px-2 py-0.5 rounded bg-[#183952]">Select</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searching && (
                    <div className="p-3 text-center text-xs text-[#91B9C5] font-mono flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      <span>Finding tracks across music libraries...</span>
                    </div>
                  )}

                  <p className="text-[10px] text-[#91B9C5]/60 font-mono flex items-center gap-1">
                    <span>✨</span>
                    <span>Press Enter or click Search to find tracks. You can also paste direct links above.</span>
                  </p>
                </div>
              )}
            </div>

            {/* 2. AUDIO SNIPPET & TIMELINE (Scales dynamically with actual track duration) */}
            <div className="bg-[#0c1f2e] border border-[#16354d] rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#91B9C5]">
                    Audio snippet
                  </span>
                  <span ref={topTimeDisplayRef} className="text-[10px] font-mono text-[#91B9C5]/80">
                    ({formatTime(activeSnippetStart)} – {formatTime(activeSnippetEnd)} / {formatTime(trackDurationSec)})
                  </span>
                </div>

                {/* 30s / 45s Duration Toggle */}
                <div className="flex items-center gap-1 bg-[#07131e] p-0.5 rounded-lg border border-[#16354d]">
                  <button
                    type="button"
                    onClick={() => setSnippetDuration(30)}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${snippetDuration === 30
                        ? 'bg-[#183952] text-white border border-[#91B9C5]/40'
                        : 'text-[#91B9C5]/70 hover:text-white'
                      }`}
                  >
                    30s
                  </button>
                  <button
                    type="button"
                    onClick={() => setSnippetDuration(45)}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${snippetDuration === 45
                        ? 'bg-[#183952] text-white border border-[#91B9C5]/40'
                        : 'text-[#91B9C5]/70 hover:text-white'
                      }`}
                  >
                    45s
                  </button>
                </div>
              </div>

              {/* Artistic Soundwave Waveform (Slender Spotify Acoustic Code Pattern) */}
              <div className="bg-[#07131e] rounded-2xl border border-[#16354d] p-3 flex flex-col gap-2.5 shadow-inner">

                {/* Waveform Scrubber with Aligned Outline Play Button */}
                <div className="flex items-center gap-2.5 w-full">
                  {/* Clean SVG Play/Pause Button matching Spotify acoustic code */}
                  <button
                    type="button"
                    onClick={handleTogglePreviewAudio}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm group ${isPreviewAudioPlaying
                        ? 'bg-[#183952] border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-[#0c1f2e] hover:bg-[#163852] border-[#1d4363] text-[#91B9C5] hover:text-white'
                      }`}
                    title={isPreviewAudioPlaying ? "Pause snippet" : "Play snippet"}
                  >
                    {isPreviewAudioPlaying ? (
                      <Pause className="w-4 h-4 fill-current text-cyan-300" />
                    ) : (
                      <svg
                        className="w-4 h-4 text-[#91B9C5] group-hover:text-white transition-colors fill-none stroke-current ml-0.5"
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="6 3 20 12 6 21 6 3" />
                      </svg>
                    )}
                  </button>

                  {/* Discrete Rounded Slender Audio Bars Scrubber matching Screenshot */}
                  <div
                    ref={waveformRef}
                    onClick={handleWaveformClick}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleDragStart(e.clientX);
                    }}
                    onTouchStart={(e) => {
                      if (e.touches && e.touches[0]) {
                        handleDragStart(e.touches[0].clientX);
                      }
                    }}
                    className="relative flex-1 h-16 px-3 py-2 rounded-xl bg-[#050e17] border border-[#11283d] overflow-hidden select-none cursor-ew-resize flex items-center shadow-inner"
                    style={{ touchAction: 'none' }}
                  >
                    {/* 1. Base Dimmed Audio Bars (2 bên tự động mờ đi) */}
                    <svg
                      viewBox="0 0 400 48"
                      preserveAspectRatio="none"
                      className="w-full h-full pointer-events-none"
                    >
                      {/* Center subtle guide line */}
                      <line x1="0" y1="24" x2="400" y2="24" stroke="#16334a" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.25" />

                      {/* Dimmed Background Bars */}
                      {INSTAGRAM_ACOUSTIC_BARS.map((height, i) => {
                        const x = 4 + (i / INSTAGRAM_ACOUSTIC_BARS.length) * 392;
                        const barW = 3.6;
                        const barH = (height / 48) * 40;
                        const barY = 24 - (barH / 2);
                        return (
                          <rect
                            key={i}
                            x={x}
                            y={barY}
                            width={barW}
                            height={barH}
                            rx="1.8"
                            fill="#16344d"
                            opacity="0.4"
                          />
                        );
                      })}
                    </svg>

                    {/* 2. Highlighted Crisp Audio Bars (Khung viền kéo tới đâu thì khúc đó sóng rõ) */}
                    <svg
                      ref={highlightedWaveformRef}
                      viewBox="0 0 400 48"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full pointer-events-none transition-none"
                      style={{
                        clipPath: `polygon(${(activeSnippetStart / trackDurationSec) * 100}% 0%, ${(activeSnippetEnd / trackDurationSec) * 100}% 0%, ${(activeSnippetEnd / trackDurationSec) * 100}% 100%, ${(activeSnippetStart / trackDurationSec) * 100}% 100%)`,
                      }}
                    >
                      {INSTAGRAM_ACOUSTIC_BARS.map((height, i) => {
                        const x = 4 + (i / INSTAGRAM_ACOUSTIC_BARS.length) * 392;
                        const barW = 3.6;
                        const barH = (height / 48) * 40;
                        const barY = 24 - (barH / 2);
                        return (
                          <rect
                            key={i}
                            x={x}
                            y={barY}
                            width={barW}
                            height={barH}
                            rx="1.8"
                            fill="#91B9C5"
                            style={{ filter: 'drop-shadow(0 0 3px rgba(145, 185, 197, 0.75))' }}
                          />
                        );
                      })}
                    </svg>

                    {/* 3. Synchronized Zero-Lag Selection Frame (Instagram/Spotify capsule border with handles) */}
                    <div
                      ref={selectionFrameRef}
                      className="absolute inset-y-1.5 pointer-events-none z-10 transition-none"
                      style={{
                        left: `${(activeSnippetStart / trackDurationSec) * 100}%`,
                        width: `${(snippetDuration / trackDurationSec) * 100}%`,
                        borderLeft: '2.5px solid #91B9C5',
                        borderRight: '2.5px solid #91B9C5',
                        borderTop: '1px solid rgba(145, 185, 197, 0.35)',
                        borderBottom: '1px solid rgba(145, 185, 197, 0.35)',
                        background: 'rgba(145, 185, 197, 0.1)',
                      }}
                    >
                      {/* Left Handle Pill Grip */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-7 bg-[#91B9C5] rounded-full shadow-[0_0_8px_rgba(145,185,197,0.85)] flex items-center justify-center">
                        <div className="w-0.5 h-3 bg-[#07131e]/80 rounded-full" />
                      </div>
                      {/* Right Handle Pill Grip */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-7 bg-[#91B9C5] rounded-full shadow-[0_0_8px_rgba(145,185,197,0.85)] flex items-center justify-center">
                        <div className="w-0.5 h-3 bg-[#07131e]/80 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Timestamps matching User request: (1:49 – 2:19 / 3:30) */}
                <div className="flex items-center justify-between text-xs font-mono select-none px-1">
                  <div className="flex items-center gap-1.5">
                    <span ref={timeDisplayRef} className="font-bold text-white text-xs">
                      {formatTime(activeSnippetStart)} – {formatTime(activeSnippetEnd)}
                    </span>
                    <span className="text-[#91B9C5]/60 text-[11px] font-mono">
                      / {formatTime(trackDurationSec)}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#0d2233] border border-[#16354d] text-[10.5px] font-bold text-[#91B9C5] font-mono">
                    {snippetDuration}s snippet
                  </span>
                </div>

                {/* Quick Jumps (Dynamic chorus and verse) */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleJumpToChorus}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-grotesk font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${formik.values.audioSnippetStart === dynamicChorusTime
                        ? 'bg-[#183952] border-[#91B9C5] text-white'
                        : 'bg-[#081724] border-[#183a54] text-[#91B9C5] hover:bg-[#10273a] hover:text-white'
                      }`}
                  >
                    <span>🌟 Chorus</span>
                    <span className="text-[10px] font-mono text-[#91B9C5]/60">({formatTime(dynamicChorusTime)})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleJumpToVerse}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-grotesk font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${formik.values.audioSnippetStart === dynamicVerseTime
                        ? 'bg-[#183952] border-[#91B9C5] text-white'
                        : 'bg-[#081724] border-[#183a54] text-[#91B9C5] hover:bg-[#10273a] hover:text-white'
                      }`}
                  >
                    <span>🌙 Verse</span>
                    <span className="text-[10px] font-mono text-[#91B9C5]/60">({formatTime(dynamicVerseTime)})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. CAPTION & THOUGHTS */}
            <div className="bg-[#0c1f2e] border border-[#16354d] rounded-2xl p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#91B9C5]">
                  Note
                </span>
                <button
                  type="button"
                  onClick={handleGenerateAIVibe}
                  className="px-2 py-0.5 rounded-lg bg-[#183952] border border-[#1d4363] text-[10px] font-mono font-bold text-[#91B9C5] hover:text-white transition-all cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-[#91B9C5]" />
                  <span>Smart Vibe</span>
                </button>
              </div>

              <textarea
                rows={2}
                value={formik.values.caption}
                onChange={(e) => formik.setFieldValue('caption', e.target.value)}
                placeholder="What's on your mind?..."
                className="w-full bg-[#081724] border border-[#1d4363] rounded-xl px-3 py-2 text-xs text-[#E8EEF0] focus:outline-none focus:border-[#91B9C5] font-sans placeholder:text-[#91B9C5]/40 select-text"
              />

              {/* Vibe suggestion chips */}
              <div className="flex flex-wrap gap-1.5">
                {TRENDY_VIBES.slice(0, 4).map((vibe, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => formik.setFieldValue('caption', vibe.text)}
                    className="px-2 py-0.5 rounded-lg bg-[#081724] hover:bg-[#132c40] border border-[#193a54] text-[9.5px] font-mono text-[#91B9C5] hover:text-white transition-colors cursor-pointer"
                  >
                    {vibe.tag}
                  </button>
                ))}
              </div>

              {/* Lyric Snippet Box */}
              <div className="pt-2 border-t border-[#16354d]/60">
                <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#91B9C5] mb-1.5">
                  Lyric quote (optional)
                </span>
                <textarea
                  rows={2}
                  value={formik.values.lyricSnippet}
                  onChange={(e) => formik.setFieldValue('lyricSnippet', e.target.value)}
                  placeholder="Tape hiss intertwining with bedroom ceiling shadows..."
                  className="w-full bg-[#081724] border border-[#1d4363] rounded-xl px-3 py-2 text-xs italic text-[#E8EEF0] focus:outline-none focus:border-[#91B9C5] font-serif placeholder:text-[#91B9C5]/40 select-text"
                />
              </div>
            </div>

            {/* 4. NOTE PERSONALIZATION (Mood Tag & Seal Badge) */}
            <div className="bg-[#0c1f2e] border border-[#16354d] rounded-2xl p-4 shadow-sm space-y-3.5">

              {/* 4A. MOOD / EMOTION TAG */}
              <div className="space-y-2 pb-3 border-b border-[#16354d]/60">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#91B9C5]">
                    Mood Tag
                  </span>
                  <span className="text-[10px] font-mono text-[#91B9C5]/70">
                    Active: <strong className="text-white">{formik.values.emotionTag || 'None'}</strong>
                  </span>
                </div>

                {/* Mood Tag Quick Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {EMOTIONS.map((emotion) => {
                    const isSelected = formik.values.emotionTag === emotion.label;
                    return (
                      <button
                        key={emotion.id}
                        type="button"
                        onClick={() => formik.setFieldValue('emotionTag', emotion.label)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-grotesk font-semibold transition-all cursor-pointer ${isSelected
                            ? 'bg-[#183952] border border-[#91B9C5] text-white shadow-sm ring-1 ring-[#91B9C5]/40'
                            : 'bg-[#081724] border border-[#193a54] text-[#91B9C5] hover:bg-[#132c40] hover:text-white'
                          }`}
                      >
                        {emotion.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Mood Tag Edit / Free Input */}
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="text"
                    placeholder="Custom mood (e.g. 🖤 Heartbroken, ☕ Cozy morning)..."
                    value={formik.values.emotionTag}
                    onChange={(e) => formik.setFieldValue('emotionTag', e.target.value)}
                    className="flex-1 bg-[#081724] border border-[#1d4363] rounded-xl px-3 py-1.5 text-xs text-[#E8EEF0] focus:outline-none focus:border-[#91B9C5] font-grotesk placeholder:text-[#91B9C5]/40 select-text"
                  />
                  {formik.values.emotionTag && (
                    <button
                      type="button"
                      onClick={() => formik.setFieldValue('emotionTag', '')}
                      className="px-2 py-1.5 rounded-xl bg-[#081724] hover:bg-[#182635] border border-[#1d4363] text-[10px] font-mono text-[#91B9C5] hover:text-white transition-colors cursor-pointer"
                      title="Clear mood"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* 4B. SEAL BADGE & STICKERS */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#91B9C5]">
                    Seal Badge & Sticker
                  </span>
                  <span className="text-[10px] font-mono text-[#91B9C5]/70">
                    Active: <strong className="text-white">
                      {formik.values.sealBadge?.startsWith('data:')
                        ? 'Custom Image'
                        : (formik.values.sealBadge || 'None')}
                    </strong>
                  </span>
                </div>

                {/* Clean mood row with Lucide presets, custom image chip & drawer toggle */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* None / Clear badge button */}
                  <button
                    type="button"
                    onClick={() => {
                      formik.setFieldValue('sealBadge', 'None');
                      setNativeEmojiInput('');
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${!formik.values.sealBadge || formik.values.sealBadge === 'None'
                        ? 'bg-[#183952] border-[#91B9C5] ring-2 ring-[#91B9C5]/40 text-[#91B9C5]'
                        : 'bg-[#081724] border-[#183a54] text-[#91B9C5]/50 hover:text-white'
                      }`}
                    title="No badge"
                  >
                    <Ban className="w-4 h-4" />
                  </button>

                  {[
                    { icon: <Moon className="w-4 h-4 text-amber-200" />, label: 'Melancholic', badge: 'Orbit' },
                    { icon: <Coffee className="w-4 h-4 text-amber-500" />, label: 'Coffee', badge: 'Midnight Coffee' },
                    { icon: <CloudRain className="w-4 h-4 text-sky-400" />, label: 'Rain', badge: 'Rain Drops' },
                    { icon: <Sparkles className="w-4 h-4 text-amber-300" />, label: 'Sparkle', badge: 'Star Shimmer' },
                    { icon: <Heart className="w-4 h-4 text-rose-400 fill-rose-500/20" />, label: 'Heartbeat', badge: 'Heartbeat' },
                    { icon: <Disc className="w-4 h-4 text-cyan-300" />, label: 'Vinyl', badge: 'Vinyl Spin' },
                    { icon: <Headphones className="w-4 h-4 text-indigo-300" />, label: 'Headphones', badge: 'Headphones' },
                  ].map((item, idx) => {
                    const isSelected = formik.values.sealBadge === item.badge;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => formik.setFieldValue('sealBadge', item.badge)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${isSelected
                            ? 'bg-[#183952] border-[#91B9C5] ring-2 ring-[#91B9C5]/40 scale-105 shadow-sm'
                            : 'bg-[#081724] border-[#183a54] hover:bg-[#12283a]'
                          }`}
                        title={item.label}
                      >
                        {item.icon}
                      </button>
                    );
                  })}

                  {/* Custom Uploaded Sticker Chip with Instant Removal */}
                  {formik.values.sealBadge && (formik.values.sealBadge.startsWith('data:') || formik.values.sealBadge.startsWith('http')) && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#12283a] border border-[#91B9C5]/60 rounded-full shadow-sm animate-in fade-in">
                      <img src={formik.values.sealBadge} alt="badge" className="w-6 h-6 rounded-md object-cover border border-white/20" />
                      <span className="text-[10px] font-mono text-white">Custom sticker</span>
                      <button
                        type="button"
                        onClick={() => {
                          formik.setFieldValue('sealBadge', 'None');
                          setNativeEmojiInput('');
                          toast.info("Custom sticker removed");
                        }}
                        className="w-4 h-4 rounded-full bg-rose-950/80 hover:bg-rose-900 border border-rose-500 text-rose-300 flex items-center justify-center text-[10px] cursor-pointer ml-1"
                        title="Remove custom sticker"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* + GIF Expandable Toggle Button with clear state indicator */}
                  <button
                    type="button"
                    onClick={() => setShowGifDrawer(!showGifDrawer)}
                    className={`h-9 px-3.5 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${showGifDrawer
                        ? 'bg-rose-950/80 text-rose-300 border-rose-600/80 shadow-sm'
                        : 'bg-[#132c40] text-[#91B9C5] border-[#1d4363] hover:bg-[#1a3d5b]'
                      }`}
                    title={showGifDrawer ? "Close badges drawer" : "Open GIFs & badges drawer"}
                  >
                    {showGifDrawer ? (
                      <>
                        <X className="w-3.5 h-3.5" />
                        <span>Close</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>+ GIF / Badge</span>
                      </>
                    )}
                  </button>
                </div>

                {/* EXPANDABLE BADGE DRAWER: Clean, Dynamic & Flexible */}
                {showGifDrawer && (
                  <div className="pt-3 border-t border-[#16354d] space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#91B9C5] font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Tactile Enamel Badges</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowGifDrawer(false)}
                        className="text-xs font-mono text-[#91B9C5]/60 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <span>Collapse</span>
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* 6 Iconic Enamel Badges with Lucide Icons */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { id: 'Vinyl', label: 'Vinyl', icon: <Disc className="w-5 h-5 text-cyan-300" /> },
                        { id: 'Headphones', label: 'Headphones', icon: <Headphones className="w-5 h-5 text-indigo-300" /> },
                        { id: 'Heartbeat', label: 'Heartbeat', icon: <Heart className="w-5 h-5 text-rose-400 fill-rose-500/20" /> },
                        { id: 'Equalizer', label: 'Equalizer', icon: <Sliders className="w-5 h-5 text-teal-300" /> },
                        { id: 'Floating notes', label: 'Notes', icon: <Music className="w-5 h-5 text-purple-300" /> },
                        { id: 'Orbit', label: 'Orbit', icon: <Globe className="w-5 h-5 text-amber-300" /> },
                      ].map((item) => {
                        const isSelected = formik.values.sealBadge === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => formik.setFieldValue('sealBadge', item.id)}
                            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${isSelected
                                ? 'bg-[#142e44] border-[#91B9C5] shadow-sm ring-1 ring-[#91B9C5]/40'
                                : 'bg-[#081724] border-[#16354d] hover:bg-[#0d2336] text-[#91B9C5]/80 hover:text-white'
                              }`}
                          >
                            <div className="h-6 flex items-center justify-center">
                              {item.icon}
                            </div>
                            <p className="text-[10px] font-mono font-bold text-white">
                              {item.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Direct Image / GIF URL Input */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#91B9C5]/50" />
                        <input
                          type="text"
                          placeholder="Or paste direct image / GIF link (Giphy, Tenor, Imgur)..."
                          value={customStickerUrl}
                          onChange={(e) => {
                            setCustomStickerUrl(e.target.value);
                            if (e.target.value.trim().startsWith('http')) {
                              formik.setFieldValue('sealBadge', e.target.value.trim());
                            }
                          }}
                          className="w-full bg-[#081724] border border-[#183a54] rounded-xl pl-9 pr-14 py-2 text-xs text-[#E8EEF0] focus:outline-none focus:border-[#91B9C5] font-mono placeholder:text-[#91B9C5]/40"
                        />
                        {customStickerUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomStickerUrl('');
                              if (formik.values.sealBadge === customStickerUrl) {
                                formik.setFieldValue('sealBadge', 'None');
                              }
                            }}
                            className="absolute right-2 top-1.5 px-1.5 py-0.5 rounded bg-[#16354d] text-[#91B9C5] hover:text-white text-[10px] font-mono cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Device upload & Keyboard emoji input with Mac & Windows shortcut hints */}
                    <div className="pt-2 border-t border-[#16354d]/50 flex items-center justify-between gap-2 text-xs">
                      <div className="flex-1 flex items-center gap-1.5 bg-[#081724] px-2.5 py-1.5 rounded-xl border border-[#16354d]">
                        <Smile className="w-3.5 h-3.5 text-[#91B9C5]/60" />
                        <input
                          type="text"
                          placeholder="Insert emoji (Win + . on Windows, Cmd + Ctrl + Space on Mac)..."
                          value={nativeEmojiInput}
                          onChange={(e) => {
                            setNativeEmojiInput(e.target.value);
                            if (e.target.value.trim()) {
                              formik.setFieldValue('sealBadge', e.target.value.trim());
                            }
                          }}
                          className="w-full bg-transparent text-xs text-[#E8EEF0] focus:outline-none font-sans placeholder:text-[#91B9C5]/40"
                        />
                      </div>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLocalFileUpload}
                        accept="image/*,.gif,.png,.webp"
                        className="hidden"
                      />

                      {/* Device Upload / Removal Button */}
                      {formik.values.sealBadge && (formik.values.sealBadge.startsWith('data:') || formik.values.sealBadge.startsWith('http')) ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <img
                            src={formik.values.sealBadge}
                            alt="Sticker preview"
                            className="w-7 h-7 rounded-lg object-cover border border-[#91B9C5]/40"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              formik.setFieldValue('sealBadge', 'None');
                              setNativeEmojiInput('');
                              toast.info("Removed custom sticker");
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-[#1e0f0f] hover:bg-[#3b1a1a] border border-rose-800/50 text-[10px] font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <X className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-[#10273a] hover:bg-[#183952] border border-[#1d4363] text-[10px] font-mono text-[#91B9C5] hover:text-white flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                        >
                          <Upload className="w-3 h-3 text-[#91B9C5]" />
                          <span>Upload image</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AUDIENCE / STREAM */}
            <div className="pt-2 border-t border-[#16354d]/60 flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#91B9C5]">
                Audience
              </span>
              <div className="flex items-center gap-1 bg-[#081724] p-1 rounded-xl border border-[#1d4363]">
                <button
                  type="button"
                  onClick={() => formik.setFieldValue('visibility', 'PUBLIC')}
                  className={`px-3 py-1 text-xs font-grotesk font-bold rounded-lg transition-all cursor-pointer ${formik.values.visibility === 'PUBLIC'
                      ? 'bg-[#183952] text-white shadow-sm'
                      : 'text-[#91B9C5]/60 hover:text-white'
                    }`}
                >
                  Public Feed
                </button>
                <button
                  type="button"
                  onClick={() => formik.setFieldValue('visibility', 'FRIENDS_ONLY')}
                  className={`px-3 py-1 text-xs font-grotesk font-bold rounded-lg transition-all cursor-pointer ${formik.values.visibility === 'FRIENDS_ONLY'
                      ? 'bg-[#183952] text-white shadow-sm'
                      : 'text-[#91B9C5]/60 hover:text-white'
                    }`}
                >
                  Friends Only
                </button>
              </div>
            </div>

            {/* Big Publish Note Button (Matching Image 1) */}
            <button
              type="button"
              onClick={formik.handleSubmit}
              disabled={formik.isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-[#91B9C5] hover:bg-white text-[#07131e] font-grotesk font-extrabold text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>{formik.isSubmitting ? "Publishing Note..." : "Publish Note"}</span>
            </button>

          </div>

          {/* ------------------------------------------------------ */}
          {/* RIGHT COLUMN: LIVE REAL-TIME PROJECTION PREVIEW        */}
          {/* ------------------------------------------------------ */}
          <div className="w-full lg:w-[42%] bg-[#06121d] border-t lg:border-t-0 lg:border-l border-[#1b3d59]/50 flex flex-col justify-between p-5 sm:p-6 items-center overflow-y-auto custom-scrollbar">

            {/* Header */}
            <div className="w-full flex items-center justify-between text-xs font-mono text-[#91B9C5] pb-3 border-b border-[#142c40]/60 shrink-0">
              <span className="font-bold uppercase tracking-wider text-slate-300">
                Live note artifact
              </span>
              <span className="text-[10px] text-[#91B9C5] font-bold uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#91B9C5] animate-pulse" />
                Live Preview
              </span>
            </div>

            {/* Center Live Artifact Stage (Interactive: Click Card to Play/Pause snippet) */}
            <div className="w-full flex items-center justify-center my-auto py-4">
              <div
                onClick={handleTogglePreviewAudio}
                className="cursor-pointer group relative transition-transform hover:scale-[1.01] active:scale-[0.99] select-none"
                title={isPreviewAudioPlaying ? "Click card to pause audio snippet" : "Click card to listen to snippet"}
              >
                <MusicCard note={previewNote} />
              </div>
            </div>

            {/* Bottom Audio Info Bar (Interactive click to listen) */}
            <div className="w-full flex items-center justify-between pt-3 border-t border-[#142c40]/60 text-xs font-mono shrink-0">
              <span className="text-[#91B9C5]/80 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#91B9C5] animate-pulse" />
                <span>Snippet: <strong className="text-[#E8EEF0] font-bold">{formatTime(activeSnippetStart)} – {formatTime(activeSnippetEnd)}</strong> <span className="text-[#91B9C5]/60 text-[10px]">/ {formatTime(trackDurationSec)}</span></span>
              </span>
              <button
                type="button"
                onClick={handleTogglePreviewAudio}
                className="text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer hover:underline"
              >
                {isPreviewAudioPlaying ? (
                  <span className="text-rose-400 flex items-center gap-1 font-bold">
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    Click card to pause
                  </span>
                ) : (
                  <span className="text-[#91B9C5]/80 hover:text-white flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5" />
                    Click card to listen
                  </span>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Persistent Zero-RAM Audio Engine (1x1 viewport iframe, zero visual decoding, active Chrome tab) */}
      {ytVideoId && (
        <iframe
          ref={playerIframeRef}
          key={ytVideoId}
          src={`https://www.youtube-nocookie.com/embed/${ytVideoId}?enablejsapi=1&autoplay=${isPreviewAudioPlaying ? 1 : 0}&start=${formik.values.audioSnippetStart}&controls=0&disablekb=1&fs=0&rel=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
          title="Snippet Audio Engine"
          className="w-px h-px pointer-events-none opacity-0 fixed bottom-0 left-0 z-0"
          onLoad={() => {
            if (playerIframeRef.current?.contentWindow) {
              playerIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1 }), '*');
              playerIframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'getDuration', args: [] }), '*');
            }
          }}
          allow="autoplay; encrypted-media"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
