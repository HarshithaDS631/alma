import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  Image, StatusBar, TextInput, Modal, Alert, Platform,
  useWindowDimensions, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import getInitials from '../lib/getInitials';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── ALMACONNECT STANDARD AREAS & DEPARTMENTS ────────────────
const FOCUS_AREAS = [
  'All',
  'Software Engineering',
  'System Design',
  'Higher Studies',
  'Core Engineering',
  'Product Management',
  'Machine Learning',
  'Civil Services',
  'Entrepreneurship',
  'Research',
  'VLSI Design',
  'Finance'
];

const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Science',
  'Biotechnology',
  'Electrical Engineering'
];

// Fallback Curated Mentors
const DEFAULT_MENTORS = [
  {
    id: 'curated_m1',
    name: 'Dr. Raghav Sharma',
    batchYear: '2005',
    department: 'Computer Science',
    company: 'Google',
    designation: 'Principal Engineer',
    location: 'Mountain View, CA',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    about: 'Passionate about building scalable distributed systems and cloud infrastructure. 18+ years in tech, happy to guide aspiring engineers and leaders.',
    availability: 'Weekends, 2 slots/month',
    areas: ['Software Engineering', 'System Design', 'Machine Learning'],
    skills: ['System Design', 'Cloud Architecture', 'Go', 'Kubernetes'],
    menteesCount: 14,
    rating: 4.9,
    institution: 'RV College of Engineering',
    isVerified: true
  },
  {
    id: 'curated_m2',
    name: 'Priya Nair',
    batchYear: '2010',
    department: 'Electronics & Communication',
    company: 'Microsoft',
    designation: 'Senior Product Manager',
    location: 'Hyderabad, India',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    about: 'Transitioned from technical engineering to product management. Happy to mentor on APM preparation, product strategy, and career transitions.',
    availability: 'Tue & Thu evenings',
    areas: ['Product Management', 'Career Strategy', 'Agile Methodologies'],
    skills: ['Product Strategy', 'UX Research', 'Agile', 'Analytics'],
    menteesCount: 9,
    rating: 4.8,
    institution: 'RV College of Engineering',
    isVerified: true
  },
  {
    id: 'curated_m3',
    name: 'Arun Patel',
    batchYear: '2008',
    department: 'Mechanical Engineering',
    company: 'Tesla',
    designation: 'Staff Mechanical Engineer',
    location: 'Austin, TX',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    about: 'From RVCE mechanical workshops to Tesla Gigafactory floors. Guiding students in automotive engineering, CAD/CAM, and EV hardware design.',
    availability: 'Flexible, bi-weekly',
    areas: ['Core Engineering', 'Automotive Engineering', 'CAD/CAM'],
    skills: ['Automotive Engineering', 'CAD/CAM', 'Manufacturing', 'SolidWorks'],
    menteesCount: 7,
    rating: 4.7,
    institution: 'RV College of Engineering',
    isVerified: true
  },
  {
    id: 'curated_m4',
    name: 'Dr. Kavitha Reddy',
    batchYear: '2003',
    department: 'Biotechnology',
    company: 'Biocon',
    designation: 'VP R&D',
    location: 'Bengaluru, India',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    about: 'Leading biopharmaceutical research for over 20 years. Dedicated mentor to biotech students, researchers, and aspiring PhD scholars.',
    availability: 'Weekends, 3 slots/month',
    areas: ['Research', 'Biotechnology', 'Higher Studies'],
    skills: ['Bioinformatics', 'Drug Discovery', 'Clinical Trials'],
    menteesCount: 16,
    rating: 4.9,
    institution: 'RV College of Engineering',
    isVerified: true
  }
];

// Fallback Curated Mentees (AlmaConnect Mentee Questionnaire Profiles)
const DEFAULT_MENTEES = [
  {
    id: 'curated_mentee_1',
    name: 'Rohan Kulkarni',
    batchYear: '2025',
    department: 'Computer Science',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    areas: ['Software Engineering', 'System Design'],
    whyMentor: 'I want guidance from an industry veteran on transitioning from college projects to scalable backend architectures, understanding distributed systems in production, and cracking product-based company technical rounds.',
    guidance: 'Backend engineering with Node.js/Go, microservices patterns, Docker/Kubernetes, and system design case studies.',
    progress: 'Completed AWS Certified Cloud Practitioner. Built a real-time collaborative code editor with WebSockets and Redis. Solved 300+ LeetCode problems.',
    activities: 'Technical Lead at RVCE Coding Club, Organized 8th Mile Hackathon 2024, Member of IEEE RVCE Student Branch.'
  },
  {
    id: 'curated_mentee_2',
    name: 'Ananya Sharma',
    batchYear: '2025',
    department: 'Electronics & Communication',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    areas: ['Higher Studies', 'VLSI Design', 'Research'],
    whyMentor: 'Aiming to pursue MS in Electrical & Computer Engineering with a specialization in Chip Design / Computer Architecture in the US for Fall 2026. Looking for guidance on research publications, SOP drafting, and university selection.',
    guidance: 'Digital VLSI design, Verilog/SystemVerilog, physical design flow, and MS application strategy for top US universities.',
    progress: 'Published a conference paper on Low Power ALU design at IEEE Confluence. Completed coursework in VLSI & Embedded Systems with a 9.2 CGPA. Cleared GRE (Score: 324).',
    activities: 'Core Committee Member of Rotaract Club RVCE, Technical volunteer at Astra Robotics, Class Representative.'
  },
  {
    id: 'curated_mentee_3',
    name: 'Varun Nambiar',
    batchYear: '2024',
    department: 'Mechanical Engineering',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    areas: ['Core Engineering', 'Automotive Engineering'],
    whyMentor: 'Seeking mentorship on breaking into EV powertrain design and transitioning core mechanical skills to modern electric vehicle platforms.',
    guidance: 'Thermal management in battery packs, FEA analysis using ANSYS, CAD modeling (SolidWorks/CATIA), and career pathways in EV startups.',
    progress: 'Lead chassis design engineer for Ashwa Racing (Formula Student Team of RVCE). Completed internship at Bosch Automotive.',
    activities: 'Chassis Lead at Ashwa Racing, SAE India Collegiate Club Member, Badminton Team RVCE.'
  }
];

