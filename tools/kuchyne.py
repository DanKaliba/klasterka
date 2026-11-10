# Kuchyně na Kantorské, verze 2 (Daniel 2026-11-10): z Danielových obrázků udělá podklady do hry.
#   pics/podklady-kuchyne/kuchyne-B.png  prázdná kuchyně (prompt A)  → assets/sceny/kuchyne.jpg
#   pics/podklady-kuchyne/veci-E.png     roští, náruč, hrnek, křížaly (prompt E)
#   pics/podklady-kuchyne/kuchyne-A.png  stará verze s babkou a dědou: DOČASNĚ z ní vyřízne babku, její koš
#                                        a dědu, dokud Daniel nedodá pózy podle promptů B a C
# Výstupy (assets/sceny/kuchyne-*.png) jsou už ve velikosti pro hru; levý horní roh každého výřezu na
# obrazovce 1920×1080 vypíše skript na konci a stejná čísla jsou v js/kuchyne.js (BOX).
# Potřebuje OpenCV: pip install opencv-python-headless
# Spustit: python tools/kuchyne.py
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
PICS = ROOT / 'pics/podklady-kuchyne'
OUT = ROOT / 'assets/sceny'
W, H = 1920, 1080


def load(name, size=None):
    img = cv2.imdecode(np.fromfile(PICS / name, np.uint8), cv2.IMREAD_COLOR)
    return cv2.resize(img, size, interpolation=cv2.INTER_AREA) if size else img


def save(name, img):
    jpg = name.endswith('.jpg')
    cv2.imencode('.jpg' if jpg else '.png', img, [cv2.IMWRITE_JPEG_QUALITY, 88] if jpg else [])[1].tofile(OUT / name)


def poly_mask(shape, polys, val=255):
    m = np.zeros(shape[:2], np.uint8)
    for p in polys:
        cv2.fillPoly(m, [np.array(p, np.int32)], val)
    return m


