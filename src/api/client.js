// src/api/client.js
import axios from 'axios';
import { getToken } from '../utils/storage';

// Hardcoded live cloud production URL (No frontend .env required)
export const API_BASE_URL = 'https://sunshine-security-app.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the saved JWT to every request.
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Error injecting token in request interceptor:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let unauthorizedHandler = null;
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = fn;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');
    if (status === 401 && !isAuthCall && unauthorizedHandler) {
      try {
        await unauthorizedHandler();
      } catch (e) {
        /* ignore */
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;