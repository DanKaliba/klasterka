// Louka: hlavní scéna nad snímkem 28. 12. 13:00 — ovce, panáček, cesta k chalupám a na vrchol.
const MEADOW_FRAME = '2025-12-28_1300';
const SCARVES = ['#c0392b', '#2e86c1', '#e1b12c', '#27ae60', '#8e44ad', '#e67e22'];

// cíl úkolu u každé chalupy (odměna se objeví v HUD)
K.CHALETS = {
  spisovatel: 'plan',
  skocka: 'lyze',
  kantorska: 'kotva',
  ranc: 'lano',
  jelinek: 'kolo',
  klinovka: 'caj',
};

// ---------- cesta ----------
K.pathPoint = (p) => {
  const c = K.L.cesta;
  const i = Math.max(0, Math.min(c.length - 1, Math.floor(p)));
  const j = Math.min(c.length - 1, i + 1);
  const t = p - i;
  const a = c[i], b = c[j];
  return {
    x: K.lerp(a.x, b.x, t),
    y: K.lerp(a.y, b.y, t),
    alpha: K.lerp(a.skryto ? 0 : 1, b.skryto ? 0 : 1, t),
  };
};

K.nearestPathIndex = (pt) => {
  let best = 0, bd = Infinity;
  K.L.cesta.forEach((c, i) => {
    const d = K.dist(c, pt);
    if (d < bd) { bd = d; best = i; }
  });
  return { index: best, dist: bd };
};

// ---------- hrdina ----------
K.hero = {
  p: 0, target: null, facing: 1, phase: 0, visible: true, onArrive: null,
  get pos() { return K.pathPoint(this.p); },
  walkTo(index) {
    this.target = index;
    return new Promise((r) => { this.onArrive = r; });
  },
  update(dt) {
    if (this.target === null) return;
    const c = K.L.cesta;
    const dir = Math.sign(this.target - this.p);
    if (dir === 0) return this.arrive();
    const i = dir > 0 ? Math.floor(this.p) : Math.ceil(this.p) - 1;
    const a = c[Math.max(0, i)], b = c[Math.min(c.length - 1, i + 1)];
    const segLen = Math.max(1, K.dist(a, b));
    const here = this.pos;
    // v lese (skrytý úsek) jde rychleji, ať se hráč nenudí
    const speed = (170 * K.scaleAt(here.y) + 20) * (a.skryto || b.skryto ? 3 : 1);
    this.p += (dir * speed * dt) / segLen;
    if ((dir > 0 && this.p >= this.target) || (dir < 0 && this.p <= this.target)) {
      this.p = this.target;
      return this.arrive();
    }
    this.facing = dir * Math.sign(b.x - a.x || 1);
    this.phase += dt * 9;
  },
  arrive() {
    this.target = null;
    const r = this.onArrive;
    this.onArrive = null;
    if (r) r();
  },
  draw(ctx) {
    if (!this.visible) return;
    const p = this.pos;
    if (p.alpha <= 0.02) return;
    K.drawHero(ctx, p.x, p.y, K.scaleAt(p.y), {
      facing: this.facing, phase: this.phase, walking: this.target !== null, alpha: p.alpha,
    });
  },
};

// ---------- ovce ----------
K.sheep = [];
K.makeSheep = () => {
  K.sheep = SCARVES.map((scarf, i) => {
    const pt = K.randomInPolygon(K.L.louka);
    return {
      x: pt.x, y: pt.y, tx: pt.x, ty: pt.y, facing: i % 2 ? 1 : -1, phase: Math.random() * 6,
      wait: Math.random() * 3, headUp: false, scarf, rot: 0, mode: 'graze',
    };
  });
};

K.updateGrazing = (sh, dt) => {
  const d = Math.hypot(sh.tx - sh.x, sh.ty - sh.y);
  if (d > 2) {
    const sp = 28 * K.scaleAt(sh.y) * dt;
    sh.x += ((sh.tx - sh.x) / d) * sp;
    sh.y += ((sh.ty - sh.y) / d) * sp;
    sh.facing = sh.tx > sh.x ? 1 : -1;
    sh.phase += dt * 6;
    sh.walking = true;
  } else {
    sh.walking = false;
    sh.wait -= dt;
    if (sh.wait <= 0) {
      sh.wait = K.rand(2, 6);
      let pt;
      for (let k = 0; k < 20; k++) {
        pt = { x: sh.x + K.rand(-160, 160), y: sh.y + K.rand(-70, 70) };
        if (K.inPolygon(pt, K.L.louka)) break;
        pt = null;
      }
      if (pt) { sh.tx = pt.x; sh.ty = pt.y; }
    }
  }
};

K.sheepAt = (p) => K.sheep.find((sh) => {
  const s = K.scaleAt(sh.y);
  return Math.abs(p.x - sh.x) < 50 * s && p.y < sh.y + 6 && p.y > sh.y - 60 * s;
});

K.drawSheepFlock = (ctx, extra = [], filter = null) => {
  const flock = filter ? K.sheep.filter(filter) : K.sheep;
  const items = [...flock.map((sh) => ({ y: sh.y, draw: () => K.drawSheep(ctx, sh.x, sh.y, K.scaleAt(sh.y), {
    facing: sh.facing, phase: sh.phase, walking: sh.walking, headUp: sh.headUp, rot: sh.rot,
    skis: sh.skis, scarf: sh.skis ? sh.scarf : null,
  }) })), ...extra];
  items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());
};

