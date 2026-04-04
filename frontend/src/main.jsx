/**
 * @file: main.jsx
 * @path: roblox/frontend/src/main.jsx
 * @purpose: Entry point chính cho React application
 * @functionality: Render App component, import styles, production console cleanup
 * @connections: Mount App.jsx vào #root DOM element, load styles/index.css và index.css
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';

// Import styles - Tailwind trước, rồi custom overrides
import './styles/index.css';
import './index.css';

// Remove console.log trong production
if (import.meta.env.PROD) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

// Khởi tạo ứng dụng
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
