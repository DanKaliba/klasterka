"""Vystřihne zvuky kroků z Danielova videa: zmrzlá tráva → assets/zvuky/krok-<n>.mp3,
zmrzlá hlína s křupajícím ledem (první dva a poslední dva kroky videa) → assets/zvuky/led-<n>.mp3.

Potřebuje ffmpeg z balíčku imageio-ffmpeg (python -m pip install --user imageio-ffmpeg) a numpy.
Spuštění z kořene projektu:  python tools/kroky.py

Zvuk zůstává v celém pásmu (Daniel 2026-11-03: verze jen s výškami nad 700 Hz zněla nepřirozeně),
ubere se jen hučení mikrofonu pod 40 Hz. Aby se kroky nebily s kytarovým podkresem, hrají ve hře
potichu: hlasitost řídí K.STEP_VOLUME v js/jadro.js (zkouší se ?kroky=0.4).
"""
import os
import subprocess
import wave

import imageio_ffmpeg
import numpy as np

SR = 44100
VIDEO = 'sounds/input/WhatsApp Video 2026-11-03 at 10.36.30.mp4'
# (začátek, délka) v sekundách, vybrané podle obálky signálu; led praská déle než tráva
GRASS = [(t, 0.22) for t in (3.61, 3.86, 4.74, 5.95, 6.55, 7.67, 8.82, 9.02)]
ICE = [(2.20, 0.78), (3.08, 0.42), (10.49, 0.48), (11.73, 0.72)]


def loudness(s):
    # hlasitost nejhlasitějšího 0,1s okna = jak silně krok křupne (u ledu nerozhodují ticha mezi prasknutími)
    n = int(0.1 * SR)
    return np.sqrt(np.convolve(s ** 2, np.ones(n) / n, 'valid').max())


def main():
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    raw = subprocess.run([ff, '-v', 'error', '-i', VIDEO, '-vn', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float64) / 32768
    spec = np.fft.rfft(x)
    spec[np.fft.rfftfreq(len(x), 1 / SR) < 40] = 0
    x = np.fft.irfft(spec, len(x))
    os.makedirs('assets/zvuky', exist_ok=True)
    cuts = [('krok', n, t, d) for n, (t, d) in enumerate(GRASS, 1)] + [('led', n, t, d) for n, (t, d) in enumerate(ICE, 1)]
    for name, n, t, d in cuts:
        s = x[int(t * SR):int((t + d) * SR)].copy()
        fi, fo = int(0.003 * SR), int(0.07 * SR)
        s[:fi] *= np.linspace(0, 1, fi)
        s[-fo:] *= np.linspace(1, 0, fo) ** 2
        s *= 0.08 / loudness(s)
        s *= min(1, 0.95 / np.abs(s).max())  # bez ořezání špiček
        tmp = f'assets/zvuky/{name}-{n}.wav'
        with wave.open(tmp, 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((s * 32767).astype(np.int16).tobytes())
        subprocess.run([ff, '-v', 'error', '-y', '-i', tmp, '-c:a', 'libmp3lame', '-b:a', '96k',
                        f'assets/zvuky/{name}-{n}.mp3'], check=True)
        os.remove(tmp)
        print(f'{name}-{n}.mp3  od {t:.2f} s, {d:.2f} s')


if __name__ == '__main__':
    main()
