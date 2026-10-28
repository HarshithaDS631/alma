import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
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
  Image,
  Alert,
  Platform,
  useWindowDimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getImageUrl } from '../services/uploadService';
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
import getInitials from '../lib/getInitials';
import InstagramProfileShareModal from '../components/InstagramProfileShareModal';
import Mascot from '../components/Mascot';
import AppHeader from '../components/AppHeader';

// ─── Specialized Directory Discovery Categories ───────────────────────────
const DEFAULT_SPECIALIZED_LISTS = [
  { id: 'tech_mgrs', title: 'Tech & Software Leaders', icon: 'hardware-chip' },
  { id: 'eng_non_it', title: 'Core Engineering', icon: 'construct' },
  { id: 'sales_biz', title: 'Sales & Business', icon: 'trending-up' },
  { id: 'data_science', title: 'Data Science & AI', icon: 'analytics' },
  { id: 'teaching', title: 'Academics & Research', icon: 'school' },
  { id: 'design', title: 'Product & Design', icon: 'color-palette' },
];


const DEFAULT_WHATSAPP_COMMUNITIES = [
  {
    id: 'comm_rvce_global',
    name: 'RVCE Alumni Global Community',
    institution: 'RV College of Engineering',
    description: 'Official global community connecting 45,000+ alumni, faculty, and research fellows worldwide.',
    membersCount: '4,850 Members • Official Community',
    avatar_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=200&h=200&q=80',
    announcement: {
      id: 'ann_rvce_1',
      name: 'Announcements',
      lastMessage: '📢 Annual Alumni Homecoming 2026 dates announced! Registrations are now open on the portal.',
      time: 'Yesterday',
      unread: true,
    },
    groups: [
      { id: 'grp_rvce_gen', name: 'General Alumni Chat', icon: 'chatbubbles', lastSender: 'Suresh N.', lastMessage: 'Great catching up at the tech symposium!', time: '11:45 AM', unreadCount: 3 },
      { id: 'grp_rvce_jobs', name: 'Jobs & Referral Pipeline', icon: 'briefcase', lastSender: 'Pooja Hegde', lastMessage: 'Hiring 4 Senior Fullstack Engineers at NVIDIA Bangalore.', time: '10:15 AM', unreadCount: 6 },
      { id: 'grp_rvce_tech', name: 'Tech, AI & Innovation Hub', icon: 'code-slash', lastSender: 'Vikram Sethi', lastMessage: 'Anyone experimenting with local LLM deployments?', time: 'Yesterday', unreadCount: 0 },
      { id: 'grp_rvce_blr', name: 'Bengaluru Chapter & Meetups', icon: 'location', lastSender: 'Ananya S.', lastMessage: 'Sunday campus breakfast meetup confirmed at 9:30 AM.', time: 'Sep 23', unreadCount: 0 },
    ]
  },
  {
    id: 'comm_rv_entrepreneurs',
    name: 'RV Alumni Founders & Angels',
    institution: 'RV Educational Institutions',
    description: 'Venture network for alumni founders, startup operators, angels, and technology executives.',
    membersCount: '1,320 Members • Verified Network',
    avatar_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=200&h=200&q=80',
    announcement: {
      id: 'ann_rv_found_1',
      name: 'Announcements',
      lastMessage: '🚀 RSST Innovation Grant 2026: Up to ₹25 Lakhs non-dilutive grant for alumni startups.',
      time: 'Sep 21',
      unread: false,
    },
    groups: [
      { id: 'grp_found_pitch', name: 'Pitch Decks & Feedback', icon: 'rocket', lastSender: 'Rahul V.', lastMessage: 'Launched on Product Hunt today! Would love your upvotes.', time: '9:30 AM', unreadCount: 2 },
      { id: 'grp_found_mentors', name: 'Angel Mentorship & Advisory', icon: 'bulb', lastSender: 'Karthik Raja', lastMessage: 'Hosting office hours for early-stage B2B SaaS this Friday.', time: 'Sep 22', unreadCount: 0 },
    ]
  }
];

const DirectoryScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { isAdminOrSuper, userRole, userInstitution } = useUserRole();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 1024;

  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState(route?.params?.tab || 'directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [requests, setRequests] = useState([]);
  const [dbAlumni, setDbAlumni] = useState([]);
  const [sentConnectMap, setSentConnectMap] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [followingMap, setFollowingMap] = useState({});
  const [sharedAlumni, setSharedAlumni] = useState(null);
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  // ─── Exact RVCE AlmaConnect Active Filters ───────────────────────────
  const [selectedMemberType, setSelectedMemberType] = useState('all'); // 'all', 'alumni', 'student', 'faculty', 'my_batch'
  const [selectedCourse, setSelectedCourse] = useState('all'); // 'BE', 'B.E / B.Tech', etc.
  const [selectedGraduationYear, setSelectedGraduationYear] = useState('all'); // '2022', '2020', etc.
  const [selectedLocation, setSelectedLocation] = useState('all'); // 'Bangalore', etc.
  const [selectedSpecializedList, setSelectedSpecializedList] = useState(null);
  const [viewMode, setViewMode] = useState('all_cards'); // 'all_cards' or 'batch_wise'
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [collapsedBatches, setCollapsedBatches] = useState({});

  React.useEffect(() => {
    if (route?.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route?.params?.tab]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('userInfo').then(str => {
        if (str) {
          const parsed = JSON.parse(str);
          setCurrentUser(parsed);
          setCurrentUserId(parsed._id || parsed.id);
        }
      }).catch(() => {});
    }, [])
  );

  const fetchConnectionRequests = async () => {
    try {
      const res = await getConnectionRequests().catch(() => []);
      if (Array.isArray(res)) {
        const formatted = res.map((req) => {
          const sender = req.sender || {};
          return {
            id: req._id,
            senderId: sender._id,
            name: sender.name || 'Alumni Member',
            subtitle: `${sender.department || sender.branch || 'Alumni'} • ${sender.institution || ''} (Batch ${sender.batchYear || 'N/A'})`.trim(),
            initials: getInitials(sender.name),
            color: '#0F2744',
            createdAt: req.createdAt
          };
        });
        setRequests(formatted);
      }
    } catch (err) {
      console.log('Error fetching connection requests:', err);
    }
  };

  const lastDirectoryFetchRef = useRef(0);

  const fetchUsers = async () => {
    try {
      if (dbAlumni.length === 0) {
        setLoadingDirectory(true);
      }
      let institution = userInstitution;
      if (!institution) {
        try {
          const raw = await AsyncStorage.getItem('userInfo');
          if (raw) institution = JSON.parse(raw)?.institution || '';
        } catch (_) {}
      }

      // Load cached directory first
      try {
        const cached = await AsyncStorage.getItem('cachedDirectory_' + (institution || 'all'));
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDbAlumni(parsed);
          }
        }
      } catch (_) {}

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3500));
      const params = institution ? { institution } : {};
      
      const fetchPromise = getUsers(params);
      let res = await Promise.race([fetchPromise, timeoutPromise]).catch(() => null);

      if (!Array.isArray(res) || res.length === 0) {
        const suggPromise = getSuggestions();
        res = await Promise.race([suggPromise, timeoutPromise]).catch(() => null);
      }

      if (Array.isArray(res) && res.length > 0) {
        setDbAlumni(res);
        AsyncStorage.setItem('cachedDirectory_' + (institution || 'all'), JSON.stringify(res)).catch(() => {});
      }
    } catch (err) {
      console.warn('[Directory] fetch error:', err?.message);
    } finally {
      setLoadingDirectory(false);
    }
  };

  const fetchFollowingData = async () => {
    try {
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        setCurrentUserId(userInfo._id || userInfo.id);
      }
      
      const map = {};
      const profileCacheStr = await AsyncStorage.getItem('profileCache');
      if (profileCacheStr) {
        try {
          const cache = JSON.parse(profileCacheStr);
          if (Array.isArray(cache.followingList)) {
            cache.followingList.forEach(u => {
              const idStr = String(u.id || u._id || '');
              if (idStr) map[idStr] = true;
              if (u.name) map[u.name.toLowerCase().trim()] = true;
            });
          }
        } catch (_) {}
      }

      const followingData = await getFollowing().catch(() => []);
      if (Array.isArray(followingData)) {
        followingData.forEach(u => {
          const idStr = String(u._id || u.id || '');
          if (idStr) map[idStr] = true;
          if (u.name) map[u.name.toLowerCase().trim()] = true;
        });
      }
      setFollowingMap(map);
    } catch (err) {
      console.log('Error fetching following data:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastDirectoryFetchRef.current < 35000 && dbAlumni.length > 0) {
        return;
      }
      lastDirectoryFetchRef.current = now;
      fetchUsers();
      fetchConnectionRequests();
      fetchFollowingData();
    }, [dbAlumni.length])
  );

  // ─── Scoped Directory to Current User's Specific Institution ──
  const unifiedDirectory = useMemo(() => {
    const list = [];
    const seen = new Set();
    const myInstitution = (currentUser?.institution || userInstitution || '').toLowerCase().trim();

    dbAlumni.forEach((u, i) => {
      const uid = String(u._id || u.id || `reg_${i}`);
      const role = (u.role || '').toLowerCase().trim();
      const isAdminRole = role.includes('admin');
      const isSelf = currentUserId && uid && String(uid) === String(currentUserId);
      if (isAdminRole || isSelf || u.is_approved === false) return;

      // Filter by institution if available
      const userInst = (u.institution || '').toLowerCase().trim();
      if (myInstitution && userInst && !userInst.includes(myInstitution) && !myInstitution.includes(userInst)) {
        return;
      }

      const rawYear = u.batchYear || u.batch_year || u.batch || '';
      let parsedYear = '2023';
      if (rawYear) {
        const match = String(rawYear).match(/\b(19\d{2}|20\d{2})\b/);
        if (match) parsedYear = match[1];
        else parsedYear = String(rawYear);
      }

      const nameKey = (u.name || '').toLowerCase().trim();
      if (!seen.has(nameKey)) {
        seen.add(nameKey);
        const memberType = role.includes('student') ? 'student' : role.includes('faculty') ? 'faculty' : 'alumni';
        const isOpen = Boolean(u.openToWork || u.isOpenToWork || u.isJobSeeker);
        list.push({
          _id: uid,
          id: uid,
          name: u.name || 'Alumni Member',
          batchYear: parsedYear,
          batchFormatted: `BE '${parsedYear.slice(-2)}`,
          degree: u.degree || 'BE',
          memberType,
          role: u.designation || (u.company ? `Engineer at ${u.company}` : (u.role || 'Alumni Member')),
          company: u.company || u.organization || u.institution || 'Alumni Network',
          designation: u.designation || u.role || 'Alumni Member',
          location: u.location || u.city || 'Bangalore, India',
          city: u.city || 'Bangalore',
          avatar_url: u.avatar_url || u.profilePicture || '',
          profileSlug: `/profiles/${(u.name || 'member').toLowerCase().replace(/\s+/g, '-')}`,
          initials: getInitials(u.name || 'Alumni Member'),
          institution: u.institution || currentUser?.institution || 'Institution Alumni',
          color: '#059669',
          tags: [u.department || u.branch || 'Alumni', 'Verified'],
          openToWork: isOpen,
          isOpenToWork: isOpen,
          isJobSeeker: isOpen,
          openToWorkRoles: u.openToWorkRoles || '',
          openToWorkLocations: u.openToWorkLocations || ''
        });
      }
    });

    return list;
  }, [dbAlumni, currentUserId, currentUser, userInstitution]);

  // ─── Real Dynamic Filters Derived Strictly from Institution Members ──
  const dynamicMemberTypes = useMemo(() => {
    const total = unifiedDirectory.length;
    const alumni = unifiedDirectory.filter(m => m.memberType === 'alumni').length;
    const students = unifiedDirectory.filter(m => m.memberType === 'student').length;
    const faculty = unifiedDirectory.filter(m => m.memberType === 'faculty').length;
    const openToWorkCount = unifiedDirectory.filter(m => m.openToWork).length;
    const myYear = String(currentUser?.batchYear || currentUser?.batch_year || '');
    const myBatch = myYear ? unifiedDirectory.filter(m => String(m.batchYear) === myYear).length : 0;
    return [
      { id: 'all', label: 'All', count: String(total) },
      { id: 'alumni', label: 'Alumni', count: String(alumni) },
      { id: 'student', label: 'Students', count: String(students) },
      { id: 'faculty', label: 'Faculty', count: String(faculty) },
      ...(openToWorkCount > 0 ? [{ id: 'open_to_work', label: '#OpenToWork', count: String(openToWorkCount) }] : []),
      ...(myBatch > 0 ? [{ id: 'my_batch', label: 'My Batch', count: String(myBatch) }] : [])
    ];
  }, [unifiedDirectory, currentUser]);

  const dynamicCourses = useMemo(() => {
    const counts = {};
    unifiedDirectory.forEach(m => {
      const d = m.degree || 'BE';
      counts[d] = (counts[d] || 0) + 1;
    });
    return [
      { id: 'all', label: 'All Courses', count: String(unifiedDirectory.length) },
      ...Object.entries(counts).map(([deg, cnt]) => ({ id: deg, label: deg, count: String(cnt) }))
    ];
  }, [unifiedDirectory]);

  const dynamicGraduationYears = useMemo(() => {
    const counts = {};
    unifiedDirectory.forEach(m => {
      if (m.batchYear) {
        counts[m.batchYear] = (counts[m.batchYear] || 0) + 1;
      }
    });
    const sortedYears = Object.keys(counts).sort((a, b) => b - a);
    return [
      { id: 'all', label: 'All Years', count: String(unifiedDirectory.length) },
      ...sortedYears.map(yr => ({ id: yr, label: yr, count: String(counts[yr]) }))
    ];
  }, [unifiedDirectory]);

  const dynamicLocations = useMemo(() => {
    const counts = {};
    unifiedDirectory.forEach(m => {
      const loc = m.city || m.location || 'Bangalore';
      counts[loc] = (counts[loc] || 0) + 1;
    });
    return [
      { id: 'all', label: 'All Locations', count: String(unifiedDirectory.length) },
      ...Object.entries(counts).map(([loc, cnt]) => ({ id: loc, label: loc, count: String(cnt) }))
    ];
  }, [unifiedDirectory]);

  // ─── Filter Logic ─────────────────────────────────────────────────────
  const filteredDirectory = useMemo(() => {
    return unifiedDirectory.filter((member) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (member.name || '').toLowerCase().includes(q);
        const matchesRole = (member.role || '').toLowerCase().includes(q);
        const matchesCompany = (member.company || '').toLowerCase().includes(q);
        const matchesYear = (member.batchYear || '').includes(q);
        const matchesLoc = (member.location || '').toLowerCase().includes(q);
        const matchesTags = (member.tags || []).some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesRole && !matchesCompany && !matchesYear && !matchesLoc && !matchesTags) {
          return false;
        }
      }

      // 2. Member Type Filter
      if (selectedMemberType !== 'all') {
        if (selectedMemberType === 'open_to_work') {
          if (!member.openToWork) return false;
        } else if (selectedMemberType === 'my_batch') {
          const myYear = currentUser?.batchYear || currentUser?.batch_year || '2023';
          if (String(member.batchYear) !== String(myYear)) return false;
        } else if (member.memberType !== selectedMemberType) {
          return false;
        }
      }

      // 3. Course Filter
      if (selectedCourse !== 'all') {
        const deg = (member.degree || '').toLowerCase();
        const target = selectedCourse.toLowerCase();
        if (!deg.includes(target) && !target.includes(deg)) return false;
      }

      // 4. Graduation Year Filter
      if (selectedGraduationYear !== 'all') {
        if (String(member.batchYear) !== String(selectedGraduationYear)) return false;
      }

      // 5. Location Filter
      if (selectedLocation !== 'all') {
        const locLower = selectedLocation.toLowerCase();
        const memberLoc = (member.location || member.city || '').toLowerCase();
        if (!memberLoc.includes(locLower)) return false;
      }

      // 6. Specialized List Filter
      if (selectedSpecializedList) {
        const listObj = DEFAULT_SPECIALIZED_LISTS.find(l => l.id === selectedSpecializedList);
        if (listObj) {
          const roleLower = (member.role || '').toLowerCase();
          if (selectedSpecializedList === 'eng_non_it') {
            if (!roleLower.includes('engineer') && !roleLower.includes('mechanical') && !roleLower.includes('civil') && !roleLower.includes('structural')) return false;
          } else if (selectedSpecializedList === 'sales_biz') {
            if (!roleLower.includes('manager') && !roleLower.includes('sales') && !roleLower.includes('business') && !roleLower.includes('consultant')) return false;
          } else if (selectedSpecializedList === 'tech_mgrs') {
            if (!roleLower.includes('manager') && !roleLower.includes('lead') && !roleLower.includes('director')) return false;
          } else if (selectedSpecializedList === 'teaching') {
            if (!roleLower.includes('professor') && !roleLower.includes('faculty') && !roleLower.includes('teacher')) return false;
          } else if (selectedSpecializedList === 'java') {
            if (!roleLower.includes('sde') && !roleLower.includes('software') && !roleLower.includes('developer')) return false;
          }
        }
      }

      return true;
    });
  }, [unifiedDirectory, searchQuery, selectedMemberType, selectedCourse, selectedGraduationYear, selectedLocation, selectedSpecializedList, currentUser]);

  // ─── Batch-Wise Grouping ──────────────────────────────────────────────
  const batchWiseGroups = useMemo(() => {
    const groups = {};
    filteredDirectory.forEach((item) => {
      const yr = item.batchYear || 'Other';
      if (!groups[yr]) groups[yr] = [];
      groups[yr].push(item);
    });

    const sortedYears = Object.keys(groups).sort((a, b) => {
      const numA = parseInt(a, 10) || 0;
      const numB = parseInt(b, 10) || 0;
      return numB - numA;
    });

    return sortedYears.map(year => ({
      year,
      count: groups[year].length,
      members: groups[year]
    }));
  }, [filteredDirectory]);

  const toggleBatchCollapse = (year) => {
    setCollapsedBatches(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const handleToggleFollow = async (targetUser) => {
    const userId = targetUser._id || targetUser.id;
    const userName = (targetUser.name || '').toLowerCase().trim();

    setFollowingMap(prev => ({ ...prev, [userId]: true, [userName]: true }));

    try {
      const profileCacheStr = await AsyncStorage.getItem('profileCache');
      let cache = {};
      if (profileCacheStr) { try { cache = JSON.parse(profileCacheStr); } catch (_) {} }
      
      const currentList = Array.isArray(cache.followingList) ? cache.followingList : [];
      const isAlready = currentList.some(u => (u.id || u._id) === userId || (u.name || '').toLowerCase().trim() === userName);
      
      if (!isAlready) {
        const newItem = {
          id: userId,
          _id: userId,
          name: targetUser.name,
          title: targetUser.role || 'Alumni Member',
          avatar: targetUser.initials || getInitials(targetUser.name),
          avatar_url: targetUser.avatar_url || ''
        };
        const newList = [...currentList, newItem];
        cache.followingList = newList;
        cache.following = newList.length.toString();
        await AsyncStorage.setItem('profileCache', JSON.stringify(cache));
      }
    } catch (_) {}

    try {
      await toggleFollowUser(userId);
    } catch (err) {
      console.log('Error toggling follow:', err);
    }
  };

  const handleSendConnect = async (targetId) => {
    if (!targetId) return;
    try {
      setSentConnectMap(prev => ({ ...prev, [targetId]: true }));
      await sendConnectionRequest(targetId);
      Alert.alert('Connection Request Sent', 'Your invitation to connect has been forwarded.');
    } catch (err) {
      console.error('Error sending connection request:', err);
    }
  };

  // ─── WhatsApp Communities Setup ───────────────────────────────────────
  const [communityModalVisible, setCommunityModalVisible] = useState(false);
  const [communityStep, setCommunityStep] = useState(1);
  const [communityName, setCommunityName] = useState('');
  const [communityDesc, setCommunityDesc] = useState('');
  const [communityIconUri, setCommunityIconUri] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState(['announcement']);
  const [userCommunities, setUserCommunities] = useState(DEFAULT_WHATSAPP_COMMUNITIES);

  useEffect(() => {
    AsyncStorage.getItem('alumni_whatsapp_communities').then(savedStr => {
      if (savedStr) {
        try {
          const parsed = JSON.parse(savedStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUserCommunities(parsed);
          }
        } catch (_) {}
      }
    }).catch(() => {});
  }, []);

  const handlePickCommunityIcon = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Permission to access photos is needed.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCommunityIconUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking community icon:', err);
    }
  };

  const availableGroups = [
    { id: 'announcement', name: 'Announcements', icon: 'megaphone', desc: 'Official updates and announcements' },
    { id: 'general', name: 'General Discussion', icon: 'chatbubbles', desc: 'Open chat for all community members' },
    { id: 'jobs', name: 'Jobs & Internships', icon: 'briefcase', desc: 'Share career opportunities and referrals' },
    { id: 'events', name: 'Events & Meetups', icon: 'calendar', desc: 'Plan batch reunions and networking events' }
  ];

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
      id: 'comm_' + Date.now().toString(),
      name: communityName.trim(),
      description: communityDesc.trim() || 'Alumni Community',
      institution: userInstitution || 'RV College of Engineering',
      membersCount: '1 Member • You',
      avatar_url: communityIconUri || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&h=200&q=80',
      iconUri: communityIconUri,
      announcement: {
        id: 'ann_' + Date.now(),
        name: 'Announcements',
        lastMessage: `📢 Welcome to the official ${communityName} announcement channel!`,
        time: 'Just now',
        unread: false,
      },
      groups: availableGroups.filter(g => selectedGroups.includes(g.id) && g.id !== 'announcement').map(g => ({
        ...g,
        lastSender: currentUser?.name || 'You',
        lastMessage: `Created ${g.name} channel`,
        time: 'Just now',
        unreadCount: 0
      }))
    };
    const updated = [newComm, ...userCommunities];
    setUserCommunities(updated);
    AsyncStorage.setItem('alumni_whatsapp_communities', JSON.stringify(updated)).catch(() => {});
    setCommunityStep(3);
  };

  const resetCommunityForm = () => {
    setCommunityName('');
    setCommunityDesc('');
    setCommunityIconUri(null);
    setSelectedGroups(['announcement']);
    setCommunityStep(1);
    setCommunityModalVisible(false);
  };

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

  // ─── Single Clean & User-Friendly Member Card ─────────────────────────
  const renderAlmaConnectCard = (item) => {
    const isFollowing = !!(
      followingMap[String(item._id || item.id)] ||
      followingMap[String(item.id || item._id)] ||
      followingMap[(item.name || '').toLowerCase().trim()]
    );
    const isRequested = !!sentConnectMap[item._id || item.id];

    return (
      <View
        key={item.id}
        style={[
          styles.almaCard,
          isDesktop && { width: 'calc(33.333% - 14px)', minWidth: 300, maxWidth: 420 }
        ]}
      >
        {/* Profile Main: Avatar + Name + Batch */}
        <View style={styles.almaProfileSection}>
          <View style={[
            styles.almaAvatarWrapper,
            item.openToWork && { borderColor: '#057642', borderWidth: 2.5 }
          ]}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.almaAvatarImage} />
            ) : (
              <View style={[styles.almaAvatarFallback, { backgroundColor: item.color || '#059669' }]}>
                <Text style={styles.almaAvatarInitials}>{item.initials}</Text>
              </View>
            )}

            {/* LinkedIn-style curved photo ribbon */}
            {item.openToWork && (
              <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#057642',
                paddingVertical: 1,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: 7, fontWeight: '900', letterSpacing: -0.2 }}>
                  #OPEN
                </Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                <Text style={styles.almaMemberName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Ionicons name="checkmark-circle" size={13} color="#008B74" />
              </View>

              <View style={styles.almaBatchPill}>
                <Text style={styles.almaBatchPillText}>
                  {item.batchFormatted || `'${item.batchYear ? String(item.batchYear).slice(-2) : 'Alum'}`}
                </Text>
              </View>
            </View>

            <Text style={styles.almaMemberRole} numberOfLines={2}>
              {item.role || `${item.designation || 'Alumni Member'} • ${item.company || 'RVCE'}`}
            </Text>

            {item.openToWork && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: '#DCFCE7',
                alignSelf: 'flex-start',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
                marginTop: 4,
                borderWidth: 0.5,
                borderColor: '#86EFAC'
              }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#057642' }} />
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#047857' }} numberOfLines={1}>
                  #OpenToWork{item.openToWorkRoles ? ` • ${Array.isArray(item.openToWorkRoles) ? item.openToWorkRoles[0] : item.openToWorkRoles.split(',')[0].trim()}` : ''}
                </Text>
              </View>
            )}

            {item.location ? (
              <View style={styles.almaLocationRow}>
                <Ionicons name="location-outline" size={12} color="#64748B" />
                <Text style={styles.almaLocationText} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Clean, Prominent Actions Row */}
        <View style={styles.almaCardActions}>
          <TouchableOpacity
            style={[
              styles.almaConnectBtn,
              isRequested && styles.almaConnectBtnRequested
            ]}
            onPress={() => handleSendConnect(item._id || item.id)}
            disabled={isRequested}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isRequested ? "checkmark-circle" : "person-add"} 
              size={13} 
              color={isRequested ? "#03543F" : "#FFFFFF"} 
            />
            <Text style={[styles.almaConnectBtnText, isRequested && { color: "#03543F" }]}>
              {isRequested ? 'Requested' : 'Connect'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.almaChatBtn}
            onPress={() => navigation.navigate('Chat', { 
              user: { 
                id: item._id || item.id, 
                name: item.name, 
                role: `${item.role} • ${item.batchFormatted || item.batchYear}`, 
                initials: item.initials 
              } 
            })}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={14} color="#008B74" />
            <Text style={styles.almaChatBtnText}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.almaIconBtn, isFollowing && styles.almaIconBtnActive]}
            onPress={() => handleToggleFollow(item)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isFollowing ? "bookmark" : "bookmark-outline"} 
              size={15} 
              color={isFollowing ? "#059669" : "#64748B"} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.almaIconBtn}
            onPress={() => setSharedAlumni(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={15} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Main Clean, User-Friendly Directory Screen ───────────────────────
  const renderAlmaConnectDirectory = () => {
    const hasActiveFilters = selectedCourse !== 'all' || selectedGraduationYear !== 'all' || selectedLocation !== 'all' || selectedSpecializedList || searchQuery.length > 0;
    
    // Count active filters for badge
    let activeFilterCount = 0;
    if (selectedCourse !== 'all') activeFilterCount++;
    if (selectedGraduationYear !== 'all') activeFilterCount++;
    if (selectedLocation !== 'all') activeFilterCount++;
    if (selectedSpecializedList) activeFilterCount++;

    return (
      <ScrollView 
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ─── Member Type Filter Chips ─── */}
        <View style={styles.memberTypeRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
            {dynamicMemberTypes.map((type) => {
              const isSelected = selectedMemberType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.memberTypePill, isSelected && styles.memberTypePillActive]}
                  onPress={() => setSelectedMemberType(type.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.memberTypePillText, isSelected && styles.memberTypePillTextActive]}>
                    {type.label}
                  </Text>
                  <View style={[styles.memberTypeCountBadge, isSelected && styles.memberTypeCountBadgeActive]}>
                    <Text style={[styles.memberTypeCountText, isSelected && styles.memberTypeCountTextActive]}>
                      {type.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── Compact Controls Bar: Filters Button + Active Chips + View Toggle ─── */}
        <View style={styles.compactControlsRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
            <TouchableOpacity
              style={[styles.filterTriggerBtn, activeFilterCount > 0 && styles.filterTriggerBtnActive]}
              onPress={() => setShowFiltersModal(true)}
              activeOpacity={0.75}
            >
              <Ionicons 
                name="options-outline" 
                size={14} 
                color={activeFilterCount > 0 ? '#059669' : '#475569'} 
              />
              <Text style={[styles.filterTriggerText, activeFilterCount > 0 && styles.filterTriggerTextActive]}>
                {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
              </Text>
            </TouchableOpacity>

            {/* Active filter badges so user can see what's applied and dismiss quickly */}
            {selectedCourse !== 'all' && (
              <TouchableOpacity 
                style={styles.activeFilterChip}
                onPress={() => setSelectedCourse('all')}
                activeOpacity={0.7}
              >
                <Text style={styles.activeFilterChipText}>{selectedCourse}</Text>
                <Ionicons name="close-circle" size={13} color="#059669" />
              </TouchableOpacity>
            )}

            {selectedGraduationYear !== 'all' && (
              <TouchableOpacity 
                style={styles.activeFilterChip}
                onPress={() => setSelectedGraduationYear('all')}
                activeOpacity={0.7}
              >
                <Text style={styles.activeFilterChipText}>Batch {selectedGraduationYear}</Text>
                <Ionicons name="close-circle" size={13} color="#059669" />
              </TouchableOpacity>
            )}

            {selectedLocation !== 'all' && (
              <TouchableOpacity 
                style={styles.activeFilterChip}
                onPress={() => setSelectedLocation('all')}
                activeOpacity={0.7}
              >
                <Text style={styles.activeFilterChipText}>{selectedLocation}</Text>
                <Ionicons name="close-circle" size={13} color="#059669" />
              </TouchableOpacity>
            )}

            {selectedSpecializedList && (
              <TouchableOpacity 
                style={styles.activeFilterChip}
                onPress={() => setSelectedSpecializedList(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.activeFilterChipText}>Specialized</Text>
                <Ionicons name="close-circle" size={13} color="#059669" />
              </TouchableOpacity>
            )}

            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.clearAllBtn}
                onPress={() => {
                  setSelectedMemberType('all');
                  setSelectedCourse('all');
                  setSelectedGraduationYear('all');
                  setSelectedLocation('all');
                  setSelectedSpecializedList(null);
                  setSearchQuery('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* View Mode Toggle (Grid vs Batch) */}
          <View style={styles.viewModeToggleWrapper}>
            <TouchableOpacity
              style={[styles.viewModeBtn, viewMode === 'all_cards' && styles.viewModeBtnActive]}
              onPress={() => setViewMode('all_cards')}
              activeOpacity={0.7}
            >
              <Ionicons name="grid-outline" size={13} color={viewMode === 'all_cards' ? '#059669' : '#94A3B8'} />
              <Text style={[styles.viewModeBtnText, viewMode === 'all_cards' && styles.viewModeBtnTextActive]}>
                Grid
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeBtn, viewMode === 'batch_wise' && styles.viewModeBtnActive]}
              onPress={() => setViewMode('batch_wise')}
              activeOpacity={0.7}
            >
              <Ionicons name="layers-outline" size={13} color={viewMode === 'batch_wise' ? '#059669' : '#94A3B8'} />
              <Text style={[styles.viewModeBtnText, viewMode === 'batch_wise' && styles.viewModeBtnTextActive]}>
                Batch
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Results Counter ─── */}
        <View style={styles.resultsCounterRow}>
          <Text style={styles.resultsCounterText}>
            Showing <Text style={{ fontWeight: '700', color: theme.text }}>{filteredDirectory.length} members</Text>
          </Text>
          {loadingDirectory && (
            <Text style={{ fontSize: 12, color: '#008B74', fontWeight: '600' }}>Syncing with RVCE servers...</Text>
          )}
        </View>

        {/* ─── Empty State or Cards ─── */}
        {filteredDirectory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Mascot size={90} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No RVians Found</Text>
            <Text style={styles.emptySubtitle}>
              No alumni or students match your selected search or filters. Try adjusting keywords or clearing filters.
            </Text>
            <TouchableOpacity
              style={styles.emptyClearBtn}
              onPress={() => {
                setSelectedMemberType('all');
                setSelectedCourse('all');
                setSelectedGraduationYear('all');
                setSelectedLocation('all');
                setSelectedSpecializedList(null);
                setSearchQuery('');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyClearBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : viewMode === 'batch_wise' ? (
          <View style={{ gap: 14 }}>
            {batchWiseGroups.map((batchGroup) => {
              const isCollapsed = !!collapsedBatches[batchGroup.year];
              return (
                <View key={batchGroup.year} style={styles.batchSectionWrapper}>
                  <TouchableOpacity
                    style={styles.batchHeaderBtn}
                    onPress={() => toggleBatchCollapse(batchGroup.year)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.batchTitleText}>Class of {batchGroup.year}</Text>
                      <View style={styles.batchCountBadge}>
                        <Text style={styles.batchCountBadgeText}>{batchGroup.count}</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={isCollapsed ? "chevron-down" : "chevron-up"}
                      size={16}
                      color="#64748B"
                    />
                  </TouchableOpacity>

                  {!isCollapsed && (
                    <View style={styles.batchCardsGrid}>
                      {batchGroup.members.map(renderAlmaConnectCard)}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.batchCardsGrid}>
            {filteredDirectory.map(renderAlmaConnectCard)}
          </View>
        )}
      </ScrollView>
    );
  };

  // ─── Requests Tab ─────────────────────────────────────────────────────
  const renderRequestTab = () => {
    const filteredRequests = requests.filter(
      (r) =>
        (r.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (r.subtitle || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    );

    return (
      <View style={styles.tabContent}>
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.requestRow}>
              <View style={[styles.avatar, { backgroundColor: item.color }]}>
                <Text style={styles.avatarText}>{item.initials}</Text>
              </View>
              <View style={styles.requestInfo}>
                <Text style={styles.requestName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.requestSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              </View>
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
                  <Ionicons name="checkmark" size={18} color="#059669" />
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  };

  // ─── Communities Tab ──────────────────────────────────────────────────
  const renderCommunityTab = () => {
    return (
      <ScrollView 
        style={styles.tabContent} 
        contentContainerStyle={styles.commListContainer} 
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.waNewCommunityCard}
          onPress={() => setCommunityModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.waNewCommunityIconPod}>
            <Ionicons name="people" size={24} color="#FFFFFF" />
            <View style={styles.waNewCommunityPlusBadge}>
              <Ionicons name="add" size={13} color="#FFFFFF" />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.waNewCommunityTitle}>New Community</Text>
            <Text style={styles.waNewCommunitySubtitle}>
              Bring together batchmates, department clubs, or regional chapters
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {userCommunities.map((comm) => (
          <View key={comm.id} style={styles.waCommunityBlock}>
            <View style={styles.waCommunityHeader}>
              <View style={styles.waCommunityAvatarPod}>
                {comm.avatar_url || comm.iconUri ? (
                  <Image source={{ uri: comm.avatar_url || comm.iconUri }} style={styles.waCommunityAvatarImg} />
                ) : (
                  <Ionicons name="people" size={24} color="#FFFFFF" />
                )}
              </View>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={styles.waCommunityName} numberOfLines={1}>{comm.name}</Text>
                  <Ionicons name="checkmark-circle" size={15} color="#008B74" />
                </View>
                <Text style={styles.waCommunityMeta}>{comm.membersCount || 'Active Community'}</Text>
                {comm.description ? (
                  <Text style={styles.waCommunityDesc} numberOfLines={1}>{comm.description}</Text>
                ) : null}
              </View>
              <TouchableOpacity 
                style={{ padding: 6 }} 
                activeOpacity={0.7}
                onPress={() => Alert.alert(comm.name, comm.description || 'Alumni Community')}
              >
                <Ionicons name="ellipsis-vertical" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {comm.announcement && (
              <TouchableOpacity 
                style={styles.waAnnouncementRow}
                onPress={() => navigation.navigate('Chat', { 
                  user: { 
                    id: comm.announcement.id, 
                    name: `${comm.name} Announcements`, 
                    role: 'Official Broadcast Channel', 
                    initials: 'AN' 
                  } 
                })}
                activeOpacity={0.75}
              >
                <View style={styles.waMegaphonePod}>
                  <Ionicons name="megaphone" size={17} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Text style={styles.waChannelTitle}>Announcements</Text>
                      <Ionicons name="volume-high" size={12} color="#00A884" />
                    </View>
                    <Text style={styles.waChannelTime}>{comm.announcement.time || 'Yesterday'}</Text>
                  </View>
                  <Text style={styles.waChannelSnippet} numberOfLines={1}>
                    {comm.announcement.lastMessage}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.waGroupsContainer}>
              {(comm.groups || []).map((group, gIdx) => (
                <TouchableOpacity 
                  key={group.id || gIdx} 
                  style={styles.waGroupRow}
                  onPress={() => navigation.navigate('Chat', { 
                    user: { 
                      id: group.id, 
                      name: group.name, 
                      role: `${comm.name} • Channel`, 
                      initials: (group.name || 'GP').substring(0, 2).toUpperCase() 
                    } 
                  })}
                  activeOpacity={0.72}
                >
                  <View style={styles.waGroupIconPod}>
                    <Ionicons name={group.icon || "chatbubbles"} size={16} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.waGroupName} numberOfLines={1}>{group.name}</Text>
                      <Text style={styles.waGroupTime}>{group.time || '10:00 AM'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                      <Text style={styles.waGroupSnippet} numberOfLines={1}>
                        {group.lastSender ? `${group.lastSender}: ` : ''}{group.lastMessage || 'Tap to join chat'}
                      </Text>
                      {group.unreadCount > 0 ? (
                        <View style={styles.waUnreadBadge}>
                          <Text style={styles.waUnreadText}>{group.unreadCount}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 1100, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={webContainerStyle}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="#FFFFFF" />

        {/* ───── Universal App Header ───── */}
        <AppHeader
          navigation={navigation}
          currentRoute="Alumni"
          desktopTitle="Alumni Directory"
          desktopSubtitle={currentUser?.institution || userInstitution || 'RV College of Engineering'}
        />

        {/* Directory Search Bar */}
        <View style={styles.expandedSearchBarRow}>
          <Ionicons name="search" size={17} color="#059669" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.expandedSearchInput}
            placeholder={`Search in ${currentUser?.institution ? currentUser.institution : 'directory'}...`}
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

        {/* Admin Verification Banner */}
        {isAdminOrSuper && (
          <View style={styles.adminBanner}>
            <Ionicons name="shield-checkmark" size={16} color="#059669" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#059669' }}>{userRole} Mode</Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>AlmaConnect Directory Verification Control</Text>
          </View>
        )}

        {/* ───── Main Navigation Tabs ───── */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'directory' && styles.activeTab]}
            onPress={() => setActiveTab('directory')}
            activeOpacity={0.7}
          >
            <View style={styles.tabInner}>
              <Ionicons 
                name={activeTab === 'directory' ? "people" : "people-outline"} 
                size={18} 
                color={activeTab === 'directory' ? '#059669' : '#64748B'} 
              />
              <Text style={[styles.tabText, activeTab === 'directory' && styles.activeTabText]}>
                Directory
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'request' && styles.activeTab]}
            onPress={() => setActiveTab('request')}
            activeOpacity={0.7}
          >
            <View style={styles.tabInner}>
              <Ionicons 
                name={activeTab === 'request' ? "person-add" : "person-add-outline"} 
                size={18} 
                color={activeTab === 'request' ? '#059669' : '#64748B'} 
              />
              <Text style={[styles.tabText, activeTab === 'request' && styles.activeTabText]}>
                Requests
              </Text>
              {requests.length > 0 && (
                <View style={styles.requestBadge}>
                  <Text style={styles.requestBadgeText}>{requests.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, (activeTab === 'community' || activeTab === 'communities') && styles.activeTab]}
            onPress={() => setActiveTab('community')}
            activeOpacity={0.7}
          >
            <View style={styles.tabInner}>
              <Ionicons 
                name={(activeTab === 'community' || activeTab === 'communities') ? "chatbubbles" : "chatbubbles-outline"} 
                size={18} 
                color={(activeTab === 'community' || activeTab === 'communities') ? '#059669' : '#64748B'} 
              />
              <Text style={[styles.tabText, (activeTab === 'community' || activeTab === 'communities') && styles.activeTabText]}>
                Community
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ───── Main Body View ───── */}
        {activeTab === 'directory' ? (
          renderAlmaConnectDirectory()
        ) : activeTab === 'request' ? (
          renderRequestTab()
        ) : (
          renderCommunityTab()
        )}

        {/* ───── Filter Modal (Course, Graduation Year, Location, Industry) ───── */}
        <Modal visible={showFiltersModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.filterModalBox}>
              <View style={styles.filterModalHeader}>
                <View>
                  <Text style={styles.filterModalTitle}>Filter Directory</Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Narrow down by course, batch, location or industry</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {(selectedCourse !== 'all' || selectedGraduationYear !== 'all' || selectedLocation !== 'all' || selectedSpecializedList) && (
                    <TouchableOpacity 
                      onPress={() => {
                        setSelectedCourse('all');
                        setSelectedGraduationYear('all');
                        setSelectedLocation('all');
                        setSelectedSpecializedList(null);
                      }}
                    >
                      <Text style={{ fontSize: 13, color: '#DC2626', fontWeight: '700' }}>Reset</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
                    <Ionicons name="close" size={24} color="#059669" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {/* Course Filter */}
                <Text style={styles.filterSectionTitle}>COURSE</Text>
                <View style={{ gap: 6, marginBottom: 18 }}>
                  {dynamicCourses.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.filterOptionRow,
                        selectedCourse === c.id && styles.filterOptionRowActive
                      ]}
                      onPress={() => setSelectedCourse(c.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterOptionText, selectedCourse === c.id && styles.filterOptionTextActive]}>
                        {c.label} ({c.count})
                      </Text>
                      {selectedCourse === c.id && (
                        <Ionicons name="checkmark-circle" size={18} color="#059669" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Graduation Year Filter */}
                <Text style={styles.filterSectionTitle}>GRADUATION YEAR</Text>
                <View style={{ gap: 6, marginBottom: 18 }}>
                  {dynamicGraduationYears.map((y) => (
                    <TouchableOpacity
                      key={y.id}
                      style={[
                        styles.filterOptionRow,
                        selectedGraduationYear === y.id && styles.filterOptionRowActive
                      ]}
                      onPress={() => setSelectedGraduationYear(y.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterOptionText, selectedGraduationYear === y.id && styles.filterOptionTextActive]}>
                        {y.label} ({y.count})
                      </Text>
                      {selectedGraduationYear === y.id && (
                        <Ionicons name="checkmark-circle" size={18} color="#059669" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Location Filter */}
                <Text style={styles.filterSectionTitle}>LOCATION</Text>
                <View style={{ gap: 6, marginBottom: 18 }}>
                  {dynamicLocations.map((loc) => (
                    <TouchableOpacity
                      key={loc.id}
                      style={[
                        styles.filterOptionRow,
                        selectedLocation === loc.id && styles.filterOptionRowActive
                      ]}
                      onPress={() => setSelectedLocation(loc.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterOptionText, selectedLocation === loc.id && styles.filterOptionTextActive]}>
                        {loc.label} ({loc.count})
                      </Text>
                      {selectedLocation === loc.id && (
                        <Ionicons name="checkmark-circle" size={18} color="#059669" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Industry / Specialized Lists */}
                <Text style={styles.filterSectionTitle}>INDUSTRY & DOMAIN</Text>
                <View style={{ gap: 6, marginBottom: 18 }}>
                  {DEFAULT_SPECIALIZED_LISTS.map((list) => (
                    <TouchableOpacity
                      key={list.id}
                      style={[
                        styles.filterOptionRow,
                        selectedSpecializedList === list.id && styles.filterOptionRowActive
                      ]}
                      onPress={() => setSelectedSpecializedList(selectedSpecializedList === list.id ? null : list.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterOptionText, selectedSpecializedList === list.id && styles.filterOptionTextActive]}>
                        {list.title} ({list.count})
                      </Text>
                      {selectedSpecializedList === list.id && (
                        <Ionicons name="checkmark-circle" size={18} color="#059669" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.filterApplyBtn}
                onPress={() => setShowFiltersModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.filterApplyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ───── Community Creation Modal ───── */}
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
                    <TouchableOpacity 
                      style={styles.commIconSetup} 
                      activeOpacity={0.8}
                      onPress={handlePickCommunityIcon}
                    >
                      <View style={[styles.commIconBgLarge, communityIconUri && { borderStyle: 'solid', borderColor: '#059669', overflow: 'hidden' }]}>
                        {communityIconUri ? (
                          <Image source={{ uri: communityIconUri }} style={{ width: '100%', height: '100%', borderRadius: 24 }} />
                        ) : (
                          <Ionicons name="camera" size={32} color="#059669" />
                        )}
                      </View>
                      <Text style={[styles.commIconLabel, { color: '#059669', fontWeight: '700' }]}>
                        {communityIconUri ? 'Change Community Icon' : 'Add Community Icon'}
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.wizardLabel}>Community Name</Text>
                    <TextInput
                      style={styles.wizardInput}
                      placeholder="e.g. RVCE CSE 2023 Alumni"
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
                      A community links multiple chat groups under one umbrella. Select groups to include:
                    </Text>

                    <Text style={styles.groupSectionHeader}>Required Group</Text>
                    <View style={[styles.groupSelectRow, styles.groupDisabledSelect]}>
                      <View style={[styles.commGroupIconBg, styles.announcementBg]}>
                        <Ionicons name="megaphone" size={16} color="#059669" />
                      </View>
                      <View style={styles.groupSelectInfo}>
                        <Text style={styles.groupSelectName}>Announcements (Required)</Text>
                        <Text style={styles.groupSelectDesc}>Broadcast messages to all community members</Text>
                      </View>
                      <Ionicons name="checkbox" size={24} color="#059669" />
                    </View>

                    <Text style={styles.groupSectionHeader}>Optional Groups</Text>
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
                          color={selectedGroups.includes(group.id) ? "#059669" : "#94A3B8"}
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
                    Your new community &quot;{communityName}&quot; is active.
                  </Text>
                  <TouchableOpacity style={styles.successBtn} onPress={resetCommunityForm}>
                    <Text style={styles.successBtnText}>View Community</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* ───── Instagram-Style Profile Share Modal ───── */}
        <InstagramProfileShareModal
          visible={!!sharedAlumni}
          onClose={() => setSharedAlumni(null)}
          user={sharedAlumni || {}}
        />
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background || '#F8FAFC',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.card || '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: theme.cardBorder || theme.border || '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  desktopSectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.isDark ? '#064E3B' : '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.isDark ? '#059669' : '#A7F3D0',
  },
  desktopSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.isDark ? '#34D399' : '#059669',
    letterSpacing: -0.2,
  },
  desktopCampusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: theme.isDark ? '#1E293B' : '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.isDark ? '#334155' : '#E2E8F0',
  },
  desktopCampusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  desktopCampusBadgeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.textSecondary || theme.textMuted || '#64748B',
  },
  desktopSearchBox: {
    flex: 1,
    maxWidth: 440,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
    borderWidth: 1.5,
    borderTopColor: theme.isDark ? '#334155' : '#FFFFFF',
    borderLeftColor: theme.isDark ? '#334155' : '#F8FAFC',
    borderRightColor: theme.isDark ? '#1E293B' : '#CBD5E1',
    borderBottomColor: theme.isDark ? '#0F172A' : '#94A3B8',
    borderBottomWidth: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  desktopSearchInput: {
    flex: 1,
    fontSize: 13.5,
    color: theme.text,
    paddingVertical: 0,
  },
  header3DLogoPod: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#059669',
    borderWidth: 1,
    borderTopColor: '#34D399',
    borderLeftColor: '#10B981',
    borderRightColor: '#047857',
    borderBottomColor: '#064E3B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },
  headerBrandTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: theme.text || '#0F172A',
    letterSpacing: -0.3,
  },
  headerBrandSub: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textMuted || '#64748B',
    marginTop: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  headerIconBtn: {
    position: 'relative',
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: theme.isDark ? '#1E293B' : '#FFFFFF',
    borderWidth: 1.5,
    borderTopColor: theme.isDark ? '#475569' : '#FFFFFF',
    borderLeftColor: theme.isDark ? '#334155' : '#F8FAFC',
    borderRightColor: theme.isDark ? '#1E293B' : '#CBD5E1',
    borderBottomColor: theme.isDark ? '#0F172A' : '#94A3B8',
    borderBottomWidth: 3.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.isDark ? 0.45 : 0.16,
    shadowRadius: 5,
    elevation: 6,
  },
  headerIconBtnActive: {
    backgroundColor: '#059669',
    borderTopColor: '#34D399',
    borderLeftColor: '#10B981',
    borderRightColor: '#047857',
    borderBottomColor: '#064E3B',
    borderBottomWidth: 3.5,
    shadowColor: '#059669',
    shadowOpacity: 0.45,
  },
  icon3DGlyph: {
    textShadowColor: 'rgba(0, 0, 0, 0.28)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 2.5,
  },
  expandedSearchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.card || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.border || '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  expandedSearchInput: {
    flex: 1,
    fontSize: 13.5,
    color: theme.text || '#0F172A',
    paddingVertical: 0,
  },
  adminBanner: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Tabs */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.card || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.border || '#E2E8F0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#059669',
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted || '#64748B',
  },
  activeTabText: {
    color: '#059669',
    fontWeight: '800',
  },
  requestBadge: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  requestBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Scroll View */
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  /* Clean Header Banner */
  cleanHeaderBanner: {
    backgroundColor: '#F0FDF4',
    backgroundImage: Platform.OS === 'web' ? 'linear-gradient(135deg, #F0FDF4 0%, #E6FBF0 100%)' : undefined,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  cleanHeaderTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cleanHeaderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cleanHeaderTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },
  cleanHeaderStatsText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#008B74',
  },
  cleanHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  cleanHeaderSub: {
    fontSize: 12.5,
    color: '#475569',
    marginTop: 3,
    lineHeight: 18,
  },

  /* Member Type Row */
  memberTypeRow: {
    marginBottom: 10,
  },
  memberTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberTypePillActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
    backgroundImage: Platform.OS === 'web' ? 'linear-gradient(135deg, #34D399 0%, #059669 100%)' : undefined,
  },
  memberTypePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  memberTypePillTextActive: {
    color: '#FFFFFF',
  },
  memberTypeCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  memberTypeCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  memberTypeCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  memberTypeCountTextActive: {
    color: '#FFFFFF',
  },

  /* Compact Controls Row */
  compactControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  filterTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterTriggerBtnActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#059669',
  },
  filterTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterTriggerTextActive: {
    color: '#059669',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  activeFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  clearAllBtn: {
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  clearAllText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  viewModeToggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewModeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  viewModeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  viewModeBtnTextActive: {
    color: '#059669',
  },

  /* Results Counter */
  resultsCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  resultsCounterText: {
    fontSize: 12.5,
    color: '#64748B',
  },

  /* Batch Section Group */
  batchSectionWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  batchHeaderBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  batchTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  batchCountBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  batchCountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  batchCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  /* Clean Bento Alma Card */
  almaCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
  },
  almaProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  almaAvatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  almaAvatarImage: {
    width: '100%',
    height: '100%',
  },
  almaAvatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  almaAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  almaMemberName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  almaBatchPill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  almaBatchPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#047857',
  },
  almaMemberRole: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 17,
    marginTop: 2,
    fontWeight: '500',
  },
  almaLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  almaLocationText: {
    fontSize: 11,
    color: '#64748B',
  },
  almaCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  almaConnectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#059669',
    backgroundImage: Platform.OS === 'web' ? 'linear-gradient(135deg, #34D399 0%, #059669 100%)' : undefined,
    paddingVertical: 8,
    borderRadius: 10,
  },
  almaConnectBtnRequested: {
    backgroundColor: '#DEF7EC',
    borderWidth: 1,
    borderColor: '#31C48D',
  },
  almaConnectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  almaChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  almaChatBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#008B74',
  },
  almaIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  almaIconBtnActive: {
    backgroundColor: '#DEF7EC',
    borderColor: '#31C48D',
  },

  /* Empty Container */
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 360,
    marginTop: 6,
    lineHeight: 18,
  },
  emptyClearBtn: {
    marginTop: 18,
    backgroundColor: '#059669',
    backgroundImage: Platform.OS === 'web' ? 'linear-gradient(135deg, #34D399 0%, #059669 100%)' : undefined,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyClearBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Modal Filter Box */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filterModalBox: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
    marginBottom: 14,
  },
  filterModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#059669',
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  filterOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  filterOptionRowActive: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  filterOptionText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  filterOptionTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
  filterApplyBtn: {
    backgroundColor: '#059669',
    backgroundImage: Platform.OS === 'web' ? 'linear-gradient(135deg, #34D399 0%, #059669 100%)' : undefined,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  filterApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* Requests & Communities Styles */
  tabContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 40,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  requestInfo: {
    flex: 1,
    marginRight: 10,
  },
  requestName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  requestSubtitle: {
    fontSize: 13,
    color: '#64748B',
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
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyRequestState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyRequestTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  emptyRequestSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  /* WhatsApp Communities */
  commListContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  waNewCommunityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 14,
  },
  waNewCommunityIconPod: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  waNewCommunityPlusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  waNewCommunityTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  waNewCommunitySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  waCommunityBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    overflow: 'hidden',
  },
  waCommunityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  waCommunityAvatarPod: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  waCommunityAvatarImg: {
    width: '100%',
    height: '100%',
  },
  waCommunityName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  waCommunityMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  waCommunityDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  waAnnouncementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: 'rgba(0, 168, 132, 0.05)',
    gap: 12,
  },
  waMegaphonePod: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#00A884',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waChannelTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  waChannelTime: {
    fontSize: 11.5,
    color: '#64748B',
  },
  waChannelSnippet: {
    fontSize: 12.5,
    color: '#475569',
    marginTop: 3,
  },
  waGroupsContainer: {
    paddingVertical: 4,
  },
  waGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  waGroupIconPod: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  waGroupName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  waGroupTime: {
    fontSize: 11,
    color: '#64748B',
  },
  waGroupSnippet: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    marginRight: 8,
  },
  waUnreadBadge: {
    backgroundColor: '#25D366',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waUnreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  /* Modal */
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  modalActionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  wizardBody: {
    paddingVertical: 20,
  },
  commIconSetup: {
    alignItems: 'center',
    marginBottom: 20,
  },
  commIconBgLarge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#A7F3D0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  commIconLabel: {
    fontSize: 13,
  },
  wizardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  wizardInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'right',
  },
  wizardInfoText: {
    fontSize: 13.5,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 19,
  },
  groupSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 8,
  },
  groupSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 12,
  },
  groupDisabledSelect: {
    opacity: 0.8,
    backgroundColor: '#F0FDF4',
    borderColor: '#A7F3D0',
  },
  commGroupIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementBg: {
    backgroundColor: '#A7F3D0',
  },
  groupSelectInfo: {
    flex: 1,
  },
  groupSelectName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  groupSelectDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  successBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  successBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default DirectoryScreen;
