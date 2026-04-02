/**
 * @file: Home.jsx
 * @path: roblox/frontend/src/pages/Home.jsx
 * @purpose: Trang chủ với dashboard và key management
 * @functionality: Key request form, status display, system information, navigation
 * @connections: Kết nối đến useAuth, useKeySystem, useAntiCheat hooks và các UI components
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Key, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Zap,
  Lock,
  User,
  Package,
  Link,
  Globe,
  Sparkles
} from 'lucide-react';

// Components
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import Spinner from '../components/ui/Spinner';
import AntiCheatBadge from '../components/features/AntiCheatBadge';
import KeyDisplay from '../components/features/KeyDisplay';
import Timer from '../components/features/Timer';

// Hooks
import { useAuth } from '../context/AuthContext';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { useKeySystem } from '../hooks/useKeySystem';

const Home = () => {
  const navigate = useNavigate();
  const { sessionId, ip, isAuthenticated, isBlocked } = useAuth();
  const { validateSession } = useAntiCheat();
  const { requestKey, keyData, isLoading, error, hasKey } = useKeySystem();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // Dữ liệu dịch vụ
  const services = [
    {
      id: 'lootlabs',
      name: 'Lootlabs',
      icon: Package,
      status: hasKey ? 'Đã có Key' : 'Chưa có Key',
      hasKey: hasKey,
      advantages: 'Nhanh',
      color: 'blue'
    },
    {
      id: 'linkvertise',
      name: 'Linkvertise',
      icon: Link,
      status: hasKey ? 'Đã có Key' : 'Chưa có Key',
      hasKey: hasKey,
      advantages: 'An toàn',
      color: 'green'
    },
    {
      id: 'worklink',
      name: 'Worklink',
      icon: Globe,
      status: hasKey ? 'Đã có Key' : 'Chưa có Key',
      hasKey: hasKey,
      advantages: 'Nhanh',
      color: 'purple'
    },
    {
      id: 'pandas',
      name: 'Pandas',
      icon: Sparkles,
      status: hasKey ? 'Đã có Key' : 'Chưa có Key',
      hasKey: hasKey,
      advantages: 'An toàn',
      color: 'orange'
    }
  ];

  // Kiểm tra trạng thái ban đầu
  useEffect(() => {
    const initialize = async () => {
      if (isBlocked) {
        navigate('/blocked');
        return;
      }

      if (!isAuthenticated) {
        navigate('/');
        return;
      }

      // Validate session
      const isValid = validateSession();
      if (!isValid) {
        navigate('/');
        return;
      }

      setIsInitialized(true);
    };

    initialize();
  }, [isBlocked, isAuthenticated, navigate, validateSession]);

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

  // Container animations
  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

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
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Shield className="w-8 h-8 text-blue-500" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gradient">Roblox Key System</h1>
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
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="space-y-8"
        >
          {/* Welcome section */}
          <motion.div variants={itemVariants} className="text-center py-8">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Chọn dịch vụ</span>
              <br />
              <span className="text-white">của bạn</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Khám phá các dịch vụ Roblox key với tốc độ và bảo mật cao
            </p>
          </motion.div>

          {/* Services Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedService(selectedService?.id === service.id ? null : service)}
                    className="cursor-pointer"
                  >
                    <GlassCard className={`p-6 hover:border-${service.color}-500/50 transition-all duration-300 ${
                      selectedService?.id === service.id ? `border-${service.color}-500` : ''
                    }`}>
                      <div className="text-center">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${service.color}-500/20 flex items-center justify-center`}
                        >
                          <Icon className={`w-8 h-8 text-${service.color}-500`} />
                        </motion.div>
                        
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {service.name}
                        </h3>
                        
                        <div className={`flex items-center justify-center gap-2 text-sm ${
                          service.hasKey ? 'text-green-500' : 'text-yellow-500'
                        }`}>
                          {service.hasKey ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>{service.status}</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4" />
                              <span>{service.status}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Service Detail Row */}
          <AnimatePresence>
            {selectedService && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                variants={itemVariants}
              >
                <GlassCard className="p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full bg-${selectedService.color}-500/20 flex items-center justify-center`}>
                        {React.createElement(selectedService.icon, {
                          className: `w-6 h-6 text-${selectedService.color}-500`
                        })}
                      </div>
                      
                      <div>
                        <h4 className="text-xl font-semibold text-white">
                          {selectedService.name}
                        </h4>
                        <p className="text-gray-400">
                          Ưu điểm: <span className="text-green-400 font-medium">{selectedService.advantages}</span>
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => navigate(`/${selectedService.id}`)}
                      icon={ArrowRight}
                      className="px-6"
                    >
                      Bắt đầu
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Key Status Summary */}
          <motion.div variants={itemVariants}>
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-500" />
                Trạng thái tổng quan
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-400">
                    {services.filter(s => s.hasKey).length}
                  </p>
                  <p className="text-sm text-gray-400">Dịch vụ có key</p>
                </div>
                
                <div>
                  <p className="text-2xl font-bold text-yellow-400">
                    {services.filter(s => !s.hasKey).length}
                  </p>
                  <p className="text-sm text-gray-400">Cần key</p>
                </div>
                
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {services.filter(s => s.advantages === 'Nhanh').length}
                  </p>
                  <p className="text-sm text-gray-400">Dịch vụ nhanh</p>
                </div>
                
                <div>
                  <p className="text-2xl font-bold text-purple-400">
                    {services.filter(s => s.advantages === 'An toàn').length}
                  </p>
                  <p className="text-sm text-gray-400">Dịch vụ an toàn</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Home;
