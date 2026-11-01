# Imagens do site (redesign 01/11/2026)

## De onde vêm

| Imagem | Origem |
|---|---|
| Banner da home (`hero-home`) | Codex CLI (`codex exec`, image_generation), ampliado 2x no Magnific (3832x1640) |
| Capas dos 38 artigos, 7 áreas e 6 páginas | Codex CLI, 1536x1024, mesmo DNA visual (prompts em `../imagens-fonte/montar_prompts.py`) |
| Retrato da Ana (`ana-clara-retrato`) | Foto real enviada pela cliente (`public/ana-clara-nutricionista.webp`) |

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

Saída: `public/img/<nome>-<largura>.webp` (WebP q80, effort 6) + `src/data/images.json`.
Larguras: 480/768/1080/1536 (padrão) e 828/1280/1920/2560/3200 (banner), mais o recorte
vertical `hero-home-mobile` (640/960/1230) para celular. Posts também ganham
`public/blog/<slug>.webp` (caminho do campo `image` do frontmatter e da og:image).

O componente `src/components/Picture.astro` monta `srcset`/`sizes` a partir do manifesto,
com `width`/`height` reais (CLS zero). Nome fora do manifesto não renderiza nada.

## Post novo

1. Escreva a cena em `imagens-fonte/montar_prompts.py` (CENAS) e rode `python montar_prompts.py`.
2. `./gen.sh <slug>` e confira a imagem.
3. `npm run images -- <slug>` (ou `node scripts/build-images.mjs <slug>`).
4. No frontmatter: `image: "/blog/<slug>.webp"` e `imageAlt` descrevendo o que a imagem mostra.
