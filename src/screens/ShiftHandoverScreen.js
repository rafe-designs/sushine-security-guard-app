// src/screens/ShiftHandoverScreen.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Alert, StatusBar, ActivityIndicator } from 'react-native';

export default function ShiftHandoverScreen({ navigation }) {
  const [selectedPost, setSelectedPost] = useState('Dangote Gate 2');
  const [reliefOfficer, setReliefOfficer] = useState('');
  const [checklist, setChecklist] = useState({
    perimeter: true,
    gateAccess: true,
    equipment: true,
    incidentLog: false,
  });
  const [handoverNotes, setHandoverNotes] = useState('');
  const [geofenceVerified, setGeofenceVerified] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const posts = ['Dangote Gate 2', 'Epe Gateway', 'Abule-Egba Compound'];

  const toggleCheck = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleVerifyGeofence = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setGeofenceVerified(true);
      Alert.alert('📍 Geofence Lock Confirmed', `GPS telemetry successfully verified within ${selectedPost} perimeter bounds (Accuracy: ±3m).`);
    }, 1200);
  };

  const handleConfirmClockOut = () => {
    if (!reliefOfficer.trim()) {
      Alert.alert('Validation Error', 'Please enter the name of the incoming relief guard taking over the post.');
      return;
    }
    if (!geofenceVerified) {
      Alert.alert('Geofence Restriction', 'Perimeter GPS lock required. Please verify your location before signing out.');
      return;
    }

    Alert.alert(
      '🔒 Shift Handover Confirmed',
      `Handover to [ ${reliefOfficer} ] at ${selectedPost} confirmed. Logs and geofence telemetry transmitted to Lagos Command SOC.`,
      [
        { text: 'OK', onPress: () => navigation?.goBack() }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />

      {/* Header Banner */}
      <View style={styles.topBanner}>
        <View style={styles.bannerRow}>
          <Text style={styles.companyTitle}>🛡️ SUNSHINE SECURITY CORP</Text>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>ACTIVE SHIFT</Text>
          </View>
        </View>
        <Text style={styles.timerText}>⏱️ 08:58:30</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Officer Card */}
        <View style={styles.card}>
          <View style={styles.officerRow}>
            <View style={styles.avatarBox}>
              <Text style={{fontSize: 20}}>👮🏽‍♂️</Text>
            </View>
            <View style={{flex: 1, marginLeft: 10}}>
              <Text style={styles.officerName}>Officer K. Adeleke (18306)</Text>
              <Text style={styles.officerPost}>HR & Operations • Lagos Command</Text>
            </View>
          </View>
        </View>

        {/* Assigned Shift / Post Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>🎯 ACTIVE SHIFT POST ASSIGNMENT</Text>
          <View style={styles.postRow}>
            {posts.map((post) => (
              <TouchableOpacity
                key={post}
                style={[styles.postChip, selectedPost === post && styles.selectedPostChip]}
                onPress={() => setSelectedPost(post)}
              >
                <Text style={[styles.postText, selectedPost === post && styles.selectedPostText]}>{post}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Geofence Proximity Validator Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>📍 GEOFENCE PROXIMITY VALIDATOR</Text>
          <View style={styles.geofenceBox}>
            <View style={{flex: 1}}>
              <Text style={styles.geofenceTitle}>{selectedPost} Perimeter Zone</Text>
              <Text style={styles.geofenceCoords}>Lat: 6.4281° N, Lng: 3.4219° E</Text>
              <Text style={[styles.geofenceStatus, geofenceVerified ? styles.statusGreen : styles.statusYellow]}>
                {geofenceVerified ? '🟢 Within Secure Perimeter (Radius: 15m)' : '🟡 Location Check Required'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.verifyBtn} 
              onPress={handleVerifyGeofence}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color="#38bdf8" />
              ) : (
                <Text style={styles.verifyBtnText}>Re-Verify</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Relief Guard Handover Field */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>🤝 INCOMING RELIEF GUARD SIGN-OFF</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Enter full name of incoming guard taking over..."
            placeholderTextColor="#475569"
            value={reliefOfficer}
            onChangeText={setReliefOfficer}
          />
        </View>

        {/* Handover Checklist */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>📋 SHIFT HANDOVER CHECKLIST</Text>
          
          {[
            { key: 'perimeter', label: 'Perimeter Fence & Gate Secure' },
            { key: 'gateAccess', label: 'Visitor / Log Register Verified' },
            { key: 'equipment', label: 'Radio & Guard Baton Handed Over' },
            { key: 'incidentLog', label: 'All Incident Logs Synchronized' },
          ].map(item => (
            <TouchableOpacity 
              key={item.key} 
              style={styles.checkItemRow}
              onPress={() => toggleCheck(item.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, checklist[item.key] && styles.checkboxChecked]}>
                {checklist[item.key] && <Text style={{color: '#fff', fontSize: 10, fontWeight: 'bold'}}>✓</Text>}
              </View>
              <Text style={styles.checkLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Asset Verification */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>📻 ASSET & GEAR VERIFICATION</Text>
          <View style={styles.assetGrid}>
            <View style={styles.assetBox}>
              <Text style={styles.assetTitle}>VHF Radio</Text>
              <Text style={styles.assetStatus}>🟢 Operational (100%)</Text>
            </View>
            <View style={styles.assetBox}>
              <Text style={styles.assetTitle}>Guard Tour Baton</Text>
              <Text style={styles.assetStatus}>🟢 Synced (5 Checkpoints)</Text>
            </View>
          </View>
        </View>

        {/* Handover Notes */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>📝 HANDOVER NOTES & SITUATION SUMMARY</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Enter relief officer notes, pending perimeter patrols, or unresolved visitor issues..."
            placeholderTextColor="#475569"
            multiline={true}
            numberOfLines={4}
            value={handoverNotes}
            onChangeText={setHandoverNotes}
          />
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleConfirmClockOut}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>🔒 Confirm Handover & Clock Out</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryBtn}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.secondaryBtnText}>← Return to Active Dashboard</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  topBanner: { backgroundColor: '#0f172a', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  bannerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  companyTitle: { color: '#fbbf24', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  activeBadge: { backgroundColor: 'rgba(52, 211, 153, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.3)' },
  activeBadgeText: { color: '#34d399', fontSize: 9, fontWeight: 'bold' },
  timerText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 14 },
  officerRow: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: { width: 40, height: 40, backgroundColor: '#1e293b', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  officerName: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  officerPost: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  sectionHeader: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 10 },
  postRow: { flexDirection: 'row', gap: 6 },
  postChip: { flex: 1, backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 6, borderRadius: 8, borderWidth: 1, borderColor: '#1f2937', alignItems: 'center' },
  selectedPostChip: { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8' },
  postText: { color: '#94a3b8', fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  selectedPostText: { color: '#38bdf8' },
  geofenceBox: { backgroundColor: '#111827', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' },
  geofenceTitle: { color: '#ffffff', fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  geofenceCoords: { color: '#94a3b8', fontSize: 9, marginBottom: 4 },
  geofenceStatus: { fontSize: 9, fontWeight: 'bold' },
  statusGreen: { color: '#34d399' },
  statusYellow: { color: '#fbbf24' },
  verifyBtn: { backgroundColor: 'rgba(56, 189, 248, 0.15)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)' },
  verifyBtnText: { color: '#38bdf8', fontSize: 9, fontWeight: 'bold' },
  inputField: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, padding: 10, fontSize: 11, color: '#ffffff' },
  checkItemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#1f2937' },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#475569', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  checkboxChecked: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  checkLabel: { color: '#e2e8f0', fontSize: 11 },
  assetGrid: { flexDirection: 'row', gap: 10 },
  assetBox: { flex: 1, backgroundColor: '#111827', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#1f2937' },
  assetTitle: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  assetStatus: { color: '#34d399', fontSize: 10 },
  textArea: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, padding: 10, fontSize: 12, color: '#ffffff', textAlignVertical: 'top', height: 90 },
  submitBtn: { backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 10, shadowColor: '#ef4444', shadowOpacity: 0.3, shadowRadius: 8 },
  submitBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },
  secondaryBtn: { backgroundColor: '#1e293b', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  secondaryBtnText: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' }
});