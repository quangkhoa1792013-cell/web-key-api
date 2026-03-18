import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Clock, AlertTriangle, RefreshCw, Shield, ArrowLeft } from 'lucide-react';

function KeyDisplay() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [keyData, setKeyData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch key data on mount
  useEffect(() => {
    const fetchKeyData = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://khoablabla-backend.hf.space';
        const response = await fetch(`${apiBaseUrl}/api/get-key?id=${id}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.key) {
            setKeyData(data.key);
            
            // Calculate initial time left
            const currentTime = Math.floor(Date.now() / 1000);
            const initialTimeLeft = Math.max(0, data.key.expire_ts - currentTime);
            setTimeLeft(initialTimeLeft);
            setIsExpired(initialTimeLeft <= 0);
            
            console.log('[KeyDisplay] Key loaded:', data.key);
            console.log('[KeyDisplay] Time left:', initialTimeLeft);
          } else {
            // Key not found
            setKeyData(null);
            setIsExpired(true);
          }
        } else {
          console.error('[KeyDisplay] Failed to fetch key');
          setKeyData(null);
          setIsExpired(true);
        }
      } catch (error) {
        console.error('[KeyDisplay] Error fetching key:', error);
        setKeyData(null);
        setIsExpired(true);
      } finally {
        setLoading(false);
      }
    };

    fetchKeyData();
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (!keyData || isExpired) return;

    const interval = setInterval(() => {
      const currentTime = Math.floor(Date.now() / 1000);
      const newTimeLeft = Math.max(0, keyData.expire_ts - currentTime);
      
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft <= 0) {
        setIsExpired(true);
        clearInterval(interval);
        console.log('[KeyDisplay] Key expired at:', new Date(currentTime * 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [keyData, isExpired]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const copyKey = () => {
    if (isExpired) return;
    navigator.clipboard.writeText(keyData.key);
    // Toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 px-6 py-3 bg-green-500 text-white rounded-lg shadow-xl z-50 animate-fade-in';
    toast.textContent = 'Đã copy key!';
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  };

  const getNewKey = async () => {
    setShowAlert(true);
    setDeleting(true);
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://khoablabla-backend.hf.space';
      
      // Delete the current key from database
      const deleteResponse = await fetch(`${apiBaseUrl}/api/delete-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sessionId: id,
          hwid: keyData.hwid || 'UNKNOWN' 
        })
      });

      if (deleteResponse.ok) {
        console.log('[KeyDisplay] Key deleted successfully');
        
        // Wait a moment then redirect to home
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        console.error('[KeyDisplay] Failed to delete key');
        setDeleting(false);
        setShowAlert(false);
      }
    } catch (error) {
      console.error('[KeyDisplay] Error deleting key:', error);
      setDeleting(false);
      setShowAlert(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white text-xl animate-pulse">Đang tải...</div>
      </div>
    );
  }

  if (!keyData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8 max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Phiên không tồn tại</h2>
          <p className="text-slate-400 mb-6">Key này đã hết hạn hoặc bị xóa khỏi hệ thống.</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Alert Overlay */}
      {showAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 max-w-md text-center animate-fade-in">
            <AlertTriangle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Phiên làm việc đã hết hạn</h2>
            <p className="text-slate-400 mb-6">
              {deleting ? 'Đang đưa bạn về trang chủ để làm mới...' : 'Đang xóa phiên cũ...'}
            </p>
            {deleting && (
              <div className="flex justify-center">
                <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        </div>

        {/* Key Display */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Thông tin Key
            </h2>
          </div>

          <div className="p-8">
            {/* Key Info */}
            <div className={`text-center transition-all duration-300 ${
              isExpired ? 'opacity-40' : 'opacity-100'
            }`}>
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                  KEY
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                  <code className="text-xl font-mono text-white break-all">{keyData.key}</code>
                </div>
              </div>

              {/* Copy Button */}
              {!isExpired && (
                <button
                  onClick={copyKey}
                  className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-5 h-5" />
                  Copy Key
                </button>
              )}
            </div>

            {/* Countdown Timer */}
            <div className="mt-8 text-center">
              <h3 className="text-lg font-semibold text-white mb-4">Thời gian còn lại</h3>
              <div className={`text-6xl font-mono font-bold transition-all duration-300 ${
                isExpired 
                  ? 'text-red-400 animate-pulse' 
                  : 'text-green-400'
              }`}>
                {formatTime(timeLeft)}
              </div>
              {isExpired && (
                <p className="text-red-400 mt-2">Phiên đã hết hạn</p>
              )}
            </div>

            {/* Get New Key Button */}
            {isExpired && (
              <div className="mt-8 text-center">
                <button
                  onClick={getNewKey}
                  disabled={deleting}
                  className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <RefreshCw className={`w-6 h-6 ${deleting ? 'animate-spin' : ''}`} />
                  Get New Key
                </button>
                <p className="text-slate-400 mt-4 text-sm">
                  Key cũ sẽ bị xóa vĩnh viễn khỏi hệ thống
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default KeyDisplay;
