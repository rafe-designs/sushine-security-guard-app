import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { saveLog } from './logService';

const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TRACKING';

// Define the background task handler to alert if guard drifts off beat
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const latestLocation = locations[0];

    if (latestLocation) {
      const { latitude, longitude } = latestLocation.coords;
      
      // Target Beat Configuration (Sunshine Security HQ)
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

// Helper math function for distance check inside task manager
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of the earth in meters
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

// Request GPS permissions from the device
export const requestLocationPermissions = async () => {
  try {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      throw new Error('Foreground location permission not granted');
    }

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

// Get current location immediately
export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error fetching current location:', error);
    return null;
  }
};

// Start background location updates
export const startBackgroundTracking = async () => {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return;

    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (!isRegistered) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000, // Check every 1 minute
        distanceInterval: 10, // Or every 10 meters moved
        foregroundService: {
          notificationTitle: "Sunshine Security Active",
          notificationBody: "Monitoring field guard location boundary...",
          notificationColor: "#16a34a",
        },
      });
    }
  } catch (err) {
    console.error('Failed to start background location tracking:', err);
  }
};

// Stop background location updates
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

// Generate a random interval between 30 and 40 minutes (in milliseconds)
export const getRandomCheckInterval = () => {
  const minMinutes = 30;
  const maxMinutes = 40;
  const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
  return randomMinutes * 60 * 1000;
};