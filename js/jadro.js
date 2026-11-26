// Jádro hry: plátno, smyčka, vstup, časovače, načítání snímků, HUD a přechody.
// Svět má pevných 1920×1080 bodů (velikost snímku webkamery) a plátno se do okna jen škáluje.
const K = window.K = {};
K.W = 1920;
K.H = 1080;
K.params = new URLSearchParams(location.search);
K.debug = K.params.has('debug');
K.speed = parseFloat(K.params.get('rychle')) || 1;
K.time = 0;
K.boil = 0; // takt „vařících se“ čar ručně kreslených postaviček (8× za sekundu)

// ---------- rozložení (editor si drží rozpracovanou verzi v localStorage) ----------
K.LS_KEY = 'klasterka-rozlozeni';
K.L = JSON.parse(JSON.stringify(window.ROZLOZENI));
try {
  const saved = JSON.parse(localStorage.getItem(K.LS_KEY));
  // starší rozpracovaný stav než soubor (soubor jsem mezitím upravil ručně) se zahodí,
  // stejně jako stav, kterému chybí chalupa přidaná do souboru (jinak by nešla dohrát)
  const ids = (l) => l.chalupy.map((c) => c.id).filter(Boolean);
  if (saved && saved.verze >= K.L.verze && ids(K.L).every((id) => ids(saved).includes(id))) K.L = saved;
} catch (e) { /* bez localStorage hrajeme s rozložením ze souboru */ }

// ---------- plátno a měřítko ----------
K.canvas = document.getElementById('hra');
K.ctx = K.canvas.getContext('2d');
K.view = { s: 1, ox: 0, oy: 0, dpr: 1 };

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const w = innerWidth, h = innerHeight;
  K.canvas.width = Math.round(w * dpr);
  K.canvas.height = Math.round(h * dpr);
  K.canvas.style.width = w + 'px';
  K.canvas.style.height = h + 'px';
  const s = Math.min(w / K.W, h / K.H);
  K.view = { s, ox: (w - K.W * s) / 2, oy: (h - K.H * s) / 2, dpr };
  // změna velikosti plátno vymaže; v testu (čas stojí) by zůstalo prázdné
  if (K.render) K.render();
}
addEventListener('resize', resize);
resize();

K.toWorld = (e) => ({
  x: (e.clientX - K.view.ox) / K.view.s,
  y: (e.clientY - K.view.oy) / K.view.s,
});

// ---------- pomocné funkce ----------
K.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
K.lerp = (a, b, t) => a + (b - a) * t;
K.ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
K.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
K.rand = (a, b) => a + Math.random() * (b - a);
K.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
// deterministický šum 0..1 pro chvění čar
K.hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// vzdálenost (m) od kamery k terénu viděnému v bodě snímku — mřížka z js/teren.js (tools/teren.py)
K.distAt = (x, y) => {
  const T = window.TEREN;
  const gx = K.clamp(x / T.krok, 0, T.sloupcu - 1.001), gy = K.clamp(y / T.krok, 0, T.radku - 1.001);
  const j = Math.floor(gx), i = Math.floor(gy), fx = gx - j, fy = gy - i;
  const d = (r, c) => T.vzdalenost[r * T.sloupcu + c];
  return K.lerp(K.lerp(d(i, j), d(i, j + 1), fx), K.lerp(d(i + 1, j), d(i + 1, j + 1), fx), fy);
};
// měřítko postavičky podle skutečné vzdálenosti: dál = menší, ale pomaleji než ve skutečnosti
// (mocnina 0,66 místo 1), ať jsou postavy na protější louce ještě vidět
K.scaleAt = (x, y) => K.clamp(15 * K.distAt(x, y) ** -0.66, 0.06, 1.25);

// y lomené čáry (body seřazené podle x) v daném x; mimo rozsah drží krajní hodnotu
K.polyY = (pts, x) => {
  if (x <= pts[0].x) return pts[0].y;
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i].x) return K.lerp(pts[i - 1].y, pts[i].y, (x - pts[i - 1].x) / (pts[i].x - pts[i - 1].x));
  }
  return pts[pts.length - 1].y;
};

K.inPolygon = (pt, poly) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};

K.randomInPolygon = (poly) => {
  const xs = poly.map((p) => p.x), ys = poly.map((p) => p.y);
  for (let i = 0; i < 200; i++) {
    const pt = { x: K.rand(Math.min(...xs), Math.max(...xs)), y: K.rand(Math.min(...ys), Math.max(...ys)) };
    if (K.inPolygon(pt, poly)) return pt;
  }
  return { x: poly[0].x, y: poly[0].y };
};

// ---------- časovače (běží v herním čase, takže je zrychlí i ?rychle=) ----------
const timers = [];
K.after = (sec) => new Promise((r) => timers.push({ t: sec, r }));
K.tween = (dur, fn) => new Promise((r) => timers.push({ t: dur, d: dur, fn, r }));

