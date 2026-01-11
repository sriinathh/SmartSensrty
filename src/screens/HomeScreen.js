import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Animated,
  StatusBar,
  Platform,
  Alert,
  Linking,
  NativeModules,
  NativeEventEmitter,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import EmergencyCard from '../components/EmergencyCard';
import ChatBot from '../components/ChatBot';
import { sosAPI, profileAPI, contactsAPI, authAPI } from '../services/api';

// Helper function to get time-based greeting with icons
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Good Morning', icon: 'weather-sunny', color: '#FFA96C' };
  if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', icon: 'white-balance-sunny', color: '#FFD93D' };
  if (hour >= 17 && hour < 21) return { text: 'Good Evening', icon: 'weather-sunset', color: '#FF9AA2' };
  return { text: 'Good Night', icon: 'weather-night', color: '#A78BFA' };
};

const DEFAULT_PROFILE = {
  name: 'User',
  email: 'user@example.com',
  phone: '+91 98765 43210',
  address: '123 Main Street, City',
  role: 'User',
  locationEnabled: true,
};

const DEFAULT_CONTACTS = [
  { id: 'c1', name: 'Priya Sharma', relation: 'Friend', phone: '+91 98765 43210' },
  { id: 'c2', name: 'Ravi Kumar', relation: 'Son', phone: '+91 91234 56789' },
];

const EMERGENCIES = [
  { key: 'women', title: 'Women Safety', desc: 'Discreet help for personal safety', color: '#6C9EFF', icon: 'account-heart' },
  { key: 'accident', title: 'Accident Emergency', desc: 'Vehicle & crash assistance', color: '#FFA96C', icon: 'car-emergency' },
  { key: 'medical', title: 'Medical Emergency', desc: 'Rapid medical response', color: '#4BCFA6', icon: 'medical-bag' },
  { key: 'elder', title: 'Elder Care SOS', desc: 'Support for seniors', color: '#A78BFA', icon: 'human-cane' },
  { key: 'fire', title: 'Fire / Disaster', desc: 'Fire & disaster assistance', color: '#FF9AA2', icon: 'fire' },
  { key: 'general', title: 'General Emergency', desc: 'Police / Broad help', color: '#A0D8EF', icon: 'alarm-light' },
];

