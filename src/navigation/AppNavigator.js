import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

// Screens
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PermissionsScreen from '../screens/PermissionsScreen';
import ServicesScreen from '../screens/ServicesScreen';
import TrustedContactsScreen from '../screens/TrustedContactsScreen';
import EmergencyHistoryScreen from '../screens/EmergencyHistoryScreen';
import EmergencyContactsScreen from '../screens/EmergencyContactsScreen';
import FakeCallScreen from '../screens/FakeCallScreen';
import DisasterScreen from '../screens/DisasterScreen';

// Navigators
import BottomTabs from './BottomTabs';

const Stack = createNativeStackNavigator();

// ============================================
// 1. AUTH STACK - For unauthenticated users
// ============================================
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ============================================
// 2. ONBOARDING STACK - Shown after login
// ============================================
function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen}
        options={{ animationEnabled: false }}
      />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
    </Stack.Navigator>
  );
}

// ============================================
// 3. APP STACK - Main app screens after onboarding
// ============================================
function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: '#fff' },
      }}
    >
      {/* Main Tab Navigator */}
      <Stack.Screen 
        name="MainTabs" 
        component={BottomTabs}
        options={{ animationEnabled: false }}
      />

      {/* Modal screens - These appear over the tabs */}
      <Stack.Group
        screenOptions={{
          presentation: 'modal',
          animationEnabled: true,
          headerShown: false,
        }}
      >
        <Stack.Screen 
          name="Services" 
          component={ServicesScreen}
        />
        <Stack.Screen 
          name="TrustedContacts" 
          component={TrustedContactsScreen}
        />
        <Stack.Screen 
          name="EmergencyContactsModal" 
          component={EmergencyContactsScreen}
        />
        <Stack.Screen 
          name="HistoryModal" 
          component={EmergencyHistoryScreen}
        />
        <Stack.Screen 
          name="FakeCall" 
          component={FakeCallScreen}
        />
        <Stack.Screen 
          name="Disaster" 
          component={DisasterScreen}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
}

// ============================================
// 4. ROOT NAVIGATOR - Main entry point
// ============================================
export default function AppNavigator() {
  const { isAuthenticated, isOnboarded, isLoading } = useAuth();

  // Show loading screen while checking authentication state
  if (isLoading) {
    return (
      <NavigationContainer>
        <View 
          style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center', 
            backgroundColor: '#fff' 
          }}
        >
          <Text style={{ fontSize: 16, color: '#666' }}>Loading...</Text>
        </View>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
        }}
        // KEY: Force screen reset when authentication state changes
        // This ensures the navigation stack is completely rebuilt
        key={`nav-${isAuthenticated}-${isOnboarded}`}
      >
        {isAuthenticated ? (
          // User is logged in
          <>
            {!isOnboarded ? (
              // Show onboarding if not completed
              <Stack.Screen 
                name="OnboardingFlow" 
                component={OnboardingStack}
                options={{ animationEnabled: false }}
              />
            ) : (
              // Show main app
              <Stack.Screen 
                name="AppFlow" 
                component={AppStack}
                options={{ animationEnabled: false }}
              />
            )}
          </>
        ) : (
          // User is not logged in - show auth screens
          <Stack.Screen 
            name="AuthFlow" 
            component={AuthStack}
            options={{ animationEnabled: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
