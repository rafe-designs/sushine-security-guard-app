// sunshine-security-app/src/screens/ShiftHandoverScreen.js
import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function ShiftHandoverScreen({ navigation }) {
  const { user, api } = useContext(AuthContext);
  const [submitting, setSubmitting] = useState(false);

  // Form states mapping directly to physical sheet
  const [incomingGuardName, setIncomingGuardName] = useState('');
  const [incomingGuardId, setIncomingGuardId] = useState('');
  const [shiftType, setShiftType] = useState('Day');
  const [tacticalBriefing, setTacticalBriefing] = useState('');
  
  // Equipment Accountability Checklist
  const [equipment, setEquipment] = useState([
    { id: 1, name: 'Handheld Radios / Walkies', qty: '2', condition: 'OK', notes: 'Fully charged' },
    { id: 2, name: 'Tactical Flashlights', qty: '2', condition: 'OK', notes: 'Operational' },
    { id: 3, name: 'Guard Patrol Wand', qty: '1', condition: 'OK', notes: 'Active' },
    { id: 4, name: 'Master Access Cards', qty: '4', condition: 'OK', notes: 'All present' },
    { id: 5, name: 'Defense Gear (Baton/Cuffs)', qty: '1', condition: 'OK', notes: 'Inspected' },
  ]);

  const toggleEquipmentCondition = (index) => {
    const updated = [...equipment];
    updated[index].condition = updated[index].condition === 'OK' ? 'DMG' : 'OK';
    setEquipment(updated);
  };

  const handleFinalizeHandover = async () => {
    if (!incomingGuardName || !incomingGuardId) {
      Alert.alert('Required Field', 'Please enter the Relief / Incoming Guard Name and Employee ID.');
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        latitude: 6.6515,
        longitude: 3.3098,
        manifestId: `MANIFEST-${Math.floor(100000 + Math.random() * 900000)}`,
        incomingGuardName,
        incomingGuardEmployeeId: incomingGuardId,
        handoverTime: new Date().toLocaleTimeString(),
        equipmentCheck: equipment.map(item => ({
          assetName: item.name,
          qtyPassed: parseInt(item.qty, 10) || 1,
          condition: item.condition,
          outgoingRemarks: item.notes
        })),
        tacticalBriefing: tacticalBriefing || 'Perimeter secure. No unresolved issues.',
        supervisorName: 'Insp. Adeleke K.'
      };

      await api.post('/shifts/end', payload);
      
      Alert.alert('Handover Completed', 'Shift ended and digital Log Manifest signed successfully.', [
        { text: 'OK', onPress: () => navigation.navigate('Dashboard') }
      ]);
    } catch (err) {
      Alert.alert('Handover Error', err.response?.data?.error || 'Failed to complete shift handover.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SHIFT HANDOVER & LOG MANIFEST</Text>
        </View>

        {/* Guard Rotation Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📋 GUARD ROTATION DETAILS</Text>
          
          <Text style={styles.label}>Outgoing Guard (You):</Text>
          <Text style={styles.readOnlyText}>{user?.fullName} ({user?.employeeId})</Text>

          <Text style={styles.label}>Relief / Incoming Guard Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Officer Samuel B."
            placeholderTextColor="#64748b"
            value={incomingGuardName}
            onChangeText={setIncomingGuardName}
          />

          <Text style={styles.label}>Relief Guard Employee ID *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 19204"
            placeholderTextColor="#64748b"
            value={incomingGuardId}
            onChangeText={setIncomingGuardId}
          />
        </View>

        {/* Equipment Physical Accountability */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🔦 EQUIPMENT & INVENTORY ACCOUNTABILITY</Text>
          {equipment.map((item, index) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name} (Qty: {item.qty})</Text>
                <Text style={styles.itemNotes}>{item.notes}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.condBadge,
                  item.condition === 'OK' ? styles.condOk : styles.condDmg
                ]}
                onPress={() => toggleEquipmentCondition(index)}
              >
                <Text style={styles.condText}>[ {item.condition} ]</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Tactical Site Briefings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>💬 TACTICAL SITE BRIEFINGS & PENDING INCIDENTS</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Log key vulnerabilities, ongoing client instructions, or structural faults..."
            placeholderTextColor="#64748b"
            multiline
            value={tacticalBriefing}
            onChangeText={setTacticalBriefing}
          />
        </View>

        {/* Operational Sign-Off Button */}
        <TouchableOpacity 
          style={[styles.submitBtn, submitting && styles.disabledBtn]} 
          onPress={handleFinalizeHandover}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <Text style={styles.submitBtnText}>🖊️ SIGN & COMPLETE SHIFT HANDOVER</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  scrollContent: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  backBtn: { color: '#94a3b8', fontSize: 22, fontWeight: 'bold' },
  headerTitle: { color: '#f8fafc', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },
  card: { backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 14 },
  sectionTitle: { color: '#fbbf24', fontSize: 11, fontWeight: 'bold', marginBottom: 10 },
  label: { color: '#94a3b8', fontSize: 11, marginTop: 8, marginBottom: 4 },
  readOnlyText: { color: '#38bdf8', fontSize: 13, fontWeight: '600', backgroundColor: '#111827', padding: 10, borderRadius: 8 },
  input: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151', borderRadius: 8, color: '#f8fafc', padding: 10, fontSize: 13 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', padding: 10, borderRadius: 8, marginBottom: 8 },
  itemName: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
  itemNotes: { color: '#64748b', fontSize: 10 },
  condBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1 },
  condOk: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.4)' },
  condDmg: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.4)' },
  condText: { color: '#f8fafc', fontSize: 11, fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#fbbf24', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  disabledBtn: { opacity: 0.7 },
  submitBtnText: { color: '#0f172a', fontSize: 13, fontWeight: 'bold' }
});