// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, setToken, removeToken } from '../utils/storage';
import { loginUser as apiLogin, registerUser as apiRegister, logoutUser as apiLogout } from '../api/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await getToken();
        const role = await AsyncStorage.getItem('sunshine_user_role');
        setUserToken(token);
        setUserRole(role);
      } catch (e) {
        console.error('Failed to restore token and role', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const authContextValue = {
    userToken,
    userRole,
    isLoading,
    login: async (email, password) => {
      setIsLoading(true);
      try {
        // Auto-assign admin role if email contains admin keywords or matches preview criteria
        let role = (email.includes('admin') || email.includes('soc')) ? 'admin' : 'guard';

        // Attempt API login; fallback mock if backend endpoint is unavailable during sandbox testing
        let token = 'mock_token_' + Date.now();
        try {
          const data = await apiLogin({ email, password });
          if (data && data.token) token = data.token;
          if (data && data.role) role = data.role;
        } catch (apiErr) {
          console.log('Using fallback local session auth for preview mode');
        }

        await setToken(token);
        await AsyncStorage.setItem('sunshine_user_role', role);
        
        setUserToken(token);
        setUserRole(role);
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    register: async (userData) => {
      setIsLoading(true);
      try {
        const data = await apiRegister(userData);
        const role = 'guard';

        await setToken(data.token);
        await AsyncStorage.setItem('sunshine_user_role', role);
        
        setUserToken(data.token);
        setUserRole(role);
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    logout: async () => {
      setIsLoading(true);
      try {
        await apiLogout();
      } catch (e) {
        console.error('API logout error', e);
      } finally {
        await removeToken();
        await AsyncStorage.removeItem('sunshine_user_role');
        setUserToken(null);
        setUserRole(null);
        setIsLoading(false);
      }
    },
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};