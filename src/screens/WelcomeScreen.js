import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { API_URL } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { handleGoogleLogin } from '../services/googleAuthService';
import { handleLinkedInLogin } from '../services/linkedinAuthService';
import { handleFacebookLogin } from '../services/facebookAuthService';
import { handleAppleLogin } from '../services/appleAuthService';

WebBrowser.maybeCompleteAuthSession();

const WelcomeScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
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
      } else if (provider === 'linkedin') {
        userData = await handleLinkedInLogin();
      } else if (provider === 'facebook') {
        userData = await handleFacebookLogin();
      } else if (provider === 'apple') {
        userData = await handleAppleLogin();
      } else {
        alert(`${provider} sign-in is coming soon.`);
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
      
      <View style={styles.content}>
        {/* Large Logo */}
        <View style={styles.logoCircle}>
          <Ionicons name="school" size={60} color="#003366" />
        </View>
        
        <Text style={styles.title}>Welcome to RV Educational Institutions</Text>
        <Text style={styles.subtitle}>Alumni & Student Portal Network</Text>
      </View>

      <View style={styles.bottomSection}>
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Sign up</Text>
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
            <TouchableOpacity 
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: isDarkMode ? '#334155' : '#E2E8F0',
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

            <TouchableOpacity 
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: '#0A66C2',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#0A66C2',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 3,
              }} 
              activeOpacity={0.7} 
              onPress={() => handleOAuthLogin('linkedin')}
              disabled={socialLoading}
            >
              <Ionicons name="logo-linkedin" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: '#1877F2',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#1877F2',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 3,
              }} 
              activeOpacity={0.7} 
              onPress={() => handleOAuthLogin('facebook')}
              disabled={socialLoading}
            >
              <Ionicons name="logo-facebook" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: isDarkMode ? '#FFFFFF' : '#000000',
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
              <Ionicons name="logo-apple" size={24} color={isDarkMode ? '#000000' : '#FFFFFF'} />
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
    backgroundColor: theme.card,
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
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.border,
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
    color: theme.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
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
    backgroundColor: theme.primary,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.card,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: theme.card,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.primary,
  },
  secondaryButtonText: {
    color: theme.primary,
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
