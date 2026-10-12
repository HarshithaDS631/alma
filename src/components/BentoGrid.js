import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import GradientView from './GradientView';

/**
 * BentoCard Component
 * Implements Orange Health-inspired modern Bento box UI compartments.
 * High contrast, rounded pods, clean typography, badge pills, and micro-icons.
 */
export function BentoCard({
  title,
  subtitle,
  badge,
  badgeBg,
  badgeTextColor,
  icon,
  iconColor,
  iconBg,
  metric,
  variant = 'compact', // 'hero' | 'compact' | 'stat' | 'accent'
  gradientColors,
  onPress,
  style,
  children,
}) {
  const { theme, isDarkMode } = useTheme();

  const isHero = variant === 'hero';
  const isAccent = variant === 'accent';

  // Base card surface colors
  const defaultBg = isDarkMode ? '#131F19' : '#FFFFFF';
  const defaultBorder = isDarkMode ? '#1E2E25' : '#E6F4EA';

  const CardWrapper = gradientColors ? GradientView : View;
  const wrapperProps = gradientColors ? { colors: gradientColors } : {};

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.cardContainer,
        isHero && styles.heroContainer,
        {
          backgroundColor: gradientColors ? 'transparent' : (isAccent ? (isDarkMode ? '#0E291D' : '#FFF8F5') : defaultBg),
          borderColor: isAccent ? (isDarkMode ? '#FA8257' : '#FED7AA') : defaultBorder,
        },
        style,
      ]}
    >
      <CardWrapper
        {...wrapperProps}
        style={[styles.cardInner, isHero && styles.heroInner]}
      >
        {/* Top Header Row with Icon and Badge */}
        <View style={styles.headerRow}>
          {icon && (
            <View
              style={[
                styles.iconPod,
                {
                  backgroundColor: iconBg || (isDarkMode ? '#1E3A2B' : '#FFF1EB'),
                },
              ]}
            >
              <Ionicons
                name={icon}
                size={isHero ? 20 : 17}
                color={iconColor || '#FA8257'}
              />
            </View>
          )}

          {badge && (
            <View
              style={[
                styles.badgePill,
                {
                  backgroundColor: badgeBg || (isDarkMode ? '#9A421C' : '#FFF1EB'),
                  borderColor: isDarkMode ? '#D96738' : '#FED7AA',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: badgeTextColor || (isDarkMode ? '#FFB592' : '#D96738') },
                ]}
              >
                {badge}
              </Text>
            </View>
          )}

          {/* Forward chevron indicator if clickable and no badge */}
          {!badge && onPress && (
            <View style={styles.chevronPod}>
              <Ionicons
                name="arrow-forward-outline"
                size={14}
                color={isDarkMode ? '#FFB592' : '#FA8257'}
              />
            </View>
          )}
        </View>

        {/* Metric / Stat counter if provided */}
        {metric && (
          <Text
            style={[
              styles.metricText,
              { color: isDarkMode ? '#FFF1EB' : '#B84E23' },
            ]}
          >
            {metric}
          </Text>
        )}

        {/* Primary Title */}
        <Text
          style={[
            styles.titleText,
            isHero && styles.heroTitleText,
            { color: theme.text },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>

        {/* Subtitle / Description */}
        {subtitle && (
          <Text
            style={[
              styles.subtitleText,
              { color: theme.textSecondary },
            ]}
            numberOfLines={isHero ? 3 : 2}
          >
            {subtitle}
          </Text>
        )}

        {children}
      </CardWrapper>
    </TouchableOpacity>
  );
}

/**
 * BentoGrid Container
 * Groups BentoCards into clean 2-column or responsive flow layouts.
 */
export default function BentoGrid({ children, style }) {
  return <View style={[styles.gridContainer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  gridContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 10,
  },
  cardContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroContainer: {
    width: '100%',
  },
  cardInner: {
    padding: 14,
    flex: 1,
    justifyContent: 'space-between',
  },
  heroInner: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconPod: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  chevronPod: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  heroTitleText: {
    fontSize: 16,
    lineHeight: 22,
  },
  subtitleText: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '400',
  },
});
