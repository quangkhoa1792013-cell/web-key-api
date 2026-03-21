import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

// Import existing components
import Home from './pages/Home';
import ServicePage from './pages/ServicePage';
import LinkProcess from './pages/LinkProcess';
import KeyResult from './pages/KeyResult';

// Import API
import axios from './api/axios';

function App() {
  const [userSession, setUserSession] = useState(null);

  // Function to create new key
  const handleCreateNewKey = async () => {
    try {
      // Delete current session
      if (userSession?.sessionId) {
        await axios.delete('/api/delete-session', {
          data: {
            sessionId: userSession.sessionId,
            hwid: userSession.hwid
          }
        });
      }
      
      // Clear session and redirect to home
      setUserSession(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to create new key:', error);
      // Still redirect to home on error
      window.location.href = '/';
    }
  };

  return (
    <Router>
      <Routes>
        {/* Trang chủ */}
        <Route 
          path="/" 
          element={<Home setUserSession={setUserSession} />} 
        />
        
        {/* Trang chọn dịch vụ và thời gian */}
        <Route 
          path="/:service_name" 
          element={<ServicePage setUserSession={setUserSession} />} 
        />
        
        {/* Trang vượt link */}
        <Route 
          path="/:service_name/get-key&:duration" 
          element={
            <LinkProcess 
              setUserSession={setUserSession} 
              onCreateNewKey={handleCreateNewKey}
            />
          } 
        />
        
        {/* Trang kết quả key */}
        <Route 
          path="/:service_name/key-:key_id" 
          element={
            <KeyResult 
              userSession={userSession}
              setUserSession={setUserSession}
              onCreateNewKey={handleCreateNewKey}
            />
          } 
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
