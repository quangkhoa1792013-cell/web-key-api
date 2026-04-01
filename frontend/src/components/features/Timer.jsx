/**
 * @file: Timer.jsx
 * @path: roblox/frontend/src/components/features/Timer.jsx
 * @purpose: Timer component với progress ring và warnings
 * @functionality: Countdown timer, progress visualization, warning thresholds, controls
 * @connections: Được sử dụng trong Processing page cho time tracking
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

// Component Timer với animation và cảnh báo
const Timer = ({ 
  initialTime = 300, // 5 phút mặc định
  onTimeUp,
  onTick,
  warningThreshold = 30, // Cảnh báo khi còn 30s
  className = '',
  showWarning = true,
  autoStart = true,
  size = 'md'
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isWarning, setIsWarning] = useState(false);

  // Format thời gian thành MM:SS
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  // Kiểm tra cảnh báo
  useEffect(() => {
    setIsWarning(timeLeft <= warningThreshold && timeLeft > 0);
  }, [timeLeft, warningThreshold]);

  // Timer logic
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft <= 0 && onTimeUp) {
        onTimeUp();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        
        // Gọi callback onTick mỗi giây
        if (onTick) {
          onTick(newTime, prev);
        }
        
        // Kiểm tra hết giờ
        if (newTime <= 0) {
          setIsRunning(false);
          if (onTimeUp) {
            onTimeUp();
          }
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onTimeUp, onTick]);

  // Control functions
  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((newTime = initialTime) => {
    setTimeLeft(newTime);
    setIsRunning(autoStart);
    setIsWarning(false);
  }, [initialTime, autoStart]);

  // Progress percentage
  const progress = ((initialTime - timeLeft) / initialTime) * 100;

  // Color based on time left
  const getTimeColor = () => {
    if (timeLeft <= 10) return 'text-red-500';
    if (timeLeft <= warningThreshold) return 'text-yellow-500';
    return 'text-blue-400';
  };

  return (
    <div className={cn('relative', className)}>
      {/* Progress ring */}
      <div className="relative inline-flex items-center justify-center">
        <svg className="transform -rotate-90 w-20 h-20">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-700"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className={cn(
              'transition-colors duration-300',
              timeLeft <= 10 ? 'text-red-500' : 
              timeLeft <= warningThreshold ? 'text-yellow-500' : 
              'text-blue-500'
            )}
            strokeDasharray={`${2 * Math.PI * 36}`}
            strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Timer display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className={cn(
              'font-mono font-bold',
              sizeClasses[size],
              getTimeColor()
            )}
            animate={{
              scale: isWarning ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 1,
              repeat: isWarning ? Infinity : 0,
              ease: 'easeInOut'
            }}
          >
            {formatTime(timeLeft)}
          </motion.div>
        </div>
      </div>

      {/* Warning indicator */}
      <AnimatePresence>
        {isWarning && showWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-2 py-1 rounded-full"
          >
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span className="text-xs text-red-400 font-medium">
              Sắp hết thời gian!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control buttons */}
      <div className="flex gap-2 mt-4 justify-center">
        {!isRunning ? (
          <button
            onClick={start}
            className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-colors"
          >
            <Clock className="w-3 h-3 inline mr-1" />
            Bắt đầu
          </button>
        ) : (
          <button
            onClick={pause}
            className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm transition-colors"
          >
            Tạm dừng
          </button>
        )}
        <button
          onClick={() => reset()}
          className="px-3 py-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded-lg text-sm transition-colors"
        >
          Đặt lại
        </button>
      </div>
    </div>
  );
};

export default Timer;
