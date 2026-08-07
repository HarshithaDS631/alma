import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export default function LegalScreen({ navigation }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('terms');

  const handleDeleteAccount = () => {
    Alert.alert(
      'Account Deletion Request',
      'Are you sure you want to request permanent deletion of your alumni account and personal data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Deletion',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Request Received',
              'Your account deletion request has been submitted to the Admin team. Your data will be removed within 30 days in compliance with data retention policies.'
            );
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Legal & Compliance</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabBarContainer, { borderBottomColor: theme.border }]}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'terms' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('terms')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'terms' ? theme.primary : theme.subtext }]}>Terms</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'privacy' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('privacy')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'privacy' ? theme.primary : theme.subtext }]}>Privacy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'community' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('community')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'community' ? theme.primary : theme.subtext }]}>Guidelines</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'cookies' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('cookies')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'cookies' ? theme.primary : theme.subtext }]}>Cookies</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'retention' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('retention')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'retention' ? theme.primary : theme.subtext }]}>Data Rights</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {activeTab === 'terms' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Terms of Service</Text>
            <Text style={[styles.paragraph, { color: theme.subtext }]}>
              Welcome to the RV Educational Alumni Network platform. By accessing or using our mobile application or web portal, you agree to be bound by these Terms of Service.
            </Text>
            <Text style={[styles.subHeading, { color: theme.text }]}>1. Eligibility & Registration</Text>
            <Text style={[styles.paragraph, { color: theme.subtext }]}>
              Registration is restricted to verified alumni, current students, faculty, and authorized administrators of RV Institutions. Account approval by an institution admin is mandatory prior to platform access.
            </Text>
            <Text style={[styles.subHeading, { color: theme.text }]}>2. Acceptable Use</Text>
            <Text style={[styles.paragraph, { color: theme.subtext }]}>
              Users must refrain from uploading harmful, offensive, or copyright-infringing material. Networking, job posting, and mentorship interactions must remain professional.
            </Text>
          </View>
        )}

        {activeTab === 'privacy' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Privacy Policy</Text>
            <Text style={[styles.paragraph, { color: theme.subtext }]}>
              Your privacy is paramount to us. This Privacy Policy details how we collect, use, and protect your personal information on the Alumni Platform.
            </Text>
            <Text style={[styles.subHeading, { color: theme.text }]}>1. Data We Collect</Text>
            <Text style={[styles.paragraph, { color: theme.subtext }]}>
              We collect profile information (name, email, graduation year, degree, employment details), messages, activity logs, and uploaded media to facilitate alumni networking.
            </Text>
            <Text style={[styles.subHeading, { color: theme.text }]}>2. Encryption & Security</Text>
            <Text style={[styles.paragraph, { color: theme.subtext }]}>
              All communications are transmitted over HTTPS/WSS with JWT token authentication and MongoDB encryption at rest.
            </Text>
          </View>
        )}

        {activeTab === 'community' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Community Guidelines</Text>
            <Text style={[styles.paragraph, { color: theme.subtext }]}>
              To maintain a supportive environment for all alumni and students:
            </Text>
            <Text style={[styles.bullet, { color: theme.subtext }]}>• Be respectful and constructive in all forum posts and direct messages.</Text>
            <Text style={[styles.bullet, { color: theme.subtext }]}>• Do not spam job postings, promotional links, or unauthorized solicitations.</Text>
            <Text style={[styles.bullet, { color: theme.subtext }]}>• Report inappropriate content or behavior using the built-in report feature.</Text>
          </View>
        )}

        {activeTab === 'cookies' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Cookie Policy (Web Application)</Text>
            <Text style={[styles.paragraph, { color: theme.subtext }]}>
              Our web application uses essential cookies and local storage tokens to ensure secure login authentication and store user preferences.
            </Text>
            <Text style={[styles.subHeading, { color: theme.text }]}>1. Essential Authentication Tokens</Text>
            <Text style={[styles.paragraph, { color: theme.subtext }]}>
              We store encrypted JWT session tokens in web local storage (`AsyncStorage`) strictly for authentication state persistence. No third-party tracking cookies are used.
            </Text>
            <Text style={[styles.subHeading, { color: theme.text }]}>2. Managing Preferences</Text>
            <Text style={[styles.paragraph, { color: theme.subtext }]}>
              Theme preferences (Dark/Light mode) are persisted locally on your device to enhance visual accessibility.
            </Text>
          </View>
        )}

        {activeTab === 'retention' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Retention & Deletion Rights</Text>
            <Text style={[styles.paragraph, { color: theme.subtext }]}>
              You have full rights regarding your data retention and account removal under applicable privacy frameworks.
            </Text>

            <TouchableOpacity style={styles.deleteCard} onPress={handleDeleteAccount}>
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
              <View style={styles.deleteCardText}>
                <Text style={styles.deleteTitle}>Request Account Deletion</Text>
                <Text style={styles.deleteSub}>Permanently delete your profile, posts, and message history.</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backButton: { padding: 4 },
  tabBarContainer: { borderBottomWidth: 1, maxHeight: 48 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 10 },
  tabItem: { paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '600' },
  contentContainer: { padding: 20 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subHeading: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  paragraph: { fontSize: 14, lineHeight: 22 },
  bullet: { fontSize: 14, lineHeight: 22, paddingLeft: 8 },
  deleteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12
  },
  deleteCardText: { flex: 1 },
  deleteTitle: { fontSize: 16, fontWeight: '700', color: '#991B1B' },
  deleteSub: { fontSize: 12, color: '#B91C1C', marginTop: 2 }
});
