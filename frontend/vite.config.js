import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-debug-logger',
      configureServer(server) {
        server.middlewares.use('/api', (req, res, next) => {
          const timestamp = new Date().toISOString();
          console.log(`[Vite] ${timestamp} - ${req.method} ${req.url}`);
          console.log(`[Vite] Headers:`, req.headers);
          console.log(`[Vite] Query:`, req.url.split('?')[1] || 'none');
          
          // Log response
          const originalWrite = res.write;
          res.write = function(data, encoding) {
            console.log(`[Vite] Response:`, data.toString());
            return originalWrite.call(res, data, encoding);
          };
          
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
        // Keep /api prefix as backend routes include it
      }
    }
  }
})
