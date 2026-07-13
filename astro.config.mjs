import { defineConfig } from 'astro/config';

// Domínio definitivo a confirmar (placeholder).
export default defineConfig({
  site: 'https://nutrianaclara.com.br',
  trailingSlash: 'ignore',
  // Sitemap gerado à mão em src/pages/sitemap*.xml.ts: o índice separa páginas,
  // blog e cada silo semântico: organização que @astrojs/sitemap não expõe.
  // 'viewport' prefetchava TODA página linkada assim que o link entrava na tela.
  // A home linka os 6 silos, o blog, as receitas... e esse tráfego competia com o
  // LCP no 4G lento (LCP oscilando entre 3,6s e 4,6s). Com 'hover', o prefetch só
  // dispara na intenção de clique (hover no desktop, touchstart no mobile): a
  // navegação continua instantânea, mas sem roubar banda do primeiro carregamento.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // 'always': o CSS total do site é pequeno (~10 KiB) e as duas folhas separadas
  // bloqueavam a renderização por ~1s no 4G lento. Inline elimina o round-trip
  // do caminho crítico e antecipa a descoberta das fontes declaradas no CSS.
  build: { inlineStylesheets: 'always' },
});
