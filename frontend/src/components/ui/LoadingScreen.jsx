/**
 * @file: LoadingScreen.jsx
 * @path: roblox/frontend/src/components/ui/LoadingScreen.jsx
 * @purpose: Loading screen component cho application startup
 * @functionality: Animated logo, progress bar, security status display
 * @connections: Được sử dụng trong App.jsx và các pages khi cần loading
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex items-center justify-center">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid opacity-20" />
      <div className="fixed inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      
      {/* Loading content */}
      <div className="relative z-10 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-50" />
            <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6">
              <Shield className="w-12 h-12 text-blue-500 mx-auto" />
            </div>
          </div>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-gradient mb-4"
        >
          Roblox Key System
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-75" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150" />
          </div>
          
          <p className="text-gray-400">Đang khởi tạo hệ thống...</p>
          
          <div className="w-64 h-1 bg-gray-700 rounded-full overflow-hidden mx-auto">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500"
        >
          <Zap className="w-4 h-4" />
          <span>Đang tải các module bảo mật...</span>
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;
