// src/services/locationService.js
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import apiClient from '../api/client';
import { saveLog } from './logService';

const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TRACKING';

// Define the background task handler to push pings & check perimeter drift
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const latestLocation = locations[0];

    if (latestLocation) {
      const { latitude, longitude, accuracy } = latestLocation.coords;
      
      try {
        // 1. Send live ping to backend server
        await apiClient.post('/pings', {
          latitude,
          longitude,
          accuracy: accuracy || 0,
          batteryLevel: 100, // Can integrate expo-battery if desired
          isGeofenced: true
        });
      } catch (err) {
        console.log('Background ping sync failed (offline):', err.message);
      }

      // 2. Target Beat Boundary Check
      const targetBeat = { latitude: 6.65151, longitude: 3.30982, allowedRadiusMeters: 100 };
      const distance = getDistanceFromLatLonInMeters(latitude, longitude, targetBeat.latitude, targetBeat.longitude);

      if (distance > targetBeat.allowedRadiusMeters) {
        await saveLog({
          text: `⚠️ BACKGROUND DRIFT ALERT: Guard drifted ${Math.round(distance)}m outside the perimeter!`,
          type: 'Warning',
          timestamp: new Date().toISOString(),
          coords: { lat: latitude, lon: longitude }
        });
      }
    }
  }
});

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

export const requestLocationPermissions = async () => {
  try {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') throw new Error('Foreground location permission not granted');

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.log('Background location permission not granted, tracking will only occur while app is active.');
    }
    return true;
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
};

export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return null;

    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { latitude: location.coords.latitude, longitude: location.coords.longitude };
  } catch (error) {
    console.error('Error fetching current location:', error);
    return null;
  }
};

export const startBackgroundTracking = async () => {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return;

    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (!isRegistered) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 300000, // Sync every 5 minutes
        distanceInterval: 15, // Or every 15 meters moved
        foregroundService: {
          notificationTitle: "Sunshine Security Active",
          notificationBody: "Monitoring field guard location & telemetry pings...",
          notificationColor: "#16a34a",
        },
      });
    }
  } catch (err) {
    console.error('Failed to start background location tracking:', err);
  }
};

export const stopBackgroundTracking = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  } catch (err) {
    console.error('Failed to stop background location tracking:', err);
  }
};