# Žába do studánky u božích muk (Daniel 2026-11-12): kresba + list, prompt Z v
# pics/podklady-muka/PROMPT-zaba.md.
#   pics/podklady-muka/zaba-Z.jpeg  5 póz na modrém pozadí:
#     1 sedí ospale (doprava), 2 stojí na zadních a dělá se větší (doprava), 3 (špatně, nepoužívá se),
#     4 vyděšená (doprava), 5 skok (doleva)
#   pics/podklady-muka/zaba-Z2.jpeg úprava téhož obrázku (2026-11-13), bere se z ní JEN póza 3:
#     cvrkne, hlava vlevo, zvednutý zadek vpravo (Gemini při úpravě překreslil i pózu 4, ta zůstává ze Z)
# Pózy vyřízne podle modré barvy, zmenší (výška 1. pózy = H1 px) a uloží jako assets/sceny/zaba-1..5.png.
# Vypíše kotvy (střed spodku = kde žába stojí; u skoku střed obrázku), stejná čísla jsou v js/muka.js.
# Spustit: python tools/zaba.py [--nahled cesta.png]
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'pics/podklady-muka/zaba-Z.jpeg'
SRC3 = ROOT / 'pics/podklady-muka/zaba-Z2.jpeg'  # póza 3 (stejné rozlišení i měřítko jako Z)
OUT = ROOT / 'assets/sceny'
H1 = 96  # výška ospalé žáby ve hře (px snímku 1920×1080)


def load(path):
    return cv2.imdecode(np.fromfile(path, np.uint8), cv2.IMREAD_COLOR)


def save(path, img):
    cv2.imencode('.png', img)[1].tofile(path)


def cut_sheet(img):
    """Modré pozadí pryč; vrátí pózy zleva doprava jako RGBA."""
    corners = np.concatenate([img[:20, :20], img[:20, -20:], img[-20:, :20], img[-20:, -20:]]).reshape(-1, 3)
    bgc = np.median(corners, axis=0)
    dist = np.linalg.norm(img.astype(np.float32) - bgc, axis=2)
    fg = (dist > 60).astype(np.uint8) * 255
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg)
    big = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 5000]
    big.sort(key=lambda i: stats[i, cv2.CC_STAT_LEFT])
    soft = np.clip((dist - 60) / 50, 0, 1)  # jpeg: měkký přechod do modré
    poses = []
    for i in big:
        m = (lab == i).astype(np.uint8) * 255
        # díry uvnitř obrysu (mezi nohama) zůstanou průhledné jen když jsou modré
        filled = m.copy()
        cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        cv2.drawContours(filled, cnts, -1, 255, -1)
        inner = cv2.erode(filled, np.ones((3, 3), np.uint8))
        alpha = (cv2.GaussianBlur(inner, (3, 3), 0) / 255.0) * soft
        alpha = (alpha * 255).astype(np.uint8)
        x, y, bw, bh = stats[i, :4]
        rgb = img.copy()
        # modrý lem na okraji: modrá nesmí převýšit červenou ani zelenou
        rgb[..., 0] = np.minimum(rgb[..., 0], np.maximum(rgb[..., 1], rgb[..., 2]))
        poses.append(np.dstack([rgb, alpha])[y:y + bh, x:x + bw].copy())
    return poses


def anchor(rgba, k):
    a = rgba[..., 3] > 128
    ys, xs = np.nonzero(a)
    if k == 5:  # skok: střed
        return int((xs.min() + xs.max()) / 2), int((ys.min() + ys.max()) / 2)
    bottom = ys.max()
    band = a[int(bottom - (bottom - ys.min()) * 0.15):bottom + 1]
    bx = np.nonzero(band.any(axis=0))[0]
    return int((bx.min() + bx.max()) / 2), int(bottom)


def main():
    poses = cut_sheet(load(SRC))
    assert len(poses) == 5, f'čekám 5 póz, našel jsem {len(poses)}'
    poses3 = cut_sheet(load(SRC3))
    assert len(poses3) == 5, f'{SRC3.name}: čekám 5 póz, našel jsem {len(poses3)}'
    poses[2] = poses3[2]
    scale = H1 / poses[0].shape[0]
    out, anchors = [], []
    for k, rgba in enumerate(poses, 1):
        rgba = cv2.resize(rgba, (round(rgba.shape[1] * scale), round(rgba.shape[0] * scale)), interpolation=cv2.INTER_AREA)
        save(OUT / f'zaba-{k}.png', rgba)
        anchors.append(anchor(rgba, k))
        out.append(rgba)
        print(k, rgba.shape[1], 'x', rgba.shape[0])
    print('měřítko', round(scale, 3))
    print('FROG_ANCHOR =', json.dumps(anchors))
    if '--nahled' in sys.argv:
        hh = max(p.shape[0] for p in out) + 20
        ww = sum(p.shape[1] + 20 for p in out)
        sheet = np.full((hh, ww, 3), 150, np.uint8)
        x = 10
        for p, (ax, ay) in zip(out, anchors):
            a = p[..., 3:] / 255.0
            roi = sheet[10:10 + p.shape[0], x:x + p.shape[1]]
            roi[:] = (roi * (1 - a) + p[..., :3] * a).astype(np.uint8)
            cv2.drawMarker(sheet, (x + ax, 10 + ay), (0, 0, 255), cv2.MARKER_CROSS, 12, 2)
            x += p.shape[1] + 20
        save(Path(sys.argv[sys.argv.index('--nahled') + 1]), cv2.resize(sheet, None, fx=3, fy=3, interpolation=cv2.INTER_NEAREST))


main()
