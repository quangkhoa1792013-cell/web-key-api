import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../api/axios';
import './LinkProcess.css';

const LinkProcess = ({ setUserSession, onCreateNewKey }) => {
  const { serviceId, time } = useParams();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [processData, setProcessData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const steps = [
    { id: 0, name: 'Initializing', description: 'Setting up your session...' },
    { id: 1, name: 'Verification', description: 'Please complete the verification steps...' },
    { id: 2, name: 'Processing', description: 'Generating your key...' },
    { id: 3, name: 'Finalizing', description: 'Almost done...' }
  ];

  const serviceInfo = {
    lootlab: { name: 'LootLab', color: '#FF6B6B', icon: '🎮' },
    worklink: { name: 'WorkLink', color: '#4ECDC4', icon: '💼' },
    pandas: { name: 'Pandas', color: '#45B7D1', icon: '🐼' },
    linkvertise: { name: 'LinkVertise', color: '#96CEB4', icon: '🔗' }
  };

  const currentService = serviceInfo[serviceId] || serviceInfo.lootlab;

  useEffect(() => {
    initializeProcess();
  }, [serviceId, time]);

  const initializeProcess = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Start verification process
      const response = await axios.post('/api/start-process', {
        service: serviceId,
        duration: time
      });
      
      if (response.data.success) {
        setProcessData(response.data);
        setCurrentStep(1);
      } else {
        setError(response.data.error || 'Failed to start process');
      }
    } catch (error) {
      console.error('Process initialization error:', error);
      setError('Failed to initialize process');
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async () => {
    if (currentStep >= steps.length - 1) {
      await completeProcess();
      return;
    }

    setLoading(true);
    
    try {
      // Simulate step completion (in real app, this would be actual verification)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCurrentStep(prev => prev + 1);
      
    } catch (error) {
      console.error('Step completion failed:', error);
      setError('Step completion failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const completeProcess = async () => {
    setLoading(true);
    
    try {
      // Mark process as completed (ready for key generation)
      await axios.post('/api/complete-process', {
        service: serviceId,
        duration: time,
        processId: processData?.processId
      });

      // Navigate to key generation page
      navigate(`/${serviceId}/get-key&${time}?completed=true`);
      
    } catch (error) {
      console.error('Process completion failed:', error);
      setError('Failed to complete process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetKey = async () => {
    setLoading(true);
    
    try {
      // Generate the actual key
      const response = await axios.post('/api/generate-key', {
        service: serviceId,
        duration: time
      });
      
      if (response.data.success) {
        // Navigate to key result page with the generated key
        navigate(`/${serviceId}/key-${response.data.keyId}`);
      } else {
        setError(response.data.error || 'Failed to generate key');
      }
    } catch (error) {
      console.error('Key generation failed:', error);
      setError('Failed to generate key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isProcessCompleted = () => {
    return currentStep >= steps.length - 1;
  };

  return (
    <div className="link-process">
      <div className="process-header">
        <div className="service-info" style={{ '--service-color': currentService.color }}>
          <span className="service-icon">{currentService.icon}</span>
          <span className="service-name">{currentService.name}</span>
          <span className="duration-badge">{time}</span>
        </div>
        
        <button 
          className="cancel-btn"
          onClick={() => navigate(`/${serviceId}`)}
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      <div className="progress-container">
        <div className="steps-progress">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`step-item ${index <= currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
            >
              <div className="step-number">
                {index <= currentStep ? '✓' : index + 1}
              </div>
              <div className="step-info">
                <h4>{step.name}</h4>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="process-content">
        {currentStep === 0 && (
          <div className="step-content">
            <h3>🚀 Initializing Your Session</h3>
            <p>We're setting up your secure session for key generation.</p>
            <div className="loading-animation">
              <div className="spinner"></div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="step-content">
            <h3>🔐 Complete Verification</h3>
            <p>Please complete the verification steps below to continue.</p>
            
            <div className="verification-steps">
              <div className="verification-item">
                <span className="step-number">1</span>
                <p>Complete the human verification</p>
              </div>
              <div className="verification-item">
                <span className="step-number">2</span>
                <p>Wait for the timer to complete</p>
              </div>
              <div className="verification-item">
                <span className="step-number">3</span>
                <p>Click the verification button</p>
              </div>
            </div>

            <button
              className="verify-btn"
              onClick={handleStepComplete}
              disabled={loading}
              style={{ '--service-color': currentService.color }}
            >
              {loading ? <div className="spinner-small"></div> : 'Complete Verification'}
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="step-content">
            <h3>⚙️ Processing Your Request</h3>
            <p>We're generating your unique premium key...</p>
            <div className="loading-animation">
              <div className="spinner"></div>
            </div>
            
            <button
              className="continue-btn"
              onClick={handleStepComplete}
              disabled={loading}
              style={{ '--service-color': currentService.color }}
            >
              {loading ? <div className="spinner-small"></div> : 'Continue'}
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="step-content">
            <h3>🎉 Almost Done!</h3>
            <p>Your key is ready to be generated.</p>
            
            <button
              className="get-key-btn"
              onClick={handleGetKey}
              disabled={loading}
              style={{ '--service-color': currentService.color }}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Generating Key...
                </>
              ) : (
                <>
                  🔑 Get Your Key
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="process-footer">
        <div className="security-notice">
          <h4>🔒 Security Notice</h4>
          <p>
            This process is secured with anti-bot and anti-sharing measures. 
            Each user must complete the verification individually.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LinkProcess;
