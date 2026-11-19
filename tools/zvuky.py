"""Převede Danielovy zvuky ze sounds/ (gitignore) do hry (assets/zvuky). Zdroje a autoři: podekovani.html
(odkud je soubor stažený, ukáže Windows: Get-Content <soubor> -Stream Zone.Identifier).
sheep_1.wav, sheep_2.wav → assets/zvuky/ovce-1.mp3, ovce-2.mp3 (bečení po kliku na ovci, střídá se náhodně),
sheep_lamb.mp3 → assets/zvuky/jehne.mp3 (jedna ovce ze stáda je jehně),
sheep_flock.aiff → assets/zvuky/stado.mp3 (stádo na pozadí scén s ovcemi, hraje ve smyčce),
triangle_open_04.wav, triangle_0831s12.flac → assets/zvuky/triangl-1.mp3, triangl-2.mp3 (kapka z rampouchu,
náhodně jeden z nich; dozvuk zkrácený na TRIANGL s),
timber.wav → assets/zvuky/strom-pada.mp3 (souška v lese: vrzání a praskání, rána přijde STROM_RANA s od začátku).

Daniel 2026-11-19 (Freesound, autoři a licence v podekovani.html; nový zvuk tam dopsat), výřezy v CLIPS:
tokání tetřívka (začátek nahrávky), vrzání dveří, kašel ve třech variantách, kamínek (zesílený), oheň ve dvou
variantách. Hra varianty losuje (K.sound(['kasel-1', 'kasel-2', 'kasel-3'])).

Stádo je smyčka bez švu: posledních XF sekund se prolne do začátku. Na oba kraje se navíc přidá
PAD sekund přesahu (konec smyčky před začátek, začátek za konec), protože mp3 kodér přidává na kraje
ticho; hra pak opakuje jen úsek PAD…délka−PAD (K.loop v js/jadro.js má stejné PAD).

Potřebuje ffmpeg z balíčku imageio-ffmpeg a numpy. Spuštění z kořene projektu:  python tools/zvuky.py
"""
import os
import subprocess

import imageio_ffmpeg
import numpy as np

SR = 44100
XF = 3.0   # prolnutí konce smyčky do začátku (s)
PAD = 0.2  # přesah na krajích (s), musí sedět s LOOP_PAD v js/jadro.js
# padající strom: úsek nahrávky (s); rána je pak 4,15 s od začátku (STROM_RANA v js/les.js)
STROM = (0.6, 6.4)
TRIANGL = 4.0  # délka triangl-1/2 (s), poslední 1,5 s se ztiší


def load(ff, path, channels, af=None):
    filt = ['-af', af] if af else []
    raw = subprocess.run([ff, '-v', 'error', '-i', path, *filt, '-ac', str(channels), '-ar', str(SR), '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    return (np.frombuffer(raw, np.int16).astype(np.float64) / 32768).reshape(-1, channels)


def save(ff, x, path, bitrate):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run([ff, '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', str(x.shape[1]), '-i', '-',
                    '-c:a', 'libmp3lame', '-b:a', bitrate, path], input=pcm, check=True)
    print(path, f'{len(x) / SR:.2f} s', f'{os.path.getsize(path) // 1024} kB')


def bleat(ff, src, dst):
    x = load(ff, src, 1)
    # ticho na začátku pryč (ovce má zabečet hned po kliku), konec doztratit
    loud = np.flatnonzero(np.abs(x[:, 0]) > 0.02)
    x = x[max(0, loud[0] - int(0.01 * SR)):loud[-1] + int(0.05 * SR)]
    n = int(0.03 * SR)
    x[-n:] *= np.linspace(1, 0, n)[:, None]
    save(ff, x, dst, '96k')


def flock(ff, src, dst):
    x = load(ff, src, 2)
    n, m = len(x), int(XF * SR)
    t = np.linspace(0, np.pi / 2, m)[:, None]
    loop = x[:n - m].copy()
    # stejný výkon přes prolnutí (stádo je šum, ne jeden tón)
    loop[:m] = x[:m] * np.sin(t) + x[n - m:] * np.cos(t)
    p = int(PAD * SR)
    save(ff, np.concatenate([loop[-p:], loop, loop[:p]]), dst, '96k')


def triangle(ff, src, dst):
    x = load(ff, src, 2)
    loud = np.flatnonzero(np.abs(x).max(axis=1) > 0.02)
    x = x[max(0, loud[0] - int(0.005 * SR)):][:int(TRIANGL * SR)].copy()
    n = int(1.5 * SR)
    x[-n:] *= np.linspace(1, 0, n)[:, None] ** 2
    save(ff, x, dst, '96k')


def timber(ff, src, dst):
    x = load(ff, src, 2)
    x = x[int(STROM[0] * SR):int(STROM[1] * SR)].copy()
    n = int(0.6 * SR)
    x[-n:] *= np.linspace(1, 0, n)[:, None]
    save(ff, x, dst, '96k')


# výřez (od, do v s), náběh a doznění (s), cílová špička, filtr ffmpeg (horní propust proti větru a hukotu)
CLIPS = [
    ('787909__northumberland_sound_archive__red-grouse-at-blanchland-moor.wav', 'tetrivek-tokani',
     (0.65, 2.55), 0.02, 0.25, 0.9, 'highpass=f=250'),
    ('585333__yousefthe2ndgen__door-creaking.mp3', 'dvere', (0.0, 2.75), 0.01, 0.4, 0.85, None),
    ('743360__qubodup__strong-double-cough.wav', 'kasel-1', (0.0, 1.05), 0.005, 0.15, 0.85, None),
    ('41387__sandyrb__db-cough-003.wav', 'kasel-2', (0.0, 0.65), 0.005, 0.12, 0.85, None),
    ('650914__frenkfurth__coughing-001.wav', 'kasel-3', (0.17, 0.78), 0.005, 0.12, 0.85, None),
    ('707887__jandrelombaard__skipping-pebble-on-cement.wav', 'kaminek', (0.72, 0.92), 0.002, 0.1, 0.95,
     'highpass=f=120,acompressor=threshold=0.05:ratio=6:attack=0.1:release=40:makeup=4'),
    ('765503__jjsounddesigner__firewood-crackling-variation-2.wav', 'ohen-1', (0.0, 4.0), 0.2, 1.0, 0.8, None),
    ('765502__jjsounddesigner__firewood-crackling-variation-1.wav', 'ohen-2', (0.4, 3.4), 0.05, 0.8, 0.8, None),
]


def clip(ff, src, dst, span, fin, fout, peak, af):
    x = load(ff, src, 1, af)
    x = x[int(span[0] * SR):int(span[1] * SR)].copy()
    a, b = int(fin * SR), int(fout * SR)
    if a:
        x[:a] *= np.linspace(0, 1, a)[:, None]
    x[-b:] *= np.linspace(1, 0, b)[:, None] ** 2
    x *= peak / max(1e-6, np.abs(x).max())  # tichý kamínek zesílí, hlasitý kašel ztiší
    save(ff, x, dst, '96k')


def main():
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    os.makedirs('assets/zvuky', exist_ok=True)
    bleat(ff, 'sounds/sheep_1.wav', 'assets/zvuky/ovce-1.mp3')
    bleat(ff, 'sounds/sheep_2.wav', 'assets/zvuky/ovce-2.mp3')
    bleat(ff, 'sounds/sheep_lamb.mp3', 'assets/zvuky/jehne.mp3')
    flock(ff, 'sounds/sheep_flock.aiff', 'assets/zvuky/stado.mp3')
    timber(ff, 'sounds/timber.wav', 'assets/zvuky/strom-pada.mp3')
    triangle(ff, 'sounds/349504__cabled_mess__triangle_open_04.wav', 'assets/zvuky/triangl-1.mp3')
    triangle(ff, 'sounds/465637__zabuhailo__triangle_0831s12.flac', 'assets/zvuky/triangl-2.mp3')
    for src, name, span, fin, fout, peak, af in CLIPS:
        clip(ff, 'sounds/' + src, f'assets/zvuky/{name}.mp3', span, fin, fout, peak, af)


if __name__ == '__main__':
    main()
