import axios from 'axios';
import logger from '../utils/logger';

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_BASE_URL || 'https://finaya-production-f6f2.up.railway.app/api/v1';
  
  // Check if we are in production (Vercel) but using localhost
  if (import.meta.env.PROD && url.includes('localhost')) {
    logger.error('CRITICAL: API URL is pointing to localhost in production!', url);
    // Alert the user so they know why it's failing
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        alert(
          "CONFIGURATION ERROR: The VITE_API_BASE_URL environment variable is missing in your Vercel settings!\n\n" +
          "Your app is trying to connect to 'localhost', which prevents it from working in production due to security blocking (Mixed Content).\n\n" +
          "Please go to your Vercel Dashboard -> Settings -> Environment Variables and add:\n" +
          "VITE_API_BASE_URL=" + "https://your-railway-backend-url.app/api/v1"
        );
      }, 1000);
    }
  }
  return url;
};

const API_BASE_URL = getBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add Firebase ID Token from current user
api.interceptors.request.use(
  async (config) => {
    // Try to get Firebase ID token from current user
    try {
      const { firebaseAuth } = await import('./firebase');
      const idToken = await firebaseAuth.getIdToken();
      
      if (idToken) {
        config.headers.Authorization = `Bearer ${idToken}`;
        return config;
      }
    } catch (error) {
      logger.log('No Firebase user, checking localStorage token');
    }
    
    // Fallback to localStorage token (for backward compatibility)
    const token = localStorage.getItem('access_token');
    if (token && token.trim()) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      // Let the application handle authentication state changes
      // avoiding forced reloads that can cause infinite loops
    }
    return Promise.reject(error);
  }
);

