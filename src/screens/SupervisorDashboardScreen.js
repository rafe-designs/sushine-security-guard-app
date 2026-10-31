// src/screens/SupervisorDashboardScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Modal, 
  TextInput, 
  Alert,
  StatusBar,
  ScrollView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client';
import { submitShiftComment } from '../api/supervisoryService';

export default function SupervisorDashboardScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('guards'); // 'guards' | 'shifts' | 'incidents'
  const [timeFilter, setTimeFilter] = useState('all');   // 'daily' | 'weekly' | 'monthly' | 'all'

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [locationGuards, setLocationGuards] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [incidents, setIncidents] = useState([]);

  // Personal Supervisor Clock-In State
  const [activeShift, setActiveShift] = useState(null);
  const [clocking, setClocking] = useState(false);

  // Modal State for Remarks / Personnel Profile with Lifetime Shifts
  const [selectedShift, setSelectedShift] = useState(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [viewingStaff, setViewingStaff] = useState(null);
  const [guardLifetimeShifts, setGuardLifetimeShifts] = useState([]);
  const [loadingLifetime, setLoadingLifetime] = useState(false);

  useEffect(() => {
    loadSupervisorData();
    checkPersonalShift();
  }, [user, timeFilter]);

  const loadSupervisorData = async () => {
    setLoading(true);
    try {
      const assignedSite = user?.assignedSite || 'Beni Gold Ikoyi';

      // 1. Fetch location guards
      const staffRes = await apiClient.get('/admin/staff-directory', { params: { site: assignedSite } });
      setLocationGuards(staffRes.data.staff || []);

      // 2. Fetch shifts with timeframe filter
      const shiftRes = await apiClient.get('/supervisory/shifts', { params: { site: assignedSite, timeframe: timeFilter } });
      setShifts(shiftRes.data.shifts || []);

      // 3. Fetch exact site incidents matching supervisor's assigned site
      const incRes = await apiClient.get('/supervisory/incidents', { params: { site: assignedSite, timeframe: timeFilter } });
      setIncidents(incRes.data.incidents || []);
    } catch (err) {
      console.error('Supervisor Data Sync Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkPersonalShift = async () => {
    try {
      const res = await apiClient.get('/shifts/active');
      setActiveShift(res.data.activeShift);
    } catch (e) {
      setActiveShift(null);
    }
  };

  const handleToggleSupervisorClock = async () => {
    setClocking(true);
    try {
      if (activeShift) {
        await apiClient.post('/shifts/end');
        setActiveShift(null);
        Alert.alert('Shift Ended', 'You have successfully clocked out.');
      } else {
        const res = await apiClient.post('/shifts/start', { latitude: 6.4541, longitude: 3.4207 });
        setActiveShift(res.data.shift);
        Alert.alert('Shift Started', 'You are now clocked on duty.');
      }
      loadSupervisorData();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to update shift status.');
    } finally {
      setClocking(false);
    }
  };

  const handleOpenProfileWithShifts = async (staff) => {
    setViewingStaff(staff);
    setProfileModalVisible(true);
    setLoadingLifetime(true);
    try {
      const res = await apiClient.get(`/supervisory/guard-shifts/${staff._id}`);
      setGuardLifetimeShifts(res.data.shifts || []);
    } catch (e) {
      setGuardLifetimeShifts([]);
    } finally {
      setLoadingLifetime(false);
    }
  };

  const handleOpenCommentModal = (shift) => {
    setSelectedShift(shift);
    setCommentText('');
    setCommentModalVisible(true);
  };

  const handlePostRemark = async () => {
    if (!commentText.trim()) return Alert.alert('Validation Error', 'Please enter your supervisory remark.');
    setSubmitting(true);
    try {
      const updatedShift = await submitShiftComment(selectedShift._id, commentText, true);
      setShifts((prev) => prev.map((s) => (s._id === updatedShift._id ? updatedShift : s)));
      setCommentModalVisible(false);
      Alert.alert('Success', 'Supervisory remark recorded successfully.');
    } catch (e) {
      Alert.alert('Failed', 'Could not save remark.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />

      {/* Header */}
      <View style={styles.header}>
        <View style={{flex: 1}}>
          <Text style={styles.headerSub}>SITE SUPERVISOR COMMAND • {user?.assignedSite}</Text>
          <Text style={styles.headerTitle}>{user?.fullName || 'Supervisor'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Action Bar / Personal Clock & Incident Reporting */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={[styles.actionTile, { backgroundColor: activeShift ? 'rgba(239, 68, 68, 0.2)' : 'rgba(52, 211, 153, 0.2)', borderColor: activeShift ? '#ef4444' : '#34d399' }]} 
          onPress={handleToggleSupervisorClock}
          disabled={clocking}
        >
          <Text style={[styles.actionText, { color: activeShift ? '#ef4444' : '#34d399' }]}>
            {clocking ? 'Processing...' : activeShift ? '⏹️ Clock Out (Duty)' : '⏱️ Clock In (Duty)'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionTile} onPress={() => navigation.navigate('IncidentReport')}>
          <Text style={styles.actionText}>⚠️ Report Incident</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionTile} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.actionText}>👤 Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Time Filter Chips */}
      <View style={styles.filterBar}>
        {['daily', 'weekly', 'monthly', 'all'].map((tf) => (
          <TouchableOpacity 
            key={tf} 
            style={[styles.filterChip, timeFilter === tf && styles.filterChipActive]}
            onPress={() => setTimeFilter(tf)}
          >
            <Text style={[styles.filterChipText, timeFilter === tf && styles.filterChipTextActive]}>{tf.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Exact 3 Tabs */}
      <View style={styles.tabBar}>
        {[
          { key: 'guards', label: `1. Location Guards (${locationGuards.length})` },
          { key: 'shifts', label: `2. Shift Log (${shifts.length})` },
          { key: 'incidents', label: `3. Incident Log (${incidents.length})` }
        ].map((tab) => (
          <TouchableOpacity 
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content Feed */}
      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#fbbf24" />
          <Text style={{color: '#94a3b8', marginTop: 10, fontSize: 12}}>Loading site telemetry...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'guards' ? locationGuards : activeTab === 'shifts' ? shifts : incidents}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            if (activeTab === 'guards') {
              return (
                <TouchableOpacity 
                  style={styles.card} 
                  activeOpacity={0.85}
                  onPress={() => handleOpenProfileWithShifts(item)}
                >
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.guardName}>{item.fullName} <Text style={styles.employeeId}>({item.employeeId})</Text></Text>
                      <Text style={styles.postText}>📍 Role: {item.role?.toUpperCase()} | Beat: {item.assignedSite}</Text>
                    </View>
                    <Text style={{color: '#38bdf8', fontSize: 11}}>View Profile & Lifetime Shifts ➔</Text>
                  </View>
                  <Text style={styles.timeLabel}>✉️ {item.email} | 📱 {item.phone || 'N/A'}</Text>
                </TouchableOpacity>
              );
            }

            if (activeTab === 'incidents') {
              return (
                <TouchableOpacity 
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('IncidentDetail', { incident: item })}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.guardName}>🚨 {item.title || item.category}</Text>
                    <Text style={[styles.statusText, { color: '#ef4444' }]}>{item.severity || 'Med'}</Text>
                  </View>
                  <Text style={styles.postText}>📍 Site: {item.assignedSite || item.site || item.target || 'General HQ'}</Text>
                  <Text style={styles.remarkBody}>{item.description || item.text}</Text>
                  <Text style={styles.timeLabel}>🕒 Reported: {new Date(item.createdAt || item.timestamp || Date.now()).toLocaleString()}</Text>
                </TouchableOpacity>
              );
            }

            // Shift Log Tab Item
            const isActive = item.status === 'ACTIVE';
            const comments = item.supervisoryComments || [];
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.guardName}>{item.guardName} <Text style={styles.employeeId}>({item.employeeId})</Text></Text>
                    <Text style={styles.postText}>📍 Post: {item.assignedSite}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: isActive ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                    <Text style={[styles.statusText, { color: isActive ? '#34d399' : '#ef4444' }]}>{isActive ? '🟢 Active' : '⚪ Completed'}</Text>
                  </View>
                </View>
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>In: {new Date(item.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  <Text style={styles.timeLabel}>{item.clockOutTime ? `Out: ${new Date(item.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'On-Duty'}</Text>
                </View>
                {comments.length > 0 && (
                  <View style={styles.remarkBox}>
                    <Text style={styles.remarkTitle}>💬 Remarks:</Text>
                    {comments.map((c, idx) => (
                      <View key={idx} style={{marginTop: 4}}>
                        <Text style={styles.remarkAuthor}>{c.authorName}:</Text>
                        <Text style={styles.remarkBody}>{c.comment}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <TouchableOpacity style={styles.remarkBtn} onPress={() => handleOpenCommentModal(item)}>
                  <Text style={styles.remarkBtnText}>📝 Add Supervisory Remark</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadSupervisorData();
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No records found for {user?.assignedSite}.</Text>
            </View>
          }
        />
      )}

      {/* Personnel Profile Modal with Lifetime Shifts (NIN Excluded) */}
      <Modal visible={profileModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>👤 Operative Profile & Lifetime Shifts</Text>
            <Text style={styles.modalSub}>{viewingStaff?.fullName} ({viewingStaff?.employeeId})</Text>

            <ScrollView style={{maxHeight: 320}} showsVerticalScrollIndicator={false}>
              <View style={styles.profileRow}><Text style={styles.profileLabel}>Role:</Text><Text style={styles.profileVal}>{viewingStaff?.role?.toUpperCase()}</Text></View>
              <View style={styles.profileRow}><Text style={styles.profileLabel}>Beat:</Text><Text style={styles.profileVal}>{viewingStaff?.assignedSite}</Text></View>
              <View style={styles.profileRow}><Text style={styles.profileLabel}>Email:</Text><Text style={styles.profileVal}>{viewingStaff?.email}</Text></View>
              <View style={styles.profileRow}><Text style={styles.profileLabel}>Phone:</Text><Text style={styles.profileVal}>{viewingStaff?.phone || 'N/A'}</Text></View>
              
              <Text style={[styles.sectionHeading, {marginTop: 14}]}>⏱️ Lifetime Shift History ({guardLifetimeShifts.length})</Text>
              {loadingLifetime ? (
                <ActivityIndicator color="#fbbf24" style={{marginVertical: 10}} />
              ) : guardLifetimeShifts.length === 0 ? (
                <Text style={{color: '#64748b', fontSize: 11, fontStyle: 'italic', marginTop: 4}}>No lifetime shift records found.</Text>
              ) : (
                guardLifetimeShifts.map((sh, idx) => (
                  <View key={sh._id || idx} style={styles.lifetimeShiftCard}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                      <Text style={{color: '#fbbf24', fontSize: 11, fontWeight: 'bold'}}>{sh.status}</Text>
                      <Text style={{color: '#94a3b8', fontSize: 10}}>{new Date(sh.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <Text style={{color: '#cbd5e1', fontSize: 10, marginTop: 2}}>In: {new Date(sh.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={[styles.saveBtn, {marginTop: 16}]} onPress={() => setProfileModalVisible(false)}>
              <Text style={styles.saveBtnText}>Close Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Remark Modal */}
      <Modal visible={commentModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Supervisory Remark</Text>
            <Text style={styles.modalSub}>Operative: {selectedShift?.guardName}</Text>

            <TextInput
              style={styles.textArea}
              placeholder="Enter compliance notes or performance review..."
              placeholderTextColor="#94a3b8"
              multiline
              value={commentText}
              onChangeText={setCommentText}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCommentModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handlePostRemark} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.saveBtnText}>Post Remark</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerSub: { color: '#fbbf24', fontSize: 9, fontWeight: 'bold' },
  headerTitle: { color: '#ffffff', fontSize: 15, fontWeight: 'bold', marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  logoutText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold' },

  actionBar: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#0b0f19' },
  actionTile: { flex: 1, backgroundColor: '#1e293b', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  actionText: { color: '#f8fafc', fontSize: 10, fontWeight: 'bold' },

  filterBar: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, backgroundColor: '#0b0f19', gap: 6 },
  filterChip: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  filterChipActive: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  filterChipText: { color: '#94a3b8', fontSize: 9, fontWeight: 'bold' },
  filterChipTextActive: { color: '#0f172a' },

  tabBar: { flexDirection: 'row', backgroundColor: '#0f172a', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: '#1e293b' },
  tabItem: { flex: 1, paddingVertical: 6, paddingHorizontal: 4, borderRadius: 8, backgroundColor: '#1e293b', alignItems: 'center', marginRight: 4 },
  tabItemActive: { backgroundColor: '#fbbf24' },
  tabText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  tabTextActive: { color: '#0f172a' },

  listContent: { padding: 16 },
  loaderCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  guardName: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  employeeId: { color: '#fbbf24', fontSize: 12 },
  postText: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: 'bold' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 8, marginBottom: 8 },
  timeLabel: { color: '#cbd5e1', fontSize: 11 },
  remarkBox: { backgroundColor: '#111827', borderRadius: 8, padding: 8, marginVertical: 6, borderWidth: 1, borderColor: '#1f2937' },
  remarkTitle: { color: '#64748b', fontSize: 9, fontWeight: 'bold', marginBottom: 2 },
  remarkAuthor: { color: '#38bdf8', fontSize: 10, fontWeight: 'bold' },
  remarkBody: { color: '#cbd5e1', fontSize: 11, marginTop: 1 },
  remarkBtn: { backgroundColor: '#1e293b', borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#334155', marginTop: 4 },
  remarkBtnText: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold' },

  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#64748b', fontSize: 12, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0f172a', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1e293b' },
  modalTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  modalSub: { color: '#94a3b8', fontSize: 12, marginBottom: 12, marginTop: 2 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  profileLabel: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
  profileVal: { color: '#ffffff', fontSize: 11, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  sectionHeading: { color: '#fbbf24', fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  lifetimeShiftCard: { backgroundColor: '#111827', borderRadius: 6, padding: 8, marginBottom: 6, borderWidth: 1, borderColor: '#1f2937' },
  textArea: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, padding: 12, color: '#ffffff', fontSize: 12, textAlignVertical: 'top', height: 90, marginBottom: 16 },
  modalBtnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#1e293b', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  saveBtn: { flex: 1, backgroundColor: '#fbbf24', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 12 }
});