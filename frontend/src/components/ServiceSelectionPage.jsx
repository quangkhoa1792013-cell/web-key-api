import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ChevronRight, Shield, Zap, Copy, CheckCircle, Clock, AlertTriangle, Loader2, Play, Key } from 'lucide-react';

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
  const [isMarkingSession, setIsMarkingSession] = useState(false);
  const [markingError, setMarkingError] = useState(null);
  const [generatedRandomId, setGeneratedRandomId] = useState(null);

  // Check key status for each service
  const checkKeyStatus = async () => {
    const keys = {};
    
    for (const service of services) {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${apiBaseUrl}/api/check-service-keys?service=${service.id}`);
        const result = await response.json();
        
        keys[service.id] = {
          hasKey: result.hasKey || false,
          count: result.count || 0,
          nextExpiry: result.nextExpiry || null,
          timeLeft: result.nextExpiry ? Math.max(0, result.nextExpiry - Math.floor(Date.now() / 1000)) : 0
        };
        
        // Auto-cleanup expired keys from localStorage
        const savedKey = localStorage.getItem(`currentKey_${service.id}`);
        if (savedKey) {
          try {
            const keyData = JSON.parse(savedKey);
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (!result.hasKey || (keyData.expire_ts && keyData.expire_ts < currentTime)) {
              localStorage.removeItem(`currentKey_${service.id}`);
              
              const currentKey = localStorage.getItem('currentKey');
              if (currentKey) {
                try {
                  const currentData = JSON.parse(currentKey);
                  if (currentData.service === service.id) {
                    localStorage.removeItem('currentKey');
                  }
                } catch (e) {
                  localStorage.removeItem('currentKey');
                }
              }
            }
          } catch (e) {
            localStorage.removeItem(`currentKey_${service.id}`);
          }
        }
        
      } catch (error) {
        keys[service.id] = { hasKey: false, count: 0, nextExpiry: null, timeLeft: 0 };
      }
    }
    
    setServiceKeys(keys);
  };

  useEffect(() => {
    checkKeyStatus();
    
    // Check every 30 seconds for key status updates
    const interval = setInterval(checkKeyStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelect = (serviceId) => {
    // CHỈ lưu vào state, KHÔNG navigate ngay
    setSelectedService(serviceId);
    setMarkingError(null);
    setGeneratedLink('');
    
    // Generate random ID for potential use
    const randomId = Math.random().toString(36).substring(2, 10).toLowerCase();
    setGeneratedRandomId(randomId);
  };

  const handleStartProcess = async () => {
    if (!selectedService || !generatedRandomId) {
      return;
    }

    setIsMarkingSession(true);
    setMarkingError(null);
    
    try {
      // Call API to MARK SESSION in database
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/api/mark-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          serviceId: selectedService,
          randomId: generatedRandomId,
          ipAddress: 'client',
          userAgent: navigator.userAgent
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Session successfully marked in database
        console.log(`[ServiceSelection] ✅ Session marked: ${selectedService}-${generatedRandomId}`);
        
        const fullUrl = `${window.location.origin}/${selectedService}-${generatedRandomId}`;
        setGeneratedLink(fullUrl);
        
        // Save to localStorage
        localStorage.setItem('selectedService', selectedService);
        localStorage.setItem('randomId', generatedRandomId);
        localStorage.setItem('generatedLink', fullUrl);
        
        // Bây giờ mới navigate
        navigate(`/${selectedService}-${generatedRandomId}`);
      } else {
        // API trả về lỗi - hiển thị thông báo lỗi
        console.error('[ServiceSelection] ❌ Failed to mark session:', result.message);
        setMarkingError(result.message || 'Không thể đánh dấu phiên. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('[ServiceSelection] ❌ Error marking session:', error);
      setMarkingError('Lỗi kết nối đến server. Vui lòng kiểm tra mạng và thử lại.');
    } finally {
      setIsMarkingSession(false);
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
    setIsMarkingSession(false);
    setMarkingError(null);
    setGeneratedRandomId(null);
    localStorage.removeItem('selectedService');
    localStorage.removeItem('randomId');
    localStorage.removeItem('generatedLink');
  };

  const formatTimeLeft = (seconds) => {
    if (seconds <= 0) return 'Hết hạn';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
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
            const timeLeft = keyInfo.timeLeft || 0;
            const isSelected = selectedService === service.id;
            
            return (
              <button
                key={service.id}
                onClick={() => handleSelect(service.id)}
                disabled={isMarkingSession}
                className={`p-8 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] ${
                  isSelected
                    ? 'border-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-600/10 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/50'
                    : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600/50'
                } ${isMarkingSession ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${service.color} flex items-center justify-center text-3xl shadow-lg`}>
                    {service.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                    <p className="text-slate-400 text-sm">Tạo phiên cho dịch vụ {service.name}</p>
                  </div>
                  
                  {/* Key Status Badge */}
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50">
                    {hasKey ? (
                      <>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-sm font-medium">
                          ● Đã có Key
                        </span>
                        {timeLeft > 0 && (
                          <span className="text-green-300 text-xs">
                            ({formatTimeLeft(timeLeft)})
                          </span>
                        )}
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
                  
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-blue-400 text-sm font-medium">Đã chọn</span>
                    </div>
                  )}
                  
                  <ChevronRight className="w-6 h-6 text-slate-400" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Start Process Button - Professional Design */}
        {selectedService && !generatedLink && (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 mb-8 animate-fade-in shadow-2xl">
            <div className="text-center">
              {/* Service Icon and Name */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${services.find(s => s.id === selectedService)?.color} flex items-center justify-center text-3xl shadow-lg transform hover:scale-110 transition-transform`}>
                  <span>
                    {selectedService === 'lootlab' ? '🎮' : 
                     selectedService === 'worklink' ? '💼' : 
                     selectedService === 'linkvertise' ? '🔗' : '🐼'}
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {services.find(s => s.id === selectedService)?.name}
                  </h3>
                  <p className="text-slate-400">Sẵn sàng bắt đầu quy trình đánh dấu phiên</p>
                </div>
              </div>
              
              {/* Error Message */}
              {markingError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 animate-shake">
                  <div className="flex items-center justify-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm text-left">{markingError}</p>
                  </div>
                </div>
              )}
              
              {/* Professional Start Button */}
              <button
                onClick={handleStartProcess}
                disabled={isMarkingSession}
                className="group relative px-12 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-2xl hover:shadow-blue-500/25 disabled:shadow-none mx-auto flex items-center gap-4 overflow-hidden"
              >
                {/* Background Animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Button Content */}
                <div className="relative flex items-center gap-3">
                  {isMarkingSession ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Đang đánh dấu phiên...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6 transform group-hover:scale-110 transition-transform" />
                      <span className="text-lg">Bắt đầu tạo Key cho {services.find(s => s.id === selectedService)?.name}</span>
                    </>
                  )}
                </div>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
              
              {/* Additional Info */}
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Bảo mật cấp cao</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  <span>ID: {generatedRandomId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Thời gian: 30 phút</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Session Marking Loading Status */}
        {isMarkingSession && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              <div>
                <h3 className="text-blue-400 font-semibold">Đang đánh dấu phiên trong Database...</h3>
                <p className="text-slate-400 text-sm">Vui lòng chờ trong giây lát</p>
              </div>
            </div>
          </div>
        )}

        {/* Generated Link Display */}
        {generatedLink && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-green-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Phiên đã đánh dấu thành công!</h3>
                  <p className="text-slate-400 text-sm">Đang chuyển đến trang chọn thời gian...</p>
                </div>
              </div>
              
              <button
                onClick={resetAll}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
              >
                Tạo mới
              </button>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <code className="text-blue-400 font-mono text-sm break-all flex-1">{generatedLink}</code>
                <button
                  onClick={copyLink}
                  className="ml-4 p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-white font-semibold mb-4">Quy trình xác nhận chặt chẽ</h3>
          <ol className="space-y-2 text-slate-400 text-sm list-decimal list-inside">
            <li>Chọn dịch vụ → Xem trạng thái Key hiện tại</li>
            <li>Nhấn "Bắt đầu tạo Key" → Gọi API đánh dấu phiên</li>
            <li>Database xác nhận → INSERT session với status='PENDING'</li>
            <li>Chỉ khi thành công → Navigate đến URL đã đánh dấu</li>
            <li>Bất kỳ URL không có trong DB → Bị từ chối truy cập</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default ServiceSelectionPage;
