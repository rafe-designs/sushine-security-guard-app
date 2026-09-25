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

  // Check for existing token and user role on app startup
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
        // Determine role (Assign admin if email matches admin pattern or if backend provides it)
        let role = email.trim().toLowerCase() === 'admin@sunshine.com' ? 'admin' : 'guard';

        const data = await apiLogin({ email, password });
        
        // If your backend API returns a specific role object, use it
        if (data && data.role) {
          role = data.role;
        }

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
    register: async (userData) => {
      setIsLoading(true);
      try {
        const data = await apiRegister(userData);
        const role = 'guard'; // Default new signups to guard role

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