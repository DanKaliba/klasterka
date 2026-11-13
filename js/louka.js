// Louka: hlavní scéna nad snímkem 28. 12. 13:00 — ovce, panáček, cesta k chalupám a na vrchol.
const MEADOW_FRAME = '2025-12-28_1300';
const SCARVES = ['#c0392b', '#2e86c1', '#e1b12c', '#27ae60', '#8e44ad', '#e67e22'];
// poslední ovce se neptá po lyžích, ale po beranovi, který se zatoulal do lesa (Daniel 2026-11-06)
const RAM_ASKER = SCARVES.length - 1;
const LAMB = 2; // jedna ovce je jehně: menší a mečí po svém
const LAMB_SIZE = 0.72;

// Sněžná květina (Daniel 2026-11-09): strom v lese poradí zasadit ji na vrcholu Zadní Planiny; pyl z jejích
// květů zasype Krkonoše jako sníh. Potřebuje 3 věci (tolik míst má batoh v HUD, pořadí jako v herbáři):
// semínka z kuchyně na Kantorské, vodu ze studánky u božích muk a rampouch z lesa (js/les.js).
K.ITEMS = ['semena', 'voda', 'rampouch'];
// místa na louce s úkolem → co v nich panáček získá (odměna přeletí do batohu)
// Skočka, Jelínek a Klínovka teď úkol nemají (detaily v chalupy.js zůstaly, čekají na Danielovo rozhodnutí),
// Spisovatel a Ranč taky ne (Daniel 2026-11-05); všechny jen v noci svítí.
K.CHALETS = {
  kantorska: 'semena',
  kriz: 'voda',
};
K.hasAllItems = () => K.ITEMS.every((it) => K.state.items.includes(it));

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

// les mezi dolní a horní loukou = souvislý úsek skrytých bodů cesty (první a poslední index)
K.forestSpan = () => {
  const c = K.L.cesta;
  const a = c.findIndex((p) => p.skryto);
  let b = a;
  while (a >= 0 && b + 1 < c.length && c[b + 1].skryto) b++;
  return [a, b];
};

K.nearestPathIndex = (pt) => {
  let best = 0, bd = Infinity;
  K.L.cesta.forEach((c, i) => {
    const d = K.dist(c, pt);
    if (d < bd) { bd = d; best = i; }
  });
  return { index: best, dist: bd };
};

// ---------- plochy, kde se dá chodit kamkoli (K.L.chuze, ladí se v editoru) ----------
K.walkAreaAt = (pt) => (K.L.chuze || []).find((poly) => K.inPolygon(pt, poly)) || null;

// nejbližší viditelný bod cesty, přednostně ve stejné ploše jako pt (tam se z louky napojí na cestu)
K.pathIndexNear = (pt) => {
  const c = K.L.cesta, area = K.walkAreaAt(pt);
  let ids = c.map((_, i) => i).filter((i) => !c[i].skryto && area && K.inPolygon(c[i], area));
  if (!ids.length) ids = c.map((_, i) => i).filter((i) => !c[i].skryto);
  return ids.reduce((best, i) => (K.dist(c[i], pt) < K.dist(c[best], pt) ? i : best), ids[0]);
};

