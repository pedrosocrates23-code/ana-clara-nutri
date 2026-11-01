# Recorta as fontes variáveis do Fontsource para o que o site usa (01/11/2026).
# Subconjunto de caracteres ANTES de instanciar o eixo (a ordem inversa quebra o fontTools 4.63).
# Uso: python scripts/subset-fonts.py   (saída em src/assets/fonts/)
import io, os, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset
sys.stdout.reconfigure(encoding='utf-8')
U = "U+0020-007E,U+00A0-00FF,U+0152-0153,U+2013-2014,U+2018-201A,U+201C-201E,U+2022,U+2026,U+2032-2033,U+2039-203A,U+20AC,U+2122,U+2190-2193,U+2197,U+00B7"
JOBS = [
    ('node_modules/@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2', 'src/assets/fonts/newsreader-300-400.woff2', (300, 400)),
    ('node_modules/@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2', 'src/assets/fonts/hanken-grotesk-400-650.woff2', (400, 650)),
]
for src, dst, (a, b) in JOBS:
    f = TTFont(src)
    o = subset.Options(); o.layout_features = ['*']; o.name_IDs = ['*']; o.notdef_outline = True
    s = subset.Subsetter(o); s.populate(unicodes=subset.parse_unicodes(U)); s.subset(f)
    buf = io.BytesIO(); f.flavor = None; f.save(buf); buf.seek(0)
    f = instancer.instantiateVariableFont(TTFont(buf), {'wght': (a, b)}, updateFontNames=False)
    f.flavor = 'woff2'; f.save(dst)
    print(f'{os.path.basename(dst)}: {os.path.getsize(dst) / 1024:.1f} KB')
