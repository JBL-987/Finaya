import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

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
      console.log('No Firebase user, checking localStorage token');
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
      console.error('Failed to get current user:', error);
      return null;
    }
  },

  getCurrencyPreferences: async () => {
    try {
      const response = await api.get('/auth/currency-preferences');
      return response.data;
    } catch (error) {
      console.error('Failed to get currency preferences:', error);
      return { success: false, preferences: {} };
    }
  },

  updateCurrencyPreferences: async (preferences) => {
    try {
      const response = await api.put('/auth/currency-preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Failed to update currency preferences:', error);
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
    const response = await api.post('/analysis/', analysisData);
    return response.data;
  },

  // Get all analysis results (paginated)
  getAll: async (offset = 0, limit = 10) => {
    const response = await api.get('/analysis/', {
      params: { offset, limit },
    });
    return response.data;
  },

  // Get specific analysis
  getById: async (analysisId) => {
    const response = await api.get(`/analysis/${analysisId}`);
    return response.data;
  },

  // Update analysis
  update: async (analysisId, updateData) => {
    const response = await api.patch(`/analysis/${analysisId}`, updateData);
    return response.data;
  },

  // Delete analysis
  delete: async (analysisId) => {
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
        console.warn(`Overpass attempt ${attempt + 1}/${maxRetries} failed:`, error.message);
        
        // If this was the last attempt, give up gracefully
        if (attempt === maxRetries - 1) {
          console.error('All Overpass retries failed. Continuing without competitor data.');
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
