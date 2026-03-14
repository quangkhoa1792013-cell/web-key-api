import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function LinkSkipPage() {
  const navigate = useNavigate();
  const [completedLinks, setCompletedLinks] = useState(0);
  const [requiredLinks, setRequiredLinks] = useState(1);
  const [showOverlay, setShowOverlay] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const storedTime = parseInt(localStorage.getItem('selectedTime') || '4');
    const storedLinks = parseInt(localStorage.getItem('selectedLinks') || '1');
    setRequiredLinks(storedLinks);
  }, []);

  const handleStart = () => {
    if (completedLinks >= requiredLinks) {
      navigate('/key');
      return;
    }
    setShowOverlay(true);
    setCountdown(5);
    setCanSkip(false);
    
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
  };

  const completeLink = () => {
    const newCompleted = completedLinks + 1;
    setCompletedLinks(newCompleted);
    setShowOverlay(false);
    
    if (newCompleted >= requiredLinks) {
      // All links completed, redirect to key page
      setTimeout(() => navigate('/key'), 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">KhoaDz Script Key</h1>
          <p className="text-gray-400">Hệ thống key Roblox</p>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-8 text-center">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Tiến độ</span>
              <span>{completedLinks}/{requiredLinks}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                style={{ width: `${(completedLinks / requiredLinks) * 100}%` }}
              />
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {completedLinks >= requiredLinks ? 'Nhận Key' : 'Start'}
          </button>

          <p className="mt-4 text-sm text-gray-500">
            {completedLinks >= requiredLinks 
              ? 'Bạn đã hoàn thành tất cả link!' 
              : `Vui lòng hoàn thành ${requiredLinks - completedLinks} link để nhận key`}
          </p>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button 
            onClick={() => navigate('/')} 
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Quay lại chọn thời gian
          </button>
        </div>
      </div>

      {/* Overlay */}
      {showOverlay && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-8 text-center max-w-sm w-full border border-gray-700">
            {!canSkip ? (
              <>
                <div className="text-2xl font-bold text-white mb-4">
                  CLOSE IN: {countdown}
                </div>
                <p className="text-gray-400">Vui lòng đợi...</p>
              </>
            ) : (
              <>
                <div className="text-xl font-bold text-white mb-6">
                  Vượt Link ({completedLinks + 1}/{requiredLinks})
                </div>
                <button
                  onClick={completeLink}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  ⚡ Vượt Link
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LinkSkipPage;
