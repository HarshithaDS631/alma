import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView, useWindowDimensions, Alert, StatusBar, Modal, TextInput, Platform, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile, updateProfile, changePassword, deleteAccount, getPosts, getFollowers, getFollowing, toggleFollowUser, logout, setup2FA, verify2FA, disable2FA, getActiveSessions, revokeSession, getLoginHistory, toggleLikePost } from '../services/authService';
import { getChatHistory, sendMessage } from '../services/messageService';
import { uploadFile, getImageUrl } from '../services/uploadService';
import { addComment, deletePost, toggleSavePost, updatePostSettings, editPost, getSavedPosts, getUserPosts } from '../services/postService';
import * as ImagePicker from 'expo-image-picker';

const validatePasswordStrength = (password) => {
  if (password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one special character.' };
  }
  return { valid: true };
};

const ProfileScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const containerWidth = isWeb ? Math.min(width, 800) : width;
  const gridItemSize = (containerWidth - 6) / 3;
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settingsSubView, setSettingsSubView] = useState('menu'); // 'menu' | 'profile_edit' | 'profile_settings' | 'security'
  const [activeTab, setActiveTab] = useState('post'); // 'post' | 'messages' | 'reshare' | 'saved' | 'tags'
  const [listModalType, setListModalType] = useState(null); // 'connections' | 'following'
  
const DEFAULT_FOLLOWING = [
  { id: '6a61f94b23674221799b28f4', name: 'Ruchi', title: 'Alumni • Media Cell', avatar: 'RU', avatar_url: '' },
  { id: '6a59e08bdb5218b5efb52691', name: 'Vidya Aradhya', title: 'Professor • Computer Science', avatar: 'VA', avatar_url: '' },
  { id: '6a59e08bdb5218b5efb52694', name: 'test', title: 'Alumni Member • Social Media', avatar: 'TE', avatar_url: '' },
  { id: '6a59e08bdb5218b5efb52695', name: 'vidya', title: 'Alumni Member • Computer Science', avatar: 'VI', avatar_url: '' },
];

const DEFAULT_CONNECTIONS = [
  { id: '6a61f94b23674221799b28f4', name: 'Ruchi', title: 'Alumni • Media Cell', avatar: 'RU', avatar_url: '' },
  { id: '6a59e08bdb5218b5efb52696', name: 'Harshitha', title: 'Student • Social Media', avatar: 'HA', avatar_url: '' },
];

  // Real data states for connections, following, and messages
  const [connections, setConnections] = useState(DEFAULT_CONNECTIONS);
  const [following, setFollowing] = useState(DEFAULT_FOLLOWING);
  const [profileChats, setProfileChats] = useState([]);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [unfollowTarget, setUnfollowTarget] = useState(null);

  const [profileData, setProfileData] = useState({
    username: 'harshitha',
    name: 'Harshitha',
    branch: 'Social Media',
    batch: '2011',
    bio: 'Alumni Lead @ Media Cell Institution',
    linkedin: '',
    posts: '3',
    followers: '2',
    following: '4',
    avatar: 'HA',
    avatar_url: ''
  });

  useEffect(() => {
    const loadCache = async () => {
      try {
        const [userInfoStr, profileCacheStr] = await Promise.all([
          AsyncStorage.getItem('userInfo'),
          AsyncStorage.getItem('profileCache')
        ]);

        let cachedProfile = {};
        if (profileCacheStr) {
          try { cachedProfile = JSON.parse(profileCacheStr); } catch (e) {}
        }

        if (userInfoStr) {
          const cached = JSON.parse(userInfoStr);
          const rawAvatar = cached.avatar_url || cached.profilePicture;
          const safeEmail = (cached.email && typeof cached.email === 'string') ? cached.email : '';
          const uName = cached.name || (safeEmail ? safeEmail.split('@')[0] : 'Harshitha');
          const uHandle = safeEmail ? safeEmail.split('@')[0] : (cached.username || 'harshitha');
          setProfileData(prev => ({
            ...prev,
            name: uName,
            username: uHandle,
            branch: cached.department || cached.branch || 'Social Media',
            batch: cached.batchYear || cached.batch_year || '2011',
            bio: cached.bio || `Media Cell Institution Class of ${cached.batchYear || '2011'}`,
            linkedin: cached.linkedin || '',
            posts: cachedProfile.posts || prev.posts || '3',
            followers: cachedProfile.followers || prev.followers || '2',
            following: cachedProfile.following || prev.following || '7',
            avatar: uName ? uName.substring(0, 2).toUpperCase() : 'HA',
            avatar_url: rawAvatar ? getImageUrl(rawAvatar) : ''
          }));

          if (cachedProfile.userPosts && Array.isArray(cachedProfile.userPosts) && cachedProfile.userPosts.length > 0) {
            setUserPosts(cachedProfile.userPosts);
          }
          if (cachedProfile.resharedPosts && Array.isArray(cachedProfile.resharedPosts) && cachedProfile.resharedPosts.length > 0) {
            setResharedPosts(cachedProfile.resharedPosts);
          }
          if (cachedProfile.savedPosts && Array.isArray(cachedProfile.savedPosts) && cachedProfile.savedPosts.length > 0) {
            setSavedPosts(cachedProfile.savedPosts);
          }
          if (cachedProfile.taggedPosts && Array.isArray(cachedProfile.taggedPosts) && cachedProfile.taggedPosts.length > 0) {
            setTaggedPosts(cachedProfile.taggedPosts);
          }
          if (cachedProfile.connections && Array.isArray(cachedProfile.connections) && cachedProfile.connections.length > 0) {
            setConnections(cachedProfile.connections);
          }
          if (cachedProfile.followingList && Array.isArray(cachedProfile.followingList) && cachedProfile.followingList.length > 0) {
            setFollowing(cachedProfile.followingList);
          }
        }
      } catch (e) {}
    };
    loadCache();
  }, []);

const DEFAULT_USER_POSTS = [
  {
    _id: '6a60ac428947b73a8c9c9b89',
    id: '6a60ac428947b73a8c9c9b89',
    user: { _id: '6a59e08bdb5218b5efb52690', name: 'Harshitha', username: 'harshitha' },
    content: '#Institution #AlumniMeet #Mentorship #TechTalk #Careers #ClassOf2024',
    image: 'https://backend-pi-bice-97.vercel.app/api/upload/c2208d41877125fc2d37697cb4f22cbd.webp',
    image_url: 'https://backend-pi-bice-97.vercel.app/api/upload/c2208d41877125fc2d37697cb4f22cbd.webp',
    createdAt: '2026-07-22T11:40:50.466Z'
  },
  {
    _id: '6a60ac428947b73a8c9c9b90',
    id: '6a60ac428947b73a8c9c9b90',
    user: { _id: '6a59e08bdb5218b5efb52690', name: 'Harshitha', username: 'harshitha' },
    content: 'Excited to be part of the Alumni Network! Great to reconnect with everyone. 🎓',
    image: 'https://backend-pi-bice-97.vercel.app/api/upload/e5209795256356fd28117ffdacf98b0e.webp',
    image_url: 'https://backend-pi-bice-97.vercel.app/api/upload/e5209795256356fd28117ffdacf98b0e.webp',
    createdAt: '2026-07-20T10:00:00.000Z'
  },
  {
    _id: '6a60ac428947b73a8c9c9b91',
    id: '6a60ac428947b73a8c9c9b91',
    user: { _id: '6a59e08bdb5218b5efb52690', name: 'Harshitha', username: 'harshitha' },
    content: 'Looking forward to the upcoming Alumni Mentorship Program. Who else is joining? 💼',
    image: '',
    image_url: '',
    createdAt: '2026-07-18T09:00:00.000Z'
  }
];


const DEFAULT_RESHARED_POSTS = [
  {
    _id: '6a66e6bbcc03eff12d00bd02',
    id: '6a66e6bbcc03eff12d00bd02',
    user: { _id: '6a59e08bdb5218b5efb52690', name: 'harshitha', username: 'harshithads' },
    content: '🔄 Reshared from @Ruchi: ',
    image: 'https://backend-pi-bice-97.vercel.app/api/upload/78417866da41eb1f43e8f1b53ef77f57.webp',
    image_url: 'https://backend-pi-bice-97.vercel.app/api/upload/78417866da41eb1f43e8f1b53ef77f57.webp',
    isReshare: true,
    originalAuthorName: 'Ruchi'
  },
  {
    _id: '6a66e19f14e45a7fa4fea1a7',
    id: '6a66e19f14e45a7fa4fea1a7',
    user: { _id: '6a59e08bdb5218b5efb52690', name: 'harshitha', username: 'harshithads' },
    content: 'Reshared from @Ruchi:\n\nReshared from @test:\n\nerr3wrefe',
    image: 'https://backend-pi-bice-97.vercel.app/api/upload/109f5cddce5b48ee0c57282c940db1b9.png',
    image_url: 'https://backend-pi-bice-97.vercel.app/api/upload/109f5cddce5b48ee0c57282c940db1b9.png',
    isReshare: true,
    originalAuthorName: 'Ruchi'
  }
];

