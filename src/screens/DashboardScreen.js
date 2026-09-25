import React, { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Share,
  Alert,
  StatusBar,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getSuggestions, getPosts, getEvents, toggleFollowUser, getFollowing, getFollowers, toggleLikePost, getProfile, getUsers } from '../services/authService';
import { getImageUrl } from '../services/uploadService';
import { addComment, toggleSavePost, resharePost } from '../services/postService';
import { sendMessage } from '../services/messageService';
import { fetchJobs } from '../services/jobService';
import useUserRole from '../hooks/useUserRole';
import { initSocket, getSocket } from '../services/socketService';
import getInitials from '../lib/getInitials';


// Pool of all known posts across all users — used as offline fallback
const ALL_KNOWN_POSTS = [];

const ALUMNI_SPOTLIGHTS = [
  {
    id: 'spot-1',
    tag: 'DISTINGUISHED ALUM',
    tagColor: '#B45309',
    tagBg: '#FEF3C7',
    icon: 'school',
    iconBg: '#002B5C',
    title: "Dr. Anand Deshpande ('84)",
    subtitle: 'Founder & CMD, Persistent Systems',
    desc: 'B.Tech CSE from RVCE, pioneering enterprise technology and active RSST student mentor.',
    actionText: 'Connect in Directory',
    route: 'Engage',
    params: { tab: 'directory' },
  },
  {
    id: 'spot-2',
    tag: 'RSST INNOVATION',
    tagColor: '#15803D',
    tagBg: '#DCFCE7',
    icon: 'rocket',
    iconBg: '#064E3B',
    title: '₹50L Innovation Seed Fund',
    subtitle: 'Centre for Pre-Incubation & Research',
    desc: 'Grants and dedicated lab space for RVCE alumni and student founders building deep-tech solutions.',
    actionText: 'Grant Guidelines',
    url: 'https://rvce.edu.in/rvce-centre-for-innovation',
  },
  {
    id: 'spot-3',
    tag: 'REFERRAL EXPRESS',
    tagColor: '#0369A1',
    tagBg: '#E0F2FE',
    icon: 'briefcase',
    iconBg: '#0369A1',
    title: 'Executive Career Referrals',
    subtitle: 'Google • Microsoft • Cisco • NVIDIA',
    desc: 'Direct priority interview referrals from 200+ senior engineering alumni across tier-1 firms.',
    actionText: 'Explore Referrals',
    route: 'Jobs',
  },
  {
    id: 'spot-4',
    tag: 'RESUME BOOK',
    tagColor: '#7E22CE',
    tagBg: '#F3E8FF',
    icon: 'document-text',
    iconBg: '#581C87',
    title: 'RV Candidate Resume Book',
    subtitle: 'Verified Alumni & Graduating Batches',
    desc: 'Browse portfolios, verified skills, and project repos of RVCE candidates open for direct hiring.',
    actionText: 'Open Resume Book',
    route: 'Jobs',
  },
];

/**
 * Returns ONLY posts from followed users + own posts.
 * Instagram-style: you only see posts from people you follow.
 */
const getDefaultPostsForUser = (currentUserId, currentUserName, followingIds = []) => {
  const userIdStr = (currentUserId || '').toString().toLowerCase();
  const userNameStr = (currentUserName || '').toLowerCase();
  const followingSet = new Set(followingIds.map(id => id.toString().toLowerCase()));

  return ALL_KNOWN_POSTS.filter(post => {
    // Skip reshared posts from feed — reshares go in Profile Reshares tab
    if (post.content && /reshared\s+from/i.test(post.content)) return false;

    // Always show own posts
    const isOwnPost = (post.authorId || '').toString().toLowerCase() === userIdStr ||
      (userNameStr && (post.user || '').toLowerCase().includes(userNameStr));
    if (isOwnPost) return true;

    // Show posts from followed users only (Instagram style)
    if (followingSet.size > 0) {
      // Match by authorId
      if (followingSet.has((post.authorId || '').toString().toLowerCase())) return true;
      // Match by author name (for fallback/default users)
      const postUserName = (post.user || '').toLowerCase();
      for (const id of followingSet) {
        if (id === postUserName) return true;
      }
      return false;
    }

    // No following list yet (fresh account) — show only admin posts
    return Boolean(post.isAdmin);
  });
};

const getTimeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const formatPostObject = (p, myUserId) => {
  if (!p) return null;
  const pid = p._id || p.id;
  const likesArr = Array.isArray(p.likes) ? p.likes : [];
  const isLikedByMe = likesArr.some(id => {
    const idStr = typeof id === 'object' ? (id._id || id.id || '') : id;
    return idStr && myUserId && idStr.toString() === myUserId.toString();
  });

  const origP = p.originalPost;
  const isReshare = Boolean(p.isReshare || origP);
  const origAuthorName = p.originalAuthorName || (origP && origP.user ? (origP.user.name || origP.user) : '') || '';

  return {
    id: pid,
    _id: pid,
    user: p.user?.name || (typeof p.user === 'string' ? p.user : 'Alumni'),
    authorId: p.user?._id || p.authorId || null,
    role: p.user?.department ? `${p.user.department} • Batch ${p.user.batchYear || ''}` : (p.user?.institution ? `${p.user.institution} Alumni` : 'Alumni Member'),
    avatar: p.user?.profilePicture || p.user?.avatar_url ? getImageUrl(p.user?.profilePicture || p.user?.avatar_url) : getInitials(p.user?.name || (typeof p.user === 'string' ? p.user : 'Alumni')),
    isAvatarUrl: Boolean(p.user?.profilePicture || p.user?.avatar_url),
    content: p.content || '',
    image: p.image ? getImageUrl(p.image) : null,
    likes: likesArr.length,
    likesArray: likesArr,
    isLiked: isLikedByMe,
    comments: p.comments || [],
    commentsCount: p.comments?.length || 0,
    resharesCount: Array.isArray(p.reshares) ? p.reshares.length : (p.resharesCount || 0),
    time: p.createdAt ? getTimeAgo(p.createdAt) : (p.time || 'Just now'),
    isReshare,
    originalAuthorName: origAuthorName,
    originalPost: origP ? {
      id: origP._id || origP.id,
      user: (origP.user && origP.user.name) || (typeof origP.user === 'string' ? origP.user : '') || origAuthorName || 'Alumni Member',
      role: origP.user?.department ? `${origP.user.department} • Batch ${origP.user.batchYear || ''}` : (origP.user?.institution ? `${origP.user.institution} Alumni` : 'Alumni Member'),
      avatar: origP.user?.profilePicture || origP.user?.avatar_url ? getImageUrl(origP.user?.profilePicture || origP.user?.avatar_url) : getInitials((origP.user && origP.user.name) || origAuthorName || 'Alumni'),
      isAvatarUrl: Boolean(origP.user?.profilePicture || origP.user?.avatar_url),
      content: origP.content || '',
      image: origP.image ? getImageUrl(origP.image) : null,
      likes: Array.isArray(origP.likes) ? origP.likes.length : (origP.likes || 0),
      commentsCount: Array.isArray(origP.comments) ? origP.comments.length : (origP.commentsCount || 0),
      time: origP.createdAt ? getTimeAgo(origP.createdAt) : ''
    } : null
  };
};

