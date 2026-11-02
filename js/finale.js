// Finále: časosběr ze snímků webkamery. Noc se nefotí (kamera v noci šumí), ale dopočítává:
// ztmavený snímek + hvězdy + rozsvícená okna + vločky. Vše řídí časová osa klíčů níže.
const pick = (from, to) => window.SNIMKY.filter((n) => n >= from && n <= to);

// Klíč drží stav v daném okamžiku; mezi klíči se hodnoty plynule prolínají (snímky crossfadem).
// night 0–1 = ztmavení, snow = sněžení, win = okna, stars = hvězdy, lift = viditelnost vleku,
// clock = vlastní čas v HUD (u dopočítané noci), ev = událost při dosažení klíče.
function buildTimeline() {
  const keys = [];
  let t = 0;
  let cur = { frame: '2025-12-28_1300', night: 0, snow: 0, win: 0, stars: 0, lift: 0, clock: null };
  const add = (dur, k = {}) => {
    cur = { ...cur, clock: null, ev: null, ...k };
    keys.push({ ...cur, t, dur });
    t += dur;
  };
  add(0.8, { ev: 'start' });
  for (const f of pick('2025-12-28_1301', '2025-12-28_1630')) add(0.6, { frame: f });
  add(1.5);
  // soumrak → noc, chalupy se rozsvěcejí
  add(3, { night: 1, win: 1, stars: 1, clock: { date: '28. 12.', time: '22:00' }, ev: 'huddle' });
  add(2, { clock: { date: '2. 1.', time: '23:00' } });
  // začíná sněžit, hvězdy mizí
  add(2.5, { snow: 1, stars: 0, clock: { date: '3. 1.', time: '03:00' } });
  // pod sněhem se podklad vymění za zasněžený snímek
  add(4, { frame: '2026-01-05_0800', clock: { date: '4. 1.', time: '12:00' } });
  add(2.5, { clock: { date: '4. 1.', time: '22:00' }, lift: 1 });
  add(2.5, { snow: 0, stars: 1, clock: { date: '5. 1.', time: '04:00' } });
  // svítání
  add(3.5, { night: 0, stars: 0, win: 0, clock: { date: '5. 1.', time: '07:30' }, ev: 'dawn' });
  for (const f of pick('2026-01-05_0800', '2026-01-05_0900')) add(0.9, { frame: f });
  add(0.1, { ev: 'waitLift' });
  // lyžování
  for (const f of pick('2026-01-05_0901', '2026-01-05_1545')) add(2.4, { frame: f, ev: f.endsWith('0915') ? 'ski' : null });
  add(2.5, { ev: 'stop' });
  for (const f of pick('2026-01-05_1546', '2026-01-05_1630')) add(1.6, { frame: f, ev: f.endsWith('1615') ? 'leave' : null });
  add(3.5, { night: 0.85, win: 1, stars: 1, clock: { date: '5. 1.', time: '18:00' } });
  add(0, { ev: 'end', clock: { date: '5. 1.', time: '18:00' } });
  return keys;
}

const F = {
  keys: [], t: 0, i: 0, waiting: false, liftOn: false, liftSpeed: 0, liftOffset: 0, ended: 0,
  stars: [], flakes: [], v: null, shift: { x: 0, y: 0 },
};

// ---------- pomocné výpočty ----------
function snowMix(v) {
  const a = K.frameInfo(v.frameA).snow ? 1 : 0;
  const b = K.frameInfo(v.frameB).snow ? 1 : 0;
  return K.lerp(a, b, v.u);
}
const off = (pt, m) => ({ x: pt.x + K.L.snih.x * m, y: pt.y + K.L.snih.y * m });

function skylineY(x) {
  const o = K.L.obzor;
  for (let i = 1; i < o.length; i++) {
    if (x <= o[i].x) return K.lerp(o[i - 1].y, o[i].y, (x - o[i - 1].x) / (o[i].x - o[i - 1].x));
  }
  return o[o.length - 1].y;
}

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
  v.clock = a.clock;
  return v;
}

