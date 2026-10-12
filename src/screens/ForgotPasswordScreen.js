import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { forgotPassword } from '../services/authService';

const ForgotPasswordScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  
  const initialEmail = route?.params?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (route?.params?.email) {
      setEmail(route.params.email.trim());
    }
  }, [route?.params?.email]);

  const handleResetPassword = async () => {
    if (!email) {
      alert('Please enter your email address');
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
      await forgotPassword(emailClean);
      
      setSuccess(true);
    } catch (error) {
      alert(error.message || 'Failed to send password reset link');
    } finally {
      setLoading(false);
    }
  };

  const isWeb = Platform.OS === 'web';
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 500, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={webContainerStyle}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }} showsVerticalScrollIndicator={false}>
            <TouchableOpacity 
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.card,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>

            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text, marginBottom: 8 }}>Reset Password</Text>
              <Text style={{ fontSize: 16, color: theme.textMuted, lineHeight: 24 }}>
                Enter your registered email address and we&apos;ll send you a secure link to reset your password.
              </Text>
            </View>

            {success ? (
              <View style={{
                backgroundColor: theme.card,
                padding: 24,
                borderRadius: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#059669',
              }}>
                <Ionicons name="mail-unread-outline" size={48} color="#059669" style={{ marginBottom: 16 }} />
                <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 8, textAlign: 'center' }}>Check your email</Text>
                <Text style={{ fontSize: 15, color: theme.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 20 }}>
                  We&apos;ve sent a password reset link to {email}. Click the link to set a new password.
                </Text>
                <TouchableOpacity 
                  style={{
                    backgroundColor: theme.primary,
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    borderRadius: 12,
                    width: '100%',
                    alignItems: 'center'
                  }}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ backgroundColor: theme.card, padding: 24, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 5 }}>
                <View style={{ marginBottom: 20 }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.background,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    height: 56,
                  }}>
                    <TextInput 
                      style={{ flex: 1, fontSize: 16, color: theme.text }}
                      placeholder="Enter your email"
                      placeholderTextColor={theme.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={{
                    backgroundColor: theme.primary,
                    height: 56,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: loading ? 0.7 : 1
                  }} 
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
