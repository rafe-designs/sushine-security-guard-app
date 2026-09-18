import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import apiClient from '../api/client';

const OFFLINE_LOGS_KEY = 'sunshine_offline_logs_queue';

// Fetch all incident logs from the backend
export const getLogs = async () => {
  try {
    const response = await apiClient.get('/logs');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch logs:', error?.response?.data || error.message);
    throw error;
  }
};

// Save a new log with offline fallback support
export const saveLog = async (logData) => {
  const netStatus = await NetInfo.fetch();

  if (!netStatus.isConnected) {
    await storeLogLocally(logData);
    return { success: false, offline: true, message: 'Saved log offline for sync later.' };
  }

  try {
    // Attempt to sync pending logs first before sending the new one
    await syncOfflineLogs();

    const response = await apiClient.post('/logs', logData);
    return response.data;
  } catch (error) {
    console.warn('Network request failed, storing log offline:', error.message);
    await storeLogLocally(logData);
    return { success: false, offline: true, message: 'Saved log offline for sync later.' };
  }
};

// Helper to store unsent logs locally
const storeLogLocally = async (logData) => {
  try {
    const existing = await AsyncStorage.getItem(OFFLINE_LOGS_KEY);
    const logsQueue = existing ? JSON.parse(existing) : [];
    logsQueue.push({ ...logData, localTimestamp: new Date().toISOString() });
    await AsyncStorage.setItem(OFFLINE_LOGS_KEY, JSON.stringify(logsQueue));
  } catch (err) {
    console.error('Failed to write log to local storage:', err);
  }
};

// Background function to flush queued logs to MongoDB Atlas
export const syncOfflineLogs = async () => {
  try {
    const existing = await AsyncStorage.getItem(OFFLINE_LOGS_KEY);
    if (!existing) return;

    const logsQueue = JSON.parse(existing);
    if (logsQueue.length === 0) return;

    const netStatus = await NetInfo.fetch();
    if (!netStatus.isConnected) return;

    console.log(`Attempting to sync ${logsQueue.length} offline logs...`);

    const remainingQueue = [];
    for (const log of logsQueue) {
      try {
        await apiClient.post('/logs', log);
      } catch (err) {
        remainingQueue.push(log);
      }
    }

    await AsyncStorage.setItem(OFFLINE_LOGS_KEY, JSON.stringify(remainingQueue));
    if (remainingQueue.length === 0) {
      console.log('All offline logs successfully synced!');
    }
  } catch (err) {
    console.error('Error syncing offline logs:', err);
  }
};