// ---------- vlek ----------
const liftEnds = () => ({ B: K.L.vlek.dole, T: K.L.vlek.nahore });
const poleH = (y) => 120 * K.scaleAt(y);
const liftGround = (u) => {
  const { B, T } = liftEnds();
  return { x: K.lerp(B.x, T.x, u), y: K.lerp(B.y, T.y, u) };
};
const cableAt = (u) => {
  const g = liftGround(u);
  return { x: g.x, y: g.y - poleH(g.y) };
};
// sjezdovka: z horní stanice dolů, oblouky blíž ke kameře
const skiAt = (u) => {
  const { B, T } = liftEnds();
  const x = K.lerp(T.x, B.x, u), y0 = K.lerp(T.y, B.y, u);
  const s = K.scaleAt(y0);
  return { x: x + Math.sin(u * Math.PI * 6) * 40 * s, y: y0 + (90 + 70 * Math.sin(u * Math.PI * 6 + 1)) * s * Math.sin(u * Math.PI) };
};
const booth = () => {
  const B = K.L.vlek.dole, s = K.scaleAt(B.y);
  return { x: B.x + 70 * s, y: B.y, s };
};

function drawLift(ctx, alpha) {
  if (alpha <= 0.01) return;
  const { B, T } = liftEnds();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  // sloupy
  for (let i = 0; i <= 4; i++) {
    const g = liftGround(i / 4), h = poleH(g.y), s = K.scaleAt(g.y);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 9 * s;
    ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x, g.y - h); ctx.stroke();
    ctx.strokeStyle = K.INK;
    ctx.lineWidth = 5 * s;
    ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x, g.y - h); ctx.lineTo(g.x - 14 * s, g.y - h); ctx.stroke();
  }
  // lano
  const c0 = cableAt(0), c1 = cableAt(1);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(c0.x, c0.y); ctx.lineTo(c1.x, c1.y); ctx.stroke();
  // prázdné kotvy, které se točí s lanem
  for (let i = 0; i < 9; i++) {
    const u = (i / 9 + F.liftOffset) % 1;
    const c = cableAt(u), s = K.scaleAt(c.y + poleH(c.y));
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x, c.y + 50 * s); ctx.moveTo(c.x - 12 * s, c.y + 50 * s); ctx.lineTo(c.x + 12 * s, c.y + 50 * s); ctx.stroke();
  }
  // budka s motorem u dolní stanice
  const b = booth();
  ctx.fillStyle = '#7a4b33';
  ctx.lineWidth = 4 * b.s;
  ctx.fillRect(b.x - 30 * b.s, b.y - 70 * b.s, 60 * b.s, 70 * b.s);
  ctx.strokeRect(b.x - 30 * b.s, b.y - 70 * b.s, 60 * b.s, 70 * b.s);
  ctx.fillStyle = F.liftOn ? '#ffd27a' : '#3e4a52';
  ctx.fillRect(b.x - 14 * b.s, b.y - 55 * b.s, 28 * b.s, 20 * b.s);
  ctx.save();
  ctx.translate(B.x, B.y - poleH(B.y));
  ctx.rotate(F.liftOffset * 40);
  K.drawIcon(ctx, 'kolo', 0, 0, 34 * b.s);
  ctx.restore();
  ctx.restore();
  if (F.waiting && !F.liftOn) K.drawHint(ctx, b.x, b.y - 35 * b.s, 70 * b.s);
}

