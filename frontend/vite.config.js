import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import picocolors from 'picocolors'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-debug-logger',
      configureServer(server) {
        server.middlewares.use('/api', (req, res, next) => {
          const timestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });
          const method = req.method;
          const url = req.url;
          const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || 'unknown';
          const hwid = req.headers['x-hwid'] || req.headers['x-user-id'] || 'none';
          
          // Extract path without query
          const path = url.split('?')[0];
          
          // Color coding
          let colorMethod = picocolors.green; // Success
          let colorPath = picocolors.blue;
          let colorHwid = picocolors.yellow;
          let colorStatus = picocolors.green;
          
          // Parse response status (will be updated in response interceptor)
          let statusCode = '---';
          
          console.log(
            `[${picocolors.gray(timestamp)}] ${colorMethod(method)} ${colorPath(path)} | ${colorHwid('HWID:')}${picocolors.white(hwid)} | ${colorStatus('Status:')}${picocolors.white(statusCode)}`
          );
          
          // Store request info for response logging
          req.requestInfo = { timestamp, method, path, hwid, ip };
          
          // Intercept response to get status code
          const originalWrite = res.write;
          const originalEnd = res.end;
          
          res.write = function(data, encoding) {
            try {
              const responseStr = data.toString();
              if (responseStr.includes('"success":true') || responseStr.includes('"status":200')) {
                statusCode = '200';
                colorStatus = picocolors.green;
              } else if (responseStr.includes('"error"') || responseStr.includes('"status":4')) {
                statusCode = responseStr.match(/"status":(\d+)/)?.[1] || '4xx';
                colorStatus = picocolors.red;
              }
            } catch (e) {
              statusCode = '???';
              colorStatus = picocolors.red;
            }
            
            // Update log with actual status
            process.stdout.write('\r' + ' '.repeat(100) + '\r'); // Clear line
            console.log(
              `[${picocolors.gray(timestamp)}] ${colorMethod(method)} ${colorPath(path)} | ${colorHwid('HWID:')}${picocolors.white(hwid)} | ${colorStatus('Status:')}${picocolors.white(statusCode)}`
            );
            
            return originalWrite.call(res, data, encoding);
          };
          
          res.end = function(data) {
            if (data) {
              try {
                const responseStr = data.toString();
                if (responseStr.includes('"success":true') || responseStr.includes('"status":200')) {
                  statusCode = '200';
                  colorStatus = picocolors.green;
                } else if (responseStr.includes('"error"') || responseStr.includes('"status":4')) {
                  statusCode = responseStr.match(/"status":(\d+)/)?.[1] || '4xx';
                  colorStatus = picocolors.red;
                }
              } catch (e) {
                statusCode = '???';
                colorStatus = picocolors.red;
              }
            }
            
            // Final log with status
            process.stdout.write('\r' + ' '.repeat(100) + '\r'); // Clear line
            console.log(
              `[${picocolors.gray(timestamp)}] ${colorMethod(method)} ${colorPath(path)} | ${colorHwid('HWID:')}${picocolors.white(hwid)} | ${colorStatus('Status:')}${picocolors.white(statusCode)}`
            );
            
            return originalEnd.call(res, data);
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
        secure: false,
        rewrite: (path) => path,
        // Keep /api prefix as backend routes include it
      }
    }
  }
})
