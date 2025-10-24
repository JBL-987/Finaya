import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
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
    const response = await api.post('/auth/login', { email, password });
    const { access_token } = response.data;
    
    // Store token
    localStorage.setItem('token', access_token);
    
    // Get user info
    const userInfo = await authAPI.getCurrentUser();
    localStorage.setItem('user', JSON.stringify(userInfo));
    
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
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

  // Calculate complete analysis
  calculate: async (location, businessParams, screenshotBase64, screenshotMetadata) => {
    const response = await api.post('/analysis/calculate', {
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

// ============= Files API =============
export const filesAPI = {
  // Upload file
  upload: async (file, analysisId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (analysisId) {
      formData.append('analysis_id', analysisId);
    }

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get all files
  getAll: async () => {
    const response = await api.get('/files/');
    return response.data;
  },

  // Get file info
  getById: async (fileId) => {
    const response = await api.get(`/files/${fileId}`);
    return response.data;
  },

  // Download file
  download: async (fileId, filename) => {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Delete file
  delete: async (fileId) => {
    await api.delete(`/files/${fileId}`);
  },
};

export default api;