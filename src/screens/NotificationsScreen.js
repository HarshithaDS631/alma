import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, StatusBar, ScrollView , Platform} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, markNotificationsRead } from '../services/authService';
import { useFocusEffect } from '@react-navigation/native';

const NotificationsScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const [notificationsList, setNotificationsList] = useState([]);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      if (data) {
        // Map backend data to frontend format
        const formatted = data.map(n => ({
          id: n._id,
          type: n.type,
          title: n.title,
          message: n.message,
          sender: n.sender,
          time: getTimeAgo(n.createdAt),
          icon: getIconForType(n.type),
          color: getColorForType(n.type),
          iconColor: getIconColorForType(n.type),
          unread: !n.isRead,
          section: getSectionFromDate(n.createdAt)
        }));
        setNotificationsList(formatted);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsRead('all');
      setNotificationsList(prev => prev.map(item => ({ ...item, unread: false })));
    } catch (e) {
      console.error('Error marking all as read:', e);
    }
  };

  const handleNotificationPress = async (item) => {
    if (item.unread) {
      try {
        await markNotificationsRead(item.id);
        setNotificationsList(prev => prev.map(n => 
          n.id === item.id ? { ...n, unread: false } : n
        ));
      } catch (e) {
        console.error('Error marking as read:', e);
      }
    }

    if (item.type === 'job') {
      navigation.navigate('Main', { screen: 'Jobs' });
    } else if (item.type === 'connection' || item.type === 'referral') {
      navigation.navigate('Main', { screen: 'Engage' });
    } else if (item.type === 'birthday' && item.sender) {
      navigation.navigate('Chat', {
        user: {
          id: item.sender._id || item.sender.id,
          name: item.sender.name || 'Alumni Member',
          initials: item.sender.name ? item.sender.name.substring(0, 2).toUpperCase() : 'AL'
        }
      });
    } else {
      navigation.navigate('Main', { screen: 'Home' });
    }
  };

  // Helper functions for mapping types
  const getIconForType = (type) => {
    switch (type) {
      case 'follow': return 'person-add-outline';
      case 'connection': return 'people-outline';
      case 'job': return 'briefcase-outline';
      case 'event': return 'calendar-outline';
      case 'referral': return 'checkmark-circle-outline';
      case 'announcement': return 'megaphone-outline';
      case 'mention': return 'at-circle-outline';
      case 'birthday': return 'gift-outline';
      default: return 'notifications-outline';
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case 'follow': return '#F3E8FF';
      case 'connection': return '#E0F2FE';
      case 'job': return '#FEF3C7';
      case 'event': return '#F3E8FF';
      case 'referral': return '#DCFCE7';
      case 'announcement': return '#FFEDD5';
      case 'mention': return '#FCE7F3';
      case 'birthday': return '#FEE2E2';
      default: return '#F1F5F9';
    }
  };

  const getIconColorForType = (type) => {
    switch (type) {
      case 'follow': return '#9333EA';
      case 'connection': return '#0284C7';
      case 'job': return '#D97706';
      case 'event': return '#9333EA';
      case 'referral': return '#16A34A';
      case 'announcement': return '#EA580C';
      case 'mention': return '#DB2777';
      case 'birthday': return '#EF4444';
      default: return '#64748B';
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getSectionFromDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return 'Earlier';
    }
  };

  // Group notifications by section
  const sections = ['Today', 'Yesterday', 'Earlier'];
  const groupedData = sections.map(section => {
    const data = notificationsList.filter(n => n.section === section);
    return { section, data };
  }).filter(group => group.data.length > 0);

  const isWeb = Platform.OS === 'web';
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 800, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={webContainerStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header with Back Button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={{ padding: 6, zIndex: 999 }}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            activeOpacity={0.6}
            onPress={() => {
              if (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
                navigation.goBack();
              } else if (navigation && typeof navigation.navigate === 'function') {
                navigation.navigate('Main');
              }
            }} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#002144" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        
        {notificationsList.some(n => n.unread) && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {groupedData.map(group => (
          <View key={group.section} style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>{group.section}</Text>
            {group.data.map(item => (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.notificationCard,
                  item.unread && styles.unreadCard
                ]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}
              >
                {/* Left indicator for unread */}
                {item.unread && <View style={styles.unreadDot} />}
                
                <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon} size={22} color={item.iconColor} />
                </View>
                
                <View style={styles.textContainer}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, item.unread && styles.unreadTitle]}>{item.title}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                  </View>
                  <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {notificationsList.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>You don't have any notifications at the moment.</Text>
          </View>
        )}
      </ScrollView>
    </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
  markRead: {
    fontSize: 13.5,
    color: theme.primary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionContainer: {
    marginTop: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationCard: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.background,
    position: 'relative',
    alignItems: 'center',
  },
  unreadCard: {
    backgroundColor: '#F0F9FF',
  },
  unreadDot: {
    position: 'absolute',
    left: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#475569',
  },
  unreadTitle: {
    color: theme.text,
    fontWeight: '700',
  },
  time: {
    fontSize: 11,
    color: theme.textMuted,
  },
  message: {
    fontSize: 13.5,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#475569',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
});

export default NotificationsScreen;
