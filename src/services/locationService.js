// src/services/locationService.js
import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client';
import { saveLog } from './logService';
import { SUNSHINE_LOCATIONS } from '../constants/locations';
import { calculateDistanceInMeters } from '../utils/locationHelper';

const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TRACKING';

// AsyncStorage keys (the background task has no access to React state, so it reads these)
const CONFIG_KEY = 'sunshine_tracking_config'; // { beat, shiftId, startedAt }
const STATE_KEY = 'sunshine_geofence_state'; // { outside: boolean }
const PING_QUEUE_KEY = 'sunshine_ping_queue'; // unsent pings
const USER_KEY = 'userData'; // same key AuthContext writes the user object to

// Tunables
const TIME_INTERVAL_MS = 60 * 1000; // at most one update per minute
const DISTANCE_INTERVAL_M = 15; // ...or after moving 15 metres
const MAX_ACCEPTABLE_ACCURACY_M = 100; // ignore worse fixes when deciding breach / return
const PING_QUEUE_MAX = 200;
const PING_FLUSH_BATCH = 20;
const LOCATION_TIMEOUT_MS = 15000;

// ---------- small storage helpers ----------

const readJson = async (key, fallback) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

const writeJson = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('locationService: storage write failed', key, e?.message);
  }
};

// ---------- beat (assigned site) resolution ----------

// Exact match only. Unknown sites return null so we never alert against the wrong place.
const findBeatByName = (siteName) => {
  const found = SUNSHINE_LOCATIONS.find(
    (loc) => loc.name.toLowerCase() === (siteName || '').toLowerCase()
  );
  if (!found) return null;
  return {
    name: found.name,
    latitude: found.latitude,
    longitude: found.longitude,
    allowedRadiusMeters: found.radiusMeters,
  };
};

const resolveBeatFromStoredUser = async () => {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    const user = raw ? JSON.parse(raw) : null;
    return findBeatByName(user?.assignedSite);
  } catch (e) {
    return null;
  }
};

// ---------- offline ping queue ----------

const queuePing = async (ping) => {
  const queue = await readJson(PING_QUEUE_KEY, []);
  queue.push(ping);
  await writeJson(PING_QUEUE_KEY, queue.slice(-PING_QUEUE_MAX));
};

// Sends queued pings oldest-first; stops at the first failure and keeps the rest.
export const flushPingQueue = async () => {
  const queue = await readJson(PING_QUEUE_KEY, []);
  if (!queue.length) return;

  let sent = 0;
  for (const ping of queue.slice(0, PING_FLUSH_BATCH)) {
    try {
      await apiClient.post('/pings', ping);
      sent += 1;
    } catch (e) {
      break;
    }
  }
  if (sent > 0) await writeJson(PING_QUEUE_KEY, queue.slice(sent));
};

// ---------- geofence logic ----------

// Logs once when the guard goes outside, and once when they come back (no spam on every update).
const evaluateGeofence = async ({ beat, distance, accuracy, latitude, longitude }) => {
  const acc = accuracy ?? 0;
  if (acc > MAX_ACCEPTABLE_ACCURACY_M) return; // fix too poor to judge

  const state = await readJson(STATE_KEY, { outside: false });
  const clearlyOutside = distance - acc > beat.allowedRadiusMeters;
  const clearlyInside = distance + acc <= beat.allowedRadiusMeters;
  const coords = { latitude, longitude };

  if (clearlyOutside && !state.outside) {
    await writeJson(STATE_KEY, { outside: true });
    await saveLog({
      text: `⚠️ GEOFENCE BREACH: Guard is ${Math.round(distance)}m from ${beat.name} (limit ${beat.allowedRadiusMeters}m).`,
      type: 'Warning',
      timestamp: new Date().toISOString(),
      coords,
    });
  } else if (clearlyInside && state.outside) {
    await writeJson(STATE_KEY, { outside: false });
    await saveLog({
      text: `Guard returned inside the ${beat.name} perimeter.`,
      type: 'Info',
      timestamp: new Date().toISOString(),
      coords,
    });
  }
};

// ---------- background task ----------
// Must be defined at module top level so the OS can run it when the app is not in the foreground.

