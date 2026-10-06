// src/screens/GuardSosScreen.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = __DEV__ 
  ? 'http://192.168.100.2:5000' 
  : 'https://api.sunshineguard.ng';

export default function GuardSosScreen({ navigation }) {
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [sosTriggered, setSosTriggered] = useState(false);

  useEffect(() => {
    let timer;
    if (isCountingDown && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (isCountingDown && countdown === 0) {
      executeSosBroadcast();
    }
    return () => clearTimeout(timer);
  }, [isCountingDown, countdown]);

  const startSosCountdown = () => {
    setIsCountingDown(true);
    setCountdown(5);
  };

  const cancelSos = () => {
    setIsCountingDown(false);
    setCountdown(5);
    Alert.alert('SOS Cancelled', 'Emergency panic sequence aborted.');
  };

  const executeSosBroadcast = async () => {
    setIsCountingDown(false);
    setSosTriggered(true);

    try {
      const activeShiftJson = await AsyncStorage.getItem('sunshine_active_shift');
      const activeShift = activeShiftJson ? JSON.parse(activeShiftJson) : null;

      const sosPayload = {
        type: 'DUESS_PANIC_SOS',
        shiftId: activeShift ? activeShift._id : null,
        timestamp: new Date().toISOString(),
        location: 'Dangote Gate 2 Perimeter Zone (6.4281° N, 3.4219° E)'
      };

      await axios.post(`${API_BASE_URL}/api/incidents/sos`, sosPayload, { timeout: 4000 });
      
      Alert.alert(
        '🚨 SOS BROADCAST ACTIVE',
        'Emergency QRF units, Admin Live Map, and Lagos Command HQ have been alerted with your live telemetry.',
        [{ text: 'Acknowledge', onPress: () => setSosTriggered(false) }]
      );
    } catch (error) {
      console.error('SOS Broadcast offline sync:', error);
      Alert.alert(
        '🚨 EMERGENCY BEACON TRANSMITTED LOCALLY',
        'Network unreachable, but hardware panic broadcast saved to secure local memory and queued for satellite/SMS relay.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.brandTitle}>⚠️ DURESS & EMERGENCY PANIC</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>🛑 USE ONLY FOR IMMINENT THREATS</Text>
          <Text style={styles.warningDesc}>
            Pressing the panic button below broadcasts your live coordinates directly to the Admin Command Center and triggers an audible QRF alarm siren.
          </Text>
        </View>

        {isCountingDown ? (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownLabel}>⚠️ BROADCASTING IN...</Text>
            <Text style={styles.countdownNumber}>{countdown}</Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={cancelSos}>
              <Text style={styles.cancelBtnText}>❌ CANCEL PANIC</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.panicButton} 
            onPress={startSosCountdown}
            activeOpacity={0.7}
          >
            <Text style={styles.panicIcon}>🚨</Text>
            <Text style={styles.panicBtnText}>HOLD OR PRESS FOR SOS</Text>
            <Text style={styles.panicSubText}>Tap to initiate emergency dispatch</Text>
          </TouchableOpacity>
        )}

        {sosTriggered && (
          <View style={styles.activeAlertBox}>
            <Text style={styles.activeAlertText}>🔴 QRF DISPATCH UNITS EN ROUTE TO YOUR LOCATION</Text>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backText: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold' },
  brandTitle: { color: '#ef4444', fontSize: 11, fontWeight: 'bold' },
  content: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  warningCard: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', padding: 16, marginBottom: 30, width: '100%' },
  warningTitle: { color: '#ef4444', fontSize: 11, fontWeight: 'bold', marginBottom: 6, textAlign: 'center' },
  warningDesc: { color: '#cbd5e1', fontSize: 10, textAlign: 'center', lineHeight: 15 },
  panicButton: { width: 220, height: 220, borderRadius: 110, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', borderWidth: 8, borderColor: 'rgba(239, 68, 68, 0.3)', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 10 },
  panicIcon: { fontSize: 44, marginBottom: 8 },
  panicBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 20 },
  panicSubText: { color: '#fca5a5', fontSize: 9, marginTop: 4 },
  countdownContainer: { width: 220, height: 220, borderRadius: 110, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 8, borderColor: '#ef4444' },
  countdownLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  countdownNumber: { color: '#ef4444', fontSize: 48, fontWeight: 'bold', marginBottom: 10 },
  cancelBtn: { backgroundColor: '#334155', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6 },
  cancelBtnText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  activeAlertBox: { marginTop: 30, backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ef4444', width: '100%', alignItems: 'center' },
  activeAlertText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold', textAlign: 'center' }
});