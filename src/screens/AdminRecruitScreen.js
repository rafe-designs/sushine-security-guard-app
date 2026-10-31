// src/screens/AdminRecruitScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  StatusBar,
  Alert 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client';

export default function AdminRecruitScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  
  const [recruits, setRecruits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRecruits();
  }, []);

  const fetchRecruits = async () => {
    setLoading(true);
    try {
      // Endpoint listing users for admin/command review
      const response = await apiClient.get('/supervisory/shifts'); 
      // Fallback or dedicated roster fetch
      setRecruits(response.data.shifts || []);
    } catch (err) {
      console.log('Error fetching personnel roster:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderRecruitItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
        <View>
          <Text style={styles.cardTitle}>{item.guardName} <Text style={styles.employeeId}>({item.employeeId})</Text></Text>
          <Text style={styles.cardSubtitle}>📍 Station: {item.assignedSite}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerDate}>Clock-In: {new Date(item.clockInTime).toLocaleString()}</Text>
        <TouchableOpacity 
          style={styles.inspectBtn}
          onPress={() => Alert.alert('Operative Audit', `Inspecting active clearance for ${item.guardName}`)}
        >
          <Text style={styles.inspectBtnText}>Inspect Log</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛡️ PERSONNEL & RECRUIT ROSTER</Text>
      </View>

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#fbbf24" />
          <Text style={{color: '#94a3b8', marginTop: 10, fontSize: 12}}>Loading security personnel...</Text>
        </View>
      ) : (
        <FlatList
          data={recruits}
          keyExtractor={(item) => item._id}
          renderItem={renderRecruitItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchRecruits();
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No active recruits or operatives found in command database.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b', gap: 12 },
  backBtn: { paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#1e293b', borderRadius: 6 },
  backText: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold' },
  headerTitle: { fontSize: 11, fontWeight: 'bold', color: '#fbbf24', letterSpacing: 0.5 },
  listContent: { padding: 16 },
  loaderCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  employeeId: { color: '#fbbf24', fontSize: 12 },
  cardSubtitle: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
  statusPill: { backgroundColor: 'rgba(52, 211, 153, 0.15)', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  statusText: { color: '#34d399', fontSize: 9, fontWeight: 'bold' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 10, marginTop: 8 },
  footerDate: { color: '#64748b', fontSize: 10 },
  inspectBtn: { backgroundColor: '#1e293b', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
  inspectBtnText: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#64748b', fontSize: 12, textAlign: 'center' }
});