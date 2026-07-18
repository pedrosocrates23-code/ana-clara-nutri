import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const faq = z.array(z.object({ q: z.string(), a: z.string() })).default([]);

// Referências: fontes externas de onde a informação do artigo foi retirada.
// Renderizadas em H2 próprio DEPOIS do FAQ (ver ArticlePage.astro).
// Regra: só entra fonte realmente consultada. Não é bibliografia decorativa.
const references = z
 .array(
 z.object({
 label: z.string(), // como a fonte é nomeada no texto
 detail: z.string().optional(), // norma/estudo/veículo + ano
 url: z.string().optional(), // link direto, quando público
 }),
 )
 .default([]);

// Silos temáticos (hubs), body em markdown, meta/hero/faq no frontmatter
const silos = defineCollection({
 loader: glob({ pattern: '**/*.md', base: './src/content/silos' }),
 schema: z.object({
 title: z.string(),
 metaTitle: z.string(),
 description: z.string(),
 kicker: z.string().default('Área de atuação'),
 h1: z.string(),
 sub: z.string(),
 order: z.number().default(0),
 faqs: faq,
 spokes: z.array(z.string()).default([]),
 }),
});

// Artigos (spokes), body em markdown
const posts = defineCollection({
 loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
 schema: z.object({
 title: z.string(),
 metaTitle: z.string(),
 description: z.string(),
 h1: z.string(),
 path: z.string(), // URL canônica completa
 silo: z.string(), // slug do silo OU 'blog'
 siloLabel: z.string(),
 datePublished: z.string(),
 medical: z.boolean().default(false),
 // Imagem de capa (hero + card). Caminho a partir de /public (ex: "/blog/slug.webp").
 // CFN 856/2026 art. 69 §2º: NUNCA imagem de resultado, antes/depois, composição
 // corporal, balança, fita métrica ou gráfico de evolução. Só editorial/conceitual.
 image: z.string().optional(),
 imageAlt: z.string().optional(),
 faqs: faq,
 references,
 }),
});

export const collections = { silos, posts };
