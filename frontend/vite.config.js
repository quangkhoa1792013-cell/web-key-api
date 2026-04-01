/**
 * @file: vite.config.js
 * @path: roblox/frontend/vite.config.js
 * @purpose: Cấu hình Vite build tool cho frontend React application
 * @functionality: Plugin React, API debug logger, middleware cho HWID và IP tracking
 * @connections: Kết nối đến development server, log API requests với HWID headers
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-debug-logger',
      configureServer(server) {
        server.middlewares.use('/api', (req, res, next) => {
          const time = new Date().toLocaleTimeString();
          // Bắt HWID từ Header mà Frontend gửi lên - VIẾT HOA
          const hwid = req.headers['X-HWID'] || req.headers['x-hwid'] || 'No-HWID';
          const ip = req.socket.remoteAddress;

          // Log ra Terminal một cách gọn gàng
          if (req.url.includes('/api')) {
             console.log(`\x1b[36m[${time}]\x1b[0m \x1b[32m${req.method}\x1b[0m ${req.url} | \x1b[33mIP: ${ip}\x1b[0m | \x1b[35mHWID: ${hwid}\x1b[0m | \x1b[31mPORT: 7860\x1b[0m`);
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        // Keep /api prefix as backend routes include it
      }
    }
  }
})
