/**
 * @file: Result.jsx
 * @path: roblox/frontend/src/pages/Result.jsx
 * @purpose: Trang kết quả với key information và statistics
 * @functionality: Key display, statistics, download/share features, system info
 * @connections: Kết nối đến useAuth, useKeySystem hooks và KeyDisplay component
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Share2,
  Copy,
  RefreshCw,
  Home,
  Clock,
  Shield,
  Key,
  User,
  Calendar,
  Activity,
  BarChart3,
  Zap
} from 'lucide-react';

// Components
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import KeyDisplay from '../components/features/KeyDisplay';
import AntiCheatBadge from '../components/features/AntiCheatBadge';

// Hooks
import { useAuth } from '../context/AuthContext';
import { useKeySystem } from '../hooks/useKeySystem';

const Result = () => {
  const navigate = useNavigate();
  const { sessionId, ip, isAuthenticated, isBlocked } = useAuth();
  const { keyData, getKeyInfo } = useKeySystem();
  
  const [resultData, setResultData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Load result data
  const loadResultData = async () => {
    setIsLoading(true);
    try {
      // Gọi API để lấy thông tin key thật
      const result = await getKeyInfo({ sessionId });
      
      // Thêm delay nhỏ để animation mượt mà
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setResultData(result);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load result:', error);
      setIsLoading(false);
    }
  };

  // Copy result to clipboard
  const copyResult = async () => {
    if (!resultData) return;

    const textToCopy = `
Key: ${resultData.key}
Status: ${resultData.status}
Created: ${new Date(resultData.createdAt).toLocaleString('vi-VN')}
Expires: ${new Date(resultData.expiresAt).toLocaleString('vi-VN')}
Features: ${resultData.features.join(', ')}
    `.trim();

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Download result as file
  const downloadResult = () => {
    if (!resultData) return;

    const data = {
      key: resultData.key,
      status: resultData.status,
      createdAt: resultData.createdAt,
      expiresAt: resultData.expiresAt,
      features: resultData.features,
      statistics: resultData.statistics,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `key-result-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Share result
  const shareResult = async () => {
    if (!resultData) return;

    const shareData = {
      title: 'Roblox Key System - Kết quả',
      text: `Key: ${resultData.key.slice(0, 8)}... Status: ${resultData.status}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await copyResult();
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  // Refresh result
  const refreshResult = () => {
    loadResultData();
  };

  // Check initial state
  useEffect(() => {
    if (isBlocked) {
      navigate('/blocked');
      return;
    }

    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    // Load result data
    loadResultData();
  }, [isBlocked, isAuthenticated, navigate]);

  // Get status icon and color
  const getStatusInfo = () => {
    if (!resultData) return { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    
    switch (resultData.status) {
      case 'active':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' };
      case 'expired':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' };
      case 'pending':
        return { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
      default:
        return { icon: AlertTriangle, color: 'text-gray-500', bg: 'bg-gray-500/10' };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

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
              <CheckCircle className="w-8 h-8 text-green-500" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gradient">Kết quả xử lý</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <AntiCheatBadge status="safe" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/home')}
              icon={Home}
            >
              Trang chủ
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pb-12">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Đang tải kết quả...</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {resultData && (
              <>
                {/* Success/Failure banner */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-6 rounded-xl border ${statusInfo.bg} ${statusInfo.color.replace('text', 'border')}`}
                >
                  <div className="flex items-center gap-4">
                    <StatusIcon className="w-12 h-12" />
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {resultData.success ? 'Xử lý thành công!' : 'Xử lý thất bại'}
                      </h2>
                      <p className="text-gray-400">
                        {resultData.success 
                          ? 'Key của bạn đã được xử lý và sẵn sàng sử dụng'
                          : 'Đã xảy ra lỗi trong quá trình xử lý key'
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Key display */}
                <KeyDisplay 
                  keyData={resultData}
                  showCopyButton={true}
                  showToggleVisibility={true}
                />

                {/* Action buttons */}
                <GlassCard className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Hành động</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button
                      onClick={copyResult}
                      icon={Copy}
                      disabled={copied}
                    >
                      {copied ? 'Đã sao chép!' : 'Sao chép'}
                    </Button>
                    
                    <Button
                      variant="secondary"
                      onClick={downloadResult}
                      icon={Download}
                    >
                      Tải xuống
                    </Button>
                    
                    <Button
                      variant="secondary"
                      onClick={shareResult}
                      icon={Share2}
                    >
                      Chia sẻ
                    </Button>
                    
                    <Button
                      variant="ghost"
                      onClick={refreshResult}
                      icon={RefreshCw}
                    >
                      Làm mới
                    </Button>
                  </div>
                </GlassCard>

                {/* Key information */}
                <GlassCard className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5 text-blue-500" />
                    Thông tin Key
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Trạng thái</p>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color} ${statusInfo.color.replace('text', 'border')}`}>
                          <StatusIcon className="w-4 h-4" />
                          {resultData.status === 'active' ? 'Hoạt động' :
                           resultData.status === 'expired' ? 'Hết hạn' :
                           resultData.status === 'pending' ? 'Đang chờ' : 'Không xác định'}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Ngày tạo</p>
                        <p className="text-white font-medium">
                          {new Date(resultData.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Ngày hết hạn</p>
                        <p className="text-white font-medium">
                          {new Date(resultData.expiresAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Lần sử dụng</p>
                        <p className="text-white font-medium">
                          {resultData.usage?.total || 0} / {resultData.usage?.remaining || '∞'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Lần sử dụng cuối</p>
                        <p className="text-white font-medium">
                          {resultData.usage?.lastUsed 
                            ? new Date(resultData.usage.lastUsed).toLocaleString('vi-VN')
                            : 'Chưa sử dụng'
                          }
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Features</p>
                        <div className="flex flex-wrap gap-2">
                          {resultData.features?.map((feature, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Statistics */}
                <GlassCard className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                    Thống kê xử lý
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                      <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">
                        {resultData.statistics?.processingTime || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-400">Thời gian xử lý</p>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                      <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">
                        {resultData.statistics?.verificationScore || 0}%
                      </p>
                      <p className="text-sm text-gray-400">Điểm xác thực</p>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                      <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">
                        {resultData.usage?.total || 0}
                      </p>
                      <p className="text-sm text-gray-400">Tổng sử dụng</p>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                      <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">
                        {Math.ceil((new Date(resultData.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))}
                      </p>
                      <p className="text-sm text-gray-400">Ngày còn lại</p>
                    </div>
                  </div>
                </GlassCard>

                {/* System info */}
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">Thông tin hệ thống</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      {showDetails ? 'Ẩn chi tiết' : 'Hiện chi tiết'}
                    </Button>
                  </div>
                  
                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Session ID</p>
                            <p className="font-mono text-blue-400">
                              {sessionId?.slice(0, 16)}...
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-gray-400">IP Address</p>
                            <p className="font-mono text-green-400">{ip || 'N/A'}</p>
                          </div>
                          
                          <div>
                            <p className="text-gray-400">Security Level</p>
                            <p className="font-mono text-yellow-500">
                              {resultData.statistics?.securityLevel || 'Maximum'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-gray-400">Generated at</p>
                            <p className="font-mono text-purple-400">
                              {new Date().toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Result;
