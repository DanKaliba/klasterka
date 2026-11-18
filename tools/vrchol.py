# Pozadí vrcholu (Daniel 2026-11-18, prompt V v pics/podklady-vrchol/PROMPT-vrchol.md).
#   pics/podklady-vrchol/vrchol-V.png (1672×941) → assets/sceny/vrchol.jpg (1920×1080)
# Z pozadí vyřízne hrudku rašeliny jako vrstvu „mokrá hrudka“ (ztmavená, s průhledností podle tvaru):
#   vrchol-hrudka.png  hra ji přikryje přes pozadí s neprůhledností st.wet, když kluk hrudku zalije
# Vypíše polohu výřezu (levý horní roh), stejné číslo je v js/vrchol.js (WET_LAYER).
# Spustit: python tools/vrchol.py
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'pics/podklady-vrchol/vrchol-V.png'
OUT = ROOT / 'assets/sceny'
W, H = 1920, 1080
MOUND_BOX = (1330, 545, 1640, 640)  # hrudka rašeliny vpravo na obzoru


def load(path):
    return cv2.imdecode(np.fromfile(path, np.uint8), cv2.IMREAD_COLOR)


def save(path, img, ext='.png', params=()):
    cv2.imencode(ext, img, list(params))[1].tofile(path)


def mound_mask(roi):
    # rašelina je tmavá a skoro bez barvy, tráva kolem světlá a okrová
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    m = ((hsv[..., 2] < 85) & (hsv[..., 1] < 140)).astype(np.uint8) * 255
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))  # jen hrudka, ne stíny v trávě
    m = np.where(lab == big, 255, 0).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    return cv2.GaussianBlur(m, (7, 7), 0)


def main():
    img = cv2.resize(load(SRC), (W, H), interpolation=cv2.INTER_LANCZOS4)
    save(OUT / 'vrchol.jpg', img, '.jpg', (cv2.IMWRITE_JPEG_QUALITY, 88))
    x0, y0, x1, y1 = MOUND_BOX
    roi = img[y0:y1, x0:x1]
    a = mound_mask(roi)
    wet = np.clip(roi.astype(np.float32) * 0.55 + np.array([4, 2, 0], np.float32), 0, 255).astype(np.uint8)
    save(OUT / 'vrchol-hrudka.png', np.dstack([wet, a]))
    ys, xs = np.nonzero(a > 128)
    print(f'vrchol-hrudka.png @ {x0},{y0}; hrudka x {x0 + xs.min()}..{x0 + xs.max()}, y {y0 + ys.min()}..{y0 + ys.max()}')


if __name__ == '__main__':
    main()
