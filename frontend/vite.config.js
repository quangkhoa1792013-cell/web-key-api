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
          // Bắt HWID từ Header mà Frontend gửi lên
          const hwid = req.headers['x-hwid'] || 'No-HWID';
          const ip = req.socket.remoteAddress;

          // Log ra Terminal một cách gọn gàng
          if (req.url.includes('/api')) {
             console.log(`\x1b[36m[${time}]\x1b[0m \x1b[32m${req.method}\x1b[0m ${req.url} | \x1b[33mIP: ${ip}\x1b[0m | \x1b[35mHWID: ${hwid}\x1b[0m`);
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
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        // Keep /api prefix as backend routes include it
      }
    }
  }
})
