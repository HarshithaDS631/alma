import React, { useState, useMemo, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getPendingUsers, approveUser, rejectUser } from '../services/adminService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendWelcomeEmail } from '../lib/sendgrid';

const RVCE_VERIFICATION_DB = [];

const checkDatabaseVerification = (name, batchYear, joiningYear, institution) => {
  if (!name) return { verified: false, reason: 'Name is missing' };
  const cleanName = name.toLowerCase().trim();
  
  let dbToSearch = [];
  if (institution === 'RV College of Engineering' || institution === 'RVCE') {
    dbToSearch = RVCE_VERIFICATION_DB;
  } else {
    return { verified: false, reason: 'No database record' };
  }

  const match = dbToSearch.find(
    (item) => item.name.toLowerCase().trim() === cleanName
  );

  if (!match) {
    return { verified: false, reason: 'No database record' };
  }
  
  if (batchYear && match.leaving !== batchYear.toString().trim()) {
    return { verified: false, reason: `Yr mismatch (Exp ${match.leaving}, got ${batchYear})` };
  }
  
  if (joiningYear && match.joining !== joiningYear.toString().trim()) {
    return { verified: false, reason: `Yr mismatch (Exp ${match.joining}, got ${joiningYear})` };
  }
  
  return { verified: true, matchRecord: match };
};

const FRIENDS_DATA = [];
const COMMUNITIES_DATA = [];

const AVATAR_COLORS = ['#003366', '#0F172A', '#1E3A5F', '#2C5282', '#1A365D', '#2D3748'];

const BATCH_OPTIONS = ['All', '2015', '2017', '2018', '2019', '2020', '2021', '2022', '2023'];
const BRANCH_OPTIONS = ['All', 'CSE', 'ECE', 'ISE', 'MBA', 'ME', 'EEE'];
const DEPT_OPTIONS = ['All', 'Computer Science', 'Electronics', 'Information Science', 'Mechanical', 'Electrical', 'Management'];
const LOC_OPTIONS = ['All', 'Bengaluru', 'Hyderabad', 'Mumbai', 'Remote'];
const COURSE_OPTIONS = ['All', 'B.E.', 'M.Tech', 'MCA', 'MBA'];

const AdminUsersScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const isSuperAdmin = route?.params?.isSuperAdmin || false;
  const isFocused = useIsFocused();
  const [selectedInstitution, setSelectedInstitution] = useState(global.selectedInstitution || 'All');
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [communities, setCommunities] = useState(COMMUNITIES_DATA);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [adminInstitution, setAdminInstitution] = useState('All');
  const [sheetMatches, setSheetMatches] = useState({});
  const [checkingMatch, setCheckingMatch] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadAdminInfo = async () => {
      try {
        const infoStr = await AsyncStorage.getItem('userInfo');
        if (infoStr) {
          const info = JSON.parse(infoStr);
          if (info && info.role === 'superadmin') {
            setAdminInstitution('All');
          } else if (info && info.institution) {
            setAdminInstitution(info.institution);
            setSelectedInstitution(info.institution);
          }
        }
      } catch (err) {
        console.error('Error loading admin info:', err);
      }
    };
    loadAdminInfo();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const data = await getPendingUsers(adminInstitution !== 'All' ? adminInstitution : undefined);
      setPendingUsers(data || []);
    } catch (err) {
      console.error('Error fetching pending users:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingUsers();
    setRefreshing(false);
  };

  useEffect(() => {
    let interval;
    if (isFocused && activeTab === 'pending') {
      fetchPendingUsers();
      // Poll every 10 seconds silently
      interval = setInterval(() => {
        fetchPendingUsers();
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFocused, activeTab, adminInstitution]);

  const handleCheckMatch = async (userId) => {
    if (!userId || userId === 'undefined') {
      alert('User ID is invalid for sheet match lookup.');
      return;
    }
    try {
      setCheckingMatch(prev => ({ ...prev, [userId]: true }));
      const { checkMatch } = require('../services/adminService');
      const response = await checkMatch(userId);
      const matchesFound = response && response.matches ? response.matches : [];
      setSheetMatches(prev => ({ ...prev, [userId]: matchesFound }));
      if (matchesFound.length === 0) {
        alert('No matching record found in official roster sheet data.');
      }
    } catch (err) {
      alert('Error checking sheet match: ' + (err.message || 'Server error'));
    } finally {
      setCheckingMatch(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleApprove = async (userId) => {
    try {
      await approveUser(userId);
      
      const approvedUser = pendingUsers.find(u => u._id === userId);
      if (approvedUser && approvedUser.email) {
        await sendWelcomeEmail(approvedUser.email, approvedUser.name || 'Alumnus');
      }

      setPendingUsers(prev => prev.filter(u => u._id !== userId));
      alert('User approved successfully. Welcome email triggered.');
    } catch (err) {
      alert('Error approving user: ' + err.message);
    }
  };

  const handleReject = async (userId) => {
    try {
      await rejectUser(userId);
      setPendingUsers(prev => prev.filter(u => u._id !== userId));
      alert('User rejected and removed.');
    } catch (err) {
      alert('Error rejecting user: ' + err.message);
    }
  };

  // Filters state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedLoc, setSelectedLoc] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');

  useEffect(() => {
    if (isFocused && isSuperAdmin && global.selectedInstitution) {
      setSelectedInstitution(global.selectedInstitution);
    }
  }, [isFocused, isSuperAdmin]);

  const handleResetAll = () => {
    setSelectedBatch('All');
    setSelectedBranch('All');
    setSelectedDept('All');
    setSelectedLoc('All');
    setSelectedCourse('All');
    if (isSuperAdmin) {
      setSelectedInstitution('All');
      global.selectedInstitution = 'All';
    }
  };

  const filteredFriends = useMemo(() => {
    let data = FRIENDS_DATA;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      data = data.filter((friend) =>
        friend.name.toLowerCase().includes(query)
      );
    }

    if (selectedBatch !== 'All') {
      data = data.filter((friend) => friend.batch === selectedBatch);
    }

    if (selectedBranch !== 'All') {
      data = data.filter((friend) => friend.branch === selectedBranch);
    }

    if (selectedDept !== 'All') {
      data = data.filter((friend) => friend.department === selectedDept);
    }

    if (selectedLoc !== 'All') {
      data = data.filter((friend) => friend.location === selectedLoc);
    }

    if (selectedCourse !== 'All') {
      data = data.filter((friend) => friend.course === selectedCourse);
    }

    if (isSuperAdmin && selectedInstitution !== 'All') {
      data = data.filter((friend) => friend.institution === selectedInstitution);
    }

    return data;
  }, [searchQuery, selectedBatch, selectedBranch, selectedDept, selectedLoc, selectedCourse, isSuperAdmin, selectedInstitution]);

  const filteredPendingUsers = useMemo(() => {
    let data = pendingUsers;
    if (isSuperAdmin && selectedInstitution !== 'All') {
      data = data.filter(u => {
        if (!u.institution) return false;
        if (u.institution === selectedInstitution) return true;
        
        const instMap = {
          'RVCE': 'RV College of Engineering',
          'RVITM': 'RV Institute of Technology and Management',
          'RVSK': 'RV-Skills',
          'RVCA': 'RV College of Architecture',
          'RVIM': 'RV Institute of Management',
          'RVILS': 'MKPM RV Institute of Legal Studies',
          'RVTC': 'RV Teachers College',
          'DAPMRV': 'D.A. Pandu Memorial RV Dental College',
          'RVCP': 'RV College of Physiotherapy',
          'RVCN': 'RV College of Nursing',
          'NMKRV': 'NMKRV College',
          'SSMRV': 'SSMRV College',
          'RVU_BLR': 'RV University, Bengaluru Campus',
          'RVU_MYS': 'RV University, Mysuru Campus',
          'RVS': 'RV School',
          'RVGHS': 'RV Girls High School',
          'RVPS': 'RV Public School',
          'RVLH': 'RV Learning Hub',
          'SSMRVPU': 'SSMRV PU College',
          'NMKRVPU': 'NMKRV PU College',
          'RVPU_JAY': 'RV PU College Jayanagar',
          'RVPU_NOR': 'RV PU College North',
          'RVPU_SOU': 'RV PU College South',
          'RVPU_ECI': 'RV PU College, E-City',
          'RVPU_HAR': 'RV PU College, Harohalli',
          'RVPU_MYS': 'RV PU College, Mysuru'
        };
        return instMap[selectedInstitution] === u.institution;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      data = data.filter(u => u.name && u.name.toLowerCase().includes(q));
    }
    return data;
  }, [pendingUsers, selectedInstitution, searchQuery, isSuperAdmin]);

  const filteredCommunities = useMemo(() => {
    let data = communities;
    if (isSuperAdmin && selectedInstitution !== 'All') {
      data = data.filter((comm) => comm.institution === selectedInstitution);
    }
    return data;
  }, [communities, isSuperAdmin, selectedInstitution]);

  const handleToggleJoin = (communityId) => {
    setCommunities((prev) =>
      prev.map((community) =>
        community.id === communityId
          ? { ...community, joined: !community.joined }
          : community
      )
    );
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedBatch !== 'All') count++;
    if (selectedBranch !== 'All') count++;
    if (selectedDept !== 'All') count++;
    if (selectedLoc !== 'All') count++;
    if (selectedCourse !== 'All') count++;
    if (isSuperAdmin && selectedInstitution !== 'All') count++;
    return count;
  }, [selectedBatch, selectedBranch, selectedDept, selectedLoc, selectedCourse, isSuperAdmin, selectedInstitution]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={[styles.headerAvatar, isSuperAdmin && { backgroundColor: '#D97706' }]}
        onPress={() => navigation && navigation.navigate('AdminProfile')}
      >
        <Text style={styles.headerAvatarText}>{isSuperAdmin ? 'SA' : 'AD'}</Text>
      </TouchableOpacity>
      <View style={styles.headerSearchContainer}>
        <Ionicons name="search-outline" size={18} color="#94A3B8" style={styles.headerSearchIcon} />
        <TextInput
          style={styles.headerSearchInput}
          placeholder="Search users..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.headerIconBtn} 
          activeOpacity={0.7}
          onPress={() => navigation && navigation.navigate('Messages')}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={22} color="#003366" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerIconBtn} 
          activeOpacity={0.7}
          onPress={() => navigation && navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={22} color="#003366" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
        onPress={() => setActiveTab('friends')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
          Alumni Directory
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'community' && styles.tabActive]}
        onPress={() => setActiveTab('community')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, activeTab === 'community' && styles.tabTextActive]}>
          Community
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
        onPress={() => setActiveTab('pending')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
          Pending ({filteredPendingUsers.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPendingItem = ({ item }) => {
    const userId = item._id || item.id;
    const batchYear = item.batch_year || item.batchYear || item.leavingYear;
    const joiningYear = item.joining_year || item.joiningYear;
    const matches = sheetMatches[userId] || [];
    const isChecking = checkingMatch[userId];
    
    return (
      <View style={styles.friendCard}>
        <View style={[styles.friendAvatar, { backgroundColor: theme.warning }]}>
          <Text style={styles.friendAvatarText}>{item.name ? item.name.substring(0,2).toUpperCase() : 'UU'}</Text>
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name || 'Unknown'}</Text>
          <Text style={styles.friendDetail}>{item.department || 'No Dept'} • Batch {batchYear || 'N/A'}</Text>
          <Text style={styles.friendDetailSub}>{item.institution || 'No Institution'} • {item.email}</Text>
          {joiningYear && (
            <Text style={styles.friendDetailSub}>Joining Year: {joiningYear}</Text>
          )}
          
          <View style={{ marginTop: 6 }}>
            {!matches.length ? (
              <TouchableOpacity 
                style={{ backgroundColor: '#E1EFFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}
                onPress={() => handleCheckMatch(userId)}
                disabled={isChecking}
              >
                <Ionicons name="search" size={13} color="#1E40AF" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 11, color: '#1E40AF', fontWeight: '700' }}>
                  {isChecking ? 'Checking...' : 'Check Sheet Data'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ backgroundColor: '#DEF7EC', padding: 8, borderRadius: 8, marginTop: 4 }}>
                <Text style={{ fontSize: 11, color: '#03543F', fontWeight: '700', marginBottom: 2 }}>Suggested Matches:</Text>
                {matches.map((m, idx) => (
                  <Text key={idx} style={{ fontSize: 11, color: '#03543F' }}>
                    • {m.name} ({m.joiningYear} - {m.leavingYear})
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
          <TouchableOpacity 
            style={[styles.messageBtn, { backgroundColor: theme.success, borderColor: theme.success }]} 
            onPress={() => handleApprove(item._id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.messageBtnText, { color: '#FFF' }]}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.messageBtn, { borderColor: theme.danger }]} 
            onPress={() => handleReject(item._id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.messageBtnText, { color: theme.danger }]}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFriendItem = ({ item, index }) => (
    <View style={styles.friendCard}>
      <View style={[styles.friendAvatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
        <Text style={styles.friendAvatarText}>{item.avatar}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendDetail}>{item.branch} • Batch {item.batch}</Text>
        <Text style={styles.friendDetailSub}>{item.course} • {item.location}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TouchableOpacity 
          style={styles.messageBtn} 
          activeOpacity={0.7}
          onPress={() => navigation && navigation.navigate('Chat', { 
            user: { 
              id: item._id || item.id,
              name: item.name, 
              role: item.institution || `${item.branch} • Batch ${item.batch}` || '', 
              initials: item.avatar || (item.name || '?').charAt(0).toUpperCase()
            } 
          })}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#003366" />
          <Text style={styles.messageBtnText}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.messageBtn, { borderColor: '#FECACA', backgroundColor: '#FEF2F2', paddingHorizontal: 10 }]} 
          activeOpacity={0.7}
          onPress={() => {
            Alert.alert(
              'Delete Alumni Account',
              `Are you sure you want to permanently delete ${item.name}'s account as Admin authority?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete Account', 
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('Account Deleted', `${item.name}'s alumni account has been removed by Admin authority.`);
                  }
                }
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={16} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCommunityItem = ({ item }) => (
    <View style={styles.communityCard}>
      <View style={styles.communityIcon}>
        <Ionicons name={item.icon} size={24} color="#003366" />
      </View>
      <View style={styles.communityInfo}>
        <Text style={styles.communityName}>{item.name}</Text>
        <Text style={styles.communityMembers}>{item.members} members</Text>
      </View>
      <TouchableOpacity
        style={[styles.joinBtn, item.joined && styles.joinedBtn]}
        onPress={() => handleToggleJoin(item.id)}
        activeOpacity={0.7}
      >
        {item.joined && (
          <Ionicons name="checkmark" size={14} color="#FFFFFF" style={styles.joinedIcon} />
        )}
        <Text style={[styles.joinBtnText, item.joined && styles.joinedBtnText]}>
          {item.joined ? 'Joined' : 'Join'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyFriends = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={56} color="#94A3B8" />
      <Text style={styles.emptyTitle}>No users found</Text>
      <Text style={styles.emptySubtitle}>Try a different search or clear filters</Text>
    </View>
  );

    const isWeb = Platform.OS === 'web';
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 1024, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={webContainerStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="#FFFFFF" />
      {renderHeader()}
      {renderTabs()}

      {activeTab === 'friends' && (
        <View style={styles.filterSummaryBar}>
          <Text style={styles.filterSummaryText}>
            Showing {filteredFriends.length} students
          </Text>
          <TouchableOpacity 
            style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
            activeOpacity={0.7}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons 
              name="options-outline" 
              size={18} 
              color={activeFiltersCount > 0 ? theme.card : theme.primary} 
            />
            <Text style={[styles.filterButtonText, activeFiltersCount > 0 && styles.filterButtonTextActive]}>
              Filter{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'friends' ? (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriendItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyFriends}
        />
      ) : activeTab === 'community' ? (
        <FlatList
          data={filteredCommunities}
          keyExtractor={(item) => item.id}
          renderItem={renderCommunityItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredPendingUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderPendingItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 }}>
              <Ionicons name="people-outline" size={48} color="#94A3B8" />
              <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '600', marginTop: 12 }}>
                No pending approval requests.
              </Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
            />
          }
        />
      )}

      {/* Filter Modal */}
      <Modal visible={showFilterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowFilterModal(false)} />
          <View style={styles.filterSheet}>
            <View style={styles.filterSheetHeader}>
              <Text style={styles.filterSheetTitle}>Filter Students</Text>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <TouchableOpacity onPress={handleResetAll} activeOpacity={0.7}>
                  <Text style={styles.resetText}>Reset All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowFilterModal(false)} activeOpacity={0.7}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.filterScrollView} showsVerticalScrollIndicator={false}>
              {/* Batch */}
              <Text style={styles.filterGroupLabel}>Batch</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
                {BATCH_OPTIONS.map((batch) => (
                  <TouchableOpacity
                    key={batch}
                    style={[styles.pill, selectedBatch === batch && styles.pillActive]}
                    onPress={() => setSelectedBatch(batch)}
                  >
                    <Text style={[styles.pillText, selectedBatch === batch && styles.pillTextActive]}>
                      {batch}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Department */}
              <Text style={styles.filterGroupLabel}>Department</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
                {DEPT_OPTIONS.map((dept) => (
                  <TouchableOpacity
                    key={dept}
                    style={[styles.pill, selectedDept === dept && styles.pillActive]}
                    onPress={() => setSelectedDept(dept)}
                  >
                    <Text style={[styles.pillText, selectedDept === dept && styles.pillTextActive]}>
                      {dept}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Branch */}
              <Text style={styles.filterGroupLabel}>Branch</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
                {BRANCH_OPTIONS.map((branch) => (
                  <TouchableOpacity
                    key={branch}
                    style={[styles.pill, selectedBranch === branch && styles.pillActive]}
                    onPress={() => setSelectedBranch(branch)}
                  >
                    <Text style={[styles.pillText, selectedBranch === branch && styles.pillTextActive]}>
                      {branch}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Location */}
              <Text style={styles.filterGroupLabel}>Location</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
                {LOC_OPTIONS.map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[styles.pill, selectedLoc === loc && styles.pillActive]}
                    onPress={() => setSelectedLoc(loc)}
                  >
                    <Text style={[styles.pillText, selectedLoc === loc && styles.pillTextActive]}>
                      {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Course */}
              <Text style={styles.filterGroupLabel}>Course</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
                {COURSE_OPTIONS.map((course) => (
                  <TouchableOpacity
                    key={course}
                    style={[styles.pill, selectedCourse === course && styles.pillActive]}
                    onPress={() => setSelectedCourse(course)}
                  >
                    <Text style={[styles.pillText, selectedCourse === course && styles.pillTextActive]}>
                      {course}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Institution */}
              {isSuperAdmin && (
                <>
                  <Text style={styles.filterGroupLabel}>Institution</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
                    {['All', 'RVCE', 'RVITM', 'RVPU', 'RVIS', 'RVU', 'RVCA', 'RVIM', 'RVILS', 'DAPMRV', 'RVCN', 'RVCP', 'RVTC', 'RVTTI', 'NMKRV', 'SSMRV', 'RVPS', 'RVS', 'RVLH', 'MCI'].map((inst) => (
                      <TouchableOpacity
                        key={inst}
                        style={[styles.pill, selectedInstitution === inst && styles.pillActive]}
                        onPress={() => {
                          setSelectedInstitution(inst);
                          global.selectedInstitution = inst;
                        }}
                      >
                        <Text style={[styles.pillText, selectedInstitution === inst && styles.pillTextActive]}>
                          {inst}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>

            <TouchableOpacity 
              style={styles.applyButton} 
              activeOpacity={0.8}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: theme.card,
    fontSize: 16,
    fontWeight: '700',
  },
  headerSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 10,
    marginHorizontal: 12,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerSearchIcon: {
    marginRight: 6,
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
    padding: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    paddingHorizontal: 16,
    paddingTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textMuted,
  },
  tabTextActive: {
    color: theme.primary,
    fontWeight: '700',
  },
  filterSummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  filterSummaryText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: theme.primary,
  },
  filterButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.primary,
  },
  filterButtonTextActive: {
    color: theme.card,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    color: theme.card,
    fontSize: 16,
    fontWeight: '700',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  friendDetail: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  friendDetailSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: theme.textMuted,
    marginTop: 2,
  },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
  },
  messageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  communityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF2FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  communityName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  communityMembers: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 7,
    minWidth: 80,
  },
  joinedBtn: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  joinBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },
  joinedBtnText: {
    color: theme.card,
  },
  joinedIcon: {
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textMuted,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  filterSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.danger,
  },
  filterScrollView: {
    padding: 20,
  },
  filterGroupLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#475569',
    marginTop: 16,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  pill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  pillActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextActive: {
    color: theme.card,
  },
  applyButton: {
    backgroundColor: theme.primary,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.card,
  },
  superAdminSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginRight: 8,
  },
  selectorScroll: {
    gap: 8,
  },
  selectorChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  selectorChipActive: {
    backgroundColor: theme.primary,
  },
  selectorChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  selectorChipTextActive: {
    color: theme.card,
  },
});

export default AdminUsersScreen;
