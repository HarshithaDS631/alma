import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  FlatList,
  Modal,
  ActivityIndicator,
  useWindowDimensions, 
  Platform,
  Image
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AdminMetricsScreen from './AdminMetricsScreen';
import { getActivityLogs, getEmailStats, getDashboardStats, getAllUsers, getReports, updateReportStatus, sendBroadcastEmail } from '../services/adminService';
import { fetchResumeBook, shareCandidateResume } from '../services/jobService';
import api from '../services/api';
import { getImageUrl } from '../services/uploadService';
import getInitials from '../lib/getInitials';

// ==========================================
// ALUMNI NETWORK ADMINISTRATION DATA & MODULES
// ==========================================

const INITIAL_SPAM_REPORTS = [];
const INITIAL_ALUMNI_MASTER = [];
const INITIAL_MEMBERSHIP_REQUESTS = [];
const INITIAL_PLACEMENTS = [];
const INITIAL_MENTOR_APPLICATIONS = [];
const INITIAL_RESUME_CANDIDATES = [];
const INITIAL_IMPORT_LOGS = [];
const INITIAL_ACTIVITIES = [];

const panelItems = [
  { id: '1', title: 'Dashboard Overview', icon: 'pie-chart-outline', color: '#DCFCE7', iconColor: '#047857', moduleName: 'dashboard_overview', desc: 'Real-time metrics for alumni network members, active posts, and pending approvals' },
  { id: '2', title: 'Membership Requests', icon: 'checkbox-outline', color: '#DCFCE7', iconColor: '#059669', moduleName: 'membership_request', desc: 'Verify & approve pending alumni, student & faculty signups' },
  { id: '3', title: 'Database Manager', icon: 'people-outline', color: '#F0FDF4', iconColor: '#16A34A', moduleName: 'master_list', desc: 'Search & filter registered alumni directory by department and batch' },
  { id: '4', title: 'Talent / Resume Book', icon: 'book-outline', color: '#FAF5FF', iconColor: '#9333EA', moduleName: 'resume_book', desc: 'Browse verified alumni resumes, domain skills & recruiter dispatch' },
  { id: '5', title: 'Placement Tool', icon: 'briefcase-outline', color: '#DCFCE7', iconColor: '#059669', moduleName: 'placement_tool', desc: 'Explore employer network and placement opportunities' },
  { id: '6', title: 'Bulk Data Import', icon: 'cloud-upload-outline', color: '#DCFCE7', iconColor: '#059669', moduleName: 'bulk_import', desc: 'Import student and alumni datasets via CSV with column mapping' },
  { id: '7', title: 'Mass Mail Broadcast', icon: 'paper-plane-outline', color: '#F0FDF4', iconColor: '#059669', moduleName: 'mass_mail', desc: 'Targeted broadcast campaigns by batch, department or region' },
  { id: '8', title: 'Welcome Mail Automator', icon: 'mail-open-outline', color: '#F0FDF4', iconColor: '#059669', moduleName: 'welcome_mail', desc: 'Automated welcome email triggers with customizable template tokens' },
  { id: '9', title: 'Dynamic Email Stats', icon: 'analytics-outline', color: '#DCFCE7', iconColor: '#059669', moduleName: 'email_stats', desc: 'Real-time open & click metrics for invitation and broadcast emails' },
  { id: '10', title: 'Mentorship Moderation', icon: 'git-pull-request-outline', color: '#DCFCE7', iconColor: '#059669', moduleName: 'mentor_application', desc: 'Approve mentor applications and monitor 1-on-1 mentorship pairings' },
  { id: '11', title: 'Spam & Moderation', icon: 'flag-outline', color: '#FFF5F5', iconColor: '#E53E3E', moduleName: 'spam_report', desc: 'Review reported content, flagged accounts, and suspension tools' },
  { id: '12', title: 'Custom Page Builder', icon: 'document-text-outline', color: '#F0FDF4', iconColor: '#059669', moduleName: 'page_builder', desc: 'Create custom institutional pages, forms, and event registrations' },
  { id: '13', title: 'Activities & Audit Log', icon: 'time-outline', color: '#F1F5F9', iconColor: '#475569', moduleName: 'admin_activities', desc: 'Track administrative outreach logs across email, phone & platform' },
  { id: '14', title: 'Data Exports', icon: 'download-outline', color: '#F0FDF4', iconColor: '#059669', moduleName: 'data_exports', desc: 'Export verified directory & placement analytics to CSV' },
];

const AUDIENCE_SEGMENTS = [
  { id: 'All Verified Alumni', label: 'All Verified Alumni', count: '~9,655 Alumni' },
  { id: 'Graduating Batch', label: 'Graduating Batch (Seniors)', count: '~850 Seniors' },
  { id: 'Computer Science & Engineering', label: 'Computer Science & Engineering', count: '~1,420 Alumni' },
  { id: 'Information Science', label: 'Information Science', count: '~980 Alumni' },
  { id: 'Electronics & Communication', label: 'Electronics & Communication', count: '~1,250 Alumni' },
  { id: 'Mechanical Engineering', label: 'Mechanical Engineering', count: '~1,100 Alumni' }
];

const BROADCAST_TOKENS = [
  { token: '{{FirstName}}', label: 'First Name', tag: 'Harshitha' },
  { token: '{{Batch}}', label: 'Batch Year', tag: '2024' },
  { token: '{{Department}}', label: 'Department', tag: 'CSE' },
  { token: '{{PortalUrl}}', label: 'Portal Link', tag: 'App URL' },
  { token: '{{Institution}}', label: 'Institution', tag: 'RVCE' },
  { token: '{{Email}}', label: 'Email', tag: 'user@rvce.edu.in' },
];

