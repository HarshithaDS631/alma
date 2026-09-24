import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, ScrollView, TextInput, Platform, Image, Alert, Modal } from 'react-native';
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
  const { isAdminOrSuper, userRole } = useUserRole();

  const [currentUser, setCurrentUser] = useState(null);
  const [userInitials, setUserInitials] = useState('MA');
  const [userAvatarUrl, setUserAvatarUrl] = useState('');

  const DEFAULT_APPLICATIONS = [
    {
      id: 'app-seed-1',
      type: 'Mentee',
      applicantName: 'Arjun Mehta',
      applicantEmail: 'arjun.mehta@alumni.rv.edu',
      applicantRole: 'Alumni',
      applicantInstitution: 'RV College of Engineering',
      keyword: 'Cloud Architecture, Microservices, Kubernetes',
      why: 'Transitioning to Tech Lead role and seeking guidance on enterprise cloud scalability.',
      guidance: 'Hands-on system design best practices and CI/CD automation.',
      progress: '3 years experience in backend Node.js and AWS.',
      activities: 'IEEE Student Chapter volunteer, Coding Club coordinator.',
      status: 'Pending',
      appliedAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'app-seed-2',
      type: 'Mentor',
      applicantName: 'Dr. Priya Rao',
      applicantEmail: 'priya.rao@alumni.rv.edu',
      applicantRole: 'Alumni',
      applicantInstitution: 'RV Institute of Management',
      keyword: 'Product Strategy, FinTech, Early-stage Venture',
      info: 'VP of Product at a Series B FinTech firm. Happy to help budding entrepreneurs and product managers.',
      status: 'Approved',
      appliedAt: new Date(Date.now() - 3600000 * 72).toISOString()
    }
  ];

  const [applications, setApplications] = useState(DEFAULT_APPLICATIONS);
  const [adminFilter, setAdminFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [adminSearch, setAdminSearch] = useState('');
  const [sampleModalVisible, setSampleModalVisible] = useState(false);

  // Remittance Modal State
  const [remittanceModalVisible, setRemittanceModalVisible] = useState(false);
  const [remittanceName, setRemittanceName] = useState('');
  const [remittanceAmount, setRemittanceAmount] = useState('');
  const [remittanceUtr, setRemittanceUtr] = useState('');
  const [remittancePurpose, setRemittancePurpose] = useState('Scholarship & Education Fund');
  const [submittingRemittance, setSubmittingRemittance] = useState(false);

  const loadApplications = async () => {
    try {
      const stored = await AsyncStorage.getItem('mentorshipApplications');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setApplications(parsed);
          return;
        }
      }
      // Seed default applications if none exist
      await AsyncStorage.setItem('mentorshipApplications', JSON.stringify(DEFAULT_APPLICATIONS));
      setApplications(DEFAULT_APPLICATIONS);
    } catch (_) {}
  };

  const loadUser = async () => {
    try {
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      if (userInfoStr) {
        const u = JSON.parse(userInfoStr);
        setCurrentUser(u);
        if (u?.name) {
          setUserInitials(getInitials(u.name));
        }
        const rawAv = u?.avatar_url || u?.profilePicture;
        if (rawAv) setUserAvatarUrl(getImageUrl(rawAv));
      }
    } catch (_e) {}
  };

  useEffect(() => {
    loadUser();
    loadApplications();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
      loadApplications();
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

  // User's own application status
  const currentUserId = currentUser?._id || currentUser?.id;
  const currentUserMenteeApp = applications.find(a => 
    a.type === 'Mentee' && (
      (currentUserId && a.userId === currentUserId) || 
      (currentUser?.email && a.applicantEmail === currentUser.email) ||
      (currentUser?.name && a.applicantName === currentUser.name)
    )
  );

  const currentUserMentorApp = applications.find(a => 
    a.type === 'Mentor' && (
      (currentUserId && a.userId === currentUserId) || 
      (currentUser?.email && a.applicantEmail === currentUser.email) ||
      (currentUser?.name && a.applicantName === currentUser.name)
    )
  );

  const handleRegisterMentee = async () => {
    if (!menteeKeyword.trim() && !menteeWhy.trim()) {
      Alert.alert('Required Information', 'Please provide the areas you need mentorship in or the reason for your application.');
      return;
    }

    const newApp = {
      id: Date.now().toString(),
      userId: currentUserId || '',
      type: 'Mentee',
      applicantName: currentUser?.name || 'Alumni Member',
      applicantEmail: currentUser?.email || '',
      applicantRole: userRole || 'Alumni',
      applicantInstitution: currentUser?.institution || 'RV Educational Institutions',
      keyword: menteeKeyword.trim() || 'General Career Guidance',
      why: menteeWhy.trim() || 'Seeking professional growth & guidance',
      guidance: menteeGuidance.trim() || 'General industry mentorship',
      progress: menteeProgress.trim() || 'In progress',
      activities: menteeActivities.trim() || 'Alumni community member',
      status: 'Pending',
      appliedAt: new Date().toISOString()
    };

    const updated = [newApp, ...applications.filter(a => a.id !== newApp.id)];
    setApplications(updated);
    try {
      await AsyncStorage.setItem('mentorshipApplications', JSON.stringify(updated));
    } catch (_) {}

    setShowMenteeForm(false);
    setMenteeKeyword('');
    setMenteeWhy('');
    setMenteeGuidance('');
    setMenteeProgress('');
    setMenteeActivities('');
    Alert.alert('Application Submitted 🎉', 'Your mentee registration has been submitted successfully and is pending review by the alumni committee.');
  };

  const handleRegisterMentor = async () => {
    if (!mentorKeyword.trim() && !mentorInfo.trim()) {
      Alert.alert('Required Information', 'Please provide the areas you can offer mentorship in or a brief bio.');
      return;
    }

    const newApp = {
      id: Date.now().toString(),
      userId: currentUserId || '',
      type: 'Mentor',
      applicantName: currentUser?.name || 'Alumni Member',
      applicantEmail: currentUser?.email || '',
      applicantRole: userRole || 'Alumni',
      applicantInstitution: currentUser?.institution || 'RV Educational Institutions',
      keyword: mentorKeyword.trim() || 'Leadership, Career Mentoring',
      info: mentorInfo.trim() || 'Alumni mentor ready to guide students & fellow alumni.',
      status: 'Pending',
      appliedAt: new Date().toISOString()
    };

    const updated = [newApp, ...applications.filter(a => a.id !== newApp.id)];
    setApplications(updated);
    try {
      await AsyncStorage.setItem('mentorshipApplications', JSON.stringify(updated));
    } catch (_) {}

    setShowMentorForm(false);
    setMentorKeyword('');
    setMentorInfo('');
    Alert.alert('Registration Submitted 🎉', 'Thank you for volunteering! Your mentor registration has been submitted and is pending review by the committee.');
  };

  const handleUpdateAppStatus = async (appId, newStatus) => {
    const updated = applications.map(app => 
      app.id === appId ? { ...app, status: newStatus } : app
    );
    setApplications(updated);
    try {
      await AsyncStorage.setItem('mentorshipApplications', JSON.stringify(updated));
    } catch (_) {}
    Alert.alert('Status Updated', `Application marked as ${newStatus}.`);
  };

  const handleCopyBankDetails = () => {
    const text = 'Rashtreeya Sikshana Samithi Trust\nBank: Canara Bank, Ashoka Pillar Br Bangalore\nA/C No: 0428101011839\nIFSC: CNRB0000428\nEmail: rv@rvei.edu.in';
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    Alert.alert('Bank Details Copied 📋', 'Account number (0428101011839) and IFSC (CNRB0000428) have been copied to your clipboard.');
  };

  const handleSubmitRemittance = async () => {
    if (!remittanceName.trim() || !remittanceAmount.trim() || !remittanceUtr.trim()) {
      Alert.alert('Missing Details', 'Please fill in your name, remittance amount, and UTR/reference number.');
      return;
    }
    setSubmittingRemittance(true);
    try {
      const record = {
        id: Date.now().toString(),
        donorName: remittanceName.trim(),
        amount: remittanceAmount.trim(),
        utr: remittanceUtr.trim(),
        purpose: remittancePurpose,
        date: new Date().toISOString(),
        institution: currentUser?.institution || 'RV Educational Institutions'
      };
      const existingStr = await AsyncStorage.getItem('alumniDonationRemittances');
      const list = existingStr ? JSON.parse(existingStr) : [];
      await AsyncStorage.setItem('alumniDonationRemittances', JSON.stringify([record, ...list]));
      setRemittanceModalVisible(false);
      setRemittanceName('');
      setRemittanceAmount('');
      setRemittanceUtr('');
      Alert.alert('Remittance Notified 🙏', 'Thank you for your generous contribution to RV Educational Institutions! Your remittance notification has been recorded, and the Trust office will verify and issue your 80G tax exemption receipt.');
    } catch (_e) {
      Alert.alert('Error', 'Unable to submit notification. Please email rv@rvei.edu.in directly.');
    } finally {
      setSubmittingRemittance(false);
    }
  };

  // ─── ADMIN: REVIEW APPLICATIONS TAB ─────────────────────────────
  const renderReviewTab = () => {
    const pendingCount = applications.filter(a => a.status === 'Pending').length;
    const approvedCount = applications.filter(a => a.status === 'Approved').length;
    const rejectedCount = applications.filter(a => a.status === 'Rejected').length;

    const filteredApplications = applications.filter(app => {
      const matchesFilter = adminFilter === 'all' || app.status.toLowerCase() === adminFilter.toLowerCase();
      const matchesSearch = !adminSearch.trim() || 
        (app.applicantName || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
        (app.keyword || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
        (app.type || '').toLowerCase().includes(adminSearch.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    return (
      <View style={styles.mentorshipContainer}>
        <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 18, borderWidth: 1, borderColor: theme.border, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <Ionicons name="shield-checkmark" size={24} color="#003366" style={{ marginRight: 12 }} />
            <View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Mentorship Applications</Text>
              <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Review and manage mentorship requests</Text>
            </View>
          </View>
          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity 
              onPress={() => setAdminFilter('pending')}
              style={{ flex: 1, backgroundColor: adminFilter === 'pending' ? '#DBEAFE' : '#EFF6FF', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: adminFilter === 'pending' ? 1.5 : 0, borderColor: '#003366' }}
            >
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#003366' }}>{pendingCount}</Text>
              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 }}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setAdminFilter('approved')}
              style={{ flex: 1, backgroundColor: adminFilter === 'approved' ? '#D1FAE5' : '#ECFDF5', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: adminFilter === 'approved' ? 1.5 : 0, borderColor: '#059669' }}
            >
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#059669' }}>{approvedCount}</Text>
              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 }}>Approved</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setAdminFilter('rejected')}
              style={{ flex: 1, backgroundColor: adminFilter === 'rejected' ? '#FEE2E2' : '#FEF2F2', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: adminFilter === 'rejected' ? 1.5 : 0, borderColor: '#DC2626' }}
            >
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#DC2626' }}>{rejectedCount}</Text>
              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 }}>Rejected</Text>
            </TouchableOpacity>
          </View>

          {/* Search inside review */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 10, height: 38, marginTop: 14 }}>
            <Ionicons name="search-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
            <TextInput
              style={{ flex: 1, fontSize: 13, color: '#0F172A' }}
              placeholder="Search by name, role, or keywords..."
              placeholderTextColor="#94A3B8"
              value={adminSearch}
              onChangeText={setAdminSearch}
            />
            {adminSearch.length > 0 && (
              <TouchableOpacity onPress={() => setAdminSearch('')}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Pills */}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setAdminFilter(f)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 16,
                  backgroundColor: adminFilter === f ? '#003366' : '#F1F5F9',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: adminFilter === f ? '#FFFFFF' : '#475569', textTransform: 'capitalize' }}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Application Cards */}
        {filteredApplications.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 50 }}>
            <Ionicons name="document-text-outline" size={50} color="#CBD5E1" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#475569', marginTop: 14 }}>No Applications Found</Text>
            <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 6, textAlign: 'center', paddingHorizontal: 30 }}>
              {adminSearch ? 'Try a different search term or clear the filter.' : 'Applications from alumni will appear here for review.'}
            </Text>
          </View>
        ) : (
          filteredApplications.map(app => {
            const isApproved = app.status === 'Approved';
            const isRejected = app.status === 'Rejected';
            const isMentee = app.type === 'Mentee';

            return (
              <View 
                key={app.id} 
                style={{ 
                  backgroundColor: theme.card, 
                  borderRadius: 12, 
                  padding: 16, 
                  borderWidth: 1, 
                  borderColor: theme.border, 
                  marginBottom: 14,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 2,
                  elevation: 1
                }}
              >
                {/* Header row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ backgroundColor: isMentee ? '#F3E8FF' : '#E0F2FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: isMentee ? '#7E22CE' : '#0369A1' }}>
                        {app.type?.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{app.applicantName}</Text>
                  </View>
                  <View style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 12,
                    backgroundColor: isApproved ? '#ECFDF5' : isRejected ? '#FEF2F2' : '#FFFBEB'
                  }}>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: isApproved ? '#059669' : isRejected ? '#DC2626' : '#D97706'
                    }}>
                      {app.status}
                    </Text>
                  </View>
                </View>

                {/* Subtitle */}
                <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>
                  {app.applicantInstitution} • {new Date(app.appliedAt).toLocaleDateString()}
                </Text>

                {/* Focus areas */}
                <View style={{ backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 2 }}>
                    {isMentee ? 'MENTORSHIP DOMAINS / KEYWORDS' : 'EXPERTISE OFFERED'}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '500' }}>{app.keyword}</Text>
                </View>

                {/* Details */}
                {isMentee && app.why ? (
                  <Text style={{ fontSize: 12.5, color: '#475569', lineHeight: 18, marginBottom: 6 }}>
                    <Text style={{ fontWeight: '700' }}>Reason: </Text>{app.why}
                  </Text>
                ) : null}

                {isMentee && app.guidance ? (
                  <Text style={{ fontSize: 12.5, color: '#475569', lineHeight: 18, marginBottom: 8 }}>
                    <Text style={{ fontWeight: '700' }}>Field Guidance: </Text>{app.guidance}
                  </Text>
                ) : null}

                {!isMentee && app.info ? (
                  <Text style={{ fontSize: 12.5, color: '#475569', lineHeight: 18, marginBottom: 8 }}>
                    <Text style={{ fontWeight: '700' }}>Bio: </Text>{app.info}
                  </Text>
                ) : null}

                {/* Action buttons */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 }}>
                  <TouchableOpacity
                    onPress={() => handleUpdateAppStatus(app.id, 'Approved')}
                    style={{
                      flex: 1,
                      backgroundColor: isApproved ? '#059669' : '#ECFDF5',
                      paddingVertical: 8,
                      borderRadius: 6,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#059669'
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: isApproved ? '#FFFFFF' : '#059669' }}>
                      {isApproved ? 'Approved ✓' : 'Approve'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleUpdateAppStatus(app.id, 'Rejected')}
                    style={{
                      flex: 1,
                      backgroundColor: isRejected ? '#DC2626' : '#FEF2F2',
                      paddingVertical: 8,
                      borderRadius: 6,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#DC2626'
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: isRejected ? '#FFFFFF' : '#DC2626' }}>
                      {isRejected ? 'Rejected ✗' : 'Reject'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  };

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
            <TouchableOpacity onPress={() => setSampleModalVisible(true)}>
              <Text style={styles.sampleLink}>View Sample Applications</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Which areas are you looking for mentorship</Text>
            <TextInput 
              style={styles.textInput} 
              placeholder="e.g. Higher Studies, AI, Product Management" 
              placeholderTextColor="#94A3B8"
              value={menteeKeyword}
              onChangeText={setMenteeKeyword}
            />
            <Text style={styles.inputHelp}>Higher Studies, Entrepreneurship, Civil services, Finance, etc.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Why do you want an alumni mentor?</Text>
            <TextInput 
              style={[styles.textInput, styles.textArea]} 
              placeholder="Describe your motivation and career objectives..."
              placeholderTextColor="#94A3B8"
              multiline 
              numberOfLines={4}
              value={menteeWhy}
              onChangeText={setMenteeWhy}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Describe in detail the field(s) that you require guidance in.</Text>
            <TextInput 
              style={[styles.textInput, styles.textArea]} 
              placeholder="E.g : Start-ups, research, system design, mock interviews..."
              placeholderTextColor="#94A3B8"
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
              placeholder="Mention your relevant projects, coursework, or work experience..."
              placeholderTextColor="#94A3B8"
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
              placeholder="Clubs, chapters, teams, or student initiatives..."
              placeholderTextColor="#94A3B8"
              multiline 
              numberOfLines={4}
              value={menteeActivities}
              onChangeText={setMenteeActivities}
            />
          </View>

          <TouchableOpacity style={styles.registerSubmitBtn} onPress={handleRegisterMentee}>
            <Text style={styles.registerSubmitBtnText}>Submit Registration</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        {/* Active Application Status Banner if already registered */}
        {currentUserMenteeApp && (
          <View style={{ backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={20} color="#003366" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#003366' }}>Mentee Registration Active</Text>
              </View>
              <View style={{ backgroundColor: currentUserMenteeApp.status === 'Approved' ? '#ECFDF5' : currentUserMenteeApp.status === 'Rejected' ? '#FEF2F2' : '#FFFBEB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: currentUserMenteeApp.status === 'Approved' ? '#059669' : currentUserMenteeApp.status === 'Rejected' ? '#DC2626' : '#D97706' }}>
                  {currentUserMenteeApp.status}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>
              <Text style={{ fontWeight: '600' }}>Focus Areas: </Text>{currentUserMenteeApp.keyword}
            </Text>
            <Text style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
              Applied on {new Date(currentUserMenteeApp.appliedAt).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Register as a mentee</Text>
          <Text style={styles.cardDesc}>
            This is an initiative by Institution and is managed by the Alumni team of Institution. The goal is to encourage alumni to seek out mentors amongst themselves for their overall development in a professional and personal sense.
          </Text>
          <TouchableOpacity style={styles.registerBtn} onPress={() => setShowMenteeForm(true)}>
            <Text style={styles.registerBtnText}>{currentUserMenteeApp ? 'Update Registration' : 'Register'}</Text>
          </TouchableOpacity>
        </View>
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
            <TouchableOpacity onPress={() => setSampleModalVisible(true)}>
              <Text style={styles.sampleLink}>View Sample Applications</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Areas where you can offer mentorship</Text>
            <TextInput 
              style={styles.textInput} 
              placeholder="e.g. Higher Studies, Entrepreneurship, FinTech, AI" 
              placeholderTextColor="#94A3B8"
              value={mentorKeyword}
              onChangeText={setMentorKeyword}
            />
            <Text style={styles.inputHelp}>Higher Studies, Entrepreneurship, Civil services, Finance, etc.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Info about you and your experience</Text>
            <TextInput 
              style={[styles.textInput, styles.textArea]} 
              placeholder="Share your current role, company, years of experience, and how you can support mentees..."
              placeholderTextColor="#94A3B8"
              multiline 
              numberOfLines={4}
              value={mentorInfo}
              onChangeText={setMentorInfo}
            />
          </View>

          <TouchableOpacity style={styles.registerSubmitBtn} onPress={handleRegisterMentor}>
            <Text style={styles.registerSubmitBtnText}>Submit Registration</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        {/* Active Application Status Banner if already registered */}
        {currentUserMentorApp && (
          <View style={{ backgroundColor: '#ECFDF5', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#A7F3D0', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="ribbon" size={20} color="#059669" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#065F46' }}>Mentor Registration Active</Text>
              </View>
              <View style={{ backgroundColor: currentUserMentorApp.status === 'Approved' ? '#D1FAE5' : currentUserMentorApp.status === 'Rejected' ? '#FEE2E2' : '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: currentUserMentorApp.status === 'Approved' ? '#059669' : currentUserMentorApp.status === 'Rejected' ? '#DC2626' : '#D97706' }}>
                  {currentUserMentorApp.status}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>
              <Text style={{ fontWeight: '600' }}>Mentorship Areas: </Text>{currentUserMentorApp.keyword}
            </Text>
            <Text style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
              Registered on {new Date(currentUserMentorApp.appliedAt).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Register as a mentor</Text>
          <Text style={styles.cardDesc}>
            {"A Great mentor inspires every achiever. Keeping this in mind, Institution has come up with this new initiative where a mentor can provide support, advice, and feedback by reaching out to mentees themselves and leveraging each other's personal and professional experience. The alumni team of Institution manages this initiative."}
          </Text>
          <TouchableOpacity style={styles.registerBtn} onPress={() => setShowMentorForm(true)}>
            <Text style={styles.registerBtnText}>{currentUserMentorApp ? 'Update Registration' : 'Register'}</Text>
          </TouchableOpacity>
        </View>
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

              {/* Action Buttons for Giving */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12 }}>
                <TouchableOpacity
                  onPress={handleCopyBankDetails}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    backgroundColor: '#003366',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center'
                  }}
                >
                  <Ionicons name="copy-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Copy Bank Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setRemittanceModalVisible(true)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    backgroundColor: '#ECFDF5',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#059669'
                  }}
                >
                  <Ionicons name="receipt-outline" size={16} color="#059669" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#059669', fontSize: 13, fontWeight: '700' }}>Notify Remittance</Text>
                </TouchableOpacity>
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

      {/* ─── Sample Applications Modal ───────────────────────────── */}
      <Modal visible={sampleModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 16, maxHeight: '80%', padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Sample Applications</Text>
              <TouchableOpacity onPress={() => setSampleModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ backgroundColor: '#EFF6FF', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#003366', marginBottom: 6 }}>Mentee Sample: Cloud & AI Career Guidance</Text>
                <Text style={{ fontSize: 12.5, color: '#334155', lineHeight: 18 }}>
                  <Text style={{ fontWeight: '600' }}>Why an alumni mentor: </Text>
                  Transitioning from individual contributor to engineering manager in distributed cloud systems.
                </Text>
                <Text style={{ fontSize: 12.5, color: '#334155', lineHeight: 18, marginTop: 4 }}>
                  <Text style={{ fontWeight: '600' }}>Guidance needed: </Text>
                  Microservices scalability, cloud cost governance, team leadership.
                </Text>
              </View>

              <View style={{ backgroundColor: '#ECFDF5', borderRadius: 10, padding: 14 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#065F46', marginBottom: 6 }}>Mentor Sample: Product Strategy & Startups</Text>
                <Text style={{ fontSize: 12.5, color: '#334155', lineHeight: 18 }}>
                  <Text style={{ fontWeight: '600' }}>Areas offered: </Text>
                  FinTech product management, 0-to-1 customer discovery, seed venture pitching.
                </Text>
                <Text style={{ fontSize: 12.5, color: '#334155', lineHeight: 18, marginTop: 4 }}>
                  <Text style={{ fontWeight: '600' }}>Bio: </Text>
                  10+ years leading product initiatives across Bengaluru & Singapore.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Remittance Notification Modal ───────────────────────────── */}
      <Modal visible={remittanceModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 16, maxHeight: '85%', padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Notify Remittance</Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>Help the Trust issue your 80G tax receipt</Text>
              </View>
              <TouchableOpacity onPress={() => setRemittanceModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Donor Full Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Your full legal name as per PAN"
                  placeholderTextColor="#94A3B8"
                  value={remittanceName}
                  onChangeText={setRemittanceName}
                />
              </View>

              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Remittance Amount (INR ₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 10000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={remittanceAmount}
                  onChangeText={setRemittanceAmount}
                />
              </View>

              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Bank Reference / UTR Number *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. UTR / NEFT / IMPS / UPI Ref No."
                  placeholderTextColor="#94A3B8"
                  value={remittanceUtr}
                  onChangeText={setRemittanceUtr}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Purpose of Donation</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Scholarship, Infrastructure, Lab Fund..."
                  placeholderTextColor="#94A3B8"
                  value={remittancePurpose}
                  onChangeText={setRemittancePurpose}
                />
              </View>

              <TouchableOpacity
                onPress={handleSubmitRemittance}
                disabled={submittingRemittance}
                style={{
                  backgroundColor: '#003366',
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                  {submittingRemittance ? 'Recording...' : 'Submit Remittance Details'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
