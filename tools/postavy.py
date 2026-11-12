# Babka a děda do kuchyně (Daniel 2026-11-12): kresba + lišejník, prompty v
# pics/podklady-kuchyne/PROMPT-postavy-lisejnik.md (B2, C2).
#   pics/podklady-kuchyne/babka-B2.png  5 póz babky na modrém pozadí (všechny hledí doprava)
#   pics/podklady-kuchyne/deda-C2.png   4 pózy dědy na modrém pozadí (3. hledí doprava → zrcadlí se;
#                                       4. se nezrcadlí, aby stolička zůstala vpravo jako u ostatních)
# Pózy vyřízne podle modré barvy, zmenší na velikost do hry a uloží jako
#   assets/sceny/kuchyne-babka-1..5.png a kuchyne-deda-1..4.png.
# Na konci vypíše pro každou pózu „kotvu“ (bod ve výřezu, který leží na podlaze), stejná čísla
# jsou v js/kuchyne.js (POSE_ANCHOR). Babka: paty (dole vlevo). Děda: pravá noha stoličky (dole vpravo).
# Spustit: python tools/postavy.py [--nahled cesta.png]
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
PICS = ROOT / 'pics/podklady-kuchyne'
OUT = ROOT / 'assets/sceny'

SHEETS = {
    # jméno: (soubor, výška 1. pózy ve hře v px, které pózy zrcadlit)
    'babka': ('babka-B2.png', 500, []),
    'deda': ('deda-C2.png', 590, [3]),
}


def load(path):
    return cv2.imdecode(np.fromfile(path, np.uint8), cv2.IMREAD_COLOR)


def save(path, img):
    cv2.imencode('.png', img)[1].tofile(path)


def cut_sheet(img):
    """Modré pozadí pryč; vrátí seznam (rgba, x0) póz zleva doprava."""
    h, w = img.shape[:2]
    corners = np.concatenate([img[:20, :20], img[:20, -20:], img[-20:, :20], img[-20:, -20:]]).reshape(-1, 3)
    bgc = np.median(corners, axis=0)
    dist = np.linalg.norm(img.astype(np.float32) - bgc, axis=2)
    fg = (dist > 70).astype(np.uint8) * 255
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg)
    big = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 20000]
    big.sort(key=lambda i: stats[i, cv2.CC_STAT_LEFT])
    # měkký okraj: alfa podle vzdálenosti od modré, o pixel dovnitř (bez modrého lemu)
    # (přísnější práh: tenká vlákna lišejníku smíchaná s modrou by jinak tvořila světlou chmýří)
    soft = np.clip((dist - 85) / 60, 0, 1)
    poses = []
    for i in big:
        m = (lab == i).astype(np.uint8) * 255
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
        # díry uvnitř obrysu (např. mezi nohou a stoličkou) nechá průhledné, malé zacelí
        inner = cv2.erode(m, np.ones((3, 3), np.uint8))
        alpha = (cv2.GaussianBlur(inner, (3, 3), 0) / 255.0) * soft
        alpha = (alpha * 255).astype(np.uint8)
        x, y, bw, bh = stats[i, :4]
        # modrý přesvit v lišejníku a na okrajích: modrá nesmí převýšit červenou ani zelenou
        rgb = img.copy()
        rgb[..., 0] = np.minimum(rgb[..., 0], np.maximum(rgb[..., 1], rgb[..., 2]))
        rgba = np.dstack([rgb, alpha])[y:y + bh, x:x + bw].copy()
        poses.append(rgba)
    return poses


def anchor(rgba, kind):
    a = rgba[..., 3] > 128
    ys, xs = np.nonzero(a)
    bottom = ys.max()
    band = a[int(bottom - (bottom - ys.min()) * 0.12):bottom + 1]
    bx = np.nonzero(band.any(axis=0))[0]
    ax = bx.min() if kind == 'babka' else bx.max()
    return int(round(ax)), int(bottom)


def main():
    result = {}
    previews = []
    for name, (file, h1, flip) in SHEETS.items():
        poses = cut_sheet(load(PICS / file))
        scale = h1 / poses[0].shape[0]
        result[name] = []
        for k, rgba in enumerate(poses, 1):
            if k in flip:
                rgba = rgba[:, ::-1].copy()
            rgba = cv2.resize(rgba, (round(rgba.shape[1] * scale), round(rgba.shape[0] * scale)), interpolation=cv2.INTER_AREA)
            save(OUT / f'kuchyne-{name}-{k}.png', rgba)
            ax, ay = anchor(rgba, name)
            result[name].append([ax, ay])
            previews.append(rgba)
        print(name, 'pózy', len(poses), 'měřítko', round(scale, 3))
    print('POSE_ANCHOR =', json.dumps(result))
    if '--nahled' in sys.argv:
        # všechny pózy vedle sebe na šedé, s křížkem v kotvě
        hh = max(p.shape[0] for p in previews) + 20
        ww = sum(p.shape[1] + 20 for p in previews)
        sheet = np.full((hh, ww, 3), 150, np.uint8)
        x = 10
        anchors = result['babka'] + result['deda']
        for p, (ax, ay) in zip(previews, anchors):
            a = p[..., 3:] / 255.0
            roi = sheet[10:10 + p.shape[0], x:x + p.shape[1]]
            roi[:] = (roi * (1 - a) + p[..., :3] * a).astype(np.uint8)
            cv2.drawMarker(sheet, (x + ax, 10 + ay), (0, 0, 255), cv2.MARKER_CROSS, 30, 3)
            x += p.shape[1] + 20
        save(Path(sys.argv[sys.argv.index('--nahled') + 1]), sheet)


main()
