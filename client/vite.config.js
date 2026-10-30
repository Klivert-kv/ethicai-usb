import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Lee el PORT del backend desde el .env de la raíz del proyecto.
  const env = loadEnv(mode, path.resolve(here, '..'), '');
  const apiPort = env.PORT || '3001';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': { target: `http://localhost:${apiPort}`, changeOrigin: false },
      },
    },
  };
});
