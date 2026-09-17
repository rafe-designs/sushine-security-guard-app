import React, { createContext, useState, useEffect } from 'react';
import { getToken, setToken, removeToken } from '../utils/storage';
import { loginUser as apiLogin, registerUser as apiRegister, logoutUser as apiLogout } from '../api/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on app startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await getToken();
        setUserToken(token);
      } catch (e) {
        console.error('Failed to restore token', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const authContextValue = {
    userToken,
    isLoading,
    login: async (email, password) => {
      setIsLoading(true);
      try {
        const data = await apiLogin({ email, password });
        await setToken(data.token);
        setUserToken(data.token);
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
        await setToken(data.token);
        setUserToken(data.token);
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
        setUserToken(null);
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