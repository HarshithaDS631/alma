import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Linking,
  Share,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import getInitials from '../lib/getInitials';
import { getImageUrl } from '../services/uploadService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Instagram-inspired card color themes
const CARD_THEMES = [
  {
    id: 'rvce',
    name: 'RVCE Royal',
    bg: '#002147',
    gradient: ['#001428', '#002B5B', '#0F4C81'],
    accent: '#F59E0B',
    accentLight: '#FEF3C7',
    badgeText: '🏛️ RVCE ALUMNI',
    cardBorder: 'rgba(245, 158, 11, 0.4)'
  },
  {
    id: 'instagram',
    name: 'Instagram Sunset',
    bg: '#833AB4',
    gradient: ['#833AB4', '#FD1D1D', '#FCB045'],
    accent: '#FF007F',
    accentLight: '#FFE4E6',
    badgeText: '✨ ALUMNI VERIFIED',
    cardBorder: 'rgba(255, 255, 255, 0.3)'
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    bg: '#064E3B',
    gradient: ['#064E3B', '#047857', '#10B981'],
    accent: '#34D399',
    accentLight: '#D1FAE5',
    badgeText: '🌿 ALUMNI NETWORK',
    cardBorder: 'rgba(52, 211, 153, 0.4)'
  },
  {
    id: 'obsidian',
    name: 'Midnight Dark',
    bg: '#090D16',
    gradient: ['#090D16', '#1E293B', '#334155'],
    accent: '#60A5FA',
    accentLight: '#DBEAFE',
    badgeText: '🎓 OFFICIAL MEMBER',
    cardBorder: 'rgba(96, 165, 250, 0.3)'
  },
  {
    id: 'cyber',
    name: 'Cyber Violet',
    bg: '#4C1D95',
    gradient: ['#4C1D95', '#7C3AED', '#A855F7'],
    accent: '#E879F9',
    accentLight: '#F3E8FF',
    badgeText: '🚀 RV TECH ALUM',
    cardBorder: 'rgba(232, 121, 249, 0.4)'
  }
];

