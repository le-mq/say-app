import { api } from './api';

export const socialService = {
  getFriendsList: async (userId) => {
    return api.get(`/social/friends/${userId}`);
  },
  getPendingRequests: async (userId) => {
    return api.get(`/social/requests/pending/${userId}`);
  },
  sendFriendRequest: async (requesterId, addresseeId) => {
    return api.post('/social/request', { requesterId, addresseeId });
  },
  acceptFriendRequest: async (friendshipId, currentUserId) => {
    return api.put(`/social/request/${friendshipId}/accept?currentUserId=${currentUserId}`, {});
  },
  rejectFriendRequest: async (friendshipId, currentUserId) => {
    return api.put(`/social/request/${friendshipId}/reject?currentUserId=${currentUserId}`, {});
  },
  removeFriend: async (friendshipId, currentUserId) => {
    return api.delete(`/social/friends/${friendshipId}?currentUserId=${currentUserId}`);
  },
};
