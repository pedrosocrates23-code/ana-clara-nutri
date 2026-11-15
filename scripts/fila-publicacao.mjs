#!/usr/bin/env node
/**
 * Fila de publicação do site da Ana Clara Nutri (mesmo robô da Ahara, adaptado).
 *
 * Uma página entra na fila quando o .md está em src/content/posts com datePublished no futuro.
 * Ela só vira rota no primeiro build depois da data (src/lib/publicacao.ts). Os builds dos dias
 * de publicação são disparados por dois gatilhos independentes, os dois idempotentes:
 *   1. GitHub Actions  .github/workflows/fila-publicacao.yml   todo dia 10:00 UTC (07:00 BRT)
 *   2. Vercel Cron     api/publicar-fila.js (vercel.json)      todo dia 11:30 UTC
 * Cada um só chama o Deploy Hook se alguma página vencida nos últimos 14 dias ainda não devolve
 * 200. Quando a fila esvazia, os dois continuam agendados mas não disparam nada.
 *
 * Regras da fila (verificadas por --verificar):
 *   - cadência de um dia sim, um dia não: entre duas páginas agendadas, no mínimo 2 dias;
 *   - datePublished só com a data (publica às 09:00 UTC, 06:00 de Brasília) ou com T09:00:00Z;
 *   - página neta (com `parent`) nunca publica antes da página mãe;
 *   - api/_fila.js corresponde exatamente às páginas agendadas (gere com --gerar-api).
 *
 * Uso:
 *   node scripts/fila-publicacao.mjs --status       tabela da fila
 *   node scripts/fila-publicacao.mjs --vencidos     paths vencidos nos últimos 14 dias, um por linha
 *   node scripts/fila-publicacao.mjs --gerar-api    reescreve api/_fila.js
 *   node scripts/fila-publicacao.mjs --verificar    exit 1 se alguma regra falhar
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const POSTS = join(ROOT, 'src', 'content', 'posts');
const API_FILA = join(ROOT, 'api', '_fila.js');
export const INTERVALO_MIN_DIAS = 2; // um dia sim, um dia não
export const HORA_UTC = 9; // 06:00 em Brasília (UTC-3, sem horário de verão desde 2019)
export const JANELA_DIAS = 14;
const NOMES = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const DIA_MS = 86400 * 1000;

const campo = (fm, nome) => {
  const m = fm.match(new RegExp(`^${nome}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
};

// Mesma regra de src/lib/publicacao.ts (momentoDePublicacao).
export const momento = (datePublished) =>
  /T/.test(datePublished)
    ? new Date(datePublished)
    : new Date(`${datePublished}T${String(HORA_UTC).padStart(2, '0')}:00:00Z`);

export function lerPaginas() {
  return readdirSync(POSTS)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const txt = readFileSync(join(POSTS, f), 'utf-8');
      const fm = (txt.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [, ''])[1];
      // parent em linha ({ name: "...", href: "..." }) ou em bloco (href: indentado na linha seguinte)
      const paiLinha = fm.match(/^parent:\s*\{[^}]*\bhref:\s*["']?([^"',}]+)/m);
      const paiBloco = fm.match(/^parent:\s*\r?\n((?:[ \t]+.*\r?\n?)+)/m);
      const dp = campo(fm, 'datePublished') || '';
      return {
        arquivo: f,
        path: campo(fm, 'path') || '',
        datePublished: dp,
        pub_date: momento(dp),
        parent: paiLinha ? paiLinha[1].trim() : paiBloco ? campo(paiBloco[1].replace(/^[ \t]+/gm, ''), 'href') : null,
      };
    });
}

const diaBRT = (d) => new Date(d.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);
const publicarTudo = () => process.env.PUBLICAR_TUDO === '1';

export function agendadas(paginas, agora = Date.now()) {
  if (publicarTudo()) return [];
  return paginas.filter((p) => p.pub_date.getTime() > agora).sort((a, b) => a.pub_date - b.pub_date);
}

function status(paginas) {
  const fila = agendadas(paginas);
  const publicadas = paginas.length - fila.length;
  console.log(`Publicadas: ${publicadas} | Na fila: ${fila.length}`);
  for (const p of fila) console.log(`${diaBRT(p.pub_date)} ${NOMES[p.pub_date.getUTCDay()]}  ${p.path}`);
  if (fila.length) console.log(`Última página da fila: ${diaBRT(fila[fila.length - 1].pub_date)}`);
}

// Vencidas nos últimos 14 dias (mesma janela de api/publicar-fila.js). Basta uma delas estar fora
// do ar para o build ser necessário, e o build publica todas as vencidas de uma vez.
function vencidas(paginas) {
  const agora = Date.now();
  paginas
    .filter((p) => p.pub_date.getTime() <= agora && p.pub_date.getTime() >= agora - JANELA_DIAS * DIA_MS)
    .forEach((p) => console.log(p.path));
}

function conteudoApi(paginas) {
  const fila = agendadas(paginas).map((p) => ({ path: p.path, pub_date: p.pub_date.toISOString() }));
  return (
    '// GERADO por scripts/fila-publicacao.mjs --gerar-api. Não editar à mão.\n' +
    '// Páginas agendadas no momento do commit, lidas pela função api/publicar-fila.js.\n' +
    `export const fila = ${JSON.stringify(fila, null, 2)};\n`
  );
}

function verificar(paginas) {
  const erros = [];
  const fila = agendadas(paginas);
  const porPath = new Map(paginas.map((p) => [p.path, p]));
  let anterior = null;
  for (const p of fila) {
    if (Number.isNaN(p.pub_date.getTime())) {
      erros.push(`${p.arquivo}: datePublished inválido (${p.datePublished})`);
      continue;
    }
    if (p.pub_date.getUTCHours() !== HORA_UTC || p.pub_date.getUTCMinutes() !== 0)
      erros.push(`${p.arquivo}: horário ${p.pub_date.toISOString()} fora do padrão ${HORA_UTC}:00 UTC`);
    if (anterior) {
      const dias = Math.round((p.pub_date - anterior.pub_date) / DIA_MS);
      if (dias < INTERVALO_MIN_DIAS)
        erros.push(`${p.arquivo}: ${diaBRT(p.pub_date)} fica a ${dias} dia(s) de ${anterior.arquivo}; o mínimo é ${INTERVALO_MIN_DIAS} (um dia sim, um dia não)`);
    }
    anterior = p;
  }
  // Mãe antes da neta: vale para toda página com parent cuja mãe ou ela mesma ainda está na fila.
  const naFila = new Set(fila.map((p) => p.path));
  for (const p of paginas.filter((x) => x.parent)) {
    const mae = porPath.get(p.parent.replace(/\/$/, ''));
    if (!mae) {
      if (naFila.has(p.path)) erros.push(`${p.arquivo}: parent ${p.parent} não existe na collection`);
      continue;
    }
    if ((naFila.has(p.path) || naFila.has(mae.path)) && mae.pub_date > p.pub_date)
      erros.push(`${p.arquivo}: publica em ${diaBRT(p.pub_date)}, antes da página mãe ${mae.arquivo} (${diaBRT(mae.pub_date)})`);
  }
  if (!existsSync(API_FILA)) erros.push('api/_fila.js ausente (rode npm run fila:gerar)');
  else {
    // Só cobra o que ainda está agendado: depois que uma página publica, ela continua em
    // api/_fila.js até o próximo --gerar-api, e isso não pode reprovar o workflow do dia.
    const atual = readFileSync(API_FILA, 'utf-8');
    const lista = new Set([...atual.matchAll(/"path":\s*"([^"]+)",\s*"pub_date":\s*"([^"]+)"/g)].map((m) => `${m[1]}|${m[2]}`));
    const faltando = fila.filter((p) => !lista.has(`${p.path}|${p.pub_date.toISOString()}`)).map((p) => p.arquivo);
    if (faltando.length) erros.push(`api/_fila.js desatualizado, faltam ou mudaram: ${faltando.join(', ')} (rode npm run fila:gerar)`);
  }
  if (erros.length) {
    console.error('FILA INVÁLIDA:\n- ' + erros.join('\n- '));
    process.exit(1);
  }
  console.log(`Fila OK: ${fila.length} página(s) agendada(s), com intervalo mínimo de ${INTERVALO_MIN_DIAS} dias.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const paginas = lerPaginas();
  const arg = process.argv[2];
  if (arg === '--status') status(paginas);
  else if (arg === '--vencidos') vencidas(paginas);
  else if (arg === '--gerar-api') {
    writeFileSync(API_FILA, conteudoApi(paginas), 'utf-8');
    console.log(`api/_fila.js gerado com ${agendadas(paginas).length} página(s).`);
  } else if (arg === '--verificar') verificar(paginas);
  else {
    console.error('Uso: --status | --vencidos | --gerar-api | --verificar');
    process.exit(2);
  }
}
