// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import apiClient, { API_BASE_URL, setUnauthorizedHandler } from '../api/client';
import { getToken, setToken, removeToken, getUser, setUser, removeUser } from '../utils/storage';

export { API_BASE_URL };

export const AuthContext = createContext();

const LEGACY_TOKEN_KEY = 'userToken';

const readableError = (err) =>
  err?.response?.data?.error ||
  (err?.request ? 'Cannot reach the server. Check your internet connection.' : err?.message) ||
  'Something went wrong.';

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    try {
      await removeToken();
      await removeUser();
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
      }
    } catch (e) {
      console.error('Failed clearing session', e);
    }
    setUserToken(null);
    setUserState(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (Platform.OS !== 'web') {
          const legacy = await SecureStore.getItemAsync(LEGACY_TOKEN_KEY);
          if (legacy) {
            await setToken(legacy);
            await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
          }
        }

        let token = await getToken();
        if (token && token.startsWith('mock')) {
          await removeToken();
          token = null;
        }

        const storedUser = await getUser();
        if (isMounted) {
          if (token && storedUser) {
            setUserToken(token);
            setUserState(storedUser);
          } else if (token || storedUser) {
            await removeToken();
            await removeUser();
          }
        }
      } catch (e) {
        console.error('Failed to restore session', e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const persistSession = async (token, userData) => {
    await removeToken();
    await removeUser();
    
    await setToken(token);
    await setUser(userData);
    setUserToken(token);
    setUserState(userData);
  };

  const login = useCallback(async (identifier, password) => {
    try {
      await clearSession();
      const { data } = await apiClient.post('/auth/login', { identifier: String(identifier).trim(), password });
      await persistSession(data.token, data.user);
    } catch (err) {
      throw new Error(readableError(err));
    }
  }, [clearSession]);

  const register = useCallback(async (operativeData) => {
    try {
      await clearSession();
      const { data } = await apiClient.post('/auth/register', operativeData);
      if (data.token && data.user) {
        await persistSession(data.token, data.user);
      }
      return data;
    } catch (err) {
      throw new Error(readableError(err));
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      userToken,
      userRole: user ? user.role : null,
      loading,
      isLoading: loading,
      login,
      register,
      logout: clearSession,
      api: apiClient,
    }),
    [user, userToken, loading, login, register, clearSession]
  );

  return React.createElement(AuthContext.Provider, { value }, children);
};