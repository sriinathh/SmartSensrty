import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Linking,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, Circle } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sosAPI } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORAGE_KEY = '@emergency_history_cache';

// Map SOS types to display names and icons
const SOS_TYPE_MAP = {
  'manual': { label: 'Manual SOS', icon: 'hand-back-right', color: '#EF4444' },
  'accident': { label: 'Accident Detection', icon: 'car-emergency', color: '#FFA96C' },
  'panic': { label: 'Panic Alert', icon: 'bell-alert', color: '#FF6B6B' },
  'shake': { label: 'Shake Detection', icon: 'vibrate', color: '#F59E0B' },
  'power': { label: 'Power Button Alert', icon: 'power', color: '#8B5CF6' },
  'voice': { label: 'Voice Alert', icon: 'microphone', color: '#3B82F6' },
  'card': { label: 'Emergency Card', icon: 'credit-card', color: '#4BCFA6' },
  'medical': { label: 'Medical Emergency', icon: 'medical-bag', color: '#EC4899' },
};

// Map SOS status to display info
const STATUS_MAP = {
  'active': { label: 'Active', color: '#EF4444' },
  'resolved': { label: 'Resolved', color: '#10B981' },
  'cancelled': { label: 'Cancelled', color: '#6B7280' },
};

export default function EmergencyHistoryScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const anims = useRef([]).current;
  const mapRef = useRef(null);

  // Parse location from item - handles both string and object formats
  const parseLocation = (item) => {
    // If item has coordinates object
    if (item.coordinates && typeof item.coordinates === 'object') {
      return {
        latitude: item.coordinates.latitude || item.coordinates.lat,
        longitude: item.coordinates.longitude || item.coordinates.lng || item.coordinates.lon,
        address: item.location || item.address || 'Unknown location',
      };
    }
    
    // If item has lat/lng directly
    if (item.latitude && item.longitude) {
      return {
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.location || item.address || 'Unknown location',
      };
    }
    
    // If location is a string with coordinates pattern "lat, lng"
    if (typeof item.location === 'string') {
      const coordMatch = item.location.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
      if (coordMatch) {
        return {
          latitude: parseFloat(coordMatch[1]),
          longitude: parseFloat(coordMatch[2]),
          address: item.location,
        };
      }
    }
    
    // Default - no valid coordinates
    return {
      latitude: null,
      longitude: null,
      address: item.location || 'Unknown location',
    };
  };

  // Save to local storage
  const saveToLocalStorage = async (emergencies) => {
    try {
      const cacheData = {
        data: emergencies,
        timestamp: Date.now(),
        pagination,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
      console.log('✅ Emergency history cached locally');
    } catch (err) {
      console.error('Failed to cache emergency history:', err);
    }
  };

  // Load from local storage
  const loadFromLocalStorage = async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const { data: cachedData, timestamp, pagination: cachedPagination } = JSON.parse(cached);
        // Cache valid for 24 hours
        const isValid = Date.now() - timestamp < 24 * 60 * 60 * 1000;
        if (isValid && cachedData?.length > 0) {
          console.log('📦 Loaded emergency history from cache');
          return { data: cachedData, pagination: cachedPagination };
        }
      }
    } catch (err) {
      console.error('Failed to load cached emergency history:', err);
    }
    return null;
  };

  // Add new emergency to local storage (for offline support)
  const addEmergencyLocally = async (emergency) => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      let existingData = [];
      if (cached) {
        const parsed = JSON.parse(cached);
        existingData = parsed.data || [];
      }
      
      // Add new emergency at the beginning
      const updatedData = [emergency, ...existingData];
      
      // Keep only last 100 emergencies locally
      const trimmedData = updatedData.slice(0, 100);
      
      await saveToLocalStorage(trimmedData);
      setData(trimmedData);
      setPagination(prev => ({ ...prev, total: trimmedData.length }));
    } catch (err) {
      console.error('Failed to add emergency locally:', err);
    }
  };

  // Fetch SOS history from database with local fallback
  const fetchHistory = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      
      // Try to load from cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedResult = await loadFromLocalStorage();
        if (cachedResult) {
          setData(cachedResult.data);
          if (cachedResult.pagination) {
            setPagination(cachedResult.pagination);
          }
          setLoading(false);
          // Continue to fetch fresh data in background
        }
      }
      
      // Fetch from API
      console.log('📡 Fetching SOS history from API...');
      const response = await sosAPI.getHistory(50, pagination.page);
      
      if (response && response.success) {
        console.log(`✅ SOS history loaded: ${response.data?.length || 0} items`);
        setData(response.data || []);
        setPagination({
          page: response.pagination?.page || 1,
          totalPages: response.pagination?.pages || 1,
          total: response.pagination?.total || 0,
        });
        setIsOffline(false);
        
        // Cache the data locally
        await saveToLocalStorage(response.data || []);

        // Reset animations for new data
        anims.length = 0;
        (response.data || []).forEach(() => {
          anims.push(new Animated.Value(0));
        });

        // Animate items
        if (response.data?.length > 0) {
          Animated.stagger(90, anims.map(a => Animated.timing(a, { toValue: 1, duration: 420, useNativeDriver: true }))).start();
        }
      } else {
        console.warn('⚠️ API response missing success flag or data');
        throw new Error('Invalid API response - server returned: ' + JSON.stringify(response).substring(0, 100));
      }
    } catch (err) {
      const errorMsg = err?.message || 'Failed to load emergency history';
      console.error('❌ Error fetching SOS history:', {
        message: errorMsg,
        error: err,
        timestamp: new Date().toISOString(),
      });
      
      // If API fails, try to use cached data
      const cachedResult = await loadFromLocalStorage();
      if (cachedResult && cachedResult.data?.length > 0) {
        console.log('📦 Using cached data as fallback');
        setData(cachedResult.data);
        if (cachedResult.pagination) {
          setPagination(cachedResult.pagination);
        }
        setIsOffline(true);
        setError(null); // Clear error since we have cached data
      } else {
        // Provide more helpful error message
        let displayError = errorMsg;
        if (errorMsg.includes('404') || errorMsg.includes('Cannot GET')) {
          displayError = '❌ API endpoint not found. Backend may not be deployed correctly.';
        } else if (errorMsg.includes('401') || errorMsg.includes('Authentication')) {
          displayError = '❌ Authentication failed. Please login again.';
        } else if (errorMsg.includes('Network error') || errorMsg.includes('timeout')) {
          displayError = '❌ Network error. Check your internet connection and Render deployment status.';
        }
        setError(displayError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.page]);

  // Initial load
  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory(true);
  }, [fetchHistory]);

  const testAPIConnection = useCallback(async () => {
    console.log('🧪 Testing API connection...');
    try {
      Alert.alert('Testing', 'Attempting to connect to SOS API...');
      const response = await sosAPI.getHistory(1, 1);
      console.log('✅ API Test Result:', response);
      Alert.alert(
        'API Connection Successful',
        `Status: ${response.success ? 'OK' : 'FAILED'}\n` +
        `Items: ${response.data?.length || 0}\n` +
        `Total: ${response.pagination?.total || 0}`
      );
    } catch (error) {
      console.error('❌ API Test Failed:', error);
      Alert.alert(
        'API Connection Failed',
        `Error: ${error.message}\n\nMake sure:\n` +
        `1. Render backend is deployed\n` +
        `2. JWT_SECRET env var is set\n` +
        `3. MongoDB is connected\n` +
        `4. You are logged in`
      );
    }
  }, []);

  const handleDetailsPress = (item) => {
    setSelectedEmergency(item);
    setDetailsModalVisible(true);
  };

  const openInMaps = (item) => {
    const loc = parseLocation(item);
    if (loc.latitude && loc.longitude) {
      const url = Platform.select({
        ios: `maps://app?daddr=${loc.latitude},${loc.longitude}`,
        android: `google.navigation:q=${loc.latitude},${loc.longitude}`,
      });
      Linking.openURL(url).catch(() => {
        // Fallback to Google Maps web
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`);
      });
    }
  };

  const getSOSType = (typeKey) => {
    return SOS_TYPE_MAP[typeKey] || SOS_TYPE_MAP['manual'];
  };

  const getStatus = (statusKey) => {
    return STATUS_MAP[statusKey] || STATUS_MAP['active'];
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateStr;
    if (date.toDateString() === today.toDateString()) {
      dateStr = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateStr = 'Yesterday';
    } else {
      dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} at ${timeStr}`;
  };

  const renderMiniMap = (item) => {
    const loc = parseLocation(item);
    const typeInfo = getSOSType(item.type);
    
    if (!loc.latitude || !loc.longitude) {
      return (
        <View style={styles.miniMapPlaceholder}>
          <Icon name="map-marker-off" size={24} color="#9CA3AF" />
          <Text style={styles.miniMapPlaceholderText}>No location</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.miniMapContainer}>
        <MapView
          style={styles.miniMap}
          initialRegion={{
            latitude: loc.latitude,
            longitude: loc.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          pointerEvents="none"
        >
          <Marker
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.mapMarker, { backgroundColor: typeInfo.color }]}>
              <Icon name="alert" size={12} color="#fff" />
            </View>
          </Marker>
        </MapView>
        <View style={styles.miniMapOverlay}>
          <Icon name="map-marker" size={14} color={typeInfo.color} />
        </View>
      </View>
    );
  };

  const renderItem = ({ item, index }) => {
    const typeInfo = getSOSType(item.type);
    const statusInfo = getStatus(item.status);
    const loc = parseLocation(item);
    const a = anims[index] || new Animated.Value(1);
    const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });
    const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => handleDetailsPress(item)}>
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
          {/* Mini Map */}
          {renderMiniMap(item)}
          
          {/* Card Content */}
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, { backgroundColor: typeInfo.color + '15', borderColor: typeInfo.color + '30' }]}>
                <Icon name={typeInfo.icon} size={20} color={typeInfo.color} />
              </View>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.sosType}>{typeInfo.label}</Text>
                <Text style={styles.dateTime}>{formatDateTime(item.timestamp)}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: statusInfo.color + '15', borderColor: statusInfo.color + '30' }]}>
                <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
              </View>
            </View>
            
            <View style={styles.locationRow}>
              <Icon name="map-marker" size={16} color="#6B7280" />
              <Text style={styles.location} numberOfLines={2}>{loc.address}</Text>
            </View>
            
            <View style={styles.cardFooter}>
              {loc.latitude && loc.longitude && (
                <TouchableOpacity style={styles.directionsBtn} onPress={() => openInMaps(item)}>
                  <Icon name="directions" size={16} color="#2E5090" />
                  <Text style={styles.directionsBtnText}>Directions</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.detailsBtn}>
                <Text style={styles.detailsBtnText}>View Details</Text>
                <Icon name="chevron-right" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderDetailsModal = () => {
    if (!selectedEmergency) return null;
    
    const typeInfo = getSOSType(selectedEmergency.type);
    const statusInfo = getStatus(selectedEmergency.status);
    const loc = parseLocation(selectedEmergency);
    const hasValidLocation = loc.latitude && loc.longitude;
    
    return (
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={styles.modalBackBtn}>
              <Icon name="arrow-left" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Emergency Details</Text>
            <View style={{ width: 40 }} />
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Full Map */}
            {hasValidLocation ? (
              <View style={styles.fullMapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.fullMap}
                  initialRegion={{
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                  showsUserLocation={true}
                  showsMyLocationButton={false}
                >
                  {/* Emergency Location Marker */}
                  <Marker
                    coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                    anchor={{ x: 0.5, y: 0.5 }}
                  >
                    <View style={[styles.fullMapMarker, { backgroundColor: typeInfo.color }]}>
                      <Icon name={typeInfo.icon} size={20} color="#fff" />
                    </View>
                  </Marker>
                  
                  {/* Accuracy Circle */}
                  <Circle
                    center={{ latitude: loc.latitude, longitude: loc.longitude }}
                    radius={100}
                    fillColor={typeInfo.color + '20'}
                    strokeColor={typeInfo.color + '50'}
                    strokeWidth={2}
                  />
                </MapView>
                
                {/* Map Actions */}
                <View style={styles.mapActions}>
                  <TouchableOpacity
                    style={styles.mapActionBtn}
                    onPress={() => openInMaps(selectedEmergency)}
                  >
                    <Icon name="navigation" size={20} color="#fff" />
                    <Text style={styles.mapActionText}>Navigate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.mapActionBtn, styles.mapActionBtnSecondary]}
                    onPress={() => {
                      mapRef.current?.animateToRegion({
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }, 500);
                    }}
                  >
                    <Icon name="crosshairs-gps" size={20} color="#2E5090" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.noMapContainer}>
                <Icon name="map-marker-off" size={48} color="#D1D5DB" />
                <Text style={styles.noMapText}>Location data unavailable</Text>
              </View>
            )}
            
            {/* Emergency Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <View style={[styles.infoIconWrap, { backgroundColor: typeInfo.color + '15' }]}>
                  <Icon name={typeInfo.icon} size={28} color={typeInfo.color} />
                </View>
                <View style={styles.infoCardTitleWrap}>
                  <Text style={styles.infoCardTitle}>{typeInfo.label}</Text>
                  <View style={[styles.statusPillLarge, { backgroundColor: statusInfo.color + '15' }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                    <Text style={[styles.statusTextLarge, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                  </View>
                </View>
              </View>
              
              {/* Details Rows */}
              <View style={styles.detailsSection}>
                <View style={styles.detailRow}>
                  <Icon name="clock-outline" size={20} color="#6B7280" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Date & Time</Text>
                    <Text style={styles.detailValue}>{formatDateTime(selectedEmergency.timestamp)}</Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Icon name="map-marker-outline" size={20} color="#6B7280" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>{loc.address}</Text>
                    {hasValidLocation && (
                      <Text style={styles.detailCoords}>
                        {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                      </Text>
                    )}
                  </View>
                </View>
                
                {selectedEmergency.duration && (
                  <View style={styles.detailRow}>
                    <Icon name="timer-outline" size={20} color="#6B7280" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Duration</Text>
                      <Text style={styles.detailValue}>
                        {Math.floor(selectedEmergency.duration / 60000)} minutes
                      </Text>
                    </View>
                  </View>
                )}
                
                {selectedEmergency.contactsNotified && (
                  <View style={styles.detailRow}>
                    <Icon name="account-group-outline" size={20} color="#6B7280" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Contacts Notified</Text>
                      <Text style={styles.detailValue}>
                        {selectedEmergency.contactsNotified} people alerted
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
            
            {/* Action Buttons */}
            {hasValidLocation && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={() => openInMaps(selectedEmergency)}
                >
                  <Icon name="directions" size={22} color="#fff" />
                  <Text style={styles.primaryActionText}>Get Directions</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2E5090" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Icon name="history" size={48} color="#D1D5DB" />
        <Text style={styles.emptyText}>No emergency alerts yet</Text>
        <Text style={styles.emptySubtext}>Your SOS history will appear here once you trigger an alert</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['right', 'bottom', 'left']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Emergency History</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitle}>{pagination.total} alerts total</Text>
              {isOffline && (
                <View style={styles.offlineBadge}>
                  <Icon name="wifi-off" size={12} color="#F59E0B" />
                  <Text style={styles.offlineText}>Offline</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={onRefresh} disabled={refreshing} style={styles.refreshBtn}>
            <Icon name="refresh" size={20} color={refreshing ? '#9CA3AF' : '#2E5090'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={testAPIConnection} style={styles.testBtn} title="Test API">
            <Icon name="bug-check" size={20} color="#2E5090" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {data.length > 0 || !loading ? (
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id?.toString() || `emergency-${index}`}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E5090" />}
            ListEmptyComponent={renderEmpty}
            scrollEnabled={data.length > 0}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          renderEmpty()
        )}
      </View>
      
      {/* Details Modal */}
      {renderDetailsModal()}
    </SafeAreaView>
  );
}

// Export helper function for other components to add emergencies
export const addEmergencyToHistory = async (emergency) => {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    let existingData = [];
    if (cached) {
      const parsed = JSON.parse(cached);
      existingData = parsed.data || [];
    }
    
    const newEmergency = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: 'active',
      ...emergency,
    };
    
    const updatedData = [newEmergency, ...existingData].slice(0, 100);
    
    const cacheData = {
      data: updatedData,
      timestamp: Date.now(),
      pagination: { page: 1, totalPages: 1, total: updatedData.length },
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
    console.log('✅ Emergency added to local history');
    return newEmergency;
  } catch (err) {
    console.error('Failed to add emergency to history:', err);
    return null;
  }
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    marginTop: Platform.OS === 'android' ? 8 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 18 : 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginTop: Platform.OS === 'android' ? 8 : 0,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  offlineText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '600',
  },
  refreshBtn: {
    padding: 8,
  },
  testBtn: {
    padding: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 20,
  },
  
  // Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  miniMapContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  miniMap: {
    flex: 1,
  },
  miniMapOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  miniMapPlaceholder: {
    height: 80,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  miniMapPlaceholderText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  mapMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cardBody: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cardTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  sosType: {
    fontWeight: '700',
    fontSize: 15,
    color: '#1F2937',
  },
  dateTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  location: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  directionsBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E5090',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsBtnText: {
    fontSize: 13,
    color: '#6B7280',
  },
  
  // Modal Styles
  modalSafe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalBackBtn: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
  },
  fullMapContainer: {
    height: 280,
    position: 'relative',
  },
  fullMap: {
    flex: 1,
  },
  fullMapMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mapActions: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },
  mapActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E5090',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  mapActionBtnSecondary: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  mapActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  noMapContainer: {
    height: 200,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMapText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  
  // Info Card
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCardTitleWrap: {
    flex: 1,
    marginLeft: 14,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusPillLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 6,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTextLarge: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsSection: {
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 14,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  detailCoords: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  
  // Action Buttons
  actionButtons: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E5090',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Empty/Error States
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#2E5090',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

