import { api } from './api';

export const noteService = {
  getPublicFeed: async (viewerId) => {
    const query = viewerId ? `?viewerId=${encodeURIComponent(viewerId)}` : '';
    return api.get(`/notes/feed/public${query}`);
  },
  getFriendsFeed: async (userId) => {
    return api.get(`/notes/feed/friends?userId=${userId}`);
  },
  getUserNotes: async (userId, viewerId) => {
    const query = viewerId ? `?viewerId=${encodeURIComponent(viewerId)}` : '';
    return api.get(`/notes/user/${userId}${query}`);
  },
  toggleLikeNote: async (noteId, userId) => {
    return api.post(`/notes/${noteId}/like?userId=${userId}`);
  },
  toggleSaveNote: async (noteId, userId) => {
    return api.post(`/notes/${noteId}/save?userId=${userId}`);
  },
  getNoteById: async (noteId) => {
    return api.get(`/notes/${noteId}`);
  },
  createNote: async (noteData) => {
    return api.post('/notes', noteData);
  },
  deleteNote: async (noteId, userId) => {
    return api.delete(`/notes/${noteId}?userId=${userId}`);
  },
  // Replies
  getReplies: async (noteId) => {
    return api.get(`/replies/note/${noteId}`);
  },
  createReply: async (replyData) => {
    return api.post('/replies', replyData);
  },
};
