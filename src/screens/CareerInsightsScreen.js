import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import {
  getRecommendedAlumni,
  getRecommendedJobs,
  getCareerInsights,
  endorseSkill
} from '../services/recommendationService';

export default function CareerInsightsScreen({ navigation }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('match');
  const [loading, setLoading] = useState(true);
  const [alumniMatches, setAlumniMatches] = useState([]);
  const [jobMatches, setJobMatches] = useState([]);
  const [insights, setInsights] = useState(null);
  const [endorsedSkills, setEndorsedSkills] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [alumniRes, jobsRes, insightsRes] = await Promise.all([
        getRecommendedAlumni(),
        getRecommendedJobs(),
        getCareerInsights()
      ]);
      setAlumniMatches(alumniRes);
      setJobMatches(jobsRes);
      setInsights(insightsRes);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndorse = async (userId, skillName, alumniName) => {
    try {
      await endorseSkill(userId, skillName);
      setEndorsedSkills(prev => ({ ...prev, [`${userId}_${skillName}`]: true }));
      Alert.alert('Skill Endorsed!', `You endorsed ${alumniName} for ${skillName}.`);
    } catch (err) {
      Alert.alert('Endorsement Failed', 'Could not submit skill endorsement.');
    }
  };

  const renderAlumniCard = ({ item }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{(item.name || 'A').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.name}</Text>
            {item.verified && <Ionicons name="checkmark-circle" size={16} color="#002144" />}
          </View>
          <Text style={[styles.cardSubTitle, { color: theme.subtext }]}>{item.designation || 'Alumnus'} {item.company ? `at ${item.company}` : ''}</Text>
          <Text style={[styles.branchText, { color: '#002144' }]}>{item.branch || 'RV College of Engineering'} • Batch {item.batch || '2022'}</Text>
        </View>

        <View style={styles.matchBadge}>
          <Ionicons name="sparkles" size={12} color="#FFFFFF" />
          <Text style={styles.matchBadgeText}>{item.matchScore}% Match</Text>
        </View>
      </View>

      <View style={styles.reasonsContainer}>
        {(item.matchReasons || []).map((reason, i) => (
          <View key={i} style={styles.reasonPill}>
            <Text style={styles.reasonText}>✓ {reason}</Text>
          </View>
        ))}
      </View>

      <View style={styles.skillsSection}>
        <Text style={[styles.skillsLabel, { color: theme.subtext }]}>Top Skills:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {(item.skills || ['System Design', 'React Native', 'Data Science']).map((skill, idx) => {
            const isEndorsed = endorsedSkills[`${item._id}_${skill}`];
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.skillChip, isEndorsed && { backgroundColor: '#E0F2FE', borderColor: '#0284C7' }]}
                onPress={() => handleEndorse(item._id, skill, item.name)}
              >
                <Text style={[styles.skillChipText, isEndorsed && { color: '#0369A1' }]}>
                  {skill} {isEndorsed ? '👍 (1)' : '+ Endorse'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={styles.connectButton}
        onPress={() => navigation.navigate('Chat', { recipient: item })}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
        <Text style={styles.connectButtonText}>Connect & Chat</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>AI Smart Match & Insights</Text>
          <Text style={[styles.headerSubTitle, { color: theme.subtext }]}>Personalized Career Analytics for RV Alumni</Text>
        </View>
        <TouchableOpacity onPress={loadData}>
          <Ionicons name="refresh-outline" size={22} color="#002144" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'match' && styles.tabActive]} onPress={() => setActiveTab('match')}>
          <Ionicons name="sparkles-outline" size={16} color={activeTab === 'match' ? '#002144' : theme.subtext} />
          <Text style={[styles.tabText, activeTab === 'match' && styles.tabTextActive]}>AI Match</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'salary' && styles.tabActive]} onPress={() => setActiveTab('salary')}>
          <Ionicons name="cash-outline" size={16} color={activeTab === 'salary' ? '#002144' : theme.subtext} />
          <Text style={[styles.tabText, activeTab === 'salary' && styles.tabTextActive]}>Salary Metrics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'hubs' && styles.tabActive]} onPress={() => setActiveTab('hubs')}>
          <Ionicons name="location-outline" size={16} color={activeTab === 'hubs' ? '#002144' : theme.subtext} />
          <Text style={[styles.tabText, activeTab === 'hubs' && styles.tabTextActive]}>Alumni Hubs</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#002144" />
          <Text style={{ marginTop: 10, color: theme.subtext }}>Analyzing Alumni Skills & Career Signals...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

          {/* TAB 1: AI MATCH */}
          {activeTab === 'match' && (
            <View>
              <View style={styles.heroBanner}>
                <Ionicons name="aperture" size={28} color="#FFFFFF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>AI Alumni & Mentor Match</Text>
                  <Text style={styles.heroSubText}>Based on your RV branch, skill tags, and career trajectory</Text>
                </View>
              </View>

              <Text style={[styles.sectionHeading, { color: theme.text }]}>Recommended Mentors & Connections</Text>
              {alumniMatches.map((item, index) => (
                <View key={item._id || index}>
                  {renderAlumniCard({ item })}
                </View>
              ))}

              <Text style={[styles.sectionHeading, { color: theme.text, marginTop: 24 }]}>Smart Job & Internship Recommendations</Text>
              {jobMatches.map((job, idx) => (
                <View key={job._id || idx} style={[styles.jobCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View>
                      <Text style={[styles.jobTitle, { color: theme.text }]}>{job.title}</Text>
                      <Text style={[styles.jobCompany, { color: theme.subtext }]}>{job.company} • {job.location || 'Bengaluru'}</Text>
                    </View>
                    <View style={styles.jobMatchBadge}>
                      <Text style={styles.jobMatchText}>{job.matchPercentage}% Skill Match</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <TouchableOpacity style={styles.applyBtn} onPress={() => Alert.alert('Applied!', `Application submitted to ${job.company}.`)}>
                      <Text style={styles.applyBtnText}>Instant Apply</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.applyBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => navigation.navigate('Jobs')}>
                      <Text style={[styles.applyBtnText, { color: '#002144' }]}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 2: SALARY & CAREER BENCHMARKS */}
          {activeTab === 'salary' && insights && (
            <View>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>Salary Benchmarks by RV Department</Text>
              {(insights.salaryBenchmarks || []).map((b, i) => (
                <View key={i} style={[styles.benchmarkCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.branchTitle, { color: theme.text }]}>{b.branch}</Text>
                  <View style={styles.benchmarkRow}>
                    <View>
                      <Text style={styles.statLabel}>Average Package</Text>
                      <Text style={[styles.statValue, { color: '#059669' }]}>{b.avgPackage}</Text>
                    </View>
                    <View>
                      <Text style={styles.statLabel}>Highest Package</Text>
                      <Text style={[styles.statValue, { color: '#2563EB' }]}>{b.maxPackage}</Text>
                    </View>
                  </View>
                  <Text style={[styles.topRoleText, { color: theme.subtext }]}>Top Hiring Role: <Text style={{ color: theme.text, fontWeight: '700' }}>{b.topRole}</Text></Text>
                </View>
              ))}

              <Text style={[styles.sectionHeading, { color: theme.text, marginTop: 24 }]}>In-Demand Skills for 2026</Text>
              {(insights.inDemandSkills || []).map((skill, i) => (
                <View key={i} style={[styles.skillRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.skillName, { color: theme.text }]}>{skill.name}</Text>
                    <Text style={styles.skillGrowth}>Demand Growth: {skill.growth}</Text>
                  </View>
                  <View style={styles.demandScoreBadge}>
                    <Text style={styles.demandScoreText}>{skill.demandScore}/100</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 3: ALUMNI HUBS & TOP COMPANIES */}
          {activeTab === 'hubs' && insights && (
            <View>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>Top Companies Employing RV Alumni</Text>
              <View style={styles.companyGrid}>
                {(insights.topCompanies || []).map((c, i) => (
                  <View key={i} style={[styles.companyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Ionicons name={c.logo} size={28} color="#002144" />
                    <Text style={[styles.companyName, { color: theme.text }]}>{c.name}</Text>
                    <Text style={styles.alumniCount}>{c.alumniCount}+ Alumni</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.sectionHeading, { color: theme.text, marginTop: 24 }]}>Global RV Alumni Location Hubs</Text>
              {(insights.locationHubs || []).map((hub, i) => (
                <View key={i} style={[styles.hubRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Ionicons name="location-sharp" size={20} color="#EF4444" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.hubCity, { color: theme.text }]}>{hub.city}</Text>
                    <Text style={styles.hubCount}>{hub.count} Alumni Networked</Text>
                  </View>
                  <Text style={styles.hubPct}>{hub.percentage}%</Text>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubTitle: { fontSize: 11 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, backgroundColor: '#FFFFFF' },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: '#002144' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#002144', fontWeight: '800' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#002144',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20
  },
  heroTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  heroSubText: { color: '#93C5FD', fontSize: 12, marginTop: 2 },
  sectionHeading: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#002144',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 18 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSubTitle: { fontSize: 13, marginTop: 1 },
  branchText: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20
  },
  matchBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  reasonsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  reasonPill: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  reasonText: { fontSize: 11, color: '#334155', fontWeight: '600' },
  skillsSection: { marginTop: 12 },
  skillsLabel: { fontSize: 12, fontWeight: '600' },
  skillChip: { borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  skillChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#002144',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14
  },
  connectButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  jobCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  jobTitle: { fontSize: 15, fontWeight: '700' },
  jobCompany: { fontSize: 12, marginTop: 2 },
  jobMatchBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  jobMatchText: { color: '#1E40AF', fontSize: 11, fontWeight: '700' },
  applyBtn: { flex: 1, backgroundColor: '#002144', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  applyBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  benchmarkCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
  branchTitle: { fontSize: 15, fontWeight: '800' },
  benchmarkRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  statLabel: { fontSize: 11, color: '#64748B' },
  statValue: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  topRoleText: { fontSize: 12, marginTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 },
  skillRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  skillName: { fontSize: 14, fontWeight: '700' },
  skillGrowth: { fontSize: 12, color: '#059669', fontWeight: '700', marginTop: 2 },
  demandScoreBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  demandScoreText: { color: '#B45309', fontWeight: '800', fontSize: 12 },
  companyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  companyCard: { flex: 1, minWidth: '45%', padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 6 },
  companyName: { fontSize: 14, fontWeight: '700' },
  alumniCount: { fontSize: 12, color: '#059669', fontWeight: '700' },
  hubRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  hubCity: { fontSize: 14, fontWeight: '700' },
  hubCount: { fontSize: 12, color: '#64748B' },
  hubPct: { fontSize: 16, fontWeight: '800', color: '#002144' }
});
