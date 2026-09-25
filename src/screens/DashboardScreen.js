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
  FlatList,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
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
  const styles = getStyles(theme);
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
    return (
      <View key={post.id} style={styles.postCard}>
        {/* Reshared Top Header Tag (Instagram / Threads style) */}
        {isReshared && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 2 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
              <Ionicons name="repeat" size={13} color="#6366F1" />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary || '#64748B' }}>
              <Text style={{ fontWeight: '700', color: theme.text }}>{post.user}</Text> reposted
            </Text>
          </View>
        )}

        {/* Post header */}
        <View style={styles.postHeader}>
          <View style={{ position: 'relative' }}>
            <View style={styles.postUserAvatar}>
              {post.isAvatarUrl ? (
                <Image source={{ uri: post.avatar }} style={{ width: '100%', height: '100%', borderRadius: 20 }} />
              ) : (
                <Text style={styles.avatarText}>{post.avatar}</Text>
              )}
            </View>
          </View>
          <View style={styles.postUserInfo}>
            <Text style={styles.postUserName}>{post.user}</Text>
            <Text style={styles.postUserRole}>{post.role}</Text>
          </View>
          {/* Follow button logic */}
          {(() => {
            const isOwnPost = (post.authorId && (post.authorId === currentUser?._id || post.authorId === currentUser?.id)) ||
              (post.user && currentUser?.name && (
                post.user.toLowerCase().includes(currentUser.name.toLowerCase()) ||
                currentUser.name.toLowerCase().includes(post.user.toLowerCase())
              ));

            const isFollowing = Boolean(
              (post.authorId && followingMap[post.authorId]) ||
              (post.user && followingMap[post.user.toLowerCase()])
            );

            if (isOwnPost) return null; // Don't show follow button on own posts

            return (
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  isFollowing && { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border || '#CBD5E1' }
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
                <Text style={[styles.followBtnText, isFollowing && { color: theme.textSecondary || '#64748B' }]}>
                  {isFollowing ? 'Following' : '+ Follow'}
                </Text>
              </TouchableOpacity>
            );
          })()}
        </View>

        {/* Reposter Note / Caption (if present) */}
        {isReshared && post.content && !post.content.startsWith('Reshared:') && !post.content.startsWith('Reshared post') ? (
          <Text style={[styles.postContent, { marginTop: 4, marginBottom: 10, paddingHorizontal: 2, fontSize: 14, lineHeight: 20 }]}>
            {post.content}
          </Text>
        ) : null}

        {/* ─── Embedded Original Post Card for Reshares ─── */}
        {isReshared && (
          <View style={{
            marginHorizontal: 2,
            marginBottom: 12,
            marginTop: 4,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: isDarkMode ? '#334155' : '#E2E8F0',
            backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1
          }}>
            {/* Original author header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0' }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', marginRight: 10, overflow: 'hidden' }}>
                {post.originalPost?.isAvatarUrl ? (
                  <Image source={{ uri: post.originalPost.avatar }} style={{ width: 34, height: 34, borderRadius: 17 }} />
                ) : (
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF' }}>
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

            {/* Original post image */}
            {post.originalPost?.image ? (
              <Image 
                source={{ uri: post.originalPost.image }} 
                style={{ width: '100%', height: 220, backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9' }} 
                resizeMode="cover" 
              />
            ) : null}

            {/* Original post text */}
            {post.originalPost?.content ? (
              <Text style={{ fontSize: 13, color: theme.text, padding: 12, lineHeight: 18 }} numberOfLines={4}>
                {post.originalPost.content}
              </Text>
            ) : (
              (!post.originalPost?.image && post.content) ? (
                <Text style={{ fontSize: 13, color: theme.text, padding: 12, lineHeight: 18 }} numberOfLines={4}>
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
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            <Image source={{ uri: post.image }} style={[styles.postImage, { width: '100%', height: contentWidth * 0.65 }]} />
            {doubleTapHeart[post.id] && (
              <View style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.2)',
                zIndex: 10
              }}>
                <Ionicons name="heart" size={96} color="#FF3040" style={{
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

        {/* Action row - 3D Tactile Buttons */}
        <View style={styles.postActions}>
          <View style={styles.leftActions}>
            <TouchableOpacity 
              style={[
                styles.actionBtn, 
                likedPosts[post.id] && { backgroundColor: isDarkMode ? 'rgba(244, 63, 94, 0.16)' : '#FFE4E6' }
              ]} 
              onPress={() => toggleLike(post.id)} 
              activeOpacity={0.6}
            >
              <Ionicons
                name={likedPosts[post.id] ? 'heart' : 'heart-outline'}
                size={20}
                color={likedPosts[post.id] ? '#F43F5E' : theme.text}
              />
              <Text style={{ fontSize: 12, fontWeight: '700', color: likedPosts[post.id] ? '#F43F5E' : theme.text }}>
                {post.likes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6} onPress={() => openModal('comments', post)}>
              <Ionicons name="chatbubble-outline" size={19} color={theme.text} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>
                {post.commentsCount || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6} onPress={() => openModal('reshare', post)}>
              <Ionicons name="repeat-outline" size={20} color={isReshared ? '#6366F1' : theme.text} />
              {post.resharesCount > 0 && (
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>{post.resharesCount}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => openModal('share', post)}
              activeOpacity={0.6}
            >
              <Ionicons name="paper-plane-outline" size={19} color={theme.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.actionBtn, bookmarkedPosts[post.id] && { backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.16)' : '#E0EEFF' }]} 
            onPress={() => toggleBookmark(post.id)} 
            activeOpacity={0.6}
          >
            <Ionicons
              name={bookmarkedPosts[post.id] ? 'bookmark' : 'bookmark-outline'}
              size={19}
              color={bookmarkedPosts[post.id] ? theme.primary : theme.text}
            />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.postFooter}>
          <Text style={styles.likesText}>
            {post.likes} {post.likes === 1 ? 'like' : 'likes'}
          </Text>
          {!isReshared && post.content ? (
            <Text style={styles.postContent} numberOfLines={3}>
              {post.content}
            </Text>
          ) : null}
          {post.commentsCount > 0 && (
            <TouchableOpacity style={styles.commentBtn} onPress={() => openModal('comments', post)}>
              <Text style={styles.viewCommentsText}>
                View all {post.commentsCount} comments
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.timeText}>{post.time}</Text>
        </View>
      </View>
    );
  };

  // ─── Render ────────────────────────────────────────────
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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
            {isDesktop ? (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 20,
                  gap: 6,
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#4F46E5' : '#C7D2FE',
                  marginRight: 4,
                }}
                onPress={() => navigation.navigate('ResumeBook')}
                activeOpacity={0.8}
                title="Resume Book"
              >
                <Ionicons name="document-text" size={16} color={isDarkMode ? '#818CF8' : '#4F46E5'} />
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: isDarkMode ? '#818CF8' : '#4F46E5' }}>
                  Resume Book
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => navigation.navigate('ResumeBook')}
                title="Resume Book"
              >
                <Ionicons name="document-text-outline" size={22} color={theme.primary} />
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
          // WEB GRID DASHBOARD (3-Column Layout)
          <View style={{ flex: 1, padding: 24, flexDirection: 'row', gap: 24 }}>
            
            {/* 1. Left Column: Profile Card & Alumni Hub */}
            <View style={{ flex: 3 }}>
              {/* Profile Card with Cover Banner */}
              <View style={{ backgroundColor: theme.card, borderRadius: 16, elevation: 3, borderWidth: 1, borderColor: theme.border, marginBottom: 18, overflow: 'hidden' }}>
                {/* Cover Banner */}
                <View style={{ height: 75, backgroundColor: '#002B5C', position: 'relative' }}>
                  <View style={{ position: 'absolute', right: -20, top: -30, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                  <View style={{ position: 'absolute', left: 24, bottom: -12, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(251,191,36,0.18)' }} />
                </View>

                {/* Overlapping Avatar & Info */}
                <View style={{ alignItems: 'center', marginTop: -38, paddingHorizontal: 16, paddingBottom: 18 }}>
                  <TouchableOpacity 
                    style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', borderWidth: 3.5, borderColor: theme.card, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, overflow: 'hidden' }}
                    onPress={() => navigation.navigate('Profile')}
                    activeOpacity={0.8}
                  >
                    {userAvatarUrl ? (
                      <Image source={{ uri: userAvatarUrl }} style={{ width: 76, height: 76, borderRadius: 38 }} />
                    ) : (
                      <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF' }}>{getInitials(userName || currentUser?.name || currentUser?.email || 'User')}</Text>
                    )}
                  </TouchableOpacity>

                  {/* Name with Verified Badge */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 5 }}>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text }}>{userName || 'Alumni Member'}</Text>
                    <Ionicons name="checkmark-circle" size={17} color="#0284C7" />
                  </View>

                  <Text style={{ fontSize: 12.5, color: theme.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
                    {currentUser?.designation || 'Alumni Member'}
                    {currentUser?.company ? ` @ ${currentUser.company}` : (currentUser?.institution ? `\n@ ${currentUser.institution}` : '')}
                  </Text>

                  <View style={{ width: '100%', height: 1, backgroundColor: theme.border, marginVertical: 14 }} />

                  {/* Dual Stat Pod */}
                  <View style={{ width: '100%', flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}
                      onPress={() => navigation.navigate('Profile')}
                    >
                      <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 16 }}>{connectionsCount}</Text>
                      <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 11, marginTop: 2 }}>Connections</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}
                      onPress={() => navigation.navigate('Main', { screen: 'Post', params: { view: 'events' } })}
                    >
                      <Text style={{ color: '#D97706', fontWeight: '800', fontSize: 16 }}>{myEventsCount}</Text>
                      <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 11, marginTop: 2 }}>Events</Text>
                    </TouchableOpacity>
                  </View>

                  {/* View Profile Action */}
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Profile')}
                    style={{ width: '100%', marginTop: 14, backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF', borderRadius: 10, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#BFDBFE' }}
                  >
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: theme.primary }}>View Full Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Alumni Hub Quick Navigation - Community & Network Centric */}
              <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 16, elevation: 2, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <View style={{ width: 6, height: 16, borderRadius: 3, backgroundColor: '#0284C7' }} />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text, letterSpacing: 0.3 }}>
                      Alumni Hub
                    </Text>
                  </View>
                  <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F0F9FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#BAE6FD' }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#0284C7' }}>COMMUNITY</Text>
                  </View>
                </View>
                
                {/* 1. Mentorship Connect */}
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, gap: 10, marginBottom: 4 }}
                  onPress={() => navigation.navigate('Main', { screen: 'Engage', params: { tab: 'directory' } })}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF', justifyContent: 'center', alignItems: 'center' }}>
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
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, gap: 10, marginBottom: 4 }}
                  onPress={() => navigation.navigate('Main', { screen: 'Engage', params: { tab: 'communities' } })}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDarkMode ? '#082F49' : '#E0F2FE', justifyContent: 'center', alignItems: 'center' }}>
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
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, gap: 10, marginBottom: 4 }}
                  onPress={() => navigation.navigate('Main', { screen: 'Engage', params: { tab: 'directory' } })}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDarkMode ? '#451A03' : '#FEF3C7', justifyContent: 'center', alignItems: 'center' }}>
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

                {/* 4. Founder & Career Referrals */}
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, gap: 10, marginBottom: 4 }}
                  onPress={() => navigation.navigate('Main', { screen: 'Jobs' })}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5', justifyContent: 'center', alignItems: 'center' }}>
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

                {/* 5. Resume Book (Talent Pool) */}
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, gap: 10 }}
                  onPress={() => navigation.navigate('ResumeBook')}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDarkMode ? '#1E1B4B' : '#EDE9FE', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="document-text" size={17} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>Resume Book</Text>
                      <View style={{ backgroundColor: '#EDE9FE', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 }}>
                        <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#6D28D9' }}>TALENT POOL</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>Browse alumni candidate resumes</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Middle Column: Main Feed & Composer */}
            <View style={{ flex: 6 }}>
              {/* Modern Post Composer */}
              <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 16, elevation: 2, borderWidth: 1, borderColor: theme.border, marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <TouchableOpacity 
                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}
                    onPress={() => navigation.navigate('Profile')}
                    activeOpacity={0.8}
                  >
                    {userAvatarUrl ? (
                      <Image source={{ uri: userAvatarUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                    ) : (
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>{getInitials(userName || currentUser?.name || currentUser?.email || 'User')}</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={{ flex: 1, backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: theme.border }}
                    onPress={() => navigation.navigate('PostCreation')}
                  >
                    <Text style={{ color: theme.textMuted, fontSize: 13.5 }}>Start a post or share an update with alumni...</Text>
                  </TouchableOpacity>
                </View>

                {/* 4 Interactive Media Pills */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10 }}>
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 }}
                    onPress={() => navigation.navigate('PostCreation')}
                  >
                    <Ionicons name="image" size={18} color="#2563EB" />
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: theme.textSecondary }}>Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 }}
                    onPress={() => navigation.navigate('PostCreation')}
                  >
                    <Ionicons name="videocam" size={18} color="#16A34A" />
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: theme.textSecondary }}>Video</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 }}
                    onPress={() => navigation.navigate('Main', { screen: 'Post', params: { view: 'events' } })}
                  >
                    <Ionicons name="calendar" size={18} color="#D97706" />
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: theme.textSecondary }}>Event</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 }}
                    onPress={() => navigation.navigate('PostCreation')}
                  >
                    <Ionicons name="newspaper" size={18} color="#9333EA" />
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: theme.textSecondary }}>Article</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Feed Content */}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {posts.length > 0 ? (
                  posts.map(post => renderPostCard(post))
                ) : (
                  <View>
                    {/* Welcome Hero Banner */}
                    <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#BFDBFE', marginBottom: 18 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Ionicons name="sparkles" size={20} color="#003366" />
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#003366' }}>
                          Welcome to the Alumni Feed, {userName?.split(' ')[0] || 'Member'}! 👋
                        </Text>
                      </View>
                      <Text style={{ fontSize: 13, color: '#334155', lineHeight: 20, marginBottom: 14 }}>
                        Connect with fellow graduates, celebrate batch achievements, and stay updated on reunions and exclusive alumni hiring opportunities.
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity 
                          style={{ backgroundColor: '#003366', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
                          onPress={() => navigation.navigate('Engage', { tab: 'directory' })}
                        >
                          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12.5 }}>Find Batchmates</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={{ backgroundColor: theme.card, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}
                          onPress={() => navigation.navigate('PostCreation')}
                        >
                          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 12.5 }}>Share First Post</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>

            {/* 3. Right Column: Suggestions & Institutional Resources */}
            <View style={{ flex: 3.5, paddingLeft: 4 }}>
              {/* Suggestions / Network Box */}
              <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 18, elevation: 2, borderWidth: 1, borderColor: theme.border, marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>Suggested for you</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Engage', { tab: 'directory' })} activeOpacity={0.7}>
                    <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '700' }}>See all</Text>
                  </TouchableOpacity>
                </View>

                {/* Suggestions List (Only Real Data) */}
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
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                      <Ionicons name="people-outline" size={24} color="#003366" />
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, textAlign: 'center', marginBottom: 4 }}>Expand Your Network</Text>
                    <Text style={{ fontSize: 11.5, color: theme.textSecondary, textAlign: 'center', lineHeight: 17, marginBottom: 14 }}>
                      Find and connect with alumni from your department, batch, and chapters worldwide.
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Engage', { tab: 'directory' })}
                      style={{ backgroundColor: '#002B5C', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="search" size={13} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Explore Directory</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Campus Quick Links - Official RVCE Institutional & Academic Services */}
              <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 18, elevation: 2, borderWidth: 1, borderColor: theme.border, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <View style={{ width: 6, height: 16, borderRadius: 3, backgroundColor: '#002B5C' }} />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text, letterSpacing: 0.3 }}>
                      Campus Quick Links
                    </Text>
                  </View>
                  <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#C7D2FE' }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#002B5C' }}>RVCE SERVICES</Text>
                  </View>
                </View>

                {/* 1. Official RVCE Portal */}
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 8, borderRadius: 10, gap: 10, marginBottom: 6 }}
                  onPress={() => handleOpenExternalUrl('https://rvce.edu.in')}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="school" size={18} color="#002B5C" />
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
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 8, borderRadius: 10, gap: 10, marginBottom: 6 }}
                  onPress={() => handleOpenExternalUrl('https://rvce.edu.in/exam-section')}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDarkMode ? '#134E4A' : '#CCFBF1', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="document-text" size={18} color="#0F766E" />
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
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 8, borderRadius: 10, gap: 10, marginBottom: 6 }}
                  onPress={() => handleOpenExternalUrl('https://rvce.edu.in/rvce-centre-for-innovation')}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDarkMode ? '#7C2D12' : '#FFEDD5', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="rocket" size={18} color="#EA580C" />
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
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 8, borderRadius: 10, gap: 10 }}
                  onPress={() => handleOpenExternalUrl('https://rvce.edu.in/about-us')}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDarkMode ? '#881337' : '#FFE4E6', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="compass" size={18} color="#E11D48" />
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

              {/* Footer Links */}
              <View style={{ paddingHorizontal: 6 }}>
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
            {/* ─── 3D Stories & Alumni Highlights Carousel ─── */}
            <View style={styles.storiesContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
                {/* User Story (Add) */}
                <TouchableOpacity 
                  style={styles.storyItem}
                  onPress={() => navigation.navigate('PostCreation')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.storyRing, { borderColor: theme.primary, shadowColor: theme.primary }]}>
                    <View style={styles.storyAvatarWrap}>
                      {userAvatarUrl ? (
                        <Image source={{ uri: userAvatarUrl }} style={styles.storyAvatar} />
                      ) : (
                        <Text style={styles.storyAvatarInitials}>{getInitials(userName)}</Text>
                      )}
                    </View>
                    <View style={styles.storyAddBadge}>
                      <Ionicons name="add" size={12} color="#FFF" />
                    </View>
                  </View>
                  <Text style={styles.storyName} numberOfLines={1}>Your Story</Text>
                </TouchableOpacity>

                {/* 3D Highlight Bubbles */}
                {[
                  { id: 'h1', title: 'Campus', icon: 'school', color: '#002B5C', border: '#38BDF8' },
                  { id: 'h2', title: 'Placements', icon: 'briefcase', color: '#064E3B', border: '#10B981' },
                  { id: 'h3', title: 'Reunions', icon: 'people', color: '#4C1D95', border: '#A855F7' },
                  { id: 'h4', title: 'Mentors', icon: 'sparkles', color: '#78350F', border: '#F59E0B' },
                  { id: 'h5', title: 'Global', icon: 'globe', color: '#0369A1', border: '#0284C7' }
                ].map(h => (
                  <TouchableOpacity 
                    key={h.id} 
                    style={styles.storyItem} 
                    onPress={() => navigation.navigate('Engage')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.storyRing, { borderColor: h.border, shadowColor: h.border }]}>
                      <View style={[styles.storyAvatarWrap, { backgroundColor: h.color }]}>
                        <Ionicons name={h.icon} size={20} color="#FFFFFF" />
                      </View>
                    </View>
                    <Text style={styles.storyName} numberOfLines={1}>{h.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* ─── 3D Quick Feature Pods (Directory, Jobs, Events, Connect) ─── */}
            <View style={styles.quickPodsGrid}>
              <TouchableOpacity 
                style={[styles.quickPod, { backgroundColor: isDarkMode ? '#131C2E' : '#FFFFFF' }]} 
                onPress={() => navigation.navigate('Engage', { tab: 'directory' })}
                activeOpacity={0.75}
              >
                <View style={[styles.quickPodIconWrap, { backgroundColor: '#2563EB', shadowColor: '#2563EB' }]}>
                  <Ionicons name="people" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.quickPodTitle}>Directory</Text>
                <Text style={styles.quickPodSubtitle}>Connect</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.quickPod, { backgroundColor: isDarkMode ? '#131C2E' : '#FFFFFF' }]} 
                onPress={() => navigation.navigate('Jobs')}
                activeOpacity={0.75}
              >
                <View style={[styles.quickPodIconWrap, { backgroundColor: '#10B981', shadowColor: '#10B981' }]}>
                  <Ionicons name="briefcase" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.quickPodTitle}>Careers</Text>
                <Text style={styles.quickPodSubtitle}>Openings</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.quickPod, { backgroundColor: isDarkMode ? '#131C2E' : '#FFFFFF' }]} 
                onPress={() => navigation.navigate('Main', { screen: 'Post', params: { view: 'events' } })}
                activeOpacity={0.75}
              >
                <View style={[styles.quickPodIconWrap, { backgroundColor: '#8B5CF6', shadowColor: '#8B5CF6' }]}>
                  <Ionicons name="calendar" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.quickPodTitle}>Events</Text>
                <Text style={styles.quickPodSubtitle}>Meetups</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.quickPod, { backgroundColor: isDarkMode ? '#131C2E' : '#FFFFFF' }]} 
                onPress={() => navigation.navigate('Messages')}
                activeOpacity={0.75}
              >
                <View style={[styles.quickPodIconWrap, { backgroundColor: '#0284C7', shadowColor: '#0284C7' }]}>
                  <Ionicons name="chatbubbles" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.quickPodTitle}>Chats</Text>
                <Text style={styles.quickPodSubtitle}>Direct DM</Text>
              </TouchableOpacity>
            </View>

            {/* Mobile Create Post Box */}
            <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 14, marginHorizontal: 14, marginTop: 4, marginBottom: 14, borderWidth: 1.5, borderColor: theme.cardBorder || theme.border, shadowColor: theme.cardShadow || '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity 
                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }}
                onPress={() => navigation.navigate('Profile')}
              >
                {userAvatarUrl ? (
                  <Image source={{ uri: userAvatarUrl }} style={{ width: 38, height: 38, borderRadius: 19 }} />
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>{getInitials(userName)}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: theme.surfaceDepressed || theme.inputBackground, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: theme.border }}
                onPress={() => navigation.navigate('PostCreation')}
              >
                <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '500' }}>Start a post or share an update...</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ padding: 8, backgroundColor: theme.cardSecondary || theme.background, borderRadius: 16 }}
                onPress={() => navigation.navigate('PostCreation')}
              >
                <Ionicons name="image-outline" size={19} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {posts.length > 0 ? (
              posts.map(post => renderPostCard(post))
            ) : (
              <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 24, alignItems: 'center', margin: 16, borderWidth: 1, borderColor: theme.border }}>
                <Ionicons name="people-outline" size={44} color={theme.primary} style={{ marginBottom: 8 }} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 4, textAlign: 'center' }}>No Followed Alumni Posts Yet</Text>
                <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: 'center', marginBottom: 12 }}>Follow alumni members from &quot;People you may know&quot; or the Directory to view their posts in your feed!</Text>
                <TouchableOpacity 
                  style={{ backgroundColor: theme.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 }}
                  onPress={() => navigation.navigate('Engage', { tab: 'directory' })}
                >
                  <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 12 }}>Explore Directory</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Suggestions on Mobile */}
            {suggestions.filter(s => !followingMap[s.id]).length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Suggestions for you</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Engage', { tab: 'directory' })}><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
                  {suggestions.filter(s => !followingMap[s.id]).map((s) => (
                    <View key={s.id} style={styles.suggestionCard}>
                      <View style={styles.suggestionAvatar}>
                        {s.isAvatarUrl ? (
                          <Image source={{ uri: s.avatar }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                        ) : (
                          <Text style={styles.suggestionAvatarText}>{s.avatar}</Text>
                        )}
                      </View>
                      <Text style={styles.suggestionName} numberOfLines={1}>{s.name}</Text>
                      <Text style={styles.suggestionSubtitle} numberOfLines={1}>{s.subtitle}</Text>
                      <TouchableOpacity
                        style={[styles.suggestionFollowBtn, followingMap[s.id] && styles.suggestionFollowBtnActive]}
                        onPress={() => toggleSuggestionFollow(s.id)}
                      >
                        <Text style={[styles.suggestionFollowText, followingMap[s.id] && styles.suggestionFollowTextActive]}>
                          {followingMap[s.id] ? 'Following' : 'Follow'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Campus Quick Services on Mobile */}
            <View style={{ marginHorizontal: 16, marginTop: 14, marginBottom: 40, backgroundColor: theme.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="business" size={16} color="#002B5C" />
                  <Text style={{ fontSize: 13.5, fontWeight: '800', color: theme.text }}>Campus Quick Services</Text>
                </View>
                <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#002B5C' }}>RVCE OFFICIAL</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <TouchableOpacity 
                  style={{ flex: 1, minWidth: '45%', backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', padding: 11, borderRadius: 12, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                  onPress={() => handleOpenExternalUrl('https://rvce.edu.in')}
                  activeOpacity={0.75}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="school" size={16} color="#002B5C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>RVCE Portal</Text>
                    <Text style={{ fontSize: 10, color: theme.textMuted }}>rvce.edu.in</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{ flex: 1, minWidth: '45%', backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', padding: 11, borderRadius: 12, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                  onPress={() => handleOpenExternalUrl('https://rvce.edu.in/exam-section')}
                  activeOpacity={0.75}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#CCFBF1', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="document-text" size={16} color="#0F766E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>Transcripts</Text>
                    <Text style={{ fontSize: 10, color: theme.textMuted }}>Exam Cell</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{ flex: 1, minWidth: '45%', backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', padding: 11, borderRadius: 12, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                  onPress={() => handleOpenExternalUrl('https://rvce.edu.in/rvce-centre-for-innovation')}
                  activeOpacity={0.75}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFEDD5', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="rocket" size={16} color="#EA580C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>Incubation</Text>
                    <Text style={{ fontSize: 10, color: theme.textMuted }}>Seed Grants</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{ flex: 1, minWidth: '45%', backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', padding: 11, borderRadius: 12, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                  onPress={() => handleOpenExternalUrl('https://rvce.edu.in/about-us')}
                  activeOpacity={0.75}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFE4E6', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="compass" size={16} color="#E11D48" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>Campus Tour</Text>
                    <Text style={{ fontSize: 10, color: theme.textMuted }}>360° Heritage</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Instagram Floating Messages Pill */}
        <TouchableOpacity 
          style={{
            position: 'absolute',
            bottom: 20,
            right: 24,
            backgroundColor: isDarkMode ? '#262626' : '#FFFFFF',
            borderRadius: 24,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 8,
            borderWidth: 1,
            borderColor: isDarkMode ? '#363636' : '#E2E8F0',
            zIndex: 9999,
            gap: 8
          }}
          onPress={() => navigation.navigate('Messages')}
          activeOpacity={0.85}
        >
          <Ionicons name="paper-plane-outline" size={20} color={theme.text} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>Messages</Text>
          <View style={{ flexDirection: 'row', marginLeft: 4 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#3B82F6', borderWidth: 1.5, borderColor: theme.card, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: '#FFF', fontWeight: 'bold' }}>JD</Text>
            </View>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#10B981', borderWidth: 1.5, borderColor: theme.card, marginLeft: -8, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: '#FFF', fontWeight: 'bold' }}>SK</Text>
            </View>
          </View>
        </TouchableOpacity>
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

const getStyles = (theme) => StyleSheet.create({
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

  /* ── Post Card ──────────────────────────────────────── */
  postCard: {
    backgroundColor: theme.card,
    marginHorizontal: 14,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.cardBorder || theme.border,
    shadowColor: theme.cardShadow || '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postUserAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  postUserInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  postUserRole: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 1,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.primary,
  },
  postImage: {
    backgroundColor: theme.border,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: theme.surfaceDepressed || 'rgba(0, 0, 0, 0.04)',
    gap: 5,
  },

  /* ── 3D Stories Row ──────────────────────────────────── */
  storiesContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder || theme.border,
    backgroundColor: theme.card,
    marginBottom: 10,
  },
  storiesScroll: {
    paddingHorizontal: 14,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 64,
  },
  storyRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
    backgroundColor: theme.card,
  },
  storyAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
  },
  storyAvatarInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  storyAddBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyName: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.text,
    marginTop: 4,
    textAlign: 'center',
  },

  /* ── 3D Quick Feature Pods Grid ──────────────────────── */
  quickPodsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 12,
  },
  quickPod: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.cardBorder || theme.border,
    shadowColor: theme.cardShadow || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  quickPodIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 6,
  },
  quickPodTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  quickPodSubtitle: {
    fontSize: 9.5,
    fontWeight: '500',
    color: theme.textSecondary,
    marginTop: 1,
    textAlign: 'center',
  },
  postFooter: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  postContent: {
    fontSize: 13.5,
    color: theme.text,
    lineHeight: 19,
    marginTop: 4,
  },
  commentBtn: {
    marginTop: 4,
  },
  viewCommentsText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  timeText: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 6,
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

  /* ── Events & Jobs ──────────────────────────────────── */
  eventsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  eventRowCard: {
    flexDirection: 'row',
    height: 110,
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 10,
    marginRight: 4,
    position: 'relative',
  },
  eventRowImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  eventRowContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  eventRowTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: theme.text,
    paddingRight: 16,
  },
  eventRowSub: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  eventRowBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  eventRowBtnText: {
    color: theme.card,
    fontSize: 9.5,
    fontWeight: '700',
  },
  eventRowClose: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  suggestCloseBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  suggestSubText: {
    fontSize: 11,
    color: theme.textSecondary,
    marginBottom: 8,
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
