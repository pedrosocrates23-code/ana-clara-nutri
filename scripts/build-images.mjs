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
  // Retrato real da Ana, ampliado 4x no Magnific Precision (fiel ao original, sem inventar
  // traço). 160 = avatar do AuthorBox; 3416 = master 4K, só baixado se algum layout pedir.
  retrato: [160, 320, 480, 768, 1080, 1536, 2160, 3416],
  // 560/640 = foto do topo no celular de densidade ~1,75 (o perfil do PageSpeed); celulares de
  // densidade 2,6-3 pedem 1080+ pelo mesmo `sizes`.
  padrao: [480, 560, 640, 768, 1080, 1536],
};
// q 80 + effort 6: ponto em que o WebP para de mostrar bloco em degradê de fundo liso
// (paredes verdes, linho) sem inchar o arquivo.
const WEBP = { quality: 80, effort: 6, smartSubsample: true };
// Larguras de celular (<= 768) saem em q74: com densidade de tela 1,75-3x a diferença não se vê,
// e o arquivo cai ~23%, o que encurta o LCP no 4G (PageSpeed 100 no celular, 01/11/2026).
const webp = (w, q) => ({ ...WEBP, quality: q ?? (w <= 640 ? 68 : w <= 768 ? 74 : 80) });
// Fotos muito texturizadas (a compressão some na textura) que são LCP no celular: qualidade
// própria nas larguras de celular.
const Q_CELULAR = { 'pg-receitas': 60 };
// Teto por largura (KB): 560 é a que o celular do PageSpeed baixa para capa/topo; 640 a seguinte.
const TETO_CELULAR = { 560: 38 * 1024, 640: 45 * 1024 };

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
  // Versões ampliadas (Magnific) substituem o original de mesmo nome quando existirem.
  if (nome === 'hero-home-upscaled') nome = 'hero-home';
  else if (nome === 'hero-home' && fontes.includes('hero-home-upscaled.jpg')) continue;
  if (nome === 'ana-clara-retrato-4k') nome = 'ana-clara-retrato';
  else if (nome === 'ana-clara-retrato' && fontes.includes('ana-clara-retrato-4k.jpg')) continue;
  nomes.set(nome, join(SRC, f));
}

let total = 0;
for (const [nome, arquivo] of nomes) {
  if (filtro.size && !filtro.has(nome)) continue;
  const img = sharp(arquivo);
  const { width: w0, height: h0 } = await img.metadata();
  const familia = nome === 'hero-home' ? LARGURAS.hero : nome === 'ana-clara-retrato' ? LARGURAS.retrato : LARGURAS.padrao;
  const larguras = familia.filter((w) => w <= w0);
  if (!larguras.includes(Math.min(w0, familia.at(-1)))) larguras.push(Math.min(w0, familia.at(-1)));
  const saidas = [];
  for (const w of [...new Set(larguras)].sort((a, b) => a - b)) {
    const dest = join(OUT, `${nome}-${w}.webp`);
    let info;
    if (TETO_CELULAR[w]) {
      // Larguras que o celular do PageSpeed baixa como LCP: teto de 45 KB. Foto texturizada desce
      // a qualidade até caber (mínimo q56); a textura esconde a compressão.
      const q0 = Q_CELULAR[nome] ?? webp(w).quality;
      for (const q of [q0, 62, 58, 56].filter((q, i) => i === 0 || q < q0)) {
        const buf = await sharp(arquivo).resize({ width: w }).webp(webp(w, q)).toBuffer();
        info = { size: buf.length };
        if (buf.length <= TETO_CELULAR[w] || q === 56) { writeFileSync(dest, buf); break; }
      }
    } else {
      info = await sharp(arquivo).resize({ width: w }).webp(webp(w, w <= 640 ? Q_CELULAR[nome] : undefined)).toFile(dest);
    }
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

// Recorte do banner para celular: em tela retrato, a panorâmica com object-fit cover seria
// ampliada ~2x (e o celular baixaria a versão de 3200px). No celular a foto ocupa só o topo
// do hero (o texto fica sobre o verde da parede, ver Hero.astro), então o recorte é QUADRADO
// em torno da comida: nenhum pixel gasto em área que o degradê cobriria.
if ((!filtro.size || filtro.has('hero-home')) && nomes.has('hero-home')) {
  const src = nomes.get('hero-home');
  const { width: W, height: H } = await sharp(src).metadata();
  const cw = H;
  const left = W - cw;
  const base = await sharp(src).extract({ left, top: 0, width: cw, height: H }).toBuffer();
  const ws = [560, 960, Math.min(cw, 1240)];
  for (const w of ws) await sharp(base).resize({ width: w }).webp(webp(w, 56)).toFile(join(OUT, `hero-home-mobile-${w}.webp`));
  manifest['hero-home-mobile'] = { width: ws.at(-1), height: Math.round((H * ws.at(-1)) / cw), widths: ws };
  console.log(`hero-home-mobile: recorte ${cw}x${H} a partir de x=${left}`);
}

const ordenado = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(MANIFEST, JSON.stringify(ordenado, null, 2) + '\n');
console.log(`\n${Object.keys(ordenado).length} imagens no manifesto, ${(total / 1048576).toFixed(1)} MB gerados nesta rodada.`);
