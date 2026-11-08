"""Pozadí lesa s rozbitou lávkou (Daniel 2026-11-08) → obrázky do hry.

Zdroj (gitignore): pics/les-lavka/A-pred.png (souška stojí) a B-po.png (souška leží přes mezeru; jinak
stejný obrázek, vygenerovaný úpravou A). Výstup do assets/sceny:
- les.jpg      A zvětšené na 1920×1080 (pozadí scény)
- les-po.jpg   B zvětšené (po pádu soušky se na něj prolne)
- les-souska.png  výřez soušky z A (kmen nad kořenovým krčkem, bez kořenů), poloha v SOUSKA_BOX
- les-za-souskou.png  totéž místo z B (mlha a les za souškou), záplata pod padající kmen

Tvar soušky = kde se A a B liší (v B na jejím místě je jen mlha), jen uvnitř obrysu OBRYS.
Spuštění z kořene projektu:  python tools/les_lavka.py   (souřadnice SOUSKA_BOX jsou i v js/les.js)
"""
import os

import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw, ImageFilter

W, H = 1920, 1080
SOUSKA_BOX = (1220, 0, 1480, 530)  # x0, y0, x1, y1 — stejné číslo v js/les.js
KRCEK = 522  # kmen se ulomí / vyvrátí nad kořeny; kořeny zůstanou v A až do prolnutí na B
OBRYS = [(1262, 0), (1320, 0), (1375, 30), (1380, 90), (1410, 180), (1430, 330), (1430, 420), (1458, KRCEK),
         (1372, KRCEK), (1352, 420), (1290, 370), (1280, 240), (1250, 130), (1240, 60), (1262, 40)]


def main():
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    a = Image.open('pics/les-lavka/A-pred.png').convert('RGB').resize((W, H), Image.LANCZOS)
    b = Image.open('pics/les-lavka/B-po.png').convert('RGB').resize((W, H), Image.LANCZOS)
    a.save('assets/sceny/les.jpg', quality=88)
    b.save('assets/sceny/les-po.jpg', quality=88)

    box = SOUSKA_BOX
    ac, bc = a.crop(box), b.crop(box)
    blur = lambda im: np.asarray(im.filter(ImageFilter.GaussianBlur(1.5)), dtype=np.float32)
    diff = np.abs(blur(ac) - blur(bc)).sum(axis=2)
    poly = Image.new('L', ac.size, 0)
    ImageDraw.Draw(poly).polygon([(x - box[0], y - box[1]) for x, y in OBRYS], fill=255)
    m = Image.fromarray(((diff > 42) * 255).astype(np.uint8))
    m = m.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3))  # zacelit díry v kmeni
    m = np.minimum(np.asarray(m), np.asarray(poly)) > 0
    # jen kmen s pahýly větví (největší souvislý kus), ne cákance mlhy, ve kterých se A a B taky liší
    lab, n = ndimage.label(m)
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    m = Image.fromarray(((lab == 1 + int(np.argmax(sizes))) * 255).astype(np.uint8))
    m = m.filter(ImageFilter.GaussianBlur(1.2))
    sprite = ac.copy()
    # výřez o kus užší, ať po padající soušce nezůstává světlý lem mlhy
    sprite.putalpha(m.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1)))
    sprite.save('assets/sceny/les-souska.png', optimize=True)
    # záplata o kus širší než souška, ať po ní nezůstane světlý obrys
    zm = m.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(3))
    patch = bc.copy()
    patch.putalpha(zm)
    patch.save('assets/sceny/les-za-souskou.png', optimize=True)
    for f in ('les.jpg', 'les-po.jpg', 'les-souska.png', 'les-za-souskou.png'):
        print(f, os.path.getsize('assets/sceny/' + f) // 1024, 'kB')


if __name__ == '__main__':
    main()
