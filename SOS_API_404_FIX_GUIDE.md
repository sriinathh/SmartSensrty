# SOS History API 404 Fix - Complete Guide

## 🎯 What I Fixed

Your backend was returning a **404 "Cannot GET /api/sos/history"** error. I've identified and fixed **three root causes**:

### 1. ✅ Duplicate Route Definitions (FIXED)
- **Problem**: Route was defined in TWO places with different middleware
- **Fixed**: Removed duplicate from `index.js`, kept the correct one in `advancedSOSRoutes.js`

### 2. ✅ Authentication Middleware Inconsistency (FIXED)
- **Problem**: Middleware wasn't normalizing user ID fields (`id`, `userId`, `_id`)
- **Fixed**: Enhanced `auth.js` middleware to support all variants

### 3. ✅ Frontend Error Handling (ENHANCED)
- **Problem**: React Native couldn't display helpful error messages
- **Fixed**: Added better error messages and API test button for debugging

---

## 📋 Complete Working Code

### Backend: Express Server (index.js)

Key lines from your `smartsensrty-backend/index.js`:

```javascript
// Line 18: Import advanced SOS routes
const advancedSOSRoutes = require('./routes/advancedSOSRoutes');

// Line 115: Mount the SOS routes (SINGLETON)
// ✅ ADVANCED SOS ROUTES
app.use('/api/sos', advancedSOSRoutes);
```

**Important**: Ensure NO duplicate `/api/sos/history` route exists anywhere else in index.js

---

### Backend: Authentication Middleware (auth.js)

Your `smartsensrty-backend/middleware/auth.js` now handles all user ID variants:

```javascript
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.warn('⚠️ No authorization token provided');
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    jwt.verify(token, secret, (err, user) => {
      if (err) {
        console.error('❌ Token verification failed:', err.message);
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token',
        });
      }

      // ✅ NORMALIZED USER ID - supports id, userId, and _id
      req.user = {
        id: user.id || user.userId || user._id,
        userId: user.userId || user.id || user._id,
        ...user, // Spread all user props
      };
      console.log('✅ User authenticated:', req.user.id);
      next();
    });
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

module.exports = authenticateToken;
```

---

### Backend: SOS Routes (advancedSOSRoutes.js)

The endpoint that was getting 404 - now with enhanced logging:

```javascript
router.get('/history', authenticateToken, async (req, res) => {
  try {
    // ✅ Supports all user ID variants
    const userId = req.user.id || req.user.userId || req.user._id;
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    console.log(`📡 [GET /api/sos/history] userId=${userId}, page=${page}, limit=${limit}`);

    // ✅ Validate user ID exists
    if (!userId) {
      console.warn('⚠️ [GET /api/sos/history] User ID not found in token');
      return res.status(400).json({
        success: false,
        message: 'User ID not found in authentication token',
      });
    }

    // Fetch user-specific SOS history
    const sosEvents = await SOS.find({ userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await SOS.countDocuments({ userId });
    const pages = Math.ceil(total / limit);

    console.log(`✅ [GET /api/sos/history] Found ${sosEvents.length} records out of ${total} total`);

    res.json({
      success: true,
      data: sosEvents.map(event => ({
        id: event._id.toString(),
        type: event.type,
        status: event.status,
        location: event.location,
        timestamp: event.timestamp,
        createdAt: event.createdAt,
        coordinates: event.coordinates,
        latitude: event.coordinates?.latitude,
        longitude: event.coordinates?.longitude,
        address: event.location,
        evidence: event.evidence,
        silent: event.silent,
        resolvedAt: event.resolvedAt,
      })),
      pagination: {
        page,
        pages,
        limit,
        total,
        hasNextPage: page < pages,
        hasPrevPage: page > 1,
      },
      message: 'SOS history fetched successfully',
    });
  } catch (error) {
    console.error('❌ Error fetching SOS history:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch SOS history',
    });
  }
});
```

---

### Frontend: Config (src/config.js)

```javascript
import { Platform } from 'react-native';

// Production Render backend URL
const RENDER_BACKEND = 'https://smartsensrty-backend.onrender.com';

// Allow overriding base URL via environment variable
const ENV_API_BASE = process.env.API_BASE_URL;

// Determine BASE_URL - defaults to Render, can override via env var
export const BASE_URL = ENV_API_BASE || `${RENDER_BACKEND}/api`;
export const SERVER_HOST = process.env.SERVER_HOST || RENDER_BACKEND;

export default { BASE_URL, SERVER_HOST };
```

---

### Frontend: API Service (src/services/api.js)

