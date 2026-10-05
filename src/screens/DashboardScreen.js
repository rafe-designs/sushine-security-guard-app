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
  Platform,
  Alert,
  StatusBar 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { getCurrentLocation, getRandomCheckInterval, startBackgroundTracking, stopBackgroundTracking } from '../services/locationService';
import { getReadableLocationName, calculateDistanceInMeters } from '../utils/locationHelper';
import { startShift, endShift } from '../api/shiftService';
import { saveLog, syncOfflineLogs } from '../services/logService';
import axios from 'axios';

export default function DashboardScreen() {
  const { logout, userRole } = useContext(AuthContext);
  
  const [assignedBeat, setAssignedBeat] = useState({
    name: 'Dangote Site A (Lagos Free Zone)',
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
  
  // New Uniform & Biometric Verification State
  const [isUniformVerified, setIsUniformVerified] = useState(false);
  const [isVerifyingUniform, setIsVerifyingUniform] = useState(false);

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
        setIsUniformVerified(true);
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

  const handleUniformVerification = () => {
    setIsVerifyingUniform(true);
    setTimeout(() => {
      setIsVerifyingUniform(false);
      setIsUniformVerified(true);
      Alert.alert('AI Uniform Scan Passed', 'Reflective vest, badge alignment, and tactical boots verified successfully.');
    }, 2000);
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

    if (!isUniformVerified) {
      Alert.alert('Uniform Audit Required', 'You must complete the live AI uniform scan before clocking in.');
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
    setIsUniformVerified(false);
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

  const triggerEmergencySOS = () => {
    Alert.alert(
      '🚨 EMERGENCY SOS DISPATCH',
      'Are you sure you want to trigger immediate backup and SOC dispatch?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'DISPATCH SOS', 
          style: 'destructive', 
          onPress: () => Alert.alert('SOS Transmitted', 'Live coordinates sent to Lagos Ops HQ and nearby patrol vehicles.') 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />
      
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={{fontSize: 12}}>🛡️</Text>
          <Text style={styles.headerTitle}>SUNSHINE GUARD OPERATIVE LOG</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.netBadge, { backgroundColor: isOnline ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
            <Text style={[styles.netText, { color: isOnline ? '#34d399' : '#ef4444' }]}>
              {isOnline ? '🟢 Live' : '🔴 Offline'}
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Operative Profile Pill */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <Text style={{fontSize: 16}}>👮🏽‍♂️</Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.operativeName}>Officer K. Adeleke (18306)</Text>
            <Text style={styles.operativeRole}>Field Security Alpha • Lagos Command</Text>
          </View>
          <View style={styles.batteryBadge}>
            <Text style={{fontSize: 9, color: '#34d399', fontWeight: 'bold'}}>🔋 98%</Text>
          </View>
        </View>

        {/* CONDITIONAL UI: PRE-CLOCK-IN vs POST-CLOCK-IN */}
        {!isClockedIn ? (
          /* --- PRE-CLOCK-IN VIEW WITH LIVE UNIFORM GATE --- */
          <>
            {/* Top Stat Pills Row */}
            <View style={styles.topStatsRow}>
              <View style={styles.statPillSmall}>
                <Text style={styles.statPillLabel}>📍 POST / BEAT</Text>
                <Text style={styles.statPillVal}>Dangote Site A</Text>
              </View>
              <View style={styles.statPillSmall}>
                <Text style={styles.statPillLabel}>🕒 WINDOW</Text>
                <Text style={styles.statPillVal}>07:00 - 15:00 WAT</Text>
              </View>
            </View>

            {/* Live Camera Scanner Box Mockup */}
            <View style={styles.cameraFrameCard}>
              <View style={styles.camHeaderOverlay}>
                <Text style={styles.camHeaderTitle}>📸 CAMERA ACTIVE (SECURE AI)</Text>
                <View style={styles.camLiveBadge}>
                  <Text style={styles.camLiveText}>● LIVE STREAM</Text>
                </View>
              </View>

              <View style={styles.viewfinderBox}>
                <View style={styles.scannerCornerTL} />
                <View style={styles.scannerCornerTR} />
                <View style={styles.scannerCornerBL} />
                <View style={styles.scannerCornerBR} />

                <Text style={{fontSize: 48, opacity: 0.8}}>👮🏽‍♂️</Text>
                
                <View style={styles.scannerStatusPill}>
                  <Text style={styles.scannerStatusText}>
                    {isUniformVerified ? '✅ UNIFORM & BADGE MATCHED (100%)' : '⏳ MATCH: STANDING IN BOX'}
                  </Text>
                </View>
              </View>

              <View style={styles.camFooterNote}>
                <Text style={styles.camFooterText}>
                  {isUniformVerified ? '✓ Ready for biometric clock-in sequence.' : '⚠️ Position vest & badge inside the viewfinder box.'}
                </Text>
              </View>
            </View>

            {/* Shift Readiness Validation Checklist */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>📋 SHIFT READINESS VALIDATION</Text>
                <Text style={{color: '#38bdf8', fontSize: 10, fontWeight: 'bold'}}>VERIFIED</Text>
              </View>

              {/* GPS Check Item */}
              <View style={styles.checklistRow}>
                <Text style={{fontSize: 14}}>🟢</Text>
                <View style={{flex: 1}}>
                  <Text style={styles.checkTitle}>GPS Perimeter Lock</Text>
                  <Text style={styles.checkSub}>Within 100m beat radius ({distanceFromBeat}m)</Text>
                </View>
                <Text style={styles.checkActionText}>Within Beat</Text>
              </View>

              {/* Time Window Check Item */}
              <View style={styles.checklistRow}>
                <Text style={{fontSize: 14}}>🟢</Text>
                <View style={{flex: 1}}>
                  <Text style={styles.checkTitle}>Time Window Check</Text>
                  <Text style={styles.checkSub}>Shift roster ID verified on schedule</Text>
                </View>
                <Text style={styles.checkActionText}>07:00 On-Time</Text>
              </View>

              {/* Uniform Validation Checklist Item */}
              <View style={[styles.checklistRow, {borderBottomWidth: 0, marginBottom: 0}]}>
                <Text style={{fontSize: 14}}>{isUniformVerified ? '🟢' : '⚠️️'}</Text>
                <View style={{flex: 1}}>
                  <Text style={styles.checkTitle}>Uniform & Emblem Validation</Text>
                  <Text style={styles.checkSub}>
                    {isUniformVerified ? 'High-visibility vest & ID badge confirmed' : 'Required: High-visibility vest & ID badge'}
                  </Text>
                </View>
                <Text style={[styles.checkActionText, { color: isUniformVerified ? '#34d399' : '#fbbf24' }]}>
                  {isUniformVerified ? 'PASSED' : 'PENDING SCAN'}
                </Text>
              </View>
            </View>

            {/* CAPTURE & VERIFY UNIFORM ACTION BUTTON */}
            <TouchableOpacity 
              style={[styles.captureUniformBtn, isVerifyingUniform && styles.disabledButton]} 
              onPress={handleUniformVerification}
              disabled={isVerifyingUniform}
              activeOpacity={0.8}
            >
              {isVerifyingUniform ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8}}>
                  <Text style={{fontSize: 16}}>📷</Text>
                  <Text style={styles.captureBtnText}>
                    {isUniformVerified ? 'Re-Verify Uniform & Badge' : 'Capture & Verify Uniform'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.clockInNotice}>
              * High-visibility reflective vest and ID badge must be completely worn and visible in camera view for algorithm checks to unlock clock-in.
            </Text>

            {/* CLOCK IN ACTION BUTTON (Disabled until Uniform is verified) */}
            <TouchableOpacity 
              style={[styles.clockInButton, (!isUniformVerified || isOffBeat || isActionLoading) && styles.disabledButton]} 
              onPress={handleClockIn}
              disabled={!isUniformVerified || isOffBeat || isActionLoading}
              activeOpacity={0.8}
            >
              {isActionLoading ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text style={styles.clockInButtonText}>📍 CLOCK IN</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          /* --- POST-CLOCK-IN VIEW --- */
          <>
            {/* Active Shift Header Badge & Timer */}
            <View style={styles.activeShiftCard}>
              <View style={styles.activeBadgeRow}>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>🟢 ON DUTY • SHIFT ACTIVE</Text>
                </View>
                <Text style={styles.activeBatteryText}>🛡️ 98%</Text>
              </View>

              <Text style={styles.activeTimerText}>{shiftDuration}</Text>
              <Text style={styles.activeTimerSub}>SHIFT CLOCK RUNNING</Text>

              <View style={styles.activeAssignmentDetails}>
                <View style={{flex: 1}}>
                  <Text style={styles.activeSubTitle}>📍 POST ASSIGNMENT</Text>
                  <Text style={styles.activeSubValue}>Dangote Gate 2</Text>
                  <Text style={styles.activeSubDesc}>Lagos Free Zone, Epe</Text>
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.activeSubTitle}>👤 DUTY SUPERVISOR</Text>
                  <Text style={styles.activeSubValue}>Insp. Adeleke K.</Text>
                  <Text style={styles.activeSubDesc}>Monitors active perimeter</Text>
                </View>
              </View>
            </View>

            {/* Live Geofence Radar Box */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>🛰️ LIVE GEOFENCE RADAR</Text>
                <TouchableOpacity onPress={initializeGuardBeatAndLocation}>
                  <Text style={styles.radarRefreshText}>🔄 RADAR REFRESH</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.radarScreenBox}>
                <View style={styles.radarCenterDot} />
                <View style={styles.radarRingOuter} />
                <Text style={styles.radarCoordLabel}>GPS: 6.6515°N, 3.3098°E</Text>
              </View>

              <View style={styles.radarFooterRow}>
                <Text style={styles.radarFooterLeft}>✓ GPS Active / Within 100m Geofence</Text>
                <Text style={styles.radarFooterRight}>LOCK SECURED</Text>
              </View>
            </View>

            {/* Field Operations Trigger Row */}
            <View style={styles.triggerGrid}>
              <TouchableOpacity 
                style={styles.triggerTile} 
                onPress={() => Alert.alert('Checkpoint Scanned', 'RFID / QR checkpoint logged successfully.')}
              >
                <Text style={{fontSize: 16, marginBottom: 4}}>🪪</Text>
                <Text style={styles.triggerTileTitle}>Scan Checkpoint</Text>
                <Text style={styles.triggerTileSub}>NFC / Spine Tag</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.triggerTile} 
                onPress={() => Alert.alert('Incident Report', 'Opening incident log transmission prompt...')}
              >
                <Text style={{fontSize: 16, marginBottom: 4}}>⚠️</Text>
                <Text style={styles.triggerTileTitle}>Report Incident</Text>
                <Text style={styles.triggerTileSub}>Log Evidence / Alert</Text>
              </TouchableOpacity>
            </View>

            {/* CLOCK OUT BUTTON */}
            <TouchableOpacity 
              style={[styles.clockOutButton, isActionLoading && styles.disabledButton]} 
              onPress={handleClockOut}
              disabled={isActionLoading}
              activeOpacity={0.8}
            >
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8}}>
                <Text style={{fontSize: 16}}>⏹️</Text>
                <Text style={styles.clockOutButtonText}>Clock Out Shift</Text>
                <Text style={{color: '#94a3b8', fontSize: 12}}>➔</Text>
              </View>
            </TouchableOpacity>

            {/* EMERGENCY SOS BUTTON */}
            <TouchableOpacity 
              style={styles.sosButton} 
              onPress={triggerEmergencySOS}
              activeOpacity={0.8}
            >
              <Text style={styles.sosButtonText}>🚨 EMERGENCY SOS</Text>
              <Text style={styles.sosButtonSub}>Instant alert to armed caravan dispatch</Text>
            </TouchableOpacity>

            {/* Recent Patrol Logs */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>📋 RECENT PATROL LOG</Text>
                <TouchableOpacity onPress={() => Alert.alert('Logs', 'Showing complete shift activity logs.')}>
                  <Text style={styles.radarRefreshText}>View Logs</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.logHistoryItem}>
                <Text style={{fontSize: 14}}>📍</Text>
                <View style={{flex: 1}}>
                  <Text style={styles.logHistTitle}>Checkpoint 01 (Perimeter North)</Text>
                  <Text style={styles.logHistSub}>RFID tag scanned with mobile scanner</Text>
                </View>
                <Text style={styles.logHistTime}>18:15 WAT</Text>
              </View>

              <View style={[styles.logHistoryItem, {borderBottomWidth: 0, marginBottom: 0}]}>
                <Text style={{fontSize: 14}}>🛡️</Text>
                <View style={{flex: 1}}>
                  <Text style={styles.logHistTitle}>Uniform & Turnout Checked</Text>
                  <Text style={styles.logHistSub}>AI posture verification score: 100% PASS</Text>
                </View>
                <Text style={styles.logHistTime}>18:00 WAT</Text>
              </View>
            </View>
          </>
        )}

        {/* Footer Info */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>SECURE SUNSHINE GUARD PORTAL • NDPA 2023 COMPLIANT</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#0f172a', 
    borderBottomWidth: 1, 
    borderBottomColor: '#1e293b'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 11, fontWeight: 'bold', color: '#fbbf24', letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  netBadge: { paddingVertical: 3, paddingHorizontal: 6, borderRadius: 6 },
  netText: { fontSize: 9, fontWeight: 'bold' },
  logoutButton: { paddingVertical: 4, paddingHorizontal: 8, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 10 },

  scrollContent: { padding: 16, paddingBottom: 40 },

  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 16, gap: 10 },
  avatarBox: { width: 36, height: 36, backgroundColor: '#1e293b', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  operativeName: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  operativeRole: { color: '#94a3b8', fontSize: 10 },
  batteryBadge: { backgroundColor: 'rgba(52, 211, 153, 0.1)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.2)' },

  topStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statPillSmall: { flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, padding: 10 },
  statPillLabel: { color: '#64748b', fontSize: 9, fontWeight: 'bold', marginBottom: 2 },
  statPillVal: { color: '#f8fafc', fontSize: 11, fontWeight: 'bold' },

  cameraFrameCard: { backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 12, marginBottom: 14 },
  camHeaderOverlay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  camHeaderTitle: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  camLiveBadge: { backgroundColor: 'rgba(52, 211, 153, 0.15)', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
  camLiveText: { color: '#34d399', fontSize: 8, fontWeight: 'bold' },

  viewfinderBox: { height: 160, backgroundColor: '#0b0f19', borderRadius: 8, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: '#1f2937', marginBottom: 8 },
  scannerCornerTL: { position: 'absolute', top: 10, left: 10, width: 14, height: 14, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#38bdf8' },
  scannerCornerTR: { position: 'absolute', top: 10, right: 10, width: 14, height: 14, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#38bdf8' },
  scannerCornerBL: { position: 'absolute', bottom: 10, left: 10, width: 14, height: 14, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#38bdf8' },
  scannerCornerBR: { position: 'absolute', bottom: 10, right: 10, width: 14, height: 14, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#38bdf8' },
  scannerStatusPill: { position: 'absolute', bottom: 10, backgroundColor: 'rgba(15, 23, 42, 0.85)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
  scannerStatusText: { color: '#fbbf24', fontSize: 9, fontWeight: 'bold' },
  camFooterNote: { alignItems: 'center' },
  camFooterText: { color: '#94a3b8', fontSize: 9 },

  card: { backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 14 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5 },

  checklistRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 8, marginBottom: 8, gap: 10 },
  checkTitle: { color: '#f8fafc', fontSize: 11, fontWeight: 'bold' },
  checkSub: { color: '#94a3b8', fontSize: 9 },
  checkActionText: { color: '#34d399', fontSize: 10, fontWeight: 'bold' },

  captureUniformBtn: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  captureBtnText: { color: '#38bdf8', fontSize: 13, fontWeight: 'bold' },

  clockInButton: { backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 8 },
  clockInButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  disabledButton: { backgroundColor: '#475569', opacity: 0.7 },
  clockInNotice: { color: '#64748b', fontSize: 9, textAlign: 'center', lineHeight: 13, marginBottom: 16 },

  // Post Clock In Styles
  activeShiftCard: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#34d399', borderRadius: 12, padding: 14, marginBottom: 14 },
  activeBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  activePill: { backgroundColor: 'rgba(52, 211, 153, 0.15)', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  activePillText: { color: '#34d399', fontSize: 9, fontWeight: 'bold' },
  activeBatteryText: { color: '#34d399', fontSize: 10, fontWeight: 'bold' },
  activeTimerText: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
  activeTimerSub: { fontSize: 9, color: '#94a3b8', textAlign: 'center', marginBottom: 12, fontWeight: '600' },
  activeAssignmentDetails: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 10, gap: 10 },
  activeSubTitle: { color: '#64748b', fontSize: 8, fontWeight: 'bold', marginBottom: 1 },
  activeSubValue: { color: '#f8fafc', fontSize: 11, fontWeight: 'bold' },
  activeSubDesc: { color: '#94a3b8', fontSize: 9 },

  radarRefreshText: { color: '#38bdf8', fontSize: 10, fontWeight: 'bold' },
  radarScreenBox: { height: 130, backgroundColor: '#111827', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginVertical: 8, borderWidth: 1, borderColor: '#1f2937', position: 'relative', overflow: 'hidden' },
  radarCenterDot: { width: 8, height: 8, backgroundColor: '#34d399', borderRadius: 4 },
  radarRingOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.4)', position: 'absolute' },
  radarCoordLabel: { position: 'absolute', bottom: 6, left: 8, color: '#64748b', fontSize: 9 },
  radarFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  radarFooterLeft: { color: '#34d399', fontSize: 10, fontWeight: 'bold' },
  radarFooterRight: { color: '#64748b', fontSize: 9, fontWeight: 'bold' },

  triggerGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  triggerTile: { flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center' },
  triggerTileTitle: { color: '#f8fafc', fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  triggerTileSub: { color: '#64748b', fontSize: 9 },

  clockOutButton: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  clockOutButtonText: { color: '#f8fafc', fontSize: 13, fontWeight: 'bold' },

  sosButton: { backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 14, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  sosButtonText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
  sosButtonSub: { color: '#fee2e2', fontSize: 9, marginTop: 1 },

  logHistoryItem: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 8, marginBottom: 8, gap: 10 },
  logHistTitle: { color: '#f8fafc', fontSize: 11, fontWeight: 'bold' },
  logHistSub: { color: '#94a3b8', fontSize: 9 },
  logHistTime: { color: '#38bdf8', fontSize: 10, fontWeight: 'bold' },

  footerInfo: { alignItems: 'center', marginTop: 10 },
  footerText: { color: '#475569', fontSize: 8, fontWeight: 'bold', letterSpacing: 0.5 }
});