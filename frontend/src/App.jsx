import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import ServiceSelectionPage from './components/ServiceSelectionPage';
import ServicePage from './pages/ServicePage';
import LinkSkipPage from './components/LinkSkipPage';
import KeyDisplayPage from './components/KeyDisplayPage';
import KeyDashboard from './components/KeyDashboard';
import ExpiredPage from './components/ExpiredPage';
import AntiCheatProvider from './components/AntiCheatProvider';

function App() {
  const [userSession, setUserSession] = useState(null);
  
  return (
    <Router>
      <AntiCheatProvider>
        <Routes>
          {/* Main page - Service selection */}
          <Route path="/" element={<ServiceSelectionPage setUserSession={setUserSession} />} />
          
          {/* Service pages */}
          <Route path="/:serviceId" element={<ServicePage setUserSession={setUserSession} />} />
          <Route path="/:serviceId/get-key&:time" element={<LinkSkipPage />} />
          
          {/* Key display page with clean URL */}
          <Route path="/:serviceId/key-:id" element={<KeyDisplayPage />} />
          <Route path="/key" element={<KeyDisplayPage />} />

          {/* URL "Đóng đinh" - Khi Admin gửi link này cho người khác */}
          <Route path="/s/:id" element={<KeyDisplayPage />} />
          
          {/* Dashboard and expired page */}
          <Route path="/dashboard" element={<KeyDashboard />} />
          <Route path="/expired" element={<ExpiredPage />} />
          
          {/* 404 redirect to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AntiCheatProvider>
    </Router>
  );
}

export default App;
