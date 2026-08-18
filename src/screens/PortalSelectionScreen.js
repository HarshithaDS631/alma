import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, StatusBar, Platform, useWindowDimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const institutions = [
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
  { id: 'RV University, Mysuru Campus', name: 'RVU_MYS', fullName: 'RV University, Mysuru Campus', icon: 'ribbon', color: '#D97706' },
];

const PortalSelectionScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const numColumns = isWeb ? (width > 1200 ? 4 : width > 800 ? 3 : 2) : 1;
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 1200, flex: 1, paddingHorizontal: 20 } : { flex: 1, paddingHorizontal: 20 };
  
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInstitutions = institutions.filter(inst => 
    inst.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inst.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = async (institution) => {
    try {
      await AsyncStorage.setItem('current_portal_institution', JSON.stringify(institution));
      navigation.navigate('Welcome');
    } catch (e) {
      console.error('Failed to save portal selection', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={webContainerStyle}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Alumni Portals</Text>
          <Text style={styles.subtitle}>Select your institution to access your dedicated alumni network.</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search institutions..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.grid, { flexDirection: isWeb ? 'row' : 'column', flexWrap: isWeb ? 'wrap' : 'nowrap' }]}>
            {filteredInstitutions.map((inst) => (
              <TouchableOpacity 
                key={inst.id} 
                style={[styles.card, isWeb && { width: `${100 / numColumns}%`, padding: 10 }]} 
                onPress={() => handleSelect(inst)}
                activeOpacity={0.7}
              >
                <View style={styles.cardInner}>
                  <View style={[styles.iconContainer, { backgroundColor: inst.color + '20' }]}>
                    <Ionicons name={inst.icon} size={28} color={inst.color} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.shortName}>{inst.name}</Text>
                    <Text style={styles.fullName}>{inst.fullName}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.border} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
          {filteredInstitutions.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={theme.border} />
              <Text style={styles.emptyText}>No institutions found.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    marginTop: Platform.OS === 'ios' ? 20 : 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textMuted,
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: theme.text,
    fontSize: 16,
    outlineStyle: 'none',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  grid: {
    // Flex properties handled inline for web responsiveness
  },
  card: {
    marginBottom: Platform.OS === 'ios' ? 12 : 0,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    height: 100,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  shortName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  fullName: {
    fontSize: 13,
    color: theme.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: theme.textMuted,
    marginTop: 16,
  },
});

export default PortalSelectionScreen;
