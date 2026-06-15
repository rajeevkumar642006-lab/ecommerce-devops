import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * vite.config.js
 *
 * - React plugin enables JSX transform and Fast Refresh in dev.
 * - The /api proxy rewrites requests to the backend during development
 *   so the frontend never needs to know the backend URL at build time.
 *   In production, Nginx handles the same routing.
 */
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target:      'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir:    'dist',
    sourcemap: false,
  },
});
