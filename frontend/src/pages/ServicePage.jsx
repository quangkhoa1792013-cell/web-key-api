import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from '../api/axios';
import './ServicePage.css';

const ServicePage = ({ setUserSession }) => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  
  const durations = [
    { value: '2h', display: '2 Hours', price: 'Free', multiplier: 1 },
    { value: '24h', display: '24 Hours', price: 'Free', multiplier: 12 },
    { value: '7d', display: '7 Days', price: 'Premium', multiplier: 84 }
  ];

  const [selectedDuration, setSelectedDuration] = useState('2h');
  const [loading, setLoading] = useState(false);

  const serviceInfo = {
    lootlab: {
      name: 'LootLab',
      description: 'Generate premium LootLab keys for enhanced gaming experience',
      features: ['Unlimited Access', 'Premium Features', 'Priority Support'],
      color: '#FF6B6B',
      icon: '🎮'
    },
    worklink: {
      name: 'WorkLink',
      description: 'Access exclusive WorkLink content and tools',
      features: ['Premium Content', 'Ad-Free Experience', 'Advanced Tools'],
      color: '#4ECDC4',
      icon: '💼'
    },
    pandas: {
      name: 'Pandas',
      description: 'Unlock advanced Pandas features and content',
      features: ['Full Access', 'Premium Analytics', 'Custom Solutions'],
      color: '#45B7D1',
      icon: '🐼'
    },
    linkvertise: {
      name: 'LinkVertise',
      description: 'Get LinkVertise premium access and earnings boost',
      features: ['Higher Earnings', 'Premium Tools', 'VIP Support'],
      color: '#96CEB4',
      icon: '🔗'
    }
  };

  const currentService = serviceInfo[serviceId] || serviceInfo.lootlab;

  const handleStartProcess = async () => {
    setLoading(true);
    
    try {
      // Track service access
      await axios.post('/api/track-service-access', {
        service: serviceId,
        path: `/${serviceId}/get-key&${selectedDuration}`
      });

      // Navigate to link process page
      navigate('/' + serviceId + '/get-key&' + selectedDuration);
      
    } catch (error) {
      console.error('Failed to start process:', error);
      // Still navigate on error
      navigate('/' + serviceId + '/get-key&' + selectedDuration);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear any existing session when entering service page
    setUserSession(null);
  }, [serviceId, setUserSession]);

  return (
    <div className="service-page">
      <div className="service-header">
        <Link to="/" className="back-button">
          ← Back to Home
        </Link>
        
        <div className="service-info" style={{ '--service-color': currentService.color }}>
          <div className="service-icon-large">
            {currentService.icon}
          </div>
          <div className="service-details">
            <h1>{currentService.name}</h1>
            <p>{currentService.description}</p>
          </div>
        </div>
      </div>

      <div className="duration-selection">
        <h2>⏰ Select Duration</h2>
        
        <div className="duration-cards">
          {durations.map((duration) => (
            <div
              key={duration.value}
              className={`duration-card ${selectedDuration === duration.value ? 'selected' : ''}`}
              onClick={() => setSelectedDuration(duration.value)}
            >
              <div className="duration-header">
                <h3>{duration.display}</h3>
                <span className="duration-price">{duration.price}</span>
              </div>
              <div className="duration-details">
                <p>Access period: {duration.display}</p>
                <p>Full premium features</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="process-section">
        <h2>🚀 Start Key Generation</h2>
        <p>
          Click the button below to start the verification process. 
          You'll be guided through a series of steps to generate your unique premium key.
        </p>
        
        <button
          className="start-process-btn"
          onClick={handleStartProcess}
          disabled={loading}
          style={{ '--service-color': currentService.color }}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Starting Process...
            </>
          ) : (
            <>
              Start Key Generation →
            </>
          )}
        </button>
      </div>

      <div className="features-section">
        <h2>✨ Premium Features</h2>
        <div className="features-grid">
          {currentService.features.map((feature, index) => (
            <div key={index} className="feature-item">
              <span className="feature-check">✓</span>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="security-info">
        <h3>🔒 Security Notice</h3>
        <p>
          This process includes security measures to prevent unauthorized access and link sharing. 
          Each user must complete the verification process individually.
        </p>
      </div>
    </div>
  );
};

export default ServicePage;
