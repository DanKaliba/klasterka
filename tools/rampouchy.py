"""Rampouchy pod lávkou v lese (Daniel 2026-11-25, Gemini podle pics/podklady-les/PROMPT-rampouchy.md) → výřezy.

Zdroj (gitignore): pics/podklady-les/rampouchy.png, pět rampouchů vedle sebe na rovném šedém pozadí.
Výstup assets/sceny/les-rampouchy.webp: pět výřezů vedle sebe, každý ve dvojnásobku velikosti ve hře
(výška VYSKA_HRA × 2, šířka podle poměru stran). Horní okraj se vytrácí, ať rampouch vyrůstá z kmene
a nevidět uříznutou hranu. Obdélníky vypíše skript (ICICLE_RECTS v js/les.js).
Spuštění z kořene projektu:  python tools/rampouchy.py
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vetev import cutout, strip  # noqa: E402

VYSKA_HRA = 110  # průměrná výška rampouchu ve hře (px snímku 1920×1080); soubor je ve dvojnásobku
VYTRATIT = 0.14  # kolik výšky shora se vytrácí do průhledna


def main():
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    # led je průsvitný a barvou blízko šedé: bez přimíchané mlhy a s větším zaplněním děr
    im, _, m = cutout('pics/podklady-les/rampouchy.png', 2000, mlha_k=0.05, holes=20000)
    mask = m > 0.3
    lab, n = ndimage.label(mask)
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    top5 = 1 + np.argsort(sizes)[-5:]
    objs = [ndimage.find_objects(lab)[i - 1] for i in top5]
    objs.sort(key=lambda s: s[1].start)
    heights = [s[0].stop - s[0].start for s in objs]
    k = 2 * VYSKA_HRA / (sum(heights) / len(heights))
    parts = []
    for y, x in objs:
        p = im.crop((x.start, y.start, x.stop, y.stop))
        a = np.asarray(p.getchannel('A')).astype(np.float32)
        fade = np.clip(np.arange(a.shape[0]) / (a.shape[0] * VYTRATIT), 0, 1)[:, None]
        p.putalpha(Image.fromarray((a * fade).astype(np.uint8)))
        parts.append(p.resize((max(1, round(p.width * k)), max(1, round(p.height * k))), Image.LANCZOS))
    print('ICICLE_RECTS =', strip(parts, 'assets/sceny/les-rampouchy.webp', quality=90))


if __name__ == '__main__':
    main()
