// src/api/client.js
import axios from 'axios';
import { getToken } from '../utils/storage';

// Point this at your backend (Android emulator: http://10.0.2.2:5001/api).
// For a release build this MUST be an https:// URL.
export const API_BASE_URL = 'http://192.168.100.2:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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

// If the server says the session is invalid, sign the user out instead of leaving them on a
// screen where every request silently fails. AuthContext registers the handler.
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