import React, { useState, useRef } from 'react';
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
import { useTheme } from '../theme/ThemeContext';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import api, { API_URL } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { register, checkEmailExists, sendOtp, verifyOtp } from '../services/authService';

WebBrowser.maybeCompleteAuthSession();
const institutions = [
  'RV School', 'RV Girls High School', 'RV Public School', 'RV Learning Hub', 
  'SSMRV PU College', 'NMKRV PU College', 'RV PU College Jayanagar', 
  'RV PU College North', 'RV PU College South', 'RV PU College, E-City', 
  'RV PU College, Harohalli', 'RV PU College, Mysuru', 'RV College of Engineering', 
  'RV Institute of Technology and Management', 'RV-Skills', 'RV College of Architecture', 
  'RV Institute of Management', 'MKPM RV Institute of Legal Studies', 
  'RV Teachers College', 'D.A. Pandu Memorial RV Dental College', 
  'RV College of Physiotherapy', 'RV College of Nursing', 'NMKRV College', 
  'SSMRV College', 'RV University, Bengaluru Campus', 'RV University, Mysuru Campus',
  'Media Cell Institution'
];

const institutionDepartments = {
  'RV School': ["Nursery", "Primary (1-4)", "Middle (5-7)", "High School (8-10)", "ICSE", "State Board"],
  'RV Girls High School': ["Middle School", "High School (9th-10th)", "State Board"],
  'RV Public School': ["Nursery", "Primary", "Middle School", "High School (ICSE)"],
  'RV Learning Hub': ["General"],
  'SSMRV PU College': ["Science (PCMB)", "Science (PCMC)", "Commerce (CEBA)", "Commerce (SEBA)"],
  'NMKRV PU College': ["Science (PCMB)", "Science (PCMC)", "Commerce (CEBA)", "Commerce (SEBA)", "Arts (HEPK)", "Arts (HEPS)"],
  'RV PU College Jayanagar': ["Science (PCMB)", "Science (PCMC)", "Commerce (CEBA)", "Commerce (SEBA)", "Commerce (CSBA)"],
  'RV PU College North': ["Science (PCMB)", "Science (PCMC)", "Commerce (CEBA)", "Commerce (SEBA)", "Commerce (CSBA)", "Commerce (MEBA)", "Commerce (MSBA)"],
  'RV PU College South': ["Science (PCMB)", "Science (PCMC)", "Commerce (CEBA)", "Commerce (SEBA)", "Commerce (CSBA)", "Commerce (PEBA)"],
  'RV PU College, E-City': ["Science (PCMB)", "Science (PCMC)", "Commerce (CEBA)", "Commerce (SEBA)", "Commerce (CSBA)", "Commerce (PEBA)"],
  'RV PU College, Harohalli': ["Science (PCMB)", "Science (PCMC)", "Commerce (CEBA)", "Commerce (SEBA)"],
  'RV PU College, Mysuru': ["Science (PCMB)", "Science (PCMC)", "Commerce (CEBA)", "Commerce (SEBA)"],
  'RV College of Engineering': [
    "Aerospace Engineering",
    "Artificial Intelligence and Machine Learning",
    "Biotechnology",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Science & Engineering",
    "Computer Science & Engineering (Cyber Security)",
    "Computer Science & Engineering (Data Science)",
    "Computer Science & Engineering (IoT & Cyber Security)",
    "Electrical & Electronics Engineering",
    "Electronics & Communication Engineering",
    "Electronics & Telecommunication Engineering",
    "Electronics & Instrumentation Engineering",
    "Information Science & Engineering",
    "Industrial Engineering & Management",
    "Mechanical Engineering",
    "Master of Computer Applications (MCA)",
    "Master of Business Administration (MBA)",
    "M.Tech Programs",
    "Ph.D. / M.Sc. (Engg.) by Research"
  ],
  'RV Institute of Technology and Management': [
    "Computer Science & Engineering", 
    "Information Science & Engineering", 
    "Electronics & Communication Engineering", 
    "Mechanical Engineering"
  ],
  'RV-Skills': [
    "Automotive Engineering",
    "VLSI Design",
    "Data Science & AI",
    "Embedded Systems",
    "Other Short Term Courses"
  ],
  'RV College of Architecture': [
    "Architecture (B.Arch)", 
    "Urban Design (M.Arch)", 
    "Ph.D. in Architecture"
  ],
  'RV Institute of Management': [
    "MBA", 
    "PGDBA",
    "Ph.D. in Management",
    "Executive Education"
  ],
  'MKPM RV Institute of Legal Studies': [
    "BA LLB (5-Year Integrated)", 
    "BBA LLB (5-Year Integrated)", 
    "LLB (3-Year)"
  ],
  'RV Teachers College': [
    "Bachelor of Education (B.Ed)", 
    "Master of Education (M.Ed)"
  ],
  'D.A. Pandu Memorial RV Dental College': [
    "Bachelor of Dental Surgery (BDS)", 
    "Master of Dental Surgery (MDS)",
    "PG Diploma in Dental specialties",
    "Ph.D. in Dental Sciences"
  ],
  'RV College of Physiotherapy': [
    "Bachelor of Physiotherapy (BPT)", 
    "Master of Physiotherapy (MPT)"
  ],
  'RV College of Nursing': [
    "B.Sc Nursing", 
    "M.Sc Nursing",
    "Nurse Practitioner in Critical Care (NPCC)"
  ],
  'NMKRV College': [
    "BA (Bachelor of Arts)", 
    "B.Sc (Bachelor of Science)", 
    "B.Com (Bachelor of Commerce)", 
    "B.Com Voc (Vocational)",
    "BBA (Bachelor of Business Administration)", 
    "BCA (Bachelor of Computer Applications)",
    "M.Sc in Chemistry",
    "M.Sc in Data Science",
    "M.A in Journalism & Mass Communication",
    "M.Com",
    "Ph.D. Programmes"
  ],
  'SSMRV College': [
    "B.Com", 
    "BBA", 
    "BBA - Aviation Management (BBA-AM)",
    "BCA", 
    "M.Com"
  ],
  'RV University, Bengaluru Campus': [
    "School of Computer Science & Engineering", 
    "School of Design", 
    "School of Business", 
    "School of Economics and Finance", 
    "School of Liberal Arts & Sciences",
    "School of Law"
  ],
  'RV University, Mysuru Campus': [
    "School of Computer Science & Engineering", 
    "School of Design", 
    "School of Business", 
    "School of Economics and Finance", 
    "School of Liberal Arts & Sciences"
  ],
  'Media Cell Institution': [
    "Photography",
    "Videography",
    "Content Writing",
    "Design",
    "Social Media",
    "General",
    "Other"
  ]
};

