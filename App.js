import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useWindowDimensions, View, Platform, Text, Alert, Image, TouchableOpacity, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getInitials from './src/lib/getInitials';
import UserAvatar from './src/components/UserAvatar';
import { PulseElement } from './src/components/MotionGraphic';

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
import ResumeBookScreen from './src/screens/ResumeBookScreen';

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

// ===== 3D TACTILE ICON POD HELPER WITH MICRO-MOTION GRAPHICS =====
function Render3DTabIcon({ name, focused, isDarkMode, theme, isPost, label, isMaterial, isProfile, profileAvatar, profileInitials, showTopIndicator }) {
  const scaleAnim = React.useRef(new Animated.Value(focused ? 1.05 : 1)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.05 : 1,
      friction: 6,
      tension: 140,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [focused, scaleAnim]);

  if (isPost) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <PulseElement minScale={0.98} maxScale={1.04} duration={2400}>
          <View style={{
            paddingHorizontal: 16,
            height: 38,
            borderRadius: 19,
            backgroundColor: theme.primary || '#0F2C59',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: theme.primary || '#0A192F',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDarkMode ? 0.5 : 0.28,
            shadowRadius: 8,
            elevation: 7,
          }}>
            <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 2 }} />
            <Text style={{
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: '800',
              letterSpacing: -0.2
            }}>
              Post
            </Text>
          </View>
        </PulseElement>
      </View>
    );
  }

  if (isProfile) {
    return (
      <Animated.View style={{ alignItems: 'center', justifyContent: 'center', transform: [{ scale: scaleAnim }] }}>
        <UserAvatar
          url={profileAvatar}
          name={profileInitials || 'Harshitha D S'}
          size={26}
          ring={focused}
          ringColor="#D4AF37"
        />
        <Text style={{
          color: focused ? '#D4AF37' : '#94A3B8',
          fontSize: 10.5,
          fontWeight: focused ? '800' : '600',
          marginTop: 3,
          letterSpacing: -0.2
        }}>
          {label}
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ alignItems: 'center', justifyContent: 'center', transform: [{ scale: scaleAnim }] }}>
      {showTopIndicator && focused && (
        <View style={{
          position: 'absolute',
          top: -10,
          width: 32,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: '#D4AF37',
        }} />
      )}
      <View style={{
        height: 26,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {isMaterial ? (
          <MaterialCommunityIcons name={name} size={22} color={focused ? '#D4AF37' : '#94A3B8'} />
        ) : (
          <Ionicons name={name} size={22} color={focused ? '#D4AF37' : '#94A3B8'} />
        )}
      </View>
      <Text style={{
        color: focused ? '#D4AF37' : '#94A3B8',
        fontSize: 10.5,
        fontWeight: focused ? '800' : '600',
        marginTop: 3,
        letterSpacing: -0.2
      }}>
        {label}
      </Text>
    </Animated.View>
  );
}

