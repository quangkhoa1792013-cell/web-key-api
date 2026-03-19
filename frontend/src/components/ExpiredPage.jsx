import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

function ExpiredPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-red-500/30 p-8 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">Key Hết Hạn</h1>
          
          <p className="text-slate-400 mb-6">
            Key của bạn đã hết hạn. Tất cả dữ liệu đã được xóa khỏi hệ thống.
          </p>
          
          <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
            <p className="text-slate-400 text-sm mb-2">Tự động chuyển về trang chính sau:</p>
            <p className="text-4xl font-mono font-bold text-red-400">{countdown}s</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200"
            >
              <Home className="w-5 h-5" />
              Về Trang Chính
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all duration-200"
            >
              <RefreshCw className="w-5 h-5" />
              Tải Lại Trang
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-amber-400 text-sm">
              <strong>Lưu ý:</strong> Vui lòng tạo key mới để tiếp tục sử dụng dịch vụ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpiredPage;
