# Imagens do site (redesign 01/11/2026)

## De onde vêm

| Imagem | Origem |
|---|---|
| Banner da home (`hero-home`) | Codex CLI (`codex exec`, image_generation), ampliado 2x no Magnific (3832x1640) |
| Capas dos 38 artigos, 7 áreas e 6 páginas | Codex CLI, 1536x1024, mesmo DNA visual (prompts em `../imagens-fonte/montar_prompts.py`) |
| Retrato da Ana (`ana-clara-retrato`) | Foto real enviada pela cliente (854x922), ampliada 4x no Magnific **Precision** (modo fiel, sem inventar traço) para 3416x3688. Original e ampliada em `imagens-fonte/png/ana-clara-retrato{,-4k}` |

Originais em PNG ficam **fora do repo**, em `clients/ana-clara-nutri/imagens-fonte/png/`
(gerador: `imagens-fonte/gen.sh <nome>`, que lê `prompts/<nome>.txt`).

## Regras (CFN 856/2026)

- **Sem pessoa gerada por IA** (art. 38). A única pessoa no site é o retrato real da Ana.
- Sem resultado, antes/depois, balança, fita métrica, exame ou gráfico (art. 69, §2º).
- Sem marca, rótulo ou embalagem identificável (art. 74). Sem texto na imagem.
- Toda imagem nova é conferida visualmente antes de entrar (folhas de contato em `imagens-fonte/folha-*.jpg`).
- O aviso de uso de IA nas ilustrações está em `/termos-e-aviso-de-ia`.

## Como gerar as versões do site

```bash
npm run images                      # todas
node scripts/build-images.mjs nome  # só uma
```

Saída: `public/img/<nome>-<largura>.webp` (WebP effort 6) + `src/data/images.json`.

| Família | Larguras | Qualidade |
|---|---|---|
| padrão (capas, áreas, páginas) | 480, 560, 640, 768, 1080, 1536 | q68 até 640, q74 em 768, q80 acima (`Q_CELULAR` sobrescreve por imagem) |
| banner `hero-home` | 828, 1280, 1920, 2560, 3200 | q80 |
| banner celular `hero-home-mobile` (recorte quadrado) | 560, 960, 1240 | q56 |
| retrato `ana-clara-retrato` | 160 ... 3416 | q68/q74/q80 pela regra do padrão |

As larguras de 560/640 existem para o celular de densidade ~1,75 (o perfil do PageSpeed):
é o que mantém o LCP no 4G simulado abaixo de 1,8 s e o PageSpeed em 100. Celulares de
densidade 2,6-3 recebem 960+ pelo mesmo `sizes`. Posts também ganham
`public/blog/<slug>.webp` (caminho do campo `image` do frontmatter e da og:image).

O componente `src/components/Picture.astro` monta `srcset`/`sizes` a partir do manifesto,
com `width`/`height` reais (CLS zero). Nome fora do manifesto não renderiza nada.

## Post novo

1. Escreva a cena em `imagens-fonte/montar_prompts.py` (CENAS) e rode `python montar_prompts.py`.
2. `./gen.sh <slug>` e confira a imagem.
3. `npm run images -- <slug>` (ou `node scripts/build-images.mjs <slug>`).
4. No frontmatter: `image: "/blog/<slug>.webp"` e `imageAlt` descrevendo o que a imagem mostra.

## PageSpeed (01/11/2026)

```bash
npm run build && npx astro preview --port 4330
MSYS_NO_PATHCONV=1 node scripts/lighthouse.mjs http://127.0.0.1:4330 --modelos   # 1 página por template
node scripts/lighthouse-resumo.mjs                                               # o que reprovou e onde
```

O que segura o 100 no celular (não desfazer sem medir):
- Foto abaixo da dobra é **adiada** (`Picture.astro` com `loading="lazy"` → `<noscript>` + injeção
  em `src/scripts/site.ts` após a 1ª interação ou ~1 s do load). O Chrome baixava essas fotos junto
  com a principal.
- GA4 carrega na 1ª interação ou 3 s após o load; Clarity só na 1ª interação (cookies de terceiros
  derrubavam Boas Práticas). GSAP: 1ª interação ou 2,5 s após o load.
- Fontes recortadas (`scripts/subset-fonts.py`): Hanken 400-650, Newsreader 300-400, só caracteres
  do português. Peso fora dessa faixa é aproximado pelo navegador.
- Nada acima da dobra nasce com `opacity: 0`; transições de cor em texto não passam por tons sem contraste.
