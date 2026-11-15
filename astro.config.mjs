import { defineConfig } from 'astro/config';
import { lerPaginas, agendadas } from './scripts/fila-publicacao.mjs';

// Integração: links para página ainda não publicada viram texto no HTML final.
//
// Uma página agendada (datePublished no futuro) já existe em src/content/posts, então outra
// página pode linkar para ela antes da data (ex.: a Região Sul lista Jardim Goiás e Setor Bueno).
// Como a rota só é gerada quando a data chega, o link seria 404 até lá. Depois do build, este
// passo procura todo <a> que aponta para uma página agendada sem HTML em dist e troca o link
// pelo texto da âncora. No build do dia da publicação a página existe e o link volta sozinho.
// Mesmo mecanismo da Ahara (ahara-links-agendados).
function linksAgendados() {
  return {
    name: 'ana-links-agendados',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const { readdirSync, readFileSync, writeFileSync, existsSync, statSync } = await import('node:fs');
        const { join } = await import('node:path');
        const { fileURLToPath } = await import('node:url');
        const raiz = fileURLToPath(dir);
        const fora = agendadas(lerPaginas())
          .map((p) => p.path.replace(/^\/|\/$/g, ''))
          .filter((p) => !existsSync(join(raiz, p, 'index.html')));
        if (!fora.length) {
          logger.info('nenhuma página agendada fora do build: nada a trocar');
          return;
        }
        const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(
          `<a\\b[^>]*\\bhref="(?:https?://(?:www\\.)?nutrianaclara\\.com\\.br)?/(?:${fora.map(esc).join('|')})/?(?:[#?][^"]*)?"[^>]*>([\\s\\S]*?)</a>`,
          'g',
        );
        const htmls = [];
        const andar = (d) => {
          for (const nome of readdirSync(d)) {
            const p = join(d, nome);
            if (statSync(p).isDirectory()) andar(p);
            else if (nome.endsWith('.html')) htmls.push(p);
          }
        };
        andar(raiz);
        let total = 0;
        for (const arq of htmls) {
          const html = readFileSync(arq, 'utf-8');
          let trocas = 0;
          const novo = html.replace(re, (_, texto) => {
            trocas++;
            return texto;
          });
          if (trocas) {
            writeFileSync(arq, novo, 'utf-8');
            total += trocas;
          }
        }
        logger.info(`${total} link(s) para ${fora.length} página(s) agendada(s) viraram texto`);
      },
    },
  };
}

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
  integrations: [linksAgendados()],
});
