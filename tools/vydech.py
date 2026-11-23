# Výdech kouře (děda vyfukuje obláčky, kuchyně): syntetický „pfff“ ze šumu, bez cizí nahrávky.
# Krátké vydech-1…3 (malé obláčky, každý trochu jiný) a dlouhý vydech-dlouhy (hlavní obláček).
# Šum se tvaruje ve spektru (rty: pásmo ~0,5–4 kHz s vrcholem ~1,1 kHz, trocha hlubokého dechu),
# začíná drobným „p“ (rty se rozevřou) a slábne; mírné kolísání síly, ať nezní jako pára z ventilu.
# Spuštění z kořene projektu: python tools/vydech.py  → assets/zvuky/vydech-*.mp3
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/zvuky'
SR = 44100


def shaped_noise(n, rng, peak, width):
    """Bílý šum tvarovaný ve spektru: zvon kolem peak (Hz, log), + slabší hluboký dech."""
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR) + 1
    lf = np.log2(f)
    g = np.exp(-0.5 * ((lf - np.log2(peak)) / width) ** 2)
    g += 0.25 * np.exp(-0.5 * ((lf - np.log2(260)) / 0.6) ** 2)  # hrudní dech
    g[f < 90] = 0
    out = np.fft.irfft(spec * g, n)
    return out / np.abs(out).max()


def exhale(dur, seed, peak=1100, width=1.0, attack=0.03, p=0.6):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = shaped_noise(n, rng, peak * rng.uniform(0.9, 1.12), width)
    env = np.minimum(1, t / attack) * np.exp(-2.2 * t / dur) * np.clip((dur - t) / 0.12, 0, 1)
    env *= 1 + 0.12 * np.sin(2 * np.pi * rng.uniform(5, 8) * t + rng.uniform(0, 6))  # kolísání dechu
    y = x * env
    # „p“: krátký tupý náraz rtů na začátku
    k = int(0.012 * SR)
    burst = shaped_noise(k * 4, rng, 500, 0.8)[:k] * np.hanning(2 * k)[k:] * p
    y[:k] += burst
    return y


def save(name, y, peak=0.5):
    y = (y / np.abs(y).max() * peak * 32767).astype('<i2')
    OUT.mkdir(parents=True, exist_ok=True)
    cmd = [imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1',
           '-i', '-', '-b:a', '96k', str(OUT / f'{name}.mp3')]
    subprocess.run(cmd, input=y.tobytes(), check=True)
    print(name, round(len(y) / SR, 2), 's')


for i in range(3):
    save(f'vydech-{i + 1}', exhale(0.38 + 0.05 * i, seed=11 + i, peak=1250), peak=0.38)
save('vydech-dlouhy', exhale(1.25, seed=7, peak=950, width=1.15, attack=0.06, p=0.4), peak=0.5)
