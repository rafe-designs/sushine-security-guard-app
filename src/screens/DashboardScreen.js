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
import { AuthContext } from '../context/AuthContext';
import { getCurrentLocation, getRandomCheckInterval } from '../services/locationService';
import { getReadableLocationName, calculateDistanceInMeters } from '../utils/locationHelper';
import { submitShiftReport } from '../api/shiftService';

export default function DashboardScreen() {
  const { logout } = useContext(AuthContext);
  
  // Dynamic Assigned Beat State (Fetched from backend/guard profile)
  const [assignedBeat, setAssignedBeat] = useState({
    name: 'Loading assigned beat...',
    latitude: 6.4531, // Correct Apapa baseline coordinates
    longitude: 3.3670,
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
  
  const [incidentNote, setIncidentNote] = useState('');
  const [logs, setLogs] = useState([]);

  const timerRef = useRef(null);
  const randomCheckTimerRef = useRef(null);

  // 1. Fetch Guard's Assigned Beat and verify location on mount
  useEffect(() => {
    initializeGuardBeatAndLocation();
  }, []);

  const initializeGuardBeatAndLocation = async () => {
    setLoadingLocation(true);
    
    // Simulated dynamic backend response for the guard's assigned beat
    const fetchedBeatFromBackend = {
      name: 'Beni Gold Facility, Apapa Port Phase 2',
      latitude: 6.4531, 
      longitude: 3.3670,
      allowedRadiusMeters: 100
    };

    setAssignedBeat(fetchedBeatFromBackend);

    const coords = await getCurrentLocation();
    
    if (coords) {
      setLocation(coords);
      const name = await getReadableLocationName(coords.latitude, coords.longitude);
      setLocationName(name);

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
          setLogs(prev => [{ time: new Date().toLocaleTimeString(), note: `⚠️ SYSTEM FLAG: Guard drifted outside ${assignedBeat.name} perimeter!`, isWarning: true }, ...prev]);
        }
      }
      if (isClockedIn) scheduleNextRandomCheck();
    }, intervalMs);
  };

  const handleAddLog = () => {
    if (!incidentNote.trim()) return;
    const newLog = {
      time: new Date().toLocaleTimeString(),
      note: incidentNote,
      isWarning: false,
    };
    setLogs([newLog, ...logs]);
    setIncidentNote('');
  };

  const handleClockIn = () => {
    if (isOffBeat) {
      Alert.alert('Deployment Restricted', `You are ${distanceFromBeat}m away from your assigned beat (${assignedBeat.name}). You cannot clock in from an unauthorized location.`);
      return;
    }
    setClockInTime(new Date());
    setIsClockedIn(true);
    Alert.alert('Success', 'Clocked In. Dynamic geofence active.');
  };

  const handleClockOut = async () => {
    const clockOutTime = new Date();
    const totalMilliseconds = clockOutTime - clockInTime;
    const totalMinutes = Math.floor(totalMilliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Professional, decoupled backend payload structure
    const shiftReportPayload = {
      guardId: 'GUARD_AUTH_ID', 
      assignedBeatName: assignedBeat.name,
      clockInCoordinates: { lat: assignedBeat.latitude, lon: assignedBeat.longitude },
      clockOutCoordinates: { lat: location?.latitude, lon: location?.longitude },
      clockOutAddress: locationName,
      shiftDurationHours: hours,
      shiftDurationMinutes: minutes,
      incidentLogs: logs,
      status: 'COMPLETED'
    };

    console.log('Clean Shift Payload Ready for Backend:', shiftReportPayload);

    await submitShiftReport(shiftReportPayload);
    setIsClockedIn(false);
    
    Alert.alert(
      'Shift Ended',
      `Shift successfully logged for ${assignedBeat.name}.\nTotal Time: ${hours}h ${minutes}m`,
      [{ text: 'OK' }]
    );

    setShiftDuration('00:00:00');
    setClockInTime(null);
    setLogs([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sunshine Security Portal</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Dynamic Assigned Beat Card */}
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

        {/* Incident Log Stream */}
        {isClockedIn && (
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
              <Text style={styles.logSubmitText}>Transmit Log Entry</Text>
            </TouchableOpacity>

            <View style={styles.logStreamContainer}>
              {logs.length === 0 ? (
                <Text style={styles.noLogsText}>No incidents recorded during this shift.</Text>
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
        )}

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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  logoutButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#fee2e2', borderRadius: 6 },
  logoutText: { color: '#dc2626', fontWeight: 'bold', fontSize: 14 },
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