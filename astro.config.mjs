import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Domínio definitivo a confirmar (placeholder).
export default defineConfig({
  site: 'https://anaclaranutri.com.br',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  build: { inlineStylesheets: 'auto' },
});
