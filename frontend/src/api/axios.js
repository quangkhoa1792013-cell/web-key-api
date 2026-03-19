import axios from 'axios';

// Generate or get HWID
const getHWID = () => {
  let hwid = localStorage.getItem('user_hwid');
  if (!hwid) {
    hwid = 'HWID_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('user_hwid', hwid);
    console.log('🆔 Generated new HWID:', hwid);
  }
  return hwid;
};

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:7860',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-HWID': getHWID(), // Add HWID to all requests - VIẾT HOA
    'X-User-Agent': navigator.userAgent,
    'X-Timestamp': Date.now().toString(),
  },
});

// Request interceptor - Log every outgoing request
api.interceptors.request.use(
  (config) => {
    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    const hwid = getHWID();
    
    // Kiểm tra xem localStorage có thực sự lưu user_hwid không
    const storedHwid = localStorage.getItem('user_hwid');
    if (!storedHwid) {
      console.log('🆔 No HWID found in localStorage, generating new one...');
    } else {
      console.log('🔐 Found existing HWID in localStorage:', storedHwid);
    }
    
    // Update HWID header for each request - VIẾT HOA TOÀN BỘ
    config.headers['X-HWID'] = hwid; // Đảm bảo header là X-HWID (viết hoa)
    
    // Extract path for clean logging
    const fullPath = config.url;
    const path = fullPath.split('?')[0];
    
    console.log(`🛰️ [${timestamp}] ${config.method?.toUpperCase()} ${path} | HWID: ${hwid}`);
    
    return config;
  },
  (error) => {
    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    console.error(`🚨 [${timestamp}] Request Error: ${error.message}`);
    return Promise.reject(error);
  }
);

// Response interceptor - Log every response
api.interceptors.response.use(
  (response) => {
    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    const status = response.status;
    const path = response.config.url.split('?')[0];
    
    let statusIcon = '✅';
    let statusColor = 'green';
    
    if (status >= 400) {
      statusIcon = '❌';
      statusColor = 'red';
    }
    
    console.log(`${statusIcon} [${timestamp}] ${response.config.method?.toUpperCase()} ${path} | Status: ${status}`);
    
    return response;
  },
  (error) => {
    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    const path = error.config?.url?.split('?')[0] || 'unknown';
    const status = error.response?.status || '???';
    
    console.error(`❌ [${timestamp}] ${error.config?.method?.toUpperCase()} ${path} | Status: ${status}`);
    console.error(`❌ [${timestamp}] Error: ${error.message}`);
    
    return Promise.reject(error);
  }
);

export default api;