// ---------- kamera pro přiblížení do chalupy ----------
const cam = { x: K.W / 2, y: K.H / 2, z: 1, k: 0 };
function applyCam(ctx) {
  if (cam.z === 1) return;
  const sx = K.lerp(cam.x, K.W / 2, cam.k), sy = K.lerp(cam.y, K.H / 2, cam.k);
  ctx.translate(sx, sy);
  ctx.scale(cam.z, cam.z);
  ctx.translate(-cam.x, -cam.y);
}
async function zoom(target, inward) {
  cam.x = target.x;
  cam.y = target.y;
  await Promise.all([
    K.tween(1.1, (t) => {
      const e = K.ease(inward ? t : 1 - t);
      cam.z = K.lerp(1, 7, e);
      cam.k = e;
    }),
    inward ? K.after(0.5).then(() => K.fadeTo(1, 0.6, '#efe6d2')) : K.fadeTo(0, 0.7),
  ]);
  if (!inward) { cam.z = 1; cam.k = 0; }
}

// ---------- scéna ----------
let bubble = null; // { sheep, icon, until }
let lockBubble = 0;
const allSolved = () => Object.keys(K.CHALETS).every((id) => K.state.solved[id]);
const house = (id) => K.L.chalupy.find((c) => c.id === id);

K.scenes.louka = {
  async enter(arg) {
    K.clock = MEADOW_FRAME;
    K.clockOverride = null;
    K.hero.visible = true;
    if (!K.sheep.length) K.makeSheep();
    if (arg && arg.from) {
      const target = arg.from === 'vrchol' ? K.L.vrchol : house(arg.from);
      K.busy++;
      cam.z = 7; cam.k = 1;
      K.fade.a = 1;
      await zoom(target, false);
      K.busy--;
    } else {
      K.hero.p = 0;
      K.fade.a = 1;
      K.fadeTo(0, 1.2, '#000');
      K.hero.walkTo(1);
    }
  },

  update(dt) {
    K.hero.update(dt);
    for (const sh of K.sheep) {
      K.updateGrazing(sh, dt);
      if (!bubble || bubble.until < K.time) sh.headUp = false;
    }
  },

  draw(ctx) {
    ctx.save();
    applyCam(ctx);
    K.drawFrame(ctx, MEADOW_FRAME);
    if (K.debug) drawPathDebug(ctx);

    for (const c of K.L.chalupy) {
      if (!K.CHALETS[c.id]) continue;
      if (K.state.solved[c.id]) K.drawIcon(ctx, K.CHALETS[c.id], c.x, c.y - c.w * 0.9, 18, '#fffbea');
      else if (K.state.asked) K.drawHint(ctx, c.x, c.y - c.w * 0.15, c.w * 0.9);
    }
    const v = K.L.vrchol;
    if (K.state.asked) {
      if (allSolved()) K.drawHint(ctx, v.x, v.y, 40);
      if (lockBubble > K.time) K.drawBubble(ctx, v.x, v.y - 6, 0.45, 'zamek');
    }

    const hp = K.hero.pos;
    K.drawSheepFlock(ctx, [{ y: hp.y, draw: () => K.hero.draw(ctx) }]);
    if (bubble && bubble.until > K.time) {
      const sh = bubble.sheep, s = K.scaleAt(sh.y);
      K.drawBubble(ctx, sh.x + sh.facing * 30 * s, sh.y - 55 * s, Math.max(0.6, s), bubble.icon);
    }
    ctx.restore();
  },

  hot(p) {
    if (K.sheepAt(p)) return true;
    if (!K.state.asked) return false;
    if (K.dist(p, K.L.vrchol) < 50) return true;
    return K.L.chalupy.some((c) => K.CHALETS[c.id] && !K.state.solved[c.id] && K.dist(p, c) < c.w);
  },

  click(p) {
    const sh = K.sheepAt(p);
    if (sh) return sheepTalk(sh);
    if (K.state.asked) {
      if (K.dist(p, K.L.vrchol) < 50) return allSolved() ? enterPlace('vrchol', K.L.vrchol) : (lockBubble = K.time + 2);
      const c = K.L.chalupy.find((h) => K.CHALETS[h.id] && !K.state.solved[h.id] && K.dist(p, h) < h.w);
      if (c) return enterPlace(c.id, c);
    }
    // klik kousek od cesty = dojdi tam
    const n = K.nearestPathIndex(p);
    if (n.dist < 90 && !K.L.cesta[n.index].skryto) K.hero.walkTo(n.index);
  },
};

function sheepTalk(sh) {
  K.sound('bee');
  bubble = { sheep: sh, icon: 'ovceLyze', until: K.time + 3.2 };
  for (const o of K.sheep) o.headUp = true;
  K.state.asked = true;
}

async function enterPlace(id, target) {
  K.busy++;
  await K.hero.walkTo(K.nearestPathIndex(target).index);
  K.sound('dvere');
  await zoom(target, true);
  K.busy--;
  K.go(id);
}

function drawPathDebug(ctx) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  K.L.cesta.forEach((c, i) => (i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y)));
  ctx.stroke();
  ctx.restore();
}
