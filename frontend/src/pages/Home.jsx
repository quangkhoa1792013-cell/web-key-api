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
  User
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
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    reason: ''
  });

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

  // Handle form submission
  const handleRequestKey = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.email.trim()) {
      return;
    }

    const result = await requestKey(formData);
    if (result) {
      setShowKeyForm(false);
      setFormData({ username: '', email: '', reason: '' });
    }
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
          <motion.div variants={itemVariants} className="text-center py-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Chào mừng đến với</span>
              <br />
              <span className="text-white">Hệ thống Key Roblox</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Quản lý và xác thực key một cách an toàn với công nghệ bảo mật tiên tiến
            </p>
          </motion.div>

          {/* Key status section */}
          <motion.div variants={itemVariants}>
            <GlassCard className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-white flex items-center gap-3">
                  <Key className="w-6 h-6 text-blue-500" />
                  Trạng thái Key
                </h3>
                
                {hasKey ? (
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Đã có key</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-500">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Chưa có key</span>
                  </div>
                )}
              </div>

              {/* Key display hoặc form yêu cầu */}
              {hasKey ? (
                <KeyDisplay 
                  keyData={keyData}
                  className="mb-6"
                />
              ) : (
                <div className="space-y-6">
                  {!showKeyForm ? (
                    <div className="text-center py-8">
                      <Lock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 mb-6">
                        Bạn chưa có key nào. Yêu cầu key mới để bắt đầu sử dụng hệ thống.
                      </p>
                      <Button
                        onClick={() => setShowKeyForm(true)}
                        size="lg"
                        icon={ArrowRight}
                      >
                        Yêu cầu Key mới
                      </Button>
                    </div>
                  ) : (
                    <motion.form
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleRequestKey}
                      className="space-y-4"
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <User className="w-4 h-4 inline mr-2" />
                            Tên người dùng
                          </label>
                          <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                            className="cyber-input w-full px-4 py-2 rounded-lg"
                            placeholder="Nhập tên người dùng"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="cyber-input w-full px-4 py-2 rounded-lg"
                            placeholder="email@example.com"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Lý do sử dụng (tùy chọn)
                        </label>
                        <textarea
                          value={formData.reason}
                          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                          className="cyber-input w-full px-4 py-2 rounded-lg h-24 resize-none"
                          placeholder="Mô tả lý do bạn cần key..."
                        />
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                        >
                          {error}
                        </motion.div>
                      )}

                      <div className="flex gap-3">
                        <Button
                          type="submit"
                          loading={isLoading}
                          disabled={isLoading}
                          icon={Zap}
                        >
                          {isLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
                        </Button>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setShowKeyForm(false)}
                          disabled={isLoading}
                        >
                          Hủy
                        </Button>
                      </div>
                    </motion.form>
                  )}
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Quick actions */}
          {hasKey && (
            <motion.div variants={itemVariants}>
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Hành động nhanh
                </h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/processing')}
                    icon={Clock}
                  >
                    Xử lý Key
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/result')}
                    icon={CheckCircle}
                  >
                    Xem kết quả
                  </Button>
                  
                  <Button
                    variant="danger"
                    onClick={() => {/* TODO: Implement revoke */}}
                  >
                    Thu hồi Key
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* System info */}
          <motion.div variants={itemVariants}>
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Thông tin hệ thống</h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">IP Address</p>
                  <p className="font-mono text-blue-400">{ip || 'Đang tải...'}</p>
                </div>
                
                <div>
                  <p className="text-gray-400">Session</p>
                  <p className="font-mono text-green-400">Hoạt động</p>
                </div>
                
                <div>
                  <p className="text-gray-400">Bảo mật</p>
                  <p className="font-mono text-green-400">Đã kích hoạt</p>
                </div>
                
                <div>
                  <p className="text-gray-400">Trạng thái</p>
                  <p className="font-mono text-blue-400">Bình thường</p>
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
