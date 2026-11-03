import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getImageUrl } from '../services/uploadService';
import getInitials from '../lib/getInitials';

// Formal Academic & Institutional Palettes (Royal Navy & Warm Gold)
const PALETTES = [
  { bg: '#0A192F', text: '#D4AF37', border: '#D4AF37' }, // Royal Midnight & Imperial Gold
  { bg: '#0F2C59', text: '#FDE68A', border: '#C5A059' }, // Deep Royal Navy & Champagne
  { bg: '#1E3A8A', text: '#FFFFFF', border: '#D4AF37' }, // Classic Royal Azure
  { bg: '#1E293B', text: '#FDE68A', border: '#D4AF37' }, // Slate Navy & Gold
  { bg: '#002147', text: '#D4AF37', border: '#D4AF37' }, // Oxford Maritime & Gold
  { bg: '#172554', text: '#FDE68A', border: '#C5A059' }, // Cobalt Deep Navy
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
  const fontSize = Math.max(9, Math.round(size * 0.36));

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
          borderWidth: Math.max(1.5, Math.round(size * 0.045)),
          borderColor: ringColor || '#D4AF37',
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
              borderWidth: 1,
              borderColor: palette.border,
            },
          ]}
        >
          <Text
            style={[
              styles.monogramText,
              {
                color: palette.text,
                fontSize,
                lineHeight: Math.round(fontSize * 1.2),
              },
              textStyle,
            ]}
            numberOfLines={1}
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
              width: Math.max(13, Math.round(size * 0.32)),
              height: Math.max(13, Math.round(size * 0.32)),
              borderRadius: Math.round(size * 0.16),
            },
          ]}
        >
          {badgeType === 'verified' ? (
            <Ionicons
              name="checkmark"
              size={Math.max(8, Math.round(size * 0.2))}
              color="#0A192F"
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
    backgroundColor: '#0F2C59',
  },
  monogramPod: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A192F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  monogramText: {
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    includeFontPadding: false,
  },
  openToWorkRing: {
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  badgePosition: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0A192F',
  },
  verifiedBadge: {
    backgroundColor: '#D4AF37',
  },
  onlineBadge: {
    backgroundColor: '#10B981',
  },
});
