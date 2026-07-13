# Ana Clara Nutri: Site (Astro)

Site institucional de SEO local + entidade da nutricionista Ana Clara Andrades Santos.
Stack: **Astro 7 (SSG)** · Vite 8/Rolldown · Markdown Rust (Sätteri) · CSS tokens do Design Book · fontes self-host + preload (Fontsource) · schema `@graph`.

## Rodar
```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # gera /dist
npm run preview
```

## Estrutura
```
src/
├── layouts/BaseLayout.astro   # head, fonts, schema @graph, header, footer
├── components/                # Header, Footer, Hero (full-bleed), Button, Faq
├── styles/                    # tokens.css (Design Book) + base.css
├── lib/site.ts                # NAP, nav, silos (PLACEHOLDERS a preencher)
├── lib/schema/shared.ts       # gerador do @graph JSON-LD (padrão 2026)
└── pages/index.astro          # Home (hero full-bleed + seções)
```

## Pendências (placeholders a preencher em `src/lib/site.ts`)
- CRN-1 nº, endereço/bairro/CEP, telefone/WhatsApp, geo (lat/lng)
- valores das consultas (online/presencial): atendimento **particular**
- perfis sociais (Instagram/LinkedIn/GBP) para `sameAs`
- domínio definitivo (em `astro.config.mjs` e `site.ts`)

## Assets a adicionar
- `public/hero-ana.jpg` (foto full-bleed da Ana) → descomentar em `Hero.astro`
- `public/og-default.jpg` (Open Graph)
- Wikidata QIDs (`{WD:...}`) via `map-entity-wikidata`

## Próximas páginas a criar (conteúdo já redigido)
`/sobre`, `/nutricionista-online/`, `/nutricionista-em-goiania/`, hubs dos 7 silos,
`/receitas/`, `/blog`, `/contato`, legais. Textos em `../REDACAO-ONDA-*.md`.

> Conformidade CFN é gate de publicação: ver `../CHECKLIST-MESTRE.md`.
