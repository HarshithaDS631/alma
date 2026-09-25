import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  Image, StatusBar, TextInput, Modal, FlatList, Alert, Platform,
  useWindowDimensions, ActivityIndicator, Animated, Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getImageUrl } from '../services/uploadService';
import getInitials from '../lib/getInitials';

// ─── RVCE MENTOR DATA ────────────────────────────────────────
const RVCE_MENTORS = [
  {
    id: 'm1', name: 'Dr. Raghav Sharma', batch: '2005', department: 'Computer Science',
    company: 'Google', designation: 'Principal Engineer',
    expertise: ['System Design', 'Machine Learning', 'Cloud Architecture'],
    location: 'Mountain View, CA', mentees: 12, rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    bio: 'Passionate about building scalable systems. 18+ years in tech, love to guide aspiring engineers.',
    availability: 'Weekends, 2 slots/month', isVerified: true, isFeatured: true,
  },
  {
    id: 'm2', name: 'Priya Nair', batch: '2010', department: 'Electronics & Communication',
    company: 'Microsoft', designation: 'Senior Product Manager',
    expertise: ['Product Strategy', 'UX Research', 'Agile Methodologies'],
    location: 'Hyderabad, India', mentees: 8, rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    bio: 'Transitioned from engineering to product. Happy to help navigate career pivots.',
    availability: 'Tue & Thu evenings', isVerified: true, isFeatured: true,
  },
  {
    id: 'm3', name: 'Arun Patel', batch: '2008', department: 'Mechanical Engineering',
    company: 'Tesla', designation: 'Staff Mechanical Engineer',
    expertise: ['Automotive Engineering', 'CAD/CAM', 'Manufacturing'],
    location: 'Austin, TX', mentees: 5, rating: 4.7,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    bio: 'From RVCE workshops to Tesla factory floors. Bridging academia and industry innovation.',
    availability: 'Flexible, bi-weekly', isVerified: true, isFeatured: false,
  },
  {
    id: 'm4', name: 'Dr. Kavitha Reddy', batch: '2003', department: 'Biotechnology',
    company: 'Biocon', designation: 'VP R&D',
    expertise: ['Bioinformatics', 'Drug Discovery', 'Clinical Trials'],
    location: 'Bengaluru, India', mentees: 15, rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    bio: 'Leading pharmaceutical research for 20+ years. Mentor to dozens of biotech researchers.',
    availability: 'Weekends, 3 slots/month', isVerified: true, isFeatured: true,
  },
  {
    id: 'm5', name: 'Vikram Joshi', batch: '2012', department: 'Information Science',
    company: 'Amazon', designation: 'Engineering Manager',
    expertise: ['Backend Systems', 'Team Leadership', 'Distributed Systems'],
    location: 'Seattle, WA', mentees: 9, rating: 4.6,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    bio: 'IC to EM transition. I help engineers grow into leaders and navigate big tech culture.',
    availability: 'Sat mornings IST', isVerified: true, isFeatured: false,
  },
  {
    id: 'm6', name: 'Sneha Kulkarni', batch: '2015', department: 'Computer Science',
    company: 'Flipkart', designation: 'Lead Data Scientist',
    expertise: ['Data Science', 'NLP', 'Analytics', 'Python'],
    location: 'Bengaluru, India', mentees: 6, rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
    bio: 'Data nerd from RVCE. Building recommendation engines at scale. Love helping freshers break into DS.',
    availability: 'Tue & Thu, 1 slot/week', isVerified: true, isFeatured: false,
  },
  {
    id: 'm7', name: 'Rajesh Iyer', batch: '2001', department: 'Civil Engineering',
    company: 'L&T Construction', designation: 'Project Director',
    expertise: ['Infrastructure', 'Project Management', 'Sustainable Construction'],
    location: 'Mumbai, India', mentees: 11, rating: 4.5,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
    bio: '22 years in mega infra projects. RVCE civil alumnus guiding the next generation of builders.',
    availability: 'Sundays, flexible', isVerified: true, isFeatured: false,
  },
  {
    id: 'm8', name: 'Ananya Desai', batch: '2018', department: 'Electronics & Communication',
    company: 'Qualcomm', designation: 'ASIC Design Engineer',
    expertise: ['VLSI Design', 'RTL', 'SoC Architecture', 'Verilog'],
    location: 'San Diego, CA', mentees: 3, rating: 4.7,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    bio: 'Recent RVCE grad turned chip designer. Relatable mentor for final-year and fresh grads in VLSI.',
    availability: 'Weekends IST', isVerified: true, isFeatured: false,
  },
];

