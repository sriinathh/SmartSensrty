import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { BASE_URL, SERVER_HOST } from '../config';

/**
 * IMPORTANT:
 * - Real Android Phone  → use PC LAN IP
 * - Android Emulator   → 10.0.2.2
 * - __DEV__ must NOT be used for this decision
 */

// `BASE_URL` and `SERVER_HOST` provided by `src/config.js` for production vs dev

/**
 * Construct absolute image URL from relative path
 * @param {string} relativePath - Path like '/uploads/profile_images/filename.jpg'
 * @returns {string} Absolute URL
 */
export const getAbsoluteImageURL = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath; // Already absolute
  }
  return `${SERVER_HOST}${relativePath}`;
};

/**
 * Enhanced request function with retry logic and comprehensive error handling
 * Supports cross-device login and multi-network scenarios
 */
const request = async (url, method = 'GET', body = null, auth = true, maxRetries = 2) => {
  let lastError = null;
  const fullUrl = `${BASE_URL}${url}`;

  // Log for debugging cross-device issues
  console.log(`📡 [API] ${method} ${url}`);
  console.log(`📡 [BASE_URL] ${BASE_URL}`);
  console.log(`📡 [PLATFORM] ${Platform.OS}`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let token = null;
      if (auth) {
        token = await AsyncStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please login again.');
        }
      }

      // If body is FormData (file upload), let fetch set Content-Type (multipart)
      const isFormData = body && typeof FormData !== 'undefined' && body instanceof FormData;

      const headers = {
        'Accept': 'application/json',
      };

      // Add Authorization header only if token exists and auth is required
      if (auth && token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log(`📡 [AUTH] Token present (${token.substring(0, 20)}...)`);
      }

      // Only set Content-Type for non-FormData requests
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      const fetchOptions = {
        method: method.toUpperCase(),
        headers,
      };

      // Add body for non-GET requests
      if (method.toUpperCase() !== 'GET' && body) {
        fetchOptions.body = isFormData ? body : JSON.stringify(body);
      }

      console.log(`📡 [Attempt ${attempt}/${maxRetries}] Connecting to ${fullUrl}`);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const res = await fetch(fullUrl, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`📡 [Response] Status: ${res.status} ${res.statusText}`);

      // Handle different response status codes
      if (res.status === 401) {
        // Token is invalid/expired - clear stored token and throw specific error
        console.warn('⚠️ [AUTH] Unauthorized (401) - Token invalid or expired');
        await AsyncStorage.removeItem('token');
        throw new Error('Authentication failed. Please login again.');
      }

      if (res.status === 403) {
        console.warn('⚠️ [AUTH] Forbidden (403) - Access denied');
        throw new Error('Access denied. You do not have permission to access this resource.');
      }

      if (!res.ok) {
        // Read response body as text for better diagnostics
        let bodyText = '';
        try {
          bodyText = await res.text();
        } catch (e) {
          bodyText = '';
        }

        // Try to parse JSON error message if present
        let errorMessage = `Request failed with status ${res.status}`;
        try {
          const errorData = bodyText ? JSON.parse(bodyText) : null;
          errorMessage = (errorData && (errorData.message || errorData.error)) || errorMessage;
        } catch (e) {
          // Not JSON, fall back to body text or statusText
          errorMessage = bodyText || res.statusText || errorMessage;
        }

        console.error('❌ [API Error]', {
          url: fullUrl,
          method: fetchOptions.method,
          status: res.status,
          statusText: res.statusText,
          errorMessage,
        });

        throw new Error(errorMessage);
      }

      // Parse response
      const contentType = res.headers.get('content-type');
      const responseData = contentType && contentType.includes('application/json')
        ? await res.json()
        : await res.text();

      console.log(`✅ [Success] ${method} ${url}`);
      return responseData;

    } catch (error) {
      lastError = error;

      console.error(`❌ [Attempt ${attempt}/${maxRetries}] Error:`, {
        message: error?.message || String(error),
        name: error?.name,
        url: fullUrl,
      });

      if (error.name === 'AbortError') {
        lastError = new Error('Request timeout. Please check your internet connection.');
      }

      // Re-throw non-retryable errors immediately
      if (error.message && (
        error.message.includes('Authentication failed') ||
        error.message.includes('Access denied') ||
        error.message.includes('No authentication token')
      )) {
        throw error;
      }

      // For network errors, retry on attempt < maxRetries
      if (attempt < maxRetries) {
        const waitTime = 1000 * Math.pow(2, attempt - 1); // Exponential backoff: 1s, 2s, 4s...
        console.log(`⏳ [Retry] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue; // Retry
      }
    }
  }

  // All retries failed
  console.error('❌ [FINAL ERROR] All retries exhausted:', lastError?.message);

  if (lastError?.name === 'AbortError') {
    throw new Error('Request timeout. Please check your internet connection.');
  }

  if (lastError?.message?.includes('Authentication failed') ||
      lastError?.message?.includes('Access denied')) {
    throw lastError;
  }

  throw new Error(`Network error: ${lastError?.message || 'Unknown error'}`);
};

/* ===================== AUTH APIs ===================== */

export const authAPI = {
  register: (data) => request('/auth/register', 'POST', data, false),

  login: async (data) => {
    const res = await request('/auth/login', 'POST', data, false);
    // Note: Token storage is handled in LoginScreen.js to avoid duplication
    return res;
  },

  googleSignIn: (data) => request('/auth/google', 'POST', data, false),

  loadToken: () => AsyncStorage.getItem('token'),

  logout: async () => {
    await AsyncStorage.removeItem('token');
  },
};

/* ===================== PROFILE APIs ===================== */

export const profileAPI = {
  get: () => request('/profile', 'GET'),
  update: (data) => request('/profile', 'PUT', data),
};

/* ===================== CONTACT APIs ===================== */

export const contactsAPI = {
  getAll: () => request('/contacts', 'GET'),
  add: (data) => request('/contacts', 'POST', data),
  update: (id, data) => request(`/contacts/${id}`, 'PUT', data),
  delete: (id) => request(`/contacts/${id}`, 'DELETE'),
};

/* ===================== SOS APIs ===================== */

// SOS-specific request with shorter timeout (5s) since native SMS/Call is primary
const sosRequest = async (url, method = 'POST', body = null) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No auth token');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for SOS

    const res = await fetch(`${BASE_URL}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    // Quiet logging for SOS - we handle this at UI level
    console.warn('SOS API:', error.message || 'Failed');
    throw error;
  }
};

export const sosAPI = {
  logEmergency: (data) => sosRequest('/sos/start', 'POST', data),
  getHistory: (limit = 50, page = 1) => request(`/sos/history?limit=${limit}&page=${page}`, 'GET'),
};

/* ===================== EVIDENCE APIs ===================== */

export const evidenceAPI = {
  // Get all evidence for current user with pagination
  getAll: (limit = 20, page = 1) => request(`/evidence/user/all?limit=${limit}&page=${page}`, 'GET'),
  
  // Get evidence for specific SOS
  getBySOSId: (sosId) => request(`/evidence/sos/${sosId}`, 'GET'),
  
  // Share evidence with authorities
  share: (evidenceId, shareWith) => request(`/evidence/${evidenceId}/share`, 'PUT', { shareWith }),
  
  // Upload evidence files
  upload: (sosId, type, location, files) => {
    const form = new FormData();
    form.append('sosId', sosId);
    form.append('type', type);
    form.append('location', JSON.stringify(location));
    
    if (files && files.length > 0) {
      files.forEach((file, index) => {
        form.append('evidence', file);
      });
    }
    
    return request('/evidence/upload', 'POST', form);
  },
};

/* ===================== CHAT APIs ===================== */

// Offline fallback responses for chatbot
const OFFLINE_RESPONSES = {
  help: "If you're in immediate danger, use the SOS feature by tapping any emergency card. Stay calm and find a safe location.",
  emergency: "For emergencies: 1) Stay calm 2) Find safety 3) Use SOS feature 4) Your contacts will be notified.",
  sos: "Tap any emergency card on the home screen to trigger SOS. Your trusted contacts will receive SMS with your location.",
  location: "Your location is shared only during active SOS alerts. Toggle location in Profile settings.",
  contact: "Add trusted contacts from the Trusted Contacts section. They'll be notified during emergencies.",
  default: "I'm offline but can help with safety basics. Ask about SOS, emergency procedures, or contacts."
};

const getOfflineResponse = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes('help') || lower.includes('danger')) return OFFLINE_RESPONSES.help;
  if (lower.includes('emergency')) return OFFLINE_RESPONSES.emergency;
  if (lower.includes('sos')) return OFFLINE_RESPONSES.sos;
  if (lower.includes('location') || lower.includes('gps')) return OFFLINE_RESPONSES.location;
  if (lower.includes('contact') || lower.includes('family')) return OFFLINE_RESPONSES.contact;
  return OFFLINE_RESPONSES.default;
};

