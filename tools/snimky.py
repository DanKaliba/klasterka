"""Převede snímky webkamery z pics/ do assets/frames/*.webp a zapíše jejich seznam do js/snimky.js.

Spuštění z kořene projektu:  python tools/snimky.py
"""
import json
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'pics')
DST = os.path.join(ROOT, 'assets', 'frames')
os.makedirs(DST, exist_ok=True)

names = []
total = 0
for f in sorted(os.listdir(SRC)):
    if not f.lower().endswith('.jpg'):
        continue
    name = f[:-4]
    out = os.path.join(DST, name + '.webp')
    if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(os.path.join(SRC, f)):
        Image.open(os.path.join(SRC, f)).convert('RGB').save(out, 'WEBP', quality=72, method=6)
    total += os.path.getsize(out)
    names.append(name)

with open(os.path.join(ROOT, 'js', 'snimky.js'), 'w', encoding='utf-8') as fh:
    fh.write('// Vygenerováno tools/snimky.py — needitovat ručně.\n')
    fh.write('window.SNIMKY = ' + json.dumps(names, indent=0) + ';\n')

print(f'{len(names)} snímků, {total / 1e6:.1f} MB')
