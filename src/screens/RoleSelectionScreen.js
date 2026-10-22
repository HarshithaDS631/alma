import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform, StatusBar } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const RoleSelectionScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);

  const [selected, setSelected] = useState(null);

  const roles = [
    { 
      id: 'Alumni', 
      title: 'Alumni & Student Network',
      badge: 'GLOBAL ACCESS',
      icon: 'school-outline', 
      description: 'Connect with alumni globally, seek career mentorship, explore job boards, and attend reunions.',
      tagBg: isDarkMode ? '#241B15' : '#FAF4ED',
      tagBorder: isDarkMode ? 'rgba(212, 163, 115, 0.35)' : '#E8D4C1',
      tagColor: isDarkMode ? '#D4A373' : '#B88758',
    },
    { 
      id: 'Admin', 
      title: 'Institutional Admin',
      badge: 'CAMPUS COMMAND',
      icon: 'shield-checkmark-outline', 
      description: 'Manage campus alumni rosters, approve registrations, publish jobs, and moderate community feeds.',
      tagBg: isDarkMode ? '#14251B' : '#F0FDF4',
      tagBorder: isDarkMode ? 'rgba(52, 211, 153, 0.3)' : '#A7F3D0',
      tagColor: isDarkMode ? '#34D399' : '#059669',
    },
    { 
      id: 'Super Admin', 
      title: 'Global Super Admin',
      badge: 'ENTERPRISE GOVERNANCE',
      icon: 'globe-outline', 
      description: 'Manage all 27+ institutional portals, audit admin activity logs, configure integrations, and oversee security.',
      tagBg: isDarkMode ? '#241B15' : '#FAF4ED',
      tagBorder: isDarkMode ? 'rgba(212, 163, 115, 0.35)' : '#E8D4C1',
      tagColor: isDarkMode ? '#D4A373' : '#B88758',
    },
  ];

  const isWeb = Platform.OS === 'web';
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 540, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.card} />
      <View style={webContainerStyle}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* Header Badge & Title */}
            <View style={styles.header}>
              <View style={styles.badgePod}>
                <Ionicons name="sparkles" size={13} color={isDarkMode ? '#D4A373' : '#B88758'} />
                <Text style={styles.badgeText}>RV ALUMNI PORTAL ACCESS</Text>
              </View>
              <Text style={styles.title}>Choose Your Role</Text>
              <Text style={styles.subtitle}>Select your portal account type to personalize your navigation and workspace</Text>
            </View>

            {/* Role Cards */}
            <View style={styles.rolesContainer}>
              {roles.map((role) => {
                const isSelected = selected === role.id;
                return (
                  <TouchableOpacity
                    key={role.id}
                    style={[
                      styles.roleCard,
                      isSelected && styles.selectedCard
                    ]}
                    onPress={() => setSelected(role.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.roleCardHeader}>
                      <View style={[
                        styles.iconContainer,
                        isSelected && styles.selectedIconContainer
                      ]}>
                        <Ionicons 
                          name={role.icon} 
                          size={28} 
                          color={isSelected ? '#FFFFFF' : theme.primary} 
                        />
                      </View>
                      <View style={styles.roleTitleGroup}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={[
                            styles.roleTitle,
                            isSelected && styles.selectedRoleTitle
                          ]}>
                            {role.title}
                          </Text>
                          <Ionicons 
                            name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                            size={22} 
                            color={isSelected ? theme.primary : theme.textMuted} 
                          />
                        </View>
                        <View style={[styles.pillBadge, { backgroundColor: role.tagBg, borderColor: role.tagBorder }]}>
                          <Text style={[styles.pillBadgeText, { color: role.tagColor }]}>{role.badge}</Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.roleDescription}>{role.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, !selected && styles.disabledButton]}
            disabled={!selected}
            onPress={() => {
              if (selected === 'Admin') navigation.navigate('AdminMain');
              else if (selected === 'Super Admin') navigation.navigate('SuperAdminMain');
              else navigation.navigate('Main');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Continue to Portal</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    padding: 24,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 32,
    marginTop: 12,
  },
  badgePod: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: isDarkMode ? '#241B15' : '#FAF4ED',
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(212, 163, 115, 0.35)' : '#E8D4C1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: isDarkMode ? '#D4A373' : '#B88758',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14.5,
    color: theme.textSecondary,
    lineHeight: 21,
  },
  rolesContainer: {
    gap: 16,
  },
  roleCard: {
    backgroundColor: theme.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: theme.border,
    shadowColor: theme.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: isDarkMode ? '#132118' : '#FFFFFF',
    borderColor: theme.primary,
    borderWidth: 2,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: isDarkMode ? '#1C251F' : '#F0FDF4',
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(52, 211, 153, 0.2)' : '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  selectedIconContainer: {
    backgroundColor: theme.primary,
    borderColor: theme.primaryDark || '#047857',
  },
  roleTitleGroup: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.2,
  },
  selectedRoleTitle: {
    color: theme.primary,
  },
  pillBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  pillBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roleDescription: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18.5,
    marginTop: 2,
  },
  footer: {
    padding: 24,
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  button: {
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: theme.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default RoleSelectionScreen;
