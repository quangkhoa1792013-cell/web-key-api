import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../api/axios';
import './KeyResult.css';

const KeyResult = ({ userSession, setUserSession, onCreateNewKey }) => {
  const { serviceId, key_id } = useParams();
  const navigate = useNavigate();
  
  const [keyData, setKeyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const serviceInfo = {
    lootlab: { name: 'LootLab', color: '#FF6B6B', icon: '🎮' },
    worklink: { name: 'WorkLink', color: '#4ECDC4', icon: '💼' },
    pandas: { name: 'Pandas', color: '#45B7D1', icon: '🐼' },
    linkvertise: { name: 'LinkVertise', color: '#96CEB4', icon: '🔗' }
  };

  const currentService = serviceInfo[serviceId] || serviceInfo.lootlab;

  useEffect(() => {
    if (userSession && userSession.keyId === key_id) {
      // Use existing session data
      setKeyData(userSession);
      calculateTimeLeft(userSession.expireTs);
      setLoading(false);
    } else {
      // Fetch key data from backend
      fetchKeyData();
    }
  }, [key_id, userSession]);

  const fetchKeyData = async () => {
    try {
      const response = await axios.get(`/api/get-key?id=${key_id}&service=${serviceId}`);
      setKeyData(response.data);
      calculateTimeLeft(response.data.expireTs);
      
      // Update session
      setUserSession({
        ...response.data,
        sessionId: key_id,
        service: serviceId,
        hwid: localStorage.getItem('user_hwid') || 'UNKNOWN'
      });
      
    } catch (error) {
      console.error('Failed to fetch key data:', error);
      setLoading(false);
    }
  };

  const calculateTimeLeft = (expireTs) => {
    const updateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const left = expireTs - now;
      
      if (left <= 0) {
        setTimeLeft('Expired');
      } else {
        const hours = Math.floor(left / 3600);
        const minutes = Math.floor((left % 3600) / 60);
        const seconds = left % 60;
        
        if (hours > 24) {
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;
          setTimeLeft(`${days}d ${remainingHours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    
    return () => clearInterval(interval);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const isExpired = () => {
    return timeLeft === 'Expired';
  };

  if (loading) {
    return (
      <div className="key-result loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your key...</p>
        </div>
      </div>
    );
  }

  if (!keyData) {
    return (
      <div className="key-result error">
        <div className="error-container">
          <h2>❌ Key Not Found</h2>
          <p>The requested key could not be found or has been invalidated.</p>
          <button 
            className="back-home-btn"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="key-result">
      <div className="key-header">
        <div className="service-info" style={{ '--service-color': currentService.color }}>
          <span className="service-icon">{currentService.icon}</span>
          <span className="service-name">{currentService.name}</span>
        </div>
        
        <div className={`key-status ${isExpired() ? 'expired' : 'active'}`}>
          {isExpired() ? '⏰ Expired' : '✅ Active'}
        </div>
      </div>

      <div className="key-content">
        <div className="key-display">
          <h2>🔑 Your Premium Key</h2>
          <div className="key-value">
            <code>{keyData.key}</code>
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(keyData.key)}
              style={{ '--service-color': currentService.color }}
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
          
          <div className="key-info">
            <div className="info-item">
              <span className="info-label">Service:</span>
              <span className="info-value">{currentService.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Duration:</span>
              <span className="info-value">{keyData.duration}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Expires In:</span>
              <span className={`info-value ${isExpired() ? 'expired' : ''}`}>
                {timeLeft}
              </span>
            </div>
          </div>
        </div>

        {isExpired() && (
          <div className="expired-section">
            <h3>⏰ Key Expired</h3>
            <p>Your premium key has expired. Generate a new key to continue using the service.</p>
            
            <button
              className="create-new-key-btn"
              onClick={onCreateNewKey}
              style={{ '--service-color': currentService.color }}
            >
              🔄 Create New Key
            </button>
          </div>
        )}

        {!isExpired() && (
          <div className="active-section">
            <h3>✅ Key Active</h3>
            <p>Your premium key is active and ready to use!</p>
            
            <div className="action-buttons">
              <button
                className="use-key-btn"
                onClick={() => window.open(keyData.serviceUrl || '#', '_blank')}
                style={{ '--service-color': currentService.color }}
              >
                🚀 Use Key
              </button>
              
              <button
                className="create-new-key-btn"
                onClick={onCreateNewKey}
                style={{ '--service-color': currentService.color }}
              >
                🔄 Create New Key
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="key-footer">
        <div className="instructions">
          <h4>📋 How to use your key:</h4>
          <ol>
            <li>Copy the premium key using the copy button</li>
            <li>Navigate to the {currentService.name} website</li>
            <li>Paste the key in the premium activation field</li>
            <li>Enjoy your premium features!</li>
          </ol>
        </div>

        <div className="security-notice">
          <h4>🔒 Important Security Notice:</h4>
          <p>
            This key is tied to your device and account. 
            Do not share this key with others as it may be deactivated.
            Each user must generate their own key individually.
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyResult;