// ---------- ovce ve finále ----------
function sheepFinale(dt) {
  const c0 = off(K.L.chumel, 1);
  const ch = { x: c0.x + F.shift.x, y: c0.y + F.shift.y };
  K.sheep.forEach((sh, i) => {
    if (sh.tumbleT && K.time - sh.tumbleT < 0.8) sh.rot = sh.baseRot + ((K.time - sh.tumbleT) / 0.8) * Math.PI * 2 * sh.facing;
    else sh.rot = sh.baseRot || 0;
    if (sh.mode === 'graze') return K.updateGrazing(sh, dt);
    if (sh.mode === 'huddle' || sh.mode === 'leave') {
      const a = (i / K.sheep.length) * Math.PI * 2;
      const s = K.scaleAt(ch.y);
      const tx = ch.x + Math.cos(a) * 34 * s + (i % 2) * 10 * s, ty = ch.y + Math.sin(a) * 14 * s;
      const sp = (sh.mode === 'leave' ? 260 : 90) * s * dt;
      const d = Math.hypot(tx - sh.x, ty - sh.y);
      if (d > 2) { sh.x += ((tx - sh.x) / d) * Math.min(d, sp); sh.y += ((ty - sh.y) / d) * Math.min(d, sp); sh.walking = !sh.skis; sh.phase += dt * 6; }
      else sh.walking = false;
      sh.baseRot = Math.sin(K.time * 30 + i) * 0.02; // tulí se a třesou zimou
      return;
    }
    // lyžovací kolečko: čekání dole → kotva nahoru → sjezd
    sh.baseRot = 0;
    if (sh.mode === 'queue') {
      sh.wait -= dt;
      const B = K.L.vlek.dole, s = K.scaleAt(B.y);
      sh.x = K.lerp(sh.x, B.x - (50 + sh.slot * 26) * s, K.clamp(dt * 5));
      sh.y = K.lerp(sh.y, B.y, K.clamp(dt * 5));
      sh.facing = -1;
      if (sh.wait <= 0 && F.liftOn && F.liftSpeed > 0.5) { sh.mode = 'ride'; sh.u = 0; }
    } else if (sh.mode === 'ride') {
      sh.u += dt / 9 * F.liftSpeed;
      const g = liftGround(sh.u);
      sh.x = g.x; sh.y = g.y; sh.facing = -1;
      if (sh.u >= 1) { sh.mode = 'ski'; sh.u = 0; }
    } else if (sh.mode === 'ski') {
      sh.u += dt / 5.5;
      const p = skiAt(Math.min(1, sh.u)), q = skiAt(Math.min(1, sh.u + 0.01));
      sh.facing = q.x >= p.x ? 1 : -1;
      sh.baseRot = Math.atan2(q.y - p.y, Math.abs(q.x - p.x) + 0.01) * 0.6 * sh.facing;
      sh.x = p.x; sh.y = p.y;
      if (sh.u >= 1) { sh.mode = 'queue'; sh.wait = 0.4 + Math.random(); }
    }
  });
}

function drawRiderBars(ctx) {
  for (const sh of K.sheep) {
    if (sh.mode !== 'ride') continue;
    const c = cableAt(sh.u), s = K.scaleAt(sh.y);
    ctx.strokeStyle = K.INK;
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(sh.x + 18 * s, sh.y - 30 * s); ctx.stroke();
  }
}

// ---------- světla, hvězdy, sníh ----------
function drawWindows(ctx, win, m) {
  if (win <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const hs = K.L.chalupy;
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
  },
  waitLift() { F.waiting = true; },
  ski() {
    K.sheep.forEach((sh, i) => { sh.mode = 'queue'; sh.slot = i; sh.wait = i * 1.6; });
  },
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
      F.liftOffset = (F.liftOffset + d * 0.03 * F.liftSpeed) % 1;
      sheepFinale(d);
      updateSnow(d);
    }
    F.v = sample();
    K.clock = F.v.u < 0.5 ? F.v.frameA : F.v.frameB;
    K.clockOverride = F.v.clock;
  },

  draw(ctx) {
    const v = F.v || sample();
    const m = snowMix(v);
    K.drawFrame(ctx, v.frameA);
    if (v.frameB !== v.frameA) K.drawFrame(ctx, v.frameB, v.u);

    drawLift(ctx, v.lift);
    drawRiderBars(ctx);
    const hero = booth();
    K.drawSheepFlock(ctx, K.hero.visible ? [{ y: hero.y, draw: () => K.drawHero(ctx, hero.x + 55 * hero.s, hero.y, hero.s, { facing: -1, wave: F.waiting && !F.liftOn }) }] : []);

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
      ctx.fillStyle = '#f3e6c8';
      ctx.textAlign = 'center';
      ctx.font = '600 120px Georgia, serif';
      ctx.fillText('Klášterka', K.W / 2, K.H / 2 - 20);
      ctx.restore();
      if (a >= 1) K.drawRoundButton(ctx, K.W / 2, K.H / 2 + 120, 'znovu', true);
    }
  },

  hot(p) {
    if (F.ended) return K.dist(p, { x: K.W / 2, y: K.H / 2 + 120 }) < 45;
    const b = booth();
    if (F.waiting && !F.liftOn && K.dist(p, { x: b.x, y: b.y - 35 * b.s }) < 80 * b.s) return true;
    return !!K.sheepAt(p);
  },

  click(p) {
    if (F.ended) {
      if (K.dist(p, { x: K.W / 2, y: K.H / 2 + 120 }) < 45) location.reload();
      return;
    }
    const b = booth();
    if (F.waiting && !F.liftOn && K.dist(p, { x: b.x, y: b.y - 35 * b.s }) < 80 * b.s) return startLift();
    const sh = K.sheepAt(p);
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
  K.tween(2, (t) => { F.liftSpeed = t; });
}

K.finale = F;
