import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { getDashboardStats } from '../services/adminService';

export default function AdminMetricsScreen({ navigation, isEmbedded = false }) {
  const { theme, isDarkMode } = useTheme();
  const isFocused = useIsFocused();

  const [institution, setInstitution] = useState('Institution');
  const [adminName, setAdminName] = useState('Admin');
  
  // Dashboard Metrics
  const [metrics, setMetrics] = useState({
    totalAlumni: 0,
    pendingApprovals: 0,
    activeJobs: 0, // Mock
    upcomingEvents: 0 // Mock
  });

  useEffect(() => {
    if (isFocused) {
      loadDashboardData();
    }
  }, [isFocused]);

  const loadDashboardData = async () => {
    try {
      // Fetch user info from async storage
      const userInfoString = await AsyncStorage.getItem('userInfo');
      let instName = 'Institution';
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        instName = userInfo.institution || 'Institution';
        setInstitution(instName);
        setAdminName(userInfo.name || 'Admin');
      }

      const stats = await getDashboardStats(instName);
      
      setMetrics(prev => ({
        ...prev,
        totalAlumni: stats.totalAlumni ?? 0,
        totalDatabase: stats.totalUsers ?? 0,
        companiesCount: stats.companiesCount ?? 0,
        pendingApprovals: stats.pendingUsers ?? 0,
        activeJobs: stats.totalPosts ?? 0,
        upcomingEvents: stats.totalEvents ?? 0
      }));

    } catch (err) {
      console.log('Error loading dashboard data:', err);
    }
  };

  const isWeb = Platform.OS === 'web';
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 1024, flex: 1 } : { flex: 1 };
  
  const getStyles = (theme) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'android' ? 40 : 20,
      paddingBottom: 15,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.text,
    },
    headerIcons: {
      flexDirection: 'row',
    },
    headerIconBtn: {
      marginLeft: 15,
      position: 'relative',
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 80,
    },
    welcomeContainer: {
      marginBottom: 25,
    },
    welcomeText: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 6,
    },
    welcomeSubtitle: {
      fontSize: 16,
      color: theme.textMuted,
      fontWeight: '500',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 15,
      marginTop: 10,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    metricCard: {
      width: '48%',
      backgroundColor: theme.card,
      padding: 20,
      borderRadius: 16,
      marginBottom: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    metricIconBg: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    metricValue: {
      fontSize: 26,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 4,
    },
    metricLabel: {
      fontSize: 14,
      color: theme.textMuted,
      fontWeight: '600',
    },
    actionsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    actionBtn: {
      flex: 1,
      backgroundColor: theme.card,
      paddingVertical: 18,
      paddingHorizontal: 10,
      borderRadius: 16,
      alignItems: 'center',
      marginHorizontal: 5,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    actionIconBg: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    actionText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
    listContainer: {
      backgroundColor: theme.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    emptyList: {
      padding: 30,
      alignItems: 'center',
    },
    emptyText: {
      color: theme.textMuted,
      fontSize: 16,
      marginTop: 10,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    listLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: {
      color: theme.primary,
      fontWeight: 'bold',
      fontSize: 16,
    },
    listName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    listSub: {
      fontSize: 13,
      color: theme.textMuted,
      marginTop: 2,
    },
    reviewBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.primary,
      borderRadius: 8,
    },
    reviewBtnText: {
      color: '#FFF',
      fontWeight: '600',
      fontSize: 14,
    }
  });

  const styles = getStyles(theme);

  const MetricCard = ({ icon, color, value, label }) => (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconBg, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );



  const content = (
    <View style={webContainerStyle}>
      {!isEmbedded && <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.card} />}

      {/* Top App Bar - Hide if embedded */}
      {!isEmbedded && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation && navigation.navigate('AdminProfile')}>
              <Ionicons name="person-circle-outline" size={30} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Welcome Section */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome, {adminName}</Text>
            <Text style={styles.welcomeSubtitle}>Manage {institution}</Text>
          </View>

          {/* KPIs Section */}
          <View style={styles.metricsGrid}>
            <MetricCard 
              icon="people" 
              color={theme.primary} 
              value={(metrics.totalDatabase ?? 0).toLocaleString()} 
              label="Registered Users" 
            />
            <MetricCard 
              icon="checkmark-circle" 
              color={theme.primary} 
              value={(metrics.totalAlumni ?? 0).toLocaleString()} 
              label="Verified Alumni" 
            />
            <MetricCard 
              icon="time" 
              color={theme.secondary || '#C89565'} 
              value={(metrics.pendingApprovals ?? 0).toString()} 
              label="Pending Approvals" 
            />
            <MetricCard 
              icon="newspaper-outline" 
              color={theme.primaryDark || '#047857'} 
              value={(metrics.activeJobs ?? 0).toString()} 
              label="Community Posts" 
            />
            <MetricCard 
              icon="calendar" 
              color={theme.sand || '#D4A373'} 
              value={(metrics.upcomingEvents ?? 0).toString()} 
              label="Campus Events" 
            />
          </View>



      </ScrollView>
    </View>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <SafeAreaView style={styles.container}>
      {content}
    </SafeAreaView>
  );
}