// Custom Drawer Content for Web/Desktop
function CustomDrawerContent(props) {
  const { theme, isDarkMode } = useTheme();
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    AsyncStorage.getItem('userInfo').then(str => {
      if (str) {
        try {
          const parsed = JSON.parse(str);
          if (parsed) {
            const isHarshitha = (parsed.email && parsed.email.toLowerCase() === 'harshithads2001@gmail.com') ||
                                (parsed.name && parsed.name.toLowerCase().includes('harshitha'));
            if ((!parsed.avatar_url && !parsed.profilePicture) || (parsed.avatar_url && parsed.avatar_url.includes('6a0a8e156693c176e3d31931af9df3f5'))) {
              if (isHarshitha) {
                parsed.avatar_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80';
              }
            }
            setCurrentUser(parsed);
          }
        } catch (_) {}
      }
    }).catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#070D1E' : '#FFFFFF' }}>
      {/* Top Brand Header */}
      <View style={{
        paddingHorizontal: 16,
        paddingTop: 22,
        paddingBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? 'rgba(212, 175, 55, 0.3)' : '#E2E8F0',
        backgroundColor: isDarkMode ? '#0A192F' : '#F8FAFC',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: '#D4AF37',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#D4AF37',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.35,
            shadowRadius: 5,
            elevation: 4
          }}>
            <Text style={{ color: '#0A192F', fontWeight: '900', fontSize: 17, letterSpacing: -0.5 }}>RV</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14.5, fontWeight: '900', color: isDarkMode ? '#FFFFFF' : '#0A192F', letterSpacing: 0.5 }}>
              RV ALUMNI <Text style={{ color: '#D4AF37' }}>•</Text>
            </Text>
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#D4AF37', letterSpacing: 1.4, marginTop: 2 }}>
              OFFICIAL PORTAL
            </Text>
          </View>
        </View>
      </View>

      {/* Navigation List */}
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 8 }}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Bottom Profile Widget */}
      <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: isDarkMode ? 'rgba(212, 175, 55, 0.3)' : '#E2E8F0' }}>
        <TouchableOpacity
          onPress={() => props.navigation.navigate('Profile')}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDarkMode ? '#0D1B3A' : '#F8FAFC',
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: isDarkMode ? 'rgba(212, 175, 55, 0.35)' : 'rgba(212, 175, 55, 0.45)',
            shadowColor: '#0A192F',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDarkMode ? 0.2 : 0.05,
            shadowRadius: 5,
            elevation: 2,
          }}
        >
          <UserAvatar
            url={currentUser?.avatar_url || currentUser?.profilePicture}
            name={currentUser?.name || 'Harshitha D S'}
            size={40}
            ring
            ringColor="#D4AF37"
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13.5, fontWeight: '700', color: isDarkMode ? '#FFFFFF' : '#0A192F' }} numberOfLines={1}>
              {currentUser?.name || 'Harshitha D S'}
            </Text>
            <Text style={{ fontSize: 11, color: isDarkMode ? '#D4AF37' : '#B48608', fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
              {`${currentUser?.role || 'Alumni'} • RVCE '24`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#D4AF37" />
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
  const showDrawer = Platform.OS === 'web' && width >= 1024;
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 10);
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    AsyncStorage.getItem('userInfo').then(str => {
      if (str) {
        try {
          const parsed = JSON.parse(str);
          if (parsed) {
            const isHarshitha = (parsed.email && parsed.email.toLowerCase() === 'harshithads2001@gmail.com') ||
                                (parsed.name && parsed.name.toLowerCase().includes('harshitha'));
            if ((!parsed.avatar_url && !parsed.profilePicture) || (parsed.avatar_url && parsed.avatar_url.includes('6a0a8e156693c176e3d31931af9df3f5'))) {
              if (isHarshitha) {
                parsed.avatar_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80';
              }
            }
            setCurrentUser(parsed);
          }
        } catch (_) {}
      }
    }).catch(() => {});
  }, []);

  const avatarUrl = currentUser?.avatar_url || currentUser?.profilePicture || null;
  const initials = getInitials(currentUser?.name, 'AL');

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
            borderRightColor: isDarkMode ? 'rgba(212, 175, 55, 0.3)' : '#E2E8F0',
            backgroundColor: isDarkMode ? '#070D1E' : '#FFFFFF',
          },
          drawerItemStyle: {
            borderRadius: 12,
            paddingHorizontal: 10,
            marginVertical: 3,
          },
          drawerActiveBackgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.2)' : 'rgba(15, 44, 89, 0.08)',
          drawerActiveTintColor: isDarkMode ? '#D4AF37' : '#0F2C59',
          drawerInactiveTintColor: isDarkMode ? '#CBD5E1' : '#475569',
          drawerLabelStyle: { fontSize: 14, fontWeight: '700', marginLeft: -4 },
          drawerIcon: ({ focused, color }) => {
            const activeColor = isDarkMode ? '#D4AF37' : '#0F2C59';
            let iconComp = null;
            if (route.name === 'Home') iconComp = <Ionicons name={focused ? 'home' : 'home-outline'} size={20} color={focused ? activeColor : color} />;
            if (route.name === 'Engage') iconComp = <Ionicons name={focused ? 'people' : 'people-outline'} size={20} color={focused ? activeColor : color} />;
            if (route.name === 'Post') iconComp = <Ionicons name={focused ? 'create' : 'create-outline'} size={20} color={focused ? activeColor : color} />;
            if (route.name === 'Jobs') iconComp = <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={20} color={focused ? activeColor : color} />;
            if (route.name === 'Profile') {
              iconComp = (
                <UserAvatar
                  url={avatarUrl}
                  name={currentUser?.name || 'Harshitha D S'}
                  size={26}
                  ring={focused}
                  ringColor="#D4AF37"
                />
              );
            }
            if (route.name === 'Messages') iconComp = <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={20} color={focused ? activeColor : color} />;
            return (
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                backgroundColor: focused ? 'rgba(212, 175, 55, 0.22)' : 'transparent',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {iconComp}
              </View>
            );
          }
        })}
      >
        <Drawer.Screen name="Home" component={DashboardScreen} options={{ drawerLabel: 'Dashboard Feed' }} />
        <Drawer.Screen name="Engage" component={DirectoryScreen} options={{ drawerLabel: 'Directory' }} />
        <Drawer.Screen name="Post" component={EngageScreen} options={{ drawerLabel: 'Post' }} />
        <Drawer.Screen name="Jobs" component={JobsScreen} options={{ drawerLabel: 'Jobs' }} />
        <Drawer.Screen name="Profile" component={ProfileScreen} options={{ drawerLabel: 'Profile', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="Messages" component={MessagesScreen} options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="Support" component={ContributeScreen} options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="Contribute" component={ContributeScreen} options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ drawerItemStyle: { display: 'none' } }} />
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
          if (route.name === 'Home') {
            return (
              <Render3DTabIcon 
                name={focused ? 'home' : 'home-outline'} 
                focused={focused} 
                isDarkMode={isDarkMode} 
                theme={theme} 
                label="Home" 
                showTopIndicator 
              />
            );
          }
          if (route.name === 'Engage') {
            return (
              <Render3DTabIcon 
                name={focused ? 'people' : 'people-outline'} 
                focused={focused} 
                isDarkMode={isDarkMode} 
                theme={theme} 
                label="Alumni" 
              />
            );
          }
          if (route.name === 'Post') {
            return (
              <Render3DTabIcon 
                focused={focused} 
                isDarkMode={isDarkMode} 
                theme={theme} 
                isPost 
                label="Post" 
              />
            );
          }
          if (route.name === 'Jobs') {
            return (
              <Render3DTabIcon 
                name={focused ? 'briefcase' : 'briefcase-outline'} 
                focused={focused} 
                isDarkMode={isDarkMode} 
                theme={theme} 
                label="Jobs" 
              />
            );
          }
          if (route.name === 'Profile') {
            return (
              <Render3DTabIcon 
                name={focused ? 'person' : 'person-outline'}
                focused={focused} 
                isDarkMode={isDarkMode} 
                theme={theme} 
                label="Profile" 
                isProfile 
                profileAvatar={avatarUrl} 
                profileInitials={initials} 
              />
            );
          }
          return null;
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: isDarkMode ? 'rgba(212, 175, 55, 0.35)' : '#E2E8F0',
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: 60 + bottomPadding,
          backgroundColor: isDarkMode ? '#070D1E' : '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isDarkMode ? 0.45 : 0.08,
          shadowRadius: 10,
          elevation: 10
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Engage" component={DirectoryScreen} />
      <Tab.Screen 
        name="Post" 
        component={EngageScreen} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('PostCreation');
          },
        })}
      />
      <Tab.Screen name="Jobs" component={JobsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ tabBarItemStyle: { display: 'none' } }} />
      <Tab.Screen name="Support" component={ContributeScreen} options={{ tabBarItemStyle: { display: 'none' } }} />
      <Tab.Screen name="Contribute" component={ContributeScreen} options={{ tabBarItemStyle: { display: 'none' } }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarItemStyle: { display: 'none' } }} />
    </Tab.Navigator>
  );
}

