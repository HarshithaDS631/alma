import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
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
  useWindowDimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getImageUrl } from '../services/uploadService';
import { 
  getSuggestions, 
  getUsers, 
  sendConnectionRequest, 
  getConnectionRequests, 
  acceptConnectionRequest, 
  declineConnectionRequest,
  toggleFollowUser,
  getFollowing 
} from '../services/authService';
import useUserRole from '../hooks/useUserRole';
import getInitials from '../lib/getInitials';
import InstagramProfileShareModal from '../components/InstagramProfileShareModal';

// ─── Exact RVCE AlmaConnect Filter Definitions & Counts ───────────────
const ALMACONNECT_STATS = {
  totalRvians: '9,931',
  alumni: '9,655',
  students: '165',
  faculty: '110',
  official: '1',
  myBatch: '4'
};

const MEMBER_TYPES = [
  { id: 'all', label: 'All Member Type', count: '9,931' },
  { id: 'alumni', label: 'Alumni', count: '9,655' },
  { id: 'student', label: 'Students', count: '165' },
  { id: 'faculty', label: 'Faculty', count: '110' },
  { id: 'my_batch', label: 'My Batch', count: '4' }
];

const ALMACONNECT_COURSES = [
  { id: 'all', label: 'All Course', count: '9,931' },
  { id: 'BE', label: 'BE', count: '4,302' },
  { id: 'B.E / B.Tech', label: 'B.E / B.Tech', count: '2,761' },
  { id: 'M.Tech.', label: 'M.Tech.', count: '981' },
  { id: 'Bachelor of Engineering', label: 'Bachelor of Engineering', count: '749' },
  { id: 'MCA', label: 'MCA', count: '615' },
  { id: 'B.Tech.', label: 'B.Tech.', count: '165' },
  { id: 'Ph.D.', label: 'Ph.D.', count: '12' },
  { id: 'M.Sc.', label: 'M.Sc.', count: '2' }
];

const ALMACONNECT_GRADUATION_YEARS = [
  { id: 'all', label: 'All Graduation Year', count: '9,931' },
  { id: '2026', label: '2026', count: '184' },
  { id: '2025', label: '2025', count: '195' },
  { id: '2024', label: '2024', count: '210' },
  { id: '2023', label: '2023', count: '310' },
  { id: '2022', label: '2022', count: '1,409' },
  { id: '2021', label: '2021', count: '480' },
  { id: '2020', label: '2020', count: '704' },
  { id: '2019', label: '2019', count: '563' },
  { id: '2018', label: '2018', count: '520' },
  { id: '2017', label: '2017', count: '609' },
  { id: '2016', label: '2016', count: '607' },
  { id: '2015', label: '2015', count: '450' },
  { id: '2012', label: '2012', count: '410' },
  { id: '2007', label: '2007', count: '290' },
  { id: '2006', label: '2006', count: '280' },
  { id: '1990', label: '1990', count: '50' }
];

const ALMACONNECT_LOCATIONS = [
  { id: 'all', label: 'All Location', count: '9,931' },
  { id: 'Bangalore', label: 'Bangalore', count: '3,612' },
  { id: 'Mumbai', label: 'Mumbai', count: '104' },
  { id: 'Hyderabad', label: 'Hyderabad', count: '102' },
  { id: 'New Delhi', label: 'New Delhi', count: '80' },
  { id: 'Pune', label: 'Pune', count: '71' },
  { id: 'Gurgaon', label: 'Gurgaon', count: '45' },
  { id: 'United States', label: 'United States', count: '709' },
  { id: 'Germany', label: 'Germany', count: '84' },
  { id: 'Canada', label: 'Canada', count: '60' },
  { id: 'United Kingdom', label: 'United Kingdom', count: '58' }
];

const ALMACONNECT_SPECIALIZED_LISTS = [
  { id: 'eng_non_it', title: 'Engineering (Non-IT) Professionals', count: '549 People', icon: 'construct' },
  { id: 'sales_biz', title: 'Sales / Business Professionals', count: '504 People', icon: 'trending-up' },
  { id: 'tech_mgrs', title: 'Technical Managers', count: '347 People', icon: 'briefcase' },
  { id: 'teaching', title: 'Teaching & Training Professionals', count: '241 People', icon: 'school' },
  { id: 'it_admin', title: 'IT Admin & Support Professionals', count: '97 People', icon: 'hardware-chip' },
  { id: 'java', title: 'Java Professionals', count: '67 People', icon: 'code-slash' },
  { id: 'design', title: 'Designers and Artists', count: '61 People', icon: 'color-palette' },
  { id: 'data_science', title: 'Data Science / ML Professionals', count: '46 People', icon: 'analytics' },
  { id: 'hr_admin', title: 'HR & Admin Professionals', count: '27 People', icon: 'people' },
  { id: 'talent_acq', title: 'Talent Acquisition Professionals', count: '10 People', icon: 'search' },
  { id: 'mktg_mgr', title: 'Marketing Management Professionals', count: '10 People', icon: 'megaphone' }
];

