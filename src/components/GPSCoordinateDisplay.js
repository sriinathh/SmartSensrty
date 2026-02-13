import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import OfflineSatelliteMapProvider from '../services/OfflineSatelliteMapProvider';

export default function GPSCoordinateDisplay({ userLocation, emergencyMode = false, visible = true }) {
  const [fadeAnim] = useState(new Animated.Value(visible ? 1 : 0));
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  useEffect(() => {
    if (emergencyMode) {
      setPulsing(true);
    } else {
      setPulsing(false);
    }
  }, [emergencyMode]);

  if (!userLocation || !visible) return null;

  const coords = OfflineSatelliteMapProvider.formatCoordinates(
    userLocation.latitude,
    userLocation.longitude
  );

  const getPulseAnimation = () => {
    if (!pulsing) return null;
    const pulse = new Animated.Value(1);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    return { transform: [{ scale: pulse }] };
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        emergencyMode && styles.emergencyContainer,
        { opacity: fadeAnim },
      ]}
    >
      {emergencyMode && (
        <View style={styles.emergencyHeader}>
          <Text style={styles.emergencyLabel}>📍 SOS LOCATION TRACKING</Text>
        </View>
      )}

      {/* Main Coordinates */}
      <View style={styles.contentBox}>
        <View style={styles.coordItem}>
          <Text style={styles.label}>Latitude</Text>
          <Text style={styles.latValue}>{coords.decimal.split(',')[0]}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.coordItem}>
          <Text style={styles.label}>Longitude</Text>
          <Text style={styles.lngValue}>{coords.decimal.split(',')[1].trim()}</Text>
        </View>
      </View>

      {/* Accuracy info */}
      {userLocation.accuracy && (
        <View style={styles.accuracyBox}>
          <Text style={styles.accuracyLabel}>GPS Accuracy</Text>
          <Text style={styles.accuracyValue}>±{userLocation.accuracy.toFixed(0)}m</Text>
        </View>
      )}

      {/* Altitude if available */}
      {userLocation.altitude && (
        <View style={styles.altitudeBox}>
          <Text style={styles.altitudeLabel}>Altitude</Text>
          <Text style={styles.altitudeValue}>{userLocation.altitude.toFixed(1)}m</Text>
        </View>
      )}

      {/* Emergency indicator for SOS */}
      {emergencyMode && (
        <View style={styles.emergencyIndicator}>
          <View style={[styles.statusDot, pulsing && styles.pulsing]} />
          <Text style={styles.statusText}>Location being tracked</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 12,
    backgroundColor: 'rgba(13, 91, 91, 0.9)',
    borderRadius: 12,
    borderColor: '#2DB3A6',
    borderWidth: 1,
    paddingVertical: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emergencyContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.95)',
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  emergencyHeader: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 10,
  },
  emergencyLabel: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  contentBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  coordItem: {
    marginVertical: 4,
  },
  label: {
    color: '#A0E7E5',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  latValue: {
    color: '#4BCFA6',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  lngValue: {
    color: '#2DB3A6',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 8,
  },
  accuracyBox: {
    marginHorizontal: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 6,
    marginBottom: 8,
  },
  accuracyLabel: {
    color: '#CFEFFA',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  accuracyValue: {
    color: '#E6F7FF',
    fontSize: 12,
    fontWeight: '600',
  },
  altitudeBox: {
    marginHorizontal: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 6,
  },
  altitudeLabel: {
    color: '#CFEFFA',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  altitudeValue: {
    color: '#E6F7FF',
    fontSize: 12,
    fontWeight: '600',
  },
  emergencyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF41',
    marginRight: 8,
  },
  pulsing: {
    shadowColor: '#00FF41',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
