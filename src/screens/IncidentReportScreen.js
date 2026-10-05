// src/screens/IncidentReportScreen.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Alert, StatusBar } from 'react-native';

export default function IncidentReportScreen() {
  const [selectedCategory, setSelectedCategory] = useState('Trespassing');
  const [severityLevel, setSeverityLevel] = useState('High');
  const [description, setDescription] = useState('');

  const categories = ['Trespassing', 'Perimeter Breach', 'Medical Emergency', 'Vandalism', 'Equipment Fault', 'Fire Hazard'];
  const severities = ['Low', 'Med', 'High', 'Emergency'];

  const handleSubmitReport = () => {
    Alert.alert(
      '🚨 Incident Transmitted',
      `Category: ${selectedCategory}\nSeverity: ${severityLevel}\nSuccessfully broadcasted to SOC & Lagos Command HQ.`
    );
    setDescription('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛡️ INCIDENT & DISPATCH REPORTING</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Incident Categories */}
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

        {/* Severity Level */}
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

        {/* Incident Description */}
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

        {/* Action Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitReport} activeOpacity={0.8}>
          <Text style={styles.submitBtnText}>🚨 TRANSMIT & DISPATCH ALERT</Text>
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
  submitBtn: { backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  submitBtnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 }
});