import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ServiceTracker from './components/ServiceTracker';

// Your existing components
import Home from './pages/Home';
import Lootlab from './pages/Lootlab';
import Pandas from './pages/Pandas';
import Worklink from './pages/Worklink';

function App() {
  return (
    <Router>
      <Routes>
        {/* Existing routes */}
        <Route path="/" element={<Home />} />
        <Route path="/lootlab" element={<Lootlab />} />
        <Route path="/pandas" element={<Pandas />} />
        <Route path="/worklink" element={<Worklink />} />
        
        {/* Dynamic service routes - THIS WILL TRACK ACCESS */}
        <Route path="/:servicePath" element={<ServiceTracker />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
