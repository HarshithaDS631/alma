import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const PRIVACY_URL = 'https://github.com/HarshithaDS631/alma/blob/main/PRIVACY_POLICY.md';
const TERMS_URL = 'https://github.com/HarshithaDS631/alma/blob/main/TERMS_AND_CONDITIONS.md';
const GUIDELINES_URL = 'https://github.com/HarshithaDS631/alma/blob/main/COMMUNITY_GUIDELINES.md';

const TABS = [
  { id: 'terms', label: 'Terms', icon: 'document-text-outline' },
  { id: 'privacy', label: 'Privacy', icon: 'shield-checkmark-outline' },
  { id: 'community', label: 'Guidelines', icon: 'people-outline' },
  { id: 'cookies', label: 'Cookies', icon: 'globe-outline' },
  { id: 'retention', label: 'Data Rights', icon: 'trash-outline' },
];

export default function LegalScreen({ navigation }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('terms');

  const openURL = (url) => Linking.openURL(url).catch(() => {});

  const handleDeleteAccount = () => {
    Alert.alert(
      'Request Account Deletion',
      'Are you sure you want to permanently delete your Alumni Network account and all associated data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Deletion',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Deletion Request Submitted',
              'Your account deletion request has been submitted. All personal data will be permanently removed within 30 days in compliance with our Data Retention Policy.'
            );
          }
        }
      ]
    );
  };

  const renderSection = (title, content) => (
    <View style={styles.section} key={title}>
      <Text style={[styles.subHeading, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.paragraph, { color: theme.subtext }]}>{content}</Text>
    </View>
  );

  const renderBullet = (items) => items.map((item, i) => (
    <Text key={i} style={[styles.bullet, { color: theme.subtext }]}>• {item}</Text>
  ));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Legal & Compliance</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabBarWrapper, { borderBottomColor: theme.border }]} contentContainerStyle={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, activeTab === tab.id && { borderBottomColor: '#002144', borderBottomWidth: 2.5 }]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons name={tab.icon} size={16} color={activeTab === tab.id ? '#002144' : theme.subtext} />
            <Text style={[styles.tabText, { color: activeTab === tab.id ? '#002144' : theme.subtext }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>

        {/* ─── TERMS ─── */}
        {activeTab === 'terms' && (
          <View>
            <View style={styles.docHeader}>
              <Ionicons name="document-text" size={32} color="#002144" />
              <View style={styles.docHeaderText}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Terms & Conditions</Text>
                <Text style={[styles.effectiveDate, { color: theme.subtext }]}>Effective Date: 7 August 2026</Text>
              </View>
            </View>

            {renderSection('1. Acceptance of Terms', 'By downloading, installing, or using Alumni Network, you agree to be legally bound by these Terms. If you do not agree, you must not use the App.')}
            {renderSection('2. Who May Use This App', 'This App is for verified alumni, students, faculty, and administrators of RV Institutions. You must be at least 13 years of age to use this App.')}
            {renderSection('3. User Account', 'You must register with a valid institutional email. Your account requires admin approval before access is granted. You are responsible for maintaining the security of your credentials.')}
            {renderSection('4. Prohibited Activities', '')}
            {renderBullet([
              'Hacking, reverse engineering, or compromising the App',
              'Impersonating other users or administrators',
              'Uploading harmful content, malware, or spam',
              'Using the App for unauthorized commercial solicitation',
            ])}
            {renderSection('5. Termination', 'We reserve the right to suspend or terminate your account at any time for violation of these Terms without prior notice.')}
            {renderSection('6. Governing Law', 'These Terms are governed by the laws of India. Disputes shall be resolved in courts of Bengaluru, Karnataka.')}

            <TouchableOpacity style={[styles.linkButton, { borderColor: '#002144' }]} onPress={() => openURL(TERMS_URL)}>
              <Ionicons name="open-outline" size={16} color="#002144" />
              <Text style={[styles.linkButtonText, { color: '#002144' }]}>View Full Terms of Service</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── PRIVACY ─── */}
        {activeTab === 'privacy' && (
          <View>
            <View style={styles.docHeader}>
              <Ionicons name="shield-checkmark" size={32} color="#002144" />
              <View style={styles.docHeaderText}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Privacy Policy</Text>
                <Text style={[styles.effectiveDate, { color: theme.subtext }]}>Effective Date: 7 August 2026</Text>
              </View>
            </View>

            {renderSection('Data We Collect', 'We collect your name, email, graduation year, employment history, profile photo, messages, posts, and device identifiers for push notifications.')}
            {renderSection('How We Use Your Data', 'To operate the App, verify identity, enable networking features, send OTP emails, push notifications, and generate anonymized analytics. We do not sell your data.')}
            {renderSection('Data Sharing', 'Data is shared only with institution administrators for approval, and third-party infrastructure services (MongoDB Atlas, Firebase, SendGrid, Vercel) necessary to operate the App.')}
            {renderSection('Data Security', 'All data is transmitted via HTTPS/TLS. Passwords are hashed using bcrypt. MongoDB Atlas provides encryption at rest. JWT authentication with refresh token rotation is enforced.')}
            {renderSection('Your Rights', 'You can access, correct, export, or delete your personal data at any time. Contact us at rvmediadevelopers@gmail.com to exercise your rights.')}

            <TouchableOpacity style={[styles.linkButton, { borderColor: '#002144' }]} onPress={() => openURL(PRIVACY_URL)}>
              <Ionicons name="open-outline" size={16} color="#002144" />
              <Text style={[styles.linkButtonText, { color: '#002144' }]}>View Full Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── COMMUNITY GUIDELINES ─── */}
        {activeTab === 'community' && (
          <View>
            <View style={styles.docHeader}>
              <Ionicons name="people" size={32} color="#002144" />
              <View style={styles.docHeaderText}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Community Guidelines</Text>
                <Text style={[styles.effectiveDate, { color: theme.subtext }]}>Effective Date: 7 August 2026</Text>
              </View>
            </View>

            {renderSection('✅ Allowed Content', '')}
            {renderBullet([
              'Career updates and professional achievements',
              'Job postings and internship listings',
              'Mentorship offers and requests',
              'Events and institutional announcements',
              'Educational discussions and academic advice',
            ])}

            {renderSection('❌ Not Allowed', '')}
            {renderBullet([
              'Spam, MLM promotions, or unsolicited commercial messages',
              'Hate speech, harassment, or personal attacks',
              'Explicit, offensive, or inappropriate content',
              'False information or impersonation',
              'Political propaganda or divisive content',
            ])}

            {renderSection('Enforcement', 'Violations may result in content removal, account warning, temporary suspension, or permanent ban. Use the Report button to flag any violation.')}

            <TouchableOpacity style={[styles.linkButton, { borderColor: '#002144' }]} onPress={() => openURL(GUIDELINES_URL)}>
              <Ionicons name="open-outline" size={16} color="#002144" />
              <Text style={[styles.linkButtonText, { color: '#002144' }]}>View Full Community Guidelines</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── COOKIES ─── */}
        {activeTab === 'cookies' && (
          <View>
            <View style={styles.docHeader}>
              <Ionicons name="globe" size={32} color="#002144" />
              <View style={styles.docHeaderText}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Cookie Policy</Text>
                <Text style={[styles.effectiveDate, { color: theme.subtext }]}>Applies to Web Application</Text>
              </View>
            </View>

            {renderSection('Essential Tokens', 'Our web application uses encrypted JWT session tokens stored in AsyncStorage to maintain your authentication state. These are essential for the App to function and cannot be disabled.')}
            {renderSection('Theme Preferences', 'Your Dark/Light mode preference is stored locally on your device to persist your display settings across sessions.')}
            {renderSection('No Tracking Cookies', 'We do not use third-party advertising cookies, tracking pixels, or analytics cookies on our web application. No cross-site tracking is performed.')}
            {renderSection('Session Expiry', 'Authentication tokens automatically expire after inactivity. Refresh tokens are rotated on each use for security. You can clear all stored tokens by logging out.')}
          </View>
        )}

        {/* ─── DATA RIGHTS ─── */}
        {activeTab === 'retention' && (
          <View>
            <View style={styles.docHeader}>
              <Ionicons name="server" size={32} color="#002144" />
              <View style={styles.docHeaderText}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Rights & Retention</Text>
                <Text style={[styles.effectiveDate, { color: theme.subtext }]}>Your Rights under Data Law</Text>
              </View>
            </View>

            {renderSection('Retention Periods', '')}
            {renderBullet([
              'Account data: Retained while account is active',
              'Activity logs: 12 months from creation',
              'Messages: Retained until deleted by users',
              'Backup data: Purged within 90 days of account deletion',
            ])}

            {renderSection('Your Rights', '')}
            {renderBullet([
              'Access: Request a copy of all your personal data',
              'Correct: Update any inaccurate information in Profile settings',
              'Export: Download your data from Profile > Export Data',
              'Delete: Request permanent account and data deletion below',
              'Withdraw consent: Stop using the App and request deletion',
            ])}

            {renderSection('Contact for Data Requests', 'Email: rvmediadevelopers@gmail.com\nResponse within 30 days as per applicable law.')}

            <View style={[styles.dangerCard, { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="warning-outline" size={22} color="#B91C1C" />
              <Text style={styles.dangerCardText}>Account deletion is permanent and irreversible. All your posts, messages, and profile data will be permanently erased within 30 days.</Text>
            </View>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Request Account Deletion</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.contactButton, { borderColor: theme.border }]} onPress={() => Linking.openURL('mailto:rvmediadevelopers@gmail.com?subject=Data%20Request%20-%20Alumni%20Network')}>
              <Ionicons name="mail-outline" size={20} color="#002144" />
              <Text style={[styles.contactButtonText, { color: '#002144' }]}>Contact Data Team</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.subtext }]}>
            © 2026 RV Educational Institutions. Alumni Network App v1.0.0
          </Text>
          <Text style={[styles.footerText, { color: theme.subtext }]}>
            rvmediadevelopers@gmail.com
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backButton: { padding: 4 },
  tabBarWrapper: { borderBottomWidth: 1, maxHeight: 52 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 6 },
  tabItem: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 12 },
  tabText: { fontSize: 13, fontWeight: '600' },
  contentContainer: { padding: 20, paddingBottom: 40 },
  docHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  docHeaderText: { flex: 1 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  effectiveDate: { fontSize: 12, marginTop: 2 },
  section: { marginTop: 16 },
  subHeading: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  paragraph: { fontSize: 14, lineHeight: 22 },
  bullet: { fontSize: 14, lineHeight: 24, paddingLeft: 4 },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    marginTop: 24,
  },
  linkButtonText: { fontSize: 14, fontWeight: '700' },
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 20,
  },
  dangerCardText: { flex: 1, fontSize: 13, color: '#7F1D1D', lineHeight: 20 },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  deleteButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 10,
  },
  contactButtonText: { fontSize: 15, fontWeight: '700' },
  footer: { marginTop: 32, alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, textAlign: 'center' },
});
