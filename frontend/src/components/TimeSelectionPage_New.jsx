import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, ChevronRight, Key, Shield } from 'lucide-react';

function TimeSelectionPage() {
  const navigate = useNavigate();
  const { serviceId, randomId } = useParams();
  const [selectedTime, setSelectedTime] = useState(null);
  const [isKeyGenerated, setIsKeyGenerated] = useState(false);

  // Check for existing key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('currentKey');
    if (savedKey) {
      try {
        const keyData = JSON.parse(savedKey);
        const now = Date.now();
        const expiresAt = keyData.createdAt ? new Date(keyData.createdAt).getTime() + (keyData.duration * 1000) : 0;
        
        if (expiresAt > now) {
          // Key still valid, redirect to key page
          navigate(`/key/${serviceId}/${randomId}`);
        } else {
          // Key expired, clear it
          localStorage.removeItem('currentKey');
        }
      } catch (e) {
        localStorage.removeItem('currentKey');
      }
    }

    // Check if key already generated for this session
    const generated = localStorage.getItem('keyGenerated');
    if (generated === 'true') {
      setIsKeyGenerated(true);
    }
  }, [navigate, serviceId, randomId]);

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
    if (isKeyGenerated) {
      // Don't allow re-selection if key already generated
      return;
    }

    setSelectedTime(hours);
    localStorage.setItem('selectedTime', hours);
    localStorage.setItem('requiredLinks', links);
    
    // Navigate to link skip page with same service and random ID
    navigate(`/${serviceId}/${randomId}`);
  };

  const handleReset = () => {
    // Reset everything to start over
    localStorage.removeItem('selectedTime');
    localStorage.removeItem('requiredLinks');
    localStorage.removeItem('keyGenerated');
    localStorage.removeItem('currentKey');
    setIsKeyGenerated(false);
    setSelectedTime(null);
    navigate('/');
  };

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

        {/* Service Info */}
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
                <p className="text-slate-400 text-sm">ID: {randomId}</p>
              </div>
            </div>
            
            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
            >
              Bắt đầu lại
            </button>
          </div>
        </div>

        {/* Key Generated State */}
        {isKeyGenerated ? (
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-8 mb-8 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Key đã được tạo!</h3>
            <p className="text-green-400">Vui lòng hoàn thành các bước vượt link để nhận key.</p>
            <p className="text-slate-400 text-sm mt-4">URL: <code className="bg-slate-700 px-2 py-1 rounded">/{serviceId}/{randomId}</code></p>
          </div>
        ) : (
          <>
            {/* Time Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timeOptions.map((option) => (
                <button
                  key={option.hours}
                  onClick={() => handleSelect(option.hours, option.links)}
                  disabled={isKeyGenerated}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] ${
                    selectedTime === option.hours
                      ? 'border-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-600/10 shadow-lg shadow-blue-500/20'
                      : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600/50'
                  } ${isKeyGenerated ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    <h3 className="text-lg font-semibold text-white mb-2">Thông tin đã chọn</h3>
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
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">Đã chọn</p>
                    <p className="text-slate-400 text-sm">Đang chuyển đến bước vượt link...</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Instructions */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
          <h4 className="text-white font-semibold mb-4">Hướng dẫn</h4>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
              Chọn thời gian sử dụng key
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
              Hoàn thành các bước vượt link
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
              Nhận key và sử dụng ngay!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TimeSelectionPage;
