import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API calls to backend during development — avoids CORS issues
    proxy: {
      '/api': {
        // target: 'http://localhost:8000',
        target: 'https://contextcontol.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
