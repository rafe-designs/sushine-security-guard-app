// src/screens/AdminLiveMapScreen.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function AdminLiveMapScreen({ navigation }) {
  const [selectedSector, setSelectedSector] = useState('All Sectors');

  const activeOperatives = [
    { id: '1', name: 'Officer Adeleke K.', post: 'Dangote Gate 2', status: '🟢 On Duty', battery: '98%', lat: '6.4281° N', lng: '3.4219° E' },
    { id: '2', name: 'Insp. Chukwuma E.', post: 'Epe Gateway', status: '🟢 Active Patrol', battery: '91%', lat: '6.5833° N', lng: '3.9833° E' },
    { id: '3', name: 'Sgt. Ibrahim M.', post: 'Abule-Egba Compound', status: '🟡 Signal Weak', battery: '44%', lat: '6.6234° N', lng: '3.2956° E' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>📡 TACTICAL GEOFENCE RADAR</Text>
          <Text style={styles.subBrand}>LAGOS COMMAND • LIVE TELEMETRY</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn}>
          <Text style={styles.refreshText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Radar Map Simulation Card */}
        <View style={styles.radarCard}>
          <View style={styles.radarHeaderRow}>
            <Text style={styles.radarTitle}>Sector A & B Perimeter Map</Text>
            <Text style={styles.liveIndicator}>● LIVE SYNC</Text>
          </View>
          
          <View style={styles.radarViewport}>
            <Text style={styles.radarCenterText}>🗺️ Interactive GIS Map View</Text>
            <Text style={styles.radarSubText}>Tracking 148 active operative nodes in real-time</Text>

            {/* Simulated Radar Nodes */}
            <View style={[styles.nodePin, { top: '30%', left: '40%' }]}>
              <Text style={styles.nodePinText}>🟢 Dangote (100%)</Text>
            </View>
            <View style={[styles.nodePin, { top: '60%', left: '70%' }]}>
              <Text style={styles.nodePinText}>🔵 Epe (100%)</Text>
            </View>
            <View style={[styles.nodePin, { top: '50%', left: '20%' }]}>
              <Text style={styles.nodePinText}>🟡 Abule-Egba (98%)</Text>
            </View>
          </View>
        </View>

        {/* Sector Filter Bar */}
        <View style={styles.filterRow}>
          {['All Sectors', 'Dangote', 'Epe', 'Abule-Egba'].map((sec) => (
            <TouchableOpacity 
              key={sec} 
              style={[styles.filterChip, selectedSector === sec && styles.activeFilterChip]}
              onPress={() => setSelectedSector(sec)}
            >
              <Text style={[styles.filterText, selectedSector === sec && styles.activeFilterText]}>{sec}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Operatives List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Operatives on Ground ({activeOperatives.length})</Text>
        </View>

        {activeOperatives.map((op) => (
          <View key={op.id} style={styles.operativeCard}>
            <View style={styles.opInfoRow}>
              <View>
                <Text style={styles.opName}>{op.name}</Text>
                <Text style={styles.opPost}>📍 {op.post} • {op.lat}, {op.lng}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{op.status}</Text>
              </View>
            </View>
            <View style={styles.opFooterRow}>
              <Text style={styles.batteryText}>🔋 Device Battery: {op.battery}</Text>
              <TouchableOpacity style={styles.pingBtn}>
                <Text style={styles.pingBtnText}>📡 Ping Device</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  brandTitle: { color: '#fbbf24', fontSize: 12, fontWeight: 'bold' },
  subBrand: { color: '#64748b', fontSize: 9, marginTop: 2 },
  refreshBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
  refreshText: { color: '#38bdf8', fontSize: 10, fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  radarCard: { backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 14 },
  radarHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  radarTitle: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  liveIndicator: { color: '#34d399', fontSize: 9, fontWeight: 'bold' },
  radarViewport: { backgroundColor: '#111827', borderRadius: 10, height: 220, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1f2937', position: 'relative' },
  radarCenterText: { color: '#38bdf8', fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  radarSubText: { color: '#64748b', fontSize: 9 },
  nodePin: { position: 'absolute', backgroundColor: 'rgba(15, 23, 42, 0.9)', borderWidth: 1, borderColor: '#334155', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  nodePinText: { color: '#cbd5e1', fontSize: 9, fontWeight: 'bold' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterChip: { backgroundColor: '#0f172a', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b' },
  activeFilterChip: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  filterText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  activeFilterText: { color: '#070b19' },
  sectionHeader: { marginBottom: 10 },
  sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  operativeCard: { backgroundColor: '#0f172a', borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', padding: 12, marginBottom: 10 },
  opInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  opName: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  opPost: { color: '#94a3b8', fontSize: 10 },
  statusBadge: { backgroundColor: 'rgba(52, 211, 153, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.2)' },
  statusBadgeText: { color: '#34d399', fontSize: 9, fontWeight: 'bold' },
  opFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 8 },
  batteryText: { color: '#64748b', fontSize: 9 },
  pingBtn: { backgroundColor: 'rgba(56, 189, 248, 0.15)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  pingBtnText: { color: '#38bdf8', fontSize: 9, fontWeight: 'bold' }
});