function runTimers(dt) {
  for (let i = timers.length - 1; i >= 0; i--) {
    const tm = timers[i];
    tm.t -= dt;
    if (tm.fn) tm.fn(K.clamp(1 - tm.t / tm.d));
    if (tm.t <= 0) {
      timers.splice(i, 1);
      tm.r();
    }
  }
}

// ---------- obrázky ----------
const images = {};
// obrázek, který se nenačte (výpadek sítě, souběh se stahováním snímků finále), se zkusí znovu po 1, 3 a 7 s;
// jinak by třeba jediný chybějící díl loutky nechal hrdinu celou hru kreslit čarou (Daniel 2026-11-24)
const IMG_RETRY = [1, 3, 7];
K.img = (src) => {
  if (!images[src]) {
    const im = new Image();
    let tries = 0;
    im.addEventListener('error', () => {
      if (tries >= IMG_RETRY.length) return console.warn('obrázek se nenačetl:', src);
      setTimeout(() => { im.src = `${src}${src.includes('?') ? '&' : '?'}znovu=${++tries}`; }, IMG_RETRY[tries] * 1000);
    });
    im.src = src;
    images[src] = im;
  }
  return images[src];
};
K.ready = (im) => im.complete && im.naturalWidth > 0;
K.frameSrc = (name) => `assets/frames/${name}.webp`;
K.frame = (name) => K.img(K.frameSrc(name));
K.load = (srcs) => Promise.all(srcs.map((s) => {
  const im = K.img(s);
  if (K.ready(im) || (im.complete && im.src)) return null;
  return new Promise((r) => {
    im.addEventListener('load', r, { once: true });
    im.addEventListener('error', r, { once: true });
  });
}));

// "2026-01-04_1300" → true: od 4. 1. 2026 leží na snímcích sníh
K.isWinter = (name) => name >= '2026-01-04';