def grabcut(img, maybe, sure_fg=None, sure_bg=None, it=6):
    """maybe/sure_*: masky 0/255. Vrátí alfu 0/255."""
    m = np.full(img.shape[:2], cv2.GC_BGD, np.uint8)
    m[maybe > 0] = cv2.GC_PR_FGD
    if sure_bg is not None:
        m[sure_bg > 0] = cv2.GC_BGD
    if sure_fg is not None:
        m[sure_fg > 0] = cv2.GC_FGD
    b, f = np.zeros((1, 65)), np.zeros((1, 65))
    cv2.grabCut(img, m, None, b, f, it, cv2.GC_INIT_WITH_MASK)
    return np.where((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)


def tidy(alpha, close=5, keep=1):
    """Zacelí dírky, nechá jen největší kusy a změkčí okraj."""
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, np.ones((close, close), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(alpha)
    order = 1 + np.argsort(-stats[1:, cv2.CC_STAT_AREA])[:keep]
    alpha = np.where(np.isin(lab, order), 255, 0).astype(np.uint8)
    return cv2.GaussianBlur(alpha, (3, 3), 0)


def sprite(img, alpha, scale=1.0):
    """Ořízne na alfu a zmenší. Vrátí (rgba, x0, y0) v souřadnicích zdroje."""
    x, y, w, h = cv2.boundingRect((alpha > 8).astype(np.uint8))
    rgba = np.dstack([img, alpha])[y:y + h, x:x + w]
    if scale != 1:
        rgba = cv2.resize(rgba, (round(w * scale), round(h * scale)), interpolation=cv2.INTER_AREA)
    return rgba, x, y


boxes = {}

# ---------- pozadí: prázdná kuchyně, bez koše (nahradí ho koš od babky) a bez pohrabáče (vezme si ho panáček) ----------
bg = load('kuchyne-B.png', (W, H))
# pohrabáč visí na tyči sporáku: očko, tyč a háček dole
POKER = dict(ring=((770, 676), (9, 9)), shaft=((769, 684), (769, 838)), hook=((775, 852), (16, 12)))
pm = np.zeros((H, W), np.uint8)
cv2.ellipse(pm, POKER['ring'][0], POKER['ring'][1], 0, 0, 360, 255, 5)
cv2.line(pm, *POKER['shaft'], 255, 8)
cv2.ellipse(pm, POKER['hook'][0], POKER['hook'][1], 0, 0, 360, 255, 6)
pm = cv2.dilate(pm, np.ones((3, 3), np.uint8))
pa = grabcut(bg, cv2.dilate(pm, np.ones((5, 5), np.uint8)), sure_fg=cv2.erode(pm, np.ones((3, 3), np.uint8)))
pa = cv2.GaussianBlur(pa & cv2.dilate(pm, np.ones((5, 5), np.uint8)), (3, 3), 0)
poker, px, py = sprite(bg, pa)
save('kuchyne-pohrabac.png', poker)
boxes['POKER'] = (px, py)
KOS_B = [(250, 770), (440, 770), (440, 952), (250, 952)]  # koš z obrázku B (zakryje ho babka a její koš)
clean = cv2.inpaint(bg, poly_mask(bg.shape, [KOS_B]), 9, cv2.INPAINT_TELEA)
# místo pohrabáče: stejná litina i tyč o kus vlevo (vpravo visí lopatka), měkce prolnutá
POKER_SHIFT = 48  # víc než šířka háčku, jinak by se háček zkopíroval sám na sebe
pk = cv2.GaussianBlur(cv2.dilate(np.maximum(pm, pa), np.ones((7, 7), np.uint8)), (9, 9), 0)[..., None] / 255
shifted = np.roll(bg, POKER_SHIFT, axis=1)
clean = (clean * (1 - pk) + shifted * pk).astype(np.uint8)
save('kuchyne.jpg', clean)

# okno otevřené dovnitř: v otvoru zůstane jen výhled ven (kříž a rám křídla se zamalují)
OKNO = (1446, 400, 1594, 614)  # křídlo s rámem (OKNO v js/kuchyne.js)
SKLO = (1453, 410, 1588, 601)
x0, y0, x1, y1 = OKNO
ven = clean[y0:y1, x0:x1].copy()
m = np.full(ven.shape[:2], 255, np.uint8)
m[SKLO[1] - y0:SKLO[3] - y0, SKLO[0] - x0:SKLO[2] - x0] = 0
m[:, 1517 - x0:1530 - x0] = 255  # svislá příčka
m[484 - y0:495 - y0, :] = 255  # vodorovná příčka
ven = cv2.inpaint(ven, m, 7, cv2.INPAINT_TELEA)
ven = cv2.convertScaleAbs(ven, alpha=1.06, beta=8)  # bez skla je venku světleji
save('kuchyne-okno-ven.png', ven)

# ---------- babka a její koš (DOČASNĚ ze staré verze) ----------
A = load('kuchyne-A.png', (W, H))
# babka: obrys od GrabCutu; zástěra je světlá jako zeď, proto je vyznačená ručně, kousky zdi u zad také
g_maybe = poly_mask(A.shape, [[(85, 455), (555, 455), (555, 1035), (85, 1035)]])
g_fg = poly_mask(A.shape, [[(300, 560), (420, 520), (380, 700), (250, 700)], [(150, 800), (300, 760), (320, 900), (120, 980)],
                            [(288, 708), (392, 702), (436, 765), (444, 835), (386, 868), (386, 1004), (302, 1004)]])
g_bg = poly_mask(A.shape, [[(560, 600), (760, 600), (760, 1080), (560, 1080)], [(278, 543), (324, 543), (318, 572), (296, 592), (280, 592)],
                            [(118, 790), (174, 796), (157, 934), (118, 936)]])
granny = grabcut(A, g_maybe, g_fg, g_bg)
# koš (stojí před babkou): GrabCut v obrysu koše, vlevo od něj je už sukně
k_poly = [(383, 826), (600, 826), (600, 1026), (397, 1026), (383, 880)]
k_fg = poly_mask(A.shape, [[(400, 880), (585, 880), (570, 1010), (410, 1010)]])
kos = grabcut(A, poly_mask(A.shape, [k_poly]), k_fg)
kos = tidy(kos & poly_mask(A.shape, [k_poly]), close=7)
granny = tidy(granny & np.where(kos > 128, 0, 255).astype(np.uint8), close=5)
# na nové místo: ruce k dvířkům topeniště nového sporáku, koš na podlahu (zmenšené jako sporák)
G_S = 0.86
place = lambda x, y: (round(478 + (x - 540) * G_S), round(985 + (y - 1022) * G_S))
for name, alpha in (('babka', granny), ('kos', kos)):
    rgba, sx, sy = sprite(A, alpha, G_S)
    save(f'kuchyne-{name}.png', rgba)
    boxes[name.upper()] = place(sx, sy)

# ---------- děda (DOČASNĚ ze staré verze) ----------
# sedí před tmavými kachlemi, kabát je skoro stejně tmavý: obrys je obkreslený a GrabCut doladí okraje
DEDA = [(1415, 287), (1440, 270), (1500, 272), (1535, 322), (1527, 340), (1527, 365), (1512, 382),
        (1540, 398), (1580, 432), (1600, 472), (1612, 530), (1617, 600), (1608, 660), (1602, 748),
        (1645, 752), (1645, 778), (1628, 782), (1610, 975), (1590, 978), (1562, 785), (1548, 785),
        (1525, 850), (1508, 940), (1480, 952), (1478, 1018), (1400, 1022), (1398, 968), (1415, 950), (1418, 800),
        (1408, 790), (1378, 940), (1362, 940), (1362, 960), (1362, 1000), (1240, 998), (1228, 975), (1255, 925),
        (1240, 845), (1230, 720), (1240, 670), (1270, 600), (1285, 550), (1305, 510), (1312, 488), (1328, 470),
        (1325, 430), (1345, 410), (1372, 408), (1420, 422), (1405, 385), (1410, 330)]
d_maybe = poly_mask(A.shape, [DEDA])
cv2.polylines(d_maybe, [np.array([(1378, 425), (1412, 393), (1450, 372)])], False, 255, 10)  # dýmka
d_fg = cv2.erode(d_maybe, np.ones((25, 25), np.uint8))
cv2.polylines(d_fg, [np.array([(1384, 420), (1412, 395), (1444, 376)])], False, 255, 3)
deda = grabcut(A, cv2.dilate(d_maybe, np.ones((5, 5), np.uint8)), d_fg)
deda = tidy(deda, close=3)
D_S = 0.78
rgba, sx, sy = sprite(A, deda, D_S)
save('kuchyne-deda.png', rgba)
boxes['DEDA'] = (round(1085 + (sx - 1228) * D_S), round(1010 + (sy - 1022) * D_S))

# ---------- věci z obrázku E (šedé pozadí) ----------
E = load('veci-E.png')
grey = np.median(np.concatenate([E[:40].reshape(-1, 3), E[-40:].reshape(-1, 3)]), axis=0)
near = (np.abs(E.astype(int) - grey).max(axis=2) < 14).astype(np.uint8) * 255


def prop(name, rect, scale, keep=1):
    x0, y0, x1, y1 = rect
    maybe = poly_mask(E.shape, [[(x0, y0), (x1, y0), (x1, y1), (x0, y1)]])
    a = grabcut(E, maybe, sure_bg=near)
    a = tidy(a, close=3, keep=keep)
    rgba, _, _ = sprite(E, a, scale)
    save(f'kuchyne-{name}.png', rgba)
    return rgba


prop('rosti', (10, 260, 670, 730), 0.36, keep=3)  # volná hromádka v rohu u dveří
prop('naruc', (685, 240, 945, 750), 0.33, keep=3)  # náruč, kterou panáček nese babce
prop('hrnek', (985, 465, 1258, 690), 0.24)  # hrnek se semínky na levém konci police
# křížaly: jen horní kus šňůry (celá by sahala až na deku na kamnech), dole se rozplyne
for i, (x0, x1) in enumerate(((1310, 1412), (1412, 1508), (1512, 1612))):
    rgba = prop(f'krizaly-{i + 1}', (x0, 140, x1, 770), 0.4)
    cut = round(rgba.shape[0] * 0.62)
    rgba = rgba[:cut].copy()
    fade = np.linspace(1, 0, 14)
    rgba[-14:, :, 3] = (rgba[-14:, :, 3] * fade[:, None]).astype(np.uint8)
    save(f'kuchyne-krizaly-{i + 1}.png', rgba)

print('hotovo; levé horní rohy výřezů na obrazovce:', boxes)
