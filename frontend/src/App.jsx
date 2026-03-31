import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Context Provider
import { AuthProvider } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Processing from './pages/Processing';
import Result from './pages/Result';

// Components
import LoadingScreen from './components/ui/LoadingScreen';
import BlockedPage from './pages/BlockedPage';
import LoginPage from './pages/LoginPage';

// Hooks
import { useAuth } from './context/AuthContext';
import { useAntiCheat } from './hooks/useAntiCheat';

// Route Guard Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isBlocked } = useAuth();
  const { validateSession } = useAntiCheat();

  // Kiểm tra session validity
  const isSessionValid = validateSession();

  if (isBlocked) {
    return <Navigate to="/blocked" replace />;
  }

  if (!isAuthenticated || !isSessionValid) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route (chỉ cho truy cập khi chưa đăng nhập)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isBlocked } = useAuth();

  if (isBlocked) {
    return <Navigate to="/blocked" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

// Main App Component
const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Khởi tạo anti-cheat
        // Các khởi tạo khác có thể thêm ở đây
        
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error) {
        console.error('App initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Hiển thị loading screen khi khởi tạo
  if (isLoading) {
    return <LoadingScreen />;
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
    <AuthProvider>
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
                {/* Public routes */}
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <motion.div
                        key="login"
                        initial="initial"
                        animate="in"
                        exit="out"
                        variants={pageVariants}
                        transition={pageTransition}
                      >
                        <LoginPage />
                      </motion.div>
                    </PublicRoute>
                  } 
                />

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
                  element={<Navigate to="/login" replace />} 
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
    </AuthProvider>
  );
};

export default App;
