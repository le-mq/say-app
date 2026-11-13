import { api } from './api';

export const adminService = {
  getConfigs: async (adminId) => {
    return api.get(`/admin/configs?adminId=${adminId}`);
  },

  updateConfig: async (adminId, configKey, value) => {
    return api.put(`/admin/configs/${configKey}?adminId=${adminId}`, { value });
  },

  getUsers: async (adminId) => {
    return api.get(`/admin/users?adminId=${adminId}`);
  },

  updateUserRole: async (adminId, targetUserId, role) => {
    return api.put(`/admin/users/${targetUserId}/role?adminId=${adminId}`, { role });
  },

  getStats: async (adminId) => {
    return api.get(`/admin/stats?adminId=${adminId}`);
  },
};