// Fotka zabírá celé plátno.
K.drawFrame = (ctx, name, alpha = 1) => {
  const im = K.frame(name);
  if (!K.ready(im) || alpha <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.drawImage(im, 0, 0, K.W, K.H);
  ctx.globalAlpha = 1;
};

// ---------- zvuky (soubory dodá Daniel do assets/zvuky/<jméno>.mp3) ----------
K.muted = K.params.has('ticho');
// Přes web se zvuky stáhnou a dekódují předem do Web Audio, pak hrají hned a mohou se překrývat
// (<audio> na GitHub Pages při rychlých krocích většinu zvuků nestihl). Z file:// fetch nejde,
// tam zůstává <audio>. Kontext se rozběhne až po prvním kliku (pravidla prohlížečů pro zvuk).
const actx = location.protocol !== 'file:' && window.AudioContext ? new AudioContext() : null;
const unlockAudio = () => { if (actx && actx.state === 'suspended') actx.resume(); };
addEventListener('pointerdown', unlockAudio, true); // capture: dřív, než klik zpracuje scéna
addEventListener('keydown', unlockAudio, true);
const sounds = {}; // jméno → AudioBuffer | <audio> | undefined (načítá se) | null (soubor chybí)
const loading = {};
K.soundStats = { played: 0, notReady: 0 }; // pro testy
const getSound = (name) => {
  if (!(name in sounds)) {
    const url = `assets/zvuky/${name}.mp3`;
    sounds[name] = undefined;
    if (actx) {
      loading[name] = fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
        .then((data) => actx.decodeAudioData(data))
        .then((buf) => { sounds[name] = buf; }, () => { sounds[name] = null; });
    } else {
      const a = new Audio(url);
      a.onerror = () => { sounds[name] = null; };
      sounds[name] = a;
    }
  }
  return sounds[name];
};
// volume 0–1, rate = rychlost přehrávání (mění i výšku, pro obměnu opakovaných zvuků).
// name může být pole variant (K.KASEL, K.OHEN): zahraje se náhodně jedna z nich.
K.sound = (name, o = {}) => {
  if (Array.isArray(name)) name = K.pick(name);
  if (K.muted) return;
  const s = getSound(name);
  if (s === undefined) {
    // ještě se načítá: zahraje se, pokud se stihne do 0,3 s, jinak by přišel pozdě. Hlas hrdiny počká
    // déle (1,5 s): pozdní „brr“ je lepší než žádné (na mobilu se soubor stahuje pomaleji, 2026-11-23).
    // Řeč stromu ne: kousky jdou za sebou (treeSpeech v les.js), pozdní by se překryl s dalším.
    K.soundStats.notReady++;
    const t = K.time, late = o.late ?? (name.startsWith('hlas-') && !name.startsWith('hlas-strom-') ? 1.5 : 0.3);
    loading[name].then(() => { if (K.time - t < late) K.sound(name, o); });
    return;
  }
  if (!s) return;
  K.soundStats.played++;
  if (K.onSoundPlay) K.onSoundPlay(name); // směšovač zvýrazní, co právě hraje
  // SOUND_GAIN = hlasitost souboru ze směšovače (js/mix.js), násobí hlasitost z místa ve hře
  const volume = K.clamp((o.volume ?? 1) * (K.SOUND_GAIN[name] ?? 1), 0, 4), rate = o.rate ?? 1;
  if (s instanceof AudioBuffer) {
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; // bez kliku nehraje
    // hudba se pod zvukem ztiší (kroky a jiné tiché zvuky v pozadí ji nechají být)
    if (volume >= K.DUCK_FROM) duckUntil = Math.max(duckUntil, actx.currentTime + s.duration / rate);
    const src = actx.createBufferSource();
    src.buffer = s;
    src.playbackRate.value = rate;
    const gain = actx.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(actx.destination);
    src.start();
    return;
  }
  s.volume = K.clamp(volume);
  s.preservesPitch = false;
  s.playbackRate = rate;
  s.currentTime = 0;
  s.play().catch(() => {});
};
// načíst zvuky předem (třeba při vstupu do scény), ať první zahrání nepřijde pozdě
K.preloadSounds = (names) => { for (const n of names.flat()) getSound(n); };
K.soundNames = () => Object.keys(sounds); // pro směšovač: co hra už chtěla
// délka načteného zvuku v s (null, dokud se načítá nebo chybí): třeba jak dlouho má strom hýbat pusou
K.soundLength = (name) => { const s = sounds[name]; return s ? s.duration || null : null; };
// hlasitost jednotlivých souborů (1 = beze změny), ladí se ve směšovači (klávesa M, js/mix.js)
// Daniel 2026-11-22 ze směšovače
K.SOUND_GAIN = { trknuti: 0.95 };
// varianty zvuků (tools/zvuky.py), hra je losuje
K.KASEL = ['kasel-1', 'kasel-2', 'kasel-3'];
K.OHEN = ['ohen-1', 'ohen-2'];
K.TUK = ['tuk-1', 'tuk-2'];
K.DYMKA = ['dymka-1', 'dymka-2'];
K.POKLICE = ['poklice-1', 'poklice-2', 'poklice-3'];
K.KARTA = ['karta-1', 'karta-2', 'karta-3', 'karta-4']; // lusknutí karty (vrchol)
K.VRZANI = ['vrzani-1', 'vrzani-2', 'vrzani-3', 'vrzani-4']; // strom v lese se protahuje
K.TRIANGL = ['triangl-1', 'triangl-2']; // cinknutí ledu: kapka, rampouch (les, vrchol)
// hlas hrdiny (Andrea Kubisová): pokusy hlas-<jméno>-1…N, počty podle VOICE v tools/zvuky.py
const takes = (name, n) => Array.from({ length: n }, (_, i) => `hlas-${name}-${i + 1}`);
K.HLAS = {
  hop: takes('hop', 9), // výskok (kuchyně k oknu a k polici, les přes kořeny)
  jeste: takes('jeste', 6), // „ještě jednu“ (vrchol, další karta)
  staci: takes('staci', 7), // „stačí“
  vitezstvi: takes('vitezstvi', 6), // porazí tetřívka
  snih: takes('snih', 3), // odpoví stromu, co potřebuje
  smich: takes('smich', 4), // zažene žábu dýmem (studánka)
  strom: takes('strom-rec', 7), // strom mluví nad herbářem (les)
  brr: takes('brr', 3), // zima u ledového potoka (les), po cvrknutí žáby (studánka)
};
// smyčka na pozadí (stádo): K.loop(jméno, hlasitost) se volá každý snímek, změna hlasitosti se plynule
// dotáhne (~1,5 s), takže mezi scénami se zvuk sám zesílí / ztiší. Smyčka jednou rozběhnutá běží dál,
// při nule jen potichu. mp3 má na krajích LOOP_PAD s přesahu (tools/zvuky.py), opakuje se úsek mezi nimi.
const LOOP_PAD = 0.2;
const loops = {};
// o.tau = jak rychle se hlasitost dotáhne (s), o.start = odkud smyčka začne (jinak náhodně)
K.loop = (name, level, o = {}) => {
  if (K.muted || (!loops[name] && level <= 0)) return;
  const l = (loops[name] ??= { level: 0, gain: null });
  const s = getSound(name);
  if (!s) return; // načítá se nebo chybí
  if (s instanceof AudioBuffer) {
    if (actx.state !== 'running') return; // až po prvním kliku (pak se stádo pomalu zesílí z ticha)
    if (!l.gain) {
      l.gain = actx.createGain();
      l.gain.gain.value = 0;
      l.gain.connect(actx.destination);
      const src = actx.createBufferSource();
      src.buffer = s;
      src.loop = true;
      src.loopStart = LOOP_PAD;
      src.loopEnd = s.duration - LOOP_PAD;
      src.connect(l.gain);
      src.start(0, o.start ?? K.rand(LOOP_PAD, s.duration - LOOP_PAD)); // stádo pokaždé jinde, ať nezačíná stejně
    }
    if (Math.abs(level - l.level) > 0.002) {
      l.gain.gain.setTargetAtTime(level, actx.currentTime, o.tau ?? 0.5);
      l.level = level;
    }
    return;
  }
  // <audio> (file://): hlasitost se dotahuje po snímcích
  s.loop = true;
  l.level += (level - l.level) * 0.03;
  s.volume = K.clamp(l.level);
  if (l.level > 0.002 && s.paused) s.play().catch(() => {});
};
// Podkresová hudba (Jan Odvárka, Daniel 2026-11-22); ladí se ?hudba=0.5. Hlavní skladba „hudba“ hraje v lese,
// louka má svou „hudba-louka“ a pak „hudba-pochod“ (K.meadowMusic), finále hlavní „hudba“ jako les; scéna si může říct o svou přes scene.music() (Kantorská, muka, vrchol mají dvě podle
// toho, co se v nich stalo). Při změně se skladby prolnou, odložená se po chvíli zastaví a příště pokračuje,
// kde skončila. Zvuky hry musí být slyšet přes ni: když zazní zvuk s hlasitostí aspoň DUCK_FROM, hudba se na
// jeho délku rychle ztiší na DUCK a pak se pomalu vrátí. Kroky a tiché zvuky v pozadí (poklice) ji nechají
// být. Vše se ladí ve směšovači (klávesa M); K.SOUND_GAIN[skladba] = hlasitost jedné skladby.
// hodnoty Daniel 2026-11-22 ze směšovače, hudba a ztlumení pod zvukem upravené 2026-11-23
K.MUSIC_VOLUME = +(K.params.get('hudba') ?? 0.63); // Daniel 2026-11-23 ze směšovače
K.DUCK = 0.55;
K.DUCK_FROM = 0.4;
let duckUntil = 0;
// skladby hrají přes <audio> napojené do Web Audio: dekódované celé by zabraly desítky MB každá.
// Smyčka bez mezery (Daniel 2026-11-23): <audio loop> by na švu přehrál ticho, které mp3 kodér přidá na kraje
// (cvaknutí po každém kole). Proto má skladba dva přehrávače: MUSIC_XF s před koncem se na druhém spustí
// začátek (bez úvodního ticha MUSIC_SKIP) a oba se prolnou. Konec skladby už do začátku navazuje
// (tools/zvuky.py music()), takže krátké prolnutí není slyšet. Bez Web Audio (file://) jen <audio loop>.
const MUSIC_XF = 0.3;
const MUSIC_SKIP = 0.03;
const XF_IN = new Float32Array(32).map((_, i) => Math.sin((i / 31) * Math.PI / 2)); // stejný výkon při prolnutí
const XF_OUT = XF_IN.slice().reverse();
const tracks = {};
const track = (name) => {
  if (!tracks[name]) {
    const mk = () => new Audio(`assets/zvuky/${name}.mp3`);
    const t = { els: [mk()], xg: [], cur: 0, gain: null, level: 0, offT: null, get el() { return this.els[this.cur]; } };
    if (actx) {
      t.els.push(mk());
      t.gain = actx.createGain();
      t.gain.gain.value = 0;
      t.gain.connect(actx.destination);
      t.els.forEach((el, i) => {
        const g = actx.createGain();
        g.gain.value = i === 0 ? 1 : 0;
        actx.createMediaElementSource(el).connect(g).connect(t.gain);
        t.xg.push(g);
      });
    } else {
      t.el.loop = true;
      t.el.volume = 0;
    }
    // ?sev: skladba začne 6 s před koncem, ať je hned slyšet, jak navazuje na začátek
    if (K.params.has('sev')) t.el.addEventListener('loadedmetadata', () => { t.els[0].currentTime = Math.max(0, t.els[0].duration - 6); }, { once: true });
    tracks[name] = t;
  }
  return tracks[name];
};
// těsně před koncem hrající kopie spustí druhou od začátku a prolne je
const musicSeam = (t) => {
  const a = t.el, d = a.duration;
  if (!t.gain || a.paused || !isFinite(d) || a.currentTime < d - MUSIC_XF - 0.04) return;
  const n = 1 - t.cur, b = t.els[n], now = actx.currentTime;
  b.currentTime = MUSIC_SKIP;
  b.play().catch(() => {});
  for (const [g, curve] of [[t.xg[t.cur], XF_OUT], [t.xg[n], XF_IN]]) {
    g.gain.cancelScheduledValues(now);
    g.gain.setValueCurveAtTime(curve, now, MUSIC_XF);
  }
  t.cur = n; // stará dohraje do konce a sama se zastaví (bez loop)
};
// louka a detaily chalup (meadow): po otevření hry „hudba-louka“, od návratu z první scény „hudba-pochod“
// (Daniel 2026-11-23, „Pochodák mezi scény“)
K.marched = false;
K.meadowMusic = () => (K.marched ? 'hudba-pochod' : 'hudba-louka');
K.musicName = () => (K.scene && K.scene.music && K.scene.music()) || 'hudba';
const music = () => {
  if (K.muted) return;
  if (actx ? actx.state !== 'running' : !navigator.userActivation?.hasBeenActive) return; // až po prvním kliku
  const want = K.musicName();
  const ducked = actx && actx.currentTime < duckUntil;
  track(want);
  for (const [name, t] of Object.entries(tracks)) {
    const on = name === want;
    const level = on ? K.MUSIC_VOLUME * (K.SOUND_GAIN[name] ?? 1) * (ducked ? K.DUCK : 1) : 0;
    if (Math.abs(level - t.level) > 0.002) {
      // pod zvuk rychle, zpátky a do nové skladby pomalu, odložená doznívá
      if (t.gain) t.gain.gain.setTargetAtTime(level, actx.currentTime, on && ducked ? 0.05 : on ? 0.6 : 0.9);
      t.level = level;
    }
    if (!t.gain) t.el.volume = K.clamp(t.el.volume + (level - t.el.volume) * 0.03);
    if (on) {
      t.offT = null;
      if (t.el.paused) t.el.play().catch(() => {});
      musicSeam(t);
    } else if (t.els.some((el) => !el.paused)) {
      t.offT ??= K.time;
      if (K.time - t.offT > 5) for (const el of t.els) el.pause(); // dozněla
    }
  }
};
// vlek ve finále (smyčka, Daniel 2026-11-23: celou dobu, co jezdí); ladí se ve směšovači
K.LIFT_VOLUME = 0.11; // Daniel 2026-11-23 ze směšovače (původně 0.6)
// stádo hraje potichu pod kroky (Daniel 2026-11-08: 0.15); ladí se ?stado=0.3
K.FLOCK_VOLUME = +(K.params.get('stado') ?? 0.15);
// bečení po kliku na ovci, náhodně ovce-1 / ovce-2 s trochu jinou výškou, jehně má svoje; ladí se ?ovce=0.6
// (Daniel 2026-11-22 ve směšovači: 0.3)
K.BLEAT_VOLUME = +(K.params.get('ovce') ?? 0.3);
const BLEATS = ['ovce-1', 'ovce-2'];
for (const n of [...BLEATS, 'jehne']) getSound(n);
// bečení: zvuk a ovce na chvíli otevře pusu (sh.bleatT čte K.drawSheepFlock)
K.bleat = (sh) => {
  if (sh) sh.bleatT = K.time;
  K.sound(sh && sh.lamb ? 'jehne' : BLEATS,
    { volume: K.BLEAT_VOLUME * K.rand(0.85, 1), rate: K.rand(0.94, 1.06) });
};
// kroky po zmrzlé trávě jsou jen v pozadí pod hudbou; ladí se ?kroky=0.4
K.STEP_VOLUME = +(K.params.get('kroky') ?? 0.25);
// tráva assets/zvuky/krok-1…8.mp3, zmrzlá hlína s ledem led-1…4.mp3
const GRASS_STEPS = Array.from({ length: 8 }, (_, i) => `krok-${i + 1}`);
const ICE_STEPS = Array.from({ length: 4 }, (_, i) => `led-${i + 1}`);
for (const n of [...GRASS_STEPS, ...ICE_STEPS]) getSound(n); // načíst předem, ať první kroky nechybí
const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
// pořadí jako zamíchaný balíček: zazní všech 8 kroků po trávě, pak se zamíchá znovu a stejný krok
// nejde dvakrát po sobě. Do každého druhého nebo třetího balíčku se na náhodné místo přimíchá led.
let stepBag = [];
let lastStep = null;
let bagsWithoutIce = 0;
let lastIce = null;
K.stepSound = () => {
  if (!stepBag.length) {
    stepBag = shuffle([...GRASS_STEPS]);
    bagsWithoutIce++;
    if (bagsWithoutIce >= 3 || (bagsWithoutIce === 2 && Math.random() < 0.5)) {
      bagsWithoutIce = 0;
      lastIce = K.pick(ICE_STEPS.filter((n) => n !== lastIce));
      stepBag.splice(Math.floor(Math.random() * (stepBag.length + 1)), 0, lastIce);
    }
    if (stepBag[stepBag.length - 1] === lastStep) stepBag.unshift(stepBag.pop());
  }
  lastStep = stepBag.pop();
  return lastStep;
};
// krok při chůzi bokem (les, kuchyně): zazní, když fáze chůze (20 px na jednotku) přejde přes další krok.
// wood = dřevo (lávka, kmen, podlaha): tytéž kroky hlouběji a tišeji
K.walkStep = (before, after, wood = false) => {
  if (Math.floor(after / Math.PI + 0.5) === Math.floor(before / Math.PI + 0.5)) return;
  K.sound(K.stepSound(), wood
    ? { volume: K.STEP_VOLUME * 0.7 * K.rand(0.75, 1), rate: K.rand(0.72, 0.84) }
    : { volume: K.STEP_VOLUME * 0.8 * K.rand(0.75, 1), rate: K.rand(0.9, 1.12) });
};
// chůze bokem po vodorovné podlaze (kuchyně, studánka, vrchol): h = { x, facing, walking, phase }
K.walkSide = async (h, x, speed = 320, wood = false) => {
  const x0 = h.x, d = Math.abs(x - x0);
  if (d < 1) return;
  h.facing = Math.sign(x - x0);
  h.walking = true;
  const ph0 = h.phase;
  await K.tween(d / speed, (t) => {
    const before = h.phase;
    h.x = K.lerp(x0, x, t);
    h.phase = ph0 + (d * t) / 20;
    K.walkStep(before, h.phase, wood);
  });
  h.walking = false;
};
// zachvění po ťuknutí (t0 = kdy): rychle odeznívající kmit o amplitudě amt
K.shake = (t0, amt = 8) => {
  const d = K.time - (t0 ?? -9);
  return d < 0.45 ? Math.sin(d * 60) * amt * (1 - d / 0.45) : 0;
};

// ---------- průhlednost postavy jako celku ----------
// Postava z překrývajících se tvarů (chomáče vlny, hlava, rohy) by při globalAlpha prosvítala
// sama sebou — byly by vidět kruhy a ovály uvnitř. Proto se nakreslí naplno do vedlejšího plátna
// se stejnou transformací a zprůhlední se až hotový obrázek. Nevnořovat (plátno je jedno).
let layerCanvas = null;
K.withAlpha = (ctx, alpha, fn) => {
  if (alpha >= 0.999) return fn(ctx);
  if (alpha <= 0.001) return;
  const c = ctx.canvas;
  if (!layerCanvas) layerCanvas = document.createElement('canvas');
  if (layerCanvas.width !== c.width || layerCanvas.height !== c.height) {
    layerCanvas.width = c.width;
    layerCanvas.height = c.height;
  }
  const l = layerCanvas.getContext('2d');
  l.setTransform(1, 0, 0, 1, 0, 0);
  l.clearRect(0, 0, c.width, c.height);
  l.setTransform(ctx.getTransform());
  fn(l);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(layerCanvas, 0, 0);
  ctx.restore();
};

// ---------- stav hry ----------
// K.ITEMS (předměty = klíče k mraku) je v louka.js podle K.CHALETS
// bag: batoh dá strom v lese; do té doby HUD jen zakrývá razítko kamery
// tools: věci, které se hodí jinde (Daniel 2026-11-13: hrnek a dědova fajfka z kuchyně → studánka u božích muk)
K.state = { asked: false, solved: {}, items: [], bag: false, tools: [] };
K.frameNow = '2025-12-28_1300'; // právě zobrazený snímek (pro testy)
K.fade = { a: 0, color: '#efe6d2' };
K.busy = 0; // >0 = právě běží scénka, kliky se ignorují
K.flyingItems = [];

// batůžek v HUD a vedle něj místa na předměty, které odemknou mrak na Zadní Planině
K.BAG = { x: 52, y: 32 };
K.bagBump = -9;
K.bagT = -9; // kdy strom dal batoh (místa na klíče pak vyskočí)
K.slotPos = (i) => ({ x: 128 + i * 50, y: 32 });

// ikona přeletí obloukem (výška arc) z from do to a zmenší se z s0 na s1; kreslí ji drawHud
K.flyIcon = async (item, from, to, { dur, arc, s0 = 70, s1 }) => {
  const fly = { item, x: from.x, y: from.y, s: s0 };
  K.flyingItems.push(fly);
  await K.tween(dur, (t) => {
    const e = K.ease(t);
    fly.x = K.lerp(from.x, to.x, e);
    fly.y = K.lerp(from.y, to.y, e) - Math.sin(t * Math.PI) * arc;
    fly.s = K.lerp(s0, s1, e);
  });
  K.flyingItems.splice(K.flyingItems.indexOf(fly), 1);
};

K.solve = async (id, item, from) => {
  if (K.state.solved[id]) return;
  K.state.solved[id] = true;
  K.sound(K.HLAS.vitezstvi); // odměna: kluk má radost (Daniel 2026-11-23, stejná nahrávka jako vítězství)
  // předmět přeletí do batůžku, batůžek poskočí a předmět se objeví na svém místě
  await K.flyIcon(item, from, K.BAG, { dur: 1.1, arc: 160, s1: 14 });
  K.bagBump = K.time;
  K.state.items.push(item);
};

// nástroje (hrnek, fajfka) mají v HUD svá místa za klíči, bez kroužků; přiletí stejně jako klíče
K.TOOLS = ['hrnecek', 'fajfka'];
K.toolPos = (i) => K.slotPos(K.ITEMS.length + 0.5 + i);
K.hasTool = (t) => K.state.tools.includes(t);
K.giveTool = async (tool, from) => {
  if (K.hasTool(tool)) return;
  await K.flyIcon(tool, from, K.toolPos(K.TOOLS.indexOf(tool)), { dur: 0.9, arc: 140, s1: 30 });
  K.bagBump = K.time;
  K.state.tools.push(tool);
};
K.dropTool = (tool) => {
  K.state.tools = K.state.tools.filter((t) => t !== tool);
  if (K.held === tool) K.held = null;
};

// nástroj v ruce (point & click, Daniel 2026-11-13): klik na nástroj v HUD ho vytáhne z batůžku,
// ikona pak jede s kurzorem a další klik do scény ho použije. Scéna si K.held přečte hned na začátku
// svého click(); po kliku do scény se nástroj vrátí do batůžku. Pravé tlačítko ho vrátí také.
K.held = null;
K.heldT = -9;
K.toolAt = (p) => {
  if (!K.state.bag) return null;
  return K.TOOLS.find((t, i) => K.hasTool(t) && K.dist(p, K.toolPos(i)) < 24) || null;
};
// položky z batohu (semínka, voda, rampouch) jdou vytáhnout stejně jako nástroj, ale jen tam, kde je scéna
// umí použít (scene.pickItems(): vrchol při sázení, Daniel 2026-11-23); v HUD zůstanou, jen zbledne obrys
K.itemAt = (p) => {
  if (!K.state.bag || !K.scene || !K.scene.pickItems || !K.scene.pickItems()) return null;
  return K.ITEMS.find((it, i) => K.state.items.includes(it) && K.dist(p, K.slotPos(i)) < 24) || null;
};
K.click = (p) => {
  if (K.busy > 0 || !K.scene || !K.scene.click) return;
  const tool = K.toolAt(p) || K.itemAt(p);
  if (tool) {
    K.held = K.held === tool ? null : tool;
    K.heldT = K.time;
    K.bagBump = K.time;
    return;
  }
  K.scene.click(p);
  K.held = null;
};

// ---------- scény ----------
K.scenes = {};
K.scene = null;
K.go = (name, arg) => {
  K.held = null;
  if (K.scene && !K.scene.meadow) K.marched = true; // vrací se z první puzzle scény: na louce už hraje pochodák
  K.scene = K.scenes[name];
  if (K.scene.enter) K.scene.enter(arg);
};

K.fadeTo = (a, dur, color) => {
  if (color) K.fade.color = color;
  const from = K.fade.a;
  return K.tween(dur, (t) => { K.fade.a = K.lerp(from, a, t); });
};

// ---------- HUD: zakrývá vypálené razítko kamery ----------
function drawHud(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgb(32, 25, 18)';
  ctx.beginPath();
  ctx.roundRect(-20, -20, 510, 84, 18);
  ctx.fill();
  if (K.state.bag) {
    // po převzetí batohu od stromu místa na klíče postupně vyskočí
    const pop = (i) => K.ease(K.clamp((K.time - K.bagT - 0.25 - i * 0.14) / 0.3));
    const bt = K.time - K.bagBump;
    const bump = bt < 0.6 ? Math.sin(bt / 0.6 * Math.PI * 3) * (1 - bt / 0.6) : 0;
    ctx.save();
    ctx.translate(K.BAG.x, K.BAG.y + 18);
    ctx.scale(1 + bump * 0.12, 1 - bump * 0.12);
    K.drawIcon(ctx, 'batoh', 0, -18, 46, '#f3e6c8');
    ctx.restore();
    // vytažená věc nechá v HUD jen bledý obrys
    const slotIcon = (it, p) => {
      ctx.globalAlpha = K.held === it ? 0.25 : 1;
      K.drawIcon(ctx, it, p.x, p.y, 32, '#f3e6c8');
      ctx.globalAlpha = 1;
    };
    K.ITEMS.forEach((it, i) => {
      const p = K.slotPos(i), k = pop(i);
      if (k <= 0) return;
      ctx.strokeStyle = 'rgba(243, 230, 200, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 19 * k, 0, Math.PI * 2);
      ctx.stroke();
      if (K.state.items.includes(it)) slotIcon(it, p);
    });
    K.TOOLS.forEach((t, i) => { if (K.hasTool(t)) slotIcon(t, K.toolPos(i)); });
  }
  ctx.restore();
  for (const f of K.flyingItems) K.drawIcon(ctx, f.item, f.x, f.y, f.s, '#2b2118');
  // nástroj v ruce jede s kurzorem (po vytažení krátce povyroste)
  if (K.held && K.mouse) {
    const t = K.time - K.heldT;
    const s = (K.mouseHot ? 60 : 50) * (t < 0.25 ? 0.6 + 0.4 * K.ease(t / 0.25) : 1);
    K.drawIcon(ctx, K.held, K.mouse.x + 18, K.mouse.y + 22, s, '#2b2118');
  }
}

// ---------- vstup ----------
K.canvas.addEventListener('pointerdown', (e) => {
  const p = K.toWorld(e);
  if (K.editor && K.editor.active) return K.editor.down(p, e);
  K.mouse = p;
  if (e.button === 2) { K.held = null; return; } // pravé tlačítko: nástroj zpátky do batůžku
  K.click(p);
});
K.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
K.canvas.addEventListener('pointermove', (e) => {
  const p = K.toWorld(e);
  K.mouse = p;
  if (K.editor && K.editor.active) return K.editor.move(p, e);
  const hot = K.busy === 0 && K.scene && K.scene.hot && K.scene.hot(p);
  K.mouseHot = !!hot;
  K.canvas.style.cursor = hot || (K.busy === 0 && (K.toolAt(p) || K.itemAt(p))) ? 'pointer' : 'default';
});
K.canvas.addEventListener('pointerup', (e) => {
  if (K.editor && K.editor.active) K.editor.up(K.toWorld(e), e);
});

addEventListener('keydown', (e) => {
  if (e.key === 'f' || e.key === 'F') {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  }
});

// ---------- hlavní smyčka ----------
// ?test zastaví vlastní běh času; testy ho posouvají přes window.advanceTime(ms)
K.paused = K.params.has('test');

K.update = (dt) => {
  K.time += dt;
  K.boil = Math.floor(K.time * 8);
  runTimers(dt);
  if (K.scene && K.scene.update) K.scene.update(dt);
  // stádo slyšet jen tam, kde jsou ovce vidět (scene.flock vrací 0–1)
  K.loop('stado', (K.scene && K.scene.flock ? K.scene.flock() : 0) * K.FLOCK_VOLUME);
  // vlek hučí, dokud jede (scene.lift vrací rychlost 0–1, finale.js)
  K.loop('vlek', (K.scene && K.scene.lift ? K.scene.lift() : 0) * K.LIFT_VOLUME, { start: LOOP_PAD });
  music();
};

window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i++) K.update(1 / 60);
  render();
};

