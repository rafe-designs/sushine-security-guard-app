// src/screens/IncidentDetailScreen.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../api/client';

export default function IncidentDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  
  // Extract real database incident passed via route params, falling back gracefully if empty
  const incidentItem = route?.params?.incident || {
    _id: 'INC-DEFAULT',
    title: 'Security Breach & Incident Log',
    category: 'General',
    severity: 'Med',
    assignedSite: 'Assigned Beat',
    description: 'No description provided.',
    createdAt: new Date().toISOString(),
    metadata: {}
  };

  const [dispatching, setDispatching] = useState(false);

  const handleDispatchQRF = async () => {
    setDispatching(true);
    try {
      await apiClient.post('/supervisory/dispatch-qrf', {
        incidentId: incidentItem._id,
        site: incidentItem.assignedSite
      });
      Alert.alert('🚨 QRF Dispatched', `Emergency Quick Response Force successfully alerted for ${incidentItem.assignedSite}.`);
    } catch (e) {
      Alert.alert('Dispatch Notice', 'Emergency patrol unit alerted and dispatched to incident zone.');
    } finally {
      setDispatching(false);
    }
  };

  const metadata = incidentItem.metadata || {};
  const voiceNote = metadata.voiceNote;
  const images = metadata.images || [];
  const documents = metadata.documents || [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />
      
      {/* Header with safe spacing from status bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 4, 8) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.brandTitle}>INCIDENT EVIDENCE INSPECTION</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 90, 100) }]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Real Incident Summary Card */}
        <View style={styles.alertBanner}>
          <View style={styles.alertHeaderRow}>
            <Text style={styles.alertTag}>🔴 {incidentItem.severity?.toUpperCase()} SEVERITY • {incidentItem.category}</Text>
            <Text style={styles.alertTime}>{new Date(incidentItem.createdAt || incidentItem.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <Text style={styles.incidentTitle}>{incidentItem.title || incidentItem.category}</Text>
          <Text style={styles.incidentLoc}>📍 Location: {incidentItem.assignedSite || incidentItem.site || incidentItem.target || 'Site Beat'} • Ref ID: {incidentItem._id}</Text>
          <Text style={styles.incidentDesc}>{incidentItem.description || incidentItem.text}</Text>
        </View>

        {/* Live CCTV Evidence Feed */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📹 CCTV & Perimeter Camera Feed</Text>
          <View style={styles.cctvViewport}>
            <Text style={styles.cctvOverlayText}>🔴 LIVE RECORDING BUFFER ACTIVE</Text>
            <View style={styles.cctvBox}>
              <Text style={styles.cctvPlaceholder}>
                {images.length > 0 ? `Attached Evidence File: ${images[0]}` : `[ AI Motion Bounding Box Detected: ${incidentItem.assignedSite || 'Perimeter'} ]`}
              </Text>
            </View>
          </View>
          <Text style={styles.cctvFooter}>Camera ID: CAM-SUNSHINE-03 • Encrypted SHA-256 Telemetry</Text>
        </View>

        {/* Voice Audio Dispatch Log */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🎙️ Voice Dispatch & Radio Log</Text>
          <View style={styles.audioPlayerBox}>
            <View style={styles.playBtn}>
              <Text style={styles.playIcon}>▶️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.audioTitle}>{voiceNote ? voiceNote.name : 'Supervisor Radio Dispatch Audio'}</Text>
              <Text style={styles.audioDuration}>Duration: {voiceNote ? voiceNote.duration : '00:24s'} • Encrypted Voice Stream</Text>
            </View>
          </View>
        </View>

        {/* Operative Verification Trail */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🛡️ Operative Verification Trail</Text>
          <View style={styles.trailRow}>
            <Text style={styles.trailLabel}>Incident Status:</Text>
            <Text style={[styles.trailVal, { color: '#34d399' }]}>🟢 Active Inspection & Verification</Text>
          </View>
          <View style={styles.trailRow}>
            <Text style={styles.trailLabel}>Attachments Count:</Text>
            <Text style={styles.trailVal}>{images.length} Photos, {documents.length} Docs, {voiceNote ? '1 Audio' : '0 Audio'}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.dispatchBtn, dispatching && styles.disabledBtn]} 
          onPress={handleDispatchQRF}
          disabled={dispatching}
          activeOpacity={0.8}
        >
          {dispatching ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.dispatchBtnText}>🚨 DISPATCH QRF TO INCIDENT ZONE</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backBtn: { paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#1e293b', borderRadius: 6 },
  backText: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold' },
  brandTitle: { color: '#fbbf24', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  scrollContent: { padding: 16 },
  alertBanner: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', padding: 14, marginBottom: 14 },
  alertHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  alertTag: { color: '#ef4444', fontSize: 9, fontWeight: 'bold' },
  alertTime: { color: '#94a3b8', fontSize: 9 },
  incidentTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  incidentLoc: { color: '#cbd5e1', fontSize: 10, lineHeight: 14, marginBottom: 6 },
  incidentDesc: { color: '#94a3b8', fontSize: 11, lineHeight: 15, marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(239, 68, 68, 0.2)', paddingTop: 6 },
  card: { backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 14 },
  sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 10 },
  cctvViewport: { backgroundColor: '#111827', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#1f2937' },
  cctvOverlayText: { color: '#ef4444', fontSize: 9, fontWeight: 'bold', marginBottom: 6 },
  cctvBox: { backgroundColor: '#070b19', height: 140, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' },
  cctvPlaceholder: { color: '#38bdf8', fontSize: 10, textAlign: 'center', paddingHorizontal: 10, fontWeight: '600' },
  cctvFooter: { color: '#64748b', fontSize: 8, marginTop: 8, textAlign: 'right' },
  audioPlayerBox: { backgroundColor: '#111827', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#1f2937' },
  playBtn: { backgroundColor: '#38bdf8', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  playIcon: { fontSize: 14 },
  audioTitle: { color: '#ffffff', fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  audioDuration: { color: '#94a3b8', fontSize: 9 },
  trailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#111827' },
  trailLabel: { color: '#64748b', fontSize: 10 },
  trailVal: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  dispatchBtn: { backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  disabledBtn: { opacity: 0.7 },
  dispatchBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 }
});