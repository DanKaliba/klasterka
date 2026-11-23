"""Větev na lávce v lese (Daniel 2026-11-23, Gemini podle pics/podklady-les/PROMPT-vetev.md) → výřezy.

Zdroje (gitignore): pics/podklady-les/vetev.jpg (větev se suchým bukovým listím) a vetev-listy.jpg
(12 samostatných listů na sypání). Oba jsou na rovném šedém pozadí. Výstup do assets/sceny:
- les-vetev.webp  větev, ořezaná, v dvojnásobku velikosti ve hře (hra ji kreslí na VETEV_K)
- les-listy.webp  listy vedle sebe v jednom pruhu; obdélníky vypíše skript (LISTY v js/les.js)
Vypíše i středy shluků listí na větvi (odkud se při stažení sypou listy, VETEV_LISTI v js/les.js).
Barvy se trochu přiblíží mlze ve scéně (MLHA), ať větev nesvítí víc než kmeny lávky.
Spuštění z kořene projektu:  python tools/vetev.py
"""
import os

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = 'pics/podklady-les/'
VETEV_W = 300  # šířka větve ve hře (px snímku 1920×1080)
LIST_W = 34  # délka listu v pruhu (hra ho kreslí menší)
MLHA = np.array([100.0, 98.0, 90.0])  # průměrná barva lesa kolem lávky (assets/sceny/les.jpg)
MLHA_K = 0.12  # kolik mlhy přimíchat
DESAT = 0.15  # o kolik ubrat sytost


def cutout(path, min_size, mlha=MLHA, mlha_k=MLHA_K, holes=600):
    """RGBA bez šedého pozadí: maska podle vzdálenosti od šedé a sytosti, malé díry v kůře zaplněné.
    Barvy se o mlha_k přiblíží barvě mlha (okolí ve scéně). Díry menší než holes px se zaplní (kůra);
    u chomáčů stébel holes=0, mezery mezi nimi jsou skutečné pozadí. Používá i tools/hladina.py."""
    a = np.asarray(Image.open(path).convert('RGB'), dtype=np.float32)
    h, w, _ = a.shape
    edge = np.concatenate([a[:15].reshape(-1, 3), a[-15:].reshape(-1, 3), a[:, :15].reshape(-1, 3), a[:, -15:].reshape(-1, 3)])
    bg = np.median(edge, axis=0)
    dist = np.sqrt(((a - bg) ** 2).sum(axis=2))
    sat = a.max(axis=2) - a.min(axis=2)
    alpha = np.clip((np.maximum(dist - 10, sat * 2 - 8)) / 18, 0, 1)
    fg = alpha > 0.5
    # díry uvnitř kůry (šedé skvrny blízko pozadí) zaplnit, velké uzavřené plochy pozadí nechat
    holes_m = ndimage.binary_fill_holes(fg) & ~fg
    lab, n = ndimage.label(holes_m)
    if n and holes:
        sizes = ndimage.sum(holes_m, lab, range(1, n + 1))
        alpha = np.maximum(alpha, np.isin(lab, 1 + np.flatnonzero(sizes < holes)).astype(np.float32))
    fg = alpha > 0.5
    lab, n = ndimage.label(fg)
    sizes = ndimage.sum(fg, lab, range(1, n + 1))
    keep = np.isin(lab, 1 + np.flatnonzero(sizes > min_size))
    alpha *= ndimage.binary_dilation(keep, iterations=2)
    m = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)), dtype=np.float32) / 255
    al = m[..., None]
    col = np.where(al > 0.05, (a - bg * (1 - al)) / np.maximum(al, 0.05), a)  # šedý lem pryč
    grey = col.mean(axis=2, keepdims=True)
    col = col + (grey - col) * DESAT
    col = col * (1 - mlha_k) + np.asarray(mlha) * mlha_k
    out = Image.fromarray(col.clip(0, 255).astype(np.uint8))
    out.putalpha(Image.fromarray((m * 255).astype(np.uint8)))
    return out, sat, m


def main():
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    # větev
    im, sat, m = cutout(SRC + 'vetev.jpg', 300)
    box = im.getbbox()
    im = im.crop(box)
    k = 2 * VETEV_W / im.width
    big = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    big.save('assets/sceny/les-vetev.webp', quality=88, method=6)
    print('les-vetev.webp', big.size, os.path.getsize('assets/sceny/les-vetev.webp') // 1024, 'kB')
    # shluky listí (oranžové = syté) → středy v px výřezu ve hře (polovina velikosti souboru)
    leafy = (sat > 45) & (m > 0.5)
    leafy = leafy[box[1]:box[3], box[0]:box[2]]
    lab, n = ndimage.label(ndimage.binary_dilation(leafy, iterations=4))
    sizes = ndimage.sum(leafy, lab, range(1, n + 1))
    cs = ndimage.center_of_mass(leafy, lab, 1 + np.flatnonzero(sizes > 300))
    # levá třetina je kmen s třískami (nažloutlé dřevo), listí je jen dál vpravo
    pts = sorted((round(x * k / 2), round(y * k / 2)) for y, x in cs if x * k / 2 > VETEV_W / 3)
    print('VETEV_LISTI =', [list(p) for p in pts])
    # listy na sypání
    im, _, m = cutout(SRC + 'vetev-listy.jpg', 500)
    lab, n = ndimage.label(m > 0.3)
    parts = []
    for sl in ndimage.find_objects(lab):
        if sl is None:
            continue
        y, x = sl
        if (y.stop - y.start) * (x.stop - x.start) < 2000:
            continue
        parts.append(im.crop((x.start, y.start, x.stop, y.stop)))
    # list ležící na šířku má délku = šířka, list nastojato (z boku) = výška
    k = LIST_W / max(max(p.size) for p in parts)
    parts = [p.resize((max(1, round(p.width * k)), max(1, round(p.height * k))), Image.LANCZOS) for p in parts]
    W = sum(p.width for p in parts) + 2 * len(parts)
    H = max(p.height for p in parts)
    strip = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    rects, x = [], 0
    for p in parts:
        strip.paste(p, (x, 0))
        rects.append([x, 0, p.width, p.height])
        x += p.width + 2
    strip.save('assets/sceny/les-listy.webp', quality=90, method=6, lossless=False)
    print('les-listy.webp', strip.size, len(parts), 'listů')
    print('LISTY =', rects)


if __name__ == '__main__':
    main()