let last = performance.now();
let idleFrames = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000) * K.speed;
  last = now;
  // v testu kreslí jen advanceTime, jinak by headless Chrome zbytečně vykresloval každý snímek
  if (!K.paused) {
    K.update(dt);
    render();
  } else if (++idleFrames % 20 === 0) render();
  requestAnimationFrame(frame);
}

function render() {
  const ctx = K.ctx, v = K.view;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0d0b09';
  ctx.fillRect(0, 0, K.canvas.width, K.canvas.height);
  ctx.setTransform(v.dpr * v.s, 0, 0, v.dpr * v.s, v.dpr * v.ox, v.dpr * v.oy);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, K.W, K.H);
  ctx.clip();
  // chyba ve scéně nesmí shodit HUD (zakrývá razítko kamery); hlásí se jen jednou
  ctx.save();
  try {
    if (K.scene && K.scene.draw) K.scene.draw(ctx);
  } catch (err) {
    if (!K.drawError) console.error('chyba při kreslení scény:', err);
    K.drawError = err;
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  if (K.fade.a > 0) {
    ctx.globalAlpha = K.fade.a;
    ctx.fillStyle = K.fade.color;
    ctx.fillRect(0, 0, K.W, K.H);
    ctx.globalAlpha = 1;
  }
  drawHud(ctx);
  // co má letět do HUD a nesmí zajet pod lištu (bubliny stromu v lese)
  if (K.scene && K.scene.drawOverHud) {
    ctx.save();
    try { K.scene.drawOverHud(ctx); } catch (err) { if (!K.drawError) console.error('chyba při kreslení nad HUD:', err); K.drawError = err; }
    ctx.restore();
  }
  if (K.editor && K.editor.active) K.editor.draw(ctx);
  ctx.restore();
}
K.render = render;
K.start = () => requestAnimationFrame(frame);
