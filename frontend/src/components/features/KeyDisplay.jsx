/**
 * @file: KeyDisplay.jsx
 * @path: roblox/frontend/src/components/features/KeyDisplay.jsx
 * @purpose: Key display component với security features
 * @functionality: Masked/unmasked view, copy to clipboard, download, key information
 * @connections: Được sử dụng trong Home và Result pages, kết nối đến keyData state
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Eye, EyeOff, Key, Shield, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';

// Component KeyDisplay để hiển thị key với các chức năng bảo mật
const KeyDisplay = ({ 
  keyData,
  className = '',
  showCopyButton = true,
  showToggleVisibility = true,
  compact = false,
  onCopy,
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Kiểm tra key có hợp lệ không
  const isValidKey = keyData && keyData.key;
  const keyString = keyData?.key || '';
  const maskedKey = keyString.slice(0, 8) + '****-****-****-****' + keyString.slice(-4);

  // Copy key to clipboard
  const handleCopy = useCallback(async () => {
    if (!isValidKey) return;

    try {
      await navigator.clipboard.writeText(keyString);
      setCopied(true);
      
      // Gọi callback nếu có
      if (onCopy) {
        onCopy(keyString);
      }

      // Reset copied state sau 2 giây
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy key:', error);
    }
  }, [keyString, isValidKey, onCopy]);

  // Toggle visibility
  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  // Format thời gian hết hạn
  const formatExpiry = useCallback((expiryDate) => {
    if (!expiryDate) return 'Vô hạn';
    
    const date = new Date(expiryDate);
    const now = new Date();
    const diff = date - now;
    
    if (diff <= 0) return 'Đã hết hạn';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} ngày ${hours} giờ`;
    if (hours > 0) return `${hours} giờ`;
    return '< 1 giờ';
  }, []);

  // Get status color based on key state
  const getStatusColor = useCallback(() => {
    if (!isValidKey) return 'text-gray-500';
    if (keyData.status === 'active') return 'text-green-500';
    if (keyData.status === 'expired') return 'text-red-500';
    if (keyData.status === 'revoked') return 'text-yellow-500';
    return 'text-blue-500';
  }, [isValidKey, keyData]);

  // Compact mode
  if (compact) {
    return (
      <motion.div
        className={cn(
          'flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg border border-gray-700/50',
          className
        )}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        {...props}
      >
        <Key className={cn('w-4 h-4', getStatusColor())} />
        <span className="font-mono text-sm text-gray-300">
          {isVisible ? keyString : maskedKey}
        </span>
        
        <div className="flex items-center gap-1 ml-auto">
          {showToggleVisibility && (
            <button
              onClick={toggleVisibility}
              className="p-1 hover:bg-gray-700/50 rounded transition-colors"
            >
              {isVisible ? (
                <EyeOff className="w-3 h-3 text-gray-400" />
              ) : (
                <Eye className="w-3 h-3 text-gray-400" />
              )}
            </button>
          )}
          
          {showCopyButton && isValidKey && (
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-gray-700/50 rounded transition-colors"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3 text-gray-400" />
              )}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Full mode
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gray-900/50 backdrop-blur-xl',
        'transition-all duration-300',
        isHovered ? 'border-blue-500/30 shadow-lg shadow-blue-500/10' : 'border-gray-700/50',
        className
      )}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      {...props}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
      
      {/* Content */}
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isHovered ? 360 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <Key className={cn('w-6 h-6', getStatusColor())} />
            </motion.div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {isValidKey ? 'Key của bạn' : 'Chưa có key'}
              </h3>
              <p className="text-sm text-gray-400">
                {isValidKey ? 'Sử dụng để truy cập hệ thống' : 'Yêu cầu key mới để bắt đầu'}
              </p>
            </div>
          </div>
          
          {/* Status badge */}
          <AnimatePresence>
            {isValidKey && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                  keyData.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/30' :
                  keyData.status === 'expired' ? 'bg-red-500/10 text-red-500 border border-red-500/30' :
                  'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'
                )}
              >
                <Shield className="w-3 h-3" />
                {keyData.status === 'active' ? 'Hoạt động' :
                 keyData.status === 'expired' ? 'Hết hạn' : 'Đã thu hồi'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Key display */}
        {isValidKey && (
          <div className="space-y-3">
            {/* Key string */}
            <div className="relative">
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <span className="font-mono text-sm text-gray-300 flex-1">
                  {isVisible ? keyString : maskedKey}
                </span>
                
                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {showToggleVisibility && (
                    <motion.button
                      onClick={toggleVisibility}
                      className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isVisible ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </motion.button>
                  )}
                  
                  {showCopyButton && (
                    <motion.button
                      onClick={handleCopy}
                      className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <AnimatePresence mode="wait">
                        {copied ? (
                          <motion.div
                            key="check"
                            initial={{ rotate: -180, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 180, opacity: 0 }}
                          >
                            <Check className="w-4 h-4 text-green-500" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="copy"
                            initial={{ rotate: -180, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 180, opacity: 0 }}
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {/* Key info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {keyData.createdAt && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>Tạo: {new Date(keyData.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
              
              {keyData.expiresAt && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>Hết hạn: {formatExpiry(keyData.expiresAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Copy feedback */}
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-2 right-2 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400"
            >
              Đã sao chép!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default KeyDisplay;
