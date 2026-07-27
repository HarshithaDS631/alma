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
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getSuggestions, getPosts, getEvents, toggleFollowUser, getFollowing, getFollowers, toggleLikePost, getProfile } from '../services/authService';
import { getImageUrl } from '../services/uploadService';
import { addComment, toggleSavePost, resharePost } from '../services/postService';
import { sendMessage } from '../services/messageService';
import { fetchJobs } from '../services/jobService';
import useUserRole from '../hooks/useUserRole';

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
  const [searchText, setSearchText] = useState('');
  const [userInstitution, setUserInstitution] = useState('Our Network');
  const [userName, setUserName] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Modal States
  const [activeModal, setActiveModal] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');

  const mockComments = [];

  // Real data states
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [eventsAndJobs, setEventsAndJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const openModal = (type, post) => {
    setSelectedPost(post);
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedPost(null);
    setCommentText('');
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
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
            followersRes
          ] = await Promise.allSettled([
            getProfile().catch(() => null),
            getPosts().catch(() => []),
            getSuggestions().catch(() => []),
            getEvents().catch(() => []),
            fetchJobs().catch(() => []),
            getFollowing().catch(() => []),
            getFollowers().catch(() => []),
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

          // 2. Process posts (Real DB posts only)
          if (postsRes.status === 'fulfilled' && Array.isArray(postsRes.value) && postsRes.value.length > 0) {
            const dbFormatted = postsRes.value.map(p => ({
              id: p._id,
              user: p.user?.name || 'Alumni',
              authorId: p.user?._id || null,
              role: p.user?.department ? `${p.user.department} • Batch ${p.user.batchYear || ''}` : 'Alumni Member @ Media Cell Institution',
              avatar: p.user?.profilePicture || p.user?.avatar_url ? getImageUrl(p.user?.profilePicture || p.user?.avatar_url) : (p.user?.name ? p.user.name.substring(0, 2).toUpperCase() : 'AL'),
              isAvatarUrl: !!(p.user?.profilePicture || p.user?.avatar_url),
              content: p.content,
              image: getImageUrl(p.image),
              likes: p.likes?.length || 0,
              comments: p.comments || [],
              commentsCount: p.comments?.length || 0,
              time: getTimeAgo(p.createdAt),
            }));
            setPosts(dbFormatted);
          } else {
            setPosts([]);
          }

          // 3. Process suggestions
          if (suggestionsRes.status === 'fulfilled' && Array.isArray(suggestionsRes.value) && suggestionsRes.value.length > 0) {
            const formatted = suggestionsRes.value.map(s => ({
              id: s._id,
              name: s.name,
              avatar: s.profilePicture || s.avatar_url ? getImageUrl(s.profilePicture || s.avatar_url) : (s.name ? s.name.substring(0, 2).toUpperCase() : '??'),
              isAvatarUrl: !!(s.profilePicture || s.avatar_url),
              subtitle: s.company ? `${s.designation || ''} @ ${s.company}`.trim() : `Batch of ${s.batchYear || ''} • ${s.department || s.institution || ''}`.trim(),
            }));
            setSuggestions(formatted);
          }

          // 4. Process combined Opportunities (Real Jobs & Events only)
          let combinedOpportunities = [];
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

          // 5. Process Following & Followers connections
          const initialFollowed = {};
          let totalConn = 0;

          if (followingRes.status === 'fulfilled' && Array.isArray(followingRes.value)) {
            followingRes.value.forEach(user => {
              initialFollowed[user._id || user.id] = true;
            });
            totalConn += followingRes.value.length;
          }
          if (followersRes.status === 'fulfilled' && Array.isArray(followersRes.value)) {
            totalConn += followersRes.value.length;
          }

          setFollowingMap(initialFollowed);
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

  // Helper to format timestamps
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
    try {
      setLikedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
      await toggleLikePost(postId);
    } catch (error) {
      setLikedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
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
        const formatted = postsData.map(p => ({
          id: p._id,
          user: p.user?.name || 'Alumni',
          authorId: p.user?._id || null,
          role: p.user?.department ? `${p.user.department} • Batch ${p.user.batchYear || ''}` : 'Alumni Member',
          avatar: p.user?.name ? p.user.name.substring(0, 2).toUpperCase() : 'AL',
          content: p.content,
          image: getImageUrl(p.image),
          likes: p.likes?.length || 0,
          comments: p.comments || [],
          commentsCount: p.comments?.length || 0,
          time: getTimeAgo(p.createdAt),
        }));
        setPosts(formatted);
      }
    } catch (e) {
      console.error('Error refreshing posts feed:', e);
    }
  };

  const toggleFollow = async (authorId) => {
    if (!authorId) return;
    try {
      setFollowingMap((prev) => ({ ...prev, [authorId]: !prev[authorId] }));
      await toggleFollowUser(authorId);
      await refreshPostsFeed();
    } catch (error) {
      setFollowingMap((prev) => ({ ...prev, [authorId]: !prev[authorId] }));
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
        {/* Reshared Header Tag */}
        {isReshared && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 10, alignSelf: 'flex-start' }}>
            <Ionicons name="repeat-outline" size={13} color="#2563EB" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E40AF' }}>
              Reshared from {post.originalAuthorName || 'Alumni'}
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
            {isReshared && (
              <View style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                backgroundColor: '#6366F1',
                width: 18,
                height: 18,
                borderRadius: 9,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: theme.card
              }}>
                <Ionicons name="repeat" size={10} color="#FFFFFF" />
              </View>
            )}
          </View>
          <View style={styles.postUserInfo}>
            <Text style={styles.postUserName}>{post.user}</Text>
            <Text style={styles.postUserRole}>{post.role}</Text>
          </View>
          <TouchableOpacity
            style={styles.followBtn}
            activeOpacity={0.7}
            onPress={() => toggleFollow(post.authorId)}
          >
            <Text style={styles.followBtnText}>
              {followingMap[post.authorId] ? 'Following' : '+ Follow'}
            </Text>
          </TouchableOpacity>
        </View>

      {/* Post image with Instagram Double-Tap to Like */}
      {post.image ? (
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

      {/* Action row - Instagram HiFi Styling */}
      <View style={styles.postActions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={() => toggleLike(post.id)} activeOpacity={0.6}>
            <Ionicons
              name={likedPosts[post.id] ? 'heart' : 'heart-outline'}
              size={26}
              color={likedPosts[post.id] ? '#FF3040' : theme.text}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6} onPress={() => openModal('comments', post)}>
            <Ionicons name="chatbubble-outline" size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6} onPress={() => openModal('reshare', post)}>
            <Ionicons name="repeat-outline" size={26} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openModal('share', post)}
            activeOpacity={0.6}
          >
            <Ionicons name="paper-plane-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => toggleBookmark(post.id)} activeOpacity={0.6}>
          <Ionicons
            name={bookmarkedPosts[post.id] ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={bookmarkedPosts[post.id] ? '#0F172A' : theme.text}
          />
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.postFooter}>
        <Text style={styles.likesText}>
          {likedPosts[post.id] ? post.likes + 1 : post.likes} likes
        </Text>
        <Text style={styles.postContent} numberOfLines={2}>
          {post.content}
        </Text>
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
            style={[styles.headerAvatar, { overflow: 'hidden', backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center' }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile')}
          >
            {userAvatarUrl ? (
              <Image source={{ uri: userAvatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 16 }} />
            ) : (
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>{userName ? userName.substring(0, 2).toUpperCase() : 'HA'}</Text>
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
            
            {/* 1. Left Column: Profile Context */}
            <View style={{ flex: 3 }}>
              <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 20, elevation: 2, borderWidth: 1, borderColor: theme.border, marginBottom: 24, alignItems: 'center' }}>
                <TouchableOpacity 
                  style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden', shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
                  onPress={() => navigation.navigate('Profile')}
                  activeOpacity={0.8}
                >
                  {userAvatarUrl ? (
                    <Image source={{ uri: userAvatarUrl }} style={{ width: 72, height: 72, borderRadius: 36 }} />
                  ) : (
                    <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF' }}>{userName ? userName.substring(0, 2).toUpperCase() : 'HA'}</Text>
                  )}
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>{userName || 'Alumni Member'}</Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                  {currentUser?.designation || 'Alumni Member'}
                  {currentUser?.company || currentUser?.institution ? `\n@ ${currentUser.company || currentUser.institution}` : ''}
                </Text>
                
                <View style={{ width: '100%', height: 1, backgroundColor: theme.border, marginVertical: 16 }} />
                
                <View style={{ width: '100%', gap: 12 }}>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} onPress={() => navigation.navigate('Profile')}>
                    <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 13 }}>Connections</Text>
                    <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>{connectionsCount}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 13 }}>My Events</Text>
                    <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>{eventsAndJobs.length > 0 ? eventsAndJobs.length : 0}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* 2. Middle Column: Main Feed */}
            <View style={{ flex: 6 }}>
              {/* Create Post Widget */}
              <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 16, elevation: 2, borderWidth: 1, borderColor: theme.border, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity 
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}
                  onPress={() => navigation.navigate('Profile')}
                  activeOpacity={0.8}
                >
                  {userAvatarUrl ? (
                    <Image source={{ uri: userAvatarUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                  ) : (
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>{userName ? userName.substring(0, 2).toUpperCase() : 'HA'}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ flex: 1, backgroundColor: theme.inputBackground, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: theme.border }}
                  onPress={() => navigation.navigate('PostCreation')}
                >
                  <Text style={{ color: theme.textMuted, fontSize: 14 }}>Start a post or share an update...</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ padding: 8, backgroundColor: theme.background, borderRadius: 20 }}
                  onPress={() => navigation.navigate('PostCreation')}
                >
                  <Ionicons name="image-outline" size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {posts.length > 0 ? (
                  posts.map(post => renderPostCard(post))
                ) : (
                  <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 24, alignItems: 'center', marginVertical: 12, borderWidth: 1, borderColor: theme.border }}>
                    <Ionicons name="people-outline" size={48} color={theme.primary} style={{ marginBottom: 12 }} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 6, textAlign: 'center' }}>No Followed Alumni Posts Yet</Text>
                    <Text style={{ fontSize: 13, color: theme.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>Follow alumni members from "People you may know" or the Directory to view their posts in your feed!</Text>
                    <TouchableOpacity 
                      style={{ backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 }}
                      onPress={() => navigation.navigate('Engage', { tab: 'directory' })}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 13 }}>Explore Alumni Directory</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>

            {/* 3. Right Column: Widgets */}
            <View style={{ flex: 3.5 }}>
              {/* Suggestions Widget */}
              <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 16, marginBottom: 24, elevation: 2, borderWidth: 1, borderColor: theme.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>People you may know</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Engage', { tab: 'directory' })} activeOpacity={0.7}>
                    <Text style={{ fontSize: 13, color: theme.primary, fontWeight: '600' }}>See all</Text>
                  </TouchableOpacity>
                </View>
                {suggestions.filter(s => !followingMap[s.id]).length > 0 ? (
                  suggestions.filter(s => !followingMap[s.id]).map(s => (
                    <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.border, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <Text style={{ fontWeight: '700', color: theme.textSecondary }}>{s.avatar}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{s.name}</Text>
                        <Text style={{ fontSize: 12, color: theme.textSecondary }}>{s.subtitle}</Text>
                      </View>
                      <TouchableOpacity 
                        style={[styles.suggestionFollowBtn, followingMap[s.id] && styles.suggestionFollowBtnActive, { paddingHorizontal: 12, paddingVertical: 6 }]}
                        onPress={() => toggleSuggestionFollow(s.id)}
                      >
                        <Text style={[styles.suggestionFollowText, followingMap[s.id] && styles.suggestionFollowTextActive]}>{followingMap[s.id] ? 'Following' : 'Follow'}</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <Ionicons name="checkmark-circle-outline" size={28} color={theme.primary} style={{ marginBottom: 4 }} />
                    <Text style={{ fontSize: 13, color: theme.textMuted, textAlign: 'center' }}>You are following all suggested alumni! View your connections in your Profile.</Text>
                  </View>
                )}
              </View>

              {/* Events & Jobs Widget */}
              <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 16, elevation: 2, borderWidth: 1, borderColor: theme.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Opportunities</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Jobs')} activeOpacity={0.7}>
                    <Text style={{ fontSize: 13, color: theme.primary, fontWeight: '600', cursor: 'pointer' }}>See all</Text>
                  </TouchableOpacity>
                </View>
                {eventsAndJobs.map(ev => (
                  <View key={ev.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                    <Image source={{ uri: ev.image }} style={{ width: 52, height: 52, borderRadius: 8, marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 2 }}>{ev.title}</Text>
                      <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 6 }}>{ev.subtitle}</Text>
                      <TouchableOpacity 
                        style={{ backgroundColor: theme.background, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}
                        onPress={() => navigation.navigate('Jobs')}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '600', color: theme.primary }}>{ev.btnText || 'View Job'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {posts.length > 0 ? posts.slice(0, 1).map(post => renderPostCard(post)) : (
              <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <Ionicons name="newspaper-outline" size={40} color={theme.textSecondary} />
                <Text style={{ color: theme.textSecondary, marginTop: 8, fontSize: 14 }}>No posts yet. Be the first to share!</Text>
              </View>
            )}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Suggestions for you</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Engage', { tab: 'directory' })}><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
                {suggestions.filter(s => !followingMap[s.id]).length > 0 ? (
                  suggestions.filter(s => !followingMap[s.id]).map((s) => (
                    <View key={s.id} style={styles.suggestionCard}>
                      <TouchableOpacity style={styles.suggestionRemove}><Ionicons name="close" size={14} color="#94A3B8" /></TouchableOpacity>
                      <View style={styles.suggestionAvatar}><Text style={styles.avatarText}>{s.avatar}</Text></View>
                      <Text style={styles.suggestionName} numberOfLines={1}>{s.name}</Text>
                      <Text style={styles.suggestSubText}>{s.subtitle}</Text>
                      <TouchableOpacity
                        style={[styles.suggestionFollowBtn, followingMap[s.id] && styles.suggestionFollowBtnActive]}
                        onPress={() => toggleSuggestionFollow(s.id)}
                      >
                        <Text style={[styles.suggestionFollowText, followingMap[s.id] && styles.suggestionFollowTextActive]}>
                          {followingMap[s.id] ? 'Following' : 'Follow'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontSize: 13, color: theme.textMuted, padding: 12 }}>You are following all suggested alumni!</Text>
                )}
              </ScrollView>
            </View>
            {posts.length > 1 && posts.slice(1).map(post => renderPostCard(post))}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Opportunities & Recent Jobs</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Jobs')} activeOpacity={0.7}><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsScroll}>
                {eventsAndJobs.map((ev) => (
                  <View key={ev.id} style={[styles.eventRowCard, { width: contentWidth * 0.76 }]}>
                    <Image source={{ uri: ev.image }} style={styles.eventRowImage} />
                    <View style={styles.eventRowContent}>
                      <Text style={styles.eventRowTitle} numberOfLines={1}>{ev.title}</Text>
                      <Text style={styles.eventRowSub} numberOfLines={1}>{ev.subtitle}</Text>
                      <TouchableOpacity style={styles.eventRowBtn} onPress={() => navigation.navigate('Jobs')} activeOpacity={0.7}><Text style={styles.eventRowBtnText}>{ev.btnText || 'View Job'}</Text></TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.eventRowClose}><Ionicons name="close" size={14} color="#94A3B8" /></TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
            <View style={{ height: 30 }} />
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
                        {item.user?.name ? item.user.name.substring(0, 2).toUpperCase() : (typeof item.user === 'string' ? item.user.substring(0, 2).toUpperCase() : 'AL')}
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

      {/* Share Modal */}
      <Modal visible={activeModal === 'share'} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={isWeb ? styles.webModalOverlay : styles.modalOverlay}>
          <View style={isWeb ? styles.webModalContainer : styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Share to...</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
            </View>
            <View style={styles.shareGrid}>
              <TouchableOpacity style={styles.shareItem} onPress={() => handleShare(selectedPost)}>
                <View style={[styles.shareIconWrap, {backgroundColor:'#25D366'}]}><Ionicons name="logo-whatsapp" size={24} color="#FFF"/></View>
                <Text style={styles.shareText}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareItem} onPress={() => handleShare(selectedPost)}>
                <View style={[styles.shareIconWrap, {backgroundColor:'#0077B5'}]}><Ionicons name="logo-linkedin" size={24} color="#FFF"/></View>
                <Text style={styles.shareText}>LinkedIn</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareItem} onPress={() => handleShare(selectedPost)}>
                <View style={[styles.shareIconWrap, {backgroundColor:'#1DA1F2'}]}><Ionicons name="logo-twitter" size={24} color="#FFF"/></View>
                <Text style={styles.shareText}>Twitter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareItem} onPress={() => handleShare(selectedPost)}>
                <View style={[styles.shareIconWrap, {backgroundColor: theme.border}]}><Ionicons name="copy-outline" size={24} color={theme.text}/></View>
                <Text style={styles.shareText}>Copy Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={activeModal === 'reshare'} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={isWeb ? styles.webModalOverlay : styles.modalOverlay}>
          <View style={isWeb ? styles.webModalContainer : styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Reshare Post to Feed</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
            </View>

            {selectedPost ? (
              <View style={{ padding: 16 }}>
                <View style={{ backgroundColor: 'rgba(0, 33, 68, 0.04)', borderRadius: 12, padding: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: theme.primary }}>
                  <Text style={{ fontWeight: '700', fontSize: 13, color: theme.text }}>
                    @{selectedPost.user?.name || selectedPost.user || 'Alumni Member'}
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }} numberOfLines={3}>
                    {selectedPost.content}
                  </Text>
                </View>

                <TextInput
                  style={{
                    backgroundColor: theme.card,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 14,
                    color: theme.text,
                    minHeight: 70,
                    marginBottom: 16
                  }}
                  placeholder="Add your thoughts or note (optional)..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  value={reshareNote}
                  onChangeText={setReshareNote}
                />

                <TouchableOpacity
                  style={{
                    backgroundColor: theme.primary,
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: 'center',
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
                      // Refresh posts
                      const freshPosts = await getPosts();
                      if (freshPosts && Array.isArray(freshPosts)) {
                        setPosts(freshPosts.map(p => ({
                          id: p._id,
                          _id: p._id,
                          user: p.user?.name || 'Alumni',
                          avatar: p.user?.name ? p.user.name.substring(0, 2).toUpperCase() : 'AL',
                          role: `${p.user?.branch || 'Alumni'} ${p.user?.batchYear ? '• Batch of ' + p.user.batchYear : ''}`,
                          time: getTimeAgo(p.createdAt),
                          content: p.content,
                          image: p.image,
                          likes: p.likes ? p.likes.length : 0,
                          commentsCount: p.comments ? p.comments.length : 0,
                          comments: p.comments || [],
                          resharesCount: p.reshares ? p.reshares.length : 0,
                          isSaved: p.savedBy ? p.savedBy.includes(currentUser?._id) : false,
                          authorId: p.user?._id
                        })));
                      }
                    } catch (err) {
                      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to reshare post');
                    } finally {
                      setResharingLoading(false);
                    }
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>
                    {resharingLoading ? 'Resharing...' : '🔄 Reshare Post'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
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
    paddingVertical: 10,
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
    marginRight: 10,
  },
  headerAvatarText: {
    color: theme.card,
    fontSize: 14,
    fontWeight: '700',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 38,
    marginRight: 10,
    borderWidth: 1,
    borderColor: theme.border,
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
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: theme.card,
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
    borderRadius: 6,
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.primary,
  },
  postImage: {
    backgroundColor: theme.border,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  actionBtn: {
    justifyContent: 'center',
    alignItems: 'center',
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
    color: theme.inputBackground,
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
