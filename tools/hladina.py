"""Studánka u Božích muk: větvičky a listí na hladině (Daniel 2026-11-23, Gemini podle
pics/podklady-muka/PROMPT-hladina.md) → výřezy.

Zdroje (gitignore): pics/podklady-muka/hladina-vetvicky.jpg (3 chomáče) a hladina-listy.jpg (8 listů
shora), oba na rovném šedém pozadí. Vyřezává se stejně jako větev v lese (tools/vetev.py cutout).
Výstup do assets/sceny:
- muka-vetvicky.webp  3 chomáče vedle sebe, zploštělé na pohled na hladinu z boku (CHOMAC_SQ),
                      ve dvojnásobku velikosti ve hře; obdélníky vypíše skript (VETVICKY v js/muka.js)
- muka-listy.webp     8 listů v jednom pruhu, shora (zploští je až hra podle natočení na hladině);
                      obdélníky vypíše skript (LISTY v js/muka.js)
Spuštění z kořene projektu:  python tools/hladina.py
"""
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vetev import cutout  # noqa: E402

SRC = 'pics/podklady-muka/'
LOUKA = (110, 100, 78)  # okolí studánky (rezavá tráva, šedé kameny, voda), assets/sceny/muka.jpg
CHOMAC_W = 150  # šířka chomáče ve hře (px snímku 1920×1080)
CHOMAC_SQ = 0.6  # zploštění: na hladinu se kouká šikmo z boku
LIST_W = 44  # délka listu v pruhu (hra ho kreslí menší)


def groups(alpha, axis_len, gap):
    """Rozdělí obrázek na skupiny podle prázdných sloupců (širších než gap)."""
    cols = alpha.sum(axis=0) > 0.5
    out, start, empty = [], None, 0
    for x in range(axis_len):
        if cols[x]:
            if start is None:
                start = x
            empty = 0
        elif start is not None:
            empty += 1
            if empty > gap:
                out.append((start, x - empty + 1))
                start, empty = None, 0
    if start is not None:
        out.append((start, axis_len))
    return out


def strip(parts, path):
    W = sum(p.width for p in parts) + 2 * len(parts)
    H = max(p.height for p in parts)
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    rects, x = [], 0
    for p in parts:
        im.paste(p, (x, 0))
        rects.append([x, 0, p.width, p.height])
        x += p.width + 2
    im.save(path, quality=88, method=6)
    print(os.path.basename(path), im.size, os.path.getsize(path) // 1024, 'kB')
    return rects


def split(path, gap, min_size):
    im, _, m = cutout(path, min_size, LOUKA, 0.12, holes=0)
    parts = []
    # řady listů (shora/zdola) a v nich skupiny po sloupcích
    rows = groups(m.T, m.shape[0], gap)
    for y0, y1 in rows:
        for x0, x1 in groups(m[y0:y1], m.shape[1], gap):
            p = im.crop((x0, y0, x1, y1))
            parts.append(p.crop(p.getbbox()))
    return parts


def main():
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    chomace = split(SRC + 'hladina-vetvicky.jpg', 30, 40)
    assert len(chomace) == 3, len(chomace)
    chomace = [p.resize((2 * CHOMAC_W, round(2 * CHOMAC_W * p.height / p.width * CHOMAC_SQ)), Image.LANCZOS) for p in chomace]
    print('VETVICKY =', strip(chomace, 'assets/sceny/muka-vetvicky.webp'))
    listy = split(SRC + 'hladina-listy.jpg', 30, 300)
    assert len(listy) == 8, len(listy)
    k = LIST_W / max(p.width for p in listy)
    listy = [p.resize((round(p.width * k), round(p.height * k)), Image.LANCZOS) for p in listy]
    print('LISTY =', strip(listy, 'assets/sceny/muka-listy.webp'))


if __name__ == '__main__':
    main()
