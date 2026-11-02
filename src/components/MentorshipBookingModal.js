import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { fetchAvailableSlots, bookMentorshipSlot } from '../services/mentorshipService';

const TOPIC_PRESETS = [
  'Career Guidance & Transition',
  'Resume & Portfolio Review',
  'Mock Technical Interview',
  'Higher Studies & MS Guidance'
];

export default function MentorshipBookingModal({ visible, onClose, mentor, onSessionBooked }) {
  const { theme, isDarkMode } = useTheme();

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(TOPIC_PRESETS[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmedSession, setConfirmedSession] = useState(null);

  useEffect(() => {
    if (visible && mentor) {
      setConfirmedSession(null);
      setLoading(true);
      const mentorId = mentor._id || mentor.id || 'curated_m1';
      fetchAvailableSlots(mentorId)
        .then(resSlots => {
          setSlots(resSlots || []);
          if (resSlots && resSlots.length > 0) {
            setSelectedSlot(resSlots[0]);
          }
        })
        .catch(err => {
          console.log('Slots fetch error:', err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [visible, mentor]);

  if (!visible || !mentor) return null;

  const mentorName = mentor.name || 'Alumni Mentor';
  const mentorRole = mentor.designation ? `${mentor.designation} at ${mentor.company || 'Tech'}` : 'Alumni Leader';

  const handleBook = async () => {
    if (!selectedSlot) {
      const msg = 'Please select a date and time slot for your mentorship session.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Slot Required', msg);
      return;
    }

    try {
      setBookingLoading(true);
      const res = await bookMentorshipSlot({
        mentorId: mentor._id || mentor.id,
        slotId: selectedSlot._id,
        startTime: selectedSlot.startTime,
        topic: selectedTopic,
        notes: notes.trim()
      });

      setConfirmedSession(res.session);
      if (onSessionBooked) onSessionBooked(res.session);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to book session';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Booking Error', msg);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleDownloadIcs = () => {
    if (!confirmedSession) return;
    const icsContent = confirmedSession.calendarIcs;
    if (Platform.OS === 'web') {
      const element = document.createElement('a');
      const file = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = `Mentorship_${mentorName.replace(/\s+/g, '_')}.ics`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else {
      Share.share({
        title: `Mentorship: ${mentorName}`,
        message: `📅 1-on-1 Mentorship with ${mentorName}\nTopic: ${confirmedSession.topic}\nJoin Call: ${confirmedSession.meetingUrl}`
      });
    }
  };

  const handleAddToGoogleCalendar = () => {
    if (!confirmedSession) return;
    const title = encodeURIComponent(`1-on-1 Mentorship: ${mentorName}`);
    const details = encodeURIComponent(`Topic: ${confirmedSession.topic}\nVideo Meeting: ${confirmedSession.meetingUrl}\nNotes: ${confirmedSession.notes || 'None'}`);
    const location = encodeURIComponent(confirmedSession.meetingUrl);
    const startIso = new Date(confirmedSession.startTime).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endIso = new Date(confirmedSession.endTime).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;

    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => {});
    }
  };

  const handleJoinCall = () => {
    if (confirmedSession?.meetingUrl) {
      if (Platform.OS === 'web') {
        window.open(confirmedSession.meetingUrl, '_blank');
      } else {
        Linking.openURL(confirmedSession.meetingUrl).catch(() => {});
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="calendar" size={18} color="#059669" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                  {confirmedSession ? 'Session Confirmed! 🎉' : 'Book 1-on-1 Advisory Call'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {confirmedSession ? 'Calendar invite & video link generated' : '30-minute private video session'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close-circle" size={26} color={isDarkMode ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            
            {/* If Confirmed Success View */}
            {confirmedSession ? (
              <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                <View style={styles.successIconPod}>
                  <Ionicons name="checkmark-done-circle" size={56} color="#059669" />
                </View>
                <Text style={[styles.confirmedTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                  You're Booked with {confirmedSession.mentorName}!
                </Text>
                <Text style={styles.confirmedSubtitle}>
                  {new Date(confirmedSession.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} at {new Date(confirmedSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>

                {/* Meeting Link Card */}
                <View style={[styles.meetingCard, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ionicons name="videocam" size={18} color="#059669" />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                      Video Room Access
                    </Text>
                  </View>
                  <Text style={styles.meetingUrlText} numberOfLines={1}>{confirmedSession.meetingUrl}</Text>
                  
                  <TouchableOpacity
                    style={styles.joinCallBtn}
                    onPress={handleJoinCall}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="call" size={16} color="#FFFFFF" />
                    <Text style={styles.joinCallText}>Join Video Call Room</Text>
                  </TouchableOpacity>
                </View>

                {/* Calendar Sync Actions */}
                <View style={{ width: '100%', gap: 10, marginTop: 14 }}>
                  <TouchableOpacity
                    style={[styles.calendarSyncBtn, { borderColor: isDarkMode ? '#334155' : '#CBD5E1' }]}
                    onPress={handleAddToGoogleCalendar}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-google" size={16} color="#4285F4" />
                    <Text style={[styles.calendarSyncText, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                      Add to Google Calendar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.calendarSyncBtn, { borderColor: isDarkMode ? '#334155' : '#CBD5E1' }]}
                    onPress={handleDownloadIcs}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="download-outline" size={17} color="#059669" />
                    <Text style={[styles.calendarSyncText, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                      Download .ics Calendar File
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.doneBtn, { marginTop: 18 }]}
                  onPress={onClose}
                  activeOpacity={0.85}
                >
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Pre-booking Form View */
              <View>
                {/* Mentor Summary */}
                <View style={[styles.mentorPod, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}>
                  <View style={styles.mentorAvatarCircle}>
                    <Text style={styles.mentorAvatarText}>{mentorName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.mentorNameText, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>{mentorName}</Text>
                    <Text style={styles.mentorRoleText} numberOfLines={1}>{mentorRole}</Text>
                  </View>
                  <View style={styles.durationBadge}>
                    <Ionicons name="time-outline" size={12} color="#059669" />
                    <Text style={styles.durationText}>30 MIN</Text>
                  </View>
                </View>

                {/* Available Slots Selector */}
                <Text style={[styles.sectionTitle, { color: isDarkMode ? '#E2E8F0' : '#334155', marginTop: 14 }]}>
                  Select Date & Time Slot:
                </Text>
                {loading ? (
                  <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 16 }} />
                ) : (
                  <View style={styles.slotGrid}>
                    {slots.map((slot, idx) => {
                      const isSel = selectedSlot?._id === slot._id;
                      const dateObj = new Date(slot.startTime);
                      const dayStr = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <TouchableOpacity
                          key={slot._id || idx}
                          style={[
                            styles.slotChip,
                            {
                              backgroundColor: isSel ? '#059669' : (isDarkMode ? '#0F172A' : '#F1F5F9'),
                              borderColor: isSel ? '#059669' : (isDarkMode ? '#334155' : '#E2E8F0')
                            }
                          ]}
                          onPress={() => setSelectedSlot(slot)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.slotDateText, { color: isSel ? '#FFFFFF' : (isDarkMode ? '#F8FAFC' : '#0F172A') }]}>
                            {dayStr}
                          </Text>
                          <Text style={[styles.slotTimeText, { color: isSel ? '#E2E8F0' : '#64748B' }]}>
                            {timeStr}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Topic Presets */}
                <Text style={[styles.sectionTitle, { color: isDarkMode ? '#E2E8F0' : '#334155', marginTop: 14 }]}>
                  Discussion Agenda:
                </Text>
                <View style={styles.topicRow}>
                  {TOPIC_PRESETS.map((t, idx) => {
                    const isSel = selectedTopic === t;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.topicChip,
                          {
                            backgroundColor: isSel ? 'rgba(5, 150, 105, 0.15)' : (isDarkMode ? '#0F172A' : '#F1F5F9'),
                            borderColor: isSel ? '#059669' : (isDarkMode ? '#334155' : '#E2E8F0')
                          }
                        ]}
                        onPress={() => setSelectedTopic(t)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.topicText, { color: isSel ? '#059669' : (isDarkMode ? '#CBD5E1' : '#475569'), fontWeight: isSel ? '700' : '500' }]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Specific Notes Input */}
                <Text style={[styles.sectionTitle, { color: isDarkMode ? '#E2E8F0' : '#334155', marginTop: 14 }]}>
                  Questions or Notes for Mentor:
                </Text>
                <TextInput
                  style={[
                    styles.notesInput,
                    {
                      backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9',
                      color: isDarkMode ? '#F8FAFC' : '#0F172A',
                      borderColor: isDarkMode ? '#334155' : '#CBD5E1'
                    }
                  ]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Would like feedback on my resume and how to crack Google SDE rounds..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />

                {/* Booking Button */}
                <TouchableOpacity
                  style={[styles.bookBtn, bookingLoading && { opacity: 0.7 }]}
                  onPress={handleBook}
                  disabled={bookingLoading}
                  activeOpacity={0.85}
                >
                  {bookingLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="calendar-sharp" size={18} color="#FFFFFF" />
                      <Text style={styles.bookBtnText}>Confirm Slot & Sync Calendar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  container: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)'
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800'
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1
  },
  body: {
    padding: 20
  },
  mentorPod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)'
  },
  mentorAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mentorAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16
  },
  mentorNameText: {
    fontSize: 14.5,
    fontWeight: '800'
  },
  mentorRoleText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  durationText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669'
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  slotChip: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center'
  },
  slotDateText: {
    fontSize: 12,
    fontWeight: '700'
  },
  slotTimeText: {
    fontSize: 11,
    marginTop: 2
  },
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1
  },
  topicText: {
    fontSize: 11.5
  },
  notesInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    borderWidth: 1,
    minHeight: 70,
    textAlignVertical: 'top'
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 18
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  },
  successIconPod: {
    marginBottom: 8
  },
  confirmedTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center'
  },
  confirmedSubtitle: {
    fontSize: 12.5,
    color: '#059669',
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center'
  },
  meetingCard: {
    width: '100%',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)'
  },
  meetingUrlText: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 10
  },
  joinCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 10
  },
  joinCallText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700'
  },
  calendarSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1
  },
  calendarSyncText: {
    fontSize: 12.5,
    fontWeight: '700'
  },
  doneBtn: {
    width: '100%',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  }
});

