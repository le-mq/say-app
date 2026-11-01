import { api } from './api';

export const musicService = {
  searchTracks: async (query, platform = 'ALL') => {
    return api.get(`/music/search?query=${encodeURIComponent(query)}&platform=${platform}`);
  },
};
