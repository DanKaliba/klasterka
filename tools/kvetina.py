"""Sněžná květina na vrchol (Daniel 2026-11-24, pics/podklady-kvetina/kvetina-faze.png, gitignore) → fáze růstu.

Zdroj: pět fází vedle sebe na rovném šedém pozadí (klíček, růžice, poupě, rozkvetlá, práší pyl), stejné
měřítko. Pozadí = barva blízko šedé z rohů. Kořeny a hlína se odstraní podle barvy (hnědá pod kořenovým
krčkem), protože květina roste z hrudky na vrcholu a kořeny prorůstají mezi spadlé listy.
Výstup assets/sceny/kvetina-faze.webp: pět buněk BUNKA_W × výška vedle sebe, krček každé fáze leží
uprostřed buňky na řádku KRCEK (čísla vypíše skript, js/vrchol.js je má v FAZE_*).
Spuštění z kořene projektu:  python tools/kvetina.py
"""
import os

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

MERITKO = 0.6
# fáze: sloupce ve zdroji a řádek kořenového krčku (pod ním se maže hnědá)
# vymazat ručně: světlý šmouh nad klasem fáze 5 (x0, y0, x1, y1 ve zdroji)
SMAZAT = [(1368, 40, 1400, 130)]
FAZE = [((33, 242), 748), ((261, 560), 772), ((582, 897), 776), ((921, 1257), 776), ((1285, 1629), 776)]


def main():
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    im = Image.open('pics/podklady-kvetina/kvetina-faze.png').convert('RGB')
    a = np.asarray(im, dtype=np.float32)
    corners = np.concatenate([a[:30, :30].reshape(-1, 3), a[:30, -30:].reshape(-1, 3), a[-30:, :30].reshape(-1, 3)])
    bg = np.median(corners, axis=0)
    dist = np.sqrt(((a - bg) ** 2).sum(axis=2))
    sat = a.max(axis=2) - a.min(axis=2)
    alpha = np.clip((np.maximum(dist - 14, sat * 2 - 10)) / 22, 0, 1)
    # šedý opar u pylu (bezbarvý, jen o kousek světlejší než pozadí) nepatří ke květině
    alpha *= np.where(sat < 15, np.clip((dist - 24) / 12, 0, 1), 1)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    brown = np.clip(((r - g) - 2) / 10, 0, 1) * np.clip(((r - b) - 15) / 15, 0, 1)
    # tmavá hlína a stíny kořenů (skoro černé, hnědý odstín se v nich ztratí)
    dark = np.clip((80 - (r + g + b) / 3) / 25, 0, 1)
    brown = np.maximum(brown, dark)
    rows = np.arange(a.shape[0])[:, None]
    for (x0, x1), krcek in FAZE:
        below = np.zeros_like(alpha, dtype=bool)
        below[:, x0:x1] = rows >= krcek - 6
        alpha[below] *= 1 - brown[below]
    for x0, y0, x1, y1 in SMAZAT:
        alpha[y0:y1, x0:x1] = 0
    fg = alpha > 0.5
    lab, n = ndimage.label(fg)
    sizes = ndimage.sum(fg, lab, range(1, n + 1))
    keep = np.isin(lab, 1 + np.flatnonzero(sizes > 30))
    keep = ndimage.binary_dilation(keep, iterations=2)
    alpha = alpha * keep
    # pod krčkem zbudou drobky hlíny: pryč všechno, co nesouvisí s listy nad krčkem
    for (x0, x1), krcek in FAZE:
        sub = alpha[:, x0:x1] > 0.3
        lab2, _ = ndimage.label(sub)
        above = set(np.unique(lab2[:krcek - 6])) - {0}
        alpha[:, x0:x1] *= np.isin(lab2, list(above)) | (np.arange(alpha.shape[0])[:, None] < krcek - 6)
    m = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))
    al = np.asarray(m, dtype=np.float32)[..., None] / 255
    col = np.where(al > 0.05, (a - bg * (1 - al)) / np.maximum(al, 0.05), a)
    out = Image.fromarray(col.clip(0, 255).astype(np.uint8))
    out.putalpha(m)

    # buňky: krček uprostřed, společný horní okraj a spodek
    A = np.asarray(m)
    parts = []
    for (x0, x1), krcek in FAZE:
        cx = x0 + int(np.average(np.arange(x1 - x0), weights=A[krcek - 40:krcek, x0:x1].sum(axis=0) + 1e-3))
        col_rows = np.where(A[:, x0:x1].max(axis=1) > 8)[0]
        parts.append((x0, x1, krcek, cx, col_rows.min(), col_rows.max()))
    top = min(p[4] for p in parts)
    half = max(max(cx - x0, x1 - cx) for x0, x1, _, cx, _, _ in parts) + 4
    bottom = max(p[5] for p in parts) + 4
    krcek_max = max(p[2] for p in parts)
    cell_w, cell_h = 2 * half, (krcek_max - top) + (bottom - krcek_max)
    sheet = Image.new('RGBA', (cell_w * len(parts), cell_h), (0, 0, 0, 0))
    for i, (x0, x1, krcek, cx, _, _) in enumerate(parts):
        # krček všech fází na stejný řádek (krcek_max - top)
        dy = krcek_max - krcek
        own = out.copy()  # sousední fáze do buňky nepatří
        own_a = np.asarray(own.getchannel('A')).copy()
        own_a[:, :x0] = 0
        own_a[:, x1:] = 0
        own.putalpha(Image.fromarray(own_a))
        piece = own.crop((cx - half, top - dy, cx + half, top - dy + cell_h))
        sheet.paste(piece, (i * cell_w, 0))
    w, h = round(sheet.width * MERITKO), round(sheet.height * MERITKO)
    sheet.resize((w, h), Image.LANCZOS).save('assets/sceny/kvetina-faze.webp', quality=88, method=6)
    vys4 = krcek_max - (parts[3][4] + (krcek_max - parts[3][2]))
    print('kvetina-faze.webp', (w, h), os.path.getsize('assets/sceny/kvetina-faze.webp') // 1024, 'kB')
    print('FAZE_W', round(cell_w * MERITKO), 'FAZE_KRCEK', round((krcek_max - top) * MERITKO),
          'FAZE_VYSKA (rozkvetlá nad krčkem)', round(vys4 * MERITKO))


if __name__ == '__main__':
    main()
