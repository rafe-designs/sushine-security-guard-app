// src/screens/IncidentDetailScreen.js
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Alert } from 'react-native';

export default function IncidentDetailScreen({ navigation }) {
  const handleDispatch = () => {
    Alert.alert('SOS Armed Dispatch', 'Emergency patrol unit has been alerted and dispatched to Sector A perimeter zone.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.brandTitle}>🚨 INCIDENT EVIDENCE INSPECTION</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Incident Summary Card */}
        <View style={styles.alertBanner}>
          <View style={styles.alertHeaderRow}>
            <Text style={styles.alertTag}>🔴 HIGH SEVERITY INCIDENT #INC-409</Text>
            <Text style={styles.alertTime}>10 mins ago</Text>
          </View>
          <Text style={styles.incidentTitle}>Trespassing Attempt along East Perimeter</Text>
          <Text style={styles.incidentLoc}>Dangote Site A • Perimeter Zone 3 • Triggered by AI Motion Sensor</Text>
        </View>

        {/* Live CCTV Evidence Feed */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📹 CCTV & Perimeter Camera Capture</Text>
          <View style={styles.cctvViewport}>
            <Text style={styles.cctvOverlayText}>🔴 LIVE RECORDING BUFFER</Text>
            <View style={styles.cctvBox}>
              <Text style={styles.cctvPlaceholder}>[ AI Motion Bounding Box Detected: Subject at Gate 3 ]</Text>
            </View>
          </View>
          <Text style={styles.cctvFooter}>Captured by Camera ID: CAM-DANGOTE-03 • Encrypted SHA-256</Text>
        </View>

        {/* Voice Audio Dispatch Log */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🎙️ Voice Dispatch & Radio Log</Text>
          <View style={styles.audioPlayerBox}>
            <TouchableOpacity style={styles.playBtn}>
              <Text style={styles.playIcon}>▶️</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.audioTitle}>Supervisor Radio Dispatch Call</Text>
              <Text style={styles.audioDuration}>Duration: 00:24s • Inspector Adeleke K.</Text>
            </View>
          </View>
        </View>

        {/* Patrol Guard Verification Trail */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🛡️ Operative Verification Trail</Text>
          <View style={styles.trailRow}>
            <Text style={styles.trailLabel}>Responding Guard:</Text>
            <Text style={styles.trailVal}>Officer K. Adeleke (ID: 18306)</Text>
          </View>
          <View style={styles.trailRow}>
            <Text style={styles.trailLabel}>Response Status:</Text>
            <Text style={styles.trailVal}>🟢 Cleared & Perimeter Secured</Text>
          </View>
          <View style={styles.trailRow}>
            <Text style={styles.trailLabel}>Device Telemetry:</Text>
            <Text style={styles.trailVal}>GPS Lock Active • 98% Battery</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.dispatchBtn} onPress={handleDispatch}>
          <Text style={styles.dispatchBtnText}>🚨 DISPATCH QRF TO INCIDENT ZONE</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backText: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold' },
  brandTitle: { color: '#fbbf24', fontSize: 11, fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  alertBanner: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', padding: 14, marginBottom: 14 },
  alertHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  alertTag: { color: '#ef4444', fontSize: 9, fontWeight: 'bold' },
  alertTime: { color: '#94a3b8', fontSize: 9 },
  incidentTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  incidentLoc: { color: '#cbd5e1', fontSize: 10, lineHeight: 14 },
  card: { backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 14 },
  sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 10 },
  cctvViewport: { backgroundColor: '#111827', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#1f2937' },
  cctvOverlayText: { color: '#ef4444', fontSize: 9, fontWeight: 'bold', marginBottom: 6 },
  cctvBox: { backgroundColor: '#070b19', height: 140, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' },
  cctvPlaceholder: { color: '#38bdf8', fontSize: 9, textAlign: 'center', paddingHorizontal: 10 },
  cctvFooter: { color: '#64748b', fontSize: 8, marginTop: 8, textAlign: 'right' },
  audioPlayerBox: { backgroundColor: '#111827', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#1f2937' },
  playBtn: { backgroundColor: '#38bdf8', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  playIcon: { fontSize: 14 },
  audioTitle: { color: '#ffffff', fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  audioDuration: { color: '#94a3b8', fontSize: 9 },
  trailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#111827' },
  trailLabel: { color: '#64748b', fontSize: 10 },
  trailVal: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  dispatchBtn: { backgroundColor: '#ef4444', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  dispatchBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 }
});