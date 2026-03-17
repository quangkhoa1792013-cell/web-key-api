import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Globe, ChevronRight, Shield, Zap, Copy, CheckCircle, Clock, Play, AlertTriangle } from 'lucide-react';

const services = [
  { id: 'lootlab', name: 'Lootlab', icon: '🎮', color: 'from-purple-500 to-pink-500' },
  { id: 'worklink', name: 'Worklink', icon: '💼', color: 'from-blue-500 to-cyan-500' },
  { id: 'linkvertise', name: 'Linkvertise', icon: '🔗', color: 'from-green-500 to-emerald-500' },
  { id: 'pandas', name: 'Pandas', icon: '🐼', color: 'from-orange-500 to-red-500' },
];

function ServiceSelectionPage() {
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
    const checkKeyStatus = async () => {
      const keys = {};
      
      for (const service of services) {
        try {
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://khoablabla-backend.hf.space';
          const response = await fetch(`${apiBaseUrl}/api/check-key-status?service=${service.id}`);
          const result = await response.json();
          
          keys[service.id] = {
            hasKey: result.hasKey || false,
            count: result.count || 0,
            status: result.status || 'none'
          };
        } catch (error) {
          keys[service.id] = { hasKey: false, count: 0, status: 'error' };
        }
      }
      
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
  };

  const handleStartProcess = async () => {
    if (!selectedService) return;
    
    setMarkingSession(true);
    setMarkingError(null);
    
    try {
      // Generate random ID for session
      const randomId = Math.random().toString(36).substring(2, 10).toLowerCase();
      
      // Call backend to mark session
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://khoablabla-backend.hf.space';
      const response = await fetch(`${apiBaseUrl}/api/mark-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          serviceId: selectedService,
          randomId: randomId,
          ipAddress: null, // Backend will auto-detect
          userAgent: navigator.userAgent
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Save to localStorage
        localStorage.setItem('selectedService', selectedService);
        localStorage.setItem('randomId', randomId);
        localStorage.setItem('sessionId', result.sessionId);
        
        // Navigate to time selection page
        navigate(`/${selectedService}-${randomId}`);
      } else {
        setMarkingError(result.message);
      }
    } catch (error) {
      console.error('Error marking session:', error);
      setMarkingError('Không thể đánh dấu phiên. Vui lòng thử lại.');
    } finally {
      setMarkingSession(false);
    }
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetAll = () => {
    setSelectedService(null);
    setGeneratedLink('');
    setCopied(false);
    setMarkingSession(false);
    setMarkingError(null);
    localStorage.removeItem('selectedService');
    localStorage.removeItem('randomId');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('generatedLink');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Globe className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">KhoaDz Script Key</h1>
          </div>
          <p className="text-slate-400 text-lg">Chọn dịch vụ để tạo phiên</p>
        </div>

        {/* Service Options with Key Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {services.map((service) => {
            const keyInfo = serviceKeys[service.id] || {};
            const hasKey = keyInfo.hasKey || false;
            const keyCount = keyInfo.count || 0;
            const status = keyInfo.status || 'none';
            
            return (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service.id)}
                disabled={markingSession}
                className={`p-8 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] ${
                  selectedService === service.id
                    ? 'border-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-600/10 shadow-lg shadow-blue-500/20'
                    : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600/50'
                } ${markingSession ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${service.color} flex items-center justify-center text-3xl shadow-lg`}>
                    {service.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                    <p className="text-slate-400 text-sm">Tạo phiên cho dịch vụ {service.name}</p>
                  </div>
                  
                  {/* Key Status */}
                  <div className="flex items-center gap-2 mb-4">
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
                  
                  <ChevronRight className="w-6 h-6 text-slate-400" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Start Button */}
        {selectedService && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Play className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Xác nhận: Bắt đầu tạo Key cho {services.find(s => s.id === selectedService)?.name}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Nhấn để bắt đầu quá trình tạo phiên
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleStartProcess}
                disabled={markingSession}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  markingSession
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-600/25 transform hover:scale-105'
                }`}
              >
                {markingSession ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-transparent animate-spin rounded-full"></div>
                    Đang đánh dấu...
                  </div>
                ) : (
                  'Bắt đầu'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {markingError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 animate-shake">
            <div className="flex items-center justify-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm text-left">{markingError}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-white font-semibold mb-4">Luồng hoạt động</h3>
          <ol className="space-y-2 text-slate-400 text-sm list-decimal list-inside">
            <li>Chọn dịch vụ → Xem trạng thái Key</li>
            <li>Nhấn "Bắt đầu" → Đánh dấu phiên</li>
            <li>Chuyển đến trang chọn thời gian → Cố định URL</li>
            <li>Vượt link → Nhận Key mới</li>
            <li>Key tự hủy khi hết hạn</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default ServiceSelectionPage;
