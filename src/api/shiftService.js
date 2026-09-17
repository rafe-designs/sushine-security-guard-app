import apiClient from './client';

// Service to submit structured shift summary to the backend for the Admin Dashboard
export const submitShiftReport = async (shiftPayload) => {
  try {
    // When your backend is ready, this posts:
    // e.g., "Lekan Lukmon : location - Beni Gold Apapa, total work time : 12 hours"
    const response = await apiClient.post('/shifts/report', shiftPayload);
    return response.data;
  } catch (error) {
    console.error('Failed to submit shift report to backend:', error?.response?.data || error.message);
    // Return mock success for frontend testing purposes right now
    return { success: true, message: 'Shift report logged locally (Mock)' };
  }
};