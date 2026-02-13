import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    title: 'Women Safety',
    subtitle: 'Stay safe in every situation',
    content: 'Harassment, stalking, and unsafe travel are real threats. Smart Sentry\'s SOS feature with live location tracking and instant call alerts to trusted contacts ensures help is just a tap away.',
    icon: 'shield-woman',
    color: '#FF6B9D',
    videoId: 'women_safety',
    videoThumbnail: '🎥',
  },
  {
    id: '2',
    title: 'Accident Scenarios',
    subtitle: 'Quick response in emergencies',
    content: 'Road accidents or unconscious victims need immediate attention. Auto SOS detects impacts, shares your location, and makes emergency calls automatically.',
    icon: 'car-emergency',
    color: '#4BCFA6',
    videoId: 'accident_response',
    videoThumbnail: '🎬',
  },
  {
    id: '3',
    title: 'Medical Emergencies',
    subtitle: 'Health comes first',
    content: 'Sudden health issues or elders living alone require fast action. SOS medical alerts notify caretakers and emergency services with your precise location.',
    icon: 'medical-bag',
    color: '#FF9500',
    videoId: 'medical_sos',
    videoThumbnail: '🏥',
  },
  {
    id: '4',
    title: 'Disasters',
    subtitle: 'Prepared for the unexpected',
    content: 'Fire, floods, or natural disasters strike without warning. Emergency calls and location sharing connect you to rescue services instantly.',
    icon: 'weather-hurricane',
    color: '#007AFF',
    videoId: 'disaster_response',
    videoThumbnail: '⚠️',
  },
  {
    id: 'final',
    title: 'Your Safety Matters',
    subtitle: 'Be Strong, Stay Aware',
    content: 'Be strong, stay aware, and never feel alone. This app is here to protect and support you anytime, anywhere.',
    videoId: 'QF1WL2pnzZk',
    isFinalSlide: true,
  },
];

const tutorialsData = [
  {
    id: 't1',
    title: 'How to Trigger SOS',
    description: 'Learn 3 ways to trigger an emergency',
    icon: 'alert-circle',
    tips: [
      '🟥 Long press the SOS button (3 seconds)',
      '🎙️ Say "SOS" command (if enabled)',
      '📱 Use shake gesture (2 rapid shakes)',
      '🚨 Can toggle in Settings',
    ],
  },
  {
    id: 't2',
    title: 'Add Trusted Contacts',
    description: 'Setup your emergency network',
    icon: 'contacts',
    tips: [
      '👥 Add 3-5 trusted people',
      '📞 Include family & friends',
      '⚡ Contacts get instant alerts',
      '📍 Share live location with them',
    ],
  },
  {
    id: 't3',
    title: 'Update Medical Profile',
    description: 'Store critical health info',
    icon: 'hospital-box',
    tips: [
      '🩸 Add your blood group',
      '⚠️ List allergies & medications',
      '🏥 Add medical conditions',
      '📝 Emergency contact details',
    ],
  },
  {
    id: 't4',
    title: 'Enable Location Tracking',
    description: 'Make sure location is shared',
    icon: 'map-marker',
    tips: [
      '✅ Turn on GPS in Settings',
      '✅ Allow app permission for location',
      '📡 Works in online & offline modes',
      '🗺️ Shares with emergency contacts',
    ],
  },
];