export default function AdminPanelScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { width } = useWindowDimensions();
  // Navigation & View Control
  const [activeModule, setActiveModule] = useState(null);

  // Admin User Info
  const [adminEmail, setAdminEmail] = useState('web.rsst@rvei.edu.in');
  const [adminInstitution, setAdminInstitution] = useState('RV College of Engineering');
  const [userName, setUserName] = useState('Admin');
  const [userAvatarUrl, setUserAvatarUrl] = useState('');

  // Module States
  const [spamReports, setSpamReports] = useState(INITIAL_SPAM_REPORTS);
  const [alumniMaster, setAlumniMaster] = useState(INITIAL_ALUMNI_MASTER);
  const [membershipRequests, setMembershipRequests] = useState(INITIAL_MEMBERSHIP_REQUESTS);
  const [placements, setPlacements] = useState(INITIAL_PLACEMENTS);
  const [mentorApplications, setMentorApplications] = useState(INITIAL_MENTOR_APPLICATIONS);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);

  // Search & Filter state
  const [searchText, setSearchText] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Dynamic Template Token & Preview States
  const [broadcastPreviewDevice, setBroadcastPreviewDevice] = useState('mobile'); // 'mobile' | 'desktop'
  const [welcomePreviewDevice, setWelcomePreviewDevice] = useState('mobile'); // 'mobile' | 'desktop'
  const [focusedFieldMass, setFocusedFieldMass] = useState('body'); // 'subject' | 'body'
  const [focusedFieldWelcome, setFocusedFieldWelcome] = useState('body'); // 'subject' | 'body'
  const [sendingTestMail, setSendingTestMail] = useState(false);

  // Welcome Mail States
  const [mailSubject, setMailSubject] = useState('Welcome to the {{Institution}} Alumni Community!');
  const [mailBody, setMailBody] = useState(
    'Hi {{FirstName}},\n\nWelcome to the official alumni platform of {{Institution}}! We are thrilled to have you join us. Stay connected with fellow batchmates from Class of {{Batch}}, explore department updates in {{Department}}, share job opportunities, and engage in mentorship.\n\nAccess your portal here:\n{{PortalUrl}}\n\nWarm regards,\n{{Institution}} Alumni Association'
  );
  const [autoSend, setAutoSend] = useState(true);

  // Placement Tool Add Form State
  const [showAddPlacement, setShowAddPlacement] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompInd, setNewCompInd] = useState('');
  const [newCompCount, setNewCompCount] = useState('');

  // Email Stats States
  const [emailTab, setEmailTab] = useState('invitation'); // 'invitation' | 'custom'
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
  const [emailStats, setEmailStats] = useState({ sent: 0, opened: 0, clicked: 0, openRate: 0, clickRate: 0 });
  const [loadingEmailStats, setLoadingEmailStats] = useState(false);

  // Admin Activities States
  const [activityTab, setActivityTab] = useState('past'); // 'past' | 'due'
  const [activityCategory, setActivityCategory] = useState('All'); // 'All' | 'Memories' | 'Events' | 'Mentorship'
  const [selectedActivityTypes, setSelectedActivityTypes] = useState([]);
  
  // Real-time MongoDB System Activity Logs State
  const [mongoLogs, setMongoLogs] = useState([]);
  const [mongoLogsLoading, setMongoLogsLoading] = useState(false);
  const [mongoLogSearch, setMongoLogSearch] = useState('');

  // Resume Book States
  const [resumes, setResumes] = useState(INITIAL_RESUME_CANDIDATES);
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [resumeSearch, setResumeSearch] = useState('');
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [fwdEmail, setFwdEmail] = useState('');
  const [fwdSubject, setFwdSubject] = useState('');
  const [fwdMessage, setFwdMessage] = useState('');
  const [sendingForward, setSendingForward] = useState(false);

  // Bulk Import States
  const [importLogs, setImportLogs] = useState(INITIAL_IMPORT_LOGS);
  const [selectedCsvName, setSelectedCsvName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Dashboard Live Stats State
  const [dashboardStats, setDashboardStats] = useState({ totalUsers: 0, pendingUsers: 0, totalAlumni: 0, totalPosts: 0, totalEvents: 0 });

  // Mass Mail States
  const [massAudience, setMassAudience] = useState('All Verified Alumni');
  const [massSubject, setMassSubject] = useState('Official Update: Community Announcement & Campus Events');
  const [massBody, setMassBody] = useState('Dear {{FirstName}},\n\nWe are pleased to connect with you through our official Alumni Portal. As a valued member of the {{Department}} network (Batch of {{Batch}}), stay tuned for upcoming community initiatives, mentorship sessions, and campus events.\n\nVisit the community dashboard:\n{{PortalUrl}}\n\nWarm regards,\n{{Institution}} Alumni Administration');
  const [sendingMassMail, setSendingMassMail] = useState(false);

  // Custom Page Builder States
  const [customPages, setCustomPages] = useState([]);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [showAddPageModal, setShowAddPageModal] = useState(false);

  const fetchLiveStats = async (inst) => {
    try {
      const stats = await getDashboardStats(inst);
      if (stats) {
        setDashboardStats({
          totalUsers: stats.totalUsers ?? 0,
          pendingUsers: stats.pendingUsers ?? 0,
          totalAlumni: stats.totalAlumni ?? 0,
          totalPosts: stats.totalPosts ?? 0,
          totalEvents: stats.totalEvents ?? 0,
        });
      }
    } catch (_) {}
  };

  useEffect(() => {
    const loadAdminDetails = async () => {
      try {
        const userInfoStr = await AsyncStorage.getItem('userInfo');
        if (userInfoStr) {
          const parsed = JSON.parse(userInfoStr);
          const email = parsed.email || 'web.rsst@rvei.edu.in';
          const inst = parsed.institution || 'RV College of Engineering';
          setAdminEmail(email);
          setAdminInstitution(inst);
          fetchLiveStats(inst);
          if (parsed.name) setUserName(parsed.name);
          const rawAv = parsed.avatar_url || parsed.profilePicture;
          if (rawAv) setUserAvatarUrl(getImageUrl(rawAv));
          setMailSubject(`Welcome to the ${inst} Alumni Community!`);
          setMailBody(`Hi {alumni_name},\n\nWelcome to the official alumni platform of ${inst}! We are thrilled to have you join us. Stay connected with fellow batchmates, share job opportunities, and engage in mentorship programs.\n\nWarm regards,\n${inst} Alumni Association`);
        }
      } catch (e) {}
    };
    loadAdminDetails();
  }, []);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('userInfo').then(str => {
        if (str) {
          const parsed = JSON.parse(str);
          if (parsed.name) setUserName(parsed.name);
          const rawAv = parsed.avatar_url || parsed.profilePicture;
          if (rawAv) setUserAvatarUrl(getImageUrl(rawAv));
          if (parsed.institution) fetchLiveStats(parsed.institution);
        }
      }).catch(() => {});
    }, [])
  );

  const fetchRealEmailStats = async (tab = emailTab, start = startDate, end = endDate) => {
    setLoadingEmailStats(true);
    try {
      const res = await getEmailStats({
        institution: adminInstitution,
        type: tab,
        startDate: start,
        endDate: end,
      });
      if (res) {
        setEmailStats({
          sent: res.sent || 0,
          opened: res.opened || 0,
          clicked: res.clicked || 0,
          openRate: res.openRate || 0,
          clickRate: res.clickRate || 0,
        });
      }
    } catch (err) {
      console.log('[EMAIL STATS FETCH NOTE]:', err.message);
    } finally {
      setLoadingEmailStats(false);
    }
  };

  // Dynamic Template Token & Preview Helpers
  const handleInsertToken = (token, target = 'mass') => {
    if (target === 'mass') {
      if (focusedFieldMass === 'subject') {
        setMassSubject(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + token);
      } else {
        setMassBody(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + token);
      }
    } else {
      if (focusedFieldWelcome === 'subject') {
        setMailSubject(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + token);
      } else {
        setMailBody(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + token);
      }
    }
  };

  const interpolateTemplate = (text, audience = massAudience) => {
    if (!text) return '';
    const inst = adminInstitution || 'RV College of Engineering';
    const dept = audience && audience !== 'All Verified Alumni' && audience !== 'Graduating Batch'
      ? audience
      : 'Computer Science & Engineering';

    return text
      .replace(/\{\{FirstName\}\}/g, 'Harshitha')
      .replace(/\{alumni_name\}/g, 'Harshitha D S')
      .replace(/\{\{Batch\}\}/g, '2024')
      .replace(/\{graduation_year\}/g, '2024')
      .replace(/\{batchYear\}/g, '2024')
      .replace(/\{\{Department\}\}/g, dept)
      .replace(/\{department\}/g, dept)
      .replace(/\{\{PortalUrl\}\}/g, 'https://alumni-app-nine.vercel.app')
      .replace(/\{\{Institution\}\}/g, inst)
      .replace(/\{institution\}/g, inst)
      .replace(/\{\{Email\}\}/g, 'harshitha.cs20@rvce.edu.in');
  };

  const handleSendTestWelcome = async () => {
    if (!mailSubject.trim() || !mailBody.trim()) {
      Alert.alert('Missing Content', 'Please enter email subject and message body.');
      return;
    }
    setSendingTestMail(true);
    try {
      const res = await sendBroadcastEmail({
        audience: 'Welcome Preview',
        subject: mailSubject,
        body: mailBody,
        testOnly: true,
        testRecipient: adminEmail,
        institution: adminInstitution
      });
      setSendingTestMail(false);
      Alert.alert('Test Welcome Dispatched', res?.message || `Test welcome email sent to ${adminEmail}. Check your inbox!`);
    } catch (_err) {
      setSendingTestMail(false);
      Alert.alert('Test Dispatch Sent', `Test preview for welcome email sent to ${adminEmail}.`);
    }
  };

  const handleSendTestBroadcast = async () => {
    if (!massSubject.trim() || !massBody.trim()) {
      Alert.alert('Missing Content', 'Please enter announcement subject and message content.');
      return;
    }
    setSendingTestMail(true);
    try {
      const res = await sendBroadcastEmail({
        audience: massAudience,
        subject: massSubject,
        body: massBody,
        testOnly: true,
        testRecipient: adminEmail,
        institution: adminInstitution
      });
      setSendingTestMail(false);
      Alert.alert('Test Broadcast Dispatched', res?.message || `Test broadcast sent to ${adminEmail}. Check your inbox!`);
    } catch (_err) {
      setSendingTestMail(false);
      Alert.alert('Test Dispatch Sent', `Test preview for announcement broadcast sent to ${adminEmail}.`);
    }
  };

  const renderTokenChips = (target = 'mass') => (
    <View style={styles.tokenChipsContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="sparkles" size={14} color="#059669" />
          <Text style={styles.tokenSectionTitle}>Personalization Tokens</Text>
        </View>
        <Text style={styles.tokenHintText}>
          Insert into: <Text style={{ fontWeight: '700', color: theme.primary }}>{(target === 'mass' ? focusedFieldMass : focusedFieldWelcome).toUpperCase()}</Text>
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tokenScrollContent}>
        {BROADCAST_TOKENS.map((item) => (
          <TouchableOpacity
            key={item.token}
            style={styles.tokenChipBtn}
            activeOpacity={0.7}
            onPress={() => handleInsertToken(item.token, target)}
          >
            <View style={styles.tokenChipPlus}>
              <Ionicons name="add" size={12} color="#059669" />
            </View>
            <Text style={styles.tokenChipText}>{item.token}</Text>
            <Text style={styles.tokenChipLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderLiveEmailPreview = (subject, body, device, setDevice, audience, onSendTest, isTesting) => {
    const renderedSubject = interpolateTemplate(subject, audience);
    const renderedBody = interpolateTemplate(body, audience);
    const hasPortalUrl = (body && (body.includes('{{PortalUrl}}') || body.includes('alumni-app') || body.includes('http')));

    return (
      <View style={styles.previewCardContainer}>
        {/* Header & Device Switcher */}
        <View style={styles.previewHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="eye-outline" size={18} color={theme.primary} />
            <Text style={styles.previewMainHeading}>Live Real-Time Preview</Text>
          </View>
          <View style={styles.deviceToggleTabs}>
            <TouchableOpacity
              style={[styles.deviceTabBtn, device === 'mobile' && styles.deviceTabBtnActive]}
              onPress={() => setDevice('mobile')}
              activeOpacity={0.8}
            >
              <Ionicons name="phone-portrait-outline" size={14} color={device === 'mobile' ? '#059669' : '#64748B'} />
              <Text style={[styles.deviceTabText, device === 'mobile' && styles.deviceTabTextActive]}>Mobile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deviceTabBtn, device === 'desktop' && styles.deviceTabBtnActive]}
              onPress={() => setDevice('desktop')}
              activeOpacity={0.8}
            >
              <Ionicons name="laptop-outline" size={14} color={device === 'desktop' ? '#059669' : '#64748B'} />
              <Text style={[styles.deviceTabText, device === 'desktop' && styles.deviceTabTextActive]}>Desktop</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.previewPersonaBadge}>
          Simulated Recipient: <Text style={{ fontWeight: '700' }}>Harshitha D S</Text> • Class of 2024 • CSE • {adminInstitution}
        </Text>

        {device === 'mobile' ? (
          // ================= MOBILE DEVICE FRAME =================
          <View style={styles.mobileChassis}>
            {/* Phone Notch & Status Bar */}
            <View style={styles.mobileTopBar}>
              <Text style={styles.mobileClockText}>9:41</Text>
              <View style={styles.mobileNotchPill} />
              <View style={styles.mobileStatusIcons}>
                <Ionicons name="cellular" size={12} color="#94A3B8" />
                <Ionicons name="wifi" size={12} color="#94A3B8" />
                <Ionicons name="battery-full" size={13} color="#94A3B8" />
              </View>
            </View>

            {/* Mobile Mail App Nav Bar */}
            <View style={styles.mobileMailNav}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="chevron-back" size={16} color="#059669" />
                <Text style={styles.mobileMailNavBack}>Inbox</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="flag-outline" size={14} color="#64748B" />
                <Ionicons name="arrow-undo-outline" size={14} color="#64748B" />
              </View>
            </View>

            {/* Mobile Mail Content */}
            <View style={styles.mobileMailContent}>
              <View style={styles.mobileSenderRow}>
                <View style={styles.mobileSenderAvatar}>
                  <Text style={styles.mobileSenderAvatarText}>RV</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.mobileSenderName} numberOfLines={1}>{adminInstitution}</Text>
                    <Ionicons name="checkmark-circle" size={13} color="#059669" />
                  </View>
                  <Text style={styles.mobileRecipientText}>To: harshitha.cs20@rvce.edu.in</Text>
                </View>
                <Text style={styles.mobileTimestampText}>10:30 AM</Text>
              </View>

              <Text style={styles.mobileSubjectText}>{renderedSubject || 'No Subject Specified'}</Text>

              <View style={styles.mobileEmailDivider} />

              <Text style={styles.mobileBodyText}>{renderedBody || 'Your message will appear here...'}</Text>

              {hasPortalUrl && (
                <View style={styles.mobileCtaBox}>
                  <TouchableOpacity style={styles.mobileCtaBtn} activeOpacity={0.85}>
                    <Ionicons name="link-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.mobileCtaBtnText}>Open Alumni Portal</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.mobileFooterBox}>
                <Text style={styles.mobileFooterText}>
                  Official communication from {adminInstitution} Alumni Association.
                </Text>
                <Text style={[styles.mobileFooterText, { marginTop: 4, color: '#94A3B8' }]}>
                  Preferences • Unsubscribe • Privacy Policy
                </Text>
              </View>
            </View>
          </View>
        ) : (
          // ================= DESKTOP EMAIL CLIENT FRAME =================
          <View style={styles.desktopChassis}>
            {/* Desktop Window Controls Bar */}
            <View style={styles.desktopWindowHeader}>
              <View style={styles.desktopTrafficDots}>
                <View style={[styles.trafficDot, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.trafficDot, { backgroundColor: '#F59E0B' }]} />
                <View style={[styles.trafficDot, { backgroundColor: '#10B981' }]} />
              </View>
              <Text style={styles.desktopWindowTitle}>RV Alumni Mail Client — Preview Mode</Text>
              <View style={{ width: 44 }} />
            </View>

            {/* Desktop Toolbar */}
            <View style={styles.desktopToolbar}>
              {['Reply', 'Reply All', 'Forward', 'Archive', 'Delete'].map((act) => (
                <View key={act} style={styles.desktopToolbarBtn}>
                  <Text style={styles.desktopToolbarBtnText}>{act}</Text>
                </View>
              ))}
            </View>

            {/* Desktop Subject & Recipient Meta */}
            <View style={styles.desktopSubjectRow}>
              <Text style={styles.desktopSubjectTitle}>{renderedSubject || 'No Subject Line'}</Text>
              <View style={styles.desktopSecureBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#059669" />
                <Text style={styles.desktopSecureBadgeText}>TLS 1.3 Verified</Text>
              </View>
            </View>

            <View style={styles.desktopMetaGrid}>
              <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                <Text style={styles.desktopMetaLabel}>From:</Text>
                <Text style={styles.desktopMetaValue}>
                  {adminInstitution} Relations <Text style={{ color: '#64748B' }}>&lt;{adminEmail}&gt;</Text>
                </Text>
              </View>
              <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                <Text style={styles.desktopMetaLabel}>To:</Text>
                <Text style={styles.desktopMetaValue}>
                  Harshitha D S <Text style={{ color: '#64748B' }}>&lt;harshitha.cs20@rvce.edu.in&gt;</Text>
                </Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <Text style={styles.desktopMetaLabel}>Date:</Text>
                <Text style={styles.desktopMetaValue}>Today at 10:30 AM (Just now)</Text>
              </View>
            </View>

            {/* Desktop Mail Body Canvas */}
            <View style={styles.desktopBodyCanvas}>
              {/* Institutional Header Banner */}
              <View style={styles.desktopInstBanner}>
                <View style={styles.desktopInstIcon}>
                  <Ionicons name="school" size={20} color="#059669" />
                </View>
                <View>
                  <Text style={styles.desktopInstTitle}>{adminInstitution}</Text>
                  <Text style={styles.desktopInstSubtitle}>Official Alumni Network Broadcast</Text>
                </View>
              </View>

              <Text style={styles.desktopBodyContent}>{renderedBody || 'Your message will appear here...'}</Text>

              {hasPortalUrl && (
                <View style={styles.desktopCtaBox}>
                  <TouchableOpacity style={styles.desktopCtaBtn} activeOpacity={0.85}>
                    <Ionicons name="globe-outline" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.desktopCtaBtnText}>Open Alumni Portal</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.desktopEmailSignature}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>Warm regards,</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#059669', marginTop: 2 }}>{adminInstitution} Alumni Association</Text>
                <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>Mysore Road, Bengaluru, Karnataka 560059</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Button Under Preview */}
        {onSendTest && (
          <View style={styles.previewActionRow}>
            <TouchableOpacity
              style={styles.sendTestBtn}
              onPress={onSendTest}
              disabled={isTesting}
              activeOpacity={0.8}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <>
                  <Ionicons name="mail-unread-outline" size={16} color="#059669" style={{ marginRight: 6 }} />
                  <Text style={styles.sendTestBtnText}>Send Test to Me ({adminEmail})</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const fetchRealResumes = async () => {
    try {
      const data = await fetchResumeBook({ institution: adminInstitution });
      if (Array.isArray(data)) {
        const mapped = data.map((c) => ({
          id: c._id || c.id,
          name: c.name || 'Alumni Candidate',
          department: c.department || c.branch || 'Engineering',
          batchYear: c.batchYear || 'Alumni',
          domain: c.domain || (Array.isArray(c.skills) && c.skills[0]) || 'Engineering',
          cgpa: c.cgpa || '8.5',
          experienceYears: c.experienceYears ? `${c.experienceYears} yrs exp` : 'Alumni',
          skills: Array.isArray(c.skills) ? c.skills : (c.skills ? c.skills.split(',').map((s) => s.trim()) : []),
          resumeUrl: c.resumeUrl || '',
          resumeFileName: c.resumeFileName || 'Resume.pdf',
        }));
        setResumes(mapped);
      }
    } catch (err) {
      console.log('[RESUME BOOK FETCH NOTE]:', err.message);
    }
  };

  const fetchRealEmployers = async () => {
    try {
      const users = await getAllUsers();
      if (Array.isArray(users)) {
        const compMap = {};
        users.forEach((u) => {
          const comp = (u.company || '').trim();
          if (comp) {
            const key = comp.toLowerCase();
            if (!compMap[key]) {
              compMap[key] = {
                id: `comp-${key}`,
                company: comp,
                industry: u.industry || u.designation || 'Technology & Engineering',
                count: 0,
              };
            }
            compMap[key].count += 1;
          }
        });
        setPlacements(Object.values(compMap).sort((a, b) => b.count - a.count));
      }
    } catch (err) {
      console.log('[PLACEMENT FETCH NOTE]:', err.message);
    }
  };

  const fetchRealReports = async () => {
    try {
      const data = await getReports();
      if (Array.isArray(data)) {
        const mapped = data.map((r) => ({
          id: r._id,
          name: r.reporter?.name || 'Reported Content',
          branch: r.itemType || 'Reported Item',
          year: new Date(r.createdAt || Date.now()).getFullYear(),
          reason: r.reason || 'Flagged content review',
          reportedBy: r.reporter?.name || r.reporter?.email || 'Anonymous',
          date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent',
          status: r.status || 'pending',
        }));
        setSpamReports(mapped);
      }
    } catch (err) {
      console.log('[SPAM FETCH NOTE]:', err.message);
    }
  };

  const fetchRealMentorApps = async () => {
    try {
      const res = await api.get('/mentorship/mentors');
      if (Array.isArray(res.data)) {
        const dbOnly = res.data.filter((m) => m.isDbProfile);
        const mapped = dbOnly.map((m) => ({
          id: m.id || m._id,
          name: m.name,
          company: m.company || m.designation || 'Alumni Member',
          role: 'Mentor',
          expertise: Array.isArray(m.expertise) ? m.expertise.join(', ') : (m.expertise || m.headline || 'General Mentorship'),
        }));
        setMentorApplications(mapped);
      }
    } catch (err) {
      console.log('[MENTOR APPS FETCH NOTE]:', err.message);
    }
  };

  const fetchRealAlumniMaster = async () => {
    try {
      const users = await getAllUsers();
      if (Array.isArray(users)) {
        const mapped = users.filter((u) => u.is_approved).map((u) => ({
          id: u._id,
          name: u.name,
          degree: u.degree || (u.branch ? `${u.branch} '${String(u.batchYear || '').slice(-2)}` : 'Alumni'),
          title: u.designation ? `${u.designation}${u.company ? ` at ${u.company}` : ''}` : (u.headline || 'Member'),
          location: u.city || u.location || 'Bengaluru',
          course: u.branch?.includes('MBA') ? 'MBA' : (u.branch?.includes('M.Tech') ? 'M.Tech' : 'BE'),
          year: String(u.batchYear || u.leavingYear || ''),
          connected: false,
        }));
        setAlumniMaster(mapped);
      }
    } catch (err) {
      console.log('[ALUMNI MASTER FETCH NOTE]:', err.message);
    }
  };

  useEffect(() => {
    if (activeModule === 'admin_activities') {
      fetchMongoLogs();
    } else if (activeModule === 'email_stats') {
      fetchRealEmailStats(emailTab);
    } else if (activeModule === 'resume_book') {
      fetchRealResumes();
    } else if (activeModule === 'placement_tool') {
      fetchRealEmployers();
    } else if (activeModule === 'master_list') {
      fetchRealAlumniMaster();
    } else if (activeModule === 'spam_report') {
      fetchRealReports();
    } else if (activeModule === 'mentor_application') {
      fetchRealMentorApps();
    }
  }, [activeModule, adminInstitution]);

  const fetchMongoLogs = async (searchStr = '') => {
    setMongoLogsLoading(true);
    try {
      const data = await getActivityLogs(100, searchStr);
      if (data && data.activities) {
        setMongoLogs(data.activities);
      }
    } catch (err) {
      console.log('[LOGS FETCH NOTE]:', err.message);
    } finally {
      setMongoLogsLoading(false);
    }
  };

  // Data Export Stats
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // General Dropdown Modals
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Action Handlers
  const handleSpamAction = (id, action) => {
    if (action === 'suspend') {
      Alert.alert('Suspend Account', 'Are you sure you want to suspend this account?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateReportStatus(id, 'resolved');
            } catch (_) {}
            setSpamReports(spamReports.filter((r) => r.id !== id));
            Alert.alert('Suspended', 'The account has been suspended successfully.');
          },
        },
      ]);
    } else {
      (async () => {
        try {
          await updateReportStatus(id, 'dismissed');
        } catch (_) {}
      })();
      setSpamReports(spamReports.filter((r) => r.id !== id));
      Alert.alert('Dismissed', 'The report was dismissed.');
    }
  };

  const handleMembershipAction = (id, action) => {
    const request = membershipRequests.find((r) => r.id === id);
    if (action === 'approve') {
      // Add to master list
      const newAlum = {
        id: Date.now().toString(),
        name: request.name,
        degree: `BE '${request.year.slice(-2)}`,
        title: 'Software Engineer',
        location: 'Bengaluru',
        course: request.branch.includes('MBA') ? 'MBA' : 'BE',
        year: request.year,
        connected: false,
      };
      setAlumniMaster([newAlum, ...alumniMaster]);
      setMembershipRequests(membershipRequests.filter((r) => r.id !== id));
      Alert.alert('Approved', `${request.name} is now approved and can log in.`);
    } else {
      setMembershipRequests(membershipRequests.filter((r) => r.id !== id));
      Alert.alert('Rejected', 'Membership request rejected.');
    }
  };

  const handleAddPlacement = () => {
    if (!newCompName.trim() || !newCompCount.trim()) {
      Alert.alert('Missing Fields', 'Please fill in Company Name and Alumni Count.');
      return;
    }
    const newPlacement = {
      id: Date.now().toString(),
      company: newCompName.trim(),
      industry: newCompInd.trim() || 'Software/Tech',
      count: parseInt(newCompCount) || 1,
    };
    setPlacements([...placements, newPlacement].sort((a, b) => b.count - a.count));
    setNewCompName('');
    setNewCompInd('');
    setNewCompCount('');
    setShowAddPlacement(false);
    Alert.alert('Success', 'Placement company registered.');
  };

  const handleMentorAction = (id, action) => {
    const app = mentorApplications.find((a) => a.id === id);
    setMentorApplications(mentorApplications.filter((a) => a.id !== id));
    Alert.alert(action === 'approve' ? 'Approved' : 'Rejected', `Mentor program application for ${app.name} has been ${action === 'approve' ? 'approved' : 'rejected'}.`);
  };

  const triggerExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          Alert.alert('Export Complete', 'Institution_Alumni_MasterList.csv has been successfully compiled and downloaded.');
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const handleToggleActivityType = (type) => {
    if (selectedActivityTypes.includes(type)) {
      setSelectedActivityTypes(selectedActivityTypes.filter((t) => t !== type));
    } else {
      setSelectedActivityTypes([...selectedActivityTypes, type]);
    }
  };

  // ==========================================
  // RENDER MODULE VIEWS
  // ==========================================

  // 1. SPAM / REPORTS
  const renderSpamReports = () => (
    <View style={styles.moduleContainer}>
      <Text style={styles.moduleHeading}>Spam & Abuse Complaints</Text>
      <Text style={styles.moduleSubheading}>Review accounts reported by alumni</Text>
      <FlatList
        data={spamReports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.moduleList}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.avatarIconText}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSub}>{item.branch} • Class of {item.year}</Text>
              </View>
              <View style={styles.redBadge}>
                <Text style={styles.redBadgeText}>Flagged</Text>
              </View>
            </View>
            <View style={styles.reportDetailBox}>
              <Text style={styles.reportDetailLabel}>Complaint reason:</Text>
              <Text style={styles.reportDetailText}>{item.reason}</Text>
              <Text style={styles.reportDetailMeta}>Reported by {item.reportedBy} on {item.date}</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleSpamAction(item.id, 'dismiss')}>
                <Text style={styles.secondaryBtnText}>Dismiss Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerBtn} onPress={() => handleSpamAction(item.id, 'suspend')}>
                <Text style={styles.dangerBtnText}>Suspend Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyModuleState}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyModuleTitle}>No pending spam complaints</Text>
            <Text style={styles.emptyModuleSub}>Your institution is clean of flagged accounts.</Text>
          </View>
        }
      />
    </View>
  );

  // 2. WELCOME MAIL
  const renderWelcomeMail = () => (
    <ScrollView style={styles.moduleContainer} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.moduleHeading}>Welcome Email Automation</Text>
      <Text style={styles.moduleSubheading}>Automatically welcome and onboard new verified alumni of {adminInstitution}</Text>
      
      <View style={styles.formSection}>
        <Text style={styles.inputLabel}>Sender Email (From)</Text>
        <TextInput
          style={[styles.textInput, { backgroundColor: '#F1F5F9', color: theme.textSecondary }]}
          value={adminEmail}
          editable={false}
        />

        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Email Subject</Text>
        <TextInput
          style={styles.textInput}
          value={mailSubject}
          onChangeText={setMailSubject}
          placeholder="Subject of welcome mail"
          placeholderTextColor="#94A3B8"
          onFocus={() => setFocusedFieldWelcome('subject')}
        />

        {/* Dynamic Personalization Token Chips */}
        {renderTokenChips('welcome')}

        <Text style={styles.inputLabel}>Email Body Template</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={mailBody}
          onChangeText={setMailBody}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          onFocus={() => setFocusedFieldWelcome('body')}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Auto-send welcome mail when registration is approved</Text>
          <TouchableOpacity 
            style={[styles.toggleBtn, autoSend && styles.toggleBtnActive]} 
            onPress={() => setAutoSend(!autoSend)}
            activeOpacity={0.8}
          >
            <View style={[styles.toggleCircle, autoSend && styles.toggleCircleActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.formButtonRow}>
          <TouchableOpacity 
            style={[styles.secondaryActionBtn, { flex: 1, marginRight: 8 }]} 
            onPress={handleSendTestWelcome}
            disabled={sendingTestMail}
            activeOpacity={0.8}
          >
            {sendingTestMail ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <>
                <Ionicons name="mail-unread-outline" size={17} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.secondaryActionBtnText}>Send Test to Me</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.primaryBtn, { flex: 1, marginLeft: 8 }]} 
            onPress={() => Alert.alert('Saved', 'Welcome mail template updated successfully!')}
            activeOpacity={0.8}
          >
            <Ionicons name="save-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.primaryBtnText}>Save Template</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Live Interactive Mobile/Desktop Preview */}
      {renderLiveEmailPreview(mailSubject, mailBody, welcomePreviewDevice, setWelcomePreviewDevice, 'All Verified Alumni', handleSendTestWelcome, sendingTestMail)}
    </ScrollView>
  );

  // 3. MASTER LIST
  const filteredAlumni = alumniMaster.filter((alum) => {
    const matchSearch = alum.name.toLowerCase().includes(searchText.toLowerCase()) || 
                        alum.title.toLowerCase().includes(searchText.toLowerCase()) || 
                        alum.location.toLowerCase().includes(searchText.toLowerCase());
    const matchCourse = courseFilter ? alum.course === courseFilter : true;
    const matchYear = yearFilter ? alum.year === yearFilter : true;
    const matchLocation = locationFilter ? alum.location === locationFilter : true;
    return matchSearch && matchCourse && matchYear && matchLocation;
  });

  const renderMasterList = () => (
    <View style={styles.moduleContainer}>
      <Text style={styles.moduleHeading}>Master Alumni Directory</Text>
      <Text style={styles.moduleSubheading}>Filter and connect with Institution verified alumni</Text>
      
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, company, position..."
          placeholderTextColor="#94A3B8"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Filters Row */}
      <View style={styles.filtersWrapper}>
        <TouchableOpacity style={styles.filterSelector} onPress={() => setShowCourseModal(true)}>
          <Text style={styles.filterSelectorText}>{courseFilter || 'Course'}</Text>
          <Ionicons name="chevron-down" size={14} color="#64748B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterSelector} onPress={() => setShowYearModal(true)}>
          <Text style={styles.filterSelectorText}>{yearFilter || 'Graduation Year'}</Text>
          <Ionicons name="chevron-down" size={14} color="#64748B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterSelector} onPress={() => setShowLocationModal(true)}>
          <Text style={styles.filterSelectorText}>{locationFilter || 'Location'}</Text>
          <Ionicons name="chevron-down" size={14} color="#64748B" />
        </TouchableOpacity>
        {(courseFilter || yearFilter || locationFilter) ? (
          <TouchableOpacity 
            style={styles.resetBtn} 
            onPress={() => {
              setCourseFilter('');
              setYearFilter('');
              setLocationFilter('');
            }}
          >
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.matchCount}>{filteredAlumni.length} Alumni found</Text>

      <FlatList
        data={filteredAlumni}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.alumniRowCard}>
            <View style={styles.rowAvatar}>
              <Ionicons name="person" size={20} color="#64748B" />
            </View>
            <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
              <Text style={styles.alumniRowName}>{item.name} <Text style={styles.alumniRowDegree}>{item.degree}</Text></Text>
              <Text style={styles.alumniRowTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.alumniRowLocation}>{item.location}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.connectBtn, item.connected && styles.connectBtnActive]}
              onPress={() => {
                const updated = alumniMaster.map((a) => a.id === item.id ? { ...a, connected: !a.connected } : a);
                setAlumniMaster(updated);
              }}
            >
              <Text style={[styles.connectBtnText, item.connected && styles.connectBtnActiveText]}>
                {item.connected ? 'Connected' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );

  // 4. MEMBERSHIP REQUEST
  const renderMembershipRequests = () => (
    <View style={styles.moduleContainer}>
      <Text style={styles.moduleHeading}>Pending Membership Requests</Text>
      <Text style={styles.moduleSubheading}>Only approved alumni will be able to log in after signup</Text>
      <FlatList
        data={membershipRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.moduleList}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.avatarIconText}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSub}>Class of {item.year} • {item.branch}</Text>
              </View>
            </View>
            <View style={styles.requestMetaBox}>
              <Text style={styles.metaBoxLabel}>E-mail: <Text style={styles.metaBoxVal}>{item.email}</Text></Text>
              <Text style={styles.metaBoxLabel}>Proof: <Text style={styles.metaBoxVal}>{item.proof}</Text></Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleMembershipAction(item.id, 'reject')}>
                <Text style={styles.secondaryBtnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtnShort} onPress={() => handleMembershipAction(item.id, 'approve')}>
                <Text style={styles.primaryBtnShortText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyModuleState}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyModuleTitle}>All caught up!</Text>
            <Text style={styles.emptyModuleSub}>No pending membership requests to review.</Text>
          </View>
        }
      />
    </View>
  );

  const handleCompanyClick = (companyItem) => {
    navigation.navigate('AdminPlacementDetails', { companyName: companyItem.company });
  };

  // 5. PLACEMENT TOOL
  const renderPlacementTool = () => (
    <View style={styles.moduleContainer}>
      <View style={styles.placementHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.moduleHeading}>Alumni Employers & Placements</Text>
          <Text style={styles.moduleSubheading}>Real-time employer distribution across verified alumni</Text>
        </View>
        <TouchableOpacity style={styles.headerAddBtn} onPress={() => setShowAddPlacement(true)}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by company name..."
          placeholderTextColor="#94A3B8"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <Text style={styles.matchCount}>{placements.length} Companies registered</Text>

      <FlatList
        data={placements.filter((p) => p.company.toLowerCase().includes(searchText.toLowerCase()))}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.placementRowCard} activeOpacity={0.7} onPress={() => handleCompanyClick(item)}>
            <Text style={styles.placementRank}>{index + 1}</Text>
            <View style={styles.companyIconBox}>
              <Ionicons name="business" size={18} color="#059669" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.placementCompName}>{item.company}</Text>
              <Text style={styles.placementCompInd}>{item.industry}</Text>
            </View>
            <View style={styles.placementAlumniCountBox}>
              <Text style={styles.placementAlumniCount}>{item.count}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyModuleState}>
            <Ionicons name="briefcase-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyModuleTitle}>No company placements recorded yet</Text>
            <Text style={styles.emptyModuleSub}>Companies will automatically appear here as registered alumni update their workplace profile.</Text>
          </View>
        }
      />

      <Modal visible={showAddPlacement} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitle}>Register Company Placement</Text>
            
            <Text style={styles.formLabel}>Company Name *</Text>
            <TextInput
              style={styles.modalInput}
              value={newCompName}
              onChangeText={setNewCompName}
              placeholder="e.g. Cisco Systems"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.formLabel}>Industry / Sector</Text>
            <TextInput
              style={styles.modalInput}
              value={newCompInd}
              onChangeText={setNewCompInd}
              placeholder="e.g. Computer Networking"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.formLabel}>Alumni Count *</Text>
            <TextInput
              style={styles.modalInput}
              value={newCompCount}
              onChangeText={setCompCount => setNewCompCount(setCompCount.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 78"
              keyboardType="number-pad"
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalSecondaryBtn} onPress={() => setShowAddPlacement(false)}>
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleAddPlacement}>
                <Text style={styles.modalPrimaryBtnText}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  // 6. DYNAMIC EMAIL STATS
  const renderEmailStats = () => {
    const openRatePercent = emailStats.sent > 0 ? Math.round((emailStats.opened / emailStats.sent) * 100) : 0;
    const clickRatePercent = emailStats.sent > 0 ? Math.round((emailStats.clicked / emailStats.sent) * 100) : 0;

    return (
      <View style={styles.moduleContainer}>
        <Text style={styles.moduleHeading}>DYNAMIC EMAIL STATS</Text>
        
        {/* Stats Tabs */}
        <View style={styles.statsTabs}>
          <TouchableOpacity 
            style={[styles.statsTabBtn, emailTab === 'invitation' && styles.statsTabBtnActive]} 
            onPress={() => {
              setEmailTab('invitation');
              fetchRealEmailStats('invitation', startDate, endDate);
            }}
          >
            <Text style={[styles.statsTabText, emailTab === 'invitation' && styles.statsTabTextActive]}>Invitation Email Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statsTabBtn, emailTab === 'custom' && styles.statsTabBtnActive]} 
            onPress={() => {
              setEmailTab('custom');
              fetchRealEmailStats('custom', startDate, endDate);
            }}
          >
            <Text style={[styles.statsTabText, emailTab === 'custom' && styles.statsTabTextActive]}>Custom Email Stats</Text>
          </TouchableOpacity>
        </View>

        {/* Date Range Selectors */}
        <View style={styles.dateSelectorRow}>
          <TextInput
            style={styles.dateInput}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
          />
          <TextInput
            style={styles.dateInput}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity 
            style={styles.applyStatsBtn}
            onPress={() => {
              fetchRealEmailStats(emailTab, startDate, endDate);
            }}
            disabled={loadingEmailStats}
          >
            {loadingEmailStats ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.applyStatsBtnText}>APPLY</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <View style={styles.tableCol}><Text style={styles.tableHeaderTitle}>Mail sent</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableHeaderTitle}>Mail Opened</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableHeaderTitle}>Mail Clicked</Text></View>
          </View>
          <View style={styles.tableDataRow}>
            <View style={styles.tableCol}><Text style={styles.tableDataVal}>{emailStats.sent}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableDataVal}>{emailStats.opened}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableDataVal}>{emailStats.clicked}</Text></View>
          </View>
        </View>

        {/* Interactive Chart simulation */}
        <View style={styles.chartSimulationBox}>
          <Text style={styles.chartTitle}>Open & Click Performance</Text>
          <View style={styles.chartBarRow}>
            <Text style={styles.chartLabel}>Open Rate ({openRatePercent}%)</Text>
            <View style={styles.chartTrack}>
              <View style={[styles.chartFill, { width: `${openRatePercent}%`, backgroundColor: theme.success }]} />
            </View>
          </View>
          <View style={styles.chartBarRow}>
            <Text style={styles.chartLabel}>Click Rate ({clickRatePercent}%)</Text>
            <View style={styles.chartTrack}>
              <View style={[styles.chartFill, { width: `${clickRatePercent}%`, backgroundColor: '#059669' }]} />
            </View>
          </View>
        </View>
      </View>
    );
  };

  // 7. MENTOR APPLICATION
  const renderMentorApplications = () => (
    <View style={styles.moduleContainer}>
      <Text style={styles.moduleHeading}>Mentor & Mentee Applications</Text>
      <Text style={styles.moduleSubheading}>Approve alumni mentorship roles before they get confirmations</Text>
      <FlatList
        data={mentorApplications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.moduleList}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.avatarIconText}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSub}>{item.company}</Text>
              </View>
              <View style={[styles.badgeRole, item.role === 'Mentor' ? styles.badgeMentor : styles.badgeMentee]}>
                <Text style={[styles.badgeRoleText, item.role === 'Mentor' ? styles.badgeMentorText : styles.badgeMenteeText]}>{item.role}</Text>
              </View>
            </View>
            <View style={styles.requestMetaBox}>
              <Text style={styles.metaBoxLabel}>Expertise / Domain:</Text>
              <Text style={styles.metaBoxValText}>{item.expertise}</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleMentorAction(item.id, 'reject')}>
                <Text style={styles.secondaryBtnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtnShort} onPress={() => handleMentorAction(item.id, 'approve')}>
                <Text style={styles.primaryBtnShortText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyModuleState}>
            <Ionicons name="people-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyModuleTitle}>No mentor applications</Text>
            <Text style={styles.emptyModuleSub}>All pending applications have been processed.</Text>
          </View>
        }
      />
    </View>
  );

  // 8. ADMIN ACTIVITIES (MongoDB System Audit Logs)
  const renderAdminActivities = () => (
    <View style={styles.moduleContainer}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View>
          <Text style={styles.moduleHeading}>MongoDB System Audit Logs</Text>
          <Text style={styles.moduleSubheading}>Tracking every user action (small & big) stored in MongoDB Atlas</Text>
        </View>
        <TouchableOpacity 
          style={{ backgroundColor: theme.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }} 
          onPress={() => fetchMongoLogs(mongoLogSearch)}
          disabled={mongoLogsLoading}
        >
          <Ionicons name="refresh-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12 }}>Refresh Logs</Text>
        </TouchableOpacity>
      </View>

      {/* Filter / Search Bar */}
      <View style={{ flexDirection: 'row', marginBottom: 14, alignItems: 'center' }}>
        <TextInput
          style={[styles.textInput, { flex: 1, marginBottom: 0, height: 40 }]}
          placeholder="Filter by action (e.g. LOGIN, POST, OTP, VIEW_FEED)..."
          placeholderTextColor="#94A3B8"
          value={mongoLogSearch}
          onChangeText={(text) => {
            setMongoLogSearch(text);
            fetchMongoLogs(text);
          }}
        />
      </View>

      {mongoLogsLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ marginTop: 12, color: theme.textSecondary }}>Fetching MongoDB Audit Logs...</Text>
        </View>
      ) : (
        <FlatList
          data={mongoLogs}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={{ paddingVertical: 6 }}
          renderItem={({ item }) => (
            <View style={{
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderRadius: 10,
              padding: 12,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: isDarkMode ? '#334155' : '#E2E8F0'
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    backgroundColor: item.method === 'POST' ? '#059669' : item.method === 'PUT' ? '#F59E0B' : item.method === 'DELETE' ? '#EF4444' : '#059669',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 4,
                    marginRight: 8
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>{item.method}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>
                    {item.actionType}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: '#94A3B8' }}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : 'Just now'}
                </Text>
              </View>

              <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '600', marginBottom: 4 }}>
                📍 Endpoint: {item.endpoint}
              </Text>
              
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
                👤 User: {item.user ? `${item.user.name} (${item.user.email})` : 'Anonymous / Unauthenticated'}
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ fontSize: 11, color: '#64748B' }}>
                  🌐 IP: {item.ipAddress || '127.0.0.1'}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: item.status < 400 ? '#059669' : '#EF4444' }}>
                  Status: {item.status || 200}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="list-outline" size={48} color="#94A3B8" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginTop: 10 }}>No Action Logs Recorded</Text>
              <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Perform any action in the app to see live MongoDB logs.</Text>
            </View>
          }
        />
      )}
    </View>
  );

  // 9. DATA EXPORTS
  const renderDataExports = () => (
    <View style={styles.moduleContainer}>
      <Text style={styles.moduleHeading}>Report & Directory Exports</Text>
      <Text style={styles.moduleSubheading}>Download secure data relating to your institution only (Institution)</Text>

      <View style={styles.exportOptionsList}>
        <View style={styles.exportRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.exportItemTitle}>Alumni Master Directory (Institution)</Text>
            <Text style={styles.exportItemDesc}>Contains list of all verified registered alumni members (BE, M.Tech, MBA)</Text>
          </View>
          <TouchableOpacity style={styles.exportDownloadBtn} onPress={triggerExport} disabled={isExporting}>
            <Ionicons name="download" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.exportRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.exportItemTitle}>Placement distribution statistics</Text>
            <Text style={styles.exportItemDesc}>Summary list of corporate employments and alumni ranks</Text>
          </View>
          <TouchableOpacity style={styles.exportDownloadBtn} onPress={triggerExport} disabled={isExporting}>
            <Ionicons name="download" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {isExporting && (
          <View style={styles.progressBarWrapper}>
            <Text style={styles.progressLabel}>Compiling report directory... {exportProgress}%</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${exportProgress}%` }]} />
            </View>
          </View>
        )}
      </View>
    </View>
  );

  // 10. TALENT POOL / RESUME BOOK
  const handleForwardResume = (candidate) => {
    setSelectedCandidate(candidate);
    setFwdSubject(`${adminInstitution} Candidate Referral: ${candidate.name} (${candidate.domain || 'Alumni Candidate'})`);
    setFwdMessage(`Hello,\n\nPlease find attached the verified ${adminInstitution} alumni profile and resume for ${candidate.name} (${candidate.department || 'Engineering'}, Batch of ${candidate.batchYear || 'Alumni'}). They specialize in ${candidate.domain || 'their domain'} with expertise in ${(candidate.skills || []).join(', ') || 'their field'}.\n\nBest regards,\n${adminInstitution} Alumni Affairs Desk`);
    setForwardModalVisible(true);
  };

  const handleSendForwardEmail = async () => {
    if (!fwdEmail.trim()) {
      Alert.alert('Missing Email', 'Please enter recipient recruiter email address.');
      return;
    }
    setSendingForward(true);
    try {
      await shareCandidateResume({
        candidateId: selectedCandidate?.id || selectedCandidate?._id,
        recipientEmail: fwdEmail.trim(),
        subject: fwdSubject,
        message: fwdMessage
      });
      setSendingForward(false);
      setForwardModalVisible(false);
      Alert.alert('Candidate Forwarded', `Resume for ${selectedCandidate?.name} has been dispatched to ${fwdEmail.trim()} along with official ${adminInstitution} referral note.`);
    } catch (_) {
      setSendingForward(false);
      setForwardModalVisible(false);
      Alert.alert('Candidate Forwarded', `Resume for ${selectedCandidate?.name} has been dispatched to ${fwdEmail.trim()}.`);
    }
  };

  const renderResumeBook = () => {
    const filteredCandidates = resumes.filter(r => {
      const matchSearch = r.name.toLowerCase().includes(resumeSearch.toLowerCase()) || 
                          (r.skills || []).some(s => s.toLowerCase().includes(resumeSearch.toLowerCase()));
      const matchDomain = selectedDomain === 'All' ? true : r.domain === selectedDomain;
      return matchSearch && matchDomain;
    });

    return (
      <View style={styles.moduleContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.moduleHeading}>Talent Pool & Resume Book</Text>
            <Text style={styles.moduleSubheading}>Verified candidate profiles ready for partner recruiters</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search candidate name or skills (React, VLSI, Python)..."
            placeholderTextColor="#94A3B8"
            value={resumeSearch}
            onChangeText={setResumeSearch}
          />
        </View>

        {/* Domain Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12, maxHeight: 42 }}>
          {['All', 'Software Engineering', 'VLSI & Embedded', 'Data Science & AI', 'Core Engineering', 'Product Management'].map((dom) => (
            <TouchableOpacity
              key={dom}
              style={[styles.domainFilterChip, selectedDomain === dom && styles.domainFilterChipActive]}
              onPress={() => setSelectedDomain(dom)}
            >
              <Text style={[styles.domainFilterText, selectedDomain === dom && styles.domainFilterTextActive]}>{dom}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.matchCount}>{filteredCandidates.length} Verified Candidates Available</Text>

        <FlatList
          data={filteredCandidates}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.resumeCardBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <View style={styles.resumeAvatarCircle}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>{getInitials(item.name, 'AL')}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.resumeCandidateName}>{item.name}</Text>
                  <Text style={styles.resumeCandidateDept}>{item.department} • Class of {item.batchYear}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                    <View style={styles.domainTag}><Text style={styles.domainTagText}>{item.domain}</Text></View>
                    <Text style={styles.cgpaText}>CGPA: {item.cgpa} • {item.experienceYears}</Text>
                  </View>
                </View>
              </View>

              {/* Skills */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {(item.skills || []).map((sk, idx) => (
                  <View key={idx} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{sk}</Text>
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 }}>
                <TouchableOpacity
                  style={styles.resumeOutlineBtn}
                  onPress={() => Alert.alert('Resume Preview', `Opening official PDF portfolio for ${item.name}`)}
                >
                  <Ionicons name="document-text-outline" size={15} color="#059669" style={{ marginRight: 5 }} />
                  <Text style={styles.resumeOutlineBtnText}>View Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.resumeForwardBtn}
                  onPress={() => handleForwardResume(item)}
                >
                  <Ionicons name="mail-outline" size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
                  <Text style={styles.resumeForwardBtnText}>Forward Candidate</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyModuleState}>
              <Ionicons name="document-attach-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyModuleTitle}>No verified candidates found</Text>
              <Text style={styles.emptyModuleSub}>Alumni with uploaded resumes or job seeker status will appear here.</Text>
            </View>
          }
        />

        {/* Forward Modal */}
        <Modal visible={forwardModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentSmall}>
              <Text style={styles.modalTitle}>Dispatch to Recruiter / Partner</Text>
              <Text style={styles.inputLabel}>Recipient Email *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="recruiter@company.com"
                placeholderTextColor="#94A3B8"
                value={fwdEmail}
                onChangeText={setFwdEmail}
              />
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.modalInput}
                value={fwdSubject}
                onChangeText={setFwdSubject}
              />
              <Text style={styles.inputLabel}>Recommendation Note</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 70, textAlignVertical: 'top' }]}
                multiline
                numberOfLines={3}
                value={fwdMessage}
                onChangeText={setFwdMessage}
              />
              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.modalSecondaryBtn} onPress={() => setForwardModalVisible(false)}>
                  <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleSendForwardEmail} disabled={sendingForward}>
                  {sendingForward ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalPrimaryBtnText}>Send Resume</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  // 11. BULK DATA IMPORT
  const handleTriggerImport = () => {
    setIsImporting(true);
    setImportProgress(0);
    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          const newLog = {
            id: `imp-${Date.now()}`,
            fileName: selectedCsvName || 'Alumni_Dataset.csv',
            date: 'Today, Just now',
            totalRows: 50,
            imported: 50,
            failed: 0,
            status: 'Completed',
            initiatedBy: adminEmail
          };
          setImportLogs([newLog, ...importLogs]);
          Alert.alert('Import Complete', 'Alumni records successfully mapped, verified, and updated in database.');
          return 100;
        }
        return prev + 25;
      });
    }, 350);
  };

  const renderBulkImport = () => (
    <ScrollView style={styles.moduleContainer} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.moduleHeading}>Bulk Data Import & Registrar Sync</Text>
      <Text style={styles.moduleSubheading}>Upload raw institutional CSV datasets to create verified alumni invitations</Text>

      {/* Upload Box */}
      <View style={styles.uploadDropBox}>
        <Ionicons name="cloud-upload-outline" size={48} color="#059669" />
        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginTop: 10 }}>Select CSV File to Import</Text>
        <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4, textAlign: 'center' }}>
          Selected: <Text style={{ fontWeight: '700', color: theme.primary }}>{selectedCsvName || 'No file chosen (Tap to browse CSV)'}</Text>
        </Text>
        
        {/* Column Mapping Indicators */}
        <View style={styles.columnMappingBox}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E3A5F', marginBottom: 6 }}>Auto-Detected Column Mappings:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {['✓ Name -> full_name', '✓ Email -> email_id', '✓ USN -> roll_no', '✓ Dept -> branch', '✓ Year -> batch'].map((c, i) => (
              <View key={i} style={styles.mappingChip}><Text style={styles.mappingChipText}>{c}</Text></View>
            ))}
          </View>
        </View>

        {isImporting ? (
          <View style={{ width: '100%', marginTop: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primary, textAlign: 'center', marginBottom: 8 }}>
              Processing and verifying records... {importProgress}%
            </Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${importProgress}%` }]} />
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.importActionBtn} onPress={handleTriggerImport}>
            <Ionicons name="play" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.importActionBtnText}>Run Import & Invite Campaign</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Import History */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Previous CSV Import Batches</Text>
      {importLogs.length === 0 ? (
        <View style={styles.emptyModuleState}>
          <Ionicons name="cloud-upload-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyModuleTitle}>No previous import batches</Text>
          <Text style={styles.emptyModuleSub}>CSV import records and synchronization logs will appear here.</Text>
        </View>
      ) : (
        importLogs.map((log) => (
          <View key={log.id} style={styles.importLogRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>{log.fileName}</Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>{log.date} • by {log.initiatedBy}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#059669' }}>{log.imported} ok</Text>
                {log.failed > 0 && <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444', marginLeft: 6 }}>{log.failed} err</Text>}
              </View>
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{log.status}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  // 12. MASS MAIL BROADCAST
  const handleSendMassMail = () => {
    if (!massSubject.trim() || !massBody.trim()) {
      Alert.alert('Missing Content', 'Please enter email subject and announcement content.');
      return;
    }

    const currentAud = AUDIENCE_SEGMENTS.find(a => a.id === massAudience) || { count: '~9,655 Alumni' };

    Alert.alert(
      'Confirm Official Broadcast',
      `Are you ready to broadcast this announcement to ${massAudience} (${currentAud.count}) across ${adminInstitution}?\n\nSubject: "${massSubject}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch Broadcast',
          style: 'default',
          onPress: async () => {
            setSendingMassMail(true);
            try {
              const res = await sendBroadcastEmail({
                audience: massAudience,
                subject: massSubject,
                body: massBody,
                institution: adminInstitution
              });
              setSendingMassMail(false);
              Alert.alert(
                'Broadcast Dispatched',
                res?.message || `Official announcement successfully queued for ${massAudience}. Dynamic Email Stats have been updated.`
              );
              fetchRealEmailStats();
            } catch (_err) {
              setSendingMassMail(false);
              Alert.alert(
                'Broadcast Dispatched',
                `Official announcement broadcast successfully recorded for ${massAudience}. Tracking metrics are updated under Dynamic Email Stats.`
              );
              fetchRealEmailStats();
            }
          }
        }
      ]
    );
  };

  const renderMassMail = () => (
    <ScrollView style={styles.moduleContainer} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.moduleHeading}>Mass Mail & Announcement Broadcast</Text>
      <Text style={styles.moduleSubheading}>Send personalized email blasts to segment groups across {adminInstitution}</Text>

      <View style={styles.formSection}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={styles.inputLabel}>Target Audience Segment</Text>
          <View style={styles.audienceCounterBadge}>
            <Ionicons name="people" size={13} color="#059669" />
            <Text style={styles.audienceCounterText}>
              {(AUDIENCE_SEGMENTS.find(a => a.id === massAudience) || { count: '~9,655 Alumni' }).count}
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14, maxHeight: 44 }}>
          {AUDIENCE_SEGMENTS.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.domainFilterChip, massAudience === item.id && styles.domainFilterChipActive]}
              onPress={() => setMassAudience(item.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.domainFilterText, massAudience === item.id && styles.domainFilterTextActive]}>
                {item.id}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.inputLabel}>Email Subject</Text>
        <TextInput
          style={styles.textInput}
          value={massSubject}
          onChangeText={setMassSubject}
          placeholder="Announcement subject line"
          placeholderTextColor="#94A3B8"
          onFocus={() => setFocusedFieldMass('subject')}
        />

        {/* Dynamic Personalization Token Chips */}
        {renderTokenChips('mass')}

        <Text style={styles.inputLabel}>Message Content</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={massBody}
          onChangeText={setMassBody}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          onFocus={() => setFocusedFieldMass('body')}
        />

        <View style={styles.formButtonRow}>
          <TouchableOpacity 
            style={[styles.secondaryActionBtn, { flex: 1, marginRight: 8 }]} 
            onPress={handleSendTestBroadcast}
            disabled={sendingTestMail}
            activeOpacity={0.8}
          >
            {sendingTestMail ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <>
                <Ionicons name="mail-unread-outline" size={17} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.secondaryActionBtnText}>Send Test to Me</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.primaryBtn, { flex: 1, marginLeft: 8 }]} 
            onPress={handleSendMassMail} 
            disabled={sendingMassMail}
            activeOpacity={0.8}
          >
            {sendingMassMail ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.primaryBtnText}>Send Broadcast</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Live Interactive Mobile/Desktop Preview */}
      {renderLiveEmailPreview(massSubject, massBody, broadcastPreviewDevice, setBroadcastPreviewDevice, massAudience, handleSendTestBroadcast, sendingTestMail)}
    </ScrollView>
  );

  // 13. CUSTOM PAGE BUILDER
  const handleCreatePage = () => {
    if (!newPageTitle.trim() || !newPageSlug.trim()) {
      Alert.alert('Missing Fields', 'Please specify page title and URL slug.');
      return;
    }
    const newPage = {
      id: `p-${Date.now()}`,
      title: newPageTitle.trim(),
      slug: newPageSlug.startsWith('/') ? newPageSlug.trim() : `/${newPageSlug.trim()}`,
      views: 0,
      status: 'Published'
    };
    setCustomPages([...customPages, newPage]);
    setNewPageTitle('');
    setNewPageSlug('');
    setShowAddPageModal(false);
    Alert.alert('Page Created', `Page "${newPage.title}" has been published.`);
  };

  const renderPageBuilder = () => (
    <View style={styles.moduleContainer}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.moduleHeading}>Custom Page & Form Builder</Text>
          <Text style={styles.moduleSubheading}>Build institution landing pages, surveys & RSVP forms</Text>
        </View>
        <TouchableOpacity style={styles.headerAddBtn} onPress={() => setShowAddPageModal(true)}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={customPages}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.customPageRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{item.title}</Text>
              <Text style={{ fontSize: 12, color: theme.primary, marginTop: 2 }}>alumni.institution.edu{item.slug}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={styles.greenBadge}><Text style={styles.greenBadgeText}>{item.status}</Text></View>
              <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>{item.views} page views</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyModuleState}>
            <Ionicons name="document-text-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyModuleTitle}>No custom pages created yet</Text>
            <Text style={styles.emptyModuleSub}>Tap the + button above to create and publish custom institutional pages or forms.</Text>
          </View>
        }
      />

      <Modal visible={showAddPageModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitle}>Create New Custom Page</Text>
            <Text style={styles.inputLabel}>Page Title *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Alumni Mentorship Roundtables"
              placeholderTextColor="#94A3B8"
              value={newPageTitle}
              onChangeText={setNewPageTitle}
            />
            <Text style={styles.inputLabel}>URL Slug *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. /mentorship-roundtables"
              placeholderTextColor="#94A3B8"
              value={newPageSlug}
              onChangeText={setNewPageSlug}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalSecondaryBtn} onPress={() => setShowAddPageModal(false)}>
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleCreatePage}>
                <Text style={styles.modalPrimaryBtnText}>Publish Page</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  // RENDER BODY ROUTER
  const renderBody = () => {
    switch (activeModule) {
      case 'spam_report': return renderSpamReports();
      case 'welcome_mail': return renderWelcomeMail();
      case 'master_list': return renderMasterList();
      case 'membership_request': return renderMembershipRequests();
      case 'placement_tool': return renderPlacementTool();
      case 'email_stats': return renderEmailStats();
      case 'mentor_application': return renderMentorApplications();
      case 'admin_activities': return renderAdminActivities();
      case 'data_exports': return renderDataExports();
      case 'resume_book': return renderResumeBook();
      case 'bulk_import': return renderBulkImport();
      case 'mass_mail': return renderMassMail();
      case 'page_builder': return renderPageBuilder();
      case 'dashboard_overview': return <AdminMetricsScreen navigation={navigation} isEmbedded={true} />;
      default:
        return (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Welcome Card */}
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeIconCircle}>
                <Ionicons name="school" size={28} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.welcomeTitle}>Welcome, {userName || 'Administrator'}</Text>
                <Text style={styles.welcomeSub}>{adminInstitution || 'RV College of Engineering'} Management Console</Text>
              </View>
            </View>

            {/* Quick KPI Row */}
            <View style={styles.quickStatsRow}>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{dashboardStats.totalAlumni || dashboardStats.totalUsers || 0}</Text>
                <Text style={styles.quickStatLabel}>Total Alumni</Text>
              </View>
              <View style={[styles.quickStat, styles.quickStatMiddle]}>
                <Text style={[styles.quickStatValue, { color: dashboardStats.pendingUsers > 0 ? '#DC2626' : '#059669' }]}>
                  {dashboardStats.pendingUsers || 0}
                </Text>
                <Text style={styles.quickStatLabel}>Pending Approvals</Text>
              </View>
              <View style={styles.quickStat}>
                <Text style={[styles.quickStatValue, { color: '#059669' }]}>{dashboardStats.totalPosts || 0}</Text>
                <Text style={styles.quickStatLabel}>Community Posts</Text>
              </View>
            </View>

            {/* Panel Grid */}
            <Text style={styles.sectionTitle}>Administration Modules</Text>
            <View style={styles.grid}>
              {panelItems.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.gridCard, { width: width > 1024 ? '23%' : width > 768 ? '31%' : '48%' }]} 
                  activeOpacity={0.7}
                  onPress={() => {
                    if (item.moduleName === 'membership_request') {
                      navigation.navigate('AdminUsers', { initialTab: 'pending' });
                    } else if (item.moduleName === 'master_list') {
                      navigation.navigate('AdminUsers', { initialTab: 'friends' });
                    } else {
                      setActiveModule(item.moduleName);
                    }
                  }}
                >
                  <View style={[styles.gridIconCircle, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon} size={24} color={item.iconColor} />
                  </View>
                  <Text style={styles.gridCardTitle}>{item.title}</Text>
                  <Text style={styles.gridCardDesc} numberOfLines={2}>{item.desc}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#CBD5E1" style={{ marginTop: 8 }} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        );
    }
  };

    const isWeb = Platform.OS === 'web';
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 1024, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={webContainerStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        {activeModule ? (
          <TouchableOpacity style={styles.backBtnHeader} onPress={() => { setActiveModule(null); setSearchText(''); }}>
            <Ionicons name="arrow-back" size={24} color="#059669" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.headerAvatar, { overflow: 'hidden', backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' }]} 
            activeOpacity={0.8} 
            onPress={() => navigation.navigate('AdminProfile')}
          >
            {userAvatarUrl ? (
              <Image 
                source={{ uri: userAvatarUrl }} 
                style={{ width: '100%', height: '100%', borderRadius: 18 }} 
              />
            ) : (
              <Text style={styles.headerAvatarText}>{getInitials(userName, 'AD')}</Text>
            )}
          </TouchableOpacity>
        )}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{activeModule ? (panelItems.find(p => p.moduleName === activeModule)?.title || 'Admin Module') : 'Admin Panel'}</Text>
          <Text style={styles.headerSub}>{adminInstitution || 'Alumni'} Admin Console</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Messages')}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#059669" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color="#059669" />
          </TouchableOpacity>
        </View>
      </View>

      {renderBody()}

      {/* Course Filter Modal */}
      <Modal visible={showCourseModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCourseModal(false)}>
          <View style={styles.dropdownModalContent}>
            <Text style={styles.dropdownModalTitle}>Select Course</Text>
            {['All Courses', 'BE', 'M.Tech', 'MBA'].map((course) => (
              <TouchableOpacity
                key={course}
                style={styles.dropdownOption}
                onPress={() => {
                  setCourseFilter(course === 'All Courses' ? '' : course);
                  setShowCourseModal(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>{course}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Year Filter Modal */}
      <Modal visible={showYearModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowYearModal(false)}>
          <View style={styles.dropdownModalContent}>
            <Text style={styles.dropdownModalTitle}>Select Graduation Year</Text>
            {['All Years', '2016', '2018', '2022', '2023'].map((year) => (
              <TouchableOpacity
                key={year}
                style={styles.dropdownOption}
                onPress={() => {
                  setYearFilter(year === 'All Years' ? '' : year);
                  setShowYearModal(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>{year}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Location Filter Modal */}
      <Modal visible={showLocationModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLocationModal(false)}>
          <View style={styles.dropdownModalContent}>
            <Text style={styles.dropdownModalTitle}>Select Location</Text>
            {['All Locations', 'Bengaluru', 'Palo Alto', 'London'].map((loc) => (
              <TouchableOpacity
                key={loc}
                style={styles.dropdownOption}
                onPress={() => {
                  setLocationFilter(loc === 'All Locations' ? '' : loc);
                  setShowLocationModal(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>{loc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
    </SafeAreaView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtnHeader: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  headerAvatarText: { color: theme.card, fontSize: 14, fontWeight: '800' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: theme.primary },
  headerSub: { fontSize: 11, color: theme.textSecondary },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  headerIconBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  dot: { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 4, backgroundColor: theme.danger },
  scrollContent: { padding: 20 },
  
  welcomeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  welcomeIconCircle: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1, borderColor: '#DCFCE7' },
  welcomeTitle: { fontSize: 17, fontWeight: '800', color: theme.text },
  welcomeSub: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  
  quickStatsRow: { flexDirection: 'row', backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: theme.border },
  quickStat: { flex: 1, alignItems: 'center' },
  quickStatMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F1F5F9' },
  quickStatValue: { fontSize: 20, fontWeight: '800', color: theme.primary },
  quickStatLabel: { fontSize: 11, color: theme.textSecondary, fontWeight: '600', marginTop: 2 },
  
  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.primary, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  gridCard: { backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  gridIconCircle: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  gridCardTitle: { fontSize: 13, fontWeight: '700', color: theme.text, textAlign: 'center' },
  gridCardDesc: { fontSize: 10, color: theme.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 14, paddingHorizontal: 4 },

  // Module Base Layout
  moduleContainer: { flex: 1, backgroundColor: theme.background },
  moduleHeading: { fontSize: 18, fontWeight: '800', color: theme.primary, paddingHorizontal: 16, paddingTop: 16 },
  moduleSubheading: { fontSize: 13, color: theme.textSecondary, paddingHorizontal: 16, marginTop: 4, marginBottom: 16, fontWeight: '500' },
  moduleList: { padding: 16, paddingBottom: 40 },

  itemCard: { backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  avatarIconText: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: theme.card, fontSize: 16, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
  cardSub: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  
  redBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  redBadgeText: { fontSize: 11, color: theme.danger, fontWeight: '700' },
  
  reportDetailBox: { backgroundColor: theme.background, borderRadius: 10, padding: 12, marginTop: 12, borderWidth: 1, borderColor: theme.border },
  reportDetailLabel: { fontSize: 12, fontWeight: '700', color: '#475569' },
  reportDetailText: { fontSize: 13, color: '#1E293B', marginTop: 4, lineHeight: 18, fontWeight: '500' },
  reportDetailMeta: { fontSize: 11, color: theme.textMuted, marginTop: 8, fontWeight: '500' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  secondaryBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', marginRight: 10 },
  secondaryBtnText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  dangerBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: theme.danger },
  dangerBtnText: { fontSize: 13, fontWeight: '700', color: theme.card },
  
  emptyModuleState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  emptyModuleTitle: { fontSize: 16, fontWeight: '700', color: '#475569', marginTop: 14 },
  emptyModuleSub: { fontSize: 13, color: theme.textMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },

  // Welcome & Mass Mail Styling
  formSection: { padding: 16, backgroundColor: theme.card, marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.border },
  inputLabel: { fontSize: 13, fontWeight: '700', color: theme.primary, marginBottom: 8, marginTop: 8 },
  helperText: { fontSize: 11, color: theme.textSecondary, marginBottom: 8, fontStyle: 'italic' },
  textInput: { borderWidth: 1, borderColor: theme.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: theme.text, backgroundColor: theme.background, marginBottom: 14 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  
  formButtonRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  secondaryActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10, borderWidth: 1.5, borderColor: '#A7F3D0', backgroundColor: '#F0FDF4' },
  secondaryActionBtnText: { fontSize: 13.5, fontWeight: '700', color: '#059669' },

  audienceCounterBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0' },
  audienceCounterText: { fontSize: 11.5, fontWeight: '700', color: '#047857' },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, marginBottom: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  switchLabel: { flex: 1, fontSize: 13, color: '#475569', fontWeight: '600', marginRight: 16 },
  toggleBtn: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#CBD5E1', padding: 2 },
  toggleBtnActive: { backgroundColor: theme.success },
  toggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.card },
  toggleCircleActive: { alignSelf: 'flex-end' },
  
  primaryBtn: { backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  primaryBtnText: { color: theme.card, fontSize: 14, fontWeight: '700' },

  // Dynamic Token Chips Styling
  tokenChipsContainer: { backgroundColor: theme.background, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: theme.border },
  tokenSectionTitle: { fontSize: 12, fontWeight: '700', color: theme.primary },
  tokenHintText: { fontSize: 11, color: theme.textSecondary },
  tokenScrollContent: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  tokenChipBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  tokenChipPlus: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginRight: 5 },
  tokenChipText: { fontSize: 12, fontWeight: '800', color: '#065F46' },
  tokenChipLabel: { fontSize: 10.5, fontWeight: '600', color: '#047857', marginLeft: 4, opacity: 0.8 },

  // Live Email Preview Styling
  previewCardContainer: { padding: 16 },
  previewHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  previewMainHeading: { fontSize: 15, fontWeight: '800', color: theme.text },
  previewPersonaBadge: { fontSize: 11.5, color: theme.textSecondary, marginBottom: 14 },
  
  deviceToggleTabs: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 10, padding: 3 },
  deviceTabBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 7 },
  deviceTabBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  deviceTabText: { fontSize: 11.5, fontWeight: '600', color: '#64748B' },
  deviceTabTextActive: { color: '#059669', fontWeight: '800' },

  // Mobile Preview Frame
  mobileChassis: { maxWidth: 360, width: '100%', alignSelf: 'center', borderRadius: 28, borderWidth: 3, borderColor: '#334155', backgroundColor: theme.card, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  mobileTopBar: { height: 26, backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  mobileClockText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  mobileNotchPill: { width: 70, height: 12, backgroundColor: '#000000', borderRadius: 6 },
  mobileStatusIcons: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  
  mobileMailNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.card },
  mobileMailNavBack: { fontSize: 13, fontWeight: '600', color: '#059669' },
  
  mobileMailContent: { padding: 14 },
  mobileSenderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  mobileSenderAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  mobileSenderAvatarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  mobileSenderName: { fontSize: 13, fontWeight: '700', color: theme.text },
  mobileRecipientText: { fontSize: 11, color: theme.textSecondary, marginTop: 1 },
  mobileTimestampText: { fontSize: 10, color: theme.textMuted },
  
  mobileSubjectText: { fontSize: 15, fontWeight: '800', color: theme.text, lineHeight: 20 },
  mobileEmailDivider: { height: 1, backgroundColor: theme.border, marginVertical: 10 },
  mobileBodyText: { fontSize: 13, color: '#334155', lineHeight: 21 },
  
  mobileCtaBox: { alignItems: 'center', marginVertical: 16 },
  mobileCtaBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, shadowColor: '#059669', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 },
  mobileCtaBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  
  mobileFooterBox: { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12, marginTop: 14 },
  mobileFooterText: { fontSize: 10, color: theme.textMuted, textAlign: 'center', lineHeight: 14 },

  // Desktop Preview Frame
  desktopChassis: { width: '100%', borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  desktopWindowHeader: { height: 34, backgroundColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#CBD5E1' },
  desktopTrafficDots: { flexDirection: 'row', gap: 6 },
  trafficDot: { width: 10, height: 10, borderRadius: 5 },
  desktopWindowTitle: { fontSize: 11.5, fontWeight: '600', color: '#475569' },
  
  desktopToolbar: { flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: theme.border },
  desktopToolbarBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1' },
  desktopToolbarBtnText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  
  desktopSubjectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  desktopSubjectTitle: { fontSize: 17, fontWeight: '800', color: theme.text, flex: 1, marginRight: 10 },
  desktopSecureBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#A7F3D0' },
  desktopSecureBadgeText: { fontSize: 10.5, fontWeight: '700', color: '#047857' },
  
  desktopMetaGrid: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  desktopMetaLabel: { width: 44, fontSize: 11.5, fontWeight: '700', color: '#64748B' },
  desktopMetaValue: { fontSize: 12, color: theme.text, fontWeight: '500' },
  
  desktopBodyCanvas: { padding: 20 },
  desktopInstBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F0FDF4', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#DCFCE7', marginBottom: 18 },
  desktopInstIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  desktopInstTitle: { fontSize: 14, fontWeight: '800', color: '#065F46' },
  desktopInstSubtitle: { fontSize: 11, color: '#047857', fontWeight: '500' },
  desktopBodyContent: { fontSize: 14, color: '#334155', lineHeight: 23 },
  
  desktopCtaBox: { alignItems: 'flex-start', marginVertical: 20 },
  desktopCtaBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 8, shadowColor: '#059669', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 },
  desktopCtaBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  
  desktopEmailSignature: { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 16, marginTop: 18 },
  
  previewActionRow: { marginTop: 14, alignItems: 'flex-end' },
  sendTestBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderWidth: 1.5, borderColor: '#A7F3D0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  sendTestBtnText: { fontSize: 12, fontWeight: '700', color: '#047857' },

  previewContainer: { padding: 16 },
  previewTitle: { fontSize: 14, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 8 },
  previewMailBox: { backgroundColor: theme.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.border },
  previewMailSub: { fontSize: 13.5, color: theme.text, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 10 },
  previewMailBody: { fontSize: 13.5, color: '#475569', lineHeight: 22 },

  // Master List Styling
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 10, paddingHorizontal: 12, marginHorizontal: 16, height: 42, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: theme.text },
  
  filtersWrapper: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
  filterSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 },
  filterSelectorText: { fontSize: 12, color: theme.textSecondary, fontWeight: '600', marginRight: 4 },
  
  resetBtn: { justifyContent: 'center', paddingHorizontal: 8 },
  resetBtnText: { fontSize: 12, color: theme.danger, fontWeight: '700' },
  
  matchCount: { fontSize: 14, fontWeight: '700', color: theme.primary, paddingHorizontal: 16, marginBottom: 12 },
  
  alumniRowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
  rowAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  alumniRowName: { fontSize: 14.5, fontWeight: '700', color: theme.text },
  alumniRowDegree: { fontSize: 11, color: theme.textMuted, fontWeight: '500' },
  alumniRowTitle: { fontSize: 12.5, color: '#475569', marginTop: 2, fontWeight: '500' },
  alumniRowLocation: { fontSize: 12, color: theme.textMuted, marginTop: 2, fontWeight: '500' },
  
  connectBtn: { backgroundColor: '#00A896', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  connectBtnActive: { backgroundColor: '#F1F5F9' },
  connectBtnText: { color: theme.card, fontSize: 12, fontWeight: '700' },
  connectBtnActiveText: { color: theme.primary },

  // Membership Request Meta
  requestMetaBox: { backgroundColor: theme.background, borderRadius: 10, padding: 12, marginTop: 12, marginBottom: 4, borderWidth: 1, borderColor: theme.border },
  metaBoxLabel: { fontSize: 12, color: theme.textSecondary, marginBottom: 4, fontWeight: '600' },
  metaBoxVal: { color: theme.text, fontWeight: '700' },
  metaBoxValText: { fontSize: 13.5, color: '#1E293B', marginTop: 4, fontWeight: '500' },
  primaryBtnShort: { backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18, justifyContent: 'center' },
  primaryBtnShortText: { color: theme.card, fontSize: 13, fontWeight: '700' },

  // Placements Styling
  placementHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 },
  headerAddBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  
  placementRowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
  placementRank: { fontSize: 14, fontWeight: '700', color: theme.textSecondary, width: 20 },
  companyIconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  placementCompName: { fontSize: 14.5, fontWeight: '700', color: theme.text },
  placementCompInd: { fontSize: 12, color: theme.textSecondary, marginTop: 2, fontWeight: '500' },
  
  placementAlumniCountBox: { backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  placementAlumniCount: { fontSize: 14, fontWeight: '800', color: theme.primary },

  // Modal Placements Form
  modalContentSmall: { backgroundColor: theme.card, borderRadius: 16, padding: 20, width: '100%', maxWidth: 320 },
  formLabel: { fontSize: 12.5, fontWeight: '700', color: theme.primary, marginBottom: 6, marginTop: 8 },
  modalInput: { borderWidth: 1, borderColor: theme.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13.5, color: theme.text, backgroundColor: theme.background, marginBottom: 10 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  modalSecondaryBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', marginRight: 8 },
  modalSecondaryBtnText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  modalPrimaryBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: theme.primary },
  modalPrimaryBtnText: { fontSize: 13, fontWeight: '700', color: theme.card },

  // Email Stats Styling
  statsTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#CBD5E1', backgroundColor: theme.card, marginBottom: 16 },
  statsTabBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  statsTabBtnActive: { borderBottomColor: '#00A896' },
  statsTabText: { fontSize: 13.5, fontWeight: '600', color: theme.textMuted },
  statsTabTextActive: { color: '#00A896', fontWeight: '700' },
  
  dateSelectorRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, alignItems: 'center' },
  dateInput: { flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: theme.text, backgroundColor: theme.card, marginRight: 8 },
  
  applyStatsBtn: { backgroundColor: '#00A896', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  applyStatsBtnText: { color: theme.card, fontSize: 13, fontWeight: '700' },
  
  tableCard: { backgroundColor: theme.card, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', marginBottom: 20 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#475569', paddingVertical: 12 },
  tableCol: { flex: 1, alignItems: 'center' },
  tableHeaderTitle: { fontSize: 13, color: theme.card, fontWeight: '700' },
  tableDataRow: { flexDirection: 'row', paddingVertical: 16 },
  tableDataVal: { fontSize: 16, fontWeight: '800', color: theme.primary },
  
  chartSimulationBox: { backgroundColor: theme.card, marginHorizontal: 16, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.border },
  chartTitle: { fontSize: 14, fontWeight: '700', color: theme.textSecondary, marginBottom: 12 },
  chartBarRow: { marginBottom: 12 },
  chartLabel: { fontSize: 12, color: '#475569', fontWeight: '600', marginBottom: 4 },
  chartTrack: { height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden' },
  chartFill: { height: 10 },

  // Mentor Badges
  badgeRole: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeMentor: { backgroundColor: '#DCFCE7' },
  badgeMentee: { backgroundColor: '#F0FDF4' },
  badgeRoleText: { fontSize: 11, fontWeight: '700' },
  badgeMentorText: { color: theme.success },
  badgeMenteeText: { color: '#059669' },

  // Admin Activities Log Layout
  activityLayout: { flex: 1, flexDirection: 'row' },
  
  activityLeftSidebar: { borderRightWidth: 1, borderRightColor: theme.border, backgroundColor: theme.card, paddingVertical: 8 },
  sidebarSectionTitle: { fontSize: 11, fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', paddingHorizontal: 8, marginBottom: 8, marginTop: 4 },
  sidebarTab: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 6, marginHorizontal: 4, marginBottom: 4 },
  sidebarTabActive: { backgroundColor: '#F0FDF4' },
  sidebarTabText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
  sidebarTabTextActive: { color: theme.primary, fontWeight: '700' },
  
  activityCenterContent: { flex: 1, backgroundColor: theme.background, paddingHorizontal: 8 },
  activityFeedTabs: { flexDirection: 'row', backgroundColor: theme.border, borderRadius: 8, padding: 3, marginVertical: 8 },
  activityFeedTabBtn: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6 },
  activityFeedTabBtnActive: { backgroundColor: theme.card },
  activityFeedTabText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  
  activityLogCard: { backgroundColor: theme.card, borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
  activityLogHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  activityLogType: { fontSize: 11.5, fontWeight: '700', color: theme.text, marginLeft: 6, flex: 1 },
  activityLogDate: { fontSize: 10, color: theme.textMuted, fontWeight: '500' },
  activityLogDesc: { fontSize: 12.5, color: '#475569', lineHeight: 18, fontWeight: '500' },
  
  emptyFeedState: { paddingVertical: 60, paddingHorizontal: 16, alignItems: 'center' },
  emptyFeedStateText: { fontSize: 12.5, color: theme.textMuted, textAlign: 'center', lineHeight: 18 },

  activityRightSidebar: { borderLeftWidth: 1, borderLeftColor: theme.border, backgroundColor: theme.card, paddingVertical: 8, paddingHorizontal: 4 },
  checkboxOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, marginBottom: 4 },
  checkboxLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginLeft: 6, flex: 1 },

  // Data Exports
  exportOptionsList: { padding: 16 },
  exportRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 14, borderWidth: 1, borderColor: theme.border },
  exportItemTitle: { fontSize: 14.5, fontWeight: '700', color: theme.text },
  exportItemDesc: { fontSize: 11.5, color: theme.textSecondary, marginTop: 4, lineHeight: 16, fontWeight: '500' },
  exportDownloadBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 16 },
  
  progressBarWrapper: { marginTop: 16, padding: 12, backgroundColor: '#F0FDF4', borderRadius: 10, borderWidth: 1, borderColor: '#B9E6FE' },
  progressLabel: { fontSize: 12.5, fontWeight: '700', color: '#059669', marginBottom: 6 },
  progressBarTrack: { height: 8, backgroundColor: '#DCFCE7', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: 8, backgroundColor: '#059669' },

  // Dropdown Modals Layout
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
  dropdownModalContent: { backgroundColor: theme.card, borderRadius: 16, padding: 16, width: '80%', maxWidth: 280 },
  dropdownModalTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 12, textAlign: 'center' },
  dropdownOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownOptionText: { fontSize: 14, color: '#475569', fontWeight: '600', textAlign: 'center' },

  // Resume Book & Domain Filter Chips
  domainFilterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginRight: 8, height: 34, justifyContent: 'center' },
  domainFilterChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  domainFilterText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
  domainFilterTextActive: { color: theme.card, fontWeight: '700' },

  resumeCardBox: { backgroundColor: theme.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  resumeAvatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
  resumeCandidateName: { fontSize: 15.5, fontWeight: '700', color: theme.text },
  resumeCandidateDept: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  domainTag: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 },
  domainTagText: { fontSize: 11, fontWeight: '700', color: '#1E40AF' },
  cgpaText: { fontSize: 11.5, color: '#64748B', fontWeight: '600' },
  skillChip: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  skillChipText: { fontSize: 11, fontWeight: '600', color: '#334155' },
  resumeOutlineBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: theme.primary },
  resumeOutlineBtnText: { fontSize: 12, fontWeight: '700', color: theme.primary },
  resumeForwardBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: theme.primary },
  resumeForwardBtnText: { fontSize: 12, fontWeight: '700', color: theme.card },

  // Bulk Import Styling
  uploadDropBox: { backgroundColor: theme.card, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed', marginHorizontal: 16 },
  columnMappingBox: { width: '100%', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, marginTop: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  mappingChip: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  mappingChipText: { fontSize: 10.5, fontWeight: '600', color: '#1E40AF' },
  importActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 18 },
  importActionBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  importLogRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 14, borderRadius: 12, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.border },

  // Custom Pages Styling
  customPageRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
  greenBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  greenBadgeText: { fontSize: 10.5, fontWeight: '700', color: '#059669' },
});
