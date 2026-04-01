/**
 * @file: useKeySystem.js
 * @path: roblox/frontend/src/hooks/useKeySystem.js
 * @purpose: Hook quản lý hệ thống key operations
 * @functionality: Key request, verification, info retrieval, revocation với error handling
 * @connections: Kết nối đến AuthContext và keyApi, gọi API endpoints
 */
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { keyApi } from '../api/keyApi';

// Hook quản lý hệ thống key
export const useKeySystem = () => {
  const { sessionId, setKey, blockAccess } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [keyData, setKeyData] = useState(null);

  // Gửi yêu cầu key mới
  const requestKey = useCallback(async (userData) => {
    if (!sessionId) {
      setError('Vui lòng xác thực trước khi yêu cầu key');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await keyApi.requestKey({
        sessionId,
        ...userData
      });

      if (response.success) {
        setKeyData(response.data);
        setKey(response.data.key);
        return response.data;
      } else {
        setError(response.message || 'Yêu cầu key thất bại');
        return null;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi kết nối đến server';
      setError(errorMessage);
      
      // Nếu lỗi là 403 hoặc 401, có thể bị chặn
      if (err.response?.status === 403 || err.response?.status === 401) {
        blockAccess();
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, setKey, blockAccess]);

  // Xác thực key
  const verifyKey = useCallback(async (keyToVerify) => {
    if (!sessionId) {
      setError('Vui lòng xác thực trước');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await keyApi.verifyKey({
        sessionId,
        key: keyToVerify
      });

      if (response.success) {
        setKeyData(response.data);
        setKey(keyToVerify);
        return true;
      } else {
        setError(response.message || 'Key không hợp lệ');
        return false;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi xác thực key';
      setError(errorMessage);
      
      if (err.response?.status === 403 || err.response?.status === 401) {
        blockAccess();
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, setKey, blockAccess]);

  // Lấy thông tin key hiện tại
  const getKeyInfo = useCallback(async () => {
    if (!sessionId || !keyData?.key) {
      setError('Không có key để kiểm tra');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await keyApi.getKeyInfo({
        sessionId,
        key: keyData.key
      });

      if (response.success) {
        setKeyData(response.data);
        return response.data;
      } else {
        setError(response.message || 'Không thể lấy thông tin key');
        return null;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi kết nối đến server';
      setError(errorMessage);
      
      if (err.response?.status === 403 || err.response?.status === 401) {
        blockAccess();
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, keyData, blockAccess]);

  // Hủy key hiện tại
  const revokeKey = useCallback(async () => {
    if (!sessionId || !keyData?.key) {
      setError('Không có key để hủy');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await keyApi.revokeKey({
        sessionId,
        key: keyData.key
      });

      if (response.success) {
        setKeyData(null);
        setKey(null);
        return true;
      } else {
        setError(response.message || 'Không thể hủy key');
        return false;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi kết nối đến server';
      setError(errorMessage);
      
      if (err.response?.status === 403 || err.response?.status === 401) {
        blockAccess();
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, keyData, setKey, blockAccess]);

  // Reset lỗi
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset toàn bộ state
  const reset = useCallback(() => {
    setKeyData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    // State
    isLoading,
    error,
    keyData,
    hasKey: !!keyData,
    
    // Actions
    requestKey,
    verifyKey,
    getKeyInfo,
    revokeKey,
    clearError,
    reset
  };
};
