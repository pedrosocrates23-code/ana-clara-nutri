# Padrão de CTA do site: injeta 2 cards de CTA (.cta-artigo) no corpo de cada
# artigo (antes do 2º H2 e do H2 do meio). O 3º CTA (fim) vem do template
# ArticlePage.astro (.cta-final). Re-runnable: remove cards antigos e reinsere.
# Botão principal = WhatsApp direto (conversa consultiva sobre a melhor forma de
# acompanhamento). CFN 856/2026: sem promessa, prazo, valores ou oferta.
#   python scripts/inject-cta.py [slug...]   (sem args = todos os posts)
import re, os, sys, glob
from urllib.parse import quote

BASE = os.path.join(os.path.dirname(__file__), "..", "src", "content", "posts")

# Número real do site (src/lib/site.ts: SITE.whatsapp). Se mudar lá, atualizar aqui.
WA_NUM = "5562994959804"
WA_MSG = "Olá, Ana Clara! Li um artigo no seu blog e gostaria de entender qual a melhor forma de acompanhamento para o meu caso."
WA_URL = f"https://wa.me/{WA_NUM}?text={quote(WA_MSG)}"

def card(eyebrow, titulo, texto):
    return ('<aside class="cta-artigo" aria-label="Falar com a nutricionista">\n'
            f'<p class="cta-artigo__eyebrow">{eyebrow}</p>\n'
            f'<p class="cta-artigo__titulo">{titulo}</p>\n'
            f'<p class="cta-artigo__texto">{texto}</p>\n'
            '<span class="cta-artigo__acao">\n'
            f'<a class="cta-artigo__btn" href="{WA_URL}" target="_blank" rel="noopener">Falar no WhatsApp</a>\n'
            '</span>\n</aside>')

TOP = card("Acompanhamento nutricional",
           "Um cuidado feito <em>para você</em>",
           "Cada história é diferente. Me conte a sua pelo WhatsApp e a gente vê qual a melhor forma de acompanhamento para o seu momento.")
MID = card("Acompanhamento nutricional",
           "Dá para comer bem <em>sem viver de dieta</em>",
           "Se quiser dar o próximo passo, fale comigo pelo WhatsApp e a gente encontra o formato que cabe na sua rotina.")

STRIP = re.compile(r'\n*<aside class="cta-(?:artigo|band)".*?</aside>\n*', re.S)

slugs = sys.argv[1:] or [os.path.splitext(os.path.basename(f))[0] for f in glob.glob(os.path.join(BASE, "*.md"))]
for slug in slugs:
    p = os.path.join(BASE, slug + ".md")
    if not os.path.exists(p): print("NAO EXISTE:", slug); continue
    txt = open(p, encoding="utf-8").read()
    m = re.match(r'^(---\n.*?\n---\n)(.*)$', txt, re.S)
    fm, body = m.group(1), m.group(2)
    body = STRIP.sub("\n\n", body)
    lines = body.split("\n")
    h2 = [i for i, l in enumerate(lines) if re.match(r'^##\s+\S', l)]
    if len(h2) < 4: print("POUCOS H2 (%d), pulei:" % len(h2), slug); continue
    top_at, mid_at = h2[1], h2[max(2, len(h2)//2)]
    for pos, blk in sorted([(mid_at, MID), (top_at, TOP)], key=lambda x: -x[0]):
        lines[pos:pos] = ["", blk, ""]
    open(p, "w", encoding="utf-8").write(fm + "\n".join(lines))
    print("OK:", slug)
