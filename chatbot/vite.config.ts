import path from 'path';
import { defineConfig, loadEnv, type ConfigEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }: ConfigEnv) => {
    const env = loadEnv(mode, '.', '');
    return {
      // Use a relative base so built assets work when served from a subfolder (iframe)
      base: './',
      build: {
        rollupOptions: {
          output: {
            // Ensure assets use relative paths
            entryFileNames: 'assets/[name]-[hash].js',
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash][extname]'
          }
        }
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Do NOT inject server API keys into client bundles.
      // The client will call /api/chat (or a configured VITE_PROXY_URL) on the server.
      // Set VITE_PROXY_URL in .env if you need to override the default.
      define: {},
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
