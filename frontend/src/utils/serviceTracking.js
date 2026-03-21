// Frontend Service Access Tracking
// Add this to your frontend React component

import { useEffect } from 'react';
import axios from './api/axios';

// Hook to track service access when component loads
export const useServiceAccessTracking = (serviceName, path) => {
  useEffect(() => {
    const trackServiceAccess = async () => {
      try {
        await axios.post('/api/track-service-access', {
          service: serviceName,
          path: path
        });
        console.log(`✅ Service access tracked: ${serviceName}`);
      } catch (error) {
        console.error(`❌ Failed to track service access: ${serviceName}`, error);
      }
    };

    if (serviceName && path) {
      trackServiceAccess();
    }
  }, [serviceName, path]);
};

// Component to handle service page loads
export const ServicePageTracker = ({ children, serviceName, path }) => {
  useServiceAccessTracking(serviceName, path);
  
  return <>{children}</>;
};

// Example usage in your service page component:
/*
import { ServicePageTracker } from './serviceTracking';

const WorklinkPage = () => {
  const serviceName = 'worklink';
  const path = window.location.pathname; // e.g., '/worklink-15ecz4e9'

  return (
    <ServicePageTracker serviceName={serviceName} path={path}>
      <div>
        <h1>Worklink Service</h1>
        {/* Your service page content */}
      </div>
    </ServicePageTracker>
  );
};
*/

// Alternative: Direct function call
export const trackServiceAccess = async (serviceName, path) => {
  try {
    await axios.post('/api/track-service-access', {
      service: serviceName,
      path: path
    });
    return true;
  } catch (error) {
    console.error('Service access tracking failed:', error);
    return false;
  }
};