// AlmaConnect Standard FAQ Content
const FAQS = [
  {
    q: 'Who decides the mentor-mentee match?',
    a: 'The program empowers you with direct choice. Mentees can browse registered mentors and send connection requests directly. Mentors can also browse Mentee Profiles and proactively offer guidance. For students who need assistance, the RVCE Alumni Relations Team reviews applications and provides recommended matches.'
  },
  {
    q: 'How much time commitment is expected?',
    a: 'Mentorship is designed to be flexible. Most pairs communicate asynchronously via in-app messaging, with scheduled 30–45 minute calls once or twice a month based on mutual agreement.'
  },
  {
    q: 'Can a mentee have more than one mentor?',
    a: 'Yes! You can connect with multiple mentors for different career tracks — for example, one mentor for technical systems preparation and another for higher studies / GRE advice.'
  },
  {
    q: 'What if a mentor is inactive or non-responsive?',
    a: 'If a mentor is unable to respond within 7 days, you can cancel the request and connect with another alumnus. You can also reach out to the alumni committee for a curated reassignment.'
  },
  {
    q: 'What is expected from a student mentee?',
    a: 'Be punctual, respectful of the alumni mentor\'s time, come prepared with specific questions or agendas, and actively communicate your progress.'
  }
];

const MentorshipScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWide = width >= 768;
  const styles = getStyles(theme, isDarkMode);

  // Active Tab: 'mentors' | 'mentees' | 'connections' | 'faq'
  const [activeTab, setActiveTab] = useState('mentors');

  // Directory Data
  const [mentors, setMentors] = useState(DEFAULT_MENTORS);
  const [mentees, setMentees] = useState(DEFAULT_MENTEES);
  const [loading, setLoading] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All Departments');

  // Modals
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyType, setApplyType] = useState('mentee'); // 'mentor' | 'mentee'
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestTarget, setRequestTarget] = useState(null); // person to request or connect
  const [requestGoal, setRequestGoal] = useState('');
  const [requestNote, setRequestNote] = useState('');

  // Expandable Mentee Profile Card Tracking
  const [expandedMenteeIds, setExpandedMenteeIds] = useState(new Set());
  // Active FAQ Accordion Index
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(0);

  // User & Connections
  const [currentUser, setCurrentUser] = useState(null);
  const [myConnections, setMyConnections] = useState([]);
  const [requestedIds, setRequestedIds] = useState(new Set());

  // Form Data for Registration
  const [formData, setFormData] = useState({
    areas: [],
    customArea: '',
    whyMentor: '',
    guidance: '',
    progress: '',
    activities: '',
    about: '',
    availability: 'Weekends, 2 slots/month',
    maxMentees: 3
  });

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('userInfo');
      if (userStr) setCurrentUser(JSON.parse(userStr));

      const storedConns = await AsyncStorage.getItem('myMentorships');
      if (storedConns) {
        const parsed = JSON.parse(storedConns);
        setMyConnections(parsed);
        setRequestedIds(new Set(parsed.map(c => c.mentorId || c.targetId)));
      }

      // Fetch Mentors from API
      try {
        const resMentors = await fetch(`${API_BASE}/mentorship/mentors`);
        if (resMentors.ok) {
          const data = await resMentors.json();
          if (Array.isArray(data) && data.length > 0) setMentors(data);
        }
      } catch (_) {}

      // Fetch Mentees from API
      try {
        const resMentees = await fetch(`${API_BASE}/mentorship/mentees`);
        if (resMentees.ok) {
          const data = await resMentees.json();
          if (Array.isArray(data) && data.length > 0) setMentees(data);
        }
      } catch (_) {}
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Filter Mentors
  const filteredMentors = mentors.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.company && m.company.toLowerCase().includes(q)) ||
      (m.designation && m.designation.toLowerCase().includes(q)) ||
      (m.areas && m.areas.some(a => a.toLowerCase().includes(q)));
    const matchesDept = selectedDept === 'All Departments' || m.department === selectedDept;
    const matchesArea = selectedArea === 'All' || (m.areas && m.areas.includes(selectedArea));
    return matchesSearch && matchesDept && matchesArea;
  });

  // Filter Mentees
  const filteredMentees = mentees.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.department && m.department.toLowerCase().includes(q)) ||
      (m.guidance && m.guidance.toLowerCase().includes(q)) ||
      (m.areas && m.areas.some(a => a.toLowerCase().includes(q)));
    const matchesDept = selectedDept === 'All Departments' || m.department === selectedDept;
    const matchesArea = selectedArea === 'All' || (m.areas && m.areas.includes(selectedArea));
    return matchesSearch && matchesDept && matchesArea;
  });

  // Toggle Mentee Details Expansion
  const toggleMenteeExpand = (id) => {
    setExpandedMenteeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle Focus Area Selection in Registration Form
  const toggleFormArea = (area) => {
    setFormData(prev => {
      const exists = prev.areas.includes(area);
      const nextAreas = exists ? prev.areas.filter(a => a !== area) : [...prev.areas, area];
      return { ...prev, areas: nextAreas };
    });
  };

  // Handle Mentorship Request Submission
  const handleSendRequest = async () => {
    if (!requestTarget) return;

    const isMentorTarget = !requestTarget.whyMentor;
    const connectionItem = {
      id: 'conn_' + Date.now(),
      targetId: requestTarget.id || requestTarget._id,
      name: requestTarget.name,
      role: requestTarget.designation || 'Student Mentee',
      company: requestTarget.company || requestTarget.institution || 'RVCE',
      department: requestTarget.department,
      avatar: requestTarget.avatar_url,
      type: isMentorTarget ? 'Mentor' : 'Mentee',
      goals: requestGoal || 'Career & Technical Guidance',
      message: requestNote,
      status: 'Pending',
      requestedAt: new Date().toISOString()
    };

    const updated = [connectionItem, ...myConnections];
    setMyConnections(updated);
    setRequestedIds(prev => new Set([...prev, connectionItem.targetId]));
    await AsyncStorage.setItem('myMentorships', JSON.stringify(updated));

    // Also dispatch to API if user is authenticated
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        await fetch(`${API_BASE}/mentorship/request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            mentorId: requestTarget.userId || requestTarget.id,
            goals: requestGoal,
            message: requestNote
          })
        });
      }
    } catch (_) {}

    setShowRequestModal(false);
    setRequestGoal('');
    setRequestNote('');

    Alert.alert(
      '✅ Request Sent!',
      `Your mentorship ${isMentorTarget ? 'request' : 'connection offer'} has been submitted to ${requestTarget.name}. They will be notified via email and in-app message.`,
      [{ text: 'OK' }]
    );
  };

  // Handle Registration Submit (Mentor / Mentee)
  const handleSubmitRegistration = async () => {
    if (formData.areas.length === 0 && !formData.customArea.trim()) {
      Alert.alert('Selection Required', 'Please select at least one area of interest.');
      return;
    }

    const finalAreas = [...formData.areas];
    if (formData.customArea.trim()) {
      finalAreas.push(formData.customArea.trim());
    }

    if (applyType === 'mentee' && !formData.whyMentor.trim()) {
      Alert.alert('Required Field', 'Please explain why you want an alumni mentor.');
      return;
    }

    const payload = {
      type: applyType,
      areas: finalAreas,
      whyMentor: formData.whyMentor,
      guidance: formData.guidance,
      progress: formData.progress,
      activities: formData.activities,
      about: formData.about,
      availability: formData.availability,
      maxMentees: formData.maxMentees
    };

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        await fetch(`${API_BASE}/mentorship/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }
    } catch (_) {}

    // Add directly to local lists so user sees immediate results
    if (applyType === 'mentee') {
      const newMentee = {
        id: 'mentee_' + Date.now(),
        name: currentUser?.name || 'Alumni Member',
        batchYear: currentUser?.batchYear || '2025',
        department: currentUser?.department || 'Computer Science',
        institution: currentUser?.institution || 'RV College of Engineering',
        avatar_url: currentUser?.avatar_url || currentUser?.profilePicture || '',
        areas: finalAreas,
        whyMentor: formData.whyMentor,
        guidance: formData.guidance,
        progress: formData.progress,
        activities: formData.activities
      };
      setMentees(prev => [newMentee, ...prev]);
    } else {
      const newMentor = {
        id: 'mentor_' + Date.now(),
        name: currentUser?.name || 'Alumni Mentor',
        batchYear: currentUser?.batchYear || '2016',
        department: currentUser?.department || 'Engineering',
        company: currentUser?.company || 'Industry Leader',
        designation: currentUser?.designation || 'Senior Professional',
        location: currentUser?.location || 'Bengaluru',
        avatar_url: currentUser?.avatar_url || currentUser?.profilePicture || '',
        about: formData.about,
        availability: formData.availability,
        areas: finalAreas,
        skills: finalAreas,
        menteesCount: 0,
        rating: 5.0,
        institution: currentUser?.institution || 'RV College of Engineering',
        isVerified: true
      };
      setMentors(prev => [newMentor, ...prev]);
    }

    setShowApplyModal(false);
    setFormData({
      areas: [],
      customArea: '',
      whyMentor: '',
      guidance: '',
      progress: '',
      activities: '',
      about: '',
      availability: 'Weekends, 2 slots/month',
      maxMentees: 3
    });

    Alert.alert(
      '🎉 Profile Published!',
      applyType === 'mentor'
        ? 'Thank you for volunteering as a mentor! Your profile is now live in the Mentors directory.'
        : 'Your mentee profile is now published in the Mentee Profiles directory for alumni to review and connect.',
      [{ text: 'Awesome' }]
    );
  };

  // Launch Direct Chat with Person
  const openChatWithUser = (person) => {
    if (selectedMentor) setSelectedMentor(null);
    if (selectedMentee) setSelectedMentee(null);
    navigation?.navigate?.('Chat', {
      user: {
        _id: person.userId || person.id || 'chat_user',
        name: person.name,
        avatar: person.avatar_url,
        role: person.designation || 'Member',
        company: person.company || person.institution
      }
    });
  };

  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 1000, flex: 1 } : { flex: 1 };

  // ─── RENDER HERO ──────────────────────────────────────────
  const renderHero = () => (
    <View style={styles.heroGradient}>
      <View style={styles.heroContent}>
        <View style={styles.heroBadge}>
          <MaterialCommunityIcons name="handshake" size={14} color="#FBBF24" />
          <Text style={styles.heroBadgeText}>RVCE ALUMNI MENTORSHIP PROGRAM</Text>
        </View>
        <Text style={styles.heroTitle}>Connect. Guide.{'\n'}Accelerate Careers.</Text>
        <Text style={styles.heroSubtitle}>
          The official community-driven mentorship network. Connect directly with verified RV alumni leaders or mentor ambitious students shaping their futures.
        </Text>
        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.heroPrimaryBtn}
            onPress={() => { setApplyType('mentee'); setShowApplyModal(true); }}
          >
            <Ionicons name="school-outline" size={18} color="#002B5C" />
            <Text style={styles.heroPrimaryBtnText}>Apply as Mentee</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.heroSecondaryBtn}
            onPress={() => { setApplyType('mentor'); setShowApplyModal(true); }}
          >
            <MaterialCommunityIcons name="hand-heart-outline" size={18} color="#FBBF24" />
            <Text style={styles.heroSecondaryBtnText}>Register as Mentor</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // ─── RENDER SEARCH & FILTER ───────────────────────────────
  const renderFilters = () => (
    <View style={styles.searchSection}>
      <View style={[styles.searchBar, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
        <Ionicons name="search-outline" size={18} color={isDarkMode ? '#94A3B8' : '#64748B'} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder={activeTab === 'mentors' ? 'Search mentors by name, company, skill...' : 'Search mentees by name, branch, guidance...'}
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
        {FOCUS_AREAS.map(area => (
          <TouchableOpacity
            key={area}
            style={[
              styles.filterChip,
              selectedArea === area && styles.filterChipActive,
              { borderColor: isDarkMode ? '#334155' : '#E2E8F0' }
            ]}
            onPress={() => setSelectedArea(area)}
          >
            <Text style={[
              styles.filterChipText,
              selectedArea === area && styles.filterChipTextActive,
              { color: selectedArea === area ? '#FFF' : (isDarkMode ? '#94A3B8' : '#64748B') }
            ]}>{area}</Text>
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

  // ─── RENDER MENTOR CARD ───────────────────────────────────
  const renderMentorCard = (m) => {
    const isRequested = requestedIds.has(m.id || m._id);
    return (
      <View
        key={m.id || m._id}
        style={[styles.mentorCard, isWide && { width: '48.5%' }]}
      >
        <View style={styles.cardHeaderRow}>
          {m.avatar_url ? (
            <Image source={{ uri: m.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: '#002B5C' }]}>
              <Text style={styles.avatarInitials}>{getInitials(m.name)}</Text>
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{m.name}</Text>
              {m.isVerified && <Ionicons name="checkmark-circle" size={16} color="#3B82F6" style={{ marginLeft: 4 }} />}
            </View>
            <Text style={[styles.cardSubTitle, { color: theme.textSecondary || '#64748B' }]} numberOfLines={1}>
              {m.designation} at {m.company}
            </Text>
            <Text style={[styles.cardMeta, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
              Class of {m.batchYear} • {m.department}
            </Text>
          </View>
        </View>

        {m.about ? (
          <Text style={[styles.bioSnippet, { color: isDarkMode ? '#CBD5E1' : '#475569' }]} numberOfLines={2}>
            {m.about}
          </Text>
        ) : null}

        <View style={styles.tagWrap}>
          {(m.areas || []).slice(0, 3).map((tag, i) => (
            <View key={i} style={[styles.pillBadge, { backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF' }]}>
              <Text style={[styles.pillText, { color: isDarkMode ? '#93C5FD' : '#2563EB' }]}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.availabilityRow}>
          <Ionicons name="time-outline" size={14} color="#16A34A" />
          <Text style={styles.availabilityText}>{m.availability}</Text>
        </View>

        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, isRequested && styles.requestedActionBtn]}
            onPress={() => {
              if (isRequested) {
                Alert.alert('Already Requested', `You already sent a request to ${m.name}.`);
                return;
              }
              setRequestTarget(m);
              setShowRequestModal(true);
            }}
          >
            <Ionicons name={isRequested ? 'checkmark-circle' : 'hand-right-outline'} size={15} color={isRequested ? '#16A34A' : '#FFF'} />
            <Text style={[styles.primaryActionText, isRequested && { color: '#16A34A' }]}>
              {isRequested ? 'Requested' : 'Request Mentorship'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryActionBtn, { borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
            onPress={() => openChatWithUser(m)}
          >
            <Ionicons name="chatbubble-outline" size={15} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
            <Text style={[styles.secondaryActionText, { color: isDarkMode ? '#60A5FA' : '#2563EB' }]}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconActionBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
            onPress={() => setSelectedMentor(m)}
          >
            <Ionicons name="information-circle-outline" size={18} color={isDarkMode ? '#94A3B8' : '#64748B'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── RENDER MENTEE CARD (ALMACONNECT QUESTIONNAIRE CARD) ───
  const renderMenteeCard = (mentee) => {
    const isExpanded = expandedMenteeIds.has(mentee.id);
    const isConnected = requestedIds.has(mentee.id);

    return (
      <View key={mentee.id} style={styles.menteeCard}>
        <View style={styles.cardHeaderRow}>
          {mentee.avatar_url ? (
            <Image source={{ uri: mentee.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: '#10B981' }]}>
              <Text style={styles.avatarInitials}>{getInitials(mentee.name)}</Text>
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{mentee.name}</Text>
            <Text style={[styles.cardSubTitle, { color: theme.textSecondary || '#64748B' }]}>
              {mentee.department} • Batch of {mentee.batchYear}
            </Text>
            <Text style={[styles.cardMeta, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
              {mentee.institution || 'RV College of Engineering'}
            </Text>
          </View>
          <View style={styles.menteeSeekerBadge}>
            <Text style={styles.menteeSeekerBadgeText}>Seeking Mentor</Text>
          </View>
        </View>

        {/* Target Focus Areas */}
        <View style={styles.tagWrap}>
          {(mentee.areas || []).map((area, i) => (
            <View key={i} style={[styles.pillBadge, { backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF' }]}>
              <Text style={[styles.pillText, { color: isDarkMode ? '#93C5FD' : '#2563EB' }]}>🎯 {area}</Text>
            </View>
          ))}
        </View>

        {/* AlmaConnect Structured Questionnaire Responses */}
        <View style={[styles.menteeQuestionnaireBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
          <View style={styles.qnaBlock}>
            <Text style={styles.qnaHeading}>🎯 Why do you want an alumni mentor?</Text>
            <Text style={[styles.qnaAnswer, { color: isDarkMode ? '#CBD5E1' : '#334155' }]} numberOfLines={isExpanded ? undefined : 2}>
              {mentee.whyMentor}
            </Text>
          </View>

          {isExpanded && (
            <>
              <View style={[styles.qnaBlock, { marginTop: 12 }]}>
                <Text style={styles.qnaHeading}>🔍 Field(s) requiring guidance in detail:</Text>
                <Text style={[styles.qnaAnswer, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  {mentee.guidance}
                </Text>
              </View>

              <View style={[styles.qnaBlock, { marginTop: 12 }]}>
                <Text style={styles.qnaHeading}>📈 Progress & past work so far:</Text>
                <Text style={[styles.qnaAnswer, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  {mentee.progress}
                </Text>
              </View>

              <View style={[styles.qnaBlock, { marginTop: 12 }]}>
                <Text style={styles.qnaHeading}>🏫 Campus activities & clubs:</Text>
                <Text style={[styles.qnaAnswer, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                  {mentee.activities}
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.expandToggleBtn}
            onPress={() => toggleMenteeExpand(mentee.id)}
          >
            <Text style={styles.expandToggleText}>
              {isExpanded ? 'Show Less ▲' : 'Read Full Application ▼'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Row */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: '#10B981' }]}
            onPress={() => {
              setRequestTarget(mentee);
              setShowRequestModal(true);
            }}
          >
            <Ionicons name="sparkles" size={15} color="#FFF" />
            <Text style={styles.primaryActionText}>
              {isConnected ? 'Offer Sent' : 'Offer Mentorship'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryActionBtn, { borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
            onPress={() => openChatWithUser(mentee)}
          >
            <Ionicons name="chatbubble-outline" size={15} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
            <Text style={[styles.secondaryActionText, { color: isDarkMode ? '#60A5FA' : '#2563EB' }]}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconActionBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
            onPress={() => setSelectedMentee(mentee)}
          >
            <Ionicons name="eye-outline" size={18} color={isDarkMode ? '#94A3B8' : '#64748B'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── RENDER CONNECTIONS TAB ───────────────────────────────
  const renderConnectionsTab = () => (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>My Mentorship Requests & Connections</Text>
        <Text style={{ fontSize: 12, color: '#64748B' }}>{myConnections.length} Active</Text>
      </View>

      {myConnections.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF' }]}>
            <MaterialCommunityIcons name="handshake-outline" size={48} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Connections Yet</Text>
          <Text style={[styles.emptySubtitle, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
            Browse mentors to seek advice or check mentee profiles to volunteer guidance.
          </Text>
          <TouchableOpacity style={styles.emptyAction} onPress={() => setActiveTab('mentors')}>
            <Text style={styles.emptyActionText}>Find a Mentor</Text>
          </TouchableOpacity>
        </View>
      ) : (
        myConnections.map(conn => (
          <View key={conn.id} style={[styles.connectionCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {conn.avatar ? (
                <Image source={{ uri: conn.avatar }} style={styles.myMentorAvatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { width: 44, height: 44, backgroundColor: '#002B5C' }]}>
                  <Text style={styles.avatarInitials}>{getInitials(conn.name)}</Text>
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.myMentorName, { color: theme.text }]}>{conn.name}</Text>
                <Text style={{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                  {conn.role} • {conn.company}
                </Text>
              </View>
              <View style={[styles.statusBadge, {
                backgroundColor: conn.status === 'Active' ? '#DCFCE7' : conn.status === 'Pending' ? '#FEF3C7' : '#FEE2E2'
              }]}>
                <View style={[styles.statusDot, {
                  backgroundColor: conn.status === 'Active' ? '#16A34A' : conn.status === 'Pending' ? '#D97706' : '#DC2626'
                }]} />
                <Text style={[styles.statusText, {
                  color: conn.status === 'Active' ? '#16A34A' : conn.status === 'Pending' ? '#D97706' : '#DC2626'
                }]}>{conn.status}</Text>
              </View>
            </View>

            {conn.goals ? (
              <View style={[styles.connGoalBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}>
                <Text style={styles.connGoalLabel}>Goal / Note:</Text>
                <Text style={[styles.connGoalText, { color: isDarkMode ? '#CBD5E1' : '#475569' }]}>{conn.goals}</Text>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
              <TouchableOpacity
                style={[styles.actionBtnSmall, { backgroundColor: isDarkMode ? '#0F172A' : '#EFF6FF', flex: 1 }]}
                onPress={() => openChatWithUser({ id: conn.targetId, name: conn.name, avatar_url: conn.avatar })}
              >
                <Ionicons name="chatbubble-outline" size={14} color="#2563EB" />
                <Text style={{ color: '#2563EB', fontSize: 12, fontWeight: '700', marginLeft: 4 }}>Open Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtnSmall, { backgroundColor: isDarkMode ? '#0F172A' : '#F0FDF4', flex: 1 }]}
                onPress={() => Alert.alert('Session Booking', `You can coordinate 1-on-1 meeting times directly in the in-app chat thread with ${conn.name}.`)}
              >
                <Ionicons name="calendar-outline" size={14} color="#16A34A" />
                <Text style={{ color: '#16A34A', fontSize: 12, fontWeight: '700', marginLeft: 4 }}>Schedule Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  // ─── RENDER FAQ TAB (ALMACONNECT RULES) ───────────────────
  const renderFaqTab = () => (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      <View style={[styles.faqBanner, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF', borderColor: isDarkMode ? '#334155' : '#BFDBFE' }]}>
        <Ionicons name="information-circle" size={24} color="#2563EB" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.faqBannerTitle, { color: isDarkMode ? '#93C5FD' : '#1E40AF' }]}>
            AlmaConnect Mentorship Guidelines
          </Text>
          <Text style={[styles.faqBannerText, { color: isDarkMode ? '#CBD5E1' : '#1E3A8A' }]}>
            Official policies governing RVCE alumni mentors and student mentees.
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 18, marginBottom: 12 }]}>
        Frequently Asked Questions
      </Text>

      {FAQS.map((faq, idx) => {
        const isOpen = expandedFaqIndex === idx;
        return (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.8}
            onPress={() => setExpandedFaqIndex(isOpen ? -1 : idx)}
            style={[styles.faqCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.faqQuestion, { color: theme.text, flex: 1, marginRight: 8 }]}>
                {faq.q}
              </Text>
              <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={isDarkMode ? '#94A3B8' : '#64748B'}
              />
            </View>
            {isOpen && (
              <Text style={[styles.faqAnswer, { color: isDarkMode ? '#94A3B8' : '#475569' }]}>
                {faq.a}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={styles.sampleAppButton}
        onPress={() => setShowSampleModal(true)}
      >
        <Ionicons name="document-text-outline" size={18} color="#002B5C" />
        <Text style={styles.sampleAppButtonText}>View Sample Exemplary Applications</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── RENDER REGISTRATION MODAL (DUAL TRACK) ───────────────
  const renderApplyModal = () => (
    <Modal visible={showApplyModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.applyModal, { backgroundColor: isDarkMode ? '#0F172A' : '#FFF' }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {applyType === 'mentor' ? '👨‍🏫 Mentor Registration' : '🎓 Mentee Registration'}
                </Text>
                <Text style={{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                  {applyType === 'mentor' ? 'Volunteer your time & guide students' : 'Structured questionnaire for alumni matching'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <Ionicons name="close-circle" size={26} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {/* Toggle Track */}
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

            {/* Helper link */}
            <TouchableOpacity
              style={{ marginTop: 12, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center' }}
              onPress={() => setShowSampleModal(true)}
            >
              <Ionicons name="help-circle-outline" size={14} color="#2563EB" />
              <Text style={{ color: '#2563EB', fontSize: 12, fontWeight: '700', marginLeft: 4 }}>
                View Sample Applications
              </Text>
            </TouchableOpacity>

            {/* Tag Selection Chips */}
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>
                {applyType === 'mentor' ? 'Areas where you can offer mentorship *' : 'Areas looking for mentorship *'}
              </Text>
              <View style={styles.tagWrap}>
                {FOCUS_AREAS.filter(a => a !== 'All').map(area => {
                  const selected = formData.areas.includes(area);
                  return (
                    <TouchableOpacity
                      key={area}
                      style={[
                        styles.selectChip,
                        selected && styles.selectChipActive,
                        { borderColor: isDarkMode ? '#334155' : '#E2E8F0' }
                      ]}
                      onPress={() => toggleFormArea(area)}
                    >
                      <Text style={[styles.selectChipText, selected && styles.selectChipTextActive]}>
                        {selected ? '✓ ' : '+ '}{area}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                style={[styles.formInput, { marginTop: 8, color: theme.text, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                placeholder="Or type a custom area/domain..."
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                value={formData.customArea}
                onChangeText={v => setFormData({ ...formData, customArea: v })}
              />
            </View>

            {/* Mentee Specific Questions */}
            {applyType === 'mentee' ? (
              <View style={{ gap: 14, marginTop: 16 }}>
                <View>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Why do you want an alumni mentor? *</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea, { color: theme.text, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                    placeholder="Describe your current stage and why mentorship is important to you..."
                    placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                    value={formData.whyMentor}
                    onChangeText={v => setFormData({ ...formData, whyMentor: v })}
                    multiline
                  />
                </View>

                <View>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Describe in detail the field(s) requiring guidance</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea, { color: theme.text, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                    placeholder="Specific technologies, higher education tracks, interview prep, etc."
                    placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                    value={formData.guidance}
                    onChangeText={v => setFormData({ ...formData, guidance: v })}
                    multiline
                  />
                </View>

                <View>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Progress / Past Work</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                    placeholder="Relevant projects, coursework, certifications completed"
                    placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                    value={formData.progress}
                    onChangeText={v => setFormData({ ...formData, progress: v })}
                  />
                </View>

                <View>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Activities during your time at the institute</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                    placeholder="Clubs, committees, sports, hackathons, student branches"
                    placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                    value={formData.activities}
                    onChangeText={v => setFormData({ ...formData, activities: v })}
                  />
                </View>
              </View>
            ) : (
              /* Mentor Specific Questions */
              <View style={{ gap: 14, marginTop: 16 }}>
                <View>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Info about you & guidance offered *</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea, { color: theme.text, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                    placeholder="Share your career journey and how you can guide students (e.g. mock interviews, resume critiques, graduate school advice)..."
                    placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                    value={formData.about}
                    onChangeText={v => setFormData({ ...formData, about: v })}
                    multiline
                  />
                </View>

                <View>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Availability Preference</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                    placeholder="e.g. Weekends, 2 slots/month or Asynchronous chat"
                    placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                    value={formData.availability}
                    onChangeText={v => setFormData({ ...formData, availability: v })}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitRegistration}>
              <Ionicons name="cloud-upload-outline" size={18} color="#FFF" />
              <Text style={styles.submitBtnText}>
                {applyType === 'mentor' ? 'Publish Mentor Profile' : 'Submit Mentee Application'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ─── RENDER REQUEST / CONNECT MODAL ───────────────────────
  const renderRequestModal = () => {
    if (!requestTarget) return null;
    const isMentor = !requestTarget.whyMentor;

    return (
      <Modal visible={showRequestModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.applyModal, { backgroundColor: isDarkMode ? '#0F172A' : '#FFF', maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {isMentor ? `Connect with ${requestTarget.name}` : `Offer Mentorship to ${requestTarget.name}`}
                </Text>
                <Text style={{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                  {isMentor ? `${requestTarget.designation} at ${requestTarget.company}` : `${requestTarget.department} • Batch ${requestTarget.batchYear}`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                <Ionicons name="close-circle" size={26} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14, marginTop: 16 }}>
              <View>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Primary Goal / Focus Area</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                  placeholder={isMentor ? 'e.g. System Design Mock Interview or MS in US Advice' : 'e.g. Guidance in Backend Systems & Career Prep'}
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                  value={requestGoal}
                  onChangeText={setRequestGoal}
                />
              </View>

              <View>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Personalized Introduction Note</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea, { color: theme.text, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                  placeholder="Introduce yourself, share your expectations, and let them know why you reached out..."
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                  value={requestNote}
                  onChangeText={setRequestNote}
                  multiline
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSendRequest}>
              <Ionicons name="paper-plane" size={18} color="#FFF" />
              <Text style={styles.submitBtnText}>Send Connection Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── RENDER SAMPLE APPLICATION MODAL ──────────────────────
  const renderSampleModal = () => (
    <Modal visible={showSampleModal} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.detailModal, { backgroundColor: isDarkMode ? '#0F172A' : '#FFF', padding: 20 }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Sample Applications</Text>
              <TouchableOpacity onPress={() => setShowSampleModal(false)}>
                <Ionicons name="close-circle" size={26} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: isDarkMode ? '#94A3B8' : '#64748B', fontSize: 13, marginBottom: 16 }}>
              Adopted from AlmaConnect’s best-practice mentor and mentee profiles.
            </Text>

            <View style={[styles.sampleBox, { backgroundColor: isDarkMode ? '#1E293B' : '#F0FDF4', borderColor: '#86EFAC' }]}>
              <Text style={[styles.sampleTitle, { color: '#16A34A' }]}>Exemplary Mentee Application</Text>
              <Text style={styles.sampleSubHeading}>🎯 Why an alumni mentor?</Text>
              <Text style={styles.sampleText}>
                {"\"I am preparing for SDE-1 interviews at tier-1 product companies and seeking guidance on designing scalable microservices. Having an alumni mentor who has navigated this journey will help me bridge the academic-industry gap.\""}
              </Text>
              <Text style={[styles.sampleSubHeading, { marginTop: 8 }]}>📈 Progress so far:</Text>
              <Text style={styles.sampleText}>
                {"\"Built 2 full-stack projects in React & Node.js. 300+ Leetcode questions solved. Active participant in college hackathons.\""}
              </Text>
            </View>

            <View style={[styles.sampleBox, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF', borderColor: '#93C5FD', marginTop: 14 }]}>
              <Text style={[styles.sampleTitle, { color: '#2563EB' }]}>Exemplary Mentor Profile</Text>
              <Text style={styles.sampleSubHeading}>💼 Guidance Offered:</Text>
              <Text style={styles.sampleText}>
                {"\"10+ years in software architecture at Microsoft. Happy to review system design portfolios, conduct 1 mock interview per month, and advise on navigating corporate tech careers.\""}
              </Text>
              <Text style={[styles.sampleSubHeading, { marginTop: 8 }]}>⏰ Availability:</Text>
              <Text style={styles.sampleText}>
                {"\"Alternate Saturday mornings IST. Asynchronous responses on in-app chat within 48 hours.\""}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#002B5C', marginTop: 20 }]}
              onPress={() => setShowSampleModal(false)}
            >
              <Text style={styles.submitBtnText}>Got it!</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={webContainerStyle}>
        {/* Top Header */}
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation?.goBack?.()} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Mentorship Network</Text>
              <Text style={{ fontSize: 11, color: isDarkMode ? '#64748B' : '#94A3B8', fontWeight: '600' }}>RV Educational Institutions</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#FEF3C7' }]}
              onPress={() => { setApplyType('mentor'); setShowApplyModal(true); }}
            >
              <MaterialCommunityIcons name="hand-heart" size={18} color="#D97706" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF' }]}
              onPress={() => { setApplyType('mentee'); setShowApplyModal(true); }}
            >
              <Ionicons name="school" size={18} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 4-Tab AlmaConnect Navigation */}
        <View style={[styles.tabBar, { backgroundColor: theme.card, borderBottomColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
          {[
            { key: 'mentors', label: 'Find Mentors', icon: 'people-outline' },
            { key: 'mentees', label: 'Mentee Profiles', icon: 'school-outline' },
            { key: 'connections', label: 'My Requests', icon: 'handshake-outline' },
            { key: 'faq', label: 'FAQ & Rules', icon: 'help-circle-outline' }
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
          {activeTab === 'mentors' && (
            <>
              {renderHero()}
              {renderFilters()}

              <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Verified Alumni Mentors ({filteredMentors.length})
                  </Text>
                  <TouchableOpacity onPress={() => setShowSampleModal(true)}>
                    <Text style={{ fontSize: 12, color: '#2563EB', fontWeight: '700' }}>View Best Practices</Text>
                  </TouchableOpacity>
                </View>

                {loading ? (
                  <ActivityIndicator size="small" color="#002B5C" style={{ marginVertical: 20 }} />
                ) : (
                  <View style={isWide ? { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } : {}}>
                    {filteredMentors.map(renderMentorCard)}
                  </View>
                )}

                {filteredMentors.length === 0 && !loading && (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={48} color={isDarkMode ? '#475569' : '#CBD5E1'} />
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>No mentors found</Text>
                    <Text style={[styles.emptySubtitle, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                      Try clearing search keywords or department filters.
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          {activeTab === 'mentees' && (
            <>
              <View style={[styles.menteePoolBanner, { backgroundColor: isDarkMode ? '#0F172A' : '#002B5C' }]}>
                <Text style={styles.menteePoolBannerTitle}>RVCE Mentee Profiles Pool</Text>
                <Text style={styles.menteePoolBannerSubtitle}>
                  Students and young alumni seeking guidance across industries. Alumni mentors can review applications and directly reach out.
                </Text>
                <TouchableOpacity
                  style={styles.menteePoolCta}
                  onPress={() => { setApplyType('mentee'); setShowApplyModal(true); }}
                >
                  <Text style={styles.menteePoolCtaText}>+ Submit Mentee Profile</Text>
                </TouchableOpacity>
              </View>

              {renderFilters()}

              <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>
                  Students Seeking Guidance ({filteredMentees.length})
                </Text>

                {loading ? (
                  <ActivityIndicator size="small" color="#002B5C" style={{ marginVertical: 20 }} />
                ) : (
                  filteredMentees.map(renderMenteeCard)
                )}

                {filteredMentees.length === 0 && !loading && (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={48} color={isDarkMode ? '#475569' : '#CBD5E1'} />
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>No mentee applications yet</Text>
                    <Text style={[styles.emptySubtitle, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                      Be the first student to publish your mentorship application!
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          {activeTab === 'connections' && renderConnectionsTab()}
          {activeTab === 'faq' && renderFaqTab()}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {renderApplyModal()}
      {renderRequestModal()}
      {renderSampleModal()}
    </SafeAreaView>
  );
};

// ─── STYLES ──────────────────────────────────────────────────
const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  headerActionBtn: {
    width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 4,
  },
  activeTab: {
    borderBottomWidth: 2.5, borderBottomColor: '#002B5C',
  },
  tabText: { fontSize: 11, fontWeight: '600' },
  activeTabText: { fontWeight: '800' },

  // Hero
  heroGradient: {
    backgroundColor: isDarkMode ? '#0F172A' : '#002B5C',
    paddingHorizontal: 20, paddingVertical: 28,
  },
  heroContent: { alignItems: 'center' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, marginBottom: 12,
  },
  heroBadgeText: { color: '#FBBF24', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  heroTitle: {
    fontSize: 26, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', lineHeight: 34, letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 10, lineHeight: 20, maxWidth: 440,
  },
  heroActions: {
    flexDirection: 'row', gap: 10, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center',
  },
  heroPrimaryBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBBF24',
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, gap: 8,
  },
  heroPrimaryBtnText: { color: '#002B5C', fontSize: 13, fontWeight: '800' },
  heroSecondaryBtn: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(251, 191, 36, 0.5)',
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, gap: 8,
  },
  heroSecondaryBtnText: { color: '#FBBF24', fontSize: 13, fontWeight: '700' },

  // Mentee Pool Banner
  menteePoolBanner: {
    paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center',
  },
  menteePoolBannerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  menteePoolBannerSubtitle: {
    fontSize: 12, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 6, lineHeight: 18, maxWidth: 480,
  },
  menteePoolCta: {
    backgroundColor: '#FBBF24', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginTop: 14,
  },
  menteePoolCtaText: { color: '#002B5C', fontSize: 12, fontWeight: '800' },

  // Search & Filter
  searchSection: { paddingHorizontal: 16, paddingTop: 14 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14,
    height: 42, borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginRight: 6,
  },
  filterChipActive: { backgroundColor: '#002B5C', borderColor: '#002B5C' },
  filterChipText: { fontSize: 11, fontWeight: '600' },
  filterChipTextActive: { color: '#FFF' },
  deptChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, marginRight: 6,
    backgroundColor: 'transparent', borderWidth: 1, borderColor: '#CBD5E1',
  },
  deptChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  deptChipText: { fontSize: 10, fontWeight: '600', color: '#64748B' },
  deptChipTextActive: { color: '#FFF' },

  // Card Basics
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  avatarImg: { width: 48, height: 48, borderRadius: 14 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  cardSubTitle: { fontSize: 12, marginTop: 1 },
  cardMeta: { fontSize: 11, marginTop: 1 },
  bioSnippet: { fontSize: 12, lineHeight: 18, marginTop: 10 },

  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  pillBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 10, fontWeight: '700' },

  availabilityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  availabilityText: { fontSize: 11, color: '#16A34A', fontWeight: '600' },

  cardActionsRow: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'center' },
  primaryActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#002B5C', paddingVertical: 9, borderRadius: 10, gap: 6,
  },
  requestedActionBtn: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC' },
  primaryActionText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  secondaryActionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, gap: 4,
  },
  secondaryActionText: { fontSize: 12, fontWeight: '700' },
  iconActionBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  // Mentor Card
  mentorCard: {
    backgroundColor: theme.card, borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: theme.border || '#E2E8F0',
  },

  // Mentee Card
  menteeCard: {
    backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1.5, borderColor: isDarkMode ? '#1E3A5F' : '#DBEAFE',
  },
  menteeSeekerBadge: {
    backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  menteeSeekerBadgeText: { color: '#16A34A', fontSize: 10, fontWeight: '800' },

  menteeQuestionnaireBox: {
    borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1,
  },
  qnaBlock: {},
  qnaHeading: { fontSize: 11, fontWeight: '800', color: '#2563EB', marginBottom: 3 },
  qnaAnswer: { fontSize: 12, lineHeight: 18 },
  expandToggleBtn: { alignSelf: 'center', marginTop: 10, paddingVertical: 4 },
  expandToggleText: { fontSize: 11, fontWeight: '800', color: '#2563EB' },

  // Connections
  connectionCard: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  myMentorAvatar: { width: 44, height: 44, borderRadius: 12 },
  myMentorName: { fontSize: 14, fontWeight: '800' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800' },
  connGoalBox: { borderRadius: 8, padding: 8, marginTop: 8 },
  connGoalLabel: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  connGoalText: { fontSize: 12, marginTop: 2 },
  actionBtnSmall: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: 8,
  },

  // FAQ
  faqBanner: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1 },
  faqBannerTitle: { fontSize: 14, fontWeight: '800' },
  faqBannerText: { fontSize: 11, marginTop: 2, lineHeight: 16 },
  faqCard: { borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1 },
  faqQuestion: { fontSize: 13, fontWeight: '800' },
  faqAnswer: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  sampleAppButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FBBF24', paddingVertical: 12, borderRadius: 12, gap: 8, marginTop: 16,
  },
  sampleAppButtonText: { color: '#002B5C', fontSize: 13, fontWeight: '800' },

  // Sample Modal
  sampleBox: { borderRadius: 12, padding: 12, borderWidth: 1 },
  sampleTitle: { fontSize: 13, fontWeight: '900', marginBottom: 6 },
  sampleSubHeading: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  sampleText: { fontSize: 12, color: '#334155', fontStyle: 'italic', marginTop: 2, lineHeight: 16 },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  emptyIcon: { width: 70, height: 70, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 6 },
  emptySubtitle: { fontSize: 12, textAlign: 'center', marginTop: 4, lineHeight: 18, maxWidth: 280 },
  emptyAction: {
    backgroundColor: '#002B5C', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 16,
  },
  emptyActionText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  detailModal: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%',
  },
  applyModal: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', padding: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  typeToggle: { flexDirection: 'row', borderRadius: 10, padding: 3 },
  typeToggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  typeToggleBtnActive: { backgroundColor: '#002B5C' },
  typeToggleText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  typeToggleTextActive: { color: '#FFF', fontWeight: '800' },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  selectChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1 },
  selectChipActive: { backgroundColor: '#002B5C', borderColor: '#002B5C' },
  selectChipText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  selectChipTextActive: { color: '#FFF', fontWeight: '800' },
  formInput: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, borderWidth: 1 },
  formTextArea: { minHeight: 80, textAlignVertical: 'top' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#002B5C', paddingVertical: 13, borderRadius: 12, gap: 8, marginTop: 20, marginBottom: 24,
  },
  submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontWeight: '800' }
});

export default MentorshipScreen;
