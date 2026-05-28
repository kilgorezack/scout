import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // SCOUT_BUILD=1 produces a static build for hosting under /signal/ inside Scout.
  const scoutBuild = env.SCOUT_BUILD === '1';

  return {
    plugins: [react()],
    base: scoutBuild ? '/signal/' : '/',
    build: {
      outDir: scoutBuild ? 'dist-scout' : 'dist',
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