// ===== ADMIN TABS/DRAWER =====
function AdminTabs() {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const showDrawer = Platform.OS === 'web' && width >= 1024;
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
            borderRightColor: isDarkMode ? 'rgba(212, 175, 55, 0.35)' : '#E2E8F0',
            backgroundColor: isDarkMode ? '#0A1224' : '#FFFFFF',
            paddingTop: 20,
            paddingHorizontal: 12,
          },
          drawerItemStyle: {
            borderRadius: 24,
            paddingHorizontal: 12,
            marginVertical: 4,
          },
          drawerActiveBackgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.2)' : 'rgba(15, 44, 89, 0.08)',
          drawerActiveTintColor: isDarkMode ? '#D4AF37' : '#0F2C59',
          drawerInactiveTintColor: isDarkMode ? '#CBD5E1' : '#475569',
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
            borderRightColor: isDarkMode ? 'rgba(212, 175, 55, 0.35)' : '#E2E8F0',
            backgroundColor: isDarkMode ? '#0A1224' : '#FFFFFF',
            paddingTop: 20,
            paddingHorizontal: 12,
          },
          drawerItemStyle: {
            borderRadius: 24,
            paddingHorizontal: 12,
            marginVertical: 4,
          },
          drawerActiveBackgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.2)' : 'rgba(15, 44, 89, 0.08)',
          drawerActiveTintColor: isDarkMode ? '#D4AF37' : '#0F2C59',
          drawerInactiveTintColor: isDarkMode ? '#CBD5E1' : '#475569',
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
          ResumeBook: 'resume-book',
          Post: 'engage',
          Jobs: 'jobs',
          Profile: 'profile',
          Messages: 'messages',
          Support: 'support',
          Contribute: 'contribute',
          Notifications: 'notifications',
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
      Chat: 'chat',
      PostCreation: 'create-post',
      ResumeBook: 'resume-book',
      Events: 'events',
      Mentorship: 'mentorship',
      AdminProfile: 'admin-profile',
      AdminPlacementDetails: 'placement-details',
    },
  },
};

function RootNavigator() {
  const { theme } = useTheme();
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
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="PostCreation" component={PostCreationScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Events" component={AdminEventsScreen} />
        <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
        <Stack.Screen name="AdminPlacementDetails" component={AdminPlacementDetailsScreen} />
        <Stack.Screen name="Legal" component={LegalScreen} />
        <Stack.Screen name="PrivacyPolicy" component={LegalScreen} initialParams={{ tab: 'privacy' }} />
        <Stack.Screen name="TermsOfService" component={LegalScreen} initialParams={{ tab: 'terms' }} />
        <Stack.Screen name="Terms" component={LegalScreen} initialParams={{ tab: 'terms' }} />
        <Stack.Screen name="CareerInsights" component={CareerInsightsScreen} />
        <Stack.Screen name="Mentorship" component={ContributeScreen} initialParams={{ tab: 'mentorship' }} />
        <Stack.Screen name="ResumeBook" component={ResumeBookScreen} />
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
