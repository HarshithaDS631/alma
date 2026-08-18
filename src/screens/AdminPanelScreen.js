import React, { useState, useEffect } from 'react';
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
  useWindowDimensions, Platform} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AdminMetricsScreen from './AdminMetricsScreen';
import { getActivityLogs, getEmailStats } from '../services/adminService';

// ==========================================
// DUMMY DATA FOR THE NEW MODULES
// ==========================================

const INITIAL_SPAM_REPORTS = [];

const INITIAL_ALUMNI_MASTER = [];

const INITIAL_MEMBERSHIP_REQUESTS = [];

const INITIAL_PLACEMENTS = [];

const INITIAL_MENTOR_APPLICATIONS = [];

const INITIAL_ACTIVITIES = [];

const panelItems = [
  { id: '1', title: 'Dashboard Overview', icon: 'pie-chart-outline', color: '#EEF2FF', iconColor: '#4F46E5', moduleName: 'dashboard_overview', desc: 'High-level metrics and quick actions' },
  { id: '2', title: 'Membership Request', icon: 'checkbox-outline', color: '#FEF3C7', iconColor: '#D97706', moduleName: 'membership_request', desc: 'Approve or reject pending signups' },
  { id: '3', title: 'Placement Tool', icon: 'briefcase-outline', color: '#FAF5FF', iconColor: '#9333EA', moduleName: 'placement_tool', desc: 'Track companies employing alumni' },
  { id: '4', title: 'Mentor Application', icon: 'git-pull-request-outline', color: '#FFF7ED', iconColor: '#EA580C', moduleName: 'mentor_application', desc: 'Approve mentor and mentee requests' },
  { id: '5', title: 'Welcome Mail', icon: 'mail-open-outline', color: '#F0F9FF', iconColor: '#0284C7', moduleName: 'welcome_mail', desc: 'Set automated welcomes for new joiners' },
  { id: '6', title: 'Spam/Report', icon: 'flag-outline', color: '#FFF5F5', iconColor: '#E53E3E', moduleName: 'spam_report', desc: 'Accounts flagged for spam or abuse' },
  { id: '7', title: 'Dynamic Email Stats', icon: 'analytics-outline', color: '#ECFDF5', iconColor: '#059669', moduleName: 'email_stats', desc: 'Track invite and custom mail open rates' },
  { id: '8', title: 'Data Exports', icon: 'download-outline', color: '#EFF6FF', iconColor: '#3B82F6', moduleName: 'data_exports', desc: 'Export verified alumni directory to CSV' },
];

