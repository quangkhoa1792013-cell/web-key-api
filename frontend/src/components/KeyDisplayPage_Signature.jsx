import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { Clock, Key, Copy, CheckCircle, ChevronRight, AlertCircle, ArrowLeft, Shield } from 'lucide-react';

function KeyDisplayPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [keys, setKeys] = useState([]);
  const [generating, setGenerating] = useState(true);
  const [showToast, setShowToast] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  
  // Get service and key from query params
  const serviceKey = searchParams.get('lootlab') || searchParams.get('worklink') || searchParams.get('linkvertise') || searchParams.get('pandas');
  const serviceName = Object.keys(Object.fromEntries(searchParams.entries()))[0] || 'unknown';

  // Check expiry every second - REAL-TIME SELF-DESTRUCTION
  useEffect(() => {
    const checkExpiry = () => {
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check localStorage key
      const savedKey = localStorage.getItem('currentKey');
      if (savedKey) {
        try {
          const keyData = JSON.parse(savedKey);
          if (keyData.expire_ts && keyData.expire_ts < currentTime) {
            // KEY EXPIRED - IMMEDIATE SELF-DESTRUCTION
            console.log('[KeyDisplayPage] KEY EXPIRED - SELF-DESTRUCTING');
            localStorage.clear();
            sessionStorage.clear();
            setKeys([]);
            setGenerating(false);
            
            // Use window.location.replace to prevent back navigation
            window.location.replace('/expired');
            return;
          }
        } catch (e) {
          console.error('[KeyDisplayPage] Error parsing saved key:', e);
        }
      }
      
      // Also check keys in state
      keys.forEach(keyData => {
        if (keyData.expire_ts && keyData.expire_ts < currentTime) {
          console.log('[KeyDisplayPage] Key in state expired - SELF-DESTRUCTING');
          localStorage.clear();
          sessionStorage.clear();
          setKeys([]);
          setGenerating(false);
          window.location.replace('/expired');
          return;
        }
      });
    };

    const interval = setInterval(checkExpiry, 1000); // Every 1 second
    return () => clearInterval(interval);
  }, [keys]);

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

  // Generate key from query params
  useEffect(() => {
    if (serviceKey && generating && keys.length === 0) {
      generateKey();
    }
  }, [serviceKey]);

  const generateKey = async () => {
    if (!serviceKey) {
      console.error('[KeyDisplayPage] No service key provided');
      setGenerating(false);
      return;
    }

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://khoablabla-backend.hf.space';
      
      // Get session info from localStorage or generate new
      const randomId = localStorage.getItem('randomId') || Math.random().toString(36).substring(2, 10);
      const serviceId = serviceName;
      
      const response = await fetch(`${apiBaseUrl}/api/finalize-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          serviceId,
          randomId,
          serviceKey,
          ip: 'client',
          userAgent: navigator.userAgent
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const currentTime = Math.floor(Date.now() / 1000);
        const newKey = {
          id: result.key || '1',
          key: result.key, 
          duration: result.duration,
          timeLeft: result.duration,
          expire_ts: currentTime + result.duration,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          service: serviceName
        };
        
        setKeys([newKey]);
        
        // Save to localStorage
        localStorage.setItem('currentKey', JSON.stringify(newKey));
        
        console.log('[KeyDisplayPage] Key forged successfully:', newKey.key);
      } else {
        // Fallback for demo
        const currentTime = Math.floor(Date.now() / 1000);
        const demoKey = `KHOA-${serviceName.toUpperCase()}-${serviceKey}`;
        const newKey = {
          id: 'demo-1',
          key: demoKey, 
          duration: 7200, // 2 hours
          timeLeft: 7200,
          expire_ts: currentTime + 7200,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          service: serviceName
        };
        
        setKeys([newKey]);
        localStorage.setItem('currentKey', JSON.stringify(newKey));
      }
    } catch (error) {
      console.error('[KeyDisplayPage] Error generating key:', error);
      
      // Fallback demo key
      const currentTime = Math.floor(Date.now() / 1000);
      const demoKey = `KHOA-${serviceName.toUpperCase()}-${serviceKey}`;
      const newKey = {
        id: 'demo-1',
        key: demoKey, 
        duration: 7200,
        timeLeft: 7200,
        expire_ts: currentTime + 7200,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        service: serviceName
      };
      
      setKeys([newKey]);
      localStorage.setItem('currentKey', JSON.stringify(newKey));
    } finally {
      setGenerating(false);
    }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    setShowToast('Key đã sao chép!');
    setTimeout(() => setShowToast(null), 2000);
  };

  const handleBack = () => {
    navigate('/');
  };

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Key đã hết hạn</h2>
          <p className="text-slate-400 mb-6">Vui lòng tạo key mới để tiếp tục</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Tạo key mới
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
          <p className="text-slate-400 text-lg">Key của bạn đã được "đúc" thành công</p>
        </div>

        {/* Service Info */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">
                  {serviceName === 'lootlab' ? '🎮' : 
                   serviceName === 'worklink' ? '💼' : 
                   serviceName === 'linkvertise' ? '🔗' : '🐼'}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Dịch vụ: {serviceName}</h3>
                <p className="text-slate-400 text-sm">Key ID: {serviceKey}</p>
                <p className="text-green-400 text-xs">✓ Key đã được đúc và kích hoạt</p>
              </div>
            </div>
            
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-slate-600/20 hover:bg-slate-600/30 text-slate-400 rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
          </div>
        </div>

        {/* Key Display */}
        {generating ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-12 text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-white mb-2">Đang "đúc" key...</h3>
            <p className="text-slate-400">Vui lòng chờ trong giây lát</p>
          </div>
        ) : (
          keys.map((keyData) => (
            <div key={keyData.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8 mb-8">
              <div className="text-center">
                <div className="mb-6">
                  <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Key của bạn</h3>
                  <p className="text-slate-400">Sao chép và sử dụng ngay</p>
                </div>
                
                <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700 mb-6">
                  <code className="text-2xl font-mono text-blue-400 break-all">{keyData.key}</code>
                </div>
                
                <div className="flex items-center justify-center gap-4 mb-6">
                  <button
                    onClick={() => copyKey(keyData.key)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                    Sao chép Key
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-900/30 rounded-lg p-4">
                    <p className="text-slate-400 mb-1">Thời gian còn lại</p>
                    <p className="text-white font-semibold">
                      {keyData.timeLeft > 0 ? `${Math.floor(keyData.timeLeft / 3600)}h ${Math.floor((keyData.timeLeft % 3600) / 60)}m` : 'Hết hạn'}
                    </p>
                  </div>
                  <div className="bg-slate-900/30 rounded-lg p-4">
                    <p className="text-slate-400 mb-1">Trạng thái</p>
                    <p className="text-green-400 font-semibold flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      Đang hoạt động
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Self-Destruction Warning */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <h4 className="text-red-400 font-semibold mb-1">Cơ chế Tự hủy</h4>
              <p className="text-slate-400 text-sm">
                Key sẽ tự động hủy khi hết hạn. Website sẽ biến mất ngay lập tức và không thể quay lại.
              </p>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-5 h-5" />
            {showToast}
          </div>
        )}
      </div>
    </div>
  );
}

export default KeyDisplayPage;
