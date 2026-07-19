// Busca uma foto editorial/conceitual no Pexels para cada post sem `image` no
// frontmatter, baixa em src.large, converte para webp (via sharp, já é dep do
// projeto) e grava em public/blog/<slug>.webp. Atualiza o frontmatter do .md
// com `image` + `imageAlt`.
//
// CFN 856/2026 art. 69 §2º: a foto NUNCA pode ser de resultado, antes/depois,
// composição corporal, balança ou fita métrica — por isso a query de cada
// post é escolhida manualmente (não é extraída automaticamente do título) e
// é conceitual: comida, mesa, consulta, conversa. Nunca "weight loss",
// "scale", "before after", "body measurement".
//
// Uso: PEXELS_API_KEY=... node scripts/fetch-pexels-images.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const POSTS_DIR = join(ROOT, 'src/content/posts');
const PUBLIC_BLOG_DIR = join(ROOT, 'public/blog');

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
  console.error('Defina PEXELS_API_KEY no ambiente (ou no .env + dotenv) antes de rodar.');
  process.exit(1);
}

// slug (nome do arquivo .md) -> { query, alt }
// query em inglês (o Pexels indexa melhor); alt em pt-BR para o site.
const PLANO = {
  'como-comecar-uma-reeducacao-alimentar': {
    query: 'healthy food flat lay wooden table',
    alt: 'Mesa com alimentos variados e saudáveis, organizados de forma editorial',
  },
  'como-saber-se-nutricionista-e-bom': {
    query: 'nutritionist consultation talking client',
    alt: 'Nutricionista conversando com paciente durante consulta',
  },
  'compulsao-alimentar-como-parar': {
    query: 'woman relaxing kitchen calm morning',
    alt: 'Mulher em momento calmo na cozinha, sem julgamento sobre comida',
  },
  'diferenca-entre-nutricionista-e-nutrologo': {
    query: 'doctor office consultation desk',
    alt: 'Consultório médico com mesa de atendimento',
  },
  'nutricionista-online-vale-a-pena': {
    query: 'video call laptop consultation home',
    alt: 'Pessoa em videochamada de consulta pelo laptop, em casa',
  },
  'nutricionista-sem-dieta-restritiva': {
    query: 'colorful vegetables fruits table variety',
    alt: 'Variedade de frutas e vegetais coloridos sobre a mesa',
  },
  'por-que-nao-consigo-seguir-a-dieta': {
    query: 'healthy breakfast table natural light',
    alt: 'Café da manhã saudável servido em mesa com luz natural',
  },
  'psicologo-ou-nutricionista-ansiedade': {
    query: 'person drinking tea relaxing calm',
    alt: 'Pessoa tomando chá em momento tranquilo',
  },
  'vale-a-pena-pagar-nutricionista-emagrecer': {
    query: 'nutritionist healthy meal consultation table',
    alt: 'Nutricionista apresentando refeição saudável durante consulta',
  },
};

async function buscarFoto(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: API_KEY } });
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (!data.photos?.length) throw new Error(`Nenhuma foto encontrada para "${query}"`);
  return data.photos[0];
}

async function baixarEConverter(imageUrl, destPath) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Download falhou (${res.status}): ${imageUrl}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await sharp(buffer).webp({ quality: 82 }).toFile(destPath);
}

function jaTemImagem(frontmatter) {
  return /^image:/m.test(frontmatter);
}

function inserirCampos(conteudo, imagePath, alt) {
  return conteudo.replace(
    /^(medical:\s*\w+)\s*$/m,
    `$1\nimage: "${imagePath}"\nimageAlt: "${alt}"`,
  );
}

mkdirSync(PUBLIC_BLOG_DIR, { recursive: true });

let ok = 0;
let pulados = [];

for (const [slug, { query, alt }] of Object.entries(PLANO)) {
  const mdPath = join(POSTS_DIR, `${slug}.md`);
  let raw;
  try {
    raw = readFileSync(mdPath, 'utf8');
  } catch {
    console.warn(`PULADO  ${slug}: arquivo .md não encontrado`);
    pulados.push({ slug, motivo: 'arquivo .md não encontrado' });
    continue;
  }

  if (jaTemImagem(raw)) {
    console.log(`JÁ TEM  ${slug}: image já presente no frontmatter, não sobrescrevi`);
    continue;
  }

  try {
    const foto = await buscarFoto(query);
    const destPath = join(PUBLIC_BLOG_DIR, `${slug}.webp`);
    await baixarEConverter(foto.src.large, destPath);

    const novoConteudo = inserirCampos(raw, `/blog/${slug}.webp`, alt);
    writeFileSync(mdPath, novoConteudo, 'utf8');

    console.log(`OK      ${slug} <- foto de ${foto.photographer} (${foto.url})`);
    ok++;
  } catch (err) {
    console.error(`ERRO    ${slug}: ${err.message}`);
    pulados.push({ slug, motivo: err.message });
  }
}

console.log(`\n${ok} imagem(ns) baixada(s) e aplicada(s).`);
if (pulados.length) {
  console.log(`${pulados.length} pulado(s):`);
  for (const p of pulados) console.log(`  - ${p.slug}: ${p.motivo}`);
}
