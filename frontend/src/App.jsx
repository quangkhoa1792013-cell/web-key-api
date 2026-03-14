import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LinkSkipPage from './components/LinkSkipPage';
import KeyDisplayPage from './components/KeyDisplayPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LinkSkipPage />} />
        <Route path="/skip" element={<LinkSkipPage />} />
        <Route path="/key" element={<KeyDisplayPage />} />
      </Routes>
    </Router>
  );
}

export default App;
