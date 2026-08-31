import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  Modal,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Image
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { fetchResumeBook, shareCandidateResume } from '../services/jobService';
import { getImageUrl } from '../services/uploadService';
import getInitials from '../lib/getInitials';

const DUMMY_JOBS = [];

const WORK_MODES = ['Full-Time', 'Part-Time', 'Remote', 'Hybrid', 'Contract', 'Internship'];

// ─── JOB CARD COMPONENT ──────────────────────────────────────────────
function JobCard({ item, onPress, onDelete, isSmallScreen }) {
  return (
    <View style={s.jobCard}>
      <View style={s.jobCardHeader}>
        <TouchableOpacity
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
          activeOpacity={0.7}
          onPress={() => onPress(item)}
        >
          <View style={[s.jobLogo, isSmallScreen && { width: 40, height: 40, marginRight: 8 }]}>
            <Ionicons name="business-outline" size={isSmallScreen ? 20 : 24} color="#003366" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.jobRole, isSmallScreen && { fontSize: 14 }]} numberOfLines={1}>{item.role}</Text>
            <Text style={[s.jobCompany, isSmallScreen && { fontSize: 12 }]}>{item.company}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={{ padding: 4 }} activeOpacity={0.7} onPress={() => onDelete(item.id)}>
          <Ionicons name="close-circle" size={isSmallScreen ? 20 : 24} color="#EF4444" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity activeOpacity={0.7} onPress={() => onPress(item)}>
        <View style={s.badgeRow}>
          <View style={s.badge}><Text style={s.badgeText}>{item.workMode}</Text></View>
          <View style={s.badge}><Text style={s.badgeText}>{item.experience}</Text></View>
          <View style={s.badge}><Text style={s.badgeText}>{item.location}</Text></View>
        </View>
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Ionicons name="eye-outline" size={16} color="#64748B" />
            <Text style={s.statText}>{item.views} Views</Text>
          </View>
          <View style={s.statItem}>
            <Ionicons name="document-text-outline" size={16} color="#64748B" />
            <Text style={s.statText}>{item.applied} Applied</Text>
          </View>
          <View style={s.statItem}>
            <Ionicons name="share-social-outline" size={16} color="#64748B" />
            <Text style={s.statText}>{item.shared || 0} Shared</Text>
          </View>
        </View>
        <View style={s.viewMoreBtn}>
          <Text style={s.viewMoreText}>View More</Text>
          <Ionicons name="arrow-forward" size={16} color="#003366" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── RESUME CARD COMPONENT ───────────────────────────────────────────
