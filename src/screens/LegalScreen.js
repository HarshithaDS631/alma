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

export default function LegalScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const initialTab = route?.params?.tab || (route?.name === 'PrivacyPolicy' ? 'privacy' : 'terms');
  const [activeTab, setActiveTab] = useState(initialTab);

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
      <Text style={[styles.subHeading, { color: isDarkMode ? '#38BDF8' : '#003366' }]}>{title}</Text>
      {content ? <Text style={[styles.paragraph, { color: theme.textSecondary || '#475569' }]}>{content}</Text> : null}
    </View>
  );

  const renderBullet = (items) => items.map((item, i) => (
    <Text key={i} style={[styles.bullet, { color: theme.textSecondary || '#475569' }]}>• {item}</Text>
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
            style={[styles.tabItem, activeTab === tab.id && { borderBottomColor: isDarkMode ? '#38BDF8' : '#003366', borderBottomWidth: 2.5 }]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons name={tab.icon} size={16} color={activeTab === tab.id ? (isDarkMode ? '#38BDF8' : '#003366') : (theme.textMuted || '#94A3B8')} />
            <Text style={[styles.tabText, { color: activeTab === tab.id ? (isDarkMode ? '#38BDF8' : '#003366') : (theme.textMuted || '#94A3B8'), fontWeight: activeTab === tab.id ? '700' : '500' }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

        {/* ─── TERMS OF SERVICE (19 Institutional Sections) ─── */}
        {activeTab === 'terms' && (
          <View>
            <View style={styles.docHeader}>
              <Ionicons name="document-text" size={34} color={isDarkMode ? '#38BDF8' : '#003366'} />
              <View style={styles.docHeaderText}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Terms of Service</Text>
                <Text style={[styles.effectiveDate, { color: theme.textMuted }]}>
                  Effective Date: 7 August 2026 • RV Educational Institutions
                </Text>
              </View>
            </View>

            {/* Summary Highlights Card */}
            <View style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#E2E8F0', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 6 }}>🏛️ Institutional Agreement</Text>
              <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 19 }}>
                These Terms of Service govern your access to and use of the Alumni Network mobile application and web portal operated by RV Educational Institutions. Please review our terms and privacy practices carefully before using the platform.
              </Text>
            </View>

            {renderSection('1. Introduction', 'Welcome to the Alumni Network platform ("Platform" or "Service"), operated and managed by RV Educational Institutions ("Institution", "we", "us", or "our"). The Alumni Network is a dedicated alumni engagement, professional networking, and career mentorship platform created for students, alumni, faculty, institution administrators, and authorized institutional partners.')}
            
            {renderSection('2. Acceptance of Terms', 'By creating an account, clicking "Sign In", "Sign Up", or accessing any part of the Platform, you express your full and unconditional acceptance of these Terms of Service and our Privacy Policy. If you do not agree to these Terms, you must not access or use the Platform.')}

            {renderSection('3. Eligibility', 'To access and use the Alumni Network, you represent and warrant that (a) you are a current student, alumnus/alumna, faculty member, administrator, or authorized representative of RV Educational Institutions; (b) you are at least thirteen (13) years of age; (c) your account has not been previously suspended or terminated for violations of institutional policies; and (d) your use complies with all applicable laws in India.')}

            {renderSection('4. Account Registration and Account Security', 'Users must provide accurate, current, and verifiable information during registration. All accounts require institutional email verification and administrator approval. You must not impersonate any person or create fraudulent profiles. You are solely responsible for maintaining the confidentiality of your credentials and OTP tokens, and for all activities occurring under your account.')}

            {renderSection('5. User Profile and Information', 'Users may maintain profile details including biography, work history, skills, portfolios, resumes (PDF format), and external links. You are responsible for ensuring all educational qualifications and work history listed on your profile are genuine and accurate.')}

            {renderSection('6. Alumni Networking and Communication', 'Communication features (direct messaging, discussions, and mentorship matchmaking) are provided exclusively for educational, career advancement, and community networking. Users must maintain professional courtesy and respect. Harvesting, scraping, or misusing other members\' contact details for unauthorized commercial solicitations or spam is strictly prohibited.')}

            {renderSection('7. Job Opportunities and Job Recommendations', 'Job listings and recruitment notices may be posted by alumni, administrators, employers, or authorized partners. RV Educational Institutions does not operate as an employment agency and does not guarantee employment outcomes, job availability, or the accuracy of third-party postings. Job descriptions and recruiter identities should be independently verified by users before sharing confidential documents. Keyword-based job recommendations are algorithmic aids and do not constitute institutional endorsements.')}

            {renderSection('8. User-Generated Content', 'You retain ownership of any text, images, articles, comments, or media you publish on the Platform. By submitting content, you grant RV Educational Institutions a royalty-free, worldwide license to host, display, and distribute such content strictly for operating the alumni portal. You are solely responsible for ensuring your content does not violate third-party intellectual property or privacy rights.')}

            {renderSection('9. Acceptable Use and Prohibited Activities', '')}
            {renderBullet([
              'Posting unlawful, abusive, harassing, defamatory, obscene, or hateful content.',
              'Engaging in cyberbullying, stalking, or unauthorized surveillance.',
              'Uploading files containing malware, viruses, worms, or disruptive code.',
              'Distributing spam, pyramid schemes, or unsolicited commercial advertisements.',
              'Attempting unauthorized access to servers, user databases, or security layers.',
              'Scraping, crawling, decompiling, or data-mining platform databases without permission.',
            ])}

            {renderSection('10. Intellectual Property Rights', 'The Platform design, trademarks, logos, database architecture, and educational branding are the exclusive intellectual property of RV Educational Institutions. Users are granted a limited, revocable, non-exclusive license for personal, non-commercial institutional networking.')}

            {renderSection('11. Privacy and Personal Data', 'Your privacy is paramount. Data collection, usage, encryption, retention, and deletion practices are governed by our Privacy Policy (/privacy-policy) in full compliance with the Digital Personal Data Protection Act (DPDPA), 2023.')}
            
            <TouchableOpacity 
              style={[styles.linkButton, { borderColor: isDarkMode ? '#38BDF8' : '#003366', marginVertical: 12 }]} 
              onPress={() => setActiveTab('privacy')}
            >
              <Ionicons name="shield-checkmark-outline" size={16} color={isDarkMode ? '#38BDF8' : '#003366'} />
              <Text style={[styles.linkButtonText, { color: isDarkMode ? '#38BDF8' : '#003366' }]}>Read Full Privacy Policy (/privacy-policy)</Text>
            </TouchableOpacity>

            {renderSection('12. Third-Party Services and External Links', 'The Platform may integrate third-party services such as Google Sign-In, Apple Sign-In, Firebase, SendGrid, and external job sites. These third-party services operate under their own independent terms and privacy policies.')}

            {renderSection('13. Notifications and Communications', 'By registering, you consent to receive administrative notices, account security alerts, and multi-factor authentication OTP codes via email, SMS, push notifications, or WhatsApp.')}

            {renderSection('14. Disclaimer of Warranties', 'THE PLATFORM AND SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. RV EDUCATIONAL INSTITUTIONS EXPRESSLY DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.')}

            {renderSection('15. Limitation of Liability', 'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL RV EDUCATIONAL INSTITUTIONS, ITS TRUSTEES, OFFICERS, DIRECTORS, OR EMPLOYEES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES ARISING OUT OF YOUR USE OF THE PLATFORM.')}

            {renderSection('16. Account Suspension and Termination', 'RV Educational Institutions reserves the right to suspend or terminate accounts that violate these Terms or institutional codes of conduct. Users may request account deletion at any time via Settings > Account Center or by contacting support.')}

            {renderSection('17. Changes to the Terms', 'We may revise these Terms from time to time. When changes are made, the Effective Date will be updated. Continued use of the Platform after the effective date constitutes your agreement to the modified Terms.')}

            {renderSection('18. Governing Law and Jurisdiction', 'These Terms shall be governed by and construed in accordance with the laws of India. The appropriate courts in Bengaluru, Karnataka, India shall have exclusive jurisdiction over any dispute arising hereunder.')}

            {renderSection('19. Contact Information', '')}
            <View style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>RV Educational Institutions</Text>
              <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>Alumni Network Administration & Legal Cell</Text>
              <Text style={{ fontSize: 13, color: isDarkMode ? '#38BDF8' : '#003366', fontWeight: '600', marginTop: 4 }}>Email: rvmediadevelopers@gmail.com</Text>
              <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>Location: Bengaluru, Karnataka, India</Text>
            </View>

            <TouchableOpacity style={[styles.linkButton, { borderColor: isDarkMode ? '#38BDF8' : '#003366' }]} onPress={() => openURL(TERMS_URL)}>
              <Ionicons name="open-outline" size={16} color={isDarkMode ? '#38BDF8' : '#003366'} />
              <Text style={[styles.linkButtonText, { color: isDarkMode ? '#38BDF8' : '#003366' }]}>View Terms Repository on GitHub</Text>
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
                <Text style={[styles.effectiveDate, { color: theme.subtext }]}>Effective Date: 7 August 2026 • Last Updated: 3 September 2026</Text>
              </View>
            </View>

            {/* Privacy at a Glance Banner */}
            <View style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: '#00214430', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 6 }}>🌟 Privacy at a Glance</Text>
              <Text style={{ fontSize: 13, color: theme.subtext, lineHeight: 18 }}>
                We believe privacy is a fundamental right. We never sell your personal data to advertisers. We collect only what is necessary to connect alumni, faculty, and students with career opportunities and institutional initiatives.
              </Text>
            </View>

            {renderSection('1. Information You Choose to Give Us', '')}
            {renderBullet([
              'Registration Data: Name, email address, password, institution, branch/department, and graduation batch year.',
              'Profile & Career Info: Organization, job title, industry domain, experience, skills, bio, LinkedIn URL, and profile photo.',
              'Documents: Resume PDF files uploaded for recruiter discovery and job applications.',
              'Communications: Direct chat messages, feed posts, comments, event signups, and support queries.',
            ])}

            {renderSection('2. Information We Get When You Use the App', '')}
            {renderBullet([
              'Usage & Activity: Pages visited (Directory, Jobs, Feed), features accessed, and interaction timestamps.',
              'Device & Technical: Device model, operating system version, browser type, and IP address.',
              'Push Tokens: Firebase Cloud Messaging (FCM) device tokens used to send message and job notifications.',
              'Session Data: Secure local authentication tokens to keep you logged in.',
            ])}

            {renderSection('3. Information from Third Parties', '')}
            {renderBullet([
              'Social Sign-In: When authenticating via Google, Apple, or LinkedIn OAuth, we receive your name, verified email, and profile picture directly from the provider. We never receive your third-party password.',
            ])}

            {renderSection('4. How We Use Your Information', '')}
            {renderBullet([
              'Provide core alumni networking, messaging, mentorship, and directory discovery.',
              'Match alumni with job vacancies, internship opportunities, and institutional programs.',
              'Authenticate identity, prevent fraud, and verify alumni credentials via Institution Administrators.',
              'Deliver transactional notifications, OTP codes, and critical security alerts.',
              'Generate aggregated, anonymized insights to help RV institutions improve academic curricula.',
            ])}

            {renderSection('5. How We Share Information', '')}
            {renderBullet([
              'With Verified Alumni: Name, batch, and headline are visible to authenticated peers in the directory.',
              'With Administrators: Designated institution admins review registrations and moderate content.',
              'With Trusted Infrastructure: MongoDB Atlas (encrypted database), Firebase (auth/push), SendGrid (emails), and Vercel (hosting).',
              'Legal Compliance: Disclosed only if mandated by court order or statutory requirements.',
            ])}

            {renderSection('6. Data Retention & Deletion', '')}
            {renderBullet([
              'Active Profiles: Maintained while your account remains active.',
              'Security & Activity Logs: Retained for up to 12 months.',
              'Account Deletion: Upon requesting deletion, all personal data is permanently purged within 30 days.',
              'Encrypted Backups: Fully overwritten and removed within 90 days.',
            ])}

            {renderSection('7. Your Controls & Data Rights', '')}
            {renderBullet([
              'Access & Edit: Update profile and career information anytime in Profile settings.',
              'Data Export: Request a machine-readable export of your data via rvmediadevelopers@gmail.com.',
              'Delete Account: Permanently delete your account under the Data Rights tab or by written request.',
              'Notifications: Toggle push and email notification preferences at any time.',
            ])}

            {renderSection('8. Security & Encryption', 'All communication is encrypted via HTTPS/TLS 1.3. Passwords are salted and hashed with bcrypt. Databases are encrypted at rest with AES-256.')}

            {renderSection('9. Regulatory Compliance', 'Fully compliant with the India Digital Personal Data Protection Act (DPDPA 2023) and GDPR principles.')}

            {renderSection('10. Contact Us & Grievance Redressal', 'For any privacy concerns or data requests, contact our Privacy Officer at rvmediadevelopers@gmail.com (RV Educational Institutions, Bengaluru, Karnataka, India).')}

            <TouchableOpacity style={[styles.linkButton, { borderColor: '#002144', marginTop: 16 }]} onPress={() => openURL(PRIVACY_URL)}>
              <Ionicons name="open-outline" size={16} color="#002144" />
              <Text style={[styles.linkButtonText, { color: '#002144' }]}>View Full Markdown Policy on GitHub</Text>
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
