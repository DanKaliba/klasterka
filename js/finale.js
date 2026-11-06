// Finále: časosběr ze snímků webkamery. Noc se nefotí (kamera v noci šumí), ale dopočítává:
// ztmavený snímek + hvězdy + rozsvícená okna + vločky. Vše řídí časová osa klíčů níže.
const pick = (from, to) => window.SNIMKY.filter((n) => n >= from && n <= to);

// Klíč drží stav v daném okamžiku; mezi klíči se hodnoty plynule prolínají (snímky crossfadem).
// night 0–1 = ztmavení, snow = sněžení, win = okna, stars = hvězdy, lift = viditelnost vleku,
// ev = událost při dosažení klíče.
function buildTimeline() {
  const keys = [];
  let t = 0;
  let cur = { frame: '2025-12-28_1300', night: 0, snow: 0, win: 0, stars: 0, lift: 0 };
  const add = (dur, k = {}) => {
    cur = { ...cur, ev: null, ...k };
    keys.push({ ...cur, t, dur });
    t += dur;
  };
  add(0.8, { ev: 'start' });
  for (const f of pick('2025-12-28_1301', '2025-12-28_1630')) add(0.6, { frame: f });
  add(1.5);
  // soumrak → noc, chalupy se rozsvěcejí
  add(3, { night: 1, win: 1, stars: 1, ev: 'huddle' });
  add(2);
  // začíná sněžit, hvězdy mizí
  add(2.5, { snow: 1, stars: 0 });
  // pod sněhem se podklad vymění za zasněžený snímek
  add(4, { frame: '2026-01-05_0800' });
  add(2.5, { lift: 1 });
  add(2.5, { snow: 0, stars: 1 });
  // svítání
  add(3.5, { night: 0, stars: 0, win: 0, ev: 'dawn' });
  for (const f of pick('2026-01-05_0800', '2026-01-05_0900')) add(0.9, { frame: f });
  add(0.1, { ev: 'waitLift' });
  // lyžování
  for (const f of pick('2026-01-05_0901', '2026-01-05_1545')) add(2.4, { frame: f });
  add(2.5, { ev: 'stop' });
  for (const f of pick('2026-01-05_1546', '2026-01-05_1630')) add(1.6, { frame: f, ev: f.endsWith('1615') ? 'leave' : null });
  add(3.5, { night: 0.85, win: 1, stars: 1 });
  add(0, { ev: 'end' });
  return keys;
}

const F = {
  keys: [], t: 0, i: 0, waiting: false, liftOn: false, liftSpeed: 0, liftPos: 0, ended: false,
  stars: [], flakes: [], v: null, shift: { x: 0, y: 0 }, riding: [], trails: [],
  bird: { on: false, flyAt: null },
};

// ---------- pomocné výpočty ----------
function snowMix(v) {
  const a = K.frameInfo(v.frameA).snow ? 1 : 0;
  const b = K.frameInfo(v.frameB).snow ? 1 : 0;
  return K.lerp(a, b, v.u);
}
const off = (pt, m) => ({ x: pt.x + K.L.snih.x * m, y: pt.y + K.L.snih.y * m });

const skylineY = (x) => K.polyY(K.L.obzor, x);

function makeStars() {
  F.stars = [];
  while (F.stars.length < 170) {
    const x = Math.random() * K.W, y = Math.random() * 300;
    if (y < skylineY(x) - 10) F.stars.push({ x, y, r: Math.random() < 0.1 ? 2.2 : 0.6 + Math.random() * 1.2, ph: Math.random() * 6 });
  }
  F.flakes = Array.from({ length: 520 }, () => ({ x: Math.random() * K.W, y: Math.random() * K.H, z: Math.random() }));
}

// aktuální stav časové osy (interpolace mezi klíči)
function sample() {
  const k = F.keys;
  const a = k[F.i], b = k[Math.min(k.length - 1, F.i + 1)];
  const u = a.dur > 0 ? K.clamp((F.t - a.t) / a.dur) : 1;
  const v = { frameA: a.frame, frameB: b.frame, u };
  for (const p of ['night', 'snow', 'win', 'stars', 'lift']) v[p] = K.lerp(a[p], b[p], u);
  return v;
}

