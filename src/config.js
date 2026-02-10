import { Platform } from 'react-native';

// Production Render backend URL (host only)
const RENDER_BACKEND = 'https://smartsensrty-backend.onrender.com';

// Allow overriding base URL via environment variable for release builds
// e.g. set API_BASE_URL=https://smartsensrty-backend.onrender.com/api
const ENV_API_BASE = process.env.API_BASE_URL;

// Determine BASE_URL used by frontend API calls
// Use __DEV__ so release builds (where __DEV__ is false) point to production backend
export const BASE_URL =
  ENV_API_BASE ||
  (!__DEV__
    ? `${RENDER_BACKEND}/api`
    : Platform.OS === 'android'
    ? 'http://192.168.1.4:5000/api' // Use correct host LAN IP for Android emulator
    : 'http://localhost:5000/api');

// SERVER_HOST is used to build absolute URLs for uploaded assets
export const SERVER_HOST =
  process.env.SERVER_HOST ||
  (ENV_API_BASE ? ENV_API_BASE.replace(/\/api\/?$/, '') :
    process.env.NODE_ENV === 'production'
      ? RENDER_BACKEND
      : Platform.OS === 'android'
      ? 'http://192.168.1.4:5000' // Use correct host LAN IP for Android emulator
      : 'http://localhost:5000');

export default { BASE_URL, SERVER_HOST };
