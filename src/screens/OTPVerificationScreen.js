import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { register, sendOtp } from '../services/authService';

const OTPVerificationScreen = ({ route, navigation }) => {
  const { formData } = route.params || {};
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleOtpChange = (value, index) => {
    // Only accept numeric inputs
    const cleaned = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);

    // Auto-focus next input if we entered a value
    if (cleaned && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // If backspace is pressed on an empty value, focus previous input
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleResend = async () => {
    if (timer === 0) {
      try {
        await sendOtp(formData.email);
        setTimer(30);
        alert('A new OTP has been sent to your registered contact.');
      } catch (error) {
        alert('Failed to resend OTP');
      }
    }
  };

  const handleVerify = async () => {
    if (otp.some(d => !d)) {
      alert('Please enter all 4 digits');
      return;
    }
    setLoading(true);
    
    try {
      const otpString = otp.join('');
      await register({
        ...formData,
        otp: otpString
      });
      alert('Registration complete & email verified! Your account has been submitted and is currently pending Admin approval.');
      navigation.navigate('Login');
    } catch (error) {
      console.error('OTP verification error:', error);
      let errorMsg = 'Verification failed';
      if (error) {
        if (typeof error === 'string') {
          errorMsg = error;
        } else if (error.message && typeof error.message === 'string') {
          errorMsg = error.message;
          if (errorMsg.startsWith('{')) {
            try {
              const parsed = JSON.parse(errorMsg);
              errorMsg = parsed.message || parsed.error || errorMsg;
            } catch (e) {}
          }
        }
      }
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Signup');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#002144" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>OTP Verification</Text>
          <Text style={styles.subtitle}>We&apos;ve sent a 4-digit verification code to your email and phone number.</Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={inputRefs[index]}
              style={[
                styles.otpInput,
                digit ? styles.filledInput : null
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              selectTextOnFocus
            />
          ))}
        </View>

        <View style={styles.timerContainer}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Resend code in <Text style={styles.timerValue}>00:{timer.toString().padStart(2, '0')}</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} activeOpacity={0.6}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.button, (otp.some(d => !d) || loading) && styles.disabledButton]}
          disabled={otp.some(d => !d) || loading}
          onPress={handleVerify}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Verify & Proceed</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backButton: {
    marginBottom: 32,
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
    color: theme.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  otpInput: {
    width: 60,
    height: 64,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
    backgroundColor: theme.inputBackground,
  },
  filledInput: {
    borderColor: theme.primary,
    backgroundColor: theme.inputBackground,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  timerValue: {
    color: theme.primary,
    fontWeight: '700',
  },
  resendText: {
    color: theme.primary,
    fontWeight: '700',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: theme.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: theme.textMuted,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default OTPVerificationScreen;
