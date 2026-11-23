# Postavy z Danielových obrázků (kresba + skutečný materiál, pics/podklady-postavy/PROMPT-postavy.md):
#   kocour-KC.jpeg  6 póz kocoura (srst z jívových kočiček), mřížka 2×3 → assets/postavy/kocour-*.png (záloha)
#   kocour-KL2–KL4  kocour jako loutka: hrudník, zadek, ocas, nohy, hlavy, klubíčko → assets/postavy/kocourKL*-*.png
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
    # děda v kuchyni jako papírová loutka (Daniel 2026-11-22, prompty D1–D3 v
    # pics/podklady-kuchyne/PROMPT-postavy-lisejnik.md). Díly koukají doleva → zrcadlí se, ať je kostra
    # stejná jako u hrdiny (kouká doprava); hra ho kreslí otočeného. Fajfku v dílech nemá, kreslí ji hra.
    # D2: stolička, trup, stehno, lýtko s botou, dvě paže (rukáv vyhrnutý nad holé předloktí), ruka, pěst,
    # ruka na stopku; fix_d2 rozdělí první paži v manžetě na paži a předloktí, druhá se nepoužije.
    'dedaD2': {
        'src': '../podklady-kuchyne/deda-D2.png', 'grid': 0, 'fix': 'fix_d2',
        'poses': ['stolicka', 'trup', 'stehno', 'bota', 'paze', 'predlokti', 'ruka', 'pest', 'drzi'],
        'right': [True] * 9,
        'mirror': ['stolicka', 'trup', 'stehno', 'bota', 'paze', 'predlokti', 'ruka', 'pest', 'drzi'],
        'center': ['stolicka', 'trup', 'stehno', 'bota', 'paze', 'predlokti', 'ruka', 'pest', 'drzi'],
        'scale': {'stolicka': 0.72, 'trup': 0.67, 'stehno': 0.6, 'bota': 0.68, 'paze': 0.52, 'predlokti': (0.52, 0.7),
                  'ruka': 0.4, 'pest': 0.42, 'drzi': 0.42},
        'far': ['stehno', 'bota', 'paze', 'predlokti', 'ruka', 'pest', 'drzi'],
        'ref': ('trup', 'h', 246),
    },
    # babka v kuchyni jako papírová loutka (Daniel 2026-11-23, prompty E1–E3): klečí, kouká doprava.
    # E2: spodek v kleku (jeden díl), trup, dvě celé paže (fix_e2 první rozdělí v lokti), otevřená ruka
    # (prsty nahoru), dlaň nahoru, ruka s kapesníkem. Ruce se neotáčí: kostra je natočí podle kloubů.
    'babkaE2': {
        'src': '../podklady-kuchyne/babka-E2.jpg', 'grid': 0, 'fix': 'fix_e2',
        'poses': ['spodek', 'trup', 'paze', 'predlokti', 'ruka', 'dlan', 'kapesnik'],
        'right': [True] * 7,
        'center': ['spodek', 'trup', 'paze', 'predlokti', 'ruka', 'dlan', 'kapesnik'],
        'scale': {'spodek': 0.7, 'trup': 0.7, 'paze': 0.62, 'predlokti': 0.62, 'ruka': 0.41, 'dlan': 0.41, 'kapesnik': 0.41},
        'far': ['paze', 'predlokti', 'ruka', 'dlan', 'kapesnik'],
        'ref': ('trup', 'h', 204),
    },
    # E3: čtyři hlavy se šátkem z opravdové látky: smutná, kašle, prosí (ustaraná), spokojená
    'babkaE3': {
        'src': '../podklady-kuchyne/babka-E3.jpg', 'grid': 0,
        'poses': ['hlavaSmutna', 'hlavaKasel', 'hlavaProsi', 'hlavaSpokojena'],
        'right': [True] * 4,
        'center': ['hlavaSmutna', 'hlavaKasel', 'hlavaProsi', 'hlavaSpokojena'],
        'scale': {'hlavaSmutna': 0.47, 'hlavaKasel': 0.47, 'hlavaProsi': 0.47, 'hlavaSpokojena': 0.47},
        'ref': ('hlavaSmutna', 'h', 190),
    },
    # D3: pět hlav s lišejníkem: klidná (zavřené oči), kašle, kouká nahoru a fouká, leknutí, zlost
    'dedaD3': {
        'src': '../podklady-kuchyne/deda-D3.jpg', 'grid': 0,
        'poses': ['hlavaKlid', 'hlavaKasel', 'hlavaFouka', 'hlavaLek', 'hlavaZlost'],
        'right': [True] * 5,
        'mirror': ['hlavaKlid', 'hlavaKasel', 'hlavaFouka', 'hlavaLek', 'hlavaZlost'],
        'center': ['hlavaKlid', 'hlavaKasel', 'hlavaFouka', 'hlavaLek', 'hlavaZlost'],
        'scale': {'hlavaKlid': 0.55, 'hlavaKasel': 0.55, 'hlavaFouka': 0.55, 'hlavaLek': 0.55, 'hlavaZlost': 0.55},
        'ref': ('hlavaKlid', 'h', 195),
    },
    # kocour jako papírová loutka (Daniel 2026-11-23, prompty KL1–KL4 v PROMPT-postavy.md). Velikost dílů
    # = px dřívějšího kocoura z KC (ve hře se zmenší na CAT_K). KL2: hrudník a zadek koukají doleva →
    # zrcadlit; fix_kl2 odstřihne přirostlé horní nohy pod břichem (zakryje je přední noha loutky).
    'kocourKL2': {
        'src': 'kocour-KL2.jpg', 'grid': 0, 'fix': 'fix_kl2',
        'poses': ['hrudnik', 'zadek', 'ocasA', 'ocasB', 'ocasC'],
        'right': [True] * 5,
        'mirror': ['hrudnik', 'zadek', 'ocasA', 'ocasB', 'ocasC'],
        'center': ['hrudnik', 'zadek', 'ocasA', 'ocasB', 'ocasC'],
        'scale': {'hrudnik': 0.22, 'zadek': 0.22, 'ocasA': 0.22, 'ocasB': 0.22, 'ocasC': 0.22},
        'ref': ('hrudnik', 'h', 67),
    },
    # KL3: generátor nakreslil celé nohy; fix_kl3 rozdělí přední v lokti a zadní (s kulatou kýtou) v koleni
    'kocourKL3': {
        'src': 'kocour-KL3.jpg', 'grid': 0, 'fix': 'fix_kl3',
        'poses': ['paze', 'predlokti', 'stehno', 'lytko'],
        'right': [True] * 4,
        'center': ['paze', 'predlokti', 'stehno', 'lytko'],
        'scale': {'paze': 0.19, 'predlokti': 0.19, 'stehno': 0.22, 'lytko': 0.24},  # zadní nohy jsou delší
        'far': ['paze', 'predlokti', 'stehno', 'lytko'],
        'ref': ('paze', 'h', 40),
    },
    # KL4: pět hlav (klidná, spí/přede, zívá, mňouká, čichá) a klubíčko; slepené hlavy rozdělí fix_kl4
    'kocourKL4': {
        'src': 'kocour-KL4.jpg', 'grid': 0, 'fix': 'fix_kl4',
        'poses': ['hlavaKlid', 'hlavaSpi', 'hlavaZiva', 'hlavaMnau', 'hlavaCich', 'klubko'],
        'right': [True] * 6,
        'center': ['hlavaKlid', 'hlavaSpi', 'hlavaZiva', 'hlavaMnau', 'hlavaCich', 'klubko'],
        'scale': {'hlavaKlid': 0.22, 'hlavaSpi': 0.22, 'hlavaZiva': 0.22, 'hlavaMnau': 0.22, 'hlavaCich': 0.22, 'klubko': 0.66},
        'ref': ('hlavaKlid', 'h', 63),
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


def fix_d2(poses):
    """D2: 0 stolička, 1 trup, 2 stehno, 3 bota, 4 a 5 paže (rukáv, manžeta, holé předloktí), 6 ruka, 7 pěst,
    8 ruka na stopku. První paže se rozdělí v manžetě: nahoře paže i s manžetou, dole holé předloktí
    s kulatým horním koncem (schová se pod manžetu). Druhá paže se nepoužije."""
    stool, torso, thigh, boot, arm, _arm2, hand, fist, grip = poses
    a = arm[..., 3] > 128
    widths = a.sum(1)
    h = arm.shape[0]
    # manžeta = nejširší řádky ve střední části paže; její spodek dělí paži a předloktí
    mid = np.arange(int(h * 0.35), int(h * 0.85))
    cuff = mid[widths[mid] >= widths[mid].max() * 0.92]
    cut = int(cuff.max()) - 4
    upper = arm.copy()
    upper[cut + 1:, :, 3] = 0
    top = int(cuff.min()) + (cut - int(cuff.min())) // 2  # předloktí začíná v půlce manžety
    fore = arm[top:].copy()
    fa = fore[..., 3] > 128
    xs = np.nonzero(fa[-int(fa.shape[0] * 0.4):].any(0))[0]  # holá část: šířka a střed
    cx, r = (xs.min() + xs.max()) / 2, (xs.max() - xs.min()) / 2
    yy, xx = np.mgrid[0:fore.shape[0], 0:fore.shape[1]]
    fore[..., 3][(yy < r) & ((xx - cx) ** 2 + (yy - r) ** 2 > r * r)] = 0
    fore[..., 3][(yy >= r) & (np.abs(xx - cx) > r)] = 0  # zbytek manžety po stranách pryč
    return [stool, torso, thigh, boot, trim(upper), trim(fore), hand, fist, grip]


def fix_e2(poses):
    """E2: 0 spodek, 1 trup, 2 a 3 celá paže s loktem, 4 ruka, 5 dlaň, 6 kapesník. První paže se rozdělí
    v lokti (nakreslený šev v půlce): paže nahoře se zakulaceným spodkem, předloktí od švu dolů se
    zakulaceným vrškem (zajede pod paži). Druhá paže se nepoužije."""
    lower, torso, arm, _arm2, hand, palm, hanky = poses
    upper, fore = split_limb(arm, 0.56, 0.5)
    return [lower, torso, upper, fore, hand, palm, hanky]


def split_limb(arm, cut_f, top_f):
    """Celou končetinu rozdělí v kloubu: horní díl do cut_f výšky se zakulaceným spodkem, dolní od top_f
    se zakulaceným vrškem (překryv cut_f − top_f zajede pod horní díl)."""
    h, w = arm.shape[:2]
    a = arm[..., 3] > 128
    yy, xx = np.mgrid[0:h, 0:w]

    def row_span(y):
        xs = np.nonzero(a[y])[0]
        return (xs.min() + xs.max()) / 2, (xs.max() - xs.min()) / 2

    cut, top = int(h * cut_f), int(h * top_f)
    upper = arm.copy()
    upper[cut:, :, 3] = 0
    cx, r = row_span(cut - 1)
    upper[..., 3][(yy < cut) & (yy > cut - r) & ((xx - cx) ** 2 + (yy - (cut - r)) ** 2 > r * r)] = 0
    fore = arm.copy()
    fore[:top, :, 3] = 0
    cx, r = row_span(top)
    fore[..., 3][(yy >= top) & (yy < top + r) & ((xx - cx) ** 2 + (yy - (top + r)) ** 2 > r * r)] = 0
    return trim(upper), trim(fore)


def largest(rgba):
    """Jen největší souvislý kus (bez kousků vousů sousední hlavy)."""
    m = (rgba[..., 3] > 8).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    keep = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    out = rgba.copy()
    out[..., 3][lab != keep] = 0
    return trim(out)


def fix_kl2(poses):
    """KL2: 0 hrudník, 1 zadek (s přirostlou horní nohou), 2–4 články ocasu. Přirostlé nohy pod břichem
    pryč; co z nich zbude na těle, zakryjí nohy loutky."""
    chest, rear, *tail = poses
    chest, rear = chest.copy(), rear.copy()
    chest[int(chest.shape[0] * 0.82):, :, 3] = 0
    rear[int(rear.shape[0] * 0.8):, :, 3] = 0
    return [trim(chest), trim(rear), *tail]


def fix_kl3(poses):
    """KL3: celé nohy. 0 přední s kočičkami → paže a předloktí s tlapkou (loket v půlce), 3 zadní s kulatou
    kýtou → stehno a lýtko s hleznem a tlapou (koleno pod kýtou). Ostatní (1, 2, 4, 5) se nepoužijí."""
    paze, predlokti = split_limb(poses[0], 0.52, 0.46)
    stehno, lytko = split_limb(poses[3], 0.56, 0.5)
    return [paze, predlokti, stehno, lytko]


def fix_kl4(poses):
    """KL4: hlavy 2+3 a 5+klubíčko se dotýkají vousy → rozdělit v nejprázdnějším sloupci uprostřed."""
    def split(rgba):
        cols = (rgba[..., 3] > 8).sum(0)
        w = rgba.shape[1]
        x = int(w * 0.35) + int(np.argmin(cols[int(w * 0.35):int(w * 0.65)]))
        return largest(rgba[:, :x]), largest(rgba[:, x:])
    h1, h23, h4, h5b = poses
    return [largest(h1), *split(h23), largest(h4), *split(h5b)]


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
            if pose in cfg.get('mirror', []) or (pose.endswith('2') and pose[:-1] in cfg.get('far', []) and pose[:-1] in cfg.get('mirror', [])):
                rgba = rgba[:, ::-1].copy()
            kp = cfg.get('scale', {}).get(pose.rstrip('2'), k)
            kx, ky = kp if isinstance(kp, tuple) else (kp, kp)  # (šířka, výška): předloktí dědy se natáhne
            rgba = cv2.resize(rgba, (round(rgba.shape[1] * kx), round(rgba.shape[0] * ky)), interpolation=cv2.INTER_AREA)
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
