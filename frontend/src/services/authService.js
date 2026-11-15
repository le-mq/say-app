import { api } from './api';

export const authService = {
  loginWithGoogle: async (googlePayload) => {
    return api.post('/auth/google', googlePayload);
  },
  getProfile: async (userId) => {
    return api.get(`/users/${userId}`);
  },
  getUserByUsername: async (username) => {
    const clean = String(username).replace(/^@/, '').trim();
    return api.get(`/users/username/${encodeURIComponent(clean)}`);
  },
  updateProfile: async (userId, data) => {
    return api.put(`/users/${userId}`, data);
  },
  getStreakCalendar: async (userId, year = 2026, month = 11) => {
    return api.get(`/auth/streak/${userId}?year=${year}&month=${month}`);
  },
  deleteAccount: async (userId) => {
    return api.delete(`/users/${userId}`);
  },
};
