"""Maska vody v potoce na pozadí lesa (assets/sceny/les.jpg) pro animaci proudu v js/les.js.

Výsledek: assets/sceny/les-voda.png — jen průhlednost (alfa = voda) ve výřezu VODA_BOX.
Voda = uvnitř ručně obkresleného koryta a zároveň šedá/bílá/modravá (ne mechově zelená ani hnědá).
Spuštění: python tools/voda_les.py   (po výměně pozadí lesa obkreslit koryto znovu)
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
BG = ROOT / 'assets' / 'sceny' / 'les.jpg'
OUT = ROOT / 'assets' / 'sceny' / 'les-voda.png'
BOX = (790, 840, 1200, 1080)  # stejné číslo je v js/les.js (VODA_BOX)
# koryto pod rozbitou lávkou (pozadí z 2026-11-08): voda mezi levým mechovým balvanem a velkým balvanem vpravo
KORYTO = [(815, 852), (870, 850), (930, 858), (985, 855), (990, 875), (950, 882), (945, 905), (962, 935),
          (1000, 962), (1022, 985), (1060, 1000), (1120, 1010), (1170, 1040), (1185, 1080), (815, 1080), (800, 1040),
          (812, 1000), (828, 960), (838, 920), (832, 890), (816, 870)]

# šedé kameny v korytě (vypadají jako voda, ale nesmí téct): střed x, y a poloosy
KAMENY = [(1012, 897, 62, 33)]

im = Image.open(BG).convert('RGB').crop(BOX)
a = np.asarray(im, dtype=np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
mx, mn = a.max(axis=2), a.min(axis=2)
sat = (mx - mn) / np.maximum(mx, 1)
green = g - (r + b) / 2
brown = r - b
water = np.clip((0.32 - sat) / 0.12, 0, 1) * np.clip((10 - green) / 8, 0, 1) * np.clip((22 - brown) / 12, 0, 1)

poly = Image.new('L', im.size, 0)
d = ImageDraw.Draw(poly)
d.polygon([(x - BOX[0], y - BOX[1]) for x, y in KORYTO], fill=255)
for x, y, rx, ry in KAMENY:
    d.ellipse([x - rx - BOX[0], y - ry - BOX[1], x + rx - BOX[0], y + ry - BOX[1]], fill=0)
poly = np.asarray(poly.filter(ImageFilter.GaussianBlur(4)), dtype=np.float32) / 255

m = Image.fromarray((np.clip(water * poly, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
out = Image.new('RGBA', im.size, (0, 0, 0, 0))
out.putalpha(m)
out.save(OUT, optimize=True)
print(f'{OUT.relative_to(ROOT)}  {OUT.stat().st_size // 1024} kB, výřez {BOX}')
