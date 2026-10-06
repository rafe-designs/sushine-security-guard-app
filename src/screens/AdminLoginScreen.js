// src/screens/AdminLoginScreen.js
import React, { useState, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar, 
  Alert,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';

export default function AdminLoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  
  const [email, setEmail] = useState('admin@sunshineguard.ng');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter both admin credentials and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Authentication Failed', 'Invalid administrative credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.innerContainer}
      >
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>🛡️ SUNSHINE COMMAND & CONTROL (SOC)</Text>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Admin Portal Access</Text>
          <Text style={styles.subTitle}>Restricted to authorized Headquarters Personnel & Supervisors</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>COMMAND EMAIL / ID</Text>
            <TextInput
              style={styles.textInput}
              placeholder="admin@sunshineguard.ng"
              placeholderTextColor="#475569"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>SECURE PASSWORD / 2FA TOKEN</Text>
            <TextInput
              style={styles.textInput}
              placeholder="••••••••••••"
              placeholderTextColor="#475569"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            style={[styles.loginBtn, isLoading && styles.disabledBtn]} 
            onPress={handleAdminLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginBtnText}>🔓 AUTHENTICATE COMMAND HQ</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.switchNavButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.switchNavText}>← Return to Guard Operative Login</Text>
        </TouchableOpacity>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>SECURE ENCRYPTION • 256-BIT TLS SESSION</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  innerContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  headerBadge: { 
    alignSelf: 'center', 
    backgroundColor: 'rgba(251, 191, 36, 0.1)', 
    borderWidth: 1, 
    borderColor: 'rgba(251, 191, 36, 0.3)', 
    paddingVertical: 4, 
    paddingHorizontal: 12, 
    borderRadius: 6, 
    marginBottom: 20 
  },
  headerBadgeText: { color: '#fbbf24', fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  titleContainer: { alignItems: 'center', marginBottom: 24 },
  mainTitle: { color: '#ffffff', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  subTitle: { color: '#94a3b8', fontSize: 11, textAlign: 'center', paddingHorizontal: 10 },
  formCard: { 
    backgroundColor: '#0f172a', 
    borderWidth: 1, 
    borderColor: '#1e293b', 
    borderRadius: 14, 
    padding: 16, 
    marginBottom: 16 
  },
  inputGroup: { marginBottom: 14 },
  inputLabel: { color: '#64748b', fontSize: 9, fontWeight: 'bold', marginBottom: 6, letterSpacing: 0.5 },
  textInput: { 
    backgroundColor: '#111827', 
    borderWidth: 1, 
    borderColor: '#1f2937', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 12, 
    color: '#ffffff', 
    fontSize: 13 
  },
  loginBtn: { 
    backgroundColor: '#38bdf8', 
    borderRadius: 10, 
    paddingVertical: 15, 
    alignItems: 'center', 
    marginTop: 6 
  },
  disabledBtn: { opacity: 0.7 },
  loginBtnText: { color: '#070b19', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
  switchNavButton: { alignItems: 'center', paddingVertical: 10 },
  switchNavText: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold' },
  footerNote: { alignItems: 'center', position: 'absolute', bottom: 20, left: 0, right: 0 },
  footerText: { color: '#475569', fontSize: 8, fontWeight: 'bold', letterSpacing: 0.5 }
});