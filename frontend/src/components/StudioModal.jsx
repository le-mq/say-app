import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { musicService } from '../services/musicService';
import { noteService } from '../services/noteService';
import MusicCard from './MusicCard';
import {
  X, Search, Sparkles, Disc, Play, Pause,
  Layers, Volume2, Link as LinkIcon, Radio,
  Flame, Music, Check, RefreshCw, Sliders,
  Upload, Image as ImageIcon, Smile, FileUp, MoveHorizontal,
  Headphones, Heart, Coffee, CloudRain, Ban, Globe, Moon
} from 'lucide-react';

const PRESET_TRACKS = [
  {
    id: 'track-1',
    songTitle: 'Night Drive',
    artistName: 'Khruangbin',
    duration: '04:12',
    songImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
    externalSongUrl: 'https://www.youtube.com/watch?v=oc50wHexvY8',
    defaultLyric: 'Headlights bounce against the wet cobblestone at 2:15 AM.',
    icon: '🍃',
  },
  {
    id: 'track-2',
    songTitle: 'Holocene',
    artistName: 'Bon Iver',
    duration: '05:36',
    songImageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
    externalSongUrl: 'https://www.youtube.com/watch?v=TWcyIpul8OE',
    defaultLyric: 'And at once I knew I was not magnificent.',
    icon: '🏔️',
  },
  {
    id: 'track-3',
    songTitle: 'Alberto Balsalm',
    artistName: 'Aphex Twin',
    duration: '05:11',
    songImageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
    externalSongUrl: 'https://www.youtube.com/watch?v=mUT3ZqV0u3Q',
    defaultLyric: 'Tape hiss intertwining with bedroom ceiling shadows.',
    icon: '📼',
  },
  {
    id: 'track-4',
    songTitle: 'Pink Moon',
    artistName: 'Nick Drake',
    duration: '02:06',
    songImageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500',
    externalSongUrl: 'https://www.youtube.com/watch?v=aXnso9gkEc8',
    defaultLyric: 'Pink moon is on its way, none stand so tall.',
    icon: '🌙',
  },
];

const TEMPLATES = [
  { id: 'RECEIPTIFY', label: 'RECEIPTIFY', desc: 'Thermal paper roll + barcode' },
  { id: 'CASSETTE', label: 'CASSETTE', desc: 'Y2K acrylic tape + washi' },
  { id: 'STAMP', label: 'AIRMAIL STAMP', desc: 'Perforated postal artwork' },
  { id: 'VINYL', label: 'VINYL DISC', desc: '33 RPM analog microgroove' },
  { id: 'GALAXY', label: 'GALAXY ORBIT', desc: 'Cosmic planetary orbits' },
];

const EMOTIONS = [
  { id: 'Melancholic', label: '🌙 Melancholic' },
  { id: 'Nostalgic', label: '📼 Nostalgic' },
  { id: 'Peaceful', label: '🍃 Peaceful' },
  { id: 'Bittersweet', label: '✨ Bittersweet' },
  { id: 'Cosmic Bliss', label: '🪐 Cosmic Bliss' },
];

// 1. Apple / iOS Emoji Catalog (Categorized)
const IOS_EMOJI_CATEGORIES = [
  {
    id: 'music',
    label: '🎧 Audio & Lo-Fi',
    emojis: ['🎧', '📻', '🎙️', '📼', '💿', '🎹', '🎸', '🎼', '🎶', '🥁', '🪗', '🎺', '🎻', '🔊', '🔈', '🪩', '🎵']
  },
  {
    id: 'dev',
    label: '💻 Dev & IT Artifacts',
    emojis: ['💻', '⌨️', '💾', '🕹️', '👾', '⚡', '🔋', '📡', '📟', '🔌', '🖥️', '🚀', '🤖', '🛠️', '☕', '💡', '🔍', '⚙️']
  },
  {
    id: 'aesthetic',
    label: '🥀 Aesthetic & Mood',
    emojis: ['🥀', '✨', '🌙', '🪐', '🌧️', '🕯️', '🦋', '🫧', '🧸', '🕊️', '💌', '🍵', '🍷', '📖', '🎞️', '📷', '🗝️', '🖤']
  },
  {
    id: 'emotions',
    label: '🤍 Hearts & Feelings',
    emojis: ['🤍', '🖤', '❤️‍🔥', '💔', '🥹', '🫠', '🫣', '😌', '😴', '🌊', '🍃', '🌸', '☁️', '💫', '🔥', '🧿', '🍀']
  }
];

