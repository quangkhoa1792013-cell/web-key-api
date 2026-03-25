import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ServiceSelectionPage from './components/ServiceSelectionPage';
import TimeSelectionPage from './components/TimeSelectionPage';
import LinkSkipPage from './components/LinkSkipPage';
import KeyDisplayPage from './components/KeyDisplayPage';
import KeyDashboard from './components/KeyDashboard';
import ExpiredPage from './components/ExpiredPage';
import AntiCheatProvider from './components/AntiCheatProvider';

function App() {
  return (
    <Router>
      <AntiCheatProvider>
        <Routes>
          {/* Main page - Service selection */}
          <Route path="/" element={<ServiceSelectionPage />} />
          
          {/* Dynamic service-time signature routes */}
          <Route path="/:serviceId" element={<TimeSelectionPage />} />
          <Route path="/:serviceId/get-key&:time" element={<LinkSkipPage />} />
          
          {/* Key display page with clean URL */}
          <Route path="/:serviceId/key-:id" element={<KeyDisplayPage />} />
          <Route path="/key" element={<KeyDisplayPage />} />

          {/* URL "Đóng đinh" - Khi Admin gửi link này cho người khác */}
          <Route path="/s/:id" element={<KeyDisplayPage />} />
          
          {/* Dashboard and expired page */}
          <Route path="/dashboard" element={<KeyDashboard />} />
          <Route path="/expired" element={<ExpiredPage />} />
        </Routes>
      </AntiCheatProvider>
    </Router>
  );
}

export default App;