const DashboardScreen = ({ navigation }) => {

  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const { isAlumni, isAdmin, isSuperAdmin, isAdminOrSuper, userRole } = useUserRole();

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  const contentWidth = isWeb ? Math.min(width, 800) : width;
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: isDesktop ? 1200 : 800, flex: 1 } : { flex: 1 };
  
  const [likedPosts, setLikedPosts] = useState({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState({});
  const [followingMap, setFollowingMap] = useState({});
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [myEventsCount, setMyEventsCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [userInstitution, setUserInstitution] = useState('Our Network');
  const [userName, setUserName] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [feedFilter, setFeedFilter] = useState('all');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Modal States
  const [activeModal, setActiveModal] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [unfollowTarget, setUnfollowTarget] = useState(null);
  const [followersList, setFollowersList] = useState([]);
  const [sentShareMap, setSentShareMap] = useState({});
  const [shareSearchText, setShareSearchText] = useState('');

  const [directoryUsers, setDirectoryUsers] = useState([]);

  const handleShareToFollower = async (targetUser) => {
    const targetId = targetUser._id || targetUser.id;
    if (!targetId || !selectedPost) return;

    const postContent = selectedPost.content ? `"${selectedPost.content.substring(0, 100)}..."` : 'Check out this post!';
    const messageText = `Shared a post with you on Alumni Network:\n\n${postContent}\n\nhttps://almafrontend-eight.vercel.app`;

    setSentShareMap(prev => ({ ...prev, [targetId]: true }));
    try {
      await sendMessage(targetId, messageText);
    } catch (err) {
      console.log('Error sharing to follower:', err?.message || err);
    }
  };

  const handleShareToAllFollowers = async () => {
    const targetList = combinedShareContacts;
    if (!selectedPost || targetList.length === 0) return;

    const postContent = selectedPost.content ? `"${selectedPost.content.substring(0, 100)}..."` : 'Check out this post!';
    const messageText = `Shared a post with you on Alumni Network:\n\n${postContent}\n\nhttps://almafrontend-eight.vercel.app`;

    const newMap = { ...sentShareMap };
    targetList.forEach(u => {
      const uid = u._id || u.id;
      if (uid) {
        newMap[uid] = true;
        sendMessage(uid, messageText).catch(() => {});
      }
    });
    setSentShareMap(newMap);
    Alert.alert('Shared!', 'Post successfully shared with your followers!');
  };

  const handleCopyToClipboard = async (post) => {
    const postUrl = `https://almafrontend-eight.vercel.app`;
    const text = post?.content
      ? `Check out this post on Alumni Network:\n"${post.content.substring(0, 120)}..."\n${postUrl}`
      : postUrl;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch (_) {}

    Alert.alert('Link Copied', 'Post link copied to clipboard!');
  };

  const handleWhatsAppShare = async (post) => {
    const postUrl = `https://almafrontend-eight.vercel.app`;
    const authorName = post?.user?.name || post?.author || 'RV Alumni';
    const content = post?.content ? `"${post.content.trim()}"` : '';
    const rawImage = post?.image || post?.imageUrl || '';
    const imageUrl = rawImage ? getImageUrl(rawImage) : '';

    let shareText = `🎓 *${authorName}* shared a post on RVCE Alumni Network:\n\n${content}`;
    if (imageUrl) {
      shareText += `\n\n📸 *Post Image:* ${imageUrl}`;
    }
    shareText += `\n\n🔗 *View & Connect:*\n${postUrl}\n\n_RV Educational Institutions Community_`;

    const whatsappAppUrl = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
    const whatsappWebUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

    try {
      if (Platform.OS === 'web') {
        window.open(whatsappWebUrl, '_blank');
        return;
      }
      const supported = await Linking.canOpenURL(whatsappAppUrl);
      if (supported) {
        await Linking.openURL(whatsappAppUrl);
      } else {
        await Linking.openURL(whatsappWebUrl);
      }
    } catch (_err) {
      try {
        await Linking.openURL(whatsappWebUrl);
      } catch (_e2) {
        await Share.share({
          title: `${authorName}'s Post`,
          message: shareText,
          url: imageUrl || postUrl,
        });
      }
    }
  };

  const handleNativeShare = async (post) => {
    const postUrl = `https://almafrontend-eight.vercel.app`;
    const authorName = post?.user?.name || post?.author || 'RV Alumni';
    const content = post?.content ? `"${post.content.trim()}"` : '';
    const rawImage = post?.image || post?.imageUrl || '';
    const imageUrl = rawImage ? getImageUrl(rawImage) : '';

    let shareText = `🎓 ${authorName} on RVCE Alumni Network:\n\n${content}`;
    if (imageUrl) {
      shareText += `\n\n📸 Post Image: ${imageUrl}`;
    }
    shareText += `\n\n🔗 ${postUrl}`;

    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `${authorName}'s Post | Alumni Network`,
          text: shareText,
          url: imageUrl || postUrl,
        });
      } else {
        await Share.share({
          title: `${authorName}'s Post | Alumni Network`,
          message: shareText,
          url: imageUrl || postUrl,
        });
      }
    } catch (err) {
      console.log('Share notice:', err?.message || err);
    }
  };

  const handleAddToStory = (post) => {
    closeModal();
    navigation.navigate('PostCreation', { resharePost: post });
  };

  const mockComments = [];

  // Real data states — initialize with all posts as open feed (filtered per user once we know who they are)
  // Start with empty feed — populated after we know who the user follows
  const [posts, setPosts] = useState([]);

  const getPostCategory = useCallback((post) => {
    const isReshared = Boolean(post?.isReshare || post?.originalPost || post?.originalAuthorName || (post?.content && /reshared\s+from/i.test(post.content)));
    if (isReshared) return { label: 'AMPLIFIED', color: '#6366F1', bg: isDarkMode ? '#312E81' : '#EEF2FF', icon: 'repeat' };
    
    const content = (post?.content || '').toLowerCase();
    const role = (post?.role || '').toLowerCase();
    if (/hiring|referral|job|opening|career|internship|role|recruit|opportunity/i.test(content + ' ' + role)) {
      return { label: 'JOB REFERRAL', color: '#059669', bg: isDarkMode ? '#064E3B' : '#ECFDF5', icon: 'briefcase' };
    }
    if (/reunion|alumni meet|meetup|gathering|jubilee|celebrat/i.test(content)) {
      return { label: 'REUNION', color: '#D97706', bg: isDarkMode ? '#451A03' : '#FEF3C7', icon: 'people' };
    }
    if (/rvce|campus|convocation|exam|faculty|department|research|rsst|placement/i.test(content)) {
      return { label: 'CAMPUS NOTICE', color: '#0284C7', bg: isDarkMode ? '#082F49' : '#E0F2FE', icon: 'school' };
    }
    return { label: 'ALUMNI UPDATE', color: '#64748B', bg: isDarkMode ? '#1E293B' : '#F1F5F9', icon: 'newspaper-outline' };
  }, [isDarkMode]);

  const filteredPosts = React.useMemo(() => {
    if (!Array.isArray(posts)) return [];
    if (feedFilter === 'all') return posts;
    if (feedFilter === 'jobs') {
      return posts.filter(p => /hiring|referral|job|opening|career|internship|role|recruit|opportunity/i.test((p.content || '') + ' ' + (p.role || '')));
    }
    if (feedFilter === 'campus') {
      return posts.filter(p => /rvce|campus|convocation|exam|faculty|department|research|rsst|reunion|alumni meet/i.test((p.content || '') + ' ' + (p.role || '')));
    }
    if (feedFilter === 'network') {
      return posts.filter(p => {
        const isOwn = (p.authorId && (p.authorId === currentUser?._id || p.authorId === currentUser?.id)) ||
          (p.user && currentUser?.name && p.user.toLowerCase().includes(currentUser.name.toLowerCase()));
        const isFollowing = Boolean(
          (p.authorId && followingMap[p.authorId]) ||
          (p.user && followingMap[p.user.toLowerCase()])
        );
        return isOwn || isFollowing;
      });
    }
    return posts;
  }, [posts, feedFilter, currentUser, followingMap]);

  const [suggestions, setSuggestions] = useState([]);
  const [eventsAndJobs, setEventsAndJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const openModal = (type, post) => {
    setSelectedPost(post);
    setActiveModal(type);
    if (type === 'share') {
      setShareSearchText('');
      getFollowers().then(data => {
        if (Array.isArray(data) && data.length > 0) setFollowersList(data);
      }).catch(() => {});
      getUsers().then(data => {
        if (Array.isArray(data) && data.length > 0) setDirectoryUsers(data);
      }).catch(() => {});
    }
  };

  const combinedShareContacts = React.useMemo(() => {
    const map = new Map();
    const selfId = (currentUser?._id || currentUser?.id || '').toString();

    // 1. Add real Followers
    followersList.forEach(u => {
      const id = (u._id || u.id || '').toString();
      if (id && id !== selfId && !map.has(id)) map.set(id, u);
    });

    // 2. Add Directory Users (Real registered alumni accounts)
    directoryUsers.forEach(u => {
      const id = (u._id || u.id || '').toString();
      if (id && id !== selfId && !map.has(id)) map.set(id, u);
    });

    // 3. Add Suggested Alumni
    suggestions.forEach(u => {
      const id = (u._id || u.id || '').toString();
      if (id && id !== selfId && !map.has(id)) map.set(id, u);
    });

    return Array.from(map.values());
  }, [followersList, directoryUsers, suggestions, currentUser]);

  const closeModal = () => {
    setActiveModal(null);
    setSelectedPost(null);
    setCommentText('');
  };

  const handleOpenExternalUrl = async (url) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(url, '_blank');
        return;
      }
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch (_) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(url, '_blank');
      }
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      // Try to load connections count and following list from profileCache
      try {
        const profileCacheStr = await AsyncStorage.getItem('profileCache');
        if (profileCacheStr) {
          const profileCache = JSON.parse(profileCacheStr);
          const cachedConnections = Array.isArray(profileCache.connections) ? profileCache.connections.length : 0;
          const cachedFollowing = Array.isArray(profileCache.followingList) ? profileCache.followingList.length : 0;
          setConnectionsCount(cachedConnections + cachedFollowing);

          const cachedFollowingList = Array.isArray(profileCache.followingList) ? profileCache.followingList : [];
          const cachedFollowingIds = cachedFollowingList.map(u => u.id || u._id || '').filter(Boolean);
          const cachedFollowingNames = cachedFollowingList.map(u => (u.name || '').toLowerCase().trim()).filter(Boolean);
          const userInfoStr = await AsyncStorage.getItem('userInfo');
          const cachedUser = userInfoStr ? JSON.parse(userInfoStr) : null;

          // Build followingMap ONLY from real cached data — no hardcoded seeds
          const initialMap = {};
          cachedFollowingList.forEach(u => {
            if (u.id || u._id) initialMap[u.id || u._id] = true;
            if (u.name) initialMap[u.name.toLowerCase().trim()] = true;
          });
          setFollowingMap(prev => ({ ...prev, ...initialMap }));

          // Seed feed using the Instagram filter
          const myId = (cachedUser?._id || cachedUser?.id || '').toString();
          const myName = (cachedUser?.name || '').toLowerCase();
          const cachedPosts = getDefaultPostsForUser(myId, myName, cachedFollowingIds);
          if (cachedPosts.length > 0) {
            setPosts(cachedPosts);
          }
        }
      } catch (e) {}

      const userInfoString = await AsyncStorage.getItem('userInfo');
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        setCurrentUser(userInfo);
        if (userInfo.institution) {
          setUserInstitution(userInfo.institution);
        }
        if (userInfo.name) {
          setUserName(userInfo.name);
        }
      }
    };
    fetchUserInfo();
  }, []);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('userInfo').then(str => {
        if (str) {
          const u = JSON.parse(str);
          setCurrentUser(u);
          if (u.name) setUserName(u.name);
        }
      }).catch(() => {});
    }, [])
  );

  // Real-time WebSocket synchronization across mobile & web apps
  useEffect(() => {
    const userId = currentUser?._id || currentUser?.id;
    let socketInstance = null;

    initSocket(userId).then(sk => {
      socketInstance = sk;
      if (!socketInstance) return;

      socketInstance.on('new_post_created', (newPost) => {
        if (!newPost) return;
        const formattedNewPost = formatPostObject(newPost, currentUser?._id || currentUser?.id);
        if (!formattedNewPost) return;
        setPosts(prevPosts => {
          const exists = prevPosts.some(p => (p._id || p.id).toString() === (formattedNewPost._id || formattedNewPost.id).toString());
          if (exists) {
            return prevPosts.map(p => (p._id || p.id).toString() === (formattedNewPost._id || formattedNewPost.id).toString() ? formattedNewPost : p);
          }
          return [formattedNewPost, ...prevPosts];
        });
      });

      socketInstance.on('post_liked_updated', ({ postId, likes, likesCount }) => {
        setPosts(prevPosts =>
          prevPosts.map(p => {
            if ((p._id || p.id).toString() === postId.toString()) {
              return { ...p, likes, likesCount: likesCount !== undefined ? likesCount : (likes ? likes.length : p.likesCount) };
            }
            return p;
          })
        );
      });

      socketInstance.on('post_comment_added', ({ postId, comments, commentsCount }) => {
        setPosts(prevPosts =>
          prevPosts.map(p => {
            if ((p._id || p.id).toString() === postId.toString()) {
              return { ...p, comments, commentsCount: commentsCount !== undefined ? commentsCount : (comments ? comments.length : p.commentsCount) };
            }
            return p;
          })
        );
      });
    });

    return () => {
      if (socketInstance) {
        socketInstance.off('new_post_created');
        socketInstance.off('post_liked_updated');
        socketInstance.off('post_comment_added');
      }
    };
  }, [currentUser?._id, currentUser?.id]);

  const userAvatarPath = currentUser?.profilePicture || currentUser?.avatar_url || currentUser?.avatar;
  const userAvatarUrl = userAvatarPath ? getImageUrl(userAvatarPath) : null;

  // Fetch real data from API instantly in parallel
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const fetchData = async () => {
        try {
          // Only show full loading spinner on initial cold launch
          if (posts.length === 0) {
            setLoading(true);
          }

          // Execute ALL network requests simultaneously in parallel (1 single roundtrip)
          const [
            profileRes,
            postsRes,
            suggestionsRes,
            eventsRes,
            jobsRes,
            followingRes,
            followersRes,
            usersRes
          ] = await Promise.allSettled([
            getProfile().catch(() => null),
            getPosts().catch(() => []),
            getSuggestions().catch(() => []),
            getEvents().catch(() => []),
            fetchJobs().catch(() => []),
            getFollowing().catch(() => []),
            getFollowers().catch(() => []),
            getUsers().catch(() => []),
          ]);

          if (!isMounted) return;

          // 1. Process profile
          if (profileRes.status === 'fulfilled' && profileRes.value) {
            const freshUser = profileRes.value;
            setCurrentUser(freshUser);
            if (freshUser.name) setUserName(freshUser.name);
            if (freshUser.institution) setUserInstitution(freshUser.institution);
            AsyncStorage.setItem('userInfo', JSON.stringify(freshUser)).catch(() => {});
          }

          if (followersRes.status === 'fulfilled' && Array.isArray(followersRes.value)) {
            setFollowersList(followersRes.value);
          }

          if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
            setDirectoryUsers(usersRes.value);
          }

          const currentUserInfo = profileRes.status === 'fulfilled' ? profileRes.value : null;

          // 2. Process posts — filter to only show posts from people the user follows (Instagram style)
          if (postsRes.status === 'fulfilled' && Array.isArray(postsRes.value) && postsRes.value.length > 0) {
            const allDbPosts = postsRes.value;

            // Build the set of followed user IDs from API response
            const followedUserIds = new Set();
            const followedUserNames = new Set();
            if (followingRes.status === 'fulfilled' && Array.isArray(followingRes.value)) {
              followingRes.value.forEach(u => {
                if (u._id || u.id) followedUserIds.add((u._id || u.id).toString());
                if (u.name) followedUserNames.add((u.name || '').toLowerCase().trim());
              });
            }
            // Also seed from profileCache for instant offline-first sync
            try {
              const pCache = await AsyncStorage.getItem('profileCache');
              if (pCache) {
                const cacheData = JSON.parse(pCache);
                if (Array.isArray(cacheData.followingList)) {
                  cacheData.followingList.forEach(u => {
                    if (u.id || u._id) followedUserIds.add((u.id || u._id).toString());
                    if (u.name) followedUserNames.add((u.name || '').toLowerCase().trim());
                  });
                }
              }
            } catch (e) {}

            let myUserId = (currentUserInfo?._id || currentUserInfo?.id || '').toString();
            if (!myUserId) {
              try {
                const rawUser = await AsyncStorage.getItem('userInfo');
                if (rawUser) myUserId = (JSON.parse(rawUser)?._id || JSON.parse(rawUser)?.id || '').toString();
              } catch (_) {}
            }
            const myUserName = (currentUserInfo?.name || '').toLowerCase();

            const dbFormatted = allDbPosts
              .filter(p => {
                // Never show reshares in the main feed (they have originalPost set)
                if (p.originalPost || p.isReshare) return false;

                const authorId = (p.user?._id || p.user?.id || '').toString();
                const authorName = (p.user?.name || '').toLowerCase().trim();

                // Always show own posts
                if (myUserId && authorId === myUserId) return true;
                if (myUserName && authorName === myUserName) return true;

                // Show posts from followed users
                if (followedUserIds.size > 0 || followedUserNames.size > 0) {
                  if (followedUserIds.has(authorId)) return true;
                  if (followedUserNames.has(authorName)) return true;
                  return false;
                }

                // No following list yet — show only own posts (very new account)
                return false;
              })
              .map(p => formatPostObject(p, myUserId))
              .filter(Boolean);

            // Initialize likedPosts map with current user's liked posts
            const initLikedMap = {};
            dbFormatted.forEach(p => {
              if (p.isLiked) initLikedMap[p.id] = true;
            });
            setLikedPosts(prev => ({ ...initLikedMap, ...prev }));

            // Use filtered posts; fall back to defaults if nothing matches
            if (dbFormatted.length > 0) {
              setPosts(dbFormatted);
            } else {
              const freshUser = currentUserInfo;
              const freshFollowingIds = [...followedUserIds];
              const fallback = getDefaultPostsForUser(freshUser?._id || freshUser?.id, freshUser?.name, freshFollowingIds);
              setPosts(fallback.length > 0 ? fallback : []);
            }
          } else {
            // API returned no posts — use connection-aware fallback posts
            const freshUser = profileRes.status === 'fulfilled' ? profileRes.value : null;
            const freshFollowing = followingRes.status === 'fulfilled' && Array.isArray(followingRes.value) ? followingRes.value : [];
            const followingIds = freshFollowing.map(u => u._id || u.id || '');
            const fallbackPosts = getDefaultPostsForUser(
              freshUser?._id || freshUser?.id,
              freshUser?.name,
              followingIds
            );
            setPosts(fallbackPosts.length > 0 ? fallbackPosts : []);
          }

          // 3. Process suggestions
          if (suggestionsRes.status === 'fulfilled' && Array.isArray(suggestionsRes.value) && suggestionsRes.value.length > 0) {
            const formatted = suggestionsRes.value.map(s => ({
              id: s._id,
              name: s.name,
              avatar: s.profilePicture || s.avatar_url ? getImageUrl(s.profilePicture || s.avatar_url) : (getInitials(s.name, '??')),
              isAvatarUrl: !!(s.profilePicture || s.avatar_url),
              subtitle: s.company ? `${s.designation || ''} @ ${s.company}`.trim() : `Batch of ${s.batchYear || ''} • ${s.department || s.institution || ''}`.trim(),
            }));
            setSuggestions(formatted);
          }

          // 4. Process combined Opportunities (Real Jobs & Events only)
          let combinedOpportunities = [];
          let registeredEventsCount = 0;
          if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value) && jobsRes.value.length > 0) {
            const formattedJobs = jobsRes.value.map(j => ({
              id: j._id || j.id,
              title: j.title || j.role || 'Career Opportunity',
              subtitle: `${j.company || 'Alumni Partner'} • ${j.location || 'Remote'}`,
              btnText: 'View Job',
              image: j.logo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&h=200&q=80',
            }));
            combinedOpportunities.push(...formattedJobs);
          }

          if (eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value) && eventsRes.value.length > 0) {
            const myIdStr = (currentUserInfo?._id || currentUserInfo?.id || '').toString();
            registeredEventsCount = eventsRes.value.filter(e => {
              if (!myIdStr) return false;
              const attendees = Array.isArray(e.attendees) ? e.attendees : [];
              return attendees.some(a => (a._id || a.id || a).toString() === myIdStr) || 
                     (e.organizer && (e.organizer._id || e.organizer).toString() === myIdStr) ||
                     (e.user && (e.user._id || e.user).toString() === myIdStr);
            }).length;

            const formattedEvents = eventsRes.value.map(e => ({
              id: e._id || e.id,
              title: e.title,
              subtitle: e.date ? `${new Date(e.date).toLocaleDateString()} • ${e.location || 'Online'}` : e.location || 'Online',
              btnText: 'View Details',
              image: e.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=400&h=260&q=80',
            }));
            combinedOpportunities.push(...formattedEvents);
          }
          setEventsAndJobs(combinedOpportunities);
          let localRegisteredCount = 0;
          try {
            const localRegStr = await AsyncStorage.getItem('localRegisteredEvents');
            if (localRegStr) {
              const localRegIds = JSON.parse(localRegStr);
              if (Array.isArray(localRegIds)) localRegisteredCount = localRegIds.length;
            }
          } catch (_) {}
          setMyEventsCount(Math.max(registeredEventsCount, localRegisteredCount));

          // 5. Process Following & Followers connections
          const initialFollowed = {};
          let totalConn = 0;

          if (followingRes.status === 'fulfilled' && Array.isArray(followingRes.value)) {
            followingRes.value.forEach(user => {
              if (user._id || user.id) initialFollowed[user._id || user.id] = true;
              if (user.name) initialFollowed[user.name.toLowerCase().trim()] = true;
            });
            totalConn += followingRes.value.length;
          }
          if (followersRes.status === 'fulfilled' && Array.isArray(followersRes.value)) {
            totalConn += followersRes.value.length;
          }

          setFollowingMap(prev => ({ ...prev, ...initialFollowed }));
          setConnectionsCount(totalConn);

        } catch (err) {
          console.error('Error fetching dashboard data:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      fetchData();
      return () => { isMounted = false; };
    }, [])
  );

  // ─── Instagram HiFi Handlers ──────────────────────────────
  const [doubleTapHeart, setDoubleTapHeart] = useState({});
  const lastTapRef = useRef({});

  const handleImageDoubleTap = (postId) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTapRef.current[postId] && (now - lastTapRef.current[postId]) < DOUBLE_PRESS_DELAY) {
      if (!likedPosts[postId]) {
        toggleLike(postId);
      }
      setDoubleTapHeart(prev => ({ ...prev, [postId]: true }));
      setTimeout(() => {
        setDoubleTapHeart(prev => ({ ...prev, [postId]: false }));
      }, 900);
    } else {
      lastTapRef.current[postId] = now;
    }
  };

  const toggleLike = async (postId) => {
    const isCurrentlyLiked = Boolean(likedPosts[postId]);
    const nextLikedState = !isCurrentlyLiked;

    // Optimistically update UI
    setLikedPosts((prev) => ({ ...prev, [postId]: nextLikedState }));
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId || p._id === postId) {
          const currentCount = typeof p.likes === 'number' ? p.likes : 0;
          return {
            ...p,
            likes: nextLikedState ? currentCount + 1 : Math.max(0, currentCount - 1),
            isLiked: nextLikedState,
          };
        }
        return p;
      })
    );

    try {
      const updated = await toggleLikePost(postId);
      if (updated && Array.isArray(updated.likes)) {
        let myIdStr = (currentUser?._id || currentUser?.id || '').toString();
        if (!myIdStr) {
          try {
            const raw = await AsyncStorage.getItem('userInfo');
            if (raw) myIdStr = (JSON.parse(raw)?._id || JSON.parse(raw)?.id || '').toString();
          } catch (_) {}
        }

        const serverLiked = myIdStr
          ? updated.likes.some(l => {
              const lId = typeof l === 'object' ? (l._id || l.id || '') : l;
              return lId && lId.toString() === myIdStr;
            })
          : nextLikedState;

        setLikedPosts((prev) => ({ ...prev, [postId]: serverLiked }));
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.id === postId || p._id === postId) {
              return { ...p, likes: updated.likes.length, isLiked: serverLiked };
            }
            return p;
          })
        );
      }
    } catch (error) {
      // Revert optimistic update on error
      setLikedPosts((prev) => ({ ...prev, [postId]: isCurrentlyLiked }));
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId || p._id === postId) {
            const currentCount = typeof p.likes === 'number' ? p.likes : 0;
            return {
              ...p,
              likes: isCurrentlyLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
              isLiked: isCurrentlyLiked,
            };
          }
          return p;
        })
      );
      console.error('Error toggling like:', error);
    }
  };

  const [reshareNote, setReshareNote] = useState('');
  const [resharingLoading, setResharingLoading] = useState(false);

  const toggleBookmark = async (postId) => {
    try {
      setBookmarkedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
      await toggleSavePost(postId);
    } catch (error) {
      console.error('Error toggling save post:', error);
    }
  };

  const refreshPostsFeed = async () => {
    try {
      const postsData = await getPosts();
      if (Array.isArray(postsData)) {
        const formatted = postsData.map(p => formatPostObject(p, currentUser?._id || currentUser?.id)).filter(Boolean);
        setPosts(formatted);
      }
    } catch (e) {
      console.error('Error refreshing posts feed:', e);
    }
  };

  const toggleFollow = async (authorId, userName) => {
    const keyId = authorId || '';
    const keyName = userName ? userName.toLowerCase() : '';
    try {
      setFollowingMap((prev) => {
        const nextState = !Boolean(prev[keyId] || prev[keyName]);
        return { ...prev, [keyId]: nextState, [keyName]: nextState };
      });
      if (keyId && keyId.length > 15) {
        await toggleFollowUser(keyId);
      }
      await refreshPostsFeed();
    } catch (error) {
      setFollowingMap((prev) => {
        const nextState = !Boolean(prev[keyId] || prev[keyName]);
        return { ...prev, [keyId]: nextState, [keyName]: nextState };
      });
      console.error('Error toggling follow:', error);
    }
  };

  const toggleSuggestionFollow = async (id) => {
    try {
      setFollowingMap((prev) => ({ ...prev, [id]: !prev[id] }));
      await toggleFollowUser(id);
      await refreshPostsFeed();
    } catch (error) {
      setFollowingMap((prev) => ({ ...prev, [id]: !prev[id] }));
      console.error('Error toggling follow:', error);
    }
  };

  const handleShare = async (post) => {
    try {
      await Share.share({
        message: `Check out this post from ${post.user} on Institution Alumni App:\n"${post.content}"`,
      });
    } catch (_error) {
      Alert.alert('Error', 'Could not share this post');
    }
  };

  // ─── Sub-components ────────────────────────────────────
  const renderPostCard = (post) => {
    const isReshared = Boolean(post.isReshare || post.originalPost || post.originalAuthorName || (post.content && /reshared\s+from/i.test(post.content)));
    const category = getPostCategory(post);

    const isOwnPost = (post.authorId && (post.authorId === currentUser?._id || post.authorId === currentUser?.id)) ||
      (post.user && currentUser?.name && (
        post.user.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        currentUser.name.toLowerCase().includes(post.user.toLowerCase())
      ));

    const isFollowing = Boolean(
      (post.authorId && followingMap[post.authorId]) ||
      (post.user && followingMap[post.user.toLowerCase()])
    );

    return (
      <View key={post.id} style={styles.postCard}>
        {/* Reshared Top Header Tag */}
        {isReshared && (
          <View style={styles.resharedHeaderTag}>
            <View style={styles.resharedIconWrap}>
              <Ionicons name="repeat" size={12} color="#6366F1" />
            </View>
            <Text style={styles.resharedText}>
              <Text style={{ fontWeight: '700', color: theme.text }}>{post.user}</Text> amplified to alumni network
            </Text>
          </View>
        )}

        {/* Post Academic Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.postUserAvatar}
            activeOpacity={0.8}
            onPress={() => {
              if (post.authorId) {
                // Navigate to directory or profile
              }
            }}
          >
            {post.isAvatarUrl ? (
              <Image source={{ uri: post.avatar }} style={{ width: '100%', height: '100%', borderRadius: 21 }} />
            ) : (
              <Text style={styles.avatarText}>{post.avatar || getInitials(post.user)}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.postUserInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <Text style={styles.postUserName}>{post.user}</Text>
              <Ionicons name="checkmark-circle" size={15} color="#0284C7" />
            </View>
            <Text style={styles.postUserRole} numberOfLines={1}>
              {post.role || 'RVCE Alumni Member'}
            </Text>
          </View>

          {/* Right Header Badges */}
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            {/* Category Intent Badge */}
            <View style={[styles.categoryBadge, { backgroundColor: category.bg }]}>
              <Ionicons name={category.icon} size={11} color={category.color} style={{ marginRight: 3 }} />
              <Text style={[styles.categoryBadgeText, { color: category.color }]}>{category.label}</Text>
            </View>

            {/* Follow / Connect Button */}
            {!isOwnPost && (
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  isFollowing && styles.followingBtn
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  if (isFollowing) {
                    setUnfollowTarget({
                      name: post.user,
                      avatar: post.avatar,
                      onConfirm: async () => {
                        await toggleFollow(post.authorId, post.user);
                      }
                    });
                  } else {
                    toggleFollow(post.authorId, post.user);
                  }
                }}
              >
                <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                  {isFollowing ? 'Following' : '+ Connect'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Thoughtful Content Body (Rendered FIRST, above media) */}
        {!isReshared && post.content ? (
          <View style={styles.postBodyContainer}>
            <Text style={styles.postContentText}>
              {post.content}
            </Text>
          </View>
        ) : null}

        {/* Reposter Note / Caption (if present on reshares) */}
        {isReshared && post.content && !post.content.startsWith('Reshared:') && !post.content.startsWith('Reshared post') ? (
          <View style={styles.postBodyContainer}>
            <Text style={styles.postContentText}>
              {post.content}
            </Text>
          </View>
        ) : null}

        {/* Embedded Original Post Card for Reshares */}
        {isReshared && (
          <View style={styles.embeddedReshareCard}>
            <View style={styles.embeddedHeader}>
              <View style={styles.embeddedAvatar}>
                {post.originalPost?.isAvatarUrl ? (
                  <Image source={{ uri: post.originalPost.avatar }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                ) : (
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFF' }}>
                    {post.originalPost?.avatar || getInitials(post.originalPost?.user || post.originalAuthorName || 'Alumni')}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>
                  {post.originalPost?.user || post.originalAuthorName || 'Alumni Member'}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                  {post.originalPost?.role || 'Alumni Member'}
                </Text>
              </View>
              {post.originalPost?.time ? (
                <Text style={{ fontSize: 11, color: theme.textMuted }}>{post.originalPost.time}</Text>
              ) : null}
            </View>

            {post.originalPost?.image ? (
              <Image 
                source={{ uri: post.originalPost.image }} 
                style={styles.embeddedImage} 
                resizeMode="cover" 
              />
            ) : null}

            {post.originalPost?.content ? (
              <Text style={styles.embeddedContent} numberOfLines={4}>
                {post.originalPost.content}
              </Text>
            ) : (
              (!post.originalPost?.image && post.content) ? (
                <Text style={styles.embeddedContent} numberOfLines={4}>
                  {post.content.replace(/^Reshared:\s*/i, '')}
                </Text>
              ) : null
            )}
          </View>
        )}

        {/* Regular Non-Reshared Post Image with Double-Tap to Like */}
        {!isReshared && post.image ? (
          <TouchableOpacity 
            activeOpacity={0.95} 
            onPress={() => handleImageDoubleTap(post.id)}
            style={styles.postImageWrapper}
          >
            <Image source={{ uri: post.image }} style={[styles.postImage, { width: '100%', height: contentWidth * 0.62 }]} />
            {doubleTapHeart[post.id] && (
              <View style={styles.doubleTapHeartOverlay}>
                <Ionicons name="heart" size={88} color="#FF3040" style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.6,
                  shadowRadius: 12,
                  elevation: 12
                }} />
              </View>
            )}
          </TouchableOpacity>
        ) : null}

        {/* Alumni Engagement Action Bar */}
        <View style={styles.alumniActionBar}>
          <TouchableOpacity 
            style={[
              styles.alumniActionBtn, 
              likedPosts[post.id] && styles.alumniActionBtnLiked
            ]} 
            onPress={() => toggleLike(post.id)} 
            activeOpacity={0.65}
          >
            <Ionicons
              name={likedPosts[post.id] ? 'heart' : 'heart-outline'}
              size={18}
              color={likedPosts[post.id] ? '#F43F5E' : theme.text}
            />
            <Text style={[styles.alumniActionLabel, likedPosts[post.id] && { color: '#F43F5E', fontWeight: '700' }]}>
              {post.likes > 0 ? `${post.likes} Applaud` : 'Applaud'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.alumniActionBtn} 
            activeOpacity={0.65} 
            onPress={() => openModal('comments', post)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={17} color={theme.text} />
            <Text style={styles.alumniActionLabel}>
              {post.commentsCount > 0 ? `${post.commentsCount} Discuss` : 'Discuss'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.alumniActionBtn} 
            activeOpacity={0.65} 
            onPress={() => openModal('reshare', post)}
          >
            <Ionicons name="repeat-outline" size={18} color={isReshared ? '#6366F1' : theme.text} />
            <Text style={[styles.alumniActionLabel, isReshared && { color: '#6366F1' }]}>
              {post.resharesCount > 0 ? `${post.resharesCount} Amplify` : 'Amplify'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.alumniActionBtn}
            onPress={() => openModal('share', post)}
            activeOpacity={0.65}
          >
            <Ionicons name="share-social-outline" size={17} color={theme.text} />
            <Text style={styles.alumniActionLabel}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.alumniActionBtn, bookmarkedPosts[post.id] && styles.alumniActionBtnSaved]} 
            onPress={() => toggleBookmark(post.id)} 
            activeOpacity={0.65}
          >
            <Ionicons
              name={bookmarkedPosts[post.id] ? 'bookmark' : 'bookmark-outline'}
              size={17}
              color={bookmarkedPosts[post.id] ? theme.primary : theme.text}
            />
          </TouchableOpacity>
        </View>

        {/* Footer info: Comments teaser & Time */}
        <View style={styles.postFooterBar}>
          {post.commentsCount > 0 && (
            <TouchableOpacity onPress={() => openModal('comments', post)} activeOpacity={0.7}>
              <Text style={styles.viewCommentsLink}>
                View all {post.commentsCount} comments & insights
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.postTimestampText}>{post.time}</Text>
        </View>
      </View>
    );
  };

  const renderWelcomePulse = () => (
    <View style={styles.welcomeBanner}>
      <View style={styles.welcomeHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.welcomeInstitutionTag}>
            <Ionicons name="shield-checkmark" size={13} color="#002B5C" />
            <Text style={styles.welcomeInstitutionText}>RVCE ALUMNI NETWORK</Text>
          </View>
          <Text style={styles.welcomeTitle}>
            Welcome back, {userName?.split(' ')[0] || 'Member'}! 🎓
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Connect with 25,000+ RVCE graduates across 12 global chapters and industry leadership.
          </Text>
        </View>
      </View>

      {/* 4 Quick-Pulse Access Tiles */}
      <View style={styles.pulseGrid}>
        <TouchableOpacity 
          style={styles.pulseTile}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Engage', { tab: 'directory' })}
        >
          <View style={[styles.pulseIconWrap, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="people" size={18} color="#4F46E5" />
          </View>
          <Text style={styles.pulseLabel}>Directory</Text>
          <Text style={styles.pulseSub}>Find Alums</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.pulseTile}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Jobs')}
        >
          <View style={[styles.pulseIconWrap, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="briefcase" size={18} color="#059669" />
          </View>
          <Text style={styles.pulseLabel}>Career Hub</Text>
          <Text style={styles.pulseSub}>Referrals</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.pulseTile}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Main', { screen: 'Post', params: { view: 'events' } })}
        >
          <View style={[styles.pulseIconWrap, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="calendar" size={18} color="#D97706" />
          </View>
          <Text style={styles.pulseLabel}>Reunions</Text>
          <Text style={styles.pulseSub}>Events</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.pulseTile}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Jobs')}
        >
          <View style={[styles.pulseIconWrap, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="document-text" size={18} color="#9333EA" />
          </View>
          <Text style={styles.pulseLabel}>Resume Book</Text>
          <Text style={styles.pulseSub}>Talent Pool</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSpotlightsDeck = () => (
    <View style={styles.spotlightsSection}>
      <View style={styles.spotlightsHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View style={styles.spotlightHeaderBar} />
          <Text style={styles.spotlightsTitle}>Alumni Radar & Spotlights</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Engage')} activeOpacity={0.7}>
          <Text style={styles.spotlightsSeeAll}>Explore All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.spotlightsScroll}>
        {ALUMNI_SPOTLIGHTS.map(spot => (
          <TouchableOpacity
            key={spot.id}
            style={styles.spotlightCard}
            activeOpacity={0.88}
            onPress={() => {
              if (spot.url) {
                handleOpenExternalUrl(spot.url);
              } else if (spot.route) {
                navigation.navigate(spot.route, spot.params);
              }
            }}
          >
            <View style={styles.spotlightTopRow}>
              <View style={[styles.spotlightTag, { backgroundColor: spot.tagBg }]}>
                <Text style={[styles.spotlightTagText, { color: spot.tagColor }]}>{spot.tag}</Text>
              </View>
              <View style={[styles.spotlightIconWrap, { backgroundColor: spot.iconBg }]}>
                <Ionicons name={spot.icon} size={15} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.spotlightTitle} numberOfLines={1}>{spot.title}</Text>
            <Text style={styles.spotlightSubtitle} numberOfLines={1}>{spot.subtitle}</Text>
            <Text style={styles.spotlightDesc} numberOfLines={2}>{spot.desc}</Text>
            <View style={styles.spotlightActionRow}>
              <Text style={styles.spotlightActionText}>{spot.actionText}</Text>
              <Ionicons name="arrow-forward" size={13} color={theme.primary} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderAlumniComposer = () => (
    <View style={styles.composerCard}>
      <View style={styles.composerInputRow}>
        <TouchableOpacity 
          style={styles.composerAvatar}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          {userAvatarUrl ? (
            <Image source={{ uri: userAvatarUrl }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Text style={styles.composerAvatarInitials}>{getInitials(userName || currentUser?.name || 'User')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.composerPromptBox}
          onPress={() => navigation.navigate('PostCreation')}
          activeOpacity={0.85}
        >
          <Text style={styles.composerPromptText}>Share an achievement, campus memory, or job referral...</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.composerActionsRow}>
        <TouchableOpacity 
          style={styles.composerActionChip}
          onPress={() => navigation.navigate('PostCreation')}
          activeOpacity={0.7}
        >
          <Ionicons name="briefcase-outline" size={16} color="#059669" />
          <Text style={styles.composerActionLabel}>Post Referral</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.composerActionChip}
          onPress={() => navigation.navigate('Main', { screen: 'Post', params: { view: 'events' } })}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={16} color="#D97706" />
          <Text style={styles.composerActionLabel}>Campus Event</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.composerActionChip}
          onPress={() => navigation.navigate('PostCreation')}
          activeOpacity={0.7}
        >
          <Ionicons name="image-outline" size={16} color="#2563EB" />
          <Text style={styles.composerActionLabel}>Media Update</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFeedFilterPills = () => (
    <View style={styles.feedFilterBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.feedFilterScroll}>
        {[
          { id: 'all', label: '🌟 All Highlights' },
          { id: 'campus', label: '🎓 Campus & Notices' },
          { id: 'jobs', label: '💼 Referrals & Hiring' },
          { id: 'network', label: '👥 My Network' }
        ].map(tab => {
          const isActive = feedFilter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              onPress={() => setFeedFilter(tab.id)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                {tab.label}
              </Text>
              {tab.id === 'all' && posts.length > 0 && (
                <View style={[styles.filterCountBadge, isActive && styles.filterCountBadgeActive]}>
                  <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>{posts.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={webContainerStyle}>
        
        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          {/* Left – User avatar */}
          <TouchableOpacity
            style={[styles.headerAvatar, { width: 34, height: 34, borderRadius: 17, overflow: 'hidden', backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center' }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile')}
          >
            {userAvatarUrl ? (
              <Image source={{ uri: userAvatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 17 }} />
            ) : (
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>{getInitials(userName || currentUser?.name || currentUser?.email || 'User')}</Text>
            )}
          </TouchableOpacity>

          {/* Center – Search bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#94A3B8"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Right – Icons */}
          <View style={styles.headerIcons}>
            {isDesktop && (
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => navigation.navigate('Main', { screen: 'Post', params: { view: 'events' } })}
                title="Events & Meetups"
              >
                <Ionicons name="calendar-outline" size={22} color={theme.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => { setUnreadMessages(0); navigation.navigate('Messages'); }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={theme.primary} />
              {unreadMessages > 0 && <View style={styles.dot} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => { setUnreadNotifications(0); navigation.navigate('Notifications'); }}
            >
              <Ionicons name="notifications-outline" size={22} color={theme.primary} />
              {unreadNotifications > 0 && <View style={styles.dot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Admin Quick Actions Banner */}
        {isAdminOrSuper && (
          <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#DBEAFE', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="shield-checkmark" size={18} color="#003366" style={{ marginRight: 10 }} />
              <View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#003366' }}>{userRole} Dashboard</Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>Quick actions for administration</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={{ backgroundColor: '#003366', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
              onPress={() => navigation.navigate(isSuperAdmin ? 'SuperAdminMain' : 'AdminMain')}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>Admin Panel</Text>
            </TouchableOpacity>
          </View>
        )}

        {isDesktop ? (
          // EXECUTIVE 2-COLUMN ALUMNI WORKSPACE
          <View style={styles.desktopContainer}>
            {/* 1. Left Column: Welcome Pulse, Spotlights Deck, Composer, Filter Pills, Post Feed */}
            <View style={styles.desktopMainColumn}>
              {renderWelcomePulse()}
              {renderSpotlightsDeck()}
              {renderAlumniComposer()}
              {renderFeedFilterPills()}

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                {filteredPosts.length > 0 ? (
                  filteredPosts.map(post => renderPostCard(post))
                ) : (
                  <View style={styles.emptyFeedBox}>
                    <Ionicons name="newspaper-outline" size={44} color="#94A3B8" style={{ marginBottom: 10 }} />
                    <Text style={styles.emptyFeedTitle}>No posts in this category yet</Text>
                    <Text style={styles.emptyFeedDesc}>
                      {feedFilter === 'jobs' 
                        ? 'Be the first alumni to post a hiring referral or career opportunity!'
                        : feedFilter === 'campus'
                        ? 'Stay tuned for official RVCE campus updates, reunions, and notifications.'
                        : feedFilter === 'network'
                        ? 'Follow alumni from the Directory to populate your personal network feed.'
                        : 'Share an update or milestone to spark alumni conversations!'}
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyFeedCta}
                      onPress={() => feedFilter === 'network' ? navigation.navigate('Engage', { tab: 'directory' }) : navigation.navigate('PostCreation')}
                    >
                      <Text style={styles.emptyFeedCtaText}>
                        {feedFilter === 'network' ? 'Explore Directory' : 'Share First Post'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>

            {/* 2. Right Column: Institutional Sidebar */}
            <View style={styles.desktopSidebarColumn}>
              {/* Profile Identity Card */}
              <View style={styles.sidebarCard}>
                <View style={styles.sidebarCoverBanner}>
                  <View style={styles.sidebarCoverDecor1} />
                  <View style={styles.sidebarCoverDecor2} />
                </View>

                <View style={styles.sidebarProfileBody}>
                  <TouchableOpacity 
                    style={styles.sidebarAvatarWrap}
                    onPress={() => navigation.navigate('Profile')}
                    activeOpacity={0.8}
                  >
                    {userAvatarUrl ? (
                      <Image source={{ uri: userAvatarUrl }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF' }}>
                        {getInitials(userName || currentUser?.name || currentUser?.email || 'User')}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 5 }}>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text }}>{userName || 'Alumni Member'}</Text>
                    <Ionicons name="checkmark-circle" size={17} color="#0284C7" />
                  </View>

                  <Text style={{ fontSize: 12.5, color: theme.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
                    {currentUser?.designation || 'Alumni Member'}
                    {currentUser?.company ? ` @ ${currentUser.company}` : (currentUser?.institution ? `\n@ ${currentUser.institution}` : '')}
                  </Text>

                  <View style={styles.sidebarDivider} />

                  <View style={{ width: '100%', flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity 
                      style={styles.sidebarStatPod}
                      onPress={() => navigation.navigate('Profile')}
                    >
                      <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 16 }}>{connectionsCount}</Text>
                      <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 11, marginTop: 2 }}>Connections</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.sidebarStatPod}
                      onPress={() => navigation.navigate('Main', { screen: 'Post', params: { view: 'events' } })}
                    >
                      <Text style={{ color: '#D97706', fontWeight: '800', fontSize: 16 }}>{myEventsCount}</Text>
                      <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 11, marginTop: 2 }}>Events</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('Profile')}
                    style={styles.sidebarViewProfileBtn}
                  >
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: theme.primary }}>View Full Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Alumni Hub: Mentorship & Chapters */}
              <View style={styles.sidebarCardPadded}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <View style={{ width: 6, height: 16, borderRadius: 3, backgroundColor: '#0284C7' }} />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text, letterSpacing: 0.3 }}>
                      Alumni Hub
                    </Text>
                  </View>
                  <View style={styles.sidebarPillTag}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#0284C7' }}>COMMUNITY</Text>
                  </View>
                </View>

                {/* 1. Mentorship Connect */}
                <TouchableOpacity 
                  style={styles.sidebarHubItem}
                  onPress={() => navigation.navigate('Main', { screen: 'Engage', params: { tab: 'directory' } })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sidebarHubIcon, { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' }]}>
                    <Ionicons name="sparkles" size={17} color="#4F46E5" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>1-on-1 Mentorship</Text>
                      <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 }}>
                        <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#15803D' }}>ACTIVE</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>Career advice with senior alumni</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {/* 2. Global Alumni Chapters */}
                <TouchableOpacity 
                  style={styles.sidebarHubItem}
                  onPress={() => navigation.navigate('Main', { screen: 'Engage', params: { tab: 'communities' } })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sidebarHubIcon, { backgroundColor: isDarkMode ? '#082F49' : '#E0F2FE' }]}>
                    <Ionicons name="globe" size={17} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>Global Chapters</Text>
                      <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 }}>
                        <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#0369A1' }}>12 CITIES</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>Bengaluru, Silicon Valley, Europe</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {/* 3. Batchmate Circles */}
                <TouchableOpacity 
                  style={styles.sidebarHubItem}
                  onPress={() => navigation.navigate('Main', { screen: 'Engage', params: { tab: 'directory' } })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sidebarHubIcon, { backgroundColor: isDarkMode ? '#451A03' : '#FEF3C7' }]}>
                    <Ionicons name="people" size={17} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>Batchmate Circles</Text>
                      <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 }}>
                        <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#B45309' }}>REUNIONS</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>Connect with your graduating class</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {/* 4. Founder Referrals */}
                <TouchableOpacity 
                  style={styles.sidebarHubItem}
                  onPress={() => navigation.navigate('Main', { screen: 'Jobs' })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sidebarHubIcon, { backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5' }]}>
                    <Ionicons name="briefcase" size={17} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>Founder Referrals</Text>
                      <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 }}>
                        <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#166534' }}>HIRING</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>Direct alumni company openings</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Suggestions / Network Box */}
              <View style={styles.sidebarCardPadded}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>Suggested Connections</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Engage', { tab: 'directory' })} activeOpacity={0.7}>
                    <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '700' }}>See all</Text>
                  </TouchableOpacity>
                </View>

                {suggestions && suggestions.length > 0 ? (
                  suggestions.slice(0, 4).map(s => (
                    <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#002B5C', justifyContent: 'center', alignItems: 'center', marginRight: 10, overflow: 'hidden' }}>
                          {s.isAvatarUrl ? (
                            <Image source={{ uri: s.avatar }} style={{ width: 38, height: 38, borderRadius: 19 }} />
                          ) : (
                            <Text style={{ fontWeight: '700', color: '#FFFFFF', fontSize: 12 }}>{s.avatar || getInitials(s.name)}</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }} numberOfLines={1}>{s.name}</Text>
                          <Text style={{ fontSize: 11, color: theme.textSecondary }} numberOfLines={1}>
                            {s.subtitle || (followingMap[s.id] ? 'Followed by you' : 'Alumni Member')}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => toggleSuggestionFollow(s.id)} activeOpacity={0.7}>
                        <Text style={{ color: followingMap[s.id] ? theme.textSecondary : '#0284C7', fontSize: 12, fontWeight: '700' }}>
                          {followingMap[s.id] ? 'Following' : '+ Connect'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                    <Ionicons name="people-outline" size={32} color="#003366" style={{ marginBottom: 8 }} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, textAlign: 'center', marginBottom: 4 }}>Expand Your Network</Text>
                    <Text style={{ fontSize: 11.5, color: theme.textSecondary, textAlign: 'center', lineHeight: 17, marginBottom: 14 }}>
                      Find and connect with alumni from your department and batch.
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Engage', { tab: 'directory' })}
                      style={styles.sidebarDirectoryBtn}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="search" size={13} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Explore Directory</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Campus Quick Links */}
              <View style={styles.sidebarCardPadded}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <View style={{ width: 6, height: 16, borderRadius: 3, backgroundColor: '#002B5C' }} />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text, letterSpacing: 0.3 }}>
                      Campus Quick Links
                    </Text>
                  </View>
                  <View style={[styles.sidebarPillTag, { backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF', borderColor: isDarkMode ? '#334155' : '#C7D2FE' }]}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#002B5C' }}>RVCE SERVICES</Text>
                  </View>
                </View>

                {/* 1. Official RVCE Portal */}
                <TouchableOpacity 
                  style={styles.sidebarCampusLink}
                  onPress={() => handleOpenExternalUrl('https://rvce.edu.in')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sidebarCampusIcon, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF' }]}>
                    <Ionicons name="school" size={17} color="#002B5C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: theme.text }}>Official RVCE Portal</Text>
                      <Ionicons name="open-outline" size={12} color="#64748B" />
                    </View>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>rvce.edu.in • Academic calendars</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {/* 2. Transcripts & Degree Verification */}
                <TouchableOpacity 
                  style={styles.sidebarCampusLink}
                  onPress={() => handleOpenExternalUrl('https://rvce.edu.in/exam-section')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sidebarCampusIcon, { backgroundColor: isDarkMode ? '#134E4A' : '#CCFBF1' }]}>
                    <Ionicons name="document-text" size={17} color="#0F766E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: theme.text }}>Transcripts & Verifications</Text>
                      <View style={{ backgroundColor: '#CCFBF1', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: '#0F766E' }}>EXAM CELL</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>Official degree & marksheet requests</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {/* 3. RSST Incubation & Startup Centre */}
                <TouchableOpacity 
                  style={styles.sidebarCampusLink}
                  onPress={() => handleOpenExternalUrl('https://rvce.edu.in/rvce-centre-for-innovation')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sidebarCampusIcon, { backgroundColor: isDarkMode ? '#7C2D12' : '#FFEDD5' }]}>
                    <Ionicons name="rocket" size={17} color="#EA580C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: theme.text }}>Incubation & Research Lab</Text>
                      <View style={{ backgroundColor: '#FFEDD5', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: '#C2410C' }}>GRANTS</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>RSST seed funds & patent filing</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                </TouchableOpacity>

                {/* 4. Virtual Campus Tour & Archives */}
                <TouchableOpacity 
                  style={styles.sidebarCampusLink}
                  onPress={() => handleOpenExternalUrl('https://rvce.edu.in/about-us')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sidebarCampusIcon, { backgroundColor: isDarkMode ? '#881337' : '#FFE4E6' }]}>
                    <Ionicons name="compass" size={17} color="#E11D48" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: theme.text }}>Campus Tour & Heritage</Text>
                      <Ionicons name="open-outline" size={12} color="#64748B" />
                    </View>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>Explore Mysore Road campus landmarks</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Sidebar Footer */}
              <View style={{ paddingHorizontal: 8, paddingBottom: 24 }}>
                <Text style={{ fontSize: 11, color: '#94A3B8', lineHeight: 18 }}>
                  About • Guidelines • Career Hub • Privacy Policy • Terms • Institutional Verification
                </Text>
                <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 8, fontWeight: '500' }}>
                  © 2026 RASHTREEYA SIKSHANA SAMITHI TRUST
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {renderWelcomePulse()}
            {renderSpotlightsDeck()}
            {renderAlumniComposer()}
            {renderFeedFilterPills()}

            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => renderPostCard(post))
            ) : (
              <View style={styles.emptyFeedBox}>
                <Ionicons name="newspaper-outline" size={44} color="#94A3B8" style={{ marginBottom: 10 }} />
                <Text style={styles.emptyFeedTitle}>No posts in this category yet</Text>
                <Text style={styles.emptyFeedDesc}>
                  {feedFilter === 'jobs' 
                    ? 'Be the first alumni to post a hiring referral or career opportunity!'
                    : feedFilter === 'campus'
                    ? 'Stay tuned for official RVCE campus updates, reunions, and notifications.'
                    : feedFilter === 'network'
                    ? 'Follow alumni from the Directory to populate your personal network feed.'
                    : 'Share an update or milestone to spark alumni conversations!'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyFeedCta}
                  onPress={() => feedFilter === 'network' ? navigation.navigate('Engage', { tab: 'directory' }) : navigation.navigate('PostCreation')}
                >
                  <Text style={styles.emptyFeedCtaText}>
                    {feedFilter === 'network' ? 'Explore Directory' : 'Share First Post'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Suggestions on Mobile */}
            {suggestions.filter(s => !followingMap[s.id]).length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Suggested Connections</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Engage', { tab: 'directory' })}><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
                  {suggestions.filter(s => !followingMap[s.id]).map((s) => (
                    <View key={s.id} style={styles.suggestionCard}>
                      <View style={styles.suggestionAvatar}>
                        {s.isAvatarUrl ? (
                          <Image source={{ uri: s.avatar }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                        ) : (
                          <Text style={styles.suggestionAvatarText}>{s.avatar || getInitials(s.name)}</Text>
                        )}
                      </View>
                      <Text style={styles.suggestionName} numberOfLines={1}>{s.name}</Text>
                      <Text style={styles.suggestionSubtitle} numberOfLines={1}>{s.subtitle || 'Alumni Member'}</Text>
                      <TouchableOpacity
                        style={[styles.suggestionFollowBtn, followingMap[s.id] && styles.suggestionFollowBtnActive]}
                        onPress={() => toggleSuggestionFollow(s.id)}
                      >
                        <Text style={[styles.suggestionFollowText, followingMap[s.id] && styles.suggestionFollowTextActive]}>
                          {followingMap[s.id] ? 'Following' : '+ Connect'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Campus Quick Services on Mobile */}
            <View style={styles.mobileCampusServices}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="business" size={16} color="#002B5C" />
                  <Text style={{ fontSize: 13.5, fontWeight: '800', color: theme.text }}>Campus Quick Services</Text>
                </View>
                <View style={styles.sidebarPillTag}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#002B5C' }}>RVCE OFFICIAL</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <TouchableOpacity 
                  style={styles.mobileServiceCard}
                  onPress={() => handleOpenExternalUrl('https://rvce.edu.in')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.mobileServiceIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="school" size={16} color="#002B5C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>RVCE Portal</Text>
                    <Text style={{ fontSize: 10, color: theme.textMuted }}>rvce.edu.in</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.mobileServiceCard}
                  onPress={() => handleOpenExternalUrl('https://rvce.edu.in/exam-section')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.mobileServiceIcon, { backgroundColor: '#CCFBF1' }]}>
                    <Ionicons name="document-text" size={16} color="#0F766E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>Transcripts</Text>
                    <Text style={{ fontSize: 10, color: theme.textMuted }}>Exam Cell</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.mobileServiceCard}
                  onPress={() => handleOpenExternalUrl('https://rvce.edu.in/rvce-centre-for-innovation')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.mobileServiceIcon, { backgroundColor: '#FFEDD5' }]}>
                    <Ionicons name="rocket" size={16} color="#EA580C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>Incubation</Text>
                    <Text style={{ fontSize: 10, color: theme.textMuted }}>Seed Grants</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.mobileServiceCard}
                  onPress={() => handleOpenExternalUrl('https://rvce.edu.in/about-us')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.mobileServiceIcon, { backgroundColor: '#FFE4E6' }]}>
                    <Ionicons name="compass" size={16} color="#E11D48" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>Campus Tour</Text>
                    <Text style={{ fontSize: 10, color: theme.textMuted }}>360° Heritage</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Mobile Footer */}
            <View style={{ paddingHorizontal: 20, marginBottom: 30, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 16 }}>
                RVCE Alumni Network • Rashtreeya Sikshana Samithi Trust
              </Text>
              <Text style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 4 }}>
                Bengaluru • Silicon Valley • Global Chapters
              </Text>
            </View>
          </ScrollView>
        )}
      </View>

      {/* ── Modals ────────────────────────────────────────────── */}
      {/* Comments Modal */}
      <Modal visible={activeModal === 'comments'} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={isWeb ? styles.webModalOverlay : styles.modalOverlay}>
          <View style={isWeb ? styles.webModalContainer : styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Comments ({selectedPost?.comments?.length || 0})</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 16, maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {(!selectedPost?.comments || selectedPost.comments.length === 0) ? (
                <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                  <Ionicons name="chatbubble-outline" size={36} color="#CBD5E1" />
                  <Text style={{ marginTop: 8, color: theme.textMuted, fontSize: 13 }}>No comments yet. Start the conversation!</Text>
                </View>
              ) : (
                selectedPost.comments.map((item, index) => (
                  <View key={item._id || index} style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2 }}>
                      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 11 }}>
                        {getInitials(item.user?.name || (typeof item.user === 'string' ? item.user : null))}
                      </Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0, 33, 68, 0.04)', borderRadius: 12, padding: 10 }}>
                      <Text style={{ fontWeight: '700', fontSize: 13, color: theme.text }}>
                        {item.user?.name || (typeof item.user === 'string' ? item.user : 'Alumni')}
                      </Text>
                      <Text style={{ fontSize: 13, color: theme.text, marginTop: 2 }}>{item.text}</Text>
                      <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 4 }}>
                        {item.createdAt ? getTimeAgo(item.createdAt) : 'Just now'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.commentInputRow}>
              <TextInput 
                style={styles.commentInput} 
                placeholder="Add a comment..." 
                placeholderTextColor={theme.textMuted} 
                value={commentText} 
                onChangeText={setCommentText} 
              />
              <TouchableOpacity 
                disabled={!commentText.trim()}
                onPress={async () => {
                  if (!commentText.trim() || !selectedPost) return;
                  const textToAdd = commentText.trim();
                  setCommentText('');
                  
                  const targetId = selectedPost.id || selectedPost._id;
                  const newCommentObj = { 
                    _id: 'c_' + Date.now(), 
                    text: textToAdd, 
                    user: { name: 'You' }, 
                    createdAt: new Date() 
                  };

                  let updatedComments = [...(selectedPost.comments || []), newCommentObj];
                  
                  try {
                    const updatedPost = await addComment(targetId, textToAdd);
                    if (updatedPost && updatedPost.comments) {
                      updatedComments = updatedPost.comments;
                    }
                  } catch (err) {
                    console.log('Comment posting note:', err?.message || err);
                  } finally {
                    setSelectedPost(prev => prev ? ({ ...prev, comments: updatedComments }) : null);
                    setPosts(prev => prev.map(p => (p.id === targetId || p._id === targetId) ? { ...p, comments: updatedComments, commentsCount: updatedComments.length } : p));
                  }
                }}
              >
                <Text style={[styles.commentPostBtn, !commentText.trim() && { opacity: 0.5 }]}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Instagram HiFi Share Sheet Modal */}
      <Modal visible={activeModal === 'share'} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={isWeb ? styles.webModalOverlay : styles.modalOverlay}>
          <View style={[isWeb ? styles.webModalContainer : styles.bottomSheet, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
            
            {/* 1. Top Search Bar & Add Group Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#262626' : '#F1F5F9', borderRadius: 22, paddingHorizontal: 14, height: 44 }}>
                <Ionicons name="search-outline" size={18} color={isDarkMode ? '#A8A8A8' : '#64748B'} style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 14, color: theme.text }}
                  placeholder="Search"
                  placeholderTextColor={isDarkMode ? '#A8A8A8' : '#94A3B8'}
                  value={shareSearchText}
                  onChangeText={setShareSearchText}
                />
                {shareSearchText.length > 0 && (
                  <TouchableOpacity onPress={() => setShareSearchText('')}>
                    <Ionicons name="close-circle" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDarkMode ? '#262626' : '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="person-add-outline" size={20} color={theme.text} />
              </TouchableOpacity>

              <TouchableOpacity onPress={closeModal} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* 2. Grid of Followers & Network Contacts (3 Columns Instagram Style) */}
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                {combinedShareContacts.filter(u => !shareSearchText || (u.name || '').toLowerCase().includes(shareSearchText.toLowerCase())).length === 0 ? (
                  <View style={{ width: '100%', paddingVertical: 36, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="people-outline" size={36} color={isDarkMode ? '#A8A8A8' : '#64748B'} />
                    <Text style={{ marginTop: 8, fontSize: 13, color: theme.textMuted }}>No followers found in your network</Text>
                  </View>
                ) : (
                  combinedShareContacts
                    .filter(u => !shareSearchText || (u.name || '').toLowerCase().includes(shareSearchText.toLowerCase()))
                    .map((item, index) => {
                      const itemId = item._id || item.id || index.toString();
                      const isSent = Boolean(sentShareMap[itemId]);
                      const avatarUrl = item.profilePicture || item.avatar_url ? getImageUrl(item.profilePicture || item.avatar_url) : null;
                      const initials = getInitials(item.name);

                      return (
                        <TouchableOpacity
                          key={itemId}
                          activeOpacity={0.7}
                          onPress={() => handleShareToFollower(item)}
                          style={{ width: '33.33%', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 }}
                        >
                          <View style={{ position: 'relative' }}>
                            {avatarUrl ? (
                              <Image source={{ uri: avatarUrl }} style={{ width: 66, height: 66, borderRadius: 33, borderWidth: isSent ? 2.5 : 0, borderColor: '#22C55E' }} />
                            ) : (
                              <View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: isSent ? '#22C55E' : '#003366', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 18 }}>{initials}</Text>
                              </View>
                            )}
                            {isSent && (
                              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#22C55E', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.cardBackground }}>
                                <Ionicons name="checkmark" size={13} color="#FFF" />
                              </View>
                            )}
                          </View>
                          <Text style={{ marginTop: 6, fontSize: 12, fontWeight: '500', color: theme.text, textAlign: 'center' }} numberOfLines={1}>
                            {item.name || 'Follower'}
                          </Text>
                          {isSent && (
                            <Text style={{ fontSize: 10, color: '#22C55E', fontWeight: '700', marginTop: 1 }}>Sent</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })
                )}
              </View>
            </ScrollView>

            {/* 3. Horizontal Bottom Action Row (Instagram Style Circular Action Buttons) */}
            <View style={{ borderTopWidth: 0.5, borderTopColor: isDarkMode ? '#262626' : '#E2E8F0', paddingTop: 14, marginTop: 10 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 4 }}>
                
                {/* Add to story */}
                <TouchableOpacity style={{ alignItems: 'center', width: 66 }} onPress={() => handleAddToStory(selectedPost)}>
                  <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: isDarkMode ? '#262626' : '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="add-circle-outline" size={26} color={theme.text} />
                  </View>
                  <Text style={{ fontSize: 11, color: theme.text, marginTop: 6, textAlign: 'center' }} numberOfLines={1}>Add to story</Text>
                </TouchableOpacity>

                {/* WhatsApp */}
                <TouchableOpacity style={{ alignItems: 'center', width: 66 }} onPress={() => handleWhatsAppShare(selectedPost)}>
                  <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="logo-whatsapp" size={26} color="#FFF" />
                  </View>
                  <Text style={{ fontSize: 11, color: theme.text, marginTop: 6, textAlign: 'center' }} numberOfLines={1}>WhatsApp</Text>
                </TouchableOpacity>

                {/* WhatsApp Status */}
                <TouchableOpacity style={{ alignItems: 'center', width: 66 }} onPress={() => handleWhatsAppShare(selectedPost)}>
                  <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="aperture-outline" size={26} color="#FFF" />
                  </View>
                  <Text style={{ fontSize: 11, color: theme.text, marginTop: 6, textAlign: 'center' }} numberOfLines={1}>WhatsApp Status</Text>
                </TouchableOpacity>

                {/* Share to... */}
                <TouchableOpacity style={{ alignItems: 'center', width: 66 }} onPress={() => handleNativeShare(selectedPost)}>
                  <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: isDarkMode ? '#262626' : '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="share-outline" size={24} color={theme.text} />
                  </View>
                  <Text style={{ fontSize: 11, color: theme.text, marginTop: 6, textAlign: 'center' }} numberOfLines={1}>Share to...</Text>
                </TouchableOpacity>

                {/* Copy Link */}
                <TouchableOpacity style={{ alignItems: 'center', width: 66 }} onPress={() => handleCopyToClipboard(selectedPost)}>
                  <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: isDarkMode ? '#262626' : '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="link-outline" size={24} color={theme.text} />
                  </View>
                  <Text style={{ fontSize: 11, color: theme.text, marginTop: 6, textAlign: 'center' }} numberOfLines={1}>Copy link</Text>
                </TouchableOpacity>

              </ScrollView>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={activeModal === 'reshare'} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={isWeb ? styles.webModalOverlay : styles.modalOverlay}>
          <View style={isWeb ? styles.webModalContainer : styles.bottomSheet}>
            {/* Instagram-style Reshare Header */}
            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="repeat" size={20} color="#6366F1" />
                <Text style={styles.sheetTitle}>Repost</Text>
              </View>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
            </View>

            {selectedPost ? (
              <View style={{ padding: 16 }}>

                {/* ── Your caption input (top, like Instagram) ── */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF' }}>{getInitials(userName)}</Text>
                  </View>
                  <TextInput
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: theme.text,
                      minHeight: 60,
                      textAlignVertical: 'top',
                    }}
                    placeholder="Add a note..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    value={reshareNote}
                    onChangeText={setReshareNote}
                  />
                </View>

                {/* ── Embedded Original Post Card (Instagram style) ── */}
                <View style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: theme.border,
                  overflow: 'hidden',
                  backgroundColor: theme.background,
                  marginBottom: 20,
                }}>
                  {/* Original author row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFF' }}>
                        {getInitials(selectedPost.user?.name || selectedPost.user)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>
                        {selectedPost.user?.name || selectedPost.user || 'Alumni'}
                      </Text>
                      <Text style={{ fontSize: 11, color: theme.textSecondary }}>{selectedPost.role || 'Alumni Member'}</Text>
                    </View>
                  </View>

                  {/* Original post image */}
                  {selectedPost.image ? (
                    <Image
                      source={{ uri: selectedPost.image }}
                      style={{ width: '100%', height: 200 }}
                      resizeMode="cover"
                    />
                  ) : null}

                  {/* Original post caption */}
                  {selectedPost.content ? (
                    <Text style={{ fontSize: 13, color: theme.text, paddingHorizontal: 12, paddingVertical: 8 }} numberOfLines={3}>
                      {selectedPost.content}
                    </Text>
                  ) : null}

                  {/* Original post likes count (small row) */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 8, gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="heart" size={14} color="#FF3040" />
                      <Text style={{ fontSize: 12, color: theme.textSecondary }}>{selectedPost.likes || 0}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="chatbubble-outline" size={13} color={theme.textSecondary} />
                      <Text style={{ fontSize: 12, color: theme.textSecondary }}>{selectedPost.commentsCount || 0}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.textMuted, marginLeft: 'auto' }}>{selectedPost.time}</Text>
                  </View>
                </View>

                {/* ── Repost Button ── */}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#6366F1',
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: resharingLoading ? 0.7 : 1
                  }}
                  disabled={resharingLoading}
                  onPress={async () => {
                    if (!selectedPost) return;
                    setResharingLoading(true);
                    try {
                      const targetId = selectedPost.id || selectedPost._id;
                      await resharePost(targetId, reshareNote);
                      setReshareNote('');
                      closeModal();
                      // Optimistically add reshared post to feed
                      const resharedItem = {
                        id: `reshare-${targetId}-${Date.now()}`,
                        user: userName || 'You',
                        authorId: currentUser?._id || currentUser?.id,
                        role: (currentUser?.department || currentUser?.branch || 'Alumni') + (currentUser?.batchYear ? ` • Batch ${currentUser.batchYear}` : ''),
                        avatar: getInitials(userName),
                        isAvatarUrl: false,
                        content: reshareNote || '',
                        image: null,
                        likes: 0,
                        comments: [],
                        commentsCount: 0,
                        resharesCount: 0,
                        time: 'Just now',
                        isReshare: true,
                        originalAuthorName: selectedPost.user?.name || selectedPost.user || 'Alumni',
                        originalPost: {
                          user: selectedPost.user?.name || selectedPost.user || 'Alumni',
                          role: selectedPost.role || 'Alumni Member',
                          content: selectedPost.content,
                          image: selectedPost.image,
                          likes: selectedPost.likes,
                          commentsCount: selectedPost.commentsCount,
                          time: selectedPost.time,
                        }
                      };
                      setPosts(prev => [resharedItem, ...prev]);
                      // Also refresh from API
                      const freshPosts = await getPosts();
                      if (freshPosts && Array.isArray(freshPosts) && freshPosts.length > 0) {
                        setPosts(freshPosts.map(p => ({
                          id: p._id,
                          _id: p._id,
                          user: p.user?.name || 'Alumni',
                          avatar: getInitials(p.user?.name),
                          role: `${p.user?.branch || p.user?.department || 'Alumni'} ${p.user?.batchYear ? '• Batch ' + p.user.batchYear : ''}`,
                          time: getTimeAgo(p.createdAt),
                          content: p.content,
                          image: getImageUrl(p.image),
                          likes: p.likes ? p.likes.length : 0,
                          commentsCount: p.comments ? p.comments.length : 0,
                          comments: p.comments || [],
                          resharesCount: p.reshares ? p.reshares.length : 0,
                          authorId: p.user?._id,
                          isReshare: Boolean(p.originalPost || p.isReshare),
                          originalAuthorName: p.originalPost?.user?.name || p.originalAuthorName || '',
                          originalPost: p.originalPost ? {
                            user: p.originalPost?.user?.name || '',
                            role: p.originalPost?.user?.department || '',
                            content: p.originalPost?.content || '',
                            image: p.originalPost?.image || '',
                          } : null,
                        })));
                      }
                    } catch (err) {
                      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to repost');
                    } finally {
                      setResharingLoading(false);
                    }
                  }}
                >
                  <Ionicons name="repeat" size={18} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                    {resharingLoading ? 'Reposting...' : 'Repost'}
                  </Text>
                </TouchableOpacity>

                {/* Remove repost option if already reshared */}
                <TouchableOpacity
                  style={{ alignItems: 'center', marginTop: 12, paddingVertical: 8 }}
                  onPress={closeModal}
                >
                  <Text style={{ color: theme.textMuted, fontSize: 13 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
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
                {unfollowTarget?.avatar || (getInitials(unfollowTarget?.name))}
              </Text>
            </View>

            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text || '#0F172A', textAlign: 'center', marginBottom: 6 }}>
              Unfollow @{unfollowTarget?.name}?
            </Text>

            <Text style={{ fontSize: 13, color: theme.textMuted || '#64748B', textAlign: 'center', marginBottom: 22, lineHeight: 18 }}>
              Their posts will no longer appear in your main feed.
            </Text>

            {/* Unfollow Action Button (Red) */}
            <TouchableOpacity
              style={{ width: '100%', backgroundColor: '#EF4444', paddingVertical: 13, borderRadius: 12, alignItems: 'center', marginBottom: 10 }}
              onPress={async () => {
                if (unfollowTarget?.onConfirm) {
                  await unfollowTarget.onConfirm();
                }
                setUnfollowTarget(null);
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Unfollow</Text>
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

    </SafeAreaView>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  /* ── Container ──────────────────────────────────────── */
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  /* ── Header ─────────────────────────────────────────── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: theme.card,
    borderBottomWidth: 1.5,
    borderBottomColor: theme.cardBorder || theme.border,
    shadowColor: theme.cardShadow || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: theme.cardBorder || theme.border,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceDepressed || theme.inputBackground,
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 40,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
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
    gap: 8,
  },
  headerIconBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.danger,
    borderWidth: 1.5,
    borderColor: theme.card,
  },

  /* ── Executive Welcome Banner & Pulse Dashboard ─────── */
  welcomeBanner: {
    backgroundColor: isDarkMode ? '#131C2E' : '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 14,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
    shadowColor: '#002B5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.25 : 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  welcomeInstitutionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
    marginBottom: 6,
  },
  welcomeInstitutionText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#002B5C',
    letterSpacing: 0.5,
  },
  welcomeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
  pulseGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  pulseTile: {
    flex: 1,
    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
  },
  pulseIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  pulseLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: theme.text,
    textAlign: 'center',
  },
  pulseSub: {
    fontSize: 9.5,
    color: theme.textSecondary,
    marginTop: 1,
    textAlign: 'center',
  },

  /* ── Alumni Radar & Spotlights ───────────────────────── */
  spotlightsSection: {
    marginBottom: 16,
  },
  spotlightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  spotlightHeaderBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#002B5C',
  },
  spotlightsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: 0.2,
  },
  spotlightsSeeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
  },
  spotlightsScroll: {
    paddingHorizontal: 14,
    gap: 12,
  },
  spotlightCard: {
    width: 250,
    backgroundColor: isDarkMode ? '#131C2E' : '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: isDarkMode ? 0.2 : 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  spotlightTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  spotlightTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  spotlightTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  spotlightIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotlightTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 2,
  },
  spotlightSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 6,
  },
  spotlightDesc: {
    fontSize: 11,
    color: theme.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  spotlightActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 'auto',
  },
  spotlightActionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: theme.primary,
  },

  /* ── Alumni Composer ─────────────────────────────────── */
  composerCard: {
    backgroundColor: isDarkMode ? '#131C2E' : '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.2 : 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  composerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  composerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#002B5C',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  composerAvatarInitials: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  composerPromptBox: {
    flex: 1,
    backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
  },
  composerPromptText: {
    fontSize: 12.5,
    color: theme.textMuted,
  },
  composerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#1E293B' : '#F1F5F9',
    paddingTop: 8,
  },
  composerActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  composerActionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: theme.textSecondary,
  },

  /* ── Segmented Feed Filter Pills ─────────────────────── */
  feedFilterBar: {
    marginBottom: 14,
    paddingHorizontal: 14,
  },
  feedFilterScroll: {
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
    borderWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#002B5C',
    borderColor: '#002B5C',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterCountBadge: {
    backgroundColor: isDarkMode ? '#334155' : '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  filterCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.textSecondary,
  },
  filterCountTextActive: {
    color: '#FFFFFF',
  },

  /* ── Empty Feed State ────────────────────────────────── */
  emptyFeedBox: {
    backgroundColor: isDarkMode ? '#131C2E' : '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    marginHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyFeedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyFeedDesc: {
    fontSize: 12.5,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 320,
  },
  emptyFeedCta: {
    backgroundColor: '#002B5C',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  emptyFeedCtaText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* ── Academic & Professional Post Card ───────────────── */
  postCard: {
    backgroundColor: isDarkMode ? '#131C2E' : '#FFFFFF',
    marginHorizontal: 14,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.25 : 0.07,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  resharedHeaderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 6,
  },
  resharedIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resharedText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  postUserAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#002B5C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  postUserInfo: {
    flex: 1,
    marginRight: 8,
  },
  postUserName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: theme.text,
  },
  postUserRole: {
    fontSize: 11.5,
    color: theme.textSecondary,
    marginTop: 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  followBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF',
  },
  followBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#CBD5E1',
  },
  followingBtnText: {
    color: theme.textSecondary,
  },
  postBodyContainer: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  postContentText: {
    fontSize: 13.5,
    color: theme.text,
    lineHeight: 20,
  },
  embeddedReshareCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
    overflow: 'hidden',
  },
  embeddedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0',
  },
  embeddedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#002B5C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  embeddedImage: {
    width: '100%',
    height: 200,
    backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9',
  },
  embeddedContent: {
    fontSize: 12.5,
    color: theme.text,
    padding: 10,
    lineHeight: 18,
  },
  postImageWrapper: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  postImage: {
    backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9',
  },
  doubleTapHeartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 10,
  },
  alumniActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#1E293B' : '#F1F5F9',
  },
  alumniActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  alumniActionBtnLiked: {
    backgroundColor: isDarkMode ? 'rgba(244, 63, 94, 0.16)' : '#FFE4E6',
  },
  alumniActionBtnSaved: {
    backgroundColor: isDarkMode ? 'rgba(2, 132, 199, 0.16)' : '#E0F2FE',
  },
  alumniActionLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: theme.text,
  },
  postFooterBar: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewCommentsLink: {
    fontSize: 11.5,
    color: theme.primary,
    fontWeight: '600',
  },
  postTimestampText: {
    fontSize: 11,
    color: theme.textMuted,
  },

  /* ── Section (Suggestions / Events) ─────────────────── */
  sectionContainer: {
    backgroundColor: theme.card,
    paddingVertical: 16,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },

  /* ── Suggestions ────────────────────────────────────── */
  suggestionsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  suggestionCard: {
    width: 110,
    backgroundColor: theme.card,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  suggestionAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  suggestionAvatarText: {
    color: theme.card,
    fontSize: 16,
    fontWeight: '700',
  },
  suggestionName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  suggestionFollowBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 8,
  },
  suggestionFollowBtnActive: {
    backgroundColor: theme.border,
  },
  suggestionFollowText: {
    color: theme.card,
    fontSize: 12,
    fontWeight: '700',
  },
  suggestionFollowTextActive: {
    color: theme.textSecondary,
  },

  /* ── 2-Column Desktop Layout ─────────────────────────── */
  desktopContainer: {
    flex: 1,
    padding: 24,
    flexDirection: 'row',
    gap: 24,
  },
  desktopMainColumn: {
    flex: 6.8,
  },
  desktopSidebarColumn: {
    flex: 3.2,
  },
  sidebarCard: {
    backgroundColor: isDarkMode ? '#131C2E' : '#FFFFFF',
    borderRadius: 16,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
    marginBottom: 18,
    overflow: 'hidden',
  },
  sidebarCardPadded: {
    backgroundColor: isDarkMode ? '#131C2E' : '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
    marginBottom: 18,
  },
  sidebarCoverBanner: {
    height: 70,
    backgroundColor: '#002B5C',
    position: 'relative',
  },
  sidebarCoverDecor1: {
    position: 'absolute',
    right: -20,
    top: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sidebarCoverDecor2: {
    position: 'absolute',
    left: 20,
    bottom: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(251,191,36,0.15)',
  },
  sidebarProfileBody: {
    alignItems: 'center',
    marginTop: -35,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sidebarAvatarWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#002B5C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: isDarkMode ? '#131C2E' : '#FFFFFF',
    overflow: 'hidden',
  },
  sidebarDivider: {
    width: '100%',
    height: 1,
    backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0',
    marginVertical: 12,
  },
  sidebarStatPod: {
    flex: 1,
    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
  },
  sidebarViewProfileBtn: {
    width: '100%',
    marginTop: 12,
    backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#BFDBFE',
  },
  sidebarPillTag: {
    backgroundColor: isDarkMode ? '#1E293B' : '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#BAE6FD',
  },
  sidebarHubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    gap: 10,
    marginBottom: 4,
  },
  sidebarHubIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarDirectoryBtn: {
    backgroundColor: '#002B5C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sidebarCampusLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    gap: 10,
    marginBottom: 4,
  },
  sidebarCampusIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Mobile Campus Services ──────────────────────────── */
  mobileCampusServices: {
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 30,
    backgroundColor: isDarkMode ? '#131C2E' : '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  mobileServiceCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileServiceIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Modals ──────────────────────────────────────────── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '60%',
    paddingBottom: 20,
  },
  bottomSheetMini: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 30,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  commentRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.background,
  },
  commentUser: {
    fontWeight: '700',
    fontSize: 13,
    color: theme.text,
    marginRight: 8,
  },
  commentText: {
    flex: 1,
    fontSize: 13,
    color: theme.text,
  },
  commentTime: {
    fontSize: 11,
    color: theme.textMuted,
    marginLeft: 8,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  commentInput: {
    flex: 1,
    backgroundColor: theme.inputBackground,
    color: theme.text,
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
    fontSize: 14,
  },
  commentPostBtn: {
    color: theme.primary,
    fontWeight: '700',
    marginLeft: 12,
  },
  sheetActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sheetActionText: {
    fontSize: 16,
    marginLeft: 12,
    color: theme.text,
  },
  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  shareUserAvatar: {
    alignItems: 'center',
    width: 60,
  },
  shareAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  shareAvatarText: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 16,
  },
  shareUserName: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
  },
  systemShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  systemShareText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  webModalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
  webModalContainer: { width: 500, backgroundColor: theme.card, borderRadius: 16, paddingBottom: 16, maxHeight: '80%', overflow: 'hidden' },
});

export default DashboardScreen;
