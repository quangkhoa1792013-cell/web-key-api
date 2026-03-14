import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TimeSelectionPage from './components/TimeSelectionPage';
import LinkSkipPage from './components/LinkSkipPage';
import KeyDisplayPage from './components/KeyDisplayPage';
import KeyDashboard from './components/KeyDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TimeSelectionPage />} />
        <Route path="/skip" element={<LinkSkipPage />} />
        <Route path="/key" element={<KeyDisplayPage />} />
        <Route path="/dashboard" element={<KeyDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
