import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useWindowDimensions, View, Platform, Text, Alert, Image, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getInitials from './src/lib/getInitials';

// Polyfill Alert for web to prevent crashes and ensure button interactivity
if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => {
    if (buttons && buttons.length) {
      const result = window.confirm([title, message].filter(Boolean).join('\n'));
      if (result) {
        const confirmOption = buttons.find(b => b.style !== 'cancel' && b.text !== 'Cancel') || buttons[0];
        if (confirmOption && confirmOption.onPress) confirmOption.onPress();
      } else {
        const cancelOption = buttons.find(b => b.style === 'cancel' || b.text === 'Cancel');
        if (cancelOption && cancelOption.onPress) cancelOption.onPress();
      }
    } else {
      window.alert([title, message].filter(Boolean).join('\n'));
    }
  };
}

// Onboarding Screens
import SplashScreen from './src/screens/SplashScreen';
import PortalSelectionScreen from './src/screens/PortalSelectionScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import SelectInstitutionScreen from './src/screens/SelectInstitutionScreen';
import DemoCarouselScreen from './src/screens/DemoCarouselScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

// Main Tab Screens (Alumni)
import DashboardScreen from './src/screens/DashboardScreen';
import DirectoryScreen from './src/screens/DirectoryScreen';
import EngageScreen from './src/screens/EngageScreen';
import JobsScreen from './src/screens/JobsScreen';
import ContributeScreen from './src/screens/ContributeScreen';

// Secondary Screens (accessible from headers/actions)
import MessagesScreen from './src/screens/MessagesScreen';
import ChatScreen from './src/screens/ChatScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import PostCreationScreen from './src/screens/PostCreationScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LegalScreen from './src/screens/LegalScreen';
import CareerInsightsScreen from './src/screens/CareerInsightsScreen';

// Admin Flow Screens
import AdminLoginScreen from './src/screens/AdminLoginScreen';
import AdminOTPScreen from './src/screens/AdminOTPScreen';
import AdminHomeScreen from './src/screens/AdminHomeScreen';
import AdminUsersScreen from './src/screens/AdminUsersScreen';
import AdminJobsScreen from './src/screens/AdminJobsScreen';
import AdminEventsScreen from './src/screens/AdminEventsScreen';
import AdminPanelScreen from './src/screens/AdminPanelScreen';
import AdminMetricsScreen from './src/screens/AdminMetricsScreen';
import AdminProfileScreen from './src/screens/AdminProfileScreen';
import AdminPlacementDetailsScreen from './src/screens/AdminPlacementDetailsScreen';

// Super Admin Flow
import SuperAdminDashboardScreen from './src/screens/SuperAdminDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AdminTab = createBottomTabNavigator();
const SuperAdminTab = createBottomTabNavigator();

const Drawer = createDrawerNavigator();
const AdminDrawer = createDrawerNavigator();
const SuperAdminDrawer = createDrawerNavigator();