// ─── Exact RVCE AlmaConnect Extracted Directory Member Profiles ───────
const EXACT_RVCE_ALMACONNECT_MEMBERS = [
  {
    _id: 'alma_1',
    id: 'alma_1',
    name: 'Sharat Chowka',
    batchYear: '2007',
    batchFormatted: "BE '07",
    degree: 'BE',
    memberType: 'alumni',
    role: 'Structural Engineer at ELEVATE DESIGN HOUSE',
    company: 'ELEVATE DESIGN HOUSE',
    designation: 'Structural Engineer',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/sharat-chowka',
    tags: ['Civil', 'Structural Engineering', 'CAD']
  },
  {
    _id: 'alma_2',
    id: 'alma_2',
    name: 'Shreesha Kumara',
    batchYear: '2026',
    batchFormatted: "B.E / B.Tech '26",
    degree: 'B.E / B.Tech',
    memberType: 'alumni',
    role: 'Instrumentation and Controls Trainee at SBM Offshore',
    company: 'SBM Offshore',
    designation: 'Instrumentation and Controls Trainee',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/shreesha-kumara',
    tags: ['Instrumentation', 'Controls', 'Offshore']
  },
  {
    _id: 'alma_3',
    id: 'alma_3',
    name: 'B P Swathi',
    batchYear: '2026',
    batchFormatted: "M.Tech. '26",
    degree: 'M.Tech.',
    memberType: 'alumni',
    role: 'Design Engineer at onsemi',
    company: 'onsemi',
    designation: 'Design Engineer',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/b-p-swathi',
    tags: ['Semiconductor', 'VLSI', 'Design']
  },
  {
    _id: 'alma_4',
    id: 'alma_4',
    name: 'ANIL DARGA',
    batchYear: '2025',
    batchFormatted: "B.E / B.Tech '25",
    degree: 'B.E / B.Tech',
    memberType: 'alumni',
    role: 'Manufacturing engineer at Ultraviolette Automative',
    company: 'Ultraviolette Automotive',
    designation: 'Manufacturing Engineer',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/anil-darga',
    tags: ['EV', 'Manufacturing', 'Automotive']
  },
  {
    _id: 'alma_5',
    id: 'alma_5',
    name: 'Divyanshu Raj',
    batchYear: '2026',
    batchFormatted: "B.E / B.Tech '26",
    degree: 'B.E / B.Tech',
    memberType: 'alumni',
    role: 'BTSA at ZS Associates',
    company: 'ZS Associates',
    designation: 'BTSA',
    location: 'Gurgaon, India',
    city: 'Gurgaon',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/divyanshu-raj-25',
    tags: ['Analytics', 'Consulting', 'ZS']
  },
  {
    _id: 'alma_6',
    id: 'alma_6',
    name: 'RISHAV KUMAR',
    batchYear: '2026',
    batchFormatted: "B.E / B.Tech '26",
    degree: 'B.E / B.Tech',
    memberType: 'student',
    role: 'Student at RV College of Engineering',
    company: 'RVCE',
    designation: 'Student',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/rishav-kumar-205',
    tags: ['Student', 'Engineering', 'RVCE']
  },
  {
    _id: 'alma_7',
    id: 'alma_7',
    name: 'Jayatheertha SG',
    batchYear: '2026',
    batchFormatted: "B.E / B.Tech '26",
    degree: 'B.E / B.Tech',
    memberType: 'alumni',
    role: 'Graduate Engineer Trainee at L&T Energy Hydrocarbon',
    company: 'L&T Energy Hydrocarbon',
    designation: 'Graduate Engineer Trainee',
    location: 'Mumbai, India',
    city: 'Mumbai',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/jayatheertha-sg',
    tags: ['Energy', 'L&T', 'Mechanical']
  },
  {
    _id: 'alma_8',
    id: 'alma_8',
    name: 'Pratham Pujari',
    batchYear: '2030',
    batchFormatted: "B.E / B.Tech '30",
    degree: 'B.E / B.Tech',
    memberType: 'student',
    role: 'Student at RV College of Engineering',
    company: 'RVCE',
    designation: 'Student',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/pratham-pujari',
    tags: ['Student', 'Future Alum', 'RVCE']
  },
  {
    _id: 'alma_9',
    id: 'alma_9',
    name: 'SHASHANKA H A',
    batchYear: '2026',
    batchFormatted: "BE '26",
    degree: 'BE',
    memberType: 'alumni',
    role: 'Mechanical Engineering Graduate | Aspiring Design Engineer | CAD & Product Development',
    company: 'Design & Engineering Innovation Hub',
    designation: 'Design Engineer',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/shashanka-h-a',
    tags: ['CAD', 'Automotive', 'Product Innovation']
  },
  {
    _id: 'alma_10',
    id: 'alma_10',
    name: 'Tushar Arora',
    batchYear: '2025',
    batchFormatted: "B.E / B.Tech '25",
    degree: 'B.E / B.Tech',
    memberType: 'alumni',
    role: 'SDE-1 @ Procore | Ex-Truva | 3x ACM-ICPC Asia-West Regionalist | Knight @Leetcode | Google DSC Lead',
    company: 'Procore Technologies',
    designation: 'Software Development Engineer I',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/tushar-arora-155',
    tags: ['Algorithms', 'SDE', 'ACM-ICPC', 'Leetcode']
  },
  {
    _id: 'alma_11',
    id: 'alma_11',
    name: 'Ayush Ojha',
    batchYear: '2026',
    batchFormatted: "BE '26",
    degree: 'BE',
    memberType: 'alumni',
    role: 'DevOps Engineer @ IDFC FIRST Bank | Network Automation',
    company: 'IDFC FIRST Bank',
    designation: 'DevOps Engineer',
    location: 'Mumbai, India',
    city: 'Mumbai',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/ayush-ojha-11',
    tags: ['DevOps', 'FinTech', 'Cloud']
  },
  {
    _id: 'alma_12',
    id: 'alma_12',
    name: 'Tanisha Das',
    batchYear: '2026',
    batchFormatted: "B.E / B.Tech '26",
    degree: 'B.E / B.Tech',
    memberType: 'alumni',
    role: 'GET–R&D at PICL Pvt. Ltd. (Amber Group)',
    company: 'PICL Pvt. Ltd. (Amber Group)',
    designation: 'GET - R&D',
    location: 'New Delhi, India',
    city: 'New Delhi',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/tanisha-das-8',
    tags: ['R&D', 'Manufacturing', 'Amber Group']
  },
  {
    _id: 'alma_13',
    id: 'alma_13',
    name: 'Lalit Makam',
    batchYear: '2012',
    batchFormatted: "B.E / B.Tech '12",
    degree: 'B.E / B.Tech',
    memberType: 'alumni',
    role: 'Lead Manager at Ola Electric (ANI Technologies Pvt. Ltd)',
    company: 'Ola Electric',
    designation: 'Lead Manager',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/lalit-makam-1',
    tags: ['EV Mobility', 'Ola', 'Lead Manager']
  },
  {
    _id: 'alma_14',
    id: 'alma_14',
    name: 'Nikhil Ranjan Sinha',
    batchYear: '2006',
    batchFormatted: "BE '06",
    degree: 'BE',
    memberType: 'alumni',
    role: 'Assistant Consultant at Tata Consultancy Services (TCS)',
    company: 'Tata Consultancy Services',
    designation: 'Assistant Consultant',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/nikhil-ranjan-sinha-4',
    tags: ['TCS', 'Consulting', 'Enterprise IT']
  },
  {
    _id: 'alma_15',
    id: 'alma_15',
    name: 'Pranav Deshpande',
    batchYear: '2026',
    batchFormatted: "BE '26",
    degree: 'BE',
    memberType: 'alumni',
    role: 'Associate Structural Engineer @ Airbus',
    company: 'Airbus',
    designation: 'Associate Structural Engineer',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/pranav-deshpande-69',
    tags: ['Aerospace', 'Airbus', 'Structural Analysis']
  },
  {
    _id: 'alma_16',
    id: 'alma_16',
    name: 'ANIRUDH R SHARMA',
    batchYear: '2026',
    batchFormatted: "B.E / B.Tech '26",
    degree: 'B.E / B.Tech',
    memberType: 'alumni',
    role: 'Systems Engineer at Morphing Machines',
    company: 'Morphing Machines',
    designation: 'Systems Engineer',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/anirudh-r-sharma',
    tags: ['Processors', 'Silicon', 'Systems Engg']
  },
  {
    _id: 'alma_17',
    id: 'alma_17',
    name: 'Akshat',
    batchYear: '2026',
    batchFormatted: "BE '26",
    degree: 'BE',
    memberType: 'alumni',
    role: 'AI/ML Engineer | Ex-Intern @ L&T Technology Services',
    company: 'L&T Technology Services',
    designation: 'AI/ML Engineer',
    location: 'Greater Noida, India',
    city: 'Greater Noida',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/akshat-754',
    tags: ['AI/ML', 'Computer Vision', 'Deep Learning']
  },
  {
    _id: 'alma_18',
    id: 'alma_18',
    name: 'udaya lakshmi',
    batchYear: '2017',
    batchFormatted: "BE '17",
    degree: 'BE',
    memberType: 'faculty',
    role: 'Assistant Professor at Bangalore Institute of Technology',
    company: 'Bangalore Institute of Technology',
    designation: 'Assistant Professor',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/udaya-lakshmi-14',
    tags: ['Academia', 'Research', 'Teaching']
  },
  {
    _id: 'alma_19',
    id: 'alma_19',
    name: 'BEHARA LALIT SAKETH',
    batchYear: '2022',
    batchFormatted: "BE '22",
    degree: 'BE',
    memberType: 'alumni',
    role: 'Software Development Engineer @ Cisco',
    company: 'Cisco Systems',
    designation: 'Software Development Engineer',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/behara-lalit-saketh',
    tags: ['Networking', 'Cloud', 'Cisco']
  },
  {
    _id: 'alma_20',
    id: 'alma_20',
    name: 'Ananth M Athreya',
    batchYear: '2026',
    batchFormatted: "BE '26",
    degree: 'BE',
    memberType: 'alumni',
    role: 'SE-1 @ Zebra Technologies | RVCE AIML',
    company: 'Zebra Technologies',
    designation: 'Software Engineer I',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/ananth-m-athreya',
    tags: ['AIML', 'Zebra Tech', 'Computer Science']
  },
  {
    _id: 'alma_21',
    id: 'alma_21',
    name: 'Sumit Kumar',
    batchYear: '2016',
    batchFormatted: "BE '16",
    degree: 'BE',
    memberType: 'alumni',
    role: 'Manager at PwC Acceleration Center',
    company: 'PwC Acceleration Center',
    designation: 'Manager',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/sumit-kumar-3872',
    tags: ['PwC', 'Manager', 'Financial Advisory']
  },
  {
    _id: 'alma_22',
    id: 'alma_22',
    name: 'KUSHAL ARVIND O',
    batchYear: '2029',
    batchFormatted: "BE '29",
    degree: 'BE',
    memberType: 'student',
    role: 'Student at RV College of Engineering',
    company: 'RVCE',
    designation: 'Student',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/kushal-arvind-o',
    tags: ['Student', 'Engineering', 'RVCE']
  },
  {
    _id: 'alma_23',
    id: 'alma_23',
    name: 'Srujan Kalagi',
    batchYear: '2026',
    batchFormatted: "B.E / B.Tech '26",
    degree: 'B.E / B.Tech',
    memberType: 'alumni',
    role: 'Systems Engineer @ Boeing',
    company: 'The Boeing Company',
    designation: 'Systems Engineer',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/srujan-kalagi',
    tags: ['Aerospace', 'Boeing', 'Systems']
  },
  {
    _id: 'alma_24',
    id: 'alma_24',
    name: 'Arsh Srivastava',
    batchYear: '2030',
    batchFormatted: "B.E / B.Tech '30",
    degree: 'B.E / B.Tech',
    memberType: 'student',
    role: 'Student at RV College of Engineering',
    company: 'RVCE',
    designation: 'Student',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/arsh-srivastava-2',
    tags: ['Student', 'Innovator', 'RVCE']
  },
  {
    _id: 'alma_25',
    id: 'alma_25',
    name: 'Anil Kumble',
    batchYear: '1990',
    batchFormatted: "BE '90",
    degree: 'BE',
    memberType: 'alumni',
    role: 'Former Captain Indian Cricket Team | Co-Founder Spektacom Technologies',
    company: 'Spektacom Technologies',
    designation: 'Distinguished Alumnus & Founder',
    location: 'Bangalore, India',
    city: 'Bangalore',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&h=200&q=80',
    profileSlug: '/profiles/anil-kumble',
    tags: ['Sports Tech', 'Leadership', 'Hall of Fame']
  }
];

