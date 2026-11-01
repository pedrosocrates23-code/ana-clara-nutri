// Pipeline de imagens do site (redesign nov/2026).
//
// Entrada: PNG/JPG originais em ../imagens-fonte/png (fora do repo: geradas pelo
// Codex CLI, o banner da home ampliado 2x no Magnific). Saída: WebP em várias
// larguras em public/img/ + manifesto src/data/images.json, que o componente
// Picture.astro usa para montar srcset/sizes com width/height reais (CLS zero).
//
// Os posts também ganham public/blog/<slug>.webp na largura máxima: é o caminho
// do campo `image` do frontmatter e da og:image.
//
// Uso: node scripts/build-images.mjs [nome ...]   (sem nomes = todas)
import sharp from 'sharp';
import { readdirSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, parse } from 'node:path';

const SRC = '../imagens-fonte/png';
const OUT = 'public/img';
const BLOG = 'public/blog';
const MANIFEST = 'src/data/images.json';

// Larguras por família. O hero cobre telas 4K/retina; capas vão até 1536 (a coluna
// do artigo tem ~1180px, x1.3 de densidade média).
const LARGURAS = {
  hero: [828, 1280, 1920, 2560, 3200],
  padrao: [480, 768, 1080, 1536],
};
// q 80 + effort 6: ponto em que o WebP para de mostrar bloco em degradê de fundo liso
// (paredes verdes, linho) sem inchar o arquivo.
const WEBP = { quality: 80, effort: 6, smartSubsample: true };

const posts = new Set(readdirSync('src/content/posts').map((f) => parse(f).name));
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const filtro = new Set(process.argv.slice(2));

mkdirSync(OUT, { recursive: true });
mkdirSync(BLOG, { recursive: true });
mkdirSync('src/data', { recursive: true });

const fontes = readdirSync(SRC).filter((f) => /\.(png|jpe?g)$/i.test(f));
// hero-home-upscaled.jpg (Magnific) substitui hero-home.png quando existir
const nomes = new Map();
for (const f of fontes) {
  let nome = parse(f).name;
  if (nome === 'hero-home-upscaled') nome = 'hero-home';
  else if (nome === 'hero-home' && fontes.includes('hero-home-upscaled.jpg')) continue;
  nomes.set(nome, join(SRC, f));
}

let total = 0;
for (const [nome, arquivo] of nomes) {
  if (filtro.size && !filtro.has(nome)) continue;
  const img = sharp(arquivo);
  const { width: w0, height: h0 } = await img.metadata();
  const familia = nome === 'hero-home' ? LARGURAS.hero : LARGURAS.padrao;
  const larguras = familia.filter((w) => w <= w0);
  if (!larguras.includes(Math.min(w0, familia.at(-1)))) larguras.push(Math.min(w0, familia.at(-1)));
  const saidas = [];
  for (const w of [...new Set(larguras)].sort((a, b) => a - b)) {
    const dest = join(OUT, `${nome}-${w}.webp`);
    const info = await sharp(arquivo).resize({ width: w }).webp(WEBP).toFile(dest);
    saidas.push({ w, kb: Math.round(info.size / 1024) });
    total += info.size;
  }
  const maior = saidas.at(-1).w;
  if (posts.has(nome)) {
    await sharp(arquivo).resize({ width: maior }).webp(WEBP).toFile(join(BLOG, `${nome}.webp`));
  }
  manifest[nome] = { width: maior, height: Math.round((h0 * maior) / w0), widths: saidas.map((s) => s.w) };
  console.log(`${nome}: ${w0}x${h0} -> ${saidas.map((s) => `${s.w}w ${s.kb}KB`).join(', ')}`);
}

// Recorte vertical do banner para celular: em tela retrato, a panorâmica com object-fit
// cover seria ampliada ~2x (e o celular baixaria a versão de 3200px). O recorte 3:4 em
// torno da comida mantém a nitidez com uma fração do peso.
if ((!filtro.size || filtro.has('hero-home')) && nomes.has('hero-home')) {
  const src = nomes.get('hero-home');
  const { width: W, height: H } = await sharp(src).metadata();
  const cw = Math.round(H * 0.75);
  const left = Math.min(W - cw, Math.round(W * 0.585));
  const base = await sharp(src).extract({ left, top: 0, width: cw, height: H }).toBuffer();
  const ws = [640, 960, Math.min(cw, 1240)];
  for (const w of ws) await sharp(base).resize({ width: w }).webp(WEBP).toFile(join(OUT, `hero-home-mobile-${w}.webp`));
  manifest['hero-home-mobile'] = { width: ws.at(-1), height: Math.round((H * ws.at(-1)) / cw), widths: ws };
  console.log(`hero-home-mobile: recorte ${cw}x${H} a partir de x=${left}`);
}

const ordenado = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(MANIFEST, JSON.stringify(ordenado, null, 2) + '\n');
console.log(`\n${Object.keys(ordenado).length} imagens no manifesto, ${(total / 1048576).toFixed(1)} MB gerados nesta rodada.`);
