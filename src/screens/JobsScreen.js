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
  const styles = getStyles(theme, isDarkMode);

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
  const [openToWork, setOpenToWork] = useState(false);
  const [targetTitles, setTargetTitles] = useState('');
  const [targetLocations, setTargetLocations] = useState('');
  const [targetKeywords, setTargetKeywords] = useState('');
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Suggested keywords for quick preference selection
  const POPULAR_SKILLS = ['Python', 'React', 'Java', 'Machine Learning', 'AWS', 'Node.js', 'SQL', 'Data Science', 'Flutter', 'DevOps'];

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
          setTargetKeywords((prefs.keywords || prefs.skills || []).join(', '));
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

  const handleToggleKeyword = (skill) => {
    const current = targetKeywords.split(',').map(s => s.trim()).filter(Boolean);
    if (current.some(c => c.toLowerCase() === skill.toLowerCase())) {
      setTargetKeywords(current.filter(c => c.toLowerCase() !== skill.toLowerCase()).join(', '));
    } else {
      setTargetKeywords([...current, skill].join(', '));
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const titlesArray = targetTitles.split(',').map(s => s.trim()).filter(Boolean);
      const locsArray = targetLocations.split(',').map(s => s.trim()).filter(Boolean);
      const keywordsArray = targetKeywords.split(',').map(s => s.trim()).filter(Boolean);
      await updateJobPreferences({
        openToWork,
        targetTitles: titlesArray,
        targetLocations: locsArray,
        keywords: keywordsArray
      });
      Alert.alert('Preferences Saved 🎯', 'Your skill & keyword preferences have been saved! Jobs matching keywords in their descriptions will now appear in your Recommended tab.');
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
    const hasKeywordMatch = job.matchingKeywords && job.matchingKeywords.length > 0;
    const matchScore = job.matchScore || job.matchPercentage;

    return (
      <View key={job._id || job.id} style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={styles.logoBox}>
            <Ionicons name="business-outline" size={24} color={isDarkMode ? '#60A5FA' : '#003366'} />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.titleText}>{job.title}</Text>
            <Text style={styles.companyText}>
              {job.company} <Text style={{ color: theme.textMuted }}>•</Text> <Text style={{ color: theme.textSecondary }}>{job.location}</Text>
            </Text>

            <View style={styles.tagRow}>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{job.workplaceType || 'On-site'}</Text>
              </View>
              <View style={[styles.tagPill, { backgroundColor: isDarkMode ? '#282A30' : '#F1F5F9' }]}>
                <Text style={[styles.tagText, { color: theme.textSecondary }]}>{job.jobType || 'Full-time'}</Text>
              </View>
              {job.salaryRange ? (
                <View style={[styles.tagPill, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
                  <Text style={[styles.tagText, { color: '#10B981' }]}>{job.salaryRange}</Text>
                </View>
              ) : null}
            </View>

            {/* Smart Keyword & Match Detection Highlight */}
            {hasKeywordMatch ? (
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF', 
                paddingHorizontal: 10, 
                paddingVertical: 5, 
                borderRadius: 8, 
                marginTop: 10, 
                alignSelf: 'flex-start', 
                borderWidth: 1, 
                borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE' 
              }}>
                <Ionicons name="sparkles" size={13} color={isDarkMode ? '#60A5FA' : '#2563EB'} style={{ marginRight: 5 }} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: isDarkMode ? '#93C5FD' : '#1D4ED8' }}>
                  🎯 {matchScore ? `${matchScore}% Match` : 'Smart Match'} • {job.matchingKeywords.join(', ')}
                </Text>
              </View>
            ) : (job.keywords && job.keywords.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {job.keywords.slice(0, 4).map((kw, i) => (
                  <View key={i} style={{ 
                    backgroundColor: isDarkMode ? '#282A30' : '#F8FAFC', 
                    paddingHorizontal: 8, 
                    paddingVertical: 3, 
                    borderRadius: 6, 
                    borderWidth: 1, 
                    borderColor: theme.border 
                  }}>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '500' }}>#{kw}</Text>
                  </View>
                ))}
              </View>
            ) : null)}

            {isAppliedTab ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#10B981' }}>
                  Status: {job.status || 'Applied'}
                </Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity onPress={() => handleToggleSave(job._id || job.id)} style={{ padding: 6 }}>
            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color={isSaved ? (isDarkMode ? '#60A5FA' : '#003366') : theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Action Row */}
        {!isAppliedTab && (
          <View style={styles.cardActionRow}>
            <TouchableOpacity 
              style={styles.easyApplyBtn}
              onPress={() => { setSelectedJob(job); setApplyModalVisible(true); }}
              activeOpacity={0.8}
            >
              <Ionicons name="flash" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.easyApplyText}>Easy Apply</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.detailsBtn}
              onPress={() => { setSelectedJob(job); setApplyModalVisible(true); }}
              activeOpacity={0.8}
            >
              <Text style={styles.detailsText}>View Details</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* LinkedIn Jobs Navigation Header */}
      <View style={styles.headerContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={styles.headerTitle}>Career & Job Hub</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#282A30' : '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: isDarkMode ? '#2D3139' : '#BFDBFE' }}>
            <Ionicons name="briefcase-outline" size={14} color={isDarkMode ? '#60A5FA' : '#003366'} style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: isDarkMode ? '#93C5FD' : '#003366' }}>
              {jobs.length} Active Jobs
            </Text>
          </View>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'search' && styles.tabItemActive]}
            onPress={() => setActiveTab('search')}
          >
            <Ionicons name="search" size={16} color={activeTab === 'search' ? (isDarkMode ? '#60A5FA' : '#003366') : theme.textMuted} />
            <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>Search Jobs</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'tracker' && styles.tabItemActive]}
            onPress={() => setActiveTab('tracker')}
          >
            <Ionicons name="bookmark" size={16} color={activeTab === 'tracker' ? (isDarkMode ? '#60A5FA' : '#003366') : theme.textMuted} />
            <Text style={[styles.tabText, activeTab === 'tracker' && styles.tabTextActive]}>Job Tracker</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'preferences' && styles.tabItemActive]}
            onPress={() => setActiveTab('preferences')}
          >
            <Ionicons name="options" size={16} color={activeTab === 'preferences' ? (isDarkMode ? '#60A5FA' : '#003366') : theme.textMuted} />
            <Text style={[styles.tabText, activeTab === 'preferences' && styles.tabTextActive]}>Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'recommended' && styles.tabItemActive]}
            onPress={() => setActiveTab('recommended')}
          >
            <Ionicons name="sparkles" size={16} color={activeTab === 'recommended' ? (isDarkMode ? '#60A5FA' : '#003366') : theme.textMuted} />
            <Text style={[styles.tabText, activeTab === 'recommended' && styles.tabTextActive]}>Recommended</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'post' && styles.tabItemActive]}
            onPress={() => setActiveTab('post')}
          >
            <Ionicons name="add-circle" size={16} color={activeTab === 'post' ? (isDarkMode ? '#60A5FA' : '#003366') : theme.textMuted} />
            <Text style={[styles.tabText, activeTab === 'post' && styles.tabTextActive]}>Post a Job</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <View style={{ flex: 1, maxWidth: isDesktop ? 900 : '100%', width: '100%', alignSelf: 'center' }}>

        {/* TAB 1: SEARCH JOBS */}
        {activeTab === 'search' && (
          <View style={{ flex: 1 }}>
            {/* Filter Bar */}
            <View style={styles.filterSection}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search title, company, or skills..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={loadAllData}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => { setSearchQuery(''); loadAllData(); }}>
                    <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                {WORKPLACE_TYPES.map(type => {
                  const isActive = selectedWorkplace === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() => setSelectedWorkplace(type)}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{type}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={isDarkMode ? '#3B82F6' : '#003366'} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={jobs}
                keyExtractor={item => item._id || item.id}
                renderItem={({ item }) => renderJobCard(item)}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={() => (
                  <View style={styles.emptyBox}>
                    <Ionicons name="briefcase-outline" size={48} color={theme.textMuted} />
                    <Text style={styles.emptyText}>No jobs found matching your filter criteria.</Text>
                  </View>
                )}
              />
            )}
          </View>
        )}

        {/* TAB 2: JOB TRACKER (SAVED & APPLIED) */}
        {activeTab === 'tracker' && (
          <View style={{ flex: 1, padding: 16 }}>
            <View style={styles.subTabBar}>
              <TouchableOpacity 
                style={[styles.subTab, trackerSubTab === 'saved' && styles.subTabActive]}
                onPress={() => setTrackerSubTab('saved')}
              >
                <Text style={[styles.subTabText, trackerSubTab === 'saved' && styles.subTabTextActive]}>
                  Saved Jobs ({savedJobs.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.subTab, trackerSubTab === 'applied' && styles.subTabActive]}
                onPress={() => setTrackerSubTab('applied')}
              >
                <Text style={[styles.subTabText, trackerSubTab === 'applied' && styles.subTabTextActive]}>
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
                  <View style={styles.emptyBox}>
                    <Ionicons name="bookmark-outline" size={44} color={theme.textMuted} />
                    <Text style={styles.emptyText}>You haven&apos;t saved any jobs yet.</Text>
                  </View>
                )}
              />
            ) : (
              <FlatList
                data={appliedJobs}
                keyExtractor={item => item._id || item.id}
                renderItem={({ item }) => renderJobCard(item, true)}
                ListEmptyComponent={() => (
                  <View style={styles.emptyBox}>
                    <Ionicons name="checkmark-done-circle-outline" size={44} color={theme.textMuted} />
                    <Text style={styles.emptyText}>You haven&apos;t applied to any jobs yet.</Text>
                  </View>
                )}
              />
            )}
          </View>
        )}

        {/* TAB 3: JOB PREFERENCES & OPEN TO WORK */}
        {activeTab === 'preferences' && (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Open to Work Banner */}
            <View style={styles.openToWorkCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: isDarkMode ? '#10B981' : '#065F46' }}>#OpenToWork</Text>
                  <Text style={{ fontSize: 13, color: isDarkMode ? '#9CA3AF' : '#047857', marginTop: 3, lineHeight: 18 }}>
                    Signal to recruiters, companies, and alumni that you are open to career opportunities.
                  </Text>
                </View>
                <Switch
                  value={openToWork}
                  onValueChange={setOpenToWork}
                  trackColor={{ false: isDarkMode ? '#2D3139' : '#CBD5E1', true: '#10B981' }}
                />
              </View>
            </View>

            {/* Keyword Recommendation Banner */}
            <View style={{ 
              backgroundColor: isDarkMode ? '#1E2025' : '#F0F9FF', 
              borderRadius: 12, 
              padding: 16, 
              marginBottom: 20, 
              borderWidth: 1, 
              borderColor: isDarkMode ? '#2D3139' : '#BAE6FD' 
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Ionicons name="bulb-outline" size={18} color={isDarkMode ? '#60A5FA' : '#0284C7'} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: isDarkMode ? '#93C5FD' : '#0369A1' }}>
                  Smart Keyword Recommendation Engine
                </Text>
              </View>
              <Text style={{ fontSize: 12.5, color: theme.textSecondary, lineHeight: 19 }}>
                When you specify skills like <Text style={{ fontWeight: '700', color: theme.text }}>Python</Text>, <Text style={{ fontWeight: '700', color: theme.text }}>React</Text>, or <Text style={{ fontWeight: '700', color: theme.text }}>AWS</Text>, the platform scans job postings and highlights matching roles in your Recommended feed!
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Preferred Skills & Keywords *</Text>
              <TextInput
                style={styles.input}
                value={targetKeywords}
                onChangeText={setTargetKeywords}
                placeholder="e.g. Python, React, Machine Learning, AWS"
                placeholderTextColor="#9CA3AF"
              />
              
              {/* Quick Add Pills */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {POPULAR_SKILLS.map(skill => {
                  const isSelected = targetKeywords.toLowerCase().includes(skill.toLowerCase());
                  return (
                    <TouchableOpacity
                      key={skill}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        backgroundColor: isSelected ? (isDarkMode ? '#2563EB' : '#003366') : (isDarkMode ? '#282A30' : '#F1F5F9'),
                        borderWidth: 1,
                        borderColor: isSelected ? (isDarkMode ? '#3B82F6' : '#003366') : theme.border
                      }}
                      onPress={() => handleToggleKeyword(skill)}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: isSelected ? '#FFFFFF' : theme.textSecondary }}>
                        {isSelected ? `✓ ${skill}` : `+ ${skill}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Target Job Titles (comma separated)</Text>
              <TextInput
                style={styles.input}
                value={targetTitles}
                onChangeText={setTargetTitles}
                placeholder="e.g. Software Engineer, Tech Lead, Data Scientist"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Target Locations</Text>
              <TextInput
                style={styles.input}
                value={targetLocations}
                onChangeText={setTargetLocations}
                placeholder="e.g. Bangalore, Remote, Hybrid"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={handleSavePreferences}
              disabled={savingPrefs}
            >
              {savingPrefs ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Save Preferences & Keywords</Text>}
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* TAB 4: RECOMMENDED JOBS */}
        {activeTab === 'recommended' && (
          <View style={{ flex: 1, padding: 16 }}>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>
                🎯 Top Recommendations for You
              </Text>
              <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 3 }}>
                Auto-matched from keywords detected in job descriptions based on your skill preferences.
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={isDarkMode ? '#3B82F6' : '#003366'} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={recommendedJobs}
                keyExtractor={item => item._id || item.id}
                renderItem={({ item }) => renderJobCard(item)}
                ListEmptyComponent={() => (
                  <View style={styles.emptyBox}>
                    <Ionicons name="sparkles-outline" size={48} color={theme.textMuted} />
                    <Text style={styles.emptyText}>No recommendations currently available.</Text>
                    <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginTop: 6, maxWidth: 360 }}>
                      Set your skill preferences (like Python, React) in the Preferences tab to see personalized matches!
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        )}

        {/* TAB 5: POST A JOB */}
        {activeTab === 'post' && (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 4 }}>
              Post a Hiring Opportunity 🚀
            </Text>
            <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 18 }}>
              Our AI engine will automatically parse technical keywords from your job description and notify matching alumni!
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Job Title *</Text>
              <TextInput style={styles.input} value={pTitle} onChangeText={setPTitle} placeholder="e.g. Python Backend Engineer" placeholderTextColor="#9CA3AF" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Company *</Text>
              <TextInput style={styles.input} value={pCompany} onChangeText={setPCompany} placeholder="e.g. Google" placeholderTextColor="#9CA3AF" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Location *</Text>
              <TextInput style={styles.input} value={pLocation} onChangeText={setPLocation} placeholder="e.g. Bangalore, India (or Remote)" placeholderTextColor="#9CA3AF" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Salary Range (Optional)</Text>
              <TextInput style={styles.input} value={pSalary} onChangeText={setPSalary} placeholder="e.g. ₹15L - ₹25L PA" placeholderTextColor="#9CA3AF" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Job Description *</Text>
              <TextInput 
                style={[styles.input, { height: 110, textAlignVertical: 'top' }]} 
                multiline 
                value={pDesc} 
                onChangeText={setPDesc} 
                placeholder="Describe role responsibilities, required skills (e.g. Python, Django, SQL)..." 
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateJob} disabled={postingJob}>
              {postingJob ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Post Job Opportunity</Text>}
            </TouchableOpacity>
          </ScrollView>
        )}

      </View>

      {/* EASY APPLY & JOB DETAILS MODAL */}
      {applyModalVisible && selectedJob && (
        <Modal visible={true} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Job Details & Apply</Text>
                <TouchableOpacity onPress={() => setApplyModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: isDarkMode ? '#60A5FA' : '#003366' }}>{selectedJob.title}</Text>
                <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 3, marginBottom: 14 }}>
                  {selectedJob.company} • {selectedJob.location} • {selectedJob.workplaceType || 'On-site'}
                </Text>

                {/* Detected Keywords Pill Row */}
                {selectedJob.keywords && selectedJob.keywords.length > 0 ? (
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary, marginBottom: 6 }}>
                      🏷️ Detected Keywords:
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {selectedJob.keywords.map((kw, i) => (
                        <View key={i} style={{ backgroundColor: isDarkMode ? '#282A30' : '#EFF6FF', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: isDarkMode ? '#2D3139' : '#BFDBFE' }}>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: isDarkMode ? '#93C5FD' : '#1D4ED8' }}>{kw}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, marginTop: 6, marginBottom: 4 }}>Job Description:</Text>
                <Text style={{ fontSize: 13.5, color: theme.textSecondary, lineHeight: 21, marginBottom: 18 }}>
                  {selectedJob.description}
                </Text>

                <Text style={styles.label}>Cover Note / Introduction</Text>
                <TextInput
                  style={[styles.input, { height: 85, textAlignVertical: 'top', marginBottom: 16 }]}
                  multiline
                  placeholder="Highlight your experience with the required skills..."
                  placeholderTextColor="#9CA3AF"
                  value={coverNote}
                  onChangeText={setCoverNote}
                />

                <TouchableOpacity style={styles.saveBtn} onPress={handleEasyApplySubmit} disabled={isApplying}>
                  {isApplying ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Submit Easy Apply</Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: theme.background,
  },
  headerContainer: { 
    paddingVertical: 14, 
    paddingHorizontal: 16, 
    backgroundColor: theme.card,
    borderBottomWidth: 1, 
    borderBottomColor: theme.border,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: theme.text,
  },
  tabBar: { 
    flexDirection: 'row', 
    gap: 10,
  },
  tabItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 8, 
    paddingHorizontal: 14, 
    borderRadius: 20, 
    backgroundColor: isDarkMode ? '#1E2025' : '#F1F5F9',
    borderWidth: 1,
    borderColor: isDarkMode ? '#2D3139' : 'transparent',
  },
  tabItemActive: { 
    backgroundColor: isDarkMode ? '#282A30' : '#EFF6FF', 
    borderWidth: 1, 
    borderColor: isDarkMode ? '#3B82F6' : '#BFDBFE',
  },
  tabText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: theme.textMuted, 
    marginLeft: 6,
  },
  tabTextActive: { 
    color: isDarkMode ? '#60A5FA' : '#003366', 
    fontWeight: '700',
  },
  filterSection: { 
    padding: 16, 
    backgroundColor: theme.card, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border,
  },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: isDarkMode ? '#181A1F' : '#F1F5F9', 
    borderRadius: 12, 
    paddingHorizontal: 14, 
    height: 44,
    borderWidth: 1,
    borderColor: isDarkMode ? '#2D3139' : '#E2E8F0',
  },
  searchInput: { 
    flex: 1, 
    fontSize: 14, 
    color: theme.text,
  },
  chip: { 
    paddingVertical: 6, 
    paddingHorizontal: 14, 
    borderRadius: 18, 
    backgroundColor: isDarkMode ? '#1E2025' : '#F1F5F9', 
    marginRight: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#2D3139' : '#E2E8F0',
  },
  chipActive: { 
    backgroundColor: isDarkMode ? '#2563EB' : '#003366',
    borderColor: isDarkMode ? '#2563EB' : '#003366',
  },
  chipText: { 
    fontSize: 12.5, 
    fontWeight: '600', 
    color: theme.textSecondary,
  },
  chipTextActive: { 
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: { 
    backgroundColor: theme.card, 
    borderRadius: 14, 
    padding: 16, 
    marginBottom: 14, 
    borderWidth: 1, 
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.2 : 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  logoBox: { 
    width: 46, 
    height: 46, 
    borderRadius: 10, 
    backgroundColor: isDarkMode ? '#282A30' : '#EFF6FF', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? '#2D3139' : '#DBEAFE',
  },
  titleText: { 
    fontSize: 16.5, 
    fontWeight: '700', 
    color: theme.text,
  },
  companyText: { 
    fontSize: 13, 
    color: theme.textSecondary, 
    marginTop: 3,
  },
  tagRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6, 
    marginTop: 10,
  },
  tagPill: { 
    paddingVertical: 4, 
    paddingHorizontal: 9, 
    borderRadius: 6, 
    backgroundColor: isDarkMode ? '#1E2025' : '#EFF6FF',
    borderWidth: 1,
    borderColor: isDarkMode ? '#2D3139' : '#DBEAFE',
  },
  tagText: { 
    fontSize: 11.5, 
    fontWeight: '600', 
    color: isDarkMode ? '#60A5FA' : '#003366',
  },
  cardActionRow: { 
    flexDirection: 'row', 
    marginTop: 16, 
    gap: 10,
  },
  easyApplyBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: isDarkMode ? '#2563EB' : '#003366', 
    paddingVertical: 9, 
    paddingHorizontal: 18, 
    borderRadius: 20,
    shadowColor: isDarkMode ? '#2563EB' : '#003366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  easyApplyText: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#FFFFFF',
  },
  detailsBtn: { 
    paddingVertical: 9, 
    paddingHorizontal: 18, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: theme.border,
    backgroundColor: isDarkMode ? '#1E2025' : '#FFFFFF',
  },
  detailsText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: theme.text,
  },
  subTabBar: { 
    flexDirection: 'row', 
    backgroundColor: isDarkMode ? '#1E2025' : '#F1F5F9', 
    borderRadius: 12, 
    padding: 4, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  subTab: { 
    flex: 1, 
    paddingVertical: 9, 
    alignItems: 'center', 
    borderRadius: 9,
  },
  subTabActive: { 
    backgroundColor: isDarkMode ? '#282A30' : '#FFFFFF', 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 4, 
    elevation: 2,
    borderWidth: 1,
    borderColor: isDarkMode ? '#3B82F6' : 'transparent',
  },
  subTabText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: theme.textMuted,
  },
  subTabTextActive: { 
    color: isDarkMode ? '#60A5FA' : '#003366', 
    fontWeight: '700',
  },
  emptyBox: { 
    alignItems: 'center', 
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyText: { 
    fontSize: 14, 
    color: theme.textMuted, 
    marginTop: 10, 
    textAlign: 'center',
    fontWeight: '500',
  },
  openToWorkCard: { 
    backgroundColor: isDarkMode ? '#1E2025' : '#ECFDF5', 
    borderWidth: 1, 
    borderColor: isDarkMode ? '#059669' : '#A7F3D0', 
    padding: 16, 
    borderRadius: 14, 
    marginBottom: 20,
  },
  formGroup: { 
    marginBottom: 18,
  },
  label: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: theme.text, 
    marginBottom: 7,
  },
  input: { 
    backgroundColor: isDarkMode ? '#181A1F' : '#FFFFFF', 
    borderWidth: 1, 
    borderColor: theme.border, 
    borderRadius: 10, 
    paddingHorizontal: 14, 
    paddingVertical: 11, 
    fontSize: 14, 
    color: theme.text,
  },
  saveBtn: { 
    backgroundColor: isDarkMode ? '#2563EB' : '#003366', 
    paddingVertical: 13, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { 
    color: '#FFFFFF', 
    fontSize: 15, 
    fontWeight: '700',
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.65)', 
    justifyContent: 'center', 
    padding: 20,
  },
  modalCard: { 
    backgroundColor: theme.card, 
    borderRadius: 18, 
    padding: 22,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default JobsScreen;

