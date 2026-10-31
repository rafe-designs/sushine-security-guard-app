// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import apiClient, { API_BASE_URL, setUnauthorizedHandler } from '../api/client';
import { getToken, setToken, removeToken } from '../utils/storage';

export { API_BASE_URL }; // kept so any file importing it from here keeps working

export const AuthContext = createContext();

const USER_KEY = 'userData';
const LEGACY_TOKEN_KEY = 'userToken'; // the key the previous AuthContext wrote the token to

// The user object lives next to the token. (SecureStore does not exist on web.)
const saveUser = async (u) => {
  const json = JSON.stringify(u);
  if (Platform.OS === 'web') return localStorage.setItem(USER_KEY, json);
  return SecureStore.setItemAsync(USER_KEY, json);
};
const loadUser = async () => {
  const json = Platform.OS === 'web' ? localStorage.getItem(USER_KEY) : await SecureStore.getItemAsync(USER_KEY);
  return json ? JSON.parse(json) : null;
};
const clearUser = async () => {
  if (Platform.OS === 'web') return localStorage.removeItem(USER_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
};

const readableError = (err) =>
  err?.response?.data?.error ||
  (err?.request ? 'Cannot reach the server. Check your internet connection.' : err?.message) ||
  'Something went wrong.';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    try {
      await removeToken();
      await clearUser();
      if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
    } catch (e) {
      console.error('Failed clearing session', e);
    }
    setUserToken(null);
    setUser(null);
  }, []);

  // Any 401 from the server signs the user out cleanly.
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    (async () => {
      try {
        // One-time migration: the old AuthContext saved the token under 'userToken', but the API
        // client reads 'user_token'. Copy it across, replacing any stale value.
        if (Platform.OS !== 'web') {
          const legacy = await SecureStore.getItemAsync(LEGACY_TOKEN_KEY);
          if (legacy) {
            await setToken(legacy);
            await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
          }
        }

        let token = await getToken();
        // Old prototype builds saved a fake token. It can never be valid, so throw it away.
        if (token && token.startsWith('mock')) {
          await removeToken();
          token = null;
        }

        const storedUser = await loadUser();
        if (token && storedUser) {
          setUserToken(token);
          setUser(storedUser);
        } else if (token || storedUser) {
          await removeToken();
          await clearUser();
        }
      } catch (e) {
        console.error('Failed to restore session', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Save to storage securely while ensuring old session residue is wiped first
  const persistSession = async (token, userData) => {
    await removeToken();
    await clearUser();
    
    await setToken(token);
    await saveUser(userData);
    setUserToken(token);
    setUser(userData);
  };

  const login = useCallback(async (identifier, password) => {
    try {
      // Completely wipe prior session state before attempting authentication
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
      if (data.token && data.user) await persistSession(data.token, data.user);
      return data; // if your server later requires approval it can return {status:'pending'} with no token
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
      isLoading: loading, // alias for screens/navigators that use the old name
      login,
      register,
      logout: clearSession,
      api: apiClient, // the one shared, authenticated client
    }),
    [user, userToken, loading, login, register, clearSession]
  );

  return React.createElement(AuthContext.Provider, { value }, children);
};