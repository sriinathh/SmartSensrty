import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import ReverseGeocodeService from '../services/ReverseGeocodeService';
import POIService from '../services/POIService';
import OfflineSatelliteMapProvider from '../services/OfflineSatelliteMapProvider';

export default function LocationInfoCard({ location, emergencyMode = false }) {
  const [info, setInfo] = useState(null);
  const [pois, setPois] = useState([]);
  const [coordFormat, setCoordFormat] = useState('decimal');

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!location) return;
      const { latitude, longitude } = location;
      const res = await ReverseGeocodeService.reverseGeocode(latitude, longitude).catch(() => null);
      if (mounted) setInfo(res);
      const nearby = await POIService.getNearbyPOIs().catch(() => []);
      if (mounted) setPois(nearby.slice(0, 3));
    })();
    return () => { mounted = false; };
  }, [location]);

  if (!location) return null;

  const coords = OfflineSatelliteMapProvider.formatCoordinates(location.latitude, location.longitude);
  
  // Toggle coordinate format on press
  const handleCoordPress = () => {
    setCoordFormat(prev => prev === 'decimal' ? 'dms' : 'short');
  };

  return (
    <View style={[styles.card, emergencyMode && styles.emergencyCard]} pointerEvents="none">
      <View style={styles.header}>
        <Text style={styles.title}>📍 Current Location</Text>
        {emergencyMode && <Text style={styles.emergencyBadge}>TRACKING</Text>}
      </View>
      
      {info === null ? (
        <ActivityIndicator color="#CFEFFA" />
      ) : (
        <>
          {/* Display name or formatted coordinates */}
          <Text style={styles.locationName}>{info.displayName || 'Using GPS'}</Text>
          
          {/* GPS Coordinates with enhanced visibility */}
          <View style={styles.coordinatesBox}>
            <Text style={styles.coordinateLabel}>GPS Coordinates</Text>
            <Text style={[styles.coordinate, styles.latitude]}>
              Lat: {coords.decimal.split(',')[0]}
            </Text>
            <Text style={[styles.coordinate, styles.longitude]}>
              Lng: {coords.decimal.split(',')[1].trim()}
            </Text>
            {location.accuracy && (
              <Text style={styles.accuracy}>
                Accuracy: ±{location.accuracy.toFixed(0)}m
              </Text>
            )}
          </View>

          {/* Nearby POIs */}
          {pois.length > 0 && (
            <View style={styles.poiSection}>
              <Text style={styles.poiTitle}>🏘️ Nearby:</Text>
              {pois.map((p) => (
                <Text key={p.id} style={styles.poiLine}>• {p.name}</Text>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 16,
    bottom: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    width: 280,
  },
  emergencyCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderColor: 'rgba(255, 59, 48, 0.4)',
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { 
    color: '#E6F7FF', 
    fontWeight: '700', 
    fontSize: 13,
  },
  emergencyBadge: {
    color: '#FF3B30',
    fontWeight: '800',
    fontSize: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  locationName: { 
    color: '#CFEFFA', 
    fontSize: 12, 
    fontWeight: '600',
    marginBottom: 10,
  },
  coordinatesBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#2DB3A6',
  },
  coordinateLabel: {
    color: '#A0E7E5',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coordinate: {
    color: '#E6F7FF',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  latitude: {
    color: '#4BCFA6',
  },
  longitude: {
    color: '#2DB3A6',
  },
  accuracy: {
    color: '#8AC5BE',
    fontSize: 10,
    marginTop: 6,
    fontStyle: 'italic',
  },
  poiSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
  },
  poiTitle: { 
    color: '#CFEFFA', 
    fontSize: 11, 
    fontWeight: '700',
    marginBottom: 6,
  },
  poiLine: { 
    color: '#CFEFFA', 
    fontSize: 11,
    marginBottom: 4,
  },
});