// ---------- hrdina ----------
// Chodí po cestě (p = poloha na lomené čáře K.L.cesta) nebo volně po loukách (off = {x, y}).
// Chůze je fronta úseků: { path: i } po cestě k bodu i, { free: {x, y} } rovně na místo v ploše,
// { join: i } rovně z louky na bod cesty i (dál zase po cestě). Do chalupy, do lesa a na druhou
// louku se chodí po cestě; v rámci jedné louky rovnou.
K.hero = {
  p: 0, off: null, legs: [], leg: null, target: null, facing: 1, phase: 0, visible: true, onArrive: null,
  frozen: false, // stojí na kraji lesa, dokud se hráč nevrátí z lesní scény
  get pos() { return this.off ? { x: this.off.x, y: this.off.y, alpha: 1 } : K.pathPoint(this.p); },
  plan(legs) {
    const done = new Promise((r) => { this.onArrive = r; });
    this.legs = legs.slice();
    this.nextLeg();
    return done;
  },
  stop() {
    this.legs = [];
    this.leg = null;
    this.target = null;
  },
  joinLegs() {
    return this.off ? [{ join: K.pathIndexNear(this.off) }] : [];
  },
  walkTo(index) {
    return this.plan([...this.joinLegs(), { path: index }]);
  },
  walkFree(pt) {
    const area = K.walkAreaAt(pt);
    if (area && K.walkAreaAt(this.pos) === area) return this.plan([{ free: pt }]);
    return this.plan([...this.joinLegs(), { path: K.pathIndexNear(pt) }, { free: pt }]);
  },
  nextLeg() {
    const L = this.legs.shift();
    if (!L) return this.arrive();
    if (L.path === undefined && !this.off) { const p = this.pos; this.off = { x: p.x, y: p.y }; }
    this.leg = L;
    this.target = L.path !== undefined ? L.path : L;
  },
  endLeg() {
    this.leg = null;
    this.target = null;
    this.nextLeg();
  },
  update(dt) {
    if (this.target === null || this.frozen) return;
    if (this.leg.path === undefined) return this.updateFree(dt, this.leg);
    const c = K.L.cesta;
    const dir = Math.sign(this.target - this.p);
    if (dir === 0) return this.endLeg();
    const i = dir > 0 ? Math.floor(this.p) : Math.ceil(this.p) - 1;
    const a = c[Math.max(0, i)], b = c[Math.min(c.length - 1, i + 1)];
    const segLen = Math.max(1, K.dist(a, b));
    const here = this.pos;
    // v lese (skrytý úsek) jde rychleji, ať se hráč nenudí
    const speed = (170 * K.scaleAt(here.x, here.y) + 20) * (a.skryto || b.skryto ? 3 : 1);
    const before = this.p;
    this.p += (dir * speed * dt) / segLen;
    // Les: dokud není vyřešený, cesta se na jeho kraji přeruší a otevře se lesní scéna (js/les.js).
    // Rozběhnutá chůze (i s čekajícím enterPlace) po návratu pokračuje z druhého kraje lesa.
    if (!K.state.solved.les && K.scene === K.scenes.louka) {
      const [fa, fb] = K.forestSpan(), edge = dir > 0 ? fa : fb;
      if (fa >= 0 && (before - edge) * dir < 0 && (this.p - edge) * dir >= 0) {
        this.p = edge;
        this.frozen = true;
        K.enterForest(dir);
        return;
      }
    }
    if ((dir > 0 && this.p >= this.target) || (dir < 0 && this.p <= this.target)) {
      this.p = this.target;
      return this.endLeg();
    }
    this.facing = dir * Math.sign(b.x - a.x || 1);
    this.stepFx(dt, here, (b.x - a.x) / segLen, (b.y - a.y) / segLen);
  },
  updateFree(dt, L) {
    const goal = L.free || K.pathPoint(L.join);
    const o = this.off, dx = goal.x - o.x, dy = goal.y - o.y, d = Math.hypot(dx, dy);
    const step = (170 * K.scaleAt(o.x, o.y) + 20) * dt;
    if (d <= step) {
      o.x = goal.x;
      o.y = goal.y;
      if (L.join !== undefined) { this.off = null; this.p = L.join; }
      return this.endLeg();
    }
    o.x += (dx / d) * step;
    o.y += (dy / d) * step;
    if (Math.abs(dx) > 0.5) this.facing = Math.sign(dx);
    this.stepFx(dt, this.pos, dx / d, dy / d);
  },
  // kroky: noha dopadne, když je krok nejdelší; louka je vždy podzimní, takže křupe zmrzlá tráva.
  // Vzdálený (menší) panáček je slyšet slaběji, v lese ještě slaběji. (ux, uy) = směr chůze.
  stepFx(dt, here, ux, uy) {
    const step = Math.floor(this.phase / Math.PI + 0.5);
    this.phase += dt * 9;
    if (Math.floor(this.phase / Math.PI + 0.5) === step || K.scene !== K.scenes.louka) return;
    const near = 0.45 + 0.55 * K.clamp(K.scaleAt(here.x, here.y));
    K.sound(K.stepSound(), {
      volume: K.STEP_VOLUME * near * (0.5 + 0.5 * here.alpha) * K.rand(0.75, 1),
      rate: K.rand(0.9, 1.12),
    });
    // stopa v jinovatce: střídavě levá a pravá noha, kolmo na směr chůze
    if (here.alpha > 0.5) {
      const s = K.scaleAt(here.x, here.y), side = step % 2 ? 1 : -1;
      K.footprints.push({ x: here.x - uy * side * 6 * s, y: here.y + ux * side * 3 * s, s, t: K.time });
      if (K.footprints.length > 400) K.footprints.shift();
    }
  },
  arrive() {
    this.leg = null;
    this.target = null;
    const r = this.onArrive;
    this.onArrive = null;
    if (r) r();
  },
  draw(ctx) {
    if (!this.visible) return;
    const p = this.pos;
    if (p.alpha <= 0.02) return;
    K.drawHero(ctx, p.x, p.y, K.scaleAt(p.x, p.y), {
      facing: this.facing, phase: this.phase, walking: this.target !== null, alpha: p.alpha,
    });
  },
};

