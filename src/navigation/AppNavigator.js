// src/navigation/AppNavigator.js
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import DataPrivacyScreen from '../screens/DataPrivacyScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import MainTabNavigator from './MainTabNavigator'; // Import the new tab navigator
import { AuthContext } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { userToken, isLoading, userRole } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          // Unauthenticated Stack
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="DataPrivacy" component={DataPrivacyScreen} />
          </>
        ) : userRole === 'admin' ? (
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        ) : (
          // Authenticated Guard Stack -> Renders Bottom Tabs
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
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
    backgroundColor: '#fff',
  },
});