import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, StatusBar, Alert, Modal , Platform} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getSuggestions } from '../services/authService';
import { getChatHistory } from '../services/messageService';
import { useFocusEffect } from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';

const initialChats = [];

const MessagesScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const [showSearch, setShowSearch] = useState(false);
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
      
      {/* Modern Tactile Header Bar (Unified across all pages) */}
      <View style={styles.header}>
        {/* Brand Logo & Title on Left */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <View style={styles.header3DLogoPod}>
            <Ionicons name="school" size={19} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerBrandTitle}>RV ALUMNI</Text>
            <Text style={styles.headerBrandSub}>Direct Messages</Text>
          </View>
        </View>

        {/* Right Action Pods: Compose, Search, Messages (Active), Notifications, Support */}
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setComposeModalVisible(true)}
            activeOpacity={0.75}
            title="Compose New Message"
          >
            <Ionicons name="create-outline" size={20} color={theme.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerIconBtn, showSearch && styles.headerIconBtnActive]}
            onPress={() => setShowSearch(prev => !prev)}
            activeOpacity={0.75}
            title="Search"
          >
            <Ionicons name="search-outline" size={20} color={showSearch ? '#FFFFFF' : theme.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerIconBtn, styles.headerIconBtnActive]}
            onPress={() => {}}
            activeOpacity={0.75}
            title="Messages"
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.75}
            title="Notifications"
          >
            <Ionicons name="notifications-outline" size={20} color={theme.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Contribute')}
            activeOpacity={0.75}
            title="Support"
          >
            <MaterialCommunityIcons name="hand-heart-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expandable Search Input when Search Button is Clicked */}
      {showSearch && (
        <View style={styles.expandedSearchBarRow}>
          <Ionicons name="search" size={17} color="#059669" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.expandedSearchInput}
            placeholder="Search contacts, degrees, or message text..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowSearch(false)} style={{ marginLeft: 8 }}>
            <Text style={{ fontSize: 13, color: '#059669', fontWeight: '700' }}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {filteredChats.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Chats Found</Text>
          <Text style={styles.emptySubtitle}>Start a conversation with fellow alumni and team members.</Text>
          <TouchableOpacity 
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
          contentContainerStyle={{ paddingBottom: 110 }}
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

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.cardBorder || theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.35 : 0.06,
    shadowRadius: 5,
    elevation: 4,
    zIndex: 10,
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
    color: theme.text,
    letterSpacing: -0.3,
  },
  headerBrandSub: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textMuted,
    marginTop: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
    borderWidth: 1,
    borderTopColor: isDarkMode ? '#475569' : '#FFFFFF',
    borderLeftColor: isDarkMode ? '#334155' : '#F1F5F9',
    borderRightColor: isDarkMode ? '#1E293B' : '#E2E8F0',
    borderBottomColor: isDarkMode ? '#0F172A' : '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: isDarkMode ? 0.4 : 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  headerIconBtnActive: {
    backgroundColor: '#059669',
    borderTopColor: '#34D399',
    borderBottomColor: '#047857',
    shadowColor: '#059669',
    shadowOpacity: 0.45,
  },
  expandedSearchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  expandedSearchInput: {
    flex: 1,
    fontSize: 13.5,
    color: theme.text,
    paddingVertical: 0,
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
