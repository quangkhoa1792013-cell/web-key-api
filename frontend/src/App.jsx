/**
 * @file: App.jsx
 * @path: roblox/frontend/src/App.jsx
 * @purpose: Component chính của ứng dụng với routing và authentication
 * @functionality: React Router setup, route guards, page transitions, background effects
 * @connections: Kết nối đến tất cả pages, AuthContext, useAntiCheat hook
 */
import React, { useEffect, useState, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Pages
import DynamicPage from './pages/DynamicPage';
import BlockedPage from './pages/BlockedPage';

// Components
import LoadingScreen from './components/ui/LoadingScreen';

// Hooks
import { useAuth } from './context/AuthContext';

// Main App Component
const App = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  const { isAuthenticated, sessionId, isBlocked, isLoading: authLoading } = useAuth();

  // Tạo particle positions 1 lần duy nhất để tránh re-render liên tục
  const particles = useMemo(() => {
    return [...Array(20)].map(() => ({
      x1: Math.random() * 1200,
      y1: Math.random() * 800,
      x2: Math.random() * 1200,
      y2: Math.random() * 800,
      left: Math.random() * 1200,
      top: Math.random() * 800,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5
    }));
  }, []);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Wait for auth context to initialize
        if (authLoading) {
          return;
        }

        // Check if user is blocked
        if (isBlocked) {
          navigate('/blocked');
          return;
        }

      } catch (error) {
        console.error('App initialization failed:', error);
        setInitError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [isBlocked, authLoading, navigate]);

  // Hiển thị loading screen khi khởi tạo
  if (isLoading || authLoading) {
    return <LoadingScreen />;
  }

  // Nếu có lỗi khởi tạo, hiển thị giao diện cơ bản
  if (initError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center text-white p-8">
          <h1 className="text-2xl font-bold mb-4">⚠️ Khởi tạo ứng dụng thất bại</h1>
          <p className="text-gray-300 mb-6">{initError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  // Page transition variants
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1
    },
    out: {
      opacity: 0,
      y: -20,
      scale: 1.02
    }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid opacity-20" />
      <div className="fixed inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-500/30 rounded-full"
            animate={{
              x: [p.x1, p.x2],
              y: [p.y1, p.y2],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay
            }}
            style={{
              left: p.left,
              top: p.top
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          <Routes>
            {/* Blocked page route - must be before dynamic routes */}
            <Route 
              path="/blocked" 
              element={
                <motion.div
                  key="blocked"
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="flex items-center justify-center min-h-screen"
                >
                  <BlockedPage />
                </motion.div>
              } 
            />

            {/* SPA Dynamic Routes */}
            <Route 
              path="/" 
              element={
                <motion.div
                  key="home"
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <DynamicPage />
                </motion.div>
              } 
            />
            
            <Route 
              path="/key/:time/:sessionId" 
              element={
                <motion.div
                  key="key"
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <DynamicPage />
                </motion.div>
              } 
            />

            <Route 
              path="/:serviceName/get-key/:time" 
              element={
                <motion.div
                  key="progress"
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <DynamicPage />
                </motion.div>
              } 
            />
            
            <Route 
              path="/:serviceName" 
              element={
                <motion.div
                  key="service"
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <DynamicPage />
                </motion.div>
              } 
            />
            
            {/* Catch all route for 404 */}
            <Route 
              path="*" 
              element={
                <motion.div
                  key="404"
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="flex items-center justify-center min-h-screen"
                >
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gradient mb-4">404</h1>
                    <p className="text-xl text-gray-400 mb-8">Trang không tìm thấy</p>
                    <button
                      onClick={() => navigate('/')}
                      className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Về trang chủ
                    </button>
                  </div>
                </motion.div>
              } 
            />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