export default function InstagramProfileShareModal({
  visible,
  onClose,
  user = {}
}) {
  const [themeIndex, setThemeIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!visible) return null;

  const currentTheme = CARD_THEMES[themeIndex % CARD_THEMES.length];

  // Derived user details
  const name = user.name || user.fullName || 'Alumni Member';
  const rawUsername = user.username || (user.email ? user.email.split('@')[0] : (name ? name.toLowerCase().replace(/\s+/g, '_') : 'alumni'));
  const username = rawUsername.startsWith('@') ? rawUsername : `@${rawUsername}`;
  const cleanHandle = username.replace(/^@/, '');
  const institution = user.institution || 'RV College of Engineering';
  const branch = user.branch || user.department || '';
  const batch = user.batch || user.batchYear ? `Class of ${user.batch || user.batchYear}` : '';
  const rawRole = user.title || user.designation || user.role || '';
  const isNumericRole = /^\d+$/.test(String(rawRole).trim());
  const role = isNumericRole || rawRole === 'Alumni Member' || rawRole === 'Alumni' || rawRole === 'User' ? '' : rawRole;
  const bio = user.bio || '';
  
  // Avatar
  const avatarUrl = user.avatar_url || user.profilePicture || user.avatar;
  const isImageAvatar = avatarUrl && typeof avatarUrl === 'string' && (avatarUrl.startsWith('http') || avatarUrl.startsWith('file:') || avatarUrl.startsWith('/api'));

  // Web public profile URL
  const profileUrl = `https://almafrontend-eight.vercel.app/profile/${cleanHandle}`;

  // Formatted WhatsApp message exactly like Instagram profile share
  const generateShareMessage = () => {
    return (
      `🎓 *${name}* on RVCE Alumni Network\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 Handle: ${username}\n` +
      `🏛️ Institution: ${institution}\n` +
      (branch ? `📚 Department: ${branch}\n` : '') +
      (batch ? `🎓 ${batch}\n` : '') +
      (role && role !== 'Alumni Member' ? `💼 Current Role: ${role}\n` : '') +
      (bio ? `\n💬 "${bio.length > 120 ? bio.substring(0, 117) + '...' : bio}"\n` : '') +
      `\n🔗 *Connect & View Profile:*\n${profileUrl}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `_RV Educational Institutions Alumni Community_`
    );
  };

  // 1-Tap Share to WhatsApp
  const handleShareToWhatsApp = async () => {
    const text = generateShareMessage();
    const encoded = encodeURIComponent(text);
    const whatsappAppUrl = `whatsapp://send?text=${encoded}`;
    const whatsappWebUrl = `https://api.whatsapp.com/send?text=${encoded}`;

    try {
      if (Platform.OS === 'web') {
        window.open(whatsappWebUrl, '_blank');
        return;
      }
      const canOpen = await Linking.canOpenURL(whatsappAppUrl);
      if (canOpen) {
        await Linking.openURL(whatsappAppUrl);
      } else {
        await Linking.openURL(whatsappWebUrl);
      }
    } catch (_err) {
      try {
        await Linking.openURL(whatsappWebUrl);
      } catch (_e2) {
        // Final fallback to system share
        await Share.share({
          title: `${name}'s Alumni Profile`,
          message: text,
          url: profileUrl
        });
      }
    }
  };

  // WhatsApp Status Sharing
  const handleShareToWhatsAppStatus = async () => {
    const statusText = `Connect with me on the RV Alumni Network! 🎓\n${profileUrl}`;
    const encoded = encodeURIComponent(statusText);
    const url = `whatsapp://send?text=${encoded}`;
    try {
      if (Platform.OS === 'web') {
        window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
      } else {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          await Linking.openURL(`https://api.whatsapp.com/send?text=${encoded}`);
        }
      }
    } catch (_e) {
      handleShareToWhatsApp();
    }
  };

  // Copy Profile Link
  const handleCopyLink = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(profileUrl);
      } else {
        // Native fallback
        await Share.share({
          title: `${name}'s Profile Link`,
          message: profileUrl
        });
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch (_err) {
      Alert.alert('Profile Link', profileUrl);
    }
  };

  // Native System Share Sheet (Instagram DMs, Telegram, LinkedIn, SMS, Twitter, etc.)
  const handleNativeShare = async () => {
    const text = generateShareMessage();
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `${name} | RVCE Alumni Profile`,
          text: text,
          url: profileUrl
        });
      } else {
        await Share.share({
          title: `${name} | RVCE Alumni Profile`,
          message: text,
          url: profileUrl
        });
      }
    } catch (_err) {
      // User dismissed share sheet or aborted
    }
  };

  // Cycle card theme (just like Instagram's card theme toggle)
  const cycleTheme = () => {
    setThemeIndex(prev => (prev + 1) % CARD_THEMES.length);
  };

  // Fast QR code generation URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(profileUrl)}&bgcolor=ffffff&color=002144&margin=4`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={onClose} style={styles.iconCircleButton} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Share Profile</Text>
              <Text style={styles.headerSubtitle}>Tap card to change color</Text>
            </View>

            <TouchableOpacity onPress={cycleTheme} style={styles.iconCircleButton} activeOpacity={0.7}>
              <Ionicons name="color-palette-outline" size={20} color="#F59E0B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ─── Instagram-Style Profile Card ─── */}
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={cycleTheme}
              style={[
                styles.profileCard,
                {
                  backgroundColor: currentTheme.bg,
                  borderColor: currentTheme.cardBorder
                }
              ]}
            >
              {/* Institution / Verified Banner */}
              <View style={styles.cardTopBadge}>
                <View style={[styles.badgePill, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                  <Text style={styles.badgePillText}>{currentTheme.badgeText}</Text>
                </View>
                <Ionicons name="sparkles" size={16} color={currentTheme.accent} />
              </View>

              {/* QR Code Container with Central Avatar Accent */}
              <View style={styles.qrWrapper}>
                <Image
                  source={{ uri: qrCodeUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
                <View style={styles.qrCenterLogo}>
                  {isImageAvatar ? (
                    <Image
                      source={{ uri: getImageUrl(avatarUrl) }}
                      style={styles.qrCenterAvatar}
                    />
                  ) : (
                    <View style={styles.qrCenterFallback}>
                      <Text style={styles.qrCenterText}>{getInitials(name, 'AL')}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* User Identity Info */}
              <View style={styles.cardIdentity}>
                <View style={styles.nameRow}>
                  <Text style={styles.cardName} numberOfLines={1}>{name}</Text>
                  <Ionicons name="checkmark-circle" size={18} color="#38BDF8" style={{ marginLeft: 6 }} />
                </View>

                <Text style={[styles.cardHandle, { color: currentTheme.accent }]}>
                  {username}
                </Text>

                <View style={styles.dividerLine} />

                {/* College & Department Details */}
                <View style={styles.institutionRow}>
                  <Ionicons name="school" size={14} color="#CBD5E1" style={{ marginRight: 6 }} />
                  <Text style={styles.cardInstitution} numberOfLines={1}>
                    {institution}
                  </Text>
                </View>

                {(branch || batch) ? (
                  <Text style={styles.cardBranch} numberOfLines={1}>
                    {branch}{branch && batch ? ' • ' : ''}{batch}
                  </Text>
                ) : null}

                {role && role !== 'Alumni Member' ? (
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText} numberOfLines={1}>💼 {role}</Text>
                  </View>
                ) : null}
              </View>

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>
                  Scan with camera to connect on Alumni Network
                </Text>
              </View>
            </TouchableOpacity>

            {/* ─── Modern Instagram-Style Share Actions ─── */}
            <View style={styles.actionsContainer}>
              {/* Primary Dual Action Buttons Row: WhatsApp + Copy Link */}
              <View style={styles.primaryActionRow}>
                {/* 1. Share to WhatsApp */}
                <TouchableOpacity
                  style={styles.whatsappPrimaryBtn}
                  onPress={handleShareToWhatsApp}
                  activeOpacity={0.82}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.whatsappBtnTitle}>WhatsApp</Text>
                </TouchableOpacity>

                {/* 2. Copy Link */}
                <TouchableOpacity
                  style={[styles.copyLinkBtn, copied && styles.copyLinkBtnActive]}
                  onPress={handleCopyLink}
                  activeOpacity={0.82}
                >
                  <Ionicons
                    name={copied ? 'checkmark-circle' : 'copy-outline'}
                    size={19}
                    color={copied ? '#10B981' : '#FFFFFF'}
                    style={{ marginRight: 7 }}
                  />
                  <Text style={[styles.copyLinkBtnText, copied && { color: '#10B981' }]}>
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Secondary Quick Action Row: Status, Other Apps, Cycle Color */}
              <View style={styles.secondaryActionsRow}>
                {/* WhatsApp Status */}
                <TouchableOpacity
                  style={styles.quickActionTile}
                  onPress={handleShareToWhatsAppStatus}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickActionIconCircle, { backgroundColor: 'rgba(18, 140, 126, 0.22)', borderColor: 'rgba(18, 140, 126, 0.4)' }]}>
                    <Ionicons name="radio-outline" size={20} color="#25D366" />
                  </View>
                  <Text style={styles.quickActionLabel}>My Status</Text>
                </TouchableOpacity>

                {/* More / System Share */}
                <TouchableOpacity
                  style={styles.quickActionTile}
                  onPress={handleNativeShare}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickActionIconCircle, { backgroundColor: 'rgba(100, 116, 139, 0.22)', borderColor: 'rgba(148, 163, 184, 0.3)' }]}>
                    <Ionicons name="share-social-outline" size={20} color="#F8FAFC" />
                  </View>
                  <Text style={styles.quickActionLabel}>Other Apps</Text>
                </TouchableOpacity>

                {/* Theme Palette */}
                <TouchableOpacity
                  style={styles.quickActionTile}
                  onPress={cycleTheme}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickActionIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
                    <Ionicons name="color-palette-outline" size={20} color="#F59E0B" />
                  </View>
                  <Text style={styles.quickActionLabel}>Change Color</Text>
                </TouchableOpacity>
              </View>

              {/* Theme Dots Picker */}
              <View style={styles.themeSelectorContainer}>
                <Text style={styles.themeSelectorLabel}>Card Theme:</Text>
                <View style={styles.themeDotsList}>
                  {CARD_THEMES.map((th, idx) => (
                    <TouchableOpacity
                      key={th.id}
                      onPress={() => setThemeIndex(idx)}
                      style={[
                        styles.themeDot,
                        { backgroundColor: th.bg },
                        themeIndex % CARD_THEMES.length === idx && [styles.themeDotActive, { borderColor: th.accent }]
                      ]}
                      activeOpacity={0.7}
                    />
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 20, 0.88)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.92,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)'
  },
  headerTitleContainer: {
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2
  },
  iconCircleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center'
  },

  // ── Instagram Card Styling ──
  profileCard: {
    width: Math.min(SCREEN_WIDTH - 40, 360),
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20
  },
  cardTopBadge: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6
  },
  qrWrapper: {
    width: 170,
    height: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    position: 'relative'
  },
  qrImage: {
    width: '100%',
    height: '100%'
  },
  qrCenterLogo: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#002144',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  qrCenterAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20
  },
  qrCenterFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#002144'
  },
  qrCenterText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13
  },
  cardIdentity: {
    width: '100%',
    alignItems: 'center',
    marginTop: 14
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textAlign: 'center'
  },
  cardHandle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.2
  },
  dividerLine: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: 10
  },
  institutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardInstitution: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    textAlign: 'center'
  },
  cardBranch: {
    fontSize: 12,
    fontWeight: '500',
    color: '#CBD5E1',
    marginTop: 3,
    textAlign: 'center'
  },
  roleBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10
  },
  roleText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#F8FAFC'
  },
  cardFooter: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%'
  },
  cardFooterText: {
    fontSize: 10.5,
    color: '#94A3B8',
    textAlign: 'center'
  },

  // ── Share Actions ──
  actionsContainer: {
    width: Math.min(SCREEN_WIDTH - 40, 350),
    marginTop: 4,
  },
  primaryActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  whatsappPrimaryBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#25D366',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  whatsappBtnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  copyLinkBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyLinkBtnActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  copyLinkBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  quickActionTile: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  quickActionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#CBD5E1',
    letterSpacing: 0.1,
  },
  themeSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignSelf: 'center',
  },
  themeSelectorLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginRight: 12,
    fontWeight: '600',
  },
  themeDotsList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  themeDotActive: {
    borderWidth: 2.5,
    transform: [{ scale: 1.25 }],
  }
});