function ResumeCard({ item, onShowResume, onForward }) {
  const avatarUrl = item.avatar_url || item.profilePicture;
  const initials = getInitials(item.name || 'Alumni');
  const skills = Array.isArray(item.skills) ? item.skills : (typeof item.skills === 'string' ? item.skills.split(',').map(s => s.trim()).filter(Boolean) : []);

  return (
    <View style={s.resumeCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        {avatarUrl ? (
          <Image source={{ uri: getImageUrl(avatarUrl) }} style={s.resumeAvatarImage} />
        ) : (
          <View style={s.resumeAvatar}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>{initials}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#002144' }}>{item.name}</Text>
          <Text style={{ fontSize: 12.5, fontWeight: '500', color: '#64748B', marginTop: 2 }}>
            {item.designation || item.headline || 'Alumni Member'} {item.company ? `• ${item.company}` : ''}
          </Text>
          <Text style={{ fontSize: 11.5, color: '#0055A5', fontWeight: '600', marginTop: 1 }}>
            {item.institution || 'Alumni Network'} {item.department ? `(${item.department})` : ''} {item.batchYear ? `'${String(item.batchYear).slice(-2)}` : ''}
          </Text>
        </View>
      </View>

      {skills.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
          {skills.map((skill, index) => (
            <View key={`${skill}-${index}`} style={s.skillPill}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#003366' }}>{skill}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ marginBottom: 12, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#F1F5F9' }}>
        {Boolean(item.domain) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="grid-outline" size={13} color="#64748B" />
            <Text style={{ fontSize: 12.5, color: '#334155', marginLeft: 6, fontWeight: '500' }}>
              Domain: <Text style={{ fontWeight: '600', color: '#002144' }}>{item.domain}</Text>
            </Text>
          </View>
        )}
        {Boolean(item.experienceYears) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="time-outline" size={13} color="#64748B" />
            <Text style={{ fontSize: 12.5, color: '#334155', marginLeft: 6, fontWeight: '500' }}>
              Experience: <Text style={{ fontWeight: '600', color: '#002144' }}>{item.experienceYears}</Text>
            </Text>
          </View>
        )}
        {Boolean(item.resumeFileName || item.resumeUrl) && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="document-attach-outline" size={13} color="#10B981" />
            <Text style={{ fontSize: 12, color: '#10B981', marginLeft: 6, fontWeight: '600' }} numberOfLines={1}>
              {item.resumeFileName || 'Resume Attached (PDF)'}
            </Text>
          </View>
        )}
      </View>

      {Boolean(item.bio) && (
        <Text style={{ fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 12 }} numberOfLines={2}>
          {item.bio}
        </Text>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity 
          style={[s.resumeActionBtn, !item.resumeUrl && { borderColor: '#CBD5E1', opacity: 0.6 }]} 
          activeOpacity={0.7}
          onPress={() => onShowResume(item)}
        >
          <Ionicons name="document-text-outline" size={16} color={item.resumeUrl ? '#003366' : '#94A3B8'} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: item.resumeUrl ? '#003366' : '#94A3B8', marginLeft: 6 }}>
            {item.resumeUrl ? 'Show Resume' : 'No Resume'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.resumeActionBtn, { backgroundColor: '#003366', borderColor: '#003366', marginLeft: 8, marginRight: 0 }]} 
          activeOpacity={0.7}
          onPress={() => onForward(item)}
        >
          <Ionicons name="mail-outline" size={16} color="#FFFFFF" />
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF', marginLeft: 6 }}>Forward</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── MAIN SCREEN COMPONENT ──────────────────────────────────────────
export default function AdminJobsScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 400;
  const isSuperAdmin = route?.params?.isSuperAdmin || false;
  const isFocused = useIsFocused();
  const [selectedInstitution, setSelectedInstitution] = useState(global.selectedInstitution || 'All');
  const [selectedWorkMode, setSelectedWorkMode] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [screen, setScreen] = useState('list');
  const [jobs, setJobs] = useState(DUMMY_JOBS);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false); // work mode picker inside editor

  const [fRole, setFRole] = useState('');
  const [fCompany, setFCompany] = useState('');
  const [fMode, setFMode] = useState('');
  const [fExp, setFExp] = useState('');
  const [fLoc, setFLoc] = useState('');
  const [fDesc, setFDesc] = useState('');

  // Resume Book States
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [resumeSearch, setResumeSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');

  // Forward Email Modal States
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [fwdEmail, setFwdEmail] = useState('');
  const [fwdSubject, setFwdSubject] = useState('');
  const [fwdMessage, setFwdMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Sync selected institution with global value when screen is focused
  useEffect(() => {
    if (isFocused && isSuperAdmin && global.selectedInstitution) {
      setSelectedInstitution(global.selectedInstitution);
    }
  }, [isFocused, isSuperAdmin]);

  const loadResumeBook = useCallback(async () => {
    setLoadingResumes(true);
    try {
      const filters = {};
      if (selectedInstitution && selectedInstitution !== 'All') {
        filters.institution = selectedInstitution;
      }
      if (resumeSearch.trim()) {
        filters.search = resumeSearch.trim();
      }
      if (selectedDomain && selectedDomain !== 'All') {
        filters.domain = selectedDomain;
      }
      const data = await fetchResumeBook(filters);
      setResumes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading resume book:', e);
      setResumes([]);
    } finally {
      setLoadingResumes(false);
    }
  }, [selectedInstitution, resumeSearch, selectedDomain]);

  useEffect(() => {
    if (screen === 'resume') {
      loadResumeBook();
    }
  }, [screen, loadResumeBook]);

  const handleShowResume = (candidate) => {
    if (!candidate.resumeUrl) {
      if (Platform.OS === 'web') alert('No resume document uploaded for this candidate yet.');
      else Alert.alert('Notice', 'No resume document uploaded for this candidate yet.');
      return;
    }
    const fullUrl = getImageUrl(candidate.resumeUrl);
    if (Platform.OS === 'web') {
      window.open(fullUrl, '_blank');
    } else {
      Alert.alert('Candidate Resume', fullUrl);
    }
  };

  const handleOpenForward = (candidate) => {
    setSelectedCandidate(candidate);
    setFwdEmail('');
    setFwdSubject(`Candidate Referral: ${candidate.name} (${candidate.institution || 'Alumni'})`);
    setFwdMessage(`Please find attached the profile and resume of ${candidate.name}, ${candidate.designation || 'Alumni'} from ${candidate.institution || 'our network'}.`);
    setForwardModalVisible(true);
  };

  const handleSendResumeEmail = async () => {
    if (!selectedCandidate || !fwdEmail.trim()) {
      if (Platform.OS === 'web') alert('Please enter a recipient email address.');
      else Alert.alert('Required', 'Please enter a recipient email address.');
      return;
    }
    setSendingEmail(true);
    try {
      await shareCandidateResume({
        candidateId: selectedCandidate._id,
        recipientEmail: fwdEmail.trim(),
        subject: fwdSubject.trim(),
        message: fwdMessage.trim()
      });
      setForwardModalVisible(false);
      if (Platform.OS === 'web') alert(`✓ Candidate profile & resume forwarded to ${fwdEmail.trim()} successfully!`);
      else Alert.alert('Success', `Candidate profile & resume forwarded to ${fwdEmail.trim()} successfully!`);
    } catch (err) {
      console.error('Error forwarding resume:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to send resume email';
      if (Platform.OS === 'web') alert(`Error: ${msg}`);
      else Alert.alert('Error', msg);
    } finally {
      setSendingEmail(false);
    }
  };

  const clearForm = () => {
    setFRole(''); setFCompany(''); setFMode(''); setFExp(''); setFLoc(''); setFDesc(''); 
  };

  const postJob = () => {
    if (!fRole.trim() || !fCompany.trim()) { 
      if (Platform.OS === 'web') window.alert('Missing: Fill in Role and Company.');
      else Alert.alert('Missing', 'Fill in Role and Company.');
      return; 
    }
    setJobs([{
      id: String(Date.now()), role: fRole.trim(), company: fCompany.trim(),
      workMode: fMode || 'Full-Time', experience: fExp.trim() || 'Not specified',
      location: fLoc.trim() || 'Not specified', views: 0, applied: 0, shared: 0,
      description: fDesc.trim() || 'No description provided.',
      institution: isSuperAdmin ? selectedInstitution === 'All' ? 'RVCE' : selectedInstitution : 'RVITM',
    }, ...jobs]);
    clearForm();
    setScreen('list');
    if (Platform.OS === 'web') window.alert('Job posted!');
    else Alert.alert('Success', 'Job posted!');
  };

  const deleteJob = (id) => {
    Alert.alert('Delete', 'Delete this job?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setJobs(jobs.filter(j => j.id !== id));
        if (detail && detail.id === id) { setDetail(null); setScreen('list'); }
      }},
    ]);
  };

  const openDetail = (job) => { setDetail(job); setScreen('detail'); };

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      if (isSuperAdmin && selectedInstitution !== 'All') {
        if (j.institution !== selectedInstitution) return false;
      }
      if (selectedWorkMode !== 'All') {
        if (j.workMode.toLowerCase() !== selectedWorkMode.toLowerCase()) return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return j.role.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.location.toLowerCase().includes(q);
    });
  }, [jobs, selectedInstitution, selectedWorkMode, search, isSuperAdmin]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedWorkMode !== 'All') count++;
    if (isSuperAdmin && selectedInstitution !== 'All') count++;
    return count;
  }, [selectedWorkMode, isSuperAdmin, selectedInstitution]);

  const handleResetFilters = () => {
    setSelectedWorkMode('All');
    if (isSuperAdmin) {
      setSelectedInstitution('All');
      global.selectedInstitution = 'All';
    }
  };

  // ─── HEADER (always shown) ─────────────────────────────────────
  const header = (
    <View style={s.header}>
      <TouchableOpacity
        onPress={() => navigation && navigation.navigate('AdminProfile')}
        activeOpacity={0.7}
      >
        <View style={[s.avatar, isSuperAdmin && { backgroundColor: '#D97706' }]}>
          <Text style={s.avatarText}>{isSuperAdmin ? 'SA' : 'AD'}</Text>
        </View>
      </TouchableOpacity>
      <View style={s.searchBar}>
        <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Search jobs..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <TouchableOpacity style={{ padding: 6 }} onPress={() => navigation && navigation.navigate('Messages')}>
        <Ionicons name="chatbubble-ellipses-outline" size={22} color="#003366" />
      </TouchableOpacity>
      <TouchableOpacity style={{ padding: 6 }} onPress={() => navigation && navigation.navigate('Notifications')}>
        <Ionicons name="notifications-outline" size={22} color="#003366" />
      </TouchableOpacity>
    </View>
  );

  // ─── SUB HEADER (back button) ──────────────────────────────────
  const subHeader = (title, onBack) => (
    <View style={s.subHeader}>
      <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color="#003366" />
      </TouchableOpacity>
      <Text style={s.subTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  // ─── RENDER ────────────────────────────────────────────────────
  if (screen === 'detail' && detail) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="#FFFFFF" />
        {header}
        {subHeader('Job Details', () => { setDetail(null); setScreen('list'); })}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={s.detailLogo}><Ionicons name="business-outline" size={36} color="#003366" /></View>
          </View>
          <Text style={s.detailRole}>{detail.role}</Text>
          <Text style={s.detailCompany}>{detail.company}</Text>
          <View style={s.badgeRow}>
            <View style={s.badge}><Text style={s.badgeText}>{detail.workMode}</Text></View>
            <View style={s.badge}><Text style={s.badgeText}>{detail.experience}</Text></View>
            <View style={s.badge}><Text style={s.badgeText}>{detail.location}</Text></View>
          </View>
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#002144', marginBottom: 10 }}>Job Description</Text>
            <Text style={{ fontSize: 14, color: '#64748B', lineHeight: 22 }}>{detail.description}</Text>
          </View>
          <View style={[s.statsRow, { marginTop: 24 }]}>
            <View style={s.statCard}><Text style={{ fontSize: 20, marginRight: 8 }}>👁</Text><Text style={s.statCardText}>{detail.views} Views</Text></View>
            <View style={s.statCard}><Text style={{ fontSize: 20, marginRight: 8 }}>📄</Text><Text style={s.statCardText}>{detail.applied} Applied</Text></View>
            <View style={s.statCard}><Text style={{ fontSize: 20, marginRight: 8 }}>🔗</Text><Text style={s.statCardText}>{detail.shared || 0} Shared</Text></View>
          </View>
        </ScrollView>
        <View style={s.footer}>
          <TouchableOpacity style={s.applyBtn} activeOpacity={0.8} onPress={() => Alert.alert('Applied!')}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Apply Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'resume') {
    const resumesCount = resumes.length;
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="#FFFFFF" />
        {header}
        {subHeader('Talent Resume Book', () => setScreen('list'))}

        {/* Search & Domain Filter Bar */}
        <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Ionicons name="search-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
            <TextInput
              style={{ flex: 1, fontSize: 14, color: '#0F172A', padding: 0 }}
              placeholder="Search candidate name, skills, or domain..."
              placeholderTextColor="#94A3B8"
              value={resumeSearch}
              onChangeText={setResumeSearch}
            />
            {resumeSearch ? (
              <TouchableOpacity onPress={() => setResumeSearch('')} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Overview Banner */}
        <View style={s.banner}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 }}>Alumni Talent Pipeline</Text>
              <Text style={{ fontSize: 12.5, color: '#CBD5E1', lineHeight: 18 }}>
                {isSuperAdmin && selectedInstitution !== 'All' ? `${selectedInstitution} • ` : ''}Verified candidate profiles & uploaded CVs ready for recruiter forwarding.
              </Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>{resumesCount}</Text>
              <Text style={{ fontSize: 10, color: '#BAE6FD', fontWeight: '700', textTransform: 'uppercase' }}>Candidates</Text>
            </View>
          </View>
        </View>

        {loadingResumes ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#003366" />
            <Text style={{ marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '600' }}>Loading Resume Book...</Text>
          </View>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={resumes}
            keyExtractor={item => item._id || String(item.id)}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ResumeCard 
                item={item} 
                onShowResume={handleShowResume}
                onForward={handleOpenForward}
              />
            )}
            ListEmptyComponent={() => (
              <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 48, paddingHorizontal: 24 }}>
                <Ionicons name="document-text-outline" size={56} color="#CBD5E1" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#334155', marginTop: 12 }}>No Candidates Found</Text>
                <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                  No alumni have uploaded a resume or registered as job seekers for {selectedInstitution === 'All' ? 'any institution' : selectedInstitution} yet.
                </Text>
              </View>
            )}
          />
        )}

        {/* ─── FORWARD EMAIL MODAL ─── */}
        <Modal
          visible={forwardModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setForwardModalVisible(false)}
        >
          <View style={s.modalOverlay}>
            <View style={[s.modalContent, { maxWidth: 440, borderRadius: 20, padding: 22 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                    <Ionicons name="mail" size={18} color="#003366" />
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#002144' }}>Forward Candidate</Text>
                </View>
                <TouchableOpacity onPress={() => setForwardModalVisible(false)} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={22} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {selectedCandidate && (
                <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#002144' }}>{selectedCandidate.name}</Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    {selectedCandidate.institution || 'Alumni Network'} • {selectedCandidate.department || 'General'}
                  </Text>
                  {selectedCandidate.resumeUrl ? (
                    <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '700', marginTop: 4 }}>✓ Resume attached ({selectedCandidate.resumeFileName || 'PDF'})</Text>
                  ) : (
                    <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '700', marginTop: 4 }}>⚠ No resume file attached to profile</Text>
                  )}
                </View>
              )}

              <Text style={s.label}>Recruiter / Recipient Email *</Text>
              <TextInput
                style={[s.input, { marginTop: 0 }]}
                placeholder="recruiter@company.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={fwdEmail}
                onChangeText={setFwdEmail}
              />

              <Text style={s.label}>Email Subject</Text>
              <TextInput
                style={[s.input, { marginTop: 0 }]}
                placeholder="Candidate referral subject"
                placeholderTextColor="#94A3B8"
                value={fwdSubject}
                onChangeText={setFwdSubject}
              />

              <Text style={s.label}>Message / Admin Recommendation</Text>
              <TextInput
                style={[s.input, { minHeight: 80, textAlignVertical: 'top', marginTop: 0 }]}
                placeholder="Add your note or recommendation..."
                placeholderTextColor="#94A3B8"
                value={fwdMessage}
                onChangeText={setFwdMessage}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[s.postBtn, { marginTop: 18 }]}
                activeOpacity={0.8}
                onPress={handleSendResumeEmail}
                disabled={sendingEmail}
              >
                {sendingEmail ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Send Candidate Resume</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  if (screen === 'editor') {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="#FFFFFF" />
        {header}
        {subHeader('Create Job Post', () => { clearForm(); setScreen('list'); })}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <Text style={s.label}>Role *</Text>
          <TextInput style={s.input} placeholder="e.g. Sr Software Engineer" placeholderTextColor="#94A3B8" value={fRole} onChangeText={setFRole} />
          <Text style={s.label}>Company *</Text>
          <TextInput style={s.input} placeholder="e.g. Google" placeholderTextColor="#94A3B8" value={fCompany} onChangeText={setFCompany} />
          <Text style={s.label}>Work Mode</Text>
          <TouchableOpacity style={s.selector} activeOpacity={0.7} onPress={() => setModalVisible(true)}>
            <Text style={{ fontSize: 14, color: fMode ? '#0F172A' : '#94A3B8' }}>{fMode || 'Select work mode'}</Text>
            <Ionicons name="chevron-down" size={20} color="#64748B" />
          </TouchableOpacity>
          <Text style={s.label}>Experience</Text>
          <TextInput style={s.input} placeholder="e.g. 3-5 years" placeholderTextColor="#94A3B8" value={fExp} onChangeText={setFExp} />
          <Text style={s.label}>Location</Text>
          <TextInput style={s.input} placeholder="e.g. Bengaluru" placeholderTextColor="#94A3B8" value={fLoc} onChangeText={setFLoc} />
          <Text style={s.label}>Description</Text>
          <TextInput style={[s.input, { minHeight: 120, textAlignVertical: 'top' }]} placeholder="Enter job description..." placeholderTextColor="#94A3B8" value={fDesc} onChangeText={setFDesc} multiline numberOfLines={6} />
          <TouchableOpacity style={s.postBtn} activeOpacity={0.8} onPress={postJob}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginLeft: 8 }}>Post Job</Text>
          </TouchableOpacity>
        </ScrollView>
        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
            <View style={s.modalContent}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#002144', marginBottom: 16, textAlign: 'center' }}>Select Work Mode</Text>
              {WORK_MODES.map(mode => (
                <TouchableOpacity key={mode} style={[s.modalOption, fMode === mode && { backgroundColor: '#EFF6FF' }]} activeOpacity={0.7} onPress={() => { setFMode(mode); setModalVisible(false); }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: fMode === mode ? '#003366' : '#0F172A' }}>{mode}</Text>
                  {fMode === mode && <Ionicons name="checkmark" size={20} color="#003366" />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }

  // ─── DEFAULT: JOB LIST ─────────────────────────────────────────
    const isWeb = Platform.OS === 'web';
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 1024, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={s.safe}>
      <View style={webContainerStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="#FFFFFF" />
      {header}
      
      {/* Filter Summary Bar */}
      <View style={s.filterSummaryBar}>
        <Text style={s.filterSummaryText}>
          Showing {filtered.length} jobs
        </Text>
        <TouchableOpacity
          style={[s.filterButton, activeFiltersCount > 0 && s.filterButtonActive]}
          activeOpacity={0.7}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeFiltersCount > 0 ? '#FFFFFF' : '#003366'}
          />
          <Text style={[s.filterButtonText, activeFiltersCount > 0 && s.filterButtonTextActive]}>
            Filter{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#002144' }}>Job Postings</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setScreen('editor')}>
          <Ionicons name="add-circle" size={26} color="#003366" />
        </TouchableOpacity>
      </View>
      <FlatList
        style={{ flex: 1 }}
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <Ionicons name="briefcase-outline" size={64} color="#E2E8F0" />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#94A3B8', marginTop: 16 }}>No Job Postings</Text>
            <Text style={{ fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>Tap + to create your first job post.</Text>
          </View>
        }
        renderItem={({ item }) => <JobCard item={item} onPress={openDetail} onDelete={deleteJob} isSmallScreen={isSmallScreen} />}
      />

      {/* FABs */}
      <TouchableOpacity style={s.resumeFab} activeOpacity={0.8} onPress={() => setScreen('resume')}>
        <Ionicons name="book-outline" size={20} color="#FFFFFF" />
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginLeft: 8 }}>Resume Book</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.fab} activeOpacity={0.8} onPress={() => setScreen('editor')}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} animationType="slide" transparent>
        <View style={s.filterModalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowFilterModal(false)} />
          <View style={s.filterSheet}>
            <View style={s.filterSheetHeader}>
              <Text style={s.filterSheetTitle}>Filter Jobs</Text>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <TouchableOpacity onPress={handleResetFilters} activeOpacity={0.7}>
                  <Text style={s.resetText}>Reset All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowFilterModal(false)} activeOpacity={0.7}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={s.filterScrollView} showsVerticalScrollIndicator={false}>
              {/* Work Mode */}
              <Text style={s.filterGroupLabel}>Work Mode</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillsRow}>
                {['All', ...WORK_MODES].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[s.pill, selectedWorkMode === mode && s.pillActive]}
                    onPress={() => setSelectedWorkMode(mode)}
                  >
                    <Text style={[s.pillText, selectedWorkMode === mode && s.pillTextActive]}>
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Institution Filter (Super Admin only) */}
              {isSuperAdmin && (
                <>
                  <Text style={s.filterGroupLabel}>Institution</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillsRow}>
                    {['All', 'RVCE', 'RVITM', 'RVPU', 'RVIS', 'RVU', 'RVCA', 'RVIM', 'RVILS', 'DAPMRV', 'RVCN', 'RVCP', 'RVTC', 'RVTTI', 'NMKRV', 'SSMRV', 'RVPS', 'RVS', 'RVLH'].map((inst) => (
                      <TouchableOpacity
                        key={inst}
                        style={[s.pill, selectedInstitution === inst && s.pillActive]}
                        onPress={() => {
                          setSelectedInstitution(inst);
                          global.selectedInstitution = inst;
                        }}
                      >
                        <Text style={[s.pillText, selectedInstitution === inst && s.pillTextActive]}>
                          {inst}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={s.applyButton}
              activeOpacity={0.8}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={s.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#003366', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A', padding: 0 },
  subHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  subTitle: { fontSize: 18, fontWeight: '800', color: '#002144' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },

  // Job Card
  jobCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  jobCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  jobLogo: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#DBEAFE' },
  jobRole: { fontSize: 16, fontWeight: '700', color: '#002144' },
  jobCompany: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 2 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  badge: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginRight: 8, marginBottom: 6, borderWidth: 1, borderColor: '#DBEAFE' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#003366' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  statItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  statText: { fontSize: 13, fontWeight: '600', color: '#64748B', marginLeft: 6 },
  viewMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE' },
  viewMoreText: { fontSize: 14, fontWeight: '600', color: '#003366', marginRight: 6 },

  // Detail
  detailLogo: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DBEAFE' },
  detailRole: { fontSize: 22, fontWeight: '800', color: '#002144', textAlign: 'center', marginBottom: 4 },
  detailCompany: { fontSize: 16, fontWeight: '600', color: '#64748B', textAlign: 'center', marginBottom: 16 },
  statCard: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 16, marginHorizontal: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  statCardText: { fontSize: 15, fontWeight: '700', color: '#002144' },
  footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  applyBtn: { backgroundColor: '#003366', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },

  // Resume
  resumeAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#003366', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  resumeAvatarImage: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#CBD5E1' },
  resumeCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  skillPill: { backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginRight: 8, marginBottom: 6, borderWidth: 1, borderColor: '#DBEAFE' },
  resumeActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#003366', marginRight: 8 },
  banner: { backgroundColor: '#003366', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20 },
  bannerBtn: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginRight: 12 },
  bannerBtnOutline: { borderWidth: 1, borderColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },

  // Editor
  label: { fontSize: 14, fontWeight: '700', color: '#002144', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#0F172A' },
  selector: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  postBtn: { backgroundColor: '#003366', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 340 },
  modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4 },

  // FABs
  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 110 : 90, right: 20, width: 56, height: 56, borderRadius: 16, backgroundColor: '#003366', alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#003366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  resumeFab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 40 : 24, right: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16, backgroundColor: '#002144', elevation: 6, shadowColor: '#002144', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },

  // Filter Styles
  filterSummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterSummaryText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#003366',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#003366',
  },
  filterButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#003366',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: '#FFFFFF',
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
    color: '#0F172A',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
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
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: '#003366',
    borderColor: '#003366',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#003366',
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
    color: '#FFFFFF',
  },
});
