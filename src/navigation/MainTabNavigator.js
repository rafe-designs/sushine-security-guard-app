// src/navigation/MainTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import DashboardScreen from '../screens/DashboardScreen';
import IncidentReportScreen from '../screens/IncidentReportScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen 
        name="DutyMap" 
        component={DashboardScreen} 
        options={{
          tabBarLabel: 'Duty Map',
          tabBarIcon: () => <Text style={{fontSize: 18}}>🗺️</Text>
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={IncidentReportScreen} 
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: () => <Text style={{fontSize: 18}}>📋</Text>
        }}
      />
      <Tab.Screen 
        name="Incidents" 
        component={IncidentReportScreen} 
        options={{
          tabBarLabel: 'Incidents',
          tabBarIcon: () => <Text style={{fontSize: 18}}>⚠️</Text>
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: () => <Text style={{fontSize: 18}}>👤</Text>
        }}
      />
    </Tab.Navigator>
  );
}