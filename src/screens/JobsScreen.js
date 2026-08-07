import React, { useState, useEffect } from 'react';
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
  Switch
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import useUserRole from '../hooks/useUserRole';
import {
  fetchJobs,
  createJobPosting,
  toggleSaveJob,
  applyToJob,
  fetchJobTracker,
  fetchJobPreferences,
  updateJobPreferences,
  fetchRecommendedJobs
} from '../services/jobService';

const WORKPLACE_TYPES = ['All', 'On-site', 'Hybrid', 'Remote'];
const JOB_TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship'];

const JobsScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const { isAlumni, isAdmin, isSuperAdmin, isAdminOrSuper } = useUserRole();

  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 400;
  const isDesktop = screenWidth >= 1024;

  // LinkedIn Navigation Tabs
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'tracker' | 'preferences' | 'recommended' | 'post'
  const [trackerSubTab, setTrackerSubTab] = useState('saved'); // 'saved' | 'applied'

  // Data States
  const [jobs, setJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkplace, setSelectedWorkplace] = useState('All');
  const [selectedJobType, setSelectedJobType] = useState('All');

  // Selected Job for Detail / Easy Apply Modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // Job Preferences State
  const [openToWork, setOpenToWork] = useState(true);
  const [targetTitles, setTargetTitles] = useState('Software Engineer, Full Stack Developer');
  const [targetLocations, setTargetLocations] = useState('Bangalore, Remote, Hybrid');
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Job Posting Form State
  const [pTitle, setPTitle] = useState('');
  const [pCompany, setPCompany] = useState('');
  const [pLocation, setPLocation] = useState('');
  const [pWorkplace, setPWorkplace] = useState('On-site');
  const [pJobType, setPJobType] = useState('Full-time');
  const [pSalary, setPSalary] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [postingJob, setPostingJob] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [activeTab, selectedWorkplace, selectedJobType]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'search') {
        const filters = {};
        if (searchQuery) filters.search = searchQuery;
        if (selectedWorkplace !== 'All') filters.workplaceType = selectedWorkplace;
        if (selectedJobType !== 'All') filters.jobType = selectedJobType;
        const res = await fetchJobs(filters);
        setJobs(res);
      } else if (activeTab === 'tracker') {
        const trackerData = await fetchJobTracker();
        setSavedJobs(trackerData.savedJobs || []);
        setAppliedJobs(trackerData.appliedJobs || []);
      } else if (activeTab === 'recommended') {
        const recs = await fetchRecommendedJobs();
        setRecommendedJobs(recs);
      } else if (activeTab === 'preferences') {
        const prefs = await fetchJobPreferences();
        if (prefs) {
          setOpenToWork(prefs.openToWork ?? true);
          setTargetTitles((prefs.targetTitles || []).join(', '));
          setTargetLocations((prefs.targetLocations || []).join(', '));
        }
      }
    } catch (e) {
      console.log('Error loading jobs data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async (jobId) => {
    try {
      await toggleSaveJob(jobId);
      loadAllData();
    } catch (e) {
      Alert.alert('Error', 'Could not update save status');
    }
  };

  const handleEasyApplySubmit = async () => {
    if (!selectedJob) return;
    setIsApplying(true);
    try {
      await applyToJob(selectedJob._id || selectedJob.id, { coverNote });
      Alert.alert('Application Submitted! 🎉', `Your application for ${selectedJob.title} at ${selectedJob.company} has been sent!`);
      setApplyModalVisible(false);
      setCoverNote('');
      loadAllData();
    } catch (e) {
      Alert.alert('Already Applied', e.response?.data?.message || 'You have already applied to this position.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const titlesArray = targetTitles.split(',').map(s => s.trim()).filter(Boolean);
      const locsArray = targetLocations.split(',').map(s => s.trim()).filter(Boolean);
      await updateJobPreferences({
        openToWork,
        targetTitles: titlesArray,
        targetLocations: locsArray
      });
      Alert.alert('Preferences Saved ⚙️', 'Your LinkedIn job preferences have been updated!');
    } catch (e) {
      Alert.alert('Error', 'Failed to save preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleCreateJob = async () => {
    if (!pTitle.trim() || !pCompany.trim() || !pLocation.trim() || !pDesc.trim()) {
      Alert.alert('Required Fields', 'Please fill in Title, Company, Location, and Description.');
      return;
    }
    setPostingJob(true);
    try {
      await createJobPosting({
        title: pTitle,
        company: pCompany,
        location: pLocation,
        workplaceType: pWorkplace,
        jobType: pJobType,
        salaryRange: pSalary,
        description: pDesc
      });
      Alert.alert('Job Posted! 🚀', 'Your job vacancy is now live on the Alumni portal.');
      setPTitle(''); setPCompany(''); setPLocation(''); setPSalary(''); setPDesc('');
      setActiveTab('search');
    } catch (e) {
      Alert.alert('Error', 'Failed to post job opportunity.');
    } finally {
      setPostingJob(false);
    }
  };

  const renderJobCard = (job, isAppliedTab = false) => {
    const isSaved = (job.savedBy || []).includes('current_user') || savedJobs.some(s => s._id === job._id);

    return (
      <View key={job._id || job.id} style={st.card}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={st.logoBox}>
            <Ionicons name="business-outline" size={24} color="#003366" />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={st.titleText}>{job.title}</Text>
            <Text style={st.companyText}>{job.company} • <Text style={{ color: '#64748B' }}>{job.location}</Text></Text>

            <View style={st.tagRow}>
              <View style={st.tagPill}>
                <Text style={st.tagText}>{job.workplaceType || 'On-site'}</Text>
              </View>
              <View style={[st.tagPill, { backgroundColor: '#F1F5F9' }]}>
                <Text style={[st.tagText, { color: '#475569' }]}>{job.jobType || 'Full-time'}</Text>
              </View>
              {job.salaryRange ? (
                <View style={[st.tagPill, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[st.tagText, { color: '#059669' }]}>{job.salaryRange}</Text>
                </View>
              ) : null}
            </View>

            {isAppliedTab ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#059669' }}>
                  Status: {job.status || 'Applied'}
                </Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity onPress={() => handleToggleSave(job._id || job.id)} style={{ padding: 6 }}>
            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color={isSaved ? "#003366" : "#94A3B8"} />
          </TouchableOpacity>
        </View>

        {/* Action Row */}
        {!isAppliedTab && (
          <View style={st.cardActionRow}>
            <TouchableOpacity 
              style={st.easyApplyBtn}
              onPress={() => { setSelectedJob(job); setApplyModalVisible(true); }}
            >
              <Ionicons name="flash" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={st.easyApplyText}>Easy Apply</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={st.detailsBtn}
              onPress={() => { setSelectedJob(job); setApplyModalVisible(true); }}
            >
              <Text style={st.detailsText}>View Details</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[st.container, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* LinkedIn Jobs Navigation Header */}
      <View style={[st.headerContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
        <Text style={[st.headerTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>LinkedIn Jobs</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.tabBar}>
          <TouchableOpacity 
            style={[st.tabItem, activeTab === 'search' && st.tabItemActive]}
            onPress={() => setActiveTab('search')}
          >
            <Ionicons name="search" size={16} color={activeTab === 'search' ? '#003366' : '#64748B'} />
            <Text style={[st.tabText, activeTab === 'search' && st.tabTextActive]}>Search Jobs</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[st.tabItem, activeTab === 'tracker' && st.tabItemActive]}
            onPress={() => setActiveTab('tracker')}
          >
            <Ionicons name="bookmark" size={16} color={activeTab === 'tracker' ? '#003366' : '#64748B'} />
            <Text style={[st.tabText, activeTab === 'tracker' && st.tabTextActive]}>Job Tracker</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[st.tabItem, activeTab === 'preferences' && st.tabItemActive]}
            onPress={() => setActiveTab('preferences')}
          >
            <Ionicons name="options" size={16} color={activeTab === 'preferences' ? '#003366' : '#64748B'} />
            <Text style={[st.tabText, activeTab === 'preferences' && st.tabTextActive]}>Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[st.tabItem, activeTab === 'recommended' && st.tabItemActive]}
            onPress={() => setActiveTab('recommended')}
          >
            <Ionicons name="sparkles" size={16} color={activeTab === 'recommended' ? '#003366' : '#64748B'} />
            <Text style={[st.tabText, activeTab === 'recommended' && st.tabTextActive]}>Recommended</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[st.tabItem, activeTab === 'post' && st.tabItemActive]}
            onPress={() => setActiveTab('post')}
          >
            <Ionicons name="add-circle" size={16} color={activeTab === 'post' ? '#003366' : '#64748B'} />
            <Text style={[st.tabText, activeTab === 'post' && st.tabTextActive]}>Post a Job</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <View style={{ flex: 1, maxWidth: isDesktop ? 900 : '100%', width: '100%', alignSelf: 'center' }}>

        {/* TAB 1: SEARCH JOBS */}
        {activeTab === 'search' && (
          <View style={{ flex: 1 }}>
            {/* Filter Bar */}
            <View style={st.filterSection}>
              <View style={st.searchBox}>
                <Ionicons name="search" size={18} color="#64748B" style={{ marginRight: 8 }} />
                <TextInput
                  style={st.searchInput}
                  placeholder="Search title, company, or skills..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={loadAllData}
                />
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                {WORKPLACE_TYPES.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[st.chip, selectedWorkplace === type && st.chipActive]}
                    onPress={() => setSelectedWorkplace(type)}
                  >
                    <Text style={[st.chipText, selectedWorkplace === type && st.chipTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#003366" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={jobs}
                keyExtractor={item => item._id || item.id}
                renderItem={({ item }) => renderJobCard(item)}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={() => (
                  <View style={st.emptyBox}>
                    <Ionicons name="briefcase-outline" size={48} color="#CBD5E1" />
                    <Text style={st.emptyText}>No jobs found matching your filter criteria.</Text>
                  </View>
                )}
              />
            )}
          </View>
        )}

        {/* TAB 2: JOB TRACKER (SAVED & APPLIED) */}
        {activeTab === 'tracker' && (
          <View style={{ flex: 1, padding: 16 }}>
            <View style={st.subTabBar}>
              <TouchableOpacity 
                style={[st.subTab, trackerSubTab === 'saved' && st.subTabActive]}
                onPress={() => setTrackerSubTab('saved')}
              >
                <Text style={[st.subTabText, trackerSubTab === 'saved' && st.subTabTextActive]}>
                  Saved Jobs ({savedJobs.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[st.subTab, trackerSubTab === 'applied' && st.subTabActive]}
                onPress={() => setTrackerSubTab('applied')}
              >
                <Text style={[st.subTabText, trackerSubTab === 'applied' && st.subTabTextActive]}>
                  Applied Jobs ({appliedJobs.length})
                </Text>
              </TouchableOpacity>
            </View>

            {trackerSubTab === 'saved' ? (
              <FlatList
                data={savedJobs}
                keyExtractor={item => item._id || item.id}
                renderItem={({ item }) => renderJobCard(item)}
                ListEmptyComponent={() => (
                  <Text style={st.emptyText}>You haven&apos;t saved any jobs yet.</Text>
                )}
              />
            ) : (
              <FlatList
                data={appliedJobs}
                keyExtractor={item => item._id || item.id}
                renderItem={({ item }) => renderJobCard(item, true)}
                ListEmptyComponent={() => (
                  <Text style={st.emptyText}>You haven&apos;t applied to any jobs yet.</Text>
                )}
              />
            )}
          </View>
        )}

        {/* TAB 3: JOB PREFERENCES & OPEN TO WORK */}
        {activeTab === 'preferences' && (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Open to Work Banner */}
            <View style={st.openToWorkCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: '#0F172A' }}>#OpenToWork</Text>
                  <Text style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                    Show recruiters & alumni that you are actively seeking job opportunities.
                  </Text>
                </View>
                <Switch
                  value={openToWork}
                  onValueChange={setOpenToWork}
                  trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                />
              </View>
            </View>

            <View style={st.formGroup}>
              <Text style={st.label}>Target Job Titles (comma separated)</Text>
              <TextInput
                style={st.input}
                value={targetTitles}
                onChangeText={setTargetTitles}
                placeholder="e.g. Software Engineer, Tech Lead"
              />
            </View>

            <View style={st.formGroup}>
              <Text style={st.label}>Target Locations</Text>
              <TextInput
                style={st.input}
                value={targetLocations}
                onChangeText={setTargetLocations}
                placeholder="e.g. Bangalore, Remote, Hybrid"
              />
            </View>

            <TouchableOpacity 
              style={st.saveBtn} 
              onPress={handleSavePreferences}
              disabled={savingPrefs}
            >
              {savingPrefs ? <ActivityIndicator color="#FFFFFF" /> : <Text style={st.saveBtnText}>Save Preferences</Text>}
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* TAB 4: RECOMMENDED JOBS */}
        {activeTab === 'recommended' && (
          <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 }}>
              🎯 Jobs matching your preferences
            </Text>
            <FlatList
              data={recommendedJobs}
              keyExtractor={item => item._id || item.id}
              renderItem={({ item }) => renderJobCard(item)}
              ListEmptyComponent={() => (
                <Text style={st.emptyText}>No recommendations currently available.</Text>
              )}
            />
          </View>
        )}

        {/* TAB 5: POST A JOB */}
        {activeTab === 'post' && (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 16 }}>
              Post a Hiring Opportunity 🚀
            </Text>

            <View style={st.formGroup}>
              <Text style={st.label}>Job Title *</Text>
              <TextInput style={st.input} value={pTitle} onChangeText={setPTitle} placeholder="e.g. Senior Frontend Engineer" />
            </View>

            <View style={st.formGroup}>
              <Text style={st.label}>Company *</Text>
              <TextInput style={st.input} value={pCompany} onChangeText={setPCompany} placeholder="e.g. Google" />
            </View>

            <View style={st.formGroup}>
              <Text style={st.label}>Location *</Text>
              <TextInput style={st.input} value={pLocation} onChangeText={setPLocation} placeholder="e.g. Bangalore, India" />
            </View>

            <View style={st.formGroup}>
              <Text style={st.label}>Salary Range (Optional)</Text>
              <TextInput style={st.input} value={pSalary} onChangeText={setPSalary} placeholder="e.g. ₹15L - ₹25L PA" />
            </View>

            <View style={st.formGroup}>
              <Text style={st.label}>Job Description *</Text>
              <TextInput 
                style={[st.input, { height: 100, textAlignVertical: 'top' }]} 
                multiline 
                value={pDesc} 
                onChangeText={setPDesc} 
                placeholder="Describe role responsibilities, team, requirements..." 
              />
            </View>

            <TouchableOpacity style={st.saveBtn} onPress={handleCreateJob} disabled={postingJob}>
              {postingJob ? <ActivityIndicator color="#FFFFFF" /> : <Text style={st.saveBtnText}>Post Job Opportunity</Text>}
            </TouchableOpacity>
          </ScrollView>
        )}

      </View>

      {/* EASY APPLY MODAL */}
      {applyModalVisible && selectedJob && (
        <Modal visible={true} transparent={true} animationType="slide">
          <View style={st.modalOverlay}>
            <View style={st.modalCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Easy Apply</Text>
                <TouchableOpacity onPress={() => setApplyModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 16, fontWeight: '700', color: '#003366' }}>{selectedJob.title}</Text>
              <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 16 }}>{selectedJob.company} • {selectedJob.location}</Text>

              <Text style={st.label}>Cover Note / Introduction</Text>
              <TextInput
                style={[st.input, { height: 80, textAlignVertical: 'top', marginBottom: 16 }]}
                multiline
                placeholder="Why are you a great fit for this position?"
                value={coverNote}
                onChangeText={setCoverNote}
              />

              <TouchableOpacity style={st.saveBtn} onPress={handleEasyApplySubmit} disabled={isApplying}>
                {isApplying ? <ActivityIndicator color="#FFFFFF" /> : <Text style={st.saveBtnText}>Submit Application</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const st = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  tabBar: { flexDirection: 'row', gap: 12 },
  tabItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#F1F5F9' },
  tabItemActive: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B', marginLeft: 6 },
  tabTextActive: { color: '#003366', fontWeight: '700' },
  filterSection: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#F1F5F9', marginRight: 8 },
  chipActive: { backgroundColor: '#003366' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#FFFFFF' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  logoBox: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  titleText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  companyText: { fontSize: 13, color: '#475569', marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tagPill: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: '#EFF6FF' },
  tagText: { fontSize: 11, fontWeight: '600', color: '#003366' },
  cardActionRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  easyApplyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#003366', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  easyApplyText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  detailsBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderBottomWidth: 1, borderColor: '#CBD5E1' },
  detailsText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  subTabBar: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 4, marginBottom: 16 },
  subTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  subTabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  subTabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  subTabTextActive: { color: '#003366', fontWeight: '700' },
  emptyBox: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 14, color: '#94A3B8', marginTop: 10, textAlign: 'center' },
  openToWorkCard: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', padding: 16, borderRadius: 12, marginBottom: 20 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' },
  saveBtn: { backgroundColor: '#003366', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 }
});

export default JobsScreen;
