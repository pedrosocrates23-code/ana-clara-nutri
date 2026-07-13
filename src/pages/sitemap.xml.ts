import type { APIRoute } from 'astro';
import { getSitemapGroups, renderSitemapIndex, xmlResponse } from '../lib/sitemap';

// Índice do sitemap: aponta para um sub-sitemap por bloco semântico.
export const GET: APIRoute = async () => xmlResponse(renderSitemapIndex(await getSitemapGroups()));
