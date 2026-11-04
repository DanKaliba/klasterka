"""Model terénu pod fotkou: z polohy kamery, výškového modelu a OpenStreetMap spočítá, jak daleko
je od kamery každé místo snímku → js/teren.js (velikost postav podle skutečné vzdálenosti, ne jen
podle výšky v obraze) a promítne do snímku cesty, potoky, vlek a chalupy z OSM (podklad v editoru, M).

Potřebuje numpy, scipy, Pillow a internet (dlaždice terénu z AWS Terrain Tiles, OSM z Overpass API);
stažené se ukládá do tools/cache/ (gitignore). Spuštění z kořene projektu:  python tools/teren.py

Kamera (Daniel 2026-11-02): 50.7052917N, 15.6433725E, dívá se na SV na Klínové Boudy.
Natočení, sklon, náklon, ohnisko a soudkovité zkreslení se dopočítají z chalup, jejichž poloha
na snímku i v mapě je známá (CTRL). Výška kamery nad zemí se z nich určit nedá, je odhadnutá.
"""
import io
import json
import math
import os
import urllib.parse
import urllib.request

import numpy as np
from PIL import Image
from scipy.optimize import least_squares

CAM = (50.7052917, 15.6433725)
CAM_HEIGHT = 8.0  # m nad terénem (kamera na budově)
BBOX = (50.690, 50.765, 15.615, 15.740)  # jih, sever, západ, východ — terén i za hřeben
W, H, STEP = 1920, 1080, 20  # snímek a krok mřížky vzdáleností
Z = 15  # zoom dlaždic terénu (~3 m/px, data jemná asi na 25 m)
R = 6371000.0
REFRACTION = 0.87  # zakřivení Země zmírněné lomem světla
# (OSM id stavby, x, y na podzimním snímku) — chalupy, které jsou na fotce jasně vidět
CTRL = [
    (31357549, 232, 272),  # Spisovatel
    (31357552, 485, 292),  # Skočka
    (31357554, 822, 324),  # Kantorská
    (176391323, 954, 250),  # Ranč
    (31357556, 900, 302),  # bez jména (č. 83?)
    (31357555, 1173, 319),  # bez jména
    (225909482, 1429, 341),  # Jelínek (chata č. 85, bez jména v OSM)
    (225909478, 1490, 324),  # Nová Klínovka
    (19917865, 557, 420),  # Petráška (napůl v lese)
]
ROOF = 4.0  # střed domu nad zemí (m)
# další body do podkladu v editoru: (jméno, lat, lon, výška nad zemí)
POINTS = [
    ('boží muka', 50.7099203, 15.6511865, 1.5),  # podle Daniela (mapy.com/s/kufomadecu); pod nimi studánka pro Kantorskou
]
CACHE = 'tools/cache'


def fetch(url, data=None):
    req = urllib.request.Request(url, data=data, headers={'User-Agent': 'klasterka-game/1.0'})
    return urllib.request.urlopen(req, timeout=120).read()


# ---------- terén ----------
def tile_xy(lat, lon):
    n = 2 ** Z
    return (lon + 180) / 360 * n, (1 - np.arcsinh(np.tan(np.radians(lat))) / math.pi) / 2 * n