const safetyData = [
  {
    id: 's1',
    category: 'Travel Safety',
    icon: 'car',
    color: '#FF6B9D',
    tips: [
      '✅ Share your route with trusted contacts',
      '✅ Activate location sharing before travel',
      '✅ Keep your phone charged (80%+)',
      '✅ Avoid traveling alone at night',
      '✅ Trust your instincts - call SOS if unsure',
      '✅ Update contacts about your status',
    ],
  },
  {
    id: 's2',
    category: 'Home Safety',
    icon: 'home',
    color: '#4BCFA6',
    tips: [
      '✅ Lock doors & windows before sleeping',
      '✅ Keep phone near you at night',
      '✅ Enable security alarms if available',
      '✅ Know emergency exit routes',
      '✅ Keep emergency numbers handy',
      '✅ Inform someone about your daily routine',
    ],
  },
  {
    id: 's3',
    category: 'Medical Safety',
    icon: 'medical-bag',
    color: '#FF9500',
    tips: [
      '✅ Update blood group in app',
      '✅ List all allergies & medications',
      '✅ Include medical conditions',
      '✅ Wear medical ID if needed',
      '✅ Keep medicines accessible',
      '✅ Share profile with caretakers',
    ],
  },
  {
    id: 's4',
    category: 'Digital Safety',
    icon: 'shield',
    color: '#007AFF',
    tips: [
      '✅ Use strong passwords (mix of letters/numbers)',
      '✅ Enable two-factor authentication',
      '✅ Don\'t share SOS details publicly',
      '✅ Keep app updated to latest version',
      '✅ Review location sharing periodically',
      '✅ Report suspicious activity',
    ],
  },
  {
    id: 's5',
    category: 'Workplace Safety',
    icon: 'briefcase',
    color: '#8B5CF6',
    tips: [
      '✅ Know your workplace layout & exits',
      '✅ Inform office about your schedule',
      '✅ Use buddy system for late hours',
      '✅ Keep emergency contacts at desk',
      '✅ Report unsafe situations immediately',
      '✅ Use parking areas with good lighting',
    ],
  },
  {
    id: 's6',
    category: 'Social Event Safety',
    icon: 'party-popper',
    color: '#EC4899',
    tips: [
      '✅ Tell someone where you\'re going',
      '✅ Keep friends informed of your status',
      '✅ Stay with a trusted buddy',
      '✅ Don\'t accept drinks from strangers',
      '✅ Keep your phone accessible',
      '✅ Have a safe plan to get home',
    ],
  },
];

// ============================================
// FINAL SLIDE COMPONENT - Modern Premium Design with YouTube
// ============================================

