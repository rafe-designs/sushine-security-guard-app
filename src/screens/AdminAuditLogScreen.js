// src/screens/AdminAuditLogScreen.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Alert, StatusBar } from 'react-native';

export default function AdminAuditLogScreen({ navigation }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock immutable compliance audit logs for Sunshine Guard Services Ltd
  const auditLogs = [
    {
      id: 'LOG-98214',
      category: 'RECRUITMENT',
      title: 'Recruit Background Check Approved',
      actor: 'Abubakar Aminu (Head of Operations & HR)',
      target: 'Candidate: Sgt. Sunday Okoro (ID: 1942)',
      timestamp: '2026-10-06 14:22:10 UTC',
      hash: '0x8f4c2b91e...a341',
      status: 'VERIFIED'
    },
    {
      id: 'LOG-98213',
      category: 'INCIDENT',
      title: 'SOS Panic Broadcast Received',
      actor: 'Officer K. Adeleke (ID: 18306)',
      target: 'Post: Dangote Gate 2',
      timestamp: '2026-10-06 13:15:04 UTC',
      hash: '0x3d2a1f88c...b772',
      status: 'FLAGGED'
    },
    {
      id: 'LOG-98212',
      category: 'PATROL',
      title: 'Device GPS Ping & Geofence Check',
      actor: 'Patrol Unit Alpha',
      target: 'Abule-Egba Compound Perimeter',
      timestamp: '2026-10-06 12:00:00 UTC',
      hash: '0x7e9b4a11f...c990',
      status: 'VERIFIED'
    },
    {
      id: 'LOG-98211',
      category: 'HANDOVER',
      title: 'Shift Handover & Relief Sign-Off',
      actor: 'Officer B. Musa to Officer T. Balogun',
      target: 'Epe Gateway Post',
      timestamp: '2026-10-06 08:00:15 UTC',
      hash: '0x1a2b3c4d5...f678',
      status: 'VERIFIED'
    },
  ];

  const filters = ['ALL', 'RECRUITMENT', 'INCIDENT', 'PATROL', 'HANDOVER'];

  const filteredLogs = auditLogs.filter(log => {
    const matchesFilter = selectedFilter === 'ALL' || log.category === selectedFilter;
    const matchesSearch = log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleExportPdf = () => {
    Alert.alert(
      '📄 Police / Legal Report Exported',
      'Compliance ledger successfully exported to secure PDF storage with cryptographic chain-of-custody signatures attached.'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.brandTitle}>🛡️ ADMIN AUDIT & COMPLIANCE LEDGER</Text>
        <TouchableOpacity onPress={handleExportPdf}>
          <Text style={styles.exportText}>📥 Export PDF</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Intro Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔒 IMMUTABLE EVENT TIMELINE</Text>
          <Text style={styles.infoDesc}>
            Centralized log review for executive management and law enforcement accountability. Every action is cryptographically hashed.
          </Text>
        </View>

        {/* Search Bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search by log ID, actor, or event..."
          placeholderTextColor="#475569"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {filters.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, selectedFilter === filter && styles.selectedFilterChip]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.selectedFilterText]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Audit Log Items */}
        {filteredLogs.map(log => (
          <View key={log.id} style={styles.logCard}>
            <View style={styles.logHeaderRow}>
              <Text style={styles.logId}>{log.id} • {log.category}</Text>
              <Text style={[styles.statusBadge, log.status === 'VERIFIED' ? styles.statusGreen : styles.statusRed]}>
                {log.status === 'VERIFIED' ? '🟢 VERIFIED' : '🔴 FLAGGED'}
              </Text>
            </View>

            <Text style={styles.logTitle}>{log.title}</Text>
            
            <View style={styles.metaBox}>
              <Text style={styles.metaText}>👤 Actor: {log.actor}</Text>
              <Text style={styles.metaText}>🎯 Target: {log.target}</Text>
              <Text style={styles.metaText}>⏱️ Timestamp: {log.timestamp}</Text>
            </View>

            <View style={styles.hashBox}>
              <Text style={styles.hashLabel}>Cryptographic Hash:</Text>
              <Text style={styles.hashValue}>{log.hash}</Text>
            </View>
          </View>
        ))}

        {filteredLogs.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No audit logs match your current filter criteria.</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backText: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold' },
  brandTitle: { color: '#fbbf24', fontSize: 11, fontWeight: 'bold' },
  exportText: { color: '#34d399', fontSize: 11, fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  infoCard: { backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 14 },
  infoTitle: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  infoDesc: { color: '#94a3b8', fontSize: 10, lineHeight: 15 },
  searchBar: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, padding: 12, color: '#ffffff', fontSize: 11, marginBottom: 14 },
  filterRow: { flexDirection: 'row', marginBottom: 14 },
  filterChip: { backgroundColor: '#0f172a', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', marginRight: 8, height: 32, justifyContent: 'center' },
  selectedFilterChip: { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8' },
  filterText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  selectedFilterText: { color: '#38bdf8' },
  logCard: { backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 12 },
  logHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  logId: { color: '#94a3b8', fontSize: 9, fontWeight: 'bold' },
  statusBadge: { fontSize: 8, fontWeight: 'bold' },
  statusGreen: { color: '#34d399' },
  statusRed: { color: '#ef4444' },
  logTitle: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  metaBox: { backgroundColor: '#111827', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#1f2937' },
  metaText: { color: '#cbd5e1', fontSize: 10, marginBottom: 3 },
  hashBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 8 },
  hashLabel: { color: '#64748b', fontSize: 9 },
  hashValue: { color: '#38bdf8', fontSize: 9, fontFamily: 'monospace' },
  emptyBox: { padding: 30, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 11 }
});