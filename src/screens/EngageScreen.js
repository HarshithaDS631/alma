import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, useWindowDimensions, Image, StatusBar, Modal, TextInput, FlatList, Alert , Platform} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getPosts, createPost, reportItem } from '../services/postService';
import { blockUser, getSuggestions, getEvents, createEventApi, getFollowing, toggleFollowUser, getProfile } from '../services/authService';
import { getImageUrl } from '../services/uploadService';
import getInitials from '../lib/getInitials';

const EngageScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const { width } = useWindowDimensions();
  const [currentView, setCurrentView] = useState('feed');
  const [searchText, setSearchText] = useState('');
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [jobPreference, setJobPreference] = useState('Full-Time');
  const [jobPrefModalVisible, setJobPrefModalVisible] = useState(false);
  const [reshareModalVisible, setReshareModalVisible] = useState(false);
  const [likedPosts, setLikedPosts] = useState({});
  const [postText, setPostText] = useState('');
  const [joinedEventsMap, setJoinedEventsMap] = useState({});
  const [eventForm, setEventForm] = useState({
    name: '',
    date: '',
    startTime: '',
    endTime: '',
    notifyPhone: true,
    notifyEmail: false,
    reminder: '1 hour before event',
    description: '',
  });

  const [postsList, setPostsList] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [followedSuggestions, setFollowedSuggestions] = useState({});

  // Fast events fetcher with local cache update
  const fetchEventsFast = useCallback(async () => {
    try {
      setLoadingEvents(true);
      const res = await getEvents();
      if (Array.isArray(res)) {
        const formatted = res.map((e, idx) => {
          const eventDate = e.date ? new Date(e.date) : new Date(Date.now() + (idx + 1) * 86400000 * 3);
          const day = eventDate.getDate();
          const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();
          return {
            id: e._id || e.id || `evt_${idx}`,
            title: e.title || 'Alumni Tech & Innovation Summit',
            date: e.date ? eventDate.toLocaleDateString() : 'Upcoming',
            day: isNaN(day) ? String(15 + idx * 4) : String(day),
            month: month || 'OCT',
            time: e.time || '10:00 AM - 1:00 PM',
            location: e.location || 'RVCE Campus / Hybrid',
            type: e.type || (idx % 2 === 0 ? 'Networking' : 'Masterclass'),
            description: e.description || 'Join alumni leaders and industry mentors for inspiring keynotes and networking.',
            attendeesCount: e.attendeesCount || (35 + idx * 8),
            image: e.image || (idx % 2 === 0 
              ? 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=700&h=350&q=80'
              : 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=700&h=350&q=80'),
          };
        });
        setEvents(formatted);
        AsyncStorage.setItem('cachedAlumniEvents', JSON.stringify(formatted)).catch(() => {});
      }
    } catch (err) {
      console.log('Fast fetch events error:', err.message);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Pre-fill cache on initial load (0ms instantaneous display)
  useEffect(() => {
    AsyncStorage.getItem('cachedAlumniEvents').then(cachedStr => {
      if (cachedStr) {
        try {
          const parsed = JSON.parse(cachedStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEvents(parsed);
          }
        } catch (_) {}
      }
    }).catch(() => {});
    fetchEventsFast();
  }, [fetchEventsFast]);

  useEffect(() => {
    if (route?.params?.view) {
      if (route.params.view === 'events' || route.params.view === 'joinEvent') {
        setCurrentView('joinEvent');
        fetchEventsFast();
      } else if (route.params.view === 'createEvent') {
        setCurrentView('createEvent');
      } else {
        setCurrentView(route.params.view);
      }
    }
  }, [route?.params?.view, fetchEventsFast]);

  useEffect(() => {
    AsyncStorage.getItem('localRegisteredEvents').then(str => {
      if (str) {
        try {
          const arr = JSON.parse(str);
          if (Array.isArray(arr)) {
            const map = {};
            arr.forEach(id => { map[String(id)] = true; });
            setJoinedEventsMap(map);
          }
        } catch (_) {}
      }
    }).catch(() => {});
  }, []);

  const handleJoinEvent = async (event) => {
    const eventId = String(event.id);
    const isAlreadyJoined = !!joinedEventsMap[eventId];
    const newMap = { ...joinedEventsMap, [eventId]: !isAlreadyJoined };
    setJoinedEventsMap(newMap);

    const activeIds = Object.keys(newMap).filter(id => newMap[id]);
    try {
      await AsyncStorage.setItem('localRegisteredEvents', JSON.stringify(activeIds));
    } catch (_) {}

    if (!isAlreadyJoined) {
      if (Platform.OS === 'web') {
        window.alert(`RSVP Confirmed! You are registered for "${event.title}".`);
      } else {
        Alert.alert('RSVP Confirmed', `You are registered for "${event.title}".`);
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert(`Cancelled registration for "${event.title}".`);
      } else {
        Alert.alert('RSVP Cancelled', `Cancelled registration for "${event.title}".`);
      }
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.name.trim()) {
      Alert.alert('Required', 'Please enter an event name.');
      return;
    }
    try {
      const payload = {
        title: eventForm.name.trim(),
        description: eventForm.description.trim() || 'Alumni network meetup and networking opportunity.',
        date: eventForm.date || new Date().toISOString(),
        location: 'RVCE Main Campus',
        type: 'Meetup'
      };

      await createEventApi(payload).catch(() => ({}));

      const newEvt = {
        id: 'evt_' + Date.now(),
        title: payload.title,
        date: new Date().toLocaleDateString(),
        day: String(new Date().getDate()),
        month: new Date().toLocaleString('default', { month: 'short' }).toUpperCase(),
        time: eventForm.startTime ? `${eventForm.startTime} - ${eventForm.endTime}` : '10:00 AM - 1:00 PM',
        location: 'RVCE Main Campus / Hybrid',
        type: 'Meetup',
        description: payload.description,
        attendeesCount: 1,
        image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=700&h=350&q=80'
      };

      const updated = [newEvt, ...events];
      setEvents(updated);
      AsyncStorage.setItem('cachedAlumniEvents', JSON.stringify(updated)).catch(() => {});
      setEventForm({ name: '', date: '', startTime: '', endTime: '', notifyPhone: true, notifyEmail: false, reminder: '1 hour before event', description: '' });
      setCurrentView('joinEvent');
      Alert.alert('Success', 'Event created and published successfully!');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not create event');
    }
  };

  const fetchAllData = useCallback(async () => {
    try {
      // Events is fetched fast and separately; fetch posts, suggestions, following in parallel
      const [postsRes, suggRes, followRes] = await Promise.allSettled([
        getPosts(),
        getSuggestions(),
        getFollowing()
      ]);
      
      if (postsRes.status === 'fulfilled' && postsRes.value) {
        const formatted = postsRes.value
          .filter(p => p.user && !blockedUsers.has(p.user._id))
          .map(p => ({
          id: p._id,
          user_id: p.user._id,
          user: p.user.name || 'Unknown User',
          subtitle: p.user.institution || 'Institution',
          avatar: getInitials(p.user.name, 'AL'),
          image: p.image_url,
          likes: 0,
          time: new Date(p.created_at).toLocaleDateString(),
          content: p.content,
          tags: p.tags || []
        }));
        setPostsList(formatted);
      }

      if (suggRes.status === 'fulfilled' && suggRes.value) {
        const formatted = suggRes.value.map(s => ({
          id: s._id,
          name: s.name,
          avatar: getInitials(s.name, 'AL'),
          subtitle: s.company ? `${s.designation || ''} @ ${s.company}`.trim() : `Batch of ${s.batchYear || ''} • ${s.department || s.institution || ''}`.trim(),
        }));
        setSuggestions(formatted);
      }

      if (followRes.status === 'fulfilled' && followRes.value) {
        const initialFollowed = {};
        followRes.value.forEach(u => { initialFollowed[u._id] = true; });
        setFollowedSuggestions(initialFollowed);
      }

    } catch (err) {
      console.error('Error fetching data:', err.message);
    }
  }, [blockedUsers]);

  useEffect(() => {
    const init = async () => {
      const userStr = await AsyncStorage.getItem('userInfo');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
      await fetchAllData();
    };

    const unsubscribe = navigation.addListener('focus', () => {
      const incoming = route?.params?.view;
      if (incoming === 'events' || incoming === 'joinEvent') {
        setCurrentView('joinEvent');
        setActionSheetVisible(false);
        fetchEventsFast();
      } else if (incoming === 'createEvent') {
        setCurrentView('createEvent');
        setActionSheetVisible(false);
      } else if (incoming) {
        setCurrentView(incoming);
        setActionSheetVisible(false);
      } else {
        setCurrentView('feed');
        setActionSheetVisible(true);
      }
      init();
    });
    init();
    return unsubscribe;
  }, [navigation, fetchAllData, route?.params?.view, fetchEventsFast]);

  const handleDismiss = () => {
    setActionSheetVisible(false);
    navigation.navigate('Home');
  };

  const handleCreatePost = async () => {
    if (!postText.trim()) {
      Alert.alert('Required', 'Please enter some thoughts to share.');
      return;
    }
    
    try {
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to post.');
        return;
      }

      await createPost({ 
        content: postText,
        image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&h=400&q=80' // default demo image
      });

      setPostText('');
      setCurrentView('feed');
      fetchAllData();
      Alert.alert('Success', 'Your post has been shared successfully!');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const toggleSuggestionFollow = async (id) => {
    try {
      setFollowedSuggestions(prev => ({ ...prev, [id]: !prev[id] }));
      await toggleFollowUser(id);
    } catch (err) {
      setFollowedSuggestions(prev => ({ ...prev, [id]: !prev[id] }));
      console.error('Follow error', err);
    }
  };

  const toggleLike = (id) => setLikedPosts(prev => ({ ...prev, [id]: !prev[id] }));

  // Responsive web container styling
  const isDesktop = width >= 1024;
  const isWeb = Platform.OS === 'web';
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: isDesktop ? 1200 : 800, flex: 1 } : { flex: 1 };

  // ===== CREATE EVENT VIEW =====
  if (currentView === 'createEvent') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={webContainerStyle}>
          <View style={styles.subScreenHeader}>
            <TouchableOpacity onPress={() => setCurrentView('feed')}>
              <Ionicons name="close" size={24} color="#002144" />
            </TouchableOpacity>
            <Text style={styles.subScreenTitle}>Create Event</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={styles.createEventBody}>
            <Text style={styles.fieldLabel}>Event Name</Text>
            <TextInput style={styles.fieldInput} placeholder="Enter event name" placeholderTextColor="#94A3B8" value={eventForm.name} onChangeText={t => setEventForm({...eventForm, name: t})} />

            <View style={styles.dateTimeRow}>
              <View style={styles.dateField}>
                <Ionicons name="calendar-outline" size={18} color="#64748B" />
                <Text style={styles.dateTimeText}>{eventForm.date}</Text>
              </View>
              <View style={styles.colorDots}>
                <View style={[styles.colorDot, { backgroundColor: '#CBD5E1' }]} />
                <View style={[styles.colorDot, { backgroundColor: theme.primary }]} />
                <View style={[styles.colorDot, { backgroundColor: '#CBD5E1' }]} />
                <View style={[styles.colorDot, { backgroundColor: '#CBD5E1' }]} />
              </View>
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Ionicons name="time-outline" size={18} color="#64748B" />
                <Text style={styles.dateTimeText}>{eventForm.startTime}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#94A3B8" />
              <View style={styles.timeField}>
                <Text style={styles.dateTimeText}>{eventForm.endTime}</Text>
              </View>
            </View>

            <View style={styles.hostRow}>
              <View style={styles.hostAvatar}><Text style={styles.hostAvatarText}>{getInitials(currentUser?.name, 'AL')}</Text></View>
              <Text style={styles.hostName}>{currentUser?.name || 'User'}</Text>
              <Ionicons name="chevron-down" size={16} color="#002144" />
            </View>

            <Text style={styles.fieldLabel}>Get notified on</Text>
            <View style={styles.notifyRow}>
              <TouchableOpacity style={[styles.notifyOption, eventForm.notifyPhone && styles.notifyActive]} onPress={() => setEventForm({...eventForm, notifyPhone: !eventForm.notifyPhone})}>
                <Text style={[styles.notifyText, eventForm.notifyPhone && styles.notifyActiveText]}>On phone</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.notifyOption, eventForm.notifyEmail && styles.notifyActive]} onPress={() => setEventForm({...eventForm, notifyEmail: !eventForm.notifyEmail})}>
                <Text style={[styles.notifyText, eventForm.notifyEmail && styles.notifyActiveText]}>Email</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Set reminder</Text>
            <View style={styles.fieldInput}><Text style={{ color: theme.primary, fontSize: 15 }}>{eventForm.reminder}</Text></View>

            <Text style={styles.fieldLabel}>Add description</Text>
            <View style={styles.descriptionWrapper}>
              <TextInput style={[styles.fieldInput, { height: 100, textAlignVertical: 'top', paddingTop: 12, flex: 1 }]} placeholder="Add description" placeholderTextColor="#94A3B8" multiline value={eventForm.description} onChangeText={t => setEventForm({...eventForm, description: t})} />
              <Ionicons name="pencil-outline" size={16} color="#94A3B8" style={styles.descPencilIcon} />
            </View>

            <TouchableOpacity style={styles.createEventButton} onPress={handleCreateEvent}>
              <Text style={styles.createEventButtonText}>Create & Publish Event</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ===== JOIN EVENT VIEW (FAST LOADING & ULTRA-ATTRACTIVE) =====
  if (currentView === 'joinEvent') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={webContainerStyle}>
          {/* Subscreen Header with Attractive Host Event Action */}
          <View style={styles.eventsHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => setCurrentView('feed')} style={styles.backCircleBtn}>
                <Ionicons name="arrow-back" size={20} color={theme.text} />
              </TouchableOpacity>
              <View>
                <Text style={styles.eventsHeaderTitle}>Alumni Events & Meetups</Text>
                <Text style={styles.eventsHeaderSubtitle}>Reunions, workshops & chapter meets</Text>
              </View>
            </View>

            {/* Glowing Attractive Host Event Pill Button with + Icon */}
            <TouchableOpacity 
              onPress={() => setCurrentView('createEvent')} 
              style={styles.hostEventPillBtn}
              activeOpacity={0.82}
            >
              <View style={styles.hostEventIconPod}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.hostEventPillText}>Host Event</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={events}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 18, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              loadingEvents ? (
                <View style={{ gap: 16, marginTop: 10 }}>
                  {[1, 2, 3].map(n => (
                    <View key={n} style={[styles.joinEventCard, { height: 130, opacity: 0.7, justifyContent: 'center' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <View style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: '#E2E8F0' }} />
                        <View style={{ flex: 1, gap: 10 }}>
                          <View style={{ width: '70%', height: 16, borderRadius: 6, backgroundColor: '#E2E8F0' }} />
                          <View style={{ width: '45%', height: 12, borderRadius: 4, backgroundColor: '#E2E8F0' }} />
                          <View style={{ width: '35%', height: 12, borderRadius: 4, backgroundColor: '#E2E8F0' }} />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={{ padding: 48, alignItems: 'center', backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, marginTop: 20 }}>
                  <Ionicons name="calendar-outline" size={54} color="#94A3B8" />
                  <Text style={{ marginTop: 14, fontSize: 17, fontWeight: '800', color: theme.text }}>No Upcoming Events</Text>
                  <Text style={{ marginTop: 6, fontSize: 13, color: '#64748B', textAlign: 'center', maxWidth: 320 }}>
                    Be the first alumni to host a meetup, networking dinner, or webinar for your peers!
                  </Text>
                  <TouchableOpacity
                    onPress={() => setCurrentView('createEvent')}
                    style={[styles.hostEventPillBtn, { marginTop: 18, paddingHorizontal: 20 }]}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.hostEventPillText}>Host First Event</Text>
                  </TouchableOpacity>
                </View>
              )
            }
            renderItem={({ item }) => {
              const isJoined = !!joinedEventsMap[String(item.id)];
              return (
                <View style={styles.joinEventCard}>
                  {/* Event Cover Image with Type Badge */}
                  <View style={{ position: 'relative' }}>
                    <Image source={{ uri: item.image }} style={styles.joinEventImage} />
                    <View style={styles.eventTypeBadge}>
                      <Text style={styles.eventTypeText}>{item.type || 'Event'}</Text>
                    </View>
                  </View>

                  {/* Date Pod */}
                  <View style={styles.eventDatePod}>
                    <Text style={styles.eventDateDay}>{item.day || '28'}</Text>
                    <Text style={styles.eventDateMonth}>{item.month || 'OCT'}</Text>
                  </View>

                  {/* Event Info Details */}
                  <View style={styles.joinEventInfo}>
                    <Text style={styles.joinEventTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                      <Ionicons name="time-outline" size={13} color="#64748B" />
                      <Text style={styles.joinEventDate}>{item.time || item.date}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                      <Ionicons name="location-outline" size={13} color="#64748B" />
                      <Text style={styles.joinEventLocation} numberOfLines={1}>{item.location}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                      <Ionicons name="people-outline" size={12} color="#059669" />
                      <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#059669' }}>
                        {item.attendeesCount || 24} Alumni Registered
                      </Text>
                    </View>
                  </View>

                  {/* Responsive RSVP Action Button */}
                  <TouchableOpacity 
                    style={[styles.joinBtn, isJoined && styles.joinedBtnActive]}
                    onPress={() => handleJoinEvent(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.joinBtnText, isJoined && styles.joinedBtnTextActive]}>
                      {isJoined ? 'Going ✓' : 'RSVP'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />

          {/* Ultra-Attractive Floating Action Pod for Creating Events */}
          <TouchableOpacity
            style={styles.attractiveEventsFab}
            onPress={() => setCurrentView('createEvent')}
            activeOpacity={0.88}
          >
            <View style={styles.fabIconPod}>
              <Ionicons name="sparkles" size={14} color="#FBBF24" style={{ marginRight: 3 }} />
              <Ionicons name="add" size={19} color="#FFFFFF" />
            </View>
            <Text style={styles.fabLabel}>Host Event</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===== MAIN FEED VIEW =====

  const filteredPosts = postsList.filter(p => 
    !blockedUsers.has(p.user_id) && 
    ((p.content || '').toLowerCase().includes((searchText || '').toLowerCase()) || 
     (p.user || '').toLowerCase().includes((searchText || '').toLowerCase()))
  );

  const feedContent = (
    <View style={{ flex: 1, maxWidth: isDesktop ? 750 : '100%' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Post Creator UI for Feed */}
        <View style={{ backgroundColor: '#FFFFFF', padding: 16, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{getInitials(currentUser?.name, 'AL')}</Text>
            </View>
            <TouchableOpacity style={{ flex: 1, height: 44, borderRadius: 22, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, justifyContent: 'center' }} onPress={() => navigation.navigate('PostCreation')}>
              <Text style={{ color: '#94A3B8', fontSize: 14.5 }}>Share an update, milestone, or question...</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 8 }}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => navigation.navigate('PostCreation')}>
              <Ionicons name="image" size={20} color="#10B981" />
              <Text style={{ color: '#475569', fontSize: 13, fontWeight: '600' }}>Media</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => setCurrentView('joinEvent')}>
              <Ionicons name="calendar" size={20} color="#F59E0B" />
              <Text style={{ color: '#475569', fontSize: 13, fontWeight: '600' }}>Event</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => navigation.navigate('PostCreation')}>
              <Ionicons name="newspaper" size={20} color="#3B82F6" />
              <Text style={{ color: '#475569', fontSize: 13, fontWeight: '600' }}>Article</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts List */}
        {filteredPosts.map((post, index) => (
          <React.Fragment key={post.id}>
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.postAvatar}><Text style={styles.postAvatarText}>{post.avatar}</Text></View>
                <View style={[styles.postInfo, { flex: 1 }]}>
                  <Text style={styles.postUserName}>
                    {post.user}
                    {post.tags && post.tags.length > 0 && (
                      <Text style={{fontWeight: '400', color: '#64748B'}}>
                        {' is with '}
                        <Text style={{fontWeight: '600', color: '#0F172A'}}>{post.tags[0].name}</Text>
                        {post.tags.length > 1 && ` and ${post.tags.length - 1} other${post.tags.length > 2 ? 's' : ''}`}
                      </Text>
                    )}
                  </Text>
                  <Text style={styles.postSubtitle}>{post.subtitle}</Text>
                </View>
                <TouchableOpacity style={styles.followBtn}>
                  <Text style={styles.followBtnText}>+ Follow</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => {
                  Alert.alert('Report Options', 'Select an action for this content', [
                    { text: 'Report Post', style: 'destructive', onPress: async () => {
                      if (!currentUser) return;
                      await reportItem({ reportedItemId: post.id, itemType: 'post', reason: 'Flagged' });
                    }},
                    { text: 'Block User', style: 'destructive', onPress: async () => {
                      if (!currentUser) return;
                      await blockUser(post.user_id);
                      setBlockedUsers(prev => new Set([...prev, post.user_id]));
                    }},
                    { text: 'Cancel', style: 'cancel' }
                  ]);
                }}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <View style={styles.postContentContainer}>
                <Text style={styles.postContentText}>{post.content}</Text>
              </View>
              {post.image ? (
                <Image source={{ uri: post.image }} style={[styles.postImage, { width: isDesktop ? 700 : width, height: isDesktop ? 450 : width * 0.65 }]} />
              ) : null}
              <View style={styles.postActions}>
                <View style={styles.leftActions}>
                  <TouchableOpacity onPress={() => toggleLike(post.id)}>
                    <Ionicons name={likedPosts[post.id] ? "heart" : "heart-outline"} size={24} color={likedPosts[post.id] ? "#EF4444" : "#0F172A"} />
                  </TouchableOpacity>
                  <TouchableOpacity><Ionicons name="chatbubble-outline" size={22} color="#0F172A" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => setReshareModalVisible(true)}>
                    <Ionicons name="paper-plane-outline" size={22} color="#0F172A" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity><Ionicons name="bookmark-outline" size={22} color="#0F172A" /></TouchableOpacity>
              </View>
            </View>

            {/* Show suggestions on mobile after first post */}
            {index === 0 && !isDesktop && (
              <View style={styles.suggestionsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Suggestions for you</Text>
                  <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
                  {suggestions.map(s => (
                    <View key={s.id} style={styles.suggestionCard}>
                      <View style={styles.suggestionAvatar}><Text style={styles.suggestionAvatarText}>{s.avatar}</Text></View>
                      <Text style={styles.suggestionName}>{s.name}</Text>
                      <TouchableOpacity 
                        style={[styles.followSmallBtn, followedSuggestions[s.id] && styles.followedBtn]}
                        onPress={() => toggleSuggestionFollow(s.id)}
                      >
                        <Text style={[styles.followSmallText, followedSuggestions[s.id] && styles.followedText]}>{followedSuggestions[s.id] ? 'Following' : 'Follow'}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );

  const sidePanel = isDesktop ? (
    <View style={{ width: 350, marginLeft: 24, paddingVertical: 16 }}>
      <View style={[styles.suggestionsSection, { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, elevation: 1, shadowOpacity: 0.1, shadowRadius: 4, marginTop: 0 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Suggestions for you</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
        </View>
        {suggestions.map(s => (
          <View key={s.id} style={[styles.suggestionCard, { width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: 'transparent', padding: 0, borderWidth: 0 }]}>
            <View style={[styles.suggestionAvatar, { width: 40, height: 40, borderRadius: 20, marginBottom: 0, marginRight: 12 }]}><Text style={styles.suggestionAvatarText}>{s.avatar}</Text></View>
            <Text style={[styles.suggestionName, { flex: 1, textAlign: 'left', marginBottom: 0 }]}>{s.name}</Text>
            <TouchableOpacity 
              style={[styles.followSmallBtn, followedSuggestions[s.id] && styles.followedBtn]}
              onPress={() => toggleSuggestionFollow(s.id)}
            >
              <Text style={[styles.followSmallText, followedSuggestions[s.id] && styles.followedText]}>{followedSuggestions[s.id] ? 'Following' : 'Follow'}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={[styles.suggestionsSection, { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginTop: 16, elevation: 1, shadowOpacity: 0.1, shadowRadius: 4 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Events</Text>
          <TouchableOpacity onPress={() => setCurrentView('joinEvent')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {events.slice(0, 4).map(e => {
          const isJoined = !!joinedEventsMap[String(e.id)];
          return (
            <TouchableOpacity 
              key={e.id} 
              onPress={() => setCurrentView('joinEvent')}
              style={[styles.joinEventCard, { borderWidth: 0, paddingHorizontal: 0, paddingVertical: 8, marginBottom: 0, flexDirection: 'row', alignItems: 'center' }]}
              activeOpacity={0.7}
            >
              <Image source={{ uri: e.image }} style={[styles.joinEventImage, { width: 44, height: 44, borderRadius: 8, marginRight: 10 }]} />
              <View style={[styles.joinEventInfo, { flex: 1 }]}>
                <Text style={[styles.joinEventTitle, { fontSize: 13, fontWeight: '700' }]} numberOfLines={1}>{e.title}</Text>
                <Text style={[styles.joinEventDate, { fontSize: 11, color: '#64748B' }]}>{e.date} • {e.location}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.joinBtn, { paddingHorizontal: 10, paddingVertical: 5 }, isJoined && { backgroundColor: '#DEF7EC', borderWidth: 1, borderColor: '#10B981' }]}
                onPress={() => handleJoinEvent(e)}
                activeOpacity={0.8}
              >
                <Text style={[styles.joinBtnText, { fontSize: 11 }, isJoined && { color: '#03543F' }]}>
                  {isJoined ? 'Joined ✓' : 'Join'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="#FFFFFF" />
      <View style={webContainerStyle}>
        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          {/* Left – User avatar */}
          <TouchableOpacity
            style={[styles.headerAvatar, { overflow: 'hidden', backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center' }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile')}
          >
            {(currentUser?.avatar_url || currentUser?.profilePicture) ? (
              <Image 
                source={{ uri: getImageUrl(currentUser.avatar_url || currentUser.profilePicture) }} 
                style={{ width: '100%', height: '100%', borderRadius: 17 }} 
              />
            ) : (
              <Text style={styles.headerAvatarText}>{getInitials(currentUser?.name, 'AL')}</Text>
            )}
          </TouchableOpacity>

          {/* Center – Search bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search posts..."
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
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#003366" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color="#003366" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
          {feedContent}
          {sidePanel}
        </View>
      </View>

      {/* FAB */}
      {!isDesktop && (
        <TouchableOpacity style={styles.fab} onPress={() => setActionSheetVisible(true)}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Action Sheet Modal */}
      <Modal visible={actionSheetVisible} transparent animationType="slide">
        <View style={styles.actionSheetOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={handleDismiss} />
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHandle} />
            <View style={styles.actionSheetTitleRow}>
              <Text style={styles.actionSheetTitle}>Create New</Text>
            </View>
            <TouchableOpacity style={styles.actionItem} onPress={() => { setActionSheetVisible(false); navigation.navigate('PostCreation'); }}>
              <Ionicons name="create-outline" size={22} color="#003366" style={{ marginRight: 4 }} />
              <Text style={styles.actionItemText}>Post</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={() => { setActionSheetVisible(false); setCurrentView('joinEvent'); }}>
              <Ionicons name="calendar-outline" size={22} color="#003366" style={{ marginRight: 4 }} />
              <Text style={styles.actionItemText}>Join Event</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Instagram-style Reshare Modal */}
      <Modal visible={reshareModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setReshareModalVisible(false)} />
          <View style={styles.reshareSheet}>
            <View style={styles.actionSheetHandle} />
            <Text style={styles.reshareTitle}>Share</Text>
            
            {/* Search connection bar */}
            <View style={styles.reshareSearchBar}>
              <Ionicons name="search-outline" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput 
                placeholder="Search connections..." 
                placeholderTextColor="#94A3B8" 
                style={styles.reshareSearchInput}
              />
            </View>

            {/* List of recent posts to reshare to feed */}
            <Text style={styles.reshareSectionHeader}>Reshare Post to Feed</Text>
            {postsList.slice(0, 2).map(post => (
              <View key={post.id} style={styles.reshareRow}>
                <View style={styles.resharePostPreview}>
                  <View style={styles.smallAvatar}><Text style={styles.smallAvatarText}>{post.avatar}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reshareUser}>{post.user}</Text>
                    <Text style={styles.reshareContent} numberOfLines={1}>{post.content}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.reshareBtn}>
                  <Text style={styles.reshareBtnText}>Reshare</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* List of connections to DM */}
            <Text style={styles.reshareSectionHeader}>Send in Message</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dmScroll}>
              {[{id: 's1', name: 'Alok Nath', avatar: 'AN'}, {id: 's2', name: 'Shruti V', avatar: 'SV'}, {id: 's3', name: 'Ritika M', avatar: 'RM'}].map(s => (
                <View key={s.id} style={styles.dmCard}>
                  <View style={styles.suggestionAvatar}><Text style={styles.suggestionAvatarText}>{s.avatar}</Text></View>
                  <Text style={styles.dmName} numberOfLines={1}>{s.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 100 },

  // Post Card
  postCard: { backgroundColor: theme.card, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  postAvatarText: { color: theme.card, fontSize: 14, fontWeight: 'bold' },
  postInfo: { flex: 1 },
  postUserName: { fontSize: 15, fontWeight: '700', color: theme.text },
  postSubtitle: { fontSize: 12, color: theme.textSecondary, marginTop: 1 },
  followBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  followBtnText: { color: theme.primary, fontWeight: '700', fontSize: 13 },
  postImage: { backgroundColor: '#F1F5F9' },
  postActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  leftActions: { flexDirection: 'row', alignItems: 'center', gap: 18 },

  // Suggestions
  suggestionsSection: { backgroundColor: theme.card, paddingVertical: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
  seeAll: { fontSize: 13, color: theme.primary, fontWeight: '600' },
  suggestionsScroll: { paddingHorizontal: 20, gap: 12 },
  suggestionCard: { width: 120, backgroundColor: theme.background, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  suggestionAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.textSecondary, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  suggestionAvatarText: { color: theme.card, fontSize: 16, fontWeight: '700' },
  suggestionName: { fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 8 },
  followSmallBtn: { backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 },
  followSmallText: { color: theme.card, fontSize: 12, fontWeight: '700' },
  followedBtn: { backgroundColor: '#F1F5F9' },
  followedText: { color: theme.textSecondary },

  // FAB
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  aiFloatingBtn: { position: 'absolute', bottom: 24, left: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.border, gap: 6, elevation: 3 },
  aiFloatingText: { fontSize: 12, fontWeight: '600', color: theme.primary },

  // Action Sheet
  actionSheetOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
  actionSheet: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40 },
  actionSheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  actionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  actionItemText: { fontSize: 16, fontWeight: '600', color: theme.text },

  // Write Post
  writePostHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  writePostHeaderCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  writePostHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  smallAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
  smallAvatarText: { color: theme.card, fontSize: 12, fontWeight: '700' },
  anyoneText: { fontSize: 14, fontWeight: '700', color: theme.primary },
  postButton: { backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  postButtonText: { color: theme.card, fontWeight: '700', fontSize: 14 },
  writePostBody: { flex: 1, padding: 20 },
  writePostInput: { fontSize: 16, color: theme.primary, lineHeight: 24, flex: 1 },
  writePostFooter: { padding: 20, borderTopWidth: 1, borderTopColor: theme.border },
  aiButton: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: theme.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  aiButtonText: { fontSize: 13, fontWeight: '600', color: theme.primary },

  // Create Event
  subScreenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  subScreenTitle: { fontSize: 18, fontWeight: '800', color: theme.primary },
  createEventBody: { padding: 20, paddingBottom: 40 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8, marginTop: 16 },
  fieldInput: { backgroundColor: theme.background, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 16, height: 48, justifyContent: 'center', fontSize: 15, color: theme.primary },
  dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  dateField: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.background, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 16, height: 48, flex: 1, marginRight: 12 },
  colorDots: { flexDirection: 'row', gap: 6 },
  colorDot: { width: 16, height: 16, borderRadius: 8 },
  dateTimeText: { fontSize: 15, color: theme.primary, fontWeight: '500' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  timeField: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.background, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 16, height: 48, flex: 1 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  hostAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
  hostAvatarText: { color: theme.card, fontSize: 13, fontWeight: '700' },
  hostName: { fontSize: 15, fontWeight: '600', color: theme.primary },
  notifyRow: { flexDirection: 'row', gap: 10 },
  notifyOption: { borderWidth: 1, borderColor: theme.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.card },
  notifyActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  notifyText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  notifyActiveText: { color: theme.card },
  createEventButton: { backgroundColor: theme.primary, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  createEventButtonText: { color: theme.card, fontSize: 16, fontWeight: '700' },

  // Events Subscreen Header & Attractive Host Button
  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  eventsHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.3,
  },
  eventsHeaderSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 1,
  },
  hostEventPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#002B5C',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    shadowColor: '#002B5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: 6,
  },
  hostEventIconPod: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostEventPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // Floating Action Button (FAB)
  attractiveEventsFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#002B5C',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 30,
    shadowColor: '#002B5C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#60A5FA',
    gap: 8,
  },
  fabIconPod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // Join Event Card
  joinEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  joinEventImage: {
    width: 82,
    height: 82,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  eventTypeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 43, 92, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  eventTypeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  eventDatePod: {
    width: 44,
    height: 48,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventDateDay: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E40AF',
    lineHeight: 18,
  },
  eventDateMonth: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  joinEventInfo: { flex: 1 },
  joinEventTitle: { fontSize: 14.5, fontWeight: '800', color: theme.text, lineHeight: 19 },
  joinEventDate: { fontSize: 12, color: theme.textSecondary },
  joinEventLocation: { fontSize: 12, color: theme.textMuted },
  joinBtn: {
    backgroundColor: '#002B5C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  joinBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  joinedBtnActive: {
    backgroundColor: '#DEF7EC',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  joinedBtnTextActive: {
    color: '#03543F',
  },

  // Custom alignment styles
  writePostFooterIcons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  footerIconBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  descriptionWrapper: { position: 'relative', justifyContent: 'flex-end' },
  descPencilIcon: { position: 'absolute', bottom: 16, right: 16 },
  actionSheetTitleRow: { paddingVertical: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionSheetTitle: { fontSize: 18, fontWeight: '800', color: theme.text, textAlign: 'center' },

  // New Modals Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: theme.primary },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingHorizontal: 8 },
  modalItemText: { fontSize: 16, fontWeight: '600', color: theme.text },
  selectedModalItem: { backgroundColor: theme.background },
  selectedModalItemText: { color: theme.primary, fontWeight: '700' },

  reshareSheet: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, minHeight: 420 },
  reshareTitle: { fontSize: 18, fontWeight: '800', color: theme.text, textAlign: 'center', marginTop: 16, marginBottom: 16 },
  reshareSearchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 12, height: 38, marginBottom: 16 },
  reshareSearchInput: { flex: 1, fontSize: 14, color: theme.text, paddingVertical: 0 },
  reshareSectionHeader: { fontSize: 14, fontWeight: '700', color: theme.textSecondary, marginTop: 12, marginBottom: 10 },
  reshareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  resharePostPreview: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  reshareUser: { fontSize: 14, fontWeight: '700', color: theme.text },
  reshareContent: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  reshareBtn: { backgroundColor: theme.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  reshareBtnText: { color: theme.card, fontSize: 12, fontWeight: '700' },
  dmScroll: { gap: 12, paddingVertical: 4 },
  dmCard: { alignItems: 'center', width: 70 },
  dmName: { fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 4 },
  postContentContainer: { paddingHorizontal: 14, paddingVertical: 10 },
  postContentText: { fontSize: 14, color: theme.text, lineHeight: 20 },

  webModalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
  webModalContainer: { width: 500, backgroundColor: theme.card, borderRadius: 16, padding: 24, maxHeight: '80%', overflow: 'hidden' },
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
    backgroundColor: theme.background,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 8,
    marginRight: 12,
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
});

export default EngageScreen;
