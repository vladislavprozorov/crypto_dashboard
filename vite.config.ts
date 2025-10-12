import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // <--- Важно! указываем базовый путь для GitHub Pages
  base: '/crypto_dashboard/',

  plugins: [react()],

  server: {
    proxy: {
      // Прокси для API (локально)
      '/api': {
        target: 'https://api.coingecko.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api/v3'),
      },
    },
  },

  build: {
    // Чтобы пути внутри CSS/JS были корректные
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
