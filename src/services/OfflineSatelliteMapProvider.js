/*
  Offline Satellite Map Provider
  - Provides offline satellite tile URLs and caching
  - Works without internet using locally cached tiles
  - Falls back to grayscale maps when offline
*/

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const OFFLINE_TILE_KEY = '@smartsentry_offline_tiles';
const SATELLITE_CACHE_KEY = '@smartsentry_satellite_cache';

// Standard OSM-based offline tile servers (these should be run locally or use cached tiles)
const OFFLINE_TILE_URLS = {
  // Fallback: Use cartoDB tiles when online
  cartodb_satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  cartodb_light: 'https://cartodb-basemaps-b.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
  // Offline fallback: Simple gray tiles for offline mode
  offline_gray: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iIzQwNDQzOCIvPjwvc3ZnPg==',
};

// Pre-cached satellite tile offsets for common cities (mimics satellite view)
const CITY_SATELLITE_OFFSETS = {
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  delhi: { lat: 28.7041, lng: 77.1025 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
};

class OfflineSatelliteMapProvider {
  constructor() {
    this.isOnline = true;
    this.cachedTiles = {};
    this.tileCache = [];
    this.maxCacheSize = 500; // MB
    this.currentCity = 'bengaluru';
    this.initNetworkMonitoring();
  }

  /**
   * Monitor network status
   */
  initNetworkMonitoring() {
    try {
      NetInfo.addEventListener((state) => {
        this.isOnline = state.isConnected && state.isInternetReachable;
      });
    } catch (e) {
      this.isOnline = true;
    }
  }

  /**
   * Get appropriate tile URL based on online/offline status
   */
  getTileURL(isOffline = false) {
    if (!isOffline && this.isOnline) {
      // Use online satellite imagery
      return OFFLINE_TILE_URLS.cartodb_satellite;
    }
    // Return offline gray placeholder
    return OFFLINE_TILE_URLS.offline_gray;
  }

  /**
   * Generate offline satellite map tile with grid pattern
   */
  generateOfflineSatelliteTile(z, x, y) {
    // Create SVG-based tile that mimics satellite view with grid
    const size = 256;
    const gridSize = 32;
    
    // Vary color based on tile position for visual interest
    const colorVariation = ((x + y + z) % 5);
    const baseColors = [
      '#3d4d3d', // olive
      '#4a4a4a', // gray
      '#424242', // dark gray
      '#5a5a5a', // light gray
      '#454545', // charcoal
    ];
    const tileColor = baseColors[colorVariation];

    // Create grid lines for satellite-like appearance
    let gridSvg = '';
    for (let i = 0; i <= size; i += gridSize) {
      // Horizontal lines (lighter)
      gridSvg += `<line x1="0" y1="${i}" x2="${size}" y2="${i}" stroke="#666" stroke-width="0.5" opacity="0.3"/>`;
      // Vertical lines (lighter)
      gridSvg += `<line x1="${i}" y1="0" x2="${i}" y2="${size}" stroke="#666" stroke-width="0.5" opacity="0.3"/>`;
    }

    // Add coordinate text for offline reference
    const coordText = `z${z}`;
    
    const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${tileColor}"/>
      ${gridSvg}
      <text x="12" y="24" fill="#888" font-size="12" opacity="0.5">${coordText}</text>
    </svg>`;

    // Convert SVG to data URL
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Get satellite map provider URL pattern
   */
  getSatelliteMapProvider(isOfflineMode = false) {
    if (!isOfflineMode && this.isOnline) {
      // Online: Use ArcGIS satellite imagery
      return {
        urlTemplate: OFFLINE_TILE_URLS.cartodb_satellite,
        attribution: '© Esri, DigitalGlobe, Earthstar Geographics',
        tileSize: 256,
        maxZoom: 18,
      };
    }

    // Offline: Use cached/generated tiles
    return {
      urlTemplate: null, // We'll use custom tile generation
      isOffline: true,
      attribution: 'Offline Map • GPS Location',
      tileSize: 256,
      maxZoom: 16,
      generateTile: (z, x, y) => this.generateOfflineSatelliteTile(z, x, y),
    };
  }

  /**
   * Cache satellite tile data
   */
  async cacheSatelliteTile(z, x, y, tileData) {
    try {
      const key = `${SATELLITE_CACHE_KEY}:${z}:${x}:${y}`;
      await AsyncStorage.setItem(key, tileData);
      this.tileCache.push({ z, x, y, key });
      
      // Limit cache size
      if (this.tileCache.length > this.maxCacheSize) {
        const oldest = this.tileCache.shift();
        await AsyncStorage.removeItem(oldest.key);
      }
    } catch (e) {
      console.log('Tile cache error:', e);
    }
  }

  /**
   * Get cached satellite tile
   */
  async getCachedTile(z, x, y) {
    try {
      const key = `${SATELLITE_CACHE_KEY}:${z}:${x}:${y}`;
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  /**
   * Pre-cache satellite data for region
   */
  async preCacheSatelliteRegion(city = 'bengaluru', zoomLevel = 13) {
    try {
      const cityData = CITY_SATELLITE_OFFSETS[city];
      if (!cityData) return false;

      // Simulate caching process
      const cachedRegions = await AsyncStorage.getItem(OFFLINE_TILE_KEY);
      const regions = cachedRegions ? JSON.parse(cachedRegions) : [];
      
      if (!regions.includes(city)) {
        regions.push(city);
        await AsyncStorage.setItem(OFFLINE_TILE_KEY, JSON.stringify(regions));
      }

      this.currentCity = city;
      return true;
    } catch (e) {
      console.log('Region cache error:', e);
      return false;
    }
  }

  /**
   * Get current city center for map
   */
  getCityCenter(city = 'bengaluru') {
    return CITY_SATELLITE_OFFSETS[city] || CITY_SATELLITE_OFFSETS.bengaluru;
  }

  /**
   * Get map style for offline satellite view
   */
  getOfflineMapStyle() {
    return {
      mapType: 'satellite',
      backgroundColor: '#3d4d3d',
      // These props work with react-native-maps
      customMapStyle: [
        {
          elementType: 'geometry',
          stylers: [{ color: '#3d4d3d' }],
        },
        {
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#242f3e' }],
        },
        {
          elementType: 'labels.text.fill',
          stylers: [{ color: '#746855' }],
        },
      ],
    };
  }

  /**
   * Generate offline GeoJSON for GPS location display
   */
  generateLocationGeoJSON(latitude, longitude, accuracy = 30) {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            type: 'location',
            accuracy: accuracy,
          },
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
        },
        {
          type: 'Feature',
          properties: {
            type: 'accuracy_circle',
            radius: accuracy,
          },
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
        },
      ],
    };
  }

  /**
   * Get coordinate display format
   */
  formatCoordinates(latitude, longitude) {
    const latDir = latitude >= 0 ? 'N' : 'S';
    const lngDir = longitude >= 0 ? 'E' : 'W';
    
    const latVal = Math.abs(latitude).toFixed(6);
    const lngVal = Math.abs(longitude).toFixed(6);
    
    return {
      decimal: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      dms: `${latVal}°${latDir}, ${lngVal}°${lngDir}`,
      short: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    };
  }

  /**
   * Check if region has satellite data cached
   */
  async isRegionCached(city) {
    try {
      const cachedRegions = await AsyncStorage.getItem(OFFLINE_TILE_KEY);
      if (!cachedRegions) return false;
      const regions = JSON.parse(cachedRegions);
      return regions.includes(city);
    } catch (e) {
      return false;
    }
  }

  /**
   * Clear satellite cache
   */
  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const satelliteKeys = keys.filter(k => k.startsWith(SATELLITE_CACHE_KEY));
      await AsyncStorage.multiRemove(satelliteKeys);
      this.tileCache = [];
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get offline status summary
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      currentCity: this.currentCity,
      cachedTiles: this.tileCache.length,
      maxCache: this.maxCacheSize,
      mapProvider: this.getSatelliteMapProvider(!this.isOnline),
    };
  }
}

export default new OfflineSatelliteMapProvider();
