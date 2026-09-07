import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, Platform, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { handleGoogleLogin } from '../services/googleAuthService';
import { handleAppleLogin } from '../services/appleAuthService';

WebBrowser.maybeCompleteAuthSession();

const WelcomeScreen = ({ navigation }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const [portal, setPortal] = useState(null);
  const [socialLoading, setSocialLoading] = useState(false);

  useEffect(() => {
    const fetchPortal = async () => {
      try {
        const portalStr = await AsyncStorage.getItem('current_portal_institution');
        if (portalStr) {
          setPortal(JSON.parse(portalStr));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchPortal();
  }, []);

  const handleOAuthLogin = async (provider) => {
    setSocialLoading(true);
    try {
      let userData;
      if (provider === 'google') {
        userData = await handleGoogleLogin();
      } else if (provider === 'apple') {
        userData = await handleAppleLogin();
      } else {
        alert(`${provider} sign-in is not supported.`);
        return;
      }

      const userRole = (userData.role || '').trim().toLowerCase();
      if (userRole === 'super admin' || userRole === 'superadmin') {
        navigation.navigate('SuperAdminMain');
      } else if (userRole === 'admin' || userRole === 'institution admin') {
        navigation.navigate('AdminMain');
      } else {
        navigation.navigate('Main');
      }
    } catch (error) {
      console.error(`${provider} Login Error:`, error);
      alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} Login Error: ` + error.message);
    } finally {
      setSocialLoading(false);
    }
  };

  const isWeb = Platform.OS === 'web';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.webWrapper}>

          {/* Hero Branding Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoInnerGlow}>
                <Ionicons name="school" size={54} color={isDarkMode ? '#3B82F6' : '#003366'} />
              </View>
            </View>

            <Text style={styles.title}>RV Educational Institutions</Text>
            <Text style={styles.subtitle}>
              {portal?.name || 'Official Alumni & Career Network'}
            </Text>
          </View>

          {/* Action & Auth Section */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Sign In</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Signup')}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>Create New Account</Text>
            </TouchableOpacity>

            {/* Social Auth Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtonsRow}>
              <TouchableOpacity 
                style={styles.socialButton}
                activeOpacity={0.75}
                onPress={() => handleOAuthLogin('google')}
                disabled={socialLoading}
              >
                <Ionicons name="logo-google" size={20} color="#EA4335" style={{ marginRight: 8 }} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialButton, styles.appleButton]}
                activeOpacity={0.75}
                onPress={() => handleOAuthLogin('apple')}
                disabled={socialLoading}
              >
                <Ionicons name="logo-apple" size={20} color={isDarkMode ? '#121316' : '#FFFFFF'} style={{ marginRight: 8 }} />
                <Text style={[styles.socialButtonText, styles.appleButtonText]}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Footer Notice */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                Trusted platform for students, alumni & faculty of RV Institutions.
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  webWrapper: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: isDarkMode ? '#1E2025' : '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: isDarkMode ? '#2D3139' : '#BFDBFE',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.3 : 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  logoInnerGlow: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: isDarkMode ? '#282A30' : '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
    color: theme.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14.5,
    textAlign: 'center',
    color: theme.textSecondary,
    lineHeight: 21,
    paddingHorizontal: 12,
  },
  actionSection: {
    width: '100%',
    marginTop: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    backgroundColor: isDarkMode ? '#2563EB' : '#003366',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: isDarkMode ? '#2563EB' : '#003366',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: isDarkMode ? '#1E2025' : '#FFFFFF',
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#2D3139' : '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    marginHorizontal: 12,
    color: theme.textMuted,
    fontSize: 12.5,
    fontWeight: '500',
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    backgroundColor: isDarkMode ? '#1E2025' : '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: isDarkMode ? '#2D3139' : '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  appleButton: {
    backgroundColor: isDarkMode ? '#F9FAFB' : '#000000',
    borderColor: isDarkMode ? '#F9FAFB' : '#000000',
  },
  appleButtonText: {
    color: isDarkMode ? '#121316' : '#FFFFFF',
  },
  footerContainer: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 11.5,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default WelcomeScreen;

