import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, ScrollView, TextInput, Platform, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getImageUrl } from '../services/uploadService';
import useUserRole from '../hooks/useUserRole';
import getInitials from '../lib/getInitials';

const ContributeScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { isAlumni, isAdmin, isSuperAdmin, isAdminOrSuper, userRole } = useUserRole();

  const [userInitials, setUserInitials] = useState('MA');
  const [userAvatarUrl, setUserAvatarUrl] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userInfoStr = await AsyncStorage.getItem('userInfo');
        if (userInfoStr) {
          const u = JSON.parse(userInfoStr);
          if (u?.name) {
            setUserInitials(getInitials(u.name));
          }
          const rawAv = u?.avatar_url || u?.profilePicture;
          if (rawAv) setUserAvatarUrl(getImageUrl(rawAv));
        }
      } catch (e) {}
    };
    loadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('userInfo').then(userInfoStr => {
        if (userInfoStr) {
          const u = JSON.parse(userInfoStr);
          if (u?.name) setUserInitials(getInitials(u.name));
          const rawAv = u?.avatar_url || u?.profilePicture;
          if (rawAv) setUserAvatarUrl(getImageUrl(rawAv));
        }
      }).catch(() => {});
    }, [])
  );

  // Admin/Super Admin: 'review' | 'support'; Alumni: 'mentorship' | 'support'
  const [activeTab, setActiveTab] = useState('mentorship');
  // Alumni defaults to 'mentor' sub-tab
  const [mentorshipTab, setMentorshipTab] = useState('mentor');

  const [showMenteeForm, setShowMenteeForm] = useState(false);
  const [showMentorForm, setShowMentorForm] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const [menteeKeyword, setMenteeKeyword] = useState('');
  const [menteeWhy, setMenteeWhy] = useState('');
  const [menteeGuidance, setMenteeGuidance] = useState('');
  const [menteeProgress, setMenteeProgress] = useState('');
  const [menteeActivities, setMenteeActivities] = useState('');

  const [mentorKeyword, setMentorKeyword] = useState('');
  const [mentorInfo, setMentorInfo] = useState('');

  const handleRegisterMentee = () => {
    setShowMenteeForm(false);
  };

  const handleRegisterMentor = () => {
    setShowMentorForm(false);
  };

  // ─── ADMIN: REVIEW APPLICATIONS TAB ─────────────────────────────
  const renderReviewTab = () => (
    <View style={styles.mentorshipContainer}>
      <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: theme.border, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Ionicons name="shield-checkmark" size={24} color="#003366" style={{ marginRight: 12 }} />
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Mentorship Applications</Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Review and manage mentorship requests</Text>
          </View>
        </View>
        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: '#EFF6FF', borderRadius: 8, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#003366' }}>0</Text>
            <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 }}>Pending</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#ECFDF5', borderRadius: 8, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#059669' }}>0</Text>
            <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 }}>Approved</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#DC2626' }}>0</Text>
            <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 }}>Rejected</Text>
          </View>
        </View>
      </View>

      {/* Empty state */}
      <View style={{ alignItems: 'center', paddingVertical: 60 }}>
        <Ionicons name="document-text-outline" size={56} color="#CBD5E1" />
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#475569', marginTop: 16 }}>No Pending Applications</Text>
        <Text style={{ fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
          Mentorship applications from alumni will appear here for review.
        </Text>
      </View>
    </View>
  );

  const renderMenteeView = () => {
    if (showMenteeForm) {
      return (
        <View style={styles.formContainer}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowMenteeForm(false)}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
            <Text style={styles.backBtnText}>Mentorship Program</Text>
          </TouchableOpacity>

          <View style={styles.formHeader}>
            <View>
              <Text style={styles.formTitle}>Questionnaire <Text style={styles.formTitleLight}>Form</Text></Text>
              <View style={styles.titleUnderline} />
            </View>
            <TouchableOpacity>
              <Text style={styles.sampleLink}>View Sample Applications</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Which areas are you looking for mentorship</Text>
            <TextInput 
              style={styles.textInput} 
              placeholder="keyword" 
              placeholderTextColor="#94A3B8"
              value={menteeKeyword}
              onChangeText={setMenteeKeyword}
            />
            <Text style={styles.inputHelp}>Higher Studies, Entrepreneurship, Civil services, Finance, etc.</Text>
            <TouchableOpacity>
              <Text style={styles.addKeywordBtn}>Add Keyword</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Why do you want an alumni mentor?</Text>
            <TextInput 
              style={[styles.textInput, styles.textArea]} 
              multiline 
              numberOfLines={4}
              value={menteeWhy}
              onChangeText={setMenteeWhy}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Describe in detail the field(s) that you require guidance in. E.g : Start-ups, research etc.</Text>
            <TextInput 
              style={[styles.textInput, styles.textArea]} 
              multiline 
              numberOfLines={4}
              value={menteeGuidance}
              onChangeText={setMenteeGuidance}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>What is your progress/past work in this/these field(s)?</Text>
            <TextInput 
              style={[styles.textInput, styles.textArea]} 
              multiline 
              numberOfLines={4}
              value={menteeProgress}
              onChangeText={setMenteeProgress}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>What activities you have been part of during your time at the institute?</Text>
            <TextInput 
              style={[styles.textInput, styles.textArea]} 
              multiline 
              numberOfLines={4}
              value={menteeActivities}
              onChangeText={setMenteeActivities}
            />
          </View>

          <TouchableOpacity style={styles.registerSubmitBtn} onPress={handleRegisterMentee}>
            <Text style={styles.registerSubmitBtnText}>Register</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Register as a mentee</Text>
        <Text style={styles.cardDesc}>
          This is an initiative by Institution and is managed by the Alumni team of Institution. The goal is to encourage alumni to seek out mentors amongst themselves for their overall development in a professional and personal sense.
        </Text>
        <TouchableOpacity style={styles.registerBtn} onPress={() => setShowMenteeForm(true)}>
          <Text style={styles.registerBtnText}>Register</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMentorView = () => {
    if (showMentorForm) {
      return (
        <View style={styles.formContainer}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowMentorForm(false)}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
            <Text style={styles.backBtnText}>Mentorship Program</Text>
          </TouchableOpacity>

          <View style={styles.formHeader}>
            <View>
              <Text style={styles.formTitle}>Questionnaire <Text style={styles.formTitleLight}>Form</Text></Text>
              <View style={styles.titleUnderline} />
            </View>
            <TouchableOpacity>
              <Text style={styles.sampleLink}>View Sample Applications</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Areas where you can offer mentorship</Text>
            <TextInput 
              style={styles.textInput} 
              placeholder="keyword" 
              placeholderTextColor="#94A3B8"
              value={mentorKeyword}
              onChangeText={setMentorKeyword}
            />
            <Text style={styles.inputHelp}>Higher Studies, Entrepreneurship, Civil services, Finance, etc.</Text>
            <TouchableOpacity>
              <Text style={styles.addKeywordBtn}>Add Keyword</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Info about you</Text>
            <TextInput 
              style={[styles.textInput, styles.textArea]} 
              multiline 
              numberOfLines={4}
              value={mentorInfo}
              onChangeText={setMentorInfo}
            />
          </View>

          <TouchableOpacity style={styles.registerSubmitBtn} onPress={handleRegisterMentor}>
            <Text style={styles.registerSubmitBtnText}>Register</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Register as a mentor</Text>
        <Text style={styles.cardDesc}>
          {"A Great mentor inspires every achiever. Keeping this in mind, Institution has come up with this new initiative where a mentor can provide support, advice, and feedback by reaching out to mentees themselves and leveraging each other's personal and professional experience. The alumni team of Institution manages this initiative."}
        </Text>
        <TouchableOpacity style={styles.registerBtn} onPress={() => setShowMentorForm(true)}>
          <Text style={styles.registerBtnText}>Register</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const isWeb = Platform.OS === 'web';
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 800, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={webContainerStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header exactly like Dashboard/Jobs flow */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.headerAvatar, { overflow: 'hidden', backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center' }]} 
          activeOpacity={0.8} 
          onPress={() => navigation.navigate('Profile')}
        >
          {userAvatarUrl ? (
            <Image 
              source={{ uri: userAvatarUrl }} 
              style={{ width: '100%', height: '100%', borderRadius: 17 }} 
            />
          ) : (
            <Text style={styles.headerAvatarText}>{userInitials}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Messages')}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#003366" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color="#003366" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Role Badge for Admin/Super Admin */}
      {isAdminOrSuper && (
        <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="shield-checkmark" size={16} color="#003366" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#003366' }}>{userRole} Mode</Text>
          <Text style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>Review mentorship applications</Text>
        </View>
      )}

      {/* Main Tabs — role-aware */}
      <View style={styles.tabBar}>
        {isAdminOrSuper ? (
          <>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'review' && styles.activeTab]}
              onPress={() => setActiveTab('review')}
            >
              <Text style={[styles.tabText, activeTab === 'review' && styles.activeTabText]}>
                Review Applications
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'support' && styles.activeTab]}
              onPress={() => setActiveTab('support')}
            >
              <Text style={[styles.tabText, activeTab === 'support' && styles.activeTabText]}>
                Support Community
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'mentorship' && styles.activeTab]}
              onPress={() => setActiveTab('mentorship')}
            >
              <Text style={[styles.tabText, activeTab === 'mentorship' && styles.activeTabText]}>
                Mentorship Application
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'support' && styles.activeTab]}
              onPress={() => setActiveTab('support')}
            >
              <Text style={[styles.tabText, activeTab === 'support' && styles.activeTabText]}>
                Support Community
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'review' && isAdminOrSuper ? (
          renderReviewTab()
        ) : activeTab === 'mentorship' ? (
          <View style={styles.mentorshipContainer}>
            {/* Sub Tabs */}
            {(!showMenteeForm && !showMentorForm) && (
              <View style={styles.subTabBar}>
                <TouchableOpacity
                  style={[styles.subTab, mentorshipTab === 'mentee' && styles.activeSubTab]}
                  onPress={() => setMentorshipTab('mentee')}
                >
                  <Text style={[styles.subTabText, mentorshipTab === 'mentee' && styles.activeSubTabText]}>Mentee</Text>
                  <Text style={[styles.subTabSubText, mentorshipTab === 'mentee' && styles.activeSubTabText]}>Mentee Profiles</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.subTab, mentorshipTab === 'mentor' && styles.activeSubTab]}
                  onPress={() => setMentorshipTab('mentor')}
                >
                  <Text style={[styles.subTabText, mentorshipTab === 'mentor' && styles.activeSubTabText]}>Mentor</Text>
                  <Text style={[styles.subTabSubText, mentorshipTab === 'mentor' && styles.activeSubTabText]}>Mentor Profiles</Text>
                </TouchableOpacity>
              </View>
            )}

            {mentorshipTab === 'mentee' ? renderMenteeView() : renderMentorView()}

          </View>
        ) : (
          <View style={styles.supportContainer}>
            <Text style={styles.supportHeading}>Show your Support to Our Mission</Text>
            <Text style={styles.supportText}>
              Every school and college under the RV Educational Institutions provides students the education they deserve to make the most of their lives. For those who are keen to leverage the power of education and create a better life for themselves, our institutions are always open — regardless of their background, abilities, age, or gender.
            </Text>
            <Text style={styles.supportText}>
              Your contribution today can help someone build a tomorrow that they have only dreamed of. Open your hearts to our cause by donating a denomination of your choice.
            </Text>

            <View style={styles.bankCard}>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>BANK</Text>
                <Text style={styles.bankValue}>CANARA BANK, ASHOKA PILLAR BR BANGALORE</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Name of the Account and SB A/c No.</Text>
                <Text style={styles.bankValue}>RASHTREEYA SIKSHANA SAMITHI TRUST - 0428101011839</Text>
              </View>
              <View style={[styles.bankRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.bankLabel}>IFSC CODE NO:</Text>
                <Text style={styles.bankValue}>CNRB0000428</Text>
              </View>
            </View>

            <Text style={styles.noteHeading}>Note:</Text>
            <Text style={styles.supportText}>
              The same will be accounted and receipt generated on receipt of the following details which is to be sent to the Trust office by hard copy or through email id: <Text style={styles.emailText}>rv@rvei.edu.in</Text> / <Text style={styles.emailText}>ananda.rsst@rvei.edu.in</Text>.
            </Text>

            <View style={styles.bulletList}>
              <View style={styles.bulletItem}><View style={styles.bullet} /><Text style={styles.bulletText}>Name of the donor</Text></View>
              <View style={styles.bulletItem}><View style={styles.bullet} /><Text style={styles.bulletText}>Address with any statutory proof (Aadhaar card/DL/passport/voter ID)</Text></View>
              <View style={styles.bulletItem}><View style={styles.bullet} /><Text style={styles.bulletText}>Pan card copy (mandatory)</Text></View>
              <View style={styles.bulletItem}><View style={styles.bullet} /><Text style={styles.bulletText}>Purpose of the donation</Text></View>
              <View style={styles.bulletItem}><View style={styles.bullet} /><Text style={styles.bulletText}>Amount with DD/ UTR No./date of remittance with bank details with branch</Text></View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.card,
  },
  
  // Header matched with JobsScreen/DashboardScreen
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    color: theme.card,
    fontSize: 13,
    fontWeight: '700',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 38,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    position: 'relative',
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.danger,
    borderWidth: 1,
    borderColor: theme.card,
  },
  
  // Main Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.card,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.text,
  },
  tabText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: theme.textMuted,
  },
  activeTabText: {
    color: theme.text,
    fontWeight: '700',
  },

  content: {
    padding: 16,
    paddingBottom: 60,
  },
  
  // Mentorship Sub Tabs
  mentorshipContainer: {
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: theme.cardSecondary || '#F1F5F9',
    borderRadius: 10,
    marginBottom: 16,
    padding: 3,
    overflow: 'hidden',
  },
  subTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  activeSubTab: {
    backgroundColor: theme.card,
    borderWidth: 1.5,
    borderColor: theme.primary,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  subTabSubText: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },
  activeSubTabText: {
    color: theme.primary,
    fontWeight: '700',
  },

  // Card (Mentee/Mentor Register intro)
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
  },
  cardDesc: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  registerBtn: {
    backgroundColor: theme.buttonBackground || theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  registerBtnText: {
    color: theme.buttonText || '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Form
  formContainer: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginLeft: 8,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  formTitleLight: {
    fontWeight: '400',
    color: theme.textSecondary,
  },
  titleUnderline: {
    height: 3,
    width: 24,
    backgroundColor: theme.primary,
    marginTop: 4,
  },
  sampleLink: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },

  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14.5,
    color: theme.text,
    backgroundColor: theme.background,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputHelp: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 6,
  },
  addKeywordBtn: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
    marginTop: 6,
  },

  registerSubmitBtn: {
    backgroundColor: theme.text,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  registerSubmitBtnText: {
    color: theme.card,
    fontSize: 14,
    fontWeight: '700',
  },

  // Support Community
  supportContainer: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  supportHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 16,
  },
  supportText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 16,
  },
  bankCard: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    marginTop: 8,
  },
  bankRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  bankLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
    width: '100%',
    marginBottom: 4,
  },
  bankValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  noteHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 8,
  },
  emailText: {
    color: theme.primary,
    fontWeight: '600',
  },
  bulletList: {
    marginTop: 8,
    gap: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.text,
    marginTop: 8,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 20,
  },
});

export default ContributeScreen;