// ===== 3D TACTILE ICON POD HELPER =====
function Render3DTabIcon({ name, focused, isDarkMode, theme, isPost, label, isMaterial }) {
  if (isPost) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: -14 }}>
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: isDarkMode ? '#2563EB' : '#002B5C',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: isDarkMode ? '#38BDF8' : '#002B5C',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDarkMode ? 0.55 : 0.35,
          shadowRadius: 10,
          elevation: 9,
          borderWidth: 2,
          borderColor: isDarkMode ? '#60A5FA' : '#93C5FD'
        }}>
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </View>
        <Text style={{
          color: focused ? theme.primary : theme.textMuted,
          fontSize: 10,
          fontWeight: '800',
          marginTop: 4,
          letterSpacing: -0.2
        }}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        paddingHorizontal: focused ? 14 : 10,
        paddingVertical: 5,
        borderRadius: 14,
        backgroundColor: focused ? (theme.iconPodActiveBg || 'rgba(37, 99, 235, 0.14)') : 'transparent',
        borderWidth: focused ? 1.5 : 0,
        borderColor: focused ? (theme.iconPodBorder || 'rgba(37, 99, 235, 0.35)') : 'transparent',
        shadowColor: focused ? (isDarkMode ? '#38BDF8' : '#002B5C') : 'transparent',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: focused ? 0.35 : 0,
        shadowRadius: 6,
        elevation: focused ? 4 : 0,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {isMaterial ? (
          <MaterialCommunityIcons name={name} size={21} color={focused ? theme.primary : theme.textMuted} />
        ) : (
          <Ionicons name={name} size={21} color={focused ? theme.primary : theme.textMuted} />
        )}
      </View>
      <Text style={{
        color: focused ? theme.primary : theme.textMuted,
        fontSize: 10,
        fontWeight: focused ? '800' : '600',
        marginTop: 2,
        letterSpacing: -0.2
      }}>
        {label}
      </Text>
    </View>
  );
}