// ---------- vlek ----------
// Vlek vede po skutečných drátech z fotky. Je vidět jen na zimních snímcích, proto jeho body
// nejsou posunuté o K.L.snih: dole = kde dráty mizí za hranou svahu, sloup = vrchol podpěry,
// nahore = kde dráty odcházejí z obrazu (horní stanice s kladkami není vidět), pata = pata sloupu,
// start = kde ovce vjedou do obrazu po vystoupení nahoře, sjezd = kam sjedou pod spodní okraj.
// Lano: větev 0 jede nahoru (s ovcemi), větev 1 zpátky dolů.
const RIDE_SEC = 13; // jízda na kotvě od hrany až za levý okraj
const SKI_SEC = 8; // sjezd od levého okraje pod spodní okraj
const TRACK_LIFE = 10; // jak dlouho (s) bledne stopa lyží
const V = () => K.L.vlek;
const edgeY = (x) => K.polyY(K.L.hrana, x);
// měřítko v zimních souřadnicích (zimní snímky jsou proti podzimním, z nichž je model terénu, posunuté)
const scaleW = (x, y) => K.scaleAt(x - K.L.snih.x, y - K.L.snih.y);

// bod o kus dál za b ve směru a→b (pokračování drátu / sjezdu mimo obraz)
const beyond = (a, b, d) => {
  const l = K.dist(a, b) || 1;
  return { x: b.x + ((b.x - a.x) / l) * d, y: b.y + ((b.y - a.y) / l) * d };
};

// spodní drát je u sloupu a nahoře o kus níž, k hraně se sbíhá
function cablePts(branch) {
  const { dole, sloup, nahore } = V();
  const pts = [dole, sloup, nahore, beyond(sloup, nahore, 160)];
  const dy = [4, 13, 12, 12];
  return pts.map((p, i) => ({ x: p.x + branch * (i ? 2 : 0), y: p.y + branch * dy[i] }));
}

function along(pts, u) {
  const segs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) { const l = K.dist(pts[i - 1], pts[i]); segs.push(l); total += l; }
  let d = K.clamp(u) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const t = segs[i] ? Math.min(1, d / segs[i]) : 0;
      return { x: K.lerp(pts[i].x, pts[i + 1].x, t), y: K.lerp(pts[i].y, pts[i + 1].y, t) };
    }
    d -= segs[i];
  }
  return pts[pts.length - 1];
}

const cableLen = () => {
  const p = cablePts(0);
  let l = 0;
  for (let i = 1; i < p.length; i++) l += K.dist(p[i - 1], p[i]);
  return l;
};
const cableAt = (u, branch = 0) => along(cablePts(branch), u);

// ovce na kotvě jede po odvrácené straně kopce těsně za hranou: zpoza hrany se nejdřív vynoří
const riderAt = (u) => {
  const x = cableAt(u).x;
  const y = edgeY(x);
  return { x, y: y + (4 + 60 * K.clamp(1 - u / 0.14)) * scaleW(x, y) };
};

// sjezd obloučky z levého okraje dolů; každá ovce má jiné oblouky
const skiAt = (u, sh) => {
  const { start, sjezd } = V();
  const s0 = beyond(sjezd, start, 110);
  const dx = sjezd.x - s0.x, dy = sjezd.y - s0.y, len = Math.hypot(dx, dy) || 1;
  const x0 = K.lerp(s0.x, sjezd.x, u), y0 = K.lerp(s0.y, sjezd.y, u);
  const w = Math.sin(u * Math.PI * sh.turns + sh.ph) * sh.amp * scaleW(x0, y0) * Math.min(1, u * 6);
  return { x: x0 - (dy / len) * w, y: y0 + (dx / len) * w };
};

const poleHit = () => {
  const { sloup, pata } = V();
  return { x: sloup.x, y: (sloup.y + pata.y) / 2 };
};

function drawLift(ctx, alpha) {
  if (alpha <= 0.01) return;
  const len = cableLen();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = K.INK;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  [0, 1].forEach((b) => {
    const pts = cablePts(b);
    const line = () => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke(); };
    ctx.lineWidth = 2;
    line();
    // tečky na laně ukazují, kam běží
    ctx.lineWidth = 3.5;
    ctx.setLineDash([2, 26]);
    ctx.lineDashOffset = (b ? 1 : -1) * F.liftPos;
    line();
    ctx.setLineDash([]);
    // prázdné kotvy
    const n = Math.round(len / 95);
    for (let i = 0; i < n; i++) {
      let u = (((i * len) / n + F.liftPos) % len) / len;
      if (b) u = 1 - u;
      if (!b && F.riding.some((r) => Math.abs(r - u) < 0.04)) continue; // tuhle kotvu drží ovce
      const p = along(pts, u), s = scaleW(p.x, p.y + 40);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + 30 * s);
      ctx.moveTo(p.x - 9 * s, p.y + 30 * s); ctx.lineTo(p.x + 9 * s, p.y + 30 * s);
      ctx.stroke();
    }
  });
  ctx.restore();
  if (F.waiting && !F.liftOn) {
    const h = poleHit();
    K.drawHint(ctx, h.x, h.y, 70);
  }
}

