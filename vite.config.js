import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA: след първото отваряне приложението (и вградените тегла) работят без интернет.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['lstm.svg'],
      manifest: {
        name: 'LSTM визуализация',
        short_name: 'LSTM',
        description: 'Интерактивна визуализация на рекурентни мрежи и LSTM',
        lang: 'bg',
        theme_color: '#312e81',
        background_color: '#eef2ff',
        display: 'standalone',
        icons: [{ src: 'lstm.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 1500 },
});
