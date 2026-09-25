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

// ─── Decade & Batch Definitions (AlmaConnect Structure) ───────────────
const DECADE_CONFIG = [
  { id: 'all', label: 'All Decades', years: [] },
  { id: '2021-30', label: '2021-30', years: ['2026', '2025', '2024', '2023', '2022', '2021'] },
  { id: '2011-20', label: '2011-20', years: ['2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011'] },
  { id: '2001-10', label: '2001-10', years: ['2010', '2009', '2008', '2007', '2006', '2005', '2004', '2003', '2002', '2001'] },
  { id: '1991-00', label: '1991-00', years: ['2000', '1999', '1998', '1997', '1996', '1995', '1994', '1993', '1992', '1991'] },
  { id: '1981-90', label: '1981-90', years: ['1990', '1989', '1988', '1987', '1986', '1985', '1984', '1983', '1982', '1981'] },
  { id: 'below-1980', label: 'Below 1980', years: ['1978', '1975', '1972', '1970', '1968', '1963'] }
];

const DEPARTMENTS = [
  'All Departments',
  'Computer Science (CSE)',
  'Information Science (ISE)',
  'Electronics & Comm (ECE)',
  'Mechanical Engg (ME)',
  'Electrical & Electronics (EEE)',
  'Civil Engg (CV)',
  'Biotechnology (BT)',
  'Aerospace Engg (AS)',
  'Chemical Engg (CH)',
  'Artificial Intelligence & ML (AIML)',
  'Master of Computer App (MCA)'
];

const LOCATIONS = [
  'All Locations',
  'Bengaluru',
  'San Francisco Bay Area',
  'Seattle',
  'New York',
  'London',
  'Singapore',
  'Hyderabad',
  'Pune',
  'Mumbai',
  'Boston',
  'Munich'
];

