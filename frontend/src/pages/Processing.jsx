import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity,
  Cpu,
  Database,
  Lock,
  RefreshCw
} from 'lucide-react';

// Components
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import Spinner from '../components/ui/Spinner';
import Timer from '../components/features/Timer';
import AntiCheatBadge from '../components/features/AntiCheatBadge';

// Hooks
import { useAuth } from '../context/AuthContext';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { useKeySystem } from '../hooks/useKeySystem';

const Processing = () => {
  const navigate = useNavigate();
  const { sessionId, key, isAuthenticated, isBlocked } = useAuth();
  const { validateSession } = useAntiCheat();
  const { keyData, verifyKey } = useKeySystem();
  
  const [processingStage, setProcessingStage] = useState('initial'); // initial, validating, processing, completed, error
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(30); // 30 giây ước tính

  // Các stage xử lý
  const stages = [
    { id: 'validation', name: 'Xác thực key', icon: Shield, duration: 5000 },
    { id: 'security', name: 'Kiểm tra bảo mật', icon: Lock, duration: 3000 },
    { id: 'database', name: 'Kết nối database', icon: Database, duration: 4000 },
    { id: 'processing', name: 'Xử lý yêu cầu', icon: Cpu, duration: 8000 },
    { id: 'finalization', name: 'Hoàn tất', icon: CheckCircle, duration: 2000 }
  ];

  // Thêm log
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  // Xử lý từng stage
  const processStage = async (stageIndex) => {
    if (stageIndex >= stages.length) {
      setProcessingStage('completed');
      addLog('Tất cả các bước đã hoàn tất!', 'success');
      return;
    }

    const stage = stages[stageIndex];
    setProcessingStage(stage.id);
    addLog(`Bắt đầu ${stage.name.toLowerCase()}...`, 'info');

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, stage.duration));
    
    // Update progress
    const newProgress = ((stageIndex + 1) / stages.length) * 100;
    setProgress(newProgress);
    
    addLog(`${stage.name} hoàn tất`, 'success');
    
    // Move to next stage
    await processStage(stageIndex + 1);
  };

  // Bắt đầu xử lý
  const startProcessing = async () => {
    if (!key) {
      addLog('Không tìm thấy key!', 'error');
      setProcessingStage('error');
      return;
    }

    setStartTime(Date.now());
    setLogs([]);
    setProgress(0);
    setProcessingStage('validating');
    
    addLog('Bắt đầu xử lý key...', 'info');

    try {
      // Verify key với server
      addLog('Đang xác thực key với server...', 'info');
      const isValid = await verifyKey(key);
      
      if (!isValid) {
        addLog('Key không hợp lệ!', 'error');
        setProcessingStage('error');
        return;
      }

      addLog('Key hợp lệ! Tiếp tục xử lý...', 'success');
      
      // Process các stage
      await processStage(0);
      
    } catch (error) {
      addLog(`Lỗi: ${error.message}`, 'error');
      setProcessingStage('error');
    }
  };

  // Reset processing
  const resetProcessing = () => {
    setProcessingStage('initial');
    setProgress(0);
    setLogs([]);
    setStartTime(null);
  };

  // Kiểm tra trạng thái ban đầu
  useEffect(() => {
    if (isBlocked) {
      navigate('/blocked');
      return;
    }

    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    if (!key) {
      navigate('/home');
      return;
    }

    // Validate session
    const isValid = validateSession();
    if (!isValid) {
      navigate('/');
      return;
    }
  }, [isBlocked, isAuthenticated, key, navigate, validateSession]);

  // Tự động chuyển đến trang kết quả khi hoàn tất
  useEffect(() => {
    if (processingStage === 'completed') {
      const timer = setTimeout(() => {
        navigate('/result');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [processingStage, navigate]);

  // Get current stage info
  const getCurrentStage = () => {
    return stages.find(stage => stage.id === processingStage) || null;
  };

  const currentStage = getCurrentStage();
  const CurrentIcon = currentStage?.icon || Activity;

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
              animate={{ rotate: processingStage !== 'initial' ? 360 : 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Zap className="w-8 h-8 text-blue-500" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gradient">Đang xử lý</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <AntiCheatBadge status="safe" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/home')}
            >
              Quay lại
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Processing status */}
          <GlassCard className="p-8">
            <div className="text-center mb-8">
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-4"
                animate={{
                  scale: processingStage !== 'initial' && processingStage !== 'completed' ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 1,
                  repeat: processingStage !== 'initial' && processingStage !== 'completed' ? Infinity : 0,
                  ease: 'easeInOut'
                }}
              >
                {processingStage === 'initial' ? (
                  <Activity className="w-10 h-10 text-blue-500" />
                ) : processingStage === 'completed' ? (
                  <CheckCircle className="w-10 h-10 text-green-500" />
                ) : processingStage === 'error' ? (
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                ) : (
                  <CurrentIcon className="w-10 h-10 text-blue-500" />
                )}
              </motion.div>
              
              <h2 className="text-3xl font-bold text-white mb-2">
                {processingStage === 'initial' && 'Sẵn sàng xử lý'}
                {processingStage === 'completed' && 'Xử lý hoàn tất!'}
                {processingStage === 'error' && 'Đã xảy ra lỗi'}
                {currentStage && processingStage !== 'completed' && processingStage !== 'error' && currentStage.name}
              </h2>
              
              <p className="text-gray-400">
                {processingStage === 'initial' && 'Nhấn nút bên dưới để bắt đầu xử lý key'}
                {processingStage === 'completed' && 'Đang chuyển đến trang kết quả...'}
                {processingStage === 'error' && 'Vui lòng thử lại hoặc liên hệ hỗ trợ'}
                {currentStage && processingStage !== 'completed' && processingStage !== 'error' && 'Vui lòng đợi trong giây lát...'}
              </p>
            </div>

            {/* Progress bar */}
            {processingStage !== 'initial' && (
              <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Tiến trình</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {/* Timer */}
            {processingStage !== 'initial' && processingStage !== 'error' && (
              <div className="mb-8">
                <Timer 
                  initialTime={estimatedTime}
                  size="lg"
                  className="justify-center"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-center gap-4">
              {processingStage === 'initial' && (
                <Button
                  size="lg"
                  onClick={startProcessing}
                  icon={Zap}
                >
                  Bắt đầu xử lý
                </Button>
              )}
              
              {processingStage === 'error' && (
                <>
                  <Button
                    size="lg"
                    onClick={resetProcessing}
                    icon={RefreshCw}
                  >
                    Thử lại
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/home')}
                  >
                    Quay lại
                  </Button>
                </>
              )}
              
              {processingStage === 'completed' && (
                <Button
                  size="lg"
                  onClick={() => navigate('/result')}
                  icon={CheckCircle}
                >
                  Xem kết quả
                </Button>
              )}
            </div>
          </GlassCard>

          {/* Processing stages */}
          {processingStage !== 'initial' && (
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Các bước xử lý</h3>
              
              <div className="space-y-3">
                {stages.map((stage, index) => {
                  const StageIcon = stage.icon;
                  const isCompleted = progress > ((index + 1) / stages.length) * 100;
                  const isCurrent = stage.id === processingStage;
                  
                  return (
                    <motion.div
                      key={stage.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isCompleted 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : isCurrent 
                            ? 'bg-blue-500/10 border-blue-500/30'
                            : 'bg-gray-800/50 border-gray-700/50'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : isCurrent ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <StageIcon className="w-5 h-5 text-blue-500" />
                          </motion.div>
                        ) : (
                          <StageIcon className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className={`font-medium ${
                          isCompleted ? 'text-green-500' : 
                          isCurrent ? 'text-blue-500' : 
                          'text-gray-400'
                        }`}>
                          {stage.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isCompleted ? 'Đã hoàn tất' : 
                           isCurrent ? 'Đang xử lý...' : 
                           'Chờ xử lý'}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* Processing logs */}
          {logs.length > 0 && (
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Nhật ký xử lý</h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 p-2 rounded ${
                      log.type === 'error' ? 'bg-red-500/10' :
                      log.type === 'success' ? 'bg-green-500/10' :
                      'bg-blue-500/10'
                    }`}
                  >
                    <span className="text-xs text-gray-500 font-mono mt-0.5">
                      {log.timestamp}
                    </span>
                    <span className={`text-sm ${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      'text-blue-400'
                    }`}>
                      {log.message}
                    </span>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Processing;
