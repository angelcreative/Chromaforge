import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true,
            secure: false,
            timeout: 10000,
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, res) => {
                console.error('[Vite Proxy] ❌ Error connecting to backend server on port 8080');
                console.error('[Vite Proxy] Make sure you run: npm run dev:full (or npm run dev:server in another terminal)');
                if (res && !res.headersSent) {
                  res.writeHead(500, {
                    'Content-Type': 'application/json',
                  });
                  res.end(JSON.stringify({
                    code: '',
                    description: 'Backend server is not running. Please start it with: npm run dev:full'
                  }));
                }
              });
            },
          }
        }
      },
      plugins: [react()],
      // API keys are handled server-side only, not exposed to frontend
      define: {},
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
