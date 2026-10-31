// src/screens/PendingApprovalScreen.js
import React, { useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  ScrollView,
  RefreshControl 
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client';

export default function PendingApprovalScreen({ navigation }) {
  const { user, logout, login } = useContext(AuthContext);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Re-fetch profile to check if Head of Operations has approved the account
      const res = await apiClient.get('/auth/me');
      if (res.data?.user?.isApproved) {
        // Re-login / sync state
      }
    } catch (e) {
      console.log('Syncing status error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fbbf24" />}
      >
        <View style={styles.card}>
          {/* Header Badge */}
          <View style={styles.badgeRow}>
            <View style={styles.statusTag}>
              <Text style={styles.statusTagText}>⏳ PENDING CLEARANCE</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Welcome, {user?.fullName || 'Operative'}</Text>
          <Text style={styles.employeeId}>EMPLOYEE ID: {user?.employeeId || 'SGS-PENDING'}</Text>

          {/* Pending Box Alert */}
          <View style={styles.pendingBox}>
            <Text style={{fontSize: 28, marginBottom: 8}}>🛡️</Text>
            <Text style={styles.pendingTitle}>Awaiting Operations Clearance</Text>
            <Text style={styles.pendingDesc}>
              Your enrollment application is currently undergoing verification by the <Text style={{fontWeight: 'bold', color: '#fbbf24'}}>Head of Operations</Text>[cite: 38].
            </Text>
            <Text style={styles.pendingDesc}>
              Once your designation is confirmed and station access is granted, your duty dashboard will activate automatically[cite: 38]. Pull down on this screen to refresh your status.
            </Text>
          </View>

          {/* Assigned Station Summary */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Requested Station:</Text>
            <Text style={styles.infoValue}>{user?.assignedSite || 'Beni Gold Ikoyi'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Status:</Text>
            <Text style={[styles.infoValue, {color: '#f59e0b'}]}>Pending Head of Ops Approval</Text>
          </View>

          {/* Actions */}
          <TouchableOpacity 
            style={styles.profileBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileBtnText}>👤 Complete / Update Profile & Guarantor Records</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 420, alignSelf: 'center', backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 20 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusTag: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  statusTagText: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  logoutText: { color: '#ef4444', fontSize: 11, fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 2 },
  employeeId: { fontSize: 11, color: '#38bdf8', fontWeight: 'bold', marginBottom: 16 },
  pendingBox: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  pendingTitle: { color: '#ffffff', fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
  pendingDesc: { color: '#94a3b8', fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  infoLabel: { color: '#64748b', fontSize: 11, fontWeight: 'bold' },
  infoValue: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  profileBtn: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  profileBtnText: { color: '#38bdf8', fontSize: 12, fontWeight: 'bold' }
});