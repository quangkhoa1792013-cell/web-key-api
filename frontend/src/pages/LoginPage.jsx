import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

// Components
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import Spinner from '../components/ui/Spinner';
import AntiCheatBadge from '../components/features/AntiCheatBadge';

// Hooks
import { useAuth } from '../context/AuthContext';
import { useAntiCheat } from '../hooks/useAntiCheat';

// API
import { authApi } from '../api/keyApi';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setSession, setIP, isAuthenticated } = useAuth();
  const { getHWID } = useAntiCheat();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle'); // idle, success, error

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsLoading(true);
    setError('');
    setStatus('idle');

    try {
      // Lấy session mới
      const sessionResponse = await authApi.getSession();
      
      if (sessionResponse.success) {
        const sessionId = sessionResponse.data.sessionId;
        const userIP = sessionResponse.data.ip;
        
        // Lưu vào context
        setSession(sessionId);
        setIP(userIP);
        
        setStatus('success');
        
        // Chuyển đến trang home sau delay
        setTimeout(() => {
          navigate('/home');
        }, 1500);
      } else {
        setError(sessionResponse.message || 'Đăng nhập thất bại');
        setStatus('error');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Lỗi kết nối đến server';
      setError(errorMessage);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  // Get current HWID
  const currentHWID = getHWID();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex items-center justify-center">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid opacity-20" />
      <div className="fixed inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      
      {/* Floating particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-500/20 rounded-full"
            animate={{
              x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
              y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 mx-auto mb-4 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-50" />
                <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-4">
                  <Shield className="w-8 h-8 text-blue-500" />
                </div>
              </motion.div>
              
              <h1 className="text-3xl font-bold text-gradient mb-2">
                Roblox Key System
              </h1>
              <p className="text-gray-400">
                Đăng nhập để truy cập hệ thống
              </p>
            </div>

            {/* Anti-cheat badge */}
            <div className="flex justify-center mb-6">
              <AntiCheatBadge status="checking" showDetails={false} />
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Tên người dùng
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="cyber-input w-full px-4 py-3 rounded-lg"
                  placeholder="Nhập tên người dùng"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Password field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="cyber-input w-full px-4 py-3 pr-12 rounded-lg"
                    placeholder="Nhập mật khẩu"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Success message */}
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-start gap-2"
                >
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Đăng nhập thành công! Đang chuyển hướng...</span>
                </motion.div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                loading={isLoading}
                disabled={isLoading}
                size="lg"
                className="w-full"
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </form>

            {/* System info */}
            <div className="mt-8 pt-6 border-t border-gray-700/50">
              <div className="text-xs text-gray-500 space-y-2">
                <div className="flex justify-between">
                  <span>HWID:</span>
                  <span className="font-mono text-blue-400">
                    {currentHWID?.slice(0, 8) || 'N/A'}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Security:</span>
                  <span className="text-green-400">Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span>1.0.0</span>
                </div>
              </div>
            </div>

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Spinner size="lg" label="Đang xác thực..." />
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8 text-xs text-gray-500"
        >
          <p>Bằng việc đăng nhập, bạn đồng ý với điều khoản sử dụng của chúng tôi.</p>
          <p className="mt-2">© 2024 Roblox Key System. All rights reserved.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
