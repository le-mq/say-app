import axios from 'axios';
import { toast } from 'react-toastify';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach authentication token if available (session-scoped)
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('say_session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Unpack ApiResponse<T> data & handle errors gracefully
apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data;
    // Spring Boot standard ApiResponse format
    if (payload && typeof payload.success === 'boolean') {
      if (!payload.success) {
        toast.error(payload.message || 'Something went wrong. Please try again.');
        return Promise.reject(new Error(payload.message || 'Something went wrong. Please try again.'));
      }
      return payload.data;
    }
    return payload;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Network error occurred';
    console.error(`[API Error] ${error.config?.url}:`, message);
    return Promise.reject(new Error(message));
  }
);

export const api = {
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),
};
