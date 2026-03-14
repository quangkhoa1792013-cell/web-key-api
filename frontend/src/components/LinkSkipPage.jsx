import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, ExternalLink, CheckCircle, Shield, Zap, Key } from 'lucide-react';

function LinkSkipPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedLinks, setCompletedLinks] = useState(0);
  const [requiredLinks, setRequiredLinks] = useState(1);
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    const storedTime = parseInt(localStorage.getItem('selectedTime') || '4');
    const storedLinks = parseInt(localStorage.getItem('selectedLinks') || '1');
    setRequiredLinks(storedLinks);
  }, []);

  useEffect(() => {
    if (showLinkModal && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanSkip(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showLinkModal, countdown]);

  const openLink = () => {
    setCountdown(5);
    setCanSkip(false);
    setShowLinkModal(true);
  };

  const completeLink = () => {
    const newCompleted = completedLinks + 1;
    setCompletedLinks(newCompleted);
    setShowLinkModal(false);
    setCountdown(5);
    setCanSkip(false);
    // Không tự chuyển trang nữa, để người dùng nhấn nút "Tạo key"
  };

  const goToKeyPage = () => {
    const params = searchParams.toString();
    navigate(params ? `/key?${params}` : '/key');
  };

  const formatTime = (seconds) => `00:00:0${seconds}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Vượt Link</h1>
            <p className="text-slate-400 text-sm">Bước 2/3 - Hoàn thành các link để nhận key</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                index < 1 
                  ? 'bg-green-500 text-white' 
                  : index === 1 
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-400'
              }`}>
                {index < 1 ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              {index < 2 && (
                <div className={`w-20 h-1 mx-2 ${
                  index < 1 ? 'bg-green-500' : 'bg-slate-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="text-white font-semibold">Tiến độ vượt link</span>
              </div>
              <span className="text-slate-400">
                <span className="text-white font-bold">{completedLinks}</span>/{requiredLinks}
              </span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${(completedLinks / requiredLinks) * 100}%` }}
              />
            </div>
          </div>

          {/* Link List */}
          <div className="space-y-4">
            {Array.from({ length: requiredLinks }).map((_, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border transition-all duration-300 ${
                  index < completedLinks
                    ? 'bg-green-500/10 border-green-500/30'
                    : index === completedLinks
                      ? 'bg-blue-500/10 border-blue-500/30 animate-pulse'
                      : 'bg-slate-700/30 border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index < completedLinks ? 'bg-green-500' : 'bg-slate-600'
                    }`}>
                      {index < completedLinks ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">Link {index + 1}</p>
                      <p className="text-slate-400 text-sm">
                        {index < completedLinks 
                          ? 'Đã hoàn thành' 
                          : index === completedLinks 
                            ? 'Đang chờ...' 
                            : 'Chưa mở'}
                      </p>
                    </div>
                  </div>
                  
                  {index === completedLinks && index < requiredLinks && (
                    <button
                      onClick={openLink}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200"
                    >
                      <Zap className="w-4 h-4" />
                      Bắt đầu
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Completion Message & Create Key Button */}
          {completedLinks >= requiredLinks && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-white font-semibold">Hoàn thành tất cả link!</p>
                    <p className="text-slate-400 text-sm">Bạn đã sẵn sàng nhận key</p>
                  </div>
                </div>
              </div>
              <button
                onClick={goToKeyPage}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Key className="w-5 h-5" />
                Tạo Key Ngay
              </button>
            </div>
          )}
        </div>

        {/* Time Info */}
        <div className="mt-6 flex items-center justify-center gap-4 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Thời gian đã chọn: <strong className="text-white">{localStorage.getItem('selectedTime') || 4} giờ</strong></span>
          </div>
        </div>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-8 text-center max-w-md w-full border border-slate-700 shadow-2xl">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ExternalLink className="w-8 h-8 text-blue-400" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">
              Link {completedLinks + 1}/{requiredLinks}
            </h3>
            <p className="text-slate-400 mb-6">Vui lòng đợi để vượt link</p>
            
            {!canSkip ? (
              <div className="space-y-4">
                <div className="text-4xl font-mono font-bold text-blue-400">
                  {formatTime(countdown)}
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-1000"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  />
                </div>
                <p className="text-slate-500 text-sm">Đang tải...</p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 font-medium">Sẵn sàng vượt link!</p>
                </div>
                <button
                  onClick={completeLink}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Vượt Link Ngay
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LinkSkipPage;
