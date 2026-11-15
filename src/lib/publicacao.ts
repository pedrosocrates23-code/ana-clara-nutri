// Regra única de "página publicada", usada por TODA leitura da collection `posts`.
//
// O site é estático: uma página com datePublished no futuro já está no repositório, mas só
// vira rota (e só aparece em hubs, listas, relacionados e sitemap) no primeiro build depois
// que a data chega. Esses builds são disparados pela fila de publicação
// (.github/workflows/fila-publicacao.yml e api/publicar-fila.js), um dia sim, um dia não.
//
// datePublished só com a data ("2026-11-17") publica às 09:00 UTC (06:00 de Brasília)
// desse dia. Toda leitura nova de posts deve usar getPublishedPosts(), nunca
// getCollection('posts') direto: foi assim que um post agendado virou link 404 na Ahara.
//
// PUBLICAR_TUDO=1 publica tudo (pré-visualização local da fila inteira).
import { getCollection } from 'astro:content';

export const HORA_PUBLICACAO_UTC = 9;

export function momentoDePublicacao(datePublished: string): Date {
  return /T/.test(datePublished)
    ? new Date(datePublished)
    : new Date(`${datePublished}T${String(HORA_PUBLICACAO_UTC).padStart(2, '0')}:00:00Z`);
}

export function isPublished(data: { datePublished: string }, agora: number = Date.now()): boolean {
  if (process.env.PUBLICAR_TUDO === '1') return true;
  return momentoDePublicacao(data.datePublished).getTime() <= agora;
}

export async function getPublishedPosts() {
  return getCollection('posts', ({ data }) => isPublished(data));
}