// Custom Drawer Content for Web/Desktop
function CustomDrawerContent(props) {
  const { theme, isDarkMode } = useTheme();
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    AsyncStorage.getItem('userInfo').then(str => {
      if (str) setCurrentUser(JSON.parse(str));
    }).catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.card }}>
      {/* Top Brand Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: '#002B5C',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#002B5C',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 5,
            elevation: 3
          }}>
            <Ionicons name="school" size={20} color="#FBBF24" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text, letterSpacing: -0.2 }}>RV ALUMNI</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 5 }} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textMuted }}>Official Portal</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Navigation List */}
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 8 }}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Bottom Profile Widget */}
      <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: theme.border }}>
        <TouchableOpacity
          onPress={() => props.navigation.navigate('Profile')}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
            borderRadius: 12,
            padding: 10,
            borderWidth: 1,
            borderColor: theme.border
          }}
        >
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#003366',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            marginRight: 10
          }}>
            {(currentUser?.avatar_url || currentUser?.profilePicture) ? (
              <Image source={{ uri: currentUser.avatar_url || currentUser.profilePicture }} style={{ width: 36, height: 36, borderRadius: 18 }} />
            ) : (
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>{getInitials(currentUser?.name, 'AL')}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }} numberOfLines={1}>
              {currentUser?.name || 'Alumni Member'}
            </Text>
            <Text style={{ fontSize: 11, color: theme.textMuted }} numberOfLines={1}>
              {currentUser?.role || 'Alumni'} • Profile
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ===== ALUMNI TABS/DRAWER =====
function MainTabs() {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const showDrawer = Platform.OS === 'web' && width >= 768;
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 10);

  if (showDrawer) {
    return (
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={({ route }) => ({
          headerShown: false,
          drawerType: 'permanent',
          drawerStyle: {
            width: 255,
            borderRightWidth: 1.5,
            borderRightColor: theme.cardBorder || theme.border,
            backgroundColor: theme.card,
          },
          drawerItemStyle: {
            borderRadius: 12,
            paddingHorizontal: 10,
            marginVertical: 3,
          },
          drawerActiveBackgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.14)' : 'rgba(0, 43, 92, 0.08)',
          drawerActiveTintColor: isDarkMode ? '#38BDF8' : '#002B5C',
          drawerInactiveTintColor: isDarkMode ? '#94A3B8' : '#64748B',
          drawerLabelStyle: { fontSize: 14, fontWeight: '700', marginLeft: -4 },
          drawerIcon: ({ focused, color }) => {
            let iconComp = null;
            if (route.name === 'Home') iconComp = <Ionicons name={focused ? 'home' : 'home-outline'} size={20} color={focused ? (isDarkMode ? '#38BDF8' : '#002B5C') : color} />;
            if (route.name === 'Engage') iconComp = <MaterialCommunityIcons name={focused ? 'handshake' : 'handshake-outline'} size={20} color={focused ? (isDarkMode ? '#38BDF8' : '#002B5C') : color} />;
            if (route.name === 'Post') iconComp = <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={22} color={focused ? (isDarkMode ? '#38BDF8' : '#002B5C') : color} />;
            if (route.name === 'Jobs') iconComp = <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={20} color={focused ? (isDarkMode ? '#38BDF8' : '#002B5C') : color} />;
            if (route.name === 'Contribute') iconComp = <MaterialCommunityIcons name={focused ? 'hand-heart' : 'hand-heart-outline'} size={20} color={focused ? (isDarkMode ? '#38BDF8' : '#002B5C') : color} />;
            return (
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                backgroundColor: focused ? (isDarkMode ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0, 43, 92, 0.12)') : 'transparent',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {iconComp}
              </View>
            );
          }
        })}
      >
        <Drawer.Screen name="Home" component={DashboardScreen} />
        <Drawer.Screen name="Engage" component={DirectoryScreen} />
        <Drawer.Screen name="Post" component={EngageScreen} />
        <Drawer.Screen name="Jobs" component={JobsScreen} />
        <Drawer.Screen name="Contribute" component={ContributeScreen} />
      </Drawer.Navigator>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarIcon: ({ focused }) => {
          if (route.name === 'Home') return <Render3DTabIcon name={focused ? 'home' : 'home-outline'} focused={focused} isDarkMode={isDarkMode} theme={theme} label="Home" />;
          if (route.name === 'Engage') return <Render3DTabIcon name={focused ? 'handshake' : 'handshake-outline'} focused={focused} isDarkMode={isDarkMode} theme={theme} label="Engage" isMaterial />;
          if (route.name === 'Post') return <Render3DTabIcon focused={focused} isDarkMode={isDarkMode} theme={theme} isPost label="Post" />;
          if (route.name === 'Jobs') return <Render3DTabIcon name={focused ? 'briefcase' : 'briefcase-outline'} focused={focused} isDarkMode={isDarkMode} theme={theme} label="Jobs" />;
          if (route.name === 'Contribute') return <Render3DTabIcon name={focused ? 'hand-heart' : 'hand-heart-outline'} focused={focused} isDarkMode={isDarkMode} theme={theme} label="Support" isMaterial />;
          return null;
        },
        tabBarStyle: {
          borderTopWidth: 1.5,
          borderTopColor: theme.tabBarBorder || theme.border,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: 62 + bottomPadding,
          backgroundColor: theme.tabBarBg || theme.card,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDarkMode ? 0.45 : 0.07,
          shadowRadius: 14,
          elevation: 12
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Engage" component={DirectoryScreen} />
      <Tab.Screen name="Post" component={EngageScreen} />
      <Tab.Screen name="Jobs" component={JobsScreen} />
      <Tab.Screen name="Contribute" component={ContributeScreen} />
    </Tab.Navigator>
  );
}

