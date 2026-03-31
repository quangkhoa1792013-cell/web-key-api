import axios from 'axios';

// Cấu hình axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Lấy HWID từ localStorage
const getHWID = () => {
  return localStorage.getItem('hwid') || 'unknown';
};

// Interceptor để thêm HWID vào mọi request
api.interceptors.request.use(
  (config) => {
    // Thêm HWID header
    config.headers['X-HWID'] = getHWID();
    
    // Thêm Session ID nếu có
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId;
    }
    
    // Log request (chỉ trong development)
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor để xử lý response
api.interceptors.response.use(
  (response) => {
    // Log response (chỉ trong development)
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
    }
    
    return response;
  },
  (error) => {
    // Log error
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
    // Xử lý các lỗi chung
    if (error.response?.status === 401) {
      // Unauthorized - clear session
      localStorage.removeItem('sessionId');
      window.location.href = '/';
    } else if (error.response?.status === 403) {
      // Forbidden - access blocked
      localStorage.clear();
      window.location.href = '/blocked';
    } else if (error.response?.status === 429) {
      // Too Many Requests
      error.message = 'Quá nhiều yêu cầu, vui lòng thử lại sau';
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      error.message = 'Kết nối timeout, vui lòng kiểm tra mạng';
    } else if (!error.response) {
      // Network error
      error.message = 'Không thể kết nối đến server';
    }
    
    return Promise.reject(error);
  }
);

// API functions cho key system
export const keyApi = {
  // Yêu cầu key mới
  requestKey: async (userData) => {
    const response = await api.post('/key/request', userData);
    return response.data;
  },

  // Xác thực key
  verifyKey: async (data) => {
    const response = await api.post('/key/verify', data);
    return response.data;
  },

  // Lấy thông tin key
  getKeyInfo: async (data) => {
    const response = await api.post('/key/info', data);
    return response.data;
  },

  // Hủy key
  revokeKey: async (data) => {
    const response = await api.post('/key/revoke', data);
    return response.data;
  },

  // Lấy lịch sử key
  getKeyHistory: async (params = {}) => {
    const response = await api.get('/key/history', { params });
    return response.data;
  },

  // Kiểm tra giới hạn key
  checkKeyLimit: async () => {
    const response = await api.get('/key/limit');
    return response.data;
  }
};

// API functions cho authentication
export const authApi = {
  // Lấy session mới
  getSession: async () => {
    const response = await api.post('/auth/session');
    return response.data;
  },

  // Xác thực session
  validateSession: async (sessionId) => {
    const response = await api.post('/auth/validate', { sessionId });
    return response.data;
  },

  // Lấy IP của user
  getUserIP: async () => {
    const response = await api.get('/auth/ip');
    return response.data;
  }
};

// Export axios instance cho các API khác
export default api;
