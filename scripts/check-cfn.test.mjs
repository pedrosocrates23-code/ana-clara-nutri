// Fixture do gate CFN. Roda com: node scripts/check-cfn.test.mjs
// Trava dois defeitos reais encontrados em 21/08/2026 (falso positivo de "antes e
// depois do treino" em 4 páginas do silo esportivo, e a forma verbal "proíbe" não
// reconhecida como negação) sem reabrir espaço para violação real passar despercebida.

import { analisar } from './check-cfn.mjs';

const casos = [
  {
    nome: 'antes e depois DO TREINO — falso positivo, não é erro',
    txt: 'O que comer antes e depois do treino depende do horário e da intensidade.',
    esperaErro: false,
  },
  {
    nome: 'antes e depois DA CONSULTA — falso positivo, não é erro',
    txt: 'Explico o que muda antes e depois da consulta, na prática do dia a dia.',
    esperaErro: false,
  },
  {
    nome: 'antes e depois de imagem corporal — continua erro',
    txt: 'Veja o antes e depois dela em três meses de acompanhamento.',
    esperaErro: true,
  },
  {
    nome: 'proíbe a exibição de antes e depois — negado pela forma verbal, não é erro',
    txt: 'A Resolução do CFN proíbe também a exibição de antes e depois, de composição corporal e de gráficos de evolução.',
    esperaErro: false,
  },
  {
    nome: 'nutricionista esportivo sem negação — continua erro (titulação vedada)',
    txt: 'Sou nutricionista esportivo há dez anos.',
    esperaErro: true,
  },
  {
    nome: 'sem promessa de resultado — negado, não é erro',
    txt: 'Trabalho sem promessa de resultado, como manda o Código de Ética.',
    esperaErro: false,
  },
  {
    nome: 'resultado garantido — continua erro',
    txt: 'Aqui você tem resultado garantido em 30 dias.',
    esperaErro: true,
  },
  {
    nome: 'lista de sinal de alerta + confirmação na sentença seguinte — negado',
    txt: 'Os outros sinais: antes e depois, gráfico de evolução, foto de resultado. O código de 2026 veda apresentar resultado por imagem, com ou sem autorização.',
    esperaErro: false,
  },
  {
    nome: 'sorteio citado como sinal de alerta + "Também vedado." — negado',
    txt: 'Oferta, promoção, sorteio, "vagas limitadas". Também vedado.',
    esperaErro: false,
  },
  {
    nome: 'CONTROLE NEGATIVO — "não" solto na sentença seguinte NÃO deve negar violação real',
    txt: 'Aqui você tem resultado garantido. Não cobro hora extra nem taxa de cancelamento.',
    esperaErro: true,
  },
  {
    nome: 'CONTROLE NEGATIVO — "sem" solto na sentença seguinte NÃO deve negar violação real',
    txt: 'Perca 5kg em duas semanas. Sem enrolação, direto ao ponto.',
    esperaErro: true,
  },
  {
    nome: 'FAQ pergunta+resposta direta — "X é nutricionista comportamental? Não, ..." — negado',
    txt: 'A Ana é "nutricionista comportamental" ou "especialista" na área? Não, e é importante explicar por quê: esse título não existe oficialmente.',
    esperaErro: false,
  },
  {
    nome: 'CONTROLE — mesma abertura "Não" na sentença seguinte, mas sem "?" antes — continua erro',
    txt: 'Sou nutricionista comportamental. Não cobro hora extra nem taxa de cancelamento.',
    esperaErro: true,
  },
  {
    nome: 'BUG REGRESSAO — "vedados" no PLURAL na sentenca seguinte nega (veda[do]* nao casava com \\b apos o "s")',
    txt: 'O conteudo usa imagem de antes e depois? Os tres sinais sao vedados pela norma da profissao.',
    esperaErro: false,
  },
  {
    nome: 'BUG REGRESSAO — "vedada" (feminino) na sentenca seguinte nega',
    txt: 'Ela promete resultado garantido. Essa pratica e vedada pelo codigo de etica.',
    esperaErro: false,
  },
];

let falhas = 0;
for (const c of casos) {
  const achados = analisar(c.txt);
  const temErro = achados.some((a) => a.tipo === 'erro');
  const ok = temErro === c.esperaErro;
  console.log(`${ok ? 'PASSOU' : 'FALHOU'}  ${c.nome}${ok ? '' : `  (esperava erro=${c.esperaErro}, achou=${temErro}; achados=${JSON.stringify(achados)})`}`);
  if (!ok) falhas++;
}

console.log(`\n${casos.length - falhas}/${casos.length} casos passaram.`);
if (falhas > 0) process.exit(1);
