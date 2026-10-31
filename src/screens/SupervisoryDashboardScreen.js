// src/screens/SupervisoryDashboardScreen.js
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
  Switch, 
  Alert,
  StatusBar,
  ScrollView,
  Linking
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client';
import { submitShiftComment } from '../api/supervisoryService';

const PAYROLL_GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1HOZ64R_1SluhhVlwRnVThhzax-xS1Z880jtiE12SYoE/edit';

const SUNSHINE_LOCATIONS = [
  'Bishop Oluwole', 'Beni Gold Apapa', 'Beni Gold Orile', 'Zion Court',
  'Beni Apartment', 'Ibukun House', 'Beni Gold Marina', 'Ibeju Warehouse',
  'Ilasun', 'Beni Gold VI', 'Beni Gold Ikoyi', 'Head Office',
  'Fatai Durosimi', 'Bashorun', 'Wharf Road', 'Orile Filing Station',
  'Stacco Filing Station', 'Okoko', 'Ibeju House'
];

const EXECUTIVE_ROLES = [
  'guard', 'supervisor', 'cso', 'field_operations_manager', 'head_of_operations', 'director'
];

export default function SupervisoryDashboardScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const userRole = (user?.role || '').toLowerCase();
  const isDirector = userRole === 'director' || userRole === 'admin';
  const isHeadOfOps = userRole === 'head_of_operations' || userRole === 'head of operations';
  
  const isHighestExecutive = isDirector || isHeadOfOps;
  const isCSO = userRole === 'cso';
  const isFieldOpsManager = userRole === 'field_operations_manager' || userRole === 'field operations manager';
  const isSupervisor = userRole === 'supervisor';

  const hasExecutiveAccess = isDirector || isHeadOfOps || isCSO || isFieldOpsManager;

  const [activeTab, setActiveTab] = useState('shifts');
  const [timeFilter, setTimeFilter] = useState('all');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [shifts, setShifts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [recruits, setRecruits] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [passwordResets, setPasswordResets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedShift, setSelectedShift] = useState(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [payrollApproved, setPayrollApproved] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newDesignation, setNewDesignation] = useState('guard');
  const [newSite, setNewSite] = useState('Beni Gold Ikoyi');
  const [staffComment, setStaffComment] = useState('');

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [viewingStaff, setViewingStaff] = useState(null);

  const [recruitModalVisible, setRecruitModalVisible] = useState(false);
  const [selectedRecruit, setSelectedRecruit] = useState(null);
  const [approvedRole, setApprovedRole] = useState('guard');
  const [assignedRecruitSite, setAssignedRecruitSite] = useState('Beni Gold Ikoyi');

  useEffect(() => {
    loadAllDashboardData();
  }, [user, timeFilter]);

  const loadAllDashboardData = async () => {
    setLoading(true);
    try {
      const siteFilter = isSupervisor ? user?.assignedSite : null;

      const shiftRes = await apiClient.get('/supervisory/shifts', { 
        params: { site: siteFilter, timeframe: timeFilter } 
      });
      setShifts(shiftRes.data.shifts || []);

      try {
        const incRes = await apiClient.get('/supervisory/incidents', { params: { timeframe: timeFilter } });
        setIncidents(incRes.data.incidents || []);
      } catch (e) { setIncidents([]); }

      if (isHighestExecutive) {
        try {
          const recRes = await apiClient.get('/admin/pending-users');
          setRecruits(recRes.data.users || []);
        } catch (e) { setRecruits([]); }

        try {
          const resetRes = await apiClient.get('/admin/password-resets');
          setPasswordResets(resetRes.data.resets || []);
        } catch (e) { setPasswordResets([]); }
      }

      fetchStaffDirectory();
    } catch (err) {
      console.error('Command Sync Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStaffDirectory = async (query = '') => {
    try {
      const res = await apiClient.get('/admin/staff-directory', { params: { query } });
      setStaffList(res.data.staff || []);
    } catch (e) {
      setStaffList([]);
    }
  };

  const handleExportReport = async () => {
    Alert.alert(
      '📊 Export & Payroll Sync',
      'Choose action:',
      [
        {
          text: '🔗 Open Google Payroll Sheet',
          onPress: () => Linking.openURL(PAYROLL_GOOGLE_SHEET_URL)
        },
        {
          text: '📁 Download Local CSV',
          onPress: async () => {
            let dataset = activeTab === 'shifts' ? shifts : activeTab === 'incidents' ? incidents : activeTab === 'recruits' ? recruits : staffList;
            if (!dataset || dataset.length === 0) return Alert.alert('Export Notice', 'No data available.');
            try {
              let csvHeader = 'ID,Name/Title,Details,Site/Email,Timestamp/Status\n';
              let csvRows = dataset.map((item, idx) => {
                const name = item.guardName || item.fullName || item.title || 'N/A';
                const site = item.assignedSite || item.site || item.target || 'N/A';
                const status = item.status || item.role || item.severity || 'Logged';
                return `${idx + 1},"${name}","${status}","${site}","${item.createdAt || new Date().toISOString()}"`;
              }).join('\n');

              const fileUri = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}Sunshine_${activeTab}_${Date.now()}.csv`;
              await FileSystem.writeAsStringAsync(fileUri, csvHeader + csvRows);
              if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(fileUri);
            } catch (e) {
              Alert.alert('Report Saved', `Export completed for ${dataset.length} records.`);
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleOpenCommentModal = (shift) => {
    setSelectedShift(shift);
    setCommentText('');
    setPayrollApproved(true);
    setCommentModalVisible(true);
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return Alert.alert('Validation Error', 'Enter supervisory remarks.');
    setSubmittingComment(true);
    try {
      const updatedShift = await submitShiftComment(selectedShift._id, commentText, payrollApproved);
      setShifts((prev) => prev.map((s) => (s._id === updatedShift._id ? updatedShift : s)));
      setCommentModalVisible(false);
      Alert.alert('Success', 'Supervisory review archived.');
    } catch (e) {
      Alert.alert('Error', 'Failed to submit review.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleOpenStaffModal = (staff) => {
    setSelectedStaff(staff);
    setNewDesignation(staff.role || 'guard');
    setNewSite(staff.assignedSite || 'Beni Gold Ikoyi');
    setStaffComment('');
    setStaffModalVisible(true);
  };

  const handleSaveStaffAction = async () => {
    try {
      await apiClient.post(`/admin/staff-action/${selectedStaff._id}`, {
        newSite: newSite,
        newRole: isHighestExecutive ? newDesignation : undefined,
        comment: staffComment
      });
      Alert.alert('Success', isHighestExecutive ? 'Staff record updated successfully.' : 'Beat assignment submitted for review.');
      setStaffModalVisible(false);
      fetchStaffDirectory(searchQuery);
    } catch (err) {
      Alert.alert('Error', 'Failed to update staff record.');
    }
  };

  const handleDeleteStaffAccount = (staffMember) => {
    if (!isHighestExecutive) {
      return Alert.alert('Unauthorized', 'Only the Head of Operations can delete staff accounts.');
    }

    Alert.alert(
      '⚠️ Delete Staff Account',
      `Are you sure you want to permanently delete ${staffMember.fullName} (${staffMember.employeeId})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/admin/staff/${staffMember._id}`);
              Alert.alert('Success', 'Staff account deleted.');
              fetchStaffDirectory(searchQuery);
            } catch (e) {
              Alert.alert('Error', 'Failed to delete staff account.');
            }
          }
        }
      ]
    );
  };

  const handleApproveRecruitWithRole = async () => {
    try {
      await apiClient.post(`/admin/approve-user/${selectedRecruit._id}`, {
        approvedRole,
        assignedSite: assignedRecruitSite
      });
      Alert.alert('Success', `Recruit granted access as ${approvedRole.toUpperCase()} at ${assignedRecruitSite}.`);
      setRecruitModalVisible(false);
      loadAllDashboardData();
    } catch (err) {
      Alert.alert('Error', 'Failed to approve recruit.');
    }
  };

  const handleFulfillReset = async (resetItem) => {
    Alert.prompt(
      '🔑 Reset Password',
      `Enter new password for ${resetItem.title}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update Password',
          onPress: async (newPass) => {
            if (!newPass) return Alert.alert('Error', 'Password cannot be empty.');
            try {
              await apiClient.post(`/admin/fulfill-password-reset/${resetItem.performedBy}`, { newPassword: newPass });
              Alert.alert('Success', 'Password updated successfully.');
              loadAllDashboardData();
            } catch (e) {
              Alert.alert('Error', 'Could not reset password.');
            }
          }
        }
      ],
      'secure-text'
    );
  };

  const getFilteredStaffList = () => {
    if (staffRoleFilter === 'all') return staffList;
    return staffList.filter(s => (s.role || '').toLowerCase() === staffRoleFilter);
  };

  const getRoleHeaderTitle = () => {
    if (isDirector) return 'DIRECTOR & EXECUTIVE COMMAND';
    if (isHeadOfOps) return 'HEAD OF OPERATIONS COMMAND';
    if (isCSO) return 'CHIEF SECURITY OFFICER COMMAND';
    if (isFieldOpsManager) return 'FIELD OPERATIONS MANAGER COMMAND';
    return `SUPERVISOR COMMAND • ${user?.assignedSite || 'SITE'}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />

      {/* Header */}
      <View style={styles.header}>
        <View style={{flex: 1}}>
          <Text style={styles.headerSubtitle}>{getRoleHeaderTitle()}</Text>
          <Text style={styles.headerTitle}>{user?.fullName || 'Command Officer'}</Text>
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionTile} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.actionTileText}>👤 Profile Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionTile, { backgroundColor: '#fbbf24' }]} onPress={handleExportReport}>
          <Text style={[styles.actionTileText, { color: '#070b19' }]}>📊 Export & Payroll Sync</Text>
        </TouchableOpacity>
      </View>

      {/* Time Filters */}
      <View style={styles.filterBar}>
        {['daily', 'weekly', 'monthly', 'all'].map((tf) => (
          <TouchableOpacity 
            key={tf} 
            style={[styles.filterChip, timeFilter === tf && styles.filterChipActive]}
            onPress={() => setTimeFilter(tf)}
          >
            <Text style={[styles.filterChipText, timeFilter === tf && styles.filterChipTextActive]}>
              {tf.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {[
          { key: 'shifts', label: `1. Shift Logs (${shifts.length})` },
          { key: 'incidents', label: `2. Incidents (${incidents.length})` },
          ...(isHighestExecutive ? [
            { key: 'recruits', label: `3. New Recruits (${recruits.length})` }
          ] : []),
          { key: 'staff', label: `4. Staff Directory (${staffList.length})` },
          ...(isHighestExecutive ? [
            { key: 'resets', label: `5. Reset Requests (${passwordResets.length})` }
          ] : [])
        ].map((tab) => (
          <TouchableOpacity 
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeTab === 'staff' && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff by Name, ID, or Location..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={(txt) => {
              setSearchQuery(txt);
              fetchStaffDirectory(txt);
            }}
          />
          <View style={styles.staffRoleFilterRow}>
            {[
              { key: 'all', label: 'All Staff' },
              { key: 'guard', label: 'Guards Only' },
              { key: 'supervisor', label: 'Supervisors Only' }
            ].map(rf => (
              <TouchableOpacity 
                key={rf.key} 
                style={[styles.roleChip, staffRoleFilter === rf.key && styles.roleChipActive]}
                onPress={() => setStaffRoleFilter(rf.key)}
              >
                <Text style={[styles.roleChipText, staffRoleFilter === rf.key && styles.roleChipTextActive]}>{rf.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#fbbf24" />
          <Text style={{color: '#94a3b8', marginTop: 10, fontSize: 12}}>Loading Command Data...</Text>
        </View>
      ) : (
        <FlatList
          data={
            activeTab === 'shifts' ? shifts :
            activeTab === 'incidents' ? incidents :
            activeTab === 'recruits' ? recruits :
            activeTab === 'resets' ? passwordResets : getFilteredStaffList()
          }
          keyExtractor={(item, index) => item._id || item.id || index.toString()}
          renderItem={({ item }) => {
            if (activeTab === 'shifts') {
              const isShiftActive = item.status === 'ACTIVE';
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>{item.guardName} <Text style={styles.badgeText}>({item.employeeId})</Text></Text>
                      <Text style={styles.cardSub}>📍 {item.assignedSite}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: isShiftActive ? 'rgba(52, 211, 153, 0.15)' : 'rgba(148, 163, 184, 0.15)' }]}>
                      <Text style={[styles.statusBadgeText, { color: isShiftActive ? '#34d399' : '#94a3b8' }]}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>⏱️ In: {new Date(item.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    <Text style={styles.timeText}>Out: {item.clockOutTime ? new Date(item.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'On-Duty'}</Text>
                  </View>
                  <TouchableOpacity style={styles.reviewBtn} onPress={() => handleOpenCommentModal(item)}>
                    <Text style={styles.reviewBtnText}>📝 Add Supervisory Review & Payroll Clearance</Text>
                  </TouchableOpacity>
                </View>
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
                    <Text style={styles.cardTitle}>{item.title || item.category || 'Security Breach / Incident'}</Text>
                    <Text style={[styles.statusBadgeText, { color: '#ef4444' }]}>{item.severity || 'High'}</Text>
                  </View>
                  <Text style={styles.cardSub}>📍 Site: {item.assignedSite || item.site || item.target || 'General HQ'}</Text>
                  <Text style={styles.commentBody}>{item.description || item.text}</Text>
                  <Text style={styles.timeText}>🕒 Reported: {new Date(item.createdAt || item.timestamp || Date.now()).toLocaleString()}</Text>
                </TouchableOpacity>
              );
            }

            if (activeTab === 'recruits' && isHighestExecutive) {
              return (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{item.fullName}</Text>
                  <Text style={styles.cardSub}>✉️ {item.email} | 📱 {item.phone}</Text>
                  <Text style={styles.cardSub}>📍 Current Status: Unassigned / Pending Designation</Text>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => { setSelectedRecruit(item); setRecruitModalVisible(true); }}>
                    <Text style={styles.approveBtnText}>✓ Assign Role & Station to Grant Access</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            if (activeTab === 'resets' && isHighestExecutive) {
              return (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>🔑 {item.title || 'Password Reset Request'}</Text>
                  <Text style={styles.cardSub}>{item.description}</Text>
                  <Text style={styles.timeText}>🕒 Requested: {new Date(item.createdAt || Date.now()).toLocaleString()}</Text>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleFulfillReset(item)}>
                    <Text style={styles.approveBtnText}>🔓 Fulfill Password Reset</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            return (
              <TouchableOpacity 
                style={styles.card} 
                activeOpacity={0.85}
                onPress={() => { setViewingStaff(item); setProfileModalVisible(true); }}
              >
                <View style={styles.cardHeader}>
                  <View style={{flex: 1}}>
                    <Text style={styles.cardTitle}>{item.fullName}</Text>
                    <Text style={styles.cardSub}>ID: {item.employeeId} • ROLE: {item.role?.toUpperCase()}</Text>
                    <Text style={styles.cardSub}>📍 Beat: {item.assignedSite}</Text>
                  </View>
                  <View style={{flexDirection: 'row', gap: 6}}>
                    <TouchableOpacity style={styles.actionBtn} onPress={(e) => { e.stopPropagation(); handleOpenStaffModal(item); }}>
                      <Text style={styles.actionBtnText}>⚙️ Manage</Text>
                    </TouchableOpacity>
                    {isHighestExecutive && (
                      <TouchableOpacity style={styles.deleteBtn} onPress={(e) => { e.stopPropagation(); handleDeleteStaffAccount(item); }}>
                        <Text style={styles.deleteBtnText}>🗑️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
          refreshing={refreshing}
          onRefresh={loadAllDashboardData}
        />
      )}

      {/* Staff Full Profile View Modal */}
      <Modal visible={profileModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>👤 Operative Profile Record</Text>
            <Text style={styles.modalSub}>{viewingStaff?.fullName} ({viewingStaff?.employeeId})</Text>

            <ScrollView style={{maxHeight: 280}} showsVerticalScrollIndicator={false}>
              <View style={styles.profileDetailRow}><Text style={styles.profileLabel}>Role:</Text><Text style={styles.profileVal}>{viewingStaff?.role?.toUpperCase()}</Text></View>
              <View style={styles.profileDetailRow}><Text style={styles.profileLabel}>Beat:</Text><Text style={styles.profileVal}>{viewingStaff?.assignedSite}</Text></View>
              <View style={styles.profileDetailRow}><Text style={styles.profileLabel}>Email:</Text><Text style={styles.profileVal}>{viewingStaff?.email}</Text></View>
              <View style={styles.profileDetailRow}><Text style={styles.profileLabel}>Phone:</Text><Text style={styles.profileVal}>{viewingStaff?.phone || 'N/A'}</Text></View>
              <View style={styles.profileDetailRow}><Text style={styles.profileLabel}>NIN:</Text><Text style={[styles.profileVal, {color: viewingStaff?.nin ? '#34d399' : '#ef4444'}]}>{viewingStaff?.nin || 'Not Provided'}</Text></View>
              <View style={styles.profileDetailRow}><Text style={styles.profileLabel}>Address:</Text><Text style={styles.profileVal}>{viewingStaff?.address || 'Not Provided'}</Text></View>
              <View style={styles.profileDetailRow}><Text style={styles.profileLabel}>Guarantor:</Text><Text style={styles.profileVal}>{viewingStaff?.guarantorName || 'Not Provided'}</Text></View>
              <View style={styles.profileDetailRow}><Text style={styles.profileLabel}>Guarantor Phone:</Text><Text style={styles.profileVal}>{viewingStaff?.guarantorPhone || 'Not Provided'}</Text></View>
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={() => setProfileModalVisible(false)}>
              <Text style={styles.saveBtnText}>Close Profile View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Recruit Clearance Modal */}
      <Modal visible={recruitModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>Assign Designation & Beat Station</Text>
            <Text style={styles.modalSub}>Recruit: {selectedRecruit?.fullName}</Text>

            <ScrollView style={{maxHeight: 280}} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>1. Select Executive / Operative Role</Text>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12}}>
                {EXECUTIVE_ROLES.map((r) => (
                  <TouchableOpacity key={r} style={[styles.chipBtn, approvedRole === r && styles.chipBtnActive]} onPress={() => setApprovedRole(r)}>
                    <Text style={[styles.chipBtnText, approvedRole === r && styles.chipBtnTextActive]}>{r.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>2. Select Station / Beat Location</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 16}}>
                {SUNSHINE_LOCATIONS.map((loc) => (
                  <TouchableOpacity key={loc} style={[styles.chipBtn, assignedRecruitSite === loc && styles.chipBtnActive]} onPress={() => setAssignedRecruitSite(loc)}>
                    <Text style={[styles.chipBtnText, assignedRecruitSite === loc && styles.chipBtnTextActive]}>{loc}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRecruitModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleApproveRecruitWithRole}>
                <Text style={styles.saveBtnText}>Grant Terminal Access</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Shift Review Modal */}
      <Modal visible={commentModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>Shift Audit & Payroll Clearance</Text>
            <Text style={styles.modalSub}>Operative: {selectedShift?.guardName}</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter supervisory notes..."
              placeholderTextColor="#94a3b8"
              multiline
              value={commentText}
              onChangeText={setCommentText}
            />
            {hasExecutiveAccess && (
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Approve Shift for Wage Payroll</Text>
                <Switch value={payrollApproved} onValueChange={setPayrollApproved} />
              </View>
            )}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCommentModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handlePostComment} disabled={submittingComment}>
                {submittingComment ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.saveBtnText}>Save Review</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Staff Management Modal */}
      <Modal visible={staffModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>Manage Personnel File</Text>
            <Text style={styles.modalSub}>{selectedStaff?.fullName}</Text>

            <Text style={styles.label}>Assign New Station / Beat</Text>
            <ScrollView horizontal style={{marginBottom: 10}} showsHorizontalScrollIndicator={false}>
              {SUNSHINE_LOCATIONS.map((loc) => (
                <TouchableOpacity key={loc} style={[styles.chipBtn, newSite === loc && styles.chipBtnActive]} onPress={() => setNewSite(loc)}>
                  <Text style={[styles.chipBtnText, newSite === loc && styles.chipBtnTextActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {isHighestExecutive ? (
              <>
                <Text style={styles.label}>Update Designation / Role (Head of Ops Privilege)</Text>
                <ScrollView horizontal style={{marginBottom: 10}} showsHorizontalScrollIndicator={false}>
                  {EXECUTIVE_ROLES.map((r) => (
                    <TouchableOpacity key={r} style={[styles.chipBtn, newDesignation === r && styles.chipBtnActive]} onPress={() => setNewDesignation(r)}>
                      <Text style={[styles.chipBtnText, newDesignation === r && styles.chipBtnTextActive]}>{r.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <Text style={{color: '#94a3b8', fontSize: 10, marginVertical: 6}}>ℹ️ Beat assignment is subject to Head of Operations review.</Text>
            )}

            <Text style={styles.label}>Supervisory Remarks / Transfer Notes</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter notes..."
              placeholderTextColor="#94a3b8"
              multiline
              value={staffComment}
              onChangeText={setStaffComment}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setStaffModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveStaffAction}>
                <Text style={styles.saveBtnText}>Save Telemetry</Text>
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
  headerSubtitle: { color: '#fbbf24', fontSize: 9, fontWeight: 'bold' },
  headerTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  logoutText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold' },

  actionBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#0b0f19' },
  actionTile: { flex: 1, backgroundColor: '#1e293b', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  actionTileText: { color: '#f8fafc', fontSize: 10, fontWeight: 'bold' },

  filterBar: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, backgroundColor: '#0b0f19', gap: 6 },
  filterChip: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  filterChipActive: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  filterChipText: { color: '#94a3b8', fontSize: 9, fontWeight: 'bold' },
  filterChipTextActive: { color: '#0f172a' },

  tabBar: { flexDirection: 'row', backgroundColor: '#0f172a', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: '#1e293b', maxHeight: 46 },
  tabItem: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#1e293b', marginRight: 8, height: 30, justifyContent: 'center' },
  tabItemActive: { backgroundColor: '#fbbf24' },
  tabText: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
  tabTextActive: { color: '#0f172a' },

  searchContainer: { paddingHorizontal: 16, paddingTop: 10 },
  searchInput: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 12, marginBottom: 8 },
  staffRoleFilterRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  roleChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  roleChipActive: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  roleChipText: { color: '#94a3b8', fontSize: 9, fontWeight: 'bold' },
  roleChipTextActive: { color: '#0f172a' },

  listContent: { padding: 16 },
  loaderCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  badgeText: { color: '#fbbf24', fontSize: 11 },
  cardSub: { color: '#94a3b8', fontSize: 11, marginBottom: 2 },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  statusBadgeText: { fontSize: 9, fontWeight: 'bold' },

  timeRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 8, marginBottom: 8 },
  timeText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  commentBody: { color: '#cbd5e1', fontSize: 11, marginTop: 4 },

  actionBtn: { backgroundColor: '#1e293b', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#38bdf8' },
  actionBtnText: { color: '#38bdf8', fontSize: 10, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  deleteBtnText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold' },

  reviewBtn: { backgroundColor: '#1e293b', borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#334155', marginTop: 4 },
  reviewBtnText: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold' },

  approveBtn: { backgroundColor: 'rgba(52, 211, 153, 0.15)', paddingVertical: 8, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  approveBtnText: { color: '#34d399', fontSize: 11, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0f172a', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1e293b', maxHeight: '85%' },
  modalTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  modalSub: { color: '#94a3b8', fontSize: 12, marginBottom: 12 },
  
  profileDetailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  profileLabel: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
  profileVal: { color: '#ffffff', fontSize: 11, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },

  label: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', marginBottom: 4, marginTop: 8 },
  chipBtn: { backgroundColor: '#111827', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#1f2937', marginRight: 6, marginBottom: 6 },
  chipBtnActive: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  chipBtnText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  chipBtnTextActive: { color: '#0f172a' },
  textArea: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 12, color: '#ffffff', fontSize: 12, height: 75, marginBottom: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, backgroundColor: '#111827', padding: 10, borderRadius: 8 },
  switchLabel: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },

  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#1e293b', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  saveBtn: { flex: 1, backgroundColor: '#fbbf24', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 12 }
});