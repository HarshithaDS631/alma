import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Modal, 
  FlatList, 
  ActivityIndicator,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { register, checkEmailExists, sendOtp, verifyOtp } from '../services/authService';
import { handleGoogleLogin, googleSignInWeb, googleSignInMobile } from '../services/googleAuthService';
import { handleLinkedInLogin } from '../services/linkedinAuthService';
import { handleFacebookLogin } from '../services/facebookAuthService';
import { handleAppleLogin } from '../services/appleAuthService';

import { institutionsList as institutions, institutionDepartments, defaultDepartments } from '../constants/institutionDepartments';

const currentYear = new Date().getFullYear();
const batchYears = Array.from({ length: currentYear - 1963 + 1 }, (_, i) => (currentYear - i).toString());

const validatePasswordStrength = (password) => {
  if (password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one special character.' };
  }
  return { valid: true };
};

const RegisterScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const [formData, setFormData] = useState({
    name: route?.params?.prefill?.name || '',
    email: route?.params?.prefill?.email || '',
    role: 'Alumni',
    password: '',
    institution: global.selectedInstitution || '',
    branch: '',
    batchYear: '',
    joiningYear: '',
    authProvider: route?.params?.prefill ? 'google' : 'local',
    avatar_url: route?.params?.prefill?.photoURL || ''
  });

  useEffect(() => {
    if (route?.params?.prefill) {
      const { name, email, photoURL } = route.params.prefill;
      setFormData(prev => ({
        ...prev,
        name: name || prev.name,
        email: email ? email.toLowerCase().trim() : prev.email,
        avatar_url: photoURL || prev.avatar_url,
        authProvider: 'google'
      }));
      if (email) {
        setEmailState('verified');
        setOtpVerified(true);
      }
    }
  }, [route?.params?.prefill]);

  useEffect(() => {
    const loadStoredInstitution = async () => {
      try {
        const stored = await AsyncStorage.getItem('selectedInstitution');
        if (stored && !formData.institution) {
          setFormData(prev => ({ ...prev, institution: stored }));
        }
      } catch (e) {
        console.log('Error reading stored institution:', e);
      }
    };
    loadStoredInstitution();
  }, []);
  const [agreeEULA, setAgreeEULA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null); // 'institution' | 'branch' | 'joining' | 'batch'
  const [emailState, setEmailState] = useState(route?.params?.prefill?.email ? 'verified' : 'idle');
  const [inlineOtp, setInlineOtp] = useState(['', '', '', '', '', '']);
  const [otpVerified, setOtpVerified] = useState(!!route?.params?.prefill?.email);
  const [otpError, setOtpError] = useState('');
  const [sendingOtpLoading, setSendingOtpLoading] = useState(false);
  const [verifyingOtpLoading, setVerifyingOtpLoading] = useState(false);
  const otpRefs = useRef([]);

  const handleSendInlineOtp = async () => {
    const emailClean = formData.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailClean || !emailRegex.test(emailClean)) {
      setOtpError('Please enter a valid email address');
      return;
    }

    setSendingOtpLoading(true);
    setOtpError('');
    try {
      const res = await sendOtp(emailClean);
      setEmailState('sent');
      setOtpError('');
      // Keep OTP input boxes empty so user enters the 6-digit code received in email
      setInlineOtp(['', '', '', '', '', '']);
    } catch (error) {
      let msg = error.response?.data?.message || error.message || 'Failed to send OTP';
      setOtpError(msg);
    } finally {
      setSendingOtpLoading(false);
    }
  };

  const handleVerifyInlineOtp = async () => {
    const otpCode = inlineOtp.join('').trim();
    if (otpCode.length < 6) {
      setOtpError('Please enter the complete 6-digit OTP code');
      return;
    }
    setVerifyingOtpLoading(true);
    setOtpError('');
    try {
      await verifyOtp(formData.email.trim().toLowerCase(), otpCode);
      setOtpVerified(true);
      setEmailState('verified');
      setOtpError('');
    } catch (error) {
      let msg = error.response?.data?.message || error.message || 'Invalid or expired OTP code';
      setOtpVerified(false);
      setEmailState('sent');
      setOtpError(msg);
    } finally {
      setVerifyingOtpLoading(false);
    }
  };

  const handleRegister = async () => {
    const { name, email, password, institution, branch, batchYear, joiningYear, authProvider, avatar_url } = formData;
    if (!name || !email || !password || !institution || !branch || !batchYear || !joiningYear) {
      alert('Please fill in all fields including your Institution and Department.');
      return;
    }

    if (parseInt(joiningYear, 10) >= parseInt(batchYear, 10)) {
      alert('Graduation year must be greater than joining year');
      return;
    }

    const emailClean = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailClean)) {
      alert('Email address is not valid');
      return;
    }

    const pwdCheck = validatePasswordStrength(password);
    if (!pwdCheck.valid) {
      alert(pwdCheck.reason);
      return;
    }
    if (!agreeEULA) {
      alert('You must agree to the Terms of Service and End User License Agreement (EULA) to continue.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        name,
        email: emailClean,
        role: formData.role || 'Alumni',
        password,
        institution,
        branch: branch,
        department: branch,
        batchYear,
        joiningYear,
        authProvider: authProvider || 'local',
        avatar_url: avatar_url || '',
        otp: inlineOtp.join('')
      });

      alert(`✅ Registration Submitted!\n\nYour account has been registered under '${institution}' and is currently pending Admin approval.\n\nYou will be able to sign in once your Institution Administrator verifies and approves your account.`);
      navigation.navigate('Login');
    } catch (error) {
      console.error('Registration error:', error);
      let errorMsg = error.response?.data?.message || (typeof error === 'string' ? error : error.message) || 'Registration failed';
      if (errorMsg.startsWith('{')) {
        try {
          const parsed = JSON.parse(errorMsg);
          errorMsg = parsed.message || parsed.error || errorMsg;
        } catch (e) {}
      }
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignUp = async (provider) => {
    setLoading(true);
    try {
      let socialUser;
      if (provider === 'google') {
        if (Platform.OS === 'web') {
          socialUser = await googleSignInWeb();
        } else {
          socialUser = await googleSignInMobile();
        }
      } else if (provider === 'linkedin') {
        socialUser = await handleLinkedInLogin();
      } else if (provider === 'facebook') {
        socialUser = await handleFacebookLogin();
      } else if (provider === 'apple') {
        socialUser = await handleAppleLogin();
      } else {
        alert(`${provider} sign-up is coming soon.`);
        return;
      }

      if (socialUser && socialUser.email) {
        // Pre-fill the form with Name and Email from social provider
        setFormData(prev => ({
          ...prev,
          name: socialUser.name || prev.name || '',
          email: socialUser.email.toLowerCase().trim(),
          avatar_url: socialUser.photoURL || prev.avatar_url || '',
          authProvider: provider
        }));
        setEmailState('verified');
        setOtpVerified(true);
        setOtpError('');
        
        alert(`✨ Connected with ${provider.charAt(0).toUpperCase() + provider.slice(1)} as ${socialUser.name || socialUser.email}!\n\nPlease select your Institution, Department, and Graduation Year below, then create a password to submit your registration for Admin approval.`);
      }
    } catch (error) {
      console.error(`${provider} Sign-Up Error:`, error);
      if (!error.message?.includes('cancelled') && !error.message?.includes('popup-closed')) {
        alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} Error: ` + (error.message || 'Authentication failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const openPicker = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const selectItem = (item) => {
    if (modalType === 'institution') {
      setFormData({ ...formData, institution: item, branch: '' });
    } else if (modalType === 'branch') {
      setFormData({ ...formData, branch: item });
    } else if (modalType === 'joining') {
      setFormData({ ...formData, joiningYear: item });
    } else {
      setFormData({ ...formData, batchYear: item });
    }
    setModalVisible(false);
  };

  const isWeb = Platform.OS === 'web';
  const webCardStyle = isWeb ? { 
    width: '100%', 
    maxWidth: 540, 
    backgroundColor: theme.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginVertical: 24,
  } : { width: '100%', paddingHorizontal: 16, paddingVertical: 12 };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingVertical: isWeb ? 24 : 12,
            paddingHorizontal: 16,
          }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={webCardStyle}>
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
              <Ionicons name="arrow-back" size={22} color={theme.text} style={{ marginRight: 6 }} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>Sign Up</Text>
            </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput 
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput 
                      style={[
                        styles.input, 
                        { flex: 1 }, 
                        emailState === 'verified' && { borderColor: '#10B981', backgroundColor: isDarkMode ? '#064E3B20' : '#ECFDF5' }
                      ]}
                      value={formData.email}
                      onChangeText={(text) => {
                        setFormData({ ...formData, email: text });
                        if (emailState !== 'idle') {
                          setEmailState('idle');
                          setOtpVerified(false);
                          setInlineOtp(['', '', '', '', '', '']);
                          setOtpError('');
                        }
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={emailState !== 'verified'}
                    />
                    {emailState === 'verified' ? (
                      <View style={{ marginLeft: 10 }}>
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={{
                          marginLeft: 10,
                          backgroundColor: theme.primary,
                          paddingHorizontal: 14,
                          paddingVertical: 13,
                          borderRadius: 10,
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                        onPress={handleSendInlineOtp}
                        disabled={sendingOtpLoading}
                      >
                        {sendingOtpLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                            {emailState === 'sent' ? 'Resend' : 'Send OTP'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Validation Error Banner */}
                  {otpError ? (
                    <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 6, fontWeight: '500' }}>
                      ⚠️ {otpError}
                    </Text>
                  ) : null}

                  {/* Inline OTP Verification Section */}
                  {emailState === 'sent' && !otpVerified ? (
                    <View style={{
                      marginTop: 14,
                      padding: 16,
                      backgroundColor: theme.card,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: theme.primary,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 6,
                      elevation: 3
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>
                          📩 Enter 6-Digit Verification Code
                        </Text>
                        <TouchableOpacity onPress={handleSendInlineOtp} disabled={sendingOtpLoading}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primary, textDecorationLine: 'underline' }}>
                            {sendingOtpLoading ? 'Resending...' : 'Resend Code'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 14, lineHeight: 17 }}>
                        Code sent to <Text style={{ fontWeight: '700', color: theme.text }}>{formData.email}</Text>. (Check your Inbox / Spam folder)
                      </Text>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <TextInput
                            key={index}
                            ref={(el) => (otpRefs.current[index] = el)}
                            style={{
                              width: 44,
                              height: 48,
                              borderWidth: 1.5,
                              borderColor: inlineOtp[index] ? theme.primary : theme.border,
                              borderRadius: 10,
                              textAlign: 'center',
                              fontSize: 18,
                              fontWeight: '700',
                              color: theme.text,
                              backgroundColor: theme.inputBackground
                            }}
                            keyboardType="number-pad"
                            maxLength={6}
                            value={inlineOtp[index]}
                            onChangeText={(val) => {
                              const digitsOnly = val.replace(/[^0-9]/g, '');
                              if (digitsOnly.length === 6) {
                                setInlineOtp(digitsOnly.split(''));
                                otpRefs.current[5]?.focus();
                              } else {
                                const newOtp = [...inlineOtp];
                                newOtp[index] = digitsOnly.slice(-1);
                                setInlineOtp(newOtp);
                                if (digitsOnly && index < 5) {
                                  otpRefs.current[index + 1]?.focus();
                                }
                              }
                              setOtpError('');
                            }}
                            onKeyPress={(e) => {
                              if (e.nativeEvent.key === 'Backspace' && !inlineOtp[index] && index > 0) {
                                otpRefs.current[index - 1]?.focus();
                              }
                            }}
                          />
                        ))}
                      </View>

                      {otpError ? (
                        <View style={{ backgroundColor: isDarkMode ? '#450A0A' : '#FEF2F2', padding: 8, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#FCA5A5' }}>
                          <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '700', textAlign: 'center' }}>
                            ⚠️ {otpError}
                          </Text>
                        </View>
                      ) : null}

                      <TouchableOpacity
                        style={{
                          backgroundColor: theme.primary,
                          paddingVertical: 14,
                          borderRadius: 10,
                          alignItems: 'center',
                          shadowColor: theme.primary,
                          shadowOffset: { width: 0, height: 3 },
                          shadowOpacity: 0.25,
                          shadowRadius: 5,
                          elevation: 3,
                          opacity: verifyingOtpLoading ? 0.7 : 1
                        }}
                        disabled={verifyingOtpLoading}
                        onPress={handleVerifyInlineOtp}
                      >
                        {verifyingOtpLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 }}>
                            Verify OTP Code
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {/* Verified Badge */}
                  {emailState === 'verified' ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '600' }}>
                        ✅ Email verified successfully!
                      </Text>
                      <TouchableOpacity onPress={() => { setEmailState('idle'); setOtpVerified(false); }} style={{ marginLeft: 10 }}>
                        <Text style={{ color: theme.primary, fontSize: 12, textDecorationLine: 'underline' }}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Institution</Text>
                  <TouchableOpacity 
                    style={styles.selector} 
                    onPress={() => openPicker('institution')}
                  >
                    <Text style={[styles.selectorText, !formData.institution && { color: theme.textMuted }]}>
                      {formData.institution || 'Select Institution'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputContainer, { flex: 1.5, marginRight: 10 }]}>
                    <Text style={styles.label}>Department</Text>
                    <TouchableOpacity 
                      style={[styles.selector, !formData.institution && { opacity: 0.6 }]} 
                      onPress={() => {
                        if (!formData.institution) {
                          alert('Please select an institution first');
                          return;
                        }
                        openPicker('branch');
                      }}
                    >
                      <Text style={[styles.selectorText, !formData.branch && { color: theme.textMuted }]}>
                        {formData.branch || 'Select Dept'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Joining Yr</Text>
                    <TouchableOpacity 
                      style={styles.selector} 
                      onPress={() => openPicker('joining')}
                    >
                      <Text style={[styles.selectorText, !formData.joiningYear && { color: theme.textMuted }]}>
                        {formData.joiningYear || 'Year'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Text style={styles.label}>Grad Yr</Text>
                    <TouchableOpacity 
                      style={styles.selector} 
                      onPress={() => openPicker('batch')}
                    >
                      <Text style={[styles.selectorText, !formData.batchYear && { color: theme.textMuted }]}>
                        {formData.batchYear || 'Year'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={{ position: 'relative', justifyContent: 'center' }}>
                    <TextInput 
                      style={[styles.input, { paddingRight: 50 }]}
                      value={formData.password}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="new-password"
                    />
                    <TouchableOpacity
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 50,
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10
                      }}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={showPassword ? "eye" : "eye-off"} 
                        size={20} 
                        color={theme.icon} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}
                  onPress={() => setAgreeEULA(!agreeEULA)}
                  activeOpacity={0.8}
                >
                  <View style={{ 
                    width: 22, 
                    height: 22, 
                    borderRadius: 6, 
                    borderWidth: 1.5, 
                    borderColor: agreeEULA ? theme.primary : theme.border, 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    marginRight: 10, 
                    backgroundColor: agreeEULA ? theme.primary : 'transparent' 
                  }}>
                    {agreeEULA && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
                  </View>
                  <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 }}>
                    I agree to the{' '}
                    <Text 
                      style={{ color: theme.primary, textDecorationLine: 'underline', fontWeight: '700' }}
                      onPress={() => navigation.navigate('Legal')}
                    >
                      Terms & Privacy Policy
                    </Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.primaryButton, loading && { opacity: 0.7 }]} 
                  onPress={handleRegister}
                  disabled={loading}
                >
                  <Text style={styles.primaryButtonText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
                </TouchableOpacity>

                {/* ── Social Sign-Up Icons Row ── */}
                <View style={{ marginTop: 24, marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
                    <Text style={{ marginHorizontal: 12, color: theme.textSecondary, fontSize: 13, fontWeight: '500' }}>or sign up with</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
                    {/* Google Icon */}
                    <TouchableOpacity
                      style={styles.socialIcon}
                      onPress={() => handleOAuthSignUp('google')}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="logo-google" size={22} color="#EA4335" />
                    </TouchableOpacity>

                    {/* Apple Icon */}
                    <TouchableOpacity
                      style={[styles.socialIcon, { backgroundColor: isDarkMode ? '#FFFFFF' : '#000000' }]}
                      onPress={() => handleOAuthSignUp('apple')}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="logo-apple" size={22} color={isDarkMode ? '#000000' : '#FFFFFF'} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.signupText}>Sign In</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={{ textAlign: 'center', color: theme.textMuted, fontSize: 11, marginTop: 12, marginBottom: 20 }}>
                By registering, you confirm your agreement to our End User License Agreement.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {modalType === 'institution' ? 'Institution' : modalType === 'branch' ? 'Department' : modalType === 'joining' ? 'Joining Year' : 'Graduation Year'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={
                modalType === 'institution' 
                  ? institutions 
                  : modalType === 'branch' 
                    ? (institutionDepartments[formData.institution] || defaultDepartments) 
                    : batchYears
              }
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => selectItem(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.text,
  },
  selector: {
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 14,
    color: theme.text,
  },
  arrow: {
    color: theme.textSecondary,
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: theme.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  socialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  footerText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  signupText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    padding: Platform.OS === 'web' ? 20 : 0,
  },
  modalContent: {
    backgroundColor: theme.card,
    borderRadius: Platform.OS === 'web' ? 20 : 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Platform.OS === 'web' ? 560 : '75%',
    height: Platform.OS === 'web' ? '100%' : '75%',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 520 : undefined,
    padding: 24,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderTopWidth: 1,
    borderColor: theme.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  closeButton: {
    color: theme.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalItemText: {
    fontSize: 15,
    color: theme.text,
  }
});

export default RegisterScreen;