const DEPARTMENTS = ['All Departments', 'Computer Science', 'Electronics & Communication', 'Mechanical Engineering',
  'Civil Engineering', 'Information Science', 'Biotechnology', 'Electrical Engineering', 'Chemical Engineering'];

const EXPERTISE_TAGS = ['All', 'System Design', 'Machine Learning', 'Product Strategy', 'Data Science',
  'Backend Systems', 'VLSI Design', 'Project Management', 'Cloud Architecture', 'Leadership'];

const MentorshipScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWide = width >= 768;

  // State
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'myMentors' | 'apply' | 'resources'
  const [mentors, setMentors] = useState(RVCE_MENTORS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedExpertise, setSelectedExpertise] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyType, setApplyType] = useState('mentee'); // 'mentor' | 'mentee'
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [showMentorDetail, setShowMentorDetail] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [myMentorships, setMyMentorships] = useState([]);
  const [requestedMentors, setRequestedMentors] = useState(new Set());

  // Application form
  const [formData, setFormData] = useState({
    keywords: '', whyMentor: '', guidance: '', progress: '', activities: ''
  });

  useEffect(() => {
    loadUser();
    loadMyMentorships();
  }, []);

  const loadUser = async () => {
    try {
      const str = await AsyncStorage.getItem('userInfo');
      if (str) setCurrentUser(JSON.parse(str));
    } catch (_) {}
  };

  const loadMyMentorships = async () => {
    try {
      const str = await AsyncStorage.getItem('myMentorships');
      if (str) {
        const parsed = JSON.parse(str);
        setMyMentorships(parsed);
        setRequestedMentors(new Set(parsed.map(m => m.mentorId)));
      }
    } catch (_) {}
  };

  // Filter mentors
  const filteredMentors = mentors.filter(m => {
    const matchesSearch = !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = selectedDept === 'All Departments' || m.department === selectedDept;
    const matchesExpertise = selectedExpertise === 'All' ||
      m.expertise.some(e => e.toLowerCase().includes(selectedExpertise.toLowerCase()));
    return matchesSearch && matchesDept && matchesExpertise;
  });

  const featuredMentors = filteredMentors.filter(m => m.isFeatured);

  const handleRequestMentor = async (mentor) => {
    if (requestedMentors.has(mentor.id)) {
      Alert.alert('Already Requested', `You have already sent a mentorship request to ${mentor.name}.`);
      return;
    }

    const newMentorship = {
      id: 'ms_' + Date.now(),
      mentorId: mentor.id,
      mentorName: mentor.name,
      mentorCompany: mentor.company,
      mentorDesignation: mentor.designation,
      mentorAvatar: mentor.avatar,
      mentorExpertise: mentor.expertise,
      status: 'Pending',
      requestedAt: new Date().toISOString(),
    };

    const updated = [...myMentorships, newMentorship];
    setMyMentorships(updated);
    setRequestedMentors(prev => new Set([...prev, mentor.id]));

    try {
      await AsyncStorage.setItem('myMentorships', JSON.stringify(updated));
    } catch (_) {}

    Alert.alert(
      '✅ Request Sent!',
      `Your mentorship request has been sent to ${mentor.name} (${mentor.company}). They'll be notified via email.`,
      [{ text: 'Great!' }]
    );
  };

  const handleSubmitApplication = async () => {
    if (!formData.keywords.trim()) {
      Alert.alert('Required', 'Please enter your area of interest / keywords.');
      return;
    }
    if (applyType === 'mentee' && !formData.whyMentor.trim()) {
      Alert.alert('Required', 'Please tell us why you want a mentor.');
      return;
    }

    const application = {
      id: 'app_' + Date.now(),
      type: applyType === 'mentor' ? 'Mentor' : 'Mentee',
      applicantName: currentUser?.name || 'Alumni Member',
      applicantEmail: currentUser?.email || '',
      applicantInstitution: currentUser?.institution || 'RV College of Engineering',
      keyword: formData.keywords,
      why: formData.whyMentor,
      guidance: formData.guidance,
      progress: formData.progress,
      activities: formData.activities,
      status: 'Pending',
      appliedAt: new Date().toISOString()
    };

    try {
      const existing = await AsyncStorage.getItem('mentorshipApplications');
      const apps = existing ? JSON.parse(existing) : [];
      apps.unshift(application);
      await AsyncStorage.setItem('mentorshipApplications', JSON.stringify(apps));
    } catch (_) {}

    setShowApplyModal(false);
    setFormData({ keywords: '', whyMentor: '', guidance: '', progress: '', activities: '' });

    Alert.alert(
      '🎉 Application Submitted!',
      applyType === 'mentor'
        ? 'Thank you for volunteering as a mentor! Our team will review your profile within 48 hours.'
        : 'Your mentee application has been submitted. We\'ll match you with the best mentor soon!',
      [{ text: 'OK' }]
    );
  };

  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 900, flex: 1 } : { flex: 1 };

  // ─── RENDER: MENTOR CARD ───────────────────────────────────
  const renderMentorCard = (mentor, isFeatured = false) => (
    <TouchableOpacity
      key={mentor.id}
      activeOpacity={0.8}
      onPress={() => { setSelectedMentor(mentor); setShowMentorDetail(true); }}
      style={[
        styles.mentorCard,
        isFeatured && styles.featuredCard,
        isWide && { width: '48%' }
      ]}
    >
      {isFeatured && (
        <View style={styles.featuredBadge}>
          <Ionicons name="star" size={10} color="#FFF" />
          <Text style={styles.featuredBadgeText}>Featured</Text>
        </View>
      )}

      <View style={styles.mentorCardHeader}>
        <Image source={{ uri: mentor.avatar }} style={styles.mentorAvatar} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.mentorName, { color: theme.text }]} numberOfLines={1}>{mentor.name}</Text>
            {mentor.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#3B82F6" style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={[styles.mentorDesignation, { color: theme.textSecondary || theme.textMuted }]} numberOfLines={1}>
            {mentor.designation} at {mentor.company}
          </Text>
          <Text style={[styles.mentorBatch, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
            Class of {mentor.batch} • {mentor.department}
          </Text>
        </View>
      </View>

      <View style={styles.expertiseContainer}>
        {mentor.expertise.slice(0, 3).map((tag, i) => (
          <View key={i} style={[styles.expertiseTag, { backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF' }]}>
            <Text style={[styles.expertiseTagText, { color: isDarkMode ? '#93C5FD' : '#2563EB' }]}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.mentorMetaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={14} color={isDarkMode ? '#94A3B8' : '#64748B'} />
          <Text style={[styles.metaText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>{mentor.mentees} mentees</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="star" size={14} color="#FBBF24" />
          <Text style={[styles.metaText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>{mentor.rating}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={14} color={isDarkMode ? '#94A3B8' : '#64748B'} />
          <Text style={[styles.metaText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]} numberOfLines={1}>{mentor.location}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.requestButton,
          requestedMentors.has(mentor.id) && styles.requestedButton
        ]}
        onPress={() => handleRequestMentor(mentor)}
        disabled={requestedMentors.has(mentor.id)}
      >
        <Ionicons
          name={requestedMentors.has(mentor.id) ? 'checkmark-circle' : 'hand-right-outline'}
          size={16}
          color={requestedMentors.has(mentor.id) ? '#10B981' : '#FFF'}
        />
        <Text style={[
          styles.requestButtonText,
          requestedMentors.has(mentor.id) && { color: '#10B981' }
        ]}>
          {requestedMentors.has(mentor.id) ? 'Requested' : 'Request Mentorship'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // ─── RENDER: STATS BAR ─────────────────────────────────────
  const renderStatsBar = () => (
    <View style={[styles.statsBar, { backgroundColor: isDarkMode ? '#0F172A' : '#002B5C' }]}>
      {[
        { value: '85+', label: 'Active Mentors', icon: 'school-outline' },
        { value: '340+', label: 'Mentees Matched', icon: 'people-outline' },
        { value: '92%', label: 'Success Rate', icon: 'trending-up-outline' },
        { value: '4.8', label: 'Avg Rating', icon: 'star-outline' },
      ].map((stat, i) => (
        <View key={i} style={styles.statBlock}>
          <View style={[styles.statIconWrap, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
            <Ionicons name={stat.icon} size={18} color="#FBBF24" />
          </View>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );

  // ─── RENDER: HERO SECTION ──────────────────────────────────
  const renderHero = () => (
    <View style={[styles.heroSection, {
      backgroundColor: isDarkMode
        ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
        : undefined,
      ...(isDarkMode ? {} : {}),
    }]}>
      <View style={[styles.heroGradient, { backgroundColor: isDarkMode ? '#0F172A' : '#002B5C' }]}>
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="handshake" size={14} color="#FBBF24" />
            <Text style={styles.heroBadgeText}>RVCE Mentorship Program</Text>
          </View>
          <Text style={styles.heroTitle}>Connect. Learn.{'\n'}Grow Together.</Text>
          <Text style={styles.heroSubtitle}>
            Join our thriving mentorship ecosystem connecting RVCE alumni across generations. Get career guidance, industry insights, and personalized coaching.
          </Text>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.heroPrimaryBtn}
              onPress={() => { setApplyType('mentee'); setShowApplyModal(true); }}
            >
              <Ionicons name="school-outline" size={18} color="#002B5C" />
              <Text style={styles.heroPrimaryBtnText}>Find a Mentor</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroSecondaryBtn}
              onPress={() => { setApplyType('mentor'); setShowApplyModal(true); }}
            >
              <MaterialCommunityIcons name="hand-heart-outline" size={18} color="#FBBF24" />
              <Text style={styles.heroSecondaryBtnText}>Become a Mentor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  // ─── RENDER: SEARCH & FILTER ───────────────────────────────
  const renderSearchFilter = () => (
    <View style={styles.searchSection}>
      <View style={[styles.searchBar, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
        <Ionicons name="search-outline" size={18} color={isDarkMode ? '#94A3B8' : '#64748B'} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search mentors by name, company, skill..."
          placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={isDarkMode ? '#94A3B8' : '#64748B'} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
        {EXPERTISE_TAGS.map(tag => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.filterChip,
              selectedExpertise === tag && styles.filterChipActive,
              { borderColor: isDarkMode ? '#334155' : '#E2E8F0' }
            ]}
            onPress={() => setSelectedExpertise(tag)}
          >
            <Text style={[
              styles.filterChipText,
              selectedExpertise === tag && styles.filterChipTextActive,
              { color: selectedExpertise === tag ? '#FFF' : (isDarkMode ? '#94A3B8' : '#64748B') }
            ]}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
        {DEPARTMENTS.map(dept => (
          <TouchableOpacity
            key={dept}
            style={[
              styles.deptChip,
              selectedDept === dept && styles.deptChipActive,
            ]}
            onPress={() => setSelectedDept(dept)}
          >
            <Text style={[
              styles.deptChipText,
              selectedDept === dept && styles.deptChipTextActive,
            ]}>{dept}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // ─── RENDER: MY MENTORSHIPS TAB ────────────────────────────
  const renderMyMentors = () => (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>My Mentorship Connections</Text>
      {myMentorships.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF' }]}>
            <MaterialCommunityIcons name="handshake-outline" size={48} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Connections Yet</Text>
          <Text style={[styles.emptySubtitle, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
            Browse mentors and send a request to get started on your mentorship journey.
          </Text>
          <TouchableOpacity
            style={styles.emptyAction}
            onPress={() => setActiveTab('explore')}
          >
            <Text style={styles.emptyActionText}>Explore Mentors</Text>
          </TouchableOpacity>
        </View>
      ) : (
        myMentorships.map(ms => (
          <View key={ms.id} style={[styles.myMentorCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={{ uri: ms.mentorAvatar }} style={styles.myMentorAvatar} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.myMentorName, { color: theme.text }]}>{ms.mentorName}</Text>
                <Text style={{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                  {ms.mentorDesignation} at {ms.mentorCompany}
                </Text>
              </View>
              <View style={[styles.statusBadge, {
                backgroundColor: ms.status === 'Approved' ? '#DCFCE7' : ms.status === 'Pending' ? '#FEF3C7' : '#FEE2E2'
              }]}>
                <View style={[styles.statusDot, {
                  backgroundColor: ms.status === 'Approved' ? '#16A34A' : ms.status === 'Pending' ? '#D97706' : '#DC2626'
                }]} />
                <Text style={[styles.statusText, {
                  color: ms.status === 'Approved' ? '#16A34A' : ms.status === 'Pending' ? '#D97706' : '#DC2626'
                }]}>{ms.status}</Text>
              </View>
            </View>
            {ms.mentorExpertise && (
              <View style={[styles.expertiseContainer, { marginTop: 10 }]}>
                {ms.mentorExpertise.slice(0, 3).map((tag, i) => (
                  <View key={i} style={[styles.expertiseTag, { backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF' }]}>
                    <Text style={[styles.expertiseTagText, { color: isDarkMode ? '#93C5FD' : '#2563EB' }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
              <TouchableOpacity
                style={[styles.actionBtnSmall, { backgroundColor: isDarkMode ? '#0F172A' : '#EFF6FF', flex: 1 }]}
                onPress={() => navigation?.navigate?.('Chat', { recipientId: ms.mentorId, recipientName: ms.mentorName })}
              >
                <Ionicons name="chatbubble-outline" size={14} color="#2563EB" />
                <Text style={{ color: '#2563EB', fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtnSmall, { backgroundColor: isDarkMode ? '#0F172A' : '#F0FDF4', flex: 1 }]}
              >
                <Ionicons name="calendar-outline" size={14} color="#16A34A" />
                <Text style={{ color: '#16A34A', fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  // ─── RENDER: RESOURCES TAB ─────────────────────────────────
  const renderResources = () => (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Mentorship Resources</Text>
      {[
        { icon: 'book-outline', title: 'Mentorship Playbook', desc: 'Best practices for mentors and mentees', color: '#3B82F6' },
        { icon: 'videocam-outline', title: 'How to Get the Most from Mentoring', desc: 'Video guide • 12 min', color: '#8B5CF6' },
        { icon: 'document-text-outline', title: 'Goal Setting Template', desc: 'Structure your mentorship sessions effectively', color: '#10B981' },
        { icon: 'calendar-outline', title: 'Meeting Scheduler', desc: 'Book sessions with your mentors', color: '#F59E0B' },
        { icon: 'stats-chart-outline', title: 'Progress Tracker', desc: 'Track milestones and growth areas', color: '#EF4444' },
        { icon: 'people-outline', title: 'Alumni Success Stories', desc: 'Read about transformative mentorships', color: '#06B6D4' },
      ].map((resource, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.resourceCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
          activeOpacity={0.8}
        >
          <View style={[styles.resourceIcon, { backgroundColor: resource.color + '15' }]}>
            <Ionicons name={resource.icon} size={22} color={resource.color} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.resourceTitle, { color: theme.text }]}>{resource.title}</Text>
            <Text style={[styles.resourceDesc, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>{resource.desc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={isDarkMode ? '#475569' : '#CBD5E1'} />
        </TouchableOpacity>
      ))}
    </View>
  );

  // ─── RENDER: MENTOR DETAIL MODAL ───────────────────────────
  const renderMentorDetailModal = () => {
    if (!selectedMentor) return null;
    const m = selectedMentor;
    return (
      <Modal visible={showMentorDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.detailModal, { backgroundColor: isDarkMode ? '#0F172A' : '#FFF' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Close button */}
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowMentorDetail(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>

              {/* Header */}
              <View style={{ alignItems: 'center', paddingTop: 20 }}>
                <Image source={{ uri: m.avatar }} style={styles.detailAvatar} />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                  <Text style={[styles.detailName, { color: theme.text }]}>{m.name}</Text>
                  {m.isVerified && <Ionicons name="checkmark-circle" size={20} color="#3B82F6" style={{ marginLeft: 6 }} />}
                </View>
                <Text style={{ color: isDarkMode ? '#94A3B8' : '#64748B', fontSize: 14, marginTop: 4 }}>
                  {m.designation} at {m.company}
                </Text>
                <Text style={{ color: isDarkMode ? '#64748B' : '#94A3B8', fontSize: 12, marginTop: 2 }}>
                  Class of {m.batch} • {m.department}
                </Text>
              </View>

              {/* Stats */}
              <View style={[styles.detailStats, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={[styles.detailStatVal, { color: theme.text }]}>{m.mentees}</Text>
                  <Text style={{ fontSize: 11, color: isDarkMode ? '#94A3B8' : '#64748B' }}>Mentees</Text>
                </View>
                <View style={{ width: 1, height: 30, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="star" size={14} color="#FBBF24" />
                    <Text style={[styles.detailStatVal, { color: theme.text, marginLeft: 4 }]}>{m.rating}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: isDarkMode ? '#94A3B8' : '#64748B' }}>Rating</Text>
                </View>
                <View style={{ width: 1, height: 30, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Ionicons name="location" size={16} color="#3B82F6" />
                  <Text style={{ fontSize: 11, color: isDarkMode ? '#94A3B8' : '#64748B', marginTop: 2 }} numberOfLines={1}>{m.location}</Text>
                </View>
              </View>

              {/* Bio */}
              <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
                <Text style={[styles.detailSectionTitle, { color: theme.text }]}>About</Text>
                <Text style={{ color: isDarkMode ? '#CBD5E1' : '#475569', fontSize: 14, lineHeight: 22 }}>{m.bio}</Text>
              </View>

              {/* Expertise */}
              <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
                <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Areas of Expertise</Text>
                <View style={styles.expertiseContainer}>
                  {m.expertise.map((tag, i) => (
                    <View key={i} style={[styles.expertiseTag, { backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF', paddingHorizontal: 14, paddingVertical: 8 }]}>
                      <Text style={[styles.expertiseTagText, { color: isDarkMode ? '#93C5FD' : '#2563EB' }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Availability */}
              <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
                <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Availability</Text>
                <View style={[styles.availabilityBlock, { backgroundColor: isDarkMode ? '#1E293B' : '#F0FDF4', borderColor: isDarkMode ? '#334155' : '#BBF7D0' }]}>
                  <Ionicons name="time-outline" size={18} color="#16A34A" />
                  <Text style={{ color: '#16A34A', fontSize: 14, fontWeight: '600', marginLeft: 8 }}>{m.availability}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ paddingHorizontal: 20, marginTop: 24, paddingBottom: 30, gap: 10 }}>
                <TouchableOpacity
                  style={[styles.detailPrimaryBtn, requestedMentors.has(m.id) && { backgroundColor: '#10B981' }]}
                  onPress={() => handleRequestMentor(m)}
                  disabled={requestedMentors.has(m.id)}
                >
                  <Ionicons name={requestedMentors.has(m.id) ? 'checkmark-circle' : 'hand-right'} size={18} color="#FFF" />
                  <Text style={styles.detailPrimaryBtnText}>
                    {requestedMentors.has(m.id) ? 'Request Sent ✓' : 'Request Mentorship'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.detailSecondaryBtn, { borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                  onPress={() => navigation?.navigate?.('Chat', { recipientId: m.id, recipientName: m.name })}
                >
                  <Ionicons name="chatbubble-outline" size={18} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
                  <Text style={[styles.detailSecondaryBtnText, { color: isDarkMode ? '#60A5FA' : '#2563EB' }]}>Send a Message</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── RENDER: APPLICATION MODAL ─────────────────────────────
  const renderApplyModal = () => (
    <Modal visible={showApplyModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.applyModal, { backgroundColor: isDarkMode ? '#0F172A' : '#FFF' }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {applyType === 'mentor' ? '🎓 Apply as Mentor' : '📚 Apply as Mentee'}
              </Text>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <Ionicons name="close-circle" size={28} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {/* Type toggle */}
            <View style={[styles.typeToggle, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
              <TouchableOpacity
                style={[styles.typeToggleBtn, applyType === 'mentee' && styles.typeToggleBtnActive]}
                onPress={() => setApplyType('mentee')}
              >
                <Text style={[styles.typeToggleText, applyType === 'mentee' && styles.typeToggleTextActive]}>I need a Mentor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeToggleBtn, applyType === 'mentor' && styles.typeToggleBtnActive]}
                onPress={() => setApplyType('mentor')}
              >
                <Text style={[styles.typeToggleText, applyType === 'mentor' && styles.typeToggleTextActive]}>I want to Mentor</Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={{ gap: 14, marginTop: 16 }}>
              <View>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Areas of Interest / Keywords *</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                  placeholder="e.g., System Design, ML, Product Strategy"
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                  value={formData.keywords}
                  onChangeText={v => setFormData({ ...formData, keywords: v })}
                />
              </View>

              {applyType === 'mentee' && (
                <View>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Why do you want a mentor? *</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea, { color: theme.text, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                    placeholder="Describe your goals and what you hope to achieve..."
                    placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                    value={formData.whyMentor}
                    onChangeText={v => setFormData({ ...formData, whyMentor: v })}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              )}

              {applyType === 'mentor' && (
                <View>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>What guidance can you offer?</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea, { color: theme.text, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                    placeholder="Your experience, industry insights, and how you can help..."
                    placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                    value={formData.guidance}
                    onChangeText={v => setFormData({ ...formData, guidance: v })}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              )}

              <View>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Current Progress / Experience</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                  placeholder="Years of experience, current role, skills..."
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                  value={formData.progress}
                  onChangeText={v => setFormData({ ...formData, progress: v })}
                />
              </View>

              <View>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Campus Activities / Clubs</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                  placeholder="Student chapters, clubs, volunteer work..."
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                  value={formData.activities}
                  onChangeText={v => setFormData({ ...formData, activities: v })}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitApplication}>
              <Ionicons name="paper-plane" size={18} color="#FFF" />
              <Text style={styles.submitBtnText}>Submit Application</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ─── MAIN RENDER ───────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={webContainerStyle}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation?.goBack?.()} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Mentorship</Text>
              <Text style={{ fontSize: 11, color: isDarkMode ? '#64748B' : '#94A3B8', fontWeight: '500' }}>RVCE Alumni Network</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF' }]}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="filter" size={18} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#FEF3C7' }]}
              onPress={() => { setApplyType('mentor'); setShowApplyModal(true); }}
            >
              <MaterialCommunityIcons name="hand-heart" size={18} color="#D97706" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={[styles.tabBar, { backgroundColor: theme.card, borderBottomColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
          {[
            { key: 'explore', label: 'Explore', icon: 'compass-outline' },
            { key: 'myMentors', label: 'My Mentors', icon: 'people-outline' },
            { key: 'apply', label: 'Apply', icon: 'document-text-outline' },
            { key: 'resources', label: 'Resources', icon: 'library-outline' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.key ? (isDarkMode ? '#60A5FA' : '#002B5C') : (isDarkMode ? '#64748B' : '#94A3B8')}
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
                { color: activeTab === tab.key ? (isDarkMode ? '#60A5FA' : '#002B5C') : (isDarkMode ? '#64748B' : '#94A3B8') }
              ]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {activeTab === 'explore' && (
            <>
              {renderHero()}
              {renderStatsBar()}
              {renderSearchFilter()}

              {/* Featured Mentors */}
              {featuredMentors.length > 0 && (
                <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Ionicons name="star" size={18} color="#FBBF24" />
                    <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 6 }]}>Featured Mentors</Text>
                  </View>
                  <View style={isWide ? { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } : {}}>
                    {featuredMentors.map(m => renderMentorCard(m, true))}
                  </View>
                </View>
              )}

              {/* All Mentors */}
              <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  All Mentors ({filteredMentors.length})
                </Text>
                <View style={isWide ? { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } : {}}>
                  {filteredMentors.map(m => renderMentorCard(m, false))}
                </View>
                {filteredMentors.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={48} color={isDarkMode ? '#475569' : '#CBD5E1'} />
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>No mentors found</Text>
                    <Text style={[styles.emptySubtitle, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                      Try adjusting your search or filters
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ height: 40 }} />
            </>
          )}

          {activeTab === 'myMentors' && renderMyMentors()}
          {activeTab === 'apply' && (
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Mentorship Applications</Text>
              <Text style={{ color: isDarkMode ? '#94A3B8' : '#64748B', fontSize: 13, marginBottom: 16 }}>
                Apply to become a mentor or find a mentor to guide you.
              </Text>
              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  style={[styles.applyCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#1E3A5F' : '#DBEAFE' }]}
                  onPress={() => { setApplyType('mentee'); setShowApplyModal(true); }}
                >
                  <View style={[styles.applyCardIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="school" size={28} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.applyCardTitle, { color: theme.text }]}>Apply as Mentee</Text>
                    <Text style={{ color: isDarkMode ? '#94A3B8' : '#64748B', fontSize: 12, lineHeight: 18 }}>
                      Get matched with an experienced alumni mentor for personalized career guidance
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#475569' : '#CBD5E1'} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.applyCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#3B2F1E' : '#FDE68A' }]}
                  onPress={() => { setApplyType('mentor'); setShowApplyModal(true); }}
                >
                  <View style={[styles.applyCardIcon, { backgroundColor: '#FFFBEB' }]}>
                    <MaterialCommunityIcons name="hand-heart" size={28} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.applyCardTitle, { color: theme.text }]}>Apply as Mentor</Text>
                    <Text style={{ color: isDarkMode ? '#94A3B8' : '#64748B', fontSize: 12, lineHeight: 18 }}>
                      Share your industry experience and guide the next generation of RVCE alumni
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#475569' : '#CBD5E1'} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          {activeTab === 'resources' && renderResources()}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {renderMentorDetailModal()}
      {renderApplyModal()}
    </SafeAreaView>
  );
};

// ─── STYLES ──────────────────────────────────────────────────
const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  headerActionBtn: {
    width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 8,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 4,
  },
  activeTab: {
    borderBottomWidth: 2.5, borderBottomColor: '#002B5C',
  },
  tabText: { fontSize: 12, fontWeight: '600' },
  activeTabText: { fontWeight: '800' },

  // Hero
  heroSection: {},
  heroGradient: {
    paddingHorizontal: 20, paddingVertical: 32,
  },
  heroContent: { alignItems: 'center' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, marginBottom: 16,
  },
  heroBadgeText: { color: '#FBBF24', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  heroTitle: {
    fontSize: 28, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', lineHeight: 36, letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 12, lineHeight: 22, maxWidth: 400,
  },
  heroActions: {
    flexDirection: 'row', gap: 10, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center',
  },
  heroPrimaryBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBBF24',
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 8,
  },
  heroPrimaryBtnText: { color: '#002B5C', fontSize: 14, fontWeight: '800' },
  heroSecondaryBtn: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(251, 191, 36, 0.4)',
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 8,
  },
  heroSecondaryBtnText: { color: '#FBBF24', fontSize: 14, fontWeight: '700' },

  // Stats Bar
  statsBar: {
    flexDirection: 'row', paddingVertical: 20, paddingHorizontal: 16, justifyContent: 'space-around',
  },
  statBlock: { alignItems: 'center', gap: 4 },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  statValue: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  // Search
  searchSection: { paddingHorizontal: 16, paddingTop: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14,
    height: 44, borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#002B5C', borderColor: '#002B5C' },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#FFF' },
  deptChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8,
    backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E2E8F0',
  },
  deptChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  deptChipText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  deptChipTextActive: { color: '#FFF' },

  // Mentor Card
  mentorCard: {
    backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: theme.border || '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  featuredCard: {
    borderColor: '#FBBF2440', borderWidth: 1.5,
    shadowColor: '#FBBF24', shadowOpacity: 0.08,
  },
  featuredBadge: {
    position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FBBF24', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 3, zIndex: 1,
  },
  featuredBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  mentorCardHeader: { flexDirection: 'row', alignItems: 'center' },
  mentorAvatar: { width: 52, height: 52, borderRadius: 16 },
  mentorName: { fontSize: 15, fontWeight: '800' },
  mentorDesignation: { fontSize: 12, marginTop: 1 },
  mentorBatch: { fontSize: 11, marginTop: 1 },
  expertiseContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 },
  expertiseTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  expertiseTagText: { fontSize: 11, fontWeight: '700' },
  mentorMetaRow: { flexDirection: 'row', marginTop: 12, gap: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, fontWeight: '500' },
  requestButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#002B5C', paddingVertical: 11, borderRadius: 12, marginTop: 14, gap: 6,
  },
  requestedButton: {
    backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC',
  },
  requestButtonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  // Section
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 8 },
  emptySubtitle: { fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 20, maxWidth: 280 },
  emptyAction: {
    backgroundColor: '#002B5C', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 20,
  },
  emptyActionText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // My Mentors
  myMentorCard: {
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1,
  },
  myMentorAvatar: { width: 44, height: 44, borderRadius: 14 },
  myMentorName: { fontSize: 14, fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  actionBtnSmall: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: 10,
  },

  // Resources
  resourceCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
    marginBottom: 10, borderWidth: 1,
  },
  resourceIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  resourceTitle: { fontSize: 14, fontWeight: '700' },
  resourceDesc: { fontSize: 12, marginTop: 2 },

  // Apply Cards
  applyCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1.5, gap: 12,
  },
  applyCardIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  applyCardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  detailModal: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 10,
  },
  modalClose: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
  },
  detailAvatar: { width: 80, height: 80, borderRadius: 24 },
  detailName: { fontSize: 20, fontWeight: '900' },
  detailStats: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 20, padding: 14,
    borderRadius: 14, borderWidth: 1,
  },
  detailStatVal: { fontSize: 16, fontWeight: '800' },
  detailSectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  availabilityBlock: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1,
  },
  detailPrimaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#002B5C', paddingVertical: 14, borderRadius: 14, gap: 8,
  },
  detailPrimaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  detailSecondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, gap: 8, borderWidth: 1.5,
  },
  detailSecondaryBtnText: { fontSize: 15, fontWeight: '700' },

  // Application Modal
  applyModal: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  typeToggle: {
    flexDirection: 'row', borderRadius: 12, padding: 4,
  },
  typeToggleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  typeToggleBtnActive: { backgroundColor: '#002B5C' },
  typeToggleText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  typeToggleTextActive: { color: '#FFF', fontWeight: '800' },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  formInput: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, borderWidth: 1,
  },
  formTextArea: { minHeight: 100, textAlignVertical: 'top' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#002B5C', paddingVertical: 14, borderRadius: 14, gap: 8, marginTop: 24, marginBottom: 20,
  },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});

export default MentorshipScreen;
