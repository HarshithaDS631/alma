import React, { useState, useMemo, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  FlatList,
  Modal,
  Switch,
  ActivityIndicator,
  Platform,
  Image,
  Share,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getPosts, getEvents } from '../services/authService';
import { getEmailStats } from '../services/adminService';

// ==========================================
// DUMMY DATABASE / SEED DATA
// ==========================================

const INSTITUTIONS = [
  { id: '0', name: 'Mediacell', shortName: 'Mediacell', location: 'Bengaluru, Karnataka', established: 2024, totalAlumni: 1200, registeredUsers: 350, admins: 2, status: 'Active', color: '#003366' },
  { id: '1', name: 'RV School', shortName: 'RVS', location: 'Bengaluru, Karnataka', established: 1999, totalAlumni: 1500, registeredUsers: 400, admins: 2, status: 'Active', color: '#003366' },
  { id: '2', name: 'RV Girls High School', shortName: 'RVGHS', location: 'Bengaluru, Karnataka', established: 1999, totalAlumni: 1500, registeredUsers: 400, admins: 2, status: 'Active', color: '#003366' },
  { id: '3', name: 'RV Public School', shortName: 'RVPS', location: 'Bengaluru, Karnataka', established: 1999, totalAlumni: 1500, registeredUsers: 400, admins: 2, status: 'Active', color: '#003366' },
  { id: '4', name: 'RV Learning Hub', shortName: 'RVLH', location: 'Bengaluru, Karnataka', established: 1999, totalAlumni: 1500, registeredUsers: 400, admins: 2, status: 'Active', color: '#003366' },
  { id: '5', name: 'SSMRV PU College', shortName: 'SSMRVPU', location: 'Bengaluru, Karnataka', established: 1999, totalAlumni: 1500, registeredUsers: 400, admins: 2, status: 'Active', color: '#003366' },
  { id: '6', name: 'NMKRV PU College', shortName: 'NMKRVPU', location: 'Bengaluru, Karnataka', established: 1999, totalAlumni: 1500, registeredUsers: 400, admins: 2, status: 'Active', color: '#003366' },
  { id: '7', name: 'RV PU College Jayanagar', shortName: 'RVPU_JAY', location: 'Bengaluru, Karnataka', established: 1999, totalAlumni: 1500, registeredUsers: 400, admins: 2, status: 'Active', color: '#003366' },
  { id: '8', name: 'RV PU College North', shortName: 'RVPU_NOR', location: 'Bengaluru, Karnataka', established: 1999, totalAlumni: 1500, registeredUsers: 400, admins: 2, status: 'Active', color: '#003366' },
  { id: '9', name: 'RV PU College South', shortName: 'RVPU_SOU', location: 'Bengaluru, Karnataka', established: 1999, totalAlumni: 1500, registeredUsers: 400, admins: 2, status: 'Active', color: '#003366' },
  { id: '10', name: 'RV PU College, E-City', shortName: 'RVPU_ECI', location: 'Bengaluru, Karnataka', established: 1999, totalAlumni: 1500, registeredUsers: 400, admins: 2, status: 'Active', color: '#003366' },
  { id: '11', name: 'RV PU College, Harohalli', shortName: 'RVPU_HAR', location: 'Bengaluru, Karnataka', established: 1999, totalAlumni: 1500, registeredUsers: 400, admins: 2, status: 'Active', color: '#003366' },
  { id: '12', name: 'RV PU College, Mysuru', shortName: 'RVPU_MYS', location: 'Bengaluru, Karnataka', established: 1999, totalAlumni: 1500, registeredUsers: 400, admins: 2, status: 'Active', color: '#003366' },
  { id: '13', name: 'RV College of Engineering', shortName: 'RVCE', location: 'Bengaluru, Karnataka', established: 1963, totalAlumni: 9755, registeredUsers: 3420, admins: 5, status: 'Active', color: '#003366' },
  { id: '14', name: 'RV Institute of Technology and Management', shortName: 'RVITM', location: 'Bengaluru, Karnataka', established: 2019, totalAlumni: 4230, registeredUsers: 1580, admins: 3, status: 'Active', color: '#1E3A5F' },
  { id: '15', name: 'RV-Skills', shortName: 'RVSK', location: 'Bengaluru, Karnataka', established: 1999, totalAlumni: 1500, registeredUsers: 400, admins: 2, status: 'Active', color: '#003366' },
  { id: '16', name: 'RV College of Architecture', shortName: 'RVCA', location: 'Bengaluru, Karnataka', established: 1992, totalAlumni: 2800, registeredUsers: 980, admins: 2, status: 'Active', color: '#4F46E5' },
  { id: '17', name: 'RV Institute of Management', shortName: 'RVIM', location: 'Bengaluru, Karnataka', established: 1999, totalAlumni: 3500, registeredUsers: 1240, admins: 3, status: 'Active', color: '#0891B2' },
  { id: '18', name: 'MKPM RV Institute of Legal Studies', shortName: 'RVILS', location: 'Bengaluru, Karnataka', established: 2018, totalAlumni: 950, registeredUsers: 380, admins: 2, status: 'Active', color: '#DC2626' },
  { id: '19', name: 'RV Teachers College', shortName: 'RVTC', location: 'Bengaluru, Karnataka', established: 1954, totalAlumni: 3200, registeredUsers: 640, admins: 2, status: 'Active', color: '#8B5CF6' },
  { id: '20', name: 'D.A. Pandu Memorial RV Dental College', shortName: 'DAPMRV', location: 'Bengaluru, Karnataka', established: 1992, totalAlumni: 2400, registeredUsers: 870, admins: 2, status: 'Active', color: '#2563EB' },
  { id: '21', name: 'RV College of Physiotherapy', shortName: 'RVCP', location: 'Bengaluru, Karnataka', established: 2003, totalAlumni: 1700, registeredUsers: 580, admins: 2, status: 'Active', color: '#BE185D' },
  { id: '22', name: 'RV College of Nursing', shortName: 'RVCN', location: 'Bengaluru, Karnataka', established: 2003, totalAlumni: 1500, registeredUsers: 490, admins: 2, status: 'Active', color: '#0D9488' },
  { id: '23', name: 'NMKRV College', shortName: 'NMKRV', location: 'Bengaluru, Karnataka', established: 1973, totalAlumni: 15000, registeredUsers: 490, admins: 2, status: 'Active', color: '#0D9488' },
  { id: '24', name: 'SSMRV College', shortName: 'SSMRV', location: 'Bengaluru, Karnataka', established: 1984, totalAlumni: 12000, registeredUsers: 490, admins: 2, status: 'Active', color: '#0D9488' },
  { id: '25', name: 'RV University, Bengaluru Campus', shortName: 'RVU_BLR', location: 'Bengaluru, Karnataka', established: 2021, totalAlumni: 1200, registeredUsers: 450, admins: 3, status: 'Active', color: '#B45309' },
  { id: '26', name: 'RV University, Mysuru Campus', shortName: 'RVU_MYS', location: 'Mysuru, Karnataka', established: 2024, totalAlumni: 0, registeredUsers: 0, admins: 3, status: 'Active', color: '#B45309' },
];

const INITIAL_ADMINS = [];

const INITIAL_SPAM_REPORTS = [];

const RVCE_VERIFICATION_DB = [];

const checkDatabaseVerification = (name, batchYear, joiningYear, institution) => {
  if (!name) return { verified: false, reason: 'Name is missing' };
  const cleanName = name.toLowerCase().trim();
  
  let dbToSearch = [];
  if (institution === 'RV College of Engineering' || institution === 'RVCE') {
    dbToSearch = RVCE_VERIFICATION_DB;
  } else {
    return { verified: false, reason: 'No database record' };
  }

  const match = dbToSearch.find(
    (item) => item.name.toLowerCase().trim() === cleanName
  );

  if (!match) {
    return { verified: false, reason: 'No database record' };
  }
  
  if (batchYear && match.leaving !== batchYear.toString().trim()) {
    return { verified: false, reason: `Yr mismatch (Exp ${match.leaving}, got ${batchYear})` };
  }
  
  if (joiningYear && match.joining !== joiningYear.toString().trim()) {
    return { verified: false, reason: `Yr mismatch (Exp ${match.joining}, got ${joiningYear})` };
  }
  
  return { verified: true, matchRecord: match };
};

const INITIAL_MEMBERSHIP_REQUESTS = [];

const INITIAL_PLACEMENTS = [];

const INITIAL_ACTIVITIES = [];

const INITIAL_IMPORTS = [];

const INITIAL_NETWORK_SETTINGS = {
  'Mediacell': { institutionName: 'Mediacell', shortTitle: 'Mediacell', website: 'https://rvei.edu.in', established: '2024', location: 'Bengaluru, Karnataka', primaryColor: '#003366', secondaryColor: '#00a99c', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Faculty', batchmatesText: 'Batchmates', manualApproval: true, emailVouching: false, allowUnverified: true, displayJobs: true, displayEvents: true, displayGroups: true, displayMemories: true, displayDonations: true, displayMentorship: true, displayAlumniCard: true, welcomeEmailEnabled: true, whatsappEnabled: true },
  'RVCE': { institutionName: 'RV College of Engineering', shortTitle: 'RVCE', website: 'https://rvce.edu.in', established: '1963', location: 'Bengaluru, Karnataka', primaryColor: '#4F46E5', secondaryColor: '#00a99c', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Faculty', batchmatesText: 'Batchmates', manualApproval: true, emailVouching: false, allowUnverified: true, displayJobs: true, displayEvents: true, displayGroups: true, displayMemories: true, displayDonations: false, displayMentorship: true, displayAlumniCard: false, welcomeEmailEnabled: true, whatsappEnabled: false },
  'Institution': { institutionName: 'Institute of Technology', shortTitle: 'Institution', website: 'https://institution.edu.in', established: '2019', location: 'Bengaluru, Karnataka', primaryColor: '#1a5276', secondaryColor: '#2ecc71', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Faculty', batchmatesText: 'Classmates', manualApproval: true, emailVouching: true, allowUnverified: false, displayJobs: true, displayEvents: true, displayGroups: false, displayMemories: true, displayDonations: true, displayMentorship: true, displayAlumniCard: true, welcomeEmailEnabled: true, whatsappEnabled: true },
  'RVPU': { institutionName: 'RV PU College', shortTitle: 'RVPU', website: 'https://rvpucollege.edu.in', established: '1970', location: 'Bengaluru, Karnataka', primaryColor: '#8e44ad', secondaryColor: '#e74c3c', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Teachers', batchmatesText: 'Batchmates', manualApproval: false, emailVouching: false, allowUnverified: true, displayJobs: false, displayEvents: true, displayGroups: true, displayMemories: true, displayDonations: false, displayMentorship: false, displayAlumniCard: false, welcomeEmailEnabled: false, whatsappEnabled: false },
  'RVIS': { institutionName: 'RV International School', shortTitle: 'RVIS', website: 'https://rvis.edu.in', established: '1999', location: 'Bengaluru, Karnataka', primaryColor: '#e67e22', secondaryColor: '#f39c12', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Teachers', batchmatesText: 'Schoolmates', manualApproval: true, emailVouching: false, allowUnverified: false, displayJobs: false, displayEvents: true, displayGroups: true, displayMemories: true, displayDonations: true, displayMentorship: false, displayAlumniCard: true, welcomeEmailEnabled: true, whatsappEnabled: false },
  'RVU': { institutionName: 'RV University', shortTitle: 'RVU', website: 'https://rvu.edu.in', established: '2021', location: 'Bengaluru, Karnataka', primaryColor: '#B45309', secondaryColor: '#F59E0B', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Faculty', batchmatesText: 'Classmates', manualApproval: true, emailVouching: true, allowUnverified: true, displayJobs: true, displayEvents: true, displayGroups: true, displayMemories: true, displayDonations: true, displayMentorship: true, displayAlumniCard: true, welcomeEmailEnabled: true, whatsappEnabled: true },
  'RVCA': { institutionName: 'RV College of Architecture', shortTitle: 'RVCA', website: 'https://rvca.edu.in', established: '1992', location: 'Bengaluru, Karnataka', primaryColor: '#4F46E5', secondaryColor: '#818CF8', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Faculty', batchmatesText: 'Batchmates', manualApproval: true, emailVouching: false, allowUnverified: true, displayJobs: true, displayEvents: true, displayGroups: true, displayMemories: true, displayDonations: false, displayMentorship: true, displayAlumniCard: false, welcomeEmailEnabled: true, whatsappEnabled: false },
  'RVIM': { institutionName: 'RV Institute of Management', shortTitle: 'RVIM', website: 'https://rvim.edu.in', established: '1999', location: 'Bengaluru, Karnataka', primaryColor: '#0891B2', secondaryColor: '#22D3EE', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Faculty', batchmatesText: 'Classmates', manualApproval: true, emailVouching: false, allowUnverified: true, displayJobs: true, displayEvents: true, displayGroups: true, displayMemories: true, displayDonations: true, displayMentorship: true, displayAlumniCard: true, welcomeEmailEnabled: true, whatsappEnabled: false },
  'RVILS': { institutionName: 'RV Institute of Legal Studies', shortTitle: 'RVILS', website: 'https://rvils.edu.in', established: '2018', location: 'Bengaluru, Karnataka', primaryColor: '#DC2626', secondaryColor: '#F87171', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Faculty', batchmatesText: 'Batchmates', manualApproval: true, emailVouching: false, allowUnverified: false, displayJobs: true, displayEvents: true, displayGroups: false, displayMemories: true, displayDonations: false, displayMentorship: true, displayAlumniCard: false, welcomeEmailEnabled: true, whatsappEnabled: false },
  'DAPMRV': { institutionName: 'DAPM RV Dental College', shortTitle: 'DAPMRV', website: 'https://rvdentalcollege.org', established: '1992', location: 'Bengaluru, Karnataka', primaryColor: '#2563EB', secondaryColor: '#60A5FA', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Faculty', batchmatesText: 'Batchmates', manualApproval: true, emailVouching: false, allowUnverified: true, displayJobs: true, displayEvents: true, displayGroups: true, displayMemories: true, displayDonations: false, displayMentorship: true, displayAlumniCard: false, welcomeEmailEnabled: true, whatsappEnabled: false },
  'RVCN': { institutionName: 'RV College of Nursing', shortTitle: 'RVCN', website: 'https://rvnursing.edu.in', established: '2003', location: 'Bengaluru, Karnataka', primaryColor: '#0D9488', secondaryColor: '#2DD4BF', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Faculty', batchmatesText: 'Batchmates', manualApproval: true, emailVouching: false, allowUnverified: true, displayJobs: true, displayEvents: true, displayGroups: false, displayMemories: true, displayDonations: false, displayMentorship: true, displayAlumniCard: false, welcomeEmailEnabled: true, whatsappEnabled: false },
  'RVCP': { institutionName: 'RV College of Physiotherapy', shortTitle: 'RVCP', website: 'https://rvphysiotherapy.edu.in', established: '2003', location: 'Bengaluru, Karnataka', primaryColor: '#BE185D', secondaryColor: '#F472B6', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Faculty', batchmatesText: 'Batchmates', manualApproval: true, emailVouching: false, allowUnverified: true, displayJobs: true, displayEvents: true, displayGroups: false, displayMemories: true, displayDonations: false, displayMentorship: true, displayAlumniCard: false, welcomeEmailEnabled: true, whatsappEnabled: false },
  'RVTC': { institutionName: 'RV Teachers College', shortTitle: 'RVTC', website: 'https://rvtc.edu.in', established: '1954', location: 'Bengaluru, Karnataka', primaryColor: '#8B5CF6', secondaryColor: '#A78BFA', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Faculty', batchmatesText: 'Batchmates', manualApproval: true, emailVouching: false, allowUnverified: true, displayJobs: false, displayEvents: true, displayGroups: true, displayMemories: true, displayDonations: false, displayMentorship: false, displayAlumniCard: false, welcomeEmailEnabled: true, whatsappEnabled: false },
  'RVTTI': { institutionName: 'RV Teachers Training Institute', shortTitle: 'RVTTI', website: 'https://rvtti.edu.in', established: '1940', location: 'Bengaluru, Karnataka', primaryColor: '#10B981', secondaryColor: '#34D399', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Faculty', batchmatesText: 'Batchmates', manualApproval: true, emailVouching: false, allowUnverified: true, displayJobs: false, displayEvents: true, displayGroups: true, displayMemories: true, displayDonations: false, displayMentorship: false, displayAlumniCard: false, welcomeEmailEnabled: true, whatsappEnabled: false },
  'NMKRV': { institutionName: 'NMKRV College for Women', shortTitle: 'NMKRV', website: 'https://nmkrv.edu.in', established: '1973', location: 'Bengaluru, Karnataka', primaryColor: '#EC4899', secondaryColor: '#F472B6', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Faculty', batchmatesText: 'Batchmates', manualApproval: true, emailVouching: false, allowUnverified: true, displayJobs: true, displayEvents: true, displayGroups: true, displayMemories: true, displayDonations: false, displayMentorship: true, displayAlumniCard: false, welcomeEmailEnabled: true, whatsappEnabled: false },
  'SSMRV': { institutionName: 'SSMRV College', shortTitle: 'SSMRV', website: 'https://ssmrv.edu.in', established: '1982', location: 'Bengaluru, Karnataka', primaryColor: '#3B82F6', secondaryColor: '#60A5FA', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Faculty', batchmatesText: 'Batchmates', manualApproval: true, emailVouching: false, allowUnverified: true, displayJobs: true, displayEvents: true, displayGroups: true, displayMemories: true, displayDonations: false, displayMentorship: true, displayAlumniCard: false, welcomeEmailEnabled: true, whatsappEnabled: false },
  'RVPS': { institutionName: 'RV Public School', shortTitle: 'RVPS', website: 'https://rvps.edu.in', established: '1992', location: 'Bengaluru, Karnataka', primaryColor: '#6B7280', secondaryColor: '#9CA3AF', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Teachers', batchmatesText: 'Schoolmates', manualApproval: true, emailVouching: false, allowUnverified: false, displayJobs: false, displayEvents: true, displayGroups: true, displayMemories: true, displayDonations: false, displayMentorship: false, displayAlumniCard: false, welcomeEmailEnabled: true, whatsappEnabled: false },
  'RVS': { institutionName: 'RV School', shortTitle: 'RVS', website: 'https://rvschool.edu.in', established: '1940', location: 'Bengaluru, Karnataka', primaryColor: '#78350F', secondaryColor: '#D97706', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Teachers', batchmatesText: 'Schoolmates', manualApproval: true, emailVouching: false, allowUnverified: false, displayJobs: false, displayEvents: true, displayGroups: true, displayMemories: true, displayDonations: false, displayMentorship: false, displayAlumniCard: false, welcomeEmailEnabled: true, whatsappEnabled: false },
  'RVLH': { institutionName: 'RV Learning Hub', shortTitle: 'RVLH', website: 'https://rvlearninghub.com', established: '2020', location: 'Bengaluru, Karnataka', primaryColor: '#111827', secondaryColor: '#374151', alumniText: 'Alumni', studentsText: 'Students', facultyText: 'Teachers', batchmatesText: 'Batchmates', manualApproval: true, emailVouching: false, allowUnverified: false, displayJobs: false, displayEvents: true, displayGroups: true, displayMemories: true, displayDonations: false, displayMentorship: false, displayAlumniCard: false, welcomeEmailEnabled: true, whatsappEnabled: false },
};

const MASTER_LOCATIONS = ['Bengaluru, Karnataka', 'Mysuru, Karnataka', 'Mumbai, Maharashtra', 'Hyderabad, Telangana', 'Chennai, Tamil Nadu'];
const MASTER_BATCHES = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];
const MASTER_COMPANIES = ['Cisco Systems', 'Accenture', 'Qualcomm', 'Infosys', 'Wipro', 'TCS', 'IBM', 'Amazon', 'Google', 'Microsoft', 'Oracle', 'SAP'];

const panelItems = [
  { id: '0', title: 'Alumni Portals', icon: 'grid-outline', color: '#EFF6FF', iconColor: '#2563EB', moduleName: 'alumni_portals_grid', desc: 'Select institution to access dedicated alumni networks' },
  { id: '1', title: 'Administrator', icon: 'person-add-outline', color: '#FEF3C7', iconColor: '#D97706', moduleName: 'administrator', desc: 'Manage institution administrators' },
  { id: '2', title: 'Network Settings', icon: 'settings-outline', color: '#F5F3FF', iconColor: '#7C3AED', moduleName: 'network_settings', desc: 'AlmaConnect-style institution configs' },
  { id: '3', title: 'Bulk Import', icon: 'cloud-upload-outline', color: '#ECFDF5', iconColor: '#059669', moduleName: 'bulk_import', desc: 'Bulk import alumni profiles via CSV' },
  { id: '4', title: 'Logs/Stats', icon: 'bar-chart-outline', color: '#FFF1F2', iconColor: '#E11D48', moduleName: 'logs_stats', desc: 'Database, visitors, jobs & email charts' },
  { id: '5', title: 'Admin Activities', icon: 'time-outline', color: '#F1F5F9', iconColor: '#475569', moduleName: 'admin_activities', desc: 'Audit log of actions taken by admins' },
  { id: '6', title: 'Master List', icon: 'list-outline', color: '#F0FDF4', iconColor: '#16A34A', moduleName: 'master_list', desc: 'Institutions, locations, batches & companies' },
];

const MOCK_POSTS = [];

const SuperAdminDashboardScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const { width } = useWindowDimensions();
  const initialModule = route?.params?.initialModule ?? null;
  const [activeModule, setActiveModule] = useState(initialModule);
  const [selectedInstitution, setSelectedInstitution] = useState(global.selectedInstitution || 'All');
  const isFocused = useIsFocused();

  // Sync selected institution with global value when screen is focused
  useEffect(() => {
    if (isFocused && global.selectedInstitution) {
      setSelectedInstitution(global.selectedInstitution);
    }
  }, [isFocused]);

  // Sync activeModule with route params when route.params.initialModule changes
  useEffect(() => {
    setActiveModule(route?.params?.initialModule ?? null);
  }, [route?.params?.initialModule]);

  // Dynamic Welcome Mail Templates
  useEffect(() => {
    const instName = selectedInstitution === 'All' ? 'RV Educational Institutions' : selectedInstitution;
    setWelcomeSubject(`Welcome to ${instName} Admin Portal`);
    setWelcomeBody(`Dear Admin,\n\nYour administrator account has been created successfully for ${selectedInstitution === 'All' ? 'your campus' : getInstitutionDetails(selectedInstitution).fullName}. Please log in using your registered credentials.\n\nBest regards,\nSuper Admin Team`);
  }, [selectedInstitution]);

  // Dynamic States
  const [admins, setAdmins] = useState(INITIAL_ADMINS);
  const [spamReports, setSpamReports] = useState(INITIAL_SPAM_REPORTS);
  const [membershipRequests, setMembershipRequests] = useState(INITIAL_MEMBERSHIP_REQUESTS);
  const [placements, setPlacements] = useState(INITIAL_PLACEMENTS);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [imports, setImports] = useState(INITIAL_IMPORTS);
  const [networkSettings, setNetworkSettings] = useState(INITIAL_NETWORK_SETTINGS);
  const [actualStats, setActualStats] = useState({ posts: 0, events: 0 });
  const [emailStats, setEmailStats] = useState({ sent: 0, opened: 0, clicked: 0, openRate: 0, clickRate: 0 });

  useEffect(() => {
    const fetchSuperAdminData = async () => {
      try {
        const [postsData, eventsData, statsData] = await Promise.allSettled([
          getPosts(),
          getEvents(),
          getEmailStats({ institution: selectedInstitution })
        ]);
        setActualStats({
          posts: postsData.status === 'fulfilled' && postsData.value ? postsData.value.length : 0,
          events: eventsData.status === 'fulfilled' && eventsData.value ? eventsData.value.length : 0,
        });
        if (statsData.status === 'fulfilled' && statsData.value) {
          setEmailStats(statsData.value);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSuperAdminData();
  }, [selectedInstitution]);

  // News Feed & Dropdown States
  const [postsList, setPostsList] = useState(MOCK_POSTS);
  const [likedPosts, setLikedPosts] = useState({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState({});
  const [followedUsers, setFollowedUsers] = useState({});
  const [showInstDropdown, setShowInstDropdown] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');

  // Post Actions
  const togglePostLike = (postId) => {
    setLikedPosts((prev) => {
      const isLiked = prev[postId];
      setPostsList(curr => curr.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likes: isLiked ? p.likes - 1 : p.likes + 1
          };
        }
        return p;
      }));
      return { ...prev, [postId]: !isLiked };
    });
  };

  const togglePostBookmark = (postId) => {
    setBookmarkedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const togglePostFollow = (postId) => {
    setFollowedUsers((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handlePostShare = async (post) => {
    try {
      await Share.share({
        message: `Check out this post from ${post.user} on Alumni App:\n"${post.content}"`,
      });
    } catch (_error) {
      Alert.alert('Error', 'Could not share this post');
    }
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: 'None', color: theme.textMuted };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, text: 'Weak', color: theme.danger };
    if (score <= 4) return { score, text: 'Medium', color: theme.warning };
    return { score, text: 'Strong', color: '#10B981' };
  };

  // Helper function to get rich institution metadata
  const getInstitutionDetails = (inst) => {
    switch (inst) {
      case 'RVCE':
        return {
          fullName: 'RV College of Engineering',
          subtitle: 'Bengaluru, Karnataka • Est. 1963',
          logo: 'CE',
          color: '#4F46E5',
        };
      case 'Institution':
        return {
          fullName: 'Institute of Technology',
          subtitle: 'Bengaluru, Karnataka • Est. 2019',
          logo: 'TM',
          color: '#1E3A5F',
        };
      case 'RVPU':
        return {
          fullName: 'RV PU College',
          subtitle: 'Bengaluru, Karnataka • Est. 1970',
          logo: 'PU',
          color: '#7C3AED',
        };
      case 'RVIS':
        return {
          fullName: 'RV International School',
          subtitle: 'Bengaluru, Karnataka • Est. 1999',
          logo: 'IS',
          color: '#059669',
        };
      case 'RVU':
        return {
          fullName: 'RV University',
          subtitle: 'Bengaluru, Karnataka • Est. 2021',
          logo: 'RV',
          color: '#B45309',
        };
      case 'RVCA':
        return {
          fullName: 'RV College of Architecture',
          subtitle: 'Bengaluru, Karnataka • Est. 1992',
          logo: 'CA',
          color: '#4F46E5',
        };
      case 'RVIM':
        return {
          fullName: 'RV Institute of Management',
          subtitle: 'Bengaluru, Karnataka • Est. 1999',
          logo: 'IM',
          color: '#0891B2',
        };
      case 'RVILS':
        return {
          fullName: 'RV Institute of Legal Studies',
          subtitle: 'Bengaluru, Karnataka • Est. 2018',
          logo: 'LS',
          color: '#DC2626',
        };
      case 'DAPMRV':
        return {
          fullName: 'DAPM RV Dental College',
          subtitle: 'Bengaluru, Karnataka • Est. 1992',
          logo: 'DC',
          color: '#2563EB',
        };
      case 'RVCN':
        return {
          fullName: 'RV College of Nursing',
          subtitle: 'Bengaluru, Karnataka • Est. 2003',
          logo: 'CN',
          color: '#0D9488',
        };
      case 'RVCP':
        return {
          fullName: 'RV College of Physiotherapy',
          subtitle: 'Bengaluru, Karnataka • Est. 2003',
          logo: 'CP',
          color: '#BE185D',
        };
      case 'RVTC':
        return {
          fullName: 'RV Teachers College',
          subtitle: 'Bengaluru, Karnataka • Est. 1954',
          logo: 'TC',
          color: '#8B5CF6',
        };
      case 'RVTTI':
        return {
          fullName: 'RV Teachers Training Institute',
          subtitle: 'Bengaluru, Karnataka • Est. 1940',
          logo: 'TT',
          color: '#10B981',
        };
      case 'NMKRV':
        return {
          fullName: 'NMKRV College for Women',
          subtitle: 'Bengaluru, Karnataka • Est. 1973',
          logo: 'NK',
          color: '#EC4899',
        };
      case 'SSMRV':
        return {
          fullName: 'SSMRV College',
          subtitle: 'Bengaluru, Karnataka • Est. 1982',
          logo: 'SS',
          color: '#3B82F6',
        };
      case 'RVPS':
        return {
          fullName: 'RV Public School',
          subtitle: 'Bengaluru, Karnataka • Est. 1992',
          logo: 'PS',
          color: '#6B7280',
        };
      case 'RVS':
        return {
          fullName: 'RV School',
          subtitle: 'Bengaluru, Karnataka • Est. 1940',
          logo: 'RS',
          color: '#78350F',
        };
      case 'RVLH':
        return {
          fullName: 'RV Learning Hub',
          subtitle: 'Bengaluru, Karnataka • Est. 2020',
          logo: 'LH',
          color: '#111827',
        };
      default:
        return {
          fullName: 'All Campuses',
          subtitle: 'Aggregated view across all campuses',
          logo: 'ALL',
          color: '#0D9488',
        };
    }
  };

  // Premium Institution Selector Dropdown Component
  const InstitutionSelector = ({ allowAll = true }) => {
    // Auto-fallback if 'All' is selected in a non-All selector
    if (!allowAll && selectedInstitution === 'All') {
      setSelectedInstitution('RVCE');
      global.selectedInstitution = 'RVCE';
    }

    const list = allowAll 
      ? ['All', ...INSTITUTIONS.map(i => i.shortName)] 
      : INSTITUTIONS.map(i => i.shortName);
    const currentDetails = getInstitutionDetails(selectedInstitution);

    return (
      <View style={styles.dropdownContainer}>
        <Text style={styles.dropdownLabel}>Active Campus Selection</Text>
        <TouchableOpacity 
          style={styles.dropdownButton} 
          activeOpacity={0.8}
          onPress={() => setShowInstDropdown(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={[styles.dropdownLogoBg, { backgroundColor: currentDetails.color }]}>
              <Text style={styles.dropdownLogoText}>{currentDetails.logo}</Text>
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.dropdownCampusName} numberOfLines={1}>
                {currentDetails.fullName}
              </Text>
              <Text style={styles.dropdownCampusSub} numberOfLines={1}>
                {currentDetails.subtitle}
              </Text>
            </View>
          </View>
          <View style={styles.dropdownChevronBg}>
            <Ionicons name="chevron-down" size={16} color="#003366" />
          </View>
        </TouchableOpacity>

        <Modal visible={showInstDropdown} transparent animationType="slide">
          <TouchableOpacity 
            style={styles.dropdownModalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowInstDropdown(false)}
          >
            <View style={styles.dropdownModalContent}>
              <View style={styles.dropdownModalHeader}>
                <View style={styles.dropdownModalHandle} />
                <Text style={styles.dropdownModalTitle}>Select Campus / Institution</Text>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                {list.map((inst) => {
                  const details = getInstitutionDetails(inst);
                  const isSelected = selectedInstitution === inst;
                  return (
                    <TouchableOpacity
                      key={inst}
                      style={[
                        styles.dropdownOption,
                        isSelected && styles.dropdownOptionActive
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedInstitution(inst);
                        global.selectedInstitution = inst;
                        setShowInstDropdown(false);
                      }}
                    >
                      <View style={[styles.dropdownOptionLogo, { backgroundColor: details.color }]}>
                        <Text style={styles.dropdownOptionLogoText}>{details.logo}</Text>
                      </View>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={[styles.dropdownOptionText, isSelected && styles.dropdownOptionTextActive]}>
                          {details.fullName}
                        </Text>
                        <Text style={styles.dropdownOptionSub}>{details.subtitle}</Text>
                      </View>
                      {isSelected && (
                        <View style={styles.dropdownCheckCircle}>
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  // Render Post Card
  const renderPostCard = (post) => {
    const isLiked = !!likedPosts[post.id];
    const isBookmarked = !!bookmarkedPosts[post.id];
    const isFollowing = !!followedUsers[post.id];

    return (
      <View key={post.id} style={styles.postCard}>
        {/* Post header */}
        <View style={styles.postHeader}>
          <View style={[styles.postUserAvatar, post.isAnnouncement && { backgroundColor: '#FEF3C7', borderColor: theme.warning }]}>
            <Text style={[styles.postAvatarText, post.isAnnouncement && { color: '#D97706' }]}>{post.avatar}</Text>
          </View>
          <View style={styles.postUserInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.postUserName}>{post.user}</Text>
              {post.isAnnouncement && (
                <View style={styles.announcementBadge}>
                  <Text style={styles.announcementBadgeText}>ANNOUNCEMENT</Text>
                </View>
              )}
            </View>
            <Text style={styles.postUserRole}>{post.role}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.followBtn, isFollowing && styles.followBtnActive]} 
            onPress={() => togglePostFollow(post.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
              {isFollowing ? 'Following' : '+ Follow'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Post Content */}
        <Text style={styles.postContent}>{post.content}</Text>

        {/* Post image */}
        {post.image && (
          <Image source={{ uri: post.image }} style={styles.postImage} />
        )}

        {/* Action Buttons */}
        <View style={styles.postActions}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity onPress={() => togglePostLike(post.id)} activeOpacity={0.6} style={styles.actionBtn}>
              <Ionicons 
                name={isLiked ? 'heart' : 'heart-outline'} 
                size={22} 
                color={isLiked ? theme.danger : theme.textSecondary} 
              />
              <Text style={[styles.actionBtnText, isLiked && { color: theme.danger }]}>{post.likes}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity activeOpacity={0.6} style={styles.actionBtn} onPress={() => Alert.alert('Comments', 'Comments are in view-only mode for Super Admins.')}>
              <Ionicons name="chatbubble-outline" size={20} color="#64748B" />
              <Text style={styles.actionBtnText}>{post.commentsCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.6} style={styles.actionBtn} onPress={() => handlePostShare(post)}>
              <Ionicons name="share-social-outline" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => togglePostBookmark(post.id)} activeOpacity={0.6}>
            <Ionicons 
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'} 
              size={22} 
              color={isBookmarked ? theme.primary : theme.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Search, tabs and toggles
  const [searchQuery, setSearchQuery] = useState('');
  const [portalSearchQuery, setPortalSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('1'); // Generic state for inner module tabs
  const [uploadedRoster, setUploadedRoster] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({}); // adminId -> bool
  const [alumniDetailModal, setAlumniDetailModal] = useState(null); // alumnus request detail
  const [editingAdminId, setEditingAdminId] = useState(null); // null if creating, ID if editing
  const [editingPlacementId, setEditingPlacementId] = useState(null); // null if creating, ID if editing

  // Welcome Mail States
  const [welcomeSubject, setWelcomeSubject] = useState('Welcome to Institution Admin Portal');
  const [welcomeBody, setWelcomeBody] = useState('Dear Admin,\n\nYour administrator account has been created successfully. Please log in using your registered credentials.\n\nBest regards,\nSuper Admin Team');
  const [welcomeAutoSend, setWelcomeAutoSend] = useState(true);

  // Administrator Form States
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminFormInst, setAdminFormInst] = useState('RVCE');
  const [adminFormName, setAdminFormName] = useState('');
  const [adminFormEmail, setAdminFormEmail] = useState('');
  const [adminFormPassword, setAdminFormPassword] = useState('');

  // Placement Form States
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [placementFormInst, setPlacementFormInst] = useState('RVCE');
  const [placementFormCompany, setPlacementFormCompany] = useState('');
  const [placementFormInd, setPlacementFormInd] = useState('');
  const [placementFormCount, setPlacementFormCount] = useState('');

  // Export & Import states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressVal, setProgressVal] = useState(0);

  // Logs/Stats Date State
  const [statsStartDate, setStatsStartDate] = useState('15/06/2026');
  const [statsEndDate, setStatsEndDate] = useState('17/06/2026');
  const [expandedChart, setExpandedChart] = useState(null);

  // Helper filter function
  const filterByInstitution = (data, field = 'institution') => {
    if (selectedInstitution === 'All') return data;
    return data.filter((item) => item[field] === selectedInstitution);
  };

  // Toggle password eye helper
  const togglePasswordVisibility = (adminId) => {
    setVisiblePasswords((prev) => ({ ...prev, [adminId]: !prev[adminId] }));
  };

  // Old InstitutionSelector replaced by premium dropdown above

  // Back action helper
  const handleGoBack = () => {
    setActiveModule(null);
    setSearchQuery('');
  };

  // ==========================================
  // MODULE RENDERERS
  // ==========================================

  // 1. Dashboard Home (Grid & summary, specific institution details, news feed)


  const renderDashboardHome = () => {
    const totalAlumniAgg = INSTITUTIONS.reduce((sum, item) => sum + item.totalAlumni, 0);
    const registeredUsersAgg = INSTITUTIONS.reduce((sum, item) => sum + item.registeredUsers, 0);
    const activeAdminsAgg = admins.filter(a => a.status === 'Active').length;

    // Filter posts by selected institution
    const filteredPosts = postsList.filter(p => {
      if (selectedInstitution === 'All') return true;
      return p.institution === selectedInstitution || p.institution === 'All';
    });

    return (
      <View style={styles.dashboardHomeView}>
        {selectedInstitution === 'All' && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeaderRow}>
              <Text style={styles.summaryTitle}>SYSTEM STATUS & HEALTH</Text>
              <View style={styles.healthStatusBadge}>
                <View style={styles.healthDot} />
                <Text style={styles.healthText}>All Services Online</Text>
              </View>
            </View>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{totalAlumniAgg.toLocaleString()}</Text>
                <Text style={styles.summaryLabel}>Total Alumni</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{registeredUsersAgg.toLocaleString()}</Text>
                <Text style={styles.summaryLabel}>Registered Users</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{activeAdminsAgg}</Text>
                <Text style={styles.summaryLabel}>Active Admins</Text>
              </View>
            </View>
          </View>
        )}

        {/* Broadcast Widget */}
        <View style={styles.broadcastCard}>
          <Text style={styles.broadcastCardTitle}>Broadcast Announcement</Text>
          <View style={styles.broadcastInputRow}>
            <TextInput
              style={styles.broadcastInput}
              placeholder={selectedInstitution === 'All' ? "Announce to all institutions..." : `Announce to ${selectedInstitution}...`}
              placeholderTextColor="#94A3B8"
              value={broadcastText}
              onChangeText={setBroadcastText}
              multiline
            />
            <TouchableOpacity 
              style={styles.broadcastSendBtn} 
              activeOpacity={0.7}
              onPress={() => {
                if (!broadcastText.trim()) {
                  Alert.alert('Error', 'Announcement text cannot be empty.');
                  return;
                }
                const newAnn = {
                  id: `ann_${Date.now()}`,
                  user: 'Super Admin',
                  role: 'Global System Administrator',
                  avatar: 'SA',
                  content: broadcastText.trim(),
                  image: null,
                  likes: 0,
                  commentsCount: 0,
                  time: 'Just now',
                  institution: selectedInstitution === 'All' ? 'All' : selectedInstitution,
                  isAnnouncement: true,
                };
                setPostsList(prev => [newAnn, ...prev]);
                setBroadcastText('');
                Alert.alert('Published', 'Your broadcast has been pinned to the top of the feed.');
              }}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* News Feed / Posts list */}
        <Text style={styles.sectionHeaderTitle}>Alumni News Feed</Text>
        <View style={{ paddingBottom: 20 }}>
          {filteredPosts.length > 0 ? (
            filteredPosts.map(post => renderPostCard(post))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="newspaper-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyStateText}>No posts for this institution.</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // 2. Spam/Report List
  const renderSpamReport = () => {
    const list = filterByInstitution(spamReports);
    
    // Counts per institution
    const counts = INSTITUTIONS.map(inst => {
      const c = spamReports.filter(s => s.institution === inst.shortName).length;
      return { label: inst.shortName, count: c };
    });

    const handleSuspend = (id, name) => {
      Alert.alert('Confirm Suspension', `Are you sure you want to suspend the account of ${name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Suspend', style: 'destructive', onPress: () => {
          setSpamReports(prev => prev.filter(s => s.id !== id));
          Alert.alert('Suspended', `${name}'s account has been suspended.`);
        }}
      ]);
    };

    const handleDismiss = (id) => {
      setSpamReports(prev => prev.filter(s => s.id !== id));
      Alert.alert('Success', 'Complaint dismissed.');
    };

    return (
      <View style={styles.flexContainer}>
        <InstitutionSelector />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ backgroundColor: theme.card, borderBottomWidth: 1, borderColor: theme.border, flexGrow: 0 }}
          contentContainerStyle={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        >
          {counts.map(item => (
            <View key={item.label} style={styles.spamBadgeChip}>
              <Text style={styles.spamBadgeLabel}>{item.label}:</Text>
              <View style={[styles.spamCountDot, item.count > 0 ? styles.spamCountDotActive : styles.spamCountDotEmpty]}>
                <Text style={styles.spamCountDotText}>{item.count}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.avatarMini}>
                  <Text style={styles.avatarMiniText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSubText}>{item.branch} • Class of {item.year}</Text>
                </View>
                <View style={styles.instChip}>
                  <Text style={styles.instChipText}>{item.institution}</Text>
                </View>
              </View>

              <View style={styles.alertTextBox}>
                <Text style={styles.alertTextTitle}>Reason for report:</Text>
                <Text style={styles.alertTextContent}>{item.reason}</Text>
                <Text style={styles.alertTextMeta}>Reported by {item.reportedBy} on {item.date}</Text>
              </View>

              <View style={styles.cardActionRow}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => handleDismiss(item.id)}>
                  <Text style={styles.btnSecondaryText}>Dismiss</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnDanger} onPress={() => handleSuspend(item.id, item.name)}>
                  <Text style={styles.btnDangerText}>Suspend User</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-checkmark-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Zero Spam Found</Text>
              <Text style={styles.emptySub}>No spam reports logged for this selection.</Text>
            </View>
          }
        />
      </View>
    );
  };

  // 3. Welcome Mail (to admin only)
  const renderWelcomeMail = () => {
    const handleSendWelcome = () => {
      if (!welcomeSubject.trim() || !welcomeBody.trim()) {
        Alert.alert('Required', 'Please fill in both the subject and the body.');
        return;
      }
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        // Add activity
        const newAct = {
          id: Date.now().toString(),
          type: 'Email Interaction',
          description: `Super Admin sent welcome email: ${welcomeSubject}`,
          institution: selectedInstitution,
          category: 'Welcome Mail',
          date: new Date().toLocaleDateString('en-GB'),
        };
        setActivities(prev => [newAct, ...prev]);
        Alert.alert(
          'Welcome Mail Sent',
          `Welcome email sent successfully to all admins of ${
            selectedInstitution === 'All' ? 'all' : selectedInstitution
          } institution${selectedInstitution === 'All' ? 's' : ''}.`
        );
      }, 1000);
    };

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.moduleScroll}>
        <InstitutionSelector allowAll={true} />
        
        <View style={styles.alertBanner}>
          <Ionicons name="information-circle-outline" size={20} color="#0369A1" />
          <Text style={styles.alertBannerText}>
            Note: Welcome emails configured here are sent exclusively to institutional administrators upon onboarding.
          </Text>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.formLabel}>Email Subject</Text>
          <TextInput
            style={styles.textInput}
            value={welcomeSubject}
            onChangeText={setWelcomeSubject}
            placeholder="Welcome Subject"
          />

          <Text style={styles.formLabel}>Email Body Template</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={welcomeBody}
            onChangeText={setWelcomeBody}
            placeholder="Welcome message details..."
            multiline
            numberOfLines={6}
          />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>Auto-Send Welcome Mail</Text>
              <Text style={styles.switchSubtitle}>Send instantly when a new Admin profile is created</Text>
            </View>
            <Switch
              value={welcomeAutoSend}
              onValueChange={setWelcomeAutoSend}
              trackColor={{ true: theme.primary, false: '#CBD5E1' }}
            />
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleSendWelcome} disabled={isProcessing}>
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>Send Welcome Mail Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // 4. Master List (institutions, locations, batches, companies)
  const renderMasterList = () => {
    // subTabs: '1': Institutions, '2': Locations, '3': Batches, '4': Companies
    const filteredComp = MASTER_COMPANIES.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredLoc = MASTER_LOCATIONS.filter(l => l.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return (
      <View style={styles.flexContainer}>
        {/* Sub-Tab Navigation */}
        <View style={styles.subTabsHeader}>
          {['Institutes', 'Locations', 'Batches', 'Companies'].map((tabName, index) => {
            const tabId = (index + 1).toString();
            return (
              <TouchableOpacity
                key={tabId}
                style={[styles.subTabButton, activeSubTab === tabId && styles.subTabActive]}
                onPress={() => {
                  setActiveSubTab(tabId);
                  setSearchQuery('');
                }}
              >
                <Text style={[styles.subTabText, activeSubTab === tabId && styles.subTabTextActive]}>
                  {tabName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search */}
        {activeSubTab !== '3' && (
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#94A3B8" />
            <TextInput
              style={styles.searchBarInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search master index..."
            />
          </View>
        )}

        {/* Inner Content */}
        <ScrollView contentContainerStyle={styles.listPadding} showsVerticalScrollIndicator={false}>
          {activeSubTab === '1' && (
            INSTITUTIONS.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).map(inst => (
              <View key={inst.id} style={styles.simpleItemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{inst.name}</Text>
                  <Text style={styles.cardSubText}>{inst.location} • Est. {inst.established}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardPrimaryVal}>{inst.totalAlumni}</Text>
                  <Text style={styles.cardSubText}>Alumni</Text>
                </View>
              </View>
            ))
          )}

          {activeSubTab === '2' && (
            filteredLoc.map((loc, idx) => {
              const matches = INSTITUTIONS.filter(i => i.location === loc).length;
              return (
                <View key={idx} style={styles.simpleItemCard}>
                  <Text style={styles.cardTitle}>{loc}</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{matches} {matches === 1 ? 'Institute' : 'Institutes'}</Text>
                  </View>
                </View>
              );
            })
          )}

          {activeSubTab === '3' && (
            MASTER_BATCHES.map((batch, idx) => (
              <View key={idx} style={styles.simpleItemCard}>
                <Text style={styles.cardTitle}>Batch of {batch}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>Cohort Group</Text>
                </View>
              </View>
            ))
          )}

          {activeSubTab === '4' && (
            filteredComp.map((comp, idx) => (
              <View key={idx} style={styles.simpleItemCard}>
                <Text style={styles.cardTitle}>{comp}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>Corporate Partner</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  // 5. Administrator Management
  const renderAdministrator = () => {
    const list = filterByInstitution(admins);

    const handleCreateAdmin = () => {
      if (!adminFormName.trim() || !adminFormEmail.trim() || !adminFormPassword.trim()) {
        Alert.alert('Error', 'Please fill in all the details.');
        return;
      }
      if (editingAdminId) {
        setAdmins(prev => prev.map(a => a.id === editingAdminId ? {
          ...a,
          name: adminFormName,
          email: adminFormEmail.toLowerCase().trim(),
          password: adminFormPassword,
          institution: adminFormInst,
        } : a));
        setShowAdminModal(false);
        setEditingAdminId(null);
        setAdminFormName('');
        setAdminFormEmail('');
        setAdminFormPassword('');
        Alert.alert('Success', `Admin account updated for ${adminFormName}`);
      } else {
        const newAdmin = {
          id: Date.now().toString(),
          name: adminFormName,
          email: adminFormEmail.toLowerCase().trim(),
          password: adminFormPassword,
          institution: adminFormInst,
          role: 'Admin',
          status: 'Active',
          lastLogin: 'Never logged in',
          passwordChangedAt: new Date().toLocaleDateString('en-GB'),
        };
        setAdmins(prev => [...prev, newAdmin]);
        if (welcomeAutoSend) {
          const newAct = {
            id: `act_${Date.now()}`,
            type: 'Email Interaction',
            description: `Auto-welcome email sent to new admin: ${adminFormName}`,
            institution: adminFormInst,
            category: 'Welcome Mail',
            date: new Date().toLocaleDateString('en-GB'),
          };
          setActivities(prev => [newAct, ...prev]);
        }
        setShowAdminModal(false);
        setAdminFormName('');
        setAdminFormEmail('');
        setAdminFormPassword('');
        Alert.alert('Success', `Admin account created for ${adminFormName} under ${adminFormInst}`);
      }
    };

    const handleEditAdmin = (admin) => {
      setEditingAdminId(admin.id);
      setAdminFormInst(admin.institution);
      setAdminFormName(admin.name);
      setAdminFormEmail(admin.email);
      setAdminFormPassword(admin.password);
      setShowAdminModal(true);
    };

    const handleCloseAdminModal = () => {
      setShowAdminModal(false);
      setEditingAdminId(null);
      setAdminFormName('');
      setAdminFormEmail('');
      setAdminFormPassword('');
    };

    const handleDeleteAdmin = (id, name) => {
      Alert.alert('Delete Administrator', `Are you sure you want to delete ${name}'s admin access?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setAdmins(prev => prev.filter(a => a.id !== id));
          Alert.alert('Deleted', 'Admin profile removed successfully.');
        }}
      ]);
    };

    return (
      <View style={styles.flexContainer}>
        <InstitutionSelector />

        <TouchableOpacity style={styles.btnActionTop} onPress={() => setShowAdminModal(true)}>
          <Ionicons name="person-add-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.btnActionTopText}>Create New Admin</Text>
        </TouchableOpacity>

        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.avatarMini}>
                  <Text style={styles.avatarMiniText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSubText}>{item.email}</Text>
                </View>
                <View style={styles.instChip}>
                  <Text style={styles.instChipText}>{item.institution}</Text>
                </View>
              </View>

              {/* Password details (visible toggle) */}
              <View style={styles.passwordContainer}>
                <Text style={styles.passwordLabel}>Login Password:</Text>
                <View style={styles.passwordRow}>
                  <Text style={styles.passwordValue}>
                    {visiblePasswords[item.id] ? item.password : '••••••••'}
                  </Text>
                  <TouchableOpacity onPress={() => togglePasswordVisibility(item.id)}>
                    <Ionicons name={visiblePasswords[item.id] ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.metaInfoBox}>
                <Text style={styles.metaText}>Last login: {item.lastLogin}</Text>
                <Text style={styles.metaText}>Password changed: {item.passwordChangedAt}</Text>
              </View>

              <View style={styles.cardActionRow}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => handleEditAdmin(item)}>
                  <Text style={styles.btnSecondaryText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnDanger} onPress={() => handleDeleteAdmin(item.id, item.name)}>
                  <Text style={styles.btnDangerText}>Remove Admin</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        {/* Create / Edit Admin Modal */}
        <Modal visible={showAdminModal} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingAdminId ? 'Edit Institution Admin' : 'New Institution Admin'}</Text>
                <TouchableOpacity onPress={handleCloseAdminModal}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={styles.formLabel}>Institution</Text>
                <View style={styles.pickerWrapper}>
                  {INSTITUTIONS.map((i) => i.shortName).map((inst) => (
                    <TouchableOpacity
                      key={inst}
                      style={[styles.pickerChip, adminFormInst === inst && styles.pickerChipActive]}
                      onPress={() => setAdminFormInst(inst)}
                    >
                      <Text style={[styles.pickerChipText, adminFormInst === inst && styles.pickerChipTextActive]}>{inst}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Name</Text>
                <TextInput style={styles.textInput} value={adminFormName} onChangeText={setAdminFormName} placeholder="Admin Full Name" />

                <Text style={styles.formLabel}>Email ID</Text>
                <TextInput style={styles.textInput} value={adminFormEmail} onChangeText={setAdminFormEmail} placeholder="admin@institution.edu" autoCapitalize="none" keyboardType="email-address" />

                <Text style={styles.formLabel}>Initial Login Password</Text>
                <View style={styles.passwordInputWrap}>
                  <TextInput style={{ flex: 1, color: theme.text, paddingVertical: 8 }} value={adminFormPassword} onChangeText={setAdminFormPassword} placeholder="Enter Password" secureTextEntry={false} />
                  <TouchableOpacity
                    style={styles.btnGenerate}
                    onPress={() => {
                      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
                      let pass = '';
                      for (let i = 0; i < 10; i++) {
                        pass += chars.charAt(Math.floor(Math.random() * chars.length));
                      }
                      setAdminFormPassword(pass);
                    }}
                  >
                    <Text style={styles.btnGenerateText}>Generate</Text>
                  </TouchableOpacity>
                </View>

                {/* Password Strength Indicator */}
                {adminFormPassword.length > 0 && (() => {
                  const strength = getPasswordStrength(adminFormPassword);
                  return (
                    <View style={{ marginTop: 8, marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600' }}>Password Strength:</Text>
                        <Text style={{ fontSize: 11, color: strength.color, fontWeight: '700' }}>{strength.text}</Text>
                      </View>
                      <View style={styles.strengthBarBg}>
                        <View style={[styles.strengthBarFill, { width: `${(strength.score / 5) * 100}%`, backgroundColor: strength.color }]} />
                      </View>
                    </View>
                  );
                })()}

                <TouchableOpacity style={[styles.btnPrimary, { marginTop: 24 }]} onPress={handleCreateAdmin}>
                  <Text style={styles.btnPrimaryText}>{editingAdminId ? 'Save Changes' : 'Create Admin Account'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  // 6. Membership Request (approve/reject/delete, view details)
  const renderMembershipRequest = () => {
    // subTabs: '1': All, '2': Pending, '3': Approved, '4': Rejected
    const list = filterByInstitution(membershipRequests);
    const filteredByStatus = list.filter((r) => {
      if (activeSubTab === '1') return true;
      if (activeSubTab === '2') return r.status === 'pending';
      if (activeSubTab === '3') return r.status === 'approved';
      return r.status === 'rejected';
    });

    const handleApprove = (id, name) => {
      setMembershipRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'approved', adminAction: 'Approved by Super Admin' } : r))
      );
      Alert.alert('Approved', `${name}'s request approved.`);
    };

    const handleReject = (id, name) => {
      setMembershipRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'rejected', adminAction: 'Rejected by Super Admin' } : r))
      );
      Alert.alert('Rejected', `${name}'s request rejected.`);
    };

    const handleDeleteAccount = (id, name) => {
      Alert.alert('Delete Profile', `Delete registration request of ${name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setMembershipRequests((prev) => prev.filter((r) => r.id !== id));
          Alert.alert('Deleted', 'Account request deleted.');
        }}
      ]);
    };

    return (
      <View style={styles.flexContainer}>
        <InstitutionSelector />

        {/* Status Tab Pills */}
        <View style={styles.subTabsHeader}>
          {['All', 'Pending', 'Approved', 'Rejected'].map((statusName, idx) => {
            const tabId = (idx + 1).toString();
            return (
              <TouchableOpacity
                key={tabId}
                style={[styles.subTabButton, activeSubTab === tabId && styles.subTabActive]}
                onPress={() => setActiveSubTab(tabId)}
              >
                <Text style={[styles.subTabText, activeSubTab === tabId && styles.subTabTextActive]}>
                  {statusName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={filteredByStatus}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => {
            const batchYear = item.year || item.batchYear || item.batch_year;
            const joiningYear = item.joining_year || item.joiningYear;
            const check = checkDatabaseVerification(item.name, batchYear, joiningYear, item.institution);
            
            return (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.avatarMini}>
                    <Text style={styles.avatarMiniText}>{item.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSubText}>{item.branch} • Class of {batchYear}</Text>
                  </View>
                  <View style={[styles.statusTag, item.status === 'approved' ? styles.statusActive : item.status === 'pending' ? styles.statusPending : styles.statusRejected]}>
                    <Text style={item.status === 'approved' ? styles.statusActiveText : item.status === 'pending' ? styles.statusPendingText : styles.statusRejectedText}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaInfoBox}>
                  <Text style={styles.metaText}>Verification Proof: {item.proof}</Text>
                  {item.adminAction && (
                    <Text style={[styles.metaText, { color: theme.text, fontWeight: '600', marginTop: 4 }]}>
                      Action: {item.adminAction}
                    </Text>
                  )}
                  
                  <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                    {check.verified ? (
                      <View style={{ backgroundColor: '#DEF7EC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="checkmark-circle" size={13} color="#03543F" style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 11, color: '#03543F', fontWeight: '700' }}>✓ Verified DB Match</Text>
                      </View>
                    ) : (
                      <View style={{ backgroundColor: '#FDE8E8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="close-circle" size={13} color="#9B1C1C" style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 11, color: '#9B1C1C', fontWeight: '700' }}>✗ {check.reason}</Text>
                      </View>
                    )}
                  </View>
                </View>

              <View style={styles.cardActionRow}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => setAlumniDetailModal(item)}>
                  <Text style={styles.btnSecondaryText}>View Details</Text>
                </TouchableOpacity>

                {item.status === 'pending' && (
                  <>
                    <TouchableOpacity style={styles.btnSuccess} onPress={() => handleApprove(item.id, item.name)}>
                      <Text style={styles.btnSuccessText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnDanger} onPress={() => handleReject(item.id, item.name)}>
                      <Text style={styles.btnDangerText}>Reject</Text>
                    </TouchableOpacity>
                  </>
                )}

                {item.status !== 'pending' && (
                  <TouchableOpacity style={styles.btnDanger} onPress={() => handleDeleteAccount(item.id, item.name)}>
                    <Text style={styles.btnDangerText}>Delete Request</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Requests</Text>
              <Text style={styles.emptySub}>No membership requests in this filter.</Text>
            </View>
          }
        />

        {/* Details Modal */}
        {alumniDetailModal && (
          <Modal visible={true} animationType="fade" transparent>
            <View style={styles.modalBg}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Alumni Detailed Profile</Text>
                  <TouchableOpacity onPress={() => setAlumniDetailModal(null)}>
                    <Ionicons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                  <Text style={styles.modalSectionTitle}>Basic Information</Text>
                  <Text style={styles.modalText}>Name: {alumniDetailModal.name}</Text>
                  <Text style={styles.modalText}>Institution: {alumniDetailModal.institution}</Text>
                  <Text style={styles.modalText}>Email: {alumniDetailModal.email}</Text>
                  <Text style={styles.modalText}>Phone: {alumniDetailModal.phone}</Text>
                  <Text style={styles.modalText}>Graduation Year: {alumniDetailModal.details.graduationYear}</Text>

                  <Text style={[styles.modalSectionTitle, { marginTop: 16 }]}>Employment Info</Text>
                  <Text style={styles.modalText}>Company: {alumniDetailModal.details.company}</Text>
                  <Text style={styles.modalText}>Designation: {alumniDetailModal.details.designation}</Text>
                  <Text style={styles.modalText}>LinkedIn: {alumniDetailModal.details.linkedIn}</Text>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  };

  // 7. Network Settings (AlmaConnect-inspired)
  const renderNetworkSettings = () => {
    // Requires a selected institution
    const currentInst = selectedInstitution === 'All' ? 'RVCE' : selectedInstitution;
    const settings = networkSettings[currentInst];

    const updateField = (field, value) => {
      setNetworkSettings((prev) => ({
        ...prev,
        [currentInst]: {
          ...prev[currentInst],
          [field]: value,
        },
      }));
    };

    const handleSaveSettings = () => {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        Alert.alert('Settings Saved', `Network properties updated for ${currentInst}`);
      }, 1000);
    };

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.moduleScroll}>
        <InstitutionSelector allowAll={false} />

        <View style={styles.inputCard}>
          <Text style={styles.sectionHeaderTitle}>General Configuration</Text>
          <Text style={styles.formLabel}>Institution Full Name</Text>
          <TextInput
            style={styles.textInput}
            value={settings.institutionName}
            onChangeText={(v) => updateField('institutionName', v)}
          />

          <Text style={styles.formLabel}>Title Shortcut</Text>
          <TextInput
            style={styles.textInput}
            value={settings.shortTitle}
            onChangeText={(v) => updateField('shortTitle', v)}
          />

          <Text style={styles.formLabel}>Institution URL</Text>
          <TextInput
            style={styles.textInput}
            value={settings.website}
            onChangeText={(v) => updateField('website', v)}
          />

          <Text style={styles.sectionHeaderTitle}>Custom Labels</Text>
          <View style={styles.rowGrid}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.formLabel}>Alumni Label</Text>
              <TextInput style={styles.textInput} value={settings.alumniText} onChangeText={(v) => updateField('alumniText', v)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.formLabel}>Students Label</Text>
              <TextInput style={styles.textInput} value={settings.studentsText} onChangeText={(v) => updateField('studentsText', v)} />
            </View>
          </View>

          <View style={styles.rowGrid}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.formLabel}>Faculty Label</Text>
              <TextInput style={styles.textInput} value={settings.facultyText} onChangeText={(v) => updateField('facultyText', v)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.formLabel}>Classmate Label</Text>
              <TextInput style={styles.textInput} value={settings.batchmatesText} onChangeText={(v) => updateField('batchmatesText', v)} />
            </View>
          </View>

          <Text style={styles.sectionHeaderTitle}>Branding (Theme Colors)</Text>

          <Text style={styles.formLabel}>Quick Palette Presets</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12, paddingBottom: 4 }}>
            {[
              { name: 'Ocean Blue', primary: theme.primary, secondary: '#00A99C' },
              { name: 'Emerald', primary: '#059669', secondary: theme.success },
              { name: 'Sunset', primary: '#EA580C', secondary: theme.warning },
              { name: 'Amethyst', primary: '#7C3AED', secondary: '#A78BFA' },
              { name: 'Slate Dark', primary: '#1E293B', secondary: theme.textSecondary },
            ].map((preset) => (
              <TouchableOpacity
                key={preset.name}
                style={styles.presetColorChip}
                activeOpacity={0.7}
                onPress={() => {
                  updateField('primaryColor', preset.primary);
                  updateField('secondaryColor', preset.secondary);
                }}
              >
                <View style={{ flexDirection: 'row', gap: 4, marginRight: 6 }}>
                  <View style={[styles.presetSwatchMini, { backgroundColor: preset.primary }]} />
                  <View style={[styles.presetSwatchMini, { backgroundColor: preset.secondary }]} />
                </View>
                <Text style={styles.presetColorChipText}>{preset.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.rowGrid}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.formLabel}>Primary Theme Color</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.colorBox, { backgroundColor: settings.primaryColor }]} />
                <TextInput style={[styles.textInput, { flex: 1 }]} value={settings.primaryColor} onChangeText={(v) => updateField('primaryColor', v)} />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.formLabel}>Secondary Theme Color</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.colorBox, { backgroundColor: settings.secondaryColor }]} />
                <TextInput style={[styles.textInput, { flex: 1 }]} value={settings.secondaryColor} onChangeText={(v) => updateField('secondaryColor', v)} />
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeaderTitle}>Signup & Toggles</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchTitle}>Manual Moderator Approval</Text>
            <Switch value={settings.manualApproval} onValueChange={(v) => updateField('manualApproval', v)} trackColor={{ true: theme.primary }} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchTitle}>Email Identity Vouching</Text>
            <Switch value={settings.emailVouching} onValueChange={(v) => updateField('emailVouching', v)} trackColor={{ true: theme.primary }} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchTitle}>Allow Unverified Logins</Text>
            <Switch value={settings.allowUnverified} onValueChange={(v) => updateField('allowUnverified', v)} trackColor={{ true: theme.primary }} />
          </View>

          <Text style={styles.sectionHeaderTitle}>Features Access Control</Text>
          <View style={styles.rowGrid}>
            <View style={styles.featureBox}>
              <Text style={styles.featureText}>Jobs Portal</Text>
              <Switch value={settings.displayJobs} onValueChange={(v) => updateField('displayJobs', v)} trackColor={{ true: theme.primary }} />
            </View>
            <View style={styles.featureBox}>
              <Text style={styles.featureText}>Events</Text>
              <Switch value={settings.displayEvents} onValueChange={(v) => updateField('displayEvents', v)} trackColor={{ true: theme.primary }} />
            </View>
          </View>

          <View style={styles.rowGrid}>
            <View style={styles.featureBox}>
              <Text style={styles.featureText}>Mentorship</Text>
              <Switch value={settings.displayMentorship} onValueChange={(v) => updateField('displayMentorship', v)} trackColor={{ true: theme.primary }} />
            </View>
            <View style={styles.featureBox}>
              <Text style={styles.featureText}>Alumni Card</Text>
              <Switch value={settings.displayAlumniCard} onValueChange={(v) => updateField('displayAlumniCard', v)} trackColor={{ true: theme.primary }} />
            </View>
          </View>

          <TouchableOpacity style={[styles.btnPrimary, { marginTop: 24 }]} onPress={handleSaveSettings} disabled={isProcessing}>
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>Save Settings Configuration</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // 8. Bulk Import
  const renderBulkImport = () => {
    const list = filterByInstitution(imports);

    const handleDownloadTemplate = () => {
      Alert.alert('CSV Template Downloaded', 'The bulk upload skeleton CSV has been saved to your downloads directory.');
    };

    const handleUploadSimulate = () => {
      setUploadedRoster([
        { id: '1', name: 'Rohan Deshmukh', email: 'rohan.d@example.com', course: 'BE, CSE', batch: '2024' },
        { id: '2', name: 'Neha Patil', email: 'neha.p@example.com', course: 'BE, ISE', batch: '2023' },
        { id: '3', name: 'Aditya Hegde', email: 'aditya.h@example.com', course: 'MBA', batch: '2022' },
      ]);
      Alert.alert('Roster Loaded', 'Mock spreadsheet roster loaded! You can now edit cells directly before importing.');
    };

    const handleImportSimulate = () => {
      if (!uploadedRoster || uploadedRoster.length === 0) {
        Alert.alert('No Data', 'Please load or add data to the spreadsheet first.');
        return;
      }
      setIsProcessing(true);
      setProgressVal(0);
      const interval = setInterval(() => {
        setProgressVal((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsProcessing(false);
            const inst = selectedInstitution === 'All' ? 'RVCE' : selectedInstitution;
            const newImport = {
              id: Date.now().toString(),
              fileName: `ingested_sheet_${inst.toLowerCase()}.csv`,
              institution: inst,
              records: uploadedRoster.length,
              successful: uploadedRoster.filter(r => r.name && r.email).length,
              failed: uploadedRoster.filter(r => !r.name || !r.email).length,
              date: '17/06/2026',
              status: 'Completed',
            };
            setImports((prevList) => [newImport, ...prevList]);
            setUploadedRoster(null);
            Alert.alert(
              'Import Complete',
              `${newImport.successful} alumni profiles successfully imported to ${inst}.`
            );
            return 100;
          }
          return prev + 25;
        });
      }, 300);
    };

    return (
      <View style={styles.flexContainer}>
        <InstitutionSelector />

        <ScrollView contentContainerStyle={styles.listPadding} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Bulk Ingest Portal</Text>
            
            <TouchableOpacity style={styles.btnOutline} onPress={handleDownloadTemplate}>
              <Ionicons name="download-outline" size={16} color="#003366" style={{ marginRight: 6 }} />
              <Text style={styles.btnOutlineText}>Download CSV Template</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadArea} onPress={handleUploadSimulate}>
              <Ionicons name="cloud-upload-outline" size={36} color="#94A3B8" />
              <Text style={styles.uploadTitle}>Choose file to import</Text>
              <Text style={styles.uploadSubtitle}>Supports CSV, XLS or XLSX roster templates</Text>
            </TouchableOpacity>

            {uploadedRoster && (
              <View style={styles.sheetContainer}>
                <Text style={styles.sheetTitle}>Spreadsheet Editor Preview</Text>
                
                {/* Headers */}
                <View style={styles.sheetHeaderRow}>
                  <Text style={[styles.sheetHeaderCell, { flex: 2 }]}>Name</Text>
                  <Text style={[styles.sheetHeaderCell, { flex: 3 }]}>Email</Text>
                  <Text style={[styles.sheetHeaderCell, { flex: 2 }]}>Course</Text>
                  <Text style={[styles.sheetHeaderCell, { flex: 1.5 }]}>Batch</Text>
                  <Text style={[styles.sheetHeaderCell, { flex: 1 }]}></Text>
                </View>

                {/* Rows */}
                {uploadedRoster.map((row) => (
                  <View key={row.id} style={styles.sheetRow}>
                    <TextInput
                      style={[styles.sheetCellInput, { flex: 2 }]}
                      value={row.name}
                      onChangeText={(txt) => {
                        setUploadedRoster(prev => prev.map(r => r.id === row.id ? { ...r, name: txt } : r));
                      }}
                    />
                    <TextInput
                      style={[styles.sheetCellInput, { flex: 3 }]}
                      value={row.email}
                      onChangeText={(txt) => {
                        setUploadedRoster(prev => prev.map(r => r.id === row.id ? { ...r, email: txt } : r));
                      }}
                    />
                    <TextInput
                      style={[styles.sheetCellInput, { flex: 2 }]}
                      value={row.course}
                      onChangeText={(txt) => {
                        setUploadedRoster(prev => prev.map(r => r.id === row.id ? { ...r, course: txt } : r));
                      }}
                    />
                    <TextInput
                      style={[styles.sheetCellInput, { flex: 1.5 }]}
                      value={row.batch}
                      onChangeText={(txt) => {
                        setUploadedRoster(prev => prev.map(r => r.id === row.id ? { ...r, batch: txt } : r));
                      }}
                    />
                    <TouchableOpacity
                      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                      onPress={() => {
                        setUploadedRoster(prev => prev.filter(r => r.id !== row.id));
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Spreadsheet controls */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity 
                    style={styles.sheetAddBtn}
                    onPress={() => {
                      const newId = String(Date.now());
                      setUploadedRoster(prev => [...prev, { id: newId, name: '', email: '', course: '', batch: '' }]);
                    }}
                  >
                    <Ionicons name="add" size={16} color="#003366" />
                    <Text style={styles.sheetAddBtnText}>Add Row</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.sheetClearBtn}
                    onPress={() => setUploadedRoster(null)}
                  >
                    <Text style={styles.sheetClearBtnText}>Discard</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.mappingList}>
              <Text style={styles.mappingLabel}> Roster Column Mapping Preview:</Text>
              <Text style={styles.mappingText}>✓ [alumni_name] → Full Name</Text>
              <Text style={styles.mappingText}>✓ [personal_email] → Username / Contact</Text>
              <Text style={styles.mappingText}>✓ [grad_year] → Batch Index</Text>
              <Text style={styles.mappingText}>✓ [degree_course] → Branch / Course</Text>
            </View>

            {isProcessing && (
              <View style={{ marginVertical: 12 }}>
                <Text style={styles.progressText}>Ingesting data... {progressVal}%</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progressVal}%` }]} />
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.btnPrimary} onPress={handleImportSimulate} disabled={isProcessing}>
              <Text style={styles.btnPrimaryText}>Start Bulk Import</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeaderTitle}>Recent Import History</Text>
          {list.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="document-text-outline" size={20} color="#003366" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.cardTitle}>{item.fileName}</Text>
                  <Text style={styles.cardSubText}>{item.date} • {item.institution}</Text>
                </View>
                <View style={[styles.statusTag, styles.statusActive]}>
                  <Text style={styles.statusActiveText}>{item.status}</Text>
                </View>
              </View>
              <View style={styles.historyStatsRow}>
                <Text style={styles.historyStatText}>Records: {item.records}</Text>
                <Text style={[styles.historyStatText, { color: '#10B981' }]}>Success: {item.successful}</Text>
                <Text style={[styles.historyStatText, { color: theme.danger }]}>Failed: {item.failed}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // 9. Placement Tool
  const renderPlacementTool = () => {
    const list = filterByInstitution(placements);

    const handleAddPlacement = () => {
      if (!placementFormCompany.trim() || !placementFormCount.trim()) {
        Alert.alert('Error', 'Please fill in Company Name and Alumni Count.');
        return;
      }
      if (editingPlacementId) {
        setPlacements(prev => prev.map(p => p.id === editingPlacementId ? {
          ...p,
          company: placementFormCompany,
          industry: placementFormInd || 'Corporate Systems',
          count: parseInt(placementFormCount) || 1,
          institution: placementFormInst,
        } : p).sort((a,b) => b.count - a.count));
        setShowPlacementModal(false);
        setEditingPlacementId(null);
        setPlacementFormCompany('');
        setPlacementFormInd('');
        setPlacementFormCount('');
        Alert.alert('Success', 'Placement record updated.');
      } else {
        const newPlace = {
          id: Date.now().toString(),
          company: placementFormCompany,
          industry: placementFormInd || 'Corporate Systems',
          count: parseInt(placementFormCount) || 1,
          institution: placementFormInst,
        };
        setPlacements(prev => [...prev, newPlace].sort((a,b) => b.count - a.count));
        setShowPlacementModal(false);
        setPlacementFormCompany('');
        setPlacementFormInd('');
        setPlacementFormCount('');
        Alert.alert('Success', 'Corporate placement records registered.');
      }
    };

    const handleEditPlacement = (placement) => {
      setEditingPlacementId(placement.id);
      setPlacementFormInst(placement.institution);
      setPlacementFormCompany(placement.company);
      setPlacementFormInd(placement.industry);
      setPlacementFormCount(placement.count.toString());
      setShowPlacementModal(true);
    };

    const handleClosePlacementModal = () => {
      setShowPlacementModal(false);
      setEditingPlacementId(null);
      setPlacementFormCompany('');
      setPlacementFormInd('');
      setPlacementFormCount('');
    };

    const handleDelete = (id) => {
      setPlacements(prev => prev.filter(p => p.id !== id));
      Alert.alert('Success', 'Placement record deleted.');
    };

    return (
      <View style={styles.flexContainer}>
        <InstitutionSelector />

        <TouchableOpacity style={styles.btnActionTop} onPress={() => setShowPlacementModal(true)}>
          <Ionicons name="briefcase-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.btnActionTopText}>Register New Placement</Text>
        </TouchableOpacity>

        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.avatarMini}>
                  <Ionicons name="business-outline" size={18} color="#003366" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.cardTitle}>{item.company}</Text>
                  <Text style={styles.cardSubText}>{item.industry}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardPrimaryVal}>{item.count}</Text>
                  <Text style={styles.cardSubText}>Hired</Text>
                </View>
              </View>

              <View style={[styles.instChip, { alignSelf: 'flex-start', marginTop: 8 }]}>
                <Text style={styles.instChipText}>{item.institution}</Text>
              </View>

              <View style={[styles.cardActionRow, { marginTop: 12 }]}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => handleEditPlacement(item)}>
                  <Text style={styles.btnSecondaryText}>Edit Metrics</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnDanger} onPress={() => handleDelete(item.id)}>
                  <Text style={styles.btnDangerText}>Delete Record</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        {/* Add / Edit Placement Modal */}
        <Modal visible={showPlacementModal} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingPlacementId ? 'Edit Corporate Placement' : 'Add Corporate Placement'}</Text>
                <TouchableOpacity onPress={handleClosePlacementModal}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={styles.formLabel}>Institution</Text>
                <View style={styles.pickerWrapper}>
                  {INSTITUTIONS.map((i) => i.shortName).map((inst) => (
                    <TouchableOpacity
                      key={inst}
                      style={[styles.pickerChip, placementFormInst === inst && styles.pickerChipActive]}
                      onPress={() => setPlacementFormInst(inst)}
                    >
                      <Text style={[styles.pickerChipText, placementFormInst === inst && styles.pickerChipTextActive]}>{inst}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Company Name</Text>
                <TextInput style={styles.textInput} value={placementFormCompany} onChangeText={setPlacementFormCompany} placeholder="e.g. Cisco Systems" />

                <Text style={styles.formLabel}>Industry Sector</Text>
                <TextInput style={styles.textInput} value={placementFormInd} onChangeText={setPlacementFormInd} placeholder="e.g. IT Services / Networking" />

                <Text style={styles.formLabel}>Total Alumni Placed</Text>
                <TextInput style={styles.textInput} value={placementFormCount} onChangeText={setPlacementFormCount} placeholder="Alumni Headcount" keyboardType="numeric" />

                <TouchableOpacity style={[styles.btnPrimary, { marginTop: 24 }]} onPress={handleAddPlacement}>
                  <Text style={styles.btnPrimaryText}>{editingPlacementId ? 'Save Changes' : 'Add Placement Record'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  // 10. Logs/Stats (5 cards with horizontal View-based bar charts matching layout)
  const renderLogsStats = () => {
    return (
      <View style={styles.flexContainer}>
        {/* Date Selector Row */}
        <View style={styles.datePickerRow}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <TextInput style={styles.dateInput} value={statsStartDate} onChangeText={setStatsStartDate} />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>End Date</Text>
            <TextInput style={styles.dateInput} value={statsEndDate} onChangeText={setStatsEndDate} />
          </View>
          <TouchableOpacity style={styles.btnApply} onPress={() => Alert.alert('Date Range Applied', `Logs filtered between ${statsStartDate} and ${statsEndDate}`)}>
            <Text style={styles.btnApplyText}>Apply</Text>
          </TouchableOpacity>
        </View>

        <InstitutionSelector />

        <ScrollView contentContainerStyle={styles.listPadding} showsVerticalScrollIndicator={false}>
          <View style={styles.gridContainer}>
          {/* Card 1: Database Signups */}
          <TouchableOpacity 
            style={[styles.statCard, { width: width > 1024 ? '48%' : '100%' }]} 
            activeOpacity={0.9} 
            onPress={() => setExpandedChart(expandedChart === 'signups' ? null : 'signups')}
          >
            <View style={styles.statCardHeader}>
              <Text style={styles.statCardHeading}>Database Signups</Text>
              <Ionicons 
                name={expandedChart === 'signups' ? 'chevron-up-circle' : 'chevron-down-circle'} 
                size={20} 
                color="#0D9488" 
              />
            </View>
            <View style={styles.statNumbersRow}>
              <View>
                <Text style={styles.statHugeText}>24</Text>
                <Text style={styles.statSubtitleText}>Users signed up</Text>
              </View>
              <View style={{ marginLeft: 24 }}>
                <Text style={styles.statHugeText}>39</Text>
                <Text style={styles.statSubtitleText}>Profiles updated</Text>
              </View>
            </View>
            <View style={styles.chartWrapper}>
              <View style={styles.chartBarRow}>
                <Text style={styles.chartBarLabel}>Signups</Text>
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBarFill, { width: '38%', backgroundColor: '#0D9488' }]} />
                </View>
                <Text style={styles.chartBarValue}>38%</Text>
              </View>
              <View style={styles.chartBarRow}>
                <Text style={styles.chartBarLabel}>Updates</Text>
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBarFill, { width: '60%', backgroundColor: '#0D9488' }]} />
                </View>
                <Text style={styles.chartBarValue}>60%</Text>
              </View>
            </View>
            {expandedChart === 'signups' ? (
              <View style={styles.chartDetailsContainer}>
                <Text style={styles.chartDetailsTitle}>Institution Breakdown</Text>
                <View style={styles.chartDetailsTable}>
                  <View style={styles.chartDetailsHeaderRow}>
                    <Text style={[styles.chartDetailsHeaderCell, { flex: 2 }]}>Institute</Text>
                    <Text style={[styles.chartDetailsHeaderCellText, { flex: 1.5 }]}>Signups</Text>
                    <Text style={[styles.chartDetailsHeaderCellText, { flex: 1.5 }]}>Updates</Text>
                  </View>
                  {INSTITUTIONS.map((instObj) => {
                    const inst = instObj.shortName;
                    const val1 = Math.floor(instObj.registeredUsers * 0.005) + 1;
                    const val2 = Math.floor(instObj.registeredUsers * 0.01) + 2;
                    return { inst, val1, val2 };
                  }).map((row, idx) => (
                    <View key={idx} style={styles.chartDetailsRow}>
                      <Text style={[styles.chartDetailsCellLabel, { flex: 2 }]}>{row.inst}</Text>
                      <Text style={[styles.chartDetailsCellVal, { flex: 1.5 }]}>{row.val1}</Text>
                      <Text style={[styles.chartDetailsCellVal, { flex: 1.5 }]}>{row.val2}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={styles.chartDetailsHelpText}>Tap card to expand institution breakdown</Text>
            )}
          </TouchableOpacity>

          {/* Card 2: Engagement / News Feed Visitors */}
          <TouchableOpacity 
            style={[styles.statCard, { width: width > 1024 ? '48%' : '100%' }]} 
            activeOpacity={0.9} 
            onPress={() => setExpandedChart(expandedChart === 'engagement' ? null : 'engagement')}
          >
            <View style={styles.statCardHeader}>
              <Text style={styles.statCardHeading}>Engagement / News Feed Visitors</Text>
              <Ionicons 
                name={expandedChart === 'engagement' ? 'chevron-up-circle' : 'chevron-down-circle'} 
                size={20} 
                color="#0D9488" 
              />
            </View>
            <View style={styles.statNumbersRow}>
              <View>
                <Text style={styles.statHugeText}>200</Text>
                <Text style={styles.statSubtitleText}>Visitors on news feed</Text>
              </View>
              <View style={{ marginLeft: 24 }}>
                <Text style={styles.statHugeText}>8081</Text>
                <Text style={styles.statSubtitleText}>Visitors on job page</Text>
              </View>
            </View>
            <View style={styles.chartWrapper}>
              <View style={styles.chartBarRow}>
                <Text style={styles.chartBarLabel}>Feed</Text>
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBarFill, { width: '20%', backgroundColor: '#0D9488' }]} />
                </View>
                <Text style={styles.chartBarValue}>2.4%</Text>
              </View>
              <View style={styles.chartBarRow}>
                <Text style={styles.chartBarLabel}>Jobs</Text>
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBarFill, { width: '90%', backgroundColor: '#0D9488' }]} />
                </View>
                <Text style={styles.chartBarValue}>97.6%</Text>
              </View>
            </View>
            {expandedChart === 'engagement' ? (
              <View style={styles.chartDetailsContainer}>
                <Text style={styles.chartDetailsTitle}>Institution Breakdown</Text>
                <View style={styles.chartDetailsTable}>
                  <View style={styles.chartDetailsHeaderRow}>
                    <Text style={[styles.chartDetailsHeaderCell, { flex: 2 }]}>Institute</Text>
                    <Text style={[styles.chartDetailsHeaderCellText, { flex: 1.5 }]}>Feed</Text>
                    <Text style={[styles.chartDetailsHeaderCellText, { flex: 1.5 }]}>Jobs</Text>
                  </View>
                  {INSTITUTIONS.map((instObj) => {
                    const inst = instObj.shortName;
                    const val1 = Math.floor(instObj.registeredUsers * 0.05) + 3;
                    const val2 = Math.floor(instObj.registeredUsers * 2.2) + 40;
                    return { inst, val1, val2 };
                  }).map((row, idx) => (
                    <View key={idx} style={styles.chartDetailsRow}>
                      <Text style={[styles.chartDetailsCellLabel, { flex: 2 }]}>{row.inst}</Text>
                      <Text style={[styles.chartDetailsCellVal, { flex: 1.5 }]}>{row.val1}</Text>
                      <Text style={[styles.chartDetailsCellVal, { flex: 1.5 }]}>{row.val2}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={styles.chartDetailsHelpText}>Tap card to expand institution breakdown</Text>
            )}
          </TouchableOpacity>

          {/* Card 3: Overall Users */}
          <TouchableOpacity 
            style={[styles.statCard, { width: width > 1024 ? '48%' : '100%' }]} 
            activeOpacity={0.9} 
            onPress={() => setExpandedChart(expandedChart === 'users' ? null : 'users')}
          >
            <View style={styles.statCardHeader}>
              <Text style={styles.statCardHeading}>Overall Users</Text>
              <Ionicons 
                name={expandedChart === 'users' ? 'chevron-up-circle' : 'chevron-down-circle'} 
                size={20} 
                color="#0D9488" 
              />
            </View>
            <View style={styles.statNumbersRowMulti}>
              <View style={styles.numItem}>
                <Text style={styles.statHugeText}>9755</Text>
                <Text style={styles.statSubtitleText}>Registered users</Text>
              </View>
              <View style={styles.numItem}>
                <Text style={styles.statHugeText}>23448</Text>
                <Text style={styles.statSubtitleText}>Unregistered users</Text>
              </View>
              <View style={styles.numItem}>
                <Text style={styles.statHugeText}>20756</Text>
                <Text style={styles.statSubtitleText}>Contactable alumni</Text>
              </View>
            </View>
            <View style={styles.chartWrapper}>
              <View style={styles.chartBarRow}>
                <Text style={styles.chartBarLabel}>Registered</Text>
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBarFill, { width: '29%', backgroundColor: '#0D9488' }]} />
                </View>
                <Text style={styles.chartBarValue}>29%</Text>
              </View>
              <View style={styles.chartBarRow}>
                <Text style={styles.chartBarLabel}>Unregister</Text>
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBarFill, { width: '71%', backgroundColor: '#0D9488' }]} />
                </View>
                <Text style={styles.chartBarValue}>71%</Text>
              </View>
            </View>
            {expandedChart === 'users' ? (
              <View style={styles.chartDetailsContainer}>
                <Text style={styles.chartDetailsTitle}>Institution Breakdown</Text>
                <View style={styles.chartDetailsTable}>
                  <View style={styles.chartDetailsHeaderRow}>
                    <Text style={[styles.chartDetailsHeaderCell, { flex: 1.5 }]}>Institute</Text>
                    <Text style={[styles.chartDetailsHeaderCellText, { flex: 1.2 }]}>Reg</Text>
                    <Text style={[styles.chartDetailsHeaderCellText, { flex: 1.2 }]}>Unreg</Text>
                    <Text style={[styles.chartDetailsHeaderCellText, { flex: 1.2 }]}>Contact</Text>
                  </View>
                  {INSTITUTIONS.map((instObj) => {
                    const inst = instObj.shortName;
                    const val1 = instObj.registeredUsers;
                    const val2 = instObj.totalAlumni - instObj.registeredUsers;
                    const val3 = Math.floor(instObj.registeredUsers * 0.9) + Math.floor(instObj.totalAlumni * 0.1);
                    return { inst, val1, val2, val3 };
                  }).map((row, idx) => (
                    <View key={idx} style={styles.chartDetailsRow}>
                      <Text style={[styles.chartDetailsCellLabel, { flex: 1.5 }]}>{row.inst}</Text>
                      <Text style={[styles.chartDetailsCellVal, { flex: 1.2 }]}>{row.val1}</Text>
                      <Text style={[styles.chartDetailsCellVal, { flex: 1.2 }]}>{row.val2}</Text>
                      <Text style={[styles.chartDetailsCellVal, { flex: 1.2 }]}>{row.val3}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={styles.chartDetailsHelpText}>Tap card to expand institution breakdown</Text>
            )}
          </TouchableOpacity>

          {/* Card 4: Jobs */}
          <TouchableOpacity 
            style={[styles.statCard, { width: width > 1024 ? '48%' : '100%' }]} 
            activeOpacity={0.9} 
            onPress={() => setExpandedChart(expandedChart === 'jobs' ? null : 'jobs')}
          >
            <View style={styles.statCardHeader}>
              <Text style={styles.statCardHeading}>Jobs</Text>
              <Ionicons 
                name={expandedChart === 'jobs' ? 'chevron-up-circle' : 'chevron-down-circle'} 
                size={20} 
                color="#0D9488" 
              />
            </View>
            <View style={styles.statNumbersRowMulti}>
              <View style={styles.numItem}>
                <Text style={styles.statHugeText}>0</Text>
                <Text style={styles.statSubtitleText}>Jobs posted</Text>
              </View>
              <View style={styles.numItem}>
                <Text style={styles.statHugeText}>2</Text>
                <Text style={styles.statSubtitleText}>Applications</Text>
              </View>
              <View style={styles.numItem}>
                <Text style={styles.statHugeText}>1</Text>
                <Text style={styles.statSubtitleText}>Applied</Text>
              </View>
              <View style={styles.numItem}>
                <Text style={styles.statHugeText}>0</Text>
                <Text style={styles.statSubtitleText}>Referred</Text>
              </View>
            </View>
            <View style={styles.chartWrapper}>
              <View style={styles.chartBarRow}>
                <Text style={styles.chartBarLabel}>Apply Rate</Text>
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBarFill, { width: '50%', backgroundColor: '#0D9488' }]} />
                </View>
                <Text style={styles.chartBarValue}>50%</Text>
              </View>
            </View>
            {expandedChart === 'jobs' ? (
              <View style={styles.chartDetailsContainer}>
                <Text style={styles.chartDetailsTitle}>Institution Breakdown</Text>
                <View style={styles.chartDetailsTable}>
                  <View style={styles.chartDetailsHeaderRow}>
                    <Text style={[styles.chartDetailsHeaderCell, { flex: 1.5 }]}>Institute</Text>
                    <Text style={[styles.chartDetailsHeaderCellText, { flex: 1.2 }]}>Posts</Text>
                    <Text style={[styles.chartDetailsHeaderCellText, { flex: 1.2 }]}>Apps</Text>
                    <Text style={[styles.chartDetailsHeaderCellText, { flex: 1.2 }]}>Applied</Text>
                  </View>
                  {INSTITUTIONS.map((instObj) => {
                    const inst = instObj.shortName;
                    const val1 = 0;
                    const val2 = instObj.shortName === 'RVCE' || instObj.shortName === 'Institution' ? 1 : 0;
                    const val3 = instObj.shortName === 'RVCE' ? 1 : 0;
                    return { inst, val1, val2, val3 };
                  }).map((row, idx) => (
                    <View key={idx} style={styles.chartDetailsRow}>
                      <Text style={[styles.chartDetailsCellLabel, { flex: 1.5 }]}>{row.inst}</Text>
                      <Text style={[styles.chartDetailsCellVal, { flex: 1.2 }]}>{row.val1}</Text>
                      <Text style={[styles.chartDetailsCellVal, { flex: 1.2 }]}>{row.val2}</Text>
                      <Text style={[styles.chartDetailsCellVal, { flex: 1.2 }]}>{row.val3}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={styles.chartDetailsHelpText}>Tap card to expand institution breakdown</Text>
            )}
          </TouchableOpacity>

          {/* Card 5: Emails */}
          <TouchableOpacity 
            style={[styles.statCard, { width: width > 1024 ? '48%' : '100%' }]} 
            activeOpacity={0.9} 
            onPress={() => setExpandedChart(expandedChart === 'emails' ? null : 'emails')}
          >
            <View style={styles.statCardHeader}>
              <Text style={styles.statCardHeading}>Emails</Text>
              <Ionicons 
                name={expandedChart === 'emails' ? 'chevron-up-circle' : 'chevron-down-circle'} 
                size={20} 
                color="#0D9488" 
              />
            </View>
            <View style={{ paddingBottom: 10 }}>
              <Text style={[styles.statHugeText, { fontSize: 18 }]}>23118</Text>
              <Text style={styles.statSubtitleText}>News feed emails sent (10.63% opened, 3.77% clicked)</Text>
            </View>
            <View style={{ paddingTop: 8, borderTopWidth: 1, borderColor: '#F1F5F9' }}>
              <Text style={[styles.statHugeText, { fontSize: 18 }]}>0</Text>
              <Text style={styles.statSubtitleText}>Email sent from master list (0% opened, 0% clicked)</Text>
            </View>
            <View style={styles.chartWrapper}>
              <View style={styles.chartBarRow}>
                <Text style={styles.chartBarLabel}>Opened</Text>
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBarFill, { width: '10.6%', backgroundColor: '#0D9488' }]} />
                </View>
                <Text style={styles.chartBarValue}>10.6%</Text>
              </View>
              <View style={styles.chartBarRow}>
                <Text style={styles.chartBarLabel}>Clicked</Text>
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBarFill, { width: '3.7%', backgroundColor: '#0D9488' }]} />
                </View>
                <Text style={styles.chartBarValue}>3.7%</Text>
              </View>
            </View>
            {expandedChart === 'emails' ? (
              <View style={styles.chartDetailsContainer}>
                <Text style={styles.chartDetailsTitle}>Institution Breakdown</Text>
                <View style={styles.chartDetailsTable}>
                  <View style={styles.chartDetailsHeaderRow}>
                    <Text style={[styles.chartDetailsHeaderCell, { flex: 1.5 }]}>Institute</Text>
                    <Text style={[styles.chartDetailsHeaderCellText, { flex: 1.2 }]}>Sent</Text>
                    <Text style={[styles.chartDetailsHeaderCellText, { flex: 1.2 }]}>Open</Text>
                    <Text style={[styles.chartDetailsHeaderCellText, { flex: 1.2 }]}>Click</Text>
                  </View>
                  {INSTITUTIONS.map((instObj) => {
                    const inst = instObj.shortName;
                    const val1 = Math.floor(instObj.totalAlumni * 1.5);
                    const val2 = Math.floor(val1 * 0.1);
                    const val3 = Math.floor(val1 * 0.035);
                    return { inst, val1, val2, val3 };
                  }).map((row, idx) => (
                    <View key={idx} style={styles.chartDetailsRow}>
                      <Text style={[styles.chartDetailsCellLabel, { flex: 1.5 }]}>{row.inst}</Text>
                      <Text style={[styles.chartDetailsCellVal, { flex: 1.2 }]}>{row.val1}</Text>
                      <Text style={[styles.chartDetailsCellVal, { flex: 1.2 }]}>{row.val2}</Text>
                      <Text style={[styles.chartDetailsCellVal, { flex: 1.2 }]}>{row.val3}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={styles.chartDetailsHelpText}>Tap card to expand institution breakdown</Text>
            )}
          </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  // 11. Dynamic Email Stats
  const renderEmailStats = () => {
    // subTabs: '1': Invitation, '2': Custom
    return (
      <View style={styles.flexContainer}>
        <InstitutionSelector />

        <View style={styles.subTabsHeader}>
          {['Invitation Campaigns', 'Custom Campaigns'].map((tabName, index) => {
            const tabId = (index + 1).toString();
            return (
              <TouchableOpacity
                key={tabId}
                style={[styles.subTabButton, activeSubTab === tabId && styles.subTabActive]}
                onPress={() => setActiveSubTab(tabId)}
              >
                <Text style={[styles.subTabText, activeSubTab === tabId && styles.subTabTextActive]}>
                  {tabName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.listPadding} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Email Performance Analytics</Text>

            <View style={styles.progressStatRow}>
              <Text style={styles.progressLabel}>Total Sent emails: {emailStats.sent}</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${emailStats.sent > 0 ? 100 : 0}%`, backgroundColor: theme.primary }]} />
              </View>
            </View>

            <View style={styles.progressStatRow}>
              <Text style={styles.progressLabel}>Open Rate ({emailStats.openRate}%): {emailStats.opened}</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${emailStats.openRate}%`, backgroundColor: theme.success }]} />
              </View>
            </View>

            <View style={styles.progressStatRow}>
              <Text style={styles.progressLabel}>Click Rate ({emailStats.clickRate}%): {emailStats.clicked}</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${emailStats.clickRate}%`, backgroundColor: theme.warning }]} />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  // 12. Data Exports
  const renderDataExports = () => {
    const handleExportSimulate = () => {
      setIsProcessing(true);
      setProgressVal(0);
      const interval = setInterval(() => {
        setProgressVal((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsProcessing(false);
            Alert.alert('Export Success', 'alumni_database_export.csv compiled and saved.');
            return 100;
          }
          return prev + 25;
        });
      }, 300);
    };

    return (
      <View style={styles.flexContainer}>
        <InstitutionSelector />

        <ScrollView contentContainerStyle={styles.listPadding} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Custom Export Configuration</Text>
            
            <Text style={styles.formLabel}>Select Graduation Year Cohort</Text>
            <View style={styles.pickerWrapper}>
              {['All', '2022', '2023', '2024', '2025'].map((year) => (
                <TouchableOpacity key={year} style={styles.pickerChip}>
                  <Text style={styles.pickerChipText}>{year}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Select Branch Cohort</Text>
            <View style={styles.pickerWrapper}>
              {['All', 'CSE', 'ECE', 'ISE', 'MBA'].map((dept) => (
                <TouchableOpacity key={dept} style={styles.pickerChip}>
                  <Text style={styles.pickerChipText}>{dept}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {isProcessing && (
              <View style={{ marginVertical: 12 }}>
                <Text style={styles.progressText}>Generating file... {progressVal}%</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progressVal}%` }]} />
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.btnPrimary} onPress={handleExportSimulate} disabled={isProcessing}>
              <Ionicons name="download-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnPrimaryText}>Generate CSV Export</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  // 13. Admin Activities
  const renderAdminActivities = () => {
    // subTabs: '1': Past, '2': Due
    const list = filterByInstitution(activities);
    
    return (
      <View style={styles.flexContainer}>
        <InstitutionSelector />

        <View style={styles.subTabsHeader}>
          {['Past Interactions', 'Due / Follow Ups'].map((tabName, index) => {
            const tabId = (index + 1).toString();
            return (
              <TouchableOpacity
                key={tabId}
                style={[styles.subTabButton, activeSubTab === tabId && styles.subTabActive]}
                onPress={() => setActiveSubTab(tabId)}
              >
                <Text style={[styles.subTabText, activeSubTab === tabId && styles.subTabTextActive]}>
                  {tabName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={activeSubTab === '1' ? list : []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <View style={styles.simpleItemCard}>
              <View style={styles.activityIconBg}>
                <Ionicons name="time-outline" size={18} color="#003366" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardTitle}>{item.description}</Text>
                <Text style={styles.cardSubText}>{item.date} • {item.type} • {item.institution}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Activities</Text>
              <Text style={styles.emptySub}>No recent logs match the parameters.</Text>
            </View>
          }
        />
      </View>
    );
  };

  // Switch to render chosen sub-module
  // 0. Alumni Portals Module (Inside Super Admin Dashboard)
  const renderAlumniPortalsGrid = () => {
    const portalList = [
      { id: 'Mediacell', name: 'Mediacell', fullName: 'Mediacell', icon: 'videocam', color: '#003366' },
      { id: 'RV School', name: 'RVS', fullName: 'RV School', icon: 'school', color: '#3B82F6' },
      { id: 'RV Girls High School', name: 'RVGHS', fullName: 'RV Girls High School', icon: 'school', color: '#EC4899' },
      { id: 'RV Public School', name: 'RVPS', fullName: 'RV Public School', icon: 'school', color: '#10B981' },
      { id: 'RV Learning Hub', name: 'RVLH', fullName: 'RV Learning Hub', icon: 'book', color: '#F59E0B' },
      { id: 'SSMRV PU College', name: 'SSMRVPU', fullName: 'SSMRV PU College', icon: 'book', color: '#6366F1' },
      { id: 'NMKRV PU College', name: 'NMKRVPU', fullName: 'NMKRV PU College', icon: 'book', color: '#8B5CF6' },
      { id: 'RV PU College Jayanagar', name: 'RVPU_JAY', fullName: 'RV PU College Jayanagar', icon: 'book', color: '#14B8A6' },
      { id: 'RV PU College North', name: 'RVPU_NOR', fullName: 'RV PU College North', icon: 'book', color: '#3B82F6' },
      { id: 'RV PU College South', name: 'RVPU_SOU', fullName: 'RV PU College South', icon: 'book', color: '#6366F1' },
      { id: 'RV PU College, E-City', name: 'RVPU_ECI', fullName: 'RV PU College, E-City', icon: 'book', color: '#10B981' },
      { id: 'RV PU College, Harohalli', name: 'RVPU_HAR', fullName: 'RV PU College, Harohalli', icon: 'book', color: '#F59E0B' },
      { id: 'RV PU College, Mysuru', name: 'RVPU_MYS', fullName: 'RV PU College, Mysuru', icon: 'book', color: '#8B5CF6' },
      { id: 'RV College of Engineering', name: 'RVCE', fullName: 'RV College of Engineering', icon: 'build', color: '#003366' },
      { id: 'RV Institute of Technology and Management', name: 'RVITM', fullName: 'RV Institute of Technology and Management', icon: 'code-working', color: '#1E3A5F' },
      { id: 'RV-Skills', name: 'RVSK', fullName: 'RV-Skills', icon: 'laptop', color: '#F43F5E' },
      { id: 'RV College of Architecture', name: 'RVCA', fullName: 'RV College of Architecture', icon: 'color-palette', color: '#8B5CF6' },
      { id: 'RV Institute of Management', name: 'RVIM', fullName: 'RV Institute of Management', icon: 'trending-up', color: '#0EA5E9' },
      { id: 'MKPM RV Institute of Legal Studies', name: 'RVILS', fullName: 'MKPM RV Institute of Legal Studies', icon: 'briefcase', color: '#EF4444' },
      { id: 'RV Teachers College', name: 'RVTC', fullName: 'RV Teachers College', icon: 'people', color: '#6366F1' },
      { id: 'D.A. Pandu Memorial RV Dental College', name: 'DAPMRV', fullName: 'D.A. Pandu Memorial RV Dental College', icon: 'medkit', color: '#14B8A6' },
      { id: 'RV College of Physiotherapy', name: 'RVCP', fullName: 'RV College of Physiotherapy', icon: 'fitness', color: '#F59E0B' },
      { id: 'RV College of Nursing', name: 'RVCN', fullName: 'RV College of Nursing', icon: 'pulse', color: '#EC4899' },
      { id: 'NMKRV College', name: 'NMKRV', fullName: 'NMKRV College', icon: 'grid', color: '#8B5CF6' },
      { id: 'SSMRV College', name: 'SSMRV', fullName: 'SSMRV College', icon: 'grid', color: '#3B82F6' },
      { id: 'RV University, Bengaluru Campus', name: 'RVU_BLR', fullName: 'RV University, Bengaluru Campus', icon: 'ribbon', color: '#D97706' },
      { id: 'RV University, Mysuru Campus', name: 'RVU_MYS', fullName: 'RV University, Mysuru Campus', icon: 'ribbon', color: '#D97706' }
    ];

    const filteredPortals = portalList.filter(inst =>
      inst.fullName.toLowerCase().includes(portalSearchQuery.toLowerCase()) ||
      inst.name.toLowerCase().includes(portalSearchQuery.toLowerCase())
    );

    return (
      <ScrollView style={styles.moduleContainer} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: theme.primary, marginBottom: 4 }}>Alumni Portals</Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>Select your institution to access your dedicated alumni network.</Text>
        </View>

        {/* Search Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: isDarkMode ? '#334155' : '#E2E8F0',
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1
        }}>
          <Ionicons name="search-outline" size={20} color="#94A3B8" style={{ marginRight: 10 }} />
          <TextInput
            style={{ flex: 1, fontSize: 15, color: theme.text }}
            placeholder="Search institutions..."
            placeholderTextColor="#94A3B8"
            value={portalSearchQuery}
            onChangeText={setPortalSearchQuery}
          />
          {portalSearchQuery ? (
            <TouchableOpacity onPress={() => setPortalSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Grid of Institution Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
          {filteredPortals.map((inst) => {
            const cardWidth = width > 1200 ? '25%' : width > 800 ? '33.33%' : width > 600 ? '50%' : '100%';
            const isSelected = selectedInstitution === inst.name || selectedInstitution === inst.fullName;

            return (
              <View key={inst.id} style={{ width: cardWidth, padding: 8 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                    borderRadius: 14,
                    padding: 16,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? theme.primary : (isDarkMode ? '#334155' : '#E2E8F0'),
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    elevation: 2
                  }}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedInstitution(inst.name);
                    global.selectedInstitution = inst.name;
                    Alert.alert('Institution Portal Selected', `Super Admin Dashboard context switched to ${inst.fullName} (${inst.name})`);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: `${inst.color}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12
                    }}>
                      <Ionicons name={inst.icon || 'school'} size={22} color={inst.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>{inst.name}</Text>
                      <Text style={{ fontSize: 12, color: theme.textSecondary }} numberOfLines={1}>{inst.fullName}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={isSelected ? theme.primary : '#CBD5E1'} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'alumni_portals_grid':
        return renderAlumniPortalsGrid();
      case 'spam_report':
        return renderSpamReport();
      case 'welcome_mail':
        return renderWelcomeMail();
      case 'master_list':
        return renderMasterList();
      case 'administrator':
        return renderAdministrator();
      case 'membership_request':
        return renderMembershipRequest();
      case 'network_settings':
        return renderNetworkSettings();
      case 'bulk_import':
        return renderBulkImport();
      case 'placement_tool':
        return renderPlacementTool();
      case 'logs_stats':
        return renderLogsStats();
      case 'email_stats':
        return renderEmailStats();
      case 'data_exports':
        return renderDataExports();
      case 'admin_activities':
        return renderAdminActivities();
      default:
        return renderDashboardHome();
    }
  };

  // Get active module metadata
  const currentModuleData = panelItems.find(p => p.moduleName === activeModule);

  const filteredPanelItems = useMemo(() => {
    if (!searchQuery.trim()) return panelItems;
    return panelItems.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  const isMainScreen = activeModule === null || activeModule === 'dashboard_home';
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 1024;
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: isDesktop ? 1200 : 1024, flex: 1, flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 24 : 0, padding: isDesktop ? 24 : 0 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="#FFFFFF" />
      <View style={webContainerStyle}>

        {/* Header - shown only on Mobile/Tablet or if we need a top bar */}
        {!isDesktop && (
          !isMainScreen ? (
            <View style={styles.headerAdminStyle}>
              <TouchableOpacity onPress={handleGoBack} style={styles.headerIconBtnAdminStyle}>
                <Ionicons name="arrow-back" size={24} color="#002144" />
              </TouchableOpacity>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#4F46E5' }}>{currentModuleData?.title}</Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '500' }}>Super Admin Panel</Text>
              </View>
              <View style={styles.headerIconsAdminStyle}>
                <TouchableOpacity style={styles.headerIconBtnAdminStyle} onPress={() => navigation && navigation.navigate('Messages')}>
                  <Ionicons name="chatbubble-ellipses-outline" size={24} color="#003366" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerIconBtnAdminStyle} onPress={() => navigation && navigation.navigate('Notifications')}>
                  <Ionicons name="notifications-outline" size={24} color="#003366" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.headerAdminStyle}>
              <TouchableOpacity style={styles.headerAvatarAdminStyle} activeOpacity={0.8} onPress={() => navigation && navigation.navigate('AdminProfile')}>
                <Text style={styles.headerAvatarTextAdminStyle}>SA</Text>
              </TouchableOpacity>
              {activeModule === 'dashboard_home' ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#4F46E5' }}>Super Admin Dashboard</Text>
                  <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '500' }}>System Status Overview</Text>
                </View>
              ) : (
                <View style={styles.searchBarAdminStyle}>
                  <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 6 }} />
                  <TextInput
                    style={styles.searchInputAdminStyle}
                    placeholder="Search Panel..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              )}
              <View style={styles.headerIconsAdminStyle}>
                <TouchableOpacity style={styles.headerIconBtnAdminStyle} onPress={() => navigation && navigation.navigate('Messages')}>
                  <Ionicons name="chatbubble-ellipses-outline" size={24} color="#003366" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerIconBtnAdminStyle} onPress={() => navigation && navigation.navigate('Notifications')}>
                  <Ionicons name="notifications-outline" size={24} color="#003366" />
                </TouchableOpacity>
              </View>
            </View>
          )
        )}

        {/* Left Column (Desktop Only) */}
        {isDesktop && (
          <View style={{ flex: 3 }}>
             <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 20, elevation: 2, borderWidth: 1, borderColor: theme.border, alignItems: 'center', marginBottom: 24 }}>
               <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#D97706', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                 <Text style={{ fontSize: 24, fontWeight: '700', color: theme.card }}>SA</Text>
               </View>
               <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Super Admin</Text>
               <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginTop: 6 }}>Global Administrator</Text>
               <View style={{ width: '100%', height: 1, backgroundColor: theme.border, marginVertical: 16 }} />
               <View style={{ width: '100%', gap: 12 }}>
                 <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                   <Ionicons name="settings-outline" size={18} color={theme.textSecondary} />
                   <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>Global Settings</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => setActiveModule('administrator')}>
                   <Ionicons name="shield-checkmark-outline" size={18} color={theme.textSecondary} />
                   <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>Permissions</Text>
                 </TouchableOpacity>
               </View>
             </View>
          </View>
        )}

        {/* Main Content Area */}
        <View style={{ flex: isDesktop ? 6 : 1 }}>
          {activeModule === null ? (
            <ScrollView contentContainerStyle={styles.panelContainer} showsVerticalScrollIndicator={false}>
              <InstitutionSelector />
              <Text style={styles.sectionHeaderTitle}>Administration Modules</Text>
              <View style={styles.gridContainer}>
                {filteredPanelItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.gridCard, { backgroundColor: item.color, width: width > 768 && !isDesktop ? '31%' : '48%' }]}
                    onPress={() => { setActiveModule(item.moduleName); setActiveSubTab('1'); }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.gridIconBg, { backgroundColor: theme.card }]}>
                      <Ionicons name={item.icon} size={24} color={item.iconColor} />
                    </View>
                    <Text style={styles.gridCardTitle}>{item.title}</Text>
                    <Text style={styles.gridCardDesc} numberOfLines={2}>{item.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.flexContainer}>
              {renderModuleContent()}
            </View>
          )}
        </View>

        {/* Right Column (Desktop Only) */}
        {isDesktop && (
          <View style={{ flex: 3.5 }}>
            <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 16, elevation: 2, borderWidth: 1, borderColor: theme.border }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 16 }}>Global Stats</Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0F2FE', marginRight: 12 }}>
                  <Ionicons name="business-outline" size={20} color="#0284C7" />
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>{INSTITUTIONS.length}</Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary }}>Institutions</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#DCFCE7', marginRight: 12 }}>
                  <Ionicons name="newspaper-outline" size={20} color="#16A34A" />
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>{actualStats.posts}</Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary }}>Total Posts</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F9FF', marginRight: 12 }}>
                  <Ionicons name="calendar-outline" size={20} color="#003366" />
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>{actualStats.events}</Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary }}>Total Events</Text>
                </View>
              </View>

            </View>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
};

// ==========================================
// STYLING CONVENTIONS
// ==========================================

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  headerAdminStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    height: 60,
  },
  headerAvatarAdminStyle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarTextAdminStyle: {
    color: theme.card,
    fontSize: 14,
    fontWeight: '700',
  },
  searchBarAdminStyle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 38,
    marginRight: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInputAdminStyle: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    paddingVertical: 0,
  },
  headerIconsAdminStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtnAdminStyle: {
    position: 'relative',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotAdminStyle: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.danger,
  },
  flexContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.card,
  },
  profileBtn: {
    padding: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4F46E5',
  },
  panelContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    marginTop: 20,
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  gridIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  gridCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  gridCardDesc: {
    fontSize: 11,
    color: theme.textSecondary,
    lineHeight: 15,
  },
  // Module layouts
  moduleScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  listPadding: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: theme.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: theme.text,
  },
  cardSubText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  cardPrimaryVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4F46E5',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  instChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  instChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF',
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
  },
  btnSecondary: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  btnSecondaryText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.inputBackground,
  },
  btnDanger: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: theme.danger,
  },
  btnDangerText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.card,
  },
  btnSuccess: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: theme.success,
  },
  btnSuccessText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.card,
  },
  // Selector style
  selectorWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderColor: theme.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginRight: 8,
  },
  selectorList: {
    gap: 8,
  },
  selectorChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  selectorChipActive: {
    backgroundColor: theme.primary,
  },
  selectorChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  selectorChipTextActive: {
    color: theme.card,
  },
  // Subtabs
  subTabsHeader: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  subTabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  subTabActive: {
    borderColor: theme.primary,
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textMuted,
  },
  subTabTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    margin: 16,
    marginBottom: 0,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchBarInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13.5,
    color: theme.text,
  },
  simpleItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    marginBottom: 8,
  },
  countBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  // Dashboard Metrics
  summaryCard: {
    backgroundColor: theme.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  healthStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  healthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.success,
    marginRight: 6,
  },
  healthText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '800',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'flex-start',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.card,
  },
  summaryLabel: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 4,
  },
  instMetricCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginBottom: 12,
  },
  instMetricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  instTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  instBadgeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instBadgeCircleText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.card,
  },
  instCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: theme.text,
  },
  instCardLoc: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusActiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusRejectedText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.danger,
  },
  instMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
  },
  metricLbl: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: 2,
  },
  // Inner module inputs
  inputCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13.5,
    color: theme.text,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: theme.border,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
  },
  switchSubtitle: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  btnPrimary: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 16,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.card,
  },
  btnActionTop: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    margin: 16,
    marginBottom: 0,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 8,
  },
  btnActionTopText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.card,
  },
  // Modal layout
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  pickerWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  pickerChipActive: {
    backgroundColor: theme.primary,
  },
  pickerChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  pickerChipTextActive: {
    color: theme.card,
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  btnGenerate: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  btnGenerateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  // Settings Branding Color Box
  colorBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  rowGrid: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  featureBox: {
    flex: 1,
    backgroundColor: theme.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 8,
  },
  featureText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.inputBackground,
  },
  // Stats Card Inner Layout
  statCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    borderLeftWidth: 4,
    borderLeftColor: '#0D9488',
    padding: 16,
    marginBottom: 12,
  },
  statCardHeader: {
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 12,
  },
  statCardHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: theme.text,
  },
  statHugeText: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
  },
  statSubtitleText: {
    fontSize: 10.5,
    color: theme.textSecondary,
    marginTop: 2,
  },
  statNumbersRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  statNumbersRowMulti: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 14,
  },
  numItem: {
    minWidth: '40%',
  },
  chartWrapper: {
    gap: 8,
    marginTop: 6,
  },
  chartBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartBarLabel: {
    width: 70,
    fontSize: 10.5,
    color: '#475569',
    fontWeight: '700',
  },
  chartBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  chartBarValue: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  // Date Picker Layout
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.card,
    padding: 12,
    borderBottomWidth: 1,
    borderColor: theme.border,
    gap: 8,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dateInput: {
    height: 36,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 12.5,
    color: theme.text,
    backgroundColor: theme.background,
  },
  btnApply: {
    backgroundColor: theme.primary,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnApplyText: {
    color: theme.card,
    fontSize: 12.5,
    fontWeight: '700',
  },
  // Dynamic Email Stats progress rows
  progressStatRow: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
    marginBottom: 4,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  // Bulk import upload area
  btnOutline: {
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  btnOutlineText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4F46E5',
  },
  uploadArea: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  uploadSubtitle: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },
  mappingList: {
    backgroundColor: theme.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  mappingLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 6,
  },
  mappingText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 2,
  },
  historyCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    marginBottom: 8,
  },
  historyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 8,
  },
  historyStatText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  // Admin Activities Icon
  activityIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  alertBannerText: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 16,
    marginLeft: 8,
    flex: 1,
    fontWeight: '600',
  },
  alertTextBox: {
    backgroundColor: theme.background,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 4,
  },
  alertTextTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 4,
  },
  alertTextContent: {
    fontSize: 12,
    color: theme.text,
    lineHeight: 16,
  },
  alertTextMeta: {
    fontSize: 10,
    color: theme.textMuted,
    marginTop: 6,
  },
  spamCountBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderColor: theme.border,
    gap: 8,
  },
  spamBadgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  spamBadgeLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: theme.textSecondary,
    marginRight: 4,
  },
  spamCountDot: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  spamCountDotActive: {
    backgroundColor: theme.danger,
  },
  spamCountDotEmpty: {
    backgroundColor: theme.textMuted,
  },
  spamCountDotText: {
    color: theme.card,
    fontSize: 9,
    fontWeight: '800',
  },
  passwordContainer: {
    backgroundColor: theme.background,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 4,
  },
  passwordLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  passwordValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  metaInfoBox: {
    marginTop: 8,
  },
  metaText: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderColor: theme.border,
    paddingBottom: 4,
  },
  modalText: {
    fontSize: 13,
    color: theme.inputBackground,
    marginBottom: 6,
  },
  // New Styles
  dashboardHomeView: {
    flex: 1,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
    paddingLeft: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  dropdownLogoBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownLogoText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.card,
  },
  dropdownCampusName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
  },
  dropdownCampusSub: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  dropdownChevronBg: {
    backgroundColor: '#F1F5F9',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  dropdownModalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 34,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  dropdownModalHeader: {
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 16,
  },
  dropdownModalHandle: {
    width: 36,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: theme.border,
    marginBottom: 12,
  },
  dropdownModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    textAlign: 'center',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: theme.background,
  },
  dropdownOptionActive: {
    backgroundColor: '#F0F9FF',
    borderColor: theme.primary,
  },
  dropdownOptionLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownOptionLogoText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.card,
  },
  dropdownOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.inputBackground,
  },
  dropdownOptionTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  dropdownOptionSub: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  dropdownCheckCircle: {
    backgroundColor: theme.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // News Feed / Posts
  postCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  postAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  postUserInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  postUserRole: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  followBtn: {
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  followBtnActive: {
    backgroundColor: theme.primary,
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  followBtnTextActive: {
    color: theme.card,
  },
  postContent: {
    fontSize: 14,
    color: theme.inputBackground,
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  // Details Card
  detailsCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 16,
  },
  detailsCardHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.text,
    flex: 1,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  detailsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsInfoText: {
    fontSize: 14,
    color: '#475569',
  },
  detailsLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailsLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    textDecorationLine: 'underline',
  },
  detailsSectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.border,
    width: '47%',
  },
  featureItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 6,
  },
  adminListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  adminInfoCol: {
    flex: 1,
  },
  adminNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  adminEmailText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 1,
  },
  statusTagMini: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagMiniText: {
    fontSize: 10,
    fontWeight: '700',
  },
  placementListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  placementCompanyText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  placementIndustryText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  placementCountBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  placementCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  emptyDetailsText: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '600',
    marginTop: 8,
  },
  statusInactive: {
    backgroundColor: '#F1F5F9',
  },
  // --- Start of newly added interactivity features styles ---
  // Broadcast announcement
  broadcastCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  broadcastCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#4F46E5',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  broadcastInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  broadcastInput: {
    flex: 1,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: theme.text,
    minHeight: 48,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  broadcastSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  announcementBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: theme.warning,
  },
  announcementBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },

  // Spreadsheet Editor
  sheetContainer: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4F46E5',
    marginBottom: 12,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  sheetHeaderCell: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textAlign: 'center',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  sheetCellInput: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 6,
    fontSize: 12,
    color: theme.text,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginHorizontal: 2,
    textAlign: 'center',
  },
  sheetAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F0FA',
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sheetAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
    marginLeft: 4,
  },
  sheetClearBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sheetClearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textSecondary,
  },

  // Color Presets & Theme Swatches
  presetColorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  presetColorChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.inputBackground,
  },
  presetSwatchMini: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Password Strength Indicator
  strengthBarBg: {
    height: 6,
    backgroundColor: theme.border,
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Logs/Stats interactive Breakdown Table
  chartDetailsContainer: {
    backgroundColor: theme.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    marginTop: 12,
  },
  chartDetailsTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0D9488',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartDetailsTable: {
    width: '100%',
  },
  chartDetailsHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderColor: theme.border,
    paddingBottom: 6,
    marginBottom: 6,
  },
  chartDetailsHeaderCell: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textSecondary,
  },
  chartDetailsHeaderCellText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textSecondary,
    textAlign: 'right',
  },
  chartDetailsRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  chartDetailsCellLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.inputBackground,
  },
  chartDetailsCellVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'right',
  },
  chartDetailsHelpText: {
    fontSize: 11,
    color: '#0D9488',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
    textDecorationLine: 'underline',
  },
});

export default SuperAdminDashboardScreen;