// ===== ADMIN TABS/DRAWER =====
function AdminTabs() {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const showDrawer = Platform.OS === 'web' && width >= 768;
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 10);

  if (showDrawer) {
    return (
      <AdminDrawer.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          drawerType: 'permanent',
          drawerStyle: {
            width: 240,
            borderRightWidth: 1,
            borderRightColor: theme.border,
            backgroundColor: theme.card,
            paddingTop: 20,
            paddingHorizontal: 12,
          },
          drawerItemStyle: {
            borderRadius: 24,
            paddingHorizontal: 12,
            marginVertical: 4,
          },
          drawerActiveBackgroundColor: isDarkMode ? '#1E293B' : '#F4F6F9',
          drawerActiveTintColor: isDarkMode ? '#60A5FA' : '#003366',
          drawerInactiveTintColor: isDarkMode ? '#94A3B8' : '#8A99AD',
          drawerLabelStyle: { fontSize: 16, fontWeight: '700', marginLeft: -8 },
          drawerIcon: ({ focused, color, size }) => {
            if (route.name === 'AdminHome') return <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />;
            if (route.name === 'AdminUsers') return <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />;
            if (route.name === 'AdminJobs') return <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={22} color={color} />;
            if (route.name === 'AdminEvents') return <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />;
            if (route.name === 'AdminPanel') return <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />;
            return null;
          }
        })}
      >
        <AdminDrawer.Screen name="AdminHome" component={AdminHomeScreen} options={{ drawerLabel: 'Home' }} />
        <AdminDrawer.Screen name="AdminUsers" component={AdminUsersScreen} options={{ drawerLabel: 'Users' }} />
        <AdminDrawer.Screen name="AdminJobs" component={AdminJobsScreen} options={{ drawerLabel: 'Jobs' }} />
        <AdminDrawer.Screen name="AdminEvents" component={AdminEventsScreen} options={{ drawerLabel: 'Events' }} />
        <AdminDrawer.Screen name="AdminPanel" component={AdminPanelScreen} options={{ drawerLabel: 'Panel' }} />
      </AdminDrawer.Navigator>
    );
  }

  return (
    <AdminTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarIcon: ({ focused }) => {
          let iconName = 'help-circle-outline';
          let label = route.name;

          if (route.name === 'AdminHome') { iconName = focused ? 'home' : 'home-outline'; label = 'Home'; }
          else if (route.name === 'AdminUsers') { iconName = focused ? 'people' : 'people-outline'; label = 'Users'; }
          else if (route.name === 'AdminJobs') { iconName = focused ? 'briefcase' : 'briefcase-outline'; label = 'Jobs'; }
          else if (route.name === 'AdminEvents') { iconName = focused ? 'calendar' : 'calendar-outline'; label = 'Events'; }
          else if (route.name === 'AdminPanel') { iconName = focused ? 'grid' : 'grid-outline'; label = 'Panel'; }

          return <Render3DTabIcon name={iconName} focused={focused} isDarkMode={isDarkMode} theme={theme} label={label} />;
        },
        tabBarStyle: {
          borderTopWidth: 1.5,
          borderTopColor: theme.tabBarBorder || theme.border,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: 62 + bottomPadding,
          backgroundColor: theme.tabBarBg || theme.card,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDarkMode ? 0.45 : 0.07,
          shadowRadius: 14,
          elevation: 12
        },
      })}
    >
      <AdminTab.Screen name="AdminHome" component={AdminHomeScreen} />
      <AdminTab.Screen name="AdminUsers" component={AdminUsersScreen} />
      <AdminTab.Screen name="AdminJobs" component={AdminJobsScreen} />
      <AdminTab.Screen name="AdminEvents" component={AdminEventsScreen} />
      <AdminTab.Screen name="AdminPanel" component={AdminPanelScreen} />
    </AdminTab.Navigator>
  );
}

