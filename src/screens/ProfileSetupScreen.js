import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, Image, StatusBar, Modal, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile } from '../services/uploadService';
import { updateProfile } from '../services/authService';
import { institutionDepartments, defaultDepartments } from '../constants/institutionDepartments';

const institutions = [
  { id: 'RV School', name: 'RVS', fullName: 'RV School' },
  { id: 'RV Girls High School', name: 'RVGHS', fullName: 'RV Girls High School' },
  { id: 'RV Public School', name: 'RVPS', fullName: 'RV Public School' },
  { id: 'RV Learning Hub', name: 'RVLH', fullName: 'RV Learning Hub' },
  { id: 'SSMRV PU College', name: 'SSMRVPU', fullName: 'SSMRV PU College' },
  { id: 'NMKRV PU College', name: 'NMKRVPU', fullName: 'NMKRV PU College' },
  { id: 'RV PU College Jayanagar', name: 'RVPU_JAY', fullName: 'RV PU College Jayanagar' },
  { id: 'RV PU College North', name: 'RVPU_NOR', fullName: 'RV PU College North' },
  { id: 'RV PU College South', name: 'RVPU_SOU', fullName: 'RV PU College South' },
  { id: 'RV PU College, E-City', name: 'RVPU_ECI', fullName: 'RV PU College, E-City' },
  { id: 'RV PU College, Harohalli', name: 'RVPU_HAR', fullName: 'RV PU College, Harohalli' },
  { id: 'RV PU College, Mysuru', name: 'RVPU_MYS', fullName: 'RV PU College, Mysuru' },
  { id: 'RV College of Engineering', name: 'RVCE', fullName: 'RV College of Engineering' },
  { id: 'RV Institute of Technology and Management', name: 'RVITM', fullName: 'RV Institute of Technology and Management' },
  { id: 'RV-Skills', name: 'RVSK', fullName: 'RV-Skills' },
  { id: 'RV College of Architecture', name: 'RVCA', fullName: 'RV College of Architecture' },
  { id: 'RV Institute of Management', name: 'RVIM', fullName: 'RV Institute of Management' },
  { id: 'MKPM RV Institute of Legal Studies', name: 'RVILS', fullName: 'MKPM RV Institute of Legal Studies' },
  { id: 'RV Teachers College', name: 'RVTC', fullName: 'RV Teachers College' },
  { id: 'D.A. Pandu Memorial RV Dental College', name: 'DAPMRV', fullName: 'D.A. Pandu Memorial RV Dental College' },
  { id: 'RV College of Physiotherapy', name: 'RVCP', fullName: 'RV College of Physiotherapy' },
  { id: 'RV College of Nursing', name: 'RVCN', fullName: 'RV College of Nursing' },
  { id: 'NMKRV College', name: 'NMKRV', fullName: 'NMKRV College' },
  { id: 'SSMRV College', name: 'SSMRV', fullName: 'SSMRV College' },
  { id: 'RV University, Bengaluru Campus', name: 'RVU_BLR', fullName: 'RV University, Bengaluru Campus' },
  { id: 'RV University, Mysuru Campus', name: 'RVU_MYS', fullName: 'RV University, Mysuru Campus' },
];

const popularLocations = [
  'Bengaluru, Karnataka, India',
  'Mysuru, Karnataka, India',
  'Mangaluru, Karnataka, India',
  'Hubballi-Dharwad, Karnataka, India',
  'Mumbai, Maharashtra, India',
  'Pune, Maharashtra, India',
  'Delhi NCR, India',
  'Hyderabad, Telangana, India',
  'Chennai, Tamil Nadu, India',
  'Kolkata, West Bengal, India',
  'Ahmedabad, Gujarat, India',
  'Kochi, Kerala, India',
  'San Francisco Bay Area, CA, USA',
  'New York City, NY, USA',
  'Seattle, WA, USA',
  'London, United Kingdom',
  'Singapore',
  'Dubai, United Arab Emirates',
  'Sydney, Australia',
  'Toronto, Canada'
];

const BATCH_YEARS_LIST = Array.from({ length: 61 }, (_, i) => String(2030 - i));

const ProfileSetupScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const [formData, setFormData] = useState({
    fullName: '',
    institution: '',
    batchYear: '',
    department: '',
    dateOfBirth: '',
    company: '',
    location: '',
  });

  const getActiveDepartments = () => {
    if (!formData.institution) return defaultDepartments;
    const instStr = formData.institution.toLowerCase();
    const matchedKey = Object.keys(institutionDepartments).find(k => 
      instStr.includes(k.toLowerCase()) || k.toLowerCase().includes(instStr)
    );
    return matchedKey ? institutionDepartments[matchedKey] : (institutionDepartments[formData.institution] || defaultDepartments);
  };
  
  const [avatar, setAvatar] = useState(null);
  const [avatarMimeType, setAvatarMimeType] = useState('image/jpeg');
  const [isUploading, setIsUploading] = useState(false);
  const [instModalVisible, setInstModalVisible] = useState(false);
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);
  const [deptModalVisible, setDeptModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [dobModalVisible, setDobModalVisible] = useState(false);

  useEffect(() => {
    const loadCachedUser = async () => {
      try {
        const stored = await AsyncStorage.getItem('userInfo');
        if (stored) {
          const user = JSON.parse(stored);
          setFormData({
            fullName: user.name || '',
            institution: user.institution || '',
            batchYear: (user.batchYear || user.batch_year || user.batch || '').toString(),
            department: user.department || user.branch || '',
            dateOfBirth: user.dateOfBirth || '',
            company: user.company || '',
            location: user.location || '',
          });
          if (user.avatar_url) {
            setAvatar(user.avatar_url);
          }
        }
      } catch (e) {
        console.log('Error loading cached user in ProfileSetupScreen:', e);
      }
    };
    loadCachedUser();
  }, []);

  const handleContinue = async () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    if (!formData.batchYear.trim()) {
      Alert.alert('Required', 'Please enter your graduation batch year.');
      return;
    }
    if (!formData.department.trim()) {
      Alert.alert('Required', 'Please enter your department/branch.');
      return;
    }

    setIsUploading(true);
    try {
      let avatarUrl = null;
      if (avatar) {
        avatarUrl = await uploadFile(avatar, avatarMimeType, 'avatar.jpg');
      }

      const payload = {
        name: formData.fullName,
        institution: formData.institution,
        batchYear: formData.batchYear,
        batch_year: formData.batchYear,
        department: formData.department,
        branch: formData.department,
        company: formData.company,
        location: formData.location,
        dateOfBirth: formData.dateOfBirth && formData.dateOfBirth.trim() ? formData.dateOfBirth : null,
      };
      if (avatarUrl) {
        payload.avatar_url = avatarUrl;
      }

      const updatedRes = await updateProfile(payload);

      try {
        const stored = await AsyncStorage.getItem('userInfo');
        if (stored) {
          const user = JSON.parse(stored);
          user.name = formData.fullName;
          user.institution = formData.institution;
          user.batchYear = formData.batchYear;
          user.batch_year = formData.batchYear;
          user.department = formData.department;
          user.branch = formData.department;
          user.dateOfBirth = formData.dateOfBirth;
          user.company = formData.company;
          user.location = formData.location;
          if (avatarUrl) user.avatar_url = avatarUrl;
          if (updatedRes && updatedRes.token) {
            user.token = updatedRes.token;
          }
          await AsyncStorage.setItem('userInfo', JSON.stringify(user));
          if (user.token) {
            await AsyncStorage.setItem('userToken', user.token);
            await AsyncStorage.setItem('token', user.token);
          }
        }
      } catch (e) {}

      setIsUploading(false);
      navigation.navigate('Main');
    } catch (error) {
      console.error('Error saving profile setup:', error);
      setIsUploading(false);
      const serverMsg = error?.response?.data?.message || (Array.isArray(error?.response?.data?.errors) ? error.response.data.errors.map(err => err.msg).join('\n') : null);
      Alert.alert('Error', serverMsg || error?.message || 'Failed to save profile. Please try again.');
    }
  };

  const handleSelectAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
      setAvatarMimeType(result.assets[0].mimeType || 'image/jpeg');
    }
  };

    const isWeb = Platform.OS === 'web';
  const webContainerStyle = isWeb ? { alignSelf: 'center', width: '100%', maxWidth: 800, flex: 1 } : { flex: 1 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={webContainerStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressStep, styles.stepActive]} />
            <View style={[styles.progressStep, styles.stepActive]} />
            <View style={[styles.progressStep, styles.stepActive]} />
            <View style={styles.progressStep} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Profile Setup</Text>
            <Text style={styles.subtitle}>Complete your profile to connect with fellow alumni</Text>
          </View>

          {/* Avatar Upload Placeholder */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarButton} onPress={handleSelectAvatar} activeOpacity={0.8}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color="#94A3B8" />
                  <Text style={styles.avatarLabel}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#94A3B8"
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Institution *</Text>
              <TouchableOpacity 
                style={styles.inputWrapper} 
                onPress={() => setInstModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="business-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <Text style={[styles.input, !formData.institution && { color: theme.textMuted }]}>
                  {formData.institution ? formData.institution : 'Select your Institution'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>Batch Year *</Text>
                <TouchableOpacity 
                  style={styles.inputWrapper} 
                  onPress={() => setBatchModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <Text style={[styles.input, !formData.batchYear && { color: theme.textMuted }]}>
                    {formData.batchYear ? formData.batchYear : 'Select Year'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>Department *</Text>
                <TouchableOpacity 
                  style={styles.inputWrapper} 
                  onPress={() => setDeptModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="school-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <Text style={[styles.input, !formData.department && { color: theme.textMuted }]} numberOfLines={1}>
                    {formData.department ? formData.department : 'Select Dept'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth 🎂</Text>
              {Platform.OS === 'web' ? (
                <View style={styles.inputWrapper}>
                  <Ionicons name="calendar-sharp" size={20} color="#003366" style={styles.inputIcon} />
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    style={{
                      flex: 1,
                      height: '100%',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: theme.text,
                      fontSize: '14px',
                      fontWeight: '500',
                      fontFamily: 'inherit',
                      cursor: 'pointer'
                    }}
                  />
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.inputWrapper} 
                  onPress={() => setDobModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-sharp" size={20} color="#003366" style={styles.inputIcon} />
                  <Text style={[styles.input, !formData.dateOfBirth && { color: theme.textMuted }]}>
                    {formData.dateOfBirth ? formData.dateOfBirth : 'YYYY-MM-DD'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Current Company</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="briefcase-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Google, Microsoft, Startup"
                  placeholderTextColor="#94A3B8"
                  value={formData.company}
                  onChangeText={(text) => setFormData({ ...formData, company: text })}
                />
              </View>
            </View>

            <View style={[styles.inputContainer, { zIndex: 100 }]}>
                <Text style={styles.label}>Location</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="location-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Bengaluru, India or San Francisco, USA"
                    placeholderTextColor="#94A3B8"
                    value={formData.location}
                    onChangeText={(text) => {
                      setFormData({ ...formData, location: text });
                      setShowLocSuggestions(true);
                    }}
                    onFocus={() => setShowLocSuggestions(true)}
                  />
                  {formData.location ? (
                    <TouchableOpacity onPress={() => { setFormData({ ...formData, location: '' }); setShowLocSuggestions(false); }}>
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Auto-complete Location Suggestions Dropdown */}
                {showLocSuggestions && (
                  <View style={{
                    backgroundColor: theme.cardBackground || '#FFFFFF',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(0,0,0,0.1)',
                    marginTop: 6,
                    maxHeight: 180,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                    elevation: 5,
                    zIndex: 1000
                  }}>
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 180 }}>
                      {popularLocations
                        .filter(loc => loc.toLowerCase().includes((formData.location || '').toLowerCase()))
                        .slice(0, 5)
                        .map((locItem, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingVertical: 12,
                              paddingHorizontal: 16,
                              borderBottomWidth: 0.5,
                              borderColor: 'rgba(0,0,0,0.06)'
                            }}
                            onPress={() => {
                              setFormData({ ...formData, location: locItem });
                              setShowLocSuggestions(false);
                            }}
                          >
                            <Ionicons name="location-sharp" size={16} color="#003366" style={{ marginRight: 10 }} />
                            <Text style={{ fontSize: 14, color: theme.text, flex: 1 }}>{locItem}</Text>
                          </TouchableOpacity>
                        ))}
                      {formData.location && !popularLocations.some(l => l.toLowerCase() === formData.location.toLowerCase()) ? (
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            backgroundColor: 'rgba(0, 51, 102, 0.04)'
                          }}
                          onPress={() => setShowLocSuggestions(false)}
                        >
                          <Ionicons name="add-circle" size={16} color="#003366" style={{ marginRight: 10 }} />
                          <Text style={{ fontSize: 14, color: '#003366', fontWeight: '600' }}>
                            Use "{formData.location}"
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

          <TouchableOpacity style={[styles.button, isUploading && { opacity: 0.7 }]} onPress={handleContinue} activeOpacity={0.8} disabled={isUploading}>
            <Text style={styles.buttonText}>{isUploading ? 'Saving...' : 'Save & Continue'}</Text>
            {!isUploading && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Institution Selection Modal */}
      <Modal visible={instModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setInstModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Institution</Text>
              <TouchableOpacity onPress={() => setInstModalVisible(false)}>
                <Ionicons name="close" size={24} color="#002144" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={institutions}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalListItem,
                    formData.institution === `${item.fullName} (${item.name})` && styles.selectedModalListItem
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, institution: `${item.fullName} (${item.name})` });
                    setInstModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.modalListItemText,
                    formData.institution === `${item.fullName} (${item.name})` && styles.selectedModalListItemText
                  ]}>
                    {item.fullName} ({item.name})
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Department Dropdown Modal */}
      <Modal visible={deptModalVisible} transparent animationType="slide" onRequestClose={() => setDeptModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDeptModalVisible(false)}>
          <View style={[styles.modalContent, { maxHeight: 500 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Department / Branch</Text>
              <TouchableOpacity onPress={() => setDeptModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={getActiveDepartments()}
              keyExtractor={(item, idx) => idx.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 0.5, borderColor: theme.border }}
                  onPress={() => {
                    setFormData({ ...formData, department: item });
                    setDeptModalVisible(false);
                  }}
                >
                  <Text style={{ fontSize: 15, color: formData.department === item ? theme.primary : theme.text, fontWeight: formData.department === item ? '700' : '400' }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Batch Year Dropdown Modal */}
      <Modal visible={batchModalVisible} transparent animationType="slide" onRequestClose={() => setBatchModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setBatchModalVisible(false)}>
          <View style={[styles.modalContent, { maxHeight: 480 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Graduation Batch Year</Text>
              <TouchableOpacity onPress={() => setBatchModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ paddingHorizontal: 16, marginTop: 10 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {BATCH_YEARS_LIST.map((yearStr, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={{
                      width: '30%',
                      paddingVertical: 12,
                      marginVertical: 6,
                      borderRadius: 10,
                      backgroundColor: formData.batchYear === yearStr ? theme.primary : 'rgba(0, 33, 68, 0.05)',
                      alignItems: 'center'
                    }}
                    onPress={() => {
                      setFormData({ ...formData, batchYear: yearStr });
                      setBatchModalVisible(false);
                    }}
                  >
                    <Text style={{ color: formData.batchYear === yearStr ? '#FFFFFF' : theme.text, fontWeight: formData.batchYear === yearStr ? '700' : '500', fontSize: 14 }}>
                      {yearStr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* DOB Calendar Picker Modal (Mobile) */}
      <Modal visible={dobModalVisible} transparent animationType="slide" onRequestClose={() => setDobModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDobModalVisible(false)}>
          <View style={[styles.modalContent, { paddingBottom: 24 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date of Birth 🎂</Text>
              <TouchableOpacity onPress={() => setDobModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16, alignItems: 'center' }}>
              <TextInput
                style={[styles.input, { width: '100%', textAlign: 'center', fontSize: 18, fontWeight: '700', letterSpacing: 2 }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
                maxLength={10}
                value={formData.dateOfBirth}
                onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
              />
              <TouchableOpacity
                style={[styles.button, { width: '100%', marginTop: 16 }]}
                onPress={() => setDobModalVisible(false)}
              >
                <Text style={styles.buttonText}>Confirm Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.card,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    height: 4,
    gap: 8,
    marginBottom: 28,
  },
  progressStep: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
    backgroundColor: theme.border,
  },
  stepActive: {
    backgroundColor: theme.primary,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.background,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '600',
    marginTop: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  form: {
    marginBottom: 28,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.primary,
  },
  button: {
    backgroundColor: theme.primary,
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: theme.card,
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.primary,
  },
  modalListItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  selectedModalListItem: {
    backgroundColor: '#F0F9FF',
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  modalListItemText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '500',
  },
  selectedModalListItemText: {
    color: theme.primary,
    fontWeight: '700',
  },
});

export default ProfileSetupScreen;
