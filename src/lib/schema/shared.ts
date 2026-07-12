// Gera o @graph JSON-LD (padrão 2026: grafo único, @id canônico reusado).
// Ver SCHEMA-JSONLD.md. Wikidata (additionalType/about) a resolver via map-entity-wikidata.
import { SITE } from '../site';

const ID = {
 person: `${SITE.url}/#person`,
 business: `${SITE.url}/#business`,
 website: `${SITE.url}/#website`,
};

// Nós canônicos compartilhados, injetados em TODAS as páginas.
export function sharedNodes() {
 return [
 {
 '@type': 'Person',
 '@id': ID.person,
 name: SITE.legalName,
 givenName: 'Ana Clara',
 familyName: 'Andrades Santos',
 jobTitle: SITE.jobTitle,
 description:
 'Nutricionista com abordagem comportamental e educacional. Atendimento particular, online e presencial em Goiânia.',
 url: `${SITE.url}/sobre`,
 worksFor: { '@id': ID.business },
 knowsAbout: [
 'nutrição comportamental', 'educação alimentar', 'reeducação alimentar',
 'nutrição esportiva', 'nutrição clínica', 'saúde intestinal',
 'telenutrição',
 ],
 hasCredential: {
 '@type': 'EducationalOccupationalCredential',
 credentialCategory: 'Registro profissional',
 identifier: SITE.crn,
 recognizedBy: {
 '@type': 'Organization',
 name: 'Conselho Regional de Nutricionistas - 1ª Região (CRN-1)',
 },
 },
 sameAs: [SITE.social.instagram, SITE.social.linkedin, SITE.social.gbp].filter(Boolean),
 },
 {
 '@type': ['ProfessionalService', 'LocalBusiness'],
 '@id': ID.business,
 name: `${SITE.legalName}, Nutricionista`,
 description:
 'Atendimento nutricional individual e particular, presencial em Goiânia e online por telenutrição.',
 url: `${SITE.url}/`,
 founder: { '@id': ID.person },
 employee: { '@id': ID.person },
 priceRange: '$$',
 currenciesAccepted: 'BRL',
 paymentAccepted: 'Particular (sem convênios)',
 telephone: SITE.phone,
 address: {
 '@type': 'PostalAddress',
 streetAddress: SITE.address.street,
 addressLocality: SITE.address.locality,
 addressRegion: SITE.address.region,
 postalCode: SITE.address.postalCode,
 addressCountry: SITE.address.country,
 },
 geo: { '@type': 'GeoCoordinates', latitude: SITE.geo.lat, longitude: SITE.geo.lng },
 areaServed: [
 { '@type': 'City', name: 'Goiânia' },
 { '@type': 'City', name: 'Aparecida de Goiânia' },
 ],
 // additionalType: '{WD:nutricionista}', // resolver via map-entity-wikidata
 },
 {
 '@type': 'WebSite',
 '@id': ID.website,
 url: `${SITE.url}/`,
 name: SITE.name,
 inLanguage: 'pt-BR',
 publisher: { '@id': ID.person },
 potentialAction: {
 '@type': 'SearchAction',
 target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/blog?q={search_term_string}` },
 'query-input': 'required name=search_term_string',
 },
 },
 ];
}

type FaqItem = { q: string; a: string };

export type GraphOpts = {
 path: string; // ex.: '/nutricionista-online/'
 title: string;
 type?: 'WebPage' | 'ProfilePage' | 'CollectionPage';
 faqs?: FaqItem[];
 breadcrumb?: { name: string; href: string }[];
 mainEntity?: 'person' | 'business';
 extraNodes?: any[]; // Service, Article, Offer, Recipe, etc.
};

export const SCHEMA_IDS = {
 person: `${SITE.url}/#person`,
 business: `${SITE.url}/#business`,
 website: `${SITE.url}/#website`,
};

// Monta o @graph completo da página (shared + nós da página).
export function buildGraph(opts: GraphOpts) {
 const pageId = `${SITE.url}${opts.path}#webpage`;
 const nodes: any[] = sharedNodes();

 const page: any = {
 '@type': opts.type ?? 'WebPage',
 '@id': pageId,
 url: `${SITE.url}${opts.path}`,
 name: opts.title,
 isPartOf: { '@id': ID.website },
 inLanguage: 'pt-BR',
 };
 if (opts.mainEntity === 'person') page.mainEntity = { '@id': ID.person };
 if (opts.mainEntity === 'business') page.mainEntity = { '@id': ID.business };
 nodes.push(page);

 if (opts.breadcrumb?.length) {
 nodes.push({
 '@type': 'BreadcrumbList',
 '@id': `${SITE.url}${opts.path}#breadcrumb`,
 itemListElement: opts.breadcrumb.map((b, i) => ({
 '@type': 'ListItem', position: i + 1, name: b.name, item: `${SITE.url}${b.href}`,
 })),
 });
 page.breadcrumb = { '@id': `${SITE.url}${opts.path}#breadcrumb` };
 }

 if (opts.faqs?.length) {
 nodes.push({
 '@type': 'FAQPage',
 '@id': `${SITE.url}${opts.path}#faq`,
 isPartOf: { '@id': pageId },
 mainEntity: opts.faqs.map((f) => ({
 '@type': 'Question', name: f.q,
 acceptedAnswer: { '@type': 'Answer', text: f.a },
 })),
 });
 }

 if (opts.extraNodes?.length) nodes.push(...opts.extraNodes);

 return { '@context': 'https://schema.org', '@graph': nodes };
}