export default function AdminPanelScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { width } = useWindowDimensions();
  // Navigation & View Control
  const [activeModule, setActiveModule] = useState(null);

  // Admin User Info
  const [adminEmail, setAdminEmail] = useState('web.rsst@rvei.edu.in');
  const [adminInstitution, setAdminInstitution] = useState('Mediacell');

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

  // Welcome Mail States
  const [mailSubject, setMailSubject] = useState('Welcome to the Mediacell Alumni Community!');
  const [mailBody, setMailBody] = useState(
    'Hi {alumni_name},\n\nWelcome to the official alumni platform of Mediacell! We are thrilled to have you join us. Stay connected with fellow batchmates, share job opportunities, and engage in mentorship programs.\n\nWarm regards,\nMediacell Alumni Association'
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

  useEffect(() => {
    const loadAdminDetails = async () => {
      try {
        const userInfoStr = await AsyncStorage.getItem('userInfo');
        if (userInfoStr) {
          const parsed = JSON.parse(userInfoStr);
          const email = parsed.email || 'web.rsst@rvei.edu.in';
          const inst = parsed.institution || 
            (email.toLowerCase().includes('mediacell') || email.toLowerCase().includes('web.rsst') ? 'Mediacell' : 'Mediacell');
          setAdminEmail(email);
          setAdminInstitution(inst);
          setMailSubject(`Welcome to the ${inst} Alumni Community!`);
          setMailBody(`Hi {alumni_name},\n\nWelcome to the official alumni platform of ${inst}! We are thrilled to have you join us. Stay connected with fellow batchmates, share job opportunities, and engage in mentorship programs.\n\nWarm regards,\n${inst} Alumni Association`);
        }
      } catch (e) {}
    };
    loadAdminDetails();
  }, []);

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

  useEffect(() => {
    if (activeModule === 'admin_activities') {
      fetchMongoLogs();
    } else if (activeModule === 'email_stats') {
      fetchRealEmailStats(emailTab);
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
          onPress: () => {
            setSpamReports(spamReports.filter((r) => r.id !== id));
            Alert.alert('Suspended', 'The account has been suspended successfully.');
          },
        },
      ]);
    } else {
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
        />

        <Text style={styles.inputLabel}>Email Body Template</Text>
        <Text style={styles.helperText}>Use variable tags: {"{alumni_name}"}, {"{graduation_year}"}, {"{institution}"}</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={mailBody}
          onChangeText={setMailBody}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
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

        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={() => Alert.alert('Saved', 'Welcome mail template updated successfully!')}
        >
          <Ionicons name="save-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>Save Template</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Live Preview</Text>
        <View style={styles.previewMailBox}>
          <Text style={styles.previewMailSub}><Text style={{ fontWeight: '700' }}>Subject:</Text> {mailSubject}</Text>
          <Text style={styles.previewMailBody}>
            {mailBody
              .replace('{alumni_name}', 'Alumni Member')
              .replace('{graduation_year}', '2026')
              .replace('{institution}', adminInstitution)}
          </Text>
        </View>
      </View>
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

      <Text style={styles.matchCount}>{filteredAlumni.length} RVians found</Text>

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
          <Text style={styles.moduleHeading}>Companies where RVians are Working</Text>
          <Text style={styles.moduleSubheading}>Explore the placement distribution of your institution</Text>
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
              <Ionicons name="business" size={18} color="#003366" />
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
              <View style={[styles.chartFill, { width: `${clickRatePercent}%`, backgroundColor: '#3B82F6' }]} />
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
                    backgroundColor: item.method === 'POST' ? '#3B82F6' : item.method === 'PUT' ? '#F59E0B' : item.method === 'DELETE' ? '#EF4444' : '#10B981',
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
                <Text style={{ fontSize: 11, fontWeight: '700', color: item.status < 400 ? '#10B981' : '#EF4444' }}>
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
      case 'dashboard_overview': return <AdminMetricsScreen navigation={navigation} isEmbedded={true} />;
      default:
        return (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Welcome Card */}
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeIconCircle}>
                <Ionicons name="shield-checkmark" size={28} color="#003366" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.welcomeTitle}>Welcome, Institution Admin</Text>
                <Text style={styles.welcomeSub}>Institution Management Console</Text>
              </View>
            </View>

            {/* Panel Grid */}
            <Text style={styles.sectionTitle}>Management Modules</Text>
            <View style={styles.grid}>
              {panelItems.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.gridCard, { width: width > 1024 ? '23%' : width > 768 ? '31%' : '48%' }]} 
                  activeOpacity={0.7}
                  onPress={() => setActiveModule(item.moduleName)}
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
            <Ionicons name="arrow-back" size={24} color="#003366" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.headerAvatar} activeOpacity={0.8} onPress={() => navigation.navigate('AdminProfile')}>
            <Text style={styles.headerAvatarText}>AD</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{activeModule ? panelItems.find(p => p.moduleName === activeModule).title : 'Admin Panel'}</Text>
          <Text style={styles.headerSub}>Admin Portal</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Messages')}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#003366" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color="#003366" />
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
  welcomeIconCircle: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1, borderColor: '#E0F2FE' },
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

  // Welcome Mail Styling
  formSection: { padding: 16, backgroundColor: theme.card, marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.border },
  inputLabel: { fontSize: 13, fontWeight: '700', color: theme.primary, marginBottom: 8, marginTop: 8 },
  helperText: { fontSize: 11, color: theme.textSecondary, marginBottom: 8, fontStyle: 'italic' },
  textInput: { borderWidth: 1, borderColor: theme.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: theme.text, backgroundColor: theme.background, marginBottom: 14 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, marginBottom: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  switchLabel: { flex: 1, fontSize: 13, color: '#475569', fontWeight: '600', marginRight: 16 },
  toggleBtn: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#CBD5E1', padding: 2 },
  toggleBtnActive: { backgroundColor: theme.success },
  toggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.card },
  toggleCircleActive: { alignSelf: 'flex-end' },
  
  primaryBtn: { backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  primaryBtnText: { color: theme.card, fontSize: 14, fontWeight: '700' },
  
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
  rowAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
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
  companyIconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
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
  badgeMentor: { backgroundColor: '#ECFDF5' },
  badgeMentee: { backgroundColor: '#EFF6FF' },
  badgeRoleText: { fontSize: 11, fontWeight: '700' },
  badgeMentorText: { color: theme.success },
  badgeMenteeText: { color: '#3B82F6' },

  // Admin Activities Log Layout
  activityLayout: { flex: 1, flexDirection: 'row' },
  
  activityLeftSidebar: { borderRightWidth: 1, borderRightColor: theme.border, backgroundColor: theme.card, paddingVertical: 8 },
  sidebarSectionTitle: { fontSize: 11, fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', paddingHorizontal: 8, marginBottom: 8, marginTop: 4 },
  sidebarTab: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 6, marginHorizontal: 4, marginBottom: 4 },
  sidebarTabActive: { backgroundColor: '#EFF6FF' },
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
  
  progressBarWrapper: { marginTop: 16, padding: 12, backgroundColor: '#F0F9FF', borderRadius: 10, borderWidth: 1, borderColor: '#B9E6FE' },
  progressLabel: { fontSize: 12.5, fontWeight: '700', color: '#0284C7', marginBottom: 6 },
  progressBarTrack: { height: 8, backgroundColor: '#E0F2FE', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: 8, backgroundColor: '#0284C7' },

  // Dropdown Modals Layout
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
  dropdownModalContent: { backgroundColor: theme.card, borderRadius: 16, padding: 16, width: '80%', maxWidth: 280 },
  dropdownModalTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 12, textAlign: 'center' },
  dropdownOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownOptionText: { fontSize: 14, color: '#475569', fontWeight: '600', textAlign: 'center' },
});
