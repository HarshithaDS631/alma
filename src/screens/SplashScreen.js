import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const [userInfoStr, userToken] = await Promise.all([
          AsyncStorage.getItem('userInfo'),
          AsyncStorage.getItem('userToken')
        ]);
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          const hasToken = userInfo.token || userToken;
          const hasIdentity = userInfo.email || (userInfo.name && userInfo.name !== 'User');
          if (userInfo && userInfo.role && hasToken && hasIdentity) {
            const role = (userInfo.role || '').toLowerCase();
            if (role === 'superadmin' || role === 'super admin') {
              if (isMounted) navigation.replace('SuperAdminMain');
              return;
            } else if (role === 'admin' || role === 'institution admin') {
              if (isMounted) navigation.replace('AdminMain');
              return;
            } else if (role === 'alumni' || role === 'student') {
              if (isMounted) navigation.replace('Main');
              return;
            }
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      }
      if (isMounted) navigation.replace('Welcome');
    };

    // Snappy splash transition (150ms) instead of blocking for 2000ms
    const timer = setTimeout(checkSession, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          {/* Logo Placeholder */}
          <View style={styles.logo}>
            <Text style={styles.logoText}>Alumni</Text>
          </View>
        </View>
        <Text style={styles.title}>Alumni</Text>
        <Text style={styles.subtitle}>Portal Network</Text>
        
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#003366" />
          <TouchableOpacity 
            style={styles.tourBtn} 
            onPress={() => navigation.navigate('DemoCarousel')}
          >
            <Text style={styles.tourBtnText}>Take a Tour</Text>
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
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#F1F5F9',
  },
  logoText: {
    color: theme.card,
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: theme.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  tourBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  tourBtnText: {
    color: theme.primary,
    fontWeight: 'bold',
    fontSize: 14,
  }
});

export default SplashScreen;
