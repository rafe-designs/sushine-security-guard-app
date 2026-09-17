import axios from 'axios';
import { getToken } from '../utils/storage';

// UPDATE THIS: Point to your actual backend API server port (e.g., 5000, 3000)
// Use 'http://10.0.2.2:5000/api' if running on an Android Emulator
const BASE_URL = 'http://localhost:5000/api'; 

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into requests if available
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error injecting token in request interceptor:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;