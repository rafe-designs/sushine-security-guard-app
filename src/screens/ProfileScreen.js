// src/screens/ProfileScreen.js
import React, { useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function ProfileScreen() {
  const { logout } = useContext(AuthContext);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛡️ OFFICER PROFILE & COMPLIANCE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Operative Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <Text style={{fontSize: 22}}>👮🏽‍♂️</Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.operativeName}>Officer K. Adeleke (18306)</Text>
            <Text style={styles.operativeRole}>Field Security Alpha • Lagos Command</Text>
            <Text style={styles.beatLocation}>📍 Assigned: Dangote Site A (Epe)</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>142</Text>
            <Text style={styles.statLabel}>Shifts Logged</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>98.8%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>100%</Text>
            <Text style={styles.statLabel}>AI Compliance</Text>
          </View>
        </View>

        {/* NDPA Compliance Notice */}
        <View style={styles.complianceCard}>
          <Text style={styles.compTitle}>🔒 NDPA 2023 Compliance</Text>
          <Text style={styles.compDesc}>
            Biometric data, GPS geofence monitoring, and device telemetry are encrypted and secured under Sunshine Guard Services privacy standards.
          </Text>
        </View>

        {/* Emergency HQ Direct Call */}
        <TouchableOpacity 
          style={styles.sosButton} 
          onPress={() => logout()}
        >
          <Text style={styles.sosButtonText}>🚪 SIGN OUT OF TERMINAL</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  header: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 11, fontWeight: 'bold', color: '#fbbf24', letterSpacing: 0.5 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 14, gap: 12 },
  avatarBox: { width: 48, height: 48, backgroundColor: '#1e293b', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  operativeName: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  operativeRole: { color: '#94a3b8', fontSize: 10, marginBottom: 4 },
  beatLocation: { color: '#38bdf8', fontSize: 10, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: { flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, padding: 12, alignItems: 'center' },
  statVal: { color: '#34d399', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  statLabel: { color: '#64748b', fontSize: 9, fontWeight: 'bold' },
  complianceCard: { backgroundColor: 'rgba(52, 211, 153, 0.08)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.2)', borderRadius: 12, padding: 14, marginBottom: 16 },
  compTitle: { color: '#34d399', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  compDesc: { color: '#cbd5e1', fontSize: 10, lineHeight: 14 },
  sosButton: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  sosButtonText: { color: '#ef4444', fontSize: 12, fontWeight: 'bold' }
});