export const chatAPI = {
  sendMessage: async (message, context = {}) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        // Return offline response if no token
        return {
          response: getOfflineResponse(message),
          offline: true,
          model: 'offline'
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for chat

      const res = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message, context }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      console.log('Chat API offline:', error.message);
      // Return offline fallback
      return {
        response: getOfflineResponse(message),
        offline: true,
        model: 'offline'
      };
    }
  },
};

export const debugAuth = {
  // Check if token exists and is valid
  checkToken: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('🔍 TOKEN DEBUG:');
      console.log('  - Token exists:', !!token);
      console.log('  - Token length:', token ? token.length : 0);
      if (token) {
        console.log('  - Token preview:', `${token.substring(0, 20)}...`);
        // Decode JWT payload (without verification)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('  - Token payload:', payload);
          console.log('  - Token expires:', new Date(payload.exp * 1000));
          console.log('  - Token expired:', Date.now() > payload.exp * 1000);
        } catch (e) {
          console.log('  - Could not decode token payload');
        }
      }
      return token;
    } catch (error) {
      console.error('❌ Token check failed:', error);
      return null;
    }
  },

  // Test API call with current token
  testProfileAPI: async () => {
    try {
      console.log('🧪 TESTING PROFILE API...');
      const result = await profileAPI.get();
      console.log('✅ Profile API test successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Profile API test failed:', error);
      return null;
    }
  },

  // Test contacts API
  testContactsAPI: async () => {
    try {
      console.log('🧪 TESTING CONTACTS API...');
      const result = await contactsAPI.getAll();
      console.log('✅ Contacts API test successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Contacts API test failed:', error);
      return null;
    }
  },

  // Clear all auth data
  clearAuth: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('profileData');
      await AsyncStorage.removeItem('contactsData');
      await AsyncStorage.removeItem('authProvider');
      console.log('🧹 Auth data cleared');
    } catch (error) {
      console.error('❌ Failed to clear auth data:', error);
    }
  },

  // Full authentication test
  testFullAuth: async () => {
    console.log('🔐 FULL AUTHENTICATION TEST');
    console.log('================================');

    // Check token
    const token = await debugAuth.checkToken();
    if (!token) {
      console.log('❌ No token found');
      return false;
    }

    // Test profile API
    const profileResult = await debugAuth.testProfileAPI();
    if (!profileResult) {
      console.log('❌ Profile API failed');
      return false;
    }

    // Test contacts API
    const contactsResult = await debugAuth.testContactsAPI();
    if (!contactsResult) {
      console.log('❌ Contacts API failed');
      return false;
    }

    console.log('✅ All authentication tests passed!');
    return true;
  }
};
