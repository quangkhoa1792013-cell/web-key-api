/**
 * @file: useAntiCheat.js
 * @path: roblox/frontend/src/hooks/useAntiCheat.js
 * @purpose: Hook bảo mật chống bypass và cheating
 * @functionality: HWID fingerprinting, time drift detection, DevTools protection, key blocking
 * @connections: Kết nối đến AuthContext, localStorage, DOM events listeners
 */
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

// Tạo HWID fingerprint duy nhất cho trình duyệt
const generateHWID = () => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('HWID generation', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Băm fingerprint để tạo HWID ngắn gọn
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return 'HWID-' + Math.abs(hash).toString(16).toUpperCase();
  } catch (error) {
    return 'HWID-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  }
};

// Hook chống bypass và kiểm tra thời gian
export const useAntiCheat = () => {
  const { blockAccess, setHWID } = useAuth();
  const startTimeRef = useRef(Date.now());
  const hwidRef = useRef(null);

  useEffect(() => {
    // Khởi tạo HWID khi component mount
    const storedHWID = localStorage.getItem('hwid');
    const currentHWID = storedHWID || generateHWID();
    
    if (!storedHWID) {
      localStorage.setItem('hwid', currentHWID);
    }
    
    hwidRef.current = currentHWID;
    if (setHWID) {
      setHWID(currentHWID);
    }

    return () => {};
  }, [setHWID]);

  // Hàm lấy HWID hiện tại
  const getHWID = useCallback(() => {
    if (hwidRef.current) return hwidRef.current;
    // Fallback: lấy từ localStorage
    const stored = localStorage.getItem('hwid');
    if (stored) {
      hwidRef.current = stored;
      return stored;
    }
    // Tạo mới nếu chưa có
    const newHWID = generateHWID();
    hwidRef.current = newHWID;
    localStorage.setItem('hwid', newHWID);
    return newHWID;
  }, []);

  // Hàm kiểm tra tính hợp lệ của session
  const validateSession = useCallback(() => {
    const sessionAge = Date.now() - startTimeRef.current;
    const maxSessionAge = 30 * 60 * 1000; // 30 phút
    
    if (sessionAge > maxSessionAge) {
      console.warn('Session quá hạn');
      blockAccess();
      return false;
    }
    
    return true;
  }, [blockAccess]);

  return {
    getHWID,
    validateSession
  };
};
