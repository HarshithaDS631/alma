import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar, Modal } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { login, loginVerify2FA, sendLoginOtp, loginWithOtp } from '../services/authService';
import { handleGoogleLogin } from '../services/googleAuthService';
import { handleAppleLogin } from '../services/appleAuthService';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  // Authentication Mode: 'password' | 'otp'
  const [authMode, setAuthMode] = useState('password');

  // Password Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [portal, setPortal] = useState(null);

  // OTP Login States
  const [otpChannel, setOtpChannel] = useState('email'); // 'email' | 'mobile' | 'whatsapp'
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [maskedDest, setMaskedDest] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Social & 2FA States
  const [googleLoading, setGoogleLoading] = useState(false);
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

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await handleGoogleLogin();

      if (result?.notRegistered && result?.googleUser) {
        alert(`👋 Welcome ${result.googleUser.name || 'Alumni'}!\n\nPlease select your Institution, Department, and Graduation Year to complete your registration.`);
        navigation.navigate('Signup', {
          prefill: result.googleUser
        });
        return;
      }

      const userData = result;
      const userRole = (userData?.role || '').trim().toLowerCase();
      if (userRole === 'super admin' || userRole === 'superadmin') {
        navigation.navigate('SuperAdminMain');
      } else if (userRole === 'admin' || userRole === 'institution admin') {
        navigation.navigate('AdminMain');
      } else {
        navigation.navigate('Main');
      }
    } catch (error) {
      if (error.isPendingApproval || error.message?.includes('pending')) {
        alert(`⏳ Account Pending Approval\n\n${error.message}`);
      } else if (!error.message?.includes('cancelled') && !error.message?.includes('popup-closed')) {
        alert(error.message || 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const result = await handleAppleLogin();

      if (result?.notRegistered && result?.appleUser) {
        alert(`👋 Welcome ${result.appleUser.name || 'Alumni'}!\n\nPlease select your Institution, Department, and Graduation Year to complete your registration.`);
        navigation.navigate('Signup', {
          prefill: {
            ...result.appleUser,
            authProvider: 'apple'
          }
        });
        return;
      }

      const userData = result;
      const userRole = (userData?.role || '').trim().toLowerCase();
      if (userRole === 'super admin' || userRole === 'superadmin') {
        navigation.navigate('SuperAdminMain');
      } else if (userRole === 'admin' || userRole === 'institution admin') {
        navigation.navigate('AdminMain');
      } else {
        navigation.navigate('Main');
      }
    } catch (error) {
      if (error.isPendingApproval || error.message?.includes('pending')) {
        alert(`⏳ Account Pending Approval\n\n${error.message}`);
      } else if (!error.message?.includes('cancelled') && !error.message?.includes('popup-closed')) {
        alert(error.message || 'Apple Sign-In failed. Please try again.');
      }
    } finally {
      setAppleLoading(false);
    }
  };

  const handleSendLoginOtp = async () => {
    if (!otpIdentifier.trim()) {
      alert(otpChannel === 'email' ? 'Please enter your registered email address' : 'Please enter your registered mobile number');
      return;
    }
    setSendingOtp(true);
    try {
      const res = await sendLoginOtp(otpIdentifier.trim(), otpChannel);
      setOtpSent(true);
      setMaskedDest(res.maskedDestination || otpIdentifier);
      setCountdown(60);
      alert(`✅ Verification Code Dispatched!\n\nA 6-digit verification code has been sent via ${otpChannel === 'whatsapp' ? 'WhatsApp' : otpChannel === 'mobile' ? 'SMS' : 'Email'}.`);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to send OTP code. Please verify your details.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtpLogin = async () => {
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      alert('Please enter the 6-digit verification code');
      return;
    }
    setVerifyingOtp(true);
    try {
      const userData = await loginWithOtp(otpIdentifier.trim(), otpCode.trim());
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      if (userData.token) {
        await AsyncStorage.setItem('userToken', userData.token);
      }
      if (userData.refreshToken) {
        await AsyncStorage.setItem('refreshToken', userData.refreshToken);
      }

      const userRole = (userData.role || '').trim().toLowerCase();
      if (userRole === 'super admin' || userRole === 'superadmin') {
        navigation.navigate('SuperAdminMain');
      } else if (userRole === 'admin' || userRole === 'institution admin') {
        navigation.navigate('AdminMain');
      } else {
        navigation.navigate('Main');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Invalid or expired verification code.');
    } finally {
      setVerifyingOtp(false);
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
      if (userData.token) {
        await AsyncStorage.setItem('userToken', userData.token);
        await AsyncStorage.setItem('token', userData.token);
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
      const msg = error.response?.data?.message || error.message || 'Login failed';
      if (error.response?.status === 403 || msg.toLowerCase().includes('pending')) {
        alert(`⏳ Account Pending Approval\n\n${msg}`);
      } else {
        alert(msg);
      }
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
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Sign in to your Account</Text>
            <Text style={styles.subtitle}>
              Sign in with your password or use instant OTP verification via Email, Mobile SMS, or WhatsApp.
            </Text>
          </View>

          {/* ── Standard Segmented Auth Mode Switcher ── */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
            borderRadius: 12,
            padding: 4,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: theme.border
          }}>
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                borderRadius: 9,
                backgroundColor: authMode === 'password' ? (isDarkMode ? '#334155' : '#FFFFFF') : 'transparent',
                borderWidth: authMode === 'password' ? 1 : 0,
                borderColor: authMode === 'password' ? (isDarkMode ? '#38BDF8' : '#CBD5E1') : 'transparent',
                shadowColor: authMode === 'password' ? '#000' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: authMode === 'password' ? 0.08 : 0,
                shadowRadius: 2,
                elevation: authMode === 'password' ? 2 : 0,
              }}
              onPress={() => setAuthMode('password')}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="key-outline" 
                size={16} 
                color={authMode === 'password' ? (isDarkMode ? '#38BDF8' : '#003366') : theme.textSecondary} 
                style={{ marginRight: 6 }}
              />
              <Text style={{
                fontSize: 13.5,
                fontWeight: authMode === 'password' ? '700' : '600',
                color: authMode === 'password' ? (isDarkMode ? '#38BDF8' : '#003366') : theme.textSecondary
              }}>
                Password
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                borderRadius: 9,
                backgroundColor: authMode === 'otp' ? (isDarkMode ? '#334155' : '#FFFFFF') : 'transparent',
                borderWidth: authMode === 'otp' ? 1 : 0,
                borderColor: authMode === 'otp' ? (isDarkMode ? '#38BDF8' : '#CBD5E1') : 'transparent',
                shadowColor: authMode === 'otp' ? '#000' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: authMode === 'otp' ? 0.08 : 0,
                shadowRadius: 2,
                elevation: authMode === 'otp' ? 2 : 0,
              }}
              onPress={() => setAuthMode('otp')}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="shield-checkmark-outline" 
                size={16} 
                color={authMode === 'otp' ? (isDarkMode ? '#38BDF8' : '#003366') : theme.textSecondary} 
                style={{ marginRight: 6 }}
              />
              <Text style={{
                fontSize: 13.5,
                fontWeight: authMode === 'otp' ? '700' : '600',
                color: authMode === 'otp' ? (isDarkMode ? '#38BDF8' : '#003366') : theme.textSecondary
              }}>
                OTP Verification
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── MODE 1: PASSWORD LOGIN ── */}
          {authMode === 'password' && (
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
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── MODE 2: MULTI-CHANNEL OTP LOGIN (Email, Mobile, WhatsApp) ── */}
          {authMode === 'otp' && (
            <View style={styles.form}>
              {/* Channel Selector */}
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Send OTP Verification via:
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {[
                  { id: 'email', label: 'Email', icon: 'mail-outline' },
                  { id: 'mobile', label: 'SMS', icon: 'phone-portrait-outline' },
                  { id: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' }
                ].map(ch => {
                  const isSelected = otpChannel === ch.id;
                  return (
                    <TouchableOpacity
                      key={ch.id}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 10,
                        paddingHorizontal: 6,
                        borderRadius: 8,
                        backgroundColor: isSelected ? (isDarkMode ? '#243054' : '#EFF6FF') : (isDarkMode ? '#1E293B' : '#F8FAFC'),
                        borderWidth: 1.5,
                        borderColor: isSelected ? (isDarkMode ? '#38BDF8' : '#003366') : (isDarkMode ? '#334155' : '#E2E8F0')
                      }}
                      onPress={() => {
                        setOtpChannel(ch.id);
                        setOtpSent(false);
                        setOtpCode('');
                      }}
                    >
                      <Ionicons 
                        name={ch.icon} 
                        size={15} 
                        color={isSelected ? (isDarkMode ? '#38BDF8' : '#003366') : (ch.id === 'whatsapp' ? '#25D366' : theme.textMuted)} 
                        style={{ marginRight: 5 }} 
                      />
                      <Text style={{ fontSize: 12.5, fontWeight: isSelected ? '700' : '600', color: isSelected ? (isDarkMode ? '#38BDF8' : '#003366') : theme.textSecondary }}>
                        {ch.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Identifier Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons 
                    name={otpChannel === 'email' ? 'mail-outline' : (otpChannel === 'whatsapp' ? 'logo-whatsapp' : 'phone-portrait-outline')} 
                    size={20} 
                    color="#64748B" 
                    style={{ marginRight: 10 }} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={
                      otpChannel === 'email'
                        ? 'Enter registered email address'
                        : (otpChannel === 'whatsapp' ? 'Enter WhatsApp mobile number' : 'Enter registered mobile number')
                    }
                    placeholderTextColor="#94A3B8"
                    value={otpIdentifier}
                    onChangeText={setOtpIdentifier}
                    autoCapitalize="none"
                    keyboardType={otpChannel === 'email' ? 'email-address' : 'phone-pad'}
                    editable={!otpSent}
                  />
                </View>
              </View>

              {/* Step 2: OTP Code Input (when sent) */}
              {otpSent && (
                <View style={{ marginTop: 6, marginBottom: 12 }}>
                  <View style={{ backgroundColor: '#F0FDF4', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, color: '#15803D', fontWeight: '600' }}>
                      ✅ 6-digit code dispatched to {maskedDest}
                    </Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={[styles.input, { letterSpacing: 4, fontWeight: '700', fontSize: 16 }]}
                        placeholder="Enter 6-digit code"
                        placeholderTextColor="#94A3B8"
                        value={otpCode}
                        onChangeText={setOtpCode}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus={true}
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <TouchableOpacity
                      onPress={handleSendLoginOtp}
                      disabled={countdown > 0 || sendingOtp}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: countdown > 0 ? theme.textMuted : theme.primary }}>
                        {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => { setOtpSent(false); setOtpCode(''); }}>
                      <Text style={{ fontSize: 12, color: theme.textMuted, textDecorationLine: 'underline' }}>
                        Change {otpChannel === 'email' ? 'Email' : 'Number'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Action Button */}
              {!otpSent ? (
                <TouchableOpacity 
                  style={[styles.primaryButton, sendingOtp && styles.disabledButton]} 
                  onPress={handleSendLoginOtp}
                  disabled={sendingOtp}
                >
                  {sendingOtp ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      Send Code via {otpChannel === 'whatsapp' ? 'WhatsApp' : otpChannel === 'mobile' ? 'SMS' : 'Email'}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.primaryButton, verifyingOtp && styles.disabledButton]} 
                  onPress={handleVerifyOtpLogin}
                  disabled={verifyingOtp}
                >
                  {verifyingOtp ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify & Sign In</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Social OAuth Sign-In (Google & Apple Only) ── */}
          <View style={{ marginTop: 24, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
              <Text style={{ marginHorizontal: 12, color: theme.textMuted, fontSize: 13, fontWeight: '500' }}>or continue with</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
              {/* Google Sign-In */}
              <TouchableOpacity
                id="google-signin-btn"
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                onPress={handleGoogleSignIn}
                disabled={googleLoading || appleLoading}
                activeOpacity={0.7}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#4285F4" size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color="#EA4335" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Apple Sign-In */}
              <TouchableOpacity
                id="apple-signin-btn"
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: isDarkMode ? '#FFFFFF' : '#000000',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                onPress={handleAppleSignIn}
                disabled={googleLoading || appleLoading}
                activeOpacity={0.7}
              >
                {appleLoading ? (
                  <ActivityIndicator color={isDarkMode ? '#000000' : '#FFFFFF'} size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={20} color={isDarkMode ? '#000000' : '#FFFFFF'} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: isDarkMode ? '#000000' : '#FFFFFF' }}>Apple</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, marginBottom: 10 }}>
            <Text style={{ color: theme.textMuted }}>{"Don't have an account? "}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginBottom: 30, paddingHorizontal: 16 }}>
            <Text style={{ color: theme.textSecondary || '#64748B', fontSize: 12, textAlign: 'center' }}>
              By continuing, you agree to our{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')}>
              <Text style={{ color: isDarkMode ? '#38BDF8' : '#003366', fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' }}>
                Terms of Service
              </Text>
            </TouchableOpacity>
            <Text style={{ color: theme.textSecondary || '#64748B', fontSize: 12 }}> and </Text>
            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
              <Text style={{ color: isDarkMode ? '#38BDF8' : '#003366', fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' }}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
            <Text style={{ color: theme.textSecondary || '#64748B', fontSize: 12 }}>.</Text>
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
    backgroundColor: theme.background,
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
    marginBottom: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.text,
  },
  primaryButton: {
    backgroundColor: theme.buttonBackground || theme.primary,
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
    color: theme.buttonText || '#FFFFFF',
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
