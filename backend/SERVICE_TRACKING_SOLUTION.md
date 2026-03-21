# Frontend Service Access Tracking - SOLUTION
# ================================================

## PROBLEM ANALYSIS:
# Frontend route: https://.../worklink-15ecz4e9 doesn't trigger backend logs
# Root cause: Frontend is running on different port/domain, not hitting backend

## SOLUTION 1: Direct Backend Access (Recommended)
# ====================================================

# User should access: http://127.0.0.1:7860/worklink-15ecz4e9
# Instead of: http://localhost:5173/worklink-15ecz4e9

# This will trigger the backend endpoint:
@app.route('/<path:service_path>', methods=['GET'])
def handle_service_redirect(service_path):
    # This will log: [RECON] | ACTION: SERVICE_ACCESS

## SOLUTION 2: Frontend API Call (Alternative)
# ===============================================

# Add this to your React component when it loads:

import { useEffect } from 'react';
import axios from './api/axios';

const ServicePage = ({ serviceName, path }) => {
  useEffect(() => {
    // Track service access when component mounts
    const trackAccess = async () => {
      try {
        await axios.post('/api/track-service-access', {
          service: serviceName,
          path: path
        });
        console.log('✅ Service access tracked');
      } catch (error) {
        console.error('❌ Failed to track service access:', error);
      }
    };

    if (serviceName && path) {
      trackAccess();
    }
  }, [serviceName, path]);

  return (
    <div>
      <h1>{serviceName} Service</h1>
      {/* Your service content */}
    </div>
  );
};

# Usage:
<ServicePage 
  serviceName="worklink" 
  path="/worklink-15ecz4e9" 
/>

## SOLUTION 3: URL Configuration
# =================================

# Update your frontend routing to call backend:

# In your React Router setup:
<Route path="/:servicePath" element={<ServiceRedirect />} />

const ServiceRedirect = () => {
  const { servicePath } = useParams();
  
  useEffect(() => {
    // Option A: Redirect to backend
    window.location.href = `http://127.0.0.1:7860/${servicePath}`;
    
    // Option B: Track via API
    trackServiceAccess(servicePath.split('-')[0], `/${servicePath}`);
  }, [servicePath]);

  return <div>Redirecting to service...</div>;
};

## TESTING:
# ==========

# Test 1: Direct backend access
curl -H "X-HWID: HWID_TEST_123" http://127.0.0.1:7860/worklink-15ecz4e9

# Test 2: API call
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-HWID: HWID_TEST_123" \
  -d '{"service": "worklink", "path": "/worklink-15ecz4e9"}' \
  http://127.0.0.1:7860/api/track-service-access

## EXPECTED LOGS:
# ===============

# When accessing backend directly:
[2026-03-21 14:00:00] RECON: [RECON] | IP: 192.168.1.100 | HWID: HWID_TEST_123 | ACTION: SERVICE_ACCESS | SERVICE: worklink | URL: DIRECT_ACCESS | PATH: /worklink-15ecz4e9

# When calling tracking API:
[2026-03-21 14:00:01] RECON: [RECON] | IP: 192.168.1.100 | HWID: HWID_TEST_123 | ACTION: FRONTEND_LOADED | SERVICE: worklink | URL: http://localhost:5173 | PATH: /worklink-15ecz4e9

## RECOMMENDATION:
# ==============

# Use Solution 1 (Direct Backend Access) for simplicity:
# 1. Update your links to point to backend: http://127.0.0.1:7860/worklink-15ecz4e9
# 2. Backend will handle logging and redirect to frontend
# 3. Frontend will receive session info via URL parameters

# OR use Solution 2 (Frontend API Call) for flexibility:
# 1. Keep frontend routing as-is
# 2. Add tracking API call to service components
# 3. Backend logs when frontend loads
