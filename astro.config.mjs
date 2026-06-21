import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');
// https://astro.build/config
export default defineConfig({
  site: 'https://pientkrz.github.io',
  base: '/real-estate-vendor/',
  integrations: [react()],
  output: env.ASTRO_OUTPUT === 'server' ? 'server' : 'static',
  // Adapter is only active in server mode; ignored for static builds.
  adapter: node({ mode: 'standalone' }),
});
