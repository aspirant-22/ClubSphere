/**
 * @FILE: vite.config.js
 * @RESPONSIBILITY: Vite build configuration and local development proxy routing API and WebSocket requests to port 5000.
 * @DEPENDENCIES: @vitejs/plugin-react, vite.
 * @MODIFICATION_HOTSPOT: server.proxy definition.
 * @AUTHOR: Garima Mittal
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true
      }
    }
  }
});
