import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Share,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export default function EventPassModal({ visible, onClose, passData, event }) {
  const { theme, isDarkMode } = useTheme();

  if (!visible) return null;

  const eventTitle = passData?.eventTitle || event?.title || 'Alumni Summit & Reunion';
  const eventDate = passData?.eventDate || event?.date || event?.time || 'Upcoming';
  const eventLocation = passData?.eventLocation || event?.location || 'RVCE Campus / Hybrid';
  const attendeeName = passData?.attendeeName || 'Alumni Member';
  const attendeeDept = passData?.attendeeDept || 'Engineering & Technology';
  const attendeeBatch = passData?.attendeeBatch || 'Class of RVCE';
  const passToken = passData?.passToken || 'RV-PASS-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  const qrCodeUri = passData?.qrCode;
  const isCheckedIn = !!passData?.checkedIn;

  const handleShare = async () => {
    try {
      const shareMessage = `🎟️ My Digital Event Pass for ${eventTitle}\n📅 Date: ${eventDate}\n📍 Venue: ${eventLocation}\nAttendee: ${attendeeName}\nPass Token: ${passToken}`;
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ title: eventTitle, text: shareMessage });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareMessage);
          window.alert('Event Pass details copied to clipboard!');
        }
      } else {
        await Share.share({ message: shareMessage, title: eventTitle });
      }
    } catch (err) {
      console.log('Share error:', err.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.cardContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
          
          {/* Header Bar */}
          <View style={styles.topHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.badgeIcon}>
                <Ionicons name="qr-code" size={16} color="#059669" />
              </View>
              <Text style={[styles.headerTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                Digital Event Pass
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close-circle" size={26} color={isDarkMode ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Boarding Pass Hero */}
            <View style={styles.boardingPassHero}>
              <View style={styles.institutionRow}>
                <View style={styles.crestCircle}>
                  <Text style={styles.crestText}>RV</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.institutionName}>RV COLLEGE OF ENGINEERING</Text>
                  <Text style={styles.passSubtype}>OFFICIAL ALUMNI CONVERGENCE PASS</Text>
                </View>
                <View style={[styles.verifiedPill, isCheckedIn && { backgroundColor: '#10B981' }]}>
                  <Ionicons name={isCheckedIn ? "checkmark-done" : "shield-checkmark"} size={12} color="#FFFFFF" />
                  <Text style={styles.verifiedText}>{isCheckedIn ? 'ADMITTED' : 'VERIFIED'}</Text>
                </View>
              </View>

              <Text style={styles.heroEventTitle} numberOfLines={2}>{eventTitle}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>DATE & TIME</Text>
                  <Text style={styles.metaVal} numberOfLines={1}>{eventDate}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>VENUE / GATE</Text>
                  <Text style={styles.metaVal} numberOfLines={1}>{eventLocation}</Text>
                </View>
              </View>
            </View>

            {/* Perforated Divider */}
            <View style={styles.perforatedContainer}>
              <View style={[styles.notch, styles.notchLeft, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]} />
              <View style={styles.dashedLine} />
              <View style={[styles.notch, styles.notchRight, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]} />
            </View>

            {/* QR Stub Section */}
            <View style={[styles.qrSection, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}>
              <View style={styles.attendeeRow}>
                <View>
                  <Text style={styles.metaLabel}>ATTENDEE</Text>
                  <Text style={[styles.attendeeNameText, { color: isDarkMode ? '#F1F5F9' : '#0F172A' }]}>
                    {attendeeName}
                  </Text>
                  <Text style={styles.attendeeSubText}>{attendeeDept} • {attendeeBatch}</Text>
                </View>
                <View style={styles.entryTypePod}>
                  <Text style={styles.entryTypeText}>VIP GUEST</Text>
                </View>
              </View>

              {/* QR Image Box */}
              <View style={styles.qrImageWrapper}>
                {qrCodeUri ? (
                  <Image source={{ uri: qrCodeUri }} style={styles.qrImage} resizeMode="contain" />
                ) : (
                  <View style={styles.mockQrPlaceholder}>
                    <Ionicons name="qr-code-outline" size={140} color="#059669" />
                  </View>
                )}
              </View>

              {/* Security Token Barcode Text */}
              <View style={styles.tokenContainer}>
                <Text style={styles.tokenLabel}>SECURITY PASS TOKEN</Text>
                <Text style={styles.tokenCode}>{passToken}</Text>
                <Text style={styles.scanInstruction}>
                  Present this QR at the venue entrance gate for contactless check-in
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.shareBtn, { borderColor: isDarkMode ? '#334155' : '#CBD5E1' }]}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social-outline" size={18} color={isDarkMode ? '#E2E8F0' : '#334155'} />
                <Text style={[styles.shareBtnText, { color: isDarkMode ? '#E2E8F0' : '#334155' }]}>Share Pass</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  cardContainer: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)'
  },
  badgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  scrollContent: {
    padding: 18
  },
  boardingPassHero: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0
  },
  institutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14
  },
  crestCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center'
  },
  crestText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13
  },
  institutionName: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6
  },
  passSubtype: {
    color: '#34D399',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  heroEventTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
    marginBottom: 16
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 12,
    gap: 10
  },
  metaCol: {
    flex: 1
  },
  metaLabel: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2
  },
  metaVal: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600'
  },
  perforatedContainer: {
    height: 20,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative'
  },
  notch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    top: 0
  },
  notchLeft: {
    left: -10
  },
  notchRight: {
    right: -10
  },
  dashedLine: {
    flex: 1,
    marginHorizontal: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  qrSection: {
    borderRadius: 18,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    borderTopWidth: 0
  },
  attendeeRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  attendeeNameText: {
    fontSize: 15,
    fontWeight: '800'
  },
  attendeeSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  entryTypePod: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  entryTypeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  qrImageWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 14
  },
  qrImage: {
    width: 180,
    height: 180
  },
  mockQrPlaceholder: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tokenContainer: {
    alignItems: 'center',
    width: '100%'
  },
  tokenLabel: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 3
  },
  tokenCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#059669',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8
  },
  scanInstruction: {
    fontSize: 10.5,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 14
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '700'
  },
  doneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#059669',
    gap: 6
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  }
});

