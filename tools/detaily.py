"""Detaily do malých bublin stromu (Daniel 2026-11-24, pics/podklady-kvetina/detaily.png, gitignore).

Zdroj: jeden list 1254×1254 se semínky, džbánem a rampouchem na pergamenu. Výstup assets/sceny/detaily.jpg:
tři čtvercové dlaždice DLAZDICE px vedle sebe (semena, voda, rampouch = pořadí K.ITEMS). Rampouch je ve
zdroji vodorovně, otočí se špičkou dolů jako v HUD. Výřezy čte js/les.js (DETAIL_ART).
Spuštění z kořene projektu:  python tools/detaily.py
"""
import os

import numpy as np
from PIL import Image

DLAZDICE = 320
FEATHER = 60  # px ve zdroji
VYREZY = [  # (x0, y0, x1, y1) ve zdroji, otočení o 90° proti směru hodinek
    ((40, 150, 600, 740), False),    # semínka
    ((660, 30, 1245, 830), False),   # džbán s vodou
    ((60, 870, 1190, 1150), True),   # rampouch → špičkou dolů
]


def main():
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    src = Image.open('pics/podklady-kvetina/detaily.png').convert('RGB')
    out = Image.new('RGB', (DLAZDICE * 3, DLAZDICE))
    papers = []
    for i, (box, rot) in enumerate(VYREZY):
        part = src.crop(box)
        if rot:
            part = part.rotate(90, expand=True)
        # pergamen = medián okraje výřezu (rohy listu jsou tmavší); jím se výřez doplní do čtverce
        b = np.asarray(part, dtype=np.float32)
        edge = np.concatenate([b[:8].reshape(-1, 3), b[-8:].reshape(-1, 3), b[:, :8].reshape(-1, 3), b[:, -8:].reshape(-1, 3)])
        paper = tuple(int(v) for v in np.median(edge, axis=0))
        papers.append(paper)
        side = int(max(part.size) * 1.08)
        tile = Image.new('RGB', (side, side), paper)
        # okraje výřezu měkce do plochého pergamenu, ať není vidět obdélník
        w, h = part.size
        fx = np.minimum(np.arange(w), np.arange(w)[::-1]) / FEATHER
        fy = np.minimum(np.arange(h), np.arange(h)[::-1]) / FEATHER
        m = np.clip(np.minimum(fy[:, None], fx[None, :]), 0, 1)
        mask = Image.fromarray((m * m * (3 - 2 * m) * 255).astype(np.uint8))
        tile.paste(part, ((side - w) // 2, (side - h) // 2), mask)
        out.paste(tile.resize((DLAZDICE, DLAZDICE), Image.LANCZOS), (i * DLAZDICE, 0))
    paper = tuple(int(v) for v in np.median(np.array(papers), axis=0))
    out.save('assets/sceny/detaily.jpg', quality=86)
    print('detaily.jpg', os.path.getsize('assets/sceny/detaily.jpg') // 1024, 'kB, pergamen', paper)


if __name__ == '__main__':
    main()
