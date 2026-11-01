// Resume os relatórios em qa/lighthouse: nota por categoria e cada auditoria reprovada
// (com o seletor do elemento quando houver). Uso: node scripts/lighthouse-resumo.mjs
import { readdirSync, readFileSync } from 'node:fs';
const dir = 'qa/lighthouse';
const falhas = new Map();
for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
  const r = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  const n = (k) => Math.round((r.categories[k]?.score ?? 0) * 100);
  const lcp = (r.audits['largest-contentful-paint'].numericValue / 1000).toFixed(2);
  console.log(`${f.padEnd(70)} perf ${n('performance')} a11y ${n('accessibility')} bp ${n('best-practices')} seo ${n('seo')} lcp ${lcp}s`);
  for (const [cat, c] of Object.entries(r.categories)) {
    for (const ref of c.auditRefs) {
      const a = r.audits[ref.id];
      if (!ref.weight || a.score === null || a.score >= 1) continue;
      const nos = (a.details?.items ?? []).map((i) => i.node?.selector).filter(Boolean).slice(0, 3).join(' ; ');
      const k = `${cat} · ${ref.id}${nos ? ` · ${nos}` : ''}`;
      falhas.set(k, (falhas.get(k) ?? 0) + 1);
    }
  }
}
console.log('\nReprovações (vezes):');
for (const [k, v] of [...falhas].sort((a, b) => b[1] - a[1])) console.log(`${String(v).padStart(3)}  ${k}`);
