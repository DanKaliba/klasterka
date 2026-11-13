# Pozadí scény boží muka (Daniel 2026-11-13, ChatGPT podle pics/podklady-muka/PROMPT-pozadi.md, varianta 2).
#   pics/podklady-muka/muka-P2.png (1672×941) → assets/sceny/muka.jpg (1920×1080)
# Z pozadí vyřízne vrstvy, které hra kreslí přes postavy a věci (stejné pixely jako pozadí, takže
# nepřesný okraj není vidět):
#   muka-voda.png    voda ve studánce: přes ni hra kreslí kal, který se rozplyne; a znovu přes nohy žáby
#   muka-obruba.png  přední kameny obruby (přes větvičky a kořen ve vodě)
#   muka-stovik.png  šťovík v pravém dolním rohu (přes panáčka, ten jde za ním)
# Vypíše polohy výřezů (levý horní roh), stejná čísla jsou v js/muka.js (LAYERS).
# Spustit: python tools/muka.py [--nahled cesta.png]
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'pics/podklady-muka/muka-P2.png'
OUT = ROOT / 'assets/sceny'
W, H = 1920, 1080

RING_BOX = (850, 780, 1400, 892)  # přední půlka obruby (pod středem hladiny)
DOCK_BOX = (1230, 850, W, H)  # šťovík v rohu


def load(path):
    return cv2.imdecode(np.fromfile(path, np.uint8), cv2.IMREAD_COLOR)


def save(path, img, ext='.png', params=()):
    cv2.imencode(ext, img, list(params))[1].tofile(path)


# hladina obtažená ručně podél vnitřních hran kamenů (barvou se voda od kamenů neodliší)
WATER_POLY = [(945, 745), (1000, 738), (1120, 740), (1220, 738), (1280, 750), (1325, 772), (1338, 800),
              (1325, 818), (1250, 826), (1180, 828), (1130, 830), (1100, 822), (1060, 815), (1000, 814),
              (975, 805), (950, 790), (940, 770)]


def water_mask(img):
    full = np.zeros((H, W), np.uint8)
    cv2.fillPoly(full, [np.array(WATER_POLY, np.int32)], 255)
    return full


def cut(img, alpha, box):
    x0, y0, x1, y1 = box
    return np.dstack([img, alpha])[y0:y1, x0:x1].copy()


def main():
    img = cv2.resize(load(SRC), (W, H), interpolation=cv2.INTER_CUBIC)
    save(OUT / 'muka.jpg', img, '.jpg', (cv2.IMWRITE_JPEG_QUALITY, 88))

    water = water_mask(img)
    soft = cv2.GaussianBlur(water, (9, 9), 0)
    layers = {}
    ys, xs = np.nonzero(water)
    wbox = (int(xs.min()) - 4, int(ys.min()) - 4, int(xs.max()) + 5, int(ys.max()) + 5)
    save(OUT / 'muka-voda.png', cut(img, soft, wbox))
    layers['voda'] = wbox[:2]

    # přední kameny: pás pod hladinou (bez vody), dole měkce do trávy
    x0, y0, x1, y1 = RING_BOX
    ring = np.zeros((H, W), np.uint8)
    ring[y0:y1, x0:x1] = 255
    ring[water > 0] = 0
    # nad dolním okrajem vody nic (nesmí zakrýt žábu ani hladinu)
    for x in range(x0, x1):
        col = np.nonzero(water[:, x])[0]
        if len(col):
            ring[:col.max() - 2, x] = 0
    ring[y1 - 14:y1] = (ring[y1 - 14:y1] * np.linspace(1, 0, 14)[:, None]).astype(np.uint8)
    ring = cv2.GaussianBlur(ring, (5, 5), 0)
    save(OUT / 'muka-obruba.png', cut(img, ring, RING_BOX))
    layers['obruba'] = RING_BOX[:2]

    # šťovík: GrabCut v rohu, okraj rozmazaný (navíc chycená tráva je stejná jako pozadí)
    x0, y0, x1, y1 = DOCK_BOX
    roi = img[y0:y1, x0:x1].copy()
    gm = np.full(roi.shape[:2], cv2.GC_PR_BGD, np.uint8)
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    leafy = (hsv[..., 1] > 110) & (hsv[..., 2] > 50)
    gm[leafy] = cv2.GC_PR_FGD
    gm[:, :40] = cv2.GC_BGD
    gm[:20, :] = cv2.GC_BGD
    gm[-60:, -260:] = cv2.GC_FGD
    bgm, fgm = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(roi, gm, None, bgm, fgm, 5, cv2.GC_INIT_WITH_MASK)
    dock = np.where((gm == cv2.GC_FGD) | (gm == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    dock = cv2.morphologyEx(dock, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(dock)
    keep = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 3000]
    dock = np.isin(lab, keep).astype(np.uint8) * 255
    dock = cv2.GaussianBlur(dock, (7, 7), 0)
    save(OUT / 'muka-stovik.png', np.dstack([roi, dock]))
    layers['stovik'] = DOCK_BOX[:2]

    print('LAYERS =', json.dumps(layers))
    if '--nahled' in sys.argv:
        # vrstvy obarvené přes pozadí
        prev = img.copy()
        for mask, col in ((water, (255, 0, 0)), (ring, (0, 0, 255))):
            a = (mask / 255.0 * 0.45)[..., None]
            prev = (prev * (1 - a) + np.array(col) * a).astype(np.uint8)
        full = np.zeros((H, W), np.uint8)
        full[y0:y1, x0:x1] = dock
        a = (full / 255.0 * 0.45)[..., None]
        prev = (prev * (1 - a) + np.array((255, 0, 255)) * a).astype(np.uint8)
        save(Path(sys.argv[sys.argv.index('--nahled') + 1]), prev)


main()
