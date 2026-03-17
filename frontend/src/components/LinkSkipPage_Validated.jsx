import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { Clock, Key, Copy, CheckCircle, ChevronRight, AlertCircle, ArrowLeft, Shield, Loader2, ExternalLink } from 'lucide-react';

function LinkSkipPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  
  // Parse serviceId-randomId from URL
  const urlPath = Object.values(params)[0] || '';
  const [serviceId, randomId, timeSignature] = urlPath.split('-');
  
  const [sessionInfo, setSessionInfo] = useState(null);
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  const [currentLinkIndex, setCurrentLinkIndex] = useState(0);
  const [completedLinks, setCompletedLinks] = useState([]);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [links, setLinks] = useState([]);

  // VALIDATE SESSION MARKING before showing frontend
  useEffect(() => {
    const validateSessionMarking = async () => {
      if (!serviceId || !randomId || !timeSignature) {
        console.log('[LinkSkip] Invalid URL format, redirecting to home');
        navigate('/');
        return;
      }

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://khoablabla-backend.hf.space';
        const response = await fetch(`${apiBaseUrl}/api/check-session-mark`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ randomId })
        });
        
        const result = await response.json();
        
        if (result.success && result.exists) {
          // Session exists in database - ALLOW frontend to render
          console.log(`[LinkSkip] Session validated: ${serviceId}-${randomId}`);
          setSessionInfo({
            service: result.service,
            status: result.status,
            expireTs: result.expireTs,
            timeLeft: result.timeLeft
          });
          
          // Initialize links based on time signature
          initializeLinks(timeSignature);
        } else {
          // Session NOT found in database - KICK OUT to home
          console.log(`[LinkSkip] Session not found in DB: ${serviceId}-${randomId}`);
          console.log('[LinkSkip] User tried to access unmarked URL - redirecting to home');
          navigate('/');
        }
      } catch (error) {
        console.error('[LinkSkip] Session validation failed:', error);
        navigate('/');
      } finally {
        setIsValidatingSession(false);
      }
    };

    validateSessionMarking();
  }, [serviceId, randomId, timeSignature, navigate]);

  const initializeLinks = (timeSig) => {
    // Extract hours from time signature (e.g., "2h" -> 2)
    const hours = parseInt(timeSig.replace('h', ''));
    const linkCount = Math.ceil(hours / 2); // 1 link per 2 hours
    
    const generatedLinks = [];
    for (let i = 1; i <= linkCount; i++) {
      generatedLinks.push({
        id: i,
        url: `https://example.com/link${i}?service=${serviceId}&session=${randomId}`,
        title: `Link ${i}`,
        description: `Vượt link ${i}/${linkCount}`
      });
    }
    
    setLinks(generatedLinks);
  };

  const handleLinkClick = (linkIndex) => {
    // Open link in new tab
    const link = links[linkIndex];
    window.open(link.url, '_blank');
    
    // Mark as completed after delay (simulating link completion)
    setTimeout(() => {
      setCompletedLinks(prev => [...prev, linkIndex]);
      
      if (linkIndex === links.length - 1) {
        // All links completed, show countdown
        setShowCountdown(true);
        startCountdown();
      } else {
        // Move to next link
        setCurrentLinkIndex(linkIndex + 1);
      }
    }, 3000); // 3 seconds delay
  };

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finalizeKey();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finalizeKey = () => {
    // Generate random key and redirect
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomPart = Array.from({length: 25}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    const forgedKey = `KHOA-${serviceId.toUpperCase()}-${randomPart}`;
    
    // Redirect to key display page
    navigate(`/key?${serviceId}=${forgedKey}`);
  };

  // Show loading while validating session
  if (isValidatingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white mb-2">Đang kiểm tra phiên...</p>
          <p className="text-slate-400 text-sm">Xác thực đánh dấu trong Database</p>
        </div>
      </div>
    );
  }

  // Show error if session not found (should redirect automatically)
  if (!sessionInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Phiên không hợp lệ</h2>
          <p className="text-slate-400 mb-6">URL không được đánh dấu trong Database</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Show countdown for key generation
  if (showCountdown) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-3xl font-bold text-white mb-4">Đang "đúc" Key...</h2>
          <p className="text-green-400 text-xl mb-2">{countdown}</p>
          <p className="text-slate-400">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  const progress = ((completedLinks.length) / links.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ExternalLink className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Vượt Link</h1>
          </div>
          <p className="text-slate-400 text-lg">Hoàn thành các link để nhận key</p>
        </div>

        {/* Session Info */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">
                  {serviceId === 'lootlab' ? '🎮' : 
                   serviceId === 'worklink' ? '💼' : 
                   serviceId === 'linkvertise' ? '🔗' : '🐼'}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Dịch vụ: {serviceId}</h3>
                <p className="text-slate-400 text-sm">Phiên: {randomId} • Thời gian: {timeSignature}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-green-400 text-xs">✓ Phiên đã được đánh dấu trong Database</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-slate-600/20 hover:bg-slate-600/30 text-slate-400 rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Tiến độ</h3>
            <span className="text-blue-400 font-medium">{completedLinks.length}/{links.length} link</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Links */}
        <div className="space-y-4">
          {links.map((link, index) => (
            <div
              key={link.id}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                completedLinks.includes(index)
                  ? 'border-green-500 bg-green-500/10'
                  : index === currentLinkIndex
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700/50 bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    completedLinks.includes(index)
                      ? 'bg-green-500'
                      : index === currentLinkIndex
                      ? 'bg-blue-500'
                      : 'bg-slate-600'
                  }`}>
                    {completedLinks.includes(index) ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <span className="text-white font-bold">{link.id}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{link.title}</h4>
                    <p className="text-slate-400 text-sm">{link.description}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleLinkClick(index)}
                  disabled={completedLinks.includes(index) || index !== currentLinkIndex}
                  className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                    completedLinks.includes(index)
                      ? 'bg-green-500 text-white cursor-default'
                      : index === currentLinkIndex
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {completedLinks.includes(index) ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Hoàn thành
                    </>
                  ) : index === currentLinkIndex ? (
                    <>
                      <ExternalLink className="w-5 h-5" />
                      Vượt Link
                    </>
                  ) : (
                    'Chờ'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Session Validation Status */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mt-8">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-400" />
            <div>
              <h4 className="text-green-400 font-semibold text-sm">✓ Frontend Đã Đổ Vào Khung Đánh Dấu</h4>
              <p className="text-slate-400 text-xs">Giao diện chỉ hiển thị sau khi Database xác thực phiên</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LinkSkipPage;
