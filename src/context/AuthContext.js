// sunshine-security-app/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export const AuthContext = createContext();

// Change this to your PC's local IP (e.g., http://192.168.1.X:5001/api) or tunnel URL
export const API_BASE_URL = 'http://192.168.100.2:5001/api'; 

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure Axios defaults
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  if (userToken) {
    api.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
  }

  useEffect(() => {
    loadStoredToken();
  }, []);

  const loadStoredToken = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('userToken');
      const storedUser = await SecureStore.getItemAsync('userData');
      if (storedToken && storedUser) {
        setUserToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load credentials', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data;
    
    setUserToken(token);
    setUser(userData);

    await SecureStore.setItemAsync('userToken', token);
    await SecureStore.setItemAsync('userData', JSON.stringify(userData));
  };

  const register = async (operativeData) => {
    const response = await api.post('/auth/register', operativeData);
    const { token, user: userData } = response.data;

    setUserToken(token);
    setUser(userData);

    await SecureStore.setItemAsync('userToken', token);
    await SecureStore.setItemAsync('userData', JSON.stringify(userData));
  };

  const logout = async () => {
    setUserToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
  };

  return (
    <AuthContext.Provider value={{ user, userToken, loading, login, register, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
};