import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getPosts, createPost, likePost, deletePost } from '../services/postService';
import { uploadFile } from '../services/uploadService';
import getInitials from '../lib/getInitials';

const AdminHomeScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  const contentWidth = isWeb ? Math.min(width, 800) : width;
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: isDesktop ? 1200 : 800, flex: 1 } : { flex: 1 };
  
  const [likedPosts, setLikedPosts] = useState({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState({});
  const [followedUsers, setFollowedUsers] = useState({});
  const [followedSuggestions, setFollowedSuggestions] = useState({});
  const [searchText, setSearchText] = useState('');
  const [userInstitution, setUserInstitution] = useState('Mediacell');
  const [userName, setUserName] = useState('Mediacell Admin');
  const [userRole, setUserRole] = useState('Admin');
  const [userDepartment, setUserDepartment] = useState('Administration');
  const [userInitials, setUserInitials] = useState('MA');


  // Modal States
  const [activeModal, setActiveModal] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  
  // Post Creation States
  const [posts, setPosts] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);

  const mockComments = [];

  const openModal = (type, post) => {
    setSelectedPost(post);
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedPost(null);
    setCommentText('');
    setNewPostContent('');
    setNewPostImage(null);
  };

  const fetchPosts = async () => {
    try {
      const data = await getPosts();
      if (Array.isArray(data)) {
        const formatted = data.map(p => ({
          id: p._id,
          user: p.user?.name || 'Mediacell Admin',
          role: `${p.user?.role || 'Admin'} • ${p.user?.institution || 'Mediacell'}`,
          avatar: getInitials(p.user?.name, 'MA'),
          content: p.content,
          image: p.image || p.image_url,
          likes: (p.likes || []).length,
          commentsCount: (p.comments || []).length,
          time: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Just now',
          raw: p
        }));
        setPosts(formatted);
      }
    } catch (err) {
      console.log('Error loading feed posts:', err.message);
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfoString = await AsyncStorage.getItem('userInfo');
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          if (userInfo.name) {
            setUserName(userInfo.name);
            setUserInitials(getInitials(userInfo.name));
          }
          if (userInfo.institution) {
            setUserInstitution(userInfo.institution);
          }
          if (userInfo.role) {
            setUserRole(userInfo.role);
          }
          if (userInfo.department || userInfo.branch) {
            setUserDepartment(userInfo.department || userInfo.branch);
          }
        }
      } catch (_) {}
    };
    fetchUserInfo();
    fetchPosts();
  }, []);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.4,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        const uploaded = await uploadFile(localUri, result.assets[0].mimeType || 'image/jpeg', result.assets[0].fileName || 'post.jpg');
        setNewPostImage(uploaded || localUri);
      }
    } catch (err) {
      console.log('Image picker error:', err.message);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostImage) {
      if (Platform.OS === 'web') window.alert('Please enter text or select an image for your post.');
      else Alert.alert('Empty Post', 'Please enter text or select an image for your post.');
      return;
    }

    try {
      setIsPosting(true);
      await createPost({
        content: newPostContent.trim(),
        image: newPostImage
      });
      setNewPostContent('');
      setNewPostImage(null);
      closeModal();
      await fetchPosts();
      if (Platform.OS === 'web') window.alert('Post published successfully!');
      else Alert.alert('Success', 'Post published successfully!');
    } catch (err) {
      console.error('Failed to create post:', err);
      if (Platform.OS === 'web') window.alert('Failed to publish post: ' + (err.message || 'Please try again.'));
      else Alert.alert('Error', 'Failed to publish post: ' + (err.message || 'Please try again.'));
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    const confirmDelete = async () => {
      try {
        await deletePost(postId);
        setPosts(prev => prev.filter(p => p.id !== postId));
      } catch (e) {
        console.log('Error deleting post:', e.message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this post?')) confirmDelete();
    } else {
      Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete }
      ]);
    }
  };

  // ─── Data ──────────────────────────────────────────────
  const suggestions = [];
  const eventsAndJobs = [];

  // ─── Handlers ──────────────────────────────────────────
  const toggleLike = async (postId) => {
    setLikedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
    try {
      await likePost(postId);
    } catch (e) {}
  };

  const toggleBookmark = (postId) => {
    setBookmarkedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleFollow = (postId) => {
    setFollowedUsers((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleSuggestionFollow = (id) => {
    setFollowedSuggestions((prev) => ({ ...prev, [id]: !prev[id] }));
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
  const renderPostCard = (post) => (
    <View key={post.id} style={styles.postCard}>
      {/* Post header */}
      <View style={styles.postHeader}>
        <View style={styles.postUserAvatar}>
          <Text style={styles.avatarText}>{post.avatar}</Text>
        </View>
        <View style={styles.postUserInfo}>
          <Text style={styles.postUserName}>{post.user}</Text>
          <Text style={styles.postUserRole}>{post.role}</Text>
        </View>
        <TouchableOpacity
          style={{ padding: 6, marginLeft: 8 }}
          activeOpacity={0.7}
          onPress={() => handleDeletePost(post.id)}
        >
          <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Post image */}
      {post.image ? (
        <Image source={{ uri: post.image }} style={[styles.postImage, { width: '100%', height: contentWidth * 0.65 }]} />
      ) : null}

      {/* Action row */}
      <View style={styles.postActions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={() => toggleLike(post.id)} activeOpacity={0.6}>
            <Ionicons
              name={likedPosts[post.id] ? 'heart' : 'heart-outline'}
              size={26}
              color={likedPosts[post.id] ? theme.danger : theme.text}
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
            color={bookmarkedPosts[post.id] ? theme.primary : theme.text}
          />
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.postFooter}>
        <Text style={styles.likesText}>
          {post.likes} {post.likes === 1 ? 'like' : 'likes'}
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

  // ─── Render ────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={webContainerStyle}>
        
        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          {/* Left – User avatar */}
          <TouchableOpacity
            style={styles.headerAvatar}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdminProfile')}
          >
            <Text style={styles.headerAvatarText}>{userInitials}</Text>
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
              onPress={() => navigation.navigate('Messages')}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {isDesktop ? (
          // WEB GRID DASHBOARD (3-Column Layout)
          <View style={{ flex: 1, padding: 24, flexDirection: 'row', gap: 24 }}>
            
            {/* 1. Left Column: Profile Context */}
            <View style={{ flex: 3 }}>
              <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 20, elevation: 2, borderWidth: 1, borderColor: theme.border, marginBottom: 24, alignItems: 'center' }}>
                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: theme.card }}>{userInitials}</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>{userName}</Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>{userRole} • {userDepartment}{'\n'}@ {userInstitution}</Text>
                
                <View style={{ width: '100%', height: 1, backgroundColor: theme.border, marginVertical: 16 }} />
                
                <View style={{ width: '100%', gap: 12 }}>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name="bookmark-outline" size={18} color={theme.textSecondary} />
                    <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>Saved Items</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
                    <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>My Events</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name="people-outline" size={18} color={theme.textSecondary} />
                    <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>My Network</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* 2. Middle Column: Main Feed */}
            <View style={{ flex: 6 }}>
              {/* Create Post Widget */}
              <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 16, elevation: 2, borderWidth: 1, borderColor: theme.border, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.card }}>{userInitials}</Text>
                </View>
                <TouchableOpacity 
                  style={{ flex: 1, backgroundColor: theme.inputBackground, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: theme.border }}
                  onPress={() => openModal('post', null)}
                >
                  <Text style={{ color: theme.textMuted, fontSize: 14 }}>Start a post or share an update...</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ padding: 8, backgroundColor: theme.background, borderRadius: 20 }}>
                  <Ionicons name="image-outline" size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {posts.length > 0 ? (
                  posts.map(post => renderPostCard(post))
                ) : (
                  <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border }}>
                    <Ionicons name="newspaper-outline" size={44} color={theme.textMuted} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginTop: 12 }}>No Posts Yet</Text>
                    <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginTop: 4 }}>Posts and announcements published by {userInstitution} will appear here.</Text>
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
                {suggestions.length > 0 ? (
                  suggestions.map(s => (
                    <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.border, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <Text style={{ fontWeight: '700', color: theme.textSecondary }}>{s.avatar}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{s.name}</Text>
                        <Text style={{ fontSize: 12, color: theme.textSecondary }}>{s.subtitle}</Text>
                      </View>
                      <TouchableOpacity 
                        style={[styles.suggestionFollowBtn, followedSuggestions[s.id] && styles.suggestionFollowBtnActive, { paddingHorizontal: 12, paddingVertical: 6 }]}
                        onPress={() => toggleSuggestionFollow(s.id)}
                      >
                        <Text style={[styles.suggestionFollowText, followedSuggestions[s.id] && styles.suggestionFollowTextActive]}>{followedSuggestions[s.id] ? 'Following' : 'Follow'}</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontSize: 13, color: theme.textMuted, textAlign: 'center', paddingVertical: 12 }}>No connection suggestions available.</Text>
                )}
              </View>

              {/* Events & Jobs Widget */}
              <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 16, elevation: 2, borderWidth: 1, borderColor: theme.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Opportunities</Text>
                  <Text style={{ fontSize: 13, color: theme.primary, fontWeight: '600' }}>See all</Text>
                </View>
                {eventsAndJobs.length > 0 ? (
                  eventsAndJobs.map(ev => (
                    <View key={ev.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                      <Image source={{ uri: ev.image }} style={{ width: 60, height: 60, borderRadius: 8, marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 2 }}>{ev.title}</Text>
                        <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 6 }}>{ev.subtitle}</Text>
                        <TouchableOpacity style={{ backgroundColor: theme.background, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: theme.primary }}>{ev.btnText}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontSize: 13, color: theme.textMuted, textAlign: 'center', paddingVertical: 12 }}>No current opportunities.</Text>
                )}
              </View>
            </View>
          </View>
        ) : (
          // MOBILE LAYOUT (Current)
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Mobile Create Post Widget */}
            <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 12, marginHorizontal: 16, marginTop: 12, marginBottom: 8, elevation: 1, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.card }}>{userInitials}</Text>
              </View>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: theme.inputBackground, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: theme.border }}
                onPress={() => openModal('post', null)}
              >
                <Text style={{ color: theme.textMuted, fontSize: 13 }}>Start a post or update...</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ padding: 6, backgroundColor: theme.background, borderRadius: 16 }}
                onPress={() => openModal('post', null)}
              >
                <Ionicons name="image-outline" size={18} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {posts.length > 0 ? (
              posts.map(post => renderPostCard(post))
            ) : (
              <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 24, alignItems: 'center', justifyContent: 'center', margin: 16, borderWidth: 1, borderColor: theme.border }}>
                <Ionicons name="newspaper-outline" size={40} color={theme.textMuted} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginTop: 10 }}>No Posts Yet</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center', marginTop: 4 }}>Posts from {userInstitution} will appear here.</Text>
              </View>
            )}
            {suggestions.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Suggestions for you</Text>
                  <TouchableOpacity><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
                  {suggestions.map((s) => (
                    <View key={s.id} style={styles.suggestionCard}>
                      <TouchableOpacity style={styles.suggestionRemove}><Ionicons name="close" size={14} color="#94A3B8" /></TouchableOpacity>
                      <View style={styles.suggestionAvatar}><Text style={styles.avatarText}>{s.avatar}</Text></View>
                      <Text style={styles.suggestionName} numberOfLines={1}>{s.name}</Text>
                      <Text style={styles.suggestSubText}>{s.subtitle}</Text>
                      <TouchableOpacity
                        style={[styles.suggestionFollowBtn, followedSuggestions[s.id] && styles.suggestionFollowBtnActive]}
                        onPress={() => toggleSuggestionFollow(s.id)}
                      >
                        <Text style={[styles.suggestionFollowText, followedSuggestions[s.id] && styles.suggestionFollowTextActive]}>
                          {followedSuggestions[s.id] ? 'Following' : 'Follow'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            {eventsAndJobs.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Events & Opportunities</Text>
                  <TouchableOpacity><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsScroll}>
                  {eventsAndJobs.map((ev) => (
                    <View key={ev.id} style={[styles.eventRowCard, { width: contentWidth * 0.76 }]}>
                      <Image source={{ uri: ev.image }} style={styles.eventRowImage} />
                      <View style={styles.eventRowContent}>
                        <Text style={styles.eventRowTitle} numberOfLines={1}>{ev.title}</Text>
                        <Text style={styles.eventRowSub} numberOfLines={1}>{ev.subtitle}</Text>
                        <TouchableOpacity style={styles.eventRowBtn}><Text style={styles.eventRowBtnText}>{ev.btnText}</Text></TouchableOpacity>
                      </View>
                      <TouchableOpacity style={styles.eventRowClose}><Ionicons name="close" size={14} color="#94A3B8" /></TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
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
              <Text style={styles.sheetTitle}>Comments</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
            </View>
            <FlatList
              data={mockComments}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <View style={styles.commentRow}>
                  <Text style={styles.commentUser}>{item.user}</Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                  <Text style={styles.commentTime}>{item.time}</Text>
                </View>
              )}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
            <View style={styles.commentInputRow}>
              <TextInput style={styles.commentInput} placeholder="Add a comment..." placeholderTextColor={theme.textMuted} value={commentText} onChangeText={setCommentText} />
              <TouchableOpacity onPress={() => setCommentText('')}><Text style={styles.commentPostBtn}>Post</Text></TouchableOpacity>
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
                <View style={[styles.shareIconWrap, {backgroundColor:'#6366F1'}]}><Ionicons name="people" size={24} color="#FFF"/></View>
                <Text style={styles.shareText}>Followers</Text>
              </TouchableOpacity>
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

      {/* Create Post Modal */}
      <Modal visible={activeModal === 'post'} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={isWeb ? styles.webModalOverlay : styles.modalOverlay}>
          <View style={[isWeb ? styles.webModalContainer : styles.bottomSheet, { maxHeight: '90%' }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Create Post</Text>
              <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
            </View>
            
            <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.card }}>{userInitials}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>{userName}</Text>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>{userRole} • {userInstitution}</Text>
                </View>
              </View>

              <TextInput
                style={{
                  minHeight: 120,
                  fontSize: 16,
                  color: theme.text,
                  textAlignVertical: 'top',
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 12,
                  padding: 12,
                  backgroundColor: theme.inputBackground,
                  marginBottom: 16
                }}
                placeholder={`What's on your mind, ${userName}?`}
                placeholderTextColor={theme.textMuted}
                multiline
                value={newPostContent}
                onChangeText={setNewPostContent}
                autoFocus
              />

              {newPostImage && (
                <View style={{ position: 'relative', marginBottom: 16, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
                  <Image source={{ uri: newPostImage }} style={{ width: '100%', height: 200, resizeMode: 'cover' }} />
                  <TouchableOpacity
                    style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 4 }}
                    onPress={() => setNewPostImage(null)}
                  >
                    <Ionicons name="close" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.border }}
                  onPress={handlePickImage}
                >
                  <Ionicons name="image-outline" size={20} color={theme.primary} />
                  <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>Add Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: theme.primary,
                    paddingHorizontal: 24,
                    paddingVertical: 10,
                    borderRadius: 24,
                    opacity: (!newPostContent.trim() && !newPostImage) || isPosting ? 0.6 : 1
                  }}
                  disabled={(!newPostContent.trim() && !newPostImage) || isPosting}
                  onPress={handleCreatePost}
                >
                  <Text style={{ color: theme.card, fontWeight: '700', fontSize: 15 }}>
                    {isPosting ? 'Publishing...' : 'Publish Post'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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

export default AdminHomeScreen;
