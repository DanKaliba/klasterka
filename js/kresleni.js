// Zástupné kresby: panáčci z čárek, ovce, zvířata, ikony a papírové pozadí detailů.
// Až Daniel dodá vlastní obrázky, nahradí se jednotlivé funkce draw* kreslením sprajtů.
const INK = '#1d1712';
const WOOL = '#f4f1ea';
const PAPER = '#efe6d2';

// chvění čar jako u ruční animace: bod se mírně posouvá v taktu K.boil
const jit = (k, amt) => (K.hash(k + K.boil * 7.31) - 0.5) * amt;

function stroke(ctx, pts, w, seed = 0, amt = 1.2) {
  ctx.lineWidth = w;
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const px = x + jit(seed + i * 3.1, amt), py = y + jit(seed + i * 5.7, amt);
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  });
  ctx.stroke();
}

// Postava se kreslí dvakrát: světlý obrys (aby byla vidět na fotce) a pak inkoust.
function twoPass(ctx, halo, fn) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (halo) {
    ctx.strokeStyle = 'rgba(255, 252, 240, 0.8)';
    fn(0);
  }
  ctx.strokeStyle = INK;
  fn(1);
  ctx.restore();
}

// ---------- panáček (hrdina) ----------
// y = chodidla, s = měřítko (celá postava ve stoji = 150·s)
// ---------- hrdina jako papírová loutka ----------
// Kluk v klobouku z alba (Daniel 2026-11-22, prompty L1–L3 v pics/podklady-postavy/PROMPT-postavy.md;
// python tools/sprity.py → K.SPRITY.hrdinaL2 a hrdinaL3). Díly z kartonu spojené mosaznými nýtky:
// rameno, loket, zápěstí, kyčel, koleno, kotník; hlava sedí na krku, klobouk volně na hlavě.
// Obličej není vidět, city hraje tělo a klobouk. Aby to působilo jako papír, ne jako pružný panáček:
//  - póza se mění po krocích (LOUTKA_FPS za sekundu, chůze WALK_STEPS kroků na dvojkrok) jako u animace
//    po snímcích (Zeman),
//  - každý krok kloub trochu ujede (JITTER, ruka animátora),
//  - při přechodu mezi pózami předloktí, ruka a klobouk dobíhají (LAG), při chůzi se ruce klátí se zpožděním,
//  - otočka = figurka se zúží na hranu kartonu a rozbalí zrcadlově,
//  - každý díl vrhá drobný stín na díl pod sebou.
// Klouby dílů jako podíly šířky a výšky obrázku (postava kouká doprava, končetina visí dolů):
// a = horní kloub dílu, b = dolní kloub (u ruky konec prstů), grip = kde ruka drží věc.
// Celé je to ve vlastní funkci, ať se jména (MOUTH, WET, mix…) nepotkají s konstantami scén.
const drawHeroPuppet = (() => {
const LOUTKA = {
  trup: { neck: [0.58, 0.08], shF: [0.27, 0.2], shB: [0.62, 0.2], hipF: [0.42, 0.83], hipB: [0.58, 0.8], pelvis: [0.5, 0.82] },
  hlava: { neck: [0.47, 0.88], seat: [0.47, 0.4], mouth: [0.84, 0.69] },
  klobouk: { seat: [0.48, 0.78] },
  paze: { a: [0.45, 0.13], b: [0.6, 0.86] },
  predlokti: { a: [0.4, 0.13], b: [0.57, 0.86] },
  ruka: { a: [0.3, 0.12], b: [0.62, 0.97], grip: [0.5, 0.55] },
  pest: { a: [0.22, 0.14], b: [0.6, 0.85], grip: [0.62, 0.6] },
  stehno: { a: [0.5, 0.12], b: [0.5, 0.88] },
  lytko: { a: [0.5, 0.08], b: [0.5, 0.93] },
  chodidlo: { a: [0.25, 0.15], heel: [0.08, 0.95], toe: [0.97, 0.9] },
};
const LOUTKA_FPS = 12;
const WALK_STEPS = 8;
const JITTER = 0.035;
const PIN_R = 4.2; // nýtek v px dílů
const L2_PARTS = ['trup', 'hlava', 'klobouk', 'paze', 'predlokti', 'ruka', 'pest', 'paze2', 'predlokti2', 'ruka2', 'pest2'];
const L3_PARTS = ['stehno', 'lytko', 'chodidlo', 'stehno2', 'lytko2', 'chodidlo2'];

// Póza = úhly kloubů v rad. Končetiny: 0 = visí dolů, kladně = konec jde dozadu (proti tomu, kam kouká).
// lean = trup (kladně = předklon), neck = hlava, hat = klobouk vůči hlavě (kladně = krempa do očí),
// hatY / lift = posun klobouku / celé postavy v px dílů (záporně = nahoru),
// s/e/w = rameno, loket, zápěstí; h/k = kyčel, koleno; t = chodidlo vůči zemi (kladně = pata nahoře);
// F = bližší strana, B = vzdálená. handF/handB: 'ruka' (otevřená) | 'pest'.
const POSE_KEYS = ['lean', 'neck', 'hat', 'hatY', 'lift', 'sF', 'eF', 'wF', 'sB', 'eB', 'wB', 'hF', 'kF', 'tF', 'hB', 'kB', 'tB'];
const LAG = { eF: 1.5, eB: 1.5, kF: 1.3, kB: 1.3, wF: 2.2, wB: 2.2, hat: 2.6, hatY: 2.6 };
const STAND = { lean: 0, neck: 0, hat: 0, hatY: 0, lift: 0, sF: 0.06, eF: -0.14, wF: -0.12, sB: -0.04, eB: -0.12, wB: -0.1,
  hF: 0.05, kF: 0.04, tF: 0, hB: -0.08, kB: 0.06, tB: 0, handF: 'ruka', handB: 'ruka', armOverHat: true };

const ramp = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const smooth = (u) => u * u * (3 - 2 * u);
const env = (t, dur, io = 0.3) => smooth(ramp(t, 0, io)) * (1 - smooth(ramp(t, dur - io, dur))); // náběh, držení, doběh
// přimíchá k póze q jinou (jen klíče z over) vahou w
const mix = (q, over, w) => {
  for (const k in over) q[k] = typeof over[k] === 'number' ? q[k] + (over[k] - q[k]) * w : w > 0.5 ? over[k] : q[k];
  return q;
};

function walkPose(q, p) {
  const d = (2 * Math.PI) / WALK_STEPS; // jeden krok animace = zpoždění předloktí, ruky a klobouku
  const leg = (ph) => ({
    h: -0.42 * Math.sin(ph),
    k: 0.06 + 0.8 * Math.max(0, Math.cos(ph)) ** 2, // koleno se ohne, když noha jde dopředu
    t: 0.5 * Math.max(0, -Math.sin(ph + 0.35)) - 0.12 * Math.max(0, Math.sin(ph)), // odraz z palce, došlap na patu
  });
  const F = leg(p), B = leg(p + Math.PI);
  Object.assign(q, { hF: F.h, kF: F.k, tF: F.t, hB: B.h, kB: B.k, tB: B.t,
    lean: 0.06, neck: 0.03 * Math.sin(2 * p - d),
    sF: 0.32 * Math.sin(p), eF: -0.18 - 0.3 * Math.max(0, -Math.sin(p - d)), wF: -0.1 + 0.25 * Math.sin(p - 2 * d),
    sB: -0.32 * Math.sin(p), eB: -0.18 - 0.3 * Math.max(0, Math.sin(p - d)), wB: -0.1 - 0.25 * Math.sin(p - 2 * d),
    hat: 0.05 * Math.sin(2 * p - 2 * d), hatY: -3 * Math.max(0, Math.sin(2 * p - 2 * d)) });
}

// drobnosti, když panáček stojí: podrbe se pod kloboukem, nadzvedne krempu, otře si chodidlo o lýtko, kouká nahoru
const FIDGETS = [
  (q, u) => mix(q, { sF: -2.45, eF: -1.65 + 0.25 * Math.sin(u * 55), wF: 0.4, neck: 0.12, hat: 0.06 }, env(u, 1.8)),
  (q, u) => mix(q, { sF: -2.25, eF: -0.85, wF: -0.4, hat: -0.22, hatY: -4 }, env(u, 1.6)),
  (q, u) => mix(q, { hF: -0.1, kF: 1.5 + 0.18 * Math.sin(u * 40), tF: 0.8, sF: 0.15, sB: -0.15, lean: -0.02 }, env(u, 1.8)),
  (q, u) => mix(q, { neck: -0.25, hat: -0.1, lean: -0.04, sF: 0.12 }, env(u, 2, 0.4)),
];
const FIDGET_FROM = 3, FIDGET_EVERY = 5.5, FIDGET_DUR = 2;
function standPose(q, tm) {
  q.lean += 0.012 * Math.sin(tm * 2.1); // dýchá
  q.sF += 0.02 * Math.sin(tm * 2.1 + 1);
  if (tm < FIDGET_FROM) return;
  const n = Math.floor((tm - FIDGET_FROM) / FIDGET_EVERY), u = tm - FIDGET_FROM - n * FIDGET_EVERY;
  if (u < FIDGET_DUR) FIDGETS[Math.floor(K.hash(n * 7.7 + 3) * FIDGETS.length)](q, u);
}

const HOLD = { sF: -0.15, eF: -1.42, wF: 0.35, handF: 'pest' }; // drží věc před sebou (hrnek, karty)
const MOUTH = { sF: -0.5, eF: -2.35, wF: -0.2, handF: 'pest', armOverHat: false }; // fajfka pod krempou
const POINT = { sF: -1.3, eF: -0.12, wF: -0.15, handF: 'ruka' }; // ukazuje nataženou rukou před sebe k zemi
const WET = { lean: 0.22, neck: 0.15, hF: -0.3, kF: 0.35, hB: -0.25, kB: 0.3, sF: -1.5, eF: -1.65, wF: -0.5,
  sB: -1.4, eB: -1.75, wB: -0.5, hat: 0.1, hatY: 5, handF: 'ruka', handB: 'ruka' }; // schoulený, drží si krempu
const ST_CROUCH = { lean: 0.18, hF: -0.45, kF: 0.75, tF: 0, hB: -0.4, kB: 0.7, tB: 0, sF: 0.3, eF: -0.4, sB: 0.2, eB: -0.4 };
const ST_AIR = { lean: -0.1, lift: -40, hF: -1.0, kF: 1.6, tF: 0.5, hB: -0.8, kB: 1.5, tB: 0.5, sF: -2.75, eF: -0.25, wF: 0.35,
  sB: -2.45, eB: -0.35, wB: 0.35, handF: 'ruka', handB: 'ruka' };
const ST_AFTER = { lean: -0.05, lift: 0, hF: -0.15, kF: 0.25, tF: 0, hB: -0.1, kB: 0.2, tB: 0, sF: -1.3, eF: -0.9, wF: 0.3,
  sB: -1.1, eB: -0.9, wB: 0.3 };
// lek: přikrčí se, vyskočí s rukama nahoře, klobouk vyletí a dopadne nakřivo do očí
function startlePose(q, tm) {
  mix(q, ST_CROUCH, smooth(ramp(tm, 0, 0.08)));
  mix(q, ST_AIR, smooth(ramp(tm, 0.08, 0.2)));
  mix(q, ST_AFTER, smooth(ramp(tm, 0.42, 0.6)));
  const fly = Math.sin(Math.PI * ramp(tm, 0.1, 0.65));
  q.hatY = -120 * fly;
  q.hat = 0.28 * ramp(tm, 0.5, 0.65) + 0.9 * fly;
}
// krátké pohyby po skončení stavu: po leknutí si srovná klobouk, po namočení se otřepe jako pes
const CLIPS = {
  klobouk: { dur: 0.9, fn: (q, u) => mix(q, { sF: -1.6, eF: -1.5, wF: -0.4, sB: -1.5, eB: -1.6, wB: -0.4, handF: 'ruka', handB: 'ruka' }, env(u, 0.9, 0.25)) },
  otrepani: { dur: 0.8, fn: (q, u) => {
    const o = Math.sin(u * 38);
    mix(q, { lean: 0.12 * o, neck: -0.2 * o, hat: 0.3 * o, hatY: -6 * Math.abs(o), sF: 0.6 * o, eF: -0.5, sB: -0.6 * o, eB: -0.5,
      wF: 0.8 * o, wB: -0.8 * o }, env(u, 0.8, 0.15));
  } },
};

const heroMode = (o) => (o.face === 'startle' ? 'startle' : o.face === 'wet' ? 'wet' : o.wave ? 'wave' : o.reach ? 'reach' : o.walking ? 'walk' : 'stand');
const heroKey = (o) => [heroMode(o), o.arm || '', o.reach ? (o.reachA ?? 0.4).toFixed(3) : '', o.laugh ? 'L' : ''].join('|');
// cílová póza pro volby o; tm = jak dlouho stav trvá, t = čas (obojí po krocích LOUTKA_FPS)
function heroTarget(o, tm, t) {
  const q = { ...STAND }, mode = heroMode(o);
  if (mode === 'walk') {
    const step = (2 * Math.PI) / WALK_STEPS;
    walkPose(q, Math.floor((o.phase || 0) / step) * step);
  } else if (mode === 'stand') standPose(q, tm);
  else if (mode === 'reach') {
    Object.assign(q, { sF: -(Math.PI - (o.reachA ?? 0.4)), eF: -0.15, wF: -0.35, sB: -0.25, eB: -0.3, wB: -0.1,
      hF: 0, kF: 0, hB: 0.04, kB: 0.02, tF: 0.55, tB: 0.55, neck: -0.2, hat: -0.08, handF: 'pest' }); // na špičkách
  } else if (mode === 'wave') {
    Object.assign(q, { sF: -2.6, eF: -0.25 + 0.35 * Math.sin(t * 9), wF: -0.1 + 0.6 * Math.sin(t * 9 - 1.2), neck: -0.08 });
  } else if (mode === 'wet') {
    Object.assign(q, WET);
    q.lean += 0.025 * Math.sin(t * 47); // třese se
  } else if (mode === 'startle') startlePose(q, tm);
  if ((mode === 'walk' || mode === 'stand') && o.arm === 'hold') Object.assign(q, HOLD);
  if ((mode === 'walk' || mode === 'stand') && o.arm === 'mouth') Object.assign(q, MOUTH);
  if (mode === 'walk' || mode === 'stand') {
    if (o.laugh) { // chechtá se: zakloní se, trup a klobouk poskakují, druhou rukou se drží za břicho
      const b = Math.abs(Math.sin(t * 13));
      Object.assign(q, { lean: -0.1 + 0.05 * b, neck: -0.15 + 0.07 * b, hatY: -4 * b, hat: -0.06, sB: -0.25, eB: -1.7, wB: 0.3 });
    }
    if (o.arm === 'point') Object.assign(q, POINT);
  }
  return q;
}

// zobrazená póza: přechody, dobíhání, krátké pohyby a otočka; jeden hrdina na scénu
const HS = { key: null, t0: 0, last: -9, from: null, cur: null, clip: null, clipT: 0, facing: 0, flipFrom: 1, flipT: -9 };
function heroDisplay(o) {
  const key = heroKey(o);
  if (HS.cur && HS.last === K.time && HS.key === key) return HS.cur;
  const tq = Math.floor(K.time * LOUTKA_FPS) / LOUTKA_FPS;
  const gap = K.time - HS.last > 0.5 || K.time < HS.last; // dlouho se nekreslil (jiná scéna, test): bez přechodu
  if (key !== HS.key) {
    const was = HS.key && HS.key.split('|')[0], now = key.split('|')[0];
    HS.clip = gap ? null : was === 'startle' && now !== 'startle' ? 'klobouk' : was === 'wet' && now !== 'wet' ? 'otrepani' : null;
    HS.clipT = tq;
    HS.from = gap || !HS.cur ? null : HS.cur.base;
    HS.t0 = tq;
    HS.key = key;
  }
  HS.last = K.time;
  const q = heroTarget(o, tq - HS.t0, tq);
  if (HS.clip) {
    const u = tq - HS.clipT;
    if (u < CLIPS[HS.clip].dur) CLIPS[HS.clip].fn(q, u);
    else HS.clip = null;
  }
  if (HS.from) {
    const w = smooth(Math.min(1, (tq - HS.t0) / 0.33));
    for (const k of POSE_KEYS) q[k] = HS.from[k] + (q[k] - HS.from[k]) * w ** (LAG[k] || 1);
    if (w >= 1) HS.from = null;
  }
  const base = { ...q };
  const step = Math.floor(K.time * LOUTKA_FPS);
  POSE_KEYS.forEach((k, i) => { if (k !== 'lift' && k !== 'hatY') q[k] += (K.hash(step * 17.3 + i * 3.7) - 0.5) * JITTER; });
  const f = o.facing || 1;
  if (!HS.facing || gap) { HS.facing = f; HS.flipT = -9; }
  else if (f !== HS.facing) { HS.flipFrom = HS.facing; HS.facing = f; HS.flipT = tq; }
  const u = Math.min(1, (tq - HS.flipT) / 0.25);
  let sx = u >= 1 ? f : HS.flipFrom + (f - HS.flipFrom) * u; // otočka přes hranu kartonu
  if (Math.abs(sx) < 0.08) sx = 0.08 * f;
  HS.cur = { q, base, sx };
  return HS.cur;
}

let heroP = null;
function heroParts() {
  if (heroP) return heroP;
  const P = {};
  for (const [set, names] of [['hrdinaL2', L2_PARTS], ['hrdinaL3', L3_PARTS]]) {
    for (const n of names) {
      const sp = K.sprite(set, n);
      if (!sp) return null;
      P[n] = sp;
    }
  }
  heroP = P;
  return P;
}
// díly na místech pro pózu q (px dílů, počátek = pánev, y dolů; dy posadí nižší chodidlo na zem)
function heroRig(P, q) {
  const loc = (n, key) => { const f = LOUTKA[n.replace(/2$/, '')][key]; return [f[0] * P[n].sp.w, f[1] * P[n].sp.h]; };
  const map = (pl, p) => {
    const c = Math.cos(pl.rot), s = Math.sin(pl.rot), x = p[0] - pl.a[0], y = p[1] - pl.a[1];
    return [pl.at[0] + x * c - y * s, pl.at[1] + x * s + y * c];
  };
  const place = (n, at, rot, a) => ({ n, at, rot, a });
  // díl jako kost: horní kloub v at, osa a → b pod úhlem ang
  const bone = (n, at, ang) => {
    const a = loc(n, 'a'), b = loc(n, 'b');
    const pl = place(n, at, ang - Math.atan2(a[0] - b[0], b[1] - a[1]), a);
    pl.end = map(pl, b);
    return pl;
  };
  const torso = place('trup', [0, 0], q.lean, loc('trup', 'pelvis'));
  const head = place('hlava', map(torso, loc('trup', 'neck')), q.lean + q.neck, loc('hlava', 'neck'));
  const seat = map(head, loc('hlava', 'seat'));
  const hat = place('klobouk', [seat[0], seat[1] + q.hatY], q.lean + q.neck + q.hat, loc('klobouk', 'seat'));
  const arm = (X, suf) => {
    const A = q.lean + q['s' + X];
    const up = bone('paze' + suf, map(torso, loc('trup', 'sh' + X)), A);
    const fore = bone('predlokti' + suf, up.end, A + q['e' + X]);
    const hn = (q['hand' + X] || 'ruka') + suf, hand = bone(hn, fore.end, A + q['e' + X] + q['w' + X]);
    return { parts: [hand, fore, up], pins: [up.at, fore.at, hand.at], grip: map(hand, loc(hn, 'grip')) };
  };
  const leg = (X, suf) => {
    const A = q.lean + q['h' + X];
    const th = bone('stehno' + suf, map(torso, loc('trup', 'hip' + X)), A);
    const sh = bone('lytko' + suf, th.end, A + q['k' + X]);
    const ft = place('chodidlo' + suf, sh.end, q['t' + X], loc('chodidlo' + suf, 'a'));
    return { parts: [ft, sh, th], pins: [sh.at, ft.at], sole: [map(ft, loc('chodidlo' + suf, 'heel')), map(ft, loc('chodidlo' + suf, 'toe'))] };
  };
  const aF = arm('F', ''), aB = arm('B', '2'), lF = leg('F', ''), lB = leg('B', '2');
  const ground = Math.max(...[...lF.sole, ...lB.sole].map((p) => p[1]));
  const hw = P.klobouk.sp.w;
  const top = Math.min(...[[0, 0], [hw / 2, 0], [hw, 0]].map((p) => map(hat, p)[1]));
  const layers = [
    { parts: aB.parts, pins: aB.pins.slice(1) }, // vzdálená ruka (rameno schované za trupem)
    { parts: lB.parts, pins: lB.pins },
    { parts: lF.parts, pins: lF.pins }, // kyčle schová sako
    { parts: [torso, head] },
    ...(q.armOverHat === false ? [{ parts: aF.parts, pins: aF.pins }, { parts: [hat] }] : [{ parts: [hat] }, { parts: aF.parts, pins: aF.pins }]),
  ];
  return { layers, dy: q.lift - ground, hand: aF.grip, mouth: map(head, loc('hlava', 'mouth')), top, ground };
}
// výška loutky ve stoji (chodidla → vršek klobouku) v px dílů; měřítko 150·s jako dřív panáček z čar
let heroRef = 0;
function heroRefH(P) {
  if (!heroRef) { const g = heroRig(P, { ...STAND }); heroRef = g.ground - g.top; }
  return heroRef;
}
let pinCanvas = null;
function pinImg() {
  if (pinCanvas) return pinCanvas;
  pinCanvas = document.createElement('canvas');
  pinCanvas.width = pinCanvas.height = 32;
  const g = pinCanvas.getContext('2d'), gr = g.createRadialGradient(12, 11, 1, 16, 16, 15);
  gr.addColorStop(0, '#fff3c4');
  gr.addColorStop(0.25, '#d8b25a');
  gr.addColorStop(0.75, '#9a7428');
  gr.addColorStop(1, '#5a4214');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(16, 16, 15, 0, Math.PI * 2);
  g.fill();
  return pinCanvas;
}

// bod loutky ve světě (ruka, pusa): podle zobrazené pózy, když se ptá na právě kreslenou, jinak podle cílové
function heroPoint(x, y, s, o, which) {
  const P = heroParts();
  if (!P) return null;
  let q, sx;
  if (HS.cur && HS.key === heroKey(o)) ({ q, sx } = heroDisplay(o));
  else { q = heroTarget(o, heroMode(o) === 'stand' ? 0 : 5, K.time); sx = o.facing || 1; }
  const g = heroRig(P, q), k = (150 * s) / heroRefH(P), p = g[which];
  return { x: x + sx * k * p[0], y: y + k * (p[1] + g.dy) };
}
// přední ruka (kde drží věc) a pusa ve světě (pro pohrabáč, hrnek, fajfku); null, dokud se loutka nenačte.
// Předat stejné volby jako drawHero (walking, phase, arm, reach…), ať ruka sedí i v chůzi.
K.heroHand = (x, y, s, o = {}) => heroPoint(x, y, s, o, 'hand');
K.heroMouth = (x, y, s, o = {}) => heroPoint(x, y, s, o, 'mouth');
// posune zobrazenou pózu bez kreslení (ladicí scéna v testech, kde se kreslí jen poslední snímek)
K.heroTick = (o = {}) => { if (heroParts()) heroDisplay(o); };
// o.face: 'wet' (schoulí se a drží si klobouk; po skončení se otřepe) | 'startle' (lek: vyskočí, klobouk vyletí);
// o.arm: 'hold' | 'mouth' | 'point' (ukazuje před sebe); o.laugh (směje se); o.reach (+ o.reachA), o.wave; o.halo (výchozí ano): světlý obrys, ať je malý
// panáček vidět na fotce louky
function drawHeroPuppet(ctxIn, x, y, s, o) {
  const P = heroParts();
  if (!P) return false;
  const d = heroDisplay(o), g = heroRig(P, d.q), ref = heroRefH(P), k = (150 * s) / ref;
  const puppet = (c, px, py) => {
    c.save();
    c.translate(px, py);
    c.scale(d.sx * k, k);
    c.translate(0, g.dy);
    c.shadowColor = 'rgba(40, 28, 16, 0.35)'; // každý díl vrhá stín na díl pod sebou
    c.shadowBlur = Math.max(1, 3 * k);
    c.shadowOffsetX = Math.max(1, 2 * k);
    c.shadowOffsetY = Math.max(1, 2.5 * k);
    for (const L of g.layers) {
      for (const pl of L.parts) {
        c.save();
        c.translate(pl.at[0], pl.at[1]);
        c.rotate(pl.rot);
        c.drawImage(P[pl.n].img, -pl.a[0], -pl.a[1]);
        c.restore();
      }
      if (L.pins) for (const p of L.pins) c.drawImage(pinImg(), p[0] - PIN_R, p[1] - PIN_R, 2 * PIN_R, 2 * PIN_R);
    }
    c.restore();
  };
  if (o.halo === false) { puppet(ctxIn, x, y); return true; }
  // světlý obrys kolem celé postavy: nejdřív bokem do plátna, pak jednou se stínem (jinak by záře
  // každého dílu zamlžila díly pod ním)
  const out = ctxIn, R = Math.ceil(ref * k * 0.85) + 12; // loutka i s vyletěným kloboukem se vejde nad chodidla
  const hc = heroHaloCanvas(2 * R);
  const hg = hc.getContext('2d');
  hg.setTransform(1, 0, 0, 1, 0, 0);
  hg.clearRect(0, 0, hc.width, hc.height);
  puppet(hg, R, 1.6 * R);
  out.save();
  out.shadowColor = 'rgba(255, 252, 240, 0.9)';
  out.shadowBlur = Math.max(2, 5 * s);
  out.drawImage(hc, 0, 0, 2 * R, 2 * R, x - R, y - 1.6 * R, 2 * R, 2 * R);
  out.restore();
  return true;
}
let heroHalo = null;
function heroHaloCanvas(size) {
  if (!heroHalo) heroHalo = document.createElement('canvas');
  if (heroHalo.width < size || heroHalo.height < size) heroHalo.width = heroHalo.height = Math.max(size, heroHalo.width);
  return heroHalo;
}
// společné pro další loutky (děda v js/deda.js): kroky, chvění, přechody, nýtky
K.LOUTKA_UTIL = { FPS: LOUTKA_FPS, JITTER, PIN_R, pinImg, ramp, smooth, env, mix };
return drawHeroPuppet;
})();

