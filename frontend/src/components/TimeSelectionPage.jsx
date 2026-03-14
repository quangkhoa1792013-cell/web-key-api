import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, Key, Shield } from 'lucide-react';

function TimeSelectionPage() {
  const navigate = useNavigate();
  const [selectedTime, setSelectedTime] = useState(null);

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
          navigate('/key');
        } else {
          // Key expired, clear it
          localStorage.removeItem('currentKey');
        }
      } catch (e) {
        localStorage.removeItem('currentKey');
      }
    }
  }, [navigate]);

  const timeOptions = [
    { hours: 1, label: '1 Giờ', desc: 'Trải nghiệm ngắn', color: 'from-blue-500 to-blue-600' },
    { hours: 4, label: '4 Giờ', desc: 'Phù hợp test', color: 'from-green-500 to-green-600' },
    { hours: 24, label: '24 Giờ', desc: '1 ngày sử dụng', color: 'from-yellow-500 to-orange-500' },
    { hours: 48, label: '48 Giờ', desc: '2 ngày sử dụng', color: 'from-orange-500 to-red-500' },
    { hours: 72, label: '72 Giờ', desc: '3 ngày sử dụng', color: 'from-purple-500 to-pink-500' },
    { hours: 168, label: '7 Ngày', desc: '1 tuần VIP', color: 'from-pink-500 to-rose-500' },
  ];

  const handleSelect = (hours) => {
    setSelectedTime(hours);
    localStorage.setItem('selectedTime', hours);
    localStorage.setItem('selectedLinks', Math.ceil(hours / 24)); // 1 link per 24h
  };

  const handleContinue = () => {
    if (selectedTime) {
      // Generate unique URL params based on selected time
      const timeMap = { 1: '1H', 4: '4H', 24: '24H', 48: '48H', 72: '72H', 168: '7D' };
      const timeCode = timeMap[selectedTime] || '1H';
      const uniqueId = Math.random().toString(36).substring(2, 10).toUpperCase();
      const urlParams = `?for=Lootlabs-${timeCode}-${uniqueId}`;
      
      // Store in localStorage for device detection
      const existingDevice = localStorage.getItem(`device_${timeCode}`);
      if (!existingDevice) {
        localStorage.setItem(`device_${timeCode}`, 'true');
      }
      
      navigate(`/skip${urlParams}`);
    }
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

        {/* Time Selection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {timeOptions.map((option) => (
            <button
              key={option.hours}
              onClick={() => handleSelect(option.hours)}
              className={`relative p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                selectedTime === option.hours
                  ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-700/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${option.color} flex items-center justify-center mb-4`}>
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{option.label}</h3>
              <p className="text-slate-400 text-sm">{option.desc}</p>
              
              {selectedTime === option.hours && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
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
                    Cần vượt: <strong className="text-white">{Math.ceil(selectedTime / 24)} link</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={handleContinue}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
              >
                Tiếp tục
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
          <h4 className="text-white font-semibold mb-4">Hướng dẫn</h4>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
              Chọn thời gian sử dụng key phù hợp
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
              Hoàn thành các bước vượt link
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
              Đợi 10 giây để hệ thống tạo key
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">4</span>
              Nhận key và sử dụng ngay!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TimeSelectionPage;
