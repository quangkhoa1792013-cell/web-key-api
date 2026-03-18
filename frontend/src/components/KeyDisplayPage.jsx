import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, Key, Copy, CheckCircle, ChevronLeft, Zap, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

function KeyDisplayPage() {
  const navigate = useNavigate();
  const { serviceId, randomId } = useParams();
  const [keys, setKeys] = useState([]);
  const [generating, setGenerating] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const [showToast, setShowToast] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // Check expiry every second
  useEffect(() => {
    const checkExpiry = () => {
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check localStorage key
      const savedKey = localStorage.getItem('currentKey');
      if (savedKey) {
        try {
          const keyData = JSON.parse(savedKey);
          if (keyData.expire_ts && keyData.expire_ts < currentTime) {
            // Key expired - clear all state and redirect
            console.log('[KeyDisplayPage] Key expired, redirecting to expired page');
            localStorage.clear();
            setKeys([]);
            setGenerating(false);
            
            // Redirect to expired page with replace to prevent going back
            navigate('/expired', { replace: true });
            return;
          }
        } catch (e) {
          console.error('[KeyDisplayPage] Error parsing saved key:', e);
        }
      }
      
      // Also check keys in state
      keys.forEach(keyData => {
        if (keyData.expire_ts && keyData.expire_ts < currentTime) {
          console.log('[KeyDisplayPage] Key in state expired, redirecting');
          localStorage.clear();
          setKeys([]);
          setGenerating(false);
          navigate('/expired', { replace: true });
          return;
        }
      });
    };

    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, [keys, navigate]);

  // Load existing key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('currentKey');
    if (savedKey) {
      try {
        const keyData = JSON.parse(savedKey);
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (keyData.expire_ts && keyData.expire_ts > currentTime) {
          // Key still valid, calculate remaining time
          const timeLeft = keyData.expire_ts - currentTime;
          setKeys([{ ...keyData, timeLeft }]);
          setGenerating(false);
          setCountdown(0);
        } else {
          // Key expired, clear it
          localStorage.removeItem('currentKey');
          setIsExpired(true);
        }
      } catch (e) {
        localStorage.removeItem('currentKey');
      }
    }
  }, []);

  useEffect(() => {
    if (generating && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            generateKey();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [generating, countdown]);

  // Save key to localStorage whenever keys change
  useEffect(() => {
    if (keys.length > 0 && !generating) {
      localStorage.setItem('currentKey', JSON.stringify(keys[0]));
    }
  }, [keys, generating]);

  // Handle expiration - redirect to expired page
  useEffect(() => {
    if (isExpired) {
      // Clear expired key
      localStorage.removeItem('currentKey');
      // Redirect immediately to expired page
      navigate('/expired', { replace: true });
    }
  }, [isExpired, navigate]);

  const generateKey = async () => {
    const selectedTime = parseInt(localStorage.getItem('selectedTime') || '4');
    const selectedService = localStorage.getItem('selectedService') || 'lootlab';
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://khoablabla-backend.hf.space';
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/create-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          duration: selectedTime * 3600,
          service: selectedService
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const currentTime = Math.floor(Date.now() / 1000);
        setKeys([{ 
          id: result.id || '1',
          key: result.key, 
          duration: result.duration,
          timeLeft: result.duration,
          expire_ts: currentTime + result.duration,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        }]);
      }
    } catch (error) {
      const currentTime = Math.floor(Date.now() / 1000);
      const demoKey = `KHOA-${selectedTime}-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      setKeys([{ 
        id: 'demo-1',
        key: demoKey, 
        duration: selectedTime * 3600,
        timeLeft: selectedTime * 3600,
        expire_ts: currentTime + (selectedTime * 3600),
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setGenerating(false);
    }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    showNotification('Đã copy key!', 'success');
  };

  const showNotification = (message, type = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const renewKey = async (keyId) => {
    try {
      await fetch(`/api/renew-key/${keyId}`, { method: 'POST' });
      setKeys(prevKeys => prevKeys.map(key => 
        key.id === keyId 
          ? { ...key, timeLeft: key.timeLeft + 86400 }
          : key
      ));
      showNotification('Gia hạn +24H thành công!', 'success');
    } catch (error) {
      setKeys(prevKeys => prevKeys.map(key => 
        key.id === keyId 
          ? { ...key, timeLeft: key.timeLeft + 86400 }
          : key
      ));
      showNotification('Gia hạn +24H!', 'success');
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (generating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Đang tạo key...</h2>
          <div className="text-5xl font-mono font-bold text-blue-400 mb-4">
            00:00:{countdown.toString().padStart(2, '0')}
          </div>
          <div className="w-64 h-3 bg-slate-700 rounded-full overflow-hidden mx-auto mb-4">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-1000"
              style={{ width: `${((10 - countdown) / 10) * 100}%` }}
            />
          </div>
          <p className="text-slate-400">Hệ thống đang khởi tạo key cho bạn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Toast */}
      {showToast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-xl z-50 animate-fade-in ${
          showToast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {showToast.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/skip')}
            className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Nhận Key</h1>
            <p className="text-slate-400 text-sm">Bước 3/3 - Key của bạn đã sẵn sàng</p>
          </div>
        </div>

        {/* Progress Steps - Fix: All completed steps show checkmark */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                index < 3 
                  ? 'bg-green-500 text-white' 
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {index < 3 ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              {index < 2 && (
                <div className={`w-20 h-1 mx-2 ${
                  index < 2 ? 'bg-green-500' : 'bg-slate-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Expired State */}
        {isExpired ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-red-500/30 p-12 text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Key đã hết hạn</h2>
            <p className="text-slate-400 mb-8">Key của bạn đã hết hạn. Vui lòng quay lại để tạo key mới.</p>
            <button
              onClick={() => navigate('/skip')}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 mx-auto"
            >
              <ArrowLeft className="w-5 h-5" />
              Quay lại tạo key mới
            </button>
          </div>
        ) : (
          <>
            {/* Key Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <Key className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Key đã được tạo</h2>
                  <p className="text-slate-400 text-sm">Thời gian còn lại đang được cập nhật real-time</p>
                </div>
              </div>

              {keys.map((keyData) => (
                <div key={keyData.id} className="space-y-6">
                  {/* Key Display */}
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-400 text-sm font-medium">Key của bạn</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        keyData.status === 'ACTIVE'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        <span className="w-2 h-2 bg-current rounded-full mr-2 animate-pulse" />
                        {keyData.status === 'ACTIVE' ? 'Đang hoạt động' : 'Hết hạn'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <code className="flex-1 bg-slate-800 rounded-lg px-4 py-3 font-mono text-lg text-white">
                        {keyData.key}
                      </code>
                      <button
                        onClick={() => copyKey(keyData.key)}
                        className="p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                        title="Copy key"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Status Grid - 3 cards: Time left, Duration, Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                      <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Clock className="w-4 h-4" />
                        <span>Thời gian còn lại</span>
                      </div>
                      <p className="text-2xl font-mono font-bold text-green-400">
                        {formatTime(keyData.timeLeft)}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                      <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Zap className="w-4 h-4" />
                        <span>Thời hạn key</span>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {Math.floor(keyData.duration / 3600)} giờ
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                      <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Trạng thái</span>
                      </div>
                      <p className={`text-lg font-bold ${
                        keyData.status === 'ACTIVE' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {keyData.status === 'ACTIVE' ? 'Hoạt động' : 'Hết hạn'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-white font-semibold mb-4">Hướng dẫn sử dụng</h3>
              <ol className="space-y-2 text-slate-400 text-sm list-decimal list-inside">
                <li>Copy key bằng cách nhấn nút Copy bên cạnh key</li>
                <li>Mở Roblox và script của bạn</li>
                <li>Dán key vào ô nhập key trong script</li>
                <li>Nhấn "Xác nhận" để kích hoạt</li>
                <li>Key sẽ tự động hết hạn sau thời gian đã chọn</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default KeyDisplayPage;