export default function HomeScreen({ navigation }) {
  const [selected, setSelected] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [greetingData, setGreetingData] = useState(getGreeting());
  const [userName, setUserName] = useState('User');
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [actualLocationPermission, setActualLocationPermission] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [profile, setProfile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shakeDetectionActive, setShakeDetectionActive] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Initialize SOS module
  const { SosModule } = NativeModules;

  // Check location permissions
  const checkLocationPermissions = async () => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      
      const result = await request(permission);
      const hasPermission = result === RESULTS.GRANTED;
      setActualLocationPermission(hasPermission);
      return hasPermission;
    } catch (error) {
      console.error('Location permission check error:', error);
      setActualLocationPermission(false);
      return false;
    }
  };

  // Check if GPS is enabled
  const checkGpsStatus = async () => {
    try {
      // For simplicity, we'll consider GPS enabled if location permission is granted
      // In a production app, you'd check actual GPS status
      setGpsEnabled(actualLocationPermission);
      return actualLocationPermission;
    } catch (error) {
      console.error('GPS status check error:', error);
      setGpsEnabled(false);
      return false;
    }
  };

  // Initialize permissions and shake detection
  useEffect(() => {
    const initializeSos = async () => {
      try {
        // Check location permissions first
        const locationPermGranted = await checkLocationPermissions();
        await checkGpsStatus();

        // Request SOS permissions
        const permissionsGranted = await SosModule.requestPermissions();
        if (permissionsGranted && locationPermGranted) {
          // Start shake detection
          await SosModule.startShakeDetection();
          setShakeDetectionActive(true);
        } else {
          setShakeDetectionActive(false);
          if (!locationPermGranted) {
            Alert.alert(
              'Location Permission Required',
              'Location access is needed for emergency services. Please enable location permissions in settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Settings', onPress: () => Linking.openSettings() }
              ]
            );
          }
        }
      } catch (error) {
        console.error('SOS initialization error:', error);
        setShakeDetectionActive(false);
      }
    };

    initializeSos();

    // Cleanup shake detection on unmount
    return () => {
      if (shakeDetectionActive) {
        SosModule.stopShakeDetection();
      }
    };
  }, []);

  useEffect(() => {
    Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  // Fetch profile and contacts data
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          
          // Check location permissions and GPS
          await checkLocationPermissions();
          await checkGpsStatus();
          
          // Load auth token first
          await authAPI.loadToken();
          
          // Load from API
          const [apiProfile, apiContacts] = await Promise.all([
            profileAPI.get(),
            contactsAPI.getAll()
          ]);
          const formattedContacts = apiContacts.map(c => ({
            id: c._id,
            name: c.name,
            relation: c.relation,
            phone: c.phone,
          }));
          setProfile(apiProfile);
          setContacts(formattedContacts);
          setUserName(apiProfile.name || 'User');
          setLocationEnabled(apiProfile.locationEnabled !== false);
        } catch (error) {
          console.error('Error fetching data:', error);
          // Use defaults
          setProfile(DEFAULT_PROFILE);
          setContacts(DEFAULT_CONTACTS);
          setUserName('User');
          setLocationEnabled(true);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Check location permissions and GPS
      await checkLocationPermissions();
      await checkGpsStatus();

      // Load auth token first
      await authAPI.loadToken();
      
      // Load from API
      const [apiProfile, apiContacts] = await Promise.all([
        profileAPI.get(),
        contactsAPI.getAll()
      ]);
      const formattedContacts = apiContacts.map(c => ({
        id: c._id,
        name: c.name,
        relation: c.relation,
        phone: c.phone,
      }));
      setProfile(apiProfile);
      setContacts(formattedContacts);
      setUserName(apiProfile.name || 'User');
      setLocationEnabled(apiProfile.locationEnabled !== false);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0 && modalVisible && selected) {
      // After countdown, simulate sending
    }
    return () => clearTimeout(timer);
  }, [countdown, modalVisible, selected]);

  const handleLongPress = (item) => {
    setSelected(item);
    setCountdown(5);
    setModalVisible(true);
  };

  const openNearbyHelp = async () => {
    try {
      const latitude = 12.9716;
      const longitude = 77.5946;
      const hospitalsUrl = `https://www.google.com/maps/search/hospitals/@${latitude},${longitude},15z`;
      const policeUrl = `https://www.google.com/maps/search/police+stations/@${latitude},${longitude},15z`;
      
      await Linking.openURL(hospitalsUrl);
      setTimeout(() => {
        Linking.openURL(policeUrl);
      }, 2000);
    } catch (error) {
      console.error('Nearby Help Error:', error);
      Alert.alert('Error', 'Unable to open maps. Please check your internet connection.');
    }
  };

  const handlePress = async (item) => {
    try {
      console.log('🚨 SOS Triggered:', item.title);

      // Convert contacts to JSON string for native module
      const contactsJson = JSON.stringify(contacts.map(c => ({
        name: c.name,
        phone: c.phone,
        relation: c.relation
      })));

      // Start native SOS service with contacts
      await SosModule.startSos(item.key, contactsJson);

      // Log to API for history
      await sosAPI.logEmergency({
        type: item.key,
        location: 'Current location',
      });

      Alert.alert(
        'SOS Activated',
        `Emergency service "${item.title}" has been activated. Help is on the way!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('SOS Error:', error);
      Alert.alert(
        'SOS Error',
        'Unable to activate SOS. Please try again or call emergency services directly.',
        [{ text: 'Call 911', onPress: () => Linking.openURL('tel:911') }, { text: 'OK' }]
      );
    }
  };

  const renderEmergency = ({ item }) => (
    <EmergencyCard
      title={item.title}
      description={item.desc}
      color={item.color}
      icon={item.icon}
      onLongPress={() => handleLongPress(item)}
      onPress={() => handlePress(item)}
    />
  );

  const closeModal = () => {
    setModalVisible(false);
    setSelected(null);
    setCountdown(0);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6FBFB" />
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.header}>
              <View style={styles.greetingWrap}>
                <View style={styles.greetingRow}>
                  <Icon name={greetingData.icon} size={20} color={greetingData.color} />
                  <Text style={styles.greeting}>{greetingData.text},</Text>
                </View>
                <Text style={styles.userName}>{userName}</Text>
              </View>
              <TouchableOpacity 
                style={styles.avatar} 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('Profile')}
              >
                <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statusCard}>
              <View>
                <Text style={styles.statusTitle}>You are currently</Text>
                <Text style={styles.statusState}>Safe</Text>
              </View>
              <View style={styles.locationWrap}>
                <Text style={[styles.locationDot, { color: actualLocationPermission && gpsEnabled ? '#4BCFA6' : '#B0B0B0' }]}>●</Text>
                <Text style={styles.locationText}>
                  {actualLocationPermission && gpsEnabled ? 'Location & GPS enabled' : 
                   actualLocationPermission ? 'Location enabled, GPS off' : 'Location disabled'}
                </Text>
                <View style={styles.shakeWrap}>
                  <Text style={[styles.locationDot, { color: shakeDetectionActive ? '#4BCFA6' : '#B0B0B0' }]}>●</Text>
                  <Text style={styles.locationText}>{shakeDetectionActive ? 'Shake detection active' : 'Shake detection off'}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Emergency Services</Text>
            <FlatList
              data={EMERGENCIES}
              renderItem={renderEmergency}
              keyExtractor={i => i.key}
              numColumns={2}
              contentContainerStyle={{ paddingBottom: 8 }}
              scrollEnabled={false}
            />

            <View style={styles.extras}>
              <TouchableOpacity style={styles.extraCard} onPress={() => navigation.navigate('Contacts')}>
                <Text style={styles.extraTitle}>Trusted Contacts</Text>
                <Text style={styles.extraDesc}>{contacts.length} contacts — quick reach</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.extraCard} onPress={openNearbyHelp}>
                <Text style={styles.extraTitle}>Nearby Help Centers</Text>
                <Text style={styles.extraDesc}>Hospitals, Police stations</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomTips}>
              <Text style={styles.tipsTitle}>Safety Tips</Text>
              <Text style={styles.tip}>• Keep your phone charged and location on.</Text>
              <TouchableOpacity style={styles.historyLink} onPress={() => navigation.navigate('History')}>
                <Text style={styles.historyText}>View Emergency History</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeading}>{selected ? selected.title : 'Preparing'}</Text>
              {countdown > 0 ? (
                <View style={styles.countWrap}>
                  <Text style={styles.countText}>{countdown}</Text>
                  <Text style={styles.small}>Release to cancel</Text>
                </View>
              ) : (
                <View style={styles.sendingWrap}>
                  <Text style={styles.sending}>Sending help… Stay calm</Text>
                </View>
              )}
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelText}>{countdown > 0 ? 'Cancel' : 'Close'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Animated.View>

      <ChatBot 
        userProfile={profile} 
        contacts={contacts} 
        emergencyHistory={[]} // TODO: Add emergency history from API
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6FBFB' },
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#0B3340' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    marginBottom: 4,
  },
  greetingWrap: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: { color: '#6D7D81', fontSize: 14, letterSpacing: 0.2, marginLeft: 6 },
  userName: { color: '#0B3340', fontSize: 22, fontWeight: '700', marginTop: 2 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#D7EEF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  avatarText: { color: '#0B3340', fontWeight: '700', fontSize: 16 },
  statusCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, elevation: 2 },
  statusTitle: { color: '#6D7D81', fontSize: 12 },
  statusState: { color: '#18716A', fontSize: 18, fontWeight: '700', marginTop: 4 },
  locationWrap: { alignItems: 'flex-end' },
  locationDot: { color: '#4BCFA6', fontSize: 12 },
  locationText: { fontSize: 12, color: '#6D7D81' },
  shakeWrap: { marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0B3340', marginBottom: 8 },
  extras: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  extraCard: { backgroundColor: '#fff', padding: 12, borderRadius: 10, flex: 1, margin: 6 },
  extraTitle: { fontWeight: '700', color: '#0B3340' },
  extraDesc: { color: '#5F6E71', marginTop: 6, fontSize: 12 },
  bottomTips: { marginTop: 12, padding: 12 },
  tipsTitle: { fontWeight: '700', color: '#0B3340' },
  tip: { color: '#5F6E71', marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(6,18,22,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '82%', backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' },
  modalHeading: { fontWeight: '700', fontSize: 16, color: '#0B3340', marginBottom: 12 },
  countWrap: { alignItems: 'center' },
  countText: { fontSize: 48, fontWeight: '800', color: '#18716A' },
  small: { color: '#6D7D81', marginTop: 8 },
  sendingWrap: { paddingVertical: 8 },
  sending: { color: '#18716A', fontWeight: '700', fontSize: 16 },
  cancelBtn: { marginTop: 18, paddingVertical: 10, paddingHorizontal: 26, borderRadius: 10, backgroundColor: '#F2F6F6' },
  cancelText: { color: '#0B3340', fontWeight: '700' },
  historyLink: { marginTop: 12 },
  historyText: { color: '#0B3B36', fontWeight: '600' },
});
