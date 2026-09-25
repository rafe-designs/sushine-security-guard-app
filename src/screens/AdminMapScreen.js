import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';

export default function AdminMapScreen() {
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch active guards from your backend API
  const fetchActiveGuards = async () => {
    try {
      const response = await axios.get('http://YOUR_SERVER_IP:5000/api/admin/active-guards');
      setGuards(response.data);
    } catch (error) {
      console.error('Error fetching guards for map:', error);
      // Fallback mock data for testing layout if backend isn't returning data yet
      setGuards([
        { _id: '1', guardId: 'Guard-Default', coords: { latitude: 6.65151, longitude: 3.30982 }, status: 'Active' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveGuards();
    const interval = setInterval(fetchActiveGuards, 10000); // Poll every 10 seconds for live updates
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loaderText}>Loading live field coordinates...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Command Center - Live Guard Map</Text>
      </View>
      
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 6.65151,
          longitude: 3.30982,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {guards.map((guard, index) => {
          // Fallback coordinate if guard coords object isn't structured yet
          const lat = guard.coords?.latitude || 6.65151;
          const lon = guard.coords?.longitude || 3.30982;

          return (
            <Marker
              key={guard._id || index}
              coordinate={{ latitude: lat, longitude: lon }}
              title={`Guard: ${guard.guardId}`}
              description={`Status: ${guard.status}`}
            >
              {/* Custom Marker View */}
              <View style={styles.markerBubble}>
                <Text style={styles.markerText}>🛡️ {guard.guardId}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f9' },
  loaderText: { marginTop: 10, color: '#64748b', fontWeight: '500' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
  map: { flex: 1 },
  markerBubble: { backgroundColor: '#0284c7', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#fff' },
  markerText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});