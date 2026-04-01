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
  BLOCK_ACCESS: 'BLOCK_ACCESS'
};

// State ban đầu
const initialState = {
  sessionId: null,
  ip: null,
  key: null,
  hwid: null,
  isBlocked: false,
  isAuthenticated: false
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
    
    default:
      return state;
  }
};

// Tạo context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Tự động khôi phục session từ localStorage khi mount
  useEffect(() => {
    const savedSession = localStorage.getItem('sessionId');
    const savedIP = localStorage.getItem('userIP');
    const savedHWID = localStorage.getItem('hwid');
    
    if (savedSession) {
      dispatch({ type: AUTH_ACTIONS.SET_SESSION, payload: savedSession });
    }
    if (savedIP) {
      dispatch({ type: AUTH_ACTIONS.SET_IP, payload: savedIP });
    }
    if (savedHWID) {
      dispatch({ type: AUTH_ACTIONS.SET_HWID, payload: savedHWID });
    }
  }, []);

  // Lưu vào localStorage khi state thay đổi
  useEffect(() => {
    if (state.sessionId) {
      localStorage.setItem('sessionId', state.sessionId);
    } else {
      localStorage.removeItem('sessionId');
    }
  }, [state.sessionId]);

  useEffect(() => {
    if (state.ip) {
      localStorage.setItem('userIP', state.ip);
    }
  }, [state.ip]);

  useEffect(() => {
    if (state.hwid) {
      localStorage.setItem('hwid', state.hwid);
    }
  }, [state.hwid]);

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
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      localStorage.clear();
    },
    
    blockAccess: () => {
      dispatch({ type: AUTH_ACTIONS.BLOCK_ACCESS });
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
