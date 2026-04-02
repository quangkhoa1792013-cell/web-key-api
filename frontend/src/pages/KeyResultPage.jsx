/**
 * @file: KeyResultPage.jsx
 * @path: roblox/frontend/src/pages/KeyResultPage.jsx
 * @purpose: Trang hiển thị key kết quả với thông tin chi tiết và countdown
 * @functionality: Key display, copy functionality, countdown timer, expiration handling
 * @connections: Kết nối đến useAuth, useKeySystem hooks và các UI components
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft,
  Package,
  Link,
  Globe,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  Zap,
  Key,
  Copy,
  RefreshCw,
  Calendar,
  Monitor,
  Timer,
  Crown,
  Star
} from 'lucide-react';

// Components
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import Spinner from '../components/ui/Spinner';
import AntiCheatBadge from '../components/features/AntiCheatBadge';

// Hooks
import { useAuth } from '../context/AuthContext';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { useKeySystem } from '../hooks/useKeySystem';

const KeyResultPage = () => {
  const navigate = useNavigate();
  const { time, sessionId: urlSessionId } = useParams();
  const { sessionId, ip, isAuthenticated, isBlocked } = useAuth();
  const { validateSession } = useAntiCheat();
  const { keyData, isLoading, error, hasKey } = useKeySystem();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // Extract time and session from URL parameters
  const keyTime = parseInt(time) || 24;
  const keySession = urlSessionId || 'unknown';

  // Generate mock key based on session
  const generateKey = () => {
    const prefix = 'ROBLOX-KEY';
    const timestamp = Date.now().toString(36).toUpperCase();
    const sessionHash = keySession.substring(0, 8).toUpperCase();
    return `${prefix}-${timestamp}-${sessionHash}`;
  };

  const [keyValue] = useState(generateKey());

  // Calculate dates
  const createdDate = new Date();
  const expireDate = new Date(createdDate.getTime() + (keyTime * 60 * 60 * 1000));

  // Get HWID
  const getHWID = () => {
    return localStorage.getItem('hwid') || 'HWID-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const hwid = getHWID();

  // Kiểm tra trạng thái ban đầu
  useEffect(() => {
    const initialize = async () => {
      if (isBlocked) {
        navigate('/blocked');
        return;
      }

      // No login needed - always authenticated
      setIsInitialized(true);
    };

    initialize();
  }, [isBlocked, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!isInitialized) return;

    const updateCountdown = () => {
      const now = new Date();
      const difference = expireDate - now;

      if (difference <= 0) {
        setTimeLeft('Đã hết hạn');
        setIsExpired(true);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isInitialized, expireDate]);

  // Copy key to clipboard
  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(keyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy key:', error);
    }
  };

  // Handle create new key
  const handleCreateNewKey = () => {
    navigate('/home');
  };

  // Format dates
  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Nếu chưa được khởi tạo, hiển thị loading
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
        <div className="text-center">
          <Spinner size="xl" label="Đang khởi tạo..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid opacity-20" />
      <div className="fixed inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 p-6"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/home')}
              icon={ArrowLeft}
              className="p-2"
            />
            
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center"
              >
                <Key className="w-4 h-4 text-blue-500" />
              </motion.div>
              <h1 className="text-2xl font-bold text-gradient">Key {keyTime}H</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <AntiCheatBadge status="safe" showDetails />
            
            <div className="text-right">
              <p className="text-sm text-gray-400">Session ID</p>
              <p className="text-xs font-mono text-blue-400">
                {sessionId?.slice(0, 8)}...
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Main Key Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <GlassCard className="p-8">
              {/* Key Display */}
              <div className="text-center mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center"
                >
                  <Key className="w-10 h-10 text-blue-500" />
                </motion.div>
                
                <h2 className="text-3xl font-bold text-white mb-4">
                  Key của bạn
                </h2>
                
                {/* Key Code */}
                <div className="mb-6">
                  <div className="relative inline-block">
                    <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg px-6 py-4 font-mono text-lg text-white">
                      {keyValue}
                    </div>
                    
                    {/* Copy Button */}
                    <Button
                      onClick={handleCopyKey}
                      variant="ghost"
                      size="sm"
                      className="absolute -right-12 top-1/2 -translate-y-1/2"
                      icon={copied ? CheckCircle : Copy}
                    >
                      {copied ? 'Đã copy!' : 'Copy'}
                    </Button>
                  </div>
                </div>

                {/* Copy Success Message */}
                <AnimatePresence>
                  {copied && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="inline-flex items-center gap-2 text-green-400 text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Đã sao chép key vào clipboard!</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Key Info Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* HWID */}
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Monitor className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="text-sm text-gray-400 mb-1">HWID</div>
                  <div className="text-xs font-mono text-white break-all">
                    {hwid}
                  </div>
                </div>

                {/* Time Left */}
                <div className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                    isExpired ? 'bg-red-500/20' : 'bg-green-500/20'
                  }`}>
                    <Timer className={`w-6 h-6 ${isExpired ? 'text-red-500' : 'text-green-500'}`} />
                  </div>
                  <div className="text-sm text-gray-400 mb-1">Thời gian còn lại</div>
                  <div className={`text-lg font-bold ${isExpired ? 'text-red-500' : 'text-green-400'}`}>
                    {timeLeft}
                  </div>
                </div>

                {/* Created Date */}
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="text-sm text-gray-400 mb-1">Ngày khởi tạo</div>
                  <div className="text-xs text-white">
                    {formatDate(createdDate)}
                  </div>
                </div>

                {/* Expire Date */}
                <div className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                    isExpired ? 'bg-red-500/20' : 'bg-orange-500/20'
                  }`}>
                    <Clock className={`w-6 h-6 ${isExpired ? 'text-red-500' : 'text-orange-500'}`} />
                  </div>
                  <div className="text-sm text-gray-400 mb-1">Ngày hết hạn</div>
                  <div className={`text-xs ${isExpired ? 'text-red-400' : 'text-orange-400'}`}>
                    {formatDate(expireDate)}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="text-center mt-8">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  isExpired 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}>
                  {isExpired ? (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Key đã hết hạn</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Key đang hoạt động</span>
                    </>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Additional Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Thông tin bảo mật
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-white mb-3">Chi tiết Key</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Loại key:</span>
                      <span className="text-white font-medium">Key {keyTime}H</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Session:</span>
                      <span className="text-white font-mono text-xs">{keySession}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trạng thái:</span>
                      <span className={`font-medium ${isExpired ? 'text-red-500' : 'text-green-500'}`}>
                        {isExpired ? 'Hết hạn' : 'Hoạt động'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-white mb-3">Thông tin hệ thống</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">IP Address:</span>
                      <span className="text-white font-mono text-xs">{ip || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">User Agent:</span>
                      <span className="text-white font-mono text-xs truncate max-w-[200px]">
                        {navigator.userAgent.substring(0, 20)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Platform:</span>
                      <span className="text-white font-medium">
                        {navigator.platform || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Footer - Create New Key Button */}
          <AnimatePresence>
            {isExpired && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <GlassCard className="p-8">
                  <div className="text-center mb-6">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Key đã hết hạn
                    </h3>
                    <p className="text-gray-400">
                      Key {keyTime}H của bạn đã hết hạn. Hãy tạo key mới để tiếp tục sử dụng.
                    </p>
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-block"
                  >
                    <Button
                      onClick={handleCreateNewKey}
                      size="xl"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 px-8 py-4 text-lg font-bold shadow-2xl"
                      icon={RefreshCw}
                    >
                      Tạo Key mới
                    </Button>
                  </motion.div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
};

export default KeyResultPage;
