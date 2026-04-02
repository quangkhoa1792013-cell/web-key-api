/**
 * @file: GetKeyPage.jsx
 * @path: roblox/frontend/src/pages/GetKeyPage.jsx
 * @purpose: Trang xử lý vượt link với progress bar và key generation
 * @functionality: Progress tracking, link bypass simulation, key generation animation
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
  RefreshCw,
  Star,
  Crown
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

const GetKeyPage = () => {
  const navigate = useNavigate();
  const { serviceName, time } = useParams();
  const { sessionId, ip, isAuthenticated, isBlocked } = useAuth();
  const { validateSession } = useAntiCheat();
  const { requestKey, keyData, isLoading, error, hasKey } = useKeySystem();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Extract time from URL parameter
  const selectedTime = time || '24';
  
  // Dữ liệu dịch vụ
  const serviceData = {
    lootlabs: {
      name: 'Lootlabs',
      icon: Package,
      color: 'blue',
      maxLinks: 4 // 24h = 4 links
    },
    linkvertise: {
      name: 'Linkvertise',
      icon: Link,
      color: 'green',
      maxLinks: 2 // 8h = 2 links
    },
    worklink: {
      name: 'Worklink',
      icon: Globe,
      color: 'purple',
      maxLinks: 5 // 40h = 5 links
    },
    pandas: {
      name: 'Pandas',
      icon: Sparkles,
      color: 'orange',
      maxLinks: 10 // 67h = 10 links
    }
  };

  // Calculate max links based on time
  const getTimeBasedLinks = (hours) => {
    const hourNum = parseInt(hours);
    if (hourNum <= 4) return 1;
    if (hourNum <= 8) return 2;
    if (hourNum <= 16) return 3;
    if (hourNum <= 24) return 4;
    if (hourNum <= 32) return 5;
    if (hourNum <= 40) return 6;
    if (hourNum <= 48) return 7;
    if (hourNum <= 56) return 8;
    if (hourNum <= 64) return 9;
    return 10; // 67h
  };

  const service = serviceData[serviceName];
  const maxLinks = getTimeBasedLinks(selectedTime);
  const percentage = Math.round((currentProgress / maxLinks) * 100);

  // Kiểm tra trạng thái ban đầu
  useEffect(() => {
    const initialize = async () => {
      if (isBlocked) {
        navigate('/blocked');
        return;
      }

      // No login needed - always authenticated
      setIsInitialized(true);
      // Start progress simulation
      startProgressSimulation();
    };

    initialize();
  }, [isBlocked, navigate]);

  // Simulate progress
  const startProgressSimulation = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      setCurrentProgress(progress);
      
      if (progress >= maxLinks) {
        clearInterval(interval);
        setIsCompleted(true);
      }
    }, 2000); // 2s per link
  };

  // Generate random session ID
  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  // Handle key generation
  const handleGenerateKey = () => {
    setIsGenerating(true);
    
    // Simulate key generation
    setTimeout(() => {
      const randomSession = generateSessionId();
      // Navigate to result page with new URL format
      navigate(`/key/${selectedTime}/${randomSession}`);
    }, 1500);
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

  // Nếu service không tồn tại
  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
        <GlassCard className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Dịch vụ không tồn tại</h2>
          <p className="text-gray-400 mb-6">Dịch vụ bạn tìm kiếm không có sẵn.</p>
          <Button onClick={() => navigate('/home')} icon={ArrowLeft}>
            Quay lại trang chủ
          </Button>
        </GlassCard>
      </div>
    );
  }

  const Icon = service.icon;

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
              onClick={() => navigate(`/${serviceName}`)}
              icon={ArrowLeft}
              className="p-2"
            />
            
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className={`w-8 h-8 rounded-full bg-${service.color}-500/20 flex items-center justify-center`}
              >
                <Icon className={`w-4 h-4 text-${service.color}-500`} />
              </motion.div>
              <h1 className="text-2xl font-bold text-gradient">{service.name}</h1>
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
          {/* Progress Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <GlassCard className="p-8">
              <div className="text-center mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className={`w-20 h-20 mx-auto mb-6 rounded-full bg-${service.color}-500/20 flex items-center justify-center`}
                >
                  <Icon className={`w-10 h-10 text-${service.color}-500`} />
                </motion.div>
                
                <h2 className="text-3xl font-bold text-white mb-4">
                  Đang xử lý Key {service.name}
                </h2>
                
                <p className="text-lg text-gray-300">
                  Thời gian: {selectedTime}h | Số link: {maxLinks}
                </p>
              </div>

              {/* Progress Info */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${
                    isCompleted ? 'text-green-500' : `text-${service.color}-400`
                  }`}>
                    {currentProgress}
                  </div>
                  <div className="text-sm text-gray-400">Đã hoàn thành</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">
                    {maxLinks}
                  </div>
                  <div className="text-sm text-gray-400">Tổng số links</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${
                    isCompleted ? 'text-green-500' : `text-${service.color}-400`
                  }`}>
                    {percentage}%
                  </div>
                  <div className="text-sm text-gray-400">Hoàn thành</div>
                </div>
              </div>

              {/* Large Progress Bar */}
              <div className="mb-8">
                <div className="relative">
                  {/* Background */}
                  <div className="w-full h-8 bg-gray-700/50 rounded-full overflow-hidden">
                    {/* Progress Fill */}
                    <motion.div
                      className={`h-full bg-gradient-to-r from-${service.color}-600 to-${service.color}-400 rounded-full relative overflow-hidden`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                      {/* Animated shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                    </motion.div>
                  </div>
                  
                  {/* Progress Text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {currentProgress} / {maxLinks} links
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              <div className="text-center mb-8">
                {!isCompleted ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-3"
                  >
                    <Spinner size="sm" />
                    <span className="text-gray-300">
                      Đang vượt link {currentProgress + 1}/{maxLinks}...
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-3 text-green-400"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">
                      Hoàn thành! Tất cả {maxLinks} links đã được vượt qua.
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Generate Key Button */}
              <AnimatePresence>
                {isCompleted && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleGenerateKey}
                        loading={isGenerating}
                        disabled={isGenerating}
                        size="xl"
                        className={`relative overflow-hidden bg-gradient-to-r from-${service.color}-600 to-${service.color}-400 hover:from-${service.color}-500 hover:to-${service.color}-300 text-white border-0 px-12 py-6 text-xl font-bold shadow-2xl`}
                      >
                        <AnimatePresence>
                          {!isGenerating && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-red-400/20"
                              animate={{ 
                                opacity: [0, 1, 0],
                                scale: [1, 1.1, 1]
                              }}
                              transition={{ 
                                duration: 2, 
                                repeat: Infinity,
                                ease: 'easeInOut'
                              }}
                            />
                          )}
                        </AnimatePresence>
                        
                        <div className="relative flex items-center gap-3">
                          {isGenerating ? (
                            <>
                              <Spinner size="sm" />
                              <span>Đang tạo Key...</span>
                            </>
                          ) : (
                            <>
                              <motion.div
                                animate={{ 
                                  rotate: [0, 360],
                                  scale: [1, 1.2, 1]
                                }}
                                transition={{ 
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: 'easeInOut'
                                }}
                              >
                                <Crown className="w-6 h-6" />
                              </motion.div>
                              <span>Tạo Key mới</span>
                              <Star className="w-5 h-5" />
                            </>
                          )}
                        </div>
                      </Button>
                    </motion.div>
                    
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-4 text-sm text-gray-400"
                    >
                      Click để tạo key {selectedTime}h cho dịch vụ {service.name}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Thông tin xử lý
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-white mb-3">Tiến trình</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-300">Xác thực dịch vụ</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-gray-300">
                        Vượt {maxLinks} links ({currentProgress}/{maxLinks})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-gray-300">Tạo key {selectedTime}h</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-white mb-3">Chi tiết</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dịch vụ:</span>
                      <span className="text-white font-medium">{service.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Thời gian:</span>
                      <span className="text-white font-medium">{selectedTime} giờ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Số lần vượt:</span>
                      <span className="text-white font-medium">{maxLinks} links</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trạng thái:</span>
                      <span className={`font-medium ${
                        isCompleted ? 'text-green-500' : `text-${service.color}-400`
                      }`}>
                        {isCompleted ? 'Hoàn thành' : 'Đang xử lý'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default GetKeyPage;
