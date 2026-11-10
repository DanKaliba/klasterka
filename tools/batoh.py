# Batoh z obrázku (pics/batoh/batoh.png, Daniel 2026-11-10) → assets/predmety/batoh.png s průhledným okolím.
# Světlé jednolité pozadí a podlahu pod batohem odstraní GrabCut (OpenCV: pip install opencv-python-headless).
# (iStock fotka pics/batoh/batoh-istock.jpg sloužila jen na zkoušku, bez licence se nepublikuje.)
# Spustit: python tools/batoh.py
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'pics/batoh/batoh.png'
OUT = ROOT / 'assets/predmety/batoh.png'
RECT = (118, 26, 410, 370)  # x, y, w, h: batoh i s přezkami dole
WIDTH = 200  # výsledná šířka (ve hře se kreslí nejvýš ~90 px, ať je ostrý i na HiDPI)

img = cv2.imdecode(np.fromfile(SRC, np.uint8), cv2.IMREAD_COLOR)
mask = np.zeros(img.shape[:2], np.uint8)
bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
cv2.grabCut(img, mask, RECT, bgd, fgd, 8, cv2.GC_INIT_WITH_RECT)
# světlé a málo syté pixely (bílé pozadí, odlesk podlahy) jsou jistě pozadí
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
light = (hsv[..., 2] > 215) & (hsv[..., 1] < 40)
mask[light] = cv2.GC_BGD
cv2.grabCut(img, mask, None, bgd, fgd, 4, cv2.GC_INIT_WITH_MASK)
alpha = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
# jen největší souvislý kus (bez drobků) a vyplněné díry
n, lab, stats, _ = cv2.connectedComponentsWithStats(alpha)
big = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
alpha = np.where(lab == big, 255, 0).astype(np.uint8)
cnts, _ = cv2.findContours(alpha, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
alpha = cv2.drawContours(np.zeros_like(alpha), cnts, -1, 255, -1)
alpha = cv2.GaussianBlur(cv2.erode(alpha, np.ones((3, 3), np.uint8)), (3, 3), 0)
x, y, w, h = cv2.boundingRect(alpha)
rgba = np.dstack([img, alpha])[y:y + h, x:x + w]
rgba = cv2.resize(rgba, (WIDTH, round(h * WIDTH / w)), interpolation=cv2.INTER_AREA)
OUT.parent.mkdir(exist_ok=True)
cv2.imencode('.png', rgba)[1].tofile(OUT)
print('hotovo', rgba.shape)