function FinalSlideComponent({ navigation, fadeAnim, slideAnim, onShowTutorials, onShowSafety }) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isVideoPlaying, setIsVideoPlaying] = useState(true); // Auto-play enabled
  const [videoReady, setVideoReady] = useState(false);

  const YOUTUBE_VIDEO_ID = 'QF1WL2pnzZk';

  useEffect(() => {
    // Scale animation - smooth entrance
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Glow pulse animation for decorative elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Soft pulse for button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleGetStarted = () => {
    navigation.navigate('Permissions');
  };

  const onStateChange = useCallback((state) => {
    if (state === 'playing') {
      setIsVideoPlaying(true);
    } else if (state === 'paused' || state === 'ended') {
      setIsVideoPlaying(false);
    }
  }, []);

  return (
    <View style={styles.finalSlideContainer}>
      {/* Teal → Green Gradient Background */}
      <LinearGradient
        colors={['#0D5B5B', '#0F6666', '#146B6B', '#197070', '#208080', '#2A9A9A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.finalGradientBg}
      >
        {/* Decorative Glowing Orbs - Premium Glassmorphism */}
        <Animated.View
          style={[
            styles.decorOrb,
            styles.decorOrb1,
            { opacity: Animated.add(0.12, Animated.multiply(glowAnim, 0.15)) },
          ]}
        />
        <Animated.View
          style={[
            styles.decorOrb,
            styles.decorOrb2,
            { opacity: Animated.add(0.08, Animated.multiply(glowAnim, 0.12)) },
          ]}
        />

        {/* Main Content */}
        <ScrollView
          contentContainerStyle={styles.finalScrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Section with Icon */}
          <Animated.View
            style={[
              styles.finalHeaderSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.finalShieldBadge}>
              <LinearGradient
                colors={['#4BCFA6', '#2DD4BF', '#1BC4B1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shieldGradient}
              >
                <Icon name="shield-heart" size={36} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.finalTitleText}>Your Safety Matters</Text>
            <Text style={styles.finalSubtitleText}>Be Strong, Stay Aware</Text>
          </Animated.View>

          {/* Premium Glassmorphism Video Card - Error 153 Fix */}
          <Animated.View
            style={[
              styles.videoCardContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.glassCard}>
              <View style={styles.videoPlayerWrapper}>
                <YoutubePlayer
                  height={220}
                  videoId={YOUTUBE_VIDEO_ID}
                  play={isVideoPlaying}
                  onChangeState={onStateChange}
                  onReady={() => {
                    setVideoReady(true);
                  }}
                  webViewProps={{
                    allowsInlineMediaPlayback: true,
                    mediaPlaybackRequiresUserAction: false,
                    androidLayerType: 'software', // Fix for Error 153
                    javaScriptEnabled: true,
                    domStorageEnabled: true,
                    mixedContentMode: 'always', // Allow all mixed content
                  }}
                  initialPlayerParams={{
                    preventFullScreen: true,
                    modestbranding: true,
                    rel: false,
                    showClosedCaptions: false,
                    controls: true,
                    autoplay: 1,
                  }}
                />
                {!videoReady && (
                  <View style={styles.videoLoadingOverlay}>
                    <ActivityIndicator size="large" color="#4BCFA6" />
                    <Text style={styles.loadingText}>Loading Protection Video...</Text>
                  </View>
                )}
              </View>
              
              {/* Video Info Bar */}
              <View style={styles.videoInfoBar}>
                <Icon name="play-circle-outline" size={18} color="#4BCFA6" />
                <Text style={styles.videoInfoText}>Women Safety Empowerment</Text>
                <View style={styles.videoBadge}>
                  <Text style={styles.videoBadgeText}>LIVE</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Safety Message - Premium Card */}
          <Animated.View
            style={[
              styles.safetyMessageCard,
              { opacity: fadeAnim },
            ]}
          >
            <LinearGradient
              colors={['rgba(75, 207, 166, 0.15)', 'rgba(45, 212, 191, 0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.messageGlassCard}
            >
              <Icon name="heart-multiple" size={28} color="#FF6B9D" style={styles.messageIcon} />
              <Text style={styles.safetyMessageText}>
                Be strong, stay aware,{'\n'}and never feel alone. This app{'\n'}protects you anytime, anywhere.
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Large Premium Get Started Button - With Pulse */}
          <Animated.View
            style={[
              styles.getStartedContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={handleGetStarted}
              activeOpacity={0.82}
            >
              <LinearGradient
                colors={['#4BCFA6', '#2DD4BF', '#14B8A6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.getStartedGradient}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
                <Icon name="arrow-right" size={22} color="#FFFFFF" style={styles.arrowIcon} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Bottom Equal Action Buttons - Matching Gradients */}
          <Animated.View
            style={[
              styles.bottomActionsContainer,
              { opacity: fadeAnim },
            ]}
          >
            {/* Tutorials Button */}
            <TouchableOpacity
              style={styles.actionButtonWrapper}
              onPress={onShowTutorials}
              activeOpacity={0.78}
            >
              <LinearGradient
                colors={['#4BCFA6', '#26A888']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionButtonGradient}
              >
                <Icon name="book-education" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Tutorials</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Safety Tips Button - Same Gradient */}
            <TouchableOpacity
              style={styles.actionButtonWrapper}
              onPress={onShowSafety}
              activeOpacity={0.78}
            >
              <LinearGradient
                colors={['#4BCFA6', '#26A888']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionButtonGradient}
              >
                <Icon name="shield-check" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Safety Tips</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Trust Badge - Enhanced */}
          <Animated.View style={[styles.trustBadgeContainer, { opacity: fadeAnim }]}>
            <View style={styles.trustBadgeInner}>
              <Icon name="heart" size={14} color="#FF6B9D" />
              <Text style={styles.trustBadgeText}>Trusted by women nationwide</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTutorials, setShowTutorials] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const animateContent = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    animateContent();
  }, [currentIndex, animateContent]);



  const handleScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex !== currentIndex) {
      setCurrentIndex(roundIndex);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      navigation.navigate('Permissions');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Permissions');
  };

  const handlePlayVideo = (videoId) => {
    setSelectedVideo(videoId);
    setShowVideo(true);
  };

  const handleTutorialPress = (tutorial) => {
    setSelectedTutorial(tutorial);
  };

  const renderSlide = (item, index) => {
    if (item.isFinalSlide) {
      return (
        <View key={item.id} style={styles.slide}>
          <FinalSlideComponent
            navigation={navigation}
            fadeAnim={fadeAnim}
            slideAnim={slideAnim}
            onShowTutorials={() => setShowTutorials(true)}
            onShowSafety={() => setShowSafety(true)}
          />
        </View>
      );
    }

    return (
      <View key={item.id} style={styles.slide}>
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[item.color, '#0F4D5F']}
            style={styles.iconContainer}
          >
            <Icon name={item.icon} size={80} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
          <Text style={styles.content}>{item.content}</Text>
          
          {/* Video Button */}
          <TouchableOpacity 
            style={styles.videoButton}
            onPress={() => handlePlayVideo(item.videoId)}
          >
            <Icon name="play-circle" size={20} color="#4BCFA6" />
            <Text style={styles.videoButtonText}>Watch Video Guide</Text>
            <Icon name="chevron-right" size={16} color="#4BCFA6" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <LinearGradient
        colors={['#0A2E38', '#0F4D5F', '#18716A', '#1F8B7E']}
        style={styles.background}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {onboardingData.map((item, index) => renderSlide(item, index))}
        </ScrollView>

        {/* Bottom Navigation & Info Buttons - Hidden on Final Slide */}
        {currentIndex !== onboardingData.length - 1 && (
          <View style={styles.footer}>
            {/* Quick Links */}
            <View style={styles.quickLinks}>
              <TouchableOpacity 
                style={styles.quickLink}
                onPress={() => setShowTutorials(true)}
              >
                <Icon name="book-open-variant" size={18} color="#4BCFA6" />
                <Text style={styles.quickLinkText}>Tutorials</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickLink}
                onPress={() => setShowSafety(true)}
              >
                <Icon name="shield-alert" size={18} color="#FF6B9D" />
                <Text style={styles.quickLinkText}>Safety Tips</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.indicatorContainer}>
              {onboardingData.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentIndex && styles.activeIndicator,
                  ]}
                />
              ))}
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                <Text style={styles.nextText}>Next</Text>
                <Icon name="chevron-right" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Tutorials Modal */}
      <Modal
        visible={showTutorials}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTutorials(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#0A2E38', '#0F4D5F']}
            style={styles.modalBackground}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📚 Quick Tutorials</Text>
              <TouchableOpacity onPress={() => setShowTutorials(false)}>
                <Icon name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={tutorialsData}
              keyExtractor={(item) => item.id}
              scrollEnabled={true}
              contentContainerStyle={styles.tutorialsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.tutorialCard}
                  onPress={() => handleTutorialPress(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.tutorialIconBox}>
                    <Icon name={item.icon} size={32} color="#4BCFA6" />
                  </View>
                  <View style={styles.tutorialContent}>
                    <Text style={styles.tutorialTitle}>{item.title}</Text>
                    <Text style={styles.tutorialDesc}>{item.description}</Text>
                  </View>
                  <Icon name="chevron-right" size={20} color="#4BCFA6" />
                </TouchableOpacity>
              )}
            />
          </LinearGradient>
        </View>
      </Modal>

      {/* Tutorial Details Modal */}
      {selectedTutorial && (
        <Modal
          visible={!!selectedTutorial}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedTutorial(null)}
        >
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#0A2E38', '#0F4D5F']}
              style={styles.modalBackground}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setSelectedTutorial(null)}>
                  <Icon name="chevron-left" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{selectedTutorial.title}</Text>
                <View style={styles.headerSpacer} />
              </View>

              <ScrollView 
                style={styles.tutorialDetails}
                contentContainerStyle={styles.tutorialDetailsContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.detailsIconBox}>
                  <Icon name={selectedTutorial.icon} size={48} color="#4BCFA6" />
                </View>
                
                <Text style={styles.detailsTitle}>{selectedTutorial.title}</Text>
                <Text style={styles.detailsDesc}>{selectedTutorial.description}</Text>

                <View style={styles.stepsList}>
                  {selectedTutorial.tips.map((tip, idx) => (
                    <View key={idx} style={styles.stepItem}>
                      <View style={styles.stepDot} />
                      <Text style={styles.stepText}>{tip}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity 
                  style={styles.gotItButton}
                  onPress={() => setSelectedTutorial(null)}
                >
                  <Text style={styles.gotItText}>Got it! 👍</Text>
                </TouchableOpacity>
              </ScrollView>
            </LinearGradient>
          </View>
        </Modal>
      )}

      {/* Safety Tips Modal */}
      <Modal
        visible={showSafety}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSafety(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#0A2E38', '#0F4D5F']}
            style={styles.modalBackground}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🛡️ Safety Precautions</Text>
              <TouchableOpacity onPress={() => setShowSafety(false)}>
                <Icon name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={safetyData}
              keyExtractor={(item) => item.id}
              scrollEnabled={true}
              contentContainerStyle={styles.safetyList}
              renderItem={({ item }) => (
                <View style={styles.safetyCard}>
                  <View style={[styles.safetyHeader, { borderLeftColor: item.color }]}>
                    <Icon name={item.icon} size={24} color={item.color} />
                    <Text style={styles.safetyCategory}>{item.category}</Text>
                  </View>
                  
                  <View style={styles.safetyTips}>
                    {item.tips.map((tip, idx) => (
                      <Text key={idx} style={styles.safetyTipText}>
                        {tip}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
            />
          </LinearGradient>
        </View>
      </Modal>

      {/* Video Player Modal */}
      <Modal
        visible={showVideo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVideo(false)}
      >
        <View style={styles.videoModalContainer}>
          <View style={styles.videoPlayerBox}>
            <View style={styles.videoPlaceholder}>
              <Icon name="play-circle-outline" size={80} color="#4BCFA6" />
              <Text style={styles.videoPlaceholderText}>
                {selectedVideo === 'women_safety' && 'Women Safety Video'}
                {selectedVideo === 'accident_response' && 'Accident Response Video'}
                {selectedVideo === 'medical_sos' && 'Medical SOS Video'}
                {selectedVideo === 'disaster_response' && 'Disaster Response Video'}
              </Text>
              <Text style={styles.videoSubText}>
                Video content coming soon
              </Text>
            </View>
            
            <View style={styles.videoControls}>
              <TouchableOpacity style={styles.playButton}>
                <Icon name="play" size={36} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.closeVideoButton}
                onPress={() => setShowVideo(false)}
              >
                <Icon name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#4BCFA6',
    textAlign: 'center',
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    color: '#E0F7FA',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  
  // Video Button
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(75, 207, 166, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#4BCFA6',
    marginTop: 20,
  },
  videoButtonText: {
    fontSize: 14,
    color: '#4BCFA6',
    marginHorizontal: 8,
    fontWeight: '600',
  },
  
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  quickLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    justifyContent: 'center',
  },
  quickLinkText: {
    fontSize: 12,
    color: '#4BCFA6',
    marginLeft: 6,
    fontWeight: '600',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    marginHorizontal: 6,
    opacity: 0.6,
  },
  activeIndicator: {
    width: 28,
    backgroundColor: '#4BCFA6',
    opacity: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    padding: 15,
  },
  skipText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  nextButton: {
    backgroundColor: '#4BCFA6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 5,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalBackground: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },

  // Tutorials Modal
  tutorialsList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tutorialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(75, 207, 166, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4BCFA6',
  },
  tutorialIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(75, 207, 166, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tutorialContent: {
    flex: 1,
  },
  tutorialTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tutorialDesc: {
    fontSize: 12,
    color: '#B0E0D8',
  },

  // Tutorial Details
  tutorialDetails: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tutorialDetailsContent: {
    paddingVertical: 20,
    paddingBottom: 30,
  },
  detailsIconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(75, 207, 166, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  detailsDesc: {
    fontSize: 14,
    color: '#B0E0D8',
    textAlign: 'center',
    marginBottom: 24,
  },
  stepsList: {
    marginVertical: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4BCFA6',
    marginTop: 6,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#E0F7FA',
    lineHeight: 20,
  },
  gotItButton: {
    backgroundColor: '#4BCFA6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  gotItText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F4D5F',
  },

  // Safety Modal
  safetyList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  safetyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderLeftWidth: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  safetyCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  safetyTips: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  safetyTipText: {
    fontSize: 13,
    color: '#B0E0D8',
    lineHeight: 20,
    marginBottom: 8,
  },

  // Video Modal
  videoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  videoPlayerBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 77, 95, 0.5)',
  },
  videoPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4BCFA6',
    marginTop: 16,
  },
  videoSubText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
  },
  videoControls: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'column',
    alignItems: 'center',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4BCFA6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  closeVideoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 28,
  },

  // ============================================
  // FINAL SLIDE STYLES - Modern Premium Design
  // ============================================

  finalSlideContainer: {
    width,
    flex: 1,
  },
  finalGradientBg: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  finalScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },

  // Decorative Orbs - Enhanced Glassmorphism
  decorOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  decorOrb1: {
    width: 200,
    height: 200,
    backgroundColor: '#4BCFA6',
    top: -80,
    right: -80,
    opacity: 0.18,
  },
  decorOrb2: {
    width: 160,
    height: 160,
    backgroundColor: '#26A888',
    bottom: 60,
    left: -70,
    opacity: 0.14,
  },

  // Header Section
  finalHeaderSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  finalShieldBadge: {
    marginBottom: 18,
    shadowColor: '#4BCFA6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  shieldGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4BCFA6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  finalTitleText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  finalSubtitleText: {
    fontSize: 17,
    color: '#B8F5E5',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Video Card - Glassmorphism
  videoCardContainer: {
    marginBottom: 20,
  },
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 14,
    backdropFilter: 'blur(10px)',
  },
  videoPlayerWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    margin: 10,
    backgroundColor: '#1a1a1a',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 91, 91, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#4BCFA6',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  videoInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoInfoText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 10,
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.2,
  },
  videoBadge: {
    backgroundColor: '#FF6B5B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  videoBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Safety Message Card - Enhanced
  safetyMessageCard: {
    marginBottom: 18,
  },
  messageGlassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(75, 207, 166, 0.25)',
    shadowColor: '#4BCFA6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  messageIcon: {
    marginRight: 14,
  },
  safetyMessageText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Get Started Button - Large & Premium
  getStartedContainer: {
    marginBottom: 18,
  },
  getStartedButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#4BCFA6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  getStartedGradient: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  getStartedText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  arrowIcon: {
    marginLeft: 4,
  },

  // Bottom Action Buttons - Equal Sized with Matching Gradient
  bottomActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12,
  },
  actionButtonWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4BCFA6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 10,
    letterSpacing: 0.4,
  },

  // Trust Badge - Enhanced
  trustBadgeContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  trustBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(75, 207, 166, 0.4)',
    shadowColor: '#4BCFA6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  trustBadgeText: {
    fontSize: 13,
    color: '#B8F5E5',
    marginLeft: 8,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
