import { api } from './api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const notificationService = {
  // SSE connection stream url
  getStreamUrl: (userId) => `${BASE_URL}/notifications/stream/${userId}`,

  // Fetch persisted notifications
  getNotifications: async (userId, limit = 20) => {
    return api.get(`/notifications/${userId}?limit=${limit}`);
  },

  // Get unread notification counter
  getUnreadCount: async (userId) => {
    return api.get(`/notifications/unread-count/${userId}`);
  },

  // Mark single alert as read
  markAsRead: async (notificationId, userId) => {
    return api.put(`/notifications/${notificationId}/read?userId=${userId}`, {});
  },

  // Mark single alert as unread
  markAsUnread: async (notificationId, userId) => {
    return api.put(`/notifications/${notificationId}/unread?userId=${userId}`, {});
  },

  // Delete single notification
  deleteNotification: async (notificationId, userId) => {
    return api.delete(`/notifications/${notificationId}?userId=${userId}`);
  },

  // Mark all as read
  markAllAsRead: async (userId) => {
    return api.put(`/notifications/read-all/${userId}`, {});
  },
};
