import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Linking,
  BackHandler,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const permissionsData = [
  {
    id: 'location',
    title: '📍 Location Access',
    subtitle: 'Allow location access all the time',
    explanation: 'Required to share live location during SOS. Works even when the app is in background or phone is locked.',
    icon: 'map-marker',
    color: '#FF6B9D',
    permission: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  },
  {
    id: 'call',
    title: '📞 Phone Call Permission',
    subtitle: 'Allow Smart Sentry to make phone calls',
    explanation: 'Automatically calls emergency numbers when SOS is triggered.',
    icon: 'phone',
    color: '#4BCFA6',
    permission: PermissionsAndroid.PERMISSIONS.CALL_PHONE,
  },
  {
    id: 'sms',
    title: '💬 SMS Permission',
    subtitle: 'Allow Smart Sentry to send messages',
    explanation: 'Sends SOS SMS with live location to trusted contacts.',
    icon: 'message-text',
    color: '#FF9500',
    permission: PermissionsAndroid.PERMISSIONS.SEND_SMS,
  },
  {
    id: 'contacts',
    title: '👥 Contacts Permission',
    subtitle: 'Allow access to contacts',
    explanation: 'Lets you select and notify trusted contacts instantly.',
    icon: 'contacts',
    color: '#007AFF',
    permission: PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
  },
  {
    id: 'internet',
    title: '🌐 Internet & Background Access',
    subtitle: 'Allow background activity & internet access',
    explanation: 'Ensures SOS works even when app is closed. Required for maps and real-time updates.',
    icon: 'wifi',
    color: '#34C759',
    permission: null, // Usually granted automatically
  },
];

export default function PermissionsScreen({ navigation, route }) {
  const { setIsOnboarded } = route.params || {};

  const requestAllPermissions = async () => {
    try {
      const grantedPermissions = {};

      // Request foreground location first
      const foregroundGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Smart Sentry SOS Protection',
          message: 'This app requires location access to send SOS alerts during emergencies.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Deny',
          buttonPositive: 'Allow',
        }
      );
      grantedPermissions['location'] = foregroundGranted === PermissionsAndroid.RESULTS.GRANTED;

      // If foreground granted, request background
      if (grantedPermissions['location']) {
        const backgroundGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          {
            title: 'Smart Sentry SOS Protection',
            message: 'Allow location access all the time for emergency SOS even when app is closed.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Deny',
            buttonPositive: 'Allow',
          }
        );
        grantedPermissions['background_location'] = backgroundGranted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        grantedPermissions['background_location'] = false;
      }

      // Request other permissions
      const otherPermissions = [
        { id: 'call', permission: PermissionsAndroid.PERMISSIONS.CALL_PHONE },
        { id: 'sms', permission: PermissionsAndroid.PERMISSIONS.SEND_SMS },
        { id: 'contacts', permission: PermissionsAndroid.PERMISSIONS.READ_CONTACTS },
      ];

      for (const item of otherPermissions) {
        const granted = await PermissionsAndroid.request(item.permission, {
          title: 'Smart Sentry SOS Protection',
          message: 'This app requires calls, SMS, and contacts access to send SOS alerts during emergencies.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Deny',
          buttonPositive: 'Allow',
        });
        grantedPermissions[item.id] = granted === PermissionsAndroid.RESULTS.GRANTED;
      }

      // Internet assumed granted
      grantedPermissions['internet'] = true;

      const allGranted = Object.values(grantedPermissions).every(Boolean);

      if (allGranted) {
        handleGetStarted();
      } else {
        Alert.alert(
          'Permissions Required',
          'All permissions are essential for Smart Sentry to provide emergency protection. Please grant them to continue.',
          [
            { text: 'Try Again', onPress: requestAllPermissions },
            { text: 'Exit App', onPress: exitApp },
          ]
        );
      }
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  const exitApp = () => {
    BackHandler.exitApp();
  };

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      if (setIsOnboarded) {
        setIsOnboarded(true);
      }
      navigation.navigate('Home'); // Assuming HomeScreen route is 'Home'
    } catch (error) {
      console.error('Failed to save onboarding status', error);
      navigation.navigate('Home');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <LinearGradient
        colors={['#0A2E38', '#0F4D5F', '#18716A', '#1F8B7E']}
        style={styles.background}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Icon name="shield-check" size={60} color="#4BCFA6" />
            <Text style={styles.headerTitle}> Allow Smart Sentry to Protect You</Text>
            <Text style={styles.headerSubtitle}>
              Smart Sentry needs the following permissions to work properly during emergencies.
            </Text>
          </View>

          <View style={styles.permissionsContainer}>
            {permissionsData.map((item) => (
              <View key={item.id} style={styles.permissionItem}>
                <LinearGradient
                  colors={[item.color, '#0F4D5F']}
                  style={styles.permissionIcon}
                >
                  <Icon name={item.icon} size={30} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.permissionContent}>
                  <Text style={styles.permissionTitle}>{item.title}</Text>
                  <Text style={styles.permissionSubtitle}>{item.subtitle}</Text>
                  <Text style={styles.permissionExplanation}>{item.explanation}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.trustContainer}>
            <Text style={styles.trustTitle}>🔐 Trust Message</Text>
            <Text style={styles.trustMessage}>
              These permissions are used ONLY during emergencies.{'\n'}
              Smart Sentry does not track, record, or share your data without SOS activation.
            </Text>
          </View>

          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationText}>
              ✅ FINAL CONFIRMATION PROMPT{'\n\n'}
              Grant all permissions to enable full SOS protection.{'\n'}
              Without these permissions, emergency features may not work correctly.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={requestAllPermissions} style={styles.allowButton}>
              <Text style={styles.allowText}>✔️ ALLOW ALL & CONTINUE</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={exitApp} style={styles.exitButton}>
              <Text style={styles.exitText}>✖️ EXIT APP</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0F7FA',
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionsContainer: {
    marginBottom: 20,
  },
  permissionItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  permissionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  permissionSubtitle: {
    fontSize: 14,
    color: '#4BCFA6',
    marginBottom: 5,
  },
  permissionExplanation: {
    fontSize: 14,
    color: '#E0F7FA',
    lineHeight: 20,
  },
  trustContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  trustTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  trustMessage: {
    fontSize: 14,
    color: '#E0F7FA',
    lineHeight: 20,
  },
  confirmationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  confirmationText: {
    fontSize: 14,
    color: '#E0F7FA',
    lineHeight: 20,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  allowButton: {
    backgroundColor: '#4BCFA6',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
  },
  allowText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  exitButton: {
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
  },
  exitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});