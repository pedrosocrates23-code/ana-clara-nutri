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

// Blocos visíveis da LP local (layout: 'lp'). Tudo que decide a conversão fica aqui,
// visível sem clique (estudo CRO, M02 e checklist CO-CK-064); o aprofundamento é o body.
const lp = z.object({
 // 'regiao' = página filha que agrupa bairros (netas) de uma região de Goiânia.
 tipo: z.enum(['cidade', 'regiao', 'bairro', 'area']),
 kicker: z.string(), // ex.: "Atendimento presencial · 14,5 km de Aparecida"
 sub: z.string(), // subtítulo do hero: como funciona e por que é crível
 heroImage: z.string(), // nome no manifesto de imagens (Picture)
 heroImageAlt: z.string(),
 waMsg: z.string(), // mensagem pré-preenchida do WhatsApp, com o local/assunto
 secao: z.string(), // prefixo do evento whatsapp_click (ex.: "LP Aparecida")
 fatos: z.array(z.object({ t: z.string(), d: z.string() })).min(3).max(4),
 paraQuem: z.object({
 titulo: z.string(),
 intro: z.string(),
 itens: z.array(z.object({ t: z.string(), d: z.string() })).min(3),
 naoAtende: z.string(),
 }),
 chegar: z.object({
 titulo: z.string(),
 texto: z.string(), // parágrafo local real (rota, referências verificadas)
 rota: z.array(z.object({ t: z.string(), d: z.string() })).default([]),
 fonteRota: z.string().optional(), // de onde vêm distância/tempo (ex.: OSRM, sem trânsito)
 }),
 objecoes: z.array(z.object({ q: z.string(), a: z.string() })).min(3).max(4),
 guiaTitulo: z.string(), // texto do resumo do <details>
 // Só na página de região: os bairros dela (netas). Com `href`, o bairro tem página própria;
 // sem `href`, aparece só como bairro atendido (com a rota, quando verificada).
 bairros: z.object({
 titulo: z.string(),
 intro: z.string(),
 itens: z.array(z.object({
 nome: z.string(),
 href: z.string().optional(),
 rota: z.string().optional(), // ex.: "5,1 km · cerca de 7 min sem trânsito"
 d: z.string().optional(),
 })).min(1),
 outros: z.string().optional(), // demais bairros da região, em uma frase
 fonte: z.string().optional(),
 }).optional(),
 servico: z.object({
 name: z.string(),
 serviceType: z.string(),
 areaServed: z.array(z.object({
 tipo: z.enum(['City', 'Place', 'AdministrativeArea']),
 nome: z.string(),
 sameAs: z.string().optional(), // Wikidata verificado
 dentroDe: z.string().optional(), // containedInPlace (ex.: "Região Sul de Goiânia")
 })).min(1),
 }),
});

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
 // Página mãe direta quando a página é NETA do silo (ex.: bairro dentro de uma região):
 // entra no breadcrumb entre o silo e a página. A URL tem então 3 níveis.
 parent: z.object({ name: z.string(), href: z.string() }).optional(),
 datePublished: z.string(),
 // Data da última revisão de conteúdo real (não é igual a datePublished por
 // padrão). Opcional para não quebrar os posts que ainda não foram revisados.
 dateModified: z.string().optional(),
 medical: z.boolean().default(false),
 // Imagem de capa (hero + card). Caminho a partir de /public (ex: "/blog/slug.webp").
 // CFN 856/2026 art. 69 §2º: NUNCA imagem de resultado, antes/depois, composição
 // corporal, balança, fita métrica ou gráfico de evolução. Só editorial/conceitual.
 image: z.string().optional(),
 imageAlt: z.string().optional(),
 faqs: faq,
 references,
 // 'lp' = página de conversão com intenção local (LpPage.astro): blocos de decisão
 // visíveis no topo, o texto longo (body) recolhido num <details> no fim, ainda no HTML.
 // Desenho e regras: clients/ana-clara-nutri/lp-local-2026-11/_SPEC-LP-LOCAL.md
 layout: z.enum(['artigo', 'lp']).default('artigo'),
 lp: lp.optional(),
 }),
});

export const collections = { silos, posts };
