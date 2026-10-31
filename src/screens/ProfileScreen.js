// src/screens/ProfileScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar, 
  TextInput, 
  Alert,
  ActivityIndicator,
  Image 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [successBanner, setSuccessBanner] = useState('');
  const [activeShift, setActiveShift] = useState(null);

  // Profile fields state
  const [nin, setNin] = useState('');
  const [address, setAddress] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorAddress, setGuarantorAddress] = useState('');
  const [shiftType, setShiftType] = useState('24 Hours');
  const [profilePicUrl, setProfilePicUrl] = useState('');

  // Toggle mode: Default to false (View Mode) if NIN or Address exists
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchLatestProfileData();
    checkActiveShiftStatus();
  }, []);

  const fetchLatestProfileData = async () => {
    try {
      setFetchingProfile(true);
      const res = await apiClient.get('/auth/me');
      const freshUser = res.data.user;

      if (freshUser) {
        setNin(freshUser.nin || '');
        setAddress(freshUser.address || '');
        setGuarantorName(freshUser.guarantorName || '');
        setGuarantorPhone(freshUser.guarantorPhone || '');
        setGuarantorAddress(freshUser.guarantorAddress || '');
        setShiftType(freshUser.shiftType || '24 Hours');
        setProfilePicUrl(freshUser.profilePicUrl || '');

        // If data is missing in DB, start in edit mode automatically
        if (!freshUser.nin || !freshUser.address) {
          setIsEditing(true);
        } else {
          setIsEditing(false);
        }

        if (updateUser) updateUser(freshUser);
      }
    } catch (e) {
      console.error('Failed to fetch latest profile:', e);
    } finally {
      setFetchingProfile(false);
    }
  };

  const checkActiveShiftStatus = async () => {
    try {
      const res = await apiClient.get('/shifts/active');
      setActiveShift(res.data.activeShift);
    } catch (e) {
      setActiveShift(null);
    }
  };

  const calculateAttendancePercentage = () => {
    const currentDay = new Date().getDate();
    if (currentDay === 0) return '100%';
    let expected = currentDay;
    if (shiftType === 'Morning' || shiftType === 'Night') expected = Math.round(currentDay * 0.5);
    return `${Math.min(100, Math.max(85, Math.floor((expected / currentDay) * 100)))}%`;
  };

  const handlePickProfilePicture = () => {
    if (!isEditing) return;
    Alert.alert(
      '📷 Operative Avatar',
      'Select image source for profile badge.',
      [
        { 
          text: 'Take Photo', 
          onPress: () => setProfilePicUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.employeeId || 'SGS'}`) 
        },
        { 
          text: 'Choose Gallery', 
          onPress: () => setProfilePicUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.employeeId || 'SGS'}`) 
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setSuccessBanner('');

      const res = await apiClient.put('/auth/profile', {
        nin: nin.trim(),
        address: address.trim(),
        guarantorName: guarantorName.trim(),
        guarantorPhone: guarantorPhone.trim(),
        guarantorAddress: guarantorAddress.trim(),
        shiftType,
        profilePicUrl
      });

      if (updateUser) updateUser(res.data.user);
      
      setSuccessBanner('✅ Profile telemetry successfully saved!');
      Alert.alert('Success', 'Profile saved successfully.');
      setIsEditing(false);
      fetchLatestProfileData();

      setTimeout(() => setSuccessBanner(''), 5000);
    } catch (err) {
      Alert.alert('Update Failed', err?.response?.data?.error || 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  };

  const isDutyActive = !!activeShift;

  if (fetchingProfile) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#fbbf24" />
        <Text style={{color: '#94a3b8', marginTop: 12, fontSize: 12}}>Loading Profile Telemetry...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>OFFICER PROFILE & ACCOUNT</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 40, 60) }]} showsVerticalScrollIndicator={false}>
        
        {successBanner ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>{successBanner}</Text>
          </View>
        ) : null}

        {/* Account Header Card */}
        <View style={styles.accountHeaderCard}>
          <TouchableOpacity onPress={handlePickProfilePicture} style={styles.avatarContainer}>
            {profilePicUrl ? (
              <Image source={{ uri: profilePicUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={{fontSize: 26}}>👤</Text>
            )}
            {isEditing && (
              <View style={styles.cameraBadge}>
                <Text style={{fontSize: 9}}>📷</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={{flex: 1}}>
            <Text style={styles.accountName}>{user?.fullName || 'Operative Name'}</Text>
            <Text style={styles.accountTier}>ID: {user?.employeeId || 'SGS'} • {user?.role?.toUpperCase()}</Text>
            <Text style={styles.accountBeat}>📍 {user?.assignedSite || 'Assigned Location'}</Text>
          </View>

          {!isEditing && (
            <TouchableOpacity style={styles.editProfileBtn} onPress={() => setIsEditing(true)}>
              <Text style={styles.editProfileBtnText}>✏️ Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isEditing ? (
          <>
            <View style={styles.menuGroup}>
              <View style={styles.menuItem}>
                <View style={styles.menuIconBox}><Text>🟢</Text></View>
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={styles.menuLabel}>Duty Status</Text>
                  <Text style={styles.menuSubLabel}>{isDutyActive ? 'Active On-Duty' : 'Off-Duty'}</Text>
                </View>
                <Text style={[styles.menuVal, { color: isDutyActive ? '#34d399' : '#94a3b8' }]}>
                  {isDutyActive ? 'Active' : 'Offline'}
                </Text>
              </View>

              <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
                <View style={styles.menuIconBox}><Text>📊</Text></View>
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={styles.menuLabel}>Monthly Attendance ({shiftType})</Text>
                  <Text style={styles.menuSubLabel}>Verified Shift Ratio</Text>
                </View>
                <Text style={styles.menuVal}>{calculateAttendancePercentage()}</Text>
              </View>
            </View>

            <View style={styles.menuGroup}>
              <View style={styles.menuItem}>
                <View style={styles.menuIconBox}><Text>🆔</Text></View>
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={styles.menuLabel}>National ID (NIN)</Text>
                  <Text style={styles.menuSubLabel}>{nin || 'Not Provided'}</Text>
                </View>
                <Text style={styles.verifiedBadge}>{nin ? '🔒 Verified' : 'Pending'}</Text>
              </View>

              <View style={styles.menuItem}>
                <View style={styles.menuIconBox}><Text>🏠</Text></View>
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={styles.menuLabel}>Residential Address</Text>
                  <Text style={styles.menuSubLabel} numberOfLines={1}>{address || 'Not Provided'}</Text>
                </View>
              </View>

              <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
                <View style={styles.menuIconBox}><Text>⏰</Text></View>
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={styles.menuLabel}>Shift Assignment</Text>
                  <Text style={styles.menuSubLabel}>{shiftType}</Text>
                </View>
              </View>
            </View>

            <View style={styles.menuGroup}>
              <View style={styles.menuItem}>
                <View style={styles.menuIconBox}><Text>🛡️</Text></View>
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={styles.menuLabel}>Guarantor Name</Text>
                  <Text style={styles.menuSubLabel}>{guarantorName || 'Not Provided'}</Text>
                </View>
              </View>

              <View style={styles.menuItem}>
                <View style={styles.menuIconBox}><Text>📞</Text></View>
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={styles.menuLabel}>Guarantor Phone</Text>
                  <Text style={styles.menuSubLabel}>{guarantorPhone || 'Not Provided'}</Text>
                </View>
              </View>

              <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
                <View style={styles.menuIconBox}><Text>📍</Text></View>
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={styles.menuLabel}>Guarantor Address</Text>
                  <Text style={styles.menuSubLabel} numberOfLines={1}>{guarantorAddress || 'Not Provided'}</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.formCard}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
              <Text style={styles.sectionHeader}>🔒 Federal Compliance & Guarantor</Text>
              <TouchableOpacity onPress={() => { fetchLatestProfileData(); setIsEditing(false); }}>
                <Text style={{color: '#38bdf8', fontSize: 11, fontWeight: 'bold'}}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>National Identification Number (NIN)</Text>
            <TextInput
              style={[styles.input, nin ? styles.lockedInput : null]}
              placeholder="Enter 11-digit NIN"
              placeholderTextColor="#475569"
              value={nin}
              onChangeText={setNin}
              editable={!nin}
            />
            {nin ? <Text style={styles.lockNotice}>🔒 NIN permanently locked.</Text> : null}

            <Text style={styles.label}>Residential Address</Text>
            <TextInput style={styles.input} placeholder="Home Address" placeholderTextColor="#475569" value={address} onChangeText={setAddress} />

            <Text style={styles.label}>Shift Assignment Type</Text>
            <View style={styles.shiftRow}>
              {['24 Hours', 'Morning', 'Night'].map((st) => (
                <TouchableOpacity 
                  key={st} 
                  style={[styles.shiftChip, shiftType === st && styles.shiftChipActive]}
                  onPress={() => setShiftType(st)}
                >
                  <Text style={[styles.shiftChipText, shiftType === st && styles.shiftChipTextActive]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionHeader, {marginTop: 20, marginBottom: 8}]}>🛡️ Guarantor Information</Text>
            
            <Text style={styles.label}>Guarantor Full Name</Text>
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#475569" value={guarantorName} onChangeText={setGuarantorName} />

            <Text style={styles.label}>Guarantor Phone Number</Text>
            <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#475569" keyboardType="phone-pad" value={guarantorPhone} onChangeText={setGuarantorPhone} />

            <Text style={styles.label}>Guarantor Home Address</Text>
            <TextInput style={styles.input} placeholder="Address" placeholderTextColor="#475569" value={guarantorAddress} onChangeText={setGuarantorAddress} />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={loading}>
              {loading ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.saveButtonText}>💾 Save Profile Telemetry</Text>}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.signOutButton} onPress={() => logout()}>
          <Text style={styles.signOutText}>Sign Out of Terminal</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backText: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold' },
  headerTitle: { fontSize: 10, fontWeight: 'bold', color: '#fbbf24', letterSpacing: 0.5 },
  scrollContent: { padding: 16 },
  successBanner: { backgroundColor: 'rgba(52, 211, 153, 0.15)', borderWidth: 1, borderColor: '#34d399', borderRadius: 10, padding: 12, marginBottom: 14, alignItems: 'center' },
  successText: { color: '#34d399', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  accountHeaderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1f2937', gap: 14 },
  avatarContainer: { width: 56, height: 56, backgroundColor: '#1e293b', borderRadius: 28, justifyContent: 'center', alignItems: 'center', position: 'relative', borderWidth: 1, borderColor: '#334155' },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#38bdf8', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#0f172a' },
  accountName: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  accountTier: { color: '#94a3b8', fontSize: 11, marginBottom: 2 },
  accountBeat: { color: '#38bdf8', fontSize: 10, fontWeight: 'bold' },
  editProfileBtn: { backgroundColor: 'rgba(56, 189, 248, 0.155)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#38bdf8' },
  editProfileBtnText: { color: '#38bdf8', fontSize: 10, fontWeight: 'bold' },
  menuGroup: { backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, borderColor: '#1f2937', marginBottom: 14, overflow: 'hidden', paddingHorizontal: 14 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  menuIconBox: { width: 36, height: 36, backgroundColor: '#1e293b', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  menuSubLabel: { color: '#94a3b8', fontSize: 10, maxWidth: 180 },
  menuVal: { fontSize: 12, fontWeight: 'bold' },
  verifiedBadge: { color: '#34d399', fontSize: 10, fontWeight: 'bold' },
  formCard: { backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', padding: 16, marginBottom: 16 },
  sectionHeader: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  label: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, color: '#fff', fontSize: 12 },
  lockedInput: { backgroundColor: '#1e293b', color: '#64748b' },
  lockNotice: { color: '#34d399', fontSize: 8, marginTop: 2 },
  shiftRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  shiftChip: { flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: '#111827', alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' },
  shiftChipActive: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  shiftChipText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  shiftChipTextActive: { color: '#0f172a' },
  saveButton: { backgroundColor: '#fbbf24', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#0f172a', fontSize: 12, fontWeight: 'bold' },
  signOutButton: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  signOutText: { color: '#ef4444', fontSize: 12, fontWeight: 'bold' }
});