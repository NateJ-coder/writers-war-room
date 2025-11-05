import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Do NOT inject server API keys into client bundles.
      // If you need to configure a proxy URL for the client at build time,
      // set an env var named VITE_PROXY_URL and reference it in client code
      // via import.meta.env.VITE_PROXY_URL. Example: VITE_PROXY_URL="https://.../api-proxy"
      // Keeping `define` empty prevents accidental leakage of secrets.
      define: {},
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
