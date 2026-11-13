# Postavy z Danielových obrázků (kresba + skutečný materiál, pics/podklady-postavy/PROMPT-postavy.md):
#   kocour-KC.jpeg  6 póz kocoura (srst z jívových kočiček), mřížka 2×3 → assets/postavy/kocour-*.png
#   ovce-OV1.jpeg   6 póz ovcí (tělo z kotrče), jedna řada         → assets/postavy/ovce-*.png
# Pózy vyřízne podle modrého pozadí, zmenší na referenční velikost a zapíše js/sprity.js
# (K.SPRITY: zdroj, kotva = střed spodku tlap/kopyt, rozměry, kam póza kouká).
# Spustit: python tools/sprity.py [--nahled cesta.png]
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
PICS = ROOT / 'pics/podklady-postavy'
OUT = ROOT / 'assets/postavy'

SETS = {
    # jméno: zdroj, rozložení, názvy póz, kam koukají (True = doprava), referenční póza a její cílová
    # šířka/výška v px (ve hře se pak měřítko počítá z téhle reference)
    'kocour': {
        'src': 'kocour-KC.jpeg', 'grid': 3,
        'poses': ['sleep', 'stretch', 'walk', 'leap', 'sniff', 'sit'],
        'right': [True, False, True, True, True, True],
        'ref': ('walk', 'w', 190),
    },
    'ovce': {
        'src': 'ovce-OV1.jpeg', 'grid': 0,
        'poses': ['stand', 'graze', 'walk', 'bleat', 'lamb', 'ram'],
        'right': [True, True, True, True, True, True],
        'ref': ('stand', 'h', 160),
    },
}


def load(path):
    return cv2.imdecode(np.fromfile(path, np.uint8), cv2.IMREAD_COLOR)


def save(path, img):
    cv2.imencode('.png', img)[1].tofile(path)


def cut_sheet(img, grid):
    """Modré pozadí pryč; vrátí pózy (RGBA) v pořadí čtení: po řádcích zleva doprava."""
    corners = np.concatenate([img[:20, :20], img[:20, -20:], img[-20:, :20], img[-20:, -20:]]).reshape(-1, 3)
    bgc = np.median(corners, axis=0)
    dist = np.linalg.norm(img.astype(np.float32) - bgc, axis=2)
    fg = (dist > 60).astype(np.uint8) * 255
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, stats, cents = cv2.connectedComponentsWithStats(fg)
    big = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 4000]
    rows = (lambda i: int(cents[i][1] // (img.shape[0] / grid))) if grid else (lambda i: 0)
    big.sort(key=lambda i: (rows(i), stats[i, cv2.CC_STAT_LEFT]))
    soft = np.clip((dist - 60) / 50, 0, 1)
    rgb = img.copy()
    rgb[..., 0] = np.minimum(rgb[..., 0], np.maximum(rgb[..., 1], rgb[..., 2]))  # modrý lem pryč
    poses = []
    for i in big:
        m = (lab == i).astype(np.uint8) * 255
        filled = m.copy()
        cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        cv2.drawContours(filled, cnts, -1, 255, -1)
        inner = cv2.erode(filled, np.ones((3, 3), np.uint8))
        alpha = ((cv2.GaussianBlur(inner, (3, 3), 0) / 255.0) * soft * 255).astype(np.uint8)
        x, y, bw, bh = stats[i, :4]
        poses.append(np.dstack([rgb, alpha])[y:y + bh, x:x + bw].copy())
    return poses


def anchor(rgba):
    """Střed spodního pásu (tlapy, kopyta) = kde postava stojí."""
    a = rgba[..., 3] > 128
    ys, xs = np.nonzero(a)
    bottom = ys.max()
    band = a[int(bottom - (bottom - ys.min()) * 0.12):bottom + 1]
    bx = np.nonzero(band.any(axis=0))[0]
    return int((bx.min() + bx.max()) / 2), int(bottom)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sprity, previews = {}, []
    for name, cfg in SETS.items():
        poses = cut_sheet(load(PICS / cfg['src']), cfg['grid'])
        assert len(poses) == len(cfg['poses']), f'{name}: čekám {len(cfg["poses"])} póz, našel jsem {len(poses)}'
        ref_pose, dim, size = cfg['ref']
        ref = poses[cfg['poses'].index(ref_pose)]
        k = size / (ref.shape[1] if dim == 'w' else ref.shape[0])
        sprity[name] = {}
        for pose, right, rgba in zip(cfg['poses'], cfg['right'], poses):
            rgba = cv2.resize(rgba, (round(rgba.shape[1] * k), round(rgba.shape[0] * k)), interpolation=cv2.INTER_AREA)
            src = f'assets/postavy/{name}-{pose}.png'
            save(ROOT / src, rgba)
            ax, ay = anchor(rgba)
            sprity[name][pose] = {'src': src, 'w': rgba.shape[1], 'h': rgba.shape[0], 'ax': ax, 'ay': ay, 'right': right}
            previews.append((rgba, ax, ay))
        print(name, 'měřítko', round(k, 3), {p: (v['w'], v['h']) for p, v in sprity[name].items()})
    js = ('// Vygenerováno skriptem tools/sprity.py — neupravovat ručně, spustit ho znovu.\n'
          '// Postavy z obrázků: kotva (ax, ay) = střed spodku tlap/kopyt, right = póza kouká doprava.\n'
          'K.SPRITY = ' + json.dumps(sprity, indent=1, ensure_ascii=False) + ';\n')
    (ROOT / 'js/sprity.js').write_text(js, encoding='utf-8')
    if '--nahled' in sys.argv:
        hh = max(p.shape[0] for p, _, _ in previews) + 20
        ww = sum(p.shape[1] + 20 for p, _, _ in previews)
        sheet = np.full((hh, ww, 3), 120, np.uint8)
        x = 10
        for p, ax, ay in previews:
            a = p[..., 3:] / 255.0
            roi = sheet[10:10 + p.shape[0], x:x + p.shape[1]]
            roi[:] = (roi * (1 - a) + p[..., :3] * a).astype(np.uint8)
            cv2.drawMarker(sheet, (x + ax, 10 + ay), (0, 0, 255), cv2.MARKER_CROSS, 14, 2)
            x += p.shape[1] + 20
        save(Path(sys.argv[sys.argv.index('--nahled') + 1]), sheet)


main()
