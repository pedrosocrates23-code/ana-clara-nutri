// Gatilho da fila de publicação chamado pelo Vercel Cron (vercel.json), todo dia às 11:30 UTC.
//
// É o segundo gatilho: o primeiro é o GitHub Actions (.github/workflows/fila-publicacao.yml),
// uma hora e meia antes. Esta função só dispara o Deploy Hook se alguma página vencida nos últimos
// JANELA_DIAS ainda não devolve 200, então ela não duplica build quando o GitHub já publicou e
// recupera sozinha um dia em que o build falhou (qualquer build publica todas as vencidas).
//
// Variáveis de ambiente na Vercel (Settings > Environment Variables, ambiente Production):
//   CRON_SECRET          a Vercel envia "Authorization: Bearer <CRON_SECRET>" nas chamadas do Cron
//   VERCEL_DEPLOY_HOOK   URL do Deploy Hook da branch main (Settings > Git > Deploy Hooks)
import { fila } from './_fila.js';

const SITE = 'https://nutrianaclara.com.br';
const JANELA_DIAS = 14;
const diaBRT = (d) => new Date(d.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const agora = new Date();
  const hoje = diaBRT(agora);
  const inicio = agora.getTime() - JANELA_DIAS * 86400 * 1000;
  const vencidas = fila.filter((p) => {
    const t = new Date(p.pub_date).getTime();
    return t <= agora.getTime() && t >= inicio;
  });
  if (vencidas.length === 0) {
    return Response.json({ acao: 'nada-vencido', hoje });
  }

  const pendentes = [];
  for (const p of vencidas) {
    const r = await fetch(`${SITE}${p.path}`, { method: 'HEAD', redirect: 'manual' });
    if (r.status !== 200) pendentes.push({ path: p.path, status: r.status });
  }
  if (pendentes.length === 0) {
    return Response.json({ acao: 'ja-publicado', hoje, paths: vencidas.map((p) => p.path) });
  }

  const hook = process.env.VERCEL_DEPLOY_HOOK;
  if (!hook) {
    console.error('VERCEL_DEPLOY_HOOK ausente: página vencida sem build', pendentes);
    return Response.json({ acao: 'erro', motivo: 'VERCEL_DEPLOY_HOOK ausente', pendentes }, { status: 500 });
  }
  const resp = await fetch(hook, { method: 'POST' });
  const corpo = await resp.text();
  console.log('Deploy Hook disparado', resp.status, pendentes);
  return Response.json({ acao: 'build-disparado', hoje, pendentes, hook_status: resp.status, hook_resposta: corpo.slice(0, 300) });
}
