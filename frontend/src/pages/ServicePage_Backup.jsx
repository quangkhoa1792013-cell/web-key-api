import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from '../api/axios';

const ServicePage = ({ setUserSession }) => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  
  const [selectedDuration, setSelectedDuration] = useState('2h');
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const serviceInfo = {
    lootlab: {
      name: 'LootLab',
      description: 'Generate premium LootLab keys for enhanced gaming experience',
      features: ['Unlimited Access', 'Premium Features', 'Priority Support'],
      color: 'var(--primary-600)',
      icon: '🎮'
    },
    worklink: {
      name: 'WorkLink',
      description: 'Access exclusive WorkLink content and tools',
      features: ['Premium Content', 'Ad-Free Experience', 'Advanced Tools'],
      color: 'var(--secondary-600)',
      icon: '💼'
    },
    pandas: {
      name: 'Pandas',
      description: 'Unlock advanced Pandas features and content',
      features: ['Full Access', 'Premium Analytics', 'Custom Solutions'],
      color: 'var(--success)',
      icon: '🐼'
    },
    linkvertise: {
      name: 'LinkVertise',
      description: 'Get LinkVertise premium access and earnings boost',
      features: ['Higher Earnings', 'Premium Tools', 'VIP Support'],
      color: 'var(--warning)',
      icon: '🔗'
    }
  };

  const pricingPlans = [
    {
      id: '2h',
      name: 'Trial',
      duration: '2 Hours',
      price: 'Free',
      description: 'Perfect for testing our service',
      features: ['Basic Access', 'Limited Features', 'No Credit Card Required'],
      popular: false,
      color: 'var(--gray-600)'
    },
    {
      id: '24h',
      name: 'Standard',
      duration: '24 Hours',
      price: 'Free',
      description: 'Most popular choice for daily use',
      features: ['Full Access', 'All Features', 'Priority Support', '24 Hour Validity'],
      popular: true,
      color: 'var(--primary-600)'
    },
    {
      id: '7d',
      name: 'Premium',
      duration: '7 Days',
      price: '$4.99',
      description: 'Best value for extended usage',
      features: ['Unlimited Access', 'Premium Features', 'VIP Support', '7 Day Validity', 'Multiple Keys'],
      popular: false,
      color: 'var(--secondary-600)'
    }
  ];

  const currentService = serviceInfo[serviceId] || serviceInfo.lootlab;

  const handleStartProcess = async () => {
    if (!selectedDuration) return;
    
    setIsProcessing(true);
    setLoading(true);
    
    try {
      // Track service access
      await axios.post('/api/track-service-access', {
        service: serviceId,
        path: `/${serviceId}/get-key&${selectedDuration}`,
        timestamp: new Date().toISOString()
      });

      // Simulate API processing time for smooth UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Navigate to link process page after API success
      navigate(`/${serviceId}/get-key&${selectedDuration}`);
      
    } catch (error) {
      console.error('Failed to start process:', error);
      // Still navigate on error
      navigate(`/${serviceId}/get-key&${selectedDuration}`);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handlePlanSelect = (planId) => {
    if (!isProcessing) {
      setSelectedDuration(planId);
    }
  };

  useEffect(() => {
    // Clear any existing session when entering service page
    if (typeof setUserSession === 'function') {
      setUserSession(null);
    }
  }, [serviceId, setUserSession]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-12 fade-in">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="btn btn-ghost hover:bg-gray-800 transition-all duration-200"
            >
              ← Back to Home
            </Link>
            
            <div className="card p-4 flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: currentService.color + '20', color: currentService.color }}
              >
                {currentService.icon}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white mb-1">{currentService.name}</h1>
                <p className="text-sm text-gray-400">{currentService.description}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Pricing Section */}
        <section className="mb-12 fade-in">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">Choose Your Plan</h2>
            <p className="text-gray-400 text-lg">Select the perfect duration for your needs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.id}
                className={`card relative cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedDuration === plan.id 
                    ? 'ring-2 ring-offset-2 ring-offset-gray-900' 
                    : 'hover:border-gray-600'
                }`}
                style={{
                  ringColor: selectedDuration === plan.id ? plan.color : undefined,
                  transform: selectedDuration === plan.id ? 'scale(1.05)' : undefined
                }}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.popular && (
                  <div 
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: plan.color }}
                  >
                    MOST POPULAR
                  </div>
                )}
                
                <div className="text-center p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    {plan.price !== 'Free' && (
                      <span className="text-gray-400 text-sm">/7 days</span>
                    )}
                  </div>
                  <div className="text-2xl font-semibold mb-4" style={{ color: plan.color }}>
                    {plan.duration}
                  </div>
                  <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                  
                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <svg className="w-5 h-5" style={{ color: plan.color }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-12 fade-in">
          <div className="card p-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">✨ Premium Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentService.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-gray-800/50">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: currentService.color + '20', color: currentService.color }}
                  >
                    ✓
                  </div>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Action Section */}
        <section className="mb-12 fade-in">
          <div className="card p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">🚀 Start Key Generation</h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Click the button below to start the verification process. You'll be guided through a series of steps to generate your unique premium key.
            </p>
            
            <button
              className={`btn btn-primary text-lg px-8 py-4 min-w-[200px] ${
                isProcessing ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              style={{
                background: selectedDuration 
                  ? `linear-gradient(135deg, ${currentService.color}, ${currentService.color}dd)`
                  : undefined
              }}
              onClick={handleStartProcess}
              disabled={isProcessing || loading || !selectedDuration}
            >
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <div className="loading-spinner"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span>Start Key Generation</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </section>

        {/* Security Notice */}
        <section className="fade-in">
          <div className="card p-6 border-l-4" style={{ borderLeftColor: 'var(--warning)' }}>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" 
                   style={{ backgroundColor: 'var(--warning)', color: 'var(--gray-900)' }}>
                🔒
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Security Notice</h4>
                <p className="text-gray-400 leading-relaxed">
                  This process includes security measures to prevent unauthorized access and link sharing. 
                  Each user must complete the verification process individually. Your keys are unique 
                  and tied to your session.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ServicePage;
