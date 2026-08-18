import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const INITIAL_ALUMNI_MASTER = [];

export default function AdminPlacementDetailsScreen({ navigation, route }) {
  const { companyName } = route.params || { companyName: 'Company' };
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const getInitialAlumni = () => {
    if (!companyName) return [];
    const keyword = companyName.split(' ')[0].toLowerCase();
    return INITIAL_ALUMNI_MASTER.filter(a => a.title.toLowerCase().includes(keyword));
  };

  const [alumniList, setAlumniList] = useState(getInitialAlumni());

  const toggleConnect = (id) => {
    setAlumniList(alumniList.map(item => {
      if (item.id === id) {
        if (!item.connected) {
          Alert.alert('Connection Sent', `A connection request has been sent to ${item.name}.`);
        }
        return { ...item, connected: !item.connected };
      }
      return item;
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('AdminMain');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#003366" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>{companyName} Alumni</Text>
          <Text style={styles.headerSub}>Placement Tool Directory</Text>
        </View>
      </View>

      <FlatList
        data={alumniList}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.alumniRowCard}>
            <View style={styles.rowAvatar}>
              <Ionicons name="person" size={22} color="#64748B" />
            </View>
            <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
              <Text style={styles.alumniRowName}>{item.name} <Text style={styles.alumniRowDegree}>{item.degree}</Text></Text>
              <Text style={styles.alumniRowTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.alumniRowLocation}>{item.location}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.connectBtn, item.connected && styles.connectBtnActive]}
              onPress={() => toggleConnect(item.id)}
            >
              <Text style={[styles.connectBtnText, item.connected && styles.connectBtnActiveText]}>
                {item.connected ? 'Connected' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 40, color: theme.textSecondary, fontSize: 16 }}>
            No alumni found for this company.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.primary,
  },
  headerSub: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  alumniRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  rowAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  alumniRowName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  alumniRowDegree: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  alumniRowTitle: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
    lineHeight: 18,
  },
  alumniRowLocation: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
  },
  connectBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectBtnActive: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: theme.border,
  },
  connectBtnText: {
    color: theme.card,
    fontSize: 13,
    fontWeight: '700',
  },
  connectBtnActiveText: {
    color: theme.textSecondary,
  },
});
