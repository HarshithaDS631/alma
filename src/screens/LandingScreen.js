import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Mascot from '../components/Mascot';

const LandingScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <Mascot size={110} />
          </View>
          <Text style={styles.badge}>Welcome back</Text>
          <Text style={styles.title}>
            Alumni <Text style={styles.highlight}>Portal</Text>
          </Text>
          <Text style={styles.subtitle}>
            Connect, Collaborate, and Grow Together with the exclusive global network of your institution&apos;s alumni.
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>25k+</Text>
            <Text style={styles.statLabel}>Alumni</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>5k+</Text>
            <Text style={styles.statLabel}>Jobs</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.primaryButtonText}>Join the Network</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('SelectInstitution')}
        >
          <Text style={styles.secondaryButtonText}>Explore as Guest</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: 'rgba(10, 61, 145, 0.1)',
    color: theme.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontWeight: '600',
    marginBottom: 16,
    overflow: 'hidden',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: 16,
  },
  highlight: {
    color: theme.primary,
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: 4,
  },
  statLabel: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    paddingBottom: 36,
  },
  primaryButton: {
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: theme.card,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.primary,
  },
  secondaryButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LandingScreen;
