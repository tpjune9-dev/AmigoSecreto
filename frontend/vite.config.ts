import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // Soporta ruta base configurable para GitHub Pages (por defecto './' para funcionar en cualquier subruta o raíz)
  const basePath = env.VITE_BASE_PATH || './';

  return {
    plugins: [react()],
    base: basePath,
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  };
});
