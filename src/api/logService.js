import apiClient from './client';

// Fetch all incident logs
export const getLogs = async () => {
  try {
    const response = await apiClient.get('/logs');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch logs:', error?.response?.data || error.message);
    throw error;
  }
};

// Save a new incident or geofence log
export const saveLog = async (logData) => {
  try {
    // Expects: { text, timestamp, type, coords: { latitude, longitude, address } }
    const response = await apiClient.post('/logs', logData);
    return response.data;
  } catch (error) {
    console.error('Failed to save log:', error?.response?.data || error.message);
    throw error;
  }
};