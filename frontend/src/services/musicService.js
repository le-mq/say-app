import { api } from './api';

export const musicService = {
  searchTracks: async (query, platform = 'YOUTUBE') => {
    return api.get(`/music/search?query=${encodeURIComponent(query)}&platform=${platform}`);
  },

  getSharedPool: async () => {
    return api.get('/music/search/pool');
  },

  // Extract 11-char video ID from any YouTube / YouTube Music URL
  extractYoutubeId: (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  },

  // Clean video titles removing noise keywords like Official MV, Theme Song, etc.
  // Preserves exact original song title and artist names to respect artists.
  cleanMetadata: (rawTitle = '', authorName = '') => {
    if (!rawTitle) {
      return { songTitle: '', artistName: authorName || '' };
    }

    let text = rawTitle.trim();
    if (text.includes('|')) {
      const segs = text.split('|');
      if (segs[0].trim().length >= 2) {
        text = segs[0].trim();
      }
    } else if (text.includes('//')) {
      const segs = text.split('//');
      if (segs[0].trim().length >= 2) {
        text = segs[0].trim();
      }
    }

    // 2. Strip bracketed & parenthesized noise tags without altering original song or artist names
    const noisePatterns = [
      /\s*\([^)]*(?:Theme\s*Song|Nhạc\s*[Pp]him|OST|Soundtrack|Official(?:\s*(?:MV|Music\s*Video|Audio))?|MV(?:\s*Official)?|Lyrics?|Lyric\s*Video|Lời\s*bài\s*hát|Vietsub|Audio|Bản\s*chuẩn|Karaoke|Teaser|Trailer|4K|8K|60FPS|HD|Full\s*HD|1080p)[^)]*\)\s*/gi,
      /\s*\[[^\]]*(?:Theme\s*Song|Nhạc\s*[Pp]him|OST|Soundtrack|Official(?:\s*(?:MV|Music\s*Video|Audio))?|MV(?:\s*Official)?|Lyrics?|Lyric\s*Video|Lời\s*bài\s*hát|Vietsub|Audio|Bản\s*chuẩn|Karaoke|Teaser|Trailer|4K|8K|60FPS|HD|Full\s*HD|1080p)[^\]]*\]\s*/gi,
      /\s*[\[\(]\s*(?:MV|Official|Audio|Lyrics?|Vietsub|4K)\s*[\]\)]\s*$/gi,
    ];

    for (const pat of noisePatterns) {
      text = text.replace(pat, ' ');
    }

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // 3. Separate Song Title and Artist Name
    let song = text;
    let artist = (authorName || '')
      .replace(/\s*-\s*Topic$/i, '')
      .replace(/\s*Official.*$/i, '')
      .replace(/\s*Channel.*$/i, '')
      .trim();

    const separatorMatch = text.match(/\s+[-–—]\s+/);
    if (separatorMatch) {
      const sep = separatorMatch[0];
      const parts = text.split(sep);
      const part0 = parts[0].trim();
      const part1 = parts.slice(1).join(sep).trim();

      const authorClean = (authorName || '')
        .toLowerCase()
        .replace(/official|topic|channel|vevo|music/gi, '')
        .trim();
      const part0Lower = part0.toLowerCase();
      const part1Lower = part1.toLowerCase();

      if (authorClean && authorClean.length >= 2 && part0Lower.includes(authorClean)) {
        artist = part0;
        song = part1;
      } else if (authorClean && authorClean.length >= 2 && part1Lower.includes(authorClean)) {
        song = part0;
        artist = part1;
      } else {
        song = part0;
        artist = part1 || artist;
      }
    }

    return {
      songTitle: song.trim() || 'Untitled Track',
      artistName: artist.trim() || 'Artist',
    };
  },

  // Zero-token Instant YouTube metadata resolution with true duration lookup
  resolveYoutubeUrl: async (url) => {
    const videoId = musicService.extractYoutubeId(url);
    if (!videoId) return null;

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // 1. First priority: Check backend YouTube details endpoint for true duration (even > 1 hour)
    try {
      const detailsRes = await api.get(`/music/search/details?videoId=${videoId}`);
      const details = detailsRes?.data?.data || detailsRes?.data;
      if (details && details.songTitle) {
        const cleaned = musicService.cleanMetadata(details.songTitle, details.artistName);
        const durationSec = details.durationMs ? Math.round(details.durationMs / 1000) : null;
        return {
          id: `yt_${videoId}`,
          youtubeId: videoId,
          songTitle: cleaned.songTitle,
          artistName: cleaned.artistName,
          songImageUrl: details.songImageUrl || thumbnailUrl,
          externalSongUrl: cleanUrl,
          duration: durationSec,
          platform: 'YOUTUBE',
        };
      }
    } catch (_) {}

    try {
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(cleanUrl)}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !data.title) return null;

      const { songTitle, artistName } = musicService.cleanMetadata(data.title, data.author_name);

      let durationSec = null;
      // Instant precision duration lookup via free iTunes audio catalog
      try {
        const queryTerm = `${songTitle} ${artistName}`.trim();
        const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(queryTerm)}&entity=song&limit=1`);
        if (itunesRes.ok) {
          const itunesData = await itunesRes.json();
          if (itunesData.results && itunesData.results.length > 0 && itunesData.results[0].trackTimeMillis) {
            durationSec = Math.round(itunesData.results[0].trackTimeMillis / 1000);
          }
        }
      } catch {}

      return {
        id: `yt_${videoId}`,
        songTitle,
        artistName,
        songImageUrl: thumbnailUrl,
        externalSongUrl: cleanUrl,
        duration: durationSec, // Exact track duration in seconds
        platform: 'YOUTUBE',
      };
    } catch {
      return null;
    }
  },
};

// Formats seconds into m:ss or h:mm:ss for videos longer than 1 hour (e.g. 7054s -> 1:57:34)
export const formatTime = (secs) => {
  if (secs === null || secs === undefined || secs === '') return '0:00';
  if (typeof secs === 'string' && secs.includes(':')) {
    const parts = secs.split(':').map(Number);
    // If it was previously formatted like "117:34" (>60 mins without hours), re-normalize it
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[0] >= 60) {
      const totalSecs = parts[0] * 60 + parts[1];
      return formatTime(totalSecs);
    }
    return secs;
  }
  const total = Math.max(0, Math.floor(Number(secs) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const sPad = s < 10 ? `0${s}` : s;

  if (h > 0) {
    const mPad = m < 10 ? `0${m}` : m;
    return `${h}:${mPad}:${sPad}`;
  }
  return `${m}:${sPad}`;
};

export const parseDurationToSeconds = (dur) => {
  if (dur === 0) return 0;
  if (!dur) return 0;
  if (typeof dur === 'number') return dur;
  const parts = dur.toString().split(':').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  const parsed = parseInt(dur, 10);
  return isNaN(parsed) ? 0 : parsed;
};

