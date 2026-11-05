// src/screens/SupervisoryDashboardScreen.js
import React, { useState, useEffect, useContext, useRef } from 'react';
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
  Linking,
  AppState
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Location from 'expo-location';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client';
import SideMenu, { MenuButton } from '../components/SideMenu';
import { submitShiftComment } from '../api/supervisoryService';

const PAYROLL_GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1HOZ64R_1SluhhVlwRnVThhzax-xS1Z880jtiE12SYoE/edit';

const SUNSHINE_LOCATIONS = [
  'Bishop Oluwole', 'Beni Gold Apapa', 'Beni Gold Orile', 'Zion Court',
  'Beni Apartment', 'Ibukun House', 'Beni Gold Marina', 'Ibeju Warehouse',
  'Ilasun', 'Beni Gold VI', 'Beni Gold Ikoyi', 'Head Office',
  'Fatai Durosimi', 'Bashorun', 'Wharf Road', 'Orile Filing Station',
  'Stacco Filing Station', 'Okoko', 'Ibeju House'
];

export default function SupervisoryDashboardScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const userRole = (user?.role || '').toLowerCase();
  const isDirector = userRole === 'director' || userRole === 'admin';
  const isHeadOfOps = userRole === 'head_of_operations' || userRole === 'head of operations';
  const isFieldOpsManager = userRole === 'field_operations_manager' || userRole === 'field operations manager';
  const isCSO = userRole === 'cso';
  const isSupervisor = userRole === 'supervisor';

  const isHighestExecutive = isDirector || isHeadOfOps;
  const hasExecutiveAccess = isDirector || isHeadOfOps || isCSO || isFieldOpsManager;

  const [activeTab, setActiveTab] = useState(isSupervisor ? 'guards' : 'shifts');
  const [menuVisible, setMenuVisible] = useState(false);
  const [timeFilter, setTimeFilter] = useState('daily'); // Default to Daily for accurate shift logs
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [locationGuards, setLocationGuards] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [recruits, setRecruits] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [fieldReports, setFieldReports] = useState([]);
  const [deadlineAlert, setDeadlineAlert] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Supervisor Personal Active Shift State
  const [activeShift, setActiveShift] = useState(null);
  const [clocking, setClocking] = useState(false);

  // Field Report Modal
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportLocation, setReportLocation] = useState(user?.assignedSite || 'Lagos Command HQ');
  const [reportSummary, setReportSummary] = useState('');
  const [reportChallenges, setReportChallenges] = useState('');
  const [reportRecommendations, setReportRecommendations] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

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
  const [guardLifetimeShifts, setGuardLifetimeShifts] = useState([]);
  const [loadingLifetime, setLoadingLifetime] = useState(false);

  const [recruitModalVisible, setRecruitModalVisible] = useState(false);
  const [selectedRecruit, setSelectedRecruit] = useState(null);
  const [approvedRole, setApprovedRole] = useState('guard');
  const [assignedRecruitSite, setAssignedRecruitSite] = useState('Beni Gold Ikoyi');

  // 60-Second Inactivity Auto-Logout Timer Integration
  const inactivityTimerRef = useRef(null);

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      Alert.alert(
        '🔒 Session Expired',
        'You have been logged out due to 60 seconds of inactivity to protect command security.',
        [{ text: 'OK', onPress: logout }]
      );
    }, 60000); // 60 seconds
  };

  useEffect(() => {
    resetInactivityTimer();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') resetInactivityTimer();
    });

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    loadAllDashboardData();
    if (isSupervisor) checkPersonalShift();
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

      try {
        const repRes = await apiClient.get('/admin/field-reports');
        setFieldReports(repRes.data.reports || []);
        setDeadlineAlert(repRes.data.deadlinePassedAlert || false);
      } catch (e) { setFieldReports([]); }

      if (isHighestExecutive) {
        try {
          const recRes = await apiClient.get('/admin/pending-users');
          setRecruits(recRes.data.users || []);
        } catch (e) { setRecruits([]); }
      }

      fetchStaffDirectory();
    } catch (err) {
      console.error('Command Sync Error:', err);
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
    resetInactivityTimer();
    setClocking(true);
    try {
      if (activeShift) {
        await apiClient.post('/shifts/end');
        setActiveShift(null);
        Alert.alert('Shift Ended', 'You have successfully clocked out.');
      } else {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return Alert.alert('Permission Denied', 'Location permission is required for geofenced shift clock-in.');
        }

        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude } = location.coords;

        const res = await apiClient.post('/shifts/start', { latitude, longitude });
        setActiveShift(res.data.shift);
        Alert.alert('Shift Started', `Clocked on successfully at ${user?.assignedSite || 'Beat Station'}.`);
      }
      loadAllDashboardData();
    } catch (e) {
      Alert.alert('Geofence Violation / Error', e.response?.data?.error || 'Failed to update shift status.');
    } finally {
      setClocking(false);
    }
  };

  const fetchStaffDirectory = async (query = '') => {
    try {
      const res = await apiClient.get('/admin/staff-directory', { params: { query } });
      setStaffList(res.data.staff || []);
      if (isSupervisor) {
        const local = (res.data.staff || []).filter(s => s.assignedSite === user?.assignedSite);
        setLocationGuards(local);
      }
    } catch (e) {
      setStaffList([]);
    }
  };

  const handleExportReport = async () => {
    resetInactivityTimer();
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
            let dataset = activeTab === 'shifts' ? shifts : activeTab === 'incidents' ? incidents : activeTab === 'reports' ? fieldReports : staffList;
            if (!dataset || dataset.length === 0) return Alert.alert('Export Notice', 'No data available.');
            try {
              let csvHeader = 'ID,Name/Title,Details,Site/Email,Timestamp/Status\n';
              let csvRows = dataset.map((item, idx) => {
                const name = item.guardName || item.fullName || item.authorName || 'N/A';
                const site = item.assignedSite || item.site || item.location || 'N/A';
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

  const handleOpenProfileWithShifts = async (staff) => {
    resetInactivityTimer();
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
    resetInactivityTimer();
    setSelectedShift(shift);
    setCommentText('');
    setPayrollApproved(true);
    setCommentModalVisible(true);
  };

  const handlePostComment = async () => {
    resetInactivityTimer();
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
    resetInactivityTimer();
    setSelectedStaff(staff);
    setNewDesignation(staff.role || 'guard');
    setNewSite(staff.assignedSite || 'Beni Gold Ikoyi');
    setStaffComment('');
    setStaffModalVisible(true);
  };

  const handleSaveStaffAction = async () => {
    resetInactivityTimer();
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
    resetInactivityTimer();
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
    resetInactivityTimer();
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

  const handleFieldReportSubmit = async () => {
    resetInactivityTimer();
    if (!reportSummary.trim()) return Alert.alert('Validation Error', 'Please enter an operational summary.');
    setSubmittingReport(true);
    try {
      await apiClient.post('/admin/field-reports', {
        location: reportLocation,
        summary: reportSummary,
        operationalChallenges: reportChallenges,
        recommendations: reportRecommendations
      });
      Alert.alert('Success', 'Weekly administrative field report submitted successfully.');
      setReportModalVisible(false);
      setReportSummary('');
      setReportChallenges('');
      setReportRecommendations('');
      loadAllDashboardData();
    } catch (e) {
      Alert.alert('Error', 'Failed to submit field report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const getFilteredStaffList = () => {
    if (staffRoleFilter === 'all') return staffList;
    return staffList.filter(s => (s.role || '').toLowerCase() === staffRoleFilter);
  };

  const getRoleHeaderTitle = () => {
    if (isDirector) return 'DIRECTOR & EXECUTIVE COMMAND';
    if (isHeadOfOps) return 'HEAD OF OPERATIONS COMMAND';
    if (isFieldOpsManager) return 'FIELD OPERATIONS MANAGER COMMAND';
    if (isCSO) return 'CHIEF SECURITY OFFICER COMMAND';
    return `SITE SUPERVISOR COMMAND • ${user?.assignedSite || 'SITE'}`;
  };

  const sectionTitles = { guards: 'Location Guards', shifts: 'Shift Logs', incidents: 'Incidents', reports: 'Field Reports', recruits: 'New Recruits', staff: 'Staff Directory' };
  const sectionTitle = sectionTitles[activeTab] || 'Command';

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems = [
    ...(isSupervisor ? [{ key: 'guards', icon: '👥', label: 'Location Guards', tint: 'rgba(59, 130, 246, 0.15)', badge: locationGuards.length, active: activeTab === 'guards', onPress: () => { resetInactivityTimer(); setActiveTab('guards'); } }] : []),
    { key: 'shifts', icon: '🕒', label: 'Shift Logs', tint: 'rgba(52, 211, 153, 0.15)', badge: shifts.length, active: activeTab === 'shifts', onPress: () => { resetInactivityTimer(); setActiveTab('shifts'); } },
    { key: 'incidents', icon: '⚠️', label: 'Incidents', tint: 'rgba(245, 158, 11, 0.15)', badge: incidents.length, active: activeTab === 'incidents', onPress: () => { resetInactivityTimer(); setActiveTab('incidents'); } },
    { key: 'reports', icon: '📋', label: 'Field Reports', tint: 'rgba(168, 85, 247, 0.15)', badge: fieldReports.length, active: activeTab === 'reports', onPress: () => { resetInactivityTimer(); setActiveTab('reports'); } },
    ...(isHighestExecutive
      ? [{ key: 'recruits', icon: '👥', label: 'New Recruits', tint: 'rgba(56, 189, 248, 0.15)', badge: recruits.length, active: activeTab === 'recruits', onPress: () => { resetInactivityTimer(); setActiveTab('recruits'); } }]
      : []),
    { key: 'staff', icon: '🛡️', label: 'Staff Directory', tint: 'rgba(59, 130, 246, 0.15)', badge: staffList.length, active: activeTab === 'staff', onPress: () => { resetInactivityTimer(); setActiveTab('staff'); } },
    { divider: true },
    ...(isSupervisor ? [
      {
        key: 'clock',
        icon: activeShift ? '⏹️' : '⏱️',
        label: clocking ? 'Processing...' : activeShift ? 'Clock Out' : 'Clock In',
        tint: activeShift ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.15)',
        onPress: handleToggleSupervisorClock,
      },
      { key: 'report-incident', icon: '🚨', label: 'Report Incident', tint: 'rgba(245, 158, 11, 0.15)', onPress: () => { resetInactivityTimer(); navigation.navigate('IncidentReport'); } }
    ] : []),
    { key: 'profile', icon: '👤', label: 'Profile Settings', tint: 'rgba(148, 163, 184, 0.15)', onPress: () => { resetInactivityTimer(); navigation.navigate('Profile'); } },
    { key: 'export', icon: '📊', label: 'Export & Payroll', tint: 'rgba(251, 191, 36, 0.15)', onPress: handleExportReport },
    ...(isFieldOpsManager
      ? [{ key: 'submit-report', icon: '📝', label: 'Submit Report', tint: 'rgba(56, 189, 248, 0.15)', onPress: () => { resetInactivityTimer(); setReportModalVisible(true); } }]
      : []),
    { divider: true },
    { key: 'logout', icon: '🚪', label: 'Logout', tint: 'rgba(239, 68, 68, 0.15)', danger: true, onPress: confirmLogout },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']} onTouchStart={resetInactivityTimer}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />

      {/* Header */}
      <View style={styles.header}>
        <MenuButton onPress={() => { resetInactivityTimer(); setMenuVisible(true); }} />
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{getRoleHeaderTitle()}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{sectionTitle}</Text>
        </View>
      </View>

      {/* Friday Deadline Warning Notification Ping Banner */}
      {deadlineAlert && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertBannerText}>🚨 NOTIFICATION PING: Weekly Field Report overdue past Friday 7:00 PM deadline!</Text>
        </View>
      )}

      {/* Spaced Time Filter Bar */}
      {(activeTab === 'shifts' || activeTab === 'incidents') && (
        <View style={styles.filterBar}>
          {['daily', 'weekly', 'monthly', 'all'].map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.filterChip, timeFilter === tf && styles.filterChipActive]}
              onPress={() => { resetInactivityTimer(); setTimeFilter(tf); }}
            >
              <Text style={[styles.filterChipText, timeFilter === tf && styles.filterChipTextActive]}>
                {tf.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title="Menu"
        subtitle={user?.fullName || 'Navigation'}
        items={menuItems}
      />

      {activeTab === 'staff' && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff by Name, ID, or Location..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={(txt) => {
              resetInactivityTimer();
              setSearchQuery(txt);
              fetchStaffDirectory(txt);
            }}
          />
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
            isSupervisor && activeTab === 'guards' ? locationGuards :
            activeTab === 'shifts' ? shifts :
            activeTab === 'incidents' ? incidents :
            activeTab === 'reports' ? fieldReports :
            activeTab === 'recruits' ? recruits : getFilteredStaffList()
          }
          keyExtractor={(item, index) => item._id || item.id || index.toString()}
          ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 40}}>
              <Text style={{color: '#94a3b8', fontSize: 13}}>No records logged for {timeFilter.toUpperCase()} timeframe.</Text>
            </View>
          }
          renderItem={({ item }) => {
            if (isSupervisor && activeTab === 'guards') {
              return (
                <TouchableOpacity 
                  style={styles.card} 
                  activeOpacity={0.85}
                  onPress={() => handleOpenProfileWithShifts(item)}
                >
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>{item.fullName} <Text style={styles.badgeText}>({item.employeeId})</Text></Text>
                      <Text style={styles.cardSub}>📍 Role: {item.role?.toUpperCase()} | Beat: {item.assignedSite}</Text>
                    </View>
                    <Text style={{color: '#38bdf8', fontSize: 11}}>View Profile ➔</Text>
                  </View>
                  <Text style={styles.timeText}>✉️ {item.email} | 📱 {item.phone || 'N/A'}</Text>
                </TouchableOpacity>
              );
            }

            if (activeTab === 'shifts') {
              const isShiftActive = item.status === 'ACTIVE';
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>{item.guardName} <Text style={styles.badgeText}>({item.employeeId})</Text></Text>
                      <Text style={styles.cardSub}>📍 Beat Station: {item.assignedSite}</Text>
                      <Text style={styles.cardSub}>🛡️ Relief Officer: <Text style={{color: '#38bdf8', fontWeight: 'bold'}}>{item.reliefOfficer || 'Standard Post'}</Text></Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: isShiftActive ? 'rgba(52, 211, 153, 0.15)' : 'rgba(148, 163, 184, 0.15)' }]}>
                      <Text style={[styles.statusBadgeText, { color: isShiftActive ? '#34d399' : '#94a3b8' }]}>{item.status}</Text>
                    </View>
                  </View>

                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>📅 Date: {new Date(item.createdAt || item.clockInTime).toLocaleDateString()}</Text>
                    <Text style={styles.timeText}>⏱️ In: {new Date(item.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    <Text style={styles.timeText}>Out: {item.clockOutTime ? new Date(item.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'On-Duty'}</Text>
                  </View>

                  {item.handoverNotes ? (
                    <View style={{backgroundColor: '#111827', padding: 8, borderRadius: 6, marginTop: 4, marginBottom: 6}}>
                      <Text style={{color: '#94a3b8', fontSize: 10, fontWeight: 'bold'}}>Handover Notes:</Text>
                      <Text style={{color: '#cbd5e1', fontSize: 11}}>{item.handoverNotes}</Text>
                    </View>
                  ) : null}

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
                  onPress={() => { resetInactivityTimer(); navigation.navigate('IncidentDetail', { incident: item }); }}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.title || item.category || 'Security Breach'}</Text>
                    <Text style={[styles.statusBadgeText, { color: '#ef4444' }]}>{item.severity || 'High'}</Text>
                  </View>
                  <Text style={styles.cardSub}>📍 Site: {item.assignedSite || item.site || 'General HQ'}</Text>
                  <Text style={styles.commentBody}>{item.description || item.text}</Text>
                  <Text style={styles.timeText}>🕒 Reported: {new Date(item.createdAt || Date.now()).toLocaleString()}</Text>
                </TouchableOpacity>
              );
            }

            if (activeTab === 'reports') {
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>📋 Administrative Field Report</Text>
                    <Text style={styles.badgeText}>{item.location}</Text>
                  </View>
                  <Text style={styles.cardSub}>👤 Submitted by: {item.authorName} ({item.authorRole?.toUpperCase()})</Text>
                  
                  <Text style={styles.commentBody}>
                    <Text style={{fontWeight: 'bold', color: '#fff'}}>1. Location:</Text> {item.location || 'Not Specified'}
                  </Text>
                  
                  <Text style={styles.commentBody}>
                    <Text style={{fontWeight: 'bold', color: '#fff'}}>2. Operational Summary:</Text> {item.summary}
                  </Text>
                  
                  <Text style={styles.commentBody}>
                    <Text style={{fontWeight: 'bold', color: '#fff'}}>3. Operational Challenges:</Text> {item.operationalChallenges}
                  </Text>
                  
                  <Text style={styles.commentBody}>
                    <Text style={{fontWeight: 'bold', color: '#fff'}}>4. Recommendations for HQ:</Text> {item.recommendations}
                  </Text>
                  
                  <Text style={styles.timeText}>🕒 Submitted: {new Date(item.createdAt).toLocaleString()}</Text>
                </View>
              );
            }

            if (activeTab === 'recruits' && isHighestExecutive) {
              return (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{item.fullName}</Text>
                  <Text style={styles.cardSub}>✉️ {item.email} | 📱 {item.phone}</Text>
                  <Text style={styles.cardSub}>📍 Current Status: Unassigned / Pending Designation</Text>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => { resetInactivityTimer(); setSelectedRecruit(item); setRecruitModalVisible(true); }}>
                    <Text style={styles.approveBtnText}>✓ Assign Role & Station to Grant Access</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            return (
              <TouchableOpacity 
                style={styles.card} 
                activeOpacity={0.85}
                onPress={() => { resetInactivityTimer(); setViewingStaff(item); setProfileModalVisible(true); }}
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
          onRefresh={() => { resetInactivityTimer(); loadAllDashboardData(); }}
        />
      )}

      {/* Field Report Submission Modal */}
      <Modal visible={reportModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>📋 Submit Weekly Field Report</Text>
            <Text style={styles.modalSub}>Due every Friday by 7:00 PM</Text>

            <ScrollView style={{maxHeight: 340}} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>1. Location / Station</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Enter location..."
                placeholderTextColor="#94a3b8"
                value={reportLocation}
                onChangeText={(txt) => { resetInactivityTimer(); setReportLocation(txt); }}
              />

              <Text style={styles.label}>2. Operational Summary</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter summary..."
                placeholderTextColor="#94a3b8"
                multiline
                value={reportSummary}
                onChangeText={(txt) => { resetInactivityTimer(); setReportSummary(txt); }}
              />

              <Text style={styles.label}>3. Operational Challenges</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter challenges..."
                placeholderTextColor="#94a3b8"
                multiline
                value={reportChallenges}
                onChangeText={(txt) => { resetInactivityTimer(); setReportChallenges(txt); }}
              />

              <Text style={styles.label}>4. Recommendations for Headquarters</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter recommendations..."
                placeholderTextColor="#94a3b8"
                multiline
                value={reportRecommendations}
                onChangeText={(txt) => { resetInactivityTimer(); setReportRecommendations(txt); }}
              />
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setReportModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleFieldReportSubmit} disabled={submittingReport}>
                {submittingReport ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.saveBtnText}>Submit Report</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Supervisory Review & Payroll Clearance Modal */}
      <Modal visible={commentModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>📝 Supervisory Review</Text>
            <Text style={styles.modalSub}>Operative: {selectedShift?.guardName} ({selectedShift?.employeeId})</Text>

            <TextInput
              style={styles.textArea}
              placeholder="Enter supervisory comments..."
              placeholderTextColor="#94a3b8"
              multiline
              value={commentText}
              onChangeText={(txt) => { resetInactivityTimer(); setCommentText(txt); }}
            />

            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12}}>
              <Text style={{color: '#fff', fontSize: 12, fontWeight: 'bold'}}>Approve Shift for Payroll</Text>
              <Switch
                value={payrollApproved}
                onValueChange={(val) => { resetInactivityTimer(); setPayrollApproved(val); }}
                trackColor={{ false: '#334155', true: '#34d399' }}
              />
            </View>

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

      {/* Profile & Lifetime Shifts Modal */}
      <Modal visible={profileModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>👤 Operative Profile</Text>
            <Text style={styles.modalSub}>{viewingStaff?.fullName} ({viewingStaff?.employeeId})</Text>

            <ScrollView style={{maxHeight: 320}} showsVerticalScrollIndicator={false}>
              <Text style={styles.cardSub}>Email: {viewingStaff?.email}</Text>
              <Text style={styles.cardSub}>Phone: {viewingStaff?.phone || 'N/A'}</Text>
              <Text style={styles.cardSub}>Role: {viewingStaff?.role?.toUpperCase()}</Text>
              <Text style={styles.cardSub}>Assigned Beat: {viewingStaff?.assignedSite}</Text>

              <Text style={[styles.label, {marginTop: 16}]}>⏱️ Lifetime Shift Logs ({guardLifetimeShifts.length})</Text>
              {loadingLifetime ? (
                <ActivityIndicator color="#fbbf24" style={{marginTop: 10}} />
              ) : guardLifetimeShifts.length === 0 ? (
                <Text style={{color: '#94a3b8', fontSize: 11, fontStyle: 'italic'}}>No shift records found for this operative.</Text>
              ) : (
                guardLifetimeShifts.map((s, idx) => (
                  <View key={s._id || idx} style={{backgroundColor: '#111827', padding: 8, borderRadius: 6, marginTop: 6}}>
                    <Text style={{color: '#fbbf24', fontSize: 11, fontWeight: 'bold'}}>{new Date(s.createdAt).toLocaleDateString()} • {s.status}</Text>
                    <Text style={{color: '#94a3b8', fontSize: 10}}>In: {new Date(s.clockInTime).toLocaleTimeString()}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={[styles.cancelBtn, {marginTop: 14}]} onPress={() => setProfileModalVisible(false)}>
              <Text style={{color: '#38bdf8', fontWeight: 'bold', fontSize: 12}}>Close Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Staff Management Modal */}
      <Modal visible={staffModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>⚙️ Manage Operative Station</Text>
            <Text style={styles.modalSub}>{selectedStaff?.fullName} ({selectedStaff?.employeeId})</Text>

            <Text style={styles.label}>Assigned Beat Station</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical: 8}}>
              {SUNSHINE_LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.filterChip, newSite === loc && styles.filterChipActive]}
                  onPress={() => { resetInactivityTimer(); setNewSite(loc); }}
                >
                  <Text style={[styles.filterChipText, newSite === loc && styles.filterChipTextActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {isHighestExecutive && (
              <>
                <Text style={styles.label}>Role Designation</Text>
                <View style={{flexDirection: 'row', gap: 8, marginVertical: 8}}>
                  {['guard', 'supervisor', 'cso', 'field_operations_manager'].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.filterChip, newDesignation === r && styles.filterChipActive]}
                      onPress={() => { resetInactivityTimer(); setNewDesignation(r); }}
                    >
                      <Text style={[styles.filterChipText, newDesignation === r && styles.filterChipTextActive]}>{r.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setStaffModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveStaffAction}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Recruit Approval Modal */}
      <Modal visible={recruitModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>✓ Approve Recruit Registration</Text>
            <Text style={styles.modalSub}>{selectedRecruit?.fullName} ({selectedRecruit?.email})</Text>

            <Text style={styles.label}>Assign Beat Station</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical: 8}}>
              {SUNSHINE_LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.filterChip, assignedRecruitSite === loc && styles.filterChipActive]}
                  onPress={() => { resetInactivityTimer(); setAssignedRecruitSite(loc); }}
                >
                  <Text style={[styles.filterChipText, assignedRecruitSite === loc && styles.filterChipTextActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Assign Access Role</Text>
            <View style={{flexDirection: 'row', gap: 8, marginVertical: 8}}>
              {['guard', 'supervisor', 'cso', 'field_operations_manager'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.filterChip, approvedRole === r && styles.filterChipActive]}
                  onPress={() => { resetInactivityTimer(); setApprovedRole(r); }}
                >
                  <Text style={[styles.filterChipText, approvedRole === r && styles.filterChipTextActive]}>{r.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRecruitModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleApproveRecruitWithRole}>
                <Text style={styles.saveBtnText}>Grant Access</Text>
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
  headerTextWrap: { flex: 1, marginLeft: 12 },
  headerSubtitle: { color: '#fbbf24', fontSize: 9, fontWeight: 'bold' },
  headerTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  filterBar: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#0b0f19', gap: 8, marginTop: 6 },
  filterChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  filterChipActive: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  filterChipText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  filterChipTextActive: { color: '#0f172a' },

  alertBanner: { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1, borderColor: '#ef4444', paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', marginBottom: 4 },
  alertBannerText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold' },

  searchContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchInput: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 12 },

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

  label: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', marginBottom: 4, marginTop: 8 },
  inputField: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 12, marginBottom: 8 },
  textArea: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 12, color: '#ffffff', fontSize: 12, height: 70, marginBottom: 8 },

  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#1e293b', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  saveBtn: { flex: 1, backgroundColor: '#fbbf24', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 12 }
});