// stopy lyží: tmavé křivky, které po chvíli vyblednou
function trackPoint(sh) {
  if (!sh.trail) { sh.trail = []; F.trails.push(sh.trail); }
  const last = sh.trail[sh.trail.length - 1];
  if (!last || K.time - last.t > 0.035) sh.trail.push({ x: sh.x, y: sh.y, t: K.time });
}

function drawTracks(ctx) {
  ctx.save();
  ctx.lineCap = 'round';
  for (const tr of F.trails) {
    for (let i = 1; i < tr.length; i++) {
      const a = K.clamp(1 - (K.time - tr[i].t) / TRACK_LIFE) * 0.75;
      if (a <= 0) continue;
      ctx.strokeStyle = `rgba(28, 28, 38, ${a})`;
      ctx.lineWidth = 2.4 * scaleW(tr[i].x, tr[i].y);
      ctx.beginPath();
      ctx.moveTo(tr[i - 1].x, tr[i - 1].y);
      ctx.lineTo(tr[i].x, tr[i].y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function pruneTracks() {
  for (const tr of F.trails) while (tr.length && K.time - tr[0].t > TRACK_LIFE) tr.shift();
  F.trails = F.trails.filter((tr) => tr.length || K.sheep.some((sh) => sh.trail === tr));
}

// ---------- ovce ve finále ----------
const HIDDEN = ['ride', 'queue', 'gone'];

function skiTo(sh, p, q) {
  sh.facing = q.x >= p.x ? 1 : -1;
  sh.baseRot = Math.atan2(q.y - p.y, Math.abs(q.x - p.x) + 0.01) * 0.5 * sh.facing;
  sh.x = p.x;
  sh.y = p.y;
  sh.walking = false;
  trackPoint(sh);
}

function sheepFinale(dt) {
  const ch = { x: K.L.chumel.x + F.shift.x, y: K.L.chumel.y + F.shift.y };
  F.riding = K.sheep.filter((sh) => sh.mode === 'ride').map((sh) => sh.u);
  K.sheep.forEach((sh, i) => {
    if (sh.tumbleT && K.time - sh.tumbleT < 0.8) sh.rot = sh.baseRot + ((K.time - sh.tumbleT) / 0.8) * Math.PI * 2 * sh.facing;
    else sh.rot = sh.baseRot || 0;
    if (sh.mode !== 'ski' && sh.mode !== 'toLift') sh.trail = null;
    if (sh.mode === 'graze') return K.updateGrazing(sh, dt, scaleW);
    if (sh.mode === 'huddle' || sh.mode === 'leave') {
      const a = (i / K.sheep.length) * Math.PI * 2;
      const s = scaleW(ch.x, ch.y);
      const tx = ch.x + Math.cos(a) * 34 * s + (i % 2) * 10 * s, ty = ch.y + Math.sin(a) * 14 * s;
      const sp = (sh.mode === 'leave' ? 260 : 120) * s * dt;
      const d = Math.hypot(tx - sh.x, ty - sh.y);
      if (d > 2) { sh.x += ((tx - sh.x) / d) * Math.min(d, sp); sh.y += ((ty - sh.y) / d) * Math.min(d, sp); sh.walking = !sh.skis; sh.phase += dt * 6; }
      else sh.walking = false;
      sh.baseRot = Math.sin(K.time * 30 + i) * 0.02; // tulí se a třesou zimou
      return;
    }
    sh.baseRot = 0;
    if (sh.mode === 'toLift') {
      // z chumlu sjede pod spodní okraj a odtud se objeví na vleku
      sh.wait -= dt;
      if (sh.wait > 0) return;
      const t = V().sjezd, d = Math.hypot(t.x - sh.x, t.y - sh.y);
      if (d < 10) { sh.mode = 'queue'; sh.wait = 0; return; }
      const step = Math.min(d, 280 * scaleW(sh.x, sh.y) * dt);
      const p = { x: sh.x + ((t.x - sh.x) / d) * step, y: sh.y + ((t.y - sh.y) / d) * step };
      skiTo(sh, p, { x: p.x + (t.x - sh.x), y: p.y + (t.y - sh.y) });
    } else if (sh.mode === 'queue') {
      // čeká mimo obraz; na kotvu jen s odstupem od předchozí ovce
      sh.wait -= dt;
      const free = F.riding.every((u) => u > 0.08);
      if (sh.wait <= 0 && F.liftOn && F.liftSpeed > 0.5 && free) { sh.mode = 'ride'; sh.u = 0; F.riding.push(0); }
    } else if (sh.mode === 'ride') {
      sh.u += (dt * F.liftSpeed) / RIDE_SEC;
      const p = riderAt(Math.min(1, sh.u));
      sh.x = p.x; sh.y = p.y; sh.facing = -1; sh.walking = false;
      if (sh.u >= 1) {
        sh.mode = 'ski';
        sh.u = 0;
        sh.turns = K.rand(2.5, 4.5);
        sh.ph = K.rand(-0.5, 0.5);
        sh.amp = K.rand(90, 170);
      }
    } else if (sh.mode === 'ski') {
      sh.u += dt / SKI_SEC;
      skiTo(sh, skiAt(Math.min(1, sh.u), sh), skiAt(Math.min(1, sh.u + 0.01), sh));
      if (sh.u >= 1) { sh.mode = 'queue'; sh.wait = K.rand(0.3, 1.5); }
    }
  });
  pruneTracks();
}

// ovce na kotvách: oříznuté hranou svahu, ať to vypadá, že jedou po odvrácené straně kopce
function drawRiders(ctx) {
  const riders = K.sheep.filter((sh) => sh.mode === 'ride');
  if (!riders.length) return;
  const h = K.L.hrana;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(K.W, 0);
  ctx.lineTo(K.W, K.polyY(h, K.W));
  for (let i = h.length - 1; i >= 0; i--) ctx.lineTo(h[i].x, h[i].y);
  ctx.lineTo(0, K.polyY(h, 0));
  ctx.closePath();
  ctx.clip();
  for (const sh of riders) {
    const c = cableAt(Math.min(1, sh.u)), s = scaleW(sh.x, sh.y);
    ctx.strokeStyle = K.INK;
    ctx.lineWidth = 2.2 * s;
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(sh.x + 20 * s, sh.y - 34 * s); ctx.stroke();
    K.drawSheep(ctx, sh.x, sh.y, s, { facing: sh.facing, rot: sh.rot, skis: true, scarf: sh.scarf, ram: sh.ram });
  }
  ctx.restore();
}

// ---------- tetřívek na sloupu: sedí od rána, občas toká, při rozjezdu vleku uletí ----------
// sedící tetřívek na vršku sloupu; používá ho i louka (tam je sloup o K.L.snih jinde)
// displayT = kdy na něj hráč klikl (pak hned toká)
K.drawPoleGrouse = (ctx, top, s, displayT = null) => {
  // občas se otočí; v některých chvílích toká: roztáhne bílý vějíř a pokyvuje hlavou
  const win = Math.floor(K.time / 2.2), u = (K.time / 2.2) % 1;
  const facing = K.hash(win) < 0.5 ? -1 : 1;
  let display = K.hash(win + 11) < 0.35 ? Math.sin(u * Math.PI) * (0.85 + 0.15 * Math.sin(K.time * 14)) : 0;
  const dt = K.time - (displayT ?? -9);
  if (dt < 1.8) display = Math.max(display, Math.sin((dt / 1.8) * Math.PI) * (0.85 + 0.15 * Math.sin(K.time * 14)));
  const hop = !display && K.hash(win + 5) < 0.2 ? Math.max(0, Math.sin(K.time * 9)) * 2 * s : 0;
  K.drawGrouse(ctx, top.x, top.y - 1 - hop, s, { facing, display });
};

function drawPoleBird(ctx) {
  const b = F.bird;
  if (!b.on) return;
  const top = V().sloup, s = scaleW(top.x, top.y) * 1.6; // větší než ve skutečnosti, ať je vidět
  if (b.flyAt === null) return K.drawPoleGrouse(ctx, top, s);
  // tetřívek letí nízko a rovně: chvíli rychle mává, pak klouže
  const t = K.time - b.flyAt;
  if (t > 5) { b.on = false; return; }
  const flap = t % 1.3 < 0.75 ? 1 : 0.08;
  K.drawGrouse(ctx, top.x - 170 * t - 25 * t * t, top.y - 14 * s - 55 * t + Math.sin(t * 5) * 4, s * (1 + t * 0.1), { flying: true, facing: -1, flap });
}

// ---------- kouř ze všech komínů (ve finále se topí všude) ----------
function drawChimneys(ctx, m) {
  for (const c of K.L.chalupy) {
    if (!c.komin) continue;
    const k = off(c.komin, m);
    K.drawSmoke(ctx, k.x, k.y, c.w, c.x);
  }
}

// ---------- světla, hvězdy, sníh ----------
function drawWindows(ctx, win, m) {
  if (win <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const hs = K.L.chalupy.filter((h) => !h.druh); // boží muka nesvítí
  hs.forEach((h, k) => {
    // chalupy se nerozsvítí naráz
    const a = K.clamp((win - (k / hs.length) * 0.5) / 0.5);
    if (a <= 0) return;
    const p = off(h, m);
    const fl = 0.85 + K.hash(k * 13 + Math.floor(K.time * 3)) * 0.15;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, h.w * 0.55);
    g.addColorStop(0, `rgba(255, 190, 90, ${0.35 * a * fl})`);
    g.addColorStop(1, 'rgba(255, 190, 90, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(p.x - h.w, p.y - h.w, h.w * 2, h.w * 2);
    ctx.fillStyle = `rgba(255, 225, 150, ${a * fl})`;
    const ws = Math.max(1.6, h.w * 0.08);
    [-0.2, 0.15].forEach((dx) => ctx.fillRect(p.x + dx * h.w, p.y - ws, ws, ws));
  });
  ctx.restore();
}

function drawStars(ctx, a) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.fillStyle = '#fffbe8';
  for (const s of F.stars) {
    ctx.globalAlpha = a * (0.55 + 0.45 * Math.sin(K.time * 2 + s.ph));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function updateSnow(dt) {
  for (const f of F.flakes) {
    f.y += (70 + f.z * 260) * dt;
    f.x += (-40 - f.z * 80 + Math.sin(K.time * 0.7 + f.z * 20) * 30) * dt;
    if (f.y > K.H + 10) { f.y = -10; f.x = Math.random() * (K.W + 300); }
    if (f.x < -20) f.x += K.W + 40;
  }
}

function drawSnow(ctx, amount) {
  if (amount <= 0.01) return;
  const n = Math.floor(F.flakes.length * amount);
  ctx.save();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < n; i++) {
    const f = F.flakes[i];
    ctx.globalAlpha = 0.45 + f.z * 0.5;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 1 + f.z * 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- události časové osy ----------
const EVENTS = {
  start() {
    K.hero.visible = false;
    for (const sh of K.sheep) sh.mode = 'graze';
  },
  huddle() { for (const sh of K.sheep) sh.mode = 'huddle'; },
  dawn() {
    K.hero.visible = true;
    K.sheep.forEach((sh) => { sh.skis = true; });
    F.bird = { on: true, flyAt: null };
  },
  waitLift() { F.waiting = true; },
  stop() {
    F.liftOn = false;
    K.sound('vlek-stop');
    K.tween(2, (t) => { F.liftSpeed = 1 - t; });
    for (const sh of K.sheep) sh.mode = 'huddle';
  },
  leave() {
    // chumel odjíždí po svahu doprava dolů z obrazu
    for (const sh of K.sheep) sh.mode = 'leave';
    K.tween(4, (t) => { F.shift = { x: t * 1300, y: t * 260 }; }).then(() => { for (const sh of K.sheep) sh.mode = 'gone'; });
  },
  end() { F.ended = true; F.endedAt = K.time; },
};

// ---------- scéna ----------
K.scenes.finale = {
  enter() {
    F.keys = buildTimeline();
    F.t = 0;
    F.i = 0;
    F.waiting = false;
    F.liftOn = false;
    F.liftSpeed = 0;
    F.ended = false;
    F.shift = { x: 0, y: 0 };
    F.liftPos = 0;
    F.riding = [];
    F.trails = [];
    F.bird = { on: false, flyAt: null };
    if (!K.sheep.length) K.makeSheep();
    makeStars();
    EVENTS[F.keys[0].ev]();
    K.load(F.keys.map((k) => K.frameSrc(k.frame)));
    K.fadeTo(0, 1.2, '#000');
    // skok do finále pro ladění: ?finale=40 (sekundy)
    const skip = parseFloat(K.params.get('finale'));
    if (skip > 0) K.scenes.finale.update(0, skip);
  },

  update(dt, jump = 0) {
    const steps = jump ? Math.ceil(jump / 0.05) : 1;
    for (let s = 0; s < steps; s++) {
      const d = jump ? jump / steps : dt;
      const k = F.keys;
      if (!(F.waiting && !F.liftOn)) F.t += d;
      while (F.i < k.length - 1 && F.t >= k[F.i + 1].t) {
        F.i++;
        const ev = k[F.i].ev;
        if (ev && EVENTS[ev]) EVENTS[ev]();
        if (ev === 'waitLift' && !F.liftOn) { F.t = k[F.i].t; break; }
      }
      if (jump && F.waiting && !F.liftOn) { startLift(); F.liftSpeed = 1; }
      // lano běží stejně rychle jako ovce na kotvách
      F.liftPos += (d * F.liftSpeed * cableLen()) / RIDE_SEC;
      sheepFinale(d);
      updateSnow(d);
    }
    F.v = sample();
    K.frameNow = F.v.u < 0.5 ? F.v.frameA : F.v.frameB;
  },

  draw(ctx) {
    const v = F.v || sample();
    const m = snowMix(v);
    K.drawFrame(ctx, v.frameA);
    if (v.frameB !== v.frameA) K.drawFrame(ctx, v.frameB, v.u);

    drawChimneys(ctx, m);
    drawTracks(ctx);
    drawLift(ctx, v.lift);
    drawPoleBird(ctx);
    drawRiders(ctx);
    // panáček stojí na hraně vlevo od sloupu
    const pata = V().pata, hs = scaleW(pata.x, pata.y), hx = pata.x - 45 * hs, hy = edgeY(hx) + 4;
    const hero = { y: hy, draw: () => K.drawHero(ctx, hx, hy, hs, { facing: 1, wave: F.waiting && !F.liftOn }) };
    K.drawSheepFlock(ctx, K.hero.visible ? [hero] : [], (sh) => !HIDDEN.includes(sh.mode), scaleW);

    if (v.night > 0.01) {
      const n = v.night;
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgb(${K.lerp(255, 34, n) | 0}, ${K.lerp(255, 46, n) | 0}, ${K.lerp(255, 96, n) | 0})`;
      ctx.fillRect(0, 0, K.W, K.H);
      ctx.restore();
    }
    drawStars(ctx, v.stars * v.night);
    drawWindows(ctx, v.win, m);
    drawSnow(ctx, v.snow);

    if (F.ended) {
      const a = K.clamp((K.time - F.endedAt) / 2);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(10, 12, 24, 0.45)';
      ctx.fillRect(0, 0, K.W, K.H);
      K.drawTitle(ctx, K.W / 2, K.H / 2 - 20, 120);
      ctx.restore();
      if (a >= 1) K.drawRoundButton(ctx, K.W / 2, K.H / 2 + 120, 'znovu', true);
    }
  },

  hot(p) {
    if (F.ended) return K.dist(p, { x: K.W / 2, y: K.H / 2 + 120 }) < 45;
    if (F.waiting && !F.liftOn && K.dist(p, poleHit()) < 70) return true;
    return !!K.sheepAt(p, scaleW);
  },

  click(p) {
    if (F.ended) {
      if (K.dist(p, { x: K.W / 2, y: K.H / 2 + 120 }) < 45) location.reload();
      return;
    }
    if (F.waiting && !F.liftOn && K.dist(p, poleHit()) < 70) return startLift();
    const sh = K.sheepAt(p, scaleW);
    if (sh) {
      K.sound('bee');
      if (sh.mode === 'ski' || sh.mode === 'ride') sh.tumbleT = K.time;
      else sh.headUp = !sh.headUp;
    }
  },
};

function startLift() {
  F.liftOn = true;
  F.waiting = false;
  K.sound('vlek');
  if (F.bird.on) { F.bird.flyAt = K.time; K.sound('tetrivek'); }
  K.tween(2, (t) => { F.liftSpeed = t; });
  // ovce postupně sjedou z chumlu pod spodní okraj a odtud naskočí na vlek
  K.sheep.forEach((sh, i) => { sh.mode = 'toLift'; sh.wait = i * 0.9; });
}

K.finale = F;
