import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server proxies /api requests to the Express backend (port 3001)
// so the browser never talks to Yahoo directly (which CORS would block).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
