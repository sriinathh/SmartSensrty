import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, StatusBar, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 44 : 44;

export default function ServicesScreen({ navigation }) {
  const fade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const services = [
    { id: 's1', title: 'Women Safety', desc: 'Discreet, rapid response with live location and voice recording.', icon: 'account-heart', color: '#6C9EFF' },
    { id: 's2', title: 'Elder Care', desc: 'Fall detection, scheduled check-ins, and caregiver alerts.', icon: 'human-cane', color: '#A78BFA' },
    { id: 's3', title: 'Accident Detection', desc: 'Automatic crash detection & vehicle assistance coordination.', icon: 'car-emergency', color: '#FFA96C' },
    { id: 's4', title: 'Medical Response', desc: 'Connect to local medical teams, share vitals and history.', icon: 'medical-bag', color: '#4BCFA6' },
    { id: 's5', title: 'Fire & Disaster', desc: 'Alert networks, evacuation guidance and live incident feeds.', icon: 'fire', color: '#FF9AA2' },
    { id: 's6', title: 'General Emergency', desc: 'Police and public services integration for broad support.', icon: 'alarm-light', color: '#A0D8EF' },
  ];

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6FBFB" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY }] }}>
          {/* Header with back button */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="arrow-left" size={24} color="#0B3340" />
            </TouchableOpacity>
            <Text style={styles.title}>Smart Sentry Services</Text>
            <View style={{ width: 40 }} />
          </View>
          <Text style={styles.lead}>A unified suite to keep communities safe, connected, and informed.</Text>

          <View style={styles.cardsWrap}>
            {services.map(s => (
              <Animated.View key={s.id} style={styles.serviceCard}>
                <View style={[styles.serviceLeft, { backgroundColor: s.color + '20' }]}>
                  <Icon name={s.icon} size={24} color={s.color} />
                </View>
                <View style={styles.serviceRight}>
                  <Text style={styles.serviceTitle}>{s.title}</Text>
                  <Text style={styles.serviceDesc}>{s.desc}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          <Text style={styles.darkTitle}>How it works</Text>
          <Text style={styles.paragraph}>Smart Sentry integrates device sensors, verified responders and regional emergency services to ensure rapid action with minimal false alarms. Long-press to activate SOS, and your situation is shared with responders, nearby help centers and your trusted contacts.</Text>

          <TouchableOpacity style={styles.cta} onPress={() => navigation.goBack()}>
            <Text style={styles.ctaText}>Back to App</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6FBFB' },
  container: { padding: 20, paddingTop: STATUSBAR_HEIGHT + 16, paddingBottom: 48 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: { padding: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#0B3340' },
  lead: { color: '#5F6E71', marginBottom: 16 },
  cardsWrap: { marginVertical: 6 },
  serviceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', marginBottom: 10, elevation: 2, alignItems: 'center' },
  serviceLeft: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  serviceRight: { flex: 1 },
  serviceTitle: { fontWeight: '700', color: '#0B3340' },
  serviceDesc: { color: '#637578', marginTop: 6, fontSize: 13 },
  darkTitle: { marginTop: 16, fontWeight: '800', color: '#0B3340', fontSize: 18 },
  paragraph: { color: '#5F6E71', marginTop: 8, lineHeight: 20 },
  cta: { marginTop: 20, backgroundColor: '#0B3B36', padding: 12, borderRadius: 12, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
});
