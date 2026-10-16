// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// The canonical production origin. Override with PUBLIC_SITE_URL (for example when
// the brand or domain changes, or to point canonicals at a Netlify preview).
const site = process.env.PUBLIC_SITE_URL || 'https://dealradaronline.com';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
