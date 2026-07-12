// Configuração central do site. Trocar placeholders pelos dados reais.
export const SITE = {
 name: 'Ana Clara Nutri',
 legalName: 'Ana Clara Andrades Santos',
 jobTitle: 'Nutricionista',
 url: 'https://anaclaranutri.com.br', // domínio a confirmar
 crn: 'CRN-1 nº {XXXXX}', // a preencher
 // NAP (a preencher)
 address: {
 street: '{ENDERECO}',
 locality: 'Goiânia',
 region: 'GO',
 postalCode: '{CEP}',
 country: 'BR',
 neighborhood: '{bairro}',
 },
 geo: { lat: '{LAT}', lng: '{LNG}' },
 phone: '{TEL}',
 whatsapp: '{WHATSAPP}',
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
