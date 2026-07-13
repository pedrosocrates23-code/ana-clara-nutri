import type { APIRoute, GetStaticPaths } from 'astro';
import { getSitemapGroups, renderUrlset, xmlResponse, type SitemapGroup } from '../lib/sitemap';

// Um sub-sitemap por grupo: /sitemap-paginas.xml, /sitemap-blog.xml,
// /sitemap-silo-emagrecimento.xml, ...
export const getStaticPaths: GetStaticPaths = async () => {
 const groups = await getSitemapGroups();
 return groups.map((group) => ({ params: { grupo: group.id }, props: { group } }));
};

export const GET: APIRoute = ({ props }) =>
 xmlResponse(renderUrlset((props.group as SitemapGroup).entries));