// ---------- stopy panáčka v jinovatce (pomalu mizí) ----------
const FOOTPRINT_LIFE = 25;
K.footprints = [];
function drawFootprints(ctx) {
  while (K.footprints.length && K.time - K.footprints[0].t > FOOTPRINT_LIFE) K.footprints.shift();
  ctx.save();
  ctx.fillStyle = 'rgb(46, 52, 34)'; // pod sešlápnutou jinovatkou je tmavá tráva
  for (const f of K.footprints) {
    const age = (K.time - f.t) / FOOTPRINT_LIFE;
    ctx.globalAlpha = 0.6 * (1 - age * age);
    ctx.beginPath();
    ctx.ellipse(f.x, f.y, 7 * f.s, 2.6 * f.s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- ovce ----------
K.sheep = [];
K.makeSheep = () => {
  K.sheep = SCARVES.map((scarf, i) => {
    const pt = K.randomInPolygon(K.L.louka);
    return {
      x: pt.x, y: pt.y, tx: pt.x, ty: pt.y, facing: i % 2 ? 1 : -1, phase: Math.random() * 6,
      wait: Math.random() * 3, headUp: false, scarf, rot: 0, mode: 'graze', asksRam: i === RAM_ASKER,
      lamb: i === LAMB,
    };
  });
};

K.updateGrazing = (sh, dt, scale = K.scaleAt) => {
  const d = Math.hypot(sh.tx - sh.x, sh.ty - sh.y);
  if (d > 2) {
    const sp = 28 * scale(sh.x, sh.y) * dt;
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

K.sheepSize = (sh) => (sh.lamb ? LAMB_SIZE : 1);
K.sheepAt = (p, scale = K.scaleAt) => K.sheep.find((sh) => {
  const s = scale(sh.x, sh.y) * K.sheepSize(sh);
  return Math.abs(p.x - sh.x) < 50 * s && p.y < sh.y + 6 && p.y > sh.y - 60 * s;
});

K.drawSheepFlock = (ctx, extra = [], filter = null, scale = K.scaleAt) => {
  const flock = filter ? K.sheep.filter(filter) : K.sheep;
  const items = [...flock.map((sh) => ({ y: sh.y, draw: () => K.drawSheep(ctx, sh.x, sh.y, scale(sh.x, sh.y) * K.sheepSize(sh), {
    facing: sh.facing, phase: sh.phase, walking: sh.walking, headUp: sh.headUp, rot: sh.rot,
    skis: sh.skis, scarf: sh.skis ? sh.scarf : null, ram: sh.ram, lamb: sh.lamb, bleat: K.time - (sh.bleatT ?? -9) < 0.9,
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
const allSolved = () => K.hasAllItems();
const house = (id) => K.L.chalupy.find((c) => c.id === id);

K.scenes.louka = {
  flock: () => 1, // stádo na pozadí (js/jadro.js)
  async enter(arg) {
    K.frameNow = MEADOW_FRAME;
    K.hero.visible = true;
    if (!K.sheep.length) K.makeSheep();
    if (arg && arg.from === 'les') {
      // z lesa: panáček vyjde na druhém kraji a dojde, kam měl namířeno
      const trip = K.forestTrip, [a, b] = K.forestSpan();
      K.forestTrip = null;
      // bez rozběhnuté chůze (?scena=les) stojí o bod dál, jinak by zůstal neviditelný v lese
      K.hero.p = trip ? (trip.dir < 0 ? a : b) : Math.min(b + 1, K.L.cesta.length - 1);
      K.hero.frozen = false;
      if (!trip) K.hero.stop();
      K.busy = trip ? trip.busy : 0;
      K.fade.a = 1;
      K.fadeTo(0, 1, K.FOREST_FADE);
    } else if (arg && arg.from) {
      const target = arg.from === 'vrchol' ? K.L.vrchol : house(arg.from);
      K.busy++;
      cam.z = 7; cam.k = 1;
      K.fade.a = 1;
      await zoom(target, false);
      K.busy--;
    } else {
      K.hero.p = 0;
      K.hero.off = null;
      K.hero.stop();
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

    // z hotových chalup se kouří: někdo v nich zatopil (boží muka komín nemají)
    for (const c of K.L.chalupy) {
      if (K.state.solved[c.id] && c.komin) K.drawSmoke(ctx, c.komin.x, c.komin.y, c.w, c.x);
    }
    for (const c of K.L.chalupy) {
      if (!K.CHALETS[c.id]) continue;
      if (K.state.solved[c.id]) K.drawIcon(ctx, K.CHALETS[c.id], c.x, c.y - c.w * 0.9, 18, '#fffbea');
      else if (K.state.asked) K.drawHint(ctx, c.x, c.y - c.w * 0.15, c.w * 0.9);
    }
    const v = K.L.vrchol;
    if (K.state.asked) {
      if (allSolved()) K.drawHint(ctx, v.x, v.y, 40);
      // bez všech tří věcí: bublina s tou, která ještě chybí
      const missing = K.ITEMS.find((it) => !K.state.items.includes(it));
      if (lockBubble > K.time && missing) K.drawBubble(ctx, v.x, v.y - 6, 0.45, missing);
    }

    drawFootprints(ctx);
    K.drawPoleGrouse(ctx, grouseTop(), grouseScale(), grouseT);
    const hp = K.hero.pos;
    K.drawSheepFlock(ctx, [{ y: hp.y, draw: () => K.hero.draw(ctx) }]);
    if (bubble && bubble.until > K.time) {
      const sh = bubble.sheep, s = K.scaleAt(sh.x, sh.y) * K.sheepSize(sh);
      K.drawBubble(ctx, sh.x + sh.facing * 30 * s, sh.y - 55 * s, Math.max(0.6, s), bubble.icon);
    }
    ctx.restore();
  },

  hot(p) {
    if (K.sheepAt(p) || grouseAt(p)) return true;
    if (!K.state.asked) return false;
    if (K.dist(p, K.L.vrchol) < 50) return true;
    return K.L.chalupy.some((c) => K.CHALETS[c.id] && !K.state.solved[c.id] && K.dist(p, c) < c.w);
  },

  click(p) {
    const sh = K.sheepAt(p);
    if (sh) return sheepTalk(sh);
    if (grouseAt(p)) {
      grouseT = K.time;
      return K.sound('tetrivek-tokani');
    }
    if (K.state.asked) {
      if (K.dist(p, K.L.vrchol) < 50) return allSolved() ? enterPlace('vrchol', K.L.vrchol) : (lockBubble = K.time + 2);
      const c = K.L.chalupy.find((h) => K.CHALETS[h.id] && !K.state.solved[h.id] && K.dist(p, h) < h.w);
      if (c) return enterPlace(c.id, c);
    }
    // klik do louky = dojdi tam (po jiné louce přes cestu), klik kousek od cesty = dojdi na cestu
    if (K.walkAreaAt(p)) return K.hero.walkFree(p);
    const n = K.nearestPathIndex(p);
    if (n.dist < 90 && !K.L.cesta[n.index].skryto) K.hero.walkTo(n.index);
  },
};

function sheepTalk(sh) {
  K.bleat(sh);
  if (sh.asksRam && !K.state.solved.les) {
    // jen tahle ovce zvedne hlavu a ptá se po beranovi (úkoly chalup to neodemyká)
    bubble = { sheep: sh, icon: 'beran', until: K.time + 3.2 };
    sh.headUp = true;
    return;
  }
  bubble = { sheep: sh, icon: 'ovceLyze', until: K.time + 3.2 };
  for (const o of K.sheep) o.headUp = true;
  K.state.asked = true;
}

// tetřívek sedí na vršku sloupu vleku od začátku hry (ve finále při rozjezdu vleku uletí);
// klik na něj = zatoká. Sloup je v zimních souřadnicích, louka je podzimní snímek.
let grouseT = null;
const grouseTop = () => ({ x: K.L.vlek.sloup.x - K.L.snih.x, y: K.L.vlek.sloup.y - K.L.snih.y });
const grouseScale = () => { const t = grouseTop(); return K.scaleAt(t.x, t.y) * 1.6; };
const grouseAt = (p) => { const t = grouseTop(), s = grouseScale(); return Math.abs(p.x - t.x) < 26 * s && p.y < t.y + 6 && p.y > t.y - 34 * s; };

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
