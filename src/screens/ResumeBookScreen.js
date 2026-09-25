import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Modal,
  Image,
  Alert,
  Platform,
  useWindowDimensions,
  Animated,
  Linking
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import getInitials from '../lib/getInitials';

// ─── Resume Book Sample Talent Data ─────────────────────────────────────
const RESUME_BOOK_TALENTS = [
  {
    id: 'rb1',
    name: 'Sarthak Banka',
    avatar: null,
    skills: ['C++', 'C', 'JavaScript', 'Node.js', 'Python'],
    company: 'Qualcomm',
    position: 'Software Engineer',
    domain: 'Software Engineering',
    experience: '1-2 years',
    bio: 'Passionate software engineer with strong background in embedded systems and full-stack development. Experienced in building scalable solutions.',
    batch: '2022',
    course: 'B.E / B.Tech',
    location: 'Bangalore',
    resumeAvailable: true,
    lookingFor: 'Full-time',
    email: 'sarthak.b@rvce.edu.in'
  },
  {
    id: 'rb2',
    name: 'Manjunath N',
    avatar: null,
    skills: ['B2B Sales', 'Export', 'International Marketing', 'Sales', 'Marketing'],
    company: 'Maverik Facility Management Private Limited',
    position: 'Sr Manager',
    domain: 'Sales / Business',
    experience: '6-10 years',
    bio: 'Over 11 years of experience in Business Development, Key Account Management, Contract Project Management, P&L Management and Team Management.',
    batch: '2012',
    course: 'BE',
    location: 'Bangalore',
    resumeAvailable: true,
    lookingFor: 'Full-time',
    email: 'manjunath.n@rvce.edu.in'
  },
  {
    id: 'rb3',
    name: 'Sanjay Kumar',
    avatar: null,
    skills: ['Data Science', 'Machine Learning', 'Python', 'SQL', 'Analytics'],
    company: 'BRIDGEi2i Analytics Solutions',
    position: 'Business Analyst Azure',
    domain: 'Data Science and Analysis',
    experience: '1-2 years',
    bio: 'Data science professional with expertise in machine learning, statistical modeling, and business analytics. Skilled in deriving insights from complex datasets.',
    batch: '2023',
    course: 'B.E / B.Tech',
    location: 'Bangalore',
    resumeAvailable: true,
    lookingFor: 'Full-time',
    email: 'sanjay.k@rvce.edu.in'
  },
  {
    id: 'rb4',
    name: 'Gagan M R',
    avatar: null,
    skills: ['Consulting', 'Data Analyst', 'Client Management'],
    company: '',
    position: 'Consultant',
    domain: 'Consulting',
    experience: '0-1 years',
    bio: 'Management consulting professional focused on data-driven client solutions and strategic business transformation.',
    batch: '2024',
    course: 'B.E / B.Tech',
    location: 'Bangalore',
    resumeAvailable: true,
    lookingFor: 'Full-time',
    email: 'gagan.mr@rvce.edu.in'
  },
  {
    id: 'rb5',
    name: 'Aravind Krishna',
    avatar: null,
    skills: ['Java', 'MongoDB', 'MySQL', 'Javascript', 'Python'],
    company: 'Amazon',
    position: 'Software Engineer',
    domain: 'Software Engineering',
    experience: '2-4 years',
    bio: "I'm a highly talented professional with good skills and helped the business grow by almost ~300% in the last one year.",
    batch: '2021',
    course: 'B.E / B.Tech',
    location: 'Bangalore',
    resumeAvailable: true,
    lookingFor: 'Full-time',
    email: 'aravind.k@rvce.edu.in'
  },
  {
    id: 'rb6',
    name: 'Priya Sharma',
    avatar: null,
    skills: ['React', 'TypeScript', 'GraphQL', 'AWS', 'Docker'],
    company: 'Microsoft',
    position: 'Senior Software Engineer',
    domain: 'Software Engineering',
    experience: '4-6 years',
    bio: 'Full-stack engineer specializing in cloud-native applications, microservices architecture, and modern front-end frameworks.',
    batch: '2019',
    course: 'B.E / B.Tech',
    location: 'Hyderabad',
    resumeAvailable: true,
    lookingFor: 'Full-time',
    email: 'priya.s@rvce.edu.in'
  },
  {
    id: 'rb7',
    name: 'Rohan Desai',
    avatar: null,
    skills: ['Product Management', 'Agile', 'Scrum', 'Data Analysis', 'UX Research'],
    company: 'Flipkart',
    position: 'Product Manager',
    domain: 'Product Management',
    experience: '2-4 years',
    bio: 'Product manager with a strong technical background driving cross-functional teams to build impactful, user-centric digital products.',
    batch: '2020',
    course: 'BE',
    location: 'Bangalore',
    resumeAvailable: true,
    lookingFor: 'Full-time',
    email: 'rohan.d@rvce.edu.in'
  },
  {
    id: 'rb8',
    name: 'Ananya Reddy',
    avatar: null,
    skills: ['Deep Learning', 'NLP', 'TensorFlow', 'PyTorch', 'Computer Vision'],
    company: 'Google',
    position: 'ML Engineer',
    domain: 'Artificial Intelligence',
    experience: '2-4 years',
    bio: 'Machine learning engineer with deep expertise in natural language processing and computer vision. Published researcher in top-tier AI conferences.',
    batch: '2021',
    course: 'M.Tech.',
    location: 'Bangalore',
    resumeAvailable: true,
    lookingFor: 'Full-time',
    email: 'ananya.r@rvce.edu.in'
  },
  {
    id: 'rb9',
    name: 'Karthik Venkatesh',
    avatar: null,
    skills: ['Embedded Systems', 'VLSI', 'Verilog', 'SystemC', 'ARM'],
    company: 'Intel',
    position: 'Design Engineer',
    domain: 'Hardware Engineering',
    experience: '4-6 years',
    bio: 'Hardware design engineer specializing in VLSI design, verification, and embedded systems development for next-gen processors.',
    batch: '2018',
    course: 'BE',
    location: 'Bangalore',
    resumeAvailable: true,
    lookingFor: 'Full-time',
    email: 'karthik.v@rvce.edu.in'
  },
  {
    id: 'rb10',
    name: 'Sneha Patil',
    avatar: null,
    skills: ['DevOps', 'Kubernetes', 'CI/CD', 'Terraform', 'Jenkins'],
    company: 'Infosys',
    position: 'DevOps Lead',
    domain: 'DevOps / Infrastructure',
    experience: '4-6 years',
    bio: 'DevOps specialist driving infrastructure automation, CI/CD pipeline optimization, and cloud migration projects for enterprise clients.',
    batch: '2019',
    course: 'BE',
    location: 'Pune',
    resumeAvailable: true,
    lookingFor: 'Full-time',
    email: 'sneha.p@rvce.edu.in'
  },
  {
    id: 'rb11',
    name: 'Vikram Singh',
    avatar: null,
    skills: ['Finance', 'Risk Analysis', 'Excel', 'Bloomberg', 'Python'],
    company: 'Goldman Sachs',
    position: 'Analyst',
    domain: 'Finance / Banking',
    experience: '1-2 years',
    bio: 'Financial analyst with expertise in risk modeling, quantitative analysis, and algorithmic trading strategies.',
    batch: '2023',
    course: 'BE',
    location: 'Mumbai',
    resumeAvailable: true,
    lookingFor: 'Full-time',
    email: 'vikram.s@rvce.edu.in'
  },
  {
    id: 'rb12',
    name: 'Divya Nair',
    avatar: null,
    skills: ['UI/UX Design', 'Figma', 'Adobe XD', 'Sketch', 'Prototyping'],
    company: 'Swiggy',
    position: 'Senior UX Designer',
    domain: 'Design',
    experience: '2-4 years',
    bio: 'Creative UX designer focused on building delightful mobile experiences, conducting user research, and driving design systems at scale.',
    batch: '2021',
    course: 'B.E / B.Tech',
    location: 'Bangalore',
    resumeAvailable: true,
    lookingFor: 'Full-time',
    email: 'divya.n@rvce.edu.in'
  }
];

