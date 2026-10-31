// src/api/shiftService.js
import apiClient from './client';

// Start a shift
export const startShift = async (payload) => {
  try {
    const response = await apiClient.post('/shifts/start', payload);
    return response.data;
  } catch (error) {
    console.error('Failed to start shift:', error?.response?.data || error.message);
    throw error;
  }
};

// End a shift
export const endShift = async (shiftId, totalDurationSeconds) => {
  try {
    const response = await apiClient.post('/shifts/end', { shiftId, totalDurationSeconds });
    return response.data;
  } catch (error) {
    console.error('Failed to end shift:', error?.response?.data || error.message);
    throw error;
  }
};