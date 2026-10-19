"""Generate the repo-native social vector from the shipped, licensed fonts."""
from pathlib import Path
from base64 import b64encode
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

root = Path(__file__).resolve().parents[1] / 'public' / 'assets'
sans = instantiateVariableFont(TTFont(root / 'fonts/manrope-latin.woff2'), {'wght': 700})
serif = TTFont(root / 'fonts/instrument-serif-italic.woff2')
parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="Virtelon. Your business is moving. Your systems should too.">', '<rect width="1200" height="630" fill="#181919"/>']
def line(text, font, size, x, y, color):
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    scale = size / font['head'].unitsPerEm
    for char in text:
        glyph = glyphs[cmap[ord(char)]]
        pen = SVGPathPen(glyphs)
        glyph.draw(TransformPen(pen, (scale, 0, 0, -scale, x, y)))
        parts.append(f'<path fill="{color}" d="{pen.getCommands()}"/>')
        x += glyph.width * scale
line('Virtelon', sans, 32, 84, 96, '#F4F0E7')
line('Your business is moving.', sans, 64, 84, 264, '#F4F0E7')
line('Your systems should too.', serif, 76, 84, 364, '#F4F0E7')
parts.append('<path d="M84 438H1116" stroke="#646965"/>')
line('Creative. Technology. Systems.', sans, 22, 84, 497, '#F4BB62')
line('Custom software, AI automation and digital products.', sans, 20, 84, 551, '#C6CAC8')
mark = b64encode((root / 'virtelon-mark.png').read_bytes()).decode()
parts.append(f'<image href="data:image/png;base64,{mark}" x="1020" y="62" width="64" height="53"/>')
parts.append('</svg>')
(root / 'social-card.svg').write_text(''.join(parts))
