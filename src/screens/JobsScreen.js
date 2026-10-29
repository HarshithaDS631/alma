import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  useWindowDimensions,
  ActivityIndicator,
  Switch,
  Image
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useUserRole from '../hooks/useUserRole';
import { FloatingElement, PulseElement } from '../components/MotionGraphic';
import AppHeader from '../components/AppHeader';
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
const KEYWORD_FILTERS = [
  'All',
  '⚡ Easy Apply',
  'Python',
  'React',
  'AWS',
  'Machine Learning',
  'DevOps',
  'SQL',
  'Docker',
  'Remote',
  'Full-time'
];

export const DEFAULT_ALUMNI_JOBS = [
  {
    _id: 'job_google_01',
    title: 'Senior Software Engineer - Cloud Infrastructure',
    company: 'Google',
    companyInitial: 'G',
    companyColor: '#4285F4',
    location: 'Bangalore, India',
    workplaceType: 'Hybrid',
    jobType: 'Full-time',
    salaryRange: '₹38L – ₹55L • Equity + Bonus',
    experienceLevel: '3-6 years',
    applicantCount: 38,
    alumniCount: 14,
    alumniRecruiter: {
      name: 'Aditya Rao',
      role: 'Staff Engineering Lead (RVCE CSE 2016)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isAlumni: true,
      batch: 'Class of 2016',
      department: 'Computer Science'
    },
    keywords: ['Python', 'Go', 'Kubernetes', 'GCP', 'Distributed Systems', 'System Design'],
    aboutCompany: 'Google is a global technology leader focusing on search, cloud, AI, and consumer hardware with major development centers across Bangalore and Hyderabad.',
    description: `Google is seeking a Senior Software Engineer to design, develop, and scale high-performance cloud infrastructure services. You will architect distributed systems that handle billions of requests with ultra-low latency.

Key Responsibilities:
• Architect resilient microservices using Go and Python on Google Cloud Platform.
• Lead reliability, observability, and container orchestration using Kubernetes and Istio.
• Mentor junior engineers and collaborate with global engineering teams across Mountain View and Zurich.

Qualifications & Skills:
• 3+ years experience with large-scale distributed backend systems.
• Deep proficiency with Python, Go, or C++.
• Solid foundation in data structures, algorithms, and microservice architecture.`,
    screeningQuestions: [
      { id: 'q1', question: 'How many years of work experience do you have with Distributed Systems and Go/Python?', options: ['1-2 years', '3-5 years', '5+ years'] },
      { id: 'q2', question: 'Have you worked with Kubernetes in production environments?', options: ['Yes, extensively', 'Yes, basic knowledge', 'No, willing to learn'] },
      { id: 'q3', question: 'Notice period / joining availability', options: ['Immediate', '15 Days', '30 Days', '60+ Days'] }
    ]
  },
  {
    _id: 'job_msft_02',
    title: 'Full Stack Engineer - Azure Developer Platform',
    company: 'Microsoft',
    companyInitial: 'M',
    companyColor: '#00A4EF',
    location: 'Hyderabad / Bangalore',
    workplaceType: 'Remote',
    jobType: 'Full-time',
    salaryRange: '₹32L – ₹46L + Stock Units',
    experienceLevel: '2-5 years',
    applicantCount: 42,
    alumniCount: 22,
    alumniRecruiter: {
      name: 'Sneha Kulkarni',
      role: 'Principal PM Manager (RVCE ISE 2015)',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      isAlumni: true,
      batch: 'Class of 2015',
      department: 'Information Science'
    },
    keywords: ['React', 'TypeScript', 'Node.js', 'Azure', 'GraphQL', 'Docker'],
    aboutCompany: 'Microsoft enables digital transformation for the era of an intelligent cloud and an intelligent edge. Our mission is to empower every person and organization to achieve more.',
    description: `Join the Azure Developer Experience team to build the next generation of cloud developer tools, IDE extensions, and cloud dashboards used by millions of engineers worldwide.

Key Responsibilities:
• Build lightning-fast web applications with React, TypeScript, and modern GraphQL backends.
• Partner with product designers and UX researchers to create delightful developer tooling.
• Ensure enterprise-grade accessibility, security, and automated CI/CD deployment pipelines.

Qualifications & Skills:
• Strong frontend foundations in React, TypeScript, and modern state management.
• Node.js or C# backend service experience.
• Familiarity with Azure, AWS, or Docker containers.`,
    screeningQuestions: [
      { id: 'q1', question: 'How many years of experience do you have with React & TypeScript?', options: ['1-2 years', '3-5 years', '5+ years'] },
      { id: 'q2', question: 'Are you comfortable working in a distributed remote team across time zones?', options: ['Yes', 'No'] },
      { id: 'q3', question: 'Notice period / joining availability', options: ['Immediate', '15 Days', '30 Days', '60+ Days'] }
    ]
  },
  {
    _id: 'job_amazon_03',
    title: 'Applied AI & Machine Learning Scientist',
    company: 'Amazon Web Services (AWS)',
    companyInitial: 'A',
    companyColor: '#FF9900',
    location: 'Bangalore, India',
    workplaceType: 'Hybrid',
    jobType: 'Full-time',
    salaryRange: '₹42L – ₹60L + Sign-on Bonus',
    experienceLevel: '2-6 years',
    applicantCount: 29,
    alumniCount: 19,
    alumniRecruiter: {
      name: 'Rohan Sharma',
      role: 'Senior Machine Learning Manager (RVCE ECE 2014)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      isAlumni: true,
      batch: 'Class of 2014',
      department: 'Electronics & Communication'
    },
    keywords: ['Machine Learning', 'Python', 'PyTorch', 'AWS', 'LLMs', 'NLP', 'Docker'],
    aboutCompany: 'AWS is the world’s most comprehensive and broadly adopted cloud platform, offering over 200 fully featured services from data centers globally.',
    description: `AWS is looking for an Applied Machine Learning Scientist to build cutting-edge generative AI models, recommendation systems, and autonomous pipeline tooling for AWS Bedrock and SageMaker customers.

Key Responsibilities:
• Train and fine-tune large foundation models and NLP pipelines using PyTorch and Hugging Face.
• Optimize model inference latency and memory footprints for deployment on AWS Inferentia.
• Publish research papers and file patents on novel multi-modal architectures.

Qualifications & Skills:
• Experience deploying deep learning models in production.
• Strong coding skills in Python, PyTorch/TensorFlow, and vector databases.
• Strong mathematical foundation in linear algebra, probability, and optimization.`,
    screeningQuestions: [
      { id: 'q1', question: 'What is your primary machine learning framework?', options: ['PyTorch', 'TensorFlow', 'JAX', 'Scikit-learn'] },
      { id: 'q2', question: 'Have you fine-tuned or deployed Large Language Models (LLMs)?', options: ['Yes, in production', 'Yes, in personal projects', 'No, theoretical knowledge'] },
      { id: 'q3', question: 'Notice period / joining availability', options: ['Immediate', '15 Days', '30 Days', '60+ Days'] }
    ]
  },
  {
    _id: 'job_cisco_04',
    title: 'DevOps & Site Reliability Engineer (SRE)',
    company: 'Cisco Systems',
    companyInitial: 'C',
    companyColor: '#1BA0D7',
    location: 'Bangalore, India',
    workplaceType: 'On-site',
    jobType: 'Full-time',
    salaryRange: '₹26L – ₹38L + Perks',
    experienceLevel: '2-4 years',
    applicantCount: 18,
    alumniCount: 31,
    alumniRecruiter: {
      name: 'Pooja Hegde',
      role: 'Staff SRE Director (RVCE CSE 2013)',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      isAlumni: true,
      batch: 'Class of 2013',
      department: 'Computer Science'
    },
    keywords: ['DevOps', 'AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Python'],
    aboutCompany: 'Cisco is the worldwide leader in technology that powers the Internet, delivering digital transformation through networking, cloud, and cybersecurity.',
    description: `Cisco's Cloud Security division is hiring an SRE to drive high availability, automated infrastructure provisioning, and continuous deployment across multi-cloud environments.

Key Responsibilities:
• Implement Infrastructure-as-Code using Terraform and Ansible.
• Maintain 99.99% uptime for global enterprise DNS and VPN tunneling services.
• Automate incident response and conduct blameless post-mortems.

Qualifications & Skills:
• Strong Linux system administration and networking (TCP/IP, BGP, DNS) background.
• Experience with Kubernetes, Docker, and CI/CD tools (GitHub Actions, Jenkins).`,
    screeningQuestions: [
      { id: 'q1', question: 'Years of hands-on experience managing Kubernetes clusters in production?', options: ['1-2 years', '3-5 years', '5+ years'] },
      { id: 'q2', question: 'Experience writing Terraform infrastructure as code?', options: ['Expert', 'Intermediate', 'Beginner'] },
      { id: 'q3', question: 'Notice period / joining availability', options: ['Immediate', '15 Days', '30 Days', '60+ Days'] }
    ]
  },
  {
    _id: 'job_uber_05',
    title: 'Product Engineer - Mobility & Payments',
    company: 'Uber',
    companyInitial: 'U',
    companyColor: '#000000',
    location: 'Bangalore, India',
    workplaceType: 'Hybrid',
    jobType: 'Full-time',
    salaryRange: '₹36L – ₹52L + Stock Grants',
    experienceLevel: '3-6 years',
    applicantCount: 54,
    alumniCount: 16,
    alumniRecruiter: {
      name: 'Karthik V.',
      role: 'Engineering Manager (RVCE Telecomm 2015)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      isAlumni: true,
      batch: 'Class of 2015',
      department: 'Telecommunication'
    },
    keywords: ['Java', 'Go', 'SQL', 'Microservices', 'Kafka', 'System Design'],
    aboutCompany: 'Uber ignites opportunity by setting the world in motion, powering ridesharing, freight logistics, and seamless digital commerce across 70+ countries.',
    description: `Uber Bangalore is the core engineering hub for global payments, rider experience, and driver earnings. We are looking for talented engineers to build mission-critical payment gateways and financial ledger systems.

Key Responsibilities:
• Develop idempotent payment processing workflows handling millions of dollars daily.
• Build real-time streaming architectures using Apache Kafka and Apache Flink.
• Work with global compliance, risk, and fraud teams.

Qualifications & Skills:
• Solid backend engineering in Java, Go, or C++.
• Strong understanding of ACID transactions, distributed locking, and relational databases.`,
    screeningQuestions: [
      { id: 'q1', question: 'Do you have experience with high-throughput message queues (Kafka / RabbitMQ)?', options: ['Yes, extensively', 'Yes, basic', 'No'] },
      { id: 'q2', question: 'Are you comfortable working on hybrid schedule in Bangalore office?', options: ['Yes', 'No'] },
      { id: 'q3', question: 'Notice period / joining availability', options: ['Immediate', '15 Days', '30 Days', '60+ Days'] }
    ]
  }
];

const JobsScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const { isAlumni, isAdmin, isSuperAdmin, isAdminOrSuper } = useUserRole();
  const insets = useSafeAreaInsets();
  const styles = getStyles(theme, isDarkMode);

  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 400;
  const isDesktop = screenWidth >= 1024;

  // Floating Hamburger Menu State (Right Bottom)
  const [fabMenuVisible, setFabMenuVisible] = useState(false);

  // LinkedIn Navigation Tabs
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'tracker' | 'preferences' | 'recommended' | 'post'
  const [trackerSubTab, setTrackerSubTab] = useState('saved'); // 'saved' | 'applied'

  // Data States
  const [jobs, setJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Keyword Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkplace, setSelectedWorkplace] = useState('All');
  const [selectedJobType, setSelectedJobType] = useState('All');
  const [selectedKeywordFilter, setSelectedKeywordFilter] = useState('All');

  // Candidate Profile & Resume State
  const [applicantName, setApplicantName] = useState('Alumni Candidate');
  const [applicantEmail, setApplicantEmail] = useState('candidate@alumni.rvce.edu.in');
  const [applicantPhone, setApplicantPhone] = useState('+91 98765 43210');
  const [applicantLocation, setApplicantLocation] = useState('Bangalore, India');
  const [applicantDegree, setApplicantDegree] = useState('RVCE • B.E. Computer Science');
  const [applicantResume, setApplicantResume] = useState({
    name: 'Alumni_Verified_Resume_2024.pdf',
    size: '1.4 MB',
    updated: 'Profile Attached'
  });
  const [userSkills, setUserSkills] = useState(['Python', 'React', 'AWS', 'SQL', 'Docker', 'DevOps']);

  // Selected Job for Detail / Easy Apply Modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('details'); // 'details' | 'apply'
  const [applyStep, setApplyStep] = useState(1); // 1: Contact, 2: Resume, 3: Questions/Keywords, 4: Review, 5: Submitted
  const [coverNote, setCoverNote] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [followCompany, setFollowCompany] = useState(true);
  const [screeningAnswers, setScreeningAnswers] = useState({
    exp: '3-5 years',
    availability: 'Immediate',
    auth: 'Authorized to work in India',
    coverNote: ''
  });

  // Job Preferences State
  const [openToWork, setOpenToWork] = useState(false);
  const [targetTitles, setTargetTitles] = useState('');
  const [targetLocations, setTargetLocations] = useState('');
  const [targetKeywords, setTargetKeywords] = useState('');
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Suggested keywords for quick preference selection
  const POPULAR_SKILLS = ['Python', 'React', 'Java', 'Machine Learning', 'AWS', 'Node.js', 'SQL', 'Data Science', 'Flutter', 'DevOps', 'Kubernetes', 'Go'];

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
    (async () => {
      try {
        const userStr = await AsyncStorage.getItem('userInfo');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.name) setApplicantName(user.name);
          if (user.email) setApplicantEmail(user.email);
          if (user.phone) setApplicantPhone(user.phone);
          if (user.location || user.city) setApplicantLocation(user.location || user.city);
          if (user.degree || user.department) {
            setApplicantDegree(`RVCE • ${user.degree || 'B.E.'} ${user.department || user.branch || ''} ${user.graduationYear ? `(${user.graduationYear})` : ''}`.trim());
          }
          if (user.resumeName || user.resumeUrl) {
            setApplicantResume({
              name: user.resumeName || (user.name ? `${user.name.replace(/\s+/g, '_')}_Resume.pdf` : 'Alumni_Resume.pdf'),
              size: '1.4 MB',
              updated: 'Profile Attached'
            });
          }
          if (Array.isArray(user.skills) && user.skills.length > 0) {
            setUserSkills(user.skills);
            setTargetKeywords(user.skills.join(', '));
          }
        }
      } catch (e) {}

      try {
        const cached = await AsyncStorage.getItem('cached_jobs_list');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setJobs(parsed);
            setLoading(false);
          } else {
            setJobs(DEFAULT_ALUMNI_JOBS);
            setLoading(false);
          }
        } else {
          setJobs(DEFAULT_ALUMNI_JOBS);
          setLoading(false);
        }
      } catch (e) {
        setJobs(DEFAULT_ALUMNI_JOBS);
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    loadAllData();
  }, [activeTab, selectedWorkplace, selectedJobType, selectedKeywordFilter]);

  const loadAllData = async () => {
    const hasData = (activeTab === 'search' && jobs.length > 0) ||
                    (activeTab === 'recommended' && recommendedJobs.length > 0) ||
                    (activeTab === 'tracker' && (savedJobs.length > 0 || appliedJobs.length > 0));
    if (!hasData) {
      setLoading(true);
    }
    try {
      if (activeTab === 'search') {
        const filters = {};
        if (searchQuery) filters.search = searchQuery;
        if (selectedWorkplace !== 'All') filters.workplaceType = selectedWorkplace;
        if (selectedJobType !== 'All') filters.jobType = selectedJobType;
        const res = await fetchJobs(filters);
        if (Array.isArray(res) && res.length > 0) {
          // Merge with DEFAULT_ALUMNI_JOBS to guarantee full rich experience
          const merged = [...res];
          DEFAULT_ALUMNI_JOBS.forEach(def => {
            if (!merged.some(m => (m._id || m.id) === def._id)) {
              merged.push(def);
            }
          });
          setJobs(merged);
          if (!searchQuery && selectedWorkplace === 'All' && selectedJobType === 'All') {
            AsyncStorage.setItem('cached_jobs_list', JSON.stringify(merged)).catch(() => {});
          }
        } else {
          setJobs(DEFAULT_ALUMNI_JOBS);
        }
      } else if (activeTab === 'tracker') {
        const trackerData = await fetchJobTracker();
        const cachedApplied = await AsyncStorage.getItem('cached_applied_jobs');
        const localApplied = cachedApplied ? JSON.parse(cachedApplied) : [];
        const mergedApplied = [...(trackerData.appliedJobs || [])];
        localApplied.forEach(loc => {
          if (!mergedApplied.some(m => (m._id || m.id) === (loc._id || loc.id))) {
            mergedApplied.unshift(loc);
          }
        });
        setAppliedJobs(mergedApplied);

        const cachedSaved = await AsyncStorage.getItem('cached_saved_jobs');
        const localSaved = cachedSaved ? JSON.parse(cachedSaved) : [];
        const mergedSaved = [...(trackerData.savedJobs || [])];
        localSaved.forEach(loc => {
          if (!mergedSaved.some(m => (m._id || m.id) === (loc._id || loc.id))) {
            mergedSaved.unshift(loc);
          }
        });
        setSavedJobs(mergedSaved.length > 0 ? mergedSaved : DEFAULT_ALUMNI_JOBS.slice(0, 1));
      } else if (activeTab === 'recommended') {
        const recs = await fetchRecommendedJobs();
        if (Array.isArray(recs) && recs.length > 0) {
          setRecommendedJobs(recs);
        } else {
          // Calculate high-match jobs based on target keywords
          const currentSkills = (targetKeywords || userSkills.join(', ')).toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
          const computed = DEFAULT_ALUMNI_JOBS.filter(job => {
            const jKws = (job.keywords || []).map(k => k.toLowerCase());
            return currentSkills.some(s => jKws.some(k => k.includes(s) || s.includes(k)));
          });
          setRecommendedJobs(computed.length > 0 ? computed : DEFAULT_ALUMNI_JOBS.slice(0, 3));
        }
      } else if (activeTab === 'preferences') {
        try {
          const cachedStr = await AsyncStorage.getItem('cached_job_preferences');
          if (cachedStr) {
            const cached = JSON.parse(cachedStr);
            setOpenToWork(cached.openToWork ?? true);
            if (cached.targetTitles) setTargetTitles(Array.isArray(cached.targetTitles) ? cached.targetTitles.join(', ') : cached.targetTitles);
            if (cached.targetLocations) setTargetLocations(Array.isArray(cached.targetLocations) ? cached.targetLocations.join(', ') : cached.targetLocations);
            if (cached.keywords) setTargetKeywords(Array.isArray(cached.keywords) ? cached.keywords.join(', ') : cached.keywords);
          }
        } catch (err) {}

        const prefs = await fetchJobPreferences();
        if (prefs) {
          setOpenToWork(prefs.openToWork ?? true);
          setTargetTitles((prefs.targetTitles || []).join(', '));
          setTargetLocations((prefs.targetLocations || []).join(', '));
          setTargetKeywords((prefs.keywords || prefs.skills || []).join(', '));
          try {
            await AsyncStorage.setItem('cached_job_preferences', JSON.stringify(prefs));
          } catch (err) {}
        }
      }
    } catch (e) {
      console.log('Error loading jobs data:', e);
      if (jobs.length === 0) setJobs(DEFAULT_ALUMNI_JOBS);
    } finally {
      setLoading(false);
    }
  };

  // Live Skill & Keyword Matching Algorithm
  const calculateSkillMatch = (job) => {
    if (!job) return { score: 85, matched: ['Alumni Network'], missing: [] };
    const jobKws = job.keywords || [];
    if (jobKws.length === 0) return { score: 90, matched: ['Full Stack', 'Alumni Network'], missing: [] };

    const userKwsSet = new Set([
      ...userSkills.map(s => s.toLowerCase().trim()),
      ...(targetKeywords ? targetKeywords.split(',').map(s => s.toLowerCase().trim()) : ['python', 'react', 'aws', 'sql', 'docker', 'devops'])
    ]);

    const matched = [];
    const missing = [];

    jobKws.forEach(kw => {
      const kwLower = kw.toLowerCase().trim();
      let isMatched = false;
      for (const u of userKwsSet) {
        if (u && (kwLower.includes(u) || u.includes(kwLower))) {
          isMatched = true;
          break;
        }
      }
      if (isMatched) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    });

    const score = jobKws.length > 0 
      ? Math.max(50, Math.min(100, Math.round((matched.length / jobKws.length) * 100)))
      : 85;

    return { score, matched, missing };
  };

  const handlePickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '*/*'],
        copyToCacheDirectory: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const sizeMB = file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB';
        setApplicantResume({
          name: file.name || 'Uploaded_Resume.pdf',
          size: sizeMB,
          updated: 'Just now',
          uri: file.uri
        });
        Alert.alert('Resume Attached 📄', `${file.name || 'Resume'} has been selected for your application.`);
      }
    } catch (err) {
      console.log('Error picking resume:', err);
    }
  };

  const openEasyApply = (job) => {
    setSelectedJob(job);
    setModalMode('apply');
    setApplyStep(1);
    setCoverNote('');
    setScreeningAnswers({
      exp: '3-5 years',
      availability: 'Immediate',
      auth: 'Authorized to work in India',
      coverNote: ''
    });
    setApplyModalVisible(true);
  };

  const openJobDetails = (job) => {
    setSelectedJob(job);
    setModalMode('details');
    setApplyModalVisible(true);
  };

  const handleToggleSave = async (jobId) => {
    try {
      await toggleSaveJob(jobId);
    } catch (e) {
      console.log('Error saving job to backend:', e);
    }
    setSavedJobs(prev => {
      const exists = prev.some(j => (j._id || j.id) === jobId);
      let updated;
      if (exists) {
        updated = prev.filter(j => (j._id || j.id) !== jobId);
      } else {
        const jobToAdd = [...jobs, ...DEFAULT_ALUMNI_JOBS].find(j => (j._id || j.id) === jobId);
        updated = jobToAdd ? [jobToAdd, ...prev] : prev;
      }
      AsyncStorage.setItem('cached_saved_jobs', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const handleEasyApplySubmit = async () => {
    if (!selectedJob) return;
    setIsApplying(true);
    try {
      await applyToJob(selectedJob._id || selectedJob.id, {
        coverNote: screeningAnswers.coverNote || coverNote,
        answers: screeningAnswers,
        applicantDetails: {
          name: applicantName,
          email: applicantEmail,
          phone: applicantPhone,
          location: applicantLocation,
          resumeName: applicantResume?.name || 'Resume_Alumni_Verified.pdf'
        }
      });
    } catch (e) {
      console.log('API application submission notice:', e);
    }

    // Always create local applied record for seamless offline and persistent experience
    const newAppliedJob = {
      ...selectedJob,
      status: 'Applied • Under Review',
      appliedAt: new Date().toISOString(),
      applicantDetails: {
        name: applicantName,
        email: applicantEmail,
        phone: applicantPhone,
        location: applicantLocation,
        resumeName: applicantResume?.name || 'Resume_Alumni_Verified.pdf',
        answers: screeningAnswers
      }
    };

    setAppliedJobs(prev => {
      const filtered = prev.filter(j => (j._id || j.id) !== (selectedJob._id || selectedJob.id));
      const updated = [newAppliedJob, ...filtered];
      AsyncStorage.setItem('cached_applied_jobs', JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    setIsApplying(false);
    setApplyStep(5); // Transition to Step 5: Submission Success Confirmation
  };

  const handleAddMissingSkill = (skill) => {
    handleToggleKeyword(skill);
    setUserSkills(prev => [...prev, skill]);
    Alert.alert('Skill Added 🎯', `Added ${skill} to your profile skills & keyword preferences!`);
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

      const payload = {
        openToWork,
        targetTitles: titlesArray,
        targetLocations: locsArray,
        keywords: keywordsArray
      };

      // Always save locally immediately so preferences are never lost
      try {
        await AsyncStorage.setItem('cached_job_preferences', JSON.stringify(payload));
        const userStr = await AsyncStorage.getItem('userInfo');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          userObj.isOpenToWork = openToWork;
          userObj.openToWork = openToWork;
          userObj.isJobSeeker = openToWork;
          if (targetTitles) userObj.openToWorkRoles = targetTitles;
          if (targetLocations) userObj.openToWorkLocations = targetLocations;
          await AsyncStorage.setItem('userInfo', JSON.stringify(userObj));
        }
      } catch (err) {}

      await updateJobPreferences(payload);
      Alert.alert('Preferences Saved 🎯', 'Your skill & keyword preferences have been saved! Jobs matching keywords in their descriptions will now appear in your Recommended tab.');
    } catch (e) {
      console.log('Update preferences notice:', e);
      const errMsg = e.response?.data?.message || e.message;
      if (errMsg && !errMsg.toLowerCase().includes('network')) {
        Alert.alert('Notice', `Preferences saved locally on device. (${errMsg})`);
      } else {
        Alert.alert('Preferences Saved 🎯', 'Your skill & keyword preferences have been saved on this device!');
      }
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

  const displayJobs = jobs.length > 0 ? jobs : DEFAULT_ALUMNI_JOBS;
  const filteredSearchJobs = displayJobs.filter(job => {
    if (selectedWorkplace !== 'All' && job.workplaceType !== selectedWorkplace) return false;
    if (selectedJobType !== 'All' && job.jobType !== selectedJobType) return false;
    if (selectedKeywordFilter !== 'All') {
      if (selectedKeywordFilter === '⚡ Easy Apply') {
        return true;
      }
      if (selectedKeywordFilter === 'Remote') {
        if (job.workplaceType !== 'Remote') return false;
      } else if (selectedKeywordFilter === 'Full-time') {
        if (job.jobType !== 'Full-time') return false;
      } else {
        const filterLower = selectedKeywordFilter.toLowerCase();
        const hasKw = (job.keywords || []).some(k => k.toLowerCase().includes(filterLower)) ||
                      (job.title || '').toLowerCase().includes(filterLower) ||
                      (job.description || '').toLowerCase().includes(filterLower);
        if (!hasKw) return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inTitle = (job.title || '').toLowerCase().includes(q);
      const inCompany = (job.company || '').toLowerCase().includes(q);
      const inLocation = (job.location || '').toLowerCase().includes(q);
      const inKeywords = (job.keywords || []).some(k => k.toLowerCase().includes(q));
      const inDesc = (job.description || '').toLowerCase().includes(q);
      if (!inTitle && !inCompany && !inLocation && !inKeywords && !inDesc) return false;
    }
    return true;
  });

  const renderJobCard = (job, isAppliedTab = false) => {
    const isSaved = (job.savedBy || []).includes('current_user') || savedJobs.some(s => (s._id || s.id) === (job._id || job.id));
    const skillMatch = calculateSkillMatch(job);
    const companyColor = job.companyColor || (isDarkMode ? '#34D399' : '#059669');
    const initial = job.companyInitial || (job.company ? job.company[0] : 'J');

    return (
      <View key={job._id || job.id} style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <FloatingElement distance={1.8} duration={2600}>
            <View style={[styles.companyLogoPod, { backgroundColor: `${companyColor}18`, borderColor: companyColor }]}>
              <Text style={[styles.companyLogoText, { color: companyColor }]}>{initial}</Text>
            </View>
          </FloatingElement>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <TouchableOpacity onPress={() => openJobDetails(job)} activeOpacity={0.75}>
              <Text style={styles.titleText}>{job.title}</Text>
            </TouchableOpacity>
            <Text style={styles.companyText}>
              {job.company} <Text style={{ color: theme.textMuted }}>•</Text> <Text style={{ color: theme.textSecondary }}>{job.location}</Text>
            </Text>

            {/* LinkedIn Alumni & Social Proof Pill */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6, flexWrap: 'wrap' }}>
              <View style={styles.alumniBadgePill}>
                <Ionicons name="people" size={12} color="#059669" style={{ marginRight: 4 }} />
                <Text style={styles.alumniBadgeText}>
                  {job.alumniCount || 12} Alumni work here
                </Text>
              </View>

              <View style={styles.easyApplyTagPill}>
                <Ionicons name="flash" size={11} color="#059669" style={{ marginRight: 3 }} />
                <Text style={styles.easyApplyTagText}>Easy Apply</Text>
              </View>
            </View>

            <View style={styles.tagRow}>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{job.workplaceType || 'On-site'}</Text>
              </View>
              <View style={[styles.tagPill, { backgroundColor: isDarkMode ? '#282A30' : '#F1F5F9' }]}>
                <Text style={[styles.tagText, { color: theme.textSecondary }]}>{job.jobType || 'Full-time'}</Text>
              </View>
              {job.salaryRange ? (
                <View style={[styles.tagPill, { 
                  backgroundColor: isDarkMode ? (theme.sandPod || '#261C14') : (theme.sandPod || '#FAF4ED'),
                  borderWidth: 1,
                  borderColor: isDarkMode ? (theme.sandBorder || 'rgba(212, 163, 115, 0.35)') : (theme.sandBorder || '#E8D4C1'),
                }]}>
                  <Text style={[styles.tagText, { color: isDarkMode ? (theme.sand || '#D4A373') : (theme.sandDark || '#B88758'), fontWeight: '700' }]}>
                    {job.salaryRange}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Smart Keyword & Match Detection Highlight */}
            <View style={styles.matchScoreBanner}>
              <Ionicons name="sparkles" size={13} color={isDarkMode ? '#34D399' : '#059669'} style={{ marginRight: 5 }} />
              <Text style={styles.matchScoreText}>
                🎯 {skillMatch.score}% Skill Match • {skillMatch.matched.slice(0, 3).join(', ')}
              </Text>
            </View>

            {isAppliedTab ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#059669' }}>
                  Status: {job.status || 'Applied • Under Review'}
                </Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity onPress={() => handleToggleSave(job._id || job.id)} style={{ padding: 6 }}>
            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color={isSaved ? (isDarkMode ? '#34D399' : '#059669') : theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Action Row */}
        {!isAppliedTab && (
          <View style={styles.cardActionRow}>
            <TouchableOpacity 
              style={styles.easyApplyBtn}
              onPress={() => openEasyApply(job)}
              activeOpacity={0.8}
            >
              <PulseElement minScale={0.88} maxScale={1.16} duration={1500}>
                <Ionicons name="flash" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
              </PulseElement>
              <Text style={styles.easyApplyText}>Easy Apply</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.detailsBtn}
              onPress={() => openJobDetails(job)}
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

      {/* ───── Universal App Header ───── */}
      <AppHeader
        navigation={navigation}
        currentRoute="Jobs"
        desktopTitle="Career & Job Hub"
        desktopSubtitle="Alumni Hiring & Opportunities"
      />

      {/* LinkedIn Jobs Navigation Header */}
      <View style={styles.headerContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={styles.headerTitle}>Career & Job Hub</Text>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: isDarkMode ? (theme.sandPod || '#261C14') : (theme.sandPod || '#FAF4ED'), 
            paddingHorizontal: 10, 
            paddingVertical: 4, 
            borderRadius: 12, 
            borderWidth: 1, 
            borderColor: isDarkMode ? (theme.sandBorder || 'rgba(212, 163, 115, 0.35)') : (theme.sandBorder || '#E8D4C1') 
          }}>
            <Ionicons name="briefcase-outline" size={14} color={isDarkMode ? (theme.sand || '#D4A373') : (theme.sandDark || '#B88758')} style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: isDarkMode ? (theme.sand || '#D4A373') : (theme.sandDark || '#B88758') }}>
              {displayJobs.length} Active Jobs
            </Text>
          </View>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'search' && styles.tabItemActive]}
            onPress={() => setActiveTab('search')}
          >
            <Ionicons name="search" size={16} color={activeTab === 'search' ? (isDarkMode ? '#34D399' : '#059669') : theme.textMuted} />
            <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>Search Jobs</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'tracker' && styles.tabItemActive]}
            onPress={() => setActiveTab('tracker')}
          >
            <Ionicons name="bookmark" size={16} color={activeTab === 'tracker' ? (isDarkMode ? '#34D399' : '#059669') : theme.textMuted} />
            <Text style={[styles.tabText, activeTab === 'tracker' && styles.tabTextActive]}>Job Tracker</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'preferences' && styles.tabItemActive]}
            onPress={() => setActiveTab('preferences')}
          >
            <Ionicons name="options" size={16} color={activeTab === 'preferences' ? (isDarkMode ? '#34D399' : '#059669') : theme.textMuted} />
            <Text style={[styles.tabText, activeTab === 'preferences' && styles.tabTextActive]}>Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'recommended' && styles.tabItemActive]}
            onPress={() => setActiveTab('recommended')}
          >
            <Ionicons name="sparkles" size={16} color={activeTab === 'recommended' ? (isDarkMode ? '#34D399' : '#059669') : theme.textMuted} />
            <Text style={[styles.tabText, activeTab === 'recommended' && styles.tabTextActive]}>Recommended</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'post' && styles.tabItemActive]}
            onPress={() => setActiveTab('post')}
          >
            <Ionicons name="add-circle" size={16} color={activeTab === 'post' ? (isDarkMode ? '#34D399' : '#059669') : theme.textMuted} />
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
                  placeholder="Search title, company, or keywords (e.g. Python, AWS)..."
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

              {/* Workplace Pills */}
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

              {/* LinkedIn Keyword Feature Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                {KEYWORD_FILTERS.map(kw => {
                  const isActive = selectedKeywordFilter === kw;
                  return (
                    <TouchableOpacity
                      key={kw}
                      style={[
                        styles.keywordFilterChip,
                        isActive && styles.keywordFilterChipActive,
                        kw === '⚡ Easy Apply' && styles.keywordFilterChipEasyApply
                      ]}
                      onPress={() => setSelectedKeywordFilter(kw)}
                    >
                      <Text style={[styles.keywordFilterChipText, isActive && styles.keywordFilterChipTextActive]}>
                        {kw}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Results Count & Keyword State */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textSecondary }}>
                Showing {filteredSearchJobs.length} {filteredSearchJobs.length === 1 ? 'Job' : 'Jobs'}
                {selectedKeywordFilter !== 'All' ? ` • Filtered by "${selectedKeywordFilter}"` : ''}
              </Text>
              {selectedKeywordFilter !== 'All' && (
                <TouchableOpacity onPress={() => setSelectedKeywordFilter('All')}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isDarkMode ? '#34D399' : '#059669' }}>
                    Reset ✕
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {loading && jobs.length === 0 ? (
              <ActivityIndicator size="large" color={isDarkMode ? '#059669' : '#059669'} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={filteredSearchJobs}
                keyExtractor={item => item._id || item.id}
                renderItem={({ item }) => renderJobCard(item)}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={() => (
                  <View style={styles.emptyBox}>
                    <Ionicons name="briefcase-outline" size={48} color={theme.textMuted} />
                    <Text style={styles.emptyText}>No jobs found matching your filter criteria.</Text>
                    <TouchableOpacity 
                      style={[styles.detailsBtn, { marginTop: 14 }]}
                      onPress={() => {
                        setSelectedWorkplace('All');
                        setSelectedJobType('All');
                        setSelectedKeywordFilter('All');
                        setSearchQuery('');
                      }}
                    >
                      <Text style={styles.detailsText}>Reset All Filters</Text>
                    </TouchableOpacity>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: isDarkMode ? '#34D399' : '#047857' }}>#OpenToWork</Text>
                    {openToWork && (
                      <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#15803D' }}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 13, color: isDarkMode ? '#9CA3AF' : '#047857', marginTop: 2, lineHeight: 18 }}>
                    Signal to recruiters, companies, and alumni that you are open to career opportunities. Shows the LinkedIn #OpenToWork photo ribbon on your profile.
                  </Text>
                </View>
                <Switch
                  value={openToWork}
                  onValueChange={async (val) => {
                    setOpenToWork(val);
                    try {
                      const userStr = await AsyncStorage.getItem('userInfo');
                      if (userStr) {
                        const userObj = JSON.parse(userStr);
                        userObj.isOpenToWork = val;
                        userObj.openToWork = val;
                        userObj.isJobSeeker = val;
                        await AsyncStorage.setItem('userInfo', JSON.stringify(userObj));
                      }
                    } catch (e) {}
                  }}
                  trackColor={{ false: isDarkMode ? '#2D3139' : '#CBD5E1', true: '#059669' }}
                />
              </View>

              <TouchableOpacity
                style={{
                  marginTop: 14,
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: isDarkMode ? '#1B4D36' : '#A7F3D0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onPress={() => navigation.navigate('Profile', { openToWorkModal: true })}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="options-outline" size={15} color={isDarkMode ? '#34D399' : '#057642'} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? '#34D399' : '#057642' }}>
                    Customize LinkedIn #OpenToWork Roles & Preferences
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={15} color={isDarkMode ? '#34D399' : '#057642'} />
              </TouchableOpacity>
            </View>

            {/* Keyword Recommendation Banner */}
            <View style={{ 
              backgroundColor: isDarkMode ? '#132A1E' : '#F0FDF4', 
              borderRadius: 12, 
              padding: 16, 
              marginBottom: 20, 
              borderWidth: 1, 
              borderColor: isDarkMode ? '#1B4D36' : '#A7F3D0' 
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Ionicons name="bulb-outline" size={18} color={isDarkMode ? '#34D399' : '#059669'} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: isDarkMode ? '#A7F3D0' : '#047857' }}>
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
                        backgroundColor: isSelected ? (isDarkMode ? '#059669' : '#059669') : (isDarkMode ? '#1E2025' : '#F1F5F9'),
                        borderWidth: 1,
                        borderColor: isSelected ? (isDarkMode ? '#34D399' : '#059669') : theme.border
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

            {loading && recommendedJobs.length === 0 ? (
              <ActivityIndicator size="large" color={isDarkMode ? '#34D399' : '#059669'} style={{ marginTop: 40 }} />
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

      {/* LINKEDIN EASY APPLY & JOB DETAILS MODAL */}
      {applyModalVisible && selectedJob && (
        <Modal 
          visible={true} 
          transparent={true} 
          animationType="slide"
          onRequestClose={() => {
            if (modalMode === 'apply' && applyStep > 1 && applyStep < 5) {
              Alert.alert('Discard application?', 'Are you sure you want to discard your application progress?', [
                { text: 'Keep Editing', style: 'cancel' },
                { text: 'Discard', style: 'destructive', onPress: () => setApplyModalVisible(false) }
              ]);
            } else {
              setApplyModalVisible(false);
            }
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, isDesktop ? styles.modalCardDesktop : styles.modalCardMobile]}>
              
              {/* MODE 1: LINKEDIN JOB DETAILS VIEW */}
              {modalMode === 'details' && (
                <View style={{ flex: 1 }}>
                  {/* Top Header */}
                  <View style={styles.modalTopHeader}>
                    <TouchableOpacity 
                      onPress={() => setApplyModalVisible(false)} 
                      style={styles.modalHeaderBtn}
                      accessibilityLabel="Close"
                    >
                      <Ionicons name="close" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={styles.modalHeaderTitle}>Job Details</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <TouchableOpacity 
                        onPress={() => Alert.alert('Share Job 🔗', `Copied link to ${selectedJob.title} at ${selectedJob.company}!`)}
                        style={styles.modalHeaderBtn}
                      >
                        <Ionicons name="share-outline" size={20} color={theme.text} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleToggleSave(selectedJob._id || selectedJob.id)}
                        style={styles.modalHeaderBtn}
                      >
                        <Ionicons 
                          name={savedJobs.some(s => (s._id || s.id) === (selectedJob._id || selectedJob.id)) ? "bookmark" : "bookmark-outline"} 
                          size={20} 
                          color={savedJobs.some(s => (s._id || s.id) === (selectedJob._id || selectedJob.id)) ? (isDarkMode ? '#34D399' : '#059669') : theme.text} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
                    {/* Company Branding & Title */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                      <View style={[styles.detailsCompanyPod, { backgroundColor: `${selectedJob.companyColor || '#059669'}18`, borderColor: selectedJob.companyColor || '#059669' }]}>
                        <Text style={[styles.detailsCompanyInitial, { color: selectedJob.companyColor || '#059669' }]}>
                          {selectedJob.companyInitial || (selectedJob.company ? selectedJob.company[0] : 'J')}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailsJobTitle}>{selectedJob.title}</Text>
                        <Text style={styles.detailsCompanySub}>
                          {selectedJob.company} • {selectedJob.location}
                        </Text>
                      </View>
                    </View>

                    {/* LinkedIn Metric Badges */}
                    <View style={styles.detailsPillGrid}>
                      <View style={styles.detailsMetricPill}>
                        <Ionicons name="people" size={14} color="#059669" style={{ marginRight: 5 }} />
                        <Text style={styles.detailsMetricPillText}>{selectedJob.alumniCount || 14} Alumni work here</Text>
                      </View>
                      <View style={[styles.detailsMetricPill, { backgroundColor: isDarkMode ? '#132A1E' : '#ECFDF5' }]}>
                        <Ionicons name="flash" size={14} color="#059669" style={{ marginRight: 5 }} />
                        <Text style={[styles.detailsMetricPillText, { color: isDarkMode ? '#34D399' : '#047857' }]}>Easy Apply</Text>
                      </View>
                      <View style={styles.detailsMetricPill}>
                        <Ionicons name="time-outline" size={14} color={theme.textMuted} style={{ marginRight: 5 }} />
                        <Text style={styles.detailsMetricPillText}>Over {selectedJob.applicantCount || 25} applicants</Text>
                      </View>
                      <View style={styles.detailsMetricPill}>
                        <Ionicons name="briefcase-outline" size={14} color={theme.textMuted} style={{ marginRight: 5 }} />
                        <Text style={styles.detailsMetricPillText}>{selectedJob.jobType || 'Full-time'} • {selectedJob.workplaceType || 'Hybrid'}</Text>
                      </View>
                      {selectedJob.salaryRange ? (
                        <View style={[styles.detailsMetricPill, { backgroundColor: isDarkMode ? '#261C14' : '#FAF4ED', borderColor: isDarkMode ? 'rgba(212, 163, 115, 0.4)' : '#E8D4C1' }]}>
                          <Ionicons name="cash-outline" size={14} color={isDarkMode ? '#D4A373' : '#B88758'} style={{ marginRight: 5 }} />
                          <Text style={[styles.detailsMetricPillText, { color: isDarkMode ? '#D4A373' : '#B88758', fontWeight: '700' }]}>{selectedJob.salaryRange}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Meet the Hiring Team Card (LinkedIn Feature) */}
                    <View style={styles.recruiterCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Text style={styles.recruiterCardHeading}>Meet the Hiring Team</Text>
                        <View style={styles.alumniReferralTag}>
                          <Ionicons name="shield-checkmark" size={12} color="#059669" style={{ marginRight: 3 }} />
                          <Text style={styles.alumniReferralTagText}>Alumni Recruiter</Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {selectedJob.alumniRecruiter?.avatar ? (
                          <Image 
                            source={{ uri: selectedJob.alumniRecruiter.avatar }} 
                            style={styles.recruiterAvatar} 
                          />
                        ) : (
                          <View style={styles.recruiterAvatarFallback}>
                            <Text style={styles.recruiterAvatarText}>
                              {selectedJob.alumniRecruiter?.name ? selectedJob.alumniRecruiter.name.slice(0, 2).toUpperCase() : 'RV'}
                            </Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recruiterName}>
                            {selectedJob.alumniRecruiter?.name || 'Aditya Rao'}
                          </Text>
                          <Text style={styles.recruiterRole}>
                            {selectedJob.alumniRecruiter?.role || 'Staff Engineering Lead (RVCE CSE 2016)'}
                          </Text>
                          <Text style={styles.recruiterSub}>
                            {selectedJob.alumniRecruiter?.department || 'Computer Science'} • {selectedJob.alumniRecruiter?.batch || 'Class of 2016'}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity 
                        style={styles.recruiterMsgBtn}
                        onPress={() => {
                          Alert.alert(
                            'Alumni Networking 🤝',
                            `Start a referral or pre-application discussion with ${selectedJob.alumniRecruiter?.name || 'the recruiter'}?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { 
                                text: 'Send Message', 
                                onPress: () => {
                                  setApplyModalVisible(false);
                                  navigation.navigate('Chat', { 
                                    recipient: { 
                                      name: selectedJob.alumniRecruiter?.name || 'Alumni Recruiter',
                                      role: selectedJob.alumniRecruiter?.role || 'Hiring Lead',
                                      company: selectedJob.company
                                    } 
                                  });
                                } 
                              }
                            ]
                          );
                        }}
                      >
                        <Ionicons name="chatbubble-ellipses-outline" size={16} color="#059669" style={{ marginRight: 6 }} />
                        <Text style={styles.recruiterMsgBtnText}>Message Recruiter for Referral</Text>
                      </TouchableOpacity>
                    </View>

                    {/* How You Match / Skill Analysis (LinkedIn Feature) */}
                    {(() => {
                      const matchResult = calculateSkillMatch(selectedJob);
                      return (
                        <View style={styles.howYouMatchCard}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={styles.matchCardTitle}>How you match</Text>
                            <View style={styles.matchPercentBadge}>
                              <Text style={styles.matchPercentBadgeText}>🎯 {matchResult.score}% Match</Text>
                            </View>
                          </View>
                          <Text style={styles.matchCardSubtitle}>
                            {matchResult.matched.length} of {(selectedJob.keywords || []).length || 5} skills match your profile and keyword preferences.
                          </Text>

                          {/* Skill Pills */}
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                            {matchResult.matched.map((kw, i) => (
                              <View key={`match-${i}`} style={styles.skillMatchedPill}>
                                <Ionicons name="checkmark" size={12} color="#059669" style={{ marginRight: 4 }} />
                                <Text style={styles.skillMatchedText}>{kw}</Text>
                              </View>
                            ))}
                            {matchResult.missing.map((kw, i) => (
                              <TouchableOpacity 
                                key={`miss-${i}`} 
                                style={styles.skillMissingPill}
                                onPress={() => handleAddMissingSkill(kw)}
                              >
                                <Ionicons name="add" size={12} color={theme.textMuted} style={{ marginRight: 4 }} />
                                <Text style={styles.skillMissingText}>{kw}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      );
                    })()}

                    {/* Full Job Description */}
                    <Text style={styles.sectionHeading}>About the job</Text>
                    <Text style={styles.jobDescBody}>{selectedJob.description}</Text>

                    {/* About Company */}
                    {selectedJob.aboutCompany ? (
                      <>
                        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>About {selectedJob.company}</Text>
                        <Text style={styles.jobDescBody}>{selectedJob.aboutCompany}</Text>
                      </>
                    ) : null}

                    <View style={{ height: 90 }} />
                  </ScrollView>

                  {/* Sticky Footer */}
                  <View style={styles.detailsStickyFooter}>
                    <TouchableOpacity 
                      style={styles.detailsBookmarkBtn} 
                      onPress={() => handleToggleSave(selectedJob._id || selectedJob.id)}
                    >
                      <Ionicons 
                        name={savedJobs.some(s => (s._id || s.id) === (selectedJob._id || selectedJob.id)) ? "bookmark" : "bookmark-outline"} 
                        size={22} 
                        color={savedJobs.some(s => (s._id || s.id) === (selectedJob._id || selectedJob.id)) ? (isDarkMode ? '#34D399' : '#059669') : theme.textMuted} 
                      />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.detailsStickyApplyBtn}
                      onPress={() => {
                        setModalMode('apply');
                        setApplyStep(1);
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="flash" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.detailsStickyApplyBtnText}>Easy Apply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* MODE 2: LINKEDIN MULTI-STEP EASY APPLY WIZARD */}
              {modalMode === 'apply' && (
                <View style={{ flex: 1 }}>
                  {/* Step Progress Top Bar (Steps 1 to 4) */}
                  {applyStep < 5 && (
                    <View style={styles.applyHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <TouchableOpacity 
                          onPress={() => {
                            if (applyStep > 1) {
                              Alert.alert('Discard application?', 'Are you sure you want to exit?', [
                                { text: 'Keep Editing', style: 'cancel' },
                                { text: 'Discard', style: 'destructive', onPress: () => setApplyModalVisible(false) }
                              ]);
                            } else {
                              setApplyModalVisible(false);
                            }
                          }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="close" size={22} color={theme.text} />
                        </TouchableOpacity>

                        <Text style={styles.applyStepIndicatorText}>Step {applyStep} of 4</Text>

                        <TouchableOpacity onPress={() => openJobDetails(selectedJob)}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? '#34D399' : '#059669' }}>
                            View Role
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* 4-Step Progress Track */}
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressBar, { width: `${(applyStep / 4) * 100}%` }]} />
                      </View>
                    </View>
                  )}

                  {/* ───── STEP 1: CONTACT INFORMATION ───── */}
                  {applyStep === 1 && (
                    <View style={{ flex: 1 }}>
                      <ScrollView style={styles.applyBodyScroll} showsVerticalScrollIndicator={false}>
                        <Text style={styles.stepTitle}>Contact info</Text>
                        <Text style={styles.stepSubtitle}>
                          Please review your contact information so {selectedJob.company} can reach you.
                        </Text>

                        {/* Profile Header Snippet */}
                        <View style={styles.applicantMiniCard}>
                          <View style={styles.applicantAvatarBox}>
                            <Text style={styles.applicantAvatarText}>
                              {applicantName ? applicantName.slice(0, 2).toUpperCase() : 'RV'}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.applicantMiniName}>{applicantName}</Text>
                            <Text style={styles.applicantMiniSub}>{applicantDegree}</Text>
                          </View>
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Full Name *</Text>
                          <TextInput
                            style={styles.input}
                            value={applicantName}
                            onChangeText={setApplicantName}
                            placeholder="Your full name"
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Email Address *</Text>
                          <TextInput
                            style={styles.input}
                            value={applicantEmail}
                            onChangeText={setApplicantEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholder="name@alumni.rvce.edu.in"
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Phone Number *</Text>
                          <TextInput
                            style={styles.input}
                            value={applicantPhone}
                            onChangeText={setApplicantPhone}
                            keyboardType="phone-pad"
                            placeholder="+91 98765 43210"
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Current City / Location *</Text>
                          <TextInput
                            style={styles.input}
                            value={applicantLocation}
                            onChangeText={setApplicantLocation}
                            placeholder="e.g. Bangalore, Karnataka"
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>

                        <View style={{ height: 30 }} />
                      </ScrollView>

                      {/* Step 1 Footer Buttons */}
                      <View style={styles.applyFooter}>
                        <TouchableOpacity 
                          style={styles.applySecondaryBtn} 
                          onPress={() => setApplyModalVisible(false)}
                        >
                          <Text style={styles.applySecondaryBtnText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.applyPrimaryBtn} 
                          onPress={() => {
                            if (!applicantName.trim() || !applicantEmail.trim() || !applicantPhone.trim()) {
                              Alert.alert('Required Fields', 'Please ensure name, email, and phone number are filled.');
                              return;
                            }
                            setApplyStep(2);
                          }}
                        >
                          <Text style={styles.applyPrimaryBtnText}>Next</Text>
                          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* ───── STEP 2: RESUME & EDUCATION ───── */}
                  {applyStep === 2 && (
                    <View style={{ flex: 1 }}>
                      <ScrollView style={styles.applyBodyScroll} showsVerticalScrollIndicator={false}>
                        <Text style={styles.stepTitle}>Resume & Education</Text>
                        <Text style={styles.stepSubtitle}>
                          Select the resume file you want to submit with this application.
                        </Text>

                        {/* Selected Resume Radio Item */}
                        <View style={styles.resumeOptionCardActive}>
                          <View style={styles.radioSelectedDot}>
                            <View style={styles.radioSelectedInner} />
                          </View>
                          <View style={styles.resumeFileIconPod}>
                            <Ionicons name="document-text" size={24} color="#EF4444" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resumeFileName}>{applicantResume.name}</Text>
                            <Text style={styles.resumeFileMeta}>
                              {applicantResume.size} • Updated {applicantResume.updated}
                            </Text>
                          </View>
                          <Ionicons name="checkmark-circle" size={20} color="#059669" />
                        </View>

                        {/* Upload Resume Button (DocumentPicker) */}
                        <TouchableOpacity 
                          style={styles.uploadResumeBox}
                          onPress={handlePickResume}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="cloud-upload-outline" size={24} color="#059669" style={{ marginBottom: 4 }} />
                          <Text style={styles.uploadResumeTitle}>Upload resume</Text>
                          <Text style={styles.uploadResumeSub}>
                            DOC, DOCX, PDF (up to 5 MB)
                          </Text>
                        </TouchableOpacity>

                        {/* Academic Education Card */}
                        <Text style={[styles.sectionHeading, { marginTop: 20 }]}>Education</Text>
                        <View style={styles.educationCard}>
                          <View style={styles.educationIconPod}>
                            <Ionicons name="school" size={22} color="#059669" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.educationSchool}>R.V. College of Engineering (RVCE)</Text>
                            <Text style={styles.educationDegree}>{applicantDegree}</Text>
                            <View style={styles.verifiedAlumniPill}>
                              <Ionicons name="shield-checkmark" size={11} color="#059669" style={{ marginRight: 3 }} />
                              <Text style={styles.verifiedAlumniPillText}>Verified Alumni Profile</Text>
                            </View>
                          </View>
                        </View>

                        <View style={{ height: 30 }} />
                      </ScrollView>

                      {/* Step 2 Footer Buttons */}
                      <View style={styles.applyFooter}>
                        <TouchableOpacity 
                          style={styles.applySecondaryBtn} 
                          onPress={() => setApplyStep(1)}
                        >
                          <Ionicons name="arrow-back" size={16} color={theme.text} style={{ marginRight: 4 }} />
                          <Text style={styles.applySecondaryBtnText}>Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.applyPrimaryBtn} 
                          onPress={() => setApplyStep(3)}
                        >
                          <Text style={styles.applyPrimaryBtnText}>Next</Text>
                          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* ───── STEP 3: SCREENING QUESTIONS & KEYWORD FIT ───── */}
                  {applyStep === 3 && (
                    <View style={{ flex: 1 }}>
                      <ScrollView style={styles.applyBodyScroll} showsVerticalScrollIndicator={false}>
                        <Text style={styles.stepTitle}>Screening & Keyword Fit</Text>
                        <Text style={styles.stepSubtitle}>
                          Answer screening questions set by {selectedJob.company}’s hiring team.
                        </Text>

                        {/* Keyword Fit Summary Banner */}
                        {(() => {
                          const matchResult = calculateSkillMatch(selectedJob);
                          return (
                            <View style={styles.keywordFitNotice}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <Ionicons name="sparkles" size={16} color="#059669" style={{ marginRight: 6 }} />
                                  <Text style={styles.keywordFitNoticeTitle}>
                                    🎯 {matchResult.score}% Keyword Fit
                                  </Text>
                                </View>
                                <Text style={styles.keywordFitNoticeCount}>
                                  {matchResult.matched.length} Matched Skills
                                </Text>
                              </View>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                {matchResult.matched.map((kw, i) => (
                                  <View key={i} style={styles.keywordPillGreen}>
                                    <Text style={styles.keywordPillGreenText}>✓ {kw}</Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          );
                        })()}

                        {/* Question 1: Years of Experience */}
                        <View style={styles.questionBlock}>
                          <Text style={styles.questionTitle}>
                            1. How many years of relevant work experience do you have with this stack? *
                          </Text>
                          <View style={styles.chipsRow}>
                            {['0-1 year', '1-3 years', '3-5 years', '5+ years'].map(opt => {
                              const isSelected = screeningAnswers.exp === opt;
                              return (
                                <TouchableOpacity
                                  key={opt}
                                  style={[styles.questionChip, isSelected && styles.questionChipSelected]}
                                  onPress={() => setScreeningAnswers(prev => ({ ...prev, exp: opt }))}
                                >
                                  <Text style={[styles.questionChipText, isSelected && styles.questionChipTextSelected]}>
                                    {opt}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>

                        {/* Question 2: Notice Period */}
                        <View style={styles.questionBlock}>
                          <Text style={styles.questionTitle}>
                            2. What is your earliest joining availability / notice period? *
                          </Text>
                          <View style={styles.chipsRow}>
                            {['Immediate', '15 Days', '30 Days', '60+ Days'].map(opt => {
                              const isSelected = screeningAnswers.availability === opt;
                              return (
                                <TouchableOpacity
                                  key={opt}
                                  style={[styles.questionChip, isSelected && styles.questionChipSelected]}
                                  onPress={() => setScreeningAnswers(prev => ({ ...prev, availability: opt }))}
                                >
                                  <Text style={[styles.questionChipText, isSelected && styles.questionChipTextSelected]}>
                                    {opt}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>

                        {/* Question 3: Work Authorization */}
                        <View style={styles.questionBlock}>
                          <Text style={styles.questionTitle}>
                            3. Are you legally authorized to work in India without sponsorship? *
                          </Text>
                          <View style={styles.chipsRow}>
                            {['Authorized to work in India', 'Requires Visa Sponsorship'].map(opt => {
                              const isSelected = screeningAnswers.auth === opt;
                              return (
                                <TouchableOpacity
                                  key={opt}
                                  style={[styles.questionChip, isSelected && styles.questionChipSelected]}
                                  onPress={() => setScreeningAnswers(prev => ({ ...prev, auth: opt }))}
                                >
                                  <Text style={[styles.questionChipText, isSelected && styles.questionChipTextSelected]}>
                                    {opt}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>

                        {/* Question 4: Optional Message / Cover Note */}
                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Cover Note / Note to the Hiring Team (Optional)</Text>
                          <TextInput
                            style={[styles.input, { height: 95, textAlignVertical: 'top' }]}
                            multiline
                            placeholder="Highlight your key projects, alumni connections, or why you're excited for this role..."
                            placeholderTextColor="#9CA3AF"
                            value={screeningAnswers.coverNote}
                            onChangeText={val => setScreeningAnswers(prev => ({ ...prev, coverNote: val }))}
                          />
                        </View>

                        <View style={{ height: 30 }} />
                      </ScrollView>

                      {/* Step 3 Footer Buttons */}
                      <View style={styles.applyFooter}>
                        <TouchableOpacity 
                          style={styles.applySecondaryBtn} 
                          onPress={() => setApplyStep(2)}
                        >
                          <Ionicons name="arrow-back" size={16} color={theme.text} style={{ marginRight: 4 }} />
                          <Text style={styles.applySecondaryBtnText}>Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.applyPrimaryBtn} 
                          onPress={() => setApplyStep(4)}
                        >
                          <Text style={styles.applyPrimaryBtnText}>Next</Text>
                          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* ───── STEP 4: REVIEW APPLICATION ───── */}
                  {applyStep === 4 && (
                    <View style={{ flex: 1 }}>
                      <ScrollView style={styles.applyBodyScroll} showsVerticalScrollIndicator={false}>
                        <Text style={styles.stepTitle}>Review your application</Text>
                        <Text style={styles.stepSubtitle}>
                          Please review everything before submitting to {selectedJob.company}.
                        </Text>

                        {/* Review Block 1: Contact info */}
                        <View style={styles.reviewCard}>
                          <View style={styles.reviewCardHeader}>
                            <Text style={styles.reviewCardTitle}>Contact info</Text>
                            <TouchableOpacity onPress={() => setApplyStep(1)}>
                              <Text style={styles.reviewEditLink}>Edit</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.reviewValueBold}>{applicantName}</Text>
                          <Text style={styles.reviewValueSub}>{applicantEmail} • {applicantPhone}</Text>
                          <Text style={styles.reviewValueSub}>{applicantLocation}</Text>
                        </View>

                        {/* Review Block 2: Resume */}
                        <View style={styles.reviewCard}>
                          <View style={styles.reviewCardHeader}>
                            <Text style={styles.reviewCardTitle}>Resume</Text>
                            <TouchableOpacity onPress={() => setApplyStep(2)}>
                              <Text style={styles.reviewEditLink}>Edit</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Ionicons name="document-text" size={22} color="#EF4444" />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.reviewValueBold}>{applicantResume.name}</Text>
                              <Text style={styles.reviewValueSub}>{applicantResume.size} • {applicantResume.updated}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Review Block 3: Screening Answers */}
                        <View style={styles.reviewCard}>
                          <View style={styles.reviewCardHeader}>
                            <Text style={styles.reviewCardTitle}>Screening responses</Text>
                            <TouchableOpacity onPress={() => setApplyStep(3)}>
                              <Text style={styles.reviewEditLink}>Edit</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.reviewLabel}>Experience:</Text>
                          <Text style={styles.reviewValueBold}>{screeningAnswers.exp}</Text>
                          
                          <Text style={[styles.reviewLabel, { marginTop: 8 }]}>Notice Period:</Text>
                          <Text style={styles.reviewValueBold}>{screeningAnswers.availability}</Text>

                          <Text style={[styles.reviewLabel, { marginTop: 8 }]}>Authorization:</Text>
                          <Text style={styles.reviewValueBold}>{screeningAnswers.auth}</Text>

                          {screeningAnswers.coverNote ? (
                            <>
                              <Text style={[styles.reviewLabel, { marginTop: 8 }]}>Cover Note:</Text>
                              <Text style={styles.reviewValueSub}>{screeningAnswers.coverNote}</Text>
                            </>
                          ) : null}
                        </View>

                        {/* LinkedIn Follow Company Checkbox */}
                        <View style={styles.followCompanyCard}>
                          <View style={[styles.followCompanyPod, { backgroundColor: `${selectedJob.companyColor || '#059669'}18` }]}>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: selectedJob.companyColor || '#059669' }}>
                              {selectedJob.companyInitial || selectedJob.company[0]}
                            </Text>
                          </View>
                          <View style={{ flex: 1, marginHorizontal: 10 }}>
                            <Text style={styles.followCompanyTitle}>Follow {selectedJob.company}</Text>
                            <Text style={styles.followCompanySub}>
                              Stay updated on alumni job openings and hiring announcements.
                            </Text>
                          </View>
                          <Switch
                            value={followCompany}
                            onValueChange={setFollowCompany}
                            trackColor={{ false: isDarkMode ? '#2D3139' : '#CBD5E1', true: '#059669' }}
                          />
                        </View>

                        {/* Disclaimer */}
                        <Text style={styles.disclaimerText}>
                          We will share your full profile, screening answers, and verified resume with the hiring team at {selectedJob.company}.
                        </Text>

                        <View style={{ height: 30 }} />
                      </ScrollView>

                      {/* Step 4 Footer Buttons */}
                      <View style={styles.applyFooter}>
                        <TouchableOpacity 
                          style={styles.applySecondaryBtn} 
                          onPress={() => setApplyStep(3)}
                          disabled={isApplying}
                        >
                          <Ionicons name="arrow-back" size={16} color={theme.text} style={{ marginRight: 4 }} />
                          <Text style={styles.applySecondaryBtnText}>Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.applyPrimaryBtn} 
                          onPress={handleEasyApplySubmit}
                          disabled={isApplying}
                        >
                          {isApplying ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <>
                              <Ionicons name="paper-plane" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                              <Text style={styles.applyPrimaryBtnText}>Submit application</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* ───── STEP 5: APPLICATION SUBMITTED CELEBRATION ───── */}
                  {applyStep === 5 && (
                    <View style={styles.successContainer}>
                      <View style={styles.successIconPod}>
                        <Ionicons name="checkmark" size={44} color="#FFFFFF" />
                      </View>

                      <Text style={styles.successTitle}>Application submitted! 🎉</Text>
                      <Text style={styles.successSub}>
                        Your application for <Text style={{ fontWeight: '800', color: theme.text }}>{selectedJob.title}</Text> has been sent to <Text style={{ fontWeight: '800', color: theme.text }}>{selectedJob.company}</Text>.
                      </Text>

                      {/* Recruiter Notice Card */}
                      <View style={styles.successRecruiterBox}>
                        <View style={styles.successRecruiterAvatar}>
                          <Ionicons name="school" size={20} color="#059669" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.successRecruiterName}>
                            {selectedJob.alumniRecruiter?.name || 'Aditya Rao'} ({selectedJob.alumniRecruiter?.batch || 'RVCE Alumni'})
                          </Text>
                          <Text style={styles.successRecruiterRole}>
                            Alumni Recruiter has received your application and resume.
                          </Text>
                        </View>
                      </View>

                      {/* Details Box */}
                      <View style={styles.successDetailsBox}>
                        <View style={styles.successRow}>
                          <Text style={styles.successRowLabel}>Application ID:</Text>
                          <Text style={styles.successRowVal}>#RV-APP-{selectedJob._id ? selectedJob._id.slice(-6).toUpperCase() : '847291'}</Text>
                        </View>
                        <View style={styles.successRow}>
                          <Text style={styles.successRowLabel}>Status:</Text>
                          <Text style={[styles.successRowVal, { color: '#059669' }]}>Applied • Under Review</Text>
                        </View>
                        <View style={styles.successRow}>
                          <Text style={styles.successRowLabel}>Resume Attached:</Text>
                          <Text style={styles.successRowVal}>{applicantResume.name}</Text>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <TouchableOpacity 
                        style={styles.successTrackerBtn}
                        onPress={() => {
                          setApplyModalVisible(false);
                          setActiveTab('tracker');
                          setTrackerSubTab('applied');
                        }}
                      >
                        <Ionicons name="bookmark-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.successTrackerBtnText}>View in Application Tracker</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.successDoneBtn}
                        onPress={() => setApplyModalVisible(false)}
                      >
                        <Text style={styles.successDoneBtnText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                </View>
              )}

            </View>
          </View>
        </Modal>
      )}

      {/* Floating Hamburger Menu at Bottom Right */}
      <View 
        style={[
          styles.fabContainer,
          {
            bottom: isDesktop ? 28 : Math.max(insets?.bottom || 0, 10) + 68,
            right: isDesktop ? 24 : 16,
          }
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[
            styles.fabPillButton,
            !isDesktop && styles.fabPillButtonMobile
          ]}
          onPress={() => setFabMenuVisible(prev => !prev)}
          activeOpacity={0.85}
          accessibilityLabel="Resume Book Menu"
        >
          <Ionicons 
            name={fabMenuVisible ? 'close' : 'menu'} 
            size={isDesktop ? 20 : 18} 
            color="#FFFFFF" 
          />
          <Text style={[styles.fabPillButtonText, !isDesktop && styles.fabPillButtonTextMobile]}>
            {fabMenuVisible ? 'Close' : 'Resume Book'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dedicated Resume Book Modal (Desktop Card vs Mobile Bottom Sheet) */}
      <Modal
        visible={fabMenuVisible}
        transparent
        animationType={isDesktop ? 'fade' : 'slide'}
        onRequestClose={() => setFabMenuVisible(false)}
      >
        <TouchableOpacity
          style={isDesktop ? styles.fabBackdrop : styles.mobileSheetBackdrop}
          activeOpacity={1}
          onPress={() => setFabMenuVisible(false)}
        >
          {isDesktop ? (
            /* DESKTOP WEB CARD */
            <View 
              style={[
                styles.resumeShowcaseCard,
                { bottom: 96, right: 24, width: 340 }
              ]}
              onStartShouldSetResponder={() => true}
            >
              {/* Top Brand Bar */}
              <View style={styles.showcaseTopBanner}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={styles.showcaseIconPod}>
                    <Ionicons name="school" size={20} color="#34D399" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.showcaseBrandTitle}>RV ALUMNI</Text>
                      <View style={styles.showcaseOfficialBadge}>
                        <Text style={styles.showcaseOfficialBadgeText}>OFFICIAL</Text>
                      </View>
                    </View>
                    <Text style={styles.showcaseBrandSub}>Exclusive Candidate Pool</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => setFabMenuVisible(false)} 
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.showcaseCloseBtn}
                >
                  <Ionicons name="close" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Showcase Body */}
              <View style={styles.showcaseBody}>
                <View style={styles.showcaseTagRow}>
                  <View style={styles.showcasePill}>
                    <Ionicons name="sparkles" size={12} color="#059669" style={{ marginRight: 4 }} />
                    <Text style={styles.showcasePillText}>RESUME BOOK</Text>
                  </View>
                  <Text style={styles.showcaseStatText}>850+ Verified Profiles</Text>
                </View>

                <Text style={styles.showcaseTitle}>RVCE Alumni Resume Book</Text>
                <Text style={styles.showcaseSubtitle}>
                  Verified alumni resumes across top tech, product, and leadership domains ready for hire & referrals.
                </Text>

                {/* 3 Metric Badges */}
                <View style={styles.showcaseMetricsRow}>
                  <View style={styles.showcaseMetricItem}>
                    <Text style={styles.showcaseMetricValue}>850+</Text>
                    <Text style={styles.showcaseMetricLabel}>Candidates</Text>
                  </View>
                  <View style={styles.showcaseMetricDivider} />
                  <View style={styles.showcaseMetricItem}>
                    <Text style={styles.showcaseMetricValue}>120+</Text>
                    <Text style={styles.showcaseMetricLabel}>Companies</Text>
                  </View>
                  <View style={styles.showcaseMetricDivider} />
                  <View style={styles.showcaseMetricItem}>
                    <Text style={styles.showcaseMetricValue}>2012–25</Text>
                    <Text style={styles.showcaseMetricLabel}>Batches</Text>
                  </View>
                </View>

                {/* Live Preview Sample Card */}
                <View style={styles.spotlightCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={styles.spotlightAvatar}>
                      <Text style={styles.spotlightAvatarText}>RV</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.spotlightName}>Alumni Candidate</Text>
                        <View style={styles.spotlightBadge}>
                          <View style={styles.spotlightDot} />
                          <Text style={styles.spotlightBadgeText}>Open to Hire</Text>
                        </View>
                      </View>
                      <Text style={styles.spotlightRole}>Full Stack & Cloud • 3+ Yrs Exp</Text>
                    </View>
                  </View>
                  <View style={styles.spotlightSkillsRow}>
                    {['React', 'Python', 'AWS', 'System Design'].map((skill, idx) => (
                      <View key={idx} style={styles.spotlightSkillChip}>
                        <Text style={styles.spotlightSkillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Glowing CTA Button */}
                <TouchableOpacity
                  style={styles.showcaseCtaBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    setFabMenuVisible(false);
                    navigation.navigate('ResumeBook', { initialMode: 'talent_list' });
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="document-text" size={18} color="#FFFFFF" />
                    <Text style={styles.showcaseCtaBtnText}>Browse Resume Book</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Secondary Link for Job Seekers */}
                <TouchableOpacity
                  style={styles.showcaseSecondaryLink}
                  onPress={() => {
                    setFabMenuVisible(false);
                    navigation.navigate('ResumeBook', { initialMode: 'get_listed' });
                  }}
                >
                  <Text style={styles.showcaseSecondaryText}>
                    Job seeker? <Text style={styles.showcaseSecondaryLinkBold}>Get Listed in Resume Book →</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* MOBILE NATIVE BOTTOM SHEET */
            <View 
              style={[
                styles.mobileBottomSheet,
                { paddingBottom: Math.max(insets?.bottom || 0, 16) + 12 }
              ]}
              onStartShouldSetResponder={() => true}
            >
              {/* Native Drag Handle */}
              <View style={styles.sheetHandle} />

              {/* Mobile Header */}
              <View style={styles.mobileSheetHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={styles.mobileIconPod}>
                    <Ionicons name="document-text" size={22} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mobileSheetTitle}>Resume Book</Text>
                    <Text style={styles.mobileSheetSub}>RVCE Alumni Candidate Directory</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => setFabMenuVisible(false)} 
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.mobileCloseBtn}
                >
                  <Ionicons name="close" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Mobile Compact Value Badges */}
              <View style={styles.mobilePillsRow}>
                <View style={styles.mobilePillBadge}>
                  <Text style={styles.mobilePillBadgeText}>⚡ 850+ Resumes</Text>
                </View>
                <View style={styles.mobilePillBadge}>
                  <Text style={styles.mobilePillBadgeText}>🏢 Top Tech Firms</Text>
                </View>
                <View style={styles.mobilePillBadge}>
                  <Text style={styles.mobilePillBadgeText}>🎓 Batches 2012–25</Text>
                </View>
              </View>

              <Text style={styles.mobileSheetDesc}>
                Explore pre-screened alumni profiles seeking engineering, product, and leadership roles.
              </Text>

              {/* Primary Mobile Action Button */}
              <TouchableOpacity
                style={styles.mobileCtaBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setFabMenuVisible(false);
                  navigation.navigate('ResumeBook', { initialMode: 'talent_list' });
                }}
              >
                <Ionicons name="book-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.mobileCtaBtnText}>Browse Resume Book</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>

              {/* Secondary Mobile Link */}
              <TouchableOpacity
                style={styles.mobileSecondaryLink}
                onPress={() => {
                  setFabMenuVisible(false);
                  navigation.navigate('ResumeBook', { initialMode: 'get_listed' });
                }}
              >
                <Text style={styles.mobileSecondaryText}>
                  Job seeker? <Text style={styles.mobileSecondaryBold}>Get Listed in Resume Book →</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: theme.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.card,
    borderBottomWidth: 1.5,
    borderBottomColor: theme.cardBorder || theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  desktopSectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#059669' : '#A7F3D0',
  },
  desktopSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: isDarkMode ? '#34D399' : '#059669',
    letterSpacing: -0.2,
  },
  desktopCampusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
    borderWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
  },
  desktopCampusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  desktopCampusBadgeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.textSecondary || theme.textMuted || '#64748B',
  },
  header3DLogoPod: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#059669',
    borderWidth: 1,
    borderTopColor: '#34D399',
    borderLeftColor: '#10B981',
    borderRightColor: '#047857',
    borderBottomColor: '#064E3B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },
  headerBrandTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -0.3,
  },
  headerBrandSub: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textMuted,
    marginTop: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  headerIconBtn: {
    position: 'relative',
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
    borderWidth: 1.5,
    borderTopColor: isDarkMode ? '#475569' : '#FFFFFF',
    borderLeftColor: isDarkMode ? '#334155' : '#F8FAFC',
    borderRightColor: isDarkMode ? '#1E293B' : '#CBD5E1',
    borderBottomColor: isDarkMode ? '#0F172A' : '#94A3B8',
    borderBottomWidth: 3.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.45 : 0.16,
    shadowRadius: 5,
    elevation: 6,
  },
  headerIconBtnActive: {
    backgroundColor: '#059669',
    borderTopColor: '#34D399',
    borderLeftColor: '#10B981',
    borderRightColor: '#047857',
    borderBottomColor: '#064E3B',
    borderBottomWidth: 3.5,
    shadowColor: '#059669',
    shadowOpacity: 0.45,
  },
  icon3DGlyph: {
    textShadowColor: 'rgba(0, 0, 0, 0.28)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 2.5,
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
    backgroundColor: isDarkMode ? '#132A1E' : '#F0FDF4', 
    borderWidth: 1, 
    borderColor: isDarkMode ? '#059669' : '#A7F3D0',
  },
  tabText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: theme.textMuted, 
    marginLeft: 6,
  },
  tabTextActive: { 
    color: isDarkMode ? '#34D399' : '#047857', 
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
    backgroundColor: '#059669',
    borderColor: '#059669',
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
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 14, 
    borderWidth: 1, 
    borderColor: isDarkMode ? '#1E2E25' : '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: isDarkMode ? 0.2 : 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  logoBox: { 
    width: 46, 
    height: 46, 
    borderRadius: 12, 
    backgroundColor: isDarkMode ? '#132A1E' : '#DCFCE7', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? '#1B4D36' : '#A7F3D0',
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
    borderRadius: 8, 
    backgroundColor: isDarkMode ? '#132A1E' : '#F0FDF4',
    borderWidth: 1,
    borderColor: isDarkMode ? '#1B4D36' : '#A7F3D0',
  },
  tagText: { 
    fontSize: 11.5, 
    fontWeight: '600', 
    color: isDarkMode ? '#34D399' : '#047857',
  },
  cardActionRow: { 
    flexDirection: 'row', 
    marginTop: 16, 
    gap: 10,
  },
  easyApplyBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#059669', 
    paddingVertical: 9, 
    paddingHorizontal: 18, 
    borderRadius: 20,
    shadowColor: '#059669',
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
    backgroundColor: isDarkMode ? '#132A1E' : '#FFFFFF', 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 4, 
    elevation: 2,
    borderWidth: 1,
    borderColor: isDarkMode ? '#059669' : '#A7F3D0',
  },
  subTabText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: theme.textMuted,
  },
  subTabTextActive: { 
    color: isDarkMode ? '#34D399' : '#047857', 
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
    backgroundColor: isDarkMode ? '#132A1E' : '#DCFCE7', 
    borderWidth: 1, 
    borderColor: isDarkMode ? '#059669' : '#A7F3D0', 
    padding: 16, 
    borderRadius: 16, 
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
    backgroundColor: '#059669', 
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
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 14,
  },
  modalCard: { 
    backgroundColor: theme.card, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: isDarkMode ? '#2D3139' : theme.border, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.35, 
    shadowRadius: 16, 
    elevation: 10, 
    overflow: 'hidden',
  },
  modalCardDesktop: {
    width: '100%',
    maxWidth: 680,
    height: '88%',
    maxHeight: 740,
  },
  modalCardMobile: {
    width: '100%',
    height: '92%',
    maxHeight: 800,
  },
  modalTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.card,
  },
  modalHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDarkMode ? '#1E2025' : '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  modalBodyScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  detailsCompanyPod: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCompanyInitial: {
    fontSize: 22,
    fontWeight: '900',
  },
  detailsJobTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    lineHeight: 24,
  },
  detailsCompanySub: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 3,
  },
  detailsPillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  detailsMetricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1E2025' : '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isDarkMode ? '#2D3139' : '#E2E8F0',
  },
  detailsMetricPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
  },
  recruiterCard: {
    backgroundColor: isDarkMode ? '#132A1E' : '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#1B4D36' : '#A7F3D0',
  },
  recruiterCardHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: isDarkMode ? '#A7F3D0' : '#047857',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alumniReferralTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#064E3B' : '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  alumniReferralTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },
  recruiterAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#059669',
  },
  recruiterAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recruiterAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  recruiterName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: theme.text,
  },
  recruiterRole: {
    fontSize: 12,
    fontWeight: '600',
    color: isDarkMode ? '#34D399' : '#047857',
    marginTop: 1,
  },
  recruiterSub: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 1,
  },
  recruiterMsgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkMode ? '#1E2025' : '#FFFFFF',
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#2D3139' : '#A7F3D0',
  },
  recruiterMsgBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: isDarkMode ? '#34D399' : '#059669',
  },
  howYouMatchCard: {
    backgroundColor: isDarkMode ? '#1E2025' : '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#2D3139' : '#E2E8F0',
  },
  matchCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
  },
  matchPercentBadge: {
    backgroundColor: isDarkMode ? 'rgba(5, 150, 105, 0.2)' : '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#059669' : '#A7F3D0',
  },
  matchPercentBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: isDarkMode ? '#A7F3D0' : '#047857',
  },
  matchCardSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 17,
  },
  skillMatchedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#132A1E' : '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#1B4D36' : '#86EFAC',
  },
  skillMatchedText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDarkMode ? '#A7F3D0' : '#15803D',
  },
  skillMissingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#181A1F' : '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  skillMissingText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 8,
  },
  jobDescBody: {
    fontSize: 13.5,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  detailsStickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  detailsBookmarkBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1E2025' : '#F8FAFC',
  },
  detailsStickyApplyBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  detailsStickyApplyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  applyHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.card,
  },
  applyStepIndicatorText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.text,
  },
  progressTrack: {
    height: 4,
    backgroundColor: isDarkMode ? '#2D3139' : '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 2,
  },
  applyBodyScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  applicantMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: isDarkMode ? '#1E2025' : '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#2D3139' : '#E2E8F0',
  },
  applicantAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applicantAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  applicantMiniName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  applicantMiniSub: {
    fontSize: 11.5,
    color: theme.textMuted,
    marginTop: 1,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#132A1E' : '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isDarkMode ? '#1B4D36' : '#A7F3D0',
    marginTop: 4,
  },
  privacyBannerText: {
    flex: 1,
    fontSize: 11.5,
    color: isDarkMode ? '#A7F3D0' : '#047857',
    lineHeight: 16,
    fontWeight: '600',
  },
  applyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.card,
    gap: 12,
  },
  applySecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: isDarkMode ? '#1E2025' : '#FFFFFF',
  },
  applySecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  applyPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  applyPrimaryBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resumeOptionCardActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: isDarkMode ? '#132A1E' : '#F0FDF4',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#059669',
    marginBottom: 12,
  },
  radioSelectedDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelectedInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#059669',
  },
  resumeFileIconPod: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: isDarkMode ? '#282A30' : '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  resumeFileName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: theme.text,
  },
  resumeFileMeta: {
    fontSize: 11.5,
    color: theme.textMuted,
    marginTop: 2,
  },
  uploadResumeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#059669',
    borderRadius: 14,
    paddingVertical: 18,
    backgroundColor: isDarkMode ? 'rgba(5, 150, 105, 0.08)' : '#F0FDF4',
    marginBottom: 8,
  },
  uploadResumeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: isDarkMode ? '#34D399' : '#059669',
  },
  uploadResumeSub: {
    fontSize: 11.5,
    color: theme.textMuted,
    marginTop: 2,
  },
  educationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: isDarkMode ? '#1E2025' : '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: isDarkMode ? '#2D3139' : '#E2E8F0',
  },
  educationIconPod: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: isDarkMode ? '#132A1E' : '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  educationSchool: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
  },
  educationDegree: {
    fontSize: 12.5,
    color: theme.textSecondary,
    marginTop: 2,
  },
  verifiedAlumniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: isDarkMode ? '#132A1E' : '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  verifiedAlumniPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },
  keywordFitNotice: {
    backgroundColor: isDarkMode ? '#132A1E' : '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#1B4D36' : '#A7F3D0',
  },
  keywordFitNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: isDarkMode ? '#A7F3D0' : '#047857',
  },
  keywordFitNoticeCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  keywordPillGreen: {
    backgroundColor: isDarkMode ? '#064E3B' : '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  keywordPillGreenText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: isDarkMode ? '#A7F3D0' : '#15803D',
  },
  questionBlock: {
    marginBottom: 18,
  },
  questionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 10,
    lineHeight: 18,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  questionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: isDarkMode ? '#1E2025' : '#F1F5F9',
    borderWidth: 1,
    borderColor: isDarkMode ? '#2D3139' : '#E2E8F0',
  },
  questionChipSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  questionChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  questionChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  reviewCard: {
    backgroundColor: isDarkMode ? '#1E2025' : '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: isDarkMode ? '#2D3139' : '#E2E8F0',
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingBottom: 6,
  },
  reviewCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.textMuted,
    textTransform: 'uppercase',
  },
  reviewEditLink: {
    fontSize: 13,
    fontWeight: '700',
    color: isDarkMode ? '#34D399' : '#059669',
  },
  reviewValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  reviewValueSub: {
    fontSize: 12.5,
    color: theme.textSecondary,
    marginTop: 2,
  },
  reviewLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: theme.textMuted,
  },
  followCompanyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1E2025' : '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: isDarkMode ? '#2D3139' : '#E2E8F0',
  },
  followCompanyPod: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followCompanyTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: theme.text,
  },
  followCompanySub: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 1,
  },
  disclaimerText: {
    fontSize: 11.5,
    color: theme.textMuted,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIconPod: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSub: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 340,
  },
  successRecruiterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: isDarkMode ? '#132A1E' : '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#1B4D36' : '#A7F3D0',
  },
  successRecruiterAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: isDarkMode ? '#064E3B' : '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successRecruiterName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: isDarkMode ? '#A7F3D0' : '#047857',
  },
  successRecruiterRole: {
    fontSize: 11.5,
    color: theme.textSecondary,
    marginTop: 1,
  },
  successDetailsBox: {
    width: '100%',
    backgroundColor: isDarkMode ? '#1E2025' : '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: isDarkMode ? '#2D3139' : '#E2E8F0',
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  successRowLabel: {
    fontSize: 12.5,
    color: theme.textMuted,
    fontWeight: '600',
  },
  successRowVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.text,
  },
  successTrackerBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  successTrackerBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  successDoneBtn: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: isDarkMode ? '#1E2025' : '#FFFFFF',
  },
  successDoneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  companyLogoPod: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  companyLogoText: {
    fontSize: 20,
    fontWeight: '900',
  },
  alumniBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#132A1E' : '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: isDarkMode ? '#1B4D36' : '#A7F3D0',
  },
  alumniBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: isDarkMode ? '#A7F3D0' : '#047857',
  },
  easyApplyTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(5, 150, 105, 0.15)' : '#F0FDF4',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: isDarkMode ? '#059669' : '#86EFAC',
  },
  easyApplyTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: isDarkMode ? '#34D399' : '#059669',
  },
  matchScoreBanner: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: isDarkMode ? 'rgba(5, 150, 105, 0.15)' : '#F0FDF4', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8, 
    marginTop: 8, 
    alignSelf: 'flex-start', 
    borderWidth: 1, 
    borderColor: isDarkMode ? '#059669' : '#A7F3D0',
  },
  matchScoreText: {
    fontSize: 11.5, 
    fontWeight: '700', 
    color: isDarkMode ? '#A7F3D0' : '#047857',
  },
  keywordFilterChip: {
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 16, 
    backgroundColor: isDarkMode ? '#1E2025' : '#F1F5F9', 
    marginRight: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#2D3139' : '#E2E8F0',
  },
  keywordFilterChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  keywordFilterChipEasyApply: {
    borderColor: '#059669',
  },
  keywordFilterChipText: {
    fontSize: 12, 
    fontWeight: '600', 
    color: theme.textSecondary,
  },
  keywordFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Bottom Right Floating Hamburger Menu Styles
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 999,
  },
  fabPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: isDarkMode ? '#064E3B' : '#059669',
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#34D399' : '#A7F3D0',
  },
  fabPillButtonText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  fabBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  resumeShowcaseCard: {
    position: 'absolute',
    width: 340,
    backgroundColor: theme.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#059669' : '#A7F3D0',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 14,
    overflow: 'hidden',
  },
  showcaseTopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: isDarkMode ? '#064E3B' : '#047857',
  },
  showcaseIconPod: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  showcaseBrandTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  showcaseOfficialBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  showcaseOfficialBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  showcaseBrandSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DCFCE7',
  },
  showcaseCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  showcaseBody: {
    padding: 16,
  },
  showcaseTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  showcasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#132A1E' : '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#1B4D36' : '#A7F3D0',
  },
  showcasePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: isDarkMode ? '#34D399' : '#047857',
  },
  showcaseStatText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
  },
  showcaseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
  },
  showcaseSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  showcaseMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 12,
  },
  showcaseMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  showcaseMetricValue: {
    fontSize: 14,
    fontWeight: '900',
    color: isDarkMode ? '#34D399' : '#047857',
  },
  showcaseMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textMuted,
    marginTop: 1,
  },
  showcaseMetricDivider: {
    width: 1,
    height: 22,
    backgroundColor: theme.border,
  },
  spotlightCard: {
    backgroundColor: isDarkMode ? '#132A1E' : '#F0FDF4',
    borderWidth: 1,
    borderColor: isDarkMode ? '#1B4D36' : '#A7F3D0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  spotlightAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotlightAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  spotlightName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: theme.text,
  },
  spotlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  spotlightDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },
  spotlightBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  spotlightRole: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 1,
  },
  spotlightSkillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  spotlightSkillChip: {
    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
  },
  spotlightSkillText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  showcaseCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  showcaseCtaBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  showcaseSecondaryLink: {
    marginTop: 10,
    alignItems: 'center',
  },
  showcaseSecondaryText: {
    fontSize: 11.5,
    color: theme.textMuted,
  },
  showcaseSecondaryLinkBold: {
    fontWeight: '800',
    color: isDarkMode ? '#34D399' : '#059669',
  },
  // Mobile Specific Responsive Styles
  fabPillButtonMobile: {
    height: 40,
    paddingHorizontal: 12,
    gap: 6,
  },
  fabPillButtonTextMobile: {
    fontSize: 12,
  },
  mobileSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  mobileBottomSheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: isDarkMode ? '#475569' : '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  mobileSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mobileIconPod: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: isDarkMode ? '#132A1E' : '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? '#1B4D36' : '#A7F3D0',
  },
  mobileSheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.text,
  },
  mobileSheetSub: {
    fontSize: 11.5,
    color: theme.textMuted,
    marginTop: 1,
  },
  mobileCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobilePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  mobilePillBadge: {
    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
  },
  mobilePillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: isDarkMode ? '#94A3B8' : '#475569',
  },
  mobileSheetDesc: {
    fontSize: 12.5,
    color: theme.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  mobileCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  mobileCtaBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mobileSecondaryLink: {
    marginTop: 12,
    alignItems: 'center',
  },
  mobileSecondaryText: {
    fontSize: 12,
    color: theme.textMuted,
  },
  mobileSecondaryBold: {
    fontWeight: '800',
    color: isDarkMode ? '#34D399' : '#059669',
  },
});

export default JobsScreen;

