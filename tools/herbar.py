"""Herbář sněžné květiny → bublina stromu. Od 2026-11-24 Danielův list 2×2 (pics/podklady-kvetina/herbar2.png,
gitignore): zasazení, růžice, rozkvetlá květina, pyl nad horami. Původní list z 2026-11-09 je herbar.jpg.

Výstup do assets/sceny:
- herbar.jpg           pergamen se čtyřmi kroky, STRANA px (výřezy kroků v js/les.js, PLAN_STEPS)
- herbar-vybledly.jpg  totéž vybledlé (kresba skoro splývá s pergamenem); hra na něj postupně
                       „vpije“ jednotlivé kroky z herbar.jpg (oblasti KROKY v js/les.js)
Spuštění z kořene projektu:  python tools/herbar.py
"""
import os

import numpy as np
from PIL import Image, ImageFilter

OREZ = (0, 0, 1254, 1254)  # celý list; js/les.js má výřezy v souřadnicích zdroje (HERBAR_K = STRANA / 1254)
STRANA = 900


def main():
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    im = Image.open('pics/podklady-kvetina/herbar2.png').convert('RGB').crop(OREZ).resize((STRANA, STRANA), Image.LANCZOS)
    im.save('assets/sceny/herbar.jpg', quality=86)
    a = np.asarray(im, dtype=np.float32)
    # pergamen bez kresby ≈ hodně rozmazaný obrázek (skvrny zůstanou, tenké tahy zmizí)
    paper = np.asarray(im.filter(ImageFilter.MedianFilter(25)).filter(ImageFilter.GaussianBlur(40)), dtype=np.float32)
    faded = a * 0.09 + paper * 0.91
    Image.fromarray(faded.clip(0, 255).astype(np.uint8)).save('assets/sceny/herbar-vybledly.jpg', quality=86)
    for f in ('herbar.jpg', 'herbar-vybledly.jpg'):
        print(f, os.path.getsize('assets/sceny/' + f) // 1024, 'kB')


if __name__ == '__main__':
    main()
