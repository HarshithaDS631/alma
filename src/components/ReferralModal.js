import React, { useState } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { requestJobReferral } from '../services/jobService';

const STARTER_PITCHES = [
  'Top academic record & relevant final year capstone project',
  'Prior internship experience in this exact tech stack',
  'Active open-source contributor passionate about this domain'
];

export default function ReferralModal({ visible, onClose, job, currentUser, onReferralSubmitted }) {
  const { theme, isDarkMode } = useTheme();

  const [pitch, setPitch] = useState('');
  const [resumeUrl, setResumeUrl] = useState(currentUser?.resumeUrl || '');
  const [loading, setLoading] = useState(false);

  if (!visible || !job) return null;

  const posterName = job.postedBy?.name || 'Verified RV Alumni';
  const posterRole = job.postedBy?.designation || job.postedBy?.company || job.company;

  const handleSubmit = async () => {
    if (!pitch.trim()) {
      const msg = 'Please enter a short pitch explaining why you are a great match for this referral.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Pitch Required', msg);
      return;
    }

    try {
      setLoading(true);
      const res = await requestJobReferral(job._id || job.id, {
        pitch: pitch.trim(),
        resumeUrl: resumeUrl.trim()
      });

      const successMsg = res.message || `Referral request submitted to ${posterName}!`;
      if (Platform.OS === 'web') window.alert(successMsg);
      else Alert.alert('Referral Requested! 🤝', successMsg);

      setPitch('');
      if (onReferralSubmitted) onReferralSubmitted();
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to submit referral request';
      if (Platform.OS === 'web') window.alert(errMsg);
      else Alert.alert('Error', errMsg);
    } finally {
      setLoading(false);
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
                <Ionicons name="people" size={18} color="#D4AF37" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                  Ask an RVite for Referral
                </Text>
                <Text style={styles.headerSubtitle}>Direct employee referral connection</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close-circle" size={26} color={isDarkMode ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            
            {/* Target Job & Referrer Card */}
            <View style={[styles.targetCard, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.jobTitleText, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                  {job.title}
                </Text>
                <Text style={styles.companyText}>
                  {job.company} • {job.location}
                </Text>
              </View>
              <View style={styles.badgePod}>
                <Ionicons name="shield-checkmark" size={12} color="#D4AF37" />
                <Text style={styles.badgeText}>ALUMNI POST</Text>
              </View>
            </View>

            <View style={styles.referrerRow}>
              <Ionicons name="person-circle-outline" size={20} color="#D4AF37" />
              <Text style={[styles.referrerText, { color: isDarkMode ? '#CBD5E1' : '#475569' }]}>
                Referral goes directly to <Text style={{ fontWeight: '700', color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>{posterName}</Text> ({posterRole})
              </Text>
            </View>

            {/* Quick Starters */}
            <Text style={[styles.inputLabel, { color: isDarkMode ? '#E2E8F0' : '#334155', marginTop: 14 }]}>
              Starter Highlights (tap to add):
            </Text>
            <View style={styles.starterContainer}>
              {STARTER_PITCHES.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.starterChip, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                  onPress={() => setPitch(prev => (prev ? `${prev} • ${chip}` : chip))}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.starterText, { color: isDarkMode ? '#E2E8F0' : '#334155' }]}>+ {chip}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Elevator Pitch Text Input */}
            <Text style={[styles.inputLabel, { color: isDarkMode ? '#E2E8F0' : '#334155', marginTop: 14 }]}>
              Elevator Pitch (Why you?):
            </Text>
            <TextInput
              style={[
                styles.pitchInput,
                {
                  backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9',
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                  borderColor: isDarkMode ? '#334155' : '#CBD5E1'
                }
              ]}
              value={pitch}
              onChangeText={setPitch}
              placeholder="Hi! I graduated in 2024 from CSE. I have built 3 production microservices using Go and React..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              maxLength={600}
            />
            <Text style={styles.charCount}>{pitch.length}/600</Text>

            {/* Resume Link */}
            <Text style={[styles.inputLabel, { color: isDarkMode ? '#E2E8F0' : '#334155', marginTop: 10 }]}>
              Portfolio / Resume Link:
            </Text>
            <TextInput
              style={[
                styles.resumeInput,
                {
                  backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9',
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                  borderColor: isDarkMode ? '#334155' : '#CBD5E1'
                }
              ]}
              value={resumeUrl}
              onChangeText={setResumeUrl}
              placeholder="https://drive.google.com/... or portfolio URL"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
            />

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: isDarkMode ? '#475569' : '#CBD5E1' }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelText, { color: isDarkMode ? '#E2E8F0' : '#475569' }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
                    <Text style={styles.submitText}>Submit Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
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
  targetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    marginBottom: 10
  },
  jobTitleText: {
    fontSize: 15,
    fontWeight: '800'
  },
  companyText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  badgePod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.4
  },
  referrerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 6
  },
  referrerText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6
  },
  starterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  starterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16
  },
  starterText: {
    fontSize: 11,
    fontWeight: '600'
  },
  pitchInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    borderWidth: 1,
    minHeight: 90,
    textAlignVertical: 'top'
  },
  charCount: {
    fontSize: 10.5,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 3
  },
  resumeInput: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700'
  },
  submitBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0F2C59',
    gap: 6
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  }
});

