import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, useWindowDimensions, ScrollView, StatusBar } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const DemoCarouselScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const { width } = useWindowDimensions();
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef(null);

  const slides = [
    {
      title: 'Institutional Ecosystem',
      description: 'Find members and access tailored opportunities across the entire RV Educational Institutions network.',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&h=400&q=80'
    },
    {
      title: 'Verified Profiles',
      description: 'Every profile is authenticated by institutional administration, ensuring a trusted alumni space.',
      image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&h=400&q=80'
    },
    {
      title: 'Professional Growth',
      description: 'Explore the job board, request direct internal referrals, and find peer career mentors.',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&h=400&q=80'
    },
    {
      title: 'Alumni Engagement',
      description: 'Join local reunions, attend professional webinars, and register for campus events.',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&h=400&q=80'
    }
  ];

  const handleScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveSlide(Math.round(index));
  };

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      scrollViewRef.current.scrollTo({
        x: (activeSlide + 1) * width,
        animated: true
      });
      setActiveSlide(activeSlide + 1);
    } else {
      navigation.navigate('SelectInstitution');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Welcome');
            }
          }} 
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={26} color="#002144" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Platform Tour</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => (
          <View key={index} style={[styles.slide, { width: width }]}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: slide.image }} style={[styles.slideImage, { width: width - 48, height: width * 0.7 }]} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideDescription}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View 
              key={index} 
              style={[styles.dot, activeSlide === index && styles.activeDot]} 
            />
          ))}
        </View>

        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {activeSlide === slides.length - 1 ? 'Start Experience' : 'Next'}
          </Text>
          <Ionicons 
            name={activeSlide === slides.length - 1 ? 'rocket-outline' : 'arrow-forward'} 
            size={18} 
            color="#FFFFFF" 
            style={{ marginLeft: 6 }}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.primary,
  },
  slide: {
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 32,
  },
  slideImage: {
    resizeMode: 'cover',
    backgroundColor: '#F1F5F9',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.primary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  slideDescription: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.border,
  },
  activeDot: {
    backgroundColor: theme.primary,
    width: 24,
  },
  primaryButton: {
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
});

export default DemoCarouselScreen;
