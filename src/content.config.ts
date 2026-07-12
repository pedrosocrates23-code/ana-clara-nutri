import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const faq = z.array(z.object({ q: z.string(), a: z.string() })).default([]);

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
 faqs: faq,
 }),
});

export const collections = { silos, posts };
