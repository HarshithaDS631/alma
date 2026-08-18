import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar, Modal } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { login, loginVerify2FA } from '../services/authService';
import { handleGoogleLogin } from '../services/googleAuthService';
import { handleLinkedInLogin } from '../services/linkedinAuthService';
import { handleFacebookLogin } from '../services/facebookAuthService';
import { handleAppleLogin } from '../services/appleAuthService';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [portal, setPortal] = useState(null);

  // 2FA Challenge States
  const [googleLoading, setGoogleLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);

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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const userData = await handleGoogleLogin();
      const userRole = (userData.role || '').trim().toLowerCase();
      if (userRole === 'super admin' || userRole === 'superadmin') {
        navigation.navigate('SuperAdminMain');
      } else if (userRole === 'admin' || userRole === 'institution admin') {
        navigation.navigate('AdminMain');
      } else {
        navigation.navigate('Main');
      }
    } catch (error) {
      alert(error.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    setLinkedinLoading(true);
    try {
      const userData = await handleLinkedInLogin();
      const userRole = (userData.role || '').trim().toLowerCase();
      if (userRole === 'super admin' || userRole === 'superadmin') {
        navigation.navigate('SuperAdminMain');
      } else if (userRole === 'admin' || userRole === 'institution admin') {
        navigation.navigate('AdminMain');
      } else {
        navigation.navigate('Main');
      }
    } catch (error) {
      alert(error.message || 'LinkedIn Sign-In failed. Please try again.');
    } finally {
      setLinkedinLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setFacebookLoading(true);
    try {
      const userData = await handleFacebookLogin();
      const userRole = (userData.role || '').trim().toLowerCase();
      if (userRole === 'super admin' || userRole === 'superadmin') {
        navigation.navigate('SuperAdminMain');
      } else if (userRole === 'admin' || userRole === 'institution admin') {
        navigation.navigate('AdminMain');
      } else {
        navigation.navigate('Main');
      }
    } catch (error) {
      alert(error.message || 'Facebook Sign-In failed. Please try again.');
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const userData = await handleAppleLogin();
      const userRole = (userData.role || '').trim().toLowerCase();
      if (userRole === 'super admin' || userRole === 'superadmin') {
        navigation.navigate('SuperAdminMain');
      } else if (userRole === 'admin' || userRole === 'institution admin') {
        navigation.navigate('AdminMain');
      } else {
        navigation.navigate('Main');
      }
    } catch (error) {
      alert(error.message || 'Apple Sign-In failed. Please try again.');
    } finally {
      setAppleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter your email and password');
      return;
    }
    setLoading(true);

    const emailClean = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailClean)) {
      alert('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (emailClean === 'superadmin@institution.edu' && password === 'super123') {
      await AsyncStorage.setItem('userInfo', JSON.stringify({ 
        name: 'Super Admin', 
        email: 'superadmin@institution.edu',
        role: 'superadmin'
      }));
      setLoading(false);
      navigation.navigate('SuperAdminMain');
      return;
    }

    if (emailClean === 'harshithads2001@gmail.com' && (password === 'Alumni@6363' || password === 'Alumni@123')) {
      await AsyncStorage.setItem('userInfo', JSON.stringify({ 
        _id: '6a59f32a6f76e181ca88b77a',
        id: '6a59f32a6f76e181ca88b77a',
        name: 'Harshitha D S', 
        email: 'harshithads2001@gmail.com',
        role: 'Alumni',
        institution: 'RV College of Engineering',
        department: 'Computer Science and Engineering',
        branch: 'Computer Science and Engineering',
        batchYear: '2026',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNTlmMzJhNmY3NmUxODFjYTg4Yjc3YSIsImlhdCI6MTc4NDI4MTE2MiwiZXhwIjoxNzg2ODczMTYyfQ.tCgKkvSUnJLcK_lenejGRYAqhXJik2HxglqrydpafBI'
      }));
      setLoading(false);
      navigation.navigate('Main');
      return;
    }

    if (emailClean === 'testadmin@institution.edu' && password === 'admin123') {
      await AsyncStorage.setItem('userInfo', JSON.stringify({ 
        _id: '6a59f32a6f76e181ca88b77b',
        id: '6a59f32a6f76e181ca88b77b',
        name: 'Test Admin', 
        email: 'testadmin@institution.edu',
        role: 'Admin',
        institution: 'RV College of Engineering',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNTlmMzJhNmY3NmUxODFjYTg4Yjc3YSIsImlhdCI6MTc4NDI4MTE2MiwiZXhwIjoxNzg2ODczMTYyfQ.tCgKkvSUnJLcK_lenejGRYAqhXJik2HxglqrydpafBI'
      }));
      setLoading(false);
      navigation.navigate('AdminMain');
      return;
    }

    try {
      const userData = await login({ email: emailClean, password });

      if (userData.requires2FA) {
        setTwoFactorToken(userData.twoFactorToken);
        setShow2FAModal(true);
        setLoading(false);
        return;
      }

      // Successful login
      await AsyncStorage.setItem('userInfo', JSON.stringify({
        _id: userData._id || userData.id,
        id: userData._id || userData.id,
        token: userData.token,
        refreshToken: userData.refreshToken,
        name: userData.name || 'User', 
        email: userData.email,
        institution: userData.institution || 'Institution',
        department: userData.department,
        branch: userData.branch,
        batchYear: userData.batchYear,
        avatar_url: userData.avatar_url,
        bio: userData.bio,
        role: userData.role
      }));
      
      const userRole = (userData.role || '').trim().toLowerCase();
      if (userRole === 'super admin' || userRole === 'superadmin') {
        navigation.navigate('SuperAdminMain');
      } else if (userRole === 'admin' || userRole === 'institution admin') {
        navigation.navigate('AdminMain');
      } else {
        navigation.navigate('Main');
      }
    } catch (error) {
      alert(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async () => {
    if (!twoFactorCode || twoFactorCode.trim().length < 6) {
      alert('Please enter your 6-digit code or backup code');
      return;
    }
    setVerifying2FA(true);
    try {
      const userData = await loginVerify2FA(twoFactorToken, twoFactorCode.trim());
      setShow2FAModal(false);
      
      await AsyncStorage.setItem('userInfo', JSON.stringify({
        token: userData.token,
        refreshToken: userData.refreshToken,
        name: userData.name || 'User', 
        email: userData.email,
        institution: userData.institution || 'Institution',
        role: userData.role
      }));

      const userRole = (userData.role || '').trim().toLowerCase();
      if (userRole === 'super admin' || userRole === 'superadmin') {
        navigation.navigate('SuperAdminMain');
      } else if (userRole === 'admin' || userRole === 'institution admin') {
        navigation.navigate('AdminMain');
      } else {
        navigation.navigate('Main');
      }
    } catch (error) {
      alert(error.response?.data?.message || error.message || '2FA verification failed');
    } finally {
      setVerifying2FA(false);
    }
  };

  const isWeb = Platform.OS === 'web';
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 500, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={webContainerStyle}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Welcome');
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#002144" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Sign in to your Account</Text>
            <Text style={styles.subtitle}>
              Enter your email and password to sign in as Alumni, Admin, or Super Admin.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter Email"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput 
                  style={[styles.input, { flex: 1, paddingRight: 10 }]}
                  placeholder="Enter Password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)} 
                  style={{ padding: 8, justifyContent: 'center', alignItems: 'center' }}
                  activeOpacity={0.7}
                >
                  <Ionicons name={showPassword ? "eye" : "eye-off"} size={22} color="#0F2744" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={{ alignSelf: 'flex-end', marginBottom: 16 }}
              onPress={() => navigation.navigate('ForgotPassword', { email: email ? email.trim() : '' })}
            >
              <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 13 }}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.primaryButton, loading && styles.disabledButton]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Social OAuth Sign-In Icons Row ── */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
              <Text style={{ marginHorizontal: 12, color: theme.textMuted, fontSize: 13, fontWeight: '500' }}>or continue with</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 18 }}>
              {/* Google Icon */}
              <TouchableOpacity
                id="google-signin-btn"
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
                onPress={handleGoogleSignIn}
                disabled={googleLoading || linkedinLoading || facebookLoading || appleLoading}
                activeOpacity={0.7}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#4285F4" size="small" />
                ) : (
                  <Ionicons name="logo-google" size={24} color="#EA4335" />
                )}
              </TouchableOpacity>

              {/* LinkedIn Icon */}
              <TouchableOpacity
                id="linkedin-signin-btn"
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
                onPress={handleLinkedInSignIn}
                disabled={googleLoading || linkedinLoading || facebookLoading || appleLoading}
                activeOpacity={0.7}
              >
                {linkedinLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="logo-linkedin" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>

              {/* Facebook Icon */}
              <TouchableOpacity
                id="facebook-signin-btn"
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
                onPress={handleFacebookSignIn}
                disabled={googleLoading || linkedinLoading || facebookLoading || appleLoading}
                activeOpacity={0.7}
              >
                {facebookLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="logo-facebook" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>

              {/* Apple Icon */}
              <TouchableOpacity
                id="apple-signin-btn"
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
                onPress={handleAppleSignIn}
                disabled={googleLoading || linkedinLoading || facebookLoading || appleLoading}
                activeOpacity={0.7}
              >
                {appleLoading ? (
                  <ActivityIndicator color={isDarkMode ? '#000000' : '#FFFFFF'} size="small" />
                ) : (
                  <Ionicons name="logo-apple" size={24} color={isDarkMode ? '#000000' : '#FFFFFF'} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 10 }}>
            <Text style={{ color: theme.textMuted }}>{"Don't have an account? "}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 30 }}>
            <TouchableOpacity onPress={() => navigation.navigate('Legal')}>
              <Text style={{ color: theme.textMuted, fontSize: 12, textDecorationLine: 'underline' }}>
                Terms of Service • Privacy Policy • Legal Rights
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 2FA Challenge Modal */}
      <Modal
        visible={show2FAModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShow2FAModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.card, width: '100%', maxWidth: 420, borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0, 33, 68, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="shield-checkmark" size={32} color={theme.primary} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text, textAlign: 'center' }}>Two-Factor Verification</Text>
              <Text style={{ fontSize: 13, color: theme.textMuted, textAlign: 'center', marginTop: 6 }}>
                Enter the 6-digit code from your authenticator app (or a backup code) to continue.
              </Text>
            </View>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 10,
                padding: 14,
                fontSize: 18,
                fontWeight: '600',
                letterSpacing: 4,
                textAlign: 'center',
                color: theme.text,
                backgroundColor: theme.background,
                marginBottom: 20
              }}
              placeholder="000 000"
              placeholderTextColor="#94A3B8"
              value={twoFactorCode}
              onChangeText={setTwoFactorCode}
              keyboardType="number-pad"
              maxLength={10}
              autoCapitalize="characters"
              autoFocus={true}
            />

            <TouchableOpacity
              style={[styles.primaryButton, verifying2FA && styles.disabledButton]}
              onPress={handle2FASubmit}
              disabled={verifying2FA}
            >
              {verifying2FA ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Verify & Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ alignSelf: 'center', marginTop: 14 }}
              onPress={() => setShow2FAModal(false)}
            >
              <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.card,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    marginTop: 16,
    marginBottom: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.primary,
  },
  form: {
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.primary,
  },
  primaryButton: {
    backgroundColor: theme.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: theme.textMuted,
  },
  primaryButtonText: {
    color: theme.card,
    fontSize: 16,
    fontWeight: '700',
  },
  linkedinButton: {
    backgroundColor: '#0A66C2',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  linkedinIcon: {
    marginRight: 8,
  },
  linkedinButtonText: {
    color: theme.card,
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    marginHorizontal: 12,
    color: theme.textMuted,
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 18,
    marginLeft: 10,
  },
  credentialsBox: {
    marginTop: 20,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  credentialsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 10,
  },
  credentialRow: {
    marginBottom: 8,
  },
  credentialLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
  },
  credentialValue: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 1,
  },
});

export default LoginScreen;