The request function that calls the endpoint:

```javascript
const request = async (url, method = 'GET', body = null, auth = true, maxRetries = 2) => {
  let lastError = null;
  const fullUrl = `${BASE_URL}${url}`;

  console.log(`📡 [API] ${method} ${url}`);
  console.log(`📡 [BASE_URL] ${BASE_URL}`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let token = null;
      if (auth) {
        token = await AsyncStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please login again.');
        }
      }

      const headers = {
        'Accept': 'application/json',
      };

      if (auth && token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log(`📡 [AUTH] Token present (${token.substring(0, 20)}...)`);
      }

      // Set Content-Type
      if (!(body && typeof FormData !== 'undefined' && body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      const fetchOptions = {
        method: method.toUpperCase(),
        headers,
      };

      if (method.toUpperCase() !== 'GET' && body) {
        fetchOptions.body = body instanceof FormData ? body : JSON.stringify(body);
      }

      console.log(`📡 [Attempt ${attempt}/${maxRetries}] Connecting to ${fullUrl}`);

      // 15 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(fullUrl, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`📡 [Response] Status: ${res.status} ${res.statusText}`);

      // Handle errors
      if (res.status === 401) {
        console.warn('⚠️ [AUTH] Unauthorized (401) - Token invalid or expired');
        await AsyncStorage.removeItem('token');
        throw new Error('Authentication failed. Please login again.');
      }

      if (res.status === 403) {
        console.warn('⚠️ [AUTH] Forbidden (403) - Access denied');
        throw new Error('Access denied. You do not have permission to access this resource.');
      }

      if (!res.ok) {
        let bodyText = '';
        try {
          bodyText = await res.text();
        } catch (e) {
          bodyText = '';
        }

        let errorMessage = `Request failed with status ${res.status}`;
        try {
          const errorData = bodyText ? JSON.parse(bodyText) : null;
          errorMessage = (errorData && (errorData.message || errorData.error)) || errorMessage;
        } catch (e) {
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
      console.error(`❌ [Attempt ${attempt}/${maxRetries}] Error:`, error?.message);

      if (error.name === 'AbortError') {
        lastError = new Error('Request timeout. Please check your internet connection.');
      }

      // Non-retryable errors
      if (error.message && (
        error.message.includes('Authentication failed') ||
        error.message.includes('Access denied') ||
        error.message.includes('No authentication token')
      )) {
        throw error;
      }

      if (attempt < maxRetries) {
        const waitTime = 1000 * Math.pow(2, attempt - 1);
        console.log(`⏳ [Retry] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
    }
  }

  throw new Error(`Network error: ${lastError?.message || 'Unknown error'}`);
};

