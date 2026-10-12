import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, useWindowDimensions, StatusBar } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const slides = [
  {
    id: '1',
    title: 'Stay Connected',
    highlight: 'Institution Community',
    subtitle: 'Reconnect with your classmates, batchmates, and professors globally.',
    icon: 'people-outline',
  },
  {
    id: '2',
    title: 'Find Opportunities',
    highlight: 'Career Growth',
    subtitle: 'Explore job openings, ask for referrals, and find mentors in your field.',
    icon: 'briefcase-outline',
  },
  {
    id: '3',
    title: 'Give Back',
    highlight: 'Support Alma Mater',
    subtitle: 'Mentor current students, deliver guest lectures, or support campus drives.',
    icon: 'school-outline',
  }
];

const OnboardingScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const renderSlide = ({ item }) => {
    return (
      <View style={[styles.slide, { width: width }]}>
        <View style={styles.imageContainer}>
          <View style={styles.circle}>
            <Ionicons name={item.icon} size={84} color="#FF432A" />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.highlightRow}>
            <Text style={styles.subtitlePrefix}>Be a part of </Text>
            <Text style={styles.highlight}>{item.highlight}</Text>
          </View>
          <Text style={styles.description}>{item.subtitle}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={handleNext}
        >
          <Ionicons 
            name={currentIndex === slides.length - 1 ? 'checkmark' : 'arrow-forward'} 
            size={28} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.card,
  },
  header: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  skipText: {
    color: theme.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  imageContainer: {
    marginBottom: 48,
  },
  circle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  subtitlePrefix: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  highlight: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 20,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  activeDot: {
    backgroundColor: theme.primary,
    width: 24,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default OnboardingScreen;
