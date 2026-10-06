// src/screens/AdminDashboardScreen.js
import React, { useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

export default function AdminDashboardScreen({ navigation }) {
  const { logout } = useContext(AuthContext);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />
      
      {/* Top Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brandTitle}>🛡️ SUNSHINE TACTICAL NET</Text>
          <Text style={styles.subBrand}>HQ COMMAND • LAGOS COMMAND</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>👤 Capt. A. Balogun (Admin)</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Joint Tactical Ops Center Title & Actions */}
        <View style={styles.opsHeaderRow}>
          <View>
            <Text style={styles.opsTitle}>Joint Tactical Ops Center[cite: 20]</Text>
            <Text style={styles.opsStatus}>🟢 LIVE STREAM • SECURE SSL[cite: 20]</Text>
          </View>
          <View style={styles.opsActionBtns}>
            <TouchableOpacity style={styles.sosActionBtn}>
              <Text style={styles.sosActionText}>🚨 SOS Dispatch (0)[cite: 20]</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.downloadBtn}>
              <Text style={styles.downloadText}>📥 Export Roster[cite: 20]</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={[styles.statsGrid, isWeb && styles.statsGridWeb]}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>148 / 152[cite: 20]</Text>
            <Text style={styles.statLabel}>Active / Roster[cite: 20]</Text>
            <Text style={styles.statSub}>🟢 97.4% Attendance[cite: 20]</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>99.3%[cite: 20]</Text>
            <Text style={styles.statLabel}>Attendance Sync[cite: 20]</Text>
            <Text style={styles.statSub}>⚡ Low Latency {'<'} 1.2s[cite: 20]</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>3 Active[cite: 20]</Text>
            <Text style={styles.statLabel}>Incidents Logged[cite: 20]</Text>
            <Text style={styles.statSub}>🔴 Zone 2 Dispatched[cite: 20]</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>8 Queue[cite: 20]</Text>
            <Text style={styles.statLabel}>Pending Approvals[cite: 20]</Text>
            <Text style={styles.statSub}>👤 ID Verification[cite: 20]</Text>
          </View>
        </View>

        {/* Tactical Radar / Perimeter View */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📡 Device Tactical Radar[cite: 20]</Text>
          <View style={styles.radarBox}>
            <Text style={styles.radarPlaceholder}>🗺️ Interactive Geofence Radar [Lagos Sector A][cite: 20]</Text>
            <View style={styles.radarLegendRow}>
              <Text style={styles.legendText}>🟢 Dangote Site (100%)[cite: 20]</Text>
              <Text style={styles.legendText}>🔵 Epe Gateway (100%)[cite: 20]</Text>
              <Text style={styles.legendText}>🟡 Abule-Egba (98%)[cite: 20]</Text>
            </View>
          </View>
        </View>

        {/* Urgent Incident & Dispatch Feed */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🚨 Urgent Incident & Dispatch Feed[cite: 20]</Text>
          
          <View style={styles.incidentItem}>
            <View style={styles.incidentHeaderRow}>
              <Text style={styles.incidentTag}>🔴 HIGH SEVERITY[cite: 20]</Text>
              <Text style={styles.incidentTime}>10 mins ago[cite: 20]</Text>
            </View>
            <Text style={styles.incidentTitle}>Trespassing Attempt along East Perimeter[cite: 20]</Text>
            <Text style={styles.incidentDesc}>Dangote Site A • Perimeter Zone 3 • Triggered by AI Perimeter Camera & Motion Sensor[cite: 20]</Text>
            <View style={styles.incidentActionRow}>
              <TouchableOpacity style={styles.primaryActionBtn}>
                <Text style={styles.primaryActionText}>🔍 Review Evidence & CCTV[cite: 20]</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryActionBtn}>
                <Text style={styles.secondaryActionText}>Acknowledge[cite: 20]</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Operational Verification & Compliance */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🔒 Legal Compliance & NDPA 2023[cite: 20]</Text>
          <Text style={styles.complianceText}>
            Continuous biometrics monitoring, device telemetry, & data governance comply with Nigeria Data Protection Act (NDPA) standards for Sunshine Guard Services.[cite: 20]
          </Text>
          <TouchableOpacity style={styles.auditBtn}>
            <Text style={styles.auditBtnText}>📥 Download Device Audit Trail[cite: 20]</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandTitle: { color: '#fbbf24', fontSize: 11, fontWeight: 'bold' },
  subBrand: { color: '#64748b', fontSize: 9, marginTop: 2 },
  adminBadge: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  adminBadgeText: { color: '#38bdf8', fontSize: 9, fontWeight: 'bold' },
  logoutButton: { paddingVertical: 4, paddingHorizontal: 8, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 9 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  opsHeaderRow: { flexDirection: isWeb ? 'row' : 'column', justifyContent: 'space-between', alignItems: isWeb ? 'center' : 'flex-start', marginBottom: 14, gap: 10 },
  opsTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  opsStatus: { color: '#34d399', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  opsActionBtns: { flexDirection: 'row', gap: 8 },
  sosActionBtn: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  sosActionText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  downloadBtn: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  downloadText: { color: '#38bdf8', fontSize: 10, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statsGridWeb: { flexWrap: 'nowrap' },
  statCard: { flex: 1, minWidth: '47%', backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  statVal: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  statLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  statSub: { color: '#34d399', fontSize: 9 },
  card: { backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 14 },
  sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 12 },
  radarBox: { backgroundColor: '#111827', borderRadius: 10, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' },
  radarPlaceholder: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold', marginBottom: 12 },
  radarLegendRow: { flexDirection: 'row', gap: 15 },
  legendText: { color: '#94a3b8', fontSize: 9, fontWeight: 'bold' },
  incidentItem: { backgroundColor: '#111827', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#1f2937' },
  incidentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  incidentTag: { color: '#ef4444', fontSize: 9, fontWeight: 'bold' },
  incidentTime: { color: '#64748b', fontSize: 9 },
  incidentTitle: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  incidentDesc: { color: '#94a3b8', fontSize: 10, lineHeight: 14, marginBottom: 10 },
  incidentActionRow: { flexDirection: 'row', gap: 8 },
  primaryActionBtn: { flex: 1, backgroundColor: 'rgba(56, 189, 248, 0.15)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  primaryActionText: { color: '#38bdf8', fontSize: 10, fontWeight: 'bold' },
  secondaryActionBtn: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  secondaryActionText: { color: '#cbd5e1', fontSize: 10, fontWeight: 'bold' },
  complianceText: { color: '#cbd5e1', fontSize: 10, lineHeight: 15, marginBottom: 12 },
  auditBtn: { backgroundColor: 'rgba(52, 211, 153, 0.15)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.3)', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  auditBtnText: { color: '#34d399', fontSize: 10, fontWeight: 'bold' }
});