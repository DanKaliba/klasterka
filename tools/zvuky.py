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
Daniel 2026-11-22: zurčení vody na cvrknutí žáby, mňouknutí kocoura; hlas hrdiny (VOICE) a vlek hlasem.
Daniel 2026-11-23: beran, slunce (zvoneček), šustot (suchý keř místo větviček), karta (lusknutí), okno (vrznutí); strom: nebudme, coje, řeč (hlas-strom-rec); odměna = hlas-vitezstvi; buch (pád hrnku), vrzani (skřípání dřeva), nalévání do hrnku (NALEVANI), tetřívek (mávnutí křídel).
Hudba (Jan Odvárka, Daniel 2026-11-22; sounds/hudba/, seznam HUDBA): hlavní (les a finále), na louce do první scény
vlastní, pak pochodák (2026-11-23), a dvě ke scéně Kantorská, muka a vrchol podle toho, co se ve scéně stalo (scene.music() v js/*.js). Každá je smyčka
s prolnutím HUDBA_XF s, ticho na začátku pryč, hlasitost srovnaná na HUDBA_RMS. Hra je pouští přes <audio>
(dlouhé skladby se nedekódují celé do paměti), proto bez přesahu PAD.

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
HUDBA_XF = 2.0  # prolnutí konce hudby do začátku (s)
HUDBA_RMS = 0.075  # všechny skladby stejně hlasité (jako hlavní), špička nejvýš HUDBA_PEAK
HUDBA_PEAK = 0.97
HUDBA = {
    'hudba': 'hlavni.mp3',  # „2. scena final (s klavesama)“: les a závěr z webkamery
    'hudba-louka': 'louka.mp3',  # „1. scena_final“ (Daniel 2026-11-23): louka od otevření hry do první scény
    'hudba-pochod': 'pochod.mp3',  # „Pochodák mezi scény“ (Daniel 2026-11-23): louka a chalupy po první scéně
    'hudba-kantorska-kour': 'kantorska-kour.mp3',  # „chalupa zakouřená“, než se rozhoří oheň
    'hudba-kantorska-ohen': 'kantorska-ohen.mp3',  # „veselá s ohněm“
    'hudba-muka-zaba': 'muka-zaba.mp3',  # „žába ještě neutekla“
    'hudba-muka-utekla': 'muka-utekla.mp3',  # „žába už utekla“
    'hudba-vrchol': 'vrchol.mp3',  # „tetřívek ještě před odletem“
    'hudba-vrchol-kytka': 'vrchol-kytka.mp3',  # „tetřívek je pryč, kytka je tu“
}
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


def music(ff, src, dst):
    x = load(ff, src, 2)
    loud = np.flatnonzero(np.abs(x).max(axis=1) > 0.01)
    x = x[max(0, loud[0] - int(0.01 * SR)):]
    n, m = len(x), int(HUDBA_XF * SR)
    t = np.linspace(0, np.pi / 2, m)[:, None]
    loop = x[:n - m].copy()
    loop[:m] = x[:m] * np.sin(t) + x[n - m:] * np.cos(t)
    loop *= min(HUDBA_RMS / np.sqrt(np.mean(loop ** 2)), HUDBA_PEAK / np.abs(loop).max())
    save(ff, loop, dst, '128k')


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
    # větev se ulomí z lávky (Daniel 2026-11-23); dopad pak hra dozvučí „buch“ (pád hrnku), viz pullBranch v les.js
    ('794523__modusmogulus__wooden-structure-breaking.wav', 'vetev', (0.0, 0.9), 0.003, 0.2, 0.85, None),
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
    # šustění suchého keře (Daniel 2026-11-23; dřív lámání větviček 765470)
    ('825425__sinny__dry-bush-04.mp3', 'sustot', (0.03, 0.75), 0.005, 0.2, 0.8, None),
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
    # Daniel 2026-11-23: poslední, nejhlubší bečení z nahrávky = beran v lese se probouzí
    ('471162__sheyvan__sheep-bleating.wav', 'beran', (18.95, 20.3), 0.01, 0.35, 0.9, None),
    # skleněný zvoneček: květina na vrcholu rozkvete
    ('152757__l15452__small_glass_bell_2.wav', 'slunce', (0.68, 4.2), 0.005, 1.2, 0.8, None),
    # Daniel 2026-11-23: slunce prosvitne v lese = lehké kovové cinknutí s chvěním (místo zvonečku)
    ('741355__mish7913__metal-clank-light-and-wobbling.flac', 'slunce-les', (0.27, 3.7), 0.003, 1.0, 0.8, None),
    # Daniel 2026-11-23: pohrabáč v Kantorské, první a poslední klapnutí z nahrávky (0,62 s a 7,07 s):
    # první = pohrabáč zpátky na tyč, poslední = sundání z tyče
    ('85555__maj061785__metal-clanking.aiff', 'pohrabac-na', (0.6, 1.25), 0.003, 0.25, 0.85, None),
    ('85555__maj061785__metal-clanking.aiff', 'pohrabac-dolu', (7.05, 7.43), 0.003, 0.15, 0.85, None),
    # strom v lese (Daniel 2026-11-23, nahrané hlasem): „nebuďte mě“ a „co je?“
    ('hlas/nebudme.m4a', 'nebudme', (2.3, 7.6), 0.02, 0.5, 0.9, 'highpass=f=60'),
    ('hlas/coje.mp4', 'coje', (2.0, 4.85), 0.02, 0.3, 0.9, 'highpass=f=60'),
    # skřípání dřeva (Daniel 2026-11-23): strom v lese se protahuje, čtyři varianty (K.VRZANI)
    ('618085__sit_walk__2022-02-06-wood-creak-1.wav', 'vrzani-1', (0.03, 1.85), 0.01, 0.3, 0.85, None),
    ('618084__sit_walk__2022-02-06-wood-creak-2.wav', 'vrzani-2', (0.12, 2.1), 0.01, 0.4, 0.85, None),
    ('618083__sit_walk__2022-02-06-wood-creak-3.wav', 'vrzani-3', (0.0, 0.59), 0.005, 0.12, 0.85, None),
    ('618082__sit_walk__2022-02-06-wood-creak-4.wav', 'vrzani-4', (0.03, 1.4), 0.01, 0.25, 0.85, None),
    # tetřívek mávne křídly: odlétá poražený z vrcholu, vzlétne ve finále, poskočí leknutím z Krakonoše
    ('676456__neartheatmoshphere__flapping-4.wav', 'tetrivek', (0.02, 0.8), 0.005, 0.25, 0.85, None),
    # pád hrnku: dopad do košíku (i vedlejší scény), Daniel 2026-11-23
    ('836521__valerie-vivegnis__book-dropped-on-table.mp3', 'buch', (1.22, 1.9), 0.003, 0.25, 0.85, None),
    # vrznutí okna v kuchyni (strom v lese má dál vlastní „vrzani“)
    ('323565__jameswrowles__creak-5-ps4.wav', 'okno', (0.45, 2.75), 0.01, 0.5, 0.8, None),
    # lusknutí prsty = karta (čtyři pokusy, hra losuje K.KARTA)
    ('508738__mariab_dasilva__snap-the-fingers.m4a', 'karta-1', (0.08, 0.32), 0.002, 0.1, 0.85, None),
    ('508738__mariab_dasilva__snap-the-fingers.m4a', 'karta-2', (0.98, 1.22), 0.002, 0.1, 0.85, None),
    ('508738__mariab_dasilva__snap-the-fingers.m4a', 'karta-3', (1.93, 2.17), 0.002, 0.1, 0.85, None),
    ('508738__mariab_dasilva__snap-the-fingers.m4a', 'karta-4', (2.82, 3.2), 0.002, 0.1, 0.85, None),
]

# Hlas hrdiny (Andrea Kubisová, Daniel 2026-11-22; sounds/hlas/*.m4a): v každé nahrávce je slovo namluvené
# několikrát, každý pokus je zvlášť (hlas-<jméno>-1…N.mp3) a hra je losuje (K.HLAS v js/jadro.js).
# Pokusy (od, do v s) našlo dělení podle ticha; špatný pokus stačí smazat ze seznamu a z K.HLAS.
VOICE = {
    'hop': ('hop.m4a', [(3.59, 3.72), (4.77, 4.88), (5.76, 5.89), (7.74, 7.85), (8.68, 8.8), (9.51, 9.59),
                        (10.33, 10.45), (11.11, 11.22), (11.83, 11.96)]),
    'jeste': ('jeste-jednu.m4a', [(1.06, 1.9), (3.03, 3.37), (4.2, 4.67), (5.65, 5.94), (6.8, 7.07), (7.96, 8.54)]),
    'staci': ('staci.m4a', [(0.89, 1.16), (2.65, 2.88), (3.84, 4.07), (4.99, 5.29), (6.17, 6.41), (7.27, 7.54),
                            (8.3, 8.56)]),
    'vitezstvi': ('vitezstvi.m4a', [(0.92, 1.44), (2.23, 2.6), (3.31, 3.9), (5.0, 5.96), (6.92, 7.72), (8.91, 9.73)]),
    'snih': ('snih.m4a', [(2.0, 3.1), (4.58, 5.55), (6.07, 6.72)]),
    # strom mluví, když ukazuje herbář (Daniel 2026-11-23, „Strom řeč“): sedm kousků, hra je losuje
    'strom-rec': ('strom-rec.m4a', [(1.67, 5.46), (6.39, 11.27), (13.58, 15.49), (17.32, 19.47), (21.19, 23.86),
                                    (25.55, 27.27), (28.59, 31.53)]),
    # radost, když zažene žábu dýmem (studánka); dvě nahrávky, pokus může mít vlastní soubor (soubor, od, do)
    # „brr“: nahrávka je řada pokusů za sebou, použijí se první tři (Daniel 2026-11-22)
    'brr': ('zima.m4a', [(1.45, 1.95), (2.6, 2.95), (3.1, 3.58)]),
    'smich': ('smich-1.m4a', [(1.36, 2.03), (3.18, 3.55), (4.23, 4.61), ('smich-2.m4a', 1.2, 1.6)]),
}
# vlek hlasem: všechny tři pokusy spojené za sebou s prolnutím (Daniel 2026-11-22). Je to smyčka (konec se
# prolne do začátku, kraje mají PAD jako stádo), hraje celou dobu, co vlek jede (Daniel 2026-11-23).
VLEK = ('vlek.m4a', [(1.48, 6.34), (7.44, 11.13), (13.12, 13.8)])
VLEK_XF = 0.35  # prolnutí mezi pokusy (s)


def joined(ff, src, dst, spans, xf, peak, af, loop=False):
    """Pokusy z jedné nahrávky za sebou: každý zvlášť srovnaný na stejnou hlasitost, švy prolnuté.
    loop: i konec se prolne do začátku a kraje dostanou přesah PAD (pro K.loop)."""
    x = load(ff, src, 1, af)
    parts = []
    for a, b in spans:
        p = x[int(max(0, a - 0.05) * SR):int((b + 0.15) * SR)].copy()
        parts.append(p / max(1e-6, np.sqrt(np.mean(p ** 2))))  # stejná hlasitost (RMS)
    m = int(xf * SR)
    t = np.linspace(0, np.pi / 2, m)[:, None]
    out = parts[0]
    for p in parts[1:]:
        out = np.concatenate([out[:-m], out[-m:] * np.cos(t) + p[:m] * np.sin(t), p[m:]])
    if loop:
        out = np.concatenate([out[-m:] * np.cos(t) + out[:m] * np.sin(t), out[m:-m]])
        p = int(PAD * SR)
        out = np.concatenate([out[-p:], out, out[:p]])
    else:
        a = int(0.05 * SR)
        out[:a] *= np.linspace(0, 1, a)[:, None]
        b = int(0.6 * SR)
        out[-b:] *= np.linspace(1, 0, b)[:, None] ** 2
    out *= peak / np.abs(out).max()
    save(ff, out, dst, '96k')

# nalévání do hrnku (Daniel 2026-11-23, voda z kohoutku): hrnek se plní, tón stoupá (zrychlení 1 → NALEVANI_UP)
NALEVANI = ('854133__alexzavesa__water-flows-from-the-tap.wav', (0.25, 2.45))
NALEVANI_UP = 1.3


def pour(ff, src, dst, span, up):
    """Výřez přehraný s plynule rostoucí rychlostí: výška stoupá jako u plnící se nádoby."""
    x = load(ff, src, 1)[:, 0]
    x = x[int(span[0] * SR):int(span[1] * SR)]
    rate = np.linspace(1, up, len(x))
    pos = np.cumsum(rate)
    pos = pos[pos < len(x) - 1]
    y = np.interp(pos, np.arange(len(x)), x)[:, None]
    a, b = int(0.05 * SR), int(0.35 * SR)
    y[:a] *= np.linspace(0, 1, a)[:, None]
    y[-b:] *= np.linspace(1, 0, b)[:, None] ** 2
    y *= 0.8 / np.abs(y).max()
    save(ff, y, dst, '96k')


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
    for name, src in HUDBA.items():
        music(ff, 'sounds/hudba/' + src, f'assets/zvuky/{name}.mp3')
    timber(ff, 'sounds/timber.wav', 'assets/zvuky/strom-pada.mp3')
    triangle(ff, 'sounds/349504__cabled_mess__triangle_open_04.wav', 'assets/zvuky/triangl-1.mp3')
    triangle(ff, 'sounds/465637__zabuhailo__triangle_0831s12.flac', 'assets/zvuky/triangl-2.mp3')
    for src, name, span, fin, fout, peak, af in CLIPS:
        clip(ff, 'sounds/' + src, f'assets/zvuky/{name}.mp3', span, fin, fout, peak, af)
    pour(ff, 'sounds/' + NALEVANI[0], 'assets/zvuky/nalevani.mp3', NALEVANI[1], NALEVANI_UP)
    for name, (src, takes) in VOICE.items():
        for i, take in enumerate(takes):
            f, a, b = take if len(take) == 3 else (src, *take)
            # kousek ticha před a doznění za slovem, horní propust proti hučení mikrofonu
            clip(ff, 'sounds/hlas/' + f, f'assets/zvuky/hlas-{name}-{i + 1}.mp3', (max(0, a - 0.05), b + 0.12),
                 0.02, 0.1, 0.9, 'highpass=f=90')
    src, spans = VLEK
    joined(ff, 'sounds/hlas/' + src, 'assets/zvuky/vlek.mp3', spans, VLEK_XF, 0.9, 'highpass=f=90', loop=True)


if __name__ == '__main__':
    main()
