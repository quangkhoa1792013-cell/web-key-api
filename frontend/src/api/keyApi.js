/**
 * @file: keyApi.js
 * @path: roblox/frontend/src/api/keyApi.js
 * @purpose: API layer cho key và authentication operations
 * @functionality: Axios configuration, HWID headers, request/response interceptors, API endpoints
 * @connections: Kết nối đến backend API endpoints, tự động thêm X-HWID và X-Session-ID headers
 */
import axios from 'axios';

// Debug: Kiểm tra API URL đã load đúng chưa
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);

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

// Add request interceptor to include IP and HWID
api.interceptors.request.use(
  (config) => {
    // Auto-add IP from localStorage or generate
    let ip = localStorage.getItem('user_ip');
    if (!ip) {
      // Generate fallback IP if not available
      ip = '192.168.1.' + Math.floor(Math.random() * 254 + 1);
      localStorage.setItem('user_ip', ip);
    }
    
    // Auto-add HWID from localStorage or generate
    let hwid = localStorage.getItem('hwid');
    if (!hwid) {
      // Generate HWID using canvas fingerprinting
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('HWID fingerprint', 2, 2);
      const fingerprint = canvas.toDataURL();
      const browserInfo = navigator.userAgent + navigator.language + screen.width + screen.height;
      const combined = fingerprint + browserInfo;
      
      let hash = 0;
      for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      hwid = 'HWID-' + Math.abs(hash).toString(16).toUpperCase();
      localStorage.setItem('hwid', hwid);
    }
    
    // Add IP and HWID to headers
    config.headers['X-IP'] = ip;
    config.headers['X-HWID'] = hwid;
    
    // Add session if available
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