// 2. Curated Aesthetic Motion GIFs & Stickers (Lightweight, low-memory)
const CURATED_AESTHETIC_GIFS = [
  {
    id: 'gif-vinyl',
    title: '33 RPM Vinyl Spin',
    tag: '#vinyl',
    url: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=200&auto=format&fit=crop'
  },
  {
    id: 'gif-tape',
    title: '90s Chrome Tape',
    tag: '#cassette',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop'
  },
  {
    id: 'gif-rain',
    title: 'Rain on Window',
    tag: '#rain',
    url: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=200&auto=format&fit=crop'
  },
  {
    id: 'gif-cat',
    title: 'Lo-Fi Chill Cat',
    tag: '#cat',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop'
  },
  {
    id: 'gif-coffee',
    title: 'Warm Matcha Coffee',
    tag: '#coffee',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&auto=format&fit=crop'
  },
  {
    id: 'gif-city',
    title: 'Midnight Highway',
    tag: '#drive',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop'
  },
  {
    id: 'gif-code',
    title: 'Terminal / Matrix',
    tag: '#code',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200&auto=format&fit=crop'
  },
  {
    id: 'gif-nebula',
    title: 'Interstellar Nebula',
    tag: '#cosmic',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&auto=format&fit=crop'
  },
  {
    id: 'gif-heart',
    title: 'Neon Cyber Heart',
    tag: '#heart',
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=200&auto=format&fit=crop'
  },
  {
    id: 'gif-headphones',
    title: 'Studio Monitor Phones',
    tag: '#music',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop'
  },
  {
    id: 'gif-lofi',
    title: 'Lo-Fi Midnight Lamp',
    tag: '#lofi',
    url: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?w=200&auto=format&fit=crop'
  },
  {
    id: 'gif-sparkle',
    title: 'Starlight Shimmer',
    tag: '#sparkle',
    url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&auto=format&fit=crop'
  }
];

// 3. Tactile Wax Seals & Pins
const WAX_SEALS_AND_PINS = [
  { id: 'None', label: 'None', icon: '—', desc: 'Clean minimalism' },
  { id: 'Crimson Wax', label: 'Crimson Wax', icon: '🔴', desc: 'Royal letter seal' },
  { id: 'Vinyl 33 RPM', label: 'Vinyl 33 RPM', icon: '💿', desc: 'Microgroove pin' },
  { id: 'Hologram Star', label: 'Hologram Star', icon: '⭐', desc: 'Prismatic foil' },
  { id: 'Washi Tape', label: 'Washi Tape', icon: '🩹', desc: 'Pastel paper tape' },
  { id: 'Dark Rose', label: 'Dark Rose', icon: '🥀', desc: 'Pressed flower' },
  { id: 'Hi-Fi Headphones', label: 'Hi-Fi Phones', icon: '🎧', desc: 'Studio monitor' },
  { id: 'Flame Seal', label: 'Flame Seal', icon: '🔥', desc: 'Golden fire' },
];

// 4. Smart Highlighted Milestones (Lấy các mốc gợi ý sẵn có từ bài hát)
const SMART_HIGHLIGHT_MILESTONES = [
  { label: '🌟 Chorus Hook', timeSec: 45, desc: 'Điệp khúc cao trào' },
  { label: '🌙 Verse Hook', timeSec: 15, desc: 'Lời tự sự êm dịu' },
  { label: '⚡ Climax Solo', timeSec: 75, desc: 'Đoạn solo biến chuyển' },
  { label: '☕ Intro Melody', timeSec: 0, desc: 'Giai điệu dạo đầu' },
];

// 5. Trending Gen-Z & Indie Audiophile Vibe Captions
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

// Helper to convert mm:ss or seconds to integer seconds
const parseDurationToSeconds = (dur) => {
  if (!dur) return 252;
  if (typeof dur === 'number') return dur;
  const parts = dur.toString().split(':').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  const parsed = parseInt(dur, 10);
  return isNaN(parsed) ? 252 : parsed;
};

