// Roda o Lighthouse (mobile e desktop) e imprime a tabela de notas (adaptado do Maquininha Já).
// Pré-requisito: `npm run build` e `npx astro preview --port 4330` rodando.
//   node scripts/lighthouse.mjs [http://localhost:4330] [--so-mobile] [--filtro=/blog/] [--modelos] [--so=/,/blog]
// No Git Bash, prefixe com MSYS_NO_PATHCONV=1 (senão "/blog" vira caminho do Windows).
// --modelos: uma página de cada template (home, blog, artigo, área, atendimento, contato...).
import { execSync } from 'node:child_process';
import { readFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith('http')) ?? 'http://localhost:4330';
const soMobile = args.includes('--so-mobile');
const filtro = (args.find((a) => a.startsWith('--filtro=')) ?? '').split('=')[1] ?? '';
const raiz = fileURLToPath(new URL('..', import.meta.url));
const saida = join(raiz, 'qa', 'lighthouse');
mkdirSync(saida, { recursive: true });

const MODELOS = ['/', '/blog', '/contato', '/sobre', '/nutricionista-online/', '/nutricionista-em-goiania/', '/receitas/',
  '/nutricao-comportamental/', '/nutricao-comportamental/compulsao-alimentar-como-parar', '/blog/o-que-faz-um-nutricionista', '/politica-de-privacidade'];
const doSitemap = () => readdirSync(join(raiz, 'dist')).filter((f) => /^sitemap-.+\.xml$/.test(f))
  .flatMap((f) => [...readFileSync(join(raiz, 'dist', f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname));
const so = (args.find((a) => a.startsWith('--so=')) ?? '').slice(5).split(',').filter(Boolean);
const caminhos = so.length ? so : (args.includes('--modelos') ? MODELOS : [...new Set(doSitemap())]).filter((p) => p.includes(filtro));

const perfis = soMobile ? ['mobile'] : ['mobile', 'desktop'];
const linhas = [];
let falhas = 0;
for (const p of caminhos) {
  for (const perfil of perfis) {
    const nome = (p.replace(/\//g, '_') || '_') + `.${perfil}.json`;
    const out = join(saida, nome);
    const flags = perfil === 'desktop' ? '--preset=desktop' : '--form-factor=mobile';
    try {
      execSync(
        `npx -y lighthouse@13.5.0 "${base}${p}" --quiet ${flags} --chrome-flags="--headless=new --no-sandbox" --output=json --output-path="${out}"`,
        { stdio: 'ignore', shell: true, timeout: 180000 },
      );
      const r = JSON.parse(readFileSync(out, 'utf8'));
      const c = r.categories;
      const n = (k) => Math.round((c[k]?.score ?? 0) * 100);
      const nota = { perf: n('performance'), a11y: n('accessibility'), bp: n('best-practices'), seo: n('seo') };
      const lcp = r.audits['largest-contentful-paint'].numericValue;
      const cls = r.audits['cumulative-layout-shift'].numericValue;
      const ok = Object.values(nota).every((v) => v === 100);
      if (!ok) falhas++;
      linhas.push(`| ${p} | ${perfil} | ${nota.perf} | ${nota.a11y} | ${nota.bp} | ${nota.seo} | ${(lcp / 1000).toFixed(2)} s | ${cls.toFixed(3)} | ${ok ? 'OK' : 'REVER'} |`);
    } catch (e) {
      falhas++;
      linhas.push(`| ${p} | ${perfil} | erro | | | | | | ${String(e.message).slice(0, 60)} |`);
    }
  }
}
console.log('| Página | Perfil | Perf | Acess. | Boas práticas | SEO | LCP | CLS | Status |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const l of linhas) console.log(l);
console.log(`\n${linhas.length} medições, ${falhas} abaixo de 100 em alguma categoria.`);
process.exit(falhas ? 1 : 0);
