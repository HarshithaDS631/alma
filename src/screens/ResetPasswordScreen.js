import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, ScrollView, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetPassword } from '../services/authService';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);

  // Extract token from route params or window.location URL search params on web
  const getTokenFromUrl = () => {
    if (route?.params?.token) return route.params.token;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.search) {
      const searchParams = new URLSearchParams(window.location.search);
      const urlToken = searchParams.get('token');
      if (urlToken) return urlToken;
    }
    const navToken = navigation.getState()?.routes?.find(r => r.name === 'ResetPassword')?.params?.token;
    return navToken || '';
  };

  const token = getTokenFromUrl();

  useEffect(() => {
    if (token) {
      setSession(true);
    }
  }, [token]);

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please enter both password fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      // Call the custom backend reset password API
      await resetPassword(token, password);

      // Success! Clear old session info and redirect to login
      await AsyncStorage.removeItem('userInfo');
      
      Alert.alert('Success', 'Your password has been updated securely! Please log in with your new password.', [
        { text: 'Log In', onPress: () => navigation.navigate('Login') }
      ]);
      
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const isWeb = Platform.OS === 'web';
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 500, flex: 1 } : { flex: 1 };

  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.textMuted, marginBottom: 20 }}>Validating secure reset link...</Text>
        <ActivityIndicator size="large" color={theme.primary} />
        <TouchableOpacity style={{ marginTop: 40 }} onPress={() => navigation.navigate('Login')}>
          <Text style={{ color: theme.primary, fontWeight: '600' }}>Back to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={webContainerStyle}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
            
            <View style={{ marginBottom: 32, alignItems: 'center' }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }}>
                <Ionicons name="lock-closed-outline" size={32} color={theme.primary} />
              </View>
              <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text, marginBottom: 8, textAlign: 'center' }}>Create New Password</Text>
              <Text style={{ fontSize: 16, color: theme.textMuted, lineHeight: 24, textAlign: 'center' }}>
                Your new password must be different from your previously used password.
              </Text>
            </View>

            <View style={{ backgroundColor: theme.card, padding: 24, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 5 }}>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>New Password</Text>
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
                    placeholder="Enter new password"
                    placeholderTextColor={theme.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 }}>Confirm New Password</Text>
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
                    placeholder="Confirm new password"
                    placeholderTextColor={theme.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 4 }}>
                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textMuted} />
                  </TouchableOpacity>
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
                onPress={handleUpdatePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;
