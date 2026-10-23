"""Compose share artwork from existing photographs and existing exhibition wording."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
assets = ROOT / 'assets'
canvas = Image.new('RGB', (1200, 630), '#050505')
for i in range(24):
    photo = Image.open(ROOT / 'installation/entrance-media-v2' / f'photo-{i:02d}.jpg')
    tile = ImageOps.fit(ImageOps.grayscale(photo).convert('RGB'), (174, 98))
    canvas.paste(tile, (63 + (i % 6)*180, 40 + (i // 6)*104))
draw = ImageDraw.Draw(canvas)
draw.rectangle((0, 460, 1200, 630), fill='#050505')
title = ImageFont.truetype(str(assets / 'Caslon.ttf'), 68)
subtitle = ImageFont.truetype(str(assets / 'Source-Regular.ttf'), 21)
draw.text((600, 482), 'The Third Era', font=title, fill='#f0efed', anchor='mt')
draw.text((600, 571), 'EXHIBITION', font=subtitle, fill='#c8c6c3', anchor='mt')
canvas.save(assets / 'exhibition-share.jpg', quality=92, optimize=True)

# A compact typographic mark, legible at favicon sizes; no synthetic imagery.
icon = Image.new('RGB', (512, 512), '#050505')
pen = ImageDraw.Draw(icon)
for x in (147, 251, 355):
    pen.rectangle((x-9, 137, x+9, 375), fill='#eeeae4')
    pen.rectangle((x-31, 137, x+31, 146), fill='#eeeae4')
    pen.rectangle((x-31, 366, x+31, 375), fill='#eeeae4')
icon.save(assets / 'exhibition-icon-512.png', optimize=True)
icon.resize((180, 180), Image.Resampling.LANCZOS).save(assets / 'exhibition-touch-icon.png', optimize=True)
icon.save(assets / 'exhibition.ico', sizes=[(16,16), (32,32), (48,48)])
