// src/navigation/AppNavigator.js
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import DataPrivacyScreen from '../screens/DataPrivacyScreen';
import MainTabNavigator from './MainTabNavigator'; 

// All 7 Integrated Screens
import AdminAuditLogScreen from '../screens/AdminAuditLogScreen';
import AdminLiveMapScreen from '../screens/AdminLiveMapScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import AdminRecruitScreen from '../screens/AdminRecruitScreen';
import GuardSosScreen from '../screens/GuardSosScreen';
import IncidentDetailScreen from '../screens/IncidentDetailScreen';
import ShiftHandoverScreen from '../screens/ShiftHandoverScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';

import { AuthContext } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { userToken, isLoading, userRole } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          // Unauthenticated Stack (Includes Login, AdminLogin, Sign Up, & Public Handover preview)
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="DataPrivacy" component={DataPrivacyScreen} />
            <Stack.Screen name="ShiftHandover" component={ShiftHandoverScreen} />
          </>
        ) : userRole === 'admin' ? (
          // Authenticated Admin Stack
          <>
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="AdminLiveMap" component={AdminLiveMapScreen} />
            <Stack.Screen name="AdminRecruit" component={AdminRecruitScreen} />
            <Stack.Screen name="AdminAuditLog" component={AdminAuditLogScreen} />
            <Stack.Screen name="IncidentDetail" component={IncidentDetailScreen} />
          </>
        ) : (
          // Authenticated Guard Stack -> Renders Bottom Tabs & Direct Guard Screens
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="ShiftHandover" component={ShiftHandoverScreen} />
            <Stack.Screen name="GuardSos" component={GuardSosScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070b19',
  },
});