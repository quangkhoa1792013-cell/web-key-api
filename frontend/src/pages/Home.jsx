import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = ({ setUserSession }) => {
  const services = [
    {
      name: 'lootlab',
      displayName: 'LootLab',
      description: 'Get premium LootLab keys',
      icon: '🎮',
      color: '#FF6B6B'
    },
    {
      name: 'worklink',
      displayName: 'WorkLink',
      description: 'Access WorkLink premium content',
      icon: '💼',
      color: '#4ECDC4'
    },
    {
      name: 'pandas',
      displayName: 'Pandas',
      description: 'Unlock Pandas features',
      icon: '🐼',
      color: '#45B7D1'
    },
    {
      name: 'linkvertise',
      displayName: 'LinkVertise',
      description: 'Get LinkVertise access',
      icon: '🔗',
      color: '#96CEB4'
    }
  ];

  const handleServiceSelect = (serviceName) => {
    // Clear any existing session when selecting new service
    setUserSession(null);
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">
          🔑 Premium Key Generator
        </h1>
        <p className="home-subtitle">
          Choose a service to generate your premium key
        </p>
      </div>

      <div className="services-grid">
        {services.map((service) => (
          <Link 
            key={service.name}
            to={`/${service.name}`}
            className="service-card"
            style={{ '--service-color': service.color }}
            onClick={() => handleServiceSelect(service.name)}
          >
            <div className="service-icon">
              {service.icon}
            </div>
            <div className="service-info">
              <h3 className="service-name">
                {service.displayName}
              </h3>
              <p className="service-description">
                {service.description}
              </p>
            </div>
            <div className="service-arrow">
              →
            </div>
          </Link>
        ))}
      </div>

      <div className="home-footer">
        <div className="info-box">
          <h4>📋 How it works:</h4>
          <ol>
            <li>Choose your desired service</li>
            <li>Select duration (2h, 24h, 7 days)</li>
            <li>Complete the verification process</li>
            <li>Get your unique premium key</li>
          </ol>
        </div>
        
        <div className="security-notice">
          <h4>🔒 Security Features:</h4>
          <ul>
            <li>✅ Anti-jump protection</li>
            <li>✅ Link sharing prevention</li>
            <li>✅ Automatic session cleanup</li>
            <li>✅ Secure key generation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;
