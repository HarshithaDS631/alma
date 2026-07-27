import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal , Platform} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getSuggestions } from '../services/authService';
import { getChatHistory } from '../services/messageService';
import { useFocusEffect } from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';

const initialChats = [];

const MessagesScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const [searchQuery, setSearchQuery] = useState('');
  const [chatList, setChatList] = useState([]);
  const [suggestionsList, setSuggestionsList] = useState([]);

  // Use useFocusEffect to properly handle focus/blur events for polling
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      let interval;

      const loadCachedChats = async () => {
        try {
          const cached = await AsyncStorage.getItem('recent_chats_cache');
          if (cached && isMounted) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setChatList(parsed);
            }
          }
        } catch (err) {
          console.log('Error loading local cached chats:', err);
        }
      };

      const fetchHistory = async () => {
        try {
          const history = await getChatHistory();
          if (history && Array.isArray(history) && isMounted) {
            setChatList(history);
            if (history.length > 0) {
              AsyncStorage.setItem('recent_chats_cache', JSON.stringify(history)).catch(() => {});
            } else {
              AsyncStorage.removeItem('recent_chats_cache').catch(() => {});
            }
          }
        } catch(err) {
          console.log('Error fetching chat history:', err);
        }
      };

      // Load cache instantly, then fetch fresh data
      loadCachedChats().then(() => fetchHistory());

      // Start polling
      interval = setInterval(fetchHistory, 4000);

      return () => {
        isMounted = false;
        if (interval) {
          clearInterval(interval);
        }
      };
    }, [])
  );

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await getSuggestions();
        if (Array.isArray(res)) {
          setSuggestionsList(res);
        } else if (res && res.data) {
          setSuggestionsList(res.data);
        }
      } catch(err) {
        console.log('Error fetching suggestions:', err);
      }
    };
    fetchSuggestions();
  }, []);

  const filteredChats = chatList.filter(chat => {
    if (!searchQuery || !searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = chat.user?.name ? chat.user.name.toLowerCase().includes(q) : false;
    const roleMatch = (chat.user?.institution || chat.user?.degree || chat.user?.department) 
      ? (chat.user.institution || chat.user.degree || chat.user.department).toLowerCase().includes(q) 
      : false;
    const msgMatch = chat.lastMessage?.text ? chat.lastMessage.text.toLowerCase().includes(q) : false;
    return Boolean(nameMatch || roleMatch || msgMatch);
  });

  const [composeModalVisible, setComposeModalVisible] = useState(false);
  const [composeSearch, setComposeSearch] = useState('');

  const filteredSuggestions = suggestionsList.filter(f => f.name && f.name.toLowerCase().includes(composeSearch.toLowerCase()));

  const startNewChat = () => {
    if (!composeSearch.trim()) return;
    const chatUser = {
      id: Date.now().toString(),
      name: composeSearch.trim(),
      role: '',
      initials: composeSearch.trim().charAt(0).toUpperCase()
    };
    const newUser = { 
      user: {
        _id: chatUser.id,
        name: chatUser.name,
        institution: ''
      }, 
      lastMessage: { text: '' }, 
      unreadCount: 0 
    };
    setChatList([newUser, ...chatList]);
    setComposeModalVisible(false);
    setComposeSearch('');
    navigation.navigate('Chat', { user: chatUser });
  };

    const isWeb = Platform.OS === 'web';
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 800, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={webContainerStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header with Back Button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={{ padding: 6, zIndex: 999 }}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            activeOpacity={0.6}
            onPress={() => {
              try {
                const state = navigation?.getState ? navigation.getState() : null;
                const routes = state?.routes || [];
                if (routes.length > 1 && typeof navigation.goBack === 'function') {
                  navigation.goBack();
                } else if (navigation && typeof navigation.navigate === 'function') {
                  navigation.navigate('Main', { screen: 'Home' });
                } else if (typeof window !== 'undefined' && window.history) {
                  window.history.back();
                }
              } catch (e) {
                if (navigation && typeof navigation.navigate === 'function') {
                  navigation.navigate('Main', { screen: 'Home' });
                }
              }
            }} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#002144" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Direct Messages</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} activeOpacity={0.6} onPress={() => setComposeModalVisible(true)}>
          <Ionicons name="create-outline" size={24} color="#003366" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput 
            placeholder="Search contacts or chats..." 
            style={styles.searchInput}
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
      </View>

      {filteredChats.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Chats Found</Text>
          <Text style={styles.emptySubtitle}>Start a conversation with fellow alumni and team members.</Text>
          <TouchableOpacity 
            style={{
              backgroundColor: '#003366',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20,
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            activeOpacity={0.8}
            onPress={() => setComposeModalVisible(true)}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Start a New Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item, index) => (item.user?._id || item.user?.id || item.id || index).toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const u = item.user || {
              _id: item.id || item._id,
              name: item.name,
              institution: item.role || item.institution || item.department || item.degree || ''
            };
            const userName = u.name || item.name || 'User';
            const userInst = u.institution || u.department || u.degree || item.role || '';
            const userId = u._id || u.id || item.id;
            const initials = userName.charAt(0).toUpperCase();
            
            const lastText = typeof item.lastMessage === 'string' ? item.lastMessage : (item.lastMessage?.text || '');
            const timeText = item.lastMessage?.createdAt 
              ? new Date(item.lastMessage.createdAt).toLocaleDateString() 
              : (item.time || '');

            return (
              <TouchableOpacity 
                style={styles.chatItem} 
                activeOpacity={0.7}
                onPress={() => {
                  const updated = chatList.map(c => {
                    const cId = c.user?._id || c.user?.id || c.id;
                    return cId === userId ? { ...c, unreadCount: 0 } : c;
                  });
                  setChatList(updated);
                  navigation.navigate('Chat', { 
                    user: {
                      id: userId,
                      name: userName,
                      role: userInst,
                      initials: initials
                    }
                  });
                }}
              >
                <View style={styles.avatarWrapper}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={styles.onlineDot} />
                </View>
                
                <View style={styles.chatInfo}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.name}>{userName}</Text>
                    <Text style={[styles.time, item.unreadCount > 0 && styles.unreadTime]}>
                      {timeText}
                    </Text>
                  </View>
                  <Text style={styles.role}>{userInst}</Text>
                  <View style={styles.messageRow}>
                    <Text 
                      style={[
                        styles.lastMessage, 
                        item.unreadCount > 0 && styles.unreadLastMessage
                      ]} 
                      numberOfLines={1}
                    >
                      {lastText}
                    </Text>
                    {item.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{item.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      {/* Compose Message Modal */}
      <Modal visible={composeModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Message</Text>
              <TouchableOpacity onPress={() => setComposeModalVisible(false)}>
                <Text style={styles.closeButton}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Search Name to Start Chat:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter name (e.g., John Doe)"
                value={composeSearch}
                onChangeText={setComposeSearch}
                autoFocus
              />
              <FlatList
                data={filteredSuggestions}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => {
                      const chatUser = { 
                        id: item._id, 
                        name: item.name, 
                        role: item.institution || item.department || item.degree || '', 
                        initials: (item.name || '').charAt(0).toUpperCase()
                      };
                      const newUser = { 
                        user: {
                          _id: item._id,
                          name: item.name,
                          institution: item.institution || item.department || item.degree || ''
                        },
                        lastMessage: { text: '' },
                        unreadCount: 0
                      };
                      setChatList([newUser, ...chatList]);
                      setComposeModalVisible(false);
                      setComposeSearch('');
                      navigation.navigate('Chat', { user: chatUser });
                    }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>{(item.name || '').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 16, color: '#1E293B', fontWeight: '600' }}>{item.name}</Text>
                      <Text style={{ fontSize: 13, color: '#64748B' }}>{item.institution || item.department || item.degree || ''}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={{ padding: 12, color: '#94A3B8', textAlign: 'center' }}>No users found.</Text>}
                style={{ maxHeight: 250, marginTop: 12 }}
              />
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.primary,
    letterSpacing: -0.5,
  },
  createBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    marginLeft: 8,
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.background,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: theme.card,
    fontSize: 16,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.success,
    borderWidth: 2,
    borderColor: theme.card,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 15.5,
    fontWeight: '700',
    color: theme.text,
  },
  time: {
    fontSize: 12,
    color: theme.textMuted,
  },
  unreadTime: {
    color: theme.primary,
    fontWeight: '700',
  },
  role: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 13.5,
    color: theme.textSecondary,
    flex: 1,
    marginRight: 10,
  },
  unreadLastMessage: {
    color: theme.text,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: theme.danger,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    color: theme.card,
    fontSize: 10,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#475569',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  closeButton: {
    color: theme.primary,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.text,
    marginBottom: 20,
  },
  modalStartBtn: {
    backgroundColor: theme.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalStartBtnText: {
    color: theme.card,
    fontSize: 16,
    fontWeight: '700',
  }
});

export default MessagesScreen;
