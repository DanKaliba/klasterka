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
Daniel 2026-11-20: vrznutí větve, šplouchnutí, Kyrie u božích muk (zkrácené, doznívá), chrápání berana;
otřepání a trknutí berana, ťuknutí a dýmka ve dvou variantách (K.TUK, K.DYMKA v js/jadro.js), předení kocoura;
lámání větviček (šustot), potok (voda a bublání), žába (tři nálady), růst květiny, vítr, poklice (tři cvaknutí, K.POKLICE);
Daniel 2026-11-22: zurčení vody na cvrknutí žáby, mňouknutí kocoura.
Podkresová hudba (Daniel 2026-11-22, „2. scena final (s klavesama)“) → assets/zvuky/hudba.mp3: smyčka jako
stádo (prolnutí HUDBA_XF s), ticho na začátku pryč; hraje ve všech scénách (K.MUSIC_VOLUME v js/jadro.js).

Stádo i hudba jsou smyčka bez švu: posledních XF sekund se prolne do začátku. Na oba kraje se navíc přidá
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
HUDBA_XF = 2.0  # prolnutí konce hudby do začátku (s); hudba končí naplno, ne doznělá
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


def flock(ff, src, dst, xf=XF, bitrate='96k'):
    x = load(ff, src, 2)
    loud = np.flatnonzero(np.abs(x).max(axis=1) > 0.01)
    x = x[max(0, loud[0] - int(0.01 * SR)):]  # ticho na začátku pryč (hudba ho má 0,2 s)
    n, m = len(x), int(xf * SR)
    t = np.linspace(0, np.pi / 2, m)[:, None]
    loop = x[:n - m].copy()
    # stejný výkon přes prolnutí (stádo je šum, ne jeden tón)
    loop[:m] = x[:m] * np.sin(t) + x[n - m:] * np.cos(t)
    p = int(PAD * SR)
    save(ff, np.concatenate([loop[-p:], loop, loop[:p]]), dst, bitrate)


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
    ('506665__rudmer_rotteveel__wood-creak-single-v10.wav', 'vetev', (0.0, 1.0), 0.005, 0.3, 0.85, None),
    # dlouhá nahrávka s několika žbluňknutími; tohle je to nejplnější (dopad a dočvachtnutí)
    ('703512__jfishsom__splash-recording-2.wav', 'splouchnuti', (66.42, 67.6), 0.01, 0.35, 0.85, None),
    # první vstup sboru, pak pomalu dozní (hra ho při dalším kliku nepouští znovu, dokud nedozní: KYRIE v muka.js)
    ('121110__dobroide__20110520tlvictoria_kyrie_e_leison.wav', 'kyrie', (0.4, 8.4), 0.3, 3.0, 0.7, None),
    ('760036__stevielematt__snore-03_44100.wav', 'chrapot', (0.15, 2.1), 0.05, 0.45, 0.85, None),
    ('635115__jocelynlopez__dog-shaking-off.wav', 'otrepani', (0.05, 1.9), 0.02, 0.4, 0.8, None),
    ('572753__fmaudio__knocking-into-pile-of-large-stones-1.wav', 'trknuti', (0.07, 0.68), 0.005, 0.15, 0.95, None),
    ('632329__audacitier__knock-2.mp3', 'tuk-1', (0.0, 0.11), 0.0, 0.03, 0.85, None),
    ('629987__flem0527__knocking-on-wood-door-1.wav', 'tuk-2', (0.08, 0.28), 0.003, 0.08, 0.85, None),
    # dva bafy (mlasknutí rtů o náustek); druhá nahrávka je potáhnutí z dýmky, nahraná hodně potichu
    ('266772__athenspublic__smoking-the-pipe.aiff', 'dymka-1', (2.36, 3.45), 0.005, 0.2, 0.8, None),
    ('542181__diancoetzer200130__person-pulling-old-wooden-pipe-sound-effect.wav', 'dymka-2', (0.15, 1.6), 0.1,
     0.4, 0.8, 'highpass=f=150'),
    # čtyři vrny, nahrané potichu
    ('575933__razzledizzle__cat-purr.mp3', 'predeni', (0.2, 5.5), 0.1, 0.6, 0.8, None),
    ('765470__jjsounddesigner__breaking-twigs-variation-1.wav', 'sustot', (0.05, 1.6), 0.01, 0.4, 0.8, None),
    # potok: nejklidnější úsek na tekoucí vodu, nejvíc čeřený (kolísá hlasitost) na probublání pramene
    ('635442__onetwo_ber__stream_finland1.wav', 'voda', (52.5, 56.5), 0.4, 1.5, 0.6, None),
    ('635442__onetwo_ber__stream_finland1.wav', 'bublani', (29.0, 30.6), 0.15, 0.5, 0.75, None),
    # žába (Iwan Gabovitch, Team Masaka: hlasem zahrané nálady za sebou; licence chce odkaz ve hře, je v
    # podekovani.html). Čísla hlasů: sounds/poslech-zaba.html. 2 zájem = vykoukne, 7 = nafoukne se,
    # 8 strach = lekne se dýmu (Daniel 2026-11-22).
    ('197423__teammasaka__iwan-gabovitch-frog.flac', 'kvak', (1.55, 1.95), 0.005, 0.08, 0.85, None),
    ('197423__teammasaka__iwan-gabovitch-frog.flac', 'kvak-zly', (7.17, 7.88), 0.005, 0.1, 0.9, None),
    ('197423__teammasaka__iwan-gabovitch-frog.flac', 'kvak-strach', (8.11, 8.53), 0.005, 0.1, 0.85, None),
    # 2,4 s natažené bez změny výšky na 3,2 s, jak dlouho květina roste (bloom v js/vrchol.js)
    ('233201__basoap__growing-bulbous-nose.wav', 'chorose', (0.15, 3.25), 0.1, 0.8, 0.7, 'atempo=0.75'),
    # poryv přes rozfoukání pylu a zatmění do finále (asi 4 s)
    ('379471__vandale__wind4.mp3', 'vitr', (0.15, 4.2), 0.3, 1.2, 0.75, None),
    # tři samostatná cvaknutí kovu (nahrávka je řada ťuknutí s pauzami)
    ('545547__rsellick__metal-clanks.wav', 'poklice-1', (0.64, 0.95), 0.003, 0.15, 0.8, None),
    ('545547__rsellick__metal-clanks.wav', 'poklice-2', (4.16, 4.47), 0.003, 0.15, 0.8, None),
    ('545547__rsellick__metal-clanks.wav', 'poklice-3', (12.13, 12.47), 0.003, 0.15, 0.8, None),
    # nejostřejší žbluňknutí z minuty zurčení: žába cvrkne panáčkovi do obličeje (kapky letí asi 0,6 s)
    ('105314__benboncan__gurgling-3.wav', 'cvrk', (41.92, 42.55), 0.003, 0.2, 0.85, None),
    # jedno mňouknutí; hra mu mění výšku (horká římsa, shozený hrnek, leknutí na dědově hlavě)
    ('61259__timtube__cat-meowing.wav', 'mnau', (0.58, 1.6), 0.005, 0.15, 0.85, None),
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
    flock(ff, 'sounds/Klasterka__2. scena final (s klavesama).mp3', 'assets/zvuky/hudba.mp3', HUDBA_XF, '128k')
    timber(ff, 'sounds/timber.wav', 'assets/zvuky/strom-pada.mp3')
    triangle(ff, 'sounds/349504__cabled_mess__triangle_open_04.wav', 'assets/zvuky/triangl-1.mp3')
    triangle(ff, 'sounds/465637__zabuhailo__triangle_0831s12.flac', 'assets/zvuky/triangl-2.mp3')
    for src, name, span, fin, fout, peak, af in CLIPS:
        clip(ff, 'sounds/' + src, f'assets/zvuky/{name}.mp3', span, fin, fout, peak, af)


if __name__ == '__main__':
    main()
