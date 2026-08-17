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
  ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { register, checkEmailExists, sendOtp, verifyOtp } from '../services/authService';
import { handleGoogleLogin } from '../services/googleAuthService';
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

const RegisterScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Alumni',
    password: '',
    institution: global.selectedInstitution || '',
    branch: '',
    batchYear: '',
    joiningYear: ''
  });

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
  const [emailState, setEmailState] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'verified'
  const [inlineOtp, setInlineOtp] = useState(['', '', '', '', '', '']);
  const [otpVerified, setOtpVerified] = useState(false);
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
    const { name, email, password, institution, branch, batchYear, joiningYear } = formData;
    if (!name || !email || !password || !institution || !branch || !batchYear || !joiningYear) {
      alert('Please fill in all fields');
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

    if (!otpVerified && inlineOtp.join('').length < 4) {
      alert('Please click "Send OTP" and enter the 4-digit verification code below your email.');
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
      await register({
        name,
        email: emailClean,
        role: formData.role || 'Alumni',
        password,
        institution,
        branch: branch,
        department: branch,
        batchYear,
        joiningYear,
        otp: inlineOtp.join('')
      });

      alert('Registration complete! Your account has been submitted and is currently pending Admin approval.');
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
        alert(`${provider} sign-up is coming soon.`);
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
      console.error(`${provider} Sign-Up Error:`, error);
      alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} Sign-Up Error: ` + error.message);
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
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 500, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={webContainerStyle}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
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
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Join Network</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#94A3B8"
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
                    emailState === 'verified' && { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.05)' }
                  ]}
                  placeholder="college or personal email"
                  placeholderTextColor="#94A3B8"
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData({ ...formData, email: text });
                    if (emailState !== 'idle') {
                      setEmailState('idle');
                      setOtpVerified(false);
                      setInlineOtp(['', '', '', '']);
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
                      paddingVertical: 12,
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
                      <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12 }}>
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

              {/* Inline OTP Verification Section (Appears directly down below Email field) */}
              {emailState === 'sent' && !otpVerified ? (
                <View style={{
                  marginTop: 14,
                  padding: 16,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: theme.primary,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 4
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>
                      📩 Enter 6-Digit Verification Code
                    </Text>
                    <TouchableOpacity onPress={handleSendInlineOtp} disabled={sendingOtpLoading}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primary, textDecorationLine: 'underline' }}>
                        {sendingOtpLoading ? 'Resending...' : 'Resend Code'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={{ fontSize: 12, color: '#475569', marginBottom: 14, lineHeight: 17 }}>
                    Code sent to <Text style={{ fontWeight: '700', color: '#0F172A' }}>{formData.email}</Text>. (Check your Inbox / Spam folder)
                  </Text>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <TextInput
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        style={{
                          width: 44,
                          height: 48,
                          borderWidth: 2,
                          borderColor: inlineOtp[index] ? theme.primary : '#94A3B8',
                          borderRadius: 10,
                          textAlign: 'center',
                          fontSize: 20,
                          fontWeight: '800',
                          color: '#0F172A',
                          backgroundColor: inlineOtp[index] ? '#EFF6FF' : '#F8FAFC'
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
                    <View style={{ backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#FCA5A5' }}>
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
                      shadowOpacity: 0.3,
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
                <Text style={styles.arrow}>▼</Text>
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
                  <Text style={styles.arrow}>▼</Text>
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
                  <Text style={styles.arrow}>▼</Text>
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
                  <Text style={styles.arrow}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={{ position: 'relative', justifyContent: 'center' }}>
                <TextInput 
                  style={[styles.input, { paddingRight: 50, color: '#FFFFFF' }]}
                  placeholder="Create a strong password"
                  placeholderTextColor="#94A3B8"
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
                    size={22} 
                    color="#FFD700" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
              onPress={() => setAgreeEULA(!agreeEULA)}
              activeOpacity={0.8}
            >
              <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: agreeEULA ? '#FFD700' : 'transparent' }}>
                {agreeEULA && <Ionicons name="checkmark" size={16} color={theme.primary} />}
              </View>
              <Text style={{ color: 'rgba(255, 255, 255, 0.9)', flex: 1, fontSize: 14, fontWeight: '500' }}>
                I agree to the{' '}
                <Text 
                  style={{ color: '#FFD700', textDecorationLine: 'underline' }}
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
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
                <Text style={{ marginHorizontal: 12, color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, fontWeight: '500' }}>or sign up with</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 18 }}>
                {/* Google Icon */}
                <TouchableOpacity
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: '#FFFFFF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: '#E2E8F0',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.12,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  onPress={() => handleOAuthSignUp('google')}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-google" size={24} color="#EA4335" />
                </TouchableOpacity>

                {/* LinkedIn Icon */}
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
                  onPress={() => handleOAuthSignUp('linkedin')}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-linkedin" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Facebook Icon */}
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
                  onPress={() => handleOAuthSignUp('facebook')}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-facebook" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Apple Icon */}
                <TouchableOpacity
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: '#000000',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  onPress={() => handleOAuthSignUp('apple')}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
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
          
          <Text style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', fontSize: 12, marginTop: 20, marginBottom: 40, paddingHorizontal: 20 }}>
            By registering, you confirm your agreement to our End User License Agreement.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
      </View>

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
    backgroundColor: theme.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 20,
    marginBottom: 20,
  },
  backButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.card,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
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
    fontSize: 14,
    fontWeight: '500',
    color: theme.card,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: theme.card,
  },
  selector: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 15,
    color: theme.card,
  },
  arrow: {
    color: '#FFD700',
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  linkedinButton: {
    backgroundColor: '#0A66C2',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedinIcon: {
    marginRight: 8,
  },
  linkedinButtonText: {
    color: theme.card,
    fontSize: 16,
    fontWeight: '700',
  },
  dividerText: {
    marginHorizontal: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
  },
  socialIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  signupText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.primary,
  },
  closeButton: {
    color: theme.primary,
    fontWeight: '600',
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemText: {
    fontSize: 16,
    color: theme.text,
  }
});

export default RegisterScreen;
