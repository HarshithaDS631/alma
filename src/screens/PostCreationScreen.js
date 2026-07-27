import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, Alert, StatusBar, Modal, FlatList } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFile } from '../services/uploadService';
import { createPost } from '../services/postService';
import { getFollowers, getFollowing } from '../services/authService';

const hashtags = ['#Institution', '#AlumniMeet', '#Mentorship', '#TechTalk', '#Careers', '#ClassOf2024'];

const PostCreationScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('All Alumni');
  const [localImageUri, setLocalImageUri] = useState(null);
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [fileName, setFileName] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  // Tagging states
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [connections, setConnections] = useState([]);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const userStr = await AsyncStorage.getItem('userInfo');
        if (userStr) {
          setCurrentUser(JSON.parse(userStr));
        }
      } catch (err) {}
    };
    const fetchConnections = async () => {
      try {
        const [followers, following] = await Promise.all([getFollowers(), getFollowing()]);
        // Combine and remove duplicates
        const allConnections = [...followers, ...following];
        const uniqueConnections = Array.from(new Map(allConnections.map(user => [user._id, user])).values());
        setConnections(uniqueConnections);
      } catch (error) {
        console.error('Error fetching connections:', error);
      }
    };
    fetchUser();
    fetchConnections();
  }, []);

  const handlePost = async () => {
    if (!content.trim() && !localImageUri) {
      if (Platform.OS === 'web') window.alert('Empty Post: Please enter some text or attach an image.');
      else Alert.alert('Empty Post', 'Please enter some text or attach an image.');
      return;
    }

    setIsUploading(true);
    try {
      let imageUrl = null;
      if (localImageUri) {
        imageUrl = await uploadFile(localImageUri, mimeType, fileName || 'post-image.jpg');
      }

      await createPost({
        content: content.trim(),
        image: imageUrl,
        fileType: mimeType,
        fileName: fileName,
        tags: taggedUsers.map(u => u._id)
      });

      setIsUploading(false);
      if (Platform.OS === 'web') {
        window.alert('Your post has been shared with the community!');
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('Main');
      } else {
        Alert.alert(
          'Success',
          'Your post has been shared with the community!',
          [{ text: 'OK', onPress: () => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Main');
          }}]
        );
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setIsUploading(false);
      if (Platform.OS === 'web') window.alert('Error: Failed to create post. Please try again later.');
      else Alert.alert('Error', 'Failed to create post. Please try again later.');
    }
  };

  const handleAddHashtag = (tag) => {
    if (content.includes(tag)) return;
    setContent(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + tag + ' ');
  };

  const handleToggleAudience = () => {
    if (Platform.OS === 'web') {
      const choice = window.prompt('Select Audience:\\n1: All Alumni\\n2: My Batch Only\\n3: Department Only', '1');
      if (choice === '1') setAudience('All Alumni');
      else if (choice === '2') setAudience('Batch of 2023');
      else if (choice === '3') setAudience('CSE Department');
    } else {
      Alert.alert(
        'Select Audience',
        'Choose who can see this post',
        [
          { text: 'All Alumni', onPress: () => setAudience('All Alumni') },
          { text: 'My Batch Only', onPress: () => setAudience('Batch of 2023') },
          { text: 'Department Only', onPress: () => setAudience('CSE Department') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handleSelectMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Don't force cropping for post images
        quality: 0.3, // Compress to fit under Vercel 4.5MB limit
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLocalImageUri(result.assets[0].uri);
        setMimeType(result.assets[0].mimeType || 'image/jpeg');
        setFileName(result.assets[0].fileName || 'image.jpg');
      }
    } catch (err) {
      console.error('Image picker error:', err);
      if (Platform.OS === 'web') window.alert('Error: Could not open image picker: ' + err.message);
      else Alert.alert('Error', 'Could not open image picker: ' + err.message);
    }
  };

  const handleSelectDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setLocalImageUri(file.uri);
        setMimeType(file.mimeType || 'application/octet-stream');
        setFileName(file.name);
      }
    } catch (err) {
      console.error('Document picker error:', err);
      if (Platform.OS === 'web') window.alert('Error: Could not open document picker: ' + err.message);
      else Alert.alert('Error', 'Could not open document picker: ' + err.message);
    }
  };

  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const handleGlobalDragOver = (e) => {
        e.preventDefault();
      };
      
      const handleGlobalDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          const url = URL.createObjectURL(file);
          setLocalImageUri(url);
          setMimeType(file.type);
          setFileName(file.name);
        }
      };

      window.addEventListener('dragover', handleGlobalDragOver);
      window.addEventListener('drop', handleGlobalDrop);

      return () => {
        window.removeEventListener('dragover', handleGlobalDragOver);
        window.removeEventListener('drop', handleGlobalDrop);
      };
    }
  }, []);

  const isWeb = Platform.OS === 'web';
  const webWrapper = isWeb ? { flex: 1, backgroundColor: '#F8FAFC', paddingVertical: 20 } : { flex: 1 };
  const webContainerStyle = isWeb ? { 
    alignSelf: 'center', width: '100%', maxWidth: 680, flex: 1, backgroundColor: theme.card, 
    borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.08, shadowRadius: 24, elevation: 10, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' 
  } : { flex: 1 };

  return (
    <SafeAreaView style={[styles.container, isWeb && { backgroundColor: '#F8FAFC' }]}>
      <View style={webWrapper}>
        <View style={webContainerStyle}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => {
                if (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
                  navigation.goBack();
                } else if (navigation && typeof navigation.navigate === 'function') {
                  navigation.navigate('Main', { screen: 'Home' });
                } else if (typeof window !== 'undefined' && window.history) {
                  window.history.back();
                }
              }} style={styles.cancelBtn}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Create Post</Text>
              <TouchableOpacity style={[styles.postBtn, (!content.trim() && !localImageUri || isUploading) && styles.disabledPostBtn]} disabled={(!content.trim() && !localImageUri) || isUploading} onPress={handlePost}>
                <Text style={[styles.postBtnText, (!content.trim() && !localImageUri || isUploading) && styles.disabledPostBtnText]}>{isUploading ? 'Posting...' : 'Post'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* User Header */}
              <View style={styles.userSection}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'ME'}</Text>
                </View>
                <View>
                  <Text style={styles.userName}>{currentUser?.name || 'User'}</Text>
                  <TouchableOpacity style={styles.audienceSelector} onPress={handleToggleAudience} activeOpacity={0.6}>
                    <Text style={styles.audienceText}>{audience}</Text>
                    <Ionicons name="caret-down" size={12} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* TextInput */}
              <TextInput
                style={styles.input}
                placeholder="What do you want to talk about?"
                multiline
                maxLength={280}
                value={content}
                onChangeText={setContent}
                placeholderTextColor="#94A3B8"
                autoFocus
                spellCheck={false}
                autoCorrect={false}
                {...(Platform.OS === 'web' ? { 'data-ms-editor': false } : {})}
              />

              {/* Attached Image Preview */}
              {localImageUri ? (
                <View style={styles.previewContainer}>
                  {mimeType && mimeType.startsWith('image/') ? (
                    <Image source={{ uri: localImageUri }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.documentPreview}>
                      <Ionicons name="document-text" size={48} color="#003366" />
                      <Text style={styles.documentName} numberOfLines={2}>{fileName || 'Document'}</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => { setLocalImageUri(null); setFileName(null); setMimeType('image/jpeg'); }}>
                    <Ionicons name="close-circle" size={30} color="rgba(15, 23, 42, 0.7)" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.mediaSection}>
                  <TouchableOpacity style={styles.mediaPlaceholder} onPress={handleSelectMedia} activeOpacity={0.7}>
                    <View style={styles.iconCircle}><Ionicons name="image-outline" size={24} color="#003366" /></View>
                    <View>
                      <Text style={styles.mediaLabel}>Add Photo or Video</Text>
                      <Text style={styles.mediaSubLabel}>Showcase your achievements</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.mediaPlaceholder, {marginTop: 12}]} onPress={handleSelectDocument} activeOpacity={0.7}>
                    <View style={styles.iconCircle}><Ionicons name="document-attach-outline" size={24} color="#003366" /></View>
                    <View>
                      <Text style={styles.mediaLabel}>Attach Document</Text>
                      <Text style={styles.mediaSubLabel}>PDFs, Docs, and more</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Quick Hashtags */}
              <View style={styles.hashtagSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hashtagScroll}>
                  {hashtags.map(tag => (
                    <TouchableOpacity key={tag} style={styles.tagChip} onPress={() => handleAddHashtag(tag)}>
                      <Ionicons name="add" size={14} color="#64748B" style={{ marginRight: 2 }} />
                      <Text style={styles.tagText}>{tag.replace('#', '')}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

            {/* Bottom Toolbar */}
            <View style={styles.footerContainer}>
              <View style={styles.toolbar}>
                <TouchableOpacity style={styles.toolBtn} onPress={handleSelectMedia}>
                  <Ionicons name="image-outline" size={24} color="#475569" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolBtn} onPress={handleSelectDocument}>
                  <Ionicons name="document-outline" size={24} color="#475569" />
                </TouchableOpacity>
                {/* Tag Users Action */}
                <TouchableOpacity style={styles.toolBtn} onPress={() => setTagModalVisible(true)}>
                  <Ionicons name="people-outline" size={24} color={taggedUsers.length > 0 ? theme.primary : "#475569"} />
                  {taggedUsers.length > 0 && (
                    <View style={{position: 'absolute', top: -5, right: -5, backgroundColor: theme.primary, borderRadius: 10, width: 16, height: 16, justifyContent: 'center', alignItems: 'center'}}>
                      <Text style={{color: 'white', fontSize: 10, fontWeight: 'bold'}}>{taggedUsers.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <Text style={[styles.charCount, content.length >= 250 && styles.charCountWarning]}>
                  {content.length}/280
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>

      {/* Tag Users Modal */}
      <Modal visible={tagModalVisible} animationType="slide" transparent={true} onRequestClose={() => setTagModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tag Connections</Text>
              <TouchableOpacity onPress={() => setTagModalVisible(false)}><Ionicons name="close" size={24} color="#334155" /></TouchableOpacity>
            </View>
            <FlatList
              data={connections}
              keyExtractor={item => item._id}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={<Text style={{textAlign: 'center', color: '#64748B', marginTop: 20}}>No connections found.</Text>}
              renderItem={({ item }) => {
                const isSelected = taggedUsers.some(u => u._id === item._id);
                return (
                  <TouchableOpacity 
                    style={{flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9'}}
                    onPress={() => {
                      if (isSelected) {
                        setTaggedUsers(prev => prev.filter(u => u._id !== item._id));
                      } else {
                        setTaggedUsers(prev => [...prev, item]);
                      }
                    }}
                  >
                    <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden'}}>
                      {item.avatar_url ? (
                        <Image source={{uri: item.avatar_url}} style={{width: '100%', height: '100%'}} />
                      ) : (
                        <Text style={{color: '#64748B', fontWeight: 'bold'}}>{item.name ? item.name.substring(0,2).toUpperCase() : 'U'}</Text>
                      )}
                    </View>
                    <Text style={{flex: 1, fontSize: 16, color: '#1E293B', fontWeight: '500'}}>{item.name}</Text>
                    <View style={{width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: isSelected ? theme.primary : '#CBD5E1', backgroundColor: isSelected ? theme.primary : 'transparent', justifyContent: 'center', alignItems: 'center'}}>
                      {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
            <View style={{padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0'}}>
              <TouchableOpacity style={[styles.postBtn, {width: '100%', borderRadius: 8}]} onPress={() => setTagModalVisible(false)}>
                <Text style={styles.postBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cancelBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  postBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 24,
  },
  disabledPostBtn: {
    backgroundColor: '#E2E8F0',
  },
  postBtnText: {
    color: theme.card,
    fontWeight: '700',
    fontSize: 15,
  },
  disabledPostBtnText: {
    color: '#94A3B8',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: theme.card,
    fontWeight: '800',
    fontSize: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  audienceSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
    gap: 4,
  },
  audienceText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  input: {
    fontSize: 18,
    color: theme.text,
    minHeight: 140,
    textAlignVertical: 'top',
    lineHeight: 26,
  },
  mediaSection: {
    marginTop: 20,
  },
  mediaPlaceholder: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaLabel: {
    fontSize: 15,
    color: theme.text,
    fontWeight: '700',
  },
  mediaSubLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  previewContainer: {
    position: 'relative',
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  documentPreview: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  documentName: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
  },
  hashtagSection: {
    marginTop: 24,
  },
  hashtagScroll: {
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  footerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: theme.card,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  },
  toolBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  charCountWarning: {
    color: theme.danger,
  },
});

export default PostCreationScreen;
