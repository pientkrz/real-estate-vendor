import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://pientkrz.github.io',
  base: '/real-estate-vendor/',
  integrations: [react()],
  output: 'static',
});
