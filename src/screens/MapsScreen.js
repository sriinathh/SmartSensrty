import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapStateContext from '../contexts/MapStateContext';
import OfflineIndicator from '../components/OfflineIndicator';
import MapHeader from '../components/MapHeader';
import LocationInfoCard from '../components/LocationInfoCard';
import GPSCoordinateDisplay from '../components/GPSCoordinateDisplay';
import SOSOverlay from '../components/SOSOverlay';
import {
  OfflineEmergencyPOILayer,
  POIDetailsCard,
  EmergencyPOIListModal,
} from '../components/OfflineEmergencyPOILayer';
import MapLocationBridge from '../services/MapLocationBridge';
import MapSOSBridge from '../services/MapSOSBridge';
import OfflineCacheManager from '../services/OfflineCacheManager';
import OfflineEmergencyDataManager from '../services/OfflineEmergencyDataManager';
import OfflineRoutingHelper from '../services/OfflineRoutingHelper';
import OfflineSatelliteMapProvider from '../services/OfflineSatelliteMapProvider';
import CacheButton from '../components/CacheButton';

export default function MapsScreen({ navigation }) {
  const mapStateContext = useContext(MapStateContext) || {};
  const { 
    camera = { center: [77.5946, 12.9716], zoom: 13, pitch: 0, bearing: 0 }, 
    emergencyMode = false, 
    setEmergencyMode = () => {} 
  } = mapStateContext;
  
  // Map state
  const [is3D, setIs3D] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [offline, setOffline] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Emergency/Offline features
  const [showPOIList, setShowPOIList] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [nearbyPolice, setNearbyPolice] = useState([]);
  const [nearbySafeZones, setNearbySafeZones] = useState([]);
  const [emergencySummary, setEmergencySummary] = useState(null);
  const [showEmergencyInfo, setShowEmergencyInfo] = useState(false);
  
  // Animations
  const markerScale = useRef(new Animated.Value(1)).current;
  const headingAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const mapRef = useRef(null);

  // Initialize offline systems
  useEffect(() => {
    initializeOfflineSystems();
  }, []);

  const initializeOfflineSystems = async () => {
    try {
      // Initialize offline emergency data
      await OfflineEmergencyDataManager.initialize();
      
      // Initialize offline cache manager
      await OfflineCacheManager.ensureInitialPack();
      
      // Initialize satellite map provider and pre-cache region
      await OfflineSatelliteMapProvider.preCacheSatelliteRegion('bengaluru', 13);
      
      // Subscribe to offline status
      const unsubscribe = OfflineCacheManager.subscribeToStatus((status) => {
        setOffline(!status.isOnline);
      });

      return unsubscribe;
    } catch (err) {
      console.warn('Offline systems initialization error:', err);
    }
  };

  // Main location tracking subscription
  useEffect(() => {
    const unsubLoc = MapLocationBridge.subscribe((loc) => {
      if (!loc) return;
      setUserLocation(loc);

      // Update nearby emergency services
      updateNearbyServices(loc);

      if (loc.heading != null && mapRef.current && isMapReady) {
        try { 
          headingAnim.setValue(loc.heading);
          Animated.timing(headingAnim, { toValue: loc.heading, duration: 300, useNativeDriver: true }).start();
        } catch (e) {}
      }

      if (loc && emergencyMode && mapRef.current && isMapReady) {
        mapRef.current.animateToRegion({
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 800);
        
        // Generate emergency summary
        generateEmergencySummary(loc);
      }
    });

    const unsubSOS = MapSOSBridge.subscribe((sos) => {
      if (sos && typeof sos.active !== 'undefined') {
        if (sos.active) {
          setShowEmergencyInfo(true);
        }
      }
    });

    OfflineCacheManager.isOffline().then((v) => setOffline(v)).catch(() => {});

    return () => { unsubLoc && unsubLoc(); unsubSOS && unsubSOS(); };
  }, [emergencyMode, isMapReady, updateNearbyServices, generateEmergencySummary, headingAnim]);

  // Emergency mode pulse animation
  useEffect(() => {
    if (emergencyMode) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(markerScale, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(markerScale, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.8, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      markerScale.setValue(1);
      pulseAnim.setValue(1);
    }
  }, [emergencyMode, markerScale, pulseAnim]);

  /**
   * Update nearby emergency services from offline cache
   */
  const updateNearbyServices = useCallback((location) => {
    const hospitals = OfflineEmergencyDataManager.getNearbyHospitals(
      location.latitude,
      location.longitude,
      emergencyMode ? 15 : 10
    );
    
    const police = OfflineEmergencyDataManager.getNearbyPoliceStations(
      location.latitude,
      location.longitude,
      emergencyMode ? 15 : 10
    );
    
    const zones = OfflineEmergencyDataManager.getNearbySafeZones(
      location.latitude,
      location.longitude,
      emergencyMode ? 15 : 10
    );

    setNearbyHospitals(hospitals);
    setNearbyPolice(police);
    setNearbySafeZones(zones);
  }, [emergencyMode]);

  /**
   * Generate emergency information summary
   */
  const generateEmergencySummary = useCallback((location) => {
    const summary = OfflineRoutingHelper.generateEmergencySummary(
      location.latitude,
      location.longitude,
      nearbyHospitals,
      nearbyPolice,
      nearbySafeZones
    );

    setEmergencySummary(summary);
  }, [nearbyHospitals, nearbyPolice, nearbySafeZones]);

  const toggle3D = () => {
    setIs3D(!is3D);
    if (mapRef.current && isMapReady) {
      const newZoom = is3D ? 13 : 15;
      const region = { 
        latitude: userLocation?.latitude || 12.9716, 
        longitude: userLocation?.longitude || 77.5946, 
        latitudeDelta: 0.5 / newZoom, 
        longitudeDelta: 0.5 / newZoom 
      };
      mapRef.current.animateToRegion(region, 800);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <MapHeader offline={offline} is3D={is3D} onToggle3D={toggle3D} onBack={() => navigation.goBack?.()} />
      <OfflineIndicator visible={offline} />

      <View style={styles.mapWrap}>
        {!isMapReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2DB3A6" />
            <Text style={styles.loadingText}>Loading Offline Map...</Text>
          </View>
        )}
        
        <MapView
          ref={mapRef}
          style={styles.map}
          mapType={(offline || emergencyMode) ? 'satellite' : 'standard'}
          initialRegion={{
            latitude: camera.center ? camera.center[1] : 12.9716,
            longitude: camera.center ? camera.center[0] : 77.5946,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onMapReady={() => setIsMapReady(true)}
          toolbarEnabled={true}
          showsMyLocationButton={true}
          showsUserLocation={false}
        >
          {/* User location accuracy circle */}
          {userLocation && (
            <>
              <Circle
                center={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
                radius={userLocation.accuracy || 30}
                fillColor="rgba(6, 182, 212, 0.12)"
                strokeColor="rgba(6, 182, 212, 0.28)"
                strokeWidth={1}
              />
              
              {/* Emergency mode pulse ring */}
              {emergencyMode && (
                <Circle
                  center={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
                  radius={(userLocation.accuracy || 30) * 2}
                  fillColor="rgba(255, 59, 48, 0.08)"
                  strokeColor="rgba(255, 59, 48, 0.3)"
                  strokeWidth={2}
                />
              )}
              
              {/* User position marker */}
              <Marker
                coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <Animated.View 
                  style={[
                    styles.userMarkerWrap, 
                    { 
                      transform: [
                        { rotate: headingAnim.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) },
                        { scale: markerScale }
                      ] 
                    }
                  ]} 
                >
                  <View style={[styles.userMarker, emergencyMode ? styles.emergencyMarker : styles.normalMarker]} />
                </Animated.View>
              </Marker>

              {/* Offline Emergency POI Layer */}
              <OfflineEmergencyPOILayer
                userLocation={userLocation}
                emergencyMode={emergencyMode}
                onPOISelected={setSelectedPOI}
                visibleTypes={{
                  hospitals: true,
                  police: true,
                  safeZones: emergencyMode,
                }}
              />
            </>
          )}
        </MapView>

        {/* Cache/Offline Status Button */}
        <CacheButton mapRef={mapRef} />

        {/* Emergency Info Button (visible in emergency mode) */}
        {emergencyMode && (
          <TouchableOpacity
            style={styles.emergencyInfoButton}
            onPress={() => setShowPOIList(true)}
          >
            <Icon name="hospital-box" size={20} color="#fff" />
            <Text style={styles.emergencyInfoText}>
              {nearbyHospitals.length + nearbyPolice.length} Emergency Services
            </Text>
          </TouchableOpacity>
        )}

        {/* Location Info Card */}
        <LocationInfoCard location={userLocation} emergencyMode={emergencyMode} />

        {/* Selected POI Details */}
        {selectedPOI && (
          <POIDetailsCard
            poi={selectedPOI}
            userLocation={userLocation}
            onClose={() => setSelectedPOI(null)}
          />
        )}

        {/* SOS Overlay */}
        <SOSOverlay
          emergencyMode={emergencyMode}
          onToggle={() => setEmergencyMode(!emergencyMode)}
        />

        {/* GPS Coordinate Display (shown during emergency or when offline) */}
        <GPSCoordinateDisplay 
          userLocation={userLocation} 
          emergencyMode={emergencyMode}
          visible={emergencyMode || offline}
        />
      </View>

      {/* Emergency POI List Modal */}
      <EmergencyPOIListModal
        visible={showPOIList}
        hospitals={nearbyHospitals}
        policeStations={nearbyPolice}
        safeZones={nearbySafeZones}
        userLocation={userLocation}
        onPOISelect={(poi) => {
          setSelectedPOI(poi);
          setShowPOIList(false);
        }}
        onClose={() => setShowPOIList(false)}
      />

      {/* Emergency Info Modal */}
      {emergencySummary && (
        <Modal
          visible={showEmergencyInfo}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEmergencyInfo(false)}
        >
          <View style={styles.emergencyModal}>
            <TouchableOpacity
              style={styles.emergencyModalBackdrop}
              onPress={() => setShowEmergencyInfo(false)}
            />
            <View style={styles.emergencyModalContent}>
              <View style={styles.emergencyModalHeader}>
                <Icon name="alert-decagram" size={28} color="#EF4444" />
                <Text style={styles.emergencyModalTitle}>Emergency Mode Active</Text>
                <TouchableOpacity onPress={() => setShowEmergencyInfo(false)}>
                  <Icon name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.emergencyModalBody}>
                <Text style={styles.emergencyModalLabel}>📍 Your Location</Text>
                <Text style={styles.emergencyModalValue}>
                  {userLocation?.latitude.toFixed(4)}, {userLocation?.longitude.toFixed(4)}
                </Text>

                <Text style={styles.emergencyModalLabel}>🏥 Nearest Hospital</Text>
                <Text style={styles.emergencyModalValue}>
                  {emergencySummary.closestEmergencyService?.name || 'Searching...'}
                  {emergencySummary.closestEmergencyService?.distance && (
                    <Text style={styles.emergencyModalDistance}>
                      {' '}· {emergencySummary.closestEmergencyService.distance.toFixed(1)} km
                    </Text>
                  )}
                </Text>

                <Text style={styles.emergencyModalLabel}>🛡️ Safe Zone</Text>
                <Text style={styles.emergencyModalValue}>
                  {emergencySummary.optimalSafeZone?.name || 'No safe zones nearby'}
                </Text>

                <View style={styles.emergencyModalStats}>
                  <View style={styles.emergencyModalStat}>
                    <Icon name="hospital-box" size={18} color="#EF4444" />
                    <Text style={styles.emergencyModalStatText}>
                      {emergencySummary.nearbyCount.hospitals} Hospitals
                    </Text>
                  </View>
                  <View style={styles.emergencyModalStat}>
                    <Icon name="shield-alert" size={18} color="#3B82F6" />
                    <Text style={styles.emergencyModalStatText}>
                      {emergencySummary.nearbyCount.policeStations} Police
                    </Text>
                  </View>
                </View>

                <View style={styles.emergencyOfflineBadge}>
                  <Icon name="wifi-off" size={14} color="#6B7280" />
                  <Text style={styles.emergencyOfflineText}>All data cached • Works offline</Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#081226' },
  mapWrap: { flex: 1 },
  map: { flex: 1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  placeholderText: { color: '#fff', textAlign: 'center' },
  loadingOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(8, 18, 38, 0.8)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 10 
  },
  loadingText: { color: '#2DB3A6', marginTop: 12, fontSize: 14, fontWeight: '500' },
  userMarkerWrap: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  userMarker: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#fff' },
  emergencyMarker: { 
    backgroundColor: '#ff3b30', 
    shadowColor: '#ff3b30', 
    shadowOpacity: 0.9, 
    elevation: 6 
  },
  normalMarker: { backgroundColor: '#00e676' },

  // Emergency Info Button
  emergencyInfoButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 5,
  },
  emergencyInfoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Emergency Modal
  emergencyModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emergencyModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  emergencyModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    zIndex: 10,
  },
  emergencyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  emergencyModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginHorizontal: 12,
  },
  emergencyModalBody: {
    marginBottom: 12,
  },
  emergencyModalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  emergencyModalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emergencyModalDistance: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  emergencyModalStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  emergencyModalStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  emergencyModalStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  emergencyOfflineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 6,
  },
  emergencyOfflineText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
});
