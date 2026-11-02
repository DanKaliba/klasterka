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
  // starší rozpracovaný stav než soubor (soubor jsem mezitím upravil ručně) se zahodí
  if (saved && saved.verze >= K.L.verze) K.L = saved;
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
// deterministický šum 0..1 pro chvění čar
K.hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// měřítko postavičky podle výšky v obraze (dál = menší)
K.scaleAt = (y) => {
  const p = K.L.perspektiva;
  if (y <= p[0][0]) return p[0][1];
  for (let i = 1; i < p.length; i++) {
    if (y <= p[i][0]) return K.lerp(p[i - 1][1], p[i][1], (y - p[i - 1][0]) / (p[i][0] - p[i - 1][0]));
  }
  return p[p.length - 1][1];
};

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
const sounds = {};
K.sound = (name) => {
  if (K.muted) return;
  if (!(name in sounds)) {
    const a = new Audio(`assets/zvuky/${name}.mp3`);
    a.onerror = () => { sounds[name] = null; };
    sounds[name] = a;
  }
  const a = sounds[name];
  if (a) { a.currentTime = 0; a.play().catch(() => {}); }
};

// ---------- stav hry ----------
K.ITEMS = ['plan', 'lyze', 'kotva', 'lano', 'kolo', 'caj'];
K.state = { asked: false, solved: {}, items: [] };
K.clock = '2025-12-28_1300';
K.clockOverride = null; // { date, time } pro dopočítanou noc
K.fade = { a: 0, color: '#efe6d2' };
K.busy = 0; // >0 = právě běží scénka, kliky se ignorují
K.flyingItems = [];

K.slotPos = (i) => ({ x: 232 + i * 34, y: 31 });

K.solve = async (id, item, from) => {
  if (K.state.solved[id]) return;
  K.state.solved[id] = true;
  K.sound('odmena');
  const slot = K.slotPos(K.ITEMS.indexOf(item));
  const fly = { item, x: from.x, y: from.y, s: 70 };
  K.flyingItems.push(fly);
  await K.tween(1.1, (t) => {
    const e = K.ease(t);
    fly.x = K.lerp(from.x, slot.x, e);
    fly.y = K.lerp(from.y, slot.y, e) - Math.sin(t * Math.PI) * 160;
    fly.s = K.lerp(70, 26, e);
  });
  K.flyingItems.splice(K.flyingItems.indexOf(fly), 1);
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
  ctx.roundRect(-20, -20, 460, 84, 18);
  ctx.fill();
  const info = K.clockOverride || K.frameInfo(K.clock);
  ctx.fillStyle = '#f3e6c8';
  ctx.textBaseline = 'middle';
  ctx.font = '600 17px Georgia, serif';
  ctx.fillText(info.date, 18, 22);
  ctx.font = '600 26px Georgia, serif';
  ctx.fillText(info.time, 18, 46);
  K.ITEMS.forEach((it, i) => {
    const p = K.slotPos(i);
    ctx.strokeStyle = 'rgba(243, 230, 200, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
    ctx.stroke();
    if (K.state.items.includes(it)) K.drawIcon(ctx, it, p.x, p.y, 26, '#f3e6c8');
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