const DEFAULT_SAVED_POSTS = [
  {
    _id: '6a6080e3f4c37e54625325e4',
    id: '6a6080e3f4c37e54625325e4',
    user: { name: 'Media Cell Admin' },
    content: '#AlumniMeet #Institution Official Announcement',
    image: 'https://backend-pi-bice-97.vercel.app/api/upload/e5209795256356fd28117ffdacf98b0e.webp',
    image_url: 'https://backend-pi-bice-97.vercel.app/api/upload/e5209795256356fd28117ffdacf98b0e.webp'
  },
  {
    _id: '6a61f94b23674221799b28f4',
    id: '6a61f94b23674221799b28f4',
    user: { name: 'Ruchi' },
    content: 'Excited to connect with alumni and students!',
    image: 'https://backend-pi-bice-97.vercel.app/api/upload/78417866da41eb1f43e8f1b53ef77f57.webp',
    image_url: 'https://backend-pi-bice-97.vercel.app/api/upload/78417866da41eb1f43e8f1b53ef77f57.webp'
  }
];

const DEFAULT_TAGGED_POSTS = [
  {
    _id: '6a61f94b23674221799b28f4',
    id: '6a61f94b23674221799b28f4',
    user: { name: 'Ruchi' },
    content: 'Great event with @harshitha!',
    image: 'https://backend-pi-bice-97.vercel.app/api/upload/78417866da41eb1f43e8f1b53ef77f57.webp',
    image_url: 'https://backend-pi-bice-97.vercel.app/api/upload/78417866da41eb1f43e8f1b53ef77f57.webp',
    tags: [{ name: 'harshitha' }]
  }
];

  // Start with empty arrays — only real API data or real user's own cached posts are shown
  const [userPosts, setUserPosts] = useState([]);
  const [resharedPosts, setResharedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [taggedPosts, setTaggedPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  const commentInputRef = useRef(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [postOptionsModalVisible, setPostOptionsModalVisible] = useState(false);
  const [editPostModalVisible, setEditPostModalVisible] = useState(false);
  const [editPostText, setEditPostText] = useState('');
  const [shareSearchQuery, setShareSearchQuery] = useState('');
  const [sentMap, setSentMap] = useState({});
  const [highlights, setHighlights] = useState([
    { id: '1', title: 'Campus', icon: 'school-outline' },
    { id: '2', title: 'Work', icon: 'briefcase-outline' },
    { id: '3', title: 'Events', icon: 'calendar-outline' },
    { id: '4', title: 'Projects', icon: 'code-slash-outline' },
  ]);

  useFocusEffect(
    useCallback(() => {
      const fetchRecentChats = async () => {
        try {
          const history = await getChatHistory();
          if (history && Array.isArray(history)) {
            setProfileChats(history);
          }
        } catch (err) {
          console.log('Error loading profile chats:', err);
        }
      };
      fetchRecentChats();

      const loadAllData = async () => {
        try {
          // 1. Fetch profile first to get the user ID
          const userData = await getProfile().catch(() => null);
          const cachedStr = await AsyncStorage.getItem('userInfo');
          const cachedObj = cachedStr ? JSON.parse(cachedStr) : null;

          const activeUser = {
            ...cachedObj,
            ...userData,
            _id: (userData && (userData._id || userData.id)) || (cachedObj && (cachedObj._id || cachedObj.id))
          };

          if (activeUser && (activeUser._id || activeUser.email)) {
            try {
              await AsyncStorage.setItem('userInfo', JSON.stringify({
                ...cachedObj,
                ...activeUser
              }));
            } catch (e) {}

            const rawAvatar = activeUser.avatar_url || activeUser.profilePicture;
            const fullAvatarUrl = rawAvatar ? getImageUrl(rawAvatar) : '';
            const safeEmail = (activeUser.email && typeof activeUser.email === 'string') ? activeUser.email : '';
            const uName = activeUser.name || (safeEmail ? safeEmail.split('@')[0] : 'Harshitha');
            const uHandle = safeEmail ? safeEmail.split('@')[0] : (activeUser.username || 'harshitha');

            setProfileData(prev => ({
              ...prev,
              name: uName,
              username: uHandle,
              branch: activeUser.department || activeUser.branch || 'Social Media',
              batch: activeUser.batchYear || activeUser.batch_year || '2011',
              bio: activeUser.bio || `Media Cell Institution Class of ${activeUser.batchYear || '2011'}`,
              linkedin: activeUser.linkedin || '',
              avatar: uName ? uName.substring(0, 2).toUpperCase() : 'HA',
              avatar_url: fullAvatarUrl
            }));

            // 2. Fetch connections
            const [followersData, followingData] = await Promise.all([
              getFollowers().catch(() => []),
              getFollowing().catch(() => [])
            ]);
            
            let parsedConnections = [];
            if (Array.isArray(followersData) && followersData.length > 0) {
              parsedConnections = followersData.filter(Boolean).map((s, idx) => {
                const isObj = typeof s === 'object' && s !== null;
                const sName = isObj ? (s.name || s.username || (s.email ? s.email.split('@')[0] : 'Alumni Member')) : 'Alumni Member';
                const sId = isObj ? (s._id || s.id || `f-${idx}`) : (s || `f-${idx}`);
                const sCompany = isObj ? s.company : '';
                const sDesig = isObj ? s.designation : '';
                const sDept = isObj ? (s.department || s.branch || '') : '';
                const sBatch = isObj ? (s.batchYear || s.batch_year || '') : '';
                const sTitle = sCompany ? `${sDesig ? sDesig + ' @ ' : ''}${sCompany}`.trim() : [sDept, sBatch ? `Batch ${sBatch}` : ''].filter(Boolean).join(' • ') || 'Alumni Member';
                const sAvatarUrl = isObj ? (s.avatar_url || s.profilePicture || '') : '';

                return {
                  id: sId,
                  name: sName,
                  title: sTitle,
                  avatar: sName ? sName.substring(0, 2).toUpperCase() : 'AL',
                  avatar_url: sAvatarUrl ? getImageUrl(sAvatarUrl) : ''
                };
              });
              setConnections(parsedConnections);
            }
            
            let parsedFollowing = [];
            if (Array.isArray(followingData) && followingData.length > 0) {
              parsedFollowing = followingData.filter(Boolean).map((s, idx) => {
                const isObj = typeof s === 'object' && s !== null;
                const sName = isObj ? (s.name || s.username || (s.email ? s.email.split('@')[0] : 'Alumni Member')) : 'Alumni Member';
                const sId = isObj ? (s._id || s.id || `fl-${idx}`) : (s || `fl-${idx}`);
                const sCompany = isObj ? s.company : '';
                const sDesig = isObj ? s.designation : '';
                const sDept = isObj ? (s.department || s.branch || '') : '';
                const sBatch = isObj ? (s.batchYear || s.batch_year || '') : '';
                const sTitle = sCompany ? `${sDesig ? sDesig + ' @ ' : ''}${sCompany}`.trim() : [sDept, sBatch ? `Batch ${sBatch}` : ''].filter(Boolean).join(' • ') || 'Alumni Member';
                const sAvatarUrl = isObj ? (s.avatar_url || s.profilePicture || '') : '';

                return {
                  id: sId,
                  name: sName,
                  title: sTitle,
                  avatar: sName ? sName.substring(0, 2).toUpperCase() : 'AL',
                  avatar_url: sAvatarUrl ? getImageUrl(sAvatarUrl) : ''
                };
              });
              setFollowing(parsedFollowing);
            }

            const followersCountStr = (parsedConnections.length > 0 ? parsedConnections.length : DEFAULT_CONNECTIONS.length).toString();
            const followingCountStr = (parsedFollowing.length > 0 ? parsedFollowing.length : DEFAULT_FOLLOWING.length).toString();

            setProfileData(prev => ({
              ...prev,
              followers: followersCountStr,
              following: followingCountStr,
            }));

            // 3. Fetch and filter posts (combining feed posts, user profile posts, and saved posts)
            const [feedPosts, profilePostsData, savedData] = await Promise.all([
              getPosts().catch(() => []),
              getUserPosts().catch(() => []),
              getSavedPosts().catch(() => [])
            ]);

            const deduplicatePosts = (arr) => {
              if (!arr || !Array.isArray(arr)) return [];
              const seen = new Set();
              return arr.filter(p => {
                if (!p) return false;
                const pId = (p._id || p.id || p).toString();
                if (seen.has(pId)) return false;
                seen.add(pId);
                return true;
              });
            };

            const postsData = deduplicatePosts([...(feedPosts || []), ...(profilePostsData || [])]);

            if (postsData && Array.isArray(postsData) && activeUser) {
              const currentUserIdStr = (activeUser._id || activeUser.id || '').toString();
              const activeNameClean = (activeUser.name || '').toLowerCase();

              const isAuthorMe = (p) => {
                if (!p || !p.user) return false;
                const authorId = (p.user._id || p.user.id || p.user).toString();
                if (currentUserIdStr && authorId === currentUserIdStr) return true;
                const authorName = (p.user.name || p.user.username || '').toLowerCase();
                if (activeNameClean && authorName === activeNameClean) return true;
                // Also match by partial email/username fragments for harshitha accounts
                const activeEmail = (activeUser.email || '').toLowerCase();
                const activeUsernameFrag = activeEmail ? activeEmail.split('@')[0] : '';
                if (activeUsernameFrag && authorName.includes(activeUsernameFrag)) return true;
                if (activeUsernameFrag && (p.user.username || '').toLowerCase().includes(activeUsernameFrag)) return true;
                return false;
              };

              // ALL MY ORIGINAL POSTS only (no reshares) — shown under Posts tab
              const isResharePost = (p) => Boolean(
                p.originalPost || p.isReshare || p.originalAuthorName ||
                (p.content && /reshared\s+from/i.test(p.content))
              );
              let myPosts = postsData.filter(p => isAuthorMe(p) && !p.isArchived && !isResharePost(p));

              // RESHARED POSTS: Created as reshares OR explicitly reshared by user
              let myResharedPosts = postsData.filter(p => {
                const isMyPost = isAuthorMe(p);
                const isReshare = Boolean(p.originalPost || p.isReshare || p.originalAuthorName || (p.content && /reshared\s+from/i.test(p.content)));
                const isExplicitReshare = p.reshares && Array.isArray(p.reshares) && p.reshares.some(id => {
                  const rId = (id._id || id.id || id).toString();
                  return currentUserIdStr && rId === currentUserIdStr;
                });
                return ((isMyPost && isReshare) || isExplicitReshare) && !p.isArchived;
              });

              // TAGGED POSTS
              let myTaggedPosts = postsData.filter(p =>
                p.user &&
                (
                  (p.tags && Array.isArray(p.tags) && p.tags.some(t => {
                    const tId = (t._id || t.id || t).toString();
                    const tName = (t.name || '').toLowerCase();
                    return (currentUserIdStr && tId === currentUserIdStr) || (activeNameClean && tName === activeNameClean);
                  })) ||
                  (p.content && activeNameClean && p.content.toLowerCase().includes(`@${activeNameClean}`)) ||
                  (p.content && p.content.toLowerCase().includes('harshitha'))
                )
                && !p.isArchived
              );

              myPosts = deduplicatePosts(myPosts);
              myResharedPosts = deduplicatePosts(myResharedPosts);
              myTaggedPosts = deduplicatePosts(myTaggedPosts);

              myPosts.sort((a, b) => (b.isPinned === a.isPinned) ? 0 : (b.isPinned ? 1 : -1));

              const postsCountStr = myPosts.length > 0 ? myPosts.length.toString() : '0';

              setProfileData(prev => ({
                ...prev,
                posts: postsCountStr,
              }));

              // Only store real user posts — no hardcoded defaults
              setUserPosts(myPosts);
              setResharedPosts(myResharedPosts);
              setTaggedPosts(myTaggedPosts);

              const parsedSaved = (savedData && Array.isArray(savedData) && savedData.length > 0) ? deduplicatePosts(savedData) : [];
              setSavedPosts(parsedSaved);

              // Persist full profile cache into AsyncStorage so next launch loads 0ms instantly
              AsyncStorage.setItem('profileCache', JSON.stringify({
                posts: postsCountStr,
                followers: followersCountStr,
                following: followingCountStr,
                userPosts: myPosts,
                resharedPosts: myResharedPosts,
                savedPosts: parsedSaved,
                taggedPosts: myTaggedPosts,
                connections: parsedConnections,
                followingList: parsedFollowing
              })).catch(() => {});
            }
          }
        } catch (e) {
          console.error('Error loading profile data:', e);
        }
      };

      loadAllData();
    }, [])
  );

  // Profile Editing States
  const [editName, setEditName] = useState(profileData.name);
  const [editUsername, setEditUsername] = useState(profileData.username);
  const [editBranch, setEditBranch] = useState(profileData.branch);
  const [editBatch, setEditBatch] = useState(profileData.batch);
  const [editBio, setEditBio] = useState(profileData.bio);
  const [editLinkedin, setEditLinkedin] = useState(profileData.linkedin);
  const [editAvatarUrl, setEditAvatarUrl] = useState(profileData.avatar_url || '');

  const handlePickProfilePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          alert('Permission to access photos is required to update profile photo.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2, // Heavily compress avatars to fit under Vercel's 4.5MB limit
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        const uploadedUrl = await uploadFile(selectedUri, 'image/jpeg', `avatar_${Date.now()}.jpg`);
        
        setProfileData(prev => ({
          ...prev,
          avatar_url: uploadedUrl
        }));
        setEditAvatarUrl(uploadedUrl);

        try {
          await updateProfile({ avatar_url: uploadedUrl });
        } catch (e) {
          console.warn('Backend update failed, updating local storage session', e);
        }

        try {
          const cachedStr = await AsyncStorage.getItem('userInfo');
          if (cachedStr) {
            const cached = JSON.parse(cachedStr);
            cached.avatar_url = uploadedUrl;
            await AsyncStorage.setItem('userInfo', JSON.stringify(cached));
          }
        } catch (e) {}

        if (Platform.OS === 'web') {
          alert('Profile photo updated successfully!');
        } else {
          Alert.alert('Success', 'Profile photo updated successfully!');
        }
      }
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      if (Platform.OS === 'web') {
        alert('Profile photo updated locally.');
      } else {
        Alert.alert('Notice', 'Profile photo updated locally.');
      }
    }
  };

  // Settings States
  const [privateAccount, setPrivateAccount] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [jobAlerts, setJobAlerts] = useState(true);

  // Security States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);

  const mockTags = [];
  const mockSaved = [];
  const mockReshares = [];

  const handleSettings = () => {
    setSettingsSubView('menu');
    setSettingsVisible(true);
  };

  const handleOpenEdit = () => {
    setEditName(profileData.name);
    setEditUsername(profileData.username);
    setEditBranch(profileData.branch);
    setEditBatch(profileData.batch);
    setEditBio(profileData.bio);
    setEditLinkedin(profileData.linkedin || '');
    setSettingsSubView('profile_edit');
    setSettingsVisible(true);
  };

  const handleLogout = () => {
    const performLogout = async () => {
      setSettingsVisible(false);
      try {
        await logout().catch(err => console.log('Logout API call error:', err));
        await AsyncStorage.clear();
      } catch (error) {
        console.error('Failed to clear user session', error);
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    };

    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to log out of the Alumni portal?');
      if (confirmLogout) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Confirm Logout',
        'Are you sure you want to log out of the Alumni portal?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive', onPress: performLogout }
        ]
      );
    }
  };

  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 800, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={webContainerStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={{ marginRight: 8, padding: 8, borderRadius: 20, zIndex: 999 }} 
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            activeOpacity={0.6}
            onPress={() => {
              if (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
                navigation.goBack();
              } else if (navigation && typeof navigation.navigate === 'function') {
                navigation.navigate('Main');
              }
            }}
          >
            <Ionicons name="arrow-back" size={26} color={theme.text} />
          </TouchableOpacity>
          <Ionicons name="shield-checkmark" size={18} color="#003366" />
          <Text style={styles.headerUsername}>{profileData.username}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('PostCreation')} activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={26} color="#002144" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={handleSettings} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={24} color="#002144" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info Section */}
        <View style={styles.profileInfoContainer}>
          <View style={styles.mainInfoRow}>
            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              <View style={styles.storyRing}>
                <View style={styles.avatar}>
                  {profileData.avatar_url ? (
                    <Image source={{ uri: profileData.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 45 }} />
                  ) : (
                    <Text style={styles.avatarText}>{profileData.avatar}</Text>
                  )}
                </View>
                <TouchableOpacity 
                  onPress={handlePickProfilePhoto}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: theme.primary,
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: theme.card
                  }}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Stats */}
            <View style={styles.statsContainer}>
              <TouchableOpacity style={styles.statBox} onPress={() => setActiveTab('post')} activeOpacity={0.7}>
                <Text style={styles.statNumber}>{profileData.posts}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statBox} onPress={() => setListModalType('connections')} activeOpacity={0.7}>
                <Text style={styles.statNumber}>{connections.length || profileData.followers}</Text>
                <Text style={styles.statLabel}>Connections</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statBox} onPress={() => setListModalType('following')} activeOpacity={0.7}>
                <Text style={styles.statNumber}>{following.length || profileData.following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bio */}
          <View style={styles.bioContainer}>
            <Text style={styles.nameText}>
              {profileData.name} <Text style={{fontSize: 14, color: '#3B82F6', fontWeight: 'bold'}}>• Alumni</Text>
            </Text>
            <Text style={styles.occupationText}>{profileData.branch} Class of {profileData.batch}</Text>
            <Text style={styles.bioText}>{profileData.bio}</Text>
            {profileData.linkedin ? (
              <TouchableOpacity onPress={() => Platform.OS === 'web' && window.open(profileData.linkedin, '_blank')}>
                <Text style={{ color: '#0A66C2', fontWeight: '600', fontSize: 13, marginTop: 4 }}>
                  🔗 {profileData.linkedin}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>



          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.actionButton, { flex: 1, marginRight: 8 }]} onPress={handleOpenEdit} activeOpacity={0.7}>
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { flex: 1, marginRight: 8, backgroundColor: 'rgba(0, 33, 68, 0.08)' }]} 
              onPress={() => {
                if (Platform.OS === 'web' && navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Profile link copied to clipboard!');
                } else {
                  alert(`Profile link: https://alma-connect.vercel.app/profile/${profileData.username}`);
                }
              }} 
              activeOpacity={0.7}
            >
              <Text style={[styles.actionButtonText, { color: theme.primary }]}>Share Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.smallIconBtn} onPress={handleLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Instagram-style Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'post' && styles.activeTabButton]} 
            onPress={() => setActiveTab('post')}
            activeOpacity={0.7}
          >
            <Ionicons name={activeTab === 'post' ? 'grid' : 'grid-outline'} size={20} color={activeTab === 'post' ? theme.primary : theme.textMuted} />
            <Text style={[styles.tabLabel, activeTab === 'post' && styles.activeTabLabel]}>Posts</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'reshare' && styles.activeTabButton]} 
            onPress={() => setActiveTab('reshare')}
            activeOpacity={0.7}
          >
            <Ionicons name={activeTab === 'reshare' ? 'repeat' : 'repeat-outline'} size={20} color={activeTab === 'reshare' ? theme.primary : theme.textMuted} />
            <Text style={[styles.tabLabel, activeTab === 'reshare' && styles.activeTabLabel]}>Reshares</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'saved' && styles.activeTabButton]} 
            onPress={() => setActiveTab('saved')}
            activeOpacity={0.7}
          >
            <Ionicons name={activeTab === 'saved' ? 'bookmark' : 'bookmark-outline'} size={20} color={activeTab === 'saved' ? theme.primary : theme.textMuted} />
            <Text style={[styles.tabLabel, activeTab === 'saved' && styles.activeTabLabel]}>Saved</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'tags' && styles.activeTabButton]} 
            onPress={() => setActiveTab('tags')}
            activeOpacity={0.7}
          >
            <Ionicons name={activeTab === 'tags' ? 'pricetag' : 'pricetag-outline'} size={20} color={activeTab === 'tags' ? theme.primary : theme.textMuted} />
            <Text style={[styles.tabLabel, activeTab === 'tags' && styles.activeTabLabel]}>Tags</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content Section */}
        {(() => {
          const displayUserPosts = Array.isArray(userPosts) ? userPosts : [];
          const displayResharedPosts = Array.isArray(resharedPosts) ? resharedPosts : [];
          const displaySavedPosts = Array.isArray(savedPosts) ? savedPosts : [];
          const displayTaggedPosts = Array.isArray(taggedPosts) ? taggedPosts : [];

          // Reusable empty state component
          const EmptyState = ({ icon, message }) => (
            <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
              <Ionicons name={icon} size={48} color={theme.textMuted} style={{ marginBottom: 12, opacity: 0.5 }} />
              <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>{message}</Text>
            </View>
          );

          if (activeTab === 'post') {
            if (displayUserPosts.length === 0) {
              return <EmptyState icon="grid-outline" message="No posts yet. Share something with your network!" />;
            }
            return (
              <View style={styles.postsGrid}>
                {displayUserPosts.map((post) => (
                  <TouchableOpacity 
                    key={post._id || post.id} 
                    style={[styles.gridItem, { width: gridItemSize, height: gridItemSize }]} 
                    activeOpacity={0.85}
                    onPress={() => setSelectedPost(post)}
                  >
                    {(post.image || post.image_url) ? (
                      <Image source={{ uri: getImageUrl(post.image || post.image_url) }} style={styles.gridImage} />
                    ) : (
                      <View style={[styles.gridImage, { backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 10, borderWidth: 0.5, borderColor: '#E2E8F0' }]}>
                        <Ionicons name="document-text-outline" size={24} color={theme.primary} style={{ marginBottom: 6 }} />
                        <Text style={{fontSize: 11, color: '#334155', fontWeight: '500', textAlign: 'center'}} numberOfLines={3}>{post.content}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            );
          }

          if (activeTab === 'tags') {
            if (displayTaggedPosts.length === 0) {
              return <EmptyState icon="pricetag-outline" message="No tagged posts yet." />;
            }
            return (
              <View style={styles.postsGrid}>
                {displayTaggedPosts.map((post) => (
                  <TouchableOpacity 
                    key={post._id || post.id} 
                    style={[styles.gridItem, { width: gridItemSize, height: gridItemSize }]} 
                    activeOpacity={0.85}
                    onPress={() => setSelectedPost(post)}
                  >
                    {(post.image || post.image_url) ? (
                      <Image source={{ uri: getImageUrl(post.image || post.image_url) }} style={styles.gridImage} />
                    ) : (
                      <View style={[styles.gridImage, { backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 10, borderWidth: 0.5, borderColor: '#E2E8F0' }]}>
                        <Ionicons name="document-text-outline" size={24} color={theme.primary} style={{ marginBottom: 6 }} />
                        <Text style={{fontSize: 11, color: '#334155', fontWeight: '500', textAlign: 'center'}} numberOfLines={3}>{post.content}</Text>
                      </View>
                    )}
                    <View style={styles.tagOverlay}>
                      <Ionicons name="person" size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          }

          if (activeTab === 'saved') {
            if (displaySavedPosts.length === 0) {
              return <EmptyState icon="bookmark-outline" message="No saved posts yet. Bookmark posts to see them here." />;
            }
            return (
              <View style={styles.postsGrid}>
                {displaySavedPosts.map((post) => (
                  <TouchableOpacity 
                    key={post._id || post.id} 
                    style={[styles.gridItem, { width: gridItemSize, height: gridItemSize }]} 
                    activeOpacity={0.85}
                    onPress={() => setSelectedPost(post)}
                  >
                    {(post.image || post.image_url) ? (
                      <Image source={{ uri: getImageUrl(post.image || post.image_url) }} style={styles.gridImage} />
                    ) : (
                      <View style={[styles.gridImage, { backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 10, borderWidth: 0.5, borderColor: '#E2E8F0' }]}>
                        <Ionicons name="bookmark" size={24} color={theme.primary} style={{ marginBottom: 6 }} />
                        <Text style={{fontSize: 11, color: '#334155', fontWeight: '500', textAlign: 'center'}} numberOfLines={3}>{post.content}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            );
          }

          if (activeTab === 'reshare') {
            if (displayResharedPosts.length === 0) {
              return <EmptyState icon="repeat-outline" message="No reshares yet. Reshare posts from your feed to see them here." />;
            }
            return (
              <View style={styles.postsGrid}>
                {displayResharedPosts.map((post) => (
                  <TouchableOpacity 
                    key={post._id || post.id} 
                    style={[styles.gridItem, { width: gridItemSize, height: gridItemSize }]} 
                    activeOpacity={0.85}
                    onPress={() => setSelectedPost(post)}
                  >
                    {(post.image || post.image_url) ? (
                      <Image source={{ uri: getImageUrl(post.image || post.image_url) }} style={styles.gridImage} />
                    ) : (
                      <View style={[styles.gridImage, { backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 10, borderWidth: 0.5, borderColor: '#E2E8F0' }]}>
                        <Ionicons name="repeat" size={24} color={theme.primary} style={{ marginBottom: 6 }} />
                        <Text style={{fontSize: 11, color: '#334155', fontWeight: '500', textAlign: 'center'}} numberOfLines={3}>{post.content}</Text>
                      </View>
                    )}
                    <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: '#003366', borderRadius: 12, padding: 4 }}>
                      <Ionicons name="repeat" size={12} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          }

          return null;
        })()}
      </ScrollView>

      {/* Settings Modal Sheet */}
      <Modal visible={settingsVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => { setSettingsVisible(false); setSettingsSubView('menu'); }} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              {settingsSubView !== 'menu' ? (
                <TouchableOpacity onPress={() => setSettingsSubView('menu')}>
                  <Ionicons name="arrow-back" size={24} color="#003366" />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 24 }} />
              )}
              <Text style={styles.modalTitle}>
                {settingsSubView === 'menu' && 'Settings'}
                {settingsSubView === 'profile_edit' && 'Edit Profile'}
                {settingsSubView === 'profile_settings' && 'Profile Settings'}
                {settingsSubView === 'security' && 'Login & Security'}
              </Text>
              <TouchableOpacity onPress={() => { setSettingsVisible(false); setSettingsSubView('menu'); }}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            
            {/* Main Menu Sub-view */}
            {settingsSubView === 'menu' && (
              <View>
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={handleOpenEdit}
                >
                  <Ionicons name="person-outline" size={22} color="#003366" style={{ marginRight: 12 }} />
                  <Text style={styles.modalItemText}>Profile Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => setSettingsSubView('profile_settings')}
                >
                  <Ionicons name="settings-outline" size={22} color="#003366" style={{ marginRight: 12 }} />
                  <Text style={styles.modalItemText}>Profile Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => setSettingsSubView('security')}
                >
                  <Ionicons name="shield-checkmark-outline" size={22} color="#003366" style={{ marginRight: 12 }} />
                  <Text style={styles.modalItemText}>Login & Security</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalItem, { borderBottomWidth: 0 }]}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={22} color="#FF3B30" style={{ marginRight: 12 }} />
                  <Text style={[styles.modalItemText, { color: '#FF3B30' }]}>Log Out</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Profile Edit Sub-view */}
            {settingsSubView === 'profile_edit' && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380, marginTop: 10 }}>
                <Text style={styles.settingsSectionTitle}>Profile Information</Text>
                
                {/* Photo Upload Option */}
                <View style={{ alignItems: 'center', marginVertical: 12 }}>
                  <TouchableOpacity 
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(0, 33, 68, 0.08)',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20
                    }}
                    onPress={handlePickProfilePhoto}
                  >
                    <Ionicons name="camera-outline" size={18} color={theme.primary} style={{ marginRight: 6 }} />
                    <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 13 }}>Change Profile Photo</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.editLabel}>Profile Picture Image URL</Text>
                <TextInput 
                  style={styles.securityInput} 
                  placeholder="https://example.com/avatar.jpg" 
                  placeholderTextColor="#94A3B8"
                  value={editAvatarUrl}
                  onChangeText={setEditAvatarUrl}
                />

                <Text style={styles.editLabel}>Full Name</Text>
                <TextInput 
                  style={styles.securityInput} 
                  placeholder="Full Name" 
                  placeholderTextColor="#94A3B8"
                  value={editName}
                  onChangeText={setEditName}
                />

                <Text style={styles.editLabel}>Username</Text>
                <TextInput 
                  style={styles.securityInput} 
                  placeholder="Username" 
                  placeholderTextColor="#94A3B8"
                  value={editUsername}
                  onChangeText={setEditUsername}
                />

                <Text style={styles.editLabel}>Branch / Department</Text>
                <TextInput 
                  style={styles.securityInput} 
                  placeholder="Branch / Department" 
                  placeholderTextColor="#94A3B8"
                  value={editBranch}
                  onChangeText={setEditBranch}
                />

                <Text style={styles.editLabel}>Graduation Batch Year</Text>
                <TextInput 
                  style={styles.securityInput} 
                  placeholder="Batch Year" 
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={editBatch}
                  onChangeText={setEditBatch}
                />

                <Text style={styles.editLabel}>Bio</Text>
                <TextInput 
                  style={[styles.securityInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]} 
                  placeholder="Write your bio..." 
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={editBio}
                  onChangeText={setEditBio}
                />

                <Text style={styles.editLabel}>LinkedIn Profile URL</Text>
                <TextInput 
                  style={styles.securityInput} 
                  placeholder="https://linkedin.com/in/username" 
                  placeholderTextColor="#94A3B8"
                  value={editLinkedin}
                  onChangeText={setEditLinkedin}
                />

                <TouchableOpacity 
                  style={styles.saveSettingsBtn}
                  onPress={() => {
                    if (!editName.trim() || !editUsername.trim()) {
                      Alert.alert('Required', 'Name and username cannot be empty.');
                      return;
                    }
                    setProfileData({
                      ...profileData,
                      name: editName,
                      username: editUsername,
                      branch: editBranch,
                      batch: editBatch,
                      bio: editBio,
                      linkedin: editLinkedin,
                      avatar_url: editAvatarUrl,
                      avatar: editName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AJ'
                    });

                    const submitProfileUpdate = async () => {
                      try {
                        await updateProfile({
                          name: editName,
                          department: editBranch,
                          batch_year: editBatch,
                          bio: editBio,
                          linkedin: editLinkedin,
                          avatar_url: editAvatarUrl
                        });
                      } catch (err) {
                        console.error('Error saving profile:', err);
                      }

                      try {
                        const cachedStr = await AsyncStorage.getItem('userInfo');
                        if (cachedStr) {
                          const cached = JSON.parse(cachedStr);
                          cached.name = editName;
                          cached.department = editBranch;
                          cached.branch = editBranch;
                          cached.batchYear = editBatch;
                          cached.batch_year = editBatch;
                          cached.bio = editBio;
                          cached.linkedin = editLinkedin;
                          if (editAvatarUrl) cached.avatar_url = editAvatarUrl;
                          await AsyncStorage.setItem('userInfo', JSON.stringify(cached));
                        }
                      } catch (e) {}
                    };
                    submitProfileUpdate();

                    setSettingsVisible(false);
                    setSettingsSubView('menu');
                    if (Platform.OS === 'web') {
                      alert('Profile updated successfully!');
                    } else {
                      Alert.alert('Success', 'Profile updated successfully!');
                    }
                  }}
                >
                  <Text style={styles.saveSettingsBtnText}>Save Profile</Text>
                </TouchableOpacity>
                <View style={{ height: 20 }} />
              </ScrollView>
            )}

            {/* Profile Settings Sub-view */}
            {settingsSubView === 'profile_settings' && (
              <View style={{ marginTop: 10 }}>
                {/* Privacy Toggle */}
                <View style={styles.settingsRow}>
                  <View>
                    <Text style={styles.settingsRowLabel}>Private Profile</Text>
                    <Text style={styles.settingsRowDesc}>Only approved connections can see your posts.</Text>
                  </View>
                  <TouchableOpacity onPress={() => setPrivateAccount(!privateAccount)}>
                    <Ionicons name={privateAccount ? "toggle" : "toggle-outline"} size={40} color={privateAccount ? "#003366" : "#CBD5E1"} />
                  </TouchableOpacity>
                </View>

                {/* Notifications Toggles */}
                <View style={styles.settingsRow}>
                  <View>
                    <Text style={styles.settingsRowLabel}>Push Notifications</Text>
                    <Text style={styles.settingsRowDesc}>Receive notifications for connections & messages.</Text>
                  </View>
                  <TouchableOpacity onPress={() => setPushNotifications(!pushNotifications)}>
                    <Ionicons name={pushNotifications ? "toggle" : "toggle-outline"} size={40} color={pushNotifications ? "#003366" : "#CBD5E1"} />
                  </TouchableOpacity>
                </View>

                <View style={styles.settingsRow}>
                  <View>
                    <Text style={styles.settingsRowLabel}>Email Digest</Text>
                    <Text style={styles.settingsRowDesc}>Weekly digest of top alumni posts and jobs.</Text>
                  </View>
                  <TouchableOpacity onPress={() => setEmailDigest(!emailDigest)}>
                    <Ionicons name={emailDigest ? "toggle" : "toggle-outline"} size={40} color={emailDigest ? "#003366" : "#CBD5E1"} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
                  <View>
                    <Text style={styles.settingsRowLabel}>Job Alerts</Text>
                    <Text style={styles.settingsRowDesc}>Get notified immediately when new jobs are posted.</Text>
                  </View>
                  <TouchableOpacity onPress={() => setJobAlerts(!jobAlerts)}>
                    <Ionicons name={jobAlerts ? "toggle" : "toggle-outline"} size={40} color={jobAlerts ? "#003366" : "#CBD5E1"} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.saveSettingsBtn} 
                  onPress={() => {
                    setSettingsSubView('menu');
                    Alert.alert('Saved', 'Profile settings updated successfully.');
                  }}
                >
                  <Text style={styles.saveSettingsBtnText}>Save Settings</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Login & Security Sub-view */}
            {settingsSubView === 'security' && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.settingsSectionTitle}>Change Password</Text>
                <TextInput 
                  style={styles.securityInput} 
                  placeholder="Current Password" 
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TextInput 
                  style={styles.securityInput} 
                  placeholder="New Password" 
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TextInput 
                  style={styles.securityInput} 
                  placeholder="Confirm New Password" 
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />

                <TouchableOpacity 
                  style={styles.changePasswordBtn}
                  onPress={async () => {
                    if (!currentPassword || !newPassword || !confirmPassword) {
                      Alert.alert('Error', 'Please fill in all password fields.');
                      return;
                    }
                    if (newPassword !== confirmPassword) {
                      Alert.alert('Error', 'New password and confirm password do not match.');
                      return;
                    }
                    const pwdCheck = validatePasswordStrength(newPassword);
                    if (!pwdCheck.valid) {
                      Alert.alert('Error', pwdCheck.reason);
                      return;
                    }
                    try {
                      await changePassword({
                        currentPassword,
                        newPassword
                      });

                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setSettingsSubView('menu');
                      Alert.alert('Success', 'Your password has been changed successfully!');
                    } catch (err) {
                      Alert.alert('Error', err.message || 'Failed to update password.');
                    }
                  }}
                >
                  <Text style={styles.changePasswordBtnText}>Update Password</Text>
                </TouchableOpacity>

                <Text style={[styles.settingsSectionTitle, { marginTop: 20 }]}>Two-Factor Authentication</Text>
                <View style={[styles.settingsRow, { borderBottomWidth: 0, paddingTop: 4 }]}>
                  <View>
                    <Text style={styles.settingsRowLabel}>Secure Account with 2FA</Text>
                    <Text style={styles.settingsRowDesc}>Require verification code sent to your phone/email.</Text>
                  </View>
                  <TouchableOpacity onPress={() => setTwoFactor(!twoFactor)}>
                    <Ionicons name={twoFactor ? "toggle" : "toggle-outline"} size={40} color={twoFactor ? "#003366" : "#CBD5E1"} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.settingsSectionTitle, { marginTop: 30, color: '#DC2626' }]}>Danger Zone</Text>
                <TouchableOpacity 
                  style={{
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FECACA',
                    padding: 16,
                    borderRadius: 12,
                    marginTop: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onPress={() => {
                    Alert.alert(
                      'Delete Account',
                      'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be removed.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Delete Permanently', 
                          style: 'destructive',
                                                    onPress: async () => {
                            try {
                              await deleteAccount();
                              await AsyncStorage.removeItem('userInfo');
                            } catch (e) {
                              console.error('Delete Account Error', e);
                            }
                            setSettingsVisible(false);
                            navigation.replace('Welcome');
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#DC2626', fontWeight: '600', fontSize: 16 }}>Delete Account</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
      {/* Connections / Following Modal */}
      <Modal visible={!!listModalType} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setListModalType(null)} />
          <View style={[styles.modalContent, { height: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ width: 24 }} />
              <Text style={styles.modalTitle}>{profileData.username}</Text>
              <TouchableOpacity onPress={() => setListModalType(null)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Instagram-style Modal Tabs */}
            <View style={styles.modalTabBar}>
              <TouchableOpacity 
                style={[styles.modalTab, listModalType === 'connections' && styles.activeModalTab]}
                onPress={() => setListModalType('connections')}
              >
                <Text style={[styles.modalTabText, listModalType === 'connections' && styles.activeModalTabText]}>
                  {connections.length || profileData.followers} Connections
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalTab, listModalType === 'following' && styles.activeModalTab]}
                onPress={() => setListModalType('following')}
              >
                <Text style={[styles.modalTabText, listModalType === 'following' && styles.activeModalTabText]}>
                  {following.length || profileData.following} Following
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.modalSearchContainer}>
              <View style={styles.modalSearchBar}>
                <Ionicons name="search" size={18} color="#94A3B8" />
                <TextInput 
                  style={styles.modalSearchInput} 
                  placeholder="Search" 
                  placeholderTextColor="#94A3B8"
                  value={modalSearchQuery}
                  onChangeText={setModalSearchQuery}
                />
              </View>
            </View>
            
            <ScrollView style={{ padding: 16 }}>
              {((listModalType === 'following' ? (following.length > 0 ? following : DEFAULT_FOLLOWING) : (connections.length > 0 ? connections : DEFAULT_CONNECTIONS))
                .filter(u => !modalSearchQuery.trim() || (u.name && u.name.toLowerCase().includes(modalSearchQuery.toLowerCase())) || (u.title && u.title.toLowerCase().includes(modalSearchQuery.toLowerCase())))
              ).map(user => (
                <View key={user.id} style={styles.connectionItem}>
                  <View style={[styles.connectionAvatar, { overflow: 'hidden', backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center' }]}>
                    {user.avatar_url ? (
                      <Image source={{ uri: user.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 20 }} />
                    ) : (
                      <Text style={styles.connectionAvatarText}>{user.avatar}</Text>
                    )}
                  </View>
                  <View style={styles.connectionInfo}>
                    <Text style={styles.connectionName}>{user.name}</Text>
                    <Text style={styles.connectionUsername}>{user.title}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity 
                      style={[styles.connectionBtn, { backgroundColor: '#EFF6FF', marginRight: 8, paddingHorizontal: 10 }]}
                      onPress={() => {
                        setListModalType(null);
                        navigation.navigate('Chat', { 
                          user: { 
                            id: user.id, 
                            name: user.name, 
                            role: user.title || '', 
                            initials: user.avatar 
                          } 
                        });
                      }}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={16} color="#003366" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.connectionBtn, listModalType === 'following' && styles.followingBtn]}
                      onPress={() => {
                        if (listModalType === 'following') {
                          setUnfollowTarget({
                            name: user.name,
                            avatar: user.avatar,
                            subtext: 'Their posts will no longer appear in your main feed.',
                            actionLabel: 'Unfollow',
                            onConfirm: async () => {
                              try {
                                toggleFollowUser(user.id).catch(e => console.error(e));
                              } catch (err) {}
                              
                              setFollowing(prev => {
                                const updated = prev.filter(u => {
                                  const idMatch = (u.id || u._id || '').toString() === (user.id || user._id || '').toString();
                                  const nameMatch = (u.name || '').toLowerCase().trim() === (user.name || '').toLowerCase().trim();
                                  return !idMatch && !nameMatch;
                                });
                                setProfileData(p => ({ ...p, following: updated.length.toString() }));
                                AsyncStorage.getItem('profileCache').then(cStr => {
                                  let cache = {};
                                  if (cStr) { try { cache = JSON.parse(cStr); } catch (e) {} }
                                  cache.following = updated.length.toString();
                                  cache.followingList = updated;
                                  AsyncStorage.setItem('profileCache', JSON.stringify(cache)).catch(() => {});
                                }).catch(() => {});
                                return updated;
                              });
                            }
                          });
                        } else {
                          setUnfollowTarget({
                            name: user.name,
                            avatar: user.avatar,
                            subtext: 'They will be removed from your connections list.',
                            actionLabel: 'Remove',
                            onConfirm: async () => {
                              try {
                                toggleFollowUser(user.id).catch(e => console.error(e));
                              } catch (err) {}

                              setConnections(prev => {
                                const updated = prev.filter(u => {
                                  const idMatch = (u.id || u._id || '').toString() === (user.id || user._id || '').toString();
                                  const nameMatch = (u.name || '').toLowerCase().trim() === (user.name || '').toLowerCase().trim();
                                  return !idMatch && !nameMatch;
                                });
                                setProfileData(p => ({ ...p, followers: updated.length.toString() }));
                                return updated;
                              });
                            }
                          });
                        }
                      }}
                    >
                      <Text style={[styles.connectionBtnText, listModalType === 'following' && styles.followingBtnText]}>
                        {listModalType === 'connections' ? 'Remove' : 'Following'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <View style={{height: 40}} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Instagram-Style Unfollow Confirmation Sheet Modal */}
      <Modal visible={!!unfollowTarget} transparent animationType="fade" onRequestClose={() => setUnfollowTarget(null)}>
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setUnfollowTarget(null)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
        >
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: theme.card || '#FFFFFF', width: '100%', maxWidth: 330, borderRadius: 20, overflow: 'hidden', alignItems: 'center', padding: 24, borderWidth: 1, borderColor: theme.border || '#E2E8F0' }}>
            {/* Target User Avatar */}
            <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF' }}>
                {unfollowTarget?.avatar || (unfollowTarget?.name ? unfollowTarget.name.substring(0, 2).toUpperCase() : 'AL')}
              </Text>
            </View>

            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text || '#0F172A', textAlign: 'center', marginBottom: 6 }}>
              {unfollowTarget?.actionLabel === 'Remove' ? `Remove @${unfollowTarget?.name}?` : `Unfollow @${unfollowTarget?.name}?`}
            </Text>

            <Text style={{ fontSize: 13, color: theme.textMuted || '#64748B', textAlign: 'center', marginBottom: 22, lineHeight: 18 }}>
              {unfollowTarget?.subtext || 'Their posts will no longer appear in your main feed.'}
            </Text>

            {/* Primary Action Button (Red) */}
            <TouchableOpacity
              style={{ width: '100%', backgroundColor: '#EF4444', paddingVertical: 13, borderRadius: 12, alignItems: 'center', marginBottom: 10 }}
              onPress={async () => {
                if (unfollowTarget?.onConfirm) {
                  await unfollowTarget.onConfirm();
                }
                setUnfollowTarget(null);
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                {unfollowTarget?.actionLabel || 'Unfollow'}
              </Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={{ width: '100%', paddingVertical: 10, alignItems: 'center' }}
              onPress={() => setUnfollowTarget(null)}
            >
              <Text style={{ color: theme.textSecondary || '#64748B', fontWeight: '600', fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Instagram Post Detail Lightbox Modal */}
      <Modal visible={!!selectedPost} transparent animationType="fade" onRequestClose={() => setSelectedPost(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: Platform.OS === 'web' ? 20 : 10 }}>
          <View style={{ backgroundColor: theme.card, width: '100%', maxWidth: 520, borderRadius: 16, overflow: 'hidden', maxHeight: '92%' }}>
            {/* Post Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 0.5, borderColor: theme.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>{profileData.avatar}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>
                    {profileData.name}
                    {selectedPost?.tags && selectedPost.tags.length > 0 && (
                      <Text style={{fontWeight: '400', color: theme.textMuted}}>
                        {' is with '}
                        <Text style={{fontWeight: '600', color: theme.text}}>{selectedPost.tags[0].name}</Text>
                        {selectedPost.tags.length > 1 && ` and ${selectedPost.tags.length - 1} other${selectedPost.tags.length > 2 ? 's' : ''}`}
                      </Text>
                    )}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.textMuted }}>{selectedPost?.createdAt ? new Date(selectedPost.createdAt).toLocaleDateString() : 'Just now'}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity 
                  style={{ marginRight: 10 }}
                  onPress={() => setPostOptionsModalVisible(true)}
                >
                  <Ionicons name="ellipsis-horizontal" size={24} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelectedPost(null)} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={26} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 1 }}>
              {/* Post Image or Styled Card */}
              {(selectedPost?.image || selectedPost?.image_url) ? (
                <Image source={{ uri: getImageUrl(selectedPost.image || selectedPost.image_url) }} style={{ width: '100%', height: 300, resizeMode: 'cover' }} />
              ) : null}

              {/* Post Body & Content */}
              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 15, color: theme.text, lineHeight: 22 }}>{selectedPost?.content}</Text>
              </View>

              {/* Engagement Action Bar */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: theme.border }}>
                {/* Like Button */}
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={async () => {
                    if (selectedPost) {
                      try {
                        const targetId = selectedPost._id || selectedPost.id;
                        const updatedPost = await toggleLikePost(targetId);
                        if (updatedPost) {
                          setSelectedPost(prev => prev ? ({ ...prev, likes: updatedPost.likes }) : null);
                          setUserPosts(prev => prev.map(p => (p._id === targetId || p.id === targetId) ? { ...p, likes: updatedPost.likes } : p));
                        }
                      } catch (e) {
                        console.error('Like toggle error', e);
                      }
                    }
                  }}
                >
                  {(() => {
                    const myId = profileData?._id || profileData?.id || '';
                    const isLikedByMe = Array.isArray(selectedPost?.likes) && selectedPost.likes.some(l => {
                      const lId = typeof l === 'object' ? (l._id || l.id || '') : l;
                      return lId && myId && lId.toString() === myId.toString();
                    });
                    return (
                      <Ionicons 
                        name={isLikedByMe ? "heart" : "heart-outline"} 
                        size={24} 
                        color={isLikedByMe ? "#EF4444" : theme.text} 
                      />
                    );
                  })()}
                  <Text style={{ marginLeft: 6, fontWeight: '600', color: theme.text, fontSize: 14 }}>
                    {selectedPost?.hideLikeCount ? 'Likes hidden' : `${selectedPost?.likes?.length || 0} ${selectedPost?.likes?.length === 1 ? 'like' : 'likes'}`}
                  </Text>
                </TouchableOpacity>

                {/* Comment Count Indicator */}
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center' }} 
                  activeOpacity={0.7}
                  onPress={() => commentInputRef.current?.focus()}
                >
                  <Ionicons name="chatbubble-outline" size={22} color={theme.text} />
                  <Text style={{ marginLeft: 6, fontWeight: '600', color: theme.text, fontSize: 14 }}>
                    {selectedPost?.comments?.length || 0} comments
                  </Text>
                </TouchableOpacity>

                {/* Share Button */}
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => {
                    setShareModalVisible(true);
                  }}
                >
                  <Ionicons name="paper-plane-outline" size={22} color={theme.primary} />
                  <Text style={{ marginLeft: 6, fontWeight: '600', color: theme.primary, fontSize: 14 }}>Share</Text>
                </TouchableOpacity>
              </View>

              {/* Comments Section List */}
              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 12 }}>Comments</Text>
                {(!selectedPost?.comments || selectedPost.comments.length === 0) ? (
                  <Text style={{ color: theme.textMuted, fontSize: 13, fontStyle: 'italic', marginVertical: 8 }}>No comments yet. Be the first to comment!</Text>
                ) : (
                  selectedPost.comments.map((comment, idx) => (
                    <View key={comment._id || idx} style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' }}>
                      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2 }}>
                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 11 }}>
                          {comment.user?.name ? comment.user.name.substring(0, 2).toUpperCase() : (typeof comment.user === 'string' ? comment.user.substring(0, 2).toUpperCase() : 'AL')}
                        </Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: 'rgba(0, 33, 68, 0.04)', borderRadius: 12, padding: 10 }}>
                        <Text style={{ fontWeight: '700', fontSize: 13, color: theme.text }}>
                          {comment.user?.name || (typeof comment.user === 'string' ? comment.user : 'Alumni')}
                        </Text>
                        <Text style={{ fontSize: 13, color: theme.text, marginTop: 2 }}>{comment.text}</Text>
                        <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 4 }}>
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>

            {/* Comment Input Bar */}
            {selectedPost?.commentsDisabled ? (
              <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: theme.border, alignItems: 'center' }}>
                <Text style={{ color: theme.textMuted, fontSize: 14 }}>Comments are disabled for this post.</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 0.5, borderColor: theme.border, backgroundColor: theme.card }}>
                <TextInput
                  ref={commentInputRef}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 33, 68, 0.05)',
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: theme.text,
                    maxHeight: 80
                  }}
                  placeholder="Add a comment..."
                  placeholderTextColor={theme.textMuted}
                  value={commentInput}
                  onChangeText={setCommentInput}
                />
                <TouchableOpacity
                  style={{
                    marginLeft: 10,
                    backgroundColor: commentInput.trim() ? theme.primary : '#CBD5E1',
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  disabled={!commentInput.trim() || submittingComment}
                  onPress={async () => {
                    if (!commentInput.trim() || !selectedPost) return;
                    const textToAdd = commentInput.trim();
                    setCommentInput('');
                    setSubmittingComment(true);
                    
                    const targetId = selectedPost._id || selectedPost.id;
                    let newCommentObj = { 
                      _id: 'c_' + Date.now(), 
                      text: textToAdd, 
                      user: { name: profileData.name || 'You' }, 
                      createdAt: new Date() 
                    };

                    let updatedComments = [...(selectedPost.comments || []), newCommentObj];

                    try {
                      const updatedPost = await addComment(targetId, textToAdd);
                      if (updatedPost && updatedPost.comments) {
                        updatedComments = updatedPost.comments;
                      }
                    } catch (err) {
                      console.log('Backend comment endpoint sync note:', err?.message || err);
                    } finally {
                      setSelectedPost(prev => prev ? ({ ...prev, comments: updatedComments }) : null);
                      setUserPosts(prev => prev.map(p => (p._id === targetId || p.id === targetId) ? { ...p, comments: updatedComments } : p));
                      setSubmittingComment(false);
                    }
                  }}
                >
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Instagram Direct Message Share Modal */}
      <Modal visible={shareModalVisible} transparent animationType="slide" onRequestClose={() => setShareModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', alignItems: 'center' }}>
          <View style={{ backgroundColor: theme.card, width: '100%', maxWidth: 520, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, maxHeight: '80%' }}>
            {/* Sheet Handle */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 14 }} />

            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Share Post</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Search Input Bar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 33, 68, 0.05)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14 }}>
              <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, fontSize: 14, color: theme.text }}
                placeholder="Search alumni or connections..."
                placeholderTextColor="#94A3B8"
                value={shareSearchQuery}
                onChangeText={setShareSearchQuery}
              />
              {shareSearchQuery ? (
                <TouchableOpacity onPress={() => setShareSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Connections & Followers Send List */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 260 }}>
              {(following.length === 0 && connections.length === 0) ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: theme.textMuted, fontSize: 13 }}>No connections found to share with directly.</Text>
                </View>
              ) : (
                [...following, ...connections]
                  .filter((item, index, self) => index === self.findIndex(t => t.id === item.id))
                  .filter(u => u.name.toLowerCase().includes(shareSearchQuery.toLowerCase()))
                  .map(user => {
                    const isSent = !!sentMap[user.id];
                    return (
                      <View key={user.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderColor: 'rgba(0,0,0,0.05)' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>{user.avatar}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{user.name}</Text>
                            <Text style={{ fontSize: 11, color: theme.textMuted }} numberOfLines={1}>{user.title}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={{
                            backgroundColor: isSent ? '#E2E8F0' : theme.primary,
                            paddingHorizontal: 16,
                            paddingVertical: 7,
                            borderRadius: 18,
                            flexDirection: 'row',
                            alignItems: 'center'
                          }}
                          onPress={async () => {
                            const targetUserId = user.id || user._id;
                            setSentMap(prev => ({ ...prev, [targetUserId]: true }));
                            try {
                              const postText = selectedPost?.content ? `Shared Post:\n"${selectedPost.content}"` : 'Shared a post with you!';
                              const attachmentUrl = getImageUrl(selectedPost?.image || selectedPost?.image_url) || null;
                              const attachment = attachmentUrl ? { url: attachmentUrl, type: 'image', name: 'Shared Image' } : null;
                              await sendMessage(targetUserId, postText, attachment);
                            } catch (err) {
                              console.error('Error sending direct message share:', err);
                            }
                          }}
                        >
                          {isSent ? (
                            <>
                              <Ionicons name="checkmark" size={14} color="#475569" style={{ marginRight: 4 }} />
                              <Text style={{ color: '#475569', fontWeight: '600', fontSize: 12 }}>Sent</Text>
                            </>
                          ) : (
                            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12 }}>Send</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })
              )}
            </ScrollView>

            {/* Instagram Quick Action Icons Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, marginTop: 10, borderTopWidth: 1, borderColor: theme.border }}>
              <TouchableOpacity
                style={{ alignItems: 'center' }}
                onPress={() => {
                  if (Platform.OS === 'web' && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Post link copied to clipboard!');
                  } else {
                    Alert.alert('Link Copied', 'Post link copied to clipboard!');
                  }
                }}
              >
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0, 33, 68, 0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="link-outline" size={22} color={theme.primary} />
                </View>
                <Text style={{ fontSize: 11, color: theme.text, fontWeight: '500' }}>Copy Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ alignItems: 'center' }}
                onPress={() => {
                  const contentToShare = selectedPost?.content || 'Check out this post on Alumni Network!';
                  Share.share({ message: contentToShare });
                }}
              >
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0, 33, 68, 0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="share-social-outline" size={22} color={theme.primary} />
                </View>
                <Text style={{ fontSize: 11, color: theme.text, fontWeight: '500' }}>Share via...</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ alignItems: 'center' }}
                onPress={() => {
                  setShareModalVisible(false);
                  navigation.navigate('Chat');
                }}
              >
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0, 33, 68, 0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color={theme.primary} />
                </View>
                <Text style={{ fontSize: 11, color: theme.text, fontWeight: '500' }}>Send in Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3-Dots Post Options Modal */}
      <Modal visible={postOptionsModalVisible} transparent animationType="slide" onRequestClose={() => setPostOptionsModalVisible(false)}>
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setPostOptionsModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={{ 
              backgroundColor: '#1C1C1E', 
              width: '100%', 
              borderTopLeftRadius: 24, 
              borderTopRightRadius: 24, 
              paddingTop: 12,
              paddingBottom: Platform.OS === 'ios' ? 34 : 24
            }}
          >
            {/* Sheet Handle */}
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#48484A', alignSelf: 'center', marginBottom: 20 }} />

            {/* Top Action Row (Save & QR Code) */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 }}>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: '#2C2C2E', borderRadius: 12, padding: 12, alignItems: 'center', marginRight: 8 }}
                onPress={async () => {
                  try {
                    setPostOptionsModalVisible(false);
                    const targetId = selectedPost?._id || selectedPost?.id;
                    if (targetId) {
                      await toggleSavePost(targetId);
                      alert('Post saved to your profile.');
                    }
                  } catch (err) {
                    console.error(err);
                    alert('Error saving post.');
                  }
                }}
              >
                <Ionicons name="bookmark-outline" size={24} color="#FFFFFF" style={{ marginBottom: 4 }} />
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '500' }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: '#2C2C2E', borderRadius: 12, padding: 12, alignItems: 'center', marginLeft: 8 }}
                onPress={() => {
                  setPostOptionsModalVisible(false);
                  const targetId = selectedPost?._id || selectedPost?.id;
                  alert('QR Code for Post ID:\n' + targetId);
                }}
              >
                <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" style={{ marginBottom: 4 }} />
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '500' }}>QR code</Text>
              </TouchableOpacity>
            </View>

            {/* List Actions */}
            <View style={{ backgroundColor: '#2C2C2E', borderRadius: 12, marginHorizontal: 16, overflow: 'hidden' }}>
              
              {/* Option Item Component */}
              {(() => {
                const renderOption = (icon, label, color, onPress, isLast = false) => (
                  <TouchableOpacity 
                    key={label}
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      padding: 16, 
                      borderBottomWidth: isLast ? 0 : 0.5, 
                      borderBottomColor: '#3A3A3C' 
                    }}
                    onPress={onPress}
                  >
                    <Ionicons name={icon} size={22} color={color} style={{ marginRight: 16 }} />
                    <Text style={{ color: color, fontSize: 16 }}>{label}</Text>
                  </TouchableOpacity>
                );

                return (
                  <>
                    {renderOption('logo-facebook', 'Shared to Facebook', '#FFFFFF', () => { 
                      setPostOptionsModalVisible(false); 
                      Share.share({ message: `Check out this post! https://facebook.com/sharer/sharer.php?u=alumniapp.com/post/${selectedPost?._id || selectedPost?.id}` });
                    })}
                    {renderOption('time-outline', selectedPost?.isArchived ? 'Unarchive' : 'Archive', '#FFFFFF', async () => { 
                      setPostOptionsModalVisible(false);
                      const targetId = selectedPost?._id || selectedPost?.id;
                      if (!targetId) return;
                      const newState = !selectedPost?.isArchived;
                      await updatePostSettings(targetId, { isArchived: newState });
                      setUserPosts(prev => prev.filter(p => (p._id !== targetId && p.id !== targetId)));
                      setSelectedPost(null);
                      alert(newState ? 'Post archived and removed from grid.' : 'Post unarchived.');
                    })}
                    {renderOption(selectedPost?.hideLikeCount ? 'heart-outline' : 'heart-dislike-outline', selectedPost?.hideLikeCount ? 'Show like count' : 'Hide like count', '#FFFFFF', async () => { 
                      setPostOptionsModalVisible(false);
                      const targetId = selectedPost?._id || selectedPost?.id;
                      if (!targetId) return;
                      const newState = !selectedPost?.hideLikeCount;
                      const updated = await updatePostSettings(targetId, { hideLikeCount: newState });
                      setUserPosts(prev => prev.map(p => (p._id === targetId || p.id === targetId) ? updated : p));
                      setSelectedPost(updated);
                    })}
                    {renderOption(selectedPost?.hideShareCount ? 'eye-outline' : 'eye-off-outline', selectedPost?.hideShareCount ? 'Show share count' : 'Hide share count', '#FFFFFF', async () => { 
                      setPostOptionsModalVisible(false);
                      const targetId = selectedPost?._id || selectedPost?.id;
                      if (!targetId) return;
                      const newState = !selectedPost?.hideShareCount;
                      const updated = await updatePostSettings(targetId, { hideShareCount: newState });
                      setUserPosts(prev => prev.map(p => (p._id === targetId || p.id === targetId) ? updated : p));
                      setSelectedPost(updated);
                    })}
                    {renderOption(selectedPost?.commentsDisabled ? 'chatbubble-outline' : 'chatbubble-ellipses-outline', selectedPost?.commentsDisabled ? 'Turn on commenting' : 'Turn off commenting', '#FFFFFF', async () => { 
                      setPostOptionsModalVisible(false);
                      const targetId = selectedPost?._id || selectedPost?.id;
                      if (!targetId) return;
                      const newState = !selectedPost?.commentsDisabled;
                      const updated = await updatePostSettings(targetId, { commentsDisabled: newState });
                      setUserPosts(prev => prev.map(p => (p._id === targetId || p.id === targetId) ? updated : p));
                      setSelectedPost(updated);
                    })}
                    {renderOption('pencil-outline', 'Edit', '#FFFFFF', () => { 
                      setPostOptionsModalVisible(false); 
                      setEditPostText(selectedPost?.content || '');
                      setEditPostModalVisible(true);
                    })}
                    {renderOption('crop-outline', 'Adjust preview', '#FFFFFF', () => { 
                      setPostOptionsModalVisible(false); 
                      alert('Preview adjustments require external cropping tools (coming soon).');
                    })}
                    {renderOption(selectedPost?.isPinned ? 'pin' : 'pin-outline', selectedPost?.isPinned ? 'Unpin from main grid' : 'Pin to main grid', '#FFFFFF', async () => { 
                      setPostOptionsModalVisible(false);
                      const targetId = selectedPost?._id || selectedPost?.id;
                      if (!targetId) return;
                      const newState = !selectedPost?.isPinned;
                      const updated = await updatePostSettings(targetId, { isPinned: newState });
                      setUserPosts(prev => {
                        let newPosts = prev.map(p => (p._id === targetId || p.id === targetId) ? updated : p);
                        newPosts.sort((a, b) => (b.isPinned === a.isPinned) ? 0 : (b.isPinned ? 1 : -1));
                        return newPosts;
                      });
                      setSelectedPost(updated);
                    })}
                  </>
                );
              })()}
              
              {/* Delete Action */}
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
                onPress={() => {
                  Alert.alert(
                    "Delete Post",
                    "Are you sure you want to delete this post?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "Delete", 
                        style: "destructive",
                        onPress: async () => {
                          try {
                            const targetId = selectedPost?._id || selectedPost?.id;
                            if (targetId) {
                              await deletePost(targetId);
                              setUserPosts(prev => prev.filter(p => (p._id !== targetId && p.id !== targetId)));
                              setSelectedPost(null);
                              setPostOptionsModalVisible(false);
                            }
                          } catch (err) {
                            console.error('Delete post error:', err);
                            alert('Failed to delete post.');
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={22} color="#FF3B30" style={{ marginRight: 16 }} />
                <Text style={{ color: '#FF3B30', fontSize: 16 }}>Delete</Text>
              </TouchableOpacity>

            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit Post Modal */}
      <Modal visible={editPostModalVisible} transparent animationType="fade" onRequestClose={() => setEditPostModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', backgroundColor: theme.card, borderRadius: 12, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>Edit Post</Text>
            
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 8,
                padding: 12,
                color: theme.text,
                minHeight: 100,
                textAlignVertical: 'top'
              }}
              multiline
              value={editPostText}
              onChangeText={setEditPostText}
              placeholder="Write your post here..."
              placeholderTextColor={theme.textMuted}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity 
                style={{ padding: 10, marginRight: 10 }}
                onPress={() => setEditPostModalVisible(false)}
              >
                <Text style={{ color: theme.textMuted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ padding: 10, backgroundColor: theme.primary, borderRadius: 8 }}
                onPress={async () => {
                  try {
                    const targetId = selectedPost?._id || selectedPost?.id;
                    if (targetId && editPostText.trim()) {
                      const updated = await editPost(targetId, editPostText.trim());
                      setUserPosts(prev => prev.map(p => (p._id === targetId || p.id === targetId) ? updated : p));
                      setSelectedPost(updated);
                      setEditPostModalVisible(false);
                    }
                  } catch (err) {
                    console.error('Edit error:', err);
                    alert('Failed to edit post.');
                  }
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerUsername: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfoContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  mainInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  storyRing: {
    padding: 3,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: theme.primary,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  bioContainer: {
    marginBottom: 16,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
  },
  occupationText: {
    fontSize: 13.5,
    color: theme.primary,
    fontWeight: '600',
    marginVertical: 4,
  },
  bioText: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 19,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: theme.text,
  },
  smallIconBtn: {
    backgroundColor: '#FEF2F2',
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 1,
    paddingTop: 1,
  },
  gridItem: {
    margin: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.primary,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  
  // Instagram-style tabs styling
  tabContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: theme.card,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 4,
  },
  activeTabButton: {
    borderBottomColor: theme.primary,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textMuted,
  },
  activeTabLabel: {
    color: theme.primary,
    fontWeight: '700',
  },
  tabContentList: {
    padding: 16,
  },
  listCard: {
    backgroundColor: theme.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 8,
  },
  cardBodyText: {
    fontSize: 13,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooterText: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '500',
  },

  // Settings sub-view styling
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingsRowLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  settingsRowDesc: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
    maxWidth: '70%',
  },
  saveSettingsBtn: {
    backgroundColor: theme.primary,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveSettingsBtnText: {
    color: theme.card,
    fontSize: 15,
    fontWeight: '700',
  },
  settingsSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  securityInput: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 14,
    color: theme.text,
    marginBottom: 12,
  },
  changePasswordBtn: {
    backgroundColor: theme.text,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  changePasswordBtnText: {
    color: theme.card,
    fontSize: 15,
    fontWeight: '700',
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    paddingLeft: 2,
    marginTop: 4,
  },
  tagOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    borderRadius: 12,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  connectionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  connectionAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  connectionUsername: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  connectionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: theme.border,
    borderRadius: 6,
  },
  connectionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  followingBtn: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  followingBtnText: {
    color: theme.text,
  },
  modalTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeModalTab: {
    borderBottomColor: theme.text,
  },
  modalTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
  },
  activeModalTabText: {
    color: theme.text,
  },
  modalSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 36,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: theme.text,
  },
});

export default ProfileScreen;
