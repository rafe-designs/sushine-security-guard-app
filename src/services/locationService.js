import * as Location from 'expo-location';

// Request GPS permissions from the device
export const requestLocationPermissions = async () => {
  try {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      throw new Error('Foreground location permission not granted');
    }

    // Optional: Request background permission if you want tracking when app is minimized
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

// Get current location immediately (used for Sign-In automatic mapping)
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

// Generate a random interval between 30 and 40 minutes (in milliseconds)
export const getRandomCheckInterval = () => {
  const minMinutes = 30;
  const maxMinutes = 40;
  const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
  return randomMinutes * 60 * 1000; // Convert minutes to milliseconds
};