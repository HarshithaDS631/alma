import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Modal,
  Alert, Platform, useWindowDimensions} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { 
  getSuggestions, 
  getUsers, 
  sendConnectionRequest, 
  getConnectionRequests, 
  acceptConnectionRequest, 
  declineConnectionRequest,
  toggleFollowUser,
  getFollowing 
} from '../services/authService';
import useUserRole from '../hooks/useUserRole';

const DirectoryScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { isAlumni, isAdmin, isSuperAdmin, isAdminOrSuper, userRole } = useUserRole();

  const [activeTab, setActiveTab] = useState(route?.params?.tab || 'directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState([]);
  const [dbAlumni, setDbAlumni] = useState([]);
  const [sentConnectMap, setSentConnectMap] = useState({});

  React.useEffect(() => {
    if (route?.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route?.params?.tab]);

  const fetchConnectionRequests = async () => {
    try {
      const res = await getConnectionRequests();
      if (Array.isArray(res)) {
        const formatted = res.map((req) => {
          const sender = req.sender || {};
          return {
            id: req._id,
            senderId: sender._id,
            name: sender.name || 'Alumni Member',
            subtitle: `${sender.department || sender.branch || 'Alumni'} • ${sender.institution || ''} (Batch ${sender.batchYear || 'N/A'})`.trim(),
            initials: sender.name ? sender.name.substring(0, 2).toUpperCase() : 'AL',
            color: '#003366',
            createdAt: req.createdAt
          };
        });
        setRequests(formatted);
      }
    } catch (err) {
      console.log('Error fetching connection requests from MongoDB:', err);
    }
  };

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        let res = await getUsers();
        if (!Array.isArray(res) || res.length === 0) {
          res = await getSuggestions();
        }
        if (Array.isArray(res)) {
          setDbAlumni(res);
        }
      } catch (err) {
        console.log('Error fetching directory users from MongoDB:', err);
      }
    };
    fetchUsers();
    fetchConnectionRequests();
    fetchFollowingData();
  }, []);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [followingMap, setFollowingMap] = useState({});

  const fetchFollowingData = async () => {
    try {
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        setCurrentUserId(userInfo._id || userInfo.id);
      }
      const followingData = await getFollowing();
      if (Array.isArray(followingData)) {
        const map = {};
        followingData.forEach(u => {
          map[u._id || u.id] = true;
        });
        setFollowingMap(map);
      }
    } catch (err) {
      console.log('Error fetching following data:', err);
    }
  };

  const allAlumni = dbAlumni.map((u, i) => ({
    _id: u._id || u.id,
    id: u._id || u.id || i.toString(),
    name: u.name,
    branch: u.department || u.branch || (u.batchYear ? `Batch ${u.batchYear}` : 'Media Cell'),
    title: u.designation || u.degree || u.role || 'Alumni Member',
    institution: 'Media Cell Institution',
    initials: u.name ? u.name.charAt(0).toUpperCase() : '?',
    color: '#003366'
  }));

  // Filter out self and already-followed users — Directory shows only people you can follow
  const directoryAlumni = allAlumni.filter(a => {
    const id = a._id || a.id;
    if (currentUserId && id === currentUserId) return false;
    if (followingMap[id]) return false;
    return true;
  });

  const handleToggleFollow = async (userId) => {
    try {
      await toggleFollowUser(userId);
      setFollowingMap(prev => ({ ...prev, [userId]: !prev[userId] }));
    } catch (err) {
      console.log('Follow error:', err);
    }
  };

  // Community States
  const [communityModalVisible, setCommunityModalVisible] = useState(false);
  const [communityStep, setCommunityStep] = useState(1); // 1: Info, 2: Groups, 3: Success
  const [communityName, setCommunityName] = useState('');
  const [communityDesc, setCommunityDesc] = useState('');
  const [selectedGroups, setSelectedGroups] = useState(['announcement']);
  const [userCommunities, setUserCommunities] = useState([]);

  const availableGroups = [];

  const handleAccept = async (id) => {
    try {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      await acceptConnectionRequest(id);
    } catch (err) {
      console.error('Error accepting connection request:', err);
    }
  };

  const handleReject = async (id) => {
    try {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      await declineConnectionRequest(id);
    } catch (err) {
      console.error('Error declining connection request:', err);
    }
  };

  const handleSendConnect = async (targetId) => {
    if (!targetId) return;
    try {
      setSentConnectMap(prev => ({ ...prev, [targetId]: true }));
      await sendConnectionRequest(targetId);
    } catch (err) {
      console.error('Error sending connection request:', err);
    }
  };

  const filteredRequests = requests.filter(
    (r) =>
      (r.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (r.subtitle || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const renderRequestItem = ({ item }) => (
    <View style={styles.requestRow}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: item.color }]}>
        <Text style={styles.avatarText}>{item.initials}</Text>
      </View>

      {/* Info */}
      <View style={styles.requestInfo}>
        <Text style={styles.requestName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.requestSubtitle} numberOfLines={1}>{item.subtitle}</Text>
      </View>

      {/* Actions */}
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => handleReject(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={18} color="#EF4444" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => handleAccept(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark" size={18} color="#10B981" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRequestTab = () => (
    <View style={styles.tabContent}>
      {/* Request List */}
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyRequestState}>
            <Ionicons name="mail-open-outline" size={56} color="#CBD5E1" />
            <Text style={styles.emptyRequestTitle}>No Pending Requests</Text>
            <Text style={styles.emptyRequestSubtitle}>
              You&apos;re all caught up! Connection requests sent to you will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );

  const handleToggleGroup = (groupId) => {
    if (groupId === 'announcement') return;
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups((prev) => prev.filter((id) => id !== groupId));
    } else {
      setSelectedGroups((prev) => [...prev, groupId]);
    }
  };

  const handleCreateCommunity = () => {
    if (!communityName.trim()) {
      Alert.alert('Required', 'Please enter a community name');
      return;
    }
    const newComm = {
      id: Date.now().toString(),
      name: communityName,
      description: communityDesc,
      groups: availableGroups.filter(g => selectedGroups.includes(g.id)).map(g => ({
        ...g,
        lastMessage: g.id === 'announcement' ? `Welcome to ${communityName} Announcements!` : 'No messages yet'
      }))
    };
    setUserCommunities((prev) => [...prev, newComm]);
    setCommunityStep(3);
  };

  const resetCommunityForm = () => {
    setCommunityName('');
    setCommunityDesc('');
    setSelectedGroups(['announcement']);
    setCommunityStep(1);
    setCommunityModalVisible(false);
  };

  const renderCommunityTab = () => {
    if (userCommunities.length > 0) {
      return (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.commListContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.commSectionHeader}>
            <Text style={styles.commSectionTitle}>Communities You Manage</Text>
            <TouchableOpacity style={styles.commNewBtn} onPress={() => setCommunityModalVisible(true)}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.commNewBtnText}>New</Text>
            </TouchableOpacity>
          </View>

          {userCommunities.map((comm) => (
            <View key={comm.id} style={styles.commCard}>
              <View style={styles.commCardHeader}>
                <View style={styles.commAvatar}>
                  <Ionicons name="people" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.commInfo}>
                  <Text style={styles.commName}>{comm.name}</Text>
                  <Text style={styles.commSubText} numberOfLines={1}>{comm.description || 'No description'}</Text>
                </View>
                <TouchableOpacity style={styles.commMoreBtn}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.commGroupsList}>
                {comm.groups.map((group) => (
                  <TouchableOpacity key={group.id} style={styles.commGroupRow} activeOpacity={0.7}>
                    <View style={[styles.commGroupIconBg, group.id === 'announcement' && styles.announcementBg]}>
                      <Ionicons name={group.id === 'announcement' ? "megaphone" : group.icon} size={16} color={group.id === 'announcement' ? "#003366" : "#475569"} />
                    </View>
                    <View style={styles.commGroupInfo}>
                      <Text style={styles.commGroupName}>
                        {group.id === 'announcement' ? 'Announcements' : group.name}
                      </Text>
                      <Text style={styles.commGroupMessage} numberOfLines={1}>{group.lastMessage}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      );
    }

    return (
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.communityContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration Placeholder */}
        <View style={styles.illustrationWrapper}>
          <View style={styles.illustrationCircle}>
            <View style={styles.illustrationInner}>
              {/* Mountain landscape icon composition */}
              <View style={styles.landscapeContainer}>
                <View style={styles.sunCircle} />
                <View style={styles.mountainGroup}>
                  <View style={styles.mountainLeft} />
                  <View style={styles.mountainRight} />
                </View>
                <View style={styles.groundStrip} />
              </View>
              <Ionicons name="people" size={40} color="#003366" style={styles.peopleIcon} />
            </View>
          </View>
          {/* Decorative dots */}
          <View style={[styles.decorDot, styles.dotTopLeft]} />
          <View style={[styles.decorDot, styles.dotTopRight]} />
          <View style={[styles.decorDot, styles.dotBottomLeft]} />
          <View style={[styles.decorDot, styles.dotBottomRight]} />
        </View>

        {/* Text Content */}
        <Text style={styles.communityTitle}>Stay Connected with a Community</Text>
        <Text style={styles.communityDescription}>
          Bring alumni together in one place. Create a community to share updates,
          organize events, and build meaningful connections that last beyond campus.
        </Text>
        <Text style={styles.communityDescriptionSecondary}>
          Communities help you stay in touch with batchmates, department peers,
          and interest groups — all in a single, organized space.
        </Text>

        {/* CTA Button */}
        <TouchableOpacity style={styles.communityBtn} activeOpacity={0.8} onPress={() => setCommunityModalVisible(true)}>
          <Ionicons name="people-circle-outline" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.communityBtnText}>Start your community</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };


  const renderWebDirectoryTab = () => {
    const filteredDirectory = directoryAlumni.filter(
      (a) =>
        (a.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (a.branch || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (a.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (a.institution || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    );

    return (
      <View style={styles.webTableContainer}>
        <View style={styles.webTableHeader}>
          <Text style={[styles.webTableColHeader, { flex: 3 }]}>Alumni Name</Text>
          <Text style={[styles.webTableColHeader, { flex: 2 }]}>Batch & Branch</Text>
          <Text style={[styles.webTableColHeader, { flex: 3 }]}>Current Role</Text>
          <Text style={[styles.webTableColHeader, { flex: 2 }]}>Institution</Text>
          <Text style={[styles.webTableColHeader, { flex: 1, textAlign: 'center' }]}>Action</Text>
        </View>
        <ScrollView style={styles.webTableBody}>
          {filteredDirectory.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="people-outline" size={48} color="#CBD5E1" />
              <Text style={{ marginTop: 16, fontSize: 16, color: '#64748B' }}>No Alumni Found</Text>
            </View>
          ) : (
            filteredDirectory.map((item, index) => (
              <View key={item.id} style={[styles.webTableRow, index % 2 === 0 ? { backgroundColor: '#FFFFFF' } : { backgroundColor: '#F8FAFC' }]}>
                <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.avatar, { backgroundColor: item.color, width: 32, height: 32, borderRadius: 16, marginRight: 12 }]}>
                    <Text style={[styles.avatarText, { fontSize: 12 }]}>{item.initials}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>{item.name}</Text>
                </View>
                <View style={{ flex: 2, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14, color: '#475569' }}>{item.branch}</Text>
                </View>
                <View style={{ flex: 3, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14, color: '#475569' }}>{item.title}</Text>
                </View>
                <View style={{ flex: 2, justifyContent: 'center' }}>
                  <View style={{ backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155' }}>{item.institution}</Text>
                  </View>
                </View>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: followingMap[item._id || item.id] ? '#DEF7EC' : '#003366', borderRadius: 6 }}
                    onPress={() => handleToggleFollow(item._id || item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: followingMap[item._id || item.id] ? '#03543F' : '#FFFFFF' }}>
                      {followingMap[item._id || item.id] ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  };
  const renderDirectoryTab = () => {
    const filteredDirectory = directoryAlumni.filter(
      (a) =>
        (a.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (a.branch || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (a.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (a.institution || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    );

    return (
      <View style={styles.tabContent}>
        <FlatList
          data={filteredDirectory}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.requestRow}>
              {/* Avatar */}
              <View style={[styles.avatar, { backgroundColor: item.color }]}>
                <Text style={styles.avatarText}>{item.initials}</Text>
              </View>

              {/* Info */}
              <View style={styles.requestInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.requestName} numberOfLines={1}>{item.name}</Text>
                </View>
                <Text style={styles.requestSubtitle} numberOfLines={1}>{item.branch} • {item.title}</Text>
              </View>

              {/* Action - Connect & Chat */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: sentConnectMap[item._id || item.id] ? '#DEF7EC' : '#E1EFFF',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                  onPress={() => handleSendConnect(item._id || item.id)}
                  disabled={sentConnectMap[item._id || item.id]}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={sentConnectMap[item._id || item.id] ? "checkmark-circle" : "person-add-outline"} 
                    size={14} 
                    color={sentConnectMap[item._id || item.id] ? "#03543F" : "#1E40AF"} 
                    style={{ marginRight: 4 }} 
                  />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: sentConnectMap[item._id || item.id] ? "#03543F" : "#1E40AF" }}>
                    {sentConnectMap[item._id || item.id] ? 'Requested' : 'Connect'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.messageIconBtn}
                  onPress={() => navigation.navigate('Chat', { user: { id: item._id || item.id, name: item.name, role: item.institution || (item.branch ? `${item.branch} • ${item.title}` : item.title) || '', initials: item.initials } })}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#003366" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyRequestState}>
              <Ionicons name="people-outline" size={56} color="#CBD5E1" />
              <Text style={styles.emptyRequestTitle}>No Alumni Found</Text>
              <Text style={styles.emptyRequestSubtitle}>Try searching for a different name, branch, or college.</Text>
            </View>
          }
        />
      </View>
    );
  };

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 1024, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={webContainerStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="#FFFFFF" />

      {/* ───── Header ───── */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerAvatar} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.headerIconBtn} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Messages')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#002144" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIconBtn} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color="#002144" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Role Badge for Admin/Super Admin */}
      {isAdminOrSuper && (
        <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="shield-checkmark" size={16} color="#003366" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#003366' }}>{userRole} Mode</Text>
          <Text style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>Manage connections & approvals</Text>
        </View>
      )}

      {/* ───── Tab Bar ───── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'directory' && styles.activeTab]}
          onPress={() => setActiveTab('directory')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'directory' && styles.activeTabText]}>
            Directory
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'request' && styles.activeTab]}
          onPress={() => setActiveTab('request')}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.tabText, activeTab === 'request' && styles.activeTabText]}>
              Requests
            </Text>
            {isAdminOrSuper && (
              <View style={{ backgroundColor: '#003366', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>{filteredRequests.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'community' && styles.activeTab]}
          onPress={() => setActiveTab('community')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'community' && styles.activeTabText]}>
            Communities
          </Text>
        </TouchableOpacity>
      </View>

      {/* ───── Tab Content ───── */}
      {activeTab === 'directory' ? (
        isDesktop ? renderWebDirectoryTab() : renderDirectoryTab()
      ) : activeTab === 'request' ? (
        renderRequestTab()
      ) : (
        renderCommunityTab()
      )}

      {/* WhatsApp Community Wizard Modal */}
      <Modal visible={communityModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={resetCommunityForm} />
          <View style={styles.modalContent}>
            {communityStep === 1 && (
              <View>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={resetCommunityForm}>
                    <Ionicons name="close" size={24} color="#002144" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>New Community</Text>
                  <TouchableOpacity onPress={() => communityName.trim() ? setCommunityStep(2) : Alert.alert('Required', 'Please enter community name')}>
                    <Text style={styles.modalActionText}>Next</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView contentContainerStyle={styles.wizardBody} keyboardShouldPersistTaps="handled">
                  <View style={styles.commIconSetup}>
                    <View style={styles.commIconBgLarge}>
                      <Ionicons name="camera" size={32} color="#94A3B8" />
                    </View>
                    <Text style={styles.commIconLabel}>Add Community Icon</Text>
                  </View>

                  <Text style={styles.wizardLabel}>Community Name</Text>
                  <TextInput
                    style={styles.wizardInput}
                    placeholder="e.g. Institution CSE 2023 Alumni"
                    placeholderTextColor="#94A3B8"
                    value={communityName}
                    onChangeText={setCommunityName}
                    maxLength={30}
                  />
                  <Text style={styles.charCount}>{30 - communityName.length} characters remaining</Text>

                  <Text style={styles.wizardLabel}>Description</Text>
                  <TextInput
                    style={[styles.wizardInput, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                    placeholder="Describe the purpose of this community"
                    placeholderTextColor="#94A3B8"
                    value={communityDesc}
                    onChangeText={setCommunityDesc}
                    multiline
                  />
                </ScrollView>
              </View>
            )}

            {communityStep === 2 && (
              <View>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setCommunityStep(1)}>
                    <Ionicons name="arrow-back" size={24} color="#002144" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Add Groups</Text>
                  <TouchableOpacity onPress={handleCreateCommunity}>
                    <Text style={styles.modalActionText}>Create</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.wizardBody}>
                  <Text style={styles.wizardInfoText}>
                    A community links multiple chat groups under one umbrella. Select groups to include in your community:
                  </Text>

                  <Text style={styles.groupSectionHeader}>Required Group</Text>
                  <View style={[styles.groupSelectRow, styles.groupDisabledSelect]}>
                    <View style={[styles.commGroupIconBg, styles.announcementBg]}>
                      <Ionicons name="megaphone" size={16} color="#003366" />
                    </View>
                    <View style={styles.groupSelectInfo}>
                      <Text style={styles.groupSelectName}>Announcements (Required)</Text>
                      <Text style={styles.groupSelectDesc}>Broadcast messages to all community members</Text>
                    </View>
                    <Ionicons name="checkbox" size={24} color="#003366" />
                  </View>

                  <Text style={styles.groupSectionHeader}>Optional Groups to Add</Text>
                  {availableGroups.slice(1).map((group) => (
                    <TouchableOpacity
                      key={group.id}
                      style={styles.groupSelectRow}
                      onPress={() => handleToggleGroup(group.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.commGroupIconBg}>
                        <Ionicons name={group.icon} size={16} color="#475569" />
                      </View>
                      <View style={styles.groupSelectInfo}>
                        <Text style={styles.groupSelectName}>{group.name}</Text>
                        <Text style={styles.groupSelectDesc}>{group.desc}</Text>
                      </View>
                      <Ionicons
                        name={selectedGroups.includes(group.id) ? "checkbox" : "square-outline"}
                        size={24}
                        color={selectedGroups.includes(group.id) ? "#003366" : "#94A3B8"}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {communityStep === 3 && (
              <View style={styles.successContainer}>
                <View style={styles.successCircle}>
                  <Ionicons name="checkmark" size={60} color="#FFFFFF" />
                </View>
                <Text style={styles.successTitle}>Community Created!</Text>
                <Text style={styles.successDesc}>
                  Your new WhatsApp-style community &quot;{communityName}&quot; is ready. You can now publish announcements, coordinate batches, and discuss career paths.
                </Text>
                <TouchableOpacity style={styles.successBtn} onPress={resetCommunityForm}>
                  <Text style={styles.successBtnText}>View Community</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  /* ── Container ── */
  container: {
    flex: 1,
    backgroundColor: theme.card,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.card,
    gap: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    paddingVertical: 0,
  },
  headerIcons: {
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

  /* ── Tab Bar ── */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textMuted,
  },
  activeTabText: {
    color: theme.primary,
    fontWeight: '700',
  },

  /* ── Tab Content ── */
  tabContent: {
    flex: 1,
    backgroundColor: theme.card,
  },

  /* ── Section Header ── */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },

  /* ── Request Row ── */
  listContent: {
    paddingBottom: 40,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: theme.card,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  requestInfo: {
    flex: 1,
    marginRight: 10,
  },
  requestName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 3,
  },
  requestSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#6EE7B7',
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Empty Request State ── */
  emptyRequestState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyRequestTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.text,
    marginTop: 16,
  },
  emptyRequestSubtitle: {
    fontSize: 13.5,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  /* ── Community Tab ── */
  communityContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 50,
    paddingBottom: 60,
  },

  /* Illustration */
  illustrationWrapper: {
    width: 180,
    height: 180,
    marginBottom: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  illustrationInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  landscapeContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sunCircle: {
    position: 'absolute',
    top: 20,
    right: 28,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FCD34D',
  },
  mountainGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: -2,
  },
  mountainLeft: {
    width: 0,
    height: 0,
    borderLeftWidth: 35,
    borderRightWidth: 35,
    borderBottomWidth: 50,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#93C5FD',
    marginRight: -12,
  },
  mountainRight: {
    width: 0,
    height: 0,
    borderLeftWidth: 28,
    borderRightWidth: 28,
    borderBottomWidth: 38,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#60A5FA',
  },
  groundStrip: {
    width: '100%',
    height: 20,
    backgroundColor: '#BBF7D0',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  peopleIcon: {
    zIndex: 2,
  },

  /* Decorative dots */
  decorDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DBEAFE',
  },
  dotTopLeft: {
    top: 10,
    left: 20,
  },
  dotTopRight: {
    top: 5,
    right: 15,
    backgroundColor: '#FDE68A',
  },
  dotBottomLeft: {
    bottom: 15,
    left: 10,
    backgroundColor: '#BBF7D0',
  },
  dotBottomRight: {
    bottom: 5,
    right: 25,
  },

  /* Community Text */
  communityTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.primary,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  communityDescription: {
    fontSize: 14.5,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  communityDescriptionSecondary: {
    fontSize: 13.5,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 36,
  },

  /* Community CTA */
  communityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 28,
    width: '100%',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  communityBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.card,
    letterSpacing: 0.2,
  },

  /* Communities List style */
  commListContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  commSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  commSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.primary,
  },
  commNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  commNewBtnText: {
    color: theme.card,
    fontSize: 12,
    fontWeight: '700',
  },
  commCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: theme.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  commCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: theme.background,
  },
  commAvatar: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  commName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: theme.text,
  },
  commSubText: {
    fontSize: 12.5,
    color: theme.textSecondary,
    marginTop: 2,
  },
  commMoreBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commGroupsList: {
    paddingHorizontal: 16,
  },
  commGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.background,
  },
  commGroupIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  announcementBg: {
    backgroundColor: '#E0F2FE',
  },
  commGroupInfo: {
    flex: 1,
    marginRight: 8,
  },
  commGroupName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  commGroupMessage: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },

  /* Modal Wizard styling */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.primary,
  },
  modalActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.primary,
  },
  wizardBody: {
    padding: 20,
  },
  commIconSetup: {
    alignItems: 'center',
    marginVertical: 20,
  },
  commIconBgLarge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  commIconLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  wizardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginTop: 14,
  },
  wizardInput: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14.5,
    color: theme.primary,
  },
  charCount: {
    fontSize: 11,
    color: theme.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  wizardInfoText: {
    fontSize: 13.5,
    color: theme.textSecondary,
    lineHeight: 18,
    marginBottom: 20,
  },
  groupSectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 10,
  },
  groupSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    marginBottom: 12,
  },
  groupDisabledSelect: {
    backgroundColor: theme.background,
    borderColor: theme.border,
    opacity: 0.8,
  },
  groupSelectInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  groupSelectName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  groupSelectDesc: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2.5,
  },

  /* Success State styling */
  successContainer: {
    padding: 32,
    alignItems: 'center',
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: theme.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 12,
  },
  successDesc: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 32,
  },
  successBtn: {
    backgroundColor: theme.primary,
    height: 50,
    width: '100%',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBtnText: {
    color: theme.card,
    fontSize: 15,
    fontWeight: '700',
  },
  institutionTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#DBEAFE',
  },
  institutionTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1E40AF',
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  linkedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  messageIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webTableContainer: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, margin: 24, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  webTableHeader: { flexDirection: 'row', padding: 16, backgroundColor: '#F1F5F9', borderBottomWidth: 1, borderBottomColor: theme.border },
  webTableColHeader: { fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase' },
  webTableBody: { flex: 1 },
  webTableRow: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
});

export default DirectoryScreen;
