import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const getToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('user_token');
    }
    return await SecureStore.getItemAsync('user_token');
  } catch (error) {
    console.error('Error fetching token', error);
    return null;
  }
};

export const setToken = async (token) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem('user_token', token);
      return;
    }
    await SecureStore.setItemAsync('user_token', token);
  } catch (error) {
    console.error('Error saving token', error);
  }
};

export const removeToken = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem('user_token');
      return;
    }
    await SecureStore.deleteItemAsync('user_token');
  } catch (error) {
    console.error('Error removing token', error);
  }
};