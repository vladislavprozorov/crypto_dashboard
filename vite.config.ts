import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/crypto_dashboard/',
  plugins: [react()],
  server: {
    proxy: {
      // все запросы к /api/* будут проксироваться на CoinGecko
      '/api': {
        target: 'https://api.coingecko.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api/v3'), // /api/coins -> /api/v3/coins
      },
    },
  },
});
