import { api } from './api';

export const noteService = {
  getPublicFeed: async () => {
    return api.get('/notes/feed/public');
  },
  getFriendsFeed: async (userId) => {
    return api.get(`/notes/feed/friends?userId=${userId}`);
  },
  getUserNotes: async (userId) => {
    return api.get(`/notes/user/${userId}`);
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
