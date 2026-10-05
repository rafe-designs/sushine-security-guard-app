// src/screens/DataPrivacyScreen.js
import React, { useState, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function DataPrivacyScreen({ route, navigation }) {
  const [gpsConsent, setGpsConsent] = useState(false);
  const [uniformConsent, setUniformConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const operativeData = route.params?.operativeData || {};

  const handleProceed = async () => {
    if (!gpsConsent || !uniformConsent) {
      Alert.alert(
        'Consent Required', 
        'Please authorize both Duty-Bound GPS tracking and Uniform Proof & Turnout validation to access the dashboard.'
      );
      return;
    }

    try {
      setLoading(true);
      // Finalize account registration and trigger authentication token state update
      await register({
        ...operativeData,
        gpsConsentGiven: true,
        uniformConsentGiven: true,
      });
      // AppNavigator will automatically switch to Dashboard once userToken updates
    } catch (err) {
      Alert.alert('Registration Failed', err.message || 'Could not complete enrollment process.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    Alert.alert('Secure Download', 'NDPA Full Disclosure PDF downloading to local secure vault...');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070b19" />
      
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          
          {/* Top Header */}
          <View style={styles.topHeaderRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <View style={styles.badgeNDPA}>
              <Text style={styles.badgeNDPAText}>🛡️ NDPA 2023 & NDPR COMPLIANT</Text>
            </View>
            <View style={styles.shieldMini}>
              <Text style={{fontSize: 12}}>🛡️</Text>
            </View>
          </View>

          {/* Title and Subtitle */}
          <Text style={styles.title}>Data Privacy & Tracking Consent</Text>
          <Text style={styles.subtitle}>
            Mandatory informed disclosure for active field security personnel.
          </Text>

          {/* Feature Card 1: Duty-Bound Protection */}
          <View style={styles.featureBox}>
            <View style={styles.featureIconBox}>
              <Text style={{fontSize: 18}}>🛡️</Text>
            </View>
            <View style={{flex: 1}}>
              <View style={styles.featureTitleRow}>
                <Text style={styles.featureTitle}>Duty-Bound Protection</Text>
              </View>
              <Text style={styles.featureDesc}>
                Your biometric privacy is safeguarded by sovereign statutory guidelines under Nigerian cyber laws.
              </Text>
            </View>
          </View>

          {/* Feature Card 2: Continuous GPS & Geofence */}
          <View style={styles.featureBox}>
            <View style={styles.featureIconBox}>
              <Text style={{fontSize: 18}}>📍</Text>
            </View>
            <View style={{flex: 1}}>
              <View style={styles.featureTitleRow}>
                <Text style={styles.featureTitle}>Continuous GPS & Geofence</Text>
                <View style={styles.tagNano}>
                  <Text style={styles.tagNanoText}>NIN/100m</Text>
                </View>
              </View>
              <Text style={styles.featureDesc}>
                Monitored strictly within your assigned 100m beat boundary to verify active presence, patrol route adherence, and trigger sudden SOS dispatch.
              </Text>
            </View>
          </View>

          {/* Feature Card 3: Uniform & Turnout Verification */}
          <View style={styles.featureBox}>
            <View style={styles.featureIconBox}>
              <Text style={{fontSize: 18}}>👔</Text>
            </View>
            <View style={{flex: 1}}>
              <View style={styles.featureTitleRow}>
                <Text style={styles.featureTitle}>Uniform & Turnout Verification</Text>
                <View style={[styles.tagNano, {backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)'}]}>
                  <Text style={[styles.tagNanoText, {color: '#fbbf24'}]}>LIVE TACTICAL</Text>
                </View>
              </View>
              <Text style={styles.featureDesc}>
                Direct live camera capture confirming tactical vest, insignia badge, and footwear standards. Gallery rotated and camera spooling secure permanently in-situ.
              </Text>
            </View>
          </View>

          {/* Interactive Checkbox 1 */}
          <TouchableOpacity 
            style={styles.checkboxRow} 
            onPress={() => setGpsConsent(!gpsConsent)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, gpsConsent && styles.checkboxChecked]}>
              {gpsConsent && <Text style={{color: '#fff', fontSize: 10, fontWeight: 'bold'}}>✓</Text>}
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.checkboxTitle}>Duty-Bound GPS Consent</Text>
              <Text style={styles.checkboxSubText}>
                I consent to automated location checks exclusively during active shift hours.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Interactive Checkbox 2 */}
          <TouchableOpacity 
            style={styles.checkboxRow} 
            onPress={() => setUniformConsent(!uniformConsent)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, uniformConsent && styles.checkboxChecked]}>
              {uniformConsent && <Text style={{color: '#fff', fontSize: 10, fontWeight: 'bold'}}>✓</Text>}
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.checkboxTitle}>Uniform Proof & Turnout Authorization</Text>
              <Text style={styles.checkboxSubText}>
                I authorize on-device gear detection for muster verification and payroll-readiness audit.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Accept & Proceed Button */}
          <TouchableOpacity 
            style={[styles.acceptButton, loading && styles.disabledBtn]} 
            onPress={handleProceed}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.acceptButtonText}>🛡️ Accept & Proceed to Dashboard</Text>
            )}
          </TouchableOpacity>

          {/* Download PDF Button */}
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPdf}>
            <Text style={styles.downloadButtonText}>📥 Download Full NDPA Disclosure PDF</Text>
          </TouchableOpacity>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text style={styles.footerSecure}>🔒 256-BIT SECURE SSL • ISO/IEC 27001</Text>
            <Text style={styles.footerCompany}>Sunshine Guard Services Ltd. • Federal Republic of Nigeria</Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b19' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingVertical: 20, paddingHorizontal: 16 },
  card: { width: '100%', maxWidth: 420, alignSelf: 'center', backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 18 },
  topHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  backArrow: { color: '#94a3b8', fontSize: 20, fontWeight: 'bold' },
  badgeNDPA: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 12 },
  badgeNDPAText: { color: '#34d399', fontSize: 9, fontWeight: 'bold' },
  shieldMini: { width: 24, height: 24, backgroundColor: '#1e293b', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#94a3b8', marginBottom: 16, lineHeight: 15 },
  featureBox: { flexDirection: 'row', backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 10, padding: 10, marginBottom: 10, alignItems: 'flex-start', gap: 10 },
  featureIconBox: { width: 32, height: 32, backgroundColor: '#1e293b', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  featureTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  featureTitle: { color: '#f8fafc', fontSize: 12, fontWeight: 'bold' },
  tagNano: { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', paddingVertical: 1, paddingHorizontal: 6, borderRadius: 6 },
  tagNanoText: { color: '#38bdf8', fontSize: 8, fontWeight: 'bold' },
  featureDesc: { color: '#94a3b8', fontSize: 10, lineHeight: 14 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, padding: 10, marginBottom: 10, gap: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#475569', backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  checkboxTitle: { color: '#f8fafc', fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  checkboxSubText: { color: '#94a3b8', fontSize: 9, lineHeight: 13 },
  acceptButton: { backgroundColor: '#fbbf24', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 6, marginBottom: 8 },
  disabledBtn: { opacity: 0.7 },
  acceptButtonText: { color: '#0f172a', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
  downloadButton: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  downloadButtonText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  footer: { borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 12, alignItems: 'center' },
  footerSecure: { color: '#475569', fontSize: 9, fontWeight: 'bold', marginBottom: 2 },
  footerCompany: { color: '#475569', fontSize: 9, textAlign: 'center' },
});