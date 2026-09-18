import apiClient from './client';

// Start a shift
export const startShift = async (guardId) => {
  try {
    const response = await apiClient.post('/shift/start', { guardId });
    return response.data;
  } catch (error) {
    console.error('Failed to start shift:', error?.response?.data || error.message);
    throw error;
  }
};

// End a shift
export const endShift = async (shiftId, totalDurationSeconds) => {
  try {
    const response = await apiClient.post(`/shift/end/${shiftId}`, { totalDurationSeconds });
    return response.data;
  } catch (error) {
    console.error('Failed to end shift:', error?.response?.data || error.message);
    throw error;
  }
};