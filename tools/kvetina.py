"""Sněžná květina na planinu (Daniel 2026-11-09, pics/podklady-kvetina/kvetina.jpg, gitignore) → výřezy.

Zdroj je na rovném šedém pozadí: pozadí = barva blízko šedé z rohů, bez sytosti. Výstup do assets/sceny:
- kvetina.webp      celá rostlina (růžice listů s klasem)
(detail klasu zvonků na přiblížení: přidat do VYREZY 'kvetina-klas.webp': (815, 0, 1190, 768))
Spuštění z kořene projektu:  python tools/kvetina.py
"""
import os

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

VYREZY = {'kvetina.webp': (90, 20, 700, 750)}


def main():
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    im = Image.open('pics/podklady-kvetina/kvetina.jpg').convert('RGB')
    a = np.asarray(im, dtype=np.float32)
    corners = np.concatenate([a[:20, :20].reshape(-1, 3), a[:20, -20:].reshape(-1, 3), a[-20:, 600:700].reshape(-1, 3)])
    bg = np.median(corners, axis=0)
    dist = np.sqrt(((a - bg) ** 2).sum(axis=2))
    sat = a.max(axis=2) - a.min(axis=2)
    # rostlina: dál od šedé, nebo barevná; měkký přechod kvůli jinovatce na okrajích listů
    alpha = np.clip((np.maximum(dist - 14, sat * 2 - 10)) / 22, 0, 1)
    fg = alpha > 0.5
    lab, n = ndimage.label(fg)
    sizes = ndimage.sum(fg, lab, range(1, n + 1))
    keep = np.isin(lab, 1 + np.flatnonzero(sizes > 400))
    keep = ndimage.binary_dilation(keep, iterations=3)
    alpha = alpha * keep
    m = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))
    # okraj: šedé pozadí prosvítá v poloprůhledných pixelech → odečíst ho (barva = (c − bg·(1−α)) / α)
    al = np.asarray(m, dtype=np.float32)[..., None] / 255
    col = np.where(al > 0.05, (a - bg * (1 - al)) / np.maximum(al, 0.05), a)
    out = Image.fromarray(col.clip(0, 255).astype(np.uint8))
    out.putalpha(m)
    for name, box in VYREZY.items():
        part = out.crop(box)
        part = part.crop(part.getbbox())
        part.save('assets/sceny/' + name, quality=88, method=6)
        print(name, part.size, os.path.getsize('assets/sceny/' + name) // 1024, 'kB')


if __name__ == '__main__':
    main()
