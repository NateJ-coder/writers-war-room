import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // If a local config.json exists, prefer that for the GEMINI key (useful for local dev)
    let fileConfig: Record<string, string> = {};
    try {
        const cfgPath = path.resolve(__dirname, 'config.json');
        if (fs.existsSync(cfgPath)) {
            const raw = fs.readFileSync(cfgPath, 'utf-8');
            fileConfig = JSON.parse(raw || '{}');
        }
    } catch (e) {
        // ignore parse/read errors and fall back to env
        console.warn('Could not read chatbot/config.json, falling back to environment variables');
    }

    const geminiKey = fileConfig.GEMINI_API_KEY || env.GEMINI_API_KEY || '';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
