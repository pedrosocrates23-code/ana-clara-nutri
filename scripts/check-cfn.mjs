// Guardrail de conformidade: Código de Ética e Conduta da(o) Nutricionista
// (Resolução CFN nº 856/2026, em vigor a partir de ~27/07/2026).
//
// Roda sobre o HTML final em dist/, não sobre o fonte: o que importa é o que
// o paciente e o Google veem. Uso: npm run build && npm run check:cfn
//
// ERRO  = viola o Código (bloqueia publicação).
// AVISO = exige revisão humana (pode ser uso legítimo, ex.: frase anti-promessa).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

// Rol de especialidades reconhecidas: Res. CFN 689/2021, art. 3º (alterada pela 778/2024).
// "Nutrição Comportamental" NÃO consta: logo, não pode ser usada como titulação (art. 24, §2º).
// "nutrólogo" NÃO entra aqui: é outra profissão (médica) e o site a discute em
// conteúdo educativo comparativo, o que é legítimo.
const TITULACOES_VEDADAS = [
  /nutricionista\s+comportamental/i,
  /nutricionista\s+esportiv[oa]/i,
  /nutricionista\s+cl[íi]nic[oa]/i,
  /especialista\s+em\s+nutri[çc][ãa]o/i,
];

// Placeholder: sempre erro, negação não se aplica.
const PLACEHOLDER = {
  re: /\{[A-Z_]+\}|\{XXXXX\}|\{bairro\}|\{LAT\}|\{LNG\}/,
  art: 'art. 24, caput', msg: 'Placeholder não preenchido vazou para o HTML (o CRN precisa estar visível)',
};

// Regras de conteúdo: só viram erro quando NÃO estão precedidas de negação.
// "sem promessa de resultado" é conformidade; "resultado garantido" é infração.
const ERROS = [
  { re: /antes\s+e\s+depois/i,
    art: 'art. 69, §2º', msg: 'Comparação "antes e depois"' },
  { re: /(garantimos|resultado\s+garantido|garantia\s+de\s+resultado|prometo\s+que\s+voc[êe])/i,
    art: 'art. 69, §6º', msg: 'Garantia/promessa de resultado' },
  { re: /(perca\s+\d|perder\s+\d+\s*kg|emagre[çc]a\s+\d)/i,
    art: 'art. 69, §6º', msg: 'Promessa de perda de peso quantificada' },
  { re: /(sorteio|promo[çc][ãa]o\s+rel[âa]mpago|desconto\s+de\s+\d+%|vagas?\s+limitadas?|[úu]ltimas?\s+vagas?)/i,
    art: 'art. 68, III', msg: 'Oferta, promoção ou sorteio de serviço' },
  { re: /(whey\s+\w+®|\bgrowth\b|\bmax\s+titanium\b|\bintegralm[ée]dica\b|\bprobi[óo]tica\b)/i,
    art: 'art. 74', msg: 'Marca de suplemento/alimento' },
];

// A infração está em AFIRMAR a prática. Negá-la ("sem antes e depois", "não prometo
// resultado") é justamente o que o Código exige: então olhamos o que vem antes do match.
const NEGACAO_ANTES = /\b(sem|n[ãa]o|nunca|jamais|nem|nenhum|nenhuma|nada de|livre de|veda[do]*|proibid)\w*\b[^.;:]{0,60}$/i;

// Negação posposta: 'o título "nutricionista comportamental" NÃO existe': o termo
// aparece justamente para ser desmentido, o que é conteúdo de transparência.
const NEGACAO_DEPOIS = /^[^.;:]{0,60}\b(n[ãa]o|nunca|jamais|inexist)\w*\b/i;

function negado(txt, idx, len) {
  return (
    NEGACAO_ANTES.test(txt.slice(Math.max(0, idx - 80), idx)) ||
    NEGACAO_DEPOIS.test(txt.slice(idx + len, idx + len + 80))
  );
}

const AVISOS = [
  { re: /especialista/i, art: 'art. 24, §2º', msg: 'A palavra "especialista" aparece: confirmar que não é auto-atribuição de título' },
  { re: /\bcura\b|\bcurar\b/i, art: 'art. 69', msg: 'Menção a "cura": confirmar que não promete cura' },
  { re: /milagr/i, art: 'art. 69, §6º', msg: 'Menção a "milagre": confirmar que é para negá-lo' },
];

function html(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? html(p) : p.endsWith('.html') ? [p] : [];
  });
}

// Texto visível + <title> e meta description. Ignora scripts/estilos.
// As entidades HTML precisam ser decodificadas ANTES da análise: '&quot;' carrega um
// ';' que a detecção de negação leria como fim de frase, cortando o 'não' seguinte.
function textoVisivel(raw) {
  return raw
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|#160);/g, ' ')
    .replace(/&(?:quot|#34);/g, '"')
    .replace(/&(?:apos|#39);/g, "'")
    .replace(/&(?:amp|#38);/g, '&')
    .replace(/&(?:lt|#60);/g, '<')
    .replace(/&(?:gt|#62);/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/\s+/g, ' ');
}

let erros = 0;
let avisos = 0;

for (const file of html(DIST)) {
  const raw = readFileSync(file, 'utf8');
  const txt = textoVisivel(raw);
  const url = '/' + file.replace(/^dist[\\/]/, '').replace(/index\.html$/, '').replace(/\\/g, '/');

  const ph = txt.match(PLACEHOLDER.re);
  if (ph) {
    console.error(`ERRO  ${url}\n      ${PLACEHOLDER.art}: ${PLACEHOLDER.msg}: "${ph[0]}"`);
    erros++;
  }

  const todas = (re) => [...txt.matchAll(new RegExp(re.source, re.flags.replace('g', '') + 'g'))];

  for (const re of TITULACOES_VEDADAS) {
    for (const m of todas(re)) {
      if (negado(txt, m.index, m[0].length)) continue;
      console.error(`ERRO  ${url}\n      art. 24, §2º: titulação fora do rol do CFN: "${m[0].trim()}"`);
      erros++;
    }
  }
  for (const { re, art, msg } of ERROS) {
    for (const m of todas(re)) {
      if (negado(txt, m.index, m[0].length)) continue;
      console.error(`ERRO  ${url}\n      ${art}: ${msg}: "${m[0].trim()}"`);
      erros++;
    }
  }
  for (const { re, art, msg } of AVISOS) {
    for (const m of todas(re)) {
      console.warn(`AVISO ${url}\n      ${art}: ${msg}: "${m[0].trim()}"`);
      avisos++;
    }
  }
}

console.log(`\ncheck:cfn: ${erros} erro(s), ${avisos} aviso(s) em ${html(DIST).length} páginas.`);
if (erros > 0) {
  console.error('Publicação bloqueada: corrija os erros acima (Resolução CFN nº 856/2026).');
  process.exit(1);
}
