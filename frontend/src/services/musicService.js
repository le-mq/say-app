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

  // Zero-token Instant YouTube metadata resolution via YouTube oEmbed CDN (0 API units)
  resolveYoutubeUrl: async (url) => {
    const videoId = musicService.extractYoutubeId(url);
    if (!videoId) return null;

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(cleanUrl)}`);
      const data = await res.json();

      let title = data.title || 'YouTube Track';
      let artist = data.author_name || 'YouTube Artist';

      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').replace(/\(Official.*?\)/gi, '').replace(/\[Official.*?\]/gi, '').trim();
      } else if (title.includes(' — ')) {
        const parts = title.split(' — ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' — ').replace(/\(Official.*?\)/gi, '').replace(/\[Official.*?\]/gi, '').trim();
      }

      return {
        id: `yt_${videoId}`,
        songTitle: title,
        artistName: artist,
        songImageUrl: thumbnailUrl,
        externalSongUrl: cleanUrl,
        duration: '03:45',
        platform: 'YOUTUBE',
      };
    } catch {
      return {
        id: `yt_${videoId}`,
        songTitle: 'YouTube Video',
        artistName: 'YouTube Artist',
        songImageUrl: thumbnailUrl,
        externalSongUrl: cleanUrl,
        duration: '03:30',
        platform: 'YOUTUBE',
      };
    }
  },
};