// Formik Validation (Allowing flexible track durations up to 30 mins)
const NoteValidationSchema = Yup.object().shape({
  songTitle: Yup.string().required('Song title is required. Pick or search a track.'),
  artistName: Yup.string().required('Artist name is required.'),
  songImageUrl: Yup.string().required('Album artwork is required.'),
  audioSnippetStart: Yup.number().min(0).max(1800).required(),
  templateType: Yup.string().required(),
  emotionTag: Yup.string().required(),
});

// Slender Spotify-code acoustic waveform with dots (•), natural vocal peaks, and dynamic non-repetitive rhythm
const REFINED_ACOUSTIC_BARS = [
  4, 10, 16, 4, 20, 30, 14, 22, 34, 24, 16, 22, 32, 22, 14, 8, 4, 8, 16, 24,
  36, 26, 16, 10, 4, 14, 22, 32, 38, 28, 18, 12, 4, 12, 20, 30, 24, 16, 8, 4,
  16, 26, 34, 24, 16, 10, 4, 10, 20, 28, 36, 26, 16, 8, 4, 12, 22, 16, 8, 4
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
  const [playbackKey, setPlaybackKey] = useState(0);
  const previewTimerRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // Shared Community Hot Tracks Pool (0 token usage across 1000 users)
  const [sharedHotPool, setSharedHotPool] = useState([]);

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
          const durSec = parseDurationToSeconds(resolved.duration);
          setTrackDurationSec(durSec);
          toast.success(`✨ Detected: ${resolved.songTitle} - ${resolved.artistName}`);
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
    toast.success(`Picked: ${track.songTitle} (0 Quota)`);
  };

  // Dynamic Audio Duration (Calculated from actual track duration, not hardcoded!)
  const [trackDurationSec, setTrackDurationSec] = useState(() => parseDurationToSeconds(PRESET_TRACKS[0].duration));

  // Note Personalization: Clean drawer toggle (+GIF expands options) & drawer view tabs
  const [showGifDrawer, setShowGifDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState('default'); // 'default' | 'search'
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('all');
  const [emojiSearchQuery, setEmojiSearchQuery] = useState('');
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [nativeEmojiInput, setNativeEmojiInput] = useState('');

  // SVG Audio Waveform Draggable Bounding Box Refs
  const waveformRef = useRef(null);
  const isDraggingRange = useRef(false);
  const dragStartX = useRef(0);
  const dragStartSec = useRef(0);
  const fileInputRef = useRef(null);

  const formik = useFormik({
    initialValues: {
      songTitle: PRESET_TRACKS[0].songTitle,
      artistName: PRESET_TRACKS[0].artistName,
      songImageUrl: PRESET_TRACKS[0].songImageUrl,
      externalSongUrl: PRESET_TRACKS[0].externalSongUrl,
      audioSnippetStart: 15,
      templateType: 'CASSETTE',
      emotionTag: EMOTIONS[0].label,
      lyricSnippet: PRESET_TRACKS[0].defaultLyric,
      caption: 'pov: driving home at 2:15 AM with this on loop',
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
        toast.success(`Published "${values.songTitle}" note! 🎵`);
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

  // Loop snippet playback continuously strictly within [start, start + duration]
  useEffect(() => {
    if (!isPreviewAudioPlaying) return;

    const loopTimer = setTimeout(() => {
      setPlaybackKey((prev) => prev + 1);
    }, snippetDuration * 1000);

    return () => clearTimeout(loopTimer);
  }, [isPreviewAudioPlaying, playbackKey, snippetDuration, formik.values.audioSnippetStart]);

  // Helper to update snippet start and seek audio if playing (continuous playback without auto-cut)
  const updateSnippetStart = (newSec) => {
    formik.setFieldValue('audioSnippetStart', newSec);
    if (isPreviewAudioPlaying) {
      setPlaybackKey(prev => prev + 1);
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

  // Dynamic milestones (Chorus ~35%, Verse ~12% of actual track duration)
  const dynamicChorusTime = Math.floor(trackDurationSec * 0.35);
  const dynamicVerseTime = Math.floor(trackDurationSec * 0.12);

  const handleJumpToChorus = () => {
    updateSnippetStart(Math.min(dynamicChorusTime, Math.max(0, trackDurationSec - snippetDuration)));
  };

  const handleJumpToVerse = () => {
    updateSnippetStart(Math.min(dynamicVerseTime, Math.max(0, trackDurationSec - snippetDuration)));
  };

  // AI Smart Vibe Generator
  const handleGenerateAIVibe = () => {
    const randomVibe = TRENDY_VIBES[Math.floor(Math.random() * TRENDY_VIBES.length)].text;
    formik.setFieldValue('caption', randomVibe);
  };

  // Audio Waveform Click-to-Jump Handler (scaled to actual track duration)
  const handleWaveformClick = (e) => {
    if (!waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSec = Math.max(0, Math.min(trackDurationSec - snippetDuration, Math.round(ratio * trackDurationSec)));
    updateSnippetStart(targetSec);
  };

  // Audio Waveform Draggable Bounding Box Handler (Zero-lag synchronized tracking)
  const handleDragBoxMouseDown = (e) => {
    e.stopPropagation();
    isDraggingRange.current = true;
    dragStartX.current = e.clientX;
    dragStartSec.current = formik.values.audioSnippetStart;
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingRange.current || !waveformRef.current) return;
      const rect = waveformRef.current.getBoundingClientRect();
      const deltaX = moveEvent.clientX - dragStartX.current;
      const deltaSec = (deltaX / rect.width) * trackDurationSec;
      const newSec = Math.max(0, Math.min(trackDurationSec - snippetDuration, Math.round(dragStartSec.current + deltaSec)));
      updateSnippetStart(newSec);
    };

    const handleMouseUp = () => {
      isDraggingRange.current = false;
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
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
        toast.success(`Attached "${file.name}" to note! ✨`);
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
        toast.success(`Attached "${file.name}" to note! ✨`);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Filtered Emojis Catalog
  const filteredEmojis = React.useMemo(() => {
    let pool = [];
    if (selectedEmojiCategory === 'all') {
      IOS_EMOJI_CATEGORIES.forEach(cat => pool.push(...cat.emojis));
    } else {
      const found = IOS_EMOJI_CATEGORIES.find(c => c.id === selectedEmojiCategory);
      if (found) pool = found.emojis;
    }
    if (!emojiSearchQuery.trim()) return pool;
    const q = emojiSearchQuery.toLowerCase();
    // Match emoji string
    return pool.filter(em => em.includes(q) || pool.includes(em));
  }, [selectedEmojiCategory, emojiSearchQuery]);

  // Filtered Curated GIFs
  const filteredGifs = React.useMemo(() => {
    if (!gifSearchQuery.trim()) return CURATED_AESTHETIC_GIFS;
    const q = gifSearchQuery.toLowerCase();
    return CURATED_AESTHETIC_GIFS.filter(g => g.title.toLowerCase().includes(q) || g.tag.toLowerCase().includes(q));
  }, [gifSearchQuery]);

  // Construct Live Preview Note Object
  const endSeconds = formik.values.audioSnippetStart + snippetDuration;
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const previewNote = {
    id: 'studio-preview-id',
    userDisplayName: user?.displayName || 'Linh Tran',
    handle: user?.handle || '@linhtran',
    timeAgo: 'Just now',
    songTitle: formik.values.songTitle || 'NIGHT DRIVE / MIDNIGHT AMBIENT',
    artistName: formik.values.artistName || 'Khruangbin Vibe',
    songImageUrl: formik.values.songImageUrl || PRESET_TRACKS[0].songImageUrl,
    audioSnippetStart: formatTime(formik.values.audioSnippetStart),
    audioSnippetEnd: formatTime(endSeconds),
    templateType: formik.values.templateType,
    emotionTag: formik.values.emotionTag,
    lyricSnippet: formik.values.lyricSnippet,
    caption: formik.values.caption,
    stickerBadge: formik.values.sealBadge,
    visibility: formik.values.visibility,
    likesCount: 42,
    orderNumber: user
      ? `ORD #${user.memberId ? user.memberId.replace('#', '') : (user.id ? user.id.replace(/-/g, '').slice(-4).toUpperCase() : '0101')} FOR ${(user.displayName || user.email?.split('@')[0] || 'ARCHIVER').toUpperCase()}`
      : 'ORD #0101 FOR GUEST ARCHIVER',
    dialogues: [],
  };

  const ytVideoId = musicService.extractYoutubeId(formik.values.externalSongUrl);

  const handleTogglePreviewAudio = () => {
    if (isPreviewAudioPlaying) {
      setIsPreviewAudioPlaying(false);
    } else {
      if (!ytVideoId && !formik.values.externalSongUrl) {
        toast.info('Please paste a link or select a track to preview snippet!');
        return;
      }
      setIsPreviewAudioPlaying(true);
      setPlaybackKey(prev => prev + 1);
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
          <div className="w-full lg:w-[58%] overflow-y-auto p-5 space-y-4 pr-3 scrollbar-thin" style={{ willChange: 'transform', overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>

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

                  {/* Auto-Resolved YouTube Track Confirmation Card with Clear Button */}
                  {resolvedTrackInfo && (
                    <div className="p-2.5 rounded-xl bg-[#081724] border border-cyan-500/40 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={resolvedTrackInfo.songImageUrl}
                          alt="Cover"
                          className="w-9 h-9 rounded-lg object-cover border border-cyan-400/40 shadow-xs shrink-0"
                        />
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 text-[8.5px] font-mono font-bold">
                              Track
                            </span>
                            <p className="text-xs font-bold text-white truncate">
                              {resolvedTrackInfo.songTitle}
                            </p>
                          </div>
                          <p className="text-[10px] text-[#91B9C5] truncate">
                            {resolvedTrackInfo.artistName}
                          </p>
                        </div>
                      </div>

                      {/* Actions: Track Loaded Badge + Clear Track Button */}
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Ready
                        </span>
                        <button
                          type="button"
                          onClick={handleClearPastedTrack}
                          className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-[9.5px] font-mono text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Clear current track"
                        >
                          <X className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      </div>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
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

                  <p className="text-[10px] text-[#91B9C5]/60 font-mono flex items-center gap-1">
                    <span>💡</span>
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
                    <div className="bg-[#07131e] border border-[#1d4363] rounded-xl p-2 space-y-1 max-h-52 overflow-y-auto">
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
                  <span className="text-[10px] font-mono text-[#91B9C5]/70">
                    ({formatTime(formik.values.audioSnippetStart)} – {formatTime(endSeconds)} / {formatTime(trackDurationSec)})
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

                  {/* Discrete Rounded Slender Audio Bars Scrubber */}
                  <div
                    ref={waveformRef}
                    onClick={handleWaveformClick}
                    className="relative flex-1 h-14 px-2 py-1.5 rounded-xl bg-[#050e17] border border-[#11283d] overflow-hidden select-none cursor-ew-resize"
                    style={{ touchAction: 'none' }}
                  >
                    {/* Discrete Slender Audio Bars SVG (Spotify Code pattern) */}
                    <svg
                      viewBox="0 0 390 40"
                      preserveAspectRatio="none"
                      className="w-full h-full pointer-events-none"
                    >
                      {/* Center Dashed Zero-Line */}
                      <line x1="0" y1="20" x2="390" y2="20" stroke="#16334a" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />

                      {/* 60 Slender Vertical Capsule Bars */}
                      {REFINED_ACOUSTIC_BARS.map((height, i) => {
                        const x = 3 + (i / REFINED_ACOUSTIC_BARS.length) * 382;
                        const barW = 1.8;
                        const barProgress = (i / REFINED_ACOUSTIC_BARS.length) * trackDurationSec;
                        const inRange = barProgress >= formik.values.audioSnippetStart && barProgress <= endSeconds;
                        const barH = (height / 38) * 34;
                        const barY = 20 - (barH / 2);
                        return (
                          <rect
                            key={i}
                            x={x}
                            y={barY}
                            width={barW}
                            height={barH}
                            rx="0.9"
                            fill={inRange ? '#91B9C5' : '#193850'}
                            opacity={inRange ? '1' : '0.45'}
                          />
                        );
                      })}
                    </svg>

                    {/* Synchronized Zero-Lag Selection Frame (NO delay transition) */}
                    <div
                      className="absolute inset-y-1 pointer-events-none z-10 transition-none"
                      style={{
                        left: `${(formik.values.audioSnippetStart / trackDurationSec) * 100}%`,
                        width: `${(snippetDuration / trackDurationSec) * 100}%`,
                        borderLeft: '2px solid #91B9C5',
                        borderRight: '2px solid #91B9C5',
                        borderTop: '1px solid rgba(145, 185, 197, 0.3)',
                        borderBottom: '1px solid rgba(145, 185, 197, 0.3)',
                        background: 'rgba(145, 185, 197, 0.12)',
                      }}
                    >
                      {/* Left Handle Pill Grip */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-6 bg-[#91B9C5] rounded-full shadow-[0_0_6px_rgba(145,185,197,0.8)] flex items-center justify-center">
                        <div className="w-0.5 h-2.5 bg-[#07131e]/70 rounded-full" />
                      </div>
                      {/* Right Handle Pill Grip */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-6 bg-[#91B9C5] rounded-full shadow-[0_0_6px_rgba(145,185,197,0.8)] flex items-center justify-center">
                        <div className="w-0.5 h-2.5 bg-[#07131e]/70 rounded-full" />
                      </div>
                    </div>

                    {/* Invisible Drag Area */}
                    <div
                      className="absolute inset-0 z-20 cursor-ew-resize"
                      onMouseDown={handleDragBoxMouseDown}
                    />
                  </div>
                </div>

                {/* Timestamps */}
                <div className="flex items-center justify-between text-xs font-mono text-[#91B9C5] select-none">
                  <span className="font-bold text-white">{formatTime(formik.values.audioSnippetStart)}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#0d2233] border border-[#16354d] text-[10px] font-bold text-[#91B9C5]">
                    {snippetDuration}s
                  </span>
                  <span className="font-bold text-white">{formatTime(endSeconds)}</span>
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

                {/* Real YouTube Audio Playback Engine for 30s Snippet */}
                {ytVideoId && isPreviewAudioPlaying && (
                  <div className="bg-[#05111c] border border-cyan-500/40 rounded-xl p-2.5 flex items-center justify-between text-xs animate-in fade-in duration-200 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                      </span>
                      <div>
                        <p className="font-mono text-cyan-300 text-[11px] font-bold">
                          Looping Snippet: {formatTime(formik.values.audioSnippetStart)} – {formatTime(endSeconds)}
                        </p>
                        <p className="text-[9.5px] text-[#91B9C5]/70 font-mono">
                          Looping selected {snippetDuration}s snippet • Click Pause to stop
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPreviewAudioPlaying(false)}
                      className="text-[10px] font-mono text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 cursor-pointer transition-colors"
                    >
                      Pause ✕
                    </button>

                    {/* High-fidelity invisible YouTube player frame strictly confined to [start, end] and looped */}
                    <div className="w-0.5 h-0.5 opacity-0 overflow-hidden absolute pointer-events-none -left-[9999px]">
                      <iframe
                        key={`${ytVideoId}-${formik.values.audioSnippetStart}-${snippetDuration}-${playbackKey}`}
                        width="200"
                        height="200"
                        src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1&start=${formik.values.audioSnippetStart}&end=${formik.values.audioSnippetStart + snippetDuration}&controls=0`}
                        title="Snippet Audio Preview"
                        allow="autoplay; encrypted-media"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. CAPTION & THOUGHTS (Image 1 Style: "What's on your mind?...") */}
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

                {/* EXPANDABLE DRAWER: Controlled with 2 Tabs (Default vs Search) */}
                {showGifDrawer && (
                  <div className="pt-3 border-t border-[#16354d] space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">

                    {/* Drawer Navigation Bar: Default Suggestions vs Search */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-[#07131e] p-0.5 rounded-xl border border-[#16354d]">
                        <button
                          type="button"
                          onClick={() => {
                            setDrawerTab('default');
                            setGifSearchQuery('');
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${drawerTab === 'default'
                              ? 'bg-[#183952] text-white shadow-xs'
                              : 'text-[#91B9C5]/70 hover:text-white'
                            }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#91B9C5]" />
                          <span>Curated Presets</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrawerTab('search')}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${drawerTab === 'search'
                              ? 'bg-[#183952] text-white shadow-xs'
                              : 'text-[#91B9C5]/70 hover:text-white'
                            }`}
                        >
                          <Search className="w-3.5 h-3.5 text-[#91B9C5]" />
                          <span>Search</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowGifDrawer(false)}
                        className="text-xs font-mono text-[#91B9C5]/60 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <span>Collapse</span>
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* TAB 1: DEFAULT SUGGESTIONS (Curated Enamel Badges with Lucide Icons + Motion GIFs) */}
                    {drawerTab === 'default' && (
                      <div className="space-y-3">
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

                        {/* Featured Aesthetic Motion GIFs */}
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-wider text-[#91B9C5]/70 mb-1.5">
                            Motion lo-fi stickers
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {CURATED_AESTHETIC_GIFS.slice(0, 4).map((gif) => {
                              const isSelected = formik.values.sealBadge === gif.url;
                              return (
                                <div
                                  key={gif.id}
                                  onClick={() => formik.setFieldValue('sealBadge', gif.url)}
                                  className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${isSelected
                                      ? 'bg-[#183952] border-[#91B9C5] shadow-md scale-[1.02]'
                                      : 'bg-[#081724] border-[#183a54] hover:bg-[#0f2436]'
                                    }`}
                                >
                                  <img
                                    src={gif.url}
                                    alt={gif.title}
                                    loading="lazy"
                                    className="w-full h-14 object-cover rounded-lg border border-white/10"
                                  />
                                  <p className="text-[9px] font-mono font-bold text-white truncate w-full text-center">
                                    {gif.title}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: SEARCH (Keywords, Custom Stickers, Categories) */}
                    {drawerTab === 'search' && (
                      <div className="space-y-3">
                        {/* Search Input with Clear Button */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#91B9C5]/50" />
                          <input
                            type="text"
                            placeholder="Search stickers (e.g. vinyl, tape, rain, cat, coffee)..."
                            value={gifSearchQuery}
                            onChange={(e) => setGifSearchQuery(e.target.value)}
                            className="w-full bg-[#081724] border border-[#183a54] rounded-xl pl-9 pr-16 py-2 text-xs text-[#E8EEF0] focus:outline-none focus:border-[#91B9C5] font-mono placeholder:text-[#91B9C5]/40"
                          />
                          {gifSearchQuery ? (
                            <button
                              type="button"
                              onClick={() => setGifSearchQuery('')}
                              className="absolute right-2.5 top-1.5 px-2 py-0.5 rounded bg-[#16354d] text-[#91B9C5] hover:text-white text-[10px] font-mono cursor-pointer"
                            >
                              Clear ✕
                            </button>
                          ) : null}
                        </div>

                        {/* Filtered GIFs Search Results */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1">
                          {filteredGifs.map((gif) => {
                            const isSelected = formik.values.sealBadge === gif.url;
                            return (
                              <div
                                key={gif.id}
                                onClick={() => formik.setFieldValue('sealBadge', gif.url)}
                                className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${isSelected
                                    ? 'bg-[#183952] border-[#91B9C5] shadow-md scale-[1.02]'
                                    : 'bg-[#081724] border-[#183a54] hover:bg-[#0f2436]'
                                  }`}
                              >
                                <img
                                  src={gif.url}
                                  alt={gif.title}
                                  loading="lazy"
                                  className="w-full h-12 object-cover rounded-lg border border-white/10"
                                />
                                <p className="text-[9px] font-mono font-bold text-white truncate">
                                  {gif.title}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

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
          <div className="w-full lg:w-[42%] bg-[#06121d] border-t lg:border-t-0 lg:border-l border-[#1b3d59]/50 flex flex-col justify-between p-5 sm:p-6 items-center overflow-y-auto">

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

            {/* Center Live Artifact Stage */}
            <div className="w-full flex items-center justify-center my-auto py-4">
              <MusicCard note={previewNote} />
            </div>

            {/* Bottom Audio Info Bar (Clean metadata without redundant button) */}
            <div className="w-full flex items-center justify-between pt-3 border-t border-[#142c40]/60 text-xs font-mono shrink-0">
              <span className="text-[#91B9C5]/80 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#91B9C5] animate-pulse" />
                <span>Audio Snippet: <strong className="text-[#E8EEF0] font-bold">{snippetDuration}s</strong></span>
              </span>
              <span className="text-[11px] text-[#91B9C5]/60 font-mono">
                Click card to listen
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
