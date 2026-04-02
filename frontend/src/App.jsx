/**
 * @file: App.jsx
 * @path: roblox/frontend/src/App.jsx
 * @purpose: Component chính của ứng dụng với routing và authentication
 * @functionality: React Router setup, route guards, page transitions, background effects
 * @connections: Kết nối đến tất cả pages, AuthContext, useAntiCheat hook
 */
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Pages
import Home from './pages/Home';
import Processing from './pages/Processing';
import Result from './pages/Result';
import ServicePage from './pages/ServicePage';
import GetKeyPage from './pages/GetKeyPage';
import KeyResultPage from './pages/KeyResultPage';

// Components
import LoadingScreen from './components/ui/LoadingScreen';
import BlockedPage from './pages/BlockedPage';
import LoginPage from './pages/LoginPage';

// Hooks
import { useAuth } from './context/AuthContext';
import { useAntiCheat } from './hooks/useAntiCheat';

// Route Guard Component
const ProtectedRoute = ({ children }) => {
  try {
    const { isAuthenticated, isBlocked } = useAuth();
    const { validateSession } = useAntiCheat();

    // Kiểm tra session validity với try...catch
    let isSessionValid = false;
    try {
      isSessionValid = validateSession();
    } catch (error) {
      console.error('Session validation failed:', error);
      isSessionValid = false;
    }

    if (isBlocked) {
      return <Navigate to="/blocked" replace />;
    }

    if (!isAuthenticated || !isSessionValid) {
      return <Navigate to="/login" replace />;
    }

    return children;
  } catch (error) {
    console.error('ProtectedRoute error:', error);
    // Nếu có lỗi, chuyển đến trang login
    return <Navigate to="/login" replace />;
  }
};

// Public Route (chỉ cho truy cập khi chưa đăng nhập)
const PublicRoute = ({ children }) => {
  try {
    const { isAuthenticated, isBlocked } = useAuth();

    if (isBlocked) {
      return <Navigate to="/blocked" replace />;
    }

    if (isAuthenticated) {
      return <Navigate to="/home" replace />;
    }

    return children;
  } catch (error) {
    console.error('PublicRoute error:', error);
    // Nếu có lỗi, hiển thị children (mặc định)
    return children;
  }
};

// Main App Component
const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  const { isAuthenticated, sessionId, isBlocked, isLoading: authLoading } = useAuth();

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

        // Auto-redirect to home since no login needed
        navigate('/home');
      } catch (error) {
        console.error('App initialization failed:', error);
        // Still redirect to home even on error
        navigate('/home');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [isAuthenticated, isBlocked, authLoading, navigate]);

  // Hiển thị loading screen khi khởi tạo
  if (isLoading) {
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
          <p className="text-sm text-gray-400 mt-4">
            Hoặc truy cập <a href="/login" className="text-blue-400 hover:underline">trang đăng nhập</a>
          </p>
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
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
        {/* Background effects */}
        <div className="fixed inset-0 bg-grid opacity-20" />
        <div className="fixed inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Animated background particles */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-500/30 rounded-full"
              animate={{
                x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
                y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                delay: Math.random() * 5
              }}
              style={{
                left: Math.random() * window.innerWidth,
                top: Math.random() * window.innerHeight
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <Routes>
              {/* Protected routes */}
              <Route 
                path="/home" 
                element={
                  <ProtectedRoute>
                    <motion.div
                      key="home"
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <Home />
                    </motion.div>
                  </ProtectedRoute>
                } 
              />
              
              {/* Service routes */}
              <Route 
                path="/lootlabs" 
                element={
                  <ProtectedRoute>
                    <motion.div
                      key="lootlabs"
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <ServicePage />
                    </motion.div>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/linkvertise" 
                element={
                  <ProtectedRoute>
                    <motion.div
                      key="linkvertise"
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <ServicePage />
                    </motion.div>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/worklink" 
                element={
                  <ProtectedRoute>
                    <motion.div
                      key="worklink"
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <ServicePage />
                    </motion.div>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/pandas" 
                element={
                  <ProtectedRoute>
                    <motion.div
                      key="pandas"
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <ServicePage />
                    </motion.div>
                  </ProtectedRoute>
                } 
              />
              
              {/* Get Key routes */}
              <Route 
                path="/:serviceName/get-key/:time" 
                element={
                  <ProtectedRoute>
                    <motion.div
                      key="get-key"
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <GetKeyPage />
                    </motion.div>
                  </ProtectedRoute>
                } 
              />
              
              {/* Key Result routes */}
              <Route 
                path="/key/:time/:sessionId" 
                element={
                  <ProtectedRoute>
                    <motion.div
                      key="key-result"
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <KeyResultPage />
                    </motion.div>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/processing" 
                element={
                  <ProtectedRoute>
                    <motion.div
                      key="processing"
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <Processing />
                    </motion.div>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/result" 
                element={
                  <ProtectedRoute>
                    <motion.div
                      key="result"
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <Result />
                    </motion.div>
                  </ProtectedRoute>
                } 
              />

              {/* Blocked page */}
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
                  >
                    <BlockedPage />
                  </motion.div>
                } 
              />

              {/* Default redirect */}
              <Route 
                path="/" 
                element={<Navigate to="/home" replace />} 
              />
              
              {/* Catch all route */}
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
                        onClick={() => window.history.back()}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        Quay lại
                      </button>
                    </div>
                  </motion.div>
                } 
              />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
    </Router>
  );
};

export default App;
