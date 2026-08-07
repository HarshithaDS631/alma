import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Platform, Text, Alert } from 'react-native';

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

// ===== ALUMNI TABS/DRAWER =====
function MainTabs() {
  const { theme, isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  const showDrawer = Platform.OS === 'web' && width >= 768;

  if (showDrawer) {
    return (
      <Drawer.Navigator
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
            if (route.name === 'Home') return <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />;
            if (route.name === 'Engage') return <MaterialCommunityIcons name={focused ? 'handshake' : 'handshake-outline'} size={22} color={color} />;
            if (route.name === 'Post') return <MaterialCommunityIcons name={focused ? 'account-switch' : 'account-switch-outline'} size={22} color={color} />;
            if (route.name === 'Jobs') return <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={22} color={color} />;
            if (route.name === 'Contribute') return <MaterialCommunityIcons name={focused ? 'hand-heart' : 'hand-heart-outline'} size={22} color={color} />;
            return null;
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
        tabBarIcon: ({ focused, color }) => {
          let icon = null;
          if (route.name === 'Home') icon = <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />;
          if (route.name === 'Engage') icon = <MaterialCommunityIcons name={focused ? 'handshake' : 'handshake-outline'} size={22} color={color} />;
          if (route.name === 'Post') icon = <MaterialCommunityIcons name={focused ? 'account-switch' : 'account-switch-outline'} size={22} color={color} />;
          if (route.name === 'Jobs') icon = <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={22} color={color} />;
          if (route.name === 'Contribute') icon = <MaterialCommunityIcons name={focused ? 'hand-heart' : 'hand-heart-outline'} size={22} color={color} />;
          return (
            <View style={{ alignItems: 'center' }}>
              {focused && <View style={{ position: 'absolute', top: -8, width: 24, height: 3, borderRadius: 2, backgroundColor: theme.primary }} />}
              {icon}
              <Text style={{ color, fontSize: 10, fontWeight: '600', marginTop: 2 }}>{route.name}</Text>
            </View>
          );
        },
        tabBarStyle: { borderTopWidth: 1, borderTopColor: theme.border, paddingBottom: Platform.OS === 'ios' ? 24 : 8, paddingTop: 8, height: Platform.OS === 'ios' ? 88 : 65, backgroundColor: theme.card },
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
  const { width } = useWindowDimensions();
  const showDrawer = Platform.OS === 'web' && width >= 768;

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
        tabBarIcon: ({ focused, color }) => {
          let iconName = 'help-circle-outline';
          let label = route.name;

          if (route.name === 'AdminHome') { iconName = focused ? 'home' : 'home-outline'; label = 'Home'; }
          else if (route.name === 'AdminUsers') { iconName = focused ? 'people' : 'people-outline'; label = 'Users'; }
          else if (route.name === 'AdminJobs') { iconName = focused ? 'briefcase' : 'briefcase-outline'; label = 'Jobs'; }
          else if (route.name === 'AdminEvents') { iconName = focused ? 'calendar' : 'calendar-outline'; label = 'Events'; }
          else if (route.name === 'AdminPanel') { iconName = focused ? 'grid' : 'grid-outline'; label = 'Panel'; }

          return (
            <View style={{ alignItems: 'center' }}>
              {focused && <View style={{ position: 'absolute', top: -8, width: 24, height: 3, borderRadius: 2, backgroundColor: theme.primary }} />}
              <Ionicons name={iconName} size={22} color={color} />
              <Text style={{ color, fontSize: 10, fontWeight: '600', marginTop: 2 }}>{label}</Text>
            </View>
          );
        },
        tabBarStyle: { borderTopWidth: 1, borderTopColor: theme.border, paddingBottom: Platform.OS === 'ios' ? 24 : 8, paddingTop: 8, height: Platform.OS === 'ios' ? 88 : 65, backgroundColor: theme.card },
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
  const { width } = useWindowDimensions();
  const showDrawer = Platform.OS === 'web' && width >= 768;

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
        tabBarIcon: ({ focused, color }) => {
          let iconName = 'help-circle-outline';
          let label = route.name;

          if (route.name === 'SADashboard') { iconName = focused ? 'home' : 'home-outline'; label = 'Dashboard'; }
          else if (route.name === 'SAUsers') { iconName = focused ? 'people' : 'people-outline'; label = 'Users'; }
          else if (route.name === 'SAJobs') { iconName = focused ? 'briefcase' : 'briefcase-outline'; label = 'Jobs'; }
          else if (route.name === 'SAEvents') { iconName = focused ? 'calendar' : 'calendar-outline'; label = 'Events'; }
          else if (route.name === 'SAPanel') { iconName = focused ? 'grid' : 'grid-outline'; label = 'Panel'; }

          return (
            <View style={{ alignItems: 'center' }}>
              {focused && <View style={{ position: 'absolute', top: -8, width: 24, height: 3, borderRadius: 2, backgroundColor: theme.primary }} />}
              <Ionicons name={iconName} size={22} color={color} />
              <Text style={{ color, fontSize: 10, fontWeight: '600', marginTop: 2 }}>{label}</Text>
            </View>
          );
        },
        tabBarStyle: { borderTopWidth: 1, borderTopColor: theme.border, paddingBottom: Platform.OS === 'ios' ? 24 : 8, paddingTop: 8, height: Platform.OS === 'ios' ? 88 : 65, backgroundColor: theme.card },
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

const linking = {
  prefixes: [
    'http://localhost:19006',
    'http://localhost:3000',
    'https://almafrontend-eight.vercel.app',
    'https://alumni-app-nine.vercel.app',
    'https://alma-connect.vercel.app',
    'alumni://'
  ],
  config: {
    screens: {
      Splash: '',
      PortalSelection: 'portal-selection',
      Welcome: 'welcome',
      Login: 'login',
      Signup: 'signup',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      OTPVerification: 'otp-verification',
      ProfileSetup: 'profile-setup',
      SelectInstitution: 'select-institution',
      DemoCarousel: 'demo-carousel',
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
      AdminProfile: 'admin-profile',
      AdminPlacementDetails: 'placement-details',
    },
  },
};

function RootNavigator() {
  const { theme, isDarkMode } = useTheme();
  return (
    <NavigationContainer linking={linking}>
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
        <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
        <Stack.Screen name="AdminPlacementDetails" component={AdminPlacementDetailsScreen} />
        <Stack.Screen name="Legal" component={LegalScreen} />
        <Stack.Screen name="CareerInsights" component={CareerInsightsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