K.drawHero = (ctx, x, y, s, o = {}) => {
  if ((o.alpha ?? 1) < 1) return K.withAlpha(ctx, o.alpha, (c) => K.drawHero(c, x, y, s, { ...o, alpha: 1 }));
  if (drawHeroPuppet(ctx, x, y, s, o)) return;
  const f = o.facing || 1;
  const sw = o.walking ? Math.sin(o.phase || 0) : 0;
  const bob = o.walking ? Math.abs(Math.cos(o.phase || 0)) * 3 * s : 0;
  ctx.save();
  twoPass(ctx, o.halo !== false, (pass) => {
    const lw = (pass ? 4.5 : 9) * Math.max(s, 0.35);
    const hy = y - 52 * s - bob, ny = y - 92 * s - bob;
    stroke(ctx, [[x, hy], [x + sw * 20 * s, y]], lw, 1);
    stroke(ctx, [[x, hy], [x - sw * 20 * s, y]], lw, 2);
    stroke(ctx, [[x, ny], [x, hy]], lw, 3);
    const armUp = o.wave ? -40 * s + Math.sin(K.time * 10) * 8 * s : 0;
    // o.reach: přední ruka zdvižená nad hlavu (kuchyně: pohrabáčem k oknu)
    const hand = o.reach ? [x + f * 8 * s, ny - 30 * s] : [x + f * (16 + sw * 10) * s, ny + 34 * s + armUp];
    stroke(ctx, [[x, ny + 6 * s], hand], lw, 4);
    stroke(ctx, [[x, ny + 6 * s], [x - f * (16 + sw * 10) * s, ny + 34 * s]], lw, 5);
    // hlava
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(x + jit(6, 1), ny - 16 * s, 14 * s, 0, Math.PI * 2);
    if (pass) { ctx.fillStyle = WOOL; ctx.fill(); }
    ctx.stroke();
    // špičatá čepička – poznávací znamení hrdiny
    ctx.beginPath();
    ctx.moveTo(x - 14 * s, ny - 22 * s);
    ctx.lineTo(x + f * 14 * s + jit(7, 2), ny - 58 * s);
    ctx.lineTo(x + 14 * s, ny - 22 * s);
    ctx.closePath();
    if (pass) { ctx.fillStyle = '#b5432f'; ctx.fill(); }
    ctx.stroke();
  });
  ctx.restore();
};

