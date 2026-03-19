import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Copy, Clock, AlertTriangle, RefreshCw, Shield, ArrowLeft } from 'lucide-react';
import api from '../api/axios';

function KeyDisplay() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Ưu tiên lấy ID từ URL path /s/:id (đóng đinh)
  const getKeyId = () => {
    // Nếu URL là /s/:id, đây là "mỏ neo" cố định
    if (location.pathname.startsWith('/s/')) {
      return location.pathname.split('/s/')[1];
    }
    // Fallback về useParams
    return id;
  };
  
  const keyId = getKeyId();
  
  const [keyData, setKeyData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch key data on mount
  useEffect(() => {
    const fetchKeyData = async () => {
      console.log('[KeyDisplay] === STARTING KEY FETCH ===');
      console.log('[KeyDisplay] Fetching key for ID:', keyId);
      console.log('[KeyDisplay] URL path:', location.pathname);
      console.log('[KeyDisplay] Is "đóng đinh" URL:', location.pathname.startsWith('/s/'));
      
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:7860';
        const url = `/api/get-key?id=${keyId}`;
        console.log('[KeyDisplay] Full API URL:', apiBaseUrl + url);
        
        const response = await api.get(url);
        console.log('[KeyDisplay] Response status:', response.status);
        console.log('[KeyDisplay] Response data:', response.data);
        
        if (response.data && response.data.success && response.data.key) {
          setKeyData(response.data.key);
          
          // Calculate initial time left
          const currentTime = Math.floor(Date.now() / 1000);
          const initialTimeLeft = Math.max(0, response.data.key.expire_ts - currentTime);
          setTimeLeft(initialTimeLeft);
          setIsExpired(initialTimeLeft <= 0);
          
          console.log('[KeyDisplay] ✅ Key loaded successfully:', response.data.key);
          console.log('[KeyDisplay] Current timestamp:', currentTime);
          console.log('[KeyDisplay] Key expire timestamp:', response.data.key.expire_ts);
          console.log('[KeyDisplay] Initial time left (seconds):', initialTimeLeft);
          console.log('[KeyDisplay] Initial time left (formatted):', formatTime(initialTimeLeft));
          console.log('[KeyDisplay] Is expired initially:', initialTimeLeft <= 0);
        } else {
          console.log('[KeyDisplay] ❌ Key not found in response');
          setKeyData(null);
          setIsExpired(true);
        }
      } catch (error) {
        console.error('[KeyDisplay] ❌ Error fetching key:', error);
        setKeyData(null);
        setIsExpired(true);
      } finally {
        console.log('[KeyDisplay] === KEY FETCH COMPLETE ===');
        setLoading(false);
      }
    };

    fetchKeyData();
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (!keyData || isExpired) return;

    console.log('[KeyDisplay] === STARTING COUNTDOWN TIMER ===');
    console.log('[KeyDisplay] Initial time left:', timeLeft);
    console.log('[KeyDisplay] Key expire timestamp:', keyData.expire_ts);

    const interval = setInterval(() => {
      const currentTime = Math.floor(Date.now() / 1000);
      const newTimeLeft = Math.max(0, keyData.expire_ts - currentTime);
      
      console.log('[KeyDisplay] ⏰ Countdown update:');
      console.log('[KeyDisplay] Current time:', currentTime);
      console.log('[KeyDisplay] Expire time:', keyData.expire_ts);
      console.log('[KeyDisplay] New time left:', newTimeLeft);
      console.log('[KeyDisplay] Formatted time:', formatTime(newTimeLeft));
      
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft <= 0) {
        console.log('[KeyDisplay] 🚨 COUNTDOWN REACHED ZERO!');
        console.log('[KeyDisplay] 🔴 KEY EXPIRED - CHANGING COLOR TO RED');
        console.log('[KeyDisplay] 🔴 MAKING KEY OPACITY LOW');
        console.log('[KeyDisplay] 🗑️ AUTO-DELETING SESSION...');
        
        // Auto-delete session when countdown reaches zero
        const autoDeleteSession = async () => {
          try {
            console.log('[KeyDisplay] 🛰️ Sending auto-delete request...');
            const deleteResponse = await api.delete(`/api/session/${id}`, {
              data: {
                sessionId: id,
                hwid: keyData?.hwid || 'AUTO_DELETE'
              }
            });
            
            console.log('[KeyDisplay] ✅ Auto-delete response:', deleteResponse.data);
            console.log('[KeyDisplay] 🧹 Clearing localStorage and sessionStorage...');
            localStorage.clear();
            sessionStorage.clear();
            
            // Force redirect to home
            console.log('[KeyDisplay] 🏠 FORCE REDIRECT TO HOME');
            window.location.href = '/';
            
          } catch (error) {
            console.error('[KeyDisplay] ❌ Auto-delete failed:', error);
            // Still activate expired state and show manual delete button
            setIsExpired(true);
          }
        };
        
        // Execute auto-delete immediately
        autoDeleteSession();
        clearInterval(interval);
        
        // Log the exact moment of expiry
        const expiryTime = new Date(currentTime * 1000).toLocaleString('vi-VN');
        console.log('[KeyDisplay] ⏰ EXPIRED AT:', expiryTime);
        console.log('[KeyDisplay] === COUNTDOWN ENDED - KEY SELF-DESTRUCTED ===');
      }
    }, 1000);

    return () => {
      console.log('[KeyDisplay] === CLEANING UP COUNTDOWN TIMER ===');
      clearInterval(interval);
    };
  }, [keyData, isExpired, timeLeft]);

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
    console.log('[KeyDisplay] === GET NEW KEY PROCESS STARTED ===');
    console.log('[KeyDisplay] Session ID to delete:', keyId);
    console.log('[KeyDisplay] Key HWID:', keyData?.hwid);
    console.log('[KeyDisplay] User clicked Get New Key button');
    console.log(`[ACTION] User requested DELETE for Session ID: ${keyId}`);
    
    setShowAlert(true);
    setDeleting(true);
    
    try {
        console.log('[KeyDisplay] 🗑️ DELETING SESSION...');
        console.log('[KeyDisplay] Delete API URL:', `/api/delete-session`);
        console.log('[KeyDisplay] Request payload:', {
          sessionId: keyId,
          hwid: keyData?.hwid || 'UNKNOWN'
        });
        
        // Gọi lệnh DELETE lên API Netlify
        const deleteResponse = await api.post('/api/delete-session', {
          sessionId: keyId,
          hwid: keyData?.hwid || 'UNKNOWN'
        });

        console.log('[KeyDisplay] Delete response status:', deleteResponse.status);
        console.log('[KeyDisplay] Delete response ok:', deleteResponse.status === 200);
        console.log('[KeyDisplay] Delete response data:', deleteResponse.data);

        if (deleteResponse.status === 200 && deleteResponse.data.success) {
          console.log('[KeyDisplay] ✅ Session deleted successfully!');
          console.log('[KeyDisplay] 🧹 Removing user_session from localStorage...');
          
          // Xóa user_session và force redirect
          localStorage.removeItem('user_session');
          window.location.href = '/';
        } else {
          console.error('[KeyDisplay] ❌ Delete failed:', deleteResponse.data);
          console.log('[KeyDisplay] Delete error status:', deleteResponse.status);
          setDeleting(false);
          setShowAlert(false);
        }
      } catch (error) {
        console.error('[KeyDisplay] ❌ Error deleting key:', error);
        setDeleting(false);
        setShowAlert(false);
      }
    
    console.log('[KeyDisplay] === GET NEW KEY PROCESS COMPLETE ===');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white text-xl animate-pulse">Đang tải...</div>
      </div>
    );
  }

  if (!keyData) {
    console.log('[KeyDisplay] ❌ Key not found - showing 404 page');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8 max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Phiên không tồn tại</h2>
          <p className="text-slate-400 mb-6">Key này đã hết hạn hoặc bị xóa khỏi hệ thống.</p>
          <button
            onClick={() => {
              console.log('[KeyDisplay] User clicked return to home from 404 page');
              navigate('/');
            }}
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
                isExpired ? 'text-red-600 animate-pulse' : 'text-green-400'
              }`}>
                {formatTime(timeLeft)}
              </div>
              {isExpired && (
                <p className="text-red-600 mt-2">Phiên đã hết hạn</p>
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
