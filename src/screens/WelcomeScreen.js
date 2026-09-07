import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { API_URL } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { handleGoogleLogin } from '../services/googleAuthService';
import { handleAppleLogin } from '../services/appleAuthService';

WebBrowser.maybeCompleteAuthSession();

const WelcomeScreen = ({ navigation }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const styles = getStyles(theme);

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
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 500, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={webContainerStyle}>
        
        {/* Top Header with Theme Switcher */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 12 }}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDarkMode ? '#1E2025' : '#F1F5F9',
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: isDarkMode ? '#2D3139' : '#E2E8F0',
              gap: 6,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={16} color={isDarkMode ? '#60A5FA' : '#D97706'} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: isDarkMode ? '#F9FAFB' : '#0F172A' }}>
              {isDarkMode ? 'Dark' : 'Light'}
            </Text>
          </TouchableOpacity>
        </View>
      
      <View style={styles.content}>
        {/* Large Logo */}
        <View style={[styles.logoCircle, { backgroundColor: isDarkMode ? '#1E2025' : '#EFF6FF', borderColor: isDarkMode ? '#2D3139' : '#BFDBFE' }]}>
          <Ionicons name="school" size={64} color={isDarkMode ? '#3B82F6' : '#003366'} />
        </View>
        
        <Text style={[styles.title, { color: isDarkMode ? '#F9FAFB' : '#003366' }]}>Welcome to RV Educational Institutions</Text>
        <Text style={[styles.subtitle, { color: isDarkMode ? '#9CA3AF' : '#475569' }]}>Official Alumni Portal Network</Text>
      </View>

      <View style={styles.bottomSection}>
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: isDarkMode ? '#2563EB' : '#003366' }]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryButtonText, { color: '#FFFFFF' }]}>Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.secondaryButton, { backgroundColor: isDarkMode ? '#1E2025' : '#FFFFFF', borderColor: isDarkMode ? '#3B82F6' : '#003366' }]}
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: isDarkMode ? '#60A5FA' : '#003366' }]}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Social Login Icons */}
        <View style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
            <Text style={{ marginHorizontal: 12, color: theme.textSecondary, fontSize: 13, fontWeight: '500' }}>or continue with</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 18 }}>
            {/* Google */}
            <TouchableOpacity 
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: isDarkMode ? '#1E2025' : '#FFFFFF',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: isDarkMode ? '#2D3139' : '#E2E8F0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 3,
              }}
              activeOpacity={0.7}
              onPress={() => handleOAuthLogin('google')}
              disabled={socialLoading}
            >
              <Ionicons name="logo-google" size={24} color="#EA4335" />
            </TouchableOpacity>

            {/* Apple */}
            <TouchableOpacity 
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: isDarkMode ? '#F9FAFB' : '#000000',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 3,
              }}
              activeOpacity={0.7}
              onPress={() => handleOAuthLogin('apple')}
              disabled={socialLoading}
            >
              <Ionicons name="logo-apple" size={24} color={isDarkMode ? '#121316' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.primary,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 30,
  },
  primaryButton: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
});

export default WelcomeScreen;
