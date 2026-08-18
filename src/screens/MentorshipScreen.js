import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const MentorshipScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const mentors = [];

  const handleRequestMentorship = (mentorName) => {
    Alert.alert(
      'Request Mentorship',
      `Your mentorship request has been sent to ${mentorName}. They will receive an email and notification!`,
      [{ text: 'OK' }]
    );
  };

  const handleBecomeMentor = () => {
    Alert.alert(
      'Become a Mentor',
      'Thank you for offering to mentor junior alumni and students! Our team will review your application within 24 hours.',
      [{ text: 'Great!' }]
    );
  };

  const isWeb = Platform.OS === 'web';
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 800, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={webContainerStyle}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mentorship Hub</Text>
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Learn from the Best</Text>
          <Text style={styles.heroSubtitle}>Connect with senior alumni for career guidance, technical mentorship, and industry insights.</Text>
          <TouchableOpacity style={styles.becomeMentorBtn} onPress={handleBecomeMentor}>
            <Text style={styles.becomeMentorText}>Become a Mentor</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Mentors</Text>
        </View>

        {mentors.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, textAlign: 'center' }}>No mentors registered yet</Text>
            <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginTop: 6 }}>
              Be the first to join as a mentor and guide junior students and fellow alumni!
            </Text>
          </View>
        ) : (
          mentors.map(mentor => (
            <View key={mentor.id} style={styles.mentorCard}>
              <View style={styles.mentorHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{mentor.initials}</Text>
                </View>
                <View style={styles.mentorInfo}>
                  <Text style={styles.mentorName}>{mentor.name}</Text>
                  <Text style={styles.mentorDetails}>Class of {mentor.batch} • {mentor.company}</Text>
                </View>
              </View>
              <View style={styles.expertiseRow}>
                <Text style={styles.expertiseLabel}>Expertise:</Text>
                <Text style={styles.expertiseValue}>{mentor.expertise}</Text>
              </View>
              <TouchableOpacity style={styles.requestBtn} onPress={() => handleRequestMentorship(mentor.name)}>
                <Text style={styles.requestBtnText}>Request Mentorship</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Mentors</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Mentees</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Active</Text>
            <Text style={styles.statLabel}>Network</Text>
          </View>
        </View>
      </ScrollView>
    </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.primary,
  },
  heroSection: {
    padding: 24,
    backgroundColor: theme.primary,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: theme.card,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    opacity: 0.9,
  },
  becomeMentorBtn: {
    backgroundColor: theme.card,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  becomeMentorText: {
    color: theme.primary,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  viewAllText: {
    color: theme.primary,
    fontWeight: '600',
  },
  mentorCard: {
    backgroundColor: theme.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  mentorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primary,
  },
  mentorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  mentorDetails: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  expertiseRow: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: theme.background,
    padding: 10,
    borderRadius: 8,
  },
  expertiseLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textMuted,
    marginRight: 8,
  },
  expertiseValue: {
    fontSize: 12,
    color: theme.text,
    flex: 1,
  },
  requestBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  requestBtnText: {
    color: theme.card,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    backgroundColor: theme.card,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4,
  }
});

export default MentorshipScreen;
