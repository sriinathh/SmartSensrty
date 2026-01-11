import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 44 : 44;

export default function LandingScreen({ navigation }) {
  // Animation values
  const fadeMain = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;
  const scaleShield = useRef(new Animated.Value(0.3)).current;
  const rotateShield = useRef(new Animated.Value(0)).current;
  const pulseShield = useRef(new Animated.Value(1)).current;
  const iconsFade = useRef(new Animated.Value(0)).current;
  const iconsSlide = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  
  // Floating particles
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shield entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleShield, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateShield, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Main content fade in
      Animated.parallel([
        Animated.timing(fadeMain, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideUp, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Icons stagger in
      Animated.parallel([
        Animated.timing(iconsFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(iconsSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Button pop
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for shield
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseShield, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseShield, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Glow animation
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.7,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    // Floating particles
    const floatParticle = (particle, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(particle, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(particle, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    floatParticle(particle1, 0);
    floatParticle(particle2, 1000);
    floatParticle(particle3, 2000);

    return () => {
      pulseLoop.stop();
      glowLoop.stop();
    };
  }, []);

  const handleStart = () => navigation.navigate('Login');
  const handleLearnMore = () => navigation.navigate('Services');

  const shieldRotation = rotateShield.interpolate({
    inputRange: [0, 1],
    outputRange: ['-20deg', '0deg'],
  });

  const SERVICES = [
    { icon: 'shield-account', label: 'Women Safety', color: '#6C9EFF' },
    { icon: 'account-heart', label: 'Elder Care', color: '#A78BFA' },
    { icon: 'car-emergency', label: 'Accident', color: '#FFA96C' },
    { icon: 'hospital-box', label: 'Medical', color: '#4BCFA6' },
    { icon: 'fire-alert', label: 'Fire Alert', color: '#FF9AA2' },
    { icon: 'police-badge', label: 'Emergency', color: '#A0D8EF' },
  ];

  return (
    <LinearGradient
      colors={['#0A2E38', '#0F4D5F', '#18716A', '#1F8B7E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Floating Particles */}
      <Animated.View
        style={[
          styles.particle,
          styles.particle1,
          {
            opacity: particle1.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.6, 0],
            }),
            transform: [
              {
                translateY: particle1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -100],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.particle,
          styles.particle2,
          {
            opacity: particle2.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.4, 0],
            }),
            transform: [
              {
                translateY: particle2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -120],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.particle,
          styles.particle3,
          {
            opacity: particle3.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.5, 0],
            }),
            transform: [
              {
                translateY: particle3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -80],
                }),
              },
            ],
          },
        ]}
      />

      <View style={styles.container}>
        {/* Animated Shield Logo */}
        <View style={styles.logoSection}>
          <Animated.View
            style={[
              styles.shieldGlow,
              {
                opacity: glowOpacity,
                transform: [{ scale: pulseShield }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.shieldContainer,
              {
                transform: [
                  { scale: Animated.multiply(scaleShield, pulseShield) },
                  { rotate: shieldRotation },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#4BCFA6', '#18716A', '#0F4D5F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shieldBg}
            >
              <Icon name="shield-check" size={60} color="#fff" />
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Main Title */}
        <Animated.View
          style={[
            styles.headerSection,
            {
              opacity: fadeMain,
              transform: [{ translateY: slideUp }],
            },
          ]}
        >
          <Text style={styles.appName}>Smart Sentry</Text>
          <Text style={styles.tagline}>Your Intelligent Safety Companion</Text>
          <View style={styles.badge}>
            <Icon name="check-decagram" size={14} color="#4BCFA6" />
            <Text style={styles.badgeText}>Trusted by 10K+ Users</Text>
          </View>
        </Animated.View>

        {/* Service Icons Grid */}
        <Animated.View
          style={[
            styles.servicesGrid,
            {
              opacity: iconsFade,
              transform: [{ translateY: iconsSlide }],
            },
          ]}
        >
          {SERVICES.map((service, index) => (
            <Animated.View
              key={service.label}
              style={[
                styles.serviceItem,
                {
                  opacity: iconsFade,
                  transform: [
                    {
                      translateY: iconsSlide.interpolate({
                        inputRange: [0, 30],
                        outputRange: [0, 30 + index * 5],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.serviceIconBg, { backgroundColor: service.color + '25' }]}>
                <Icon name={service.icon} size={26} color={service.color} />
              </View>
              <Text style={styles.serviceLabel}>{service.label}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Bottom Section */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              transform: [{ scale: buttonScale }],
              opacity: buttonScale,
            },
          ]}
        >
          <Text style={styles.subtitle}>
            <Icon name="shield-star" size={14} color="#A8E6CF" /> Protecting lives beyond emergencies
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleStart}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#ffffff', '#F0F8F7']}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Get Started</Text>
              <Icon name="arrow-right-circle" size={22} color="#0B3B36" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleLearnMore}
            activeOpacity={0.8}
          >
            <Icon name="information-outline" size={18} color="#A8E6CF" />
            <Text style={styles.secondaryBtnText}>Learn more about our services</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom Wave Decoration */}
        <View style={styles.waveDecoration}>
          <View style={styles.wave1} />
          <View style={styles.wave2} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: STATUSBAR_HEIGHT + 20,
    justifyContent: 'space-between',
  },
  // Floating Particles
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4BCFA6',
  },
  particle1: {
    top: height * 0.3,
    left: width * 0.2,
  },
  particle2: {
    top: height * 0.5,
    right: width * 0.15,
    backgroundColor: '#6C9EFF',
  },
  particle3: {
    top: height * 0.4,
    left: width * 0.7,
    backgroundColor: '#A78BFA',
  },
  // Shield Logo
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  shieldGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#4BCFA6',
  },
  shieldContainer: {
    width: 110,
    height: 110,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#4BCFA6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  shieldBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Header
  headerSection: {
    alignItems: 'center',
    marginTop: -10,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    color: '#C8FFF3',
    marginTop: 8,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  badgeText: {
    color: '#D7F6F0',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -4,
  },
  serviceItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
  },
  serviceIconBg: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceLabel: {
    color: '#D7F6F0',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Bottom Section
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  subtitle: {
    color: '#A8E6CF',
    marginBottom: 20,
    fontSize: 13,
    fontWeight: '500',
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  primaryBtnText: {
    color: '#0B3B36',
    fontWeight: '700',
    fontSize: 17,
    marginRight: 10,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: '#A8E6CF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  // Wave Decoration
  waveDecoration: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    overflow: 'hidden',
  },
  wave1: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: width + 100,
    height: 100,
    backgroundColor: 'rgba(75, 207, 166, 0.08)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  wave2: {
    position: 'absolute',
    bottom: -70,
    left: -30,
    width: width + 60,
    height: 100,
    backgroundColor: 'rgba(75, 207, 166, 0.05)',
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
  },
});
