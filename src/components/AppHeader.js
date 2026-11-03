import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getSocket } from '../services/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserAvatar from './UserAvatar';

/**
 * Standard Universal App Header across all screens
 * - Left: RV ALUMNI Brand Typography
 * - Right: Messages, Notification, Support
 */
const AppHeader = ({
  navigation,
  currentRoute = '',
  unreadMessagesCount,
  unreadNotificationsCount,
  desktopTitle,
  desktopSubtitle,
  rightExtraAction,
  leftExtraAction,
  style,
}) => {
  const { theme, isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 1024;

  const [unreadMessages, setUnreadMessages] = useState(unreadMessagesCount || 0);
  const [unreadNotifications, setUnreadNotifications] = useState(unreadNotificationsCount || 0);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('userInfo').then(str => {
      if (str) {
        try { setCurrentUser(JSON.parse(str)); } catch (_) {}
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof unreadMessagesCount === 'number') {
      setUnreadMessages(unreadMessagesCount);
    }
  }, [unreadMessagesCount]);

  useEffect(() => {
    if (typeof unreadNotificationsCount === 'number') {
      setUnreadNotifications(unreadNotificationsCount);
    }
  }, [unreadNotificationsCount]);

  // Listen to socket if available for real-time updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = () => {
      setUnreadMessages(prev => prev + 1);
    };

    const handleNewNotification = () => {
      setUnreadNotifications(prev => prev + 1);
    };

    socket.on('receive_message', handleNewMessage);
    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('new_notification', handleNewNotification);
    };
  }, []);

  const isMessagesActive = currentRoute === 'Messages';
  const isNotificationsActive = currentRoute === 'Notifications';
  const isSupportActive = currentRoute === 'Contribute' || currentRoute === 'Support';

  return (
    <View style={[
      styles.header, 
      { 
        backgroundColor: isDarkMode ? '#070D1E' : '#FFFFFF',
        borderBottomColor: isDarkMode ? 'rgba(212, 175, 55, 0.3)' : '#E2E8F0',
      },
      style
    ]}>
      {/* ── Left: RV ALUMNI Brand (or Desktop Context Badge) ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {leftExtraAction}
        <TouchableOpacity
          onPress={() => navigation?.navigate?.('Home')}
          activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          accessibilityLabel="Home"
        >
          <View style={styles.brandCrest}>
            <Text style={styles.brandCrestText}>RV</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: '900', color: isDarkMode ? '#FFFFFF' : '#0A192F', letterSpacing: 0.5 }}>
            ALUMNI <Text style={{ color: '#D4AF37' }}>•</Text>
          </Text>
        </TouchableOpacity>

        {/* Desktop Context Badge if available */}
        {isDesktop && desktopTitle && (
          <View style={[
            styles.desktopBadge,
            { 
              backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.15)' : '#FAF5EB',
              borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.4)' : '#E6CA85',
            }
          ]}>
            <Text style={[styles.desktopBadgeText, { color: isDarkMode ? '#FDE68A' : '#D4AF37' }]}>
              {desktopTitle}
            </Text>
            {desktopSubtitle && (
              <Text style={{ fontSize: 11.5, color: isDarkMode ? '#CBD5E1' : '#475569', marginLeft: 4 }}>
                • {desktopSubtitle}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* ── Right: Messages, Notification, Support ── */}
      <View style={styles.headerIconsRow}>
        {rightExtraAction}

        {/* 1. Messages */}
        <TouchableOpacity
          style={[
            styles.headerIconBtn,
            {
              backgroundColor: isMessagesActive 
                ? (isDarkMode ? 'rgba(212, 175, 55, 0.2)' : '#FAF5EB') 
                : (isDarkMode ? '#0A1224' : '#F8FAFC'),
              borderColor: isMessagesActive 
                ? (isDarkMode ? '#D4AF37' : '#C5A059') 
                : (isDarkMode ? 'rgba(212, 175, 55, 0.25)' : '#E2E8F0'),
            }
          ]}
          onPress={() => {
            setUnreadMessages(0);
            navigation?.navigate?.('Messages');
          }}
          activeOpacity={0.75}
          accessibilityLabel="Messages"
        >
          <Ionicons
            name={isMessagesActive ? 'chatbubbles' : 'chatbubbles-outline'}
            size={20}
            color={isMessagesActive ? '#D4AF37' : (isDarkMode ? '#E2E8F0' : '#0A192F')}
          />
          {unreadMessages > 0 && (
            <View style={styles.badgeDot} />
          )}
        </TouchableOpacity>

        {/* 2. Notifications */}
        <TouchableOpacity
          style={[
            styles.headerIconBtn,
            {
              backgroundColor: isNotificationsActive 
                ? (isDarkMode ? 'rgba(212, 175, 55, 0.2)' : '#FEF9C3') 
                : (isDarkMode ? '#1E293B' : '#F8FAFC'),
              borderColor: isNotificationsActive 
                ? (isDarkMode ? '#D4AF37' : '#FDE68A') 
                : (isDarkMode ? '#334155' : '#E2E8F0'),
            }
          ]}
          onPress={() => {
            setUnreadNotifications(0);
            navigation?.navigate?.('Notifications');
          }}
          activeOpacity={0.75}
          accessibilityLabel="Notifications"
        >
          <Ionicons
            name={isNotificationsActive ? 'notifications' : 'notifications-outline'}
            size={20}
            color={isNotificationsActive ? '#D4AF37' : (isDarkMode ? '#CBD5E1' : '#475569')}
          />
          {unreadNotifications > 0 && (
            <View style={styles.badgeDot} />
          )}
        </TouchableOpacity>

        {/* 3. Support */}
        <TouchableOpacity
          style={[
            styles.headerIconBtn,
            {
              backgroundColor: isSupportActive 
                ? (isDarkMode ? 'rgba(225, 29, 72, 0.2)' : '#FFE4E6') 
                : (isDarkMode ? '#1E293B' : '#F8FAFC'),
              borderColor: isSupportActive 
                ? (isDarkMode ? '#E11D48' : '#FECDD3') 
                : (isDarkMode ? '#334155' : '#E2E8F0'),
            }
          ]}
          onPress={() => navigation?.navigate?.('Contribute')}
          activeOpacity={0.75}
          accessibilityLabel="Support"
        >
          <MaterialCommunityIcons
            name={isSupportActive ? 'hand-heart' : 'hand-heart-outline'}
            size={21}
            color={isSupportActive ? '#E11D48' : (isDarkMode ? '#CBD5E1' : '#475569')}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  desktopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 6,
  },
  desktopBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandCrest: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  brandCrestText: {
    color: '#0A192F',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
  },
  badgeDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});

export default AppHeader;
