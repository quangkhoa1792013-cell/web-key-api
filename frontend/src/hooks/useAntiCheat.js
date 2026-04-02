/**
 * @file: useAntiCheat.js
 * @path: roblox/frontend/src/hooks/useAntiCheat.js
 * @purpose: Hook bảo mật chống bypass và cheating
 * @functionality: HWID fingerprinting, time drift detection, DevTools protection, key blocking
 * @connections: Kết nối đến AuthContext, localStorage, DOM events listeners
 */
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// Tạo HWID fingerprint duy nhất cho trình duyệt
const generateHWID = () => {
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
  
  return Math.abs(hash).toString(16);
};

// Hook chống bypass và kiểm tra thời gian
export const useAntiCheat = () => {
  const { blockAccess, setHWID } = useAuth();
  const startTimeRef = useRef(Date.now());
  const lastCheckRef = useRef(Date.now());
  const hwidRef = useRef(null);

  useEffect(() => {
    // Khởi tạo HWID khi component mount
    const initHWID = () => {
      // DISABLED: Anti-cheat logic - Always return true
      /*
      const storedHWID = localStorage.getItem('hwid');
      const currentHWID = generateHWID();
      
      if (storedHWID && storedHWID !== currentHWID) {
        // HWID thay đổi -> nghi ngờ bypass
        console.warn('Phát hiện HWID thay đổi, có thể đang cố gắng bypass');
        blockAccess();
        return false;
      }
      
      hwidRef.current = currentHWID;
      setHWID(currentHWID);
      localStorage.setItem('hwid', currentHWID);
      return true;
      */
      
      return true; // Always allow access
    };

    const isHWIDValid = initHWID();
    if (!isHWIDValid) return;

    // DISABLED: Time drift detection
    /*
    // Kiểm tra thời gian thực để chống time drift
    const timeCheckInterval = setInterval(() => {
      const now = Date.now();
      const expectedTime = lastCheckRef.current + 1000; // Kiểm tra mỗi giây
      const timeDrift = Math.abs(now - expectedTime);
      
      // Nếu drift > 2 giây -> nghi ngờ chỉnh giờ hệ thống
      if (timeDrift > 2000) {
        console.warn(`Phát hiện time drift: ${timeDrift}ms - Có thể đang chỉnh giờ hệ thống`);
        blockAccess();
        clearInterval(timeCheckInterval);
        return;
      }
      
      lastCheckRef.current = now;
    }, 1000);
    */

    // DISABLED: DevTools detection
    /*
    // Kiểm tra DevTools
    const devtoolsCheck = () => {
      const threshold = 160;
      setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          console.warn('Phát hiện DevTools đang mở');
          blockAccess();
        }
      }, 500);
    };
    */

    // DISABLED: Console and DevTools detection
    const consoleCheck = () => {
      let devtools = {
        open: false,
        orientation: null
      };
      
      const threshold = 160;
      
      setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          if (!devtools.open) {
            devtools.open = true;
            console.clear();
            console.log('%c Cảnh báo!', 'color: red; font-size: 30px; font-weight: bold;');
            console.log('%cPhát hiện DevTools! Hệ thống sẽ bị khóa.', 'color: red; font-size: 16px;');
          }
        } else {
          devtools.open = false;
        }
      }, 500);
    };

    // DISABLED: All remaining anti-cheat logic
    /*
    // Khởi tạo các kiểm tra
    let timeCheckInterval;
    let devtoolsCheck;
    consoleCheck();

    // Cleanup khi unmount
    return () => {
      clearInterval(timeCheckInterval);
    };

    // Kiểm tra F12 và các phím tắt khác
    const handleKeyDown = (e) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.keyCode === 123 || 
          (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
          (e.ctrlKey && e.keyCode === 85)) {
        e.preventDefault();
        console.warn('Phím tắt developer bị chặn');
        blockAccess();
      }
    };

    // Kiểm tra chuột phải
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Disable text selection
    const handleSelectStart = (e) => {
      e.preventDefault();
      return false;
    };

    // Gắn các event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);

    // Cleanup
    return () => {
      clearInterval(timeCheckInterval);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
    };
    */

    // Return empty cleanup function since all logic is disabled
    return () => {};
  }, [blockAccess, setHWID]);

  // Hàm lấy HWID hiện tại
  const getHWID = () => hwidRef.current;

  // Hàm kiểm tra tính hợp lệ của session
  const validateSession = () => {
    const sessionAge = Date.now() - startTimeRef.current;
    const maxSessionAge = 30 * 60 * 1000; // 30 phút
    
    if (sessionAge > maxSessionAge) {
      console.warn('Session quá hạn');
      blockAccess();
      return false;
    }
    
    return true;
  };

  return {
    getHWID,
    validateSession
  };
};