// ===== SUPER ADMIN TABS/DRAWER =====
function SuperAdminTabs() {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const showDrawer = Platform.OS === 'web' && width >= 768;
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 10);

  if (showDrawer) {
    return (
      <SuperAdminDrawer.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          drawerType: 'permanent',
          drawerStyle: {
            width: 240,
            borderRightWidth: 1,
            borderRightColor: theme.border,
            backgroundColor: theme.card,
            paddingTop: 20,
            paddingHorizontal: 12,
          },
          drawerItemStyle: {
            borderRadius: 24,
            paddingHorizontal: 12,
            marginVertical: 4,
          },
          drawerActiveBackgroundColor: isDarkMode ? '#1E293B' : '#F4F6F9',
          drawerActiveTintColor: isDarkMode ? '#60A5FA' : '#003366',
          drawerInactiveTintColor: isDarkMode ? '#94A3B8' : '#8A99AD',
          drawerLabelStyle: { fontSize: 16, fontWeight: '700', marginLeft: -8 },
          drawerIcon: ({ focused, color, size }) => {
            if (route.name === 'SADashboard') return <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />;
            if (route.name === 'SAUsers') return <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />;
            if (route.name === 'SAJobs') return <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={22} color={color} />;
            if (route.name === 'SAEvents') return <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />;
            if (route.name === 'SAPanel') return <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />;
            return null;
          }
        })}
      >
        <SuperAdminDrawer.Screen name="SADashboard" component={SuperAdminDashboardScreen} initialParams={{ initialModule: 'dashboard_home' }} options={{ drawerLabel: 'Dashboard' }} />
        <SuperAdminDrawer.Screen name="SAUsers" component={AdminUsersScreen} initialParams={{ isSuperAdmin: true }} options={{ drawerLabel: 'Users' }} />
        <SuperAdminDrawer.Screen name="SAJobs" component={AdminJobsScreen} initialParams={{ isSuperAdmin: true }} options={{ drawerLabel: 'Jobs' }} />
        <SuperAdminDrawer.Screen name="SAEvents" component={AdminEventsScreen} initialParams={{ isSuperAdmin: true }} options={{ drawerLabel: 'Events' }} />
        <SuperAdminDrawer.Screen name="SAPanel" component={SuperAdminDashboardScreen} initialParams={{ initialModule: null }} options={{ drawerLabel: 'Panel' }} />
      </SuperAdminDrawer.Navigator>
    );
  }

  return (
    <SuperAdminTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarIcon: ({ focused }) => {
          let iconName = 'help-circle-outline';
          let label = route.name;

          if (route.name === 'SADashboard') { iconName = focused ? 'home' : 'home-outline'; label = 'Dashboard'; }
          else if (route.name === 'SAUsers') { iconName = focused ? 'people' : 'people-outline'; label = 'Users'; }
          else if (route.name === 'SAJobs') { iconName = focused ? 'briefcase' : 'briefcase-outline'; label = 'Jobs'; }
          else if (route.name === 'SAEvents') { iconName = focused ? 'calendar' : 'calendar-outline'; label = 'Events'; }
          else if (route.name === 'SAPanel') { iconName = focused ? 'grid' : 'grid-outline'; label = 'Panel'; }

          return <Render3DTabIcon name={iconName} focused={focused} isDarkMode={isDarkMode} theme={theme} label={label} />;
        },
        tabBarStyle: {
          borderTopWidth: 1.5,
          borderTopColor: theme.tabBarBorder || theme.border,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: 62 + bottomPadding,
          backgroundColor: theme.tabBarBg || theme.card,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDarkMode ? 0.45 : 0.07,
          shadowRadius: 14,
          elevation: 12
        },
      })}
    >
      <SuperAdminTab.Screen name="SADashboard" component={SuperAdminDashboardScreen} initialParams={{ initialModule: 'dashboard_home' }} />
      <SuperAdminTab.Screen name="SAUsers" component={AdminUsersScreen} initialParams={{ isSuperAdmin: true }} />
      <SuperAdminTab.Screen name="SAJobs" component={AdminJobsScreen} initialParams={{ isSuperAdmin: true }} />
      <SuperAdminTab.Screen name="SAEvents" component={AdminEventsScreen} initialParams={{ isSuperAdmin: true }} />
      <SuperAdminTab.Screen name="SAPanel" component={SuperAdminDashboardScreen} initialParams={{ initialModule: null }} />
    </SuperAdminTab.Navigator>
  );
}

const getPrefixes = () => {
  const list = [
    'https://alma-orpin-delta.vercel.app',
    'https://almafrontend-eight.vercel.app',
    'https://alumni-app-nine.vercel.app',
    'https://alma-connect.vercel.app',
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:3000',
    'http://localhost:5173',
    'alumni://',
    'alma://'
  ];
  if (typeof window !== 'undefined' && window.location?.origin) {
    if (!list.includes(window.location.origin)) {
      list.unshift(window.location.origin);
    }
  }
  return list;
};

