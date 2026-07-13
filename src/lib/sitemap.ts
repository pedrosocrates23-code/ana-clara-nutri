import { getCollection } from 'astro:content';
import { absoluteUrl, SILOS } from './site';

export interface SitemapEntry {
 path: string;
 lastmod?: string; // YYYY-MM-DD; omitido quando não há data real
}

export interface SitemapGroup {
 id: string; // vira /sitemap-{id}.xml
 label: string;
 entries: SitemapEntry[];
}

// Páginas institucionais e de conversão. Não incluem hubs de silo nem artigos.
const PAGINAS: SitemapEntry[] = [
 { path: '/' },
 { path: '/sobre' },
 { path: '/contato' },
 { path: '/receitas' },
 { path: '/nutricionista-online' },
 { path: '/nutricionista-em-goiania' },
 { path: '/politica-de-privacidade' },
 { path: '/termos-e-aviso-de-ia' },
];

const escapeXml = (s: string) =>
 s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Data mais recente do grupo, para o lastmod do índice. */
export const latestLastmod = (entries: SitemapEntry[]): string | undefined =>
 entries
 .map((e) => e.lastmod)
 .filter((d): d is string => Boolean(d))
 .sort()
 .pop();

/**
 * Monta os grupos do sitemap a partir das coleções de conteúdo.
 * Um grupo por bloco semântico: páginas, blog e cada silo.
 */
export async function getSitemapGroups(): Promise<SitemapGroup[]> {
 const posts = await getCollection('posts');
 const silos = await getCollection('silos');

 const postsDoSilo = (siloId: string) =>
 posts
 .filter((p) => p.data.silo === siloId)
 .map((p) => ({ path: p.data.path, lastmod: p.data.datePublished }))
 .sort((a, b) => a.path.localeCompare(b.path));

 const grupoBlog: SitemapGroup = {
 id: 'blog',
 label: 'Blog',
 entries: [{ path: '/blog' }, ...postsDoSilo('blog')],
 };

 // Ordem dos silos: a mesma da navegação (SILOS), com fallback para o `order`
 // do frontmatter caso algum silo não esteja listado lá.
 const ordemNav = SILOS.map((s) => s.href.replace(/\//g, ''));
 const gruposSilo: SitemapGroup[] = silos
 .slice()
 .sort((a, b) => {
 const ia = ordemNav.indexOf(a.id);
 const ib = ordemNav.indexOf(b.id);
 if (ia !== -1 && ib !== -1) return ia - ib;
 if (ia !== -1) return -1;
 if (ib !== -1) return 1;
 return a.data.order - b.data.order;
 })
 .map((silo) => ({
 id: `silo-${silo.id}`,
 label: silo.data.title,
 entries: [{ path: `/${silo.id}` }, ...postsDoSilo(silo.id)],
 }));

 return [
 { id: 'paginas', label: 'Páginas principais', entries: PAGINAS },
 grupoBlog,
 ...gruposSilo,
 ];
}

export function renderUrlset(entries: SitemapEntry[]): string {
 const urls = entries
 .map((e) => {
 const lastmod = e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : '';
 return `  <url>\n    <loc>${escapeXml(absoluteUrl(e.path))}</loc>${lastmod}\n  </url>`;
 })
 .join('\n');
 return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderSitemapIndex(groups: SitemapGroup[]): string {
 const items = groups
 .map((g) => {
 const last = latestLastmod(g.entries);
 const lastmod = last ? `\n    <lastmod>${last}</lastmod>` : '';
 const loc = escapeXml(new URL(`/sitemap-${g.id}.xml`, absoluteUrl('/')).href);
 return `  <!-- ${escapeXml(g.label)} -->\n  <sitemap>\n    <loc>${loc}</loc>${lastmod}\n  </sitemap>`;
 })
 .join('\n');
 return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`;
}

export const xmlResponse = (body: string) =>
 new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
