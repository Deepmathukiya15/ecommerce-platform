import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true, // accept tunneled/preview hostnames (Vercel previews, e2b popup, ngrok…)
    proxy: {
      // In development the browser talks only to this origin;
      // Vite forwards /api/* to the Express backend. No CORS issues, no localhost in browser code.
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173, // same port as dev so preview links keep working
    allowedHosts: true,
    proxy: {
      // `vite preview` needs its own proxy config (server.proxy is dev-only)
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
