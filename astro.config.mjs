import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  // Test VPS domain by default. Override with SITE_URL once the production domain is chosen.
  site: env.SITE_URL ?? 'http://test.ixtnzfseqk.cfolks.pl',
  integrations: [react()],
  output: 'server',
  adapter: node({ mode: 'standalone' }),
});
