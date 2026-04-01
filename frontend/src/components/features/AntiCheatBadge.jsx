/**
 * @file: AntiCheatBadge.jsx
 * @path: roblox/frontend/src/components/features/AntiCheatBadge.jsx
 * @purpose: Security status badge component với real-time updates
 * @functionality: Status indicators, animated icons, detailed information panel
 * @connections: Được sử dụng trong header các pages, kết nối đến anti-cheat system
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, Eye } from 'lucide-react';
import { cn } from '../../utils/cn';

// Component AntiCheatBadge hiển thị trạng thái bảo mật
const AntiCheatBadge = ({ 
  status = 'checking', // checking, safe, warning, blocked
  className = '',
  showDetails = false,
  compact = false
}) => {
  const [lastCheck, setLastCheck] = useState(new Date());
  const [checkCount, setCheckCount] = useState(0);

  // Cập nhật thời gian kiểm tra cuối cùng
  useEffect(() => {
    const interval = setInterval(() => {
      setLastCheck(new Date());
      setCheckCount(prev => prev + 1);
    }, 5000); // Cập nhật mỗi 5 giây

    return () => clearInterval(interval);
  }, []);

  // Status configurations
  const statusConfig = {
    checking: {
      icon: Shield,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      label: 'Đang kiểm tra',
      pulse: true
    },
    safe: {
      icon: ShieldCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      label: 'An toàn',
      pulse: false
    },
    warning: {
      icon: ShieldAlert,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      label: 'Cảnh báo',
      pulse: true
    },
    blocked: {
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      label: 'Bị chặn',
      pulse: true
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  // Format thời gian
  const formatTime = (date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // Component nội dung
  const Content = () => (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm transition-all duration-300',
      config.bgColor,
      config.borderColor,
      compact ? 'text-xs' : 'text-sm',
      className
    )}>
      {/* Icon với animation */}
      <motion.div
        className={cn('flex-shrink-0', config.color)}
        animate={config.pulse ? {
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7]
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <Icon className={cn(compact ? 'w-3 h-3' : 'w-4 h-4')} />
      </motion.div>

      {/* Status text */}
      {!compact && (
        <span className={cn('font-medium', config.color)}>
          {config.label}
        </span>
      )}

      {/* Check counter (chỉ ở mode detailed) */}
      {showDetails && !compact && (
        <span className="text-gray-500 text-xs">
          #{checkCount}
        </span>
      )}
    </div>
  );

  // Compact mode
  if (compact) {
    return <Content />;
  }

  // Full mode với details
  return (
    <div className="relative">
      <Content />
      
      {/* Details panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-64 p-3 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-lg shadow-2xl z-50"
          >
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-white">
                  Trạng thái bảo mật
                </h4>
                <Eye className="w-3 h-3 text-gray-400" />
              </div>

              {/* Status detail */}
              <div className="flex items-center gap-2">
                <Icon className={cn('w-4 h-4', config.color)} />
                <span className={cn('text-sm font-medium', config.color)}>
                  {config.label}
                </span>
              </div>

              {/* Check info */}
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Lần kiểm tra cuối:</span>
                  <span>{formatTime(lastCheck)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tổng lần kiểm tra:</span>
                  <span>{checkCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>HWID:</span>
                  <span className="font-mono text-blue-400">
                    {localStorage.getItem('hwid')?.slice(0, 8) || 'N/A'}...
                  </span>
                </div>
              </div>

              {/* Warning message */}
              {status === 'warning' && (
                <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
                  Phát hiện hoạt động đáng ngờ
                </div>
              )}

              {/* Blocked message */}
              {status === 'blocked' && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                  Truy cập đã bị chặn do vi phạm
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AntiCheatBadge;
