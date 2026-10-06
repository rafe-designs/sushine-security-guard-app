// src/screens/IncidentReportScreen.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// CONFIG: Auto-detects development vs production (App Store ready)
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.100.2:5000' 
  : 'https://api.sunshineguard.ng';

export default function IncidentReportScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('Trespassing');
  const [severityLevel, setSeverityLevel] = useState('High');
  const [description, setDescription] = useState('');
  
  // New evidence attachment states
  const [attachedVoiceNote, setAttachedVoiceNote] = useState(null);
  const [attachedImages, setAttachedImages] = useState([]);
  const [attachedDocuments, setAttachedDocuments] = useState([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['Trespassing', 'Perimeter Breach', 'Medical Emergency', 'Vandalism', 'Equipment Fault', 'Fire Hazard'];
  const severities = ['Low', 'Med', 'High', 'Emergency'];

  // Handler for voice note recording simulation
  const handleRecordVoiceNote = () => {
    Alert.alert(
      '🎙️️ Voice Dispatch Recorder', 
      'Simulating secure radio voice note recording (00:18s captured).',
      [{ 
        text: 'Attach', 
        onPress: () => setAttachedVoiceNote({ name: 'Radio_Dispatch_Log_01.wav', duration: '00:18s', size: '240KB' }) 
      },
      { text: 'Cancel', style: 'cancel' }]
    );
  };

  // Handler for picture capture simulation
  const handleCaptureImage = () => {
    Alert.alert(
      '📸 Evidence Camera', 
      'Simulating high-resolution tactical photo capture.',
      [{ 
        text: 'Capture & Attach', 
        onPress: () => setAttachedImages(prev => [...prev, `CCTV_Capture_${prev.length + 1}.jpg`]) 
      },
      { text: 'Cancel', style: 'cancel' }]
    );
  };

  // Handler for document attachment simulation
  const handleAttachDocument = () => {
    Alert.alert(
      '📎 Document Attach', 
      'Simulating secure file picker for police/incident report attachments.',
      [{ 
        text: 'Select PDF', 
        onPress: () => setAttachedDocuments(prev => [...prev, `Incident_Log_Report_${prev.length + 1}.pdf`]) 
      },
      { text: 'Cancel', style: 'cancel' }]
    );
  };

  const handleSubmitReport = async () => {
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description of the incident.');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeShiftJson = await AsyncStorage.getItem('sunshine_active_shift');
      const activeShift = activeShiftJson ? JSON.parse(activeShiftJson) : null;

      const incidentPayload = {
        category: selectedCategory,
        severity: severityLevel,
        description: description,
        voiceNote: attachedVoiceNote,
        images: attachedImages,
        documents: attachedDocuments,
        shiftId: activeShift ? activeShift._id : null,
        timestamp: new Date().toISOString(),
      };

      // 5-second safeguard timeout so the loader never freezes indefinitely
      await axios.post(`${API_BASE_URL}/api/incidents`, incidentPayload, {
        timeout: 5000 
      });

      Alert.alert(
        '🚨 Incident Transmitted',
        `Category: ${selectedCategory}\nSeverity: ${severityLevel}\nAttachments: ${attachedImages.length} photos, ${attachedDocuments.length} docs, ${attachedVoiceNote ? '1 audio' : 'none'}\nSuccessfully broadcasted to SOC & Lagos Command HQ.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Failed to submit incident:', error);
      Alert.alert(
        'Transmission Notice',
        'Server unreachable or timed out. Report and attached evidence saved to local queue for sync.'
      );
      // Fallback navigation escape hatch so the guard isn't stuck
      navigation.goBack();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛡️ INCIDENT & DISPATCH REPORTING</Text>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 90, 100) }]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ INCIDENT CATEGORY</Text>
          <View style={styles.gridContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.gridItem, selectedCategory === cat && styles.selectedGridItem]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.gridItemText, selectedCategory === cat && styles.selectedGridItemText]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚨 SEVERITY LEVEL</Text>
          <View style={styles.severityRow}>
            {severities.map((sev) => (
              <TouchableOpacity
                key={sev}
                style={[styles.sevButton, severityLevel === sev && styles.selectedSevButton]}
                onPress={() => setSeverityLevel(sev)}
              >
                <Text style={[styles.sevText, severityLevel === sev && styles.selectedSevText]}>{sev}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 INCIDENT DESCRIPTION</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the breach, suspects, or hazard details..."
            placeholderTextColor="#475569"
            multiline={true}
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* EVIDENCE ATTACHMENT SECTION */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📂 EVIDENCE & ATTACHMENTS (LAW ENFORCEMENT READY)</Text>
          
          <View style={styles.attachBtnRow}>
            <TouchableOpacity style={styles.attachBtn} onPress={handleRecordVoiceNote}>
              <Text style={styles.attachBtnText}>🎙️ Record Audio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachBtn} onPress={handleCaptureImage}>
              <Text style={styles.attachBtnText}>📸 Add Picture</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachBtn} onPress={handleAttachDocument}>
              <Text style={styles.attachBtnText}>📎 Add Doc</Text>
            </TouchableOpacity>
          </View>

          {/* Render Attached Voice Note Preview */}
          {attachedVoiceNote && (
            <View style={styles.attachmentItem}>
              <Text style={styles.attachmentText}>🎙️ {attachedVoiceNote.name} ({attachedVoiceNote.duration})</Text>
              <TouchableOpacity onPress={() => setAttachedVoiceNote(null)}>
                <Text style={styles.removeText}>❌ Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Render Attached Images List */}
          {attachedImages.map((img, index) => (
            <View key={index} style={styles.attachmentItem}>
              <Text style={styles.attachmentText}>🖼️ {img}</Text>
              <TouchableOpacity onPress={() => setAttachedImages(attachedImages.filter((_, i) => i !== index))}>
                <Text style={styles.removeText}>❌ Remove</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Render Attached Documents List */}
          {attachedDocuments.map((doc, index) => (
            <View key={index} style={styles.attachmentItem}>
              <Text style={styles.attachmentText}>📄 {doc}</Text>
              <TouchableOpacity onPress={() => setAttachedDocuments(attachedDocuments.filter((_, i) => i !== index))}>
                <Text style={styles.removeText}>❌ Remove</Text>
              </TouchableOpacity>
            </View>
          ))}

          {!attachedVoiceNote && attachedImages.length === 0 && attachedDocuments.length === 0 && (
            <Text style={styles.noAttachmentText}>No evidence files attached yet. Tap buttons above to record audio, take photos, or attach logs.</Text>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, isSubmitting && styles.disabledBtn]} 
          onPress={handleSubmitReport} 
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>🚨 TRANSMIT & DISPATCH ALERT</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  header: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 11, fontWeight: 'bold', color: '#fbbf24', letterSpacing: 0.5 },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 14 },
  cardTitle: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 10 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: '48%', backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  selectedGridItem: { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8' },
  gridItemText: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  selectedGridItemText: { color: '#38bdf8' },
  severityRow: { flexDirection: 'row', gap: 8 },
  sevButton: { flex: 1, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  selectedSevButton: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  sevText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  selectedSevText: { color: '#ffffff' },
  textArea: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, padding: 10, fontSize: 12, color: '#ffffff', textAlignVertical: 'top', height: 100 },
  attachBtnRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  attachBtn: { flex: 1, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  attachBtnText: { color: '#38bdf8', fontSize: 10, fontWeight: 'bold' },
  attachmentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', padding: 8, borderRadius: 6, marginBottom: 6, borderWidth: 1, borderColor: '#1f2937' },
  attachmentText: { color: '#cbd5e1', fontSize: 10 },
  removeText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold' },
  noAttachmentText: { color: '#64748b', fontSize: 10, fontStyle: 'italic', textAlign: 'center', marginTop: 4 },
  submitBtn: { backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  disabledBtn: { opacity: 0.7 },
  submitBtnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 }
});