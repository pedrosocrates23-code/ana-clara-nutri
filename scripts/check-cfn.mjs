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
import { pathToFileURL } from 'node:url';

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
// `excecao`, quando presente, é um sentido alternativo e legítimo do mesmo texto
// (ex.: "antes e depois DO TREINO" é hora da refeição, não comparação de imagem
// corporal) — se casar no ponto do match, a ocorrência não é erro, com negação ou sem.
const ERROS = [
  { re: /antes\s+e\s+depois/i,
    art: 'art. 69, §2º', msg: 'Comparação "antes e depois"',
    // Confirmado em 4 páginas do silo esportivo (pre-e-pos-treino, proteina-e-treino,
    // hub esportiva, home): "antes e depois do treino/consulta/sessão" é sentido
    // TEMPORAL (quando comer, quando agendar), não a comparação de imagem corporal
    // vedada pelo art. 69 §2º. Checado em 21/08/2026 com evidência em 3 URLs distintas.
    excecao: /antes\s+e\s+depois\s+d[aoe]s?\s+(treino|exerc[íi]cio|sess[ãa]o|consulta|jogo|corrida|atividade|refei[çc][ãa]o)/i },
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
// `proib\w*`/`pro[íi]b\w*` cobre tanto "proibido/proibida" quanto a forma verbal
// "proíbe/proíbem", que a versão anterior (só "proibid") não capturava.
const NEGACAO_ANTES = /\b(sem|n[ãa]o|nunca|jamais|nem|nenhum|nenhuma|nada de|livre de|veda[do]*|proibid|pro[íi]b)\w*\b[^.;:]{0,60}$/i;

// Negação posposta, DUAS formas legítimas de transparência:
// (1) na MESMA sentença: 'o título "nutricionista comportamental" NÃO existe'.
// (2) na sentença SEGUINTE, um padrão editorial recorrente neste projeto — lista
//     o sinal de alerta, ponto final, e a sentença seguinte confirma a vedação
//     ("...foto de resultado. O código de 2026 veda apresentar..."; "...vagas
//     limitadas". Também vedado."). Confirmado em 2 páginas em 21/08/2026.
// Na sentença seguinte só aceitamos o vocabulário FORTE e específico de vedação
// (veda/proíbe/inexiste) — não "não/nunca/sem", que são comuns demais como
// abertura de frase e negariam violação real por coincidência duas frases depois.
const NEGACAO_MESMA_SENTENCA = /\b(n[ãa]o|nunca|jamais|inexist|veda[do]*|pro[íi]b)\w*\b/i;
// Vocabulário FORTE: específico o bastante para não aparecer por coincidência
// numa frase seguinte que fala de outra coisa (ver NEGACAO_ABERTURA abaixo, que
// é mais permissivo e por isso mais restrito em quando pode ser usado).
const NEGACAO_SENTENCA_SEGUINTE_FORTE = /\b(veda[do]*|pro[íi]b\w*|inexist\w*)\b/i;
// "Pergunta? Não, ..." é o padrão de FAQ (resposta direta a uma pergunta) e só
// vale quando a sentença do match terminou em interrogação — sem essa condição,
// um "Não" solto na frase seguinte pode negar outra coisa (ver teste de controle
// "resultado garantido. Não cobro hora extra": aqui o "Não" é sobre cobrança, não
// sobre o resultado, e a violação real não pode desaparecer por coincidência).
const NEGACAO_ABERTURA = /^(n[ãa]o|nunca|jamais)\b/i;

function negado(txt, idx, len) {
  if (NEGACAO_ANTES.test(txt.slice(Math.max(0, idx - 80), idx))) return true;

  const resto = txt.slice(idx + len, idx + len + 300);
  const mSentA = resto.match(/^([^.!?;:]*)([.!?;:]?)/);
  const sentA = mSentA[1];
  const pontuacao = mSentA[2];
  if (NEGACAO_MESMA_SENTENCA.test(sentA)) return true;

  const sentB = resto.slice(sentA.length + pontuacao.length).replace(/^\s+/, '').slice(0, 40);
  if (NEGACAO_SENTENCA_SEGUINTE_FORTE.test(sentB)) return true;
  return pontuacao === '?' && NEGACAO_ABERTURA.test(sentB);
}

function excecaoAplicavel(regra, txt, idx) {
  if (!regra.excecao) return false;
  // A exceção precisa casar tocando o MESMO ponto do match (não em qualquer
  // lugar da página) — senão uma menção legítima em outro parágrafo mascararia
  // uma violação real em outro.
  const janela = txt.slice(Math.max(0, idx - 5), idx + 60);
  return regra.excecao.test(janela);
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

const todas = (txt, re) => [...txt.matchAll(new RegExp(re.source, re.flags.replace('g', '') + 'g'))];

// Analisa um texto já extraído (usado pelo runner e pelos testes de fixture).
// Retorna a lista de violações reais, já descontadas negação e exceção de sentido.
function analisar(txt) {
  const achados = [];
  const ph = txt.match(PLACEHOLDER.re);
  if (ph) achados.push({ tipo: 'erro', art: PLACEHOLDER.art, msg: PLACEHOLDER.msg, trecho: ph[0] });

  for (const re of TITULACOES_VEDADAS) {
    for (const m of todas(txt, re)) {
      if (negado(txt, m.index, m[0].length)) continue;
      achados.push({ tipo: 'erro', art: 'art. 24, §2º', msg: 'titulação fora do rol do CFN', trecho: m[0].trim() });
    }
  }
  for (const regra of ERROS) {
    for (const m of todas(txt, regra.re)) {
      if (excecaoAplicavel(regra, txt, m.index)) continue;
      if (negado(txt, m.index, m[0].length)) continue;
      achados.push({ tipo: 'erro', art: regra.art, msg: regra.msg, trecho: m[0].trim() });
    }
  }
  for (const { re, art, msg } of AVISOS) {
    for (const m of todas(txt, re)) {
      achados.push({ tipo: 'aviso', art, msg, trecho: m[0].trim() });
    }
  }
  return achados;
}

function run() {
  let erros = 0;
  let avisos = 0;

  for (const file of html(DIST)) {
    const raw = readFileSync(file, 'utf8');
    const txt = textoVisivel(raw);
    const url = '/' + file.replace(/^dist[\\/]/, '').replace(/index\.html$/, '').replace(/\\/g, '/');

    for (const a of analisar(txt)) {
      if (a.tipo === 'erro') {
        console.error(`ERRO  ${url}\n      ${a.art}: ${a.msg}: "${a.trecho}"`);
        erros++;
      } else {
        console.warn(`AVISO ${url}\n      ${a.art}: ${a.msg}: "${a.trecho}"`);
        avisos++;
      }
    }
  }

  console.log(`\ncheck:cfn: ${erros} erro(s), ${avisos} aviso(s) em ${html(DIST).length} páginas.`);
  if (erros > 0) {
    console.error('Publicação bloqueada: corrija os erros acima (Resolução CFN nº 856/2026).');
    process.exit(1);
  }
}

// Só executa a varredura de dist/ quando chamado diretamente (npm run check:cfn).
// Quando importado por check-cfn.test.mjs, expõe só as funções puras.
// pathToFileURL (não concatenação manual) é o que funciona igual em Windows e
// Unix: no Windows import.meta.url tem 3 barras (file:///C:/...) e uma comparação
// de string ingênua com o path do argv nunca bate, então run() nunca executava.
const chamadoDiretamente = import.meta.url === pathToFileURL(process.argv[1]).href;
if (chamadoDiretamente) run();

export { analisar, textoVisivel, negado, excecaoAplicavel, TITULACOES_VEDADAS, ERROS, AVISOS };
