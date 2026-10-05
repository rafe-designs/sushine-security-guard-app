// src/screens/LoginScreen.js
import React, { useState, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' or 'email'
  const [identifier, setIdentifier] = useState(''); // phone number or email
  const [password, setPassword] = useState('');
  const [keepActive, setKeepActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);

  const handleSignIn = async () => {
    if (!identifier || !password) {
      Alert.alert('Missing Fields', 'Please enter your login identifier and security password/PIN.');
      return;
    }

    try {
      setLoading(true);
      // Pass identifier and password cleanly to match AuthContext parameters
      await login(identifier.trim(), password);
      // AppNavigator will automatically re-render and route to Dashboard or AdminDashboard
    } catch (err) {
      Alert.alert('Authentication Failed', err.message || 'Invalid credentials or inactive terminal.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricUnlock = () => {
    Alert.alert('Biometric Unlock', 'Scanning Touch ID / Face ID for rapid shift entry...');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{flex: 1}}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>

            {/* Header Badge */}
            <View style={styles.headerPortalBadge}>
              <Text style={{fontSize: 10}}>🛡️</Text>
              <Text style={styles.headerPortalText}> SUNSHINE FIELD PORTAL</Text>
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>Operative Sign In</Text>
            <Text style={styles.subtitle}>
              Access your assigned post, live geofence, and shift logging.
            </Text>

            {/* Tab Selector: Phone Number vs Corporate Email */}
            <View style={styles.tabToggleRow}>
              <TouchableOpacity 
                style={[styles.tabBtn, loginMethod === 'phone' && styles.tabBtnActive]}
                onPress={() => { setLoginMethod('phone'); setIdentifier(''); }}
              >
                <Text style={{fontSize: 12, marginRight: 4}}>📱</Text>
                <Text style={[styles.tabBtnText, loginMethod === 'phone' && styles.tabBtnTextActive]}>Phone Number</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.tabBtn, loginMethod === 'email' && styles.tabBtnActive]}
                onPress={() => { setLoginMethod('email'); setIdentifier(''); }}
              >
                <Text style={{fontSize: 12, marginRight: 4}}>✉️</Text>
                <Text style={[styles.tabBtnText, loginMethod === 'email' && styles.tabBtnTextActive]}>Corporate Email</Text>
              </TouchableOpacity>
            </View>

            {/* Input Field: Phone Number or Email */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  {loginMethod === 'phone' ? 'Official Field Phone' : 'Corporate Email Address'}
                </Text>
                <Text style={styles.subLabel}>
                  {loginMethod === 'phone' ? '✓ SIM Geotagged' : 'SECURE SOC PORTAL'}
                </Text>
              </View>

              {loginMethod === 'phone' ? (
                <View style={styles.phoneInputRow}>
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.countryCodeText}>NG +234</Text>
                  </View>
                  <TextInput
                    style={[styles.input, {flex: 1, marginBottom: 0}]}
                    placeholder="803 000 0000"
                    placeholderTextColor="#475569"
                    keyboardType="phone-pad"
                    value={identifier}
                    onChangeText={setIdentifier}
                  />
                </View>
              ) : (
                <TextInput
                  style={styles.input}
                  placeholder="operative.name@sunshineguard.ng"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={identifier}
                  onChangeText={setIdentifier}
                />
              )}
            </View>

            {/* Security Password / Shift PIN */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Security Password / Shift PIN</Text>
                <TouchableOpacity onPress={() => Alert.alert('Password Reset', 'Contact SOC dispatch supervisor for PIN reset.')}>
                  <Text style={styles.forgotPinText}>Forgot PIN?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, {flex: 1, marginBottom: 0, borderWidth: 0}]}
                  placeholder="Enter alphanumeric PIN"
                  placeholderTextColor="#475569"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeBtn} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={{fontSize: 14}}>{showPassword ? '👁️' : '👁‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Checkbox & Dispatch Reset Row */}
            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setKeepActive(!keepActive)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, keepActive && styles.checkboxChecked]}>
                  {keepActive && <Text style={{color: '#fff', fontSize: 10, fontWeight: 'bold'}}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Keep terminal active</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => Alert.alert('Dispatch Reset', 'Triggering remote SOC terminal reset protocol...')}>
                <Text style={styles.dispatchResetText}>🔄 Need Dispatch Reset?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity 
              style={[styles.signInButton, loading && styles.disabledBtn]} 
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text style={styles.signInButtonText}>➔ Sign In to Duty</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR RAPID BIOMETRIC ACCESS</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Biometric Quick Unlock Box */}
            <TouchableOpacity style={styles.biometricBox} onPress={handleBiometricUnlock} activeOpacity={0.8}>
              <View style={styles.biometricIconBox}>
                <Text style={{fontSize: 16}}>🪪</Text>
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.biometricTitle}>Biometric Quick Unlock</Text>
                <Text style={styles.biometricSub}>Touch ID / Face Unlock for shift entry</Text>
              </View>
              <View style={styles.faceIdBadge}>
                <Text style={{fontSize: 12}}>🌐</Text>
              </View>
            </TouchableOpacity>

            {/* Sign Up Redirect Card */}
            <View style={styles.signUpRedirectBox}>
              <View style={{flex: 1}}>
                <Text style={styles.signUpRedirectTitle}>New Guard or Patrol Officer?</Text>
                <Text style={styles.signUpRedirectSub}>Enroll unit badge & setup credentials</Text>
              </View>
              <TouchableOpacity 
                style={styles.signUpNavBtn} 
                onPress={() => navigation.navigate('SignUp')}
              >
                <Text style={styles.signUpNavBtnText}>Sign Up ➔</Text>
              </TouchableOpacity>
            </View>

            {/* Compliance Footer */}
            <View style={styles.footer}>
              <View style={styles.footerProtectedRow}>
                <Text style={{fontSize: 10, marginRight: 4}}>🔒</Text>
                <Text style={styles.footerProtectedText}>PROTECTED UNDER NDPA 2023</Text>
              </View>
              <Text style={styles.footerDesc}>
                Real-time GPS verification and uniform posture check required upon clock-in. Data remains encrypted within Nigerian federal jurisdiction.
              </Text>
              
              <View style={styles.footerLinksRow}>
                <TouchableOpacity onPress={() => Alert.alert('Policy', 'Duty Data Privacy Policy under NG regulation.')}>
                  <Text style={styles.footerLink}>Duty Data Policy</Text>
                </TouchableOpacity>
                <Text style={styles.footerDot}>•</Text>
                <TouchableOpacity onPress={() => Alert.alert('Emergency', 'Emergency SOC Dispatch: +234 800 SUNSHINE')}>
                  <Text style={[styles.footerLink, {color: '#ef4444'}]}>Emergency Ops Dispatch</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingVertical: 20, paddingHorizontal: 16 },
  card: { width: '100%', maxWidth: 420, alignSelf: 'center', backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 18 },
  
  headerPortalBadge: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12, marginBottom: 12 },
  headerPortalText: { color: '#fbbf24', fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },

  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginBottom: 16, paddingHorizontal: 10, lineHeight: 15 },

  tabToggleRow: { flexDirection: 'row', backgroundColor: '#111827', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#1f2937', marginBottom: 14 },
  tabBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8, borderRadius: 6 },
  tabBtnActive: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  tabBtnText: { color: '#64748b', fontSize: 11, fontWeight: 'bold' },
  tabBtnTextActive: { color: '#ffffff' },

  inputGroup: { marginBottom: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#f8fafc', fontSize: 11, fontWeight: 'bold' },
  subLabel: { color: '#34d399', fontSize: 8, fontWeight: 'bold' },
  forgotPinText: { color: '#38bdf8', fontSize: 10, fontWeight: 'bold' },

  input: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#ffffff' },
  phoneInputRow: { flexDirection: 'row', gap: 8 },
  countryCodeBox: { backgroundColor: '#1f2937', borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: '#374151' },
  countryCodeText: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold' },

  passwordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 8 },
  eyeBtn: { paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },

  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: '#475569', backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  checkboxLabel: { color: '#94a3b8', fontSize: 11 },
  dispatchResetText: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },

  signInButton: { backgroundColor: '#fbbf24', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  disabledBtn: { opacity: 0.7 },
  signInButtonText: { color: '#0f172a', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1e293b' },
  dividerText: { color: '#475569', fontSize: 8, fontWeight: 'bold', letterSpacing: 0.5 },

  biometricBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 10, padding: 10, marginBottom: 16, gap: 10 },
  biometricIconBox: { width: 32, height: 32, backgroundColor: '#1e293b', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  biometricTitle: { color: '#f8fafc', fontSize: 11, fontWeight: 'bold', marginBottom: 1 },
  biometricSub: { color: '#94a3b8', fontSize: 9 },
  faceIdBadge: { width: 28, height: 28, backgroundColor: 'rgba(56, 189, 248, 0.1)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  signUpRedirectBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.3)', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, padding: 10, marginBottom: 16, gap: 10 },
  signUpRedirectTitle: { color: '#f8fafc', fontSize: 11, fontWeight: 'bold', marginBottom: 1 },
  signUpRedirectSub: { color: '#94a3b8', fontSize: 9 },
  signUpNavBtn: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  signUpNavBtnText: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold' },

  footer: { borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 12, alignItems: 'center' },
  footerProtectedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  footerProtectedText: { color: '#34d399', fontSize: 9, fontWeight: 'bold' },
  footerDesc: { color: '#64748b', fontSize: 9, textAlign: 'center', lineHeight: 13, marginBottom: 8 },
  footerLinksRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerLink: { color: '#94a3b8', fontSize: 9, fontWeight: '600' },
  footerDot: { color: '#475569', fontSize: 9 },
});