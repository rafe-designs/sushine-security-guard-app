// src/screens/AdminDashboardScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  ScrollView,
  Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function AdminDashboardScreen() {
  const { logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [lifetimeData, setLifetimeData] = useState({ logs: [], shifts: [], totalLogs: 0, totalShifts: 0 });

  useEffect(() => {
    fetchLifetimeData();
  }, []);

  const fetchLifetimeData = async () => {
    setLoading(true);
    try {
      // Connecting to your local backend API with the Admin Secret Header
      const response = await axios.get('http://192.168.100.2:5000/api/admin/lifetime-data', {
        headers: { 'x-admin-secret': 'sunshine_admin_secure_2026' }
      });
      setLifetimeData(response.data);
    } catch (error) {
      Alert.alert('Access Denied', 'Could not fetch admin records from server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sunshine Admin Portal</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{lifetimeData.totalShifts}</Text>
            <Text style={styles.statLabel}>Lifetime Shifts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{lifetimeData.totalLogs}</Text>
            <Text style={styles.statLabel}>Lifetime Logs</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={fetchLifetimeData}>
          <Text style={styles.refreshText}>🔄 Refresh Records</Text>
        </TouchableOpacity>

        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Lifetime Shift Archives</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#0284c7" style={{ marginVertical: 20 }} />
          ) : lifetimeData.shifts.length === 0 ? (
            <Text style={styles.emptyText}>No shifts recorded yet.</Text>
          ) : (
            lifetimeData.shifts.map((shift, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemTitle}>Guard: {shift.guardId}</Text>
                <Text style={styles.itemSub}>Status: {shift.status} | Duration: {Math.round((shift.totalDurationSeconds || 0) / 60)} mins</Text>
                <Text style={styles.itemDate}>In: {new Date(shift.clockInTime).toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Lifetime Incident / Log Stream</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#0284c7" style={{ marginVertical: 20 }} />
          ) : lifetimeData.logs.length === 0 ? (
            <Text style={styles.emptyText}>No logs recorded yet.</Text>
          ) : (
            lifetimeData.logs.map((log, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemTitle}>[{log.type}] {log.text}</Text>
                <Text style={styles.itemDate}>{new Date(log.timestamp).toLocaleString()}</Text>
              </View>
            ))
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
  logoutButton: { paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#fee2e2', borderRadius: 4 },
  logoutText: { color: '#dc2626', fontWeight: 'bold', fontSize: 12 },
  content: { padding: 20 },
  statsContainer: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 10, alignItems: 'center', elevation: 2 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#0284c7' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  refreshBtn: { backgroundColor: '#e0f2fe', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  refreshText: { color: '#0284c7', fontWeight: 'bold' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 12 },
  itemRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  itemSub: { fontSize: 12, color: '#475569', marginTop: 2 },
  itemDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', marginVertical: 10 }
});