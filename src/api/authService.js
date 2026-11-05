// src/services/authService.js
import apiClient from '../api/client';
import { setToken, removeToken } from '../utils/storage';

// Dynamic Sign Up Service
export const registerUser = async (userData) => {
  try {
    const { data } = await apiClient.post('/auth/register', userData);
    
    if (data.token) {
      await setToken(data.token);
    }
    return data;
  } catch (error) {
    console.error('Register Error:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
    throw { message: errorMessage };
  }
};

// Dynamic Sign In Service
export const loginUser = async (credentials) => {
  try {
    if (!credentials.email && !credentials.identifier && !credentials.phone) {
      throw new Error('Email, phone, or identifier is required');
    }
    if (!credentials.password) {
      throw new Error('Password is required');
    }

    const { data } = await apiClient.post('/auth/login', credentials);
    
    if (data.token) {
      await setToken(data.token);
    }
    return data;
  } catch (error) {
    console.error('Login Error:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Login failed';
    throw { message: errorMessage };
  }
};

// Sign Out Service
export const logoutUser = async () => {
  try {
    await removeToken();
  } catch (error) {
    console.error('Logout error:', error);
  }
};