import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function KeyDisplayPage() {
  const navigate = useNavigate();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate key on page load
    generateKey();
  }, []);

  const generateKey = async () => {
    const selectedTime = parseInt(localStorage.getItem('selectedTime') || '4');
    
    try {
      const response = await fetch('/api/create-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: selectedTime * 3600 })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setKeys([{ 
          key: result.key, 
          duration: result.duration,
          timeLeft: result.duration 
        }]);
      }
    } catch (error) {
      // Demo mode
      const demoKey = `KHOA-${selectedTime}H-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      setKeys([{ 
        key: demoKey, 
        duration: selectedTime * 3600,
        timeLeft: selectedTime * 3600 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    showToast('Đã copy key!');
  };

  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Đang tạo key...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">KhoaDz Script Key</h1>
          <p className="text-gray-400">Key của bạn đã sẵn sàng</p>
        </div>

        {/* Keys Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-6 text-gray-400 text-sm font-semibold uppercase tracking-wider">
                  YOUR KEYS ({keys.length}/1)
                </th>
                <th className="text-center py-4 px-6 text-gray-400 text-sm font-semibold uppercase tracking-wider">
                  TIME LEFT
                </th>
                <th className="text-center py-4 px-6 text-gray-400 text-sm font-semibold uppercase tracking-wider">
                  STATUS
                </th>
                <th className="text-center py-4 px-6 text-gray-400 text-sm font-semibold uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {keys.map((keyData, index) => (
                <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => copyKey(keyData.key)}
                        className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-lg">
                        🔑
                      </div>
                      <span className="font-mono text-white text-sm">{keyData.key}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-green-400 font-mono">{formatTime(keyData.timeLeft)}</span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                      active
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <button className="inline-flex items-center gap-1 px-3 py-1.5 border border-green-500/50 text-green-400 hover:bg-green-500/20 rounded-lg text-sm font-medium transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      + 24H
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/skip')} 
            className="px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
          >
            ← Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}

export default KeyDisplayPage;
