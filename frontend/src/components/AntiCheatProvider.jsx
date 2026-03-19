import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

function AntiCheatProvider({ children }) {
  const navigate = useNavigate();
  const [timeDrift, setTimeDrift] = useState(0);
  const [isTimeValid, setIsTimeValid] = useState(true);

  // Check for time manipulation
  useEffect(() => {
    const checkTimeDrift = async () => {
      try {
        const clientTime = Math.floor(Date.now() / 1000);
        const currentKey = localStorage.getItem('currentKey');
        
        // Only check anti-cheat if we have a valid key
        if (!currentKey || currentKey === 'demo-key') {
          // No valid key, skip anti-cheat check
          return;
        }
        
        // Get server time
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/anti-cheat-check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_time: clientTime,
            key: currentKey
          })
        });

        const data = await response.json();
        
        if (data.success) {
          const serverTime = data.server_time;
          const drift = Math.abs(clientTime - serverTime);
          
          setTimeDrift(drift);
          
          // Allow 5 minutes tolerance
          if (drift > 300) {
            setIsTimeValid(false);
            
            // Log to console
            console.error('[AntiCheat] Time manipulation detected!', {
              clientTime,
              serverTime,
              drift
            });
            
            // Redirect to expired page
            navigate('/expired', { replace: true });
            return;
          }
          
          setIsTimeValid(true);
        } else if (data.message === 'ANTI_CHEAT_DETECTED') {
          setIsTimeValid(false);
          navigate('/expired', { replace: true });
        }
      } catch (error) {
        console.error('[AntiCheat] Time check failed:', error);
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkTimeDrift, 30000);
    
    // Initial check
    checkTimeDrift();

    return () => clearInterval(interval);
  }, [navigate]);

  // Show anti-cheat status in development
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="relative">
        {/* Anti-Cheat Status Badge */}
        <div className={`fixed top-4 right-4 px-3 py-2 rounded-lg text-xs font-mono z-50 ${
          isTimeValid 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          <div className="flex items-center gap-2">
            {isTimeValid ? (
              <>
                <Shield className="w-3 h-3" />
                <span>Time Valid</span>
                <span className="text-xs opacity-60">({timeDrift}s drift)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3" />
                <span>Time Invalid</span>
              </>
            )}
          </div>
        </div>
        
        {/* Render children */}
        {children}
      </div>
    );
  }

  return children;
}

export default AntiCheatProvider;
