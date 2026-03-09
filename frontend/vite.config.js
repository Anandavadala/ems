import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: Object.fromEntries(
      ['/auth', '/employees', '/roles', '/attendance', '/leave', '/payroll',
       '/performance', '/recruitment', '/exit', '/departments', '/health'].map(route => [
        route,
        {
          target: 'http://localhost:5000',
          changeOrigin: true,
          bypass(req) {
            // Let browser navigation (HTML requests) fall through to the SPA
            if (req.headers.accept?.includes('text/html')) return '/index.html';
          },
        },
      ])
    ),
  }
})