if (Platform.OS !== 'web') {
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    try {
      if (error) {
        console.error('Background location task error:', error);
        return;
      }

      const locations = data?.locations;
      if (!locations || locations.length === 0) return;

      const config = await readJson(CONFIG_KEY, null);
      if (!config) {
        // The shift ended but updates were still registered: shut them down.
        await stopBackgroundTracking();
        return;
      }

      // Locations arrive oldest-first, so the newest fix is the last one.
      const loc = locations[locations.length - 1];
      const { latitude, longitude, accuracy } = loc.coords;
      const beat = config.beat || null;

      let distance = null;
      let isGeofenced = null;
      if (beat) {
        distance = calculateDistanceInMeters(latitude, longitude, beat.latitude, beat.longitude);
        isGeofenced = distance <= beat.allowedRadiusMeters;
      }

      const ping = {
        latitude,
        longitude,
        accuracy: accuracy ?? 0,
        isGeofenced,
        distanceFromBeat: distance == null ? null : Math.round(distance),
        mocked: !!loc.mocked, // Android reports mock-location apps here
        shiftId: config.shiftId || null,
        recordedAt: new Date(loc.timestamp || Date.now()).toISOString(),
      };

      try {
        await apiClient.post('/pings', ping);
        await flushPingQueue();
      } catch (err) {
        await queuePing(ping);
      }

      if (beat) {
        await evaluateGeofence({ beat, distance, accuracy, latitude, longitude });
      }
    } catch (err) {
      console.error('Background location task failed:', err);
    }
  });
}

// ---------- permissions ----------

export const requestLocationPermissions = async ({ background = true } = {}) => {
  try {
    let fg = await Location.getForegroundPermissionsAsync();
    if (fg.status !== 'granted') fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') return false;

    if (background) {
      let bg = await Location.getBackgroundPermissionsAsync();
      if (bg.status !== 'granted' && bg.canAskAgain !== false) {
        bg = await Location.requestBackgroundPermissionsAsync();
      }
      if (bg.status !== 'granted') {
        console.log('Background location not granted; tracking continues only while the foreground service runs.');
      }
    }
    return true;
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
};

// ---------- current position ----------

const withTimeout = (promise, ms) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Location request timed out')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const toResult = (pos) => ({
  latitude: pos.coords.latitude,
  longitude: pos.coords.longitude,
  accuracy: pos.coords.accuracy ?? null,
  mocked: !!pos.mocked,
  timestamp: pos.timestamp,
});

// Returns { latitude, longitude, accuracy, mocked, timestamp } or null.
// Callers that only use latitude/longitude keep working.
export const getCurrentLocation = async ({ allowLastKnown = false } = {}) => {
  try {
    const hasPermission = await requestLocationPermissions({ background: false });
    if (!hasPermission) return null;

    const pos = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      LOCATION_TIMEOUT_MS
    );
    return toResult(pos);
  } catch (error) {
    if (allowLastKnown) {
      try {
        const last = await Location.getLastKnownPositionAsync({ maxAge: 2 * 60 * 1000 });
        if (last) return { ...toResult(last), stale: true };
      } catch (e) {
        /* fall through */
      }
    }
    console.error('Error fetching current location:', error);
    return null;
  }
};

// ---------- start / stop ----------

// options.beat    : { name, latitude, longitude, allowedRadiusMeters } (optional; defaults to the signed-in user's assigned site)
// options.shiftId : id of the active shift (optional)
export const startBackgroundTracking = async (options = {}) => {
  if (Platform.OS === 'web') return false;

  try {
    const hasPermission = await requestLocationPermissions({ background: true });
    if (!hasPermission) return false;

    const beat = options.beat || (await resolveBeatFromStoredUser());
    if (!beat) {
      console.warn('locationService: no valid assigned site found; geofence alerts are disabled for this shift.');
    }

    await writeJson(CONFIG_KEY, {
      beat: beat || null,
      shiftId: options.shiftId || null,
      startedAt: new Date().toISOString(),
    });
    await writeJson(STATE_KEY, { outside: false });

    const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (!alreadyStarted) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: TIME_INTERVAL_MS,
        distanceInterval: DISTANCE_INTERVAL_M,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Sunshine Security Active',
          notificationBody: 'Shift in progress: location is being shared with your control room.',
          notificationColor: '#16a34a',
        },
      });
    }
    return true;
  } catch (err) {
    // Includes Android 14 foreground-service permission errors; never let this crash the app.
    console.error('Failed to start background location tracking:', err);
    return false;
  }
};

export const stopBackgroundTracking = async () => {
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  } catch (err) {
    console.error('Failed to stop background location tracking:', err);
  }
  try {
    await AsyncStorage.multiRemove([CONFIG_KEY, STATE_KEY]);
  } catch (e) {
    /* ignore */
  }
};