const linking = {
  prefixes: getPrefixes(),
  config: {
    screens: {
      Welcome: '',
      Splash: 'splash',
      PortalSelection: 'portal-selection',
      Login: 'login',
      Signup: 'signup',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      OTPVerification: 'otp-verification',
      ProfileSetup: 'profile-setup',
      SelectInstitution: 'select-institution',
      DemoCarousel: 'demo-carousel',
      Legal: 'legal',
      PrivacyPolicy: 'privacy-policy',
      TermsOfService: 'terms-of-service',
      Terms: 'terms',
      CareerInsights: 'career-insights',
      Main: {
        path: 'main',
        screens: {
          Home: 'home',
          Engage: 'directory',
          Post: 'engage',
          Jobs: 'jobs',
          Contribute: 'contribute',
        }
      },
      AdminLogin: 'admin-login',
      AdminOTP: 'admin-otp',
      AdminMain: {
        path: 'admin',
        screens: {
          DemoCarousel: 'demo',
          AdminHome: 'home',
          AdminUsers: 'users',
          AdminJobs: 'jobs',
          AdminEvents: 'events',
          AdminPanel: 'panel',
        }
      },
      SuperAdminMain: {
        path: 'super-admin',
        screens: {
          SADashboard: 'dashboard',
          SAUsers: 'users',
          SAJobs: 'jobs',
          SAEvents: 'events',
          SAPanel: 'panel',
        }
      },
      Messages: 'messages',
      Chat: 'chat',
      Notifications: 'notifications',
      PostCreation: 'create-post',
      Profile: 'profile',
      Events: 'events',
      AdminProfile: 'admin-profile',
      AdminPlacementDetails: 'placement-details',
    },
  },
};

function RootNavigator() {
  const { theme, isDarkMode } = useTheme();
  return (
    <NavigationContainer 
      linking={linking}
      fallback={<View style={{ flex: 1, backgroundColor: theme.background }} />}
      documentTitle={{
        formatter: (options, route) => `${options?.title || route?.name || 'Alumni'} - RV Alumni Network`
      }}
    >
      <Stack.Navigator 
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}
      >
        {/* Onboarding Flow */}
        <Stack.Screen name="PortalSelection" component={PortalSelectionScreen} />
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={RegisterScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="SelectInstitution" component={SelectInstitutionScreen} />
        <Stack.Screen name="DemoCarousel" component={DemoCarouselScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        {/* Alumni Main App */}
        <Stack.Screen name="Main" component={MainTabs} />

        {/* Admin Auth Flow (Unified under LoginScreen) */}
        <Stack.Screen name="AdminLogin" component={LoginScreen} />
        <Stack.Screen name="AdminOTP" component={AdminOTPScreen} />

        {/* Admin Main App */}
        <Stack.Screen name="AdminMain" component={AdminTabs} />

        {/* Super Admin Main App */}
        <Stack.Screen name="SuperAdminMain" component={SuperAdminTabs} />

        {/* Shared Overlay/Secondary Screens */}
        <Stack.Screen name="Messages" component={MessagesScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="PostCreation" component={PostCreationScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Events" component={AdminEventsScreen} />
        <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
        <Stack.Screen name="AdminPlacementDetails" component={AdminPlacementDetailsScreen} />
        <Stack.Screen name="Legal" component={LegalScreen} />
        <Stack.Screen name="PrivacyPolicy" component={LegalScreen} initialParams={{ tab: 'privacy' }} />
        <Stack.Screen name="TermsOfService" component={LegalScreen} initialParams={{ tab: 'terms' }} />
        <Stack.Screen name="Terms" component={LegalScreen} initialParams={{ tab: 'terms' }} />
        <Stack.Screen name="CareerInsights" component={CareerInsightsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
