import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, useWindowDimensions, StatusBar, Alert, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPosts, getEvents } from '../services/authService';

const AdminDashboardScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 1024;
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: isDesktop ? 1200 : 800, flex: 1, flexDirection: isDesktop ? 'row' : 'column', gap: 24, padding: isDesktop ? 24 : 0 } : { flex: 1 };
  
  const [adminInstitution, setAdminInstitution] = useState('Institution');
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [actualStats, setActualStats] = useState({ posts: 0, events: 0 });
  
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const userInfoStr = await AsyncStorage.getItem('userInfo');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          if (userInfo.institution) {
            setAdminInstitution(userInfo.institution);
          }
        }
        const [postsData, eventsData] = await Promise.allSettled([getPosts(), getEvents()]);
        setActualStats({
          posts: postsData.status === 'fulfilled' && postsData.value ? postsData.value.length : 0,
          events: eventsData.status === 'fulfilled' && eventsData.value ? eventsData.value.length : 0,
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchAdminInfo();
  }, []);

  const handleQuickAction = (actionTitle) => {
    if (actionTitle === 'User Approvals') {
      Alert.alert(
        'Pending Approvals',
        'Review recent alumni registration requests.',
        [
          { text: 'Approve All (10)', onPress: () => {
            setPendingApprovals(prev => Math.max(0, prev - 10));
            Alert.alert('Approved', '10 alumni registrations approved successfully!');
          }},
          { text: 'View Queue', onPress: () => Alert.alert('Queue Open', 'Loading verification queue...') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      Alert.alert('Console Trigger', `${actionTitle} console will open here.`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header with Back Button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('AdminMain');
              }
            }} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#002144" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Admin Console</Text>
            <Text style={styles.headerSub}>{adminInstitution} Portal</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => Alert.alert('Admin Settings', 'Configuration panel.')}>
          <Ionicons name="settings-outline" size={24} color="#002144" />
        </TouchableOpacity>
      </View>

      <View style={webContainerStyle}>
        {/* Left Column (Desktop Only) */}
        {isDesktop && (
          <View style={{ flex: 3 }}>
             <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 20, elevation: 2, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
               <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                 <Ionicons name="shield-checkmark" size={32} color="#FFF" />
               </View>
               <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Admin Console</Text>
               <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginTop: 6 }}>{adminInstitution} Portal</Text>
               <View style={{ width: '100%', height: 1, backgroundColor: theme.border, marginVertical: 16 }} />
               <View style={{ width: '100%', gap: 12 }}>
                 <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                   <Ionicons name="settings-outline" size={18} color={theme.textSecondary} />
                   <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>Settings</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => handleQuickAction('User Approvals')}>
                   <Ionicons name="people-outline" size={18} color={theme.textSecondary} />
                   <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>Approvals</Text>
                 </TouchableOpacity>
               </View>
             </View>
          </View>
        )}

        <View style={{ flex: isDesktop ? 6 : 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Stats Grid - Show in center on mobile */}
            {!isDesktop && (
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { width: width > 768 ? '31%' : '48%' }]}>
                  <View style={styles.statTopRow}>
                    <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}><Ionicons name="newspaper-outline" size={20} color="#0284C7" /></View>
                  </View>
                  <Text style={styles.statValue}>{actualStats.posts}</Text>
                  <Text style={styles.statLabel}>Total Posts</Text>
                </View>
                <View style={[styles.statCard, { width: width > 768 ? '31%' : '48%' }]}>
                  <View style={styles.statTopRow}>
                    <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}><Ionicons name="calendar-outline" size={20} color="#16A34A" /></View>
                  </View>
                  <Text style={styles.statValue}>{actualStats.events}</Text>
                  <Text style={styles.statLabel}>Total Events</Text>
                </View>
                <View style={[styles.statCard, { width: width > 768 ? '31%' : '48%' }]}>
                  <View style={styles.statTopRow}>
                    <View style={[styles.iconBox, { backgroundColor: '#F0F9FF' }]}><Ionicons name="people-outline" size={20} color="#003366" /></View>
                  </View>
                  <Text style={styles.statValue}>{pendingApprovals}</Text>
                  <Text style={styles.statLabel}>Pending Approvals</Text>
                </View>
              </View>
            )}

            {/* Moderation Section */}
            <Text style={styles.sectionTitle}>Moderation & Control</Text>
            
            <TouchableOpacity style={styles.actionCard} onPress={() => handleQuickAction('Review Flagged Content')}>
              <View style={styles.actionInfo}>
                <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="flag" size={22} color="#EF4444" />
                </View>
                <View>
                  <Text style={styles.actionTitle}>Review Flagged Content</Text>
                  <Text style={styles.actionSub}>Review reported posts, jobs, and events</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => handleQuickAction('Block/Unblock Users')}>
              <View style={styles.actionInfo}>
                <View style={[styles.actionIcon, { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="shield-half-outline" size={22} color="#003366" />
                </View>
                <View>
                  <Text style={styles.actionTitle}>Block/Unblock Users</Text>
                  <Text style={styles.actionSub}>Manage access for institutional members</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            {/* Management Section */}
            <Text style={styles.sectionTitle}>Institutional Management</Text>

            <TouchableOpacity style={styles.actionCard} onPress={() => handleQuickAction('User Approvals')}>
              <View style={styles.actionInfo}>
                <View style={[styles.actionIcon, { backgroundColor: '#F0F9FF' }]}>
                  <Ionicons name="people" size={22} color="#003366" />
                </View>
                <View>
                  <Text style={styles.actionTitle}>User Approvals</Text>
                  <Text style={styles.actionSub}>{pendingApprovals} alumni pending verification</Text>
                </View>
              </View>
              <View style={styles.badgeRow}>
                {pendingApprovals > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{pendingApprovals}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => handleQuickAction('Manage Events')}>
              <View style={styles.actionInfo}>
                <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="calendar" size={22} color="#9333EA" />
                </View>
                <View>
                  <Text style={styles.actionTitle}>Manage Events</Text>
                  <Text style={styles.actionSub}>Approve and organize alumni meets</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => handleQuickAction('Manage Jobs')}>
              <View style={styles.actionInfo}>
                <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="briefcase" size={22} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.actionTitle}>Manage Jobs</Text>
                  <Text style={styles.actionSub}>Verify professional opportunities</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

          </ScrollView>
        </View>

        {/* Right Column (Desktop Only) */}
        {isDesktop && (
          <View style={{ flex: 3.5 }}>
            <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 16, elevation: 2, borderWidth: 1, borderColor: theme.border }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 16 }}>Platform Stats</Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={[styles.iconBox, { backgroundColor: '#E0F2FE', marginRight: 12 }]}>
                  <Ionicons name="newspaper-outline" size={20} color="#0284C7" />
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>{actualStats.posts}</Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary }}>Total Posts</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={[styles.iconBox, { backgroundColor: '#DCFCE7', marginRight: 12 }]}>
                  <Ionicons name="calendar-outline" size={20} color="#16A34A" />
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>{actualStats.events}</Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary }}>Total Events</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={[styles.iconBox, { backgroundColor: '#F0F9FF', marginRight: 12 }]}>
                  <Ionicons name="people-outline" size={20} color="#003366" />
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>{pendingApprovals}</Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary }}>Pending Approvals</Text>
                </View>
              </View>

            </View>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.primary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.primary,
    marginBottom: 12,
    marginTop: 16,
  },
  chartContainer: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 16,
  },
  chartTitleRow: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: theme.text,
  },
  chartSubtitle: {
    fontSize: 11.5,
    color: theme.textMuted,
    marginTop: 1,
  },
  chartBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    height: 80,
    width: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barValue: {
    backgroundColor: theme.primary,
    borderRadius: 7,
    width: '100%',
  },
  chartMonthText: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 8,
    fontWeight: '600',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 72,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  actionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: theme.text,
  },
  actionSub: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countBadgeText: {
    color: theme.card,
    fontSize: 11,
    fontWeight: '800',
  },
});

export default AdminDashboardScreen;
