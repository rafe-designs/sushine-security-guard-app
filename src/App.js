import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { syncOfflineLogs } from './services/logService';

export default function App() {
  useEffect(() => {
    // 1. Run an initial offline sync check as soon as the app boots up
    syncOfflineLogs();

    // 2. Listen for network state changes (triggers automatically when phone regains internet)
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('🌐 Network reconnected! Syncing offline logs...');
        syncOfflineLogs();
      }
    });

    // Cleanup listener on app unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthProvider>
      <View style={styles.container}>
        <AppNavigator />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});