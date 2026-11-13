# Postavy z Danielových obrázků (kresba + skutečný materiál, pics/podklady-postavy/PROMPT-postavy.md):
#   kocour-KC.jpeg  6 póz kocoura (srst z jívových kočiček), mřížka 2×3 → assets/postavy/kocour-*.png
#   (ovce-OV1.jpeg  celé pózy ovcí, od 2026-11-13 nahrazené loutkou z dílů OV2b)
#   hrdina-H2.jpeg  díly hrdiny (hlavy, trup, ruka, noha) pro loutku → assets/postavy/hrdinaDily-*.png
#   hrdina-H3.jpeg  kloubové díly hrdiny (paže, předloktí, stehna, lýtka) → assets/postavy/hrdinaKlouby-*.png
#   ovce-OV2b.jpeg  díly ovce (těla, hlavy) pro loutku, dvě řady  → assets/postavy/ovceDily-*.png
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
    # díly ovce jako loutky (Daniel 2026-11-13, opravené OV2): těla mají ocásek vpravo → zrcadlit,
    # aby byl vzadu (hlavy koukají doprava). Kotva hlavy = střed spodku krku, těla = střed obrázku.
    'ovceDily': {
        'src': 'ovce-OV2b.jpeg', 'grid': 2,
        'poses': ['telo', 'hlava', 'beci', 'hlavaJehne', 'teloJehne', 'hlavaJehne2', 'hlavaBeran'],
        'right': [True] * 7,
        'mirror': ['telo', 'teloJehne'],
        'center': ['telo', 'teloJehne'],
        'ref': ('telo', 'w', 200),
    },
    # díly hrdiny jako loutky (Daniel 2026-11-13, prompt H2): tři hlavy s čepicí z troudnatce, trup, jedna
    # ruka a jedna noha (hra je kreslí dvakrát). Nápis „DÍLY LOUTKY“ nahoře vlevo se vynechá (minY).
    # Kotvy: hlava = spodek krku, trup = vršek krku, ruka = rameno, noha = kyčel (střed horního kraje).
    'hrdinaDily': {
        'src': 'hrdina-H2.jpeg', 'grid': 0, 'minY': 0.2,
        'poses': ['hlava', 'hlavaMzouri', 'hlavaLek', 'trup', 'ruka', 'noha'],
        'right': [True] * 6,
        'top': ['trup', 'ruka', 'noha'],
        'drop': ['trup', 'ruka', 'noha'],  # od H3 se berou jen hlavy
        'ref': ('noha', 'h', 240),
    },
    # kloubové díly hrdiny (Daniel 2026-11-13, prompt H3). Gemini díly částečně spojil, opravuje je fix_h3:
    # předloktí se vyříznou z ohnutých rukou (od lokte k dlani) a otočí dolů, bližší lýtko se odřízne od
    # ohnuté nohy, stehno se natočí svisle a bližší je zesvětlené vzdálené. Měřítko jako trup v H2.
    # Kotvy: trup = vršek krku, ostatní = střed horního kraje (rameno, loket, kyčel, koleno).
    'hrdinaKlouby': {
        'src': 'hrdina-H3.jpeg', 'grid': 2, 'fix': 'fix_h3',
        'poses': ['trup', 'paze', 'predlokti', 'paze2', 'predlokti2', 'stehno', 'lytko', 'stehno2', 'lytko2'],
        'right': [True] * 9,
        'top': ['trup', 'paze', 'predlokti', 'paze2', 'predlokti2', 'stehno', 'lytko', 'stehno2', 'lytko2'],
        'ref': ('trup', 'h', 207),
    },
}


def load(path):
    return cv2.imdecode(np.fromfile(path, np.uint8), cv2.IMREAD_COLOR)


def save(path, img):
    cv2.imencode('.png', img)[1].tofile(path)


def cut_sheet(img, grid, min_y=0.0):
    """Modré pozadí pryč; vrátí pózy (RGBA) v pořadí čtení: po řádcích zleva doprava."""
    corners = np.concatenate([img[:20, :20], img[:20, -20:], img[-20:, :20], img[-20:, -20:]]).reshape(-1, 3)
    bgc = np.median(corners, axis=0)
    dist = np.linalg.norm(img.astype(np.float32) - bgc, axis=2)
    fg = (dist > 60).astype(np.uint8) * 255
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, stats, cents = cv2.connectedComponentsWithStats(fg)
    big = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 4000 and cents[i][1] > min_y * img.shape[0]]
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


def trim(rgba):
    a = rgba[..., 3] > 8
    ys, xs = np.nonzero(a)
    return rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1].copy()


def keep(rgba, fn):
    """Vynuluje alfu tam, kde fn(x, y) neplatí (výřez dílu z většího kusu)."""
    out = rgba.copy()
    yy, xx = np.mgrid[0:out.shape[0], 0:out.shape[1]]
    out[..., 3][~fn(xx, yy)] = 0
    return trim(out)


def upright(rgba):
    """Natočí podlouhlý díl svisle (hlavní osa dolů, levý konec nahoru)."""
    ys, xs = np.nonzero(rgba[..., 3] > 128)
    pts = np.stack([xs, ys], 1).astype(np.float64)
    pts -= pts.mean(0)
    w, v = np.linalg.eigh(np.cov(pts.T))
    vx, vy = v[:, np.argmax(w)]
    if vx < 0:
        vx, vy = -vx, -vy
    theta = np.degrees(np.arctan2(vy, vx))
    pad = max(rgba.shape[:2])
    big = cv2.copyMakeBorder(rgba, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(0, 0, 0, 0))
    c = (big.shape[1] / 2, big.shape[0] / 2)
    m = cv2.getRotationMatrix2D(c, theta - 90, 1)
    return trim(cv2.warpAffine(big, m, (big.shape[1], big.shape[0]), flags=cv2.INTER_CUBIC))


def lighten(rgba, t):
    out = rgba.copy()
    out[..., :3] = (out[..., :3] * (1 - t) + 255 * t).astype(np.uint8)
    return out


def fix_h3(poses):
    """H3: 0 trup, 1 paže, 2 ohnutá ruka, 3 paže vzadu, 4 ohnutá ruka vzadu, 5 ohnutá noha + bližší
    lýtko, 6 stehno vzadu, 7 lýtko vzadu → trup, paže, předloktí, …, stehno, lýtko (bližší, vzdálené)."""
    trup, paze, ruka, paze2, ruka2, noha, stehno2, lytko2 = poses
    cw = lambda r: cv2.rotate(r, cv2.ROTATE_90_CLOCKWISE)
    predlokti = cw(keep(ruka, lambda x, y: x >= 95))
    predlokti2 = cw(keep(ruka2, lambda x, y: x >= 115))
    lytko = keep(noha, lambda x, y: (x >= 292) & ((y < 250) | (x >= 310)))
    stehno2 = upright(stehno2)
    stehno = lighten(stehno2, 0.18)
    return [trup, paze, predlokti, paze2, predlokti2, stehno, lytko, stehno2, lytko2]


def top_anchor(rgba):
    """Střed horního pásu (krk trupu, rameno, kyčel)."""
    a = rgba[..., 3] > 128
    ys, xs = np.nonzero(a)
    top = ys.min()
    band = a[top:int(top + (ys.max() - top) * 0.06) + 1]
    bx = np.nonzero(band.any(axis=0))[0]
    return int((bx.min() + bx.max()) / 2), int(top)


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
        poses = cut_sheet(load(PICS / cfg['src']), cfg['grid'], cfg.get('minY', 0))
        if 'fix' in cfg:
            poses = globals()[cfg['fix']](poses)
        assert len(poses) == len(cfg['poses']), f'{name}: čekám {len(cfg["poses"])} póz, našel jsem {len(poses)}'
        ref_pose, dim, size = cfg['ref']
        ref = poses[cfg['poses'].index(ref_pose)]
        k = size / (ref.shape[1] if dim == 'w' else ref.shape[0])
        sprity[name] = {}
        for pose, right, rgba in zip(cfg['poses'], cfg['right'], poses):
            if pose in cfg.get('drop', []):
                continue
            if pose in cfg.get('mirror', []):
                rgba = rgba[:, ::-1].copy()
            rgba = cv2.resize(rgba, (round(rgba.shape[1] * k), round(rgba.shape[0] * k)), interpolation=cv2.INTER_AREA)
            src = f'assets/postavy/{name}-{pose}.png'
            save(ROOT / src, rgba)
            if pose in cfg.get('center', []):
                ax, ay = rgba.shape[1] // 2, rgba.shape[0] // 2
            elif pose in cfg.get('top', []):
                ax, ay = top_anchor(rgba)
            else:
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