def load_dem():
    x0, y1 = tile_xy(BBOX[0], BBOX[2])
    x1, y0 = tile_xy(BBOX[1], BBOX[3])
    rows = []
    for ty in range(int(y0), int(y1) + 1):
        row = []
        for tx in range(int(x0), int(x1) + 1):
            p = f'{CACHE}/terrarium_{Z}_{tx}_{ty}.png'
            if not os.path.exists(p):
                data = fetch(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{tx}/{ty}.png')
                open(p, 'wb').write(data)
            a = np.asarray(Image.open(p).convert('RGB')).astype(np.float64)
            row.append(a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768)
        rows.append(np.hstack(row))
    return np.vstack(rows), int(x0), int(y0)


DEM, TX0, TY0 = None, 0, 0
M_LAT = math.radians(1) * R
M_LON = M_LAT * math.cos(math.radians(CAM[0]))


def to_enu(lat, lon):
    return (np.asarray(lon) - CAM[1]) * M_LON, (np.asarray(lat) - CAM[0]) * M_LAT


def height(e, n):
    """výška terénu (m n. m.) v bodech ENU, bilineárně"""
    x, y = tile_xy(CAM[0] + np.asarray(n) / M_LAT, CAM[1] + np.asarray(e) / M_LON)
    px = np.clip((x - TX0) * 256 - 0.5, 0, DEM.shape[1] - 2.001)
    py = np.clip((y - TY0) * 256 - 0.5, 0, DEM.shape[0] - 2.001)
    j, i = np.floor(px).astype(int), np.floor(py).astype(int)
    fx, fy = px - j, py - i
    return (DEM[i, j] * (1 - fx) * (1 - fy) + DEM[i, j + 1] * fx * (1 - fy)
            + DEM[i + 1, j] * (1 - fx) * fy + DEM[i + 1, j + 1] * fx * fy)


def drop(dist):
    return dist ** 2 / (2 * R) * REFRACTION


# ---------- kamera ----------
def rot(yaw, pitch, roll):
    """svět ENU → kamera (x vpravo, y dolů, z dopředu)"""
    y, p, r = map(math.radians, (yaw, pitch, roll))
    f = np.array([math.sin(y) * math.cos(p), math.cos(y) * math.cos(p), math.sin(p)])
    rt = np.array([math.cos(y), -math.sin(y), 0.0])
    up = np.cross(rt, f)
    rt, up = rt * math.cos(r) + up * math.sin(r), up * math.cos(r) - rt * math.sin(r)
    return np.array([rt, -up, f])


def project(P, prm, cam):
    """body ENU (N×3) → pixely snímku (N×2) a hloubka před kamerou"""
    yaw, pitch, roll, f, k1 = prm
    v = np.atleast_2d(P) - cam
    v[:, 2] -= drop(np.hypot(v[:, 0], v[:, 1]))
    c = v @ rot(yaw, pitch, roll).T
    x, y = c[:, 0] / c[:, 2], c[:, 1] / c[:, 2]
    s = 1 + k1 * (x * x + y * y)
    return np.stack([W / 2 + f * x * s, H / 2 + f * y * s], 1), c[:, 2]


def cast(px, py, prm, cam, tmax=8000):
    """vzdálenost (m) k terénu podél paprsku pixelu; 0 = nebe"""
    yaw, pitch, roll, f, k1 = prm
    xd, yd = (np.ravel(px) - W / 2) / f, (np.ravel(py) - H / 2) / f
    x, y = xd.copy(), yd.copy()
    for _ in range(20):  # inverze zkreslení
        s = 1 + k1 * (x * x + y * y)
        x, y = xd / s, yd / s
    d = np.stack([x, y, np.ones_like(x)], -1) @ rot(yaw, pitch, roll)
    d /= np.linalg.norm(d, axis=1, keepdims=True)
    out = np.zeros(len(d))
    t = np.ones(len(d))
    alive = np.ones(len(d), bool)
    while alive.any():
        i = np.where(alive)[0]
        p = cam + d[i] * t[i, None]
        hit = p[:, 2] <= height(p[:, 0], p[:, 1]) - drop(np.hypot(p[:, 0], p[:, 1]))
        out[i[hit]] = t[i[hit]]
        alive[i[hit]] = False
        t[i] += np.maximum(1.0, t[i] * 0.01)
        alive &= t < tmax
    return out.reshape(np.shape(px))


# ---------- OSM ----------
def load_osm():
    p = f'{CACHE}/osm.json'
    if not os.path.exists(p):
        s, n, w, e = BBOX[0], 50.725, 15.625, 15.690
        q = f'''[out:json][timeout:90];
(way({s},{w},{n},{e})[building]; way({s},{w},{n},{e})[highway];
 way({s},{w},{n},{e})[waterway]; way({s},{w},{n},{e})[aerialway];);
out geom;'''
        for url in ('https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter',
                    'https://overpass-api.de/api/interpreter'):
            try:  # Overpass bývá přetížený → zkusit znovu / jinde
                data = fetch(url, urllib.parse.urlencode({'data': q}).encode())
                break
            except OSError as err:
                print('Overpass', url, err)
        else:
            raise SystemExit('OpenStreetMap se nepodařilo stáhnout')
        open(p, 'wb').write(data)
    return json.load(open(p, encoding='utf8'))['elements']


def enu3(lat, lon, above=0.0):
    e, n = to_enu(lat, lon)
    return np.stack([e, n, height(e, n) + above], -1)


def main():
    global DEM, TX0, TY0
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    os.makedirs(CACHE, exist_ok=True)
    DEM, TX0, TY0 = load_dem()
    osm = load_osm()
    ways = {e['id']: e for e in osm}
    cam = enu3(*CAM, CAM_HEIGHT)

    # kalibrace kamery podle chalup
    def centroid(w):
        g = ways[w]['geometry']
        return np.mean([p['lat'] for p in g]), np.mean([p['lon'] for p in g])
    P = np.array([enu3(*centroid(w), ROOF) for w, _, _ in CTRL])
    px = np.array([[x, y] for _, x, y in CTRL], float)
    fit = least_squares(lambda p: (project(P, p, cam)[0] - px).ravel(), [56, 0, 0, 1900, 0])
    prm = fit.x
    err = np.hypot(*(project(P, prm, cam)[0] - px).T)
    print('kamera: natočení %.2f°, sklon %.2f°, náklon %.2f°, ohnisko %.0f px, zkreslení %.3f' % tuple(prm))
    print('  zorný úhel %.1f°, odchylka chalup %.1f px (max %.1f)'
          % (2 * math.degrees(math.atan(W / 2 / prm[3])), np.sqrt((err ** 2).mean()), err.max()))

    # vzdálenost terénu v mřížce; nebe dostane hodnotu prvního terénu pod sebou,
    # sloupec úplně bez terénu převezme nejbližší sloupec, který terén má
    xs, ys = np.arange(0, W + 1, STEP), np.arange(0, H + 1, STEP)
    X, Y = np.meshgrid(xs, ys)
    dist = cast(X, Y, prm, cam)
    hit = (dist > 0).any(axis=0)
    for j in range(dist.shape[1]):
        col = dist[:, j]
        if hit[j]:
            first = np.argmax(col > 0)
            col[:first] = col[first]
    good = np.flatnonzero(hit)
    for j in np.flatnonzero(~hit):
        dist[:, j] = dist[:, good[np.abs(good - j).argmin()]] if len(good) else 8000

    # mapa do snímku: lomené čáry (po ~8 m), u každého bodu jestli je vidět (nezakrývá ho terén)
    def visible(pts, uv, depth):
        ok = (depth > 0) & (uv[:, 0] > -50) & (uv[:, 0] < W + 50) & (uv[:, 1] > -50) & (uv[:, 1] < H + 50)
        seen = np.zeros(len(pts), bool)
        if ok.any():
            d = cast(uv[ok, 0], uv[ok, 1], prm, cam)
            real = np.linalg.norm(pts[ok] - cam, axis=1)
            seen[ok] = (d == 0) | (d > real - np.maximum(15, real * 0.03))
        return ok, seen

    def line(geom):
        lat = np.array([p['lat'] for p in geom]); lon = np.array([p['lon'] for p in geom])
        e, n = to_enu(lat, lon)
        seg = np.hypot(np.diff(e), np.diff(n))
        s = np.concatenate([[0], np.cumsum(seg)])
        u = np.linspace(0, s[-1], max(2, int(s[-1] / 8)))
        e2, n2 = np.interp(u, s, e), np.interp(u, s, n)
        pts = np.stack([e2, n2, height(e2, n2) + 0.5], -1)
        uv, depth = project(pts, prm, cam)
        ok, seen = visible(pts, uv, depth)
        runs, run = [], []  # souvislé úseky v záběru, body [x, y, vidět]
        for k in range(len(pts)):
            if ok[k]:
                run.append([int(round(uv[k, 0])), int(round(uv[k, 1])), int(seen[k])])
            elif run:
                runs.append(run)
                run = []
        runs.append(run)
        return [r for r in runs if len(r) > 1 and any(p[2] for p in r)]

    lines, houses = [], []
    for e in osm:
        t = e.get('tags', {})
        if e['type'] != 'way':
            continue
        kind = ('vlek' if 'aerialway' in t else 'potok' if 'waterway' in t
                else 'cesta' if t.get('highway') in ('track', 'unclassified', 'service') else
                'stezka' if 'highway' in t else None)
        if kind:
            for pts in line(e['geometry']):
                lines.append({'druh': kind, 'jmeno': t.get('name', ''), 'body': pts})
        elif 'building' in t:
            p = np.atleast_2d(enu3(*centroid(e['id']), ROOF))
            uv, depth = project(p, prm, cam)
            ok, seen = visible(p, uv, depth)
            if seen[0]:  # jen stavby, které jsou na snímku vidět
                houses.append({'jmeno': t.get('name', ''), 'x': int(round(uv[0, 0])), 'y': int(round(uv[0, 1])),
                               'm': int(np.linalg.norm(p[0] - cam))})

    for name, lat, lon, above in POINTS:
        p = np.atleast_2d(enu3(lat, lon, above))
        uv, _ = project(p, prm, cam)
        houses.append({'jmeno': name, 'x': int(round(uv[0, 0])), 'y': int(round(uv[0, 1])),
                       'm': int(np.linalg.norm(p[0] - cam))})
        print(f'{name}: x {uv[0, 0]:.0f}, y {uv[0, 1]:.0f}, {houses[-1]["m"]} m')

    data = {
        'kamera': {'natoceni': round(prm[0], 2), 'sklon': round(prm[1], 2), 'naklon': round(prm[2], 2),
                   'ohnisko': round(prm[3]), 'zkresleni': round(prm[4], 4), 'vyska': CAM_HEIGHT},
        'krok': STEP, 'sloupcu': len(xs), 'radku': len(ys),
        'vzdalenost': [int(round(v)) for v in dist.ravel()],
        'cary': lines, 'stavby': houses,
    }
    body = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    with open('js/teren.js', 'w', encoding='utf8') as f:
        f.write('// Vygenerováno skriptem tools/teren.py — neupravovat ručně, spustit ho znovu.\n'
                '// vzdalenost: metry od kamery k terénu v mřížce po `krok` px snímku (řádek po řádku);\n'
                '// cary/stavby: OpenStreetMap promítnutá do snímku, body čar [x, y, vidět] (podklad v editoru, M);\n'
                '// m = vzdálenost stavby od kamery.\n'
                'window.TEREN = ' + body + ';\n')
    print(f'js/teren.js: mřížka {len(xs)}×{len(ys)}, {len(lines)} čar, {len(houses)} staveb, {len(body) // 1024} kB')


if __name__ == '__main__':
    main()