const defaultDepartments = ["General", "Other"];

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
    password: '',
    institution: '',
    branch: '',
    batchYear: '',
    joiningYear: ''
  });
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
  // Security Captcha Challenge (Bot Protection)
  const [captcha, setCaptcha] = useState({ num1: Math.floor(Math.random() * 9) + 1, num2: Math.floor(Math.random() * 9) + 1, userAnswer: '' });
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const refreshCaptcha = () => {
    setCaptcha({
      num1: Math.floor(Math.random() * 9) + 1,
      num2: Math.floor(Math.random() * 9) + 1,
      userAnswer: ''
    });
    setCaptchaVerified(false);
  };

  const handleSendInlineOtp = async () => {
    const emailClean = formData.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailClean || !emailRegex.test(emailClean)) {
      setOtpError('Please enter a valid email address');
      return;
    }

    const expectedSum = captcha.num1 + captcha.num2;
    if (parseInt(captcha.userAnswer, 10) !== expectedSum) {
      setOtpError(`Security Check Failed: Please answer ${captcha.num1} + ${captcha.num2} correctly.`);
      return;
    }
    setCaptchaVerified(true);

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

  const handleOAuthLogin = (provider) => {
    alert(`OAuth signup for ${provider} requires Client IDs setup.`);
  };

  const handleLinkedInLogin = async () => {
    setLoading(true);
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

              {/* Anti-Bot Security Captcha Challenge */}
              {emailState !== 'verified' && (
                <View style={{
                  marginTop: 10,
                  padding: 12,
                  backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="shield-checkmark" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                      Security Verification: {captcha.num1} + {captcha.num2} =
                    </Text>
                  </View>
                  <TextInput
                    style={{
                      width: 50,
                      height: 36,
                      borderWidth: 1,
                      borderColor: captchaVerified ? '#10B981' : (isDarkMode ? '#475569' : '#CBD5E1'),
                      borderRadius: 6,
                      textAlign: 'center',
                      fontSize: 14,
                      fontWeight: '700',
                      color: theme.text,
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF'
                    }}
                    placeholder="?"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    value={captcha.userAnswer}
                    onChangeText={(text) => setCaptcha({ ...captcha, userAnswer: text })}
                    maxLength={3}
                  />
                </View>
              )}

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
                  style={[styles.input, { paddingRight: 45 }]}
                  placeholder="Create a strong password"
                  placeholderTextColor="#94A3B8"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    right: 14,
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 4
                  }}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={22} 
                    color="rgba(255, 255, 255, 0.7)" 
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
                I agree to the Terms of Service
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.primaryButton, loading && { opacity: 0.7 }]} 
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
            </TouchableOpacity>
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
              <Text style={styles.modalTitle}>Select {modalType === 'institution' ? 'Institution' : modalType === 'branch' ? 'Department' : modalType === 'joining' ? 'Joining Year' : 'Graduation Year'}</Text>
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
