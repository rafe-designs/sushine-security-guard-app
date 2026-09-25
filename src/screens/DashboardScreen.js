// src/screens/DashboardScreen.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { getCurrentLocation, getRandomCheckInterval, startBackgroundTracking, stopBackgroundTracking } from '../services/locationService';
import { getReadableLocationName, calculateDistanceInMeters } from '../utils/locationHelper';
import { startShift, endShift } from '../api/shiftService';
import { saveLog, syncOfflineLogs } from '../services/logService';
import axios from 'axios';

export default function DashboardScreen() {
  const { logout } = useContext(AuthContext);
  
  const [assignedBeat, setAssignedBeat] = useState({
    name: 'Sunshine Security HQ',
    latitude: 6.65151, 
    longitude: 3.30982,
    allowedRadiusMeters: 100
  });

  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('Resolving exact address...');
  const [isOffBeat, setIsOffBeat] = useState(false);
  const [distanceFromBeat, setDistanceFromBeat] = useState(0);
  
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  const [activeShiftId, setActiveShiftId] = useState(null);
  const [shiftDuration, setShiftDuration] = useState('00:00:00');
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const [incidentNote, setIncidentNote] = useState('');
  const [logs, setLogs] = useState([]);

  const timerRef = useRef(null);
  const randomCheckTimerRef = useRef(null);

  useEffect(() => {
    initializeGuardBeatAndLocation();
    syncOfflineLogs();
    checkExistingActiveShift();
  }, []);

  const checkExistingActiveShift = async () => {
    try {
      const activeShiftJson = await AsyncStorage.getItem('sunshine_active_shift');
      if (activeShiftJson) {
        const shift = JSON.parse(activeShiftJson);
        setActiveShiftId(shift._id);
        setClockInTime(new Date(shift.clockInTime));
        setIsClockedIn(true);
      }
    } catch (e) {
      console.error('Error checking active shift storage', e);
    }
  };

  const initializeGuardBeatAndLocation = async () => {
    setLoadingLocation(true);
    const coords = await getCurrentLocation();
    
    if (coords) {
      setLocation(coords);
      try {
        const name = await getReadableLocationName(coords.latitude, coords.longitude);
        setLocationName(name);
        setIsOnline(true);
      } catch (err) {
        setIsOnline(false);
        setLocationName('Offline Mode (Coordinates Active)');
      }

      const distance = calculateDistanceInMeters(
        coords.latitude, coords.longitude, assignedBeat.latitude, assignedBeat.longitude
      );

      setDistanceFromBeat(Math.round(distance));
      setIsOffBeat(distance > assignedBeat.allowedRadiusMeters);
    } else {
      Alert.alert('GPS Error', 'Unable to acquire satellite lock.');
    }
    setLoadingLocation(false);
  };

  useEffect(() => {
    let locationStreamInterval;
    if (isClockedIn && clockInTime) {
      timerRef.current = setInterval(() => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - new Date(clockInTime)) / 1000);
        
        const hours = String(Math.floor(diffInSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((diffInSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(diffInSeconds % 60).padStart(2, '0');

        setShiftDuration(`${hours}:${minutes}:${seconds}`);
      }, 1000);

      locationStreamInterval = setInterval(async () => {
        const coords = await getCurrentLocation();
        if (coords && activeShiftId) {
          try {
            await axios.patch(`http://192.168.100.2:5000/api/shift/location/${activeShiftId}`, {
              latitude: coords.latitude,
              longitude: coords.longitude
            });
          } catch (e) {
            console.log('Background GPS stream sync pending...');
          }
        }
      }, 10000);

      scheduleNextRandomCheck();
    } else {
      clearInterval(timerRef.current);
      if (randomCheckTimerRef.current) clearTimeout(randomCheckTimerRef.current);
    }

    return () => {
      clearInterval(timerRef.current);
      if (randomCheckTimerRef.current) clearTimeout(randomCheckTimerRef.current);
      clearInterval(locationStreamInterval);
    };
  }, [isClockedIn, clockInTime, activeShiftId]);

  const scheduleNextRandomCheck = () => {
    const intervalMs = getRandomCheckInterval();
    randomCheckTimerRef.current = setTimeout(async () => {
      const coords = await getCurrentLocation();
      if (coords) {
        setLocation(coords);
        setLastCheckTime(new Date().toLocaleTimeString());
        
        const distance = calculateDistanceInMeters(
          coords.latitude, coords.longitude, assignedBeat.latitude, assignedBeat.longitude
        );

        if (distance > assignedBeat.allowedRadiusMeters) {
          setIsOffBeat(true);
          const warningLog = {
            text: `⚠️ SYSTEM FLAG: Guard drifted outside ${assignedBeat.name} perimeter (${Math.round(distance)}m)!`,
            type: 'Warning',
            timestamp: new Date().toISOString(),
            coords: { lat: coords.latitude, lon: coords.longitude }
          };
          
          await saveLog(warningLog);
          setLogs(prev => [{ time: new Date().toLocaleTimeString(), note: warningLog.text, isWarning: true }, ...prev]);
        } else {
          syncOfflineLogs(); 
        }
      }
      if (isClockedIn) scheduleNextRandomCheck();
    }, intervalMs);
  };

  const handleAddLog = async () => {
    if (!incidentNote.trim()) return;

    const logPayload = {
      text: incidentNote,
      type: 'Incident',
      timestamp: new Date().toISOString(),
      coords: location ? { lat: location.latitude, lon: location.longitude } : null
    };

    try {
      await saveLog(logPayload);
      setLogs([{ time: new Date().toLocaleTimeString(), note: incidentNote, isWarning: false }, ...logs]);
      setIncidentNote('');
      setIsOnline(true);
      Alert.alert('Transmitted', 'Incident log successfully saved to MongoDB Atlas.');
    } catch (error) {
      setIsOnline(false);
      setLogs([{ time: new Date().toLocaleTimeString(), note: incidentNote, isWarning: false }, ...logs]);
      setIncidentNote('');
      Alert.alert('Offline Vault Saved', 'Network unavailable. Log secured locally.');
    }
  };

  const handleClockIn = async () => {
    if (isOffBeat) {
      Alert.alert('Deployment Restricted', `You are ${distanceFromBeat}m away from your assigned beat. Cannot clock in.`);
      return;
    }

    setIsActionLoading(true);
    try {
      const activeShift = await startShift('Guard-Default');
      await AsyncStorage.setItem('sunshine_active_shift', JSON.stringify(activeShift));

      setActiveShiftId(activeShift._id);
      setClockInTime(new Date(activeShift.clockInTime || Date.now()));
      setIsClockedIn(true);
      await startBackgroundTracking();

      Alert.alert('Success', 'Clocked In & Shift Registered on MongoDB Atlas.');
    } catch (error) {
      Alert.alert('Connection Error', 'Could not reach backend server to start shift.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setIsActionLoading(true);
    const now = new Date();
    const activeShiftJson = await AsyncStorage.getItem('sunshine_active_shift');
    
    let shiftId = activeShiftId;
    let startTime = clockInTime;

    if (activeShiftJson) {
      const activeShift = JSON.parse(activeShiftJson);
      shiftId = activeShift._id || activeShiftId;
      startTime = activeShift.clockInTime ? new Date(activeShift.clockInTime) : clockInTime;
    }

    const totalDurationSeconds = startTime ? Math.max(0, Math.floor((now - new Date(startTime)) / 1000)) : 0;
    const totalMinutes = Math.floor(totalDurationSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    try {
      if (shiftId) {
        await endShift(shiftId, totalDurationSeconds);
      }
    } catch (networkError) {
      console.log('Network unreachable during clock-out. Executing offline-safe local closure.');
    }

    await AsyncStorage.removeItem('sunshine_active_shift');
    try {
      await stopBackgroundTracking();
    } catch (e) {}

    setIsClockedIn(false);
    setActiveShiftId(null);
    setShiftDuration('00:00:00');
    setClockInTime(null);
    setLogs([]);
    setIsActionLoading(false);

    Alert.alert(
      'Shift Ended', 
      `Shift successfully closed.\nTotal Time: ${hours}h ${minutes}m`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Clean, well-padded header to sit below mobile status bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sunshine Security</Text>
        <View style={styles.headerRight}>
          <View style={[styles.netBadge, { backgroundColor: isOnline ? '#dcfce7' : '#fee2e2' }]}>
            <Text style={[styles.netText, { color: isOnline ? '#166534' : '#dc2626' }]}>
              {isOnline ? '🟢 Online' : '🔴 Offline'}
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assigned Beat Verification</Text>
          {loadingLocation ? (
            <ActivityIndicator size="small" color="#0284c7" style={{ marginTop: 10 }} />
          ) : location ? (
            <View>
              <Text style={styles.targetBeatText}>🎯 Target Beat: {assignedBeat.name}</Text>
              <Text style={styles.currentLocText}>📍 Current GPS Address: {locationName}</Text>
              
              <View style={[styles.badge, isOffBeat ? styles.badgeDanger : styles.badgeSuccess]}>
                <Text style={styles.badgeText}>
                  {isOffBeat ? `⚠️ LOITERING DETECTED (${distanceFromBeat}m away)` : `✅ ON-BEAT (${distanceFromBeat}m from station)`}
                </Text>
              </View>
              {lastCheckTime && <Text style={styles.lastCheck}>Last verified: {lastCheckTime}</Text>}
            </View>
          ) : (
            <TouchableOpacity onPress={initializeGuardBeatAndLocation} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry GPS Fix</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shift Timer</Text>
          <Text style={[styles.timerText, isClockedIn ? styles.activeTimer : styles.inactiveTimer]}>
            {shiftDuration}
          </Text>
          <Text style={styles.shiftStatusLabel}>
            Status: <Text style={{ fontWeight: 'bold', color: isClockedIn ? '#16a34a' : '#dc2626' }}>
              {isClockedIn ? 'Clocked In (Active)' : 'Clocked Out'}
            </Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Live Dispatch & Incident Stream</Text>
          <TextInput
            style={styles.input}
            placeholder="Report incident or checkpoint check..."
            placeholderTextColor="#94a3b8"
            value={incidentNote}
            onChangeText={setIncidentNote}
          />
          <TouchableOpacity style={styles.logSubmitBtn} onPress={handleAddLog}>
            <Text style={styles.logSubmitText}>Transmit Log Entry (Instant)</Text>
          </TouchableOpacity>

          <View style={styles.logStreamContainer}>
            {logs.length === 0 ? (
              <Text style={styles.noLogsText}>No incidents recorded yet.</Text>
            ) : (
              logs.map((item, index) => (
                <View key={index} style={[styles.logItem, item.isWarning && styles.warningLogItem]}>
                  <Text style={styles.logTime}>[{item.time}]</Text>
                  <Text style={[styles.logText, item.isWarning && styles.warningLogText]}>{item.note}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {!isClockedIn ? (
            <TouchableOpacity 
              style={[styles.clockInButton, (isOffBeat || isActionLoading) && styles.disabledButton]} 
              onPress={handleClockIn}
              disabled={isOffBeat || isActionLoading}
            >
              {isActionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>CLOCK IN</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.clockOutButton, isActionLoading && styles.disabledButton]} 
              onPress={handleClockOut}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>CLOCK OUT & SUBMIT REPORT</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0',
    marginTop: Platform.OS === 'android' ? 24 : 0 // Safe clearance below Android status bar
  },
  headerTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  netBadge: { paddingVertical: 4, paddingHorizontal: 6, borderRadius: 4 },
  netText: { fontSize: 9, fontWeight: 'bold' },
  logoutButton: { paddingVertical: 5, paddingHorizontal: 8, backgroundColor: '#fee2e2', borderRadius: 4 },
  logoutText: { color: '#dc2626', fontWeight: 'bold', fontSize: 11 },
  content: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 10 },
  targetBeatText: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 4 },
  currentLocText: { fontSize: 13, color: '#64748b', marginBottom: 10 },
  badge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  badgeSuccess: { backgroundColor: '#dcfce7' },
  badgeDanger: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#166534' },
  lastCheck: { fontSize: 11, color: '#94a3b8', marginTop: 8 },
  retryButton: { padding: 10, backgroundColor: '#e0f2fe', borderRadius: 6, alignItems: 'center' },
  retryText: { color: '#0284c7', fontWeight: 'bold' },
  timerText: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 },
  activeTimer: { color: '#16a34a' },
  inactiveTimer: { color: '#94a3b8' },
  shiftStatusLabel: { textAlign: 'center', fontSize: 14, color: '#475569' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, marginBottom: 10, color: '#0f172a', backgroundColor: '#f8fafc' },
  logSubmitBtn: { backgroundColor: '#0284c7', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  logSubmitText: { color: '#fff', fontWeight: 'bold' },
  logStreamContainer: { backgroundColor: '#0f172a', borderRadius: 8, padding: 12, maxHeight: 180 },
  noLogsText: { color: '#94a3b8', fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
  logItem: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  warningLogItem: { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 4, paddingHorizontal: 4 },
  logTime: { color: '#38bdf8', fontWeight: 'bold', fontSize: 12, marginRight: 8 },
  logText: { color: '#f8fafc', fontSize: 12, flex: 1 },
  warningLogText: { color: '#fca5a5', fontWeight: 'bold' },
  buttonContainer: { marginTop: 5 },
  clockInButton: { backgroundColor: '#16a34a', borderRadius: 10, paddingVertical: 18, alignItems: 'center' },
  disabledButton: { backgroundColor: '#94a3b8', opacity: 0.7 },
  clockOutButton: { backgroundColor: '#dc2626', borderRadius: 10, paddingVertical: 18, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
});