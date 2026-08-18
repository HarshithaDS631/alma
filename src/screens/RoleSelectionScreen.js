import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const RoleSelectionScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const [selected, setSelected] = useState(null);

  const roles = [
    { id: 'Alumni', icon: 'school', description: 'Access the global alumni network and resources' },
    { id: 'Admin', icon: 'settings', description: 'Institution-level management and moderation' },
    { id: 'Super Admin', icon: 'shield', description: 'Global Institution governance and control' },
  ];

  const isWeb = Platform.OS === 'web';
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 500, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={webContainerStyle}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
          <Text style={styles.title}>Choose Role</Text>
          <Text style={styles.subtitle}>Select your role to personalize your experience</Text>
        </View>

        <View style={styles.rolesContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.roleCard,
                selected === role.id && styles.selectedCard
              ]}
              onPress={() => setSelected(role.id)}
            >
              <View style={[
                styles.iconContainer,
                selected === role.id && styles.selectedIconContainer
              ]}>
                <Ionicons 
                  name={role.icon} 
                  size={32} 
                  color={selected === role.id ? theme.card : theme.primary} 
                />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={[
                  styles.roleTitle,
                  selected === role.id && styles.selectedRoleTitle
                ]}>{role.id}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </View>
              {selected === role.id && (
                <Ionicons name="checkmark-circle" size={24} color="#003366" />
              )}
            </TouchableOpacity>
          ))}
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
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.card,
  },
  content: {
    padding: 24,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 48,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  rolesContainer: {
    gap: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  selectedCard: {
    backgroundColor: theme.inputBackground,
    borderColor: theme.primary,
    borderWidth: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedIconContainer: {
    backgroundColor: theme.primary,
  },
  roleTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  selectedRoleTitle: {
    color: theme.primary,
  },
  roleDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  footer: {
    padding: 24,
  },
  button: {
    backgroundColor: theme.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: theme.textMuted,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RoleSelectionScreen;
