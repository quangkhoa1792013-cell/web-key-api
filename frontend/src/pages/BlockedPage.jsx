import React from 'react';
import { motion } from 'framer-motion';
import { ShieldX, AlertTriangle, Lock, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';

const BlockedPage = () => {
  const handleReload = () => {
    window.location.reload();
  };

  const handleClearData = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-gray-900 flex items-center justify-center">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid opacity-20" />
      <div className="fixed inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      
      {/* Main content */}
      <div className="relative z-10 max-w-md w-full mx-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="p-8 text-center">
            {/* Warning icon */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="w-20 h-20 mx-auto mb-6 relative"
            >
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
              <div className="relative bg-red-500/10 border border-red-500/30 rounded-full p-4">
                <ShieldX className="w-12 h-12 text-red-500" />
              </div>
            </motion.div>
            
            {/* Title and description */}
            <h1 className="text-3xl font-bold text-white mb-4">
              Truy cập bị chặn
            </h1>
            
            <p className="text-gray-400 mb-8 leading-relaxed">
              Chúng tôi đã phát hiện hoạt động bất thường hoặc vi phạm điều khoản sử dụng. 
              Tài khoản của bạn đã bị tạm khóa để bảo vệ hệ thống.
            </p>
            
            {/* Warning details */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-8 text-left">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-400">
                  <p className="font-medium mb-2">Nguyên nhân có thể:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Cố gắng bypass hệ thống bảo mật</li>
                    <li>• Sử dụng công cụ không được phép</li>
                    <li>• Thao tác bất thường</li>
                    <li>• Vi phạm điều khoản sử dụng</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleReload}
                icon={RefreshCw}
                className="w-full"
              >
                Thử lại
              </Button>
              
              <Button
                variant="secondary"
                onClick={handleClearData}
                icon={Lock}
                className="w-full"
              >
                Xóa dữ liệu và bắt đầu lại
              </Button>
            </div>
            
            {/* Help information */}
            <div className="mt-8 pt-6 border-t border-gray-700/50">
              <p className="text-xs text-gray-500 mb-2">
                Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ hỗ trợ.
              </p>
              <div className="text-xs text-gray-600">
                <p>Mã lỗi: ACCESS_BLOCKED</p>
                <p>Thời gian: {new Date().toLocaleString('vi-VN')}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default BlockedPage;
