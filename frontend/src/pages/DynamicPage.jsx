/**
 * @file: DynamicPage.jsx
 * @path: roblox/frontend/src/pages/DynamicPage.jsx
 * @purpose: Component chung xử lý SPA routing - URL làm bộ lọc dữ liệu
 * @functionality: Parse URL params, inject dữ liệu tương ứng, render UI động
 * @connections: Kết nối đến useAuth, useKeySystem, useAntiCheat
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Components
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

// Hooks
import { useAuth } from '../context/AuthContext';

// Icons
import { Package, Link, Globe, Sparkles, Copy, RefreshCw, ArrowLeft, Home, Key, Clock, Shield, CheckCircle } from 'lucide-react';

// Dữ liệu dịch vụ
const services = {
  lootlabs: {
    id: 'lootlabs',
    name: 'Lootlabs',
    icon: Package,
    description: 'Dịch vụ key Roblox nhanh và đáng tin cậy',
    advantages: ['Nhanh chóng', 'Độ tin cậy cao', 'Hỗ trợ 24/7'],
    color: 'blue',
    processingTime: '5-10 phút'
  },
  linkvertise: {
    id: 'linkvertise',
    name: 'Linkvertise',
    icon: Link,
    description: 'Dịch vụ key an toàn với bảo mật cao',
    advantages: ['Bảo mật tối đa', 'Chứng nhận SSL', 'Anti-DDoS'],
    color: 'green',
    processingTime: '10-15 phút'
  },
  worklink: {
    id: 'worklink',
    name: 'Worklink',
    icon: Globe,
    description: 'Dịch vụ key toàn cầu với tốc độ cao',
    advantages: ['Toàn cầu', 'Tốc độ cao', 'Multi-server'],
    color: 'purple',
    processingTime: '5-8 phút'
  },
  pandas: {
    id: 'pandas',
    name: 'Pandas',
    icon: Sparkles,
    description: 'Dịch vụ key premium với tính năng đặc biệt',
    advantages: ['Premium', 'Tính năng đặc biệt', 'Ưu tiên hỗ trợ'],
    color: 'orange',
    processingTime: '3-7 phút'
  }
};

// Dữ liệu mốc thời gian
const milestones = [
  { hours: 4, bypasses: 1 },
  { hours: 8, bypasses: 2 },
  { hours: 16, bypasses: 3 },
  { hours: 24, bypasses: 4 },
  { hours: 32, bypasses: 5 },
  { hours: 40, bypasses: 6 },
  { hours: 48, bypasses: 7 },
  { hours: 56, bypasses: 8 },
  { hours: 64, bypasses: 9 },
  { hours: 67, bypasses: 10 }
];

// DynamicPage Component
const DynamicPage = () => {
  // Get URL params with fallbacks
  const params = useParams();
  const serviceName = params.serviceName || '';
  const time = params.time || '';
  const urlSessionId = params.sessionId || '';
  const navigate = useNavigate();
  
  // Auth and system hooks
  const { sessionId, ip, isAuthenticated, isBlocked } = useAuth();
  
  // State
  const [viewType, setViewType] = useState('home'); // home | service | progress | key
  const [currentService, setCurrentService] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // Parse URL and set view type
  useEffect(() => {
    // Determine view type based on available params
    if (serviceName && time && urlSessionId) {
      // /key/:time/:sessionId pattern
      setViewType('key');
      setSelectedTime(parseInt(time));
      setCurrentSession(urlSessionId);
      generateKeyData(parseInt(time), urlSessionId);
    } else if (serviceName && time) {
      // /:serviceName/get-key/:time pattern
      setViewType('progress');
      setCurrentService(services[serviceName]);
      setSelectedTime(parseInt(time));
      startProgressSimulation();
    } else if (serviceName) {
      // /:serviceName pattern
      if (services[serviceName]) {
        setViewType('service');
        setCurrentService(services[serviceName]);
        setSelectedTime(null);
      } else {
        // Invalid service name, redirect to home
        setViewType('home');
      }
    } else {
      // No params, home view
      setViewType('home');
    }
  }, [serviceName, time, urlSessionId]);

  // Progress simulation
  const startProgressSimulation = () => {
    setProgress(0);
    setIsCompleted(false);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 1;
        if (newProgress >= milestones.find(m => m.hours === selectedTime)?.bypasses || 10) {
          setIsCompleted(true);
          clearInterval(interval);
          return milestones.find(m => m.hours === selectedTime)?.bypasses || 10;
        }
        return newProgress;
      });
    }, 1000);
  };

  // Generate key data with automatic expiration calculation
  const generateKeyData = (time, session) => {
    const key = `ROBLOX-KEY-${time}H-${session.toUpperCase()}`;
    const now = new Date();
    const expireDate = new Date(now.getTime() + (time * 60 * 60 * 1000));
    
    // Set time left for countdown
    setTimeLeft(expireDate);
    
    // Auto-calculate expiration status
    const checkExpiration = () => {
      const current = new Date();
      setIsExpired(current >= expireDate);
    };
    
    // Check immediately and then every second
    checkExpiration();
    const expirationInterval = setInterval(checkExpiration, 1000);
    
    // Cleanup interval
    return () => clearInterval(expirationInterval);
  };

  // Copy key to clipboard
  const copyKey = async () => {
    const key = `ROBLOX-KEY-${selectedTime}H-${currentSession?.toUpperCase()}`;
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy key:', error);
    }
  };

  // Navigate functions
  const navigateToService = (serviceId) => {
    navigate(`/${serviceId}`);
  };

  const navigateToProgress = (serviceId, time) => {
    navigate(`/${serviceId}/get-key/${time}`);
  };

  const navigateToKey = (time, session) => {
    navigate(`/key/${time}/${session}`);
  };

  const navigateHome = () => {
    navigate('/');
  };

  // Render Home View
  const renderHome = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gradient mb-4">
            Roblox Key Generator
          </h1>
          <p className="text-xl text-gray-300">
            Chọn dịch vụ để bắt đầu tạo key Roblox
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.values(services).map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigateToService(service.id)}
                className="cursor-pointer"
              >
                <GlassCard className="p-6 text-center hover:shadow-2xl transition-all duration-300">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-${service.color}-500 to-${service.color}-600 flex items-center justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                  <p className="text-gray-300 text-sm mb-3">{service.description}</p>
                  <div className="flex flex-wrap gap-1 justify-center mb-3">
                    {service.advantages.map((advantage, idx) => (
                      <span key={idx} className={`px-2 py-1 bg-${service.color}-500/20 text-${service.color}-300 text-xs rounded-full`}>
                        {advantage}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-400">
                    ⏱️ {service.processingTime}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  // Render Service View
  const renderService = () => {
    if (!currentService) return renderHome();
    
    const Icon = currentService.icon;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="min-h-screen p-6"
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={navigateHome}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            
            <GlassCard className="p-8">
              <div className="flex items-center mb-6">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-r from-${currentService.color}-500 to-${currentService.color}-600 flex items-center justify-center mr-6`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{currentService.name}</h1>
                  <p className="text-gray-300">{currentService.description}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {currentService.advantages.map((advantage, idx) => (
                  <span key={idx} className={`px-3 py-1 bg-${currentService.color}-500/20 text-${currentService.color}-300 rounded-full`}>
                    {advantage}
                  </span>
                ))}
              </div>
              
              <div className="text-sm text-gray-400">
                ⏱️ Thời gian xử lý: {currentService.processingTime}
              </div>
            </GlassCard>
          </motion.div>

          {/* Milestones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6">Chọn thời gian Key</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.hours}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <GlassCard 
                    className="p-6 cursor-pointer hover:shadow-xl transition-all duration-300"
                    onClick={() => navigateToProgress(currentService.id, milestone.hours)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-blue-400 mr-2" />
                        <span className="text-lg font-bold text-white">{milestone.hours}h</span>
                      </div>
                      <div className="flex items-center">
                        <Key className="w-4 h-4 text-green-400 mr-1" />
                        <span className="text-sm text-gray-300">{milestone.bypasses} links</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      Thời gian Key: {milestone.hours} giờ | Số lần vượt link: {milestone.bypasses}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  // Render Progress View
  const renderProgress = () => {
    if (!currentService || !selectedTime) return renderHome();
    
    const maxLinks = milestones.find(m => m.hours === selectedTime)?.bypasses || 10;
    const percentage = Math.round((progress / maxLinks) * 100);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="min-h-screen p-6 flex items-center justify-center"
      >
        <div className="max-w-4xl w-full">
          <GlassCard className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                {React.createElement(currentService.icon, {
                  className: `w-16 h-16 text-${currentService.color}-500`
                })}
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {currentService.name} - Key {selectedTime}H
              </h1>
              <p className="text-gray-300">
                Đang xử lý yêu cầu tạo key...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Đã hoàn thành: {progress}/{maxLinks} links</span>
                <span>Phần trăm: {percentage}%</span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Status */}
            <div className="text-center">
              {isCompleted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="text-green-400 text-xl font-bold">
                    ✓ Hoàn thành! Key đã sẵn sàng
                  </div>
                  <Button
                    onClick={() => {
                      const randomSession = Math.random().toString(36).substring(2, 15);
                      navigateToKey(selectedTime, randomSession);
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg shadow-lg hover:shadow-green-500/25 transition-all duration-300"
                  >
                    <Key className="w-5 h-5 mr-2" />
                    Tạo Key mới
                  </Button>
                </motion.div>
              ) : (
                <div className="flex items-center justify-center">
                  <Spinner size="lg" />
                  <span className="ml-3 text-gray-300">Đang xử lý...</span>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </motion.div>
    );
  };

  // Render Key View
  const renderKey = () => {
    if (!selectedTime || !currentSession) return renderHome();
    
    const key = `ROBLOX-KEY-${selectedTime}H-${currentSession.toUpperCase()}`;
    const now = new Date();
    const expireDate = new Date(now.getTime() + (selectedTime * 60 * 60 * 1000));
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="min-h-screen p-6 flex items-center justify-center"
      >
        <div className="max-w-4xl w-full">
          <GlassCard className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Key className="w-16 h-16 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Key {selectedTime}H
              </h1>
              <p className="text-gray-300">
                Key Roblox của bạn đã được tạo thành công
              </p>
            </div>

            {/* Key Display */}
            <div className="mb-8">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <code className="text-green-400 font-mono text-lg break-all">
                    {key}
                  </code>
                  <Button
                    onClick={copyKey}
                    variant="ghost"
                    className="ml-4"
                  >
                    {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Key Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Shield className="w-4 h-4 text-blue-400 mr-2" />
                  <span className="text-sm text-gray-400">HWID</span>
                </div>
                <div className="text-white font-mono text-sm">
                  {ip || 'Unknown'}
                </div>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Clock className="w-4 h-4 text-green-400 mr-2" />
                  <span className="text-sm text-gray-400">Thời gian còn lại</span>
                </div>
                <div className="text-white font-mono text-sm">
                  {isExpired ? 'Đã hết hạn' : `${selectedTime} giờ`}
                </div>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <RefreshCw className="w-4 h-4 text-purple-400 mr-2" />
                  <span className="text-sm text-gray-400">Ngày khởi tạo</span>
                </div>
                <div className="text-white font-mono text-sm">
                  {now.toLocaleString('vi-VN')}
                </div>
              </div>
              
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Clock className="w-4 h-4 text-red-400 mr-2" />
                  <span className="text-sm text-gray-400">Ngày hết hạn</span>
                </div>
                <div className="text-white font-mono text-sm">
                  {expireDate.toLocaleString('vi-VN')}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="text-center space-y-4">
              <Button
                onClick={navigateHome}
                variant="ghost"
                className="mr-4"
              >
                <Home className="w-4 h-4 mr-2" />
                Về trang chủ
              </Button>
              
              {isExpired && (
                <Button
                  onClick={() => {
                    const randomSession = Math.random().toString(36).substring(2, 15);
                    navigateToKey(selectedTime, randomSession);
                  }}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Tạo Key mới
                </Button>
              )}
            </div>
          </GlassCard>
        </div>
      </motion.div>
    );
  };

  // Render based on view type
  switch (viewType) {
    case 'service':
      return renderService();
    case 'progress':
      return renderProgress();
    case 'key':
      return renderKey();
    default:
      return renderHome();
  }
};

export default DynamicPage;
