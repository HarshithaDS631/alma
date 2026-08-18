import React, { useState, useMemo, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, StatusBar, Alert, Modal, FlatList, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const AdminEventsScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const isSuperAdmin = route?.params?.isSuperAdmin || false;
  const isFocused = useIsFocused();
  const [selectedInstitution, setSelectedInstitution] = useState(global.selectedInstitution || 'All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [commentModalEvent, setCommentModalEvent] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Event form states
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventAttachment, setEventAttachment] = useState(null);

  const [eventList, setEventList] = useState([]);

  // Sync selected institution with global value when screen is focused
  useEffect(() => {
    if (isFocused && isSuperAdmin && global.selectedInstitution) {
      setSelectedInstitution(global.selectedInstitution);
    }
  }, [isFocused, isSuperAdmin]);

  const handleLike = (eventId) => {
    setEventList(prev => prev.map(ev => {
      if (ev.id === eventId) {
        return {
          ...ev,
          liked: !ev.liked,
          likes: ev.liked ? ev.likes - 1 : ev.likes + 1,
        };
      }
      return ev;
    }));
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !commentModalEvent) return;
    setEventList(prev => prev.map(ev => {
      if (ev.id === commentModalEvent.id) {
        return {
          ...ev,
          comments: [
            { id: Date.now().toString(), user: 'Admin', text: newComment.trim(), time: 'Just now' },
            ...ev.comments,
          ],
        };
      }
      return ev;
    }));
    setNewComment('');
  };

  const handlePostEvent = () => {
    if (!eventTitle.trim() || !eventDate.trim()) {
      Alert.alert('Required', 'Please fill in at least the title and date.');
      return;
    }
    const newEvent = {
      id: Date.now().toString(),
      title: eventTitle,
      date: eventDate,
      location: eventLocation || 'TBD',
      description: eventDescription || 'No description provided.',
      views: 0,
      likes: 0,
      liked: false,
      comments: [],
      reshares: 0,
      attachment: eventAttachment,
      institution: isSuperAdmin ? selectedInstitution === 'All' ? 'RVCE' : selectedInstitution : 'RVITM',
    };
    setEventList([newEvent, ...eventList]);
    setEventTitle('');
    setEventDate('');
    setEventLocation('');
    setEventDescription('');
    setEventAttachment(null);
    setShowEditor(false);
    Alert.alert('Success', 'Your event has been posted!');
  };

  const handleReshare = (eventTitle) => {
    Alert.alert('Reshared', `"${eventTitle}" has been reshared to your feed.`);
  };

  const handleShare = (eventTitle) => {
    Alert.alert('Share', `Share link for "${eventTitle}" copied to clipboard.`);
  };

  const filteredEvents = useMemo(() => {
    let data = eventList;
    if (isSuperAdmin && selectedInstitution !== 'All') {
      data = data.filter((event) => event.institution === selectedInstitution);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      data = data.filter(
        (event) =>
          event.title.toLowerCase().includes(q) ||
          event.description.toLowerCase().includes(q) ||
          event.location.toLowerCase().includes(q)
      );
    }
    return data;
  }, [eventList, isSuperAdmin, selectedInstitution, searchQuery]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (isSuperAdmin && selectedInstitution !== 'All') count++;
    return count;
  }, [isSuperAdmin, selectedInstitution]);

  const handleResetFilters = () => {
    if (isSuperAdmin) {
      setSelectedInstitution('All');
      global.selectedInstitution = 'All';
    }
  };

  // Get the latest comment data for the modal
  const currentModalEvent = commentModalEvent ? eventList.find(e => e.id === commentModalEvent.id) : null;

  // ===== EVENT DETAIL VIEW =====
  if (selectedEvent) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        
        {/* Detail Header */}
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedEvent(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#003366" />
          </TouchableOpacity>
          <Text style={styles.detailTitleText}>Event Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {/* Top Card */}
          <View style={styles.detailTopCard}>
            <View style={styles.detailIconCircle}>
              <Ionicons name="calendar" size={32} color="#003366" />
            </View>
            <Text style={styles.detailTitle}>{selectedEvent.title}</Text>
            
            <View style={styles.detailBadgeRow}>
              <View style={styles.detailBadge}>
                <Ionicons name="time-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.detailBadgeText}>{selectedEvent.date}</Text>
              </View>
              <View style={styles.detailBadge}>
                <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.detailBadgeText}>{selectedEvent.location}</Text>
              </View>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Description</Text>
            <Text style={styles.detailDescText}>{selectedEvent.description}</Text>
          </View>

          {/* Attachment Section */}
          {selectedEvent.attachment && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Attachment</Text>
              <View style={styles.attachmentDownloadCard}>
                <Ionicons name="document-attach" size={24} color="#003366" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.attachmentDownloadName}>{selectedEvent.attachment}</Text>
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>PDF Document • 1.2 MB</Text>
                </View>
                <TouchableOpacity style={styles.downloadIconBtn} onPress={() => Alert.alert('Download', `Downloading ${selectedEvent.attachment}...`)}>
                  <Ionicons name="download-outline" size={20} color="#003366" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Engagement Statistics */}
          <View style={styles.detailStatsRow}>
            <View style={styles.detailStatItem}>
              <Ionicons name="eye-outline" size={20} color="#64748B" />
              <Text style={styles.detailStatValue}>{selectedEvent.views}</Text>
              <Text style={styles.detailStatLabel}>Views</Text>
            </View>
            <View style={styles.detailStatItem}>
              <Ionicons name="heart-outline" size={20} color="#64748B" />
              <Text style={styles.detailStatValue}>{selectedEvent.likes}</Text>
              <Text style={styles.detailStatLabel}>Likes</Text>
            </View>
            <View style={styles.detailStatItem}>
              <Ionicons name="chatbubble-outline" size={20} color="#64748B" />
              <Text style={styles.detailStatValue}>{selectedEvent.comments.length}</Text>
              <Text style={styles.detailStatLabel}>Comments</Text>
            </View>
            <View style={styles.detailStatItem}>
              <Ionicons name="repeat-outline" size={20} color="#64748B" />
              <Text style={styles.detailStatValue}>{selectedEvent.reshares}</Text>
              <Text style={styles.detailStatLabel}>Reshares</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ===== CREATE EVENT EDITOR VIEW =====
  if (showEditor) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        
        {/* Editor Header */}
        <View style={styles.editorHeader}>
          <TouchableOpacity onPress={() => setShowEditor(false)}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textSecondary }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.editorTitleText}>Create Event</Text>
          <TouchableOpacity style={styles.postBtn} onPress={handlePostEvent}>
            <Text style={styles.postBtnText}>Post</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.editorBody} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Event Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Annual Alumni Meet 2026"
              placeholderTextColor="#94A3B8"
              value={eventTitle}
              onChangeText={setEventTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date & Time *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Dec 18, 2026 at 6:00 PM"
              placeholderTextColor="#94A3B8"
              value={eventDate}
              onChangeText={setEventDate}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location / Link</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Campus Auditorium / Zoom Link"
              placeholderTextColor="#94A3B8"
              value={eventLocation}
              onChangeText={setEventLocation}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, { height: 120, textAlignVertical: 'top', paddingVertical: 12 }]}
              placeholder="Describe the event, agenda, speakers, etc..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={6}
              value={eventDescription}
              onChangeText={setEventDescription}
            />
          </View>

          <View style={[styles.inputGroup, { marginBottom: 40 }]}>
            <Text style={styles.inputLabel}>Attachment (Optional)</Text>
            {eventAttachment ? (
              <View style={styles.attachmentPreview}>
                <Ionicons name="document" size={20} color="#003366" />
                <Text style={styles.attachmentName}>{eventAttachment}</Text>
                <TouchableOpacity onPress={() => setEventAttachment(null)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.attachBtn} onPress={() => setEventAttachment('event_brochure.pdf')}>
                <Ionicons name="add" size={20} color="#003366" style={{ marginRight: 6 }} />
                <Text style={styles.attachBtnText}>Attach Brochure / Agenda</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ===== DEFAULT: EVENT LIST VIEW =====
    const isWeb = Platform.OS === 'web';
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 1024, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={webContainerStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.headerAvatar, isSuperAdmin && { backgroundColor: '#D97706' }]} activeOpacity={0.8} onPress={() => navigation && navigation.navigate('AdminProfile')}>
          <Text style={styles.headerAvatarText}>{isSuperAdmin ? 'SA' : 'AD'}</Text>
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation && navigation.navigate('Messages')}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#003366" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation && navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color="#003366" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Summary Bar */}
      <View style={styles.filterSummaryBar}>
        <Text style={styles.filterSummaryText}>
          Showing {filteredEvents.length} events
        </Text>
        <TouchableOpacity
          style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
          activeOpacity={0.7}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeFiltersCount > 0 ? theme.card : theme.primary}
          />
          <Text style={[styles.filterButtonText, activeFiltersCount > 0 && styles.filterButtonTextActive]}>
            Filter{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.eventCard}>
            {/* Event Info */}
            <TouchableOpacity activeOpacity={0.8} onPress={() => setSelectedEvent(item)}>
              <View style={styles.eventCardHeader}>
                <View style={styles.eventIconCircle}>
                  <Ionicons name="calendar" size={20} color="#003366" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text style={styles.eventMeta}>{item.date} • {item.location}</Text>
                </View>
              </View>
              <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>
            </TouchableOpacity>

            {/* Social Interaction Row */}
            <View style={styles.socialRow}>
              <View style={styles.socialItem}>
                <Ionicons name="eye-outline" size={18} color="#64748B" />
                <Text style={styles.socialText}>{item.views}</Text>
              </View>

              <TouchableOpacity style={styles.socialItem} onPress={() => handleLike(item.id)}>
                <Ionicons name={item.liked ? "heart" : "heart-outline"} size={18} color={item.liked ? "#EF4444" : "#64748B"} />
                <Text style={[styles.socialText, item.liked && { color: theme.danger }]}>{item.likes}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialItem} onPress={() => setCommentModalEvent(item)}>
                <Ionicons name="chatbubble-outline" size={18} color="#64748B" />
                <Text style={styles.socialText}>{item.comments.length}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialItem} onPress={() => handleReshare(item.title)}>
                <Ionicons name="repeat-outline" size={18} color="#64748B" />
                <Text style={styles.socialText}>{item.reshares}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialItem} onPress={() => handleShare(item.title)}>
                <Ionicons name="share-social-outline" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Events Yet</Text>
            <Text style={styles.emptySubtitle}>Tap the button below to create your first event.</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowEditor(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Comment Modal */}
      <Modal visible={!!commentModalEvent} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => { setCommentModalEvent(null); setNewComment(''); }} />
          <View style={styles.commentModal}>
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => { setCommentModalEvent(null); setNewComment(''); }}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.commentList}>
              {currentModalEvent && currentModalEvent.comments.length > 0 ? (
                currentModalEvent.comments.map(c => (
                  <View key={c.id} style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>{c.user.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.commentUser}>{c.user} <Text style={styles.commentTime}>{c.time}</Text></Text>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noComments}>No comments yet. Be the first!</Text>
              )}
            </ScrollView>

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#94A3B8"
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity style={styles.commentSendBtn} onPress={handleAddComment}>
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} animationType="slide" transparent>
        <View style={styles.filterModalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowFilterModal(false)} />
          <View style={styles.filterSheet}>
            <View style={styles.filterSheetHeader}>
              <Text style={styles.filterSheetTitle}>Filter Events</Text>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <TouchableOpacity onPress={handleResetFilters} activeOpacity={0.7}>
                  <Text style={styles.resetText}>Reset All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowFilterModal(false)} activeOpacity={0.7}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.filterScrollView} showsVerticalScrollIndicator={false}>
              {/* Institution Filter (Super Admin only) */}
              {isSuperAdmin && (
                <>
                  <Text style={styles.filterGroupLabel}>Institution</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
                    {['All', 'RVCE', 'RVITM', 'RVPU', 'RVIS', 'RVU', 'RVCA', 'RVIM', 'RVILS', 'DAPMRV', 'RVCN', 'RVCP', 'RVTC', 'RVTTI', 'NMKRV', 'SSMRV', 'RVPS', 'RVS', 'RVLH'].map((inst) => (
                      <TouchableOpacity
                        key={inst}
                        style={[styles.pill, selectedInstitution === inst && styles.pillActive]}
                        onPress={() => {
                          setSelectedInstitution(inst);
                          global.selectedInstitution = inst;
                        }}
                      >
                        <Text style={[styles.pillText, selectedInstitution === inst && styles.pillTextActive]}>
                          {inst}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.applyButton}
              activeOpacity={0.8}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.card },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  headerAvatarText: { color: theme.card, fontSize: 14, fontWeight: '800' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 12, height: 36 },
  searchInput: { flex: 1, fontSize: 14, color: theme.text, padding: 0 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  headerIconBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  dot: { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 4, backgroundColor: theme.danger },
  listContent: { padding: 16, paddingBottom: 100 },
  eventCard: { backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  eventCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  eventIconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  eventTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
  eventMeta: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  eventDesc: { fontSize: 13, color: '#475569', lineHeight: 19, marginBottom: 14 },
  socialRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  socialItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  socialText: { fontSize: 13, color: theme.textSecondary, fontWeight: '600', marginLeft: 5 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.textMuted, marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#CBD5E1', marginTop: 4, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  
  // Detail view header
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
  detailTitleText: { fontSize: 18, fontWeight: '800', color: theme.primary },

  editorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  editorTitleText: { fontSize: 17, fontWeight: '700', color: theme.text },
  postBtn: { backgroundColor: theme.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8 },
  postBtnText: { color: theme.card, fontSize: 14, fontWeight: '700' },
  editorBody: { flex: 1, padding: 20 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 },
  textInput: { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 15, color: theme.text },
  // Detail View
  detailTopCard: { alignItems: 'center', backgroundColor: theme.card, borderRadius: 16, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  detailIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: '#E0F2FE' },
  detailTitle: { fontSize: 20, fontWeight: '800', color: theme.text, textAlign: 'center', marginBottom: 12 },
  detailBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  detailBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 6, borderWidth: 1, borderColor: theme.border },
  detailBadgeText: { fontSize: 12, color: theme.textSecondary, fontWeight: '600' },
  detailSection: { backgroundColor: theme.card, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  detailSectionTitle: { fontSize: 16, fontWeight: '800', color: theme.text, marginBottom: 10 },
  detailDescText: { fontSize: 14, color: '#475569', lineHeight: 22 },
  detailStatsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: theme.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border },
  detailStatItem: { alignItems: 'center' },
  detailStatValue: { fontSize: 18, fontWeight: '800', color: theme.text, marginTop: 4 },
  detailStatLabel: { fontSize: 11, color: theme.textMuted, fontWeight: '600', marginTop: 2 },
  // Attachment Styles
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: theme.background,
  },
  attachBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.primary,
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
    marginLeft: 8,
  },
  attachmentDownloadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  attachmentDownloadName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  downloadIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Comment Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  commentModal: { backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', minHeight: 300 },
  commentModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  commentModalTitle: { fontSize: 17, fontWeight: '700', color: theme.text },
  commentList: { padding: 16, maxHeight: 300 },
  commentItem: { flexDirection: 'row', marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  commentAvatarText: { fontSize: 14, fontWeight: '700', color: theme.textSecondary },
  commentUser: { fontSize: 13, fontWeight: '700', color: theme.text },
  commentTime: { fontSize: 11, fontWeight: '500', color: theme.textMuted },
  commentText: { fontSize: 13, color: '#475569', marginTop: 2, lineHeight: 18 },
  noComments: { textAlign: 'center', color: theme.textMuted, fontSize: 14, paddingVertical: 30 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  commentInput: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 16, height: 40, fontSize: 14, color: theme.text, marginRight: 10 },
  commentSendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },

  // Filter Styles
  filterSummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  filterSummaryText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: theme.primary,
  },
  filterButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.primary,
  },
  filterButtonTextActive: {
    color: theme.card,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  filterSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.danger,
  },
  filterScrollView: {
    padding: 20,
  },
  filterGroupLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#475569',
    marginTop: 16,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  pill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  pillActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextActive: {
    color: theme.card,
  },
  applyButton: {
    backgroundColor: theme.primary,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.card,
  },
});

export default AdminEventsScreen;
