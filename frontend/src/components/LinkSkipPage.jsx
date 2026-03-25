import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, Key, Copy, CheckCircle, ChevronRight, AlertCircle, ArrowLeft, Shield, Loader2, ExternalLink } from 'lucide-react';

function LinkSkipPage() {
  const navigate = useNavigate();
  const params = useParams();
  
  // Get serviceId and time from URL params
  const { serviceId, time } = params;
  
  const [sessionInfo, setSessionInfo] = useState(null);
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  const [validationError, setValidationError] = useState(null);
  const [currentLinkIndex, setCurrentLinkIndex] = useState(() => {
    // Load current step from localStorage
    const savedStep = localStorage.getItem('currentStep');
    return savedStep ? parseInt(savedStep) : 0;
  });
  const [completedLinks, setCompletedLinks] = useState([]);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [links, setLinks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // BẢO MẬT NẠP FRONTEND - Validate session marking TRƯỚC KHI render
  useEffect(() => {
    const validateSessionMarking = async () => {
      if (!serviceId || !time) {
        console.log('[LinkSkip] ❌ Invalid URL format, redirecting to home');
        navigate('/');
        return;
      }

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://khoablabla-backend.hf.space';
        const response = await fetch(`${apiBaseUrl}/api/check-session-mark`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceId })
        });
        
        const result = await response.json();
        
        if (result.success && result.exists) {
          // Session exists in database - CHO PHÉP frontend render
          console.log(`[LinkSkip] ✅ Session validated: ${serviceId}`);
          setSessionInfo({
            service: result.service,
            status: result.status,
            expireTs: result.expireTs,
            timeLeft: result.timeLeft
          });
          
          // Initialize links based on time signature
          initializeLinks(time);
        } else {
          // Session NOT found in database - ĐÁ VĂNG về home
          console.log(`[LinkSkip] ❌ Session not found in DB: ${serviceId}`);
          console.log('[LinkSkip] 🚫 User tried to access unmarked URL - redirecting to home');
          setValidationError('Phiên không hợp lệ hoặc đã hết hạn');
          
          // Delay redirect để user thấy thông báo
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } catch (error) {
        console.error('[LinkSkip] ❌ Session validation failed:', error);
        setValidationError('Không thể xác thực phiên. Vui lòng thử lại.');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } finally {
        setIsValidatingSession(false);
      }
    };

    validateSessionMarking();
  }, [serviceId, time, navigate]);

  const initializeLinks = (timeSig) => {
    // Extract hours from time signature (e.g., "2h" -> 2)
    const hours = parseInt(timeSig.replace('h', ''));
    const linkCount = Math.ceil(hours / 2); // 1 link per 2 hours
    
    const generatedLinks = [];
    for (let i = 1; i <= linkCount; i++) {
      generatedLinks.push({
        id: i,
        url: `https://example.com/link${i}?service=${serviceId}&session=${serviceId}`,
        title: `Link ${i}`,
        description: `Vượt link ${i}/${linkCount}`
      });
    }
    
    setLinks(generatedLinks);
    
    // Restore current step from localStorage if exists and is valid
    const savedStep = localStorage.getItem('currentStep');
    if (savedStep) {
      const step = parseInt(savedStep);
      if (step >= 0 && step < linkCount) {
        setCurrentLinkIndex(step);
        setCompletedLinks(Array(step).fill(true));
      }
    }
  };

  const handleLinkClick = async (linkIndex) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate link processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCompletedLinks(prev => [...prev, true]);
      setCurrentLinkIndex(prev => prev + 1);
      localStorage.setItem('currentStep', linkIndex + 1);
      
      // Check if all links are completed
      if (linkIndex + 1 >= links.length) {
        setShowCountdown(true);
        startCountdown();
      }
    } catch (error) {
      console.error('Failed to process link:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const startCountdown = () => {
    let count = 10;
    setCountdown(count);
    
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count <= 0) {
        clearInterval(timer);
        finalizeKey();
      }
    }, 1000);
  };

  const finalizeKey = () => {
    // Clear current step from localStorage when finalizing
    localStorage.removeItem('currentStep');
    
    // Generate random key and redirect
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomPart = Array.from({length: 25}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    const forgedKey = `KHOA-${serviceId.toUpperCase()}-${randomPart}`;
    
    // Redirect to key display page with clean URL
    navigate(`/${serviceId}/key-${forgedKey}`);
  };

  // Show loading while validating session
  if (isValidatingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="loading-spinner mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-3 fade-in">Đang kiểm tra phiên...</h2>
          <p className="text-gray-400 mb-4 fade-in">Xác thực đánh dấu trong Database</p>
          <div className="card p-4 fade-in">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <p className="text-blue-400 text-sm">Bảo mật: Chỉ cho phép truy cập các phiên đã được đánh dấu</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if validation failed
  if (validationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="card p-6 border-l-4 border-red-500 fade-in">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
              <div className="text-left">
                <h3 className="text-lg font-semibold text-white mb-2">Lỗi xác thực</h3>
                <p className="text-gray-400">{validationError}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary mt-6"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Show countdown before key generation
  if (showCountdown) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="card p-8 fade-in">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 glow">
              {countdown}
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Đang tạo key của bạn...</h2>
            <p className="text-gray-400 mb-4">Key sẽ sẵn sàng trong {countdown} giây</p>
            <div className="loading-dots justify-center">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="btn btn-ghost hover:bg-gray-800 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            
            <div className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl shadow-lg">
                {serviceId === 'lootlab' ? '🎮' : 
                 serviceId === 'worklink' ? '💼' : 
                 serviceId === 'linkvertise' ? '🔗' : '🐼'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Dịch vụ: {serviceId}</h3>
                <p className="text-sm text-gray-400">Thời gian: {time}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-green-400 text-xs">✓ Phiên đã được đánh dấu trong Database</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Progress */}
        <section className="mb-8 fade-in">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Tiến độ vượt link</h3>
              <span className="text-sm text-gray-400">
                {currentLinkIndex} / {links.length} hoàn thành
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-3 mb-6">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(currentLinkIndex / links.length) * 100}%` }}
              ></div>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {links.map((link, index) => (
                <div
                  key={link.id}
                  className={`card p-4 cursor-pointer transition-all duration-300 ${
                    completedLinks[index] 
                      ? 'border-green-500 bg-green-500/10' 
                      : isProcessing
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-blue-500 hover:scale-105'
                  }`}
                  onClick={() => !completedLinks[index] && handleLinkClick(index)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-white">{link.title}</span>
                    {completedLinks[index] ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <ExternalLink className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{link.description}</p>
                  <button
                    className={`btn w-full ${
                      completedLinks[index] 
                        ? 'btn-secondary' 
                        : isProcessing
                        ? 'btn-secondary opacity-50 cursor-not-allowed'
                        : 'btn-primary'
                    }`}
                    disabled={completedLinks[index] || isProcessing}
                  >
                    {completedLinks[index] ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Đã hoàn thành
                      </span>
                    ) : isProcessing && currentLinkIndex === index ? (
                      <span className="flex items-center gap-2">
                        <div className="loading-spinner"></div>
                        Đang xử lý...
                      </span>
                    ) : (
                      <span>Vượt link</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Instructions */}
        <section className="fade-in">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Hướng dẫn</h3>
            <div className="space-y-3 text-gray-400 text-sm">
              <p>1. Nhấn nút "Vượt link" cho từng link ở trên</p>
              <p>2. Chờ đợi xử lý xong (khoảng 2-3 giây)</p>
              <p>3. Lặp lại cho đến khi hết link</p>
              <p>4. Key sẽ được tạo tự động sau khi hoàn thành tất cả</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default LinkSkipPage;
