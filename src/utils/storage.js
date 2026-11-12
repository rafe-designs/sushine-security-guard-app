// src/utils/storage.js
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'user_token';
const USER_KEY = 'user_data';

export const getToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    }
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      return await AsyncStorage.getItem(TOKEN_KEY);
    }
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
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
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
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

export const getUser = async () => {
  try {
    let userStr;
    if (Platform.OS === 'web') {
      userStr = localStorage.getItem(USER_KEY);
    } else {
      try {
        userStr = await SecureStore.getItemAsync(USER_KEY);
      } catch (e) {
        userStr = await AsyncStorage.getItem(USER_KEY);
      }
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
    try {
      await SecureStore.setItemAsync(USER_KEY, userStr);
    } catch (e) {
      await AsyncStorage.setItem(USER_KEY, userStr);
    }
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
    try {
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (e) {
      await AsyncStorage.removeItem(USER_KEY);
    }
  } catch (error) {
    console.error('Error removing user data:', error);
  }
};