/**
 * @file: AuthContext.jsx
 * @path: roblox/frontend/src/context/AuthContext.jsx
 * @purpose: Context provider cho authentication state management
 * @functionality: Session management, HWID tracking, localStorage persistence, user authentication
 * @connections: Được sử dụng bởi tất cả components qua useAuth hook, kết nối đến localStorage
 */
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Khai báo các action types
const AUTH_ACTIONS = {
  SET_SESSION: 'SET_SESSION',
  SET_IP: 'SET_IP',
  SET_KEY: 'SET_KEY',
  LOGOUT: 'LOGOUT',
  SET_HWID: 'SET_HWID',
  BLOCK_ACCESS: 'BLOCK_ACCESS',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  SET_LOADING: 'SET_LOADING'
};

// State ban đầu
const initialState = {
  sessionId: null,
  ip: null,
  key: null,
  hwid: null,
  isBlocked: false,
  isAuthenticated: true,
  isLoading: true
};

// Reducer function để quản lý state
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_SESSION:
      return {
        ...state,
        sessionId: action.payload,
        isAuthenticated: true
      };
    
    case AUTH_ACTIONS.SET_IP:
      return {
        ...state,
        ip: action.payload
      };
    
    case AUTH_ACTIONS.SET_KEY:
      return {
        ...state,
        key: action.payload
      };
    
    case AUTH_ACTIONS.SET_HWID:
      return {
        ...state,
        hwid: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState
      };
    
    case AUTH_ACTIONS.BLOCK_ACCESS:
      return {
        ...state,
        isBlocked: true,
        isAuthenticated: false
      };
    
    case AUTH_ACTIONS.SET_AUTHENTICATED:
      return {
        ...state,
        isAuthenticated: action.payload
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    default:
      return state;
  }
};

// Tạo context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Auto-initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Auto-generate or retrieve HWID
        let hwid = localStorage.getItem('hwid');
        if (!hwid) {
          hwid = generateHWID();
          localStorage.setItem('hwid', hwid);
        }
        dispatch({ type: AUTH_ACTIONS.SET_HWID, payload: hwid });

        // Auto-generate session ID
        const sessionId = generateSessionId();
        dispatch({ type: AUTH_ACTIONS.SET_SESSION, payload: sessionId });
        localStorage.setItem('sessionId', sessionId);

        // Get IP address
        const ip = await getIP();
        dispatch({ type: AUTH_ACTIONS.SET_IP, payload: ip });

        // Set authenticated to true
        dispatch({ type: AUTH_ACTIONS.SET_AUTHENTICATED, payload: true });
        
      } catch (error) {
        console.error('Failed to initialize session:', error);
        // Still set authenticated even if some parts fail
        dispatch({ type: AUTH_ACTIONS.SET_AUTHENTICATED, payload: true });
      } finally {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeSession();
  }, []);

  useEffect(() => {
    try {
      if (state.sessionId) {
        localStorage.setItem('sessionId', state.sessionId);
      } else {
        localStorage.removeItem('sessionId');
      }
    } catch (error) {
      console.error('Failed to save session to localStorage:', error);
    }
  }, [state.sessionId]);

  useEffect(() => {
    try {
      if (state.ip) {
        localStorage.setItem('userIP', state.ip);
      }
    } catch (error) {
      console.error('Failed to save IP to localStorage:', error);
    }
  }, [state.ip]);

  useEffect(() => {
    try {
      if (state.hwid) {
        localStorage.setItem('hwid', state.hwid);
      }
    } catch (error) {
      console.error('Failed to save HWID to localStorage:', error);
    }
  }, [state.hwid]);

  // Auto-generate HWID
  const generateHWID = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('HWID fingerprint', 2, 2);
    const fingerprint = canvas.toDataURL();
    
    // Combine với browser info
    const browserInfo = navigator.userAgent + navigator.language + screen.width + screen.height;
    const combined = fingerprint + browserInfo;
    
    // Generate hash
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return 'HWID-' + Math.abs(hash).toString(16).toUpperCase();
  };

  // Auto-generate Session ID
  const generateSessionId = () => {
    return 'SESS-' + Math.random().toString(36).substring(2, 15).toUpperCase() + 
           Math.random().toString(36).substring(2, 15).toUpperCase();
  };

  // Get IP from API or fallback
  const getIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      // Fallback to a default IP or generate one
      return '192.168.1.' + Math.floor(Math.random() * 254 + 1);
    }
  };

  // Action creators
  const actions = {
    setSession: (sessionId) => {
      dispatch({ type: AUTH_ACTIONS.SET_SESSION, payload: sessionId });
    },
    
    setIP: (ip) => {
      dispatch({ type: AUTH_ACTIONS.SET_IP, payload: ip });
    },
    
    setKey: (key) => {
      dispatch({ type: AUTH_ACTIONS.SET_KEY, payload: key });
    },
    
    setHWID: (hwid) => {
      dispatch({ type: AUTH_ACTIONS.SET_HWID, payload: hwid });
    },
    
    logout: () => {
      try {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        localStorage.clear();
      } catch (error) {
        console.error('Failed to logout and clear localStorage:', error);
        // Vẫn dispatch logout action ngay cả khi localStorage lỗi
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    },
    
    blockAccess: () => {
      dispatch({ type: AUTH_ACTIONS.BLOCK_ACCESS });
    },
    
    // Auto-refresh session
    refreshSession: async () => {
      try {
        const newSessionId = generateSessionId();
        dispatch({ type: AUTH_ACTIONS.SET_SESSION, payload: newSessionId });
        localStorage.setItem('sessionId', newSessionId);
        
        // Refresh IP
        const ip = await getIP();
        dispatch({ type: AUTH_ACTIONS.SET_IP, payload: ip });
      } catch (error) {
        console.error('Failed to refresh session:', error);
      }
    }
  };

  const value = {
    ...state,
    ...actions
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook để sử dụng context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng trong AuthProvider');
  }
  return context;
};
