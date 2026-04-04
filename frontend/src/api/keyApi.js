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
  async (config) => {
    // Get real IP from api.ipify.org or use existing
    let ip = localStorage.getItem('user_ip');
    if (!ip) {
      try {
        // Fetch real IP
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ip = data.ip;
        localStorage.setItem('user_ip', ip);
      } catch (error) {
        console.warn('Failed to fetch real IP, using fallback');
        ip = null; // Let backend handle IP via X-Forwarded-For
      }
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
    if (ip) {
      config.headers['X-IP'] = ip;
    }
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
  // Mark session trước khi chuyển trang
  markSession: async (userData) => {
    const response = await api.post('/api/mark-session', userData);
    return response.data;
  },

  // Check key status
  checkKeyStatus: async (service) => {
    const response = await api.post('/api/check-key-status', { service });
    return response.data;
  },

  // Verify session
  verifySession: async (sessionToken) => {
    const response = await api.post('/api/verify-session', { sessionToken });
    return response.data;
  },

  // Check session mark
  checkSessionMark: async (serviceId) => {
    const response = await api.post('/api/check-session-mark', { serviceId });
    return response.data;
  },

  // Check status
  checkStatus: async (stage, sessionId) => {
    const response = await api.post('/api/check-status', { stage, sessionId });
    return response.data;
  },

  // Start verification process
  startProcess: async (service, duration) => {
    const response = await api.post('/api/start-process', { service, duration });
    return response.data;
  },

  // Generate key
  generateKey: async (service, duration) => {
    const response = await api.post('/api/generate-key', { service, duration });
    return response.data;
  },

  // Delete session
  deleteSession: async (sessionId, hwid) => {
    const response = await api.post('/api/delete-session', { sessionId, hwid });
    return response.data;
  },

  // Get key info
  getKeyInfo: async (keyId) => {
    const response = await api.get(`/api/get-key?id=${keyId}`);
    return response.data;
  },

  // Anti-cheat check
  antiCheatCheck: async (clientTime, key) => {
    const response = await api.post('/api/anti-cheat-check', { client_time: clientTime, key });
    return response.data;
  }
};

// API functions cho authentication
export const authApi = {
  // Health check
  healthCheck: async () => {
    const response = await api.get('/api/health');
    return response.data;
  },

  // Test database
  testDb: async () => {
    const response = await api.get('/api/test-db');
    return response.data;
  },

  // Track service access
  trackServiceAccess: async (service, path) => {
    const response = await api.post('/api/track-service-access', { service, path });
    return response.data;
  },

  // Get user IP (sử dụng api.ipify.org)
  getUserIP: async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get IP:', error);
      return null;
    }
  }
};

// API functions cho Roblox script
export const robloxApi = {
  // Validate key
  validateKey: async (key, hwid) => {
    const response = await api.post('/api/validate-key', { key, hwid });
    return response.data;
  },

  // Heartbeat
  heartbeat: async (key, hwid) => {
    const response = await api.post('/api/heartbeat', { key, hwid });
    return response.data;
  }
};

// Export axios instance cho các API khác
export default api;
