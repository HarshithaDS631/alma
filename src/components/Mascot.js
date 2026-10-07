import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const mascotSource = require('../../assets/images/mascot.png');

/**
 * Reusable Mascot Component for RV Alumni Network
 * 
 * Props:
 * - size: 'xs' (28) | 'sm' (48) | 'md' (96) | 'lg' (140) | 'xl' (200) | number
 * - variant: 'standalone' | 'greeting' | 'empty-state' | 'banner' | 'badge'
 * - title: string (for greeting/banner/empty-state)
 * - subtitle: string
 * - speechText: string (speech bubble text)
 * - style: ViewStyle
 * - onActionPress: function (optional button action in banner)
 * - actionText: string
 */
const Mascot = ({
  size = 'md',
  variant = 'standalone',
  title,
  subtitle,
  speechText,
  style,
  onActionPress,
  actionText,
  onDismiss
}) => {
  const { theme, isDarkMode } = useTheme();

  // Resolve dimensions
  let dimension = 96;
  if (typeof size === 'number') {
    dimension = size;
  } else {
    switch (size) {
      case 'xs': dimension = 28; break;
      case 'sm': dimension = 48; break;
      case 'md': dimension = 96; break;
      case 'lg': dimension = 140; break;
      case 'xl': dimension = 200; break;
      default: dimension = 96; break;
    }
  }

  // Aspect ratio is roughly 1:1.25 (tall standing mascot)
  const mascotWidth = dimension;
  const mascotHeight = dimension * 1.25;

  if (variant === 'badge') {
    return (
      <View style={[styles.badgeContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF', borderColor: theme.primary }, style]}>
        <Image 
          source={mascotSource} 
          style={{ width: dimension, height: dimension, resizeMode: 'contain' }} 
        />
      </View>
    );
  }

  if (variant === 'empty-state') {
    return (
      <View style={[styles.emptyContainer, style]}>
        <View style={styles.emptyMascotWrapper}>
          <Image 
            source={mascotSource} 
            style={{ width: 110, height: 138, resizeMode: 'contain' }} 
          />
          {speechText && (
            <View style={[styles.speechBubble, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
              <Text style={[styles.speechText, { color: theme.text }]}>{speechText}</Text>
              <View style={[styles.speechArrow, { borderTopColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]} />
            </View>
          )}
        </View>
        {title && <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>}
        {subtitle && <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
    );
  }

  if (variant === 'banner') {
    return (
      <View style={[styles.bannerContainer, { backgroundColor: isDarkMode ? '#0F2744' : '#EBF5FF', borderColor: isDarkMode ? '#1E3A8A' : '#BFDBFE' }, style]}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerTextCol}>
            <View style={styles.bannerTagRow}>
              <View style={styles.rvTag}>
                <Text style={styles.rvTagText}>RV ALUMNI PRIDE</Text>
              </View>
            </View>
            <Text style={[styles.bannerTitle, { color: isDarkMode ? '#F8FAFC' : '#002B5C' }]}>
              {title || 'Welcome home, RVian!'}
            </Text>
            <Text style={[styles.bannerSubtitle, { color: isDarkMode ? '#94A3B8' : '#334155' }]}>
              {subtitle || 'Reconnect with your batchmates, mentors, and the global alumni family.'}
            </Text>

            {onActionPress && (
              <TouchableOpacity style={styles.bannerActionBtn} onPress={onActionPress} activeOpacity={0.8}>
                <Text style={styles.bannerActionBtnText}>{actionText || 'Explore Network'}</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bannerMascotWrap}>
            <Image 
              source={mascotSource} 
              style={{ width: 100, height: 125, resizeMode: 'contain' }} 
            />
          </View>
        </View>

        {onDismiss && (
          <TouchableOpacity style={styles.bannerCloseBtn} onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (variant === 'greeting') {
    return (
      <View style={[styles.greetingRow, style]}>
        <Image 
          source={mascotSource} 
          style={{ width: mascotWidth, height: mascotHeight, resizeMode: 'contain' }} 
        />
        {speechText && (
          <View style={[styles.greetingSpeech, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
            <Text style={[styles.greetingSpeechText, { color: theme.text }]}>{speechText}</Text>
          </View>
        )}
      </View>
    );
  }

  // Default: standalone image with clean sizing
  return (
    <View style={[styles.standaloneWrap, style]}>
      <Image 
        source={mascotSource} 
        style={{ width: mascotWidth, height: mascotHeight, resizeMode: 'contain' }} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  standaloneWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    borderWidth: 1.5,
    borderRadius: 999,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetingSpeech: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  greetingSpeechText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  emptyMascotWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  speechBubble: {
    position: 'absolute',
    top: -10,
    right: -25,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  speechText: {
    fontSize: 11,
    fontWeight: '700',
  },
  speechArrow: {
    position: 'absolute',
    bottom: -6,
    left: 14,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  bannerContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  bannerTagRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  rvTag: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rvTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 3,
  },
  bannerSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  bannerActionBtn: {
    backgroundColor: '#002B5C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  bannerActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bannerMascotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCloseBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
  },
});

export default Mascot;
