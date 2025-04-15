
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: ['19b275d6-a903-4b36-8e54-c03a019de501-00-1fgzihqqvox9t.janeway.replit.dev']
  }
});
