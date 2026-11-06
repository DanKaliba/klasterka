"""Fotomontáž pozadí lesní scény z Danielových fotek (pics/les, pics/klasterka; obojí gitignore).

Výsledek: assets/sceny/les.jpg (1920×1080) a assets/sceny/les-mech.jpg (mech na spícího berana). Tvary vrstev odpovídají rozložení v js/les.js
(zídka, převis, potok, břehy, schody, kmen stromu), takže klikací místa sedí. Rampouchy, hlívu,
berana, obličej stromu a panáčka kreslí hra navrch.

Spuštění:  python tools/montaz_les.py  [--nahled cesta.jpg]  (náhled = i s obrysy vrstev)
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
K = ROOT / 'pics' / 'klasterka'
L = ROOT / 'pics' / 'les'
OUT = ROOT / 'assets' / 'sceny' / 'les.jpg'
W, H = 1920, 1080


def load(path, box=None):
    """Fotka jako float RGB 0–255; box = (x0, y0, x1, y1) v pixelech originálu (po otočení podle EXIF)."""
    im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    if box:
        im = im.crop(box)
    return im


def cover(im, w, h, ax=0.5, ay=0.5):
    """Zmenší a ořízne tak, aby vyplnila w×h (ax, ay = kam se posune výřez)."""
    s = max(w / im.width, h / im.height)
    im = im.resize((max(w, round(im.width * s)), max(h, round(im.height * s))), Image.LANCZOS)
    x0 = round((im.width - w) * ax)
    y0 = round((im.height - h) * ay)
    return np.asarray(im.crop((x0, y0, x0 + w, y0 + h)), dtype=np.float32)


def grade(a, sat=0.6, cool=(0.96, 1.0, 1.05), lift=0.0, gain=1.0):
    """Sjednocení barev: méně syté, do chladna (pozdní podzim), volitelně zvednuté stíny."""
    lum = a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    a = lum[..., None] + (a - lum[..., None]) * sat
    a = a * np.array(cool, dtype=np.float32) * gain
    a = a * (1 - lift) + 255 * lift
    return np.clip(a, 0, 255)


def mask(polys, feather=2.0, size=(W, H)):
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    for p in polys:
        d.polygon([tuple(map(float, xy)) for xy in p], fill=255)
    if feather:
        m = m.filter(ImageFilter.GaussianBlur(feather))
    return np.asarray(m, dtype=np.float32)[..., None] / 255


def place(canvas, layer, box, m):
    """layer (h×w) vloží do canvasu na box=(x0, y0) přes masku m (celoobrazovou)."""
    x0, y0 = box
    full = canvas.copy()
    h, w = layer.shape[:2]
    xa, ya, xb, yb = max(0, x0), max(0, y0), min(W, x0 + w), min(H, y0 + h)
    full[ya:yb, xa:xb] = layer[ya - y0:yb - y0, xa - x0:xb - x0]
    return canvas * (1 - m) + full * m


def darken(canvas, polys, amount, blur):
    m = mask(polys, blur)
    return canvas * (1 - m * amount)


def outline(canvas, polys, width=3, alpha=0.55, blur=1.2):
    """Tmavý obrys vrstvy, ať fotky ladí s kreslenými postavičkami."""
    m = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(m)
    for p in polys:
        d.line([tuple(map(float, xy)) for xy in p] + [tuple(map(float, p[0]))], fill=255, width=width, joint='curve')
    m = np.asarray(m.filter(ImageFilter.GaussianBlur(blur)), dtype=np.float32)[..., None] / 255
    return canvas * (1 - m * alpha) + np.array([29, 23, 18], dtype=np.float32) * m * alpha


# ---------- tvary podle js/les.js ----------
WALL = [[392, 880], [392, 462], [700, 458], [704, 1090], [392, 1090]]
LEDGE = [[690, 452], [1072, 456], [1082, 476], [1060, 496], [1000, 500], [930, 506], [860, 501], [790, 508], [700, 510]]
STREAM = [[640, 872], [1400, 862], [1400, 1090], [640, 1090]]
LEFT = [[-20, 862], [640, 866], [706, 962], [706, 1090], [-20, 1090]]
RIGHT = [[1330, 1090], [1345, 960], [1395, 868], [1640, 862], [1640, 830], [1700, 830], [1700, 790], [1780, 790],
         [1780, 750], [1860, 750], [1860, 712], [1940, 712], [1940, 1090]]
STEPS = [(1640, 830), (1700, 790), (1780, 750), (1860, 712)]
TRUNK = [[18, -10], [206, -10], [210, 700], [252, 884], [-30, 890], [22, 700]]
BRANCH = [[200, 312], [300, 286], [306, 302], [206, 338]]


def build():
    # 1) smrkový les v mlze (P1240665), světlejší a méně kontrastní, ať vynikne popředí
    bg = cover(load(K / 'P1240665.JPG', (0, 400, 4000, 2650)), W, H)
    bg = grade(bg, sat=0.45, cool=(0.94, 1.0, 1.06), lift=0.1)
    yy = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    mist = 0.18 + 0.3 * np.exp(-((yy - 0.55) / 0.22) ** 2)  # mlha nejhustší mezi kmeny nad potokem
    bg = bg * (1 - mist) + np.array([214, 220, 218], dtype=np.float32) * mist
    # lesní půda za potokem: tmavší pás, ať břehy nevisí ve vzduchu
    floor = np.clip((yy - 0.66) / 0.16, 0, 1) * 0.45
    bg = bg * (1 - floor) + np.array([58, 56, 44], dtype=np.float32) * floor
    c = bg

    # 2) potok s balvany (les 08.31.19, spodní pás s vodou)
    st = cover(load(L / 'WhatsApp Image 2026-11-05 at 08.31.19.jpeg', (0, 2850, 3024, 3730)), 760, 230)
    st = grade(st, sat=0.5, cool=(0.92, 1.0, 1.08), gain=0.92)
    c = place(c, st, (640, 860), mask([STREAM], 6))

    # 3) pravý břeh se zlatou trávou (P1240669) a kamennými schody (P1290144)
    rb = cover(load(K / 'P1240669.JPG', (1400, 1300, 4000, 3000)), 610, 380)
    rb = grade(rb, sat=0.55, cool=(0.98, 1.0, 1.02), gain=0.95)
    c = place(c, rb, (1330, 712), mask([RIGHT], 1.5))
    stone = grade(cover(load(K / 'P1290144.JPG', (2300, 1500, 4000, 2500)), 90, 34), sat=0.5, gain=1.05)
    for i, (x, y) in enumerate(STEPS):
        r = [[x, y], [x + 82, y], [x + 82, y + 30], [x, y + 30]]
        c = darken(c, [[[x + 4, y + 30], [x + 86, y + 30], [x + 86, y + 40], [x + 4, y + 40]]], 0.45, 4)
        c = place(c, stone[2:32, 4:86], (x, y), mask([r], 0.8))
        c = outline(c, [r], width=3, alpha=0.6)
    c = outline(c, [RIGHT[:4]], width=4, alpha=0.5)

    # 4) suchá zídka (P1290149, pravá část bez trsu ojíněné trávy)
    # (detailní fotky = velké kameny; zrcadlené dlaždice ani skládané pásy nevypadaly přirozeně)
    wl = cover(load(K / 'P1290149.JPG', (2500, 0, 4000, 3000)), 312, 632, ay=0.6)
    wl = grade(wl, sat=0.55, gain=1.08, lift=0.04)
    c = place(c, wl, (392, 458), mask([WALL], 1.2))
    # stín převisu na zídce a nad vodou
    c = darken(c, [[[700, 500], [1070, 500], [1040, 600], [700, 640]]], 0.35, 18)
    c = outline(c, [WALL[:4]], width=4, alpha=0.6)

    # 5) převis = tmavá ojíněná plotna z vršku téže zídky (P1290149)
    lg = cover(load(K / 'P1290149.JPG', (0, 0, 4000, 600)), 392, 58)
    lg = grade(lg, sat=0.5, gain=1.15, lift=0.05)
    c = place(c, lg, (690, 452), mask([LEDGE], 1.2))
    c = outline(c, [LEDGE], width=4, alpha=0.65)

    # 6) levý břeh: listí a kameny od schodů (les 08.30.23, spodek)
    lf = cover(load(L / 'WhatsApp Image 2026-11-05 at 08.30.23.jpeg', (0, 3087, 3024, 4032)), 726, 228)
    lf = grade(lf, sat=0.55, cool=(0.98, 1.0, 1.02), gain=0.9)
    c = place(c, lf, (-20, 862), mask([LEFT], 1.5))
    c = outline(c, [LEFT[:3]], width=4, alpha=0.5)

    # 7) starý strom: kůra se suky jako obličej (DSC00882), větev na batoh
    tr = cover(load(K / 'DSC00882.JPG', (2250, 0, 3400, 3648)), 282, 900, ay=0.35)
    tr = grade(tr, sat=0.4, gain=0.95)
    c = place(c, tr, (-30, -10), mask([TRUNK, BRANCH], 1.2))
    c = darken(c, [[[210, 0], [262, 0], [272, 884], [215, 884]]], 0.25, 14)  # stín kmene vpravo
    c = outline(c, [TRUNK, BRANCH], width=4, alpha=0.55)

    # 8) celkové doladění: lehká vinětace a zrno, ať vrstvy splynou
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    v = ((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2
    c = c * (1 - np.clip(v - 0.35, 0, 1)[..., None] * 0.35)
    rng = np.random.default_rng(7)
    c = c + rng.normal(0, 3.5, (H, W, 1)).astype(np.float32)
    return Image.fromarray(np.clip(c, 0, 255).astype(np.uint8))


def moss():
    """Mech a lišejník (P1240677) jako textura pro spícího berana."""
    m = cover(load(K / 'P1240677.JPG', (1300, 700, 4000, 2300)), 512, 300)
    m = grade(m, sat=0.75, cool=(0.97, 1.0, 1.0), gain=0.95)
    return Image.fromarray(np.clip(m, 0, 255).astype(np.uint8))


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--nahled', help='uložit i náhled jinam (výstup do assets se zapíše vždy)')
    a = ap.parse_args()
    im = build()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    im.save(OUT, quality=86, optimize=True, progressive=True)
    print(f'{OUT.relative_to(ROOT)}  {OUT.stat().st_size // 1024} kB')
    mo = OUT.with_name('les-mech.jpg')
    moss().save(mo, quality=85, optimize=True)
    print(f'{mo.relative_to(ROOT)}  {mo.stat().st_size // 1024} kB')
    if a.nahled:
        im.save(a.nahled, quality=90)
