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

export default function DashboardScreen() {
  const { logout } = useContext(AuthContext);
  
  // Dynamic Assigned Beat State
  const [assignedBeat, setAssignedBeat] = useState({
    name: 'Loading assigned beat...',
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
  const [shiftDuration, setShiftDuration] = useState('00:00:00');
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  
  const [incidentNote, setIncidentNote] = useState('');
  const [logs, setLogs] = useState([]);

  const timerRef = useRef(null);
  const randomCheckTimerRef = useRef(null);

  // 1. Initialize Beat, Location, and attempt sync of any offline data on mount
  useEffect(() => {
    initializeGuardBeatAndLocation();
    syncOfflineLogs();
  }, []);

  const initializeGuardBeatAndLocation = async () => {
    setLoadingLocation(true);
    
    const fetchedBeatFromBackend = {
      name: 'Sunshine Security HQ',
      latitude: 6.65151, 
      longitude: 3.30982,
      allowedRadiusMeters: 100
    };

    setAssignedBeat(fetchedBeatFromBackend);

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
        coords.latitude, 
        coords.longitude, 
        fetchedBeatFromBackend.latitude, 
        fetchedBeatFromBackend.longitude
      );

      setDistanceFromBeat(Math.round(distance));
      if (distance > fetchedBeatFromBackend.allowedRadiusMeters) {
        setIsOffBeat(true);
      } else {
        setIsOffBeat(false);
      }
    } else {
      Alert.alert('GPS Error', 'Unable to acquire satellite lock.');
    }
    setLoadingLocation(false);
  };

  useEffect(() => {
    if (isClockedIn && clockInTime) {
      timerRef.current = setInterval(() => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - clockInTime) / 1000);
        
        const hours = String(Math.floor(diffInSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((diffInSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(diffInSeconds % 60).padStart(2, '0');

        setShiftDuration(`${hours}:${minutes}:${seconds}`);
      }, 1000);

      scheduleNextRandomCheck();
    } else {
      clearInterval(timerRef.current);
      if (randomCheckTimerRef.current) clearTimeout(randomCheckTimerRef.current);
    }

    return () => {
      clearInterval(timerRef.current);
      if (randomCheckTimerRef.current) clearTimeout(randomCheckTimerRef.current);
    };
  }, [isClockedIn, clockInTime]);

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
          setLogs(prev => [{
            time: new Date().toLocaleTimeString(),
            note: warningLog.text,
            isWarning: true
          }, ...prev]);
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
      
      const displayLog = {
        time: new Date().toLocaleTimeString(),
        note: incidentNote,
        isWarning: false
      };

      setLogs([displayLog, ...logs]);
      setIncidentNote('');
      setIsOnline(true);
      Alert.alert('Transmitted', 'Incident log successfully saved to MongoDB Atlas.');
    } catch (error) {
      setIsOnline(false);
      const displayLog = {
        time: new Date().toLocaleTimeString(),
        note: incidentNote,
        isWarning: false
      };
      setLogs([displayLog, ...logs]);
      setIncidentNote('');
      Alert.alert('Offline Vault Saved', 'Network unavailable. Log secured locally and will auto-sync when data is restored.');
    }
  };

  const handleClockIn = async () => {
    if (isOffBeat) {
      Alert.alert('Deployment Restricted', `You are ${distanceFromBeat}m away from your assigned beat (${assignedBeat.name}). You cannot clock in from an unauthorized location.`);
      return;
    }

    try {
      const activeShift = await startShift('Guard-Default');
      await AsyncStorage.setItem('sunshine_active_shift', JSON.stringify(activeShift));

      // Start background monitoring service when shift begins
      await startBackgroundTracking();

      setClockInTime(new Date());
      setIsClockedIn(true);
      Alert.alert('Success', 'Clocked In & Shift Registered on MongoDB Atlas.');
    } catch (error) {
      Alert.alert('Connection Error', 'Could not reach backend server to start shift.');
    }
  };

  const handleClockOut = async () => {
    try {
      const activeShiftJson = await AsyncStorage.getItem('sunshine_active_shift');
      if (!activeShiftJson) {
        Alert.alert('Error', 'No active shift found in local storage.');
        return;
      }

      const activeShift = JSON.parse(activeShiftJson);
      const shiftId = activeShift._id;

      const clockOutTime = new Date();
      const totalMilliseconds = clockOutTime - clockInTime;
      const totalDurationSeconds = Math.floor(totalMilliseconds / 1000);

      await endShift(shiftId, totalDurationSeconds);
      await AsyncStorage.removeItem('sunshine_active_shift');

      // Stop background tracking when shift ends
      await stopBackgroundTracking();

      const totalMinutes = Math.floor(totalDurationSeconds / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const seconds = totalDurationSeconds % 60;

      setIsClockedIn(false);
      Alert.alert(
        'Shift Ended',
        `Shift successfully logged for ${assignedBeat.name}.\nTotal Time: ${hours}h ${minutes}m ${seconds}s`,
        [{ text: 'OK' }]
      );

      setShiftDuration('00:00:00');
      setClockInTime(null);
      setLogs([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to sync clock-out with backend server.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sunshine Security Portal</Text>
        <View style={styles.headerRight}>
          <View style={[styles.netBadge, { backgroundColor: isOnline ? '#dcfce7' : '#fee2e2' }]}>
            <Text style={[styles.netText, { color: isOnline ? '#166534' : '#dc2626' }]}>
              {isOnline ? '🟢 Online' : '🔴 Offline Vault'}
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Assigned Beat Card */}
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
                  {isOffBeat ? `⚠️ LOITERING DETECTED (${distanceFromBeat}m away from beat)` : `✅ ON-BEAT (${distanceFromBeat}m from station)`}
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

        {/* Shift Timer Card */}
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

        {/* Live Dispatch & Incident Stream */}
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
                  <Text style={[styles.logText, item.isWarning && styles.warningLogText]}>
                    {item.note}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          {!isClockedIn ? (
            <TouchableOpacity 
              style={[styles.clockInButton, isOffBeat && styles.disabledButton]} 
              onPress={handleClockIn}
            >
              <Text style={styles.buttonText}>CLOCK IN</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.clockOutButton} onPress={handleClockOut}>
              <Text style={styles.buttonText}>CLOCK OUT & SUBMIT REPORT</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  netBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
  netText: { fontSize: 10, fontWeight: 'bold' },
  logoutButton: { paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#fee2e2', borderRadius: 4 },
  logoutText: { color: '#dc2626', fontWeight: 'bold', fontSize: 12 },
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
  disabledButton: { backgroundColor: '#94a3b8', opacity: '0.7' },
  clockOutButton: { backgroundColor: '#dc2626', borderRadius: 10, paddingVertical: 18, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
});