import { defineConfig, loadEnv } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // When SCOUT_BUILD=1, build for hosting at /coverage/ inside the Scout
  // Next.js app — drop the Cloudflare worker bundle and prefix assets with /coverage/.
  const scoutBuild = env.SCOUT_BUILD === '1';

  return {
    plugins: scoutBuild ? [] : [cloudflare()],
    base: scoutBuild ? '/coverage/' : '/',
    define: {
      __MAPKIT_TOKEN__: JSON.stringify(env.MAPKIT_TOKEN || ''),
      __dirname: JSON.stringify('/'),
    },
    build: {
      outDir: scoutBuild ? 'dist-scout' : 'dist',
    },
  };
});