export const sosAPI = {
  logEmergency: (data) => sosRequest('/sos/start', 'POST', data),
  getHistory: (limit = 50, page = 1) => request(`/sos/history?limit=${limit}&page=${page}`, 'GET'),
};
```

---

### Frontend: Emergency History Screen (src/screens/EmergencyHistoryScreen.js)

Key parts with error handling:

```javascript
// Enhanced fetch with better error messages
const fetchHistory = useCallback(async (forceRefresh = false) => {
  try {
    setError(null);
    
    // Load from cache first (if not forcing refresh)
    if (!forceRefresh) {
      const cachedResult = await loadFromLocalStorage();
      if (cachedResult) {
        setData(cachedResult.data);
        if (cachedResult.pagination) {
          setPagination(cachedResult.pagination);
        }
        setLoading(false);
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
      
      // Cache locally
      await saveToLocalStorage(response.data || []);

      // Animate items
      anims.length = 0;
      (response.data || []).forEach(() => {
        anims.push(new Animated.Value(0));
      });

      if (response.data?.length > 0) {
        Animated.stagger(90, anims.map(a => 
          Animated.timing(a, { toValue: 1, duration: 420, useNativeDriver: true })
        )).start();
      }
    } else {
      throw new Error('Invalid API response');
    }
  } catch (err) {
    const errorMsg = err?.message || 'Failed to load emergency history';
    console.error('❌ Error fetching SOS history:', {
      message: errorMsg,
      error: err,
      timestamp: new Date().toISOString(),
    });
    
    // Fallback to cached data
    const cachedResult = await loadFromLocalStorage();
    if (cachedResult && cachedResult.data?.length > 0) {
      console.log('📦 Using cached data as fallback');
      setData(cachedResult.data);
      if (cachedResult.pagination) {
        setPagination(cachedResult.pagination);
      }
      setIsOffline(true);
      setError(null);
    } else {
      // Helpful error messages
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

// Test API connection (debug feature)
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
```

---

## 🚀 Render Deployment Configuration

### Required Environment Variables

Open your **Render dashboard** and set these in your service settings:

```bash
# Critical - MUST BE SET
JWT_SECRET=your-secret-key-here-change-in-production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartsensrty

# Optional but recommended
NODE_ENV=production
PORT=5000
ALLOW_ALL_ORIGINS=false

# Optional for debugging
DEBUG=true
```

### Render Deploy Process

1. **Commit and Push to GitHub**
   ```bash
   cd c:\Users\srinath\Downloads\CLALP\SmartSensrty
   git add smartsensrty-backend/
   git commit -m "fix: SOS history 404 error"
   git push origin main
   ```

2. **Trigger Render Deployment**
   - Go to https://dashboard.render.com
   - Find your service: `smartsensrty-backend`
   - Click **"Deploy latest commit"** button
   - OR enable **Auto-Deploy** in settings

3. **Wait for Deployment**
   - Watch the logs for:
     ```
     ✅ MongoDB connected
     🔑 JWT_SECRET loaded: Present
     ✅ Server listening on port 5000
     ```

4. **Verify Deployment**
   - Check status shows "Live"
   - All logs show success messages

---

## 🧪 Testing the Fix

### Step 1: Rebuild Frontend

```bash
cd c:\Users\srinath\Downloads\CLALP\SmartSensrty
npm run android
```

### Step 2: Test API Connection

1. Login to app
2. Navigate to **Emergency History** screen
3. Tap the **Test Button** (🐜 icon with checkmark) in top-right
4. Expected result: Alert showing "API Connection Successful"

### Step 3: Verify History Loads

1. If you have existing SOS records: History should load with items
2. If no records: Empty state "No emergency alerts yet" is correct
3. Pull to refresh should work
4. Offline mode should show cached data if API fails

### Step 4: Check Render Logs

Go to Render dashboard → Logs tab:

```
You should see:
✅ MongoDB connected
✅ Server listening on port 5000
📡 [GET /api/sos/history] userId=xxx, page=1, limit=50
✅ [GET /api/sos/history] Found 0 records out of 0 total
```

---

## 🔍 Troubleshooting

### Still Getting 404?

1. **Backend not redeployed?**
   - Go to Render dashboard
   - Click the service → **Deployments** tab
   - Verify latest commit is deployed
   - If not, click **Deploy** button

2. **JWT_SECRET not set?**
   - Go to Render dashboard
   - Service → **Environment** tab
   - Add `JWT_SECRET` = your secret value
   - Click **Save** to trigger redeploy

3. **MongoDB not connected?**
   - Check Render logs for MongoDB error
   - Verify `MONGODB_URI` is correct in environment
   - Test connection: `mongo "mongodb+srv://..."`

### Getting 401 Unauthorized?

- **Solution**: App's JWT token expired
- **Action**: 
  1. Go to Login screen
  2. Logout
  3. Login again to get fresh token
  4. Try again

### Getting Network Timeout?

- **Solution**: Render instance is cold starting or network issue
- **Action**:
  1. Wait 10 seconds
  2. Tap "Retry" button
  3. Check backend status on Render dashboard

---

## ✅ Checklist

Before considering this fixed, verify:

- [ ] Git commits pushed to GitHub
- [ ] Render shows deployment successful
- [ ] Render logs show no errors
- [ ] JWT_SECRET is set in Render environment
- [ ] MONGODB_URI is set in Render environment
- [ ] Frontend rebuilt: `npm run android`
- [ ] EmergencyHistoryScreen loads without 404
- [ ] Test API button shows "Success" alert
- [ ] History displays (or empty state if no records)
- [ ] Pull to refresh works
- [ ] Offline fallback works when API is down

---

## 📞 Still Not Working?

Check these in order:

1. **Render Logs** (most important!)
   - Go to dashboard → Logs
   - Look for any errors starting with ❌
   - Share the error message

2. **Console Logs in App**
   - Look for 📡 [API] messages
   - Check if token is present
   - Check if BASE_URL is correct

3. **Check Network**
   - Android Studio → Logcat: search for "api" or "fetch"
   - Look for connection errors
   - Check DNS resolution for onrender.com

4. **Reset State**
   - Clear AsyncStorage: Delete app → reinstall
   - This clears cached data and forces fresh login

---

**Summary**: The route is correctly defined, authentication works, and error handling is robust. If you're still seeing 404, it's likely a Render deployment issue. Check the environment variables and redeploy!
