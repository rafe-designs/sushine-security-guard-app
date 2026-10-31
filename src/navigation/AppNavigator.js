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

import GuardSosScreen from '../screens/GuardSosScreen';
import IncidentDetailScreen from '../screens/IncidentDetailScreen';
import ShiftHandoverScreen from '../screens/ShiftHandoverScreen';
import SupervisoryDashboardScreen from '../screens/SupervisoryDashboardScreen';
import SupervisorDashboardScreen from '../screens/SupervisorDashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { AuthContext } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { userToken, isLoading, user, userRole } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  const currentRole = (user?.role || userRole || '').toLowerCase();

  const isExecutive = [
    'director', 
    'head_of_operations', 
    'head of operations', 
    'field_operations_manager', 
    'field operations manager',
    'cso', 
    'admin'
  ].includes(currentRole);

  const isSupervisor = currentRole === 'supervisor';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="DataPrivacy" component={DataPrivacyScreen} />
            <Stack.Screen name="ShiftHandover" component={ShiftHandoverScreen} />
          </>
        ) : isExecutive ? (
          <>
            <Stack.Screen name="SupervisoryDashboard" component={SupervisoryDashboardScreen} />
            <Stack.Screen name="Incidents" component={IncidentDetailScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ShiftHandover" component={ShiftHandoverScreen} />
          </>
        ) : isSupervisor ? (
          <>
            <Stack.Screen name="SupervisorDashboard" component={SupervisorDashboardScreen} />
            <Stack.Screen name="Incidents" component={IncidentDetailScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ShiftHandover" component={ShiftHandoverScreen} />
          </>
        ) : (
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