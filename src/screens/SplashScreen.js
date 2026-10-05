// src/screens/SplashScreen.js
import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Image 
} from 'react-native';

export default function SplashScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a1128" />
      
      <View style={styles.card}>
        {/* Top Badges */}
        <View style={styles.topBadgesRow}>
          <View style={styles.licenseBadge}>
            <Text style={styles.licenseBadgeText}>NSCDC LICENSED</Text>
          </View>
          <View style={styles.ndpaBadge}>
            <Text style={styles.ndpaBadgeText}>🛡️ NDPA 2023</Text>
          </View>
        </View>

        {/* Company Logo Container */}
        <View style={styles.logoContainer}>
          <View style={styles.logoOuter}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Titles */}
        <View style={styles.titleContainer}>
          <Text style={styles.subBrand}>• SUNSHINE GUARD SERVICES •</Text>
          <Text style={styles.mainTitle}>SUNSHINE GUARD</Text>
          <Text style={styles.appType}>SECURITY SERVICES LTD • FIELD OPERATIVE APP</Text>
        </View>

        {/* Sync Progress Box */}
        <View style={styles.syncBox}>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>🔄 TERMINAL SYNCED • FIELD READY</Text>
            <Text style={styles.syncPercent}>100%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
          <View style={styles.cloudRow}>
            <Text style={styles.cloudStatusDot}>🟢</Text>
            <Text style={styles.cloudText}>Lagos Command Cloud:</Text>
            <Text style={styles.cloudConnected}>CONNECTED</Text>
          </View>
        </View>

        {/* Regulatory Notice */}
        <View style={styles.regulatoryBox}>
          <Text style={styles.regulatoryText}>
            ⚖️ Regulated under Private Guard Companies Act Cap P30
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.signInButton} 
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.signInButtonText}>➔  SIGN IN TO POST</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.registerButton} 
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.registerButtonText}>📋 Register Operative ID</Text>
          </TouchableOpacity>
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.emergencyText}>📞 EMERGENCY DISPATCH</Text>
            <Text style={styles.secureVaultText}>🔒 Secure Vault</Text>
          </View>
          <Text style={styles.versionText}>v3.16.8-tactical • Lagos, Nigeria</Text>
          <Text style={styles.encryptionText}>Data encrypted under NDPA 2023 • SOC-2 Type II</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070b19',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  topBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  licenseBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  licenseBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  ndpaBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  ndpaBadgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoOuter: {
    width: 80,
    height: 80,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  subBrand: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  mainTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  appType: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  syncBox: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 14,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  syncLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  syncPercent: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#1f2937',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 3,
  },
  cloudRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cloudStatusDot: {
    fontSize: 8,
    marginRight: 4,
  },
  cloudText: {
    color: '#64748b',
    fontSize: 10,
    marginRight: 4,
  },
  cloudConnected: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: 'bold',
  },
  regulatoryBox: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  regulatoryText: {
    color: '#94a3b8',
    fontSize: 10,
    textAlign: 'center',
  },
  actionContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  signInButton: {
    backgroundColor: '#fbbf24',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  signInButtonText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  registerButton: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  registerButtonText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  emergencyText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  secureVaultText: {
    color: '#64748b',
    fontSize: 10,
  },
  versionText: {
    color: '#475569',
    fontSize: 9,
    marginBottom: 2,
  },
  encryptionText: {
    color: '#475569',
    fontSize: 9,
  },
});