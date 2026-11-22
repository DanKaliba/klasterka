# Postavy z Danielových obrázků (kresba + skutečný materiál, pics/podklady-postavy/PROMPT-postavy.md):
#   kocour-KC.jpeg  6 póz kocoura (srst z jívových kočiček), mřížka 2×3 → assets/postavy/kocour-*.png
#   (ovce-OV1.jpeg  celé pózy ovcí, od 2026-11-13 nahrazené loutkou z dílů OV2b)
#   hrdina-L2.png   kluk v klobouku: klobouk, hlava, trup, paže, předloktí, ruce → assets/postavy/hrdinaL2-*.png
#   hrdina-L3.png   jeho stehno, lýtko, chodidlo → assets/postavy/hrdinaL3-*.png
#   (hrdina-H2/H3, kluk s čepicí z troudnatce, nahrazený 2026-11-22)
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
    # tetřívek na vrcholu (Daniel 2026-11-13, prompt T v pics/podklady-vrchol/PROMPT-vrchol.md): 5 póz,
    # všechny koukají doleva (sedí, toká s vějířem, tahá kartu zobákem, načepýřený poražený, odlétá)
    'tetrivek': {
        'src': '../podklady-vrchol/tetrivek-T.png', 'grid': 0,
        'poses': ['sit', 'display', 'pluck', 'sulk', 'fly'],
        'right': [False] * 5,
        'ref': ('display', 'h', 330),
    },
    # karty na oko bere (Daniel 2026-11-13, prompt KA): jeden obrázek na barvu, 6 karet v řadě. Gemini kreslí
    # puntíky v rozích v nesprávné barvě a počtu, proto je fix_karty z rohů vygumuje (inpaint) a hra je
    # dokreslí sama. Kotva = střed karty; ve hře se karta kreslí do obdélníku CARD_W × CARD_H.
    'kartyZvirata': {
        'src': '../podklady-vrchol/karty-zvirata.png', 'grid': 0, 'fix': 'fix_karty',
        'poses': ['sykora', 'vyr', 'tetrev', 'liska', 'jelen', 'medved'],
        'right': [True] * 6,
        'center': ['sykora', 'vyr', 'tetrev', 'liska', 'jelen', 'medved'],
        'ref': ('sykora', 'h', 360),
    },
    # Krakonoš jako Rübezahl z Helwigovy mapy (Daniel 2026-11-18, prompt KK), žolík; rohy jsou prázdné
    'kartaKrakonos': {
        'src': '../podklady-vrchol/karta-krakonos-KK.png', 'grid': 0,
        'poses': ['krakonos'],
        'right': [True],
        'center': ['krakonos'],
        'ref': ('krakonos', 'h', 360),
    },
    # rub karty (pera) z obrázku KR; lísková rabuše z téhož obrázku se nepoužívá (nahradila ji rabuse2)
    'vrcholVeci': {
        'src': '../podklady-vrchol/rub-rabuse.png', 'grid': 0,
        'poses': ['rub', 'rabuse'],
        'right': [True, True],
        'center': ['rub', 'rabuse'],
        'drop': ['rabuse'],  # stará lísková rabuše, nahradila ji rabuse2
        'ref': ('rub', 'h', 360),
    },
    # rabuše jako grónská dřevěná mapa (Daniel 2026-11-18, prompt KR2, pokus 2): nahoře celá rabuše
    # s vyřezanými zuby (změřené v knobs), dole tatáž zlomená na dva kusy a kamínek. Hra hodí kamínek
    # na zub podle součtu karet; zlomené kusy ukáže, když ji tetřívek zlomí.
    'rabuse2': {
        'src': '../podklady-vrchol/rabuse-KR2b.png', 'grid': 2, 'fix': 'fix_rabuse2',
        'poses': ['rabuse', 'zlomenaL', 'zlomenaP', 'kaminek'],
        'right': [True] * 4,
        'center': ['rabuse', 'zlomenaL', 'zlomenaP', 'kaminek'],
        'knobs': ['rabuse'], 'knobCount': 22,
        'ref': ('rabuse', 'w', 800),
    },
    'kartyRostlinyPovolani': {
        'src': '../podklady-vrchol/karty-rostliny-povolani.png', 'grid': 2, 'fix': 'fix_karty',
        'poses': ['boruvka', 'prha', 'horec', 'jerab', 'kosodrevina', 'smrk',
                  'ovcak', 'drevorubec', 'tkadlec', 'hornik', 'sklar', 'ucitel'],
        'right': [True] * 12,
        'center': ['boruvka', 'prha', 'horec', 'jerab', 'kosodrevina', 'smrk',
                   'ovcak', 'drevorubec', 'tkadlec', 'hornik', 'sklar', 'ucitel'],
        'ref': ('boruvka', 'h', 360),
    },
    # hrdina 2: kluk v klobouku jako papírová loutka na nýtech (Daniel 2026-11-22, prompty L1–L3).
    # L2 = klobouk, hlava, trup, paže, předloktí, otevřená ruka, pěst; L3 = stehno, lýtko, chodidlo.
    # Generátor kreslí díly v různém měřítku, proto má každý díl vlastní zmenšení (scale = px výstupu
    # na px zdroje), srovnané podle složené loutky v L1. Vzdálené končetiny (…2) jsou ztmavené kopie.
    # Klouby jsou v js/kresleni.js (LOUTKA) jako podíly šířky a výšky dílu, takže přežijí jiné měřítko.
    'hrdinaL2': {
        'src': 'hrdina-L2.png', 'grid': 0,
        'poses': ['klobouk', 'hlava', 'trup', 'paze', 'predlokti', 'ruka', 'pest'],
        'right': [True] * 7,
        'center': ['klobouk', 'hlava', 'trup', 'paze', 'predlokti', 'ruka', 'pest'],
        'mirror': ['klobouk'],  # níž svěšená krempa dopředu, přes obličej
        'scale': {'klobouk': 0.5, 'hlava': 0.47, 'trup': 0.5, 'paze': 0.4, 'predlokti': 0.4, 'ruka': 0.4, 'pest': 0.4},
        'far': ['paze', 'predlokti', 'ruka', 'pest'],
        'ref': ('trup', 'h', 219),
    },
    'hrdinaL3': {
        'src': 'hrdina-L3.png', 'grid': 0,
        'poses': ['stehno', 'lytko', 'chodidlo'],
        'right': [True] * 3,
        'center': ['stehno', 'lytko', 'chodidlo'],
        'scale': {'stehno': 0.3, 'lytko': 0.3, 'chodidlo': 0.32},
        'far': ['stehno', 'lytko', 'chodidlo'],
        'ref': ('lytko', 'h', 159),
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


def darken(rgba, t):
    """Vzdálená končetina: tmavší (barva × t), alfa beze změny."""
    out = rgba.copy()
    out[..., :3] = (out[..., :3] * t).astype(np.uint8)
    return out



def fix_karty(poses):
    """Karty: vygumuje puntíky v levém horním a pravém dolním rohu (tmavé a červené skvrny na papíře),
    hra je dokreslí v barvě barvy a správném počtu."""
    out = []
    for rgba in poses:
        rgb = np.ascontiguousarray(rgba[..., :3])
        h, w = rgb.shape[:2]
        b, g, r = [rgb[..., i].astype(np.int16) for i in range(3)]
        spot = ((r + g + b) < 380) | ((r - g) > 50)  # černé nebo červené puntíky
        mask = np.zeros((h, w), np.uint8)
        for x0, y0, x1, y1 in ((0.06, 0.03, 0.34, 0.26), (0.64, 0.78, 0.94, 0.97)):
            box = np.zeros((h, w), bool)
            box[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = True
            # jen malé kulaté skvrny velikosti puntíku (ne ostří sekery, bota apod., co do rohu zasahuje)
            n, lab, stats, _ = cv2.connectedComponentsWithStats((box & spot).astype(np.uint8))
            for i in range(1, n):
                bw, bh, area = stats[i, 2], stats[i, 3], stats[i, 4]
                if area <= 0.008 * w * h and max(bw, bh) <= 0.17 * w:
                    mask[lab == i] = 255
        mask = cv2.dilate(mask, np.ones((5, 5), np.uint8))
        clean = cv2.inpaint(rgb, mask, 6, cv2.INPAINT_TELEA)
        out.append(np.dstack([clean, rgba[..., 3]]))
    return out


def top_profile(rgba):
    """Pro každý sloupec nejvyšší neprůhledný pixel (vyhlazeno), 999 = prázdný sloupec."""
    a = rgba[..., 3] > 100
    top = np.array([np.argmax(a[:, x]) if a[:, x].any() else 999 for x in range(a.shape[1])], float)
    return np.convolve(top, np.ones(5) / 5, 'same')


def extremes(sm, fn, gap=8):
    """Lokální minima (fn=min, vršky výběžků) nebo maxima (fn=max, dna zátok) profilu, sloučená."""
    out = []
    for x in range(3, len(sm) - 3):
        if sm[x] == fn(sm[x - 3:x + 4]) and (not out or x - out[-1] > gap):
            out.append(x)
    return out


def fix_rabuse2(poses):
    """0 celá rabuše, 1 levý a 2 pravý kus zlomené, 3 kamínek. Stín na modrém pozadí zůstal jako
    modrozelený lem: modravé pixely pryč."""
    def unblue(rgba):
        out = rgba.copy()
        b, g, r = [out[..., i].astype(np.int16) for i in range(3)]
        out[..., 3][(b > r + 8) & (b > 70)] = 0
        out[..., 3] = cv2.erode(out[..., 3], np.ones((3, 3), np.uint8))
        return trim(out)
    return [unblue(p) for p in poses[:3]] + [poses[3]]


def knobs(rgba):
    """Výběžky rabuše2 zleva: [podíl šířky, podíl výšky vršku]."""
    sm = top_profile(rgba)
    w = rgba.shape[1]
    return [[round(x / w, 4), round(sm[x] / rgba.shape[0], 4)] for x in extremes(sm, min, 14) if 0.03 < x / w < 0.97]  # ne rohy konců


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
        items = list(zip(cfg['poses'], cfg['right'], poses))
        for pose, right, rgba in list(items):
            if pose in cfg.get('far', []):
                items.append((pose + '2', right, darken(rgba, 0.8)))
        for pose, right, rgba in items:
            if pose in cfg.get('drop', []):
                continue
            if pose in cfg.get('mirror', []):
                rgba = rgba[:, ::-1].copy()
            kp = cfg.get('scale', {}).get(pose.rstrip('2'), k)
            rgba = cv2.resize(rgba, (round(rgba.shape[1] * kp), round(rgba.shape[0] * kp)), interpolation=cv2.INTER_AREA)
            src = f'assets/postavy/{name}-{pose}.png'
            save(ROOT / src, rgba)
            if pose in cfg.get('center', []) or pose.rstrip('2') in cfg.get('center', []):
                ax, ay = rgba.shape[1] // 2, rgba.shape[0] // 2
            elif pose in cfg.get('top', []):
                ax, ay = top_anchor(rgba)
            else:
                ax, ay = anchor(rgba)
            sprity[name][pose] = {'src': src, 'w': rgba.shape[1], 'h': rgba.shape[0], 'ax': ax, 'ay': ay, 'right': right}
            if pose in cfg.get('knobs', []):
                kn = knobs(rgba)
                # hra počítá s pevným počtem zubů (21 = poslední dobrý, 22 = přes): jiný počet = špatné měření
                assert len(kn) == cfg['knobCount'], f'{name}/{pose}: čekám {cfg["knobCount"]} zubů, našel jsem {len(kn)}'
                sprity[name][pose]['knobs'] = kn
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
