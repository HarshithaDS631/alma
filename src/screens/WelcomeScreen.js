import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { API_URL } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

const WelcomeScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const [portal, setPortal] = useState(null);

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
    if (provider === 'linkedin') {
      try {
        const redirectUrl = Linking.createURL('oauth-callback');
        const stateObj = { redirectUrl };
        const state = encodeURIComponent(JSON.stringify(stateObj));
        
        const backendAuthUrl = `${API_URL}/auth/linkedin/callback`;
        const clientId = 'your_linkedin_client_id'; 
        const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(backendAuthUrl)}&state=${state}&scope=openid%20profile%20email`;

        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

        if (result.type === 'success' && result.url) {
          const parsed = Linking.parse(result.url);
          const { token, user } = parsed.queryParams;

          if (token && user) {
            const userInfo = JSON.parse(decodeURIComponent(user));
            userInfo.token = token;
            await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
            navigation.navigate('Main');
          } else {
            alert('LinkedIn login failed: Invalid response from server');
          }
        }
      } catch (error) {
        console.error('LinkedIn Login Error:', error);
        alert('LinkedIn Login Error: ' + error.message);
      }
    } else {
      alert(`OAuth login for ${provider} requires Client IDs setup.`);
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
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7} onPress={() => handleOAuthLogin('google')}>
            <Ionicons name="logo-google" size={24} color="#DB4437" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7} onPress={() => handleOAuthLogin('apple')}>
            <Ionicons name="logo-apple" size={24} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon} activeOpacity={0.7} onPress={() => handleOAuthLogin('linkedin')}>
            <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
          </TouchableOpacity>
        </View>

        {/* Admin Login Link */}
        <TouchableOpacity 
          style={styles.adminLoginLink} 
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Ionicons name="shield-checkmark-outline" size={16} color="#94A3B8" style={{ marginRight: 6 }} />
          <Text style={styles.adminLoginText}>Admin Login</Text>
        </TouchableOpacity>

        {/* Super Admin Login Link */}
        <TouchableOpacity 
          style={styles.superAdminLoginLink} 
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Ionicons name="star" size={16} color="#D97706" style={{ marginRight: 6 }} />
          <Text style={styles.superAdminLoginText}>Super Admin</Text>
        </TouchableOpacity>
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
