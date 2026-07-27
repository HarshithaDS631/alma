import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar, Image, Alert, Linking, Modal, Dimensions, useWindowDimensions, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getConversation, sendMessage as sendApiMessage, reactMessage as apiReactMessage } from '../services/messageService';
import { getSuggestions } from '../services/authService';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const ChatScreen = ({ route, navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 768;
  const isLargeDesktop = windowWidth >= 1200;
  const styles = getStyles(theme, isDesktop, isLargeDesktop, isDarkMode);

  const { user } = route?.params || {};
  
  // Default fallback if someone opens this without a user
  const chatUser = user || { name: 'Unknown User', role: '', initials: '?' };

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [pendingAttachment, setPendingAttachment] = useState(null); // { url, type, name }
  const [previewImageModal, setPreviewImageModal] = useState(null);
  
  // Instagram Shared Post Modal States
  const [selectedPostModal, setSelectedPostModal] = useState(null);
  const [modalCommentText, setModalCommentText] = useState('');
  const [modalPostLiked, setModalPostLiked] = useState(false);
  const [modalLikesCount, setModalLikesCount] = useState(12);
  const [modalComments, setModalComments] = useState([]);

  const openPostModal = (postData) => {
    if (!postData) return;
    setSelectedPostModal(postData);
    setModalPostLiked(false);
    setModalLikesCount(postData.likes || 12);
    setModalComments(postData.comments && Array.isArray(postData.comments) ? postData.comments : [
      { user: 'Harshitha', text: 'Awesome post! 🎉' },
      { user: 'Alumni Network', text: 'Great update!' }
    ]);
  };
  
  // WhatsApp Features States
  const [replyToMsg, setReplyToMsg] = useState(null); // { _id, text, senderName }
  const [forwardModalMsg, setForwardModalMsg] = useState(null); // Message to forward
  const [suggestionsList, setSuggestionsList] = useState([]);
  const [forwardSearch, setForwardSearch] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const flatListRef = useRef(null);

  const storageKey = `chat_messages_${chatUser.id || 'default'}`;

  useEffect(() => {
    AsyncStorage.getItem('userInfo').then(raw => {
      if (raw) {
        try {
          const info = JSON.parse(raw);
          if (info._id || info.id) {
            setCurrentUserId((info._id || info.id).toString());
          }
        } catch (e) {}
      }
    });

    getSuggestions().then(res => {
      if (Array.isArray(res)) setSuggestionsList(res);
      else if (res && res.data) setSuggestionsList(res.data);
    }).catch(() => {});
  }, []);

  const getIsMe = (item) => {
    if (item.sender === 'me') return true;
    const senderIdStr = typeof item.sender === 'object' ? (item.sender?._id || item.sender?.id) : item.sender;
    if (!senderIdStr) return false;
    
    if (currentUserId && senderIdStr.toString() === currentUserId.toString()) {
      return true;
    }
    
    const chatUserIdStr = (chatUser.id || chatUser._id || '').toString();
    if (chatUserIdStr && senderIdStr.toString() !== chatUserIdStr.toString()) {
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    let isMounted = true;
    
    // Immediately load locally saved messages from AsyncStorage on refresh/mount
    const loadCachedMessages = async () => {
      try {
        const cached = await AsyncStorage.getItem(storageKey);
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch (err) {
        console.log('Error loading local cached messages:', err);
      }
    };

    loadCachedMessages();

    // Fetch live messages from server & update local storage
    const fetchMsgs = async () => {
      if (!chatUser.id) return;
      try {
        const msgs = await getConversation(chatUser.id);
        if (msgs && Array.isArray(msgs) && isMounted) {
          if (msgs.length > 0) {
            setMessages(prev => {
              const map = new Map();
              prev.forEach(m => {
                const k = (m._id || m.id || '').toString();
                if (k) map.set(k, m);
              });
              msgs.forEach(m => {
                const k = (m._id || m.id || '').toString();
                if (k) map.set(k, m);
              });
              const merged = Array.from(map.values()).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
              AsyncStorage.setItem(storageKey, JSON.stringify(merged)).catch(() => {});
              return merged;
            });
          } else {
            setMessages([]);
            AsyncStorage.removeItem(storageKey).catch(() => {});
          }
        }
      } catch(err) {
        console.log('Failed to load live chat:', err);
      }
    };

    fetchMsgs();
    const interval = setInterval(fetchMsgs, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [chatUser.id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handlePickImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setPendingAttachment({
              url: event.target.result,
              type: 'image',
              name: file.name || 'Image'
            });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const dataUrl = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setPendingAttachment({
          url: dataUrl,
          type: 'image',
          name: asset.fileName || 'Image'
        });
      }
    } catch (err) {
      console.log('Image picker error:', err);
    }
  };

  const handlePickDocument = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '*/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const isImg = file.type.startsWith('image/');
            setPendingAttachment({
              url: event.target.result,
              type: isImg ? 'image' : 'document',
              name: file.name || 'Document'
            });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const isImg = asset.mimeType && asset.mimeType.startsWith('image/');
        setPendingAttachment({
          url: asset.uri,
          type: isImg ? 'image' : 'document',
          name: asset.name || 'Document'
        });
      }
    } catch (err) {
      console.log('Document picker error:', err);
    }
  };

  const handleTakePhoto = async () => {
    setShowAttachMenu(false);
    if (Platform.OS === 'web') {
      handlePickImage();
      return;
    }
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is required!');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const dataUrl = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setPendingAttachment({
          url: dataUrl,
          type: 'image',
          name: asset.fileName || 'Photo'
        });
      }
    } catch (err) {
      console.log('Camera error:', err);
    }
  };

  const sendMessage = async () => {
    if ((!inputText.trim() && !pendingAttachment) || !chatUser.id) return;
    const textToSend = inputText.trim();
    const attachmentToSend = pendingAttachment;
    const currentReply = replyToMsg;

    setInputText('');
    setPendingAttachment(null);
    setReplyToMsg(null);
    setIsEmojiPickerVisible(false);
    
    // Optimistic UI update
    const optimisticMsg = { 
      _id: Date.now().toString(), 
      text: textToSend, 
      attachment: attachmentToSend,
      replyTo: currentReply,
      sender: 'me',
      read: false,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => {
      const updated = [...prev, optimisticMsg];
      AsyncStorage.setItem(storageKey, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    
    try {
      const realMsg = await sendApiMessage(chatUser.id, textToSend, attachmentToSend, currentReply, false);
      if (realMsg) {
        setMessages(prev => {
          const updated = prev.map(m => (m._id === optimisticMsg._id || m.id === optimisticMsg._id) ? realMsg : m);
          AsyncStorage.setItem(storageKey, JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      }
    } catch(err) {
      console.log('Failed to send msg to server:', err);
    }
  };

  const handleToggleReaction = async (msgId, emoji) => {
    setMessages(prev => prev.map(m => {
      const currentId = m._id || m.id;
      if (currentId !== msgId) return m;

      const currentReactions = Array.isArray(m.reactions) ? [...m.reactions] : [];
      const userIdx = currentReactions.findIndex(r => (r.user?._id || r.user || r.userId) === currentUserId);

      if (userIdx > -1) {
        if (currentReactions[userIdx].emoji === emoji) {
          currentReactions.splice(userIdx, 1);
        } else {
          currentReactions[userIdx] = { user: currentUserId, emoji };
        }
      } else {
        currentReactions.push({ user: currentUserId, emoji });
      }

      return { ...m, reactions: currentReactions };
    }));

    try {
      await apiReactMessage(msgId, emoji);
    } catch (err) {
      console.log('Reaction sync failed:', err);
    }
  };

  const handleForwardMessage = async (targetUser) => {
    if (!forwardModalMsg || !targetUser._id) return;
    const fMsg = forwardModalMsg;
    setForwardModalMsg(null);

    try {
      await sendApiMessage(
        targetUser._id, 
        fMsg.text || '', 
        fMsg.attachment || null, 
        null, 
        true
      );
      Alert.alert('Forwarded', `Message forwarded to ${targetUser.name}`);
    } catch (err) {
      console.log('Forward error:', err);
      Alert.alert('Error', 'Failed to forward message');
    }
  };

  const renderMessageAttachment = (attachment, isMe) => {
    if (!attachment || !attachment.url) return null;

    if (attachment.type === 'image') {
      return (
        <TouchableOpacity 
          style={{ marginBottom: 6, borderRadius: 12, overflow: 'hidden' }}
          activeOpacity={0.9}
          onPress={() => setPreviewImageModal(attachment.url)}
        >
          <Image 
            source={{ uri: attachment.url }} 
            style={{ width: 210, height: 160, borderRadius: 12, backgroundColor: '#E2E8F0' }} 
            resizeMode="cover" 
          />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity 
        style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : '#F1F5F9', 
          padding: 10, 
          borderRadius: 10, 
          marginBottom: 6,
          borderWidth: 1,
          borderColor: isMe ? 'rgba(255,255,255,0.3)' : '#CBD5E1'
        }}
        onPress={() => {
          if (attachment.url.startsWith('http') || attachment.url.startsWith('data:')) {
            if (Platform.OS === 'web') {
              window.open(attachment.url, '_blank');
            } else {
              Linking.openURL(attachment.url).catch(() => {});
            }
          }
        }}
      >
        <Ionicons name="document-text" size={24} color={isMe ? '#FFFFFF' : '#003366'} style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: isMe ? '#FFFFFF' : '#1E293B' }} numberOfLines={1}>
            {attachment.name || 'Attachment File'}
          </Text>
          <Text style={{ fontSize: 11, color: isMe ? 'rgba(255,255,255,0.8)' : '#64748B' }}>
            Tap to open
          </Text>
        </View>
        <Ionicons name="download-outline" size={18} color={isMe ? '#FFFFFF' : '#003366'} />
      </TouchableOpacity>
    );
  };

  const parseSharedPost = (text, item) => {
    if (item.sharedPost) return item.sharedPost;
    if (!text || typeof text !== 'string') return null;

    if (text.includes('Shared Post:') || text.includes('Check out this post')) {
      let user = 'Alumni Member';
      let content = text;

      if (text.includes('from ') && text.includes(' on Institution Alumni App:')) {
        const parts = text.split('on Institution Alumni App:');
        user = parts[0].replace('Check out this post from', '').trim();
        content = parts[1] ? parts[1].replace(/^["\s]+|["\s]+$/g, '') : text;
      } else if (text.includes('Shared Post:')) {
        content = text.replace('Shared Post:', '').trim().replace(/^["\s]+|["\s]+$/g, '');
      }

      return {
        id: item._id || Date.now().toString(),
        user: user || 'Alumni Member',
        role: 'Institution Alumni',
        avatar: user ? user.substring(0, 2).toUpperCase() : 'AL',
        content: content || 'Shared Alumni Post',
        image: item.attachment?.url || null,
        likes: item.likes || 14,
        comments: item.comments || [
          { user: 'Harshitha', text: 'Great alumni post!' }
        ]
      };
    }
    return null;
  };

  const renderMessage = ({ item }) => {
    const senderIdStr = typeof item.sender === 'object' ? (item.sender._id || item.sender.id) : item.sender;
    const chatUserIdStr = (chatUser.id || chatUser._id || '').toString();

    const isMe = item.sender === 'me' || (senderIdStr && senderIdStr.toString() !== chatUserIdStr);
    const sharedPostData = parseSharedPost(item.text, item);

    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperThem]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{chatUser.initials}</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleThem, sharedPostData ? { padding: 4 } : {}]}>
          {/* Render Attachment if any */}
          {renderMessageAttachment(item.attachment, isMe)}

          {/* Render Instagram-Style Shared Post Card */}
          {sharedPostData ? (
            <TouchableOpacity
              style={{
                backgroundColor: isMe ? '#002B5B' : '#F1F5F9',
                borderRadius: 14,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: isMe ? '#1E40AF' : '#CBD5E1',
                width: 250,
                marginVertical: 2
              }}
              activeOpacity={0.88}
              onPress={() => openPostModal(sharedPostData)}
            >
              {/* Card Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: isMe ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#003366', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>{sharedPostData.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isMe ? '#FFFFFF' : '#0F172A' }} numberOfLines={1}>
                    {sharedPostData.user}
                  </Text>
                  <Text style={{ fontSize: 10, color: isMe ? '#93C5FD' : '#64748B' }}>Shared Alumni Post</Text>
                </View>
                <Ionicons name="logo-instagram" size={16} color={isMe ? '#E0E7FF' : '#003366'} />
              </View>

              {/* Image preview or standard sleek banner */}
              {sharedPostData.image ? (
                <Image source={{ uri: sharedPostData.image }} style={{ width: '100%', height: 140 }} resizeMode="cover" />
              ) : (
                <View style={{ height: 80, backgroundColor: isMe ? '#1E3A8A' : '#E2E8F0', justifyContent: 'center', alignItems: 'center', padding: 10 }}>
                  <Ionicons name="newspaper-outline" size={24} color={isMe ? '#93C5FD' : '#475569'} style={{ marginBottom: 4 }} />
                  <Text style={{ fontSize: 11, fontStyle: 'italic', color: isMe ? '#DBEAFE' : '#334155', textAlign: 'center' }} numberOfLines={2}>
                    "{sharedPostData.content}"
                  </Text>
                </View>
              )}

              {/* Content snippet & Footer */}
              <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 12, color: isMe ? '#F8FAFC' : '#1E293B', fontWeight: '500', marginBottom: 6 }} numberOfLines={2}>
                  {sharedPostData.content}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: isMe ? '#60A5FA' : '#003366' }}>
                    Tap to open post ➔
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="heart-outline" size={13} color={isMe ? '#93C5FD' : '#64748B'} />
                    <Ionicons name="chatbubble-outline" size={13} color={isMe ? '#93C5FD' : '#64748B'} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}>{item.text}</Text>
          )}

          <View style={styles.messageMeta}>
            <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeThem]}>
              {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
            </Text>
            {isMe && (
              <Ionicons 
                name={item.read ? "checkmark-done" : "checkmark-done-outline"} 
                size={14} 
                color={item.read ? "#60A5FA" : "rgba(255,255,255,0.7)"} 
                style={{ marginLeft: 4 }} 
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState({});
  const [isTyping, setIsTyping] = useState(false);

  const addEmoji = (emoji) => {
    setInputText(prev => prev + emoji);
    setIsEmojiPickerVisible(false);
  };

  const handleReaction = (msgId, emoji) => {
    setSelectedReaction(prev => ({ ...prev, [msgId]: emoji }));
  };

  const isWeb = Platform.OS === 'web';
  const webContainerStyle = isWeb 
    ? { 
        alignSelf: 'center', 
        width: '100%', 
        maxWidth: isLargeDesktop ? 900 : isDesktop ? 780 : '100%', 
        flex: 1,
        ...(isDesktop ? {
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: isDarkMode ? '#334155' : '#E2E8F0',
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 0 },
        } : {})
      } 
    : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={webContainerStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Responsive Header — Premium Design */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
              navigation.goBack();
            } else if (navigation && typeof navigation.navigate === 'function') {
              navigation.navigate('Messages');
            } else if (typeof window !== 'undefined' && window.history) {
              window.history.back();
            }
          }} 
          style={styles.backButton}
          activeOpacity={0.6}
        >
          <Ionicons name="arrow-back" size={22} color={isDarkMode ? '#E2E8F0' : '#1E293B'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerProfileRow}
          activeOpacity={0.7}
          onPress={() => {
            if (chatUser.id) {
              navigation.navigate('Profile', { userId: chatUser.id });
            }
          }}
        >
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{chatUser.initials}</Text>
            <View style={styles.onlineStatusDot} />
          </View>
          <View style={styles.headerUserInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{chatUser.name}</Text>
            <Text style={styles.headerStatus} numberOfLines={1}>
              {inputText.trim().length > 0 ? '✏️ typing...' : '● Online'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionBtn} onPress={() => {
            if (chatUser.id) {
              navigation.navigate('Profile', { userId: chatUser.id });
            }
          }}>
            <Ionicons name="videocam-outline" size={22} color={isDarkMode ? '#94A3B8' : '#475569'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn} onPress={() => {
            if (chatUser.id) {
              navigation.navigate('Profile', { userId: chatUser.id });
            }
          }}>
            <Ionicons name="call-outline" size={20} color={isDarkMode ? '#94A3B8' : '#475569'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn} onPress={() => {
            if (chatUser.id) {
              navigation.navigate('Profile', { userId: chatUser.id });
            }
          }}>
            <Ionicons name="ellipsis-vertical" size={20} color={isDarkMode ? '#94A3B8' : '#475569'} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item._id || item.id}
          renderItem={({ item }) => {
            const isMe = getIsMe(item);
            const msgId = item._id || item.id;
            const reactionList = Array.isArray(item.reactions) ? item.reactions : [];
            const reactionSummary = reactionList.map(r => r.emoji).join(' ');
            const senderDisplayName = isMe ? 'You' : (chatUser.name || 'Member');

            return (
              <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperThem]}>
                {!isMe && (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{chatUser.initials}</Text>
                  </View>
                )}
                <View style={{ maxWidth: isDesktop ? '65%' : '82%' }}>
                  <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleThem]}>
                    
                    {/* Forwarded Tag */}
                    {item.isForwarded && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Ionicons name="arrow-redo" size={12} color={isMe ? '#93C5FD' : '#64748B'} style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 11, fontStyle: 'italic', color: isMe ? '#93C5FD' : '#64748B' }}>Forwarded</Text>
                      </View>
                    )}

                    {/* Quoted Reply Preview */}
                    {item.replyTo && item.replyTo.text ? (
                      <View style={{ 
                        borderLeftWidth: 3, 
                        borderLeftColor: isMe ? '#60A5FA' : '#003366', 
                        backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : '#F1F5F9',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        marginBottom: 6
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: isMe ? '#FFFFFF' : '#003366' }}>
                          {item.replyTo.senderName || 'Replied Message'}
                        </Text>
                        <Text style={{ fontSize: 12, color: isMe ? 'rgba(255,255,255,0.85)' : '#475569' }} numberOfLines={1}>
                          {item.replyTo.text}
                        </Text>
                      </View>
                    ) : null}

                    {renderMessageAttachment(item.attachment, isMe)}

                    {item.text ? (
                      <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}>{item.text}</Text>
                    ) : null}

                    <View style={styles.messageMeta}>
                      <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeThem]}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </Text>
                      {isMe && (
                        <Ionicons 
                          name={item.read ? "checkmark-done" : "checkmark-done-outline"} 
                          size={14} 
                          color={item.read ? "#60A5FA" : "rgba(255,255,255,0.7)"} 
                          style={{ marginLeft: 4 }} 
                        />
                      )}
                    </View>
                  </View>

                  {/* Reaction summary badge */}
                  {reactionSummary.length > 0 && (
                    <View style={[{ alignSelf: isMe ? 'flex-end' : 'flex-start', marginTop: -8, backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }]}>
                      <Text style={{ fontSize: 11 }}>{reactionSummary}</Text>
                    </View>
                  )}

                  {/* Action row (Reactions, Reply, Forward) */}
                  <View style={styles.actionRow(isMe)}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleReaction(msgId, '❤️')} activeOpacity={0.6}>
                      <Text style={styles.actionEmoji}>❤️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleReaction(msgId, '👍')} activeOpacity={0.6}>
                      <Text style={styles.actionEmoji}>👍</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleReaction(msgId, '🔥')} activeOpacity={0.6}>
                      <Text style={styles.actionEmoji}>🔥</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.actionBtn} 
                      onPress={() => setReplyToMsg({ _id: msgId, text: item.text || item.attachment?.name || 'Attachment', senderName: senderDisplayName })}
                    >
                      <Ionicons name="arrow-undo-outline" size={isDesktop ? 15 : 13} color="#64748B" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.actionBtn}
                      onPress={() => setForwardModalMsg(item)}
                    >
                      <Ionicons name="arrow-redo-outline" size={isDesktop ? 15 : 13} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />

        {/* Replying-To Preview Banner */}
        {replyToMsg && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#CBD5E1', borderLeftWidth: 4, borderLeftColor: '#003366' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#003366' }}>
                Replying to {replyToMsg.senderName}
              </Text>
              <Text style={{ fontSize: 12, color: '#475569' }} numberOfLines={1}>
                {replyToMsg.text}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyToMsg(null)} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
        )}

        {/* Pending Attachment Preview Bar */}
        {pendingAttachment && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#DBEAFE' }}>
            {pendingAttachment.type === 'image' ? (
              <Image source={{ uri: pendingAttachment.url }} style={{ width: 44, height: 44, borderRadius: 8, marginRight: 10 }} />
            ) : (
              <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                <Ionicons name="document-text" size={22} color="#FFFFFF" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#003366' }} numberOfLines={1}>
                {pendingAttachment.name || 'Attachment attached'}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B' }}>Ready to send</Text>
            </View>
            <TouchableOpacity onPress={() => setPendingAttachment(null)} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* WhatsApp-Style Attachment Popup Menu — Monochrome Icons */}
        {showAttachMenu && (
          <View style={styles.attachMenuContainer}>
            <TouchableOpacity style={styles.attachMenuItem} onPress={() => { setShowAttachMenu(false); handlePickDocument(); }}>
              <View style={styles.attachMenuIcon}>
                <Ionicons name="document-text-outline" size={isDesktop ? 24 : 26} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
              </View>
              <Text style={styles.attachMenuText}>Send a document</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachMenuItem} onPress={() => { handleTakePhoto(); }}>
              <View style={styles.attachMenuIcon}>
                <Ionicons name="camera-outline" size={isDesktop ? 24 : 26} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
              </View>
              <Text style={styles.attachMenuText}>Take a photo or video</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachMenuItem} onPress={() => { setShowAttachMenu(false); handlePickImage(); }}>
              <View style={styles.attachMenuIcon}>
                <Ionicons name="images-outline" size={isDesktop ? 24 : 26} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
              </View>
              <Text style={styles.attachMenuText}>Select media from library</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachMenuItem} onPress={() => { setShowAttachMenu(false); }}>
              <View style={styles.attachMenuIcon}>
                <Text style={styles.attachMenuGifLabel}>GIF</Text>
              </View>
              <Text style={styles.attachMenuText}>Send a GIF</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachMenuItem} onPress={() => { setShowAttachMenu(false); }}>
              <View style={styles.attachMenuIcon}>
                <Ionicons name="at-outline" size={isDesktop ? 24 : 26} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
              </View>
              <Text style={styles.attachMenuText}>Mention a person</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Emoji Quick Picker Row */}
        {isEmojiPickerVisible && (
          <View style={styles.emojiRow}>
            {['😊', '❤️', '👍', '🔥', '🎉', '😂', '👏', '🙏', '😍', '🤔'].map((emoji) => (
              <TouchableOpacity key={emoji} onPress={() => addEmoji(emoji)} style={styles.emojiBtn}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Responsive Input Area — WhatsApp Style: 📎 | "Write a message..." | 🎤 */}
        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.attachBtn} onPress={() => { setShowAttachMenu(!showAttachMenu); setIsEmojiPickerVisible(false); }} activeOpacity={0.6}>
            <Ionicons name={showAttachMenu ? 'close' : 'attach-outline'} size={isDesktop ? 22 : 24} color={showAttachMenu ? '#3B82F6' : '#64748B'} style={showAttachMenu ? {} : { transform: [{ rotate: '-45deg' }] }} />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Write a message..."
            placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
            value={inputText}
            onChangeText={setInputText}
            multiline
            onFocus={() => setShowAttachMenu(false)}
            onKeyPress={(e) => {
              if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          {(inputText.trim().length > 0 || pendingAttachment) ? (
            <TouchableOpacity 
              style={[styles.sendBtn, styles.sendBtnActive]} 
              onPress={sendMessage}
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={isDesktop ? 18 : 16} color="#FFFFFF" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micBtn} activeOpacity={0.6}>
              <Ionicons name="mic-outline" size={isDesktop ? 22 : 24} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Image Full Preview Modal */}
        {previewImageModal && (
          <TouchableOpacity 
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}
            activeOpacity={1}
            onPress={() => setPreviewImageModal(null)}
          >
            <TouchableOpacity 
              style={{ position: 'absolute', top: 40, right: 20, zIndex: 1000 }}
              onPress={() => setPreviewImageModal(null)}
            >
              <Ionicons name="close" size={32} color="#FFFFFF" />
            </TouchableOpacity>
            <Image 
              source={{ uri: previewImageModal }} 
              style={{ width: '90%', height: '80%' }} 
              resizeMode="contain" 
            />
          </TouchableOpacity>
        )}

        {/* Instagram-Style Post Viewer Modal */}
        <Modal visible={Boolean(selectedPostModal)} animationType="slide" transparent={true}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ width: isDesktop ? 550 : '100%', maxHeight: '90%', backgroundColor: theme.card, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
              
              {/* Modal Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.card }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="logo-instagram" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Alumni Post</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedPostModal(null)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Author Info Bar */}
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>
                      {selectedPostModal?.avatar || (selectedPostModal?.user ? selectedPostModal.user.substring(0, 2).toUpperCase() : 'AL')}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{selectedPostModal?.user || 'Alumni Member'}</Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>{selectedPostModal?.role || 'Institution Alumni'}</Text>
                  </View>
                </View>

                {/* Main Post Image */}
                {selectedPostModal?.image ? (
                  <Image 
                    source={{ uri: selectedPostModal.image }} 
                    style={{ width: '100%', height: 300, backgroundColor: '#000' }} 
                    resizeMode="cover" 
                  />
                ) : null}

                {/* Caption Content */}
                <View style={{ padding: 16 }}>
                  <Text style={{ fontSize: 15, color: theme.text, lineHeight: 22, marginBottom: 14 }}>
                    {selectedPostModal?.content}
                  </Text>

                  {/* Actions (Like, Comment, Share) */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 14, marginBottom: 16 }}>
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                      onPress={() => {
                        setModalPostLiked(!modalPostLiked);
                        setModalLikesCount(prev => modalPostLiked ? prev - 1 : prev + 1);
                      }}
                    >
                      <Ionicons 
                        name={modalPostLiked ? "heart" : "heart-outline"} 
                        size={24} 
                        color={modalPostLiked ? "#EF4444" : theme.text} 
                      />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{modalLikesCount}</Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="chatbubble-outline" size={22} color={theme.text} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{modalComments.length}</Text>
                    </View>
                  </View>

                  {/* Comments Section */}
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 10 }}>
                    Comments ({modalComments.length})
                  </Text>

                  {modalComments.map((c, i) => (
                    <View key={i} style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', marginRight: 8, marginTop: 2 }}>
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>{(c.user || 'A').charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', padding: 10, borderRadius: 12 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, marginBottom: 2 }}>{c.user}</Text>
                        <Text style={{ fontSize: 13, color: theme.text }}>{c.text}</Text>
                      </View>
                    </View>
                  ))}

                  {/* Add Comment Bar */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                    <TextInput
                      placeholder="Add a comment..."
                      placeholderTextColor={theme.textMuted}
                      style={{ flex: 1, backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: theme.text, fontSize: 13, marginRight: 8 }}
                      value={modalCommentText}
                      onChangeText={setModalCommentText}
                    />
                    <TouchableOpacity
                      style={{ backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 }}
                      onPress={() => {
                        if (!modalCommentText.trim()) return;
                        setModalComments(prev => [...prev, { user: 'You', text: modalCommentText.trim() }]);
                        setModalCommentText('');
                      }}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Post</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Forward Message Contact Picker Modal */}
        <Modal visible={Boolean(forwardModalMsg)} animationType="slide" transparent={true}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Forward Message</Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Select a contact to forward this message to</Text>
                </View>
                <TouchableOpacity onPress={() => setForwardModalMsg(null)}>
                  <Ionicons name="close-circle" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <TextInput 
                placeholder="Search contact..."
                placeholderTextColor="#94A3B8"
                style={{ backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginBottom: 14, color: theme.text }}
                value={forwardSearch}
                onChangeText={setForwardSearch}
              />

              <FlatList
                data={suggestionsList.filter(s => s.name && s.name.toLowerCase().includes(forwardSearch.toLowerCase()))}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
                    onPress={() => handleForwardMessage(item)}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                        {(item.name || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{item.name}</Text>
                      <Text style={{ fontSize: 12, color: '#64748B' }}>{item.institution || item.department || item.degree || 'Alumni'}</Text>
                    </View>
                    <Ionicons name="send" size={18} color="#003366" />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={{ padding: 20, textAlign: 'center', color: '#94A3B8' }}>No contacts found.</Text>}
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
    </SafeAreaView>
  );
};

const getStyles = (theme, isDesktop = false, isLargeDesktop = false, isDarkMode = false) => {
  const headerHeight = isDesktop ? 64 : 56;
  const bubbleRadius = isDesktop ? 18 : 16;
  const inputPadH = isDesktop ? 16 : 10;
  const msgFontSize = isDesktop ? 15 : 14.5;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#0F172A' : '#F0F2F5',
    },

    /* ── Header ── */
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      height: headerHeight,
      paddingHorizontal: isDesktop ? 20 : 12,
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0',
      ...(isDesktop ? {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      } : {}),
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 4,
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },
    headerProfileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingVertical: 4,
    },
    headerAvatar: {
      width: isDesktop ? 42 : 38,
      height: isDesktop ? 42 : 38,
      borderRadius: isDesktop ? 21 : 19,
      backgroundColor: '#003366',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      position: 'relative',
    },
    onlineStatusDot: {
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: '#10B981',
      position: 'absolute',
      bottom: -1,
      right: -1,
      borderWidth: 2.5,
      borderColor: isDarkMode ? '#1E293B' : '#FFFFFF',
    },
    headerAvatarText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: isDesktop ? 15 : 14,
    },
    headerUserInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    headerName: {
      fontSize: isDesktop ? 16 : 15,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: 0.1,
    },
    headerStatus: {
      fontSize: isDesktop ? 12 : 11,
      color: '#10B981',
      fontWeight: '500',
      marginTop: 1,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isDesktop ? 6 : 2,
    },
    headerActionBtn: {
      width: isDesktop ? 38 : 34,
      height: isDesktop ? 38 : 34,
      borderRadius: isDesktop ? 19 : 17,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,51,102,0.05)',
    },

    /* ── Keyboard & Message List ── */
    keyboardAvoid: {
      flex: 1,
    },
    messageList: {
      padding: isDesktop ? 24 : 16,
      paddingBottom: isDesktop ? 32 : 24,
    },

    /* ── Message Wrappers ── */
    messageWrapper: {
      flexDirection: 'row',
      marginBottom: isDesktop ? 14 : 12,
      alignItems: 'flex-end',
      paddingHorizontal: isDesktop ? 8 : 0,
    },
    messageWrapperMe: {
      justifyContent: 'flex-end',
    },
    messageWrapperThem: {
      justifyContent: 'flex-start',
    },
    avatar: {
      width: isDesktop ? 32 : 28,
      height: isDesktop ? 32 : 28,
      borderRadius: isDesktop ? 16 : 14,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isDesktop ? 10 : 8,
    },
    avatarText: {
      color: theme.card,
      fontSize: isDesktop ? 11 : 10,
      fontWeight: '700',
    },

    /* ── Message Bubbles ── */
    messageBubble: {
      maxWidth: '100%',
      paddingHorizontal: isDesktop ? 16 : 14,
      paddingVertical: isDesktop ? 10 : 8,
      borderRadius: bubbleRadius,
    },
    messageBubbleMe: {
      backgroundColor: '#003366',
      borderBottomRightRadius: 4,
      ...(isDesktop ? {
        shadowColor: '#003366',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      } : {}),
    },
    messageBubbleThem: {
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
      borderWidth: isDarkMode ? 0 : 1,
      borderColor: isDarkMode ? 'transparent' : '#E2E8F0',
      borderBottomLeftRadius: 4,
      ...(isDesktop ? {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      } : {}),
    },
    messageText: {
      fontSize: msgFontSize,
      lineHeight: isDesktop ? 22 : 20,
      letterSpacing: 0.1,
    },
    messageTextMe: {
      color: '#FFFFFF',
    },
    messageTextThem: {
      color: theme.text,
    },
    messageMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 4,
    },
    messageTime: {
      fontSize: isDesktop ? 11 : 10,
    },
    messageTimeMe: {
      color: 'rgba(255,255,255,0.65)',
    },
    messageTimeThem: {
      color: theme.textMuted,
    },

    /* ── Action Row (Reactions, Reply, Forward) ── */
    actionRow: (isMe) => ({
      flexDirection: 'row',
      alignSelf: isMe ? 'flex-end' : 'flex-start',
      marginTop: 4,
      alignItems: 'center',
      gap: isDesktop ? 12 : 10,
    }),
    actionBtn: {
      padding: isDesktop ? 4 : 2,
      minWidth: isDesktop ? 28 : 22,
      alignItems: 'center',
    },
    actionEmoji: {
      fontSize: isDesktop ? 13 : 11,
      opacity: 0.55,
    },

    /* ── Attachment Menu ── */
    attachMenuContainer: {
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#334155' : '#E5E7EB',
      paddingVertical: isDesktop ? 6 : 4,
      ...(isDesktop ? {
        paddingHorizontal: 8,
      } : {}),
    },
    attachMenuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: isDesktop ? 14 : 16,
      paddingHorizontal: isDesktop ? 20 : 24,
      borderRadius: isDesktop ? 10 : 0,
      ...(isDesktop ? {
        marginHorizontal: 4,
      } : {}),
    },
    attachMenuIcon: {
      width: isDesktop ? 28 : 26,
      marginRight: isDesktop ? 18 : 20,
      alignItems: 'center',
    },
    attachMenuText: {
      fontSize: isDesktop ? 15 : 17,
      fontWeight: '400',
      color: isDarkMode ? '#E2E8F0' : '#1F2937',
      letterSpacing: 0.1,
    },
    attachMenuGifLabel: {
      fontSize: isDesktop ? 16 : 18,
      fontWeight: '800',
      color: isDarkMode ? '#94A3B8' : '#6B7280',
    },

    /* ── Emoji Row ── */
    emojiRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
      paddingVertical: isDesktop ? 10 : 8,
      borderTopWidth: 1,
      borderColor: isDarkMode ? '#334155' : '#E2E8F0',
    },
    emojiBtn: {
      padding: isDesktop ? 8 : 6,
      borderRadius: 8,
    },
    emojiText: {
      fontSize: isDesktop ? 24 : 22,
    },

    /* ── Input Area ── */
    inputArea: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: inputPadH,
      paddingVertical: isDesktop ? 10 : 8,
      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#334155' : '#E2E8F0',
      ...(isDesktop ? {
        paddingBottom: 12,
      } : {}),
    },
    attachBtn: {
      width: isDesktop ? 40 : 36,
      height: isDesktop ? 40 : 36,
      borderRadius: isDesktop ? 20 : 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 2,
    },
    micBtn: {
      width: isDesktop ? 40 : 36,
      height: isDesktop ? 40 : 36,
      borderRadius: isDesktop ? 20 : 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 4,
    },
    textInput: {
      flex: 1,
      backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9',
      borderRadius: 24,
      paddingHorizontal: isDesktop ? 18 : 14,
      paddingTop: isDesktop ? 10 : 8,
      paddingBottom: isDesktop ? 10 : 8,
      maxHeight: isDesktop ? 150 : 100,
      fontSize: isDesktop ? 15 : 14.5,
      color: theme.text,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: isDarkMode ? '#334155' : 'transparent',
      ...(isDesktop ? {
        outlineStyle: 'none',
      } : {}),
    },
    sendBtn: {
      width: isDesktop ? 40 : 36,
      height: isDesktop ? 40 : 36,
      borderRadius: isDesktop ? 20 : 18,
      backgroundColor: theme.textMuted,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
      marginBottom: 1,
    },
    sendBtnActive: {
      backgroundColor: '#003366',
      ...(isDesktop ? {
        shadowColor: '#003366',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      } : {}),
    },
  });
};

export default ChatScreen;
