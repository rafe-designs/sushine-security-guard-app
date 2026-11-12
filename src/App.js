// src/App.js
import React, { useEffect, useContext } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { syncOfflineLogs } from './services/logService';

// Screens
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import DataPrivacyScreen from './screens/DataPrivacyScreen';
import PendingApprovalScreen from './screens/PendingApprovalScreen';
import DashboardScreen from './screens/DashboardScreen';
import SupervisorDashboardScreen from './screens/SupervisorDashboardScreen';
import SupervisoryDashboardScreen from './screens/SupervisoryDashboardScreen';
import IncidentReportScreen from './screens/IncidentReportScreen';
import IncidentDetailScreen from './screens/IncidentDetailScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fbbf24" />
        <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 14 }}>Loading Sunshine Guard...</Text>
      </View>
    );
  }

  const getInitialRoute = () => {
    if (!user) return 'Login';
    if (!user.isApproved) return 'PendingApproval';

    const role = (user.role || '').toLowerCase();
    
    if (role.includes('supervisor')) return 'SupervisorDashboard';
    
    if (
      role.includes('admin') || 
      role.includes('director') || 
      role.includes('head') || 
      role.includes('cso') || 
      role.includes('manager')
    ) {
      return 'SupervisoryDashboard';
    }
    return 'Dashboard';
  };

  const navigatorKey = user 
    ? `${user.id || user._id || 'user'}-${user.role}-${user.isApproved}` 
    : 'guest';

  return (
    <NavigationContainer key={navigatorKey}>
      <Stack.Navigator initialRouteName={getInitialRoute()} screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="DataPrivacy" component={DataPrivacyScreen} />
          </>
        ) : !user.isApproved ? (
          <>
            <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="SupervisorDashboard" component={SupervisorDashboardScreen} />
            <Stack.Screen name="SupervisoryDashboard" component={SupervisoryDashboardScreen} />
            <Stack.Screen name="IncidentReport" component={IncidentReportScreen} />
            <Stack.Screen name="IncidentDetail" component={IncidentDetailScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    const timer = setTimeout(() => {
      syncOfflineLogs();
    }, 1500);

    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('🌐 Network reconnected! Syncing offline logs...');
        syncOfflineLogs();
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
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
    backgroundColor: '#070b19',
    ...(Platform.OS === 'web' ? { height: '100vh', width: '100vw', overflow: 'hidden' } : {}),
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#070b19',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { height: '100vh', width: '100vw' } : {}),
  },
});