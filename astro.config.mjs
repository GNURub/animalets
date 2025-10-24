// @ts-check
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'server', // SSR habilitado

  integrations: [preact()],

  vite: {
    plugins: [tailwindcss()],
  },
});