// ─── Domain Filter Options ──────────────────────────────────────────────
const DOMAIN_FILTERS = [
  'All Domains',
  'Software Engineering',
  'Data Science and Analysis',
  'Artificial Intelligence',
  'Product Management',
  'Sales / Business',
  'Consulting',
  'Hardware Engineering',
  'DevOps / Infrastructure',
  'Finance / Banking',
  'Design'
];

const EXPERIENCE_FILTERS = [
  'All Experience',
  '0-1 years',
  '1-2 years',
  '2-4 years',
  '4-6 years',
  '6-10 years',
  '10+ years'
];

// ─── Value Propositions for Landing ─────────────────────────────────────
const VALUE_PROPS = [
  { icon: 'checkmark-circle', text: 'Highlighting your resume/ profile/ accomplishments in the network' },
  { icon: 'checkmark-circle', text: 'Sharing your profile with the industry professionals of your network' },
  { icon: 'checkmark-circle', text: 'Dedicated mail for you - A custom dedicated email recommending the profile of each candidate is sent to referrers and recruiters' },
  { icon: 'checkmark-circle', text: 'Requesting the referrers and recruiters to push your profile in their current company to schedule interviews' }
];

export default function ResumeBookScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  // On mobile apps, default directly to the talent/resumes directory list
  // so mobile users don't get a heavy desktop landing page dumped on them.
  const initialMode = route?.params?.initialMode || (isDesktop ? 'landing' : 'talent_list');
  const [viewMode, setViewMode] = useState(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All Domains');
  const [selectedExperience, setSelectedExperience] = useState('All Experience');
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);
  const [showExperienceDropdown, setShowExperienceDropdown] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardEmail, setForwardEmail] = useState('');
  const [forwardMessage, setForwardMessage] = useState('');
  const [isListed, setIsListed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showGetListedModal, setShowGetListedModal] = useState(false);
  const [listingSkills, setListingSkills] = useState('');
  const [listingDomain, setListingDomain] = useState('');
  const [listingExperience, setListingExperience] = useState('');
  const [listingBio, setListingBio] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
    AsyncStorage.getItem('userInfo').then(str => {
      if (str) setCurrentUser(JSON.parse(str));
    }).catch(() => {});
  }, []);

  // Listen to route params when navigating with specific initialMode
  useEffect(() => {
    if (route?.params?.initialMode) {
      if (route.params.initialMode === 'get_listed') {
        setViewMode('talent_list');
        setShowGetListedModal(true);
      } else {
        setViewMode(route.params.initialMode);
      }
    }
  }, [route?.params]);

  // Filtered talents
  const filteredTalents = useMemo(() => {
    let result = [...RESUME_BOOK_TALENTS];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.company.toLowerCase().includes(q) ||
        t.position.toLowerCase().includes(q) ||
        t.skills.some(s => s.toLowerCase().includes(q)) ||
        t.domain.toLowerCase().includes(q)
      );
    }
    if (selectedDomain !== 'All Domains') {
      result = result.filter(t => t.domain === selectedDomain);
    }
    if (selectedExperience !== 'All Experience') {
      result = result.filter(t => t.experience === selectedExperience);
    }
    return result;
  }, [searchQuery, selectedDomain, selectedExperience]);

  const handleShowResume = useCallback((talent) => {
    setSelectedTalent(talent);
    setShowResumeModal(true);
  }, []);

  const handleForwardResume = useCallback((talent) => {
    setSelectedTalent(talent);
    setForwardEmail('');
    setForwardMessage('');
    setShowForwardModal(true);
  }, []);

  const handleSendForward = useCallback(() => {
    if (!forwardEmail.trim()) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    Alert.alert(
      'Resume Forwarded!',
      `${selectedTalent?.name}'s resume has been forwarded to ${forwardEmail}`,
      [{ text: 'OK', onPress: () => setShowForwardModal(false) }]
    );
  }, [forwardEmail, selectedTalent]);

  const handleGetListed = useCallback(() => {
    if (!listingSkills.trim() || !listingDomain.trim()) {
      Alert.alert('Missing Info', 'Please fill in at least your skills and domain.');
      return;
    }
    setIsListed(true);
    setShowGetListedModal(false);
    Alert.alert(
      '🎉 You\'re Listed!',
      'Your profile is now visible in the Resume Book. Recruiters and referrers in your alumni network can now discover you.',
      [{ text: 'View Resume Book', onPress: () => setViewMode('talent_list') }]
    );
  }, [listingSkills, listingDomain]);

  // ─── AVATAR COMPONENT ────────────────────────────────────────────────
  const AvatarCircle = ({ name, size = 80 }) => {
    const colors = ['#002B5C', '#1E3A5F', '#0D47A1', '#004D40', '#1B5E20', '#4A148C', '#BF360C', '#E65100'];
    const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
    return (
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: colors[idx],
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2.5, borderColor: isDarkMode ? '#334155' : '#E2E8F0'
      }}>
        <Text style={{ fontSize: size * 0.3, fontWeight: '800', color: '#FFFFFF' }}>
          {getInitials(name, 'AL')}
        </Text>
      </View>
    );
  };

  // ─── SKILL TAG ────────────────────────────────────────────────────────
  const SkillTag = ({ skill }) => (
    <View style={{
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14,
      borderWidth: 1.2, borderColor: isDarkMode ? '#475569' : '#CBD5E1',
      backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
      marginRight: 6, marginBottom: 6
    }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: isDarkMode ? '#CBD5E1' : '#475569' }}>
        {skill}
      </Text>
    </View>
  );

  // ─── TALENT CARD ──────────────────────────────────────────────────────
  const TalentCard = ({ talent, index }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true
      }).start();
    }, []);

    return (
      <Animated.View style={{
        opacity: cardAnim,
        transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
      }}>
        <View style={[styles.talentCard, {
          backgroundColor: isDarkMode ? '#1E293B' : '#F5F7FA',
          borderColor: isDarkMode ? '#334155' : '#E2E8F0',
        }]}>
          {/* Top Section: Desktop Split vs Mobile Native Layout */}
          {isDesktop ? (
            <View style={styles.talentCardTop}>
              {/* Left: Avatar + Name */}
              <View style={styles.talentCardLeft}>
                <AvatarCircle name={talent.name} size={80} />
                <Text style={[styles.talentName, { color: theme.text }]}>{talent.name}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: talent.id })}>
                  <Text style={[styles.moreInfoLink, { color: '#00BFA5' }]}>More Info</Text>
                </TouchableOpacity>
              </View>

              {/* Right: Skills + Details */}
              <View style={styles.talentCardRight}>
                {/* Skills */}
                <View style={styles.skillsRow}>
                  <Ionicons name="globe-outline" size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} style={{ marginRight: 6, marginTop: 2 }} />
                  <View style={styles.skillsWrap}>
                    {talent.skills.map((skill, i) => (
                      <SkillTag key={i} skill={skill} />
                    ))}
                  </View>
                </View>

                {/* Company */}
                {talent.company ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="briefcase-outline" size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                    <Text style={[styles.detailText, { color: theme.text }]}>
                      {talent.company} - <Text style={{ color: '#00BFA5' }}>{talent.position}</Text>
                    </Text>
                  </View>
                ) : null}

                {/* Domain + Experience */}
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="domain" size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                  <Text style={[styles.detailText, { color: theme.text }]}>
                    {talent.domain} <Text style={{ color: '#00BFA5' }}>{talent.experience}</Text>
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            /* Mobile Native Profile Card */
            <View style={styles.mobileTalentCardTop}>
              <View style={styles.mobileTalentHeaderRow}>
                <AvatarCircle name={talent.name} size={50} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.mobileTalentName, { color: theme.text }]} numberOfLines={1}>
                    {talent.name}
                  </Text>
                  {talent.company ? (
                    <Text style={[styles.mobileTalentRole, { color: theme.textSecondary }]} numberOfLines={1}>
                      {talent.position} • <Text style={{ color: '#00BFA5', fontWeight: '700' }}>{talent.company}</Text>
                    </Text>
                  ) : (
                    <Text style={[styles.mobileTalentRole, { color: '#00BFA5', fontWeight: '700' }]} numberOfLines={1}>
                      {talent.position || talent.domain}
                    </Text>
                  )}
                  <View style={styles.mobileMetaRow}>
                    <View style={[styles.mobileDomainBadge, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                      <Text style={[styles.mobileDomainBadgeText, { color: isDarkMode ? '#94A3B8' : '#475569' }]} numberOfLines={1}>
                        {talent.domain}
                      </Text>
                    </View>
                    <View style={[styles.mobileExpBadge, { backgroundColor: isDarkMode ? '#0F766E22' : '#E0F7FA' }]}>
                      <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#00BFA5' }}>
                        {talent.experience}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Profile', { userId: talent.id })}
                  style={styles.mobileMoreInfoBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#00BFA5', marginRight: 2 }}>Profile</Text>
                  <Ionicons name="chevron-forward" size={14} color="#00BFA5" />
                </TouchableOpacity>
              </View>

              {/* Skills Container */}
              <View style={styles.mobileSkillsContainer}>
                {talent.skills.map((skill, i) => (
                  <SkillTag key={i} skill={skill} />
                ))}
              </View>
            </View>
          )}

          {/* Bio */}
          {talent.bio ? (
            <Text style={[styles.talentBio, { color: isDarkMode ? '#94A3B8' : '#64748B' }]} numberOfLines={3}>
              {talent.bio}
            </Text>
          ) : null}

          {/* Divider */}
          <View style={[styles.cardDivider, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]} />

          {/* Actions */}
          <View style={isDesktop ? styles.cardActions : styles.mobileCardActions}>
            <TouchableOpacity 
              style={isDesktop ? styles.actionBtn : styles.mobileActionBtnPrimary} 
              onPress={() => handleShowResume(talent)}
            >
              <Ionicons name="open-outline" size={16} color={isDesktop ? '#00BFA5' : '#FFFFFF'} />
              <Text style={isDesktop ? styles.actionText : styles.mobileActionTextPrimary}>Show Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={isDesktop ? styles.actionBtn : styles.mobileActionBtnSecondary} 
              onPress={() => handleForwardResume(talent)}
            >
              <Ionicons name="arrow-redo" size={16} color="#00BFA5" />
              <Text style={styles.actionText}>Forward</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  // ─── LANDING PAGE VIEW ────────────────────────────────────────────────
  const renderLandingPage = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Recruiter Banner */}
      <View style={[styles.recruiterBanner, {
        backgroundColor: isDarkMode ? '#0F766E' : '#E0F7FA',
        borderColor: isDarkMode ? '#14B8A6' : '#80CBC4'
      }]}>
        <View style={styles.recruiterBannerLeft}>
          <View style={[styles.recruiterIcon, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
            <Ionicons name="briefcase" size={24} color="#00BFA5" />
          </View>
          <Text style={[styles.recruiterText, { color: isDarkMode ? '#E2E8F0' : '#004D40' }]}>
            Are you a recruiter / referrer?
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.viewResumeBookBtn, { backgroundColor: '#00BFA5' }]}
          onPress={() => setViewMode('talent_list')}
        >
          <Text style={styles.viewResumeBookText}>View Resume Book</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={[styles.heroSection, { paddingHorizontal: isDesktop ? 60 : 20 }]}>
        <View style={styles.heroContent}>
          <Text style={[styles.heroTitle, { color: theme.text, fontSize: isDesktop ? 38 : 28 }]}>
            Looking for a job change?
          </Text>
          <Text style={[styles.heroSubtitle, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
            Make your profile visible in your alumni network
          </Text>

          {/* Value Propositions */}
          <View style={styles.valueProps}>
            {VALUE_PROPS.map((prop, i) => (
              <View key={i} style={styles.valuePropRow}>
                <Ionicons name={prop.icon} size={20} color="#00BFA5" style={{ marginTop: 2 }} />
                <Text style={[styles.valuePropText, { color: isDarkMode ? '#CBD5E1' : '#475569' }]}>
                  {prop.text}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={[styles.getStartedBtn, { backgroundColor: '#00BFA5' }]}
            onPress={() => setShowGetListedModal(true)}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card Preview */}
        {isDesktop && (
          <View style={styles.heroCardPreview}>
            <View style={[styles.previewCard, {
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderColor: isDarkMode ? '#334155' : '#E2E8F0',
              shadowColor: isDarkMode ? '#000' : '#94A3B8'
            }]}>
              <AvatarCircle name="Aravind Krishna" size={56} />
              <Text style={[styles.previewName, { color: theme.text }]}>Aravind Krishna</Text>
              <TouchableOpacity>
                <Text style={{ color: '#00BFA5', fontSize: 12, fontWeight: '600' }}>Other Info</Text>
              </TouchableOpacity>
              <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {['Java', 'MongoDB', 'MySQL', 'Javascript', 'Python'].map((s, i) => (
                  <SkillTag key={i} skill={s} />
                ))}
              </View>
              <View style={[styles.detailRow, { marginTop: 8 }]}>
                <Ionicons name="briefcase-outline" size={14} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                <Text style={[styles.detailText, { color: theme.text, fontSize: 12 }]}>
                  Amazon - <Text style={{ color: '#00BFA5' }}>Software Engineer</Text>
                </Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="domain" size={14} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                <Text style={[styles.detailText, { color: theme.text, fontSize: 12 }]}>
                  Software Engineering, <Text style={{ color: '#00BFA5' }}>2-4 Yrs</Text>
                </Text>
              </View>
              <Text style={[{ fontSize: 11, color: isDarkMode ? '#94A3B8' : '#64748B', marginTop: 8, fontStyle: 'italic' }]} numberOfLines={2}>
                {"I'm a highly talented professional with good skills..."}
              </Text>
              <TouchableOpacity style={{ marginTop: 10 }}>
                <Text style={{ color: '#00BFA5', fontSize: 12, fontWeight: '700' }}>Show resume ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Stats Banner */}
      <View style={[styles.statsBanner, {
        backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
        borderColor: isDarkMode ? '#334155' : '#E2E8F0'
      }]}>
        <View style={styles.statsGrid}>
          {[
            { number: '12', label: 'Active Resumes', icon: 'document-text' },
            { number: '150+', label: 'Recruiters Active', icon: 'people' },
            { number: '45', label: 'Referrals Made', icon: 'arrow-redo' },
            { number: '89%', label: 'Response Rate', icon: 'checkmark-done' }
          ].map((stat, i) => (
            <View key={i} style={styles.statItem}>
              <View style={[styles.statIconCircle, { backgroundColor: isDarkMode ? '#0F766E22' : '#E0F7FA' }]}>
                <Ionicons name={stat.icon} size={20} color="#00BFA5" />
              </View>
              <Text style={[styles.statNumber, { color: theme.text }]}>{stat.number}</Text>
              <Text style={[styles.statLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* How It Works */}
      <View style={[styles.howItWorks, { paddingHorizontal: isDesktop ? 60 : 20 }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>How It Works</Text>
        <View style={styles.stepsGrid}>
          {[
            { step: '1', title: 'Create Your Listing', desc: 'Add your skills, experience, and upload your resume to get discovered.', icon: 'person-add' },
            { step: '2', title: 'Get Discovered', desc: 'Recruiters and referrers from your alumni network browse the resume book.', icon: 'search' },
            { step: '3', title: 'Receive Referrals', desc: 'Get email introductions and referral opportunities from your network.', icon: 'mail' },
            { step: '4', title: 'Land Interviews', desc: 'Alumni referrals fast-track your application to the interview stage.', icon: 'rocket' }
          ].map((item, i) => (
            <View key={i} style={[styles.stepCard, {
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderColor: isDarkMode ? '#334155' : '#E2E8F0'
            }]}>
              <View style={[styles.stepNumber, { backgroundColor: '#00BFA5' }]}>
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800' }}>{item.step}</Text>
              </View>
              <Ionicons name={item.icon} size={28} color="#00BFA5" style={{ marginTop: 12 }} />
              <Text style={[styles.stepTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.stepDesc, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // ─── TALENT LIST VIEW ─────────────────────────────────────────────────
  const renderTalentList = () => (
    <View style={{ flex: 1 }}>
      {/* Job Seeker Banner */}
      <View style={[
        styles.jobSeekerBanner, 
        {
          backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
          borderColor: isDarkMode ? '#334155' : '#E2E8F0',
          marginHorizontal: isDesktop ? 60 : 16,
        },
        !isDesktop && styles.mobileJobSeekerBanner
      ]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bannerQuestion, { color: theme.text }]}>Are you a job seeker?</Text>
          {!isDesktop && (
            <Text style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 2 }}>
              Get discovered by alumni recruiters
            </Text>
          )}
        </View>
        <View style={styles.bannerBtns}>
          <TouchableOpacity
            style={[styles.bannerBtn, { backgroundColor: '#00BFA5' }]}
            onPress={() => {
              if (isListed) {
                Alert.alert('Already Listed', 'Your profile is already in the Resume Book!');
              } else {
                setShowGetListedModal(true);
              }
            }}
          >
            <Text style={styles.bannerBtnText}>{isListed ? 'Listed ✓' : 'Get Listed'}</Text>
          </TouchableOpacity>
          {isDesktop && (
            <TouchableOpacity
              style={[styles.bannerBtnOutline, { borderColor: isDarkMode ? '#475569' : '#CBD5E1' }]}
              onPress={() => setViewMode('landing')}
            >
              <Text style={[styles.bannerBtnOutlineText, { color: theme.text }]}>Learn More</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Section Title */}
      <Text style={[styles.listTitle, { color: theme.text, paddingHorizontal: isDesktop ? 60 : 16 }]}>
        Resume book of your network
      </Text>

      {/* Search + Filters */}
      <View style={[
        styles.searchFilterRow, 
        { paddingHorizontal: isDesktop ? 60 : 16 },
        !isDesktop && styles.mobileSearchFilterContainer
      ]}>
        <View style={[styles.searchBar, {
          backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
          borderColor: isDarkMode ? '#334155' : '#E2E8F0',
          minWidth: isDesktop ? 200 : '100%',
        }]}>
          <Ionicons name="search" size={18} color={isDarkMode ? '#94A3B8' : '#94A3B8'} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by name, skill, company..."
            placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={isDarkMode ? '#94A3B8' : '#94A3B8'} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Dropdowns Row on Mobile */}
        <View style={!isDesktop ? styles.mobileDropdownsRow : { flexDirection: 'row', gap: 10 }}>
          {/* Domain Filter */}
          <View style={{ position: 'relative', zIndex: 10, flex: isDesktop ? undefined : 1 }}>
            <TouchableOpacity
              style={[styles.filterDropdown, {
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderColor: selectedDomain !== 'All Domains' ? '#00BFA5' : (isDarkMode ? '#334155' : '#E2E8F0'),
                minWidth: isDesktop ? 140 : '100%',
                width: isDesktop ? 'auto' : '100%',
              }]}
              onPress={() => { setShowDomainDropdown(!showDomainDropdown); setShowExperienceDropdown(false); }}
            >
              <Text style={[styles.filterText, {
                color: selectedDomain !== 'All Domains' ? '#00BFA5' : (isDarkMode ? '#CBD5E1' : '#475569')
              }]} numberOfLines={1}>
                {selectedDomain}
              </Text>
              <Ionicons name={showDomainDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
            {showDomainDropdown && (
              <View style={[styles.dropdownList, {
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderColor: isDarkMode ? '#334155' : '#E2E8F0'
              }]}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {DOMAIN_FILTERS.map((d, i) => (
                    <TouchableOpacity key={i} style={[styles.dropdownItem, {
                      backgroundColor: selectedDomain === d ? (isDarkMode ? '#0F766E22' : '#E0F7FA') : 'transparent'
                    }]} onPress={() => { setSelectedDomain(d); setShowDomainDropdown(false); }}>
                      <Text style={[styles.dropdownItemText, {
                        color: selectedDomain === d ? '#00BFA5' : (isDarkMode ? '#CBD5E1' : '#475569'),
                        fontWeight: selectedDomain === d ? '700' : '500'
                      }]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Experience Filter */}
          <View style={{ position: 'relative', zIndex: 9, flex: isDesktop ? undefined : 1 }}>
            <TouchableOpacity
              style={[styles.filterDropdown, {
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderColor: selectedExperience !== 'All Experience' ? '#00BFA5' : (isDarkMode ? '#334155' : '#E2E8F0'),
                minWidth: isDesktop ? 140 : '100%',
                width: isDesktop ? 'auto' : '100%',
              }]}
              onPress={() => { setShowExperienceDropdown(!showExperienceDropdown); setShowDomainDropdown(false); }}
            >
              <Text style={[styles.filterText, {
                color: selectedExperience !== 'All Experience' ? '#00BFA5' : (isDarkMode ? '#CBD5E1' : '#475569')
              }]} numberOfLines={1}>
                {selectedExperience}
              </Text>
              <Ionicons name={showExperienceDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
            {showExperienceDropdown && (
              <View style={[styles.dropdownList, {
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderColor: isDarkMode ? '#334155' : '#E2E8F0'
              }]}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {EXPERIENCE_FILTERS.map((e, i) => (
                    <TouchableOpacity key={i} style={[styles.dropdownItem, {
                      backgroundColor: selectedExperience === e ? (isDarkMode ? '#0F766E22' : '#E0F7FA') : 'transparent'
                    }]} onPress={() => { setSelectedExperience(e); setShowExperienceDropdown(false); }}>
                      <Text style={[styles.dropdownItemText, {
                        color: selectedExperience === e ? '#00BFA5' : (isDarkMode ? '#CBD5E1' : '#475569'),
                        fontWeight: selectedExperience === e ? '700' : '500'
                      }]}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Results Count */}
      <Text style={[styles.resultsCount, { color: isDarkMode ? '#94A3B8' : '#64748B', paddingHorizontal: isDesktop ? 60 : 16 }]}>
        {filteredTalents.length} talent{filteredTalents.length !== 1 ? 's' : ''} found
      </Text>

      {/* Talent List */}
      <FlatList
        data={filteredTalents}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => <TalentCard talent={item} index={index} />}
        contentContainerStyle={{
          paddingHorizontal: isDesktop ? 60 : 16,
          paddingBottom: 40
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={isDarkMode ? '#475569' : '#CBD5E1'} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No talents found</Text>
            <Text style={[styles.emptySubtitle, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />
    </View>
  );

  // ─── RESUME PREVIEW MODAL ────────────────────────────────────────────
  const renderResumeModal = () => (
    <Modal
      visible={showResumeModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowResumeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.resumeModalContent, {
          backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
          maxWidth: isDesktop ? 700 : '95%'
        }]}>
          {/* Header */}
          <View style={[styles.resumeModalHeader, { borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
            <Text style={[styles.resumeModalTitle, { color: theme.text }]}>
              {`${selectedTalent?.name || ''}'s Resume`}
            </Text>
            <TouchableOpacity onPress={() => setShowResumeModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24 }}>
            {/* Profile Header */}
            <View style={styles.resumeProfileHeader}>
              <AvatarCircle name={selectedTalent?.name || ''} size={72} />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={[styles.resumeProfileName, { color: theme.text }]}>{selectedTalent?.name}</Text>
                <Text style={[styles.resumeProfilePosition, { color: '#00BFA5' }]}>
                  {selectedTalent?.position} {selectedTalent?.company ? `at ${selectedTalent.company}` : ''}
                </Text>
                <Text style={[{ fontSize: 13, color: isDarkMode ? '#94A3B8' : '#64748B', marginTop: 2 }]}>
                  {selectedTalent?.location} • {selectedTalent?.batch} • {selectedTalent?.course}
                </Text>
              </View>
            </View>

            {/* Skills */}
            <View style={styles.resumeSection}>
              <Text style={[styles.resumeSectionTitle, { color: theme.text }]}>Skills</Text>
              <View style={styles.skillsWrap}>
                {selectedTalent?.skills.map((s, i) => <SkillTag key={i} skill={s} />)}
              </View>
            </View>

            {/* Professional Summary */}
            <View style={styles.resumeSection}>
              <Text style={[styles.resumeSectionTitle, { color: theme.text }]}>Professional Summary</Text>
              <Text style={[styles.resumeSectionBody, { color: isDarkMode ? '#CBD5E1' : '#475569' }]}>
                {selectedTalent?.bio}
              </Text>
            </View>

            {/* Experience */}
            <View style={styles.resumeSection}>
              <Text style={[styles.resumeSectionTitle, { color: theme.text }]}>Experience</Text>
              <View style={[styles.experienceItem, { borderLeftColor: '#00BFA5' }]}>
                <Text style={[styles.experienceTitle, { color: theme.text }]}>{selectedTalent?.position}</Text>
                <Text style={[styles.experienceCompany, { color: '#00BFA5' }]}>{selectedTalent?.company || 'Independent'}</Text>
                <Text style={[{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                  {selectedTalent?.experience} • {selectedTalent?.domain}
                </Text>
              </View>
            </View>

            {/* Education */}
            <View style={styles.resumeSection}>
              <Text style={[styles.resumeSectionTitle, { color: theme.text }]}>Education</Text>
              <View style={[styles.experienceItem, { borderLeftColor: '#002B5C' }]}>
                <Text style={[styles.experienceTitle, { color: theme.text }]}>RV College of Engineering</Text>
                <Text style={[styles.experienceCompany, { color: '#00BFA5' }]}>{selectedTalent?.course}</Text>
                <Text style={[{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                  Class of {selectedTalent?.batch} • Bangalore
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.resumeActions}>
              <TouchableOpacity
                style={[styles.resumeActionBtn, { backgroundColor: '#00BFA5' }]}
                onPress={() => {
                  setShowResumeModal(false);
                  handleForwardResume(selectedTalent);
                }}
              >
                <Ionicons name="arrow-redo" size={18} color="#FFF" />
                <Text style={styles.resumeActionText}>Forward Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resumeActionBtnOutline, { borderColor: '#00BFA5' }]}
                onPress={() => {
                  Alert.alert('Download', 'Resume download initiated for ' + selectedTalent?.name);
                }}
              >
                <Ionicons name="download-outline" size={18} color="#00BFA5" />
                <Text style={[styles.resumeActionText, { color: '#00BFA5' }]}>Download PDF</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ─── FORWARD RESUME MODAL ────────────────────────────────────────────
  const renderForwardModal = () => (
    <Modal
      visible={showForwardModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowForwardModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.forwardModalContent, {
          backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
          maxWidth: isDesktop ? 500 : '90%'
        }]}>
          <View style={[styles.forwardModalHeader, { borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
            <Text style={[styles.forwardModalTitle, { color: theme.text }]}>Forward Resume</Text>
            <TouchableOpacity onPress={() => setShowForwardModal(false)}>
              <Ionicons name="close" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={{ padding: 20 }}>
            <Text style={[styles.forwardLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
              {`Forwarding ${selectedTalent?.name || ''}'s resume`}
            </Text>
            <TextInput
              style={[styles.forwardInput, {
                backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                color: theme.text
              }]}
              placeholder="Recipient's email address"
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
              value={forwardEmail}
              onChangeText={setForwardEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.forwardInput, styles.forwardTextarea, {
                backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                color: theme.text
              }]}
              placeholder="Add a personal message (optional)"
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
              value={forwardMessage}
              onChangeText={setForwardMessage}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={[styles.sendForwardBtn, { backgroundColor: '#00BFA5' }]}
              onPress={handleSendForward}
            >
              <Ionicons name="send" size={18} color="#FFF" />
              <Text style={styles.sendForwardText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ─── GET LISTED MODAL ─────────────────────────────────────────────────
  const renderGetListedModal = () => (
    <Modal
      visible={showGetListedModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowGetListedModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.getListedModalContent, {
          backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
          maxWidth: isDesktop ? 550 : '95%'
        }]}>
          <View style={[styles.getListedHeader, { borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
            <View>
              <Text style={[styles.getListedTitle, { color: theme.text }]}>Get Listed in Resume Book</Text>
              <Text style={[{ fontSize: 13, color: isDarkMode ? '#94A3B8' : '#64748B', marginTop: 2 }]}>
                Make your profile visible to recruiters
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowGetListedModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={[styles.formLabel, { color: theme.text }]}>Skills *</Text>
            <TextInput
              style={[styles.formInput, {
                backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                color: theme.text
              }]}
              placeholder="e.g., React, Python, Data Analysis (comma-separated)"
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
              value={listingSkills}
              onChangeText={setListingSkills}
            />

            <Text style={[styles.formLabel, { color: theme.text }]}>Domain *</Text>
            <TextInput
              style={[styles.formInput, {
                backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                color: theme.text
              }]}
              placeholder="e.g., Software Engineering, Data Science"
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
              value={listingDomain}
              onChangeText={setListingDomain}
            />

            <Text style={[styles.formLabel, { color: theme.text }]}>Experience</Text>
            <TextInput
              style={[styles.formInput, {
                backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                color: theme.text
              }]}
              placeholder="e.g., 2-4 years"
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
              value={listingExperience}
              onChangeText={setListingExperience}
            />

            <Text style={[styles.formLabel, { color: theme.text }]}>Professional Summary</Text>
            <TextInput
              style={[styles.formInput, styles.formTextarea, {
                backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                color: theme.text
              }]}
              placeholder="Tell recruiters about yourself..."
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
              value={listingBio}
              onChangeText={setListingBio}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.submitListingBtn, { backgroundColor: '#00BFA5' }]}
              onPress={handleGetListed}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.submitListingText}>Submit & Get Listed</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ─── MAIN RENDER ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0F172A' : '#EFF6FF' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#0F172A' : '#FFFFFF'} />

      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
        borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0',
        paddingHorizontal: isDesktop ? 60 : 16
      }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Resume Book</Text>
            <Text style={[styles.headerSubtitle, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
              RVCE Alumni Network
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {/* View Toggle */}
          <View style={[styles.viewToggle, {
            backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9',
            borderColor: isDarkMode ? '#334155' : '#E2E8F0'
          }]}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'landing' && styles.toggleBtnActive]}
              onPress={() => setViewMode('landing')}
            >
              <Ionicons name="home-outline" size={16} color={viewMode === 'landing' ? '#FFF' : (isDarkMode ? '#94A3B8' : '#64748B')} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'talent_list' && styles.toggleBtnActive]}
              onPress={() => setViewMode('talent_list')}
            >
              <Ionicons name="list" size={16} color={viewMode === 'talent_list' ? '#FFF' : (isDarkMode ? '#94A3B8' : '#64748B')} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {viewMode === 'landing' ? renderLandingPage() : renderTalentList()}
      </Animated.View>

      {/* Modals */}
      {renderResumeModal()}
      {renderForwardModal()}
      {renderGetListedModal()}
    </SafeAreaView>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1.5
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  viewToggle: {
    flexDirection: 'row', borderRadius: 10, borderWidth: 1, overflow: 'hidden'
  },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 7 },
  toggleBtnActive: { backgroundColor: '#00BFA5', borderRadius: 8 },

  // Recruiter Banner
  recruiterBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 14,
    borderWidth: 1.5
  },
  recruiterBannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  recruiterIcon: {
    width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#00BFA5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2
  },
  recruiterText: { fontSize: 15, fontWeight: '700', flex: 1 },
  viewResumeBookBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  viewResumeBookText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // Hero Section
  heroSection: { marginTop: 32, flexDirection: 'row', alignItems: 'flex-start' },
  heroContent: { flex: 1 },
  heroTitle: { fontWeight: '900', letterSpacing: -0.5, lineHeight: 44 },
  heroSubtitle: { fontSize: 16, marginTop: 8, lineHeight: 24 },
  valueProps: { marginTop: 24, gap: 14 },
  valuePropRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  valuePropText: { fontSize: 14, lineHeight: 22, flex: 1 },
  getStartedBtn: {
    marginTop: 28, paddingHorizontal: 36, paddingVertical: 14, borderRadius: 10,
    alignSelf: 'flex-start',
    shadowColor: '#00BFA5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  getStartedText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  heroCardPreview: { width: 280, marginLeft: 40 },
  previewCard: {
    borderRadius: 16, padding: 20, borderWidth: 1.5,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6
  },
  previewName: { fontSize: 16, fontWeight: '800', marginTop: 10 },

  // Stats
  statsBanner: {
    marginTop: 32, marginHorizontal: 16, borderRadius: 16, borderWidth: 1.5, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 },
  statItem: { alignItems: 'center', minWidth: 70 },
  statIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statNumber: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2, textAlign: 'center' },

  // How It Works
  howItWorks: { marginTop: 32, marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3, marginBottom: 16 },
  stepsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  stepCard: {
    flex: 1, minWidth: 150, borderRadius: 14, borderWidth: 1.5, padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1
  },
  stepNumber: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  stepTitle: { fontSize: 15, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  stepDesc: { fontSize: 12, marginTop: 6, textAlign: 'center', lineHeight: 18 },

  // Job Seeker Banner
  jobSeekerBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 14, borderWidth: 1.5
  },
  bannerQuestion: { fontSize: 15, fontWeight: '700' },
  bannerBtns: { flexDirection: 'row', gap: 10 },
  bannerBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8 },
  bannerBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  bannerBtnOutline: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5 },
  bannerBtnOutlineText: { fontSize: 13, fontWeight: '700' },

  // List Title
  listTitle: { fontSize: 18, fontWeight: '800', marginTop: 16, marginBottom: 10, letterSpacing: -0.2 },

  // Search & Filters
  searchFilterRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 8 },
  searchBar: {
    flex: 1, minWidth: 200, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, gap: 8
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  filterDropdown: {
    minWidth: 140, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, gap: 6
  },
  filterText: { fontSize: 13, fontWeight: '600' },
  dropdownList: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
    borderRadius: 10, borderWidth: 1.5, marginTop: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 6
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6, marginHorizontal: 4, marginVertical: 2 },
  dropdownItemText: { fontSize: 13 },

  // Results Count
  resultsCount: { fontSize: 12, fontWeight: '600', marginBottom: 10 },

  // Talent Card
  talentCard: {
    borderRadius: 14, borderWidth: 1.5, padding: 20, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1
  },
  talentCardTop: { flexDirection: 'row', gap: 20 },
  talentCardLeft: { alignItems: 'center', width: 100 },
  talentName: { fontSize: 15, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  moreInfoLink: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  talentCardRight: { flex: 1, gap: 8 },
  skillsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', flex: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, fontWeight: '500', flex: 1 },
  talentBio: { fontSize: 13, fontStyle: 'italic', marginTop: 12, lineHeight: 20 },
  cardDivider: { height: 1, marginVertical: 14 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 13, fontWeight: '700', color: '#00BFA5' },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 12 },
  emptySubtitle: { fontSize: 14, marginTop: 6 },

  // Modal Overlay
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 20
  },

  // Resume Modal
  resumeModalContent: {
    width: '100%', maxHeight: '90%', borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10
  },
  resumeModalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1
  },
  resumeModalTitle: { fontSize: 18, fontWeight: '800' },
  resumeProfileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  resumeProfileName: { fontSize: 20, fontWeight: '900' },
  resumeProfilePosition: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  resumeSection: { marginBottom: 20 },
  resumeSectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10, borderBottomWidth: 2, borderBottomColor: '#00BFA5', paddingBottom: 6, alignSelf: 'flex-start' },
  resumeSectionBody: { fontSize: 14, lineHeight: 22 },
  experienceItem: { borderLeftWidth: 3, paddingLeft: 14, paddingVertical: 6, marginBottom: 8 },
  experienceTitle: { fontSize: 14, fontWeight: '700' },
  experienceCompany: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  resumeActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  resumeActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 10
  },
  resumeActionBtnOutline: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5
  },
  resumeActionText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Forward Modal
  forwardModalContent: {
    width: '100%', borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8
  },
  forwardModalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1
  },
  forwardModalTitle: { fontSize: 16, fontWeight: '800' },
  forwardLabel: { fontSize: 13, marginBottom: 14 },
  forwardInput: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 12 },
  forwardTextarea: { minHeight: 80, textAlignVertical: 'top' },
  sendForwardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 10, marginTop: 4
  },
  sendForwardText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Get Listed Modal
  getListedModalContent: {
    width: '100%', maxHeight: '90%', borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10
  },
  getListedHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1
  },
  getListedTitle: { fontSize: 18, fontWeight: '800' },
  formLabel: { fontSize: 14, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  formInput: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  formTextarea: { minHeight: 100, textAlignVertical: 'top' },
  submitListingBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 10, marginTop: 24
  },
  submitListingText: { fontSize: 15, fontWeight: '800', color: '#FFF' },

  // Mobile-specific styles for Talent List & Card
  mobileJobSeekerBanner: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  mobileSearchFilterContainer: {
    gap: 8,
  },
  mobileDropdownsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  mobileTalentCardTop: {
    width: '100%',
  },
  mobileTalentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  mobileTalentName: {
    fontSize: 15,
    fontWeight: '800',
  },
  mobileTalentRole: {
    fontSize: 12,
    marginTop: 2,
  },
  mobileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  mobileDomainBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 160,
  },
  mobileDomainBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  mobileExpBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mobileMoreInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  mobileSkillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  mobileCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  mobileActionBtnPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00BFA5',
    paddingVertical: 9,
    borderRadius: 10,
  },
  mobileActionTextPrimary: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mobileActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#00BFA5',
  },
});
