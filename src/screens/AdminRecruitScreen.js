// src/screens/AdminRecruitScreen.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Alert } from 'react-native';

export default function AdminRecruitScreen({ navigation }) {
  const [pendingRecruits, setPendingRecruits] = useState([
    { id: 'R-101', name: 'Oluwaseun Bankole', role: 'Field Operative', phone: '+234 803 112 9832', backgroundCheck: 'Passed (NIN Verified)', date: 'Oct 5, 2026' },
    { id: 'R-102', name: 'Fatima Garba', role: 'Access Control Spec', phone: '+234 809 445 1209', backgroundCheck: 'Passed (Police Clearance)', date: 'Oct 6, 2026' },
    { id: 'R-103', name: 'Emeka Okafor', role: 'Armed Patrol Guard', phone: '+234 812 778 3341', backgroundCheck: 'Pending Verification', date: 'Oct 6, 2026' },
  ]);

  const handleApprove = (id, name) => {
    Alert.alert('Approval Confirmed', `${name} has been approved and provisioned with operative credentials.`);
    setPendingRecruits(pendingRecruits.filter(r => r.id !== id));
  };

  const handleReject = (id, name) => {
    Alert.alert('Application Rejected', `${name}'s application has been declined.`);
    setPendingRecruits(pendingRecruits.filter(r => r.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>👥 RECRUITMENT & HR COMMAND</Text>
          <Text style={styles.subBrand}>PENDING APPLICANT APPROVALS</Text>
        </View>
        <View style={styles.queueBadge}>
          <Text style={styles.queueBadgeText}>{pendingRecruits.length} Pending</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.bannerCard}>
          <Text style={styles.bannerTitle}>🔒 Compliance & Vetting Queue</Text>
          <Text style={styles.bannerDesc}>
            All candidates undergo NIN verification, guarantor checks, and background screening prior to HQ activation.
          </Text>
        </View>

        {pendingRecruits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>✅ All pending recruit applications have been processed.</Text>
          </View>
        ) : (
          pendingRecruits.map((recruit) => (
            <View key={recruit.id} style={styles.recruitCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.recruitId}>{recruit.id}</Text>
                <Text style={styles.recruitDate}>Submitted: {recruit.date}</Text>
              </View>

              <Text style={styles.recruitName}>{recruit.name}</Text>
              <Text style={styles.recruitRole}>🎯 Target Role: {recruit.role}</Text>
              <Text style={styles.recruitPhone}>📞 {recruit.phone}</Text>
              
              <View style={styles.bgCheckRow}>
                <Text style={styles.bgCheckLabel}>Vetting Status:</Text>
                <Text style={styles.bgCheckVal}>🛡️ {recruit.backgroundCheck}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.approveBtn} 
                  onPress={() => handleApprove(recruit.id, recruit.name)}
                >
                  <Text style={styles.approveBtnText}>✅ Approve & Provision</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.rejectBtn} 
                  onPress={() => handleReject(recruit.id, recruit.name)}
                >
                  <Text style={styles.rejectBtnText}>❌ Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  brandTitle: { color: '#fbbf24', fontSize: 12, fontWeight: 'bold' },
  subBrand: { color: '#64748b', fontSize: 9, marginTop: 2 },
  queueBadge: { backgroundColor: 'rgba(251, 191, 36, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)' },
  queueBadgeText: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  bannerCard: { backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 16 },
  bannerTitle: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  bannerDesc: { color: '#94a3b8', fontSize: 10, lineHeight: 15 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#34d399', fontSize: 12, textAlign: 'center', fontWeight: 'bold' },
  recruitCard: { backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 14 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  recruitId: { color: '#38bdf8', fontSize: 10, fontWeight: 'bold' },
  recruitDate: { color: '#64748b', fontSize: 9 },
  recruitName: { color: '#ffffff', fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  recruitRole: { color: '#cbd5e1', fontSize: 11, marginBottom: 4 },
  recruitPhone: { color: '#94a3b8', fontSize: 10, marginBottom: 10 },
  bgCheckRow: { backgroundColor: '#111827', padding: 8, borderRadius: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#1f2937' },
  bgCheckLabel: { color: '#64748b', fontSize: 9, fontWeight: 'bold' },
  bgCheckVal: { color: '#34d399', fontSize: 9, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, backgroundColor: 'rgba(52, 211, 153, 0.15)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.3)', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  approveBtnText: { color: '#34d399', fontSize: 10, fontWeight: 'bold' },
  rejectBtn: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  rejectBtnText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold' }
});