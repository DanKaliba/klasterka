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
K.until = (cond) => new Promise((r) => timers.push({ cond, r }));

function runTimers(dt) {
  for (let i = timers.length - 1; i >= 0; i--) {
    const tm = timers[i];
    let done;
    if (tm.cond) done = tm.cond();
    else {
      tm.t -= dt;
      if (tm.fn) tm.fn(K.clamp(1 - tm.t / tm.d));
      done = tm.t <= 0;
    }
    if (done) {
      timers.splice(i, 1);
      tm.r();
    }
  }
}

// ---------- obrázky ----------
const images = {};
K.img = (src) => {
  if (!images[src]) {
    const im = new Image();
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

// "2025-12-28_1300" → { date: "28. 12.", time: "13:00", snow: false }
K.frameInfo = (name) => {
  const [d, t] = name.split('_');
  const [, m, day] = d.split('-');
  return { date: `${+day}. ${+m}.`, time: `${t.slice(0, 2)}:${t.slice(2)}`, snow: d >= '2026-01-04' };
};

// Fotka zabírá celé plátno; zimní snímky jsou o kousek posunuté, proto K.L.snih.
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
// volume 0–1, rate = rychlost přehrávání (mění i výšku, pro obměnu opakovaných zvuků)
K.sound = (name, o = {}) => {
  if (K.muted) return;
  const s = getSound(name);
  if (s === undefined) {
    // ještě se načítá: zahraje se, pokud se stihne do 0,3 s, jinak by přišel pozdě
    K.soundStats.notReady++;
    const t = K.time;
    loading[name].then(() => { if (K.time - t < 0.3) K.sound(name, o); });
    return;
  }
  if (!s) return;
  K.soundStats.played++;
  const volume = K.clamp(o.volume ?? 1), rate = o.rate ?? 1;
  if (s instanceof AudioBuffer) {
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; // bez kliku nehraje
    const src = actx.createBufferSource();
    src.buffer = s;
    src.playbackRate.value = rate;
    const gain = actx.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(actx.destination);
    src.start();
    return;
  }
  s.volume = volume;
  s.preservesPitch = false;
  s.playbackRate = rate;
  s.currentTime = 0;
  s.play().catch(() => {});
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
K.state = { asked: false, solved: {}, items: [], bag: false };
K.frameNow = '2025-12-28_1300'; // právě zobrazený snímek (pro testy)
K.fade = { a: 0, color: '#efe6d2' };
K.busy = 0; // >0 = právě běží scénka, kliky se ignorují
K.flyingItems = [];

// batůžek v HUD a vedle něj místa na předměty, které odemknou mrak na Zadní Planině
K.BAG = { x: 52, y: 32 };
K.bagBump = -9;
K.bagT = -9; // kdy strom dal batoh (místa na klíče pak vyskočí)
K.slotPos = (i) => ({ x: 128 + i * 50, y: 32 });

K.solve = async (id, item, from) => {
  if (K.state.solved[id]) return;
  K.state.solved[id] = true;
  K.sound('odmena');
  // předmět přeletí do batůžku, batůžek poskočí a předmět se objeví na svém místě
  const bag = K.BAG;
  const fly = { item, x: from.x, y: from.y, s: 70 };
  K.flyingItems.push(fly);
  await K.tween(1.1, (t) => {
    const e = K.ease(t);
    fly.x = K.lerp(from.x, bag.x, e);
    fly.y = K.lerp(from.y, bag.y, e) - Math.sin(t * Math.PI) * 160;
    fly.s = K.lerp(70, 14, e);
  });
  K.flyingItems.splice(K.flyingItems.indexOf(fly), 1);
  K.bagBump = K.time;
  K.state.items.push(item);
};

// ---------- scény ----------
K.scenes = {};
K.scene = null;
K.go = (name, arg) => {
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
  if (!K.state.bag) {
    ctx.restore();
    for (const f of K.flyingItems) K.drawIcon(ctx, f.item, f.x, f.y, f.s, '#2b2118');
    return;
  }
  // po převzetí batohu od stromu místa na klíče postupně vyskočí
  const pop = (i) => K.ease(K.clamp((K.time - K.bagT - 0.25 - i * 0.14) / 0.3));
  const bt = K.time - K.bagBump;
  const bump = bt < 0.6 ? Math.sin(bt / 0.6 * Math.PI * 3) * (1 - bt / 0.6) : 0;
  ctx.save();
  ctx.translate(K.BAG.x, K.BAG.y + 18);
  ctx.scale(1 + bump * 0.12, 1 - bump * 0.12);
  K.drawIcon(ctx, 'batoh', 0, -18, 46, '#f3e6c8');
  ctx.restore();
  K.ITEMS.forEach((it, i) => {
    const p = K.slotPos(i), k = pop(i);
    if (k <= 0) return;
    ctx.strokeStyle = 'rgba(243, 230, 200, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 19 * k, 0, Math.PI * 2);
    ctx.stroke();
    if (K.state.items.includes(it)) K.drawIcon(ctx, it, p.x, p.y, 32, '#f3e6c8');
  });
  ctx.restore();
  for (const f of K.flyingItems) K.drawIcon(ctx, f.item, f.x, f.y, f.s, '#2b2118');
}

// ---------- vstup ----------
K.hover = null;
K.canvas.addEventListener('pointerdown', (e) => {
  const p = K.toWorld(e);
  if (K.editor && K.editor.active) return K.editor.down(p, e);
  if (K.busy > 0 || !K.scene || !K.scene.click) return;
  K.scene.click(p);
});
K.canvas.addEventListener('pointermove', (e) => {
  const p = K.toWorld(e);
  K.mouse = p;
  if (K.editor && K.editor.active) return K.editor.move(p, e);
  const hot = K.busy === 0 && K.scene && K.scene.hot && K.scene.hot(p);
  K.canvas.style.cursor = hot ? 'pointer' : 'default';
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
  if (K.editor && K.editor.active) K.editor.draw(ctx);
  ctx.restore();
}
K.render = render;
K.start = () => requestAnimationFrame(frame);