const DEFAULT_WHATSAPP_COMMUNITIES = [
  {
    id: 'comm_rvce_global',
    name: 'RVCE Alumni Global Community',
    institution: 'RV College of Engineering',
    description: 'Official global community connecting 45,000+ alumni, faculty, and research fellows worldwide.',
    membersCount: '4,850 Members • Official Community',
    avatar_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=200&h=200&q=80',
    announcement: {
      id: 'ann_rvce_1',
      name: 'Announcements',
      lastMessage: '📢 Annual Alumni Homecoming 2026 dates announced! Registrations are now open on the portal.',
      time: 'Yesterday',
      unread: true,
    },
    groups: [
      { id: 'grp_rvce_gen', name: 'General Alumni Chat', icon: 'chatbubbles', lastSender: 'Suresh N.', lastMessage: 'Great catching up at the tech symposium!', time: '11:45 AM', unreadCount: 3 },
      { id: 'grp_rvce_jobs', name: 'Jobs & Referral Pipeline', icon: 'briefcase', lastSender: 'Pooja Hegde', lastMessage: 'Hiring 4 Senior Fullstack Engineers at NVIDIA Bangalore.', time: '10:15 AM', unreadCount: 6 },
      { id: 'grp_rvce_tech', name: 'Tech, AI & Innovation Hub', icon: 'code-slash', lastSender: 'Vikram Sethi', lastMessage: 'Anyone experimenting with local LLM deployments?', time: 'Yesterday', unreadCount: 0 },
      { id: 'grp_rvce_blr', name: 'Bengaluru Chapter & Meetups', icon: 'location', lastSender: 'Ananya S.', lastMessage: 'Sunday campus breakfast meetup confirmed at 9:30 AM.', time: 'Sep 23', unreadCount: 0 },
    ]
  },
  {
    id: 'comm_rv_entrepreneurs',
    name: 'RV Alumni Founders & Angels',
    institution: 'RV Educational Institutions',
    description: 'Venture network for alumni founders, startup operators, angels, and technology executives.',
    membersCount: '1,320 Members • Verified Network',
    avatar_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=200&h=200&q=80',
    announcement: {
      id: 'ann_rv_found_1',
      name: 'Announcements',
      lastMessage: '🚀 RSST Innovation Grant 2026: Up to ₹25 Lakhs non-dilutive grant for alumni startups.',
      time: 'Sep 21',
      unread: false,
    },
    groups: [
      { id: 'grp_found_pitch', name: 'Pitch Decks & Feedback', icon: 'rocket', lastSender: 'Rahul V.', lastMessage: 'Launched on Product Hunt today! Would love your upvotes.', time: '9:30 AM', unreadCount: 2 },
      { id: 'grp_found_mentors', name: 'Angel Mentorship & Advisory', icon: 'bulb', lastSender: 'Karthik Raja', lastMessage: 'Hosting office hours for early-stage B2B SaaS this Friday.', time: 'Sep 22', unreadCount: 0 },
    ]
  }
];

const DirectoryScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { isAdminOrSuper, userRole, userInstitution } = useUserRole();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;

  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState(route?.params?.tab || 'directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState([]);
  const [dbAlumni, setDbAlumni] = useState([]);
  const [sentConnectMap, setSentConnectMap] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [followingMap, setFollowingMap] = useState({});
  const [sharedAlumni, setSharedAlumni] = useState(null);
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  // ─── Exact RVCE AlmaConnect Active Filters ───────────────────────────
  const [selectedMemberType, setSelectedMemberType] = useState('all'); // 'all', 'alumni', 'student', 'faculty', 'my_batch'
  const [selectedCourse, setSelectedCourse] = useState('all'); // 'BE', 'B.E / B.Tech', etc.
  const [selectedGraduationYear, setSelectedGraduationYear] = useState('all'); // '2022', '2020', etc.
  const [selectedLocation, setSelectedLocation] = useState('all'); // 'Bangalore', etc.
  const [selectedSpecializedList, setSelectedSpecializedList] = useState(null);
  const [viewMode, setViewMode] = useState('batch_wise'); // 'batch_wise' or 'all_cards'
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [collapsedBatches, setCollapsedBatches] = useState({});

  React.useEffect(() => {
    if (route?.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route?.params?.tab]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('userInfo').then(str => {
        if (str) {
          const parsed = JSON.parse(str);
          setCurrentUser(parsed);
          setCurrentUserId(parsed._id || parsed.id);
        }
      }).catch(() => {});
    }, [])
  );

  const fetchConnectionRequests = async () => {
    try {
      const res = await getConnectionRequests().catch(() => []);
      if (Array.isArray(res)) {
        const formatted = res.map((req) => {
          const sender = req.sender || {};
          return {
            id: req._id,
            senderId: sender._id,
            name: sender.name || 'Alumni Member',
            subtitle: `${sender.department || sender.branch || 'Alumni'} • ${sender.institution || ''} (Batch ${sender.batchYear || 'N/A'})`.trim(),
            initials: getInitials(sender.name),
            color: '#0F2744',
            createdAt: req.createdAt
          };
        });
        setRequests(formatted);
      }
    } catch (err) {
      console.log('Error fetching connection requests:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingDirectory(true);
      let institution = userInstitution;
      if (!institution) {
        try {
          const raw = await AsyncStorage.getItem('userInfo');
          if (raw) institution = JSON.parse(raw)?.institution || '';
        } catch (_) {}
      }

      // Load cached directory first
      try {
        const cached = await AsyncStorage.getItem('cachedDirectory_' + (institution || 'all'));
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDbAlumni(parsed);
          }
        }
      } catch (_) {}

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3500));
      const params = institution ? { institution } : {};
      
      const fetchPromise = getUsers(params);
      let res = await Promise.race([fetchPromise, timeoutPromise]).catch(() => null);

      if (!Array.isArray(res) || res.length === 0) {
        const suggPromise = getSuggestions();
        res = await Promise.race([suggPromise, timeoutPromise]).catch(() => null);
      }

      if (Array.isArray(res) && res.length > 0) {
        setDbAlumni(res);
        AsyncStorage.setItem('cachedDirectory_' + (institution || 'all'), JSON.stringify(res)).catch(() => {});
      }
    } catch (err) {
      console.warn('[Directory] fetch error:', err?.message);
    } finally {
      setLoadingDirectory(false);
    }
  };

  const fetchFollowingData = async () => {
    try {
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        setCurrentUserId(userInfo._id || userInfo.id);
      }
      
      const map = {};
      const profileCacheStr = await AsyncStorage.getItem('profileCache');
      if (profileCacheStr) {
        try {
          const cache = JSON.parse(profileCacheStr);
          if (Array.isArray(cache.followingList)) {
            cache.followingList.forEach(u => {
              const idStr = String(u.id || u._id || '');
              if (idStr) map[idStr] = true;
              if (u.name) map[u.name.toLowerCase().trim()] = true;
            });
          }
        } catch (_) {}
      }

      const followingData = await getFollowing().catch(() => []);
      if (Array.isArray(followingData)) {
        followingData.forEach(u => {
          const idStr = String(u._id || u.id || '');
          if (idStr) map[idStr] = true;
          if (u.name) map[u.name.toLowerCase().trim()] = true;
        });
      }
      setFollowingMap(map);
    } catch (err) {
      console.log('Error fetching following data:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
      fetchConnectionRequests();
      fetchFollowingData();
    }, [])
  );

  useEffect(() => {
    fetchUsers();
    fetchConnectionRequests();
    fetchFollowingData();
  }, []);

  // ─── Merged Directory of Exact RVCE Members + Real Registered Users ──
  const unifiedDirectory = useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. Exact RVCE AlmaConnect Directory Extracted Listings
    EXACT_RVCE_ALMACONNECT_MEMBERS.forEach((item) => {
      const key = item.name.toLowerCase().trim();
      seen.add(key);
      list.push({
        ...item,
        initials: getInitials(item.name),
        institution: 'RV College of Engineering',
        color: '#002B5C'
      });
    });

    // 2. Real Registered Users from Database
    dbAlumni.forEach((u, i) => {
      const uid = String(u._id || u.id || `reg_${i}`);
      const role = (u.role || '').toLowerCase().trim();
      const isAdminRole = role.includes('admin');
      const isSelf = currentUserId && uid && String(uid) === String(currentUserId);
      if (isAdminRole || isSelf || u.is_approved === false) return;

      const rawYear = u.batchYear || u.batch_year || u.batch || '';
      let parsedYear = '2023';
      if (rawYear) {
        const match = String(rawYear).match(/\b(19\d{2}|20\d{2})\b/);
        if (match) parsedYear = match[1];
        else parsedYear = String(rawYear);
      }

      const nameKey = (u.name || '').toLowerCase().trim();
      if (!seen.has(nameKey)) {
        seen.add(nameKey);
        list.push({
          _id: uid,
          id: uid,
          name: u.name || 'Alumni Member',
          batchYear: parsedYear,
          batchFormatted: `BE '${parsedYear.slice(-2)}`,
          degree: u.degree || 'BE',
          memberType: 'alumni',
          role: u.designation || (u.company ? `Engineer at ${u.company}` : 'Alumni Member'),
          company: u.company || u.organization || 'RVCE Alumni Network',
          designation: u.designation || 'Alumni Member',
          location: u.location || u.city || 'Bangalore, India',
          city: u.city || 'Bangalore',
          avatar_url: u.avatar_url || u.profilePicture || '',
          profileSlug: `/profiles/${(u.name || 'member').toLowerCase().replace(/\s+/g, '-')}`,
          initials: getInitials(u.name || 'Alumni Member'),
          institution: u.institution || 'RV College of Engineering',
          color: '#002B5C',
          tags: ['RVCE Alum', 'Network']
        });
      }
    });

    return list;
  }, [dbAlumni, currentUserId]);

  // ─── Filter Logic ─────────────────────────────────────────────────────
  const filteredDirectory = useMemo(() => {
    return unifiedDirectory.filter((member) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (member.name || '').toLowerCase().includes(q);
        const matchesRole = (member.role || '').toLowerCase().includes(q);
        const matchesCompany = (member.company || '').toLowerCase().includes(q);
        const matchesYear = (member.batchYear || '').includes(q);
        const matchesLoc = (member.location || '').toLowerCase().includes(q);
        const matchesTags = (member.tags || []).some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesRole && !matchesCompany && !matchesYear && !matchesLoc && !matchesTags) {
          return false;
        }
      }

      // 2. Member Type Filter
      if (selectedMemberType !== 'all') {
        if (selectedMemberType === 'my_batch') {
          const myYear = currentUser?.batchYear || currentUser?.batch_year || '2023';
          if (String(member.batchYear) !== String(myYear)) return false;
        } else if (member.memberType !== selectedMemberType) {
          return false;
        }
      }

      // 3. Course Filter
      if (selectedCourse !== 'all') {
        const deg = (member.degree || '').toLowerCase();
        const target = selectedCourse.toLowerCase();
        if (!deg.includes(target) && !target.includes(deg)) return false;
      }

      // 4. Graduation Year Filter
      if (selectedGraduationYear !== 'all') {
        if (String(member.batchYear) !== String(selectedGraduationYear)) return false;
      }

      // 5. Location Filter
      if (selectedLocation !== 'all') {
        const locLower = selectedLocation.toLowerCase();
        const memberLoc = (member.location || member.city || '').toLowerCase();
        if (!memberLoc.includes(locLower)) return false;
      }

      // 6. Specialized List Filter
      if (selectedSpecializedList) {
        const listObj = ALMACONNECT_SPECIALIZED_LISTS.find(l => l.id === selectedSpecializedList);
        if (listObj) {
          const roleLower = (member.role || '').toLowerCase();
          if (selectedSpecializedList === 'eng_non_it') {
            if (!roleLower.includes('engineer') && !roleLower.includes('mechanical') && !roleLower.includes('civil') && !roleLower.includes('structural')) return false;
          } else if (selectedSpecializedList === 'sales_biz') {
            if (!roleLower.includes('manager') && !roleLower.includes('sales') && !roleLower.includes('business') && !roleLower.includes('consultant')) return false;
          } else if (selectedSpecializedList === 'tech_mgrs') {
            if (!roleLower.includes('manager') && !roleLower.includes('lead') && !roleLower.includes('director')) return false;
          } else if (selectedSpecializedList === 'teaching') {
            if (!roleLower.includes('professor') && !roleLower.includes('faculty') && !roleLower.includes('teacher')) return false;
          } else if (selectedSpecializedList === 'java') {
            if (!roleLower.includes('sde') && !roleLower.includes('software') && !roleLower.includes('developer')) return false;
          }
        }
      }

      return true;
    });
  }, [unifiedDirectory, searchQuery, selectedMemberType, selectedCourse, selectedGraduationYear, selectedLocation, selectedSpecializedList, currentUser]);

  // ─── Batch-Wise Grouping ──────────────────────────────────────────────
  const batchWiseGroups = useMemo(() => {
    const groups = {};
    filteredDirectory.forEach((item) => {
      const yr = item.batchYear || 'Other';
      if (!groups[yr]) groups[yr] = [];
      groups[yr].push(item);
    });

    const sortedYears = Object.keys(groups).sort((a, b) => {
      const numA = parseInt(a, 10) || 0;
      const numB = parseInt(b, 10) || 0;
      return numB - numA;
    });

    return sortedYears.map(year => ({
      year,
      count: groups[year].length,
      members: groups[year]
    }));
  }, [filteredDirectory]);

  const toggleBatchCollapse = (year) => {
    setCollapsedBatches(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const handleToggleFollow = async (targetUser) => {
    const userId = targetUser._id || targetUser.id;
    const userName = (targetUser.name || '').toLowerCase().trim();

    setFollowingMap(prev => ({ ...prev, [userId]: true, [userName]: true }));

    try {
      const profileCacheStr = await AsyncStorage.getItem('profileCache');
      let cache = {};
      if (profileCacheStr) { try { cache = JSON.parse(profileCacheStr); } catch (_) {} }
      
      const currentList = Array.isArray(cache.followingList) ? cache.followingList : [];
      const isAlready = currentList.some(u => (u.id || u._id) === userId || (u.name || '').toLowerCase().trim() === userName);
      
      if (!isAlready) {
        const newItem = {
          id: userId,
          _id: userId,
          name: targetUser.name,
          title: targetUser.role || 'Alumni Member',
          avatar: targetUser.initials || getInitials(targetUser.name),
          avatar_url: targetUser.avatar_url || ''
        };
        const newList = [...currentList, newItem];
        cache.followingList = newList;
        cache.following = newList.length.toString();
        await AsyncStorage.setItem('profileCache', JSON.stringify(cache));
      }
    } catch (_) {}

    try {
      await toggleFollowUser(userId);
    } catch (err) {
      console.log('Error toggling follow:', err);
    }
  };

  const handleSendConnect = async (targetId) => {
    if (!targetId) return;
    try {
      setSentConnectMap(prev => ({ ...prev, [targetId]: true }));
      await sendConnectionRequest(targetId);
      Alert.alert('Connection Request Sent', 'Your invitation to connect has been forwarded.');
    } catch (err) {
      console.error('Error sending connection request:', err);
    }
  };

  // ─── WhatsApp Communities Setup ───────────────────────────────────────
  const [communityModalVisible, setCommunityModalVisible] = useState(false);
  const [communityStep, setCommunityStep] = useState(1);
  const [communityName, setCommunityName] = useState('');
  const [communityDesc, setCommunityDesc] = useState('');
  const [communityIconUri, setCommunityIconUri] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState(['announcement']);
  const [userCommunities, setUserCommunities] = useState(DEFAULT_WHATSAPP_COMMUNITIES);

  useEffect(() => {
    AsyncStorage.getItem('alumni_whatsapp_communities').then(savedStr => {
      if (savedStr) {
        try {
          const parsed = JSON.parse(savedStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUserCommunities(parsed);
          }
        } catch (_) {}
      }
    }).catch(() => {});
  }, []);

  const handlePickCommunityIcon = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Permission to access photos is needed.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCommunityIconUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking community icon:', err);
    }
  };

  const availableGroups = [
    { id: 'announcement', name: 'Announcements', icon: 'megaphone', desc: 'Official updates and announcements' },
    { id: 'general', name: 'General Discussion', icon: 'chatbubbles', desc: 'Open chat for all community members' },
    { id: 'jobs', name: 'Jobs & Internships', icon: 'briefcase', desc: 'Share career opportunities and referrals' },
    { id: 'events', name: 'Events & Meetups', icon: 'calendar', desc: 'Plan batch reunions and networking events' }
  ];

  const handleToggleGroup = (groupId) => {
    if (groupId === 'announcement') return;
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups((prev) => prev.filter((id) => id !== groupId));
    } else {
      setSelectedGroups((prev) => [...prev, groupId]);
    }
  };

  const handleCreateCommunity = () => {
    if (!communityName.trim()) {
      Alert.alert('Required', 'Please enter a community name');
      return;
    }
    const newComm = {
      id: 'comm_' + Date.now().toString(),
      name: communityName.trim(),
      description: communityDesc.trim() || 'Alumni Community',
      institution: userInstitution || 'RV College of Engineering',
      membersCount: '1 Member • You',
      avatar_url: communityIconUri || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&h=200&q=80',
      iconUri: communityIconUri,
      announcement: {
        id: 'ann_' + Date.now(),
        name: 'Announcements',
        lastMessage: `📢 Welcome to the official ${communityName} announcement channel!`,
        time: 'Just now',
        unread: false,
      },
      groups: availableGroups.filter(g => selectedGroups.includes(g.id) && g.id !== 'announcement').map(g => ({
        ...g,
        lastSender: currentUser?.name || 'You',
        lastMessage: `Created ${g.name} channel`,
        time: 'Just now',
        unreadCount: 0
      }))
    };
    const updated = [newComm, ...userCommunities];
    setUserCommunities(updated);
    AsyncStorage.setItem('alumni_whatsapp_communities', JSON.stringify(updated)).catch(() => {});
    setCommunityStep(3);
  };

  const resetCommunityForm = () => {
    setCommunityName('');
    setCommunityDesc('');
    setCommunityIconUri(null);
    setSelectedGroups(['announcement']);
    setCommunityStep(1);
    setCommunityModalVisible(false);
  };

  const handleAccept = async (id) => {
    try {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      await acceptConnectionRequest(id);
    } catch (err) {
      console.error('Error accepting connection request:', err);
    }
  };

  const handleReject = async (id) => {
    try {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      await declineConnectionRequest(id);
    } catch (err) {
      console.error('Error declining connection request:', err);
    }
  };

  // ─── Single Exact AlmaConnect Member Card ─────────────────────────────
  const renderAlmaConnectCard = (item) => {
    const isFollowing = !!(
      followingMap[String(item._id || item.id)] ||
      followingMap[String(item.id || item._id)] ||
      followingMap[(item.name || '').toLowerCase().trim()]
    );
    const isRequested = !!sentConnectMap[item._id || item.id];

    return (
      <View
        key={item.id}
        style={[
          styles.almaCard,
          isDesktop && { width: 'calc(33.333% - 14px)', minWidth: 310, maxWidth: 420 }
        ]}
      >
        {/* Top Header Row: Batch & Degree Tag + Member Status */}
        <View style={styles.almaCardHeader}>
          <View style={styles.almaBatchPill}>
            <Ionicons name="school" size={12} color="#002B5C" />
            <Text style={styles.almaBatchPillText}>
              {item.batchFormatted || `Class of ${item.batchYear}`}
            </Text>
          </View>
          <View style={styles.almaVerifiedRow}>
            <Ionicons name="checkmark-circle" size={14} color="#0284C7" />
            <Text style={styles.almaVerifiedText}>RVCE Verified</Text>
          </View>
        </View>

        {/* Member Profile Main Section */}
        <View style={styles.almaProfileSection}>
          <View style={styles.almaAvatarWrapper}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.almaAvatarImage} />
            ) : (
              <View style={[styles.almaAvatarFallback, { backgroundColor: item.color || '#002B5C' }]}>
                <Text style={styles.almaAvatarInitials}>{item.initials}</Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={styles.almaMemberName} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            <Text style={styles.almaMemberRole} numberOfLines={2}>
              {item.role}
            </Text>
            {item.location ? (
              <View style={styles.almaLocationRow}>
                <Ionicons name="location-outline" size={12} color="#64748B" />
                <Text style={styles.almaLocationText} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Tags / Skills Row */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.almaTagsRow}>
            {item.tags.map((tag, tIdx) => (
              <View key={tIdx} style={styles.almaTagPill}>
                <Text style={styles.almaTagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom Actions Cluster */}
        <View style={styles.almaCardActions}>
          <TouchableOpacity
            style={[
              styles.almaConnectBtn,
              isRequested && styles.almaConnectBtnRequested
            ]}
            onPress={() => handleSendConnect(item._id || item.id)}
            disabled={isRequested}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isRequested ? "checkmark-circle" : "person-add"} 
              size={13} 
              color={isRequested ? "#03543F" : "#FFFFFF"} 
            />
            <Text style={[styles.almaConnectBtnText, isRequested && { color: "#03543F" }]}>
              {isRequested ? 'Requested' : 'Connect'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.almaChatBtn}
            onPress={() => navigation.navigate('Chat', { 
              user: { 
                id: item._id || item.id, 
                name: item.name, 
                role: `${item.role} • ${item.batchFormatted || item.batchYear}`, 
                initials: item.initials 
              } 
            })}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#002B5C" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.almaFollowBtn, isFollowing && { backgroundColor: '#DEF7EC', borderColor: '#31C48D' }]}
            onPress={() => handleToggleFollow(item)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isFollowing ? "checkmark" : "bookmark-outline"} 
              size={16} 
              color={isFollowing ? "#059669" : "#64748B"} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.almaShareBtn}
            onPress={() => setSharedAlumni(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={16} color="#16A34A" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Main RVCE AlmaConnect Directory Screen ───────────────────────────
  const renderAlmaConnectDirectory = () => {
    return (
      <ScrollView 
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── AlmaConnect Header Banner (RVCE Official Directory) ─── */}
        <View style={styles.almaBanner}>
          <View style={styles.almaBannerAccent} />
          <View style={{ flex: 1 }}>
            <View style={styles.almaBannerMetaRow}>
              <View style={styles.almaBadgeInstitution}>
                <Ionicons name="school" size={12} color="#FBBF24" />
                <Text style={styles.almaBadgeInstitutionText}>RV College of Engineering</Text>
              </View>
              <Text style={styles.almaPortalBadge}>rvce.almaconnect.com</Text>
            </View>

            <Text style={styles.almaBannerTitle}>Search & Find RVCE Alumni, Students & Faculty</Text>
            <Text style={styles.almaBannerSubtitle}>
              Connect across batches with verified engineers, leaders, and mentors worldwide
            </Text>

            {/* AlmaConnect Exact Stats Pills */}
            <View style={styles.almaStatsBar}>
              <View style={styles.almaStatItem}>
                <Text style={styles.almaStatNumber}>{ALMACONNECT_STATS.totalRvians}</Text>
                <Text style={styles.almaStatLabel}>Total RVians</Text>
              </View>
              <View style={styles.almaStatDivider} />
              <View style={styles.almaStatItem}>
                <Text style={styles.almaStatNumber}>{ALMACONNECT_STATS.alumni}</Text>
                <Text style={styles.almaStatLabel}>Alumni</Text>
              </View>
              <View style={styles.almaStatDivider} />
              <View style={styles.almaStatItem}>
                <Text style={styles.almaStatNumber}>{ALMACONNECT_STATS.students}</Text>
                <Text style={styles.almaStatLabel}>Students</Text>
              </View>
              <View style={styles.almaStatDivider} />
              <View style={styles.almaStatItem}>
                <Text style={styles.almaStatNumber}>{ALMACONNECT_STATS.faculty}</Text>
                <Text style={styles.almaStatLabel}>Faculty</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Member Type Tabs (All Member Type / Alumni / Students / Faculty / My Batch) ─── */}
        <View style={styles.memberTypeRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {MEMBER_TYPES.map((type) => {
              const isSelected = selectedMemberType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.memberTypePill, isSelected && styles.memberTypePillActive]}
                  onPress={() => setSelectedMemberType(type.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.memberTypePillText, isSelected && styles.memberTypePillTextActive]}>
                    {type.label} ({type.count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── Top Filter Controls (Course, Graduation Year, Location) ─── */}
        <View style={styles.topFilterControlsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
            {/* Course Filter Dropdown Button */}
            <TouchableOpacity
              style={[styles.dropdownFilterBtn, selectedCourse !== 'all' && styles.dropdownFilterBtnActive]}
              onPress={() => setShowFiltersModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="school-outline" size={13} color={selectedCourse !== 'all' ? '#002B5C' : '#64748B'} />
              <Text style={[styles.dropdownFilterText, selectedCourse !== 'all' && styles.dropdownFilterTextActive]}>
                {selectedCourse === 'all' ? 'All Course' : selectedCourse}
              </Text>
              <Ionicons name="chevron-down" size={12} color="#94A3B8" />
            </TouchableOpacity>

            {/* Graduation Year Dropdown Button */}
            <TouchableOpacity
              style={[styles.dropdownFilterBtn, selectedGraduationYear !== 'all' && styles.dropdownFilterBtnActive]}
              onPress={() => setShowFiltersModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={13} color={selectedGraduationYear !== 'all' ? '#002B5C' : '#64748B'} />
              <Text style={[styles.dropdownFilterText, selectedGraduationYear !== 'all' && styles.dropdownFilterTextActive]}>
                {selectedGraduationYear === 'all' ? 'All Graduation Year' : `Batch ${selectedGraduationYear}`}
              </Text>
              <Ionicons name="chevron-down" size={12} color="#94A3B8" />
            </TouchableOpacity>

            {/* Location Dropdown Button */}
            <TouchableOpacity
              style={[styles.dropdownFilterBtn, selectedLocation !== 'all' && styles.dropdownFilterBtnActive]}
              onPress={() => setShowFiltersModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={13} color={selectedLocation !== 'all' ? '#002B5C' : '#64748B'} />
              <Text style={[styles.dropdownFilterText, selectedLocation !== 'all' && styles.dropdownFilterTextActive]}>
                {selectedLocation === 'all' ? 'All Location' : selectedLocation}
              </Text>
              <Ionicons name="chevron-down" size={12} color="#94A3B8" />
            </TouchableOpacity>

            {/* Reset Filter Button */}
            {(selectedMemberType !== 'all' || selectedCourse !== 'all' || selectedGraduationYear !== 'all' || selectedLocation !== 'all' || selectedSpecializedList || searchQuery.length > 0) && (
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => {
                  setSelectedMemberType('all');
                  setSelectedCourse('all');
                  setSelectedGraduationYear('all');
                  setSelectedLocation('all');
                  setSelectedSpecializedList(null);
                  setSearchQuery('');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={14} color="#EF4444" />
                <Text style={styles.resetFilterText}>Clear</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* View Toggle: Batch-Wise vs All Grid */}
          <View style={styles.viewModeToggleWrapper}>
            <TouchableOpacity
              style={[styles.viewModeBtn, viewMode === 'batch_wise' && styles.viewModeBtnActive]}
              onPress={() => setViewMode('batch_wise')}
              activeOpacity={0.7}
            >
              <Ionicons name="layers" size={13} color={viewMode === 'batch_wise' ? '#002B5C' : '#94A3B8'} />
              <Text style={[styles.viewModeBtnText, viewMode === 'batch_wise' && styles.viewModeBtnTextActive]}>
                Batch
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeBtn, viewMode === 'all_cards' && styles.viewModeBtnActive]}
              onPress={() => setViewMode('all_cards')}
              activeOpacity={0.7}
            >
              <Ionicons name="grid" size={13} color={viewMode === 'all_cards' ? '#002B5C' : '#94A3B8'} />
              <Text style={[styles.viewModeBtnText, viewMode === 'all_cards' && styles.viewModeBtnTextActive]}>
                Grid
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Specialized AlmaConnect Directory Lists Carousel ─── */}
        <View style={styles.specializedListsWrapper}>
          <Text style={styles.specializedHeaderTitle}>SPECIALIZED DIRECTORY LISTS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {ALMACONNECT_SPECIALIZED_LISTS.map((list) => {
              const isSelected = selectedSpecializedList === list.id;
              return (
                <TouchableOpacity
                  key={list.id}
                  style={[styles.specializedCard, isSelected && styles.specializedCardActive]}
                  onPress={() => {
                    setSelectedSpecializedList(isSelected ? null : list.id);
                  }}
                  activeOpacity={0.75}
                >
                  <Ionicons 
                    name={list.icon} 
                    size={14} 
                    color={isSelected ? '#002B5C' : '#475569'} 
                  />
                  <Text style={[styles.specializedCardTitle, isSelected && styles.specializedCardTitleActive]}>
                    {list.title}
                  </Text>
                  <View style={styles.specializedCountPill}>
                    <Text style={styles.specializedCountText}>{list.count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── Results Counter Bar ─── */}
        <View style={styles.resultsCounterRow}>
          <Text style={styles.resultsCounterText}>
            Showing <Text style={{ fontWeight: '800', color: theme.text }}>{filteredDirectory.length} Members</Text>
            {selectedGraduationYear !== 'all' ? ` in Batch ${selectedGraduationYear}` : ''}
            {selectedCourse !== 'all' ? ` (${selectedCourse})` : ''}
            {selectedLocation !== 'all' ? ` in ${selectedLocation}` : ''}
          </Text>
          {loadingDirectory && (
            <Text style={{ fontSize: 12, color: '#0284C7', fontWeight: '600' }}>Syncing with RVCE servers...</Text>
          )}
        </View>

        {/* ─── Empty State ─── */}
        {filteredDirectory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={54} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Members Found</Text>
            <Text style={styles.emptySubtitle}>
              No alumni or students match your selected filters. Try changing or clearing filters.
            </Text>
            <TouchableOpacity
              style={styles.emptyClearBtn}
              onPress={() => {
                setSelectedMemberType('all');
                setSelectedCourse('all');
                setSelectedGraduationYear('all');
                setSelectedLocation('all');
                setSelectedSpecializedList(null);
                setSearchQuery('');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyClearBtnText}>View All Members</Text>
            </TouchableOpacity>
          </View>
        ) : viewMode === 'batch_wise' ? (
          // ─── Batch-Wise Grouped Display ───
          <View style={{ gap: 18 }}>
            {batchWiseGroups.map((batchGroup) => {
              const isCollapsed = !!collapsedBatches[batchGroup.year];

              return (
                <View key={batchGroup.year} style={styles.batchSectionWrapper}>
                  {/* Batch Section Header */}
                  <TouchableOpacity
                    style={styles.batchHeaderBtn}
                    onPress={() => toggleBatchCollapse(batchGroup.year)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={styles.batchIconPod}>
                        <Ionicons name="school" size={16} color="#002B5C" />
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.batchTitleText}>
                            Batch of {batchGroup.year}
                          </Text>
                          <View style={styles.batchCountBadge}>
                            <Text style={styles.batchCountBadgeText}>
                              {batchGroup.count} {batchGroup.count === 1 ? 'RVian' : 'RVians'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.batchSubtitleText}>
                          Class of {batchGroup.year} • BE / M.Tech / MCA / B.Tech
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.batchToggleText}>
                        {isCollapsed ? 'Show' : 'Hide'}
                      </Text>
                      <Ionicons
                        name={isCollapsed ? "chevron-down" : "chevron-up"}
                        size={18}
                        color="#64748B"
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Cards inside Batch Section */}
                  {!isCollapsed && (
                    <View style={styles.batchCardsGrid}>
                      {batchGroup.members.map(renderAlmaConnectCard)}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          // ─── All Cards Grid ───
          <View style={styles.batchCardsGrid}>
            {filteredDirectory.map(renderAlmaConnectCard)}
          </View>
        )}
      </ScrollView>
    );
  };

  // ─── Requests Tab ─────────────────────────────────────────────────────
  const renderRequestTab = () => {
    const filteredRequests = requests.filter(
      (r) =>
        (r.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (r.subtitle || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    );

    return (
      <View style={styles.tabContent}>
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.requestRow}>
              <View style={[styles.avatar, { backgroundColor: item.color }]}>
                <Text style={styles.avatarText}>{item.initials}</Text>
              </View>
              <View style={styles.requestInfo}>
                <Text style={styles.requestName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.requestSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleReject(item.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color="#EF4444" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleAccept(item.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark" size={18} color="#10B981" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyRequestState}>
              <Ionicons name="mail-open-outline" size={56} color="#CBD5E1" />
              <Text style={styles.emptyRequestTitle}>No Pending Requests</Text>
              <Text style={styles.emptyRequestSubtitle}>
                You&apos;re all caught up! Connection requests sent to you will appear here.
              </Text>
            </View>
          }
        />
      </View>
    );
  };

  // ─── Communities Tab ──────────────────────────────────────────────────
  const renderCommunityTab = () => {
    return (
      <ScrollView 
        style={styles.tabContent} 
        contentContainerStyle={styles.commListContainer} 
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.waNewCommunityCard}
          onPress={() => setCommunityModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.waNewCommunityIconPod}>
            <Ionicons name="people" size={24} color="#FFFFFF" />
            <View style={styles.waNewCommunityPlusBadge}>
              <Ionicons name="add" size={13} color="#FFFFFF" />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.waNewCommunityTitle}>New Community</Text>
            <Text style={styles.waNewCommunitySubtitle}>
              Bring together batchmates, department clubs, or regional chapters
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {userCommunities.map((comm) => (
          <View key={comm.id} style={styles.waCommunityBlock}>
            <View style={styles.waCommunityHeader}>
              <View style={styles.waCommunityAvatarPod}>
                {comm.avatar_url || comm.iconUri ? (
                  <Image source={{ uri: comm.avatar_url || comm.iconUri }} style={styles.waCommunityAvatarImg} />
                ) : (
                  <Ionicons name="people" size={24} color="#FFFFFF" />
                )}
              </View>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={styles.waCommunityName} numberOfLines={1}>{comm.name}</Text>
                  <Ionicons name="checkmark-circle" size={15} color="#0284C7" />
                </View>
                <Text style={styles.waCommunityMeta}>{comm.membersCount || 'Active Community'}</Text>
                {comm.description ? (
                  <Text style={styles.waCommunityDesc} numberOfLines={1}>{comm.description}</Text>
                ) : null}
              </View>
              <TouchableOpacity 
                style={{ padding: 6 }} 
                activeOpacity={0.7}
                onPress={() => Alert.alert(comm.name, comm.description || 'Alumni Community')}
              >
                <Ionicons name="ellipsis-vertical" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {comm.announcement && (
              <TouchableOpacity 
                style={styles.waAnnouncementRow}
                onPress={() => navigation.navigate('Chat', { 
                  user: { 
                    id: comm.announcement.id, 
                    name: `${comm.name} Announcements`, 
                    role: 'Official Broadcast Channel', 
                    initials: 'AN' 
                  } 
                })}
                activeOpacity={0.75}
              >
                <View style={styles.waMegaphonePod}>
                  <Ionicons name="megaphone" size={17} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Text style={styles.waChannelTitle}>Announcements</Text>
                      <Ionicons name="volume-high" size={12} color="#00A884" />
                    </View>
                    <Text style={styles.waChannelTime}>{comm.announcement.time || 'Yesterday'}</Text>
                  </View>
                  <Text style={styles.waChannelSnippet} numberOfLines={1}>
                    {comm.announcement.lastMessage}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.waGroupsContainer}>
              {(comm.groups || []).map((group, gIdx) => (
                <TouchableOpacity 
                  key={group.id || gIdx} 
                  style={styles.waGroupRow}
                  onPress={() => navigation.navigate('Chat', { 
                    user: { 
                      id: group.id, 
                      name: group.name, 
                      role: `${comm.name} • Channel`, 
                      initials: (group.name || 'GP').substring(0, 2).toUpperCase() 
                    } 
                  })}
                  activeOpacity={0.72}
                >
                  <View style={styles.waGroupIconPod}>
                    <Ionicons name={group.icon || "chatbubbles"} size={16} color="#002B5C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.waGroupName} numberOfLines={1}>{group.name}</Text>
                      <Text style={styles.waGroupTime}>{group.time || '10:00 AM'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                      <Text style={styles.waGroupSnippet} numberOfLines={1}>
                        {group.lastSender ? `${group.lastSender}: ` : ''}{group.lastMessage || 'Tap to join chat'}
                      </Text>
                      {group.unreadCount > 0 ? (
                        <View style={styles.waUnreadBadge}>
                          <Text style={styles.waUnreadText}>{group.unreadCount}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 1100, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={webContainerStyle}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="#FFFFFF" />

        {/* ───── Header Bar ───── */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerAvatar} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Profile')}
          >
            {(currentUser?.avatar_url || currentUser?.profilePicture) ? (
              <Image 
                source={{ uri: getImageUrl(currentUser.avatar_url || currentUser.profilePicture) }} 
                style={{ width: '100%', height: '100%', borderRadius: 18 }} 
              />
            ) : (
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                {getInitials(currentUser?.name, 'AL')}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search in 9,931 RVians (Name, Batch, Company, Role)..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.headerIconBtn} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ResumeBook')}
            >
              <Ionicons name="document-text-outline" size={22} color="#002144" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerIconBtn} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Messages')}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#002144" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerIconBtn} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color="#002144" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Admin Verification Banner */}
        {isAdminOrSuper && (
          <View style={styles.adminBanner}>
            <Ionicons name="shield-checkmark" size={16} color="#003366" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#003366' }}>{userRole} Mode</Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>AlmaConnect Directory Verification Control</Text>
          </View>
        )}

        {/* ───── Main Navigation Tabs ───── */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'directory' && styles.activeTab]}
            onPress={() => setActiveTab('directory')}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons 
                name="people" 
                size={16} 
                color={activeTab === 'directory' ? '#002B5C' : '#64748B'} 
              />
              <Text style={[styles.tabText, activeTab === 'directory' && styles.activeTabText]}>
                Directory (9,931)
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'request' && styles.activeTab]}
            onPress={() => setActiveTab('request')}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.tabText, activeTab === 'request' && styles.activeTabText]}>
                Requests
              </Text>
              {requests.length > 0 && (
                <View style={styles.requestBadge}>
                  <Text style={styles.requestBadgeText}>{requests.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'community' && styles.activeTab]}
            onPress={() => setActiveTab('community')}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons 
                name="chatbubbles-outline" 
                size={16} 
                color={activeTab === 'community' ? '#002B5C' : '#64748B'} 
              />
              <Text style={[styles.tabText, activeTab === 'community' && styles.activeTabText]}>
                Communities
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ───── Main Body View ───── */}
        {activeTab === 'directory' ? (
          renderAlmaConnectDirectory()
        ) : activeTab === 'request' ? (
          renderRequestTab()
        ) : (
          renderCommunityTab()
        )}

        {/* ───── Filter Modal (Course, Graduation Year, Location) ───── */}
        <Modal visible={showFiltersModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.filterModalBox}>
              <View style={styles.filterModalHeader}>
                <Text style={styles.filterModalTitle}>RVCE AlmaConnect Filters</Text>
                <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
                  <Ionicons name="close" size={24} color="#002B5C" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {/* Course Filter */}
                <Text style={styles.filterSectionTitle}>COURSE</Text>
                <View style={{ gap: 6, marginBottom: 18 }}>
                  {ALMACONNECT_COURSES.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.filterOptionRow,
                        selectedCourse === c.id && styles.filterOptionRowActive
                      ]}
                      onPress={() => setSelectedCourse(c.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterOptionText, selectedCourse === c.id && styles.filterOptionTextActive]}>
                        {c.label} ({c.count})
                      </Text>
                      {selectedCourse === c.id && (
                        <Ionicons name="checkmark-circle" size={18} color="#002B5C" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Graduation Year Filter */}
                <Text style={styles.filterSectionTitle}>GRADUATION YEAR</Text>
                <View style={{ gap: 6, marginBottom: 18 }}>
                  {ALMACONNECT_GRADUATION_YEARS.map((y) => (
                    <TouchableOpacity
                      key={y.id}
                      style={[
                        styles.filterOptionRow,
                        selectedGraduationYear === y.id && styles.filterOptionRowActive
                      ]}
                      onPress={() => setSelectedGraduationYear(y.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterOptionText, selectedGraduationYear === y.id && styles.filterOptionTextActive]}>
                        {y.label} ({y.count})
                      </Text>
                      {selectedGraduationYear === y.id && (
                        <Ionicons name="checkmark-circle" size={18} color="#002B5C" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Location Filter */}
                <Text style={styles.filterSectionTitle}>LOCATION</Text>
                <View style={{ gap: 6, marginBottom: 18 }}>
                  {ALMACONNECT_LOCATIONS.map((loc) => (
                    <TouchableOpacity
                      key={loc.id}
                      style={[
                        styles.filterOptionRow,
                        selectedLocation === loc.id && styles.filterOptionRowActive
                      ]}
                      onPress={() => setSelectedLocation(loc.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterOptionText, selectedLocation === loc.id && styles.filterOptionTextActive]}>
                        {loc.label} ({loc.count})
                      </Text>
                      {selectedLocation === loc.id && (
                        <Ionicons name="checkmark-circle" size={18} color="#002B5C" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.filterApplyBtn}
                onPress={() => setShowFiltersModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.filterApplyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ───── Community Creation Modal ───── */}
        <Modal visible={communityModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={{ flex: 1 }} onPress={resetCommunityForm} />
            <View style={styles.modalContent}>
              {communityStep === 1 && (
                <View>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={resetCommunityForm}>
                      <Ionicons name="close" size={24} color="#002144" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>New Community</Text>
                    <TouchableOpacity onPress={() => communityName.trim() ? setCommunityStep(2) : Alert.alert('Required', 'Please enter community name')}>
                      <Text style={styles.modalActionText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView contentContainerStyle={styles.wizardBody} keyboardShouldPersistTaps="handled">
                    <TouchableOpacity 
                      style={styles.commIconSetup} 
                      activeOpacity={0.8}
                      onPress={handlePickCommunityIcon}
                    >
                      <View style={[styles.commIconBgLarge, communityIconUri && { borderStyle: 'solid', borderColor: '#003366', overflow: 'hidden' }]}>
                        {communityIconUri ? (
                          <Image source={{ uri: communityIconUri }} style={{ width: '100%', height: '100%', borderRadius: 24 }} />
                        ) : (
                          <Ionicons name="camera" size={32} color="#003366" />
                        )}
                      </View>
                      <Text style={[styles.commIconLabel, { color: '#003366', fontWeight: '700' }]}>
                        {communityIconUri ? 'Change Community Icon' : 'Add Community Icon'}
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.wizardLabel}>Community Name</Text>
                    <TextInput
                      style={styles.wizardInput}
                      placeholder="e.g. RVCE CSE 2023 Alumni"
                      placeholderTextColor="#94A3B8"
                      value={communityName}
                      onChangeText={setCommunityName}
                      maxLength={30}
                    />
                    <Text style={styles.charCount}>{30 - communityName.length} characters remaining</Text>

                    <Text style={styles.wizardLabel}>Description</Text>
                    <TextInput
                      style={[styles.wizardInput, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                      placeholder="Describe the purpose of this community"
                      placeholderTextColor="#94A3B8"
                      value={communityDesc}
                      onChangeText={setCommunityDesc}
                      multiline
                    />
                  </ScrollView>
                </View>
              )}

              {communityStep === 2 && (
                <View>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setCommunityStep(1)}>
                      <Ionicons name="arrow-back" size={24} color="#002144" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Add Groups</Text>
                    <TouchableOpacity onPress={handleCreateCommunity}>
                      <Text style={styles.modalActionText}>Create</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView contentContainerStyle={styles.wizardBody}>
                    <Text style={styles.wizardInfoText}>
                      A community links multiple chat groups under one umbrella. Select groups to include:
                    </Text>

                    <Text style={styles.groupSectionHeader}>Required Group</Text>
                    <View style={[styles.groupSelectRow, styles.groupDisabledSelect]}>
                      <View style={[styles.commGroupIconBg, styles.announcementBg]}>
                        <Ionicons name="megaphone" size={16} color="#003366" />
                      </View>
                      <View style={styles.groupSelectInfo}>
                        <Text style={styles.groupSelectName}>Announcements (Required)</Text>
                        <Text style={styles.groupSelectDesc}>Broadcast messages to all community members</Text>
                      </View>
                      <Ionicons name="checkbox" size={24} color="#003366" />
                    </View>

                    <Text style={styles.groupSectionHeader}>Optional Groups</Text>
                    {availableGroups.slice(1).map((group) => (
                      <TouchableOpacity
                        key={group.id}
                        style={styles.groupSelectRow}
                        onPress={() => handleToggleGroup(group.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.commGroupIconBg}>
                          <Ionicons name={group.icon} size={16} color="#475569" />
                        </View>
                        <View style={styles.groupSelectInfo}>
                          <Text style={styles.groupSelectName}>{group.name}</Text>
                          <Text style={styles.groupSelectDesc}>{group.desc}</Text>
                        </View>
                        <Ionicons
                          name={selectedGroups.includes(group.id) ? "checkbox" : "square-outline"}
                          size={24}
                          color={selectedGroups.includes(group.id) ? "#003366" : "#94A3B8"}
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {communityStep === 3 && (
                <View style={styles.successContainer}>
                  <View style={styles.successCircle}>
                    <Ionicons name="checkmark" size={60} color="#FFFFFF" />
                  </View>
                  <Text style={styles.successTitle}>Community Created!</Text>
                  <Text style={styles.successDesc}>
                    Your new community &quot;{communityName}&quot; is active.
                  </Text>
                  <TouchableOpacity style={styles.successBtn} onPress={resetCommunityForm}>
                    <Text style={styles.successBtnText}>View Community</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* ───── Instagram-Style Profile Share Modal ───── */}
        <InstagramProfileShareModal
          visible={!!sharedAlumni}
          onClose={() => setSharedAlumni(null)}
          user={sharedAlumni || {}}
        />
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background || '#F8FAFC',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.card || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.border || '#E2E8F0',
    gap: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#002B5C',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.text || '#0F172A',
    paddingVertical: 0,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminBanner: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Tabs */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.card || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.border || '#E2E8F0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#002B5C',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted || '#64748B',
  },
  activeTabText: {
    color: '#002B5C',
    fontWeight: '800',
  },
  requestBadge: {
    backgroundColor: '#002B5C',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  requestBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Scroll View */
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  /* AlmaConnect Banner */
  almaBanner: {
    backgroundColor: '#002B5C',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  almaBannerAccent: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(251, 191, 36, 0.16)',
  },
  almaBannerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  almaBadgeInstitution: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  almaBadgeInstitutionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBBF24',
  },
  almaPortalBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93C5FD',
  },
  almaBannerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  almaBannerSubtitle: {
    fontSize: 12.5,
    color: '#E2E8F0',
    marginTop: 4,
    lineHeight: 18,
  },
  almaStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  almaStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  almaStatNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FBBF24',
  },
  almaStatLabel: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 1,
  },
  almaStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  /* Member Type Row */
  memberTypeRow: {
    marginBottom: 12,
  },
  memberTypePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  memberTypePillActive: {
    backgroundColor: '#002B5C',
    borderColor: '#002B5C',
  },
  memberTypePillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  memberTypePillTextActive: {
    color: '#FFFFFF',
  },

  /* Top Filter Controls */
  topFilterControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  dropdownFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  dropdownFilterBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#002B5C',
    borderWidth: 1.5,
  },
  dropdownFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  dropdownFilterTextActive: {
    color: '#002B5C',
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
  },
  resetFilterText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  viewModeToggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  viewModeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  viewModeBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  viewModeBtnTextActive: {
    color: '#002B5C',
  },

  /* Specialized Lists */
  specializedListsWrapper: {
    marginBottom: 16,
  },
  specializedHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 2,
  },
  specializedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  specializedCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
    borderWidth: 1.5,
  },
  specializedCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  specializedCardTitleActive: {
    color: '#002B5C',
  },
  specializedCountPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  specializedCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },

  /* Results Counter */
  resultsCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  resultsCounterText: {
    fontSize: 13,
    color: '#64748B',
  },

  /* Batch Section Group */
  batchSectionWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#002B5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  batchHeaderBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  batchIconPod: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  batchTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002B5C',
  },
  batchCountBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  batchCountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  batchSubtitleText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  batchToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  batchCardsGrid: {
    padding: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },

  /* Alma Card */
  almaCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#002B5C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  almaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  almaBatchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  almaBatchPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#002B5C',
  },
  almaVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  almaVerifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  almaProfileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  almaAvatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  almaAvatarImage: {
    width: '100%',
    height: '100%',
  },
  almaAvatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  almaAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  almaMemberName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  almaMemberRole: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 17,
    marginTop: 2,
    fontWeight: '500',
  },
  almaLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  almaLocationText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  almaTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 12,
  },
  almaTagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  almaTagText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  almaCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  almaConnectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#002B5C',
    paddingVertical: 8,
    borderRadius: 8,
  },
  almaConnectBtnRequested: {
    backgroundColor: '#DEF7EC',
    borderWidth: 1,
    borderColor: '#31C48D',
  },
  almaConnectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  almaChatBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  almaFollowBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  almaShareBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E8FDF0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },

  /* Empty Container */
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 360,
    marginTop: 6,
    lineHeight: 18,
  },
  emptyClearBtn: {
    marginTop: 18,
    backgroundColor: '#002B5C',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyClearBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Modal Filter Box */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filterModalBox: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
    marginBottom: 14,
  },
  filterModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#002B5C',
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  filterOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  filterOptionRowActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  filterOptionText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  filterOptionTextActive: {
    color: '#002B5C',
    fontWeight: '800',
  },
  filterApplyBtn: {
    backgroundColor: '#002B5C',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  filterApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* Requests & Communities Styles */
  tabContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 40,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  requestInfo: {
    flex: 1,
    marginRight: 10,
  },
  requestName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  requestSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#6EE7B7',
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyRequestState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyRequestTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  emptyRequestSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  /* WhatsApp Communities */
  commListContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  waNewCommunityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 14,
  },
  waNewCommunityIconPod: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#002B5C',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  waNewCommunityPlusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  waNewCommunityTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  waNewCommunitySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  waCommunityBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    overflow: 'hidden',
  },
  waCommunityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  waCommunityAvatarPod: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#002B5C',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  waCommunityAvatarImg: {
    width: '100%',
    height: '100%',
  },
  waCommunityName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  waCommunityMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  waCommunityDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  waAnnouncementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: 'rgba(0, 168, 132, 0.05)',
    gap: 12,
  },
  waMegaphonePod: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#00A884',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waChannelTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  waChannelTime: {
    fontSize: 11.5,
    color: '#64748B',
  },
  waChannelSnippet: {
    fontSize: 12.5,
    color: '#475569',
    marginTop: 3,
  },
  waGroupsContainer: {
    paddingVertical: 4,
  },
  waGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  waGroupIconPod: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  waGroupName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  waGroupTime: {
    fontSize: 11,
    color: '#64748B',
  },
  waGroupSnippet: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    marginRight: 8,
  },
  waUnreadBadge: {
    backgroundColor: '#25D366',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waUnreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  /* Modal */
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#002B5C',
  },
  modalActionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#002B5C',
  },
  wizardBody: {
    paddingVertical: 20,
  },
  commIconSetup: {
    alignItems: 'center',
    marginBottom: 20,
  },
  commIconBgLarge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  commIconLabel: {
    fontSize: 13,
  },
  wizardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  wizardInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'right',
  },
  wizardInfoText: {
    fontSize: 13.5,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 19,
  },
  groupSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 8,
  },
  groupSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 12,
  },
  groupDisabledSelect: {
    opacity: 0.8,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  commGroupIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementBg: {
    backgroundColor: '#DBEAFE',
  },
  groupSelectInfo: {
    flex: 1,
  },
  groupSelectName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  groupSelectDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  successBtn: {
    backgroundColor: '#002B5C',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  successBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default DirectoryScreen;
