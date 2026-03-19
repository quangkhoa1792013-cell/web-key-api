import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, ChevronRight, Key, Shield, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';

function TimeSelectionPage() {
  const navigate = useNavigate();
  const params = useParams();
  
  // Parse serviceId-randomId from URL
  const urlPath = Object.values(params)[0] || '';
  const [serviceId, randomId] = urlPath.split('-');
  
  const [selectedTime, setSelectedTime] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  const [validationError, setValidationError] = useState(null);

  // Validate session marking TRƯỚC KHI render
  useEffect(() => {
    const validateSessionMarking = async () => {
      if (!serviceId || !randomId) {
        console.log('[TimeSelection] ❌ Invalid URL format, redirecting to home');
        navigate('/');
        return;
      }

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://khoablabla2013.pythonanywhere.com';
        const response = await fetch(`${apiBaseUrl}/api/check-session-mark`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ randomId })
        });
        
        const result = await response.json();
        
        if (result.success && result.exists) {
          // Session exists in database - CHO PHÉP frontend render
          console.log(`[TimeSelection] ✅ Session validated: ${serviceId}-${randomId}`);
          setSessionInfo({
            service: result.service,
            status: result.status,
            expireTs: result.expireTs,
            timeLeft: result.timeLeft
          });
        } else {
          // Session NOT found in database - ĐÁ VỀNG về home (Bảo mật Nạp Frontend)
          console.log(`[TimeSelection] ❌ Session not found in DB: ${serviceId}-${randomId}`);
          console.log('[TimeSelection] 🚫 Bảo mật: User tried to access unmarked URL - redirecting to home');
          setValidationError('Phiên không hợp lệ hoặc đã hết hạn');
          
          // Delay redirect để user thấy thông báo
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } catch (error) {
        console.error('[TimeSelection] ❌ Session validation failed:', error);
        setValidationError('Lỗi kết nối đến server');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } finally {
        setIsValidatingSession(false);
      }
    };

    validateSessionMarking();
  }, [serviceId, randomId, navigate]);

  const timeOptions = [
    { hours: 2, label: '2 Giờ', desc: '1 lần vượt link', color: 'from-blue-500 to-blue-600', links: 1 },
    { hours: 4, label: '4 Giờ', desc: '2 lần vượt link', color: 'from-green-500 to-green-600', links: 2 },
    { hours: 8, label: '8 Giờ', desc: '3 lần vượt link', color: 'from-yellow-500 to-orange-500', links: 3 },
    { hours: 16, label: '16 Giờ', desc: '4 lần vượt link', color: 'from-orange-500 to-red-500', links: 4 },
    { hours: 24, label: '24 Giờ', desc: '5 lần vượt link', color: 'from-red-500 to-pink-500', links: 5 },
    { hours: 36, label: '36 Giờ', desc: '6 lần vượt link', color: 'from-purple-500 to-pink-500', links: 6 },
    { hours: 48, label: '48 Giờ', desc: '7 lần vượt link', color: 'from-pink-500 to-rose-500', links: 7 },
    { hours: 67, label: '67 Giờ', desc: '10 lần vượt link', color: 'from-indigo-500 to-purple-500', links: 10 },
  ];

  const handleSelect = (hours, links) => {
    setSelectedTime(hours);
    
    // Update session with time signature
    updateSessionWithTime(hours, links);
    
    // Navigate to link skip page with time signature
    navigate(`/${serviceId}-${randomId}/${hours}h`);
  };

  const updateSessionWithTime = async (hours, links) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://khoablabla2013.pythonanywhere.com';
      const response = await fetch(`${apiBaseUrl}/api/update-session-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          serviceId, 
          randomId, 
          durationHours: hours,
          requiredLinks: links
        })
      });
      
      const result = await response.json();
      console.log('[TimeSelection] Session updated with time:', result);
    } catch (error) {
      console.error('[TimeSelection] Failed to update session:', error);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // Show loading while validating session
  if (isValidatingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Loader2 className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Đang kiểm tra phiên...</h2>
          <p className="text-slate-400 mb-4">Xác thực đánh dấu trong Database</p>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <p className="text-blue-400 text-sm">Bảo mật: Chỉ cho phép truy cập các phiên đã được đánh dấu</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if session not found (will redirect automatically)
  if (validationError || !sessionInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Phiên không hợp lệ</h2>
          <p className="text-slate-400 mb-6">{validationError || 'URL không được đánh dấu trong Database'}</p>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 text-sm">Bạn sẽ được chuyển về trang chủ trong giây lát...</p>
            </div>
          </div>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Key className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">KhoaDz Script Key</h1>
          </div>
          <p className="text-slate-400 text-lg">Chọn thời gian sử dụng key</p>
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
                <p className="text-slate-400 text-sm">Phiên: {randomId}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-green-400 text-xs">✓ Phiên đã được đánh dấu trong Database</p>
                </div>
              </div>
            </div>
            
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-slate-600/20 hover:bg-slate-600/30 text-slate-400 rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
          </div>
        </div>

        {/* Time Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {timeOptions.map((option) => (
            <button
              key={option.hours}
              onClick={() => handleSelect(option.hours, option.links)}
              className={`p-6 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] ${
                selectedTime === option.hours
                  ? 'border-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-600/10 shadow-lg shadow-blue-500/20'
                  : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600/50'
              }`}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center text-2xl font-bold text-white shadow-lg`}>
                  {option.label}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{option.label}</h3>
                  <p className="text-slate-400 text-sm">{option.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Info */}
        {selectedTime && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Chữ ký thời gian đã chọn</h3>
                <div className="flex items-center gap-4 text-slate-400">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Thời gian: <strong className="text-white">{selectedTime} giờ</strong>
                  </span>
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Cần vượt: <strong className="text-white">{timeOptions.find(opt => opt.hours === selectedTime)?.links} link</strong>
                  </span>
                </div>
                <p className="text-blue-400 text-sm mt-2">
                  URL cố định: /{serviceId}-{randomId}/{selectedTime}h
                </p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-semibold">Đã chọn</p>
                <p className="text-slate-400 text-sm">Đang chuyển đến vượt link...</p>
              </div>
            </div>
          </div>
        )}

        {/* Session Validation Status */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-400" />
            <div>
              <h4 className="text-green-400 font-semibold text-sm">✅ Frontend Đã Đổ Vào Khung Đánh Dấu</h4>
              <p className="text-slate-400 text-xs">Giao diện chỉ hiển thị sau khi Database xác thực phiên</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
          <h4 className="text-white font-semibold mb-4">Luồng đánh dấu phiên</h4>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold">✓</span>
              Phiên đã được đánh dấu trong Database
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
              Chọn thời gian → Cố định URL với chữ ký thời gian
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
              URL cố định: <code className="bg-slate-700 px-2 py-1 rounded text-xs">/{serviceId}-{randomId}/{selectedTime}h</code>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
              Hoàn thành vượt link → "Đúc" Key mới
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TimeSelectionPage;
