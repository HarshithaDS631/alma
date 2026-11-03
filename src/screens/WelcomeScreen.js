import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { handleGoogleLogin } from '../services/googleAuthService';
import { handleAppleLogin } from '../services/appleAuthService';
import Mascot from '../components/Mascot';
import GradientView from '../components/GradientView';

WebBrowser.maybeCompleteAuthSession();

const WelcomeScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
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
      let result;
      if (provider === 'google') {
        result = await handleGoogleLogin();
      } else if (provider === 'apple') {
        result = await handleAppleLogin();
      } else {
        alert(`${provider} sign-in is not supported.`);
        return;
      }

      if (!result) {
        // User closed the popup or cancelled — quietly exit
        return;
      }

      if (result.notRegistered) {
        const userToPrefill = result.googleUser || result.appleUser;
        if (userToPrefill) {
          alert(`👋 Welcome ${userToPrefill.name || 'Alumni'}!\n\nPlease select your Institution, Department, and Graduation Year to complete your registration.`);
          navigation.navigate('Signup', {
            prefill: {
              ...userToPrefill,
              authProvider: provider
            }
          });
          return;
        }
      }

      const userData = result;
      const userRole = (userData.role || '').trim().toLowerCase();
      if (userRole === 'super admin' || userRole === 'superadmin') {
        navigation.navigate('SuperAdminMain');
      } else if (userRole === 'admin' || userRole === 'institution admin') {
        navigation.navigate('AdminMain');
      } else {
        navigation.navigate('Main');
      }
    } catch (error) {
      const errMsg = error?.message || '';
      const isCancellation = 
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request' ||
        errMsg.includes('popup-closed-by-user') ||
        errMsg.includes('cancelled') ||
        errMsg.includes('popup-closed');

      if (!isCancellation) {
        if (error.isPendingApproval || errMsg.includes('pending')) {
          alert(`⏳ Account Pending Approval\n\n${errMsg}`);
        } else {
          alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} Login Error: ${errMsg}`);
        }
      }
    } finally {
      setSocialLoading(false);
    }
  };


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
            <View style={styles.mascotContainer}>
              <Mascot size={110} />
            </View>

            <Text style={styles.title}>RV Educational Institutions</Text>
            <Text style={styles.subtitle}>
              {portal?.name || 'Official Alumni & Career Network'}
            </Text>

            {/* Bento Feature Highlights */}
            <View style={styles.bentoFeatureRow}>
              <View style={styles.bentoFeatureItem}>
                <Ionicons name="people" size={13} color="#D4AF37" />
                <Text style={styles.bentoFeatureText}>9.9K+ Alumni</Text>
              </View>
              <View style={styles.bentoFeatureDivider} />
              <View style={styles.bentoFeatureItem}>
                <Ionicons name="briefcase" size={13} color="#D4AF37" />
                <Text style={styles.bentoFeatureText}>Job Referrals</Text>
              </View>
              <View style={styles.bentoFeatureDivider} />
              <View style={styles.bentoFeatureItem}>
                <Ionicons name="globe" size={13} color="#D4AF37" />
                <Text style={styles.bentoFeatureText}>12 Chapters</Text>
              </View>
            </View>
          </View>

          {/* Action & Auth Section */}
          <View style={styles.actionSection}>


            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
              style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}
            >
              <GradientView
                colors={['#D4AF37', '#FFD700', '#C5A059']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Sign In to Alumni Portal →</Text>
              </GradientView>
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
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
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
  bentoFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkMode ? '#0D1B3A' : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.35)' : '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 14,
    shadowColor: '#0A192F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.25 : 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  bentoFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 6,
  },
  bentoFeatureDivider: {
    width: 1,
    height: 12,
    backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.4)' : '#E2E8F0',
  },
  bentoFeatureText: {
    fontSize: 11,
    fontWeight: '700',
    color: isDarkMode ? '#D4AF37' : '#B48608',
  },
  actionSection: {
    width: '100%',
    marginTop: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A192F',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: isDarkMode ? '#0D1B3A' : '#FFFFFF',
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#D4AF37' : '#0F2C59',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0A192F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: isDarkMode ? '#FFFFFF' : '#0F2C59',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.25)' : '#E2E8F0',
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
    backgroundColor: isDarkMode ? '#0D1B3A' : '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.35)' : '#CBD5E1',
    shadowColor: '#0A192F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDarkMode ? 0.2 : 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: isDarkMode ? '#FFFFFF' : '#0A192F',
  },
  appleButton: {
    backgroundColor: isDarkMode ? '#0A1224' : '#0F172A',
    borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.4)' : '#0F172A',
  },
  appleButtonText: {
    color: '#FFFFFF',
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

