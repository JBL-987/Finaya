import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add JWT from localStorage
api.interceptors.request.use(
  (config) => {
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

// ============= Accounting API =============
export const accountingAPI = {
  // Create transaction
  createTransaction: async (transactionData) => {
    const response = await api.post('/accounting/transactions', transactionData);
    return response.data;
  },

  // Get all transactions
  getTransactions: async () => {
    const response = await api.get('/accounting/transactions');
    return response.data;
  },

  // Get transaction by ID
  getTransaction: async (transactionId) => {
    const response = await api.get(`/accounting/transactions/${transactionId}`);
    return response.data;
  },

  // Update transaction
  updateTransaction: async (transactionId, updateData) => {
    const response = await api.put(`/accounting/transactions/${transactionId}`, updateData);
    return response.data;
  },

  // Delete transaction
  deleteTransaction: async (transactionId) => {
    const response = await api.delete(`/accounting/transactions/${transactionId}`);
    return response.data;
  },

  // Get accounting report
  getReport: async () => {
    const response = await api.get('/accounting/report');
    return response.data;
  },

  // Get transactions by category
  getTransactionsByCategory: async (category) => {
    const response = await api.get(`/accounting/transactions/category/${category}`);
    return response.data;
  },

  // AI-powered endpoints
  categorizeTransaction: async (transactionData) => {
    const response = await api.post('/accounting/ai/categorize-transaction', transactionData);
    return response.data;
  },

  analyzePatterns: async () => {
    const response = await api.post('/accounting/ai/analyze-patterns');
    return response.data;
  },

  extractTransactions: async (documentData) => {
    const response = await api.post('/accounting/ai/extract-transactions', documentData);
    return response.data;
  },

  getFinancialRecommendations: async (goals = null) => {
    const data = goals ? { goals } : {};
    const response = await api.post('/accounting/ai/financial-recommendations', data);
    return response.data;
  },
};

// ============= Advisor API =============
export const advisorAPI = {
  // Financial Goals
  createGoal: async (goalData) => {
    const response = await api.post('/advisor/goals', goalData);
    return response.data;
  },

  getGoals: async () => {
    const response = await api.get('/advisor/goals');
    return response.data;
  },

  getGoal: async (goalId) => {
    const response = await api.get(`/advisor/goals/${goalId}`);
    return response.data;
  },

  updateGoal: async (goalId, updateData) => {
    const response = await api.put(`/advisor/goals/${goalId}`, updateData);
    return response.data;
  },

  deleteGoal: async (goalId) => {
    const response = await api.delete(`/advisor/goals/${goalId}`);
    return response.data;
  },

  // AI-powered Financial Plan
  generateFinancialPlan: async (requestData) => {
    const response = await api.post('/advisor/financial-plan', requestData);
    return response.data;
  },

  // Investment Recommendations
  getInvestmentRecommendations: async (requestData) => {
    const response = await api.post('/advisor/investments/recommendations', requestData);
    return response.data;
  },

  // Tax Strategy
  getTaxStrategy: async (requestData) => {
    const response = await api.post('/advisor/tax/strategy', requestData);
    return response.data;
  },

  // Monte Carlo Simulation
  runMonteCarlo: async (requestData) => {
    const response = await api.post('/advisor/monte-carlo', requestData);
    return response.data;
  },
};

// ============= Reports API =============
export const reportsAPI = {
  // Document categorization
  categorizeDocument: async (documentData) => {
    const response = await api.post('/reports/categorize-document', documentData);
    return response.data;
  },

  // Get user reports
  getUserReports: async () => {
    const response = await api.get('/reports/user-reports');
    return response.data;
  },

  // Generate financial report
  generateFinancialReport: async (reportData) => {
    const response = await api.post('/reports/generate-financial-report', reportData);
    return response.data;
  },

  // Generate tax report
  generateTaxReport: async (reportData) => {
    const response = await api.post('/reports/generate-tax-report', reportData);
    return response.data;
  },

  // Create financial report
  createFinancialReport: async (reportData) => {
    const response = await api.post('/reports/create-financial-report', reportData);
    return response.data;
  },

  // Create tax report
  createTaxReport: async (reportData) => {
    const response = await api.post('/reports/create-tax-report', reportData);
    return response.data;
  },
};



export default api;
