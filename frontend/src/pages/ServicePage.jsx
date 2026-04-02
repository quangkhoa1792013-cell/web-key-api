/**
 * @file: ServicePage.jsx
 * @path: roblox/frontend/src/pages/ServicePage.jsx
 * @purpose: Trang dịch vụ chung cho các dịch vụ Roblox key
 * @functionality: Hiển thị thông tin dịch vụ, form yêu cầu key, và xử lý
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
  Key
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

const ServicePage = () => {
  const navigate = useNavigate();
  const { serviceName } = useParams();
  const { sessionId, ip, isAuthenticated, isBlocked } = useAuth();
  const { validateSession } = useAntiCheat();
  const { requestKey, keyData, isLoading, error, hasKey } = useKeySystem();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  // Dữ liệu dịch vụ
  const serviceData = {
    lootlabs: {
      name: 'Lootlabs',
      icon: Package,
      description: 'Dịch vụ key Roblox nhanh và đáng tin cậy',
      advantages: ['Nhanh chóng', 'Độ tin cậy cao', 'Hỗ trợ 24/7'],
      color: 'blue',
      processingTime: '5-10 phút'
    },
    linkvertise: {
      name: 'Linkvertise',
      icon: Link,
      description: 'Dịch vụ key an toàn với bảo mật cao',
      advantages: ['Bảo mật tối đa', 'Chứng nhận SSL', 'Anti-DDoS'],
      color: 'green',
      processingTime: '10-15 phút'
    },
    worklink: {
      name: 'Worklink',
      icon: Globe,
      description: 'Dịch vụ key toàn cầu với tốc độ cao',
      advantages: ['Toàn cầu', 'Tốc độ cao', 'Multi-server'],
      color: 'purple',
      processingTime: '5-8 phút'
    },
    pandas: {
      name: 'Pandas',
      icon: Sparkles,
      description: 'Dịch vụ key premium với tính năng đặc biệt',
      advantages: ['Premium', 'Tính năng đặc biệt', 'Ưu tiên hỗ trợ'],
      color: 'orange',
      processingTime: '3-7 phút'
    }
  };

  // Dữ liệu các mốc thời gian
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

  const service = serviceData[serviceName];

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

  // Handle milestone selection
  const handleSelectMilestone = (hours) => {
    setSelectedMilestone(hours);
    // Navigate to get-key page with new URL format
    navigate(`/${serviceName}/get-key/${hours}`);
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
              onClick={() => navigate('/home')}
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
          {/* Service Info */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <GlassCard className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className={`w-20 h-20 rounded-full bg-${service.color}-500/20 flex items-center justify-center mb-6`}>
                    <Icon className={`w-10 h-10 text-${service.color}-500`} />
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-4">
                    {service.name}
                  </h2>
                  
                  <p className="text-lg text-gray-300 mb-6">
                    {service.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{service.processingTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Bảo mật cao</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Ưu điểm nổi bật
                  </h3>
                  
                  <div className="space-y-3">
                    {service.advantages.map((advantage, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-gray-300">{advantage}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Key Request Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-white flex items-center gap-3">
                  <Key className="w-6 h-6 text-blue-500" />
                  Chọn thời gian Key {service.name}
                </h3>
                
                {selectedMilestone ? (
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Đã chọn {selectedMilestone}h</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-500">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Chưa chọn</span>
                  </div>
                )}
              </div>

              {/* Milestones Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {milestones.map((milestone, index) => (
                    <motion.div
                      key={milestone.hours}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectMilestone(milestone.hours)}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all duration-300 ${
                        selectedMilestone === milestone.hours
                          ? `border-${service.color}-500 bg-${service.color}-500/10`
                          : 'border-gray-600/50 bg-gray-800/30 hover:border-gray-500/50'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`text-2xl font-bold mb-2 ${
                          selectedMilestone === milestone.hours
                            ? `text-${service.color}-400`
                            : 'text-white'
                        }`}>
                          {milestone.hours}h
                        </div>
                        
                        <div className="text-sm text-gray-400 mb-3">
                          Thời gian Key
                        </div>
                        
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          selectedMilestone === milestone.hours
                            ? `bg-${service.color}-500/20 text-${service.color}-300`
                            : 'bg-gray-600/20 text-gray-300'
                        }`}>
                          <Zap className="w-3 h-3" />
                          {milestone.bypasses} lần vượt
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Selected Milestone Info */}
                {selectedMilestone && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-1">
                          Đã chọn: {selectedMilestone} giờ
                        </h4>
                        <p className="text-gray-300">
                          Số lần vượt link: {milestones.find(m => m.hours === selectedMilestone)?.bypasses} lần
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => handleSelectMilestone(selectedMilestone)}
                        icon={ArrowRight}
                        className="px-6"
                      >
                        Tiếp tục
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Help Text */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-400">
                    Chọn thời gian sử dụng key phù hợp với nhu cầu của bạn
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Thời gian càng dài, số lần vượt link càng nhiều
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default ServicePage;
