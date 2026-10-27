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
        backgroundColor: theme.card || '#FFFFFF',
        borderBottomColor: isDarkMode ? '#1E293B' : '#E2E8F0',
      },
      style
    ]}>
      {/* ── Left: RV ALUMNI Brand (or Desktop Context Badge) ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {leftExtraAction}
        <TouchableOpacity
          onPress={() => navigation?.navigate?.('Home')}
          activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center' }}
          accessibilityLabel="Home"
        >
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#059669', letterSpacing: -0.3 }}>RV </Text>
          <Text style={{ fontSize: 22, fontWeight: '900', color: theme.text || '#0F172A', letterSpacing: -0.3 }}>ALUMNI</Text>
        </TouchableOpacity>

        {/* Desktop Context Badge if available */}
        {isDesktop && desktopTitle && (
          <View style={[
            styles.desktopBadge,
            { 
              backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5',
              borderColor: isDarkMode ? '#059669' : '#A7F3D0',
            }
          ]}>
            <Text style={[styles.desktopBadgeText, { color: isDarkMode ? '#34D399' : '#059669' }]}>
              {desktopTitle}
            </Text>
            {desktopSubtitle && (
              <Text style={{ fontSize: 11.5, color: isDarkMode ? '#94A3B8' : '#64748B', marginLeft: 4 }}>
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
                ? (isDarkMode ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5') 
                : (isDarkMode ? '#1E293B' : '#F8FAFC'),
              borderColor: isMessagesActive 
                ? (isDarkMode ? '#059669' : '#A7F3D0') 
                : (isDarkMode ? '#334155' : '#E2E8F0'),
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
            color={isMessagesActive ? '#059669' : (isDarkMode ? '#CBD5E1' : '#475569')}
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
                ? (isDarkMode ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7') 
                : (isDarkMode ? '#1E293B' : '#F8FAFC'),
              borderColor: isNotificationsActive 
                ? (isDarkMode ? '#D97706' : '#FDE68A') 
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
            color={isNotificationsActive ? '#D97706' : (isDarkMode ? '#CBD5E1' : '#475569')}
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