// ---------- chalupník ----------
// o.hat: baret | cepice | drdol | klobouk | kuchar; o.sit; o.sleep; o.arm: up | write | hold; o.shiver
K.drawPerson = (ctx, x, y, s, o = {}) => {
  const f = o.facing || 1;
  const shake = o.shiver ? Math.sin(K.time * 40) * 2 * s : 0;
  x += shake;
  twoPass(ctx, false, () => {
    const lw = 4.5 * s;
    const hy = o.sit ? y - 30 * s : y - 52 * s;
    const ny = hy - 40 * s;
    if (o.sit) {
      stroke(ctx, [[x, hy], [x + f * 26 * s, hy], [x + f * 26 * s, y]], lw, 11);
      stroke(ctx, [[x, hy], [x + f * 20 * s, hy + 4 * s], [x + f * 18 * s, y]], lw, 12);
    } else {
      stroke(ctx, [[x, hy], [x + 14 * s, y]], lw, 11);
      stroke(ctx, [[x, hy], [x - 14 * s, y]], lw, 12);
    }
    const lean = o.sleep ? f * 22 * s : 0;
    const headY = ny - 16 * s + (o.sleep ? 18 * s : 0);
    stroke(ctx, [[x, hy], [x + lean, ny + (o.sleep ? 14 * s : 0)]], lw, 13);
    const sh = [x + lean * 0.8, ny + 6 * s + (o.sleep ? 12 * s : 0)];
    let hand1;
    if (o.arm === 'up') hand1 = [sh[0] + f * 18 * s, sh[1] - 40 * s + Math.sin(K.time * 9) * 6 * s];
    else if (o.arm === 'write') hand1 = [sh[0] + f * 36 * s + Math.sin(K.time * 14) * 5 * s, sh[1] + 22 * s];
    else if (o.arm === 'hold') hand1 = [sh[0] + f * 38 * s, sh[1] + 8 * s];
    else if (o.sleep) hand1 = [sh[0] + f * 36 * s, sh[1] + 14 * s];
    else hand1 = [sh[0] + f * 12 * s, sh[1] + 36 * s];
    stroke(ctx, [sh, hand1], lw, 14);
    stroke(ctx, [sh, [sh[0] - f * 12 * s, sh[1] + 36 * s]], lw, 15);
    o.hand = { x: hand1[0], y: hand1[1] };
    const hx = x + lean * 1.4;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(hx, headY, 14 * s, 0, Math.PI * 2);
    ctx.fillStyle = WOOL;
    ctx.fill();
    ctx.stroke();
    drawHat(ctx, o.hat, hx, headY, s, f);
    if (o.sleep) {
      ctx.font = `${22 * s}px Georgia, serif`;
      ctx.fillStyle = INK;
      const z = (K.time * 0.7) % 1;
      ctx.globalAlpha = 1 - z;
      ctx.fillText('z', hx + 18 * s, headY - 20 * s - z * 30 * s);
      ctx.globalAlpha = 1;
    }
  });
};