// ============= Auth API =============
export const authAPI = {
  register: async (email, password, fullName) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      full_name: fullName,
    });
    return response.data;
  },

  login: async (email, password) => {
    const loginFormData = new URLSearchParams();
    loginFormData.append('username', email);
    loginFormData.append('password', password);
    const response = await api.post('/auth/login', loginFormData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    // Store token in localStorage
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  firebaseLogin: async (email, firebaseToken) => {
    const response = await api.post('/auth/firebase-login', {
      email,
      firebase_token: firebaseToken
    });
    // Store token in localStorage
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  logout: async () => {
    localStorage.removeItem('access_token');
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      logger.error('Failed to get current user:', error);
      return null;
    }
  },

  getCurrencyPreferences: async () => {
    try {
      const response = await api.get('/auth/currency-preferences');
      return response.data;
    } catch (error) {
      logger.error('Failed to get currency preferences:', error);
      return { success: false, preferences: {} };
    }
  },

  updateCurrencyPreferences: async (preferences) => {
    try {
      const response = await api.put('/auth/currency-preferences', preferences);
      return response.data;
    } catch (error) {
      logger.error('Failed to update currency preferences:', error);
      return { success: false };
    }
  },
};


// ============= Analysis API =============
export const analysisAPI = {
  // AI analyze image
  aiAnalyze: async (imageBase64, imageMetadata) => {
    const response = await api.post('/analysis/ai-analyze', {
      image_base64: imageBase64,
      image_metadata: imageMetadata,
    });
    return response.data;
  },

  // Calculate complete analysis (with auto-save)
  calculate: async (location, businessParams, screenshotBase64, screenshotMetadata) => {
    const response = await api.post('/analysis/calculate', {
      location,
      business_params: businessParams,
      screenshot_base64: screenshotBase64,
      screenshot_metadata: screenshotMetadata,
    });
    return response.data;
  },

  // Analyze only (without saving to database)
  analyze: async (location, businessParams, screenshotBase64, screenshotMetadata) => {
    const response = await api.post('/analysis/analyze', {
      location,
      business_params: businessParams,
      screenshot_base64: screenshotBase64,
      screenshot_metadata: screenshotMetadata,
    });
    return response.data;
  },

  // Save analysis result
  save: async (analysisData) => {
    // Check for guest mode
    const token = localStorage.getItem('access_token');
    if (token === 'guest-token') {
      logger.log('Guest mode: Saving to localStorage');
      const savedAnalyses = JSON.parse(localStorage.getItem('guest_analyses') || '[]');
      
      const newAnalysis = {
        ...analysisData,
        id: `guest_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'guest_user_123'
      };
      
      savedAnalyses.push(newAnalysis);
      localStorage.setItem('guest_analyses', JSON.stringify(savedAnalyses));
      
      return newAnalysis;
    }

    const response = await api.post('/analysis/', analysisData);
    return response.data;
  },

  // Get all analysis results (paginated)
  getAll: async (offset = 0, limit = 10) => {
    // Check for guest mode
    const token = localStorage.getItem('access_token');
    if (token === 'guest-token') {
       logger.log('Guest mode: Fetching from localStorage');
       const savedAnalyses = JSON.parse(localStorage.getItem('guest_analyses') || '[]');
       
       // Sort by date desc
       savedAnalyses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
       
       // Manual pagination
       const paginatedItems = savedAnalyses.slice(offset, offset + limit);
       
       return {
         items: paginatedItems,
         total: savedAnalyses.length,
         page: Math.floor(offset / limit) + 1,
         size: limit
       };
    }

    const response = await api.get('/analysis/', {
      params: { offset, limit },
    });
    return response.data;
  },

  // Get specific analysis
  getById: async (analysisId) => {
    // Check for guest mode
    const token = localStorage.getItem('access_token');
    if (token === 'guest-token') {
        const savedAnalyses = JSON.parse(localStorage.getItem('guest_analyses') || '[]');
        const analysis = savedAnalyses.find(a => a.id === analysisId);
        if (!analysis) throw new Error("Analysis not found");
        return analysis;
    }

    const response = await api.get(`/analysis/${analysisId}`);
    return response.data;
  },

  // Update analysis
  update: async (analysisId, updateData) => {
      // Check for guest mode
    const token = localStorage.getItem('access_token');
    if (token === 'guest-token') {
        const savedAnalyses = JSON.parse(localStorage.getItem('guest_analyses') || '[]');
        const index = savedAnalyses.findIndex(a => a.id === analysisId);
        
        if (index === -1) throw new Error("Analysis not found");
        
        savedAnalyses[index] = {
            ...savedAnalyses[index],
            ...updateData,
            updated_at: new Date().toISOString()
        };
        
        localStorage.setItem('guest_analyses', JSON.stringify(savedAnalyses));
        return savedAnalyses[index];
    }
    
    const response = await api.patch(`/analysis/${analysisId}`, updateData);
    return response.data;
  },

  // Delete analysis
  delete: async (analysisId) => {
    // Check for guest mode
    const token = localStorage.getItem('access_token');
    if (token === 'guest-token') {
        let savedAnalyses = JSON.parse(localStorage.getItem('guest_analyses') || '[]');
        savedAnalyses = savedAnalyses.filter(a => a.id !== analysisId);
        localStorage.setItem('guest_analyses', JSON.stringify(savedAnalyses));
        return;
    }

    await api.delete(`/analysis/${analysisId}`);
  },
};

// ============= Agent API =============
export const agentAPI = {
  getAdvice: async (query, contextData, history = []) => {
    const response = await api.post('/agent/advise', {
      query: query,
      context_data: contextData,
      history: history
    });
    return response.data;
  },

  exploreNearby: async (lat, lng, businessParams) => {
    const response = await api.post('/agent/explore', {
      lat,
      lng,
      business_params: businessParams,
    });
    return response.data;
  },
};

// ============= Places API =============
export const placesAPI = {
  getCompetitors: async (lat, lng, radius = 1000, osmFilter = '["amenity"~"cafe"]') => {
    const maxRetries = 3;
    const timeouts = [20000, 30000, 45000]; // Progressive timeout
    const delays = [2000, 4000]; // Delay between retries
    
    // Server Failover List
    const servers = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://lz4.overpass-api.de/api/interpreter'
    ];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Round robin server selection
        const serverUrl = servers[attempt % servers.length];
        
        // Use 'out center' to get coordinates for Ways (buildings) too
        const query = `
          [out:json][timeout:${Math.floor(timeouts[attempt] / 1000)}];
          (
            node(around:${radius},${lat},${lng})${osmFilter};
            way(around:${radius},${lat},${lng})${osmFilter};
          );
          out center;
        `;
        
        // Use direct axios, not the configured 'api' instance
        const response = await axios.post(serverUrl, query, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: timeouts[attempt]
        });

        const data = response.data;
        if (!data || !data.elements) return [];

        return data.elements.map(el => {
          const latitude = el.lat || el.center?.lat;
          const longitude = el.lon || el.center?.lon;
          const type = el.tags?.amenity || el.tags?.shop || el.tags?.leisure || el.tags?.tourism || "Business";
          
          // Better fallback name if 'name' tag is missing
          let name = el.tags?.name || el.tags?.brand;
          if (!name) {
             name = `Unnamed ${type.charAt(0).toUpperCase() + type.slice(1)}`;
          }
          
          // Simulate rating for demo purposes since Overpass doesn't provide it
          const simulatedRating = (3.5 + Math.random() * 1.4).toFixed(1); // 3.5 - 4.9
          const simulatedReviews = Math.floor(Math.random() * 300) + 5;
          
          return {
            lat: latitude,
            lng: longitude,
            name: name,
            vicinity: el.tags?.["addr:street"] ? `${el.tags["addr:street"]} (${type})` : type,
            rating: simulatedRating,
            user_ratings_total: simulatedReviews
          };
        }).filter(item => item.lat && item.lng);

      } catch (error) {
        logger.warn(`Overpass attempt ${attempt + 1}/${maxRetries} failed:`, error.message);
        
        // If this was the last attempt, give up gracefully
        if (attempt === maxRetries - 1) {
          logger.error('All Overpass retries failed. Continuing without competitor data.');
          return []; // Return empty instead of throwing
        }
        
        // Wait before retry
        if (delays[attempt]) {
          await new Promise(resolve => setTimeout(resolve, delays[attempt]));
        }
      }
    }
    
    return []; // Fallback
  },
};

export default api;
