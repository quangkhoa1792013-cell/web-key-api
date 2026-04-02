/**
 * @file: main.jsx
 * @path: roblox/frontend/src/main.jsx
 * @purpose: Entry point chính cho React application
 * @functionality: Render App component, import styles, production console cleanup, Service Worker
 * @connections: Mount App.jsx vào #root DOM element, load styles/index.css và index.css
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import './styles/index.css';

// Import các styles cần thiết
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
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// Service Worker registration (nếu cần)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
