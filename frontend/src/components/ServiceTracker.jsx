import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../api/axios';

const ServiceTracker = () => {
  const { servicePath } = useParams();
  
  useEffect(() => {
    if (!servicePath) return;
    
    const trackServiceAccess = async () => {
      try {
        // Extract service name from path
        const serviceName = servicePath.split('-')[0];
        const fullPath = `/${servicePath}`;
        
        // Call backend tracking API
        const response = await axios.post('/api/track-service-access', {
          service: serviceName,
          path: fullPath
        });
        
        console.log('✅ Service access tracked:', response.data);
        
        // Optional: Redirect to backend for full flow
        // window.location.href = `http://127.0.0.1:7860/${servicePath}`;
        
      } catch (error) {
        console.error('❌ Failed to track service access:', error);
        
        // Fallback: Try direct backend access
        console.log('🔄 Trying direct backend access...');
        window.location.href = `http://127.0.0.1:7860/${servicePath}`;
      }
    };
    
    trackServiceAccess();
  }, [servicePath]);
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
        Loading Service...
      </div>
      <div style={{ color: '#666' }}>
        Tracking access to: {servicePath}
      </div>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ServiceTracker;