function drawHat(ctx, hat, x, y, s, f) {
  ctx.save();
  ctx.fillStyle = INK;
  ctx.beginPath();
  if (hat === 'baret') {
    ctx.ellipse(x - f * 3 * s, y - 12 * s, 17 * s, 6 * s, -0.2 * f, 0, Math.PI * 2);
    ctx.fill();
  } else if (hat === 'cepice') {
    ctx.arc(x, y - 4 * s, 15 * s, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y - 22 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
  } else if (hat === 'drdol') {
    ctx.arc(x - f * 4 * s, y - 16 * s, 8 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2 * s;
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.arc(x + f * 5 * s, y, 4 * s, 0, Math.PI * 2);
    ctx.arc(x + f * 13 * s, y, 4 * s, Math.PI, Math.PI * 3);
    ctx.stroke();
  } else if (hat === 'klobouk') {
    ctx.ellipse(x, y - 11 * s, 24 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 11 * s, y - 26 * s, 22 * s, 15 * s);
  } else if (hat === 'kuchar') {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5 * s;
    ctx.rect(x - 11 * s, y - 28 * s, 22 * s, 16 * s);
    ctx.arc(x - 6 * s, y - 30 * s, 8 * s, 0, Math.PI * 2);
    ctx.arc(x + 6 * s, y - 30 * s, 8 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- postavy z obrázků (js/sprity.js, python tools/sprity.py) ----------
if (K.SPRITY) for (const set of Object.values(K.SPRITY)) for (const sp of Object.values(set)) K.img(sp.src);
// { sp, img } načtené pózy, nebo null (pak se kreslí čarou)
K.sprite = (set, pose) => {
  const sp = K.SPRITY && K.SPRITY[set] && K.SPRITY[set][pose];
  if (!sp) return null;
  const img = K.img(sp.src);
  return K.ready(img) ? { sp, img } : null;
};

// ---------- ovce ----------
// Ovce jsou loutka z Danielových dílů (2026-11-13, opravené OV2: tělo z kotrče kadeřavého, hlavy tuší;
// python tools/sprity.py → K.SPRITY.ovceDily). Nohy kreslí hra tuší, ať se při chůzi střídají
// a dají se na ně nasadit lyže. Hlava se při pasení skloní (otáčí se kolem krku), při bečení zvedne.
// Rozměry při s = 1 (stejná velikost jako dřív kreslená ovce):
K.SHEEP = { bodyW: 60, legs: 15, neckX: 0.36, neckY: -0.12, ramK: 1.15 }; // ramK: beran je větší
// beran a jehně: s už obsahuje jejich velikost (o.ram × ramK, jehně LAMB_SIZE v louka.js);
// tělo jehněte je na obrázku menší, proto vlastní šířka
const LAMB_BODY_W = 50;
K.sheepParts = (o) => ({
  body: K.sprite('ovceDily', o.lamb ? 'teloJehne' : 'telo'),
  // bečí: ovce otevře pusu, jehně má druhou hlavu (hlavaJehne2) se zvednutou bradou
  head: K.sprite('ovceDily', o.ram ? 'hlavaBeran' : o.lamb ? (o.bleat ? 'hlavaJehne2' : 'hlavaJehne') : o.bleat ? 'beci' : 'hlava'),
});
// kde je krk a jak velký je obrázek (pro beranův čumák v lese, šálu)
K.sheepNeck = (s, o) => {
  const S = K.SHEEP, bw = (o.lamb ? LAMB_BODY_W : S.bodyW) * s, body = K.SPRITY.ovceDily[o.lamb ? 'teloJehne' : 'telo'];
  const k = bw / body.w, bh = body.h * k, cy = -S.legs * s + 4 * s - bh / 2;
  return { x: S.neckX * bw, y: cy + S.neckY * bh, k, cy, bw, bh };
};
function drawSheepSprite(ctx, x, y, s, o) {
  const { body, head } = K.sheepParts(o);
  if (!body || !head) return false;
  const f = o.facing || 1, S = K.SHEEP;
  const n = K.sheepNeck(s, o), k = n.k;
  const ph = o.phase || 0, walk = o.walking && !o.skis;
  const bob = walk ? Math.abs(Math.sin(ph)) * 1.5 * s : 0;
  ctx.save();
  ctx.translate(x, y - 26 * s); // otáčí se kolem středu těla jako dřív (kotrmelec, náklon na vleku)
  if (o.rot) ctx.rotate(o.rot);
  ctx.translate(0, 26 * s);
  ctx.scale(f, 1);
  // nohy: tuš se světlou vlnou uvnitř a tmavým kopýtkem; zadní pár tmavší
  const legW = Math.max(0.6, 4.4 * s), top = n.cy + n.bh * 0.2;
  [[-0.3, 1, 0], [0.16, 1, 1], [-0.17, 0, 1], [0.29, 0, 0]].forEach(([lx, back, alt]) => {
    const sw = walk ? Math.sin(ph + (alt ? Math.PI : 0)) * 5 * s : 0;
    const x0 = lx * n.bw, x1 = x0 + sw;
    const leg = (w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, top - bob); ctx.lineTo(x1, -bob * 0.3); ctx.stroke(); };
    ctx.lineCap = 'round';
    leg(legW, INK);
    leg(legW * 0.5, back ? '#cfc6b4' : '#efe8da');
    ctx.fillStyle = '#2f2721';
    ctx.beginPath(); ctx.ellipse(x1, -bob * 0.3 - 1.2 * s, legW * 0.45, 2 * s, 0, 0, Math.PI * 2); ctx.fill();
  });
  // tělo
  ctx.drawImage(body.img, -n.bw / 2, n.cy - n.bh / 2 - bob, n.bw, n.bh);
  // hlava: kotva = spodek krku, posazený na přední horní kraj těla
  let rot = 0, dy = 0;
  if (!o.headUp && !o.walking && !o.skis && !o.bleat) { rot = 1.15 + Math.sin(K.time * 1.6 + x * 0.05) * 0.05; dy = 4 * s; } // pase se
  if (o.bleat) rot = -0.25;
  ctx.save();
  ctx.translate(n.x, n.y + dy - bob);
  ctx.rotate(rot);
  ctx.scale(k, k);
  ctx.drawImage(head.img, -head.sp.ax, -head.sp.ay);
  ctx.restore();
  if (o.scarf) {
    ctx.strokeStyle = o.scarf;
    stroke(ctx, [[n.x - 3 * s, n.y - 8 * s], [n.x + 5 * s, n.y + 2 * s], [n.x - 1 * s, n.y + 11 * s]], 5 * s, 60, 0.6);
  }
  if (o.skis) {
    ctx.strokeStyle = INK;
    const tip = o.ram ? [[40, 15], [39, 10], [35, 9], [33, 12], [36, 14]] : [];
    stroke(ctx, [[-30, 1], [26, 1], [36, -5], ...tip.map(([a, b]) => [a, b - 26])].map(([a, b]) => [a * s, b * s]), 3.2 * Math.max(s, 0.35), 30, 0.6);
  }
  ctx.restore();
  return true;
}

// o.skis, o.rot (náklon/kotrmelec), o.headUp, o.scarf (barva šály), o.hang (visí na kotvě),
// o.ram = starý beran z lesa: větší, rohy do spirály a lyže se špičkou stočenou jako rohy, o.lamb = jehně
// Bez načteného obrázku se kreslí čarou (dole).
K.drawSheep = (ctx, x, y, s, o = {}) => {
  if ((o.alpha ?? 1) < 1) return K.withAlpha(ctx, o.alpha, (c) => K.drawSheep(c, x, y, s, { ...o, alpha: 1 }));
  const f = o.facing || 1;
  if (o.ram) s *= K.SHEEP.ramK;
  if (drawSheepSprite(ctx, x, y, s, o)) return;
  const step = o.walking ? Math.sin(o.phase || 0) * 6 * s : 0;
  ctx.save();
  ctx.translate(x, y - 26 * s);
  if (o.rot) ctx.rotate(o.rot);
  twoPass(ctx, o.halo !== false, (pass) => {
    const lw = (pass ? 3.2 : 7) * Math.max(s, 0.35);
    // nohy
    const legs = o.skis ? [-14, -4, 6, 16].map((d) => [d * s, (d * s) * 0.15]) : [[-20 * s, step], [-10 * s, -step], [12 * s, step], [22 * s, -step]];
    legs.forEach(([lx, sx], i) => stroke(ctx, [[lx, 10 * s], [lx + sx, 26 * s]], lw, 20 + i, 0.8));
    // lyže
    if (o.skis) {
      const tip = o.ram ? [[48, 15], [47, 10], [43, 9], [41, 12], [44, 14]] : [];
      stroke(ctx, [[-40, 27], [34, 27], [44, 21], ...tip].map(([a, b]) => [a * s * f, b * s]), lw, 30, 0.6);
    }
    // tělo z chomáčků vlny
    ctx.lineWidth = lw;
    const puffs = [[-22, -2, 13], [-8, -10, 15], [10, -10, 15], [24, -2, 13], [12, 6, 14], [-10, 6, 14]];
    ctx.beginPath();
    puffs.forEach(([px, py, r], i) => {
      ctx.moveTo(px * s + r * s, py * s);
      ctx.arc(px * s + jit(40 + i, 0.8), py * s + jit(50 + i, 0.8), r * s, 0, Math.PI * 2);
    });
    ctx.stroke();
    if (pass) {
      ctx.fillStyle = WOOL;
      ctx.fill();
    }
    // hlava
    const hx = f * 34 * s, hy = (o.headUp ? -16 : 4) * s;
    ctx.beginPath();
    ctx.ellipse(hx, hy, 9 * s, 12 * s, f * (o.headUp ? 0.3 : 0.9), 0, Math.PI * 2);
    if (pass) { ctx.fillStyle = '#2a2420'; ctx.fill(); }
    ctx.stroke();
    if (pass) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(hx + f * 3 * s, hy - 3 * s, 2 * s, 0, Math.PI * 2);
      ctx.fill();
      if (o.ram) {
        // rohy jako kámen, točí se od temene dozadu a dolů kolem ucha
        ctx.save();
        ctx.strokeStyle = '#9a958b';
        ctx.lineWidth = 3.4 * s;
        ctx.beginPath();
        for (let k = 0; k <= 16; k++) {
          const a = -Math.PI / 2 - k * 0.36, r = 10 * s * (1 - k / 22);
          const px = hx - f * 4 * s + Math.cos(a) * r * f, py = hy + Math.sin(a) * r;
          k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
      }
      if (o.scarf) {
        ctx.strokeStyle = o.scarf;
        ctx.lineWidth = 5 * s;
        stroke(ctx, [[f * 20 * s, -6 * s], [f * 26 * s, 6 * s], [f * 18 * s, 16 * s]], 5 * s, 60, 0.6);
        ctx.strokeStyle = INK;
      }
    }
  });
  ctx.restore();
};

// ---------- zvířata do detailů ----------
K.drawDeer = (ctx, x, y, s, o = {}) => {
  const f = o.facing || 1;
  twoPass(ctx, false, () => {
    const lw = 4 * s;
    ctx.fillStyle = '#a86e3f';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(x, y - 50 * s, 34 * s, 15 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    [-24, -14, 16, 26].forEach((lx, i) => stroke(ctx, [[x + lx * s, y - 38 * s], [x + lx * s, y]], lw, 80 + i));
    stroke(ctx, [[x + f * 28 * s, y - 58 * s], [x + f * 40 * s, y - 88 * s]], 7 * s, 85);
    ctx.beginPath();
    ctx.ellipse(x + f * 48 * s, y - 92 * s, 13 * s, 8 * s, f * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    stroke(ctx, [[x + f * 40 * s, y - 100 * s], [x + f * 34 * s, y - 124 * s], [x + f * 24 * s, y - 132 * s]], 3 * s, 86);
    stroke(ctx, [[x + f * 34 * s, y - 118 * s], [x + f * 46 * s, y - 130 * s]], 3 * s, 87);
  });
};

// letící pták = mávající „V“
K.drawBird = (ctx, x, y, s) => {
  twoPass(ctx, false, () => {
    const w = Math.sin(K.time * 18) * 10 * s;
    stroke(ctx, [[x - 18 * s, y - w], [x, y], [x + 18 * s, y - w]], 4 * s, 90);
  });
};

// tetřívek obecný (kohout): černomodrý, červená růže nad okem, bílá skvrna na rameni a pruh na křídle,
// lyrovitý ocas s konci stočenými ven. Sedící: x, y = kde stojí, o.facing, o.display 0–1 = toká
// (bílý vějíř pod ocasem vztyčený, černá pera po stranách, hlava dopředu). o.flying = letí
// (o.flap 0–1 = jak moc právě mává, 0 = klouže), o.facing = směr letu.
const GROUSE_BLACK = '#161b26', GROUSE_WING = '#252b38', GROUSE_BLUE = 'rgba(52, 86, 160, 0.6)';
const GROUSE_RED = '#e8361f', GROUSE_WHITE = '#f4f1ea';
K.drawGrouse = (ctx, x, y, s, o = {}) => {
  const f = o.facing || 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(f * s, s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const ell = (cx, cy, rx, ry, rot, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
    ctx.fill();
  };
  const line = (pts, w, col) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.stroke();
  };
  // ocas v klidu: klín dozadu, krajní pera se na konci stáčejí ven (nahoru a dolů)
  const tail = (rx, ry) => {
    ctx.fillStyle = GROUSE_BLACK;
    ctx.beginPath();
    ctx.moveTo(rx, ry - 2.5); ctx.lineTo(rx - 9, ry - 1); ctx.lineTo(rx - 9, ry + 2); ctx.lineTo(rx, ry + 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = GROUSE_BLACK;
    ctx.lineWidth = 1.3;
    for (const k of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(rx - 8, ry + k * 0.8);
      ctx.quadraticCurveTo(rx - 12, ry + k * 1.2, rx - 12.5, ry + k * 3.5);
      ctx.stroke();
    }
  };
  // hlava s růží a zobákem
  const head = (hx, hy, rose) => {
    ell(hx, hy, 4, 3.6, 0, GROUSE_BLACK);
    ctx.fillStyle = '#3a3f47';
    ctx.beginPath(); ctx.moveTo(hx + 3.2, hy - 0.6); ctx.lineTo(hx + 6, hy + 0.7); ctx.lineTo(hx + 3.2, hy + 1.8); ctx.closePath(); ctx.fill();
    ell(hx + 0.8, hy - 2.4, 2.2 * rose, 1.1 * rose, 0, GROUSE_RED);
  };
  if (o.flying) {
    const ph = Math.sin(K.time * 32), flap = o.flap ?? 1;
    const ys = K.lerp(-0.4, ph, flap); // výška křídla: 1 = nahoře, −1 = dole; klouže s křídly mírně dolů
    const wing = (sc, col) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(-4, 0); ctx.lineTo(6, 0); ctx.lineTo(1, -17 * ys * sc); ctx.lineTo(-9, -14 * ys * sc);
      ctx.closePath();
      ctx.fill();
    };
    wing(0.8, GROUSE_WING); // vzdálené křídlo za tělem
    tail(-11, 0);
    ell(0, 0, 12, 4.8, 0, GROUSE_BLACK);
    head(12, -1.5, 1);
    wing(1, GROUSE_BLACK);
    line([[1.5, -2 * ys], [-3.5, -9 * ys]], 1.6, GROUSE_WHITE); // bílý pruh na křídle
    ctx.restore();
    return;
  }
  const d = o.display || 0;
  if (d > 0.05) {
    // tokání: černá pera roztažená do vějíře, uprostřed vztyčený bílý chomáč, krajní pera visí ven
    ell(-11, -17 - 4 * d, 5 + 2 * d, 4 + 7 * d, -0.35, GROUSE_BLACK);
    ell(-11, -17 - 4 * d, 3.5 + 2 * d, 3 + 5.5 * d, -0.35, GROUSE_WHITE);
    for (const k of [0, 1]) {
      ctx.strokeStyle = GROUSE_BLACK;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-12, -14);
      ctx.quadraticCurveTo(-19 - 2 * k, -16 - 4 * d, -18 - 3 * k, -8 + 2 * k);
      ctx.stroke();
    }
  } else tail(-11, -11);
  line([[-2, -5], [-2, 0]], 2, '#59606b'); // opeřené nohy
  line([[3, -5], [3, 0]], 2, '#59606b');
  ell(0, -10, 12.5, 7.5, -0.12 + 0.12 * d, GROUSE_BLACK); // tělo
  ell(-2, -10, 8.5, 4.2, -0.1, GROUSE_WING); // křídlo
  line([[-7.5, -7.3], [2.5, -6.8]], 1.4, GROUSE_WHITE); // bílý pruh
  ell(7, -13.5, 1.2, 1.2, 0, GROUSE_WHITE); // skvrna na rameni
  // krk a hlava; při tokání nafouknutý krk, hlava dopředu a níž
  const hx = 11 + 3 * d, hy = -21 + 5 * d;
  ctx.fillStyle = GROUSE_BLACK;
  ctx.beginPath(); ctx.moveTo(4, -16); ctx.lineTo(hx - 3.5, hy); ctx.lineTo(hx + 2, hy + 2.5); ctx.lineTo(11, -10); ctx.closePath(); ctx.fill();
  ell(8, -15 + 2 * d, 3.2 + d, 3 + d, 0.4, GROUSE_BLUE); // modrý lesk na hrudi
  head(hx, hy, 1 + 0.5 * d);
  ctx.restore();
};

// kouř z komína: obláčky stoupají, vítr je stáčí doprava, rostou a blednou; size ~ velikost chalupy
K.drawSmoke = (ctx, x, y, size, seed = 0) => {
  const N = 7, k = size / 36;
  ctx.save();
  for (let i = 0; i < N; i++) {
    const u = (K.time * 0.16 + i / N + K.hash(seed) * 0.5) % 1;
    const wob = Math.sin(K.time * 0.9 + i * 2.3 + seed) * 3 * k * u;
    const px = x + (u * u * 34 + wob) * k, py = y - u * 62 * k;
    ctx.globalAlpha = 0.55 * (1 - u) * Math.min(1, u * 6);
    ctx.fillStyle = '#ecebe6';
    ctx.beginPath();
    ctx.arc(px, py, (2 + u * 9) * k, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

// ---------- bublina s obrázkem (hra je beze slov) ----------
K.drawBubble = (ctx, x, y, s, icon) => {
  ctx.save();
  const r = 46 * s;
  const by = y - r - 26 * s;
  ctx.fillStyle = 'rgba(255, 252, 244, 0.96)';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.arc(x, by, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 10 * s, by + r - 3 * s);
  ctx.lineTo(x - 4 * s, y);
  ctx.lineTo(x + 10 * s, by + r - 3 * s);
  ctx.fill();
  ctx.stroke();
  K.drawIcon(ctx, icon, x, by, r * 1.3, INK);
  ctx.restore();
};

// ---------- bublina-mrak: ovce bečí, že chce sníh (Daniel 2026-11-23, náčrtek pics/ovce - řeč.jpg) ----------
// Bublina je sama sněhový mrak: zubatý obrys s ocáskem k puse ovce (x, y), mrak je šikmo nahoře před ní
// (facing), z jeho spodku padají vločky. t = čas od zabečení (s), dur = jak dlouho bublina visí.
const SNOW_BLUE = '#3a7fd0'; // vločky pod mrakem
const CLOUD_BUMPS = [1.0, 0.82, 1.08, 0.9, 1.12, 0.86, 1.0, 0.92, 1.1, 0.84, 1.04]; // nepravidelné hrboly jako od ruky
K.drawSnowCloud = (ctx, x, y, s, facing, t, dur) => {
  const pop = K.clamp(t / 0.28), grow = pop < 1 ? 1 + 0.12 * Math.sin(pop * Math.PI) : 1; // nafoukne se
  const alpha = K.clamp((dur - t) / 0.35); // na konci zmizí
  if (alpha <= 0 || pop <= 0) return;
  const rx = 66 * s * pop * grow, ry = 38 * s * pop * grow;
  // u kraje obrazovky se mrak přesune na druhou stranu hlavy (ocásek vede pořád k puse)
  const fits = (f) => { const c = x + f * 92 * s, half = 66 * s * 1.45; return c - half > 8 && c + half < K.W - 8; };
  const side = fits(facing) ? facing : -facing;
  const cx = x + side * 92 * s, cy = y - 78 * s;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // padající sníh (pod mrakem, kreslí se první, ať vločky vyjíždějí zpoza něj)
  const fallStart = K.clamp((t - 0.3) / 0.4);
  if (fallStart > 0) {
    const M = 7, fall = 100 * s;
    for (let i = 0; i < M; i++) {
      const p = (t * 0.55 + i * 0.37) % 1; // každá vločka jinde na své dráze
      const fx = cx + (i / (M - 1) - 0.5) * rx * 1.5 + Math.sin(t * 2.2 + i * 1.7) * 6 * s;
      const fy = cy + ry * 0.55 + p * fall;
      const r = (6.8 + (i % 3) * 1.5) * s;
      ctx.globalAlpha = alpha * fallStart * Math.sin(p * Math.PI);
      // vločka: modrá s bílým lemem, ať je vidět i na tmavé trávě (Daniel 2026-11-23)
      for (const [col, lw] of [['rgba(255, 255, 255, 0.95)', 6 * s], [SNOW_BLUE, 2.8 * s]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = Math.max(1.4, lw);
        for (let a = 0; a < 3; a++) {
          const ang = a * Math.PI / 3 + t * 0.8 + i;
          ctx.beginPath();
          ctx.moveTo(fx - Math.cos(ang) * r, fy - Math.sin(ang) * r);
          ctx.lineTo(fx + Math.cos(ang) * r, fy + Math.sin(ang) * r);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = alpha;
  }
  // mrak: hrboly po obvodu elipsy (oblouky mezi body, vyboulené ven), lehce se vlní
  ctx.fillStyle = 'rgba(255, 252, 244, 0.96)';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3 * s;
  const N = CLOUD_BUMPS.length;
  const pt = (k) => {
    const a = (k / N) * Math.PI * 2;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  };
  ctx.beginPath();
  ctx.moveTo(...pt(0));
  for (let k = 0; k < N; k++) {
    const am = ((k + 0.5) / N) * Math.PI * 2;
    const bump = CLOUD_BUMPS[k] * (1 + 0.04 * Math.sin(K.time * 2 + k));
    const out = 1 + 0.42 * bump;
    const [ex, ey] = pt(k + 1);
    ctx.quadraticCurveTo(cx + Math.cos(am) * rx * out, cy + Math.sin(am) * ry * out, ex, ey);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // ocásek k puse ovce: dvě čáry od spodku mraku, výplň překryje obrys mezi nimi (jako u K.drawBubble)
  const bx = cx - side * rx * 0.55, by = cy + ry * 0.75;
  const w = 9 * s;
  ctx.beginPath();
  ctx.moveTo(bx - w, by - 6 * s);
  ctx.lineTo(x, y);
  ctx.lineTo(bx + w, by - 6 * s);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bx - w, by - 2 * s);
  ctx.lineTo(x, y);
  ctx.lineTo(bx + w, by - 2 * s);
  ctx.stroke();
  ctx.restore();
};

// ---------- ikony ----------
// ikony z obrázků (batoh je fotka z tools/batoh.py, nástroje); dokud se nenačtou, kreslí se čarou
const ICON_IMG = {
  batoh: { src: 'assets/predmety/batoh.png', h: 0.9 },
  fajfka: { src: 'assets/predmety/fajfka.png', h: 1.5 },
  hrnecek: { src: 'assets/sceny/kuchyne-hrnek.png', h: 0.7 },
};
for (const v of Object.values(ICON_IMG)) K.img(v.src);
K.drawIcon = (ctx, name, x, y, size, color = INK) => {
  const u = size / 24;
  ctx.save();
  ctx.translate(x, y);
  const ii = ICON_IMG[name], iconImg = ii && K.img(ii.src);
  if (iconImg && K.ready(iconImg)) {
    const h = size * ii.h, w = (h * iconImg.width) / iconImg.height;
    ctx.drawImage(iconImg, -w / 2, -h / 2, w, h);
    ctx.restore();
    return;
  }
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, 2 * u);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const L = (pts) => { ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a * u, b * u) : ctx.moveTo(a * u, b * u))); ctx.stroke(); };
  const C = (cx, cy, r, fill) => { ctx.beginPath(); ctx.arc(cx * u, cy * u, r * u, 0, Math.PI * 2); fill ? ctx.fill() : ctx.stroke(); };
  switch (name) {
    case 'batoh':
      // batůžek: tělo, víko s přezkou, kapsa a ucho
      ctx.beginPath(); ctx.roundRect(-8 * u, -6 * u, 16 * u, 17 * u, 4 * u); ctx.stroke();
      L([[-8, -1], [-3, 3], [3, 3], [8, -1]]); L([[0, 3], [0, 5]]);
      ctx.strokeRect(-4.5 * u, 6 * u, 9 * u, 3 * u);
      ctx.beginPath(); ctx.arc(0, -6 * u, 3.5 * u, Math.PI, 0); ctx.stroke();
      break;
    case 'lyze':
      L([[-9, 9], [8, -8], [10, -10]]); L([[9, 9], [-8, -8], [-10, -10]]);
      break;
    case 'kolo':
      C(0, 0, 9); C(0, 0, 2, true);
      for (let a = 0; a < 6; a++) L([[0, 0], [Math.cos(a) * 9, Math.sin(a) * 9]]);
      break;
    case 'voda':
      // kapka ze studánky
      ctx.beginPath();
      ctx.moveTo(0, -10 * u);
      ctx.bezierCurveTo(4 * u, -4 * u, 8 * u, 0, 8 * u, 3 * u);
      ctx.arc(0, 3 * u, 8 * u, 0, Math.PI);
      ctx.bezierCurveTo(-8 * u, 0, -4 * u, -4 * u, 0, -10 * u);
      ctx.stroke();
      L([[-4, 3], [-3, 6]]);
      break;
    case 'semena':
      // tři semínka sněžné květiny
      [[-5, -2, 0.5], [4, -4, -0.4], [0, 6, 0.2]].forEach(([sx, sy, r]) => {
        ctx.beginPath(); ctx.ellipse(sx * u, sy * u, 3.2 * u, 5 * u, r, 0, Math.PI * 2); ctx.stroke();
      });
      break;
    case 'rampouch':
      // rampouch se zlomeným horním koncem a jiskrou
      L([[-5, -10], [-2, -8], [1, -10], [5, -9], [1, 11], [-5, -10]]);
      L([[-1, -5], [0, 4]]);
      L([[7, -4], [7, 0]]); L([[5, -2], [9, -2]]);
      break;
    case 'kvetina':
      // klas zvonků sněžné květiny
      L([[0, 11], [0, -11]]);
      [[-8], [-2], [4]].forEach(([yy], i) => {
        const sx = i % 2 ? 1 : -1;
        ctx.beginPath(); ctx.moveTo(0, yy * u); ctx.quadraticCurveTo(sx * 6 * u, (yy - 1) * u, sx * 6 * u, (yy + 4) * u);
        ctx.lineTo(sx * 2 * u, (yy + 4) * u); ctx.closePath(); ctx.stroke();
      });
      L([[0, 9], [-6, 6]]); L([[0, 9], [6, 6]]);
      break;
    case 'caj':
      L([[-7, -2], [-6, 8], [5, 8], [6, -2], [-7, -2]]); L([[6, 0], [9, 1], [9, 4], [5, 5]]);
      L([[-2, -5], [-3, -8], [-1, -11]]); L([[2, -5], [1, -8], [3, -11]]);
      break;
    case 'snih':
      for (let a = 0; a < 3; a++) {
        const c = Math.cos(a * Math.PI / 3) * 10, s = Math.sin(a * Math.PI / 3) * 10;
        L([[-c, -s], [c, s]]);
      }
      break;
    case 'beran': {
      // hlava berana z profilu (čumák vlevo dole) s velkým stočeným rohem a otazníkem: „kde je beran?“
      ctx.beginPath(); ctx.ellipse(-3 * u, 3 * u, 5.5 * u, 8 * u, 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(5 * u, 0, 3.6 * u, 1.8 * u, 0.4, 0, Math.PI * 2); ctx.fill();
      const horn = () => {
        ctx.beginPath();
        for (let k = 0; k <= 26; k++) {
          const a = -Math.PI * 0.7 + k * 0.32, r = 7.5 * u * (1 - k / 34);
          const px = 2 * u + Math.cos(a) * r, py = -2 * u + Math.sin(a) * r;
          k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
      };
      ctx.lineWidth = 3.6 * u; horn();
      ctx.strokeStyle = '#fffcf4'; ctx.lineWidth = 1.6 * u; horn();
      ctx.fillStyle = '#fffcf4'; C(-4.5, 1.5, 1.1, true);
      ctx.fillStyle = color;
      ctx.font = `700 ${9 * u}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText('?', 10 * u, -6 * u);
      break;
    }
    case 'zpet':
      L([[8, 0], [-8, 0]]); L([[-2, -6], [-8, 0], [-2, 6]]);
      break;
    case 'hrnek':
      // hrnek s jedním ouškem a nad ním semínka (kuchyně na Kantorské)
      L([[-7, -1], [-6, 10], [5, 10], [6, -1], [-7, -1]]);
      ctx.beginPath(); ctx.arc(7 * u, 4 * u, 3.4 * u, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
      [[-3, -6, 0.5], [2, -8, -0.4], [4, -4, 0.2]].forEach(([sx, sy, r]) => {
        ctx.beginPath(); ctx.ellipse(sx * u, sy * u, 1.6 * u, 2.5 * u, r, 0, Math.PI * 2); ctx.fill();
      });
      break;
    case 'hrnecek':
      // prázdný hrnek (nástroj: nabere se do něj voda)
      L([[-7, -5], [-6, 8], [5, 8], [6, -5], [-7, -5]]);
      ctx.beginPath(); ctx.arc(7 * u, 1 * u, 3.4 * u, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
      break;
    case 'fajfka':
      // dlouhá fajfka: náustek nahoře, troubel a porcelánová hlavička s víčkem dole
      L([[-3, -11], [-1, -12], [1, -9], [1, 3]]);
      ctx.beginPath(); ctx.ellipse(3 * u, 7 * u, 4.5 * u, 4.5 * u, 0, 0, Math.PI * 2); ctx.stroke();
      L([[1, 3], [4, 3]]);
      L([[-2, -9], [-4, -2]]); L([[-1, -9], [-2, -2]]);
      break;
    case 'rosti':
      // volná náruč roští (nesvázaná, Daniel 2026-11-09)
      L([[-11, 6], [10, -3]]); L([[-10, -2], [11, 5]]); L([[-8, 9], [9, 0]]);
      L([[-6, -6], [8, 8]]); L([[-2, 10], [4, -9]]); L([[5, -7], [7, -10]]); L([[-9, 2], [-11, -1]]);
      break;
    case 'karty':
      // vějíř tří karet: „zahraj si“
      [-0.45, 0, 0.45].forEach((a) => {
        ctx.save();
        ctx.translate(0, 9 * u); ctx.rotate(a); ctx.translate(0, -9 * u);
        ctx.fillStyle = 'rgba(255, 252, 244, 1)';
        ctx.beginPath(); ctx.roundRect(-5 * u, -9 * u, 10 * u, 15 * u, 2 * u); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      C(0, -3, 1.6, true);
      break;
    case 'kartaDalsi':
      // karta s plusem: „ještě jednu“
      ctx.beginPath(); ctx.roundRect(-7 * u, -10 * u, 14 * u, 20 * u, 2.5 * u); ctx.stroke();
      L([[0, -5], [0, 5]]); L([[-5, 0], [5, 0]]);
      break;
    case 'dlan':
      // zvednutá otevřená dlaň: „stačí“
      ctx.beginPath(); ctx.roundRect(-6 * u, -2 * u, 12 * u, 12 * u, 4 * u); ctx.stroke();
      L([[-4.5, -1], [-4.5, -8]]); L([[-1.5, -1], [-1.5, -11]]); L([[1.5, -1], [1.5, -11]]); L([[4.5, -1], [4.5, -8]]);
      L([[-6, 5], [-10, 0]]);
      break;
    default:
      C(0, 0, 8);
  }
  ctx.restore();
};

// ---------- papírové pozadí a kulisy detailů ----------
let paperCanvas = null;
K.paper = (ctx, tint = PAPER) => {
  if (!paperCanvas) {
    paperCanvas = document.createElement('canvas');
    paperCanvas.width = K.W;
    paperCanvas.height = K.H;
    const p = paperCanvas.getContext('2d');
    for (let i = 0; i < 9000; i++) {
      p.fillStyle = `rgba(80, 60, 30, ${Math.random() * 0.06})`;
      p.fillRect(Math.random() * K.W, Math.random() * K.H, 2 + Math.random() * 3, 1 + Math.random() * 2);
    }
    const g = p.createRadialGradient(K.W / 2, K.H / 2, K.H * 0.4, K.W / 2, K.H / 2, K.H);
    g.addColorStop(0, 'rgba(60, 40, 20, 0)');
    g.addColorStop(1, 'rgba(60, 40, 20, 0.35)');
    p.fillStyle = g;
    p.fillRect(0, 0, K.W, K.H);
  }
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, K.W, K.H);
  ctx.drawImage(paperCanvas, 0, 0);
};

K.ground = (ctx, y, color = '#d6c69e') => {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-10, K.H + 10);
  for (let x = -10; x <= K.W + 10; x += 40) ctx.lineTo(x, y + Math.sin(x / 210) * 18 + jit(x, 2));
  ctx.lineTo(K.W + 10, K.H + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
};

// krkonošská bouda zepředu; y = spodek zdi
K.drawHouse = (ctx, x, y, w, h, o = {}) => {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.fillStyle = o.wall || '#b98c5e';
  ctx.fillRect(x - w / 2, y - h, w, h);
  stroke(ctx, [[x - w / 2, y], [x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y]], 5, 100);
  for (let i = 1; i < 6; i++) stroke(ctx, [[x - w / 2, y - (h * i) / 6], [x + w / 2, y - (h * i) / 6]], 1.5, 110 + i, 1.5);
  // komín a kouř
  ctx.fillStyle = '#6d5a4a';
  ctx.fillRect(x + w * 0.22, y - h - w * 0.55, w * 0.09, w * 0.4);
  ctx.strokeRect(x + w * 0.22, y - h - w * 0.55, w * 0.09, w * 0.4);
  if (o.smoke) {
    for (let i = 0; i < 5; i++) {
      const t = (K.time * 0.4 + i / 5) % 1;
      ctx.fillStyle = `rgba(120, 110, 100, ${0.45 * (1 - t)})`;
      ctx.beginPath();
      ctx.arc(x + w * 0.265 + Math.sin(t * 6 + i) * 20 + t * 60, y - h - w * 0.58 - t * 240, 14 + t * 34, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // střecha
  ctx.fillStyle = o.roof || '#7b3b2c';
  ctx.beginPath();
  ctx.moveTo(x - w * 0.62, y - h + 6);
  ctx.lineTo(x, y - h - w * 0.62);
  ctx.lineTo(x + w * 0.62, y - h + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // dveře a okna
  ctx.fillStyle = '#5a3f2a';
  ctx.fillRect(x - w * 0.09, y - h * 0.55, w * 0.18, h * 0.55);
  ctx.strokeRect(x - w * 0.09, y - h * 0.55, w * 0.18, h * 0.55);
  ctx.fillStyle = o.lit ? '#ffd27a' : '#3e4a52';
  [[-0.3, 0.6], [0.3, 0.6]].forEach(([dx, dy]) => {
    ctx.fillRect(x + dx * w - w * 0.08, y - h * dy - w * 0.08, w * 0.16, w * 0.14);
    ctx.strokeRect(x + dx * w - w * 0.08, y - h * dy - w * 0.08, w * 0.16, w * 0.14);
  });
  ctx.restore();
};

// červené K z němých značek Krkonoš (Klínovky) — cesta z Wikimedia Commons NZ_Klinovky.svg, volné dílo
const LOGO_K = [[0.002, 0.083], [13.522, 0.048], [13.589, 14.605], [29.002, 0.032], [45.849, 0], [19.86, 25.383],
  [45.89, 51.27], [29.177, 51.238], [13.431, 36.664], [13.501, 51.347], [0, 51.402]];
const LOGO_K_H = 51.402;
K.LOGO_K_RATIO = 45.89 / LOGO_K_H;

// x = levý okraj, y = účaří, h = výška písmene
K.drawLogoK = (ctx, x, y, h, color = '#eb3948') => {
  const s = h / LOGO_K_H;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  LOGO_K.forEach(([px, py], i) => (i ? ctx.lineTo(x + px * s, y - h + py * s) : ctx.moveTo(x + px * s, y - h + py * s)));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

// nápis „Klášterka“ s K z němých značek, vycentrovaný na cx
K.drawTitle = (ctx, cx, y, size, color = '#f3e6c8') => {
  const rest = 'lášterka';
  ctx.save();
  ctx.font = `600 ${size}px Georgia, serif`;
  const h = size * 0.79, kw = h * K.LOGO_K_RATIO, gap = size * 0.07; // K sahá do výšky „l“
  const x0 = cx - (kw + gap + ctx.measureText(rest).width) / 2;
  K.drawLogoK(ctx, x0, y, h);
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText(rest, x0 + kw + gap, y);
  ctx.restore();
};

// tlačítko zpět / znovu v kroužku
K.drawRoundButton = (ctx, x, y, icon, pulse) => {
  ctx.save();
  const r = 38 + (pulse ? Math.sin(K.time * 4) * 3 : 0);
  ctx.fillStyle = 'rgba(32, 25, 18, 0.8)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  K.drawIcon(ctx, icon, x, y, 40, '#f3e6c8');
  ctx.restore();
};

// „hrát znovu“ na konci hry: červená šipka stočená do kruhu ve stylu němých značek Krkonoš (Daniel
// 2026-11-23; barva #eb3948 a poměry podle Němé_značky_Krkonoš.svg: plný tvar bez obrysu, tah asi
// čtvrtina výšky značky, rovně useknutý konec). Kroužek po směru hodin, hrot nahoře míří doprava.
const MARK_RED = '#eb3948';
K.drawReplayMark = (ctx, x, y, pulse) => {
  const k = 1 + (pulse ? Math.sin(K.time * 4) * 0.05 : 0);
  const R = 27 * k, lw = 17 * k;
  const a0 = -Math.PI / 2 + 1.0, a1 = (3 * Math.PI) / 2 - 0.2; // začátek vpravo nahoře, konec těsně vlevo od vrcholu
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = MARK_RED;
  ctx.fillStyle = MARK_RED;
  ctx.lineWidth = lw;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.arc(0, 0, R, a0, a1 + 0.06); // kousek pod hrot, ať mezi nimi nezůstane světlá spára
  ctx.stroke();
  // hrot: trojúhelník na konci oblouku, míří po směru hodin (tečna), široký přes celý tah a kus navíc
  const ex = Math.cos(a1) * R, ey = Math.sin(a1) * R;
  const tx = -Math.sin(a1), ty = Math.cos(a1); // tečna po směru hodin
  const nx = Math.cos(a1), ny = Math.sin(a1); // ven od středu
  const half = lw * 1.05, len = lw * 1.2;
  ctx.beginPath();
  ctx.moveTo(ex + nx * half, ey + ny * half);
  ctx.lineTo(ex - nx * half, ey - ny * half);
  ctx.lineTo(ex + tx * len, ey + ty * len);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

// pulzující kroužek = nápověda, kam kliknout
K.drawHint = (ctx, x, y, r, a = 1) => {
  ctx.save();
  const t = (K.time * 0.8) % 1;
  ctx.globalAlpha = a * (1 - t) * 0.9;
  ctx.strokeStyle = '#fffbea';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, r * (0.6 + t * 0.8), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

K.INK = INK;
K.stroke = stroke;