// Curated realistic RVCE Alumni database across batches
const CURATED_RVCE_ALUMNI = [
  // 2021-2026 Batch
  {
    _id: 'rvce_al_2025_1',
    id: 'rvce_al_2025_1',
    name: 'Rohan Nair',
    batchYear: '2025',
    department: 'Computer Science (CSE)',
    branch: 'Computer Science',
    degree: 'B.E.',
    title: 'Software Engineer Intern',
    designation: 'Software Engineer Intern',
    company: 'Google',
    location: 'Bengaluru, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Cloud', 'Go', 'Distributed Systems'],
    verified: true,
    color: '#002B5C'
  },
  {
    _id: 'rvce_al_2024_1',
    id: 'rvce_al_2024_1',
    name: 'Sneha Rao',
    batchYear: '2024',
    department: 'Information Science (ISE)',
    branch: 'Information Science',
    degree: 'B.E.',
    title: 'Software Development Engineer',
    designation: 'Software Development Engineer',
    company: 'Microsoft',
    location: 'Hyderabad, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Azure', 'React', 'Generative AI'],
    verified: true,
    color: '#0F2744'
  },
  {
    _id: 'rvce_al_2024_2',
    id: 'rvce_al_2024_2',
    name: 'Varun Hegde',
    batchYear: '2024',
    department: 'Electronics & Comm (ECE)',
    branch: 'Electronics & Comm',
    degree: 'B.E.',
    title: 'Hardware Design Engineer',
    designation: 'Hardware Design Engineer',
    company: 'Intel Corporation',
    location: 'Bengaluru, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['VLSI', 'Verilog', 'Semiconductors'],
    verified: true,
    color: '#1E3A8A'
  },
  {
    _id: 'rvce_al_2023_1',
    id: 'rvce_al_2023_1',
    name: 'Harshitha D.S.',
    batchYear: '2023',
    department: 'Computer Science (CSE)',
    branch: 'Computer Science',
    degree: 'B.E.',
    title: 'Fullstack Software Engineer',
    designation: 'Fullstack Software Engineer',
    company: 'Goldman Sachs',
    location: 'Bengaluru, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['FinTech', 'React Native', 'Java'],
    verified: true,
    color: '#002B5C'
  },
  {
    _id: 'rvce_al_2023_2',
    id: 'rvce_al_2023_2',
    name: 'Aditi Sharma',
    batchYear: '2023',
    department: 'Biotechnology (BT)',
    branch: 'Biotechnology',
    degree: 'B.E.',
    title: 'Research Associate',
    designation: 'Research Associate',
    company: 'Biocon Biologics',
    location: 'Bengaluru, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Bioinformatics', 'Bioprocessing', 'Genomics'],
    verified: true,
    color: '#047857'
  },
  {
    _id: 'rvce_al_2022_1',
    id: 'rvce_al_2022_1',
    name: 'Karthik N.',
    batchYear: '2022',
    department: 'Computer Science (CSE)',
    branch: 'Computer Science',
    degree: 'B.E.',
    title: 'Software Development Engineer II',
    designation: 'Software Development Engineer II',
    company: 'Amazon Web Services',
    location: 'Seattle, WA, USA',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['AWS', 'Distributed Systems', 'Java'],
    verified: true,
    color: '#002B5C'
  },
  {
    _id: 'rvce_al_2022_2',
    id: 'rvce_al_2022_2',
    name: 'Priyanka Deshmukh',
    batchYear: '2022',
    department: 'Mechanical Engg (ME)',
    branch: 'Mechanical Engg',
    degree: 'B.E.',
    title: 'Robotics Systems Engineer',
    designation: 'Robotics Systems Engineer',
    company: 'Tesla',
    location: 'San Francisco Bay Area, USA',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Robotics', 'Automation', 'CAD'],
    verified: true,
    color: '#B91C1C'
  },
  {
    _id: 'rvce_al_2021_1',
    id: 'rvce_al_2021_1',
    name: 'Nikhil Kamath S.',
    batchYear: '2021',
    department: 'Electrical & Electronics (EEE)',
    branch: 'Electrical & Electronics',
    degree: 'B.E.',
    title: 'Power Systems Specialist',
    designation: 'Power Systems Specialist',
    company: 'Siemens Energy',
    location: 'Munich, Germany',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Smart Grids', 'Renewable Energy', 'SCADA'],
    verified: true,
    color: '#0D9488'
  },
  {
    _id: 'rvce_al_2021_2',
    id: 'rvce_al_2021_2',
    name: 'Divya Murthy',
    batchYear: '2021',
    department: 'Information Science (ISE)',
    branch: 'Information Science',
    degree: 'B.E.',
    title: 'Cloud Infrastructure Architect',
    designation: 'Cloud Infrastructure Architect',
    company: 'Oracle Cloud',
    location: 'Bengaluru, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Kubernetes', 'Terraform', 'DevOps'],
    verified: true,
    color: '#002B5C'
  },

  // 2011-2020 Batch
  {
    _id: 'rvce_al_2020_1',
    id: 'rvce_al_2020_1',
    name: 'Arvind Swaminathan',
    batchYear: '2020',
    department: 'Computer Science (CSE)',
    branch: 'Computer Science',
    degree: 'B.E.',
    title: 'Senior Software Engineer',
    designation: 'Senior Software Engineer',
    company: 'Uber Technologies',
    location: 'San Francisco Bay Area, USA',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['High Concurrency', 'Kafka', 'Golang'],
    verified: true,
    color: '#002B5C'
  },
  {
    _id: 'rvce_al_2019_1',
    id: 'rvce_al_2019_1',
    name: 'Meera Krishnan',
    batchYear: '2019',
    department: 'Civil Engg (CV)',
    branch: 'Civil Engg',
    degree: 'B.E.',
    title: 'Senior Structural Engineer',
    designation: 'Senior Structural Engineer',
    company: 'Larsen & Toubro (L&T)',
    location: 'Mumbai, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Metro Infrastructure', 'BIM', 'Seismic Design'],
    verified: true,
    color: '#D97706'
  },
  {
    _id: 'rvce_al_2018_1',
    id: 'rvce_al_2018_1',
    name: 'Pranav Reddy',
    batchYear: '2018',
    department: 'Computer Science (CSE)',
    branch: 'Computer Science',
    degree: 'B.E.',
    title: 'Co-Founder & CTO',
    designation: 'Co-Founder & CTO',
    company: 'FinFlow Technologies',
    location: 'Bengaluru, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Startup', 'Fintech', 'Angel Investor'],
    verified: true,
    color: '#4F46E5'
  },
  {
    _id: 'rvce_al_2017_1',
    id: 'rvce_al_2017_1',
    name: 'Shalini Varma',
    batchYear: '2017',
    department: 'Electronics & Comm (ECE)',
    branch: 'Electronics & Comm',
    degree: 'B.E.',
    title: 'Senior Product Manager',
    designation: 'Senior Product Manager',
    company: 'Apple Inc.',
    location: 'San Francisco Bay Area, USA',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Silicon Engineering', 'Hardware PM', 'Wearables'],
    verified: true,
    color: '#002B5C'
  },
  {
    _id: 'rvce_al_2016_1',
    id: 'rvce_al_2016_1',
    name: 'Rajesh Kulkarni',
    batchYear: '2016',
    department: 'Mechanical Engg (ME)',
    branch: 'Mechanical Engg',
    degree: 'B.E.',
    title: 'Lead Powertrain Specialist',
    designation: 'Lead Powertrain Specialist',
    company: 'Mercedes-Benz R&D',
    location: 'Bengaluru, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['EV Architecture', 'Thermodynamics', 'Simulation'],
    verified: true,
    color: '#1E293B'
  },
  {
    _id: 'rvce_al_2015_1',
    id: 'rvce_al_2015_1',
    name: 'Deepa Sundaram',
    batchYear: '2015',
    department: 'Information Science (ISE)',
    branch: 'Information Science',
    degree: 'B.E.',
    title: 'Director of Engineering',
    designation: 'Director of Engineering',
    company: 'Cisco Systems',
    location: 'Bengaluru, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Networking', 'Cybersecurity', 'Leadership'],
    verified: true,
    color: '#002B5C'
  },
  {
    _id: 'rvce_al_2013_1',
    id: 'rvce_al_2013_1',
    name: 'Vinay Kumar M.',
    batchYear: '2013',
    department: 'Computer Science (CSE)',
    branch: 'Computer Science',
    degree: 'B.E.',
    title: 'Vice President of Engineering',
    designation: 'VP of Engineering',
    company: 'Swiggy',
    location: 'Bengaluru, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Hyperlocal Logistics', 'Tech Scale', 'Mentor'],
    verified: true,
    color: '#EA580C'
  },
  {
    _id: 'rvce_al_2011_1',
    id: 'rvce_al_2011_1',
    name: 'Dr. Ananya Sen',
    batchYear: '2011',
    department: 'Biotechnology (BT)',
    branch: 'Biotechnology',
    degree: 'B.E., Ph.D.',
    title: 'Principal Scientist',
    designation: 'Principal Scientist',
    company: 'AstraZeneca',
    location: 'Boston, MA, USA',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Immunotherapy', 'Drug Discovery', 'Patents'],
    verified: true,
    color: '#059669'
  },

  // 2001-2010 Batch
  {
    _id: 'rvce_al_2010_1',
    id: 'rvce_al_2010_1',
    name: 'Vikram Malhotra',
    batchYear: '2010',
    department: 'Computer Science (CSE)',
    branch: 'Computer Science',
    degree: 'B.E.',
    title: 'Partner & Venture Investor',
    designation: 'Partner',
    company: 'Peak XV Partners (Sequoia India)',
    location: 'Singapore',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Venture Capital', 'SaaS', 'Early Stage'],
    verified: true,
    color: '#15803D'
  },
  {
    _id: 'rvce_al_2008_1',
    id: 'rvce_al_2008_1',
    name: 'Sridhar Ramanathan',
    batchYear: '2008',
    department: 'Electronics & Comm (ECE)',
    branch: 'Electronics & Comm',
    degree: 'B.E.',
    title: 'VP of Technology & Modem R&D',
    designation: 'VP of Technology',
    company: 'Qualcomm',
    location: 'San Francisco Bay Area, USA',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['5G / 6G', 'Wireless Comms', 'DSP'],
    verified: true,
    color: '#1E40AF'
  },
  {
    _id: 'rvce_al_2005_1',
    id: 'rvce_al_2005_1',
    name: 'Preeti Nair',
    batchYear: '2005',
    department: 'Information Science (ISE)',
    branch: 'Information Science',
    degree: 'B.E.',
    title: 'General Manager - Cloud Enterprise',
    designation: 'General Manager',
    company: 'Microsoft',
    location: 'Seattle, WA, USA',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Enterprise Software', 'Global Sales', 'Alumni Mentor'],
    verified: true,
    color: '#002B5C'
  },
  {
    _id: 'rvce_al_2003_1',
    id: 'rvce_al_2003_1',
    name: 'Gautam Bhattacharya',
    batchYear: '2003',
    department: 'Mechanical Engg (ME)',
    branch: 'Mechanical Engg',
    degree: 'B.E., MBA',
    title: 'Managing Director & Senior Partner',
    designation: 'Managing Director',
    company: 'Boston Consulting Group (BCG)',
    location: 'London, United Kingdom',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Management Consulting', 'Strategy', 'M&A'],
    verified: true,
    color: '#047857'
  },
  {
    _id: 'rvce_al_2001_1',
    id: 'rvce_al_2001_1',
    name: 'Sanjay Shenoy',
    batchYear: '2001',
    department: 'Computer Science (CSE)',
    branch: 'Computer Science',
    degree: 'B.E.',
    title: 'Serial Tech Founder & Angel Investor',
    designation: 'Founder & Investor',
    company: 'RV Innovators Syndicate',
    location: 'Bengaluru, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Seed Investing', 'Startups', 'Advisory'],
    verified: true,
    color: '#002B5C'
  },

  // 1991-2000 Batch
  {
    _id: 'rvce_al_1999_1',
    id: 'rvce_al_1999_1',
    name: 'Ramesh Narayan',
    batchYear: '1999',
    department: 'Electrical & Electronics (EEE)',
    branch: 'Electrical & Electronics',
    degree: 'B.E.',
    title: 'Senior Director of Engineering',
    designation: 'Senior Director',
    company: 'Texas Instruments',
    location: 'Bengaluru, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Analog Power', 'Semiconductors', 'Patents'],
    verified: true,
    color: '#DC2626'
  },
  {
    _id: 'rvce_al_1996_1',
    id: 'rvce_al_1996_1',
    name: 'Madhusudan Rao',
    batchYear: '1996',
    department: 'Computer Science (CSE)',
    branch: 'Computer Science',
    degree: 'B.E., M.S.',
    title: 'IBM Fellow & Chief Scientist',
    designation: 'IBM Fellow',
    company: 'IBM Research',
    location: 'New York, USA',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Quantum Computing', 'AI Research', 'Algorithms'],
    verified: true,
    color: '#1D4ED8'
  },
  {
    _id: 'rvce_al_1993_1',
    id: 'rvce_al_1993_1',
    name: 'Sudhir Prabhu',
    batchYear: '1993',
    department: 'Mechanical Engg (ME)',
    branch: 'Mechanical Engg',
    degree: 'B.E.',
    title: 'Chief Technology Officer',
    designation: 'CTO',
    company: 'Titan Company Limited',
    location: 'Bengaluru, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Precision Engineering', 'Smart Wearables', 'Manufacturing'],
    verified: true,
    color: '#002B5C'
  },

  // 1981-1990 Batch
  {
    _id: 'rvce_al_1990_1',
    id: 'rvce_al_1990_1',
    name: 'Anil Kumble',
    batchYear: '1990',
    department: 'Mechanical Engg (ME)',
    branch: 'Mechanical Engg',
    degree: 'B.E.',
    title: 'Former Captain Indian Cricket Team & Co-Founder Spektacom',
    designation: 'Distinguished Alumnus & Tech Founder',
    company: 'Spektacom Technologies',
    location: 'Bengaluru, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Sports Tech', 'IoT Sensor Bat', 'Hall of Fame'],
    verified: true,
    color: '#002B5C'
  },
  {
    _id: 'rvce_al_1988_1',
    id: 'rvce_al_1988_1',
    name: 'Dr. K. Radhakrishnan S.',
    batchYear: '1988',
    department: 'Electrical & Electronics (EEE)',
    branch: 'Electrical & Electronics',
    degree: 'B.E., Ph.D.',
    title: 'Distinguished Scientist & Former Space Systems Director',
    designation: 'Distinguished Scientist',
    company: 'Indian Space Research Organisation (ISRO)',
    location: 'Bengaluru, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Space Systems', 'Satellite Tech', 'National Honour'],
    verified: true,
    color: '#0284C7'
  },
  {
    _id: 'rvce_al_1984_1',
    id: 'rvce_al_1984_1',
    name: 'Balakrishna Shetty',
    batchYear: '1984',
    department: 'Civil Engg (CV)',
    branch: 'Civil Engg',
    degree: 'B.E.',
    title: 'Chief Infrastructure Consultant & RSST Trustee',
    designation: 'Infrastructure Consultant',
    company: 'RSST Infrastructure Board',
    location: 'Bengaluru, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Civil Architecture', 'Campus Development', 'Philanthropy'],
    verified: true,
    color: '#92400E'
  },

  // Below 1980 Batch (Founding Batches)
  {
    _id: 'rvce_al_1978_1',
    id: 'rvce_al_1978_1',
    name: 'Prof. M. S. Ramachandra',
    batchYear: '1978',
    department: 'Mechanical Engg (ME)',
    branch: 'Mechanical Engg',
    degree: 'B.E., M.Tech',
    title: 'Emeritus Professor & Aerospace Pioneer',
    designation: 'Emeritus Professor',
    company: 'RVCE Mechanical Engineering Dept',
    location: 'Bengaluru, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Founding Faculty', 'Aerospace Mentorship', 'Legacy'],
    verified: true,
    color: '#002B5C'
  },
  {
    _id: 'rvce_al_1972_1',
    id: 'rvce_al_1972_1',
    name: 'H. N. Suresh',
    batchYear: '1972',
    department: 'Electrical & Electronics (EEE)',
    branch: 'Electrical & Electronics',
    degree: 'B.E.',
    title: 'Founding Batch Patron & Industrialist',
    designation: 'Industrialist & Patron',
    company: 'Southern Switchgear & Controls',
    location: 'Bengaluru, India',
    institution: 'RV College of Engineering',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&h=200&q=80',
    tags: ['Golden Jubilee Patron', 'Alumni Trust', 'Industrialist'],
    verified: true,
    color: '#334155'
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
  const { isAlumni, isAdmin, isSuperAdmin, isAdminOrSuper, userRole, userInstitution } = useUserRole();
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

  // ─── Batch-Wise Filtering States (AlmaConnect Style) ─────────────────
  const [selectedDecade, setSelectedDecade] = useState('all'); // 'all', '2021-30', '2011-20', etc.
  const [selectedYear, setSelectedYear] = useState('all'); // 'all' or '2023', '2024', etc.
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' (Batch-Wise Sections) or 'grid' (All Cards)
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
      console.warn('[Directory] background fetch error:', err?.message);
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
        } catch (e) {}
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

  // ─── Unified & Normalized Alumni Directory ───────────────────────────
  const unifiedAlumniList = useMemo(() => {
    const list = [];
    const seenMap = new Set();

    // 1. Process Database / Registered Users
    dbAlumni.forEach((u, i) => {
      const uid = String(u._id || u.id || `db_${i}`);
      const role = (u.role || '').toLowerCase().trim();
      const isAdminRole = role === 'admin' || role === 'super admin' || role === 'superadmin' || role === 'super_admin';
      const isSelf = currentUserId && uid && String(uid) === String(currentUserId);
      if (isAdminRole || isSelf || u.is_approved === false) return;

      const rawYear = u.batchYear || u.batch_year || u.batch || '';
      let parsedYear = '';
      if (rawYear) {
        const match = String(rawYear).match(/\b(19\d{2}|20\d{2})\b/);
        if (match) parsedYear = match[1];
        else parsedYear = String(rawYear);
      }

      seenMap.add((u.name || '').toLowerCase().trim());

      list.push({
        _id: uid,
        id: uid,
        name: u.name || 'Alumni Member',
        batchYear: parsedYear || '2023',
        department: u.department || u.branch || 'Engineering & Technology',
        branch: u.branch || u.department || 'Engineering',
        degree: u.degree || 'B.E.',
        title: u.designation || u.title || (u.company ? `Engineer @ ${u.company}` : 'Alumni Member'),
        designation: u.designation || 'Alumni Member',
        company: u.company || u.organization || 'RVCE Alumni Network',
        location: u.location || u.city || 'Bengaluru, India',
        institution: u.institution || 'RV College of Engineering',
        avatar_url: u.avatar_url || u.profilePicture || '',
        initials: getInitials(u.name || 'Alumni Member'),
        color: '#002B5C',
        verified: true,
        tags: ['RVCE Alum', 'Network', 'Mentorship']
      });
    });

    // 2. Add Curated RVCE Alumni across historical & modern batches
    CURATED_RVCE_ALUMNI.forEach((alum) => {
      const nameKey = (alum.name || '').toLowerCase().trim();
      if (!seenMap.has(nameKey)) {
        list.push({
          ...alum,
          initials: getInitials(alum.name)
        });
      }
    });

    return list;
  }, [dbAlumni, currentUserId]);

  // ─── Filter Logic ─────────────────────────────────────────────────────
  const filteredAlumni = useMemo(() => {
    return unifiedAlumniList.filter((item) => {
      // 1. Text Search (Name, Company, Title, Department, Location, Year)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (item.name || '').toLowerCase().includes(q);
        const matchesComp = (item.company || '').toLowerCase().includes(q);
        const matchesTitle = (item.title || item.designation || '').toLowerCase().includes(q);
        const matchesDept = (item.department || item.branch || '').toLowerCase().includes(q);
        const matchesLoc = (item.location || '').toLowerCase().includes(q);
        const matchesYear = (item.batchYear || '').includes(q);
        const matchesTags = (item.tags || []).some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesComp && !matchesTitle && !matchesDept && !matchesLoc && !matchesYear && !matchesTags) {
          return false;
        }
      }

      // 2. Decade Filter
      if (selectedDecade !== 'all') {
        const decadeObj = DECADE_CONFIG.find(d => d.id === selectedDecade);
        if (decadeObj) {
          const itemYearNum = parseInt(item.batchYear, 10);
          if (selectedDecade === 'below-1980') {
            if (isNaN(itemYearNum) || itemYearNum >= 1980) return false;
          } else {
            const inDecade = decadeObj.years.includes(String(item.batchYear));
            if (!inDecade) return false;
          }
        }
      }

      // 3. Individual Year Filter
      if (selectedYear !== 'all') {
        if (String(item.batchYear) !== String(selectedYear)) return false;
      }

      // 4. Department Filter
      if (selectedDepartment !== 'All Departments') {
        const deptKeyword = selectedDepartment.split('(')[1]?.replace(')', '') || selectedDepartment;
        const itemDept = (item.department || item.branch || '').toLowerCase();
        if (!itemDept.includes(deptKeyword.toLowerCase()) && !selectedDepartment.toLowerCase().includes(itemDept)) {
          return false;
        }
      }

      // 5. Location Filter
      if (selectedLocation !== 'All Locations') {
        const locLower = selectedLocation.toLowerCase();
        const itemLoc = (item.location || '').toLowerCase();
        if (!itemLoc.includes(locLower)) return false;
      }

      return true;
    });
  }, [unifiedAlumniList, searchQuery, selectedDecade, selectedYear, selectedDepartment, selectedLocation]);

  // ─── Group Alumni by Batch Year (Descending) ──────────────────────────
  const groupedByBatch = useMemo(() => {
    const groups = {};
    filteredAlumni.forEach((alum) => {
      const year = alum.batchYear || 'Unspecified';
      if (!groups[year]) groups[year] = [];
      groups[year].push(alum);
    });

    const sortedYears = Object.keys(groups).sort((a, b) => {
      const numA = parseInt(a, 10) || 0;
      const numB = parseInt(b, 10) || 0;
      return numB - numA; // newest batches first
    });

    return sortedYears.map(year => ({
      year,
      count: groups[year].length,
      members: groups[year]
    }));
  }, [filteredAlumni]);

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
      if (profileCacheStr) { try { cache = JSON.parse(profileCacheStr); } catch (e) {} }
      
      const currentList = Array.isArray(cache.followingList) ? cache.followingList : [];
      const isAlready = currentList.some(u => (u.id || u._id) === userId || (u.name || '').toLowerCase().trim() === userName);
      
      if (!isAlready) {
        const newItem = {
          id: userId,
          _id: userId,
          name: targetUser.name,
          title: targetUser.title || (targetUser.branch ? `${targetUser.branch} Alumni` : 'Alumni Member'),
          avatar: targetUser.initials || getInitials(targetUser.name),
          avatar_url: targetUser.avatar_url || ''
        };
        const newList = [...currentList, newItem];
        cache.followingList = newList;
        cache.following = newList.length.toString();
        await AsyncStorage.setItem('profileCache', JSON.stringify(cache));
      }
    } catch (e) {}

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

  // ─── Communities Setup ────────────────────────────────────────────────
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
          Alert.alert('Permission Required', 'Permission to access photos is needed to add a community icon.');
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

  // ─── Single Alumni Card Component ─────────────────────────────────────
  const renderAlumniCard = (item) => {
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
          styles.alumniCard,
          isDesktop && { width: 'calc(33.333% - 14px)', minWidth: 300, maxWidth: 420 }
        ]}
      >
        {/* Top Gold Accent Bar */}
        <View style={styles.cardAccentBar} />

        {/* Card Header: Batch Year Tag & Verified Badge */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.batchTagPill}>
            <Ionicons name="school" size={12} color="#002B5C" />
            <Text style={styles.batchTagText}>
              Class of {item.batchYear} • {item.degree || 'B.E.'}
            </Text>
          </View>
          <View style={styles.verifiedBadgeRow}>
            <Ionicons name="shield-checkmark" size={14} color="#059669" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileRow}>
          <View style={[styles.cardAvatar, { backgroundColor: item.color || '#002B5C' }]}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{item.initials}</Text>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={styles.alumniName} numberOfLines={1}>
                {item.name}
              </Text>
              <Ionicons name="checkmark-circle" size={15} color="#0284C7" />
            </View>
            <Text style={styles.alumniTitle} numberOfLines={1}>
              {item.title || item.designation || 'Alumni Member'}
            </Text>
            <View style={styles.companyRow}>
              <Ionicons name="business-outline" size={12} color="#64748B" />
              <Text style={styles.companyText} numberOfLines={1}>
                {item.company}
              </Text>
            </View>
          </View>
        </View>

        {/* Department & Location Chips */}
        <View style={styles.metaRow}>
          <View style={styles.deptChip}>
            <Ionicons name="book-outline" size={12} color="#475569" />
            <Text style={styles.deptText} numberOfLines={1}>
              {item.department || item.branch || 'Engineering'}
            </Text>
          </View>
          <View style={styles.locationChip}>
            <Ionicons name="location-outline" size={12} color="#002B5C" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location || 'Bengaluru, India'}
            </Text>
          </View>
        </View>

        {/* Skill / Topic Tags */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.map((tag, tIdx) => (
              <View key={tIdx} style={styles.tagPill}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Button Cluster (Connect, Chat, Follow, Share) */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={[
              styles.connectBtn,
              isRequested && styles.connectBtnRequested
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
            <Text style={[styles.connectBtnText, isRequested && { color: "#03543F" }]}>
              {isRequested ? 'Requested' : 'Connect'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chatIconBtn}
            onPress={() => navigation.navigate('Chat', { 
              user: { 
                id: item._id || item.id, 
                name: item.name, 
                role: `${item.company || item.department} • Batch ${item.batchYear}`, 
                initials: item.initials 
              } 
            })}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={17} color="#002B5C" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chatIconBtn, isFollowing && { backgroundColor: '#DEF7EC', borderColor: '#31C48D' }]}
            onPress={() => handleToggleFollow(item)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isFollowing ? "checkmark" : "bookmark-outline"} 
              size={17} 
              color={isFollowing ? "#059669" : "#64748B"} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chatIconBtn, { backgroundColor: '#E8FDF0', borderColor: '#A7F3D0' }]}
            onPress={() => setSharedAlumni(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={17} color="#16A34A" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Batch-Wise Grouped View ──────────────────────────────────────────
  const renderBatchWiseDirectory = () => {
    const activeDecadeObj = DECADE_CONFIG.find(d => d.id === selectedDecade);
    const availableSubYears = activeDecadeObj ? activeDecadeObj.years : [];
    const myBatchYear = currentUser?.batchYear || currentUser?.batch_year || '2023';

    return (
      <ScrollView 
        style={styles.directoryScroll} 
        contentContainerStyle={styles.directoryContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* RVCE Alumni Spotlight Banner */}
        <View style={styles.spotlightBanner}>
          <View style={styles.spotlightGlow} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <View style={styles.institutionPill}>
                <Ionicons name="school" size={12} color="#FBBF24" />
                <Text style={styles.institutionPillText}>RV College of Engineering</Text>
              </View>
              <Text style={styles.spotlightBadge}>AlmaConnect Network</Text>
            </View>
            <Text style={styles.spotlightTitle}>RVCE Alumni Directory</Text>
            <Text style={styles.spotlightSubtitle}>
              Connect with 45,000+ RVians across 50+ graduation batches worldwide
            </Text>

            {/* Quick Metrics Bar */}
            <View style={styles.metricsBar}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>50+</Text>
                <Text style={styles.metricLabel}>Batches (1963-26)</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>1,200+</Text>
                <Text style={styles.metricLabel}>Companies</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>45+</Text>
                <Text style={styles.metricLabel}>Countries</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Decade Selector Pills (AlmaConnect Header Style) ─── */}
        <View style={styles.decadeSelectorWrapper}>
          <Text style={styles.decadeSelectorTitle}>GRADUATION DECADE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.decadeScrollContent}>
            {DECADE_CONFIG.map((dec) => {
              const isSelected = selectedDecade === dec.id;
              return (
                <TouchableOpacity
                  key={dec.id}
                  style={[styles.decadePill, isSelected && styles.decadePillActive]}
                  onPress={() => {
                    setSelectedDecade(dec.id);
                    setSelectedYear('all'); // reset sub-year when decade changes
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.decadePillText, isSelected && styles.decadePillTextActive]}>
                    {dec.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── Sub-Year Pills (When Decade is Active) ─── */}
        {availableSubYears.length > 0 && (
          <View style={styles.subYearWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subYearScrollContent}>
              <TouchableOpacity
                style={[styles.yearPill, selectedYear === 'all' && styles.yearPillActive]}
                onPress={() => setSelectedYear('all')}
                activeOpacity={0.7}
              >
                <Text style={[styles.yearPillText, selectedYear === 'all' && styles.yearPillTextActive]}>
                  All Years in {activeDecadeObj?.label}
                </Text>
              </TouchableOpacity>
              {availableSubYears.map((yr) => {
                const isSelected = selectedYear === yr;
                return (
                  <TouchableOpacity
                    key={yr}
                    style={[styles.yearPill, isSelected && styles.yearPillActive]}
                    onPress={() => setSelectedYear(yr)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.yearPillText, isSelected && styles.yearPillTextActive]}>
                      Batch of {yr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ─── Filter Pills Bar: "My Batch" Shortcut + Dept + Location + View Mode ─── */}
        <View style={styles.filterControlRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
            {/* Quick "My Batch" shortcut */}
            {myBatchYear ? (
              <TouchableOpacity
                style={[
                  styles.myBatchBtn,
                  selectedYear === myBatchYear && styles.myBatchBtnActive
                ]}
                onPress={() => {
                  if (selectedYear === myBatchYear) {
                    setSelectedYear('all');
                    setSelectedDecade('all');
                  } else {
                    setSelectedYear(myBatchYear);
                    // automatically switch decade
                    const matchingDecade = DECADE_CONFIG.find(d => d.years.includes(myBatchYear));
                    if (matchingDecade) setSelectedDecade(matchingDecade.id);
                  }
                }}
                activeOpacity={0.75}
              >
                <Ionicons name="sparkles" size={13} color={selectedYear === myBatchYear ? "#002B5C" : "#FBBF24"} />
                <Text style={[styles.myBatchBtnText, selectedYear === myBatchYear && styles.myBatchBtnTextActive]}>
                  My Batch ({myBatchYear})
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* Department Filter Button */}
            <TouchableOpacity
              style={[styles.filterChipBtn, selectedDepartment !== 'All Departments' && styles.filterChipBtnActive]}
              onPress={() => setShowFiltersModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="funnel-outline" size={13} color={selectedDepartment !== 'All Departments' ? "#002B5C" : "#64748B"} />
              <Text style={[styles.filterChipText, selectedDepartment !== 'All Departments' && styles.filterChipTextActive]}>
                {selectedDepartment === 'All Departments' ? 'Departments' : selectedDepartment.split('(')[1]?.replace(')', '') || selectedDepartment}
              </Text>
              <Ionicons name="chevron-down" size={12} color="#94A3B8" />
            </TouchableOpacity>

            {/* Location Filter Button */}
            <TouchableOpacity
              style={[styles.filterChipBtn, selectedLocation !== 'All Locations' && styles.filterChipBtnActive]}
              onPress={() => setShowFiltersModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={13} color={selectedLocation !== 'All Locations' ? "#002B5C" : "#64748B"} />
              <Text style={[styles.filterChipText, selectedLocation !== 'All Locations' && styles.filterChipTextActive]}>
                {selectedLocation}
              </Text>
              <Ionicons name="chevron-down" size={12} color="#94A3B8" />
            </TouchableOpacity>

            {/* Clear All Filters */}
            {(selectedDecade !== 'all' || selectedYear !== 'all' || selectedDepartment !== 'All Departments' || selectedLocation !== 'All Locations' || searchQuery.length > 0) && (
              <TouchableOpacity
                style={styles.clearFiltersBtn}
                onPress={() => {
                  setSelectedDecade('all');
                  setSelectedYear('all');
                  setSelectedDepartment('All Departments');
                  setSelectedLocation('All Locations');
                  setSearchQuery('');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={14} color="#EF4444" />
                <Text style={styles.clearFiltersText}>Reset</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* View Mode Toggle: Batch-Wise vs All Cards */}
          <View style={styles.viewTogglePod}>
            <TouchableOpacity
              style={[styles.viewToggleItem, viewMode === 'grouped' && styles.viewToggleItemActive]}
              onPress={() => setViewMode('grouped')}
              activeOpacity={0.7}
            >
              <Ionicons name="layers" size={14} color={viewMode === 'grouped' ? '#002B5C' : '#94A3B8'} />
              <Text style={[styles.viewToggleText, viewMode === 'grouped' && styles.viewToggleTextActive]}>Batch</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleItem, viewMode === 'grid' && styles.viewToggleItemActive]}
              onPress={() => setViewMode('grid')}
              activeOpacity={0.7}
            >
              <Ionicons name="grid" size={14} color={viewMode === 'grid' ? '#002B5C' : '#94A3B8'} />
              <Text style={[styles.viewToggleText, viewMode === 'grid' && styles.viewToggleTextActive]}>Grid</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Active Filter Breadcrumb & Results Count ─── */}
        <View style={styles.resultsBar}>
          <Text style={styles.resultsCountText}>
            Showing <Text style={{ fontWeight: '800', color: theme.text }}>{filteredAlumni.length} RVians</Text>
            {selectedYear !== 'all' ? ` in Batch of ${selectedYear}` : selectedDecade !== 'all' ? ` in Decade ${selectedDecade}` : ''}
          </Text>
          {loadingDirectory && (
            <Text style={{ fontSize: 12, color: '#0284C7', fontWeight: '600' }}>Syncing with RVCE servers...</Text>
          )}
        </View>

        {/* ─── Empty State ─── */}
        {filteredAlumni.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Ionicons name="school-outline" size={54} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No RVCE Alumni Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? `No members match "${searchQuery}". Try selecting another batch, department, or clearing filters.` 
                : 'No registered members found for this specific batch or filter.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyResetBtn}
              onPress={() => {
                setSelectedDecade('all');
                setSelectedYear('all');
                setSelectedDepartment('All Departments');
                setSelectedLocation('All Locations');
                setSearchQuery('');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyResetBtnText}>View All Batches</Text>
            </TouchableOpacity>
          </View>
        ) : viewMode === 'grouped' ? (
          // ─── Batch-Wise Grouped Display ───
          <View style={{ gap: 20 }}>
            {groupedByBatch.map((batchGroup) => {
              const isCollapsed = !!collapsedBatches[batchGroup.year];

              return (
                <View key={batchGroup.year} style={styles.batchSectionContainer}>
                  {/* Batch Section Header */}
                  <TouchableOpacity
                    style={styles.batchSectionHeader}
                    onPress={() => toggleBatchCollapse(batchGroup.year)}
                    activeOpacity={0.85}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={styles.batchYearBadge}>
                        <Ionicons name="ribbon" size={16} color="#002B5C" />
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.batchSectionTitle}>
                            Batch of {batchGroup.year}
                          </Text>
                          <View style={styles.batchCountPill}>
                            <Text style={styles.batchCountText}>
                              {batchGroup.count} {batchGroup.count === 1 ? 'RVian' : 'RVians'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.batchSectionSub}>
                          Class of {batchGroup.year} • B.E. / M.Tech / MCA Alumni
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.batchToggleLabel}>
                        {isCollapsed ? 'Show' : 'Hide'}
                      </Text>
                      <Ionicons
                        name={isCollapsed ? "chevron-down" : "chevron-up"}
                        size={18}
                        color="#64748B"
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Batch Members Cards */}
                  {!isCollapsed && (
                    <View style={styles.batchCardsGrid}>
                      {batchGroup.members.map(renderAlumniCard)}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          // ─── Flat Grid / List Display ───
          <View style={styles.batchCardsGrid}>
            {filteredAlumni.map(renderAlumniCard)}
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

  // ─── WhatsApp-Style Communities ──────────────────────────────────────
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

            <View style={styles.waCommunityFooter}>
              <TouchableOpacity 
                style={styles.waViewAllBtn}
                onPress={() => setCommunityModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={16} color="#002B5C" />
                <Text style={styles.waViewAllText}>Add Group to Community</Text>
              </TouchableOpacity>
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

        {/* ───── Top Header ───── */}
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
              placeholder="Search by Name, Batch, Branch, Company, City..."
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

        {/* Role Banner for Admin/Super Admin */}
        {isAdminOrSuper && (
          <View style={styles.adminBanner}>
            <Ionicons name="shield-checkmark" size={16} color="#003366" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#003366' }}>{userRole} Mode</Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>AlmaConnect Directory & Verification Control</Text>
          </View>
        )}

        {/* ───── Main Tab Bar (Directory / Requests / Communities) ───── */}
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
                Alumni Directory
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

        {/* ───── Main View Body ───── */}
        {activeTab === 'directory' ? (
          renderBatchWiseDirectory()
        ) : activeTab === 'request' ? (
          renderRequestTab()
        ) : (
          renderCommunityTab()
        )}

        {/* ───── Filter Modal (Department & Location) ───── */}
        <Modal visible={showFiltersModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.filterModalBox}>
              <View style={styles.filterModalHeader}>
                <Text style={styles.filterModalTitle}>Filter Directory</Text>
                <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
                  <Ionicons name="close" size={24} color="#002B5C" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {/* Department Selection */}
                <Text style={styles.filterSectionTitle}>COURSE / DEPARTMENT</Text>
                <View style={{ gap: 6, marginBottom: 18 }}>
                  {DEPARTMENTS.map((dept) => (
                    <TouchableOpacity
                      key={dept}
                      style={[
                        styles.filterOptionRow,
                        selectedDepartment === dept && styles.filterOptionRowActive
                      ]}
                      onPress={() => setSelectedDepartment(dept)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterOptionText, selectedDepartment === dept && styles.filterOptionTextActive]}>
                        {dept}
                      </Text>
                      {selectedDepartment === dept && (
                        <Ionicons name="checkmark-circle" size={18} color="#002B5C" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Location Selection */}
                <Text style={styles.filterSectionTitle}>LOCATION / CHAPTER</Text>
                <View style={{ gap: 6, marginBottom: 18 }}>
                  {LOCATIONS.map((loc) => (
                    <TouchableOpacity
                      key={loc}
                      style={[
                        styles.filterOptionRow,
                        selectedLocation === loc && styles.filterOptionRowActive
                      ]}
                      onPress={() => setSelectedLocation(loc)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterOptionText, selectedLocation === loc && styles.filterOptionTextActive]}>
                        {loc}
                      </Text>
                      {selectedLocation === loc && (
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
                    Your new WhatsApp-style community &quot;{communityName}&quot; is active.
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
    fontSize: 13.5,
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

  /* Spotlight Banner */
  spotlightBanner: {
    backgroundColor: '#002B5C',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  spotlightGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  institutionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  institutionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBBF24',
  },
  spotlightBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93C5FD',
  },
  spotlightTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  spotlightSubtitle: {
    fontSize: 13,
    color: '#E2E8F0',
    marginTop: 4,
    lineHeight: 18,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FBBF24',
  },
  metricLabel: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  /* Decade Selector (AlmaConnect Header Style) */
  decadeSelectorWrapper: {
    marginBottom: 10,
  },
  decadeSelectorTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },
  decadeScrollContent: {
    gap: 8,
    paddingBottom: 4,
  },
  decadePill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  decadePillActive: {
    backgroundColor: '#002B5C',
    borderColor: '#002B5C',
  },
  decadePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  decadePillTextActive: {
    color: '#FFFFFF',
  },

  /* Sub-Year Pills */
  subYearWrapper: {
    marginBottom: 14,
  },
  subYearScrollContent: {
    gap: 8,
    paddingBottom: 2,
  },
  yearPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  yearPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#002B5C',
    borderWidth: 1.5,
  },
  yearPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  yearPillTextActive: {
    color: '#002B5C',
  },

  /* Filter Control Row */
  filterControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  myBatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#002B5C',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  myBatchBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  myBatchBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  myBatchBtnTextActive: {
    color: '#002B5C',
  },
  filterChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  filterChipBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#002B5C',
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  viewTogglePod: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewToggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  viewToggleItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  viewToggleText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  viewToggleTextActive: {
    color: '#002B5C',
  },

  /* Results Bar */
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  resultsCountText: {
    fontSize: 13,
    color: '#64748B',
  },

  /* Directory Scroll Container */
  directoryScroll: {
    flex: 1,
  },
  directoryContentContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  /* Batch Section Group */
  batchSectionContainer: {
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
  batchSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  batchYearBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  batchSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002B5C',
    letterSpacing: -0.2,
  },
  batchCountPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  batchCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  batchSectionSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  batchToggleLabel: {
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

  /* Alumni Card */
  alumniCard: {
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
  cardAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#002B5C',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  batchTagPill: {
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
  batchTagText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#002B5C',
  },
  verifiedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  alumniName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  alumniTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#002B5C',
    marginTop: 2,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  companyText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  deptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deptText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#002B5C',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 12,
  },
  tagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  tagText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  connectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#002B5C',
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectBtnRequested: {
    backgroundColor: '#DEF7EC',
    borderWidth: 1,
    borderColor: '#31C48D',
  },
  connectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chatIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },

  /* Empty State */
  emptyStateBox: {
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
  emptyResetBtn: {
    marginTop: 18,
    backgroundColor: '#002B5C',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyResetBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Filter Modal */
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
  waCommunityFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  waViewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waViewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#002B5C',
  },

  /* Community Modal */
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
