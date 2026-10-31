// src/utils/storage.js
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'user_token';
const USER_KEY = 'user_data';

// --- TOKEN MANAGEMENT ---

export const getToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error fetching token:', error);
    return null;
  }
};

export const setToken = async (token) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

export const removeToken = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// --- USER DATA MANAGEMENT ---

export const getUser = async () => {
  try {
    let userStr;
    if (Platform.OS === 'web') {
      userStr = localStorage.getItem(USER_KEY);
    } else {
      userStr = await SecureStore.getItemAsync(USER_KEY);
    }
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

export const setUser = async (user) => {
  try {
    const userStr = JSON.stringify(user);
    if (Platform.OS === 'web') {
      localStorage.setItem(USER_KEY, userStr);
      return;
    }
    await SecureStore.setItemAsync(USER_KEY, userStr);
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

export const removeUser = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(USER_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error('Error removing user data:', error);
  }
};

// --- CLEAR ALL SESSION DATA (ON SIGN-OUT) ---

export const clearSession = async () => {
  await removeToken();
  await removeUser();
};