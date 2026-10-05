// src/screens/SignUpScreen.js
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert 
} from 'react-native';

export default function SignUpScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('Guard'); // 'Guard' or 'Supervisor'
  const [employeeId, setEmployeeId] = useState('');
  const [tacticalPin, setTacticalPin] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSignUp = () => {
    if (!fullName || !phoneNumber || !email || !tacticalPin) {
      Alert.alert('Missing Fields', 'Please fill in all mandatory registration fields.');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'You must agree to the Sunshine Guard Terms of Service and mandatory geofence tracking.');
      return;
    }

    // Pass the form state forward to the DataPrivacy screen without logging in yet
    navigation.navigate('DataPrivacy', {
      operativeData: {
        name: fullName.trim(), 
        email: email.trim(), 
        phone: phoneNumber.trim(),
        designation,
        employeeId: employeeId.trim(),
        password: tacticalPin,
        verified: false
      }
    });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Header Tag */}
          <View style={styles.topHeaderRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>🛡️ OFFICIAL FIELD ENROLLMENT</Text>
            </View>
            <View style={styles.shieldMini}>
              <Text style={{fontSize: 12}}>🛡️</Text>
            </View>
          </View>

          <Text style={styles.title}>Operative Registration</Text>
          <Text style={styles.subtitle}>New field personnel registration. Requires compliance review before dispatch activation.</Text>

          {/* NDPA Compliance Box */}
          <View style={styles.complianceBox}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
              <Text style={{fontSize: 12, marginRight: 4}}>🔒</Text>
              <Text style={styles.complianceTitle}>NDPA 2023 COMPLIANT</Text>
              <Text style={styles.complianceSubTag}>SECURE VAULT-GPS</Text>
            </View>
            <Text style={styles.complianceText}>
              Lawful identity verification and strictly encrypted geofence telemetry managed per Nigerian privacy regulations.
            </Text>
          </View>

          {/* Full Legal Name */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Full Legal Name</Text>
              <Text style={styles.subLabel}>AS ON GOVT ID / NIN</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g. Babatunde Emmanuel Okafor"
              placeholderTextColor="#94a3b8"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Phone Number</Text>
              <Text style={styles.subLabel}>WHATSAPP & SMS DISPATCH</Text>
            </View>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>NG +234</Text>
              </View>
              <TextInput
                style={[styles.input, {flex: 1, marginBottom: 0}]}
                placeholder="8031234567"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>
          </View>

          {/* Email Address */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Email Address</Text>
              <Text style={styles.subLabel}>SECURE SOC PORTAL</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="babatunde.okafor@gmail.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Designation Selector */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Designation Exterior (S2 & S.1)</Text>
              <Text style={styles.subLabel}>TACTICAL POSTING</Text>
            </View>
            <View style={styles.roleToggleRow}>
              <TouchableOpacity 
                style={[styles.roleBtn, designation === 'Guard' && styles.roleBtnActive]}
                onPress={() => setDesignation('Guard')}
              >
                <Text style={[styles.roleBtnText, designation === 'Guard' && styles.roleBtnTextActive]}>
                  🛡️ Guard (Field)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleBtn, designation === 'Supervisor' && styles.roleBtnActive]}
                onPress={() => setDesignation('Supervisor')}
              >
                <Text style={[styles.roleBtnText, designation === 'Supervisor' && styles.roleBtnTextActive]}>
                  📍 Supervisor (Patrol)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Employee / Guard ID */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Employee / Guard ID</Text>
              <Text style={styles.subLabel}>OPTIONAL IF ONBOARDING</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="ADMIN-ASSIGNED ID (E.G. SG-4821)"
              placeholderTextColor="#94a3b8"
              value={employeeId}
              onChangeText={setEmployeeId}
              autoCapitalize="characters"
            />
          </View>

          {/* Create Tactical PIN / Password */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Create Tactical PIN / Password</Text>
              <Text style={styles.subLabel}>MINIMUM 6-DIGIT</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Create strong PIN or passcode"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={tacticalPin}
              onChangeText={setTacticalPin}
            />
          </View>

          {/* Checkbox agreement */}
          <TouchableOpacity 
            style={styles.checkboxRow} 
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Text style={{color: '#fff', fontSize: 10, fontWeight: 'bold'}}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              I agree to the <Text style={{fontWeight: 'bold', color: '#0284c7'}}>Sunshine Guard Terms of Service</Text> and mandatory on-duty geofence tracking & biometric shift audit policy under Nigerian law.
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSignUp}
          >
            <Text style={styles.submitButtonText}>🛡️ PROCEED TO DATA PRIVACY ➔</Text>
          </TouchableOpacity>

          {/* Switch to login */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already registered?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingVertical: 30, paddingHorizontal: 16 },
  formContainer: { width: '100%', maxWidth: 420, alignSelf: 'center', backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 20 },
  topHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backArrow: { color: '#94a3b8', fontSize: 20, fontWeight: 'bold' },
  tagBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 12 },
  tagBadgeText: { color: '#34d399', fontSize: 9, fontWeight: 'bold' },
  shieldMini: { width: 24, height: 24, backgroundColor: '#1e293b', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#94a3b8', marginBottom: 16, lineHeight: 16 },
  complianceBox: { backgroundColor: 'rgba(30, 41, 59, 0.6)', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 10, marginBottom: 16 },
  complianceTitle: { color: '#34d399', fontSize: 10, fontWeight: 'bold', flex: 1 },
  complianceSubTag: { color: '#64748b', fontSize: 8, fontWeight: 'bold' },
  complianceText: { color: '#94a3b8', fontSize: 10, lineHeight: 14 },
  inputGroup: { marginBottom: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#f8fafc', fontSize: 11, fontWeight: 'bold' },
  subLabel: { color: '#64748b', fontSize: 9, fontWeight: '600' },
  input: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#ffffff' },
  phoneInputRow: { flexDirection: 'row', gap: 8 },
  countryCodeBox: { backgroundColor: '#1f2937', borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: '#374151' },
  countryCodeText: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold' },
  roleToggleRow: { flexDirection: 'row', gap: 8 },
  roleBtn: { flex: 1, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#fbbf24', borderColor: '#fbbf24' },
  roleBtnText: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
  roleBtnTextActive: { color: '#0f172a' },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 8 },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: '#475569', backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  checkboxLabel: { flex: 1, color: '#94a3b8', fontSize: 10, lineHeight: 14 },
  submitButton: { backgroundColor: '#fbbf24', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 14 },
  submitButtonText: { color: '#0f172a', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#64748b', fontSize: 11 },
  linkText: { color: '#38bdf8', fontSize: 11, fontWeight: 'bold' },
});