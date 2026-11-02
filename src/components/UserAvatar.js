import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getImageUrl } from '../services/uploadService';
import getInitials from '../lib/getInitials';

const PALETTES = [
  { bg: '#059669', text: '#FFFFFF', border: '#34D399' }, // Emerald
  { bg: '#0284C7', text: '#FFFFFF', border: '#38BDF8' }, // Blue
  { bg: '#7C3AED', text: '#FFFFFF', border: '#A78BFA' }, // Purple
  { bg: '#D97706', text: '#FFFFFF', border: '#FBBF24' }, // Amber
  { bg: '#0D9488', text: '#FFFFFF', border: '#2DD4BF' }, // Teal
  { bg: '#4F46E5', text: '#FFFFFF', border: '#818CF8' }, // Indigo
  { bg: '#E11D48', text: '#FFFFFF', border: '#FB7185' }, // Rose
];

function getPalette(str) {
  if (!str || typeof str !== 'string') return PALETTES[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

export default function UserAvatar({
  user,
  url,
  name,
  size = 44,
  borderRadius: customRadius,
  style,
  textStyle,
  showBadge = false,
  badgeType = 'verified', // 'verified' | 'online'
  ring = false,
  ringColor,
  openToWork = false,
  onPress,
}) {
  const [hasError, setHasError] = useState(false);

  // Determine candidate raw image URL
  let rawUrl = url || user?.avatar_url || user?.profilePicture || user?.avatar || user?.profilePhoto;
  const displayName = name || user?.name || user?.username || user?.email || 'RV Alumni';
  if (!rawUrl && displayName && displayName.toLowerCase().includes('harshitha')) {
    rawUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80';
  }
  const resolvedUrl = getImageUrl(rawUrl);

  // Reset error state if the URL changes
  useEffect(() => {
    setHasError(false);
  }, [resolvedUrl]);

  const palette = getPalette(displayName);
  const initials = getInitials(displayName, 'RV');
  const computedRadius = customRadius !== undefined ? customRadius : size / 2;
  const fontSize = Math.max(11, Math.round(size * 0.38));

  const shouldRenderImage = Boolean(resolvedUrl) && !hasError;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: computedRadius,
        },
        ring && {
          borderWidth: Math.max(2, Math.round(size * 0.04)),
          borderColor: ringColor || '#059669',
        },
        openToWork && styles.openToWorkRing,
        style,
      ]}
    >
      {shouldRenderImage ? (
        <Image
          source={{ uri: resolvedUrl }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: computedRadius,
            },
          ]}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <View
          style={[
            styles.monogramPod,
            {
              width: size,
              height: size,
              borderRadius: computedRadius,
              backgroundColor: palette.bg,
            },
          ]}
        >
          <Text
            style={[
              styles.monogramText,
              {
                color: palette.text,
                fontSize,
              },
              textStyle,
            ]}
          >
            {initials}
          </Text>
        </View>
      )}

      {/* Verified or Online Badge */}
      {showBadge && (
        <View
          style={[
            styles.badgePosition,
            badgeType === 'online'
              ? styles.onlineBadge
              : styles.verifiedBadge,
            {
              width: Math.max(12, Math.round(size * 0.32)),
              height: Math.max(12, Math.round(size * 0.32)),
              borderRadius: Math.round(size * 0.16),
            },
          ]}
        >
          {badgeType === 'verified' ? (
            <Ionicons
              name="checkmark"
              size={Math.max(8, Math.round(size * 0.2))}
              color="#FFFFFF"
            />
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  image: {
    backgroundColor: '#E2E8F0',
  },
  monogramPod: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  monogramText: {
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  openToWorkRing: {
    borderWidth: 2.5,
    borderColor: '#059669',
  },
  badgePosition: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  verifiedBadge: {
    backgroundColor: '#059669',
  },
  onlineBadge: {
    backgroundColor: '#10B981',
  },
});
