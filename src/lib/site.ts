// Configuração central do site. Trocar placeholders pelos dados reais.

// Convenção de URL: sem barra final, exceto a raiz.
// Usada pelo canonical e pelo sitemap: os dois precisam bater exatamente.
export function canonicalPath(p: string): string {
 const withSlash = p.startsWith('/') ? p : `/${p}`;
 return withSlash === '/' ? '/' : withSlash.replace(/\/+$/, '');
}

export function absoluteUrl(p: string): string {
 return new URL(canonicalPath(p), SITE.url).href;
}

export const SITE = {
 name: 'Ana Clara Nutri',
 legalName: 'Ana Clara Andrades Santos',
 jobTitle: 'Nutricionista',
 url: 'https://nutrianaclara.com.br', // domínio confirmado (responde 200)
 crn: 'CRN-1 nº 19825',
 // NAP: precisa bater exatamente com o Google Business Profile
 // Ana atende dentro do beLIV; o pin do mapa é o do espaço, não um consultório próprio.
 venue: 'beLIV Espaço de Saúde e Bem-Estar',
 address: {
 street: 'Av. dos Ipês - Chácara 22',
 locality: 'Goiânia',
 region: 'GO',
 postalCode: '74855-390',
 country: 'BR',
 neighborhood: '{bairro}', // a confirmar
 },
 geo: { lat: '{LAT}', lng: '{LNG}' }, // a confirmar
 // phone = exibição; phoneE164 = links tel:/wa.me e schema.org
 phone: '+55 62 99495-9804',
 phoneE164: '+5562994959804',
 whatsapp: '5562994959804',
 // Valores (a preencher), atendimento PARTICULAR
 priceOnline: '{VALOR_ONLINE}',
 pricePresencial: '{VALOR_PRESENCIAL}',
 // Social / sameAs (a preencher)
 social: {
 instagram: '{IG}',
 linkedin: '{LINKEDIN}',
 gbp: '{GBP}',
 },
} as const;

// --- Dados ainda não fornecidos ---------------------------------------------
// Campos no formato '{PLACEHOLDER}' não podem aparecer no site nem no JSON-LD.
// Enquanto o número do CRN não chegar, TODA menção a registro profissional fica
// oculta. Ao preencher SITE.crn com o número real, os blocos reaparecem sozinhos:
// não é preciso mexer em nenhuma página.
export const isPlaceholder = (v: string) => /\{[^}]*\}/.test(v);

/** O número do CRN já foi informado? Enquanto false, o site não exibe registro profissional. */
export const HAS_CRN = !isPlaceholder(SITE.crn);
/** String do CRN pronta para exibição, ou vazia se ainda não temos o número. */
export const CRN = HAS_CRN ? SITE.crn : '';
/** Sufixo " · CRN-1 nº X" para linhas de assinatura; vazio enquanto não houver CRN. */
export const CRN_SUFIXO = HAS_CRN ? ` · ${SITE.crn}` : '';
/** Sufixo " (CRN-1 nº X)" para texto corrido; vazio enquanto não houver CRN. */
export const CRN_PARENTESES = HAS_CRN ? ` (${SITE.crn})` : '';

export const HAS_INSTAGRAM = !isPlaceholder(SITE.social.instagram);

/**
 * Foto profissional da Ana. Enquanto vazia, o site NÃO referencia o arquivo:
 * apontar para uma imagem inexistente gerava um 404 em toda visita à home
 * (erro no console, e o Lighthouse penaliza em Práticas Recomendadas).
 * Ao colocar a foto em public/ e preencher aqui, ela aparece sozinha.
 */
export const FOTO_ANA = '/ana-clara-nutricionista.webp';
export const TEM_FOTO = FOTO_ANA !== '';

// Endereço em uma linha, usado em texto corrido e no footer.
export const ADDRESS_LINE =
 `${SITE.address.street}, ${SITE.address.locality} - ${SITE.address.region}, ${SITE.address.postalCode}`;

// Query do mapa: nome do espaço + endereço faz o Google fixar o pin do estabelecimento,
// em vez de cair no meio da avenida.
const MAPS_QUERY = `${SITE.venue}, ${ADDRESS_LINE}`;

// Mensagem pré-preenchida do WhatsApp (encurta o caminho até o agendamento).
const WHATSAPP_MSG = 'Olá, Ana Clara! Vim pelo site e gostaria de agendar uma consulta.';

export const WHATSAPP_URL = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(WHATSAPP_MSG)}`;
export const TEL_URL = `tel:${SITE.phoneE164}`;

// Google Maps sem chave de API: embed por query do local + link para abrir o app.
export const MAPS_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&output=embed`;
export const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY)}`;

// Google Analytics 4 (gtag.js). Vazio desliga o rastreamento.
export const GA_ID = 'G-FRLJ3P7331';

// Microsoft Clarity (mapas de calor e gravação de sessão). Vazio desliga.
export const CLARITY_ID = 'xll1n69nrr';

// Navegação principal (header), flat, com âncoras exatas (SEO)
export const NAV = [
 { label: 'Home', href: '/' },
 { label: 'Atendimento Online', href: '/nutricionista-online/' },
 { label: 'Atendimento Presencial', href: '/nutricionista-em-goiania/' },
 { label: 'Receitas', href: '/receitas/' },
 { label: 'Sobre', href: '/sobre' },
 { label: 'Blog', href: '/blog' },
] as const;

// Áreas de atuação (silos), usado na home e no footer.
export const SILOS = [
 { label: 'Nutrição Comportamental', href: '/nutricao-comportamental/', intro: 'Entenda a sua relação com a comida e construa hábitos que duram.' },
 { label: 'Educação Alimentar', href: '/educacao-alimentar/', intro: 'Aprenda a fazer escolhas com autonomia, sem dietas restritivas.' },
 { label: 'Emagrecimento e Reeducação', href: '/emagrecimento/', intro: 'Reorganize a alimentação pelo comportamento, no seu tempo e sem culpa.' },
 { label: 'Nutrição Esportiva', href: '/nutricao-esportiva/', intro: 'Alimentação alinhada ao seu treino, à sua rotina e ao seu objetivo.' },
 { label: 'Nutrição Clínica', href: '/nutricao-clinica/', intro: 'A alimentação como aliada do seu cuidado, junto à sua equipe de saúde.' },
 { label: 'Saúde Intestinal', href: '/saude-intestinal/', intro: 'Alimentação para o bem-estar digestivo e mais disposição no dia a dia.' },
] as const;
