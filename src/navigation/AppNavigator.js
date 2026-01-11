import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ServicesScreen from '../screens/ServicesScreen';
import TrustedContactsScreen from '../screens/TrustedContactsScreen';
import EmergencyHistoryScreen from '../screens/EmergencyHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PermissionsScreen from '../screens/PermissionsScreen';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = await authAPI.loadToken();
      const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
      setIsAuthenticated(!!token);
      setIsOnboarded(!!onboardingCompleted);
    } catch (error) {
      setIsAuthenticated(false);
      setIsOnboarded(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    // You could return a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // Authenticated screens
          <>
            {!isOnboarded ? (
              <>
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen 
                  name="Permissions" 
                  component={PermissionsScreen} 
                  initialParams={{ setIsOnboarded: setIsOnboarded }}
                />
              </>
            ) : (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Services" component={ServicesScreen} />
                <Stack.Screen name="Contacts" component={TrustedContactsScreen} />
                <Stack.Screen name="History" component={EmergencyHistoryScreen} />
                <Stack.Screen 
                  name="Profile" 
                  component={ProfileScreen} 
                  initialParams={{ setAuthenticated: setIsAuthenticated }}
                />
              </>
            )}
          </>
        ) : (
          // Unauthenticated screens
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              initialParams={{ setAuthenticated: setIsAuthenticated }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen} 
              initialParams={{ setAuthenticated: setIsAuthenticated }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
