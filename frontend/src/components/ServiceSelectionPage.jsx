import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Globe, ChevronRight, Shield, Zap, Copy, CheckCircle, Clock, Play, AlertTriangle } from 'lucide-react';

const services = [
  { id: 'lootlab', name: 'Lootlab', icon: '🎮', color: 'var(--primary-600)' },
  { id: 'worklink', name: 'Worklink', icon: '💼', color: 'var(--secondary-600)' },
  { id: 'linkvertise', name: 'Linkvertise', icon: '🔗', color: 'var(--success)' },
  { id: 'pandas', name: 'Pandas', icon: '🐼', color: 'var(--warning)' },
];

function ServiceSelectionPage({ setUserSession }) {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [serviceKeys, setServiceKeys] = useState({});
  const [loading, setLoading] = useState(false);
  const [markingSession, setMarkingSession] = useState(false);
  const [markingError, setMarkingError] = useState(null);

  // Check existing keys for each service
  useEffect(() => {
    const checkKeyStatus = () => {
      const keys = {};
      services.forEach(service => {
        const savedKey = localStorage.getItem(`currentKey_${service.id}`);
        if (savedKey) {
          try {
            const keyData = JSON.parse(savedKey);
            keys[service.id] = {
              hasKey: keyData.expire_ts > Date.now() / 1000,
              count: 1,
              status: 'active'
            };
          } catch (error) {
            console.error(error);
            keys[service.id] = {
              hasKey: false,
              count: 0,
              status: 'none'
            };
          }
        } else {
          keys[service.id] = {
            hasKey: false,
            count: 0,
            status: 'none'
          };
        }
      });
      setServiceKeys(keys);
    };

    checkKeyStatus();
    
    // Check every 30 seconds for key status updates
    const interval = setInterval(checkKeyStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId);
    setMarkingError(null);
    // Clear any existing session when selecting new service
    if (typeof setUserSession === 'function') {
      setUserSession(null);
    }
  };

  const handleStartProcess = async () => {
    if (!selectedService) return;
    
    setMarkingSession(true);
    setMarkingError(null);
    
    try {
      // Call backend to mark session
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://khoablabla-backend.hf.space';
      const response = await fetch(`${apiBaseUrl}/api/mark-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          serviceId: selectedService,
          ipAddress: null, // Backend will auto-detect
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Save to localStorage
        localStorage.setItem('selectedService', selectedService);
        localStorage.setItem('sessionId', result.sessionId);
        
        // Navigate to time selection page with clean URL
        navigate(`/${selectedService}`);
      } else {
        setMarkingError(result.message || 'Không thể đánh dấu phiên. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Failed to mark session:', error);
      setMarkingError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setMarkingSession(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12 fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Globe className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">KhoaDz Script Key</h1>
          </div>
          <p className="text-gray-400 text-lg">Chọn dịch vụ để tạo phiên</p>
          
          {/* Time Valid Indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 fade-in">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">Time Valid (0s drift)</span>
          </div>
        </header>

        {/* Service Options with Key Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-8 max-w-4xl mx-auto fade-in">
          {services.map((service) => {
            const keyInfo = serviceKeys[service.id] || {};
            const hasKey = keyInfo.hasKey || false;
            const keyCount = keyInfo.count || 0;
            const status = keyInfo.status || 'none';
            
            return (
              <div
                key={service.id}
                onClick={() => handleServiceSelect(service.id)}
                className={`card relative cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedService === service.id
                    ? 'ring-2 ring-offset-2 ring-offset-gray-900 border-blue-500'
                    : 'hover:border-gray-600'
                }`}
                style={{
                  ringColor: selectedService === service.id ? service.color : undefined,
                  minHeight: '320px'
                }}
              >
                <div className="flex flex-col items-center justify-between h-full p-8">
                  <div className="flex flex-col items-center space-y-4 flex-1">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${service.color.replace('var(', 'var(--').replace(')', '')} flex items-center justify-center text-3xl shadow-lg`}>
                      {service.icon}
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                      <p className="text-gray-400 text-sm">Tạo phiên cho dịch vụ {service.name}</p>
                    </div>
                    
                    {/* Key Status */}
                    <div className="flex items-center gap-2">
                      {hasKey ? (
                        <>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-400 text-sm font-medium">
                            ● Đã có Key ({keyCount > 0 ? keyCount : '1'})
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span className="text-gray-400 text-sm font-medium">
                            ○ Chưa có Key
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Start Button */}
        {selectedService && (
          <div className="card p-6 mb-8 fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Play className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Bắt đầu phiên {services.find(s => s.id === selectedService)?.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Đánh dấu phiên và chuyển đến trang chọn thời gian
                  </p>
                </div>
              </div>
              
              <button
                className={`btn btn-primary min-w-[150px] ${
                  markingSession ? 'opacity-75 cursor-not-allowed' : ''
                }`}
                onClick={handleStartProcess}
                disabled={markingSession}
              >
                {markingSession ? (
                  <span className="flex items-center gap-2">
                    <div className="loading-spinner"></div>
                    Đang đánh dấu...
                  </span>
                ) : (
                  'Bắt đầu'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {markingError && (
          <div className="card p-4 mb-6 border-l-4 border-red-500 fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{markingError}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="card p-6 max-w-2xl mx-auto fade-in">
          <h3 className="text-white font-semibold mb-4 text-center">Luồng hoạt động</h3>
          <ol className="space-y-2 text-gray-400 text-sm list-decimal list-inside">
            <li>Chọn dịch vụ → Xem trạng thái Key</li>
            <li>Nhấn "Bắt đầu" → Đánh dấu phiên</li>
            <li>Chuyển đến trang chọn thời gian → Cố định URL</li>
            <li>Vượt link → Nhận Key mới</li>
            <li>Key tự hủy khi hết hạn</li>
          </ol>
          
          <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <h4 className="text-blue-400 font-semibold mb-1">Bảo mật nâng cao</h4>
                <p className="text-blue-400 text-sm">
                  Mỗi phiên được đánh dấu riêng biệt và theo dõi IP để đảm bảo an toàn
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServiceSelectionPage;
