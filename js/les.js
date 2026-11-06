// Les mezi dolní a horní loukou (cesta z Klášterky ke Klínovkám). Otevře se sám, když panáček poprvé
// dojde na kraj lesa (skrytý úsek cesty, viz K.forestSpan v louka.js); cestou zpět už je vyřešený.
// Daniel 2026-11-05: starý strom s obličejem v kůře spí. 1. klik pootevře oči („nebuď mě“), 2. klik
// se probudí, 3. klik „co je?“ — panáček ukáže sníh a strom v animované bublině, že mrak na Zadní Planině
// je zamčený a potřebuje tolik klíčů, kolik je úkolů (K.ITEMS). Pak dá batoh a v HUD se objeví místa.
// Přes potok nejde projít: v korytě spí zatoulaný starý beran obrostlý mechem, rohy jako kámen.
// Choroše na pařezu vyrostou do schodů na zídku, z převisu visí rampouchy a jen jeden kápne beranovi
// za krk. Beran se otřepe, postaví se, panáček přejde po jeho hřbetě a beran jde za stádem na louku.
// Zástupné kresby; pozadí se později složí z fotek (pics/les, pics/klasterka).
K.FOREST_FADE = '#1f2a1c';
// Pozadí: obrázek vygenerovaný podle Danielových fotek (2026-11-06, assets/sceny/les.jpg); souřadnice
// níže jsou změřené na něm. Starší montáž z fotek je les-montaz.jpg (python tools/montaz_les.py).
// Dokud se obrázek nenačte, kreslí se papírová verze (ta má tvary ještě podle montáže).
const BG = 'assets/sceny/les.jpg';
const MOSS = 'assets/sceny/les-mech.jpg'; // fotka mechu na spícího berana (také z montáže)
K.img(BG);
K.img(MOSS);

const LG = 950; // chodidla na levém břehu (listí před mechovým kamenem)
const WALL_X = 392; // levá stěna zídky (papírová verze)
const WALL_TOP = 302; // chodidla na zídce a převisu
const WATER = 955; // hladina potoka (papírová verze)
const STUMP = { x: 590, y: 925 }; // pařez v trávě před zídkou
const RAM_X = 1090;
const HERO_S = 1.6;
// rampouchy pod převisem: iy = spodek převisu (je šikmý), kam kápnou (krk = probudí berana)
const ICICLES = [
  { x: 745, iy: 391, len: 75, hit: 'kamen', hy: 796 },
  { x: 815, iy: 387, len: 110, hit: 'kamen', hy: 812 },
  { x: 885, iy: 381, len: 90, hit: 'roh', hy: 866 },
  { x: 955, iy: 373, len: 120, hit: 'krk', hy: 846 },
  { x: 1025, iy: 362, len: 78, hit: 'mech', hy: 826 },
];
// choroše, které vyrostou cik-cak po čelní stěně zídky jako schody
const SHELVES = [{ x: 530, y: 858 }, { x: 470, y: 788 }, { x: 530, y: 718 }, { x: 470, y: 648 }, { x: 530, y: 578 },
  { x: 470, y: 508 }, { x: 530, y: 438 }, { x: 470, y: 368 }];
const CLIMB = [[470, LG], [590, 902], [530, 846], [470, 776], [530, 706], [470, 636], [530, 566], [470, 496], [530, 426],
  [470, 356], [500, WALL_TOP], [580, WALL_TOP]];
// z berana na mechový balvan, po trávě ke schodům a po nich nahoru ke Klínovkám
const EXIT_PATH = [[1500, 760], [1600, 712], [1660, 665], [1715, 618], [1775, 575], [1835, 532], [1890, 497], [2040, 470]];
const BAG = { x: 362, y: 252, hook: 190 }; // batoh visí na konci ulomené větve

const shakeOf = (t0, amt) => {
  const d = K.time - (t0 ?? -9);
  return d < 0.45 ? Math.sin(d * 60) * amt * (1 - d / 0.45) : 0;
};

let st = null;
const init = () => ({
  phase: 'intro',
  hero: { x: -90, y: LG, facing: 1, walking: false, phase: 0 },
  onWall: false, steps: 0,
  tree: 0, treeStage: 0, stretchT: null, mouthUntil: -9, bubble: null, heroBubbleUntil: -9, bagHang: !K.state.bag,
  moss: 1, stand: 0, eyes: 0, shiver: false, ramT: null, headT: null, snoreT: null, out: 0,
  drops: [], rings: [], wet: [], clumps: [], iceT: [],
});

// ---------- pohyb panáčka ----------
// quiet = bez kroků (po chorošech, zídce a beranovi)
async function heroGo(pts, speed = 330, quiet = false) {
  const h = st.hero;
  for (const [x, y] of pts) {
    const x0 = h.x, y0 = h.y, d = Math.hypot(x - x0, y - y0);
    if (d < 1) continue;
    if (Math.abs(x - x0) > 2) h.facing = Math.sign(x - x0);
    h.walking = true;
    const ph0 = h.phase;
    await K.tween(d / speed, (t) => {
      const before = h.phase;
      h.x = K.lerp(x0, x, t);
      h.y = K.lerp(y0, y, t);
      h.phase = ph0 + (d * t) / 20;
      if (!quiet && Math.floor(h.phase / Math.PI + 0.5) !== Math.floor(before / Math.PI + 0.5)) {
        K.sound(K.stepSound(), { volume: K.STEP_VOLUME * 0.8 * K.rand(0.75, 1), rate: K.rand(0.9, 1.12) });
      }
    });
  }
  h.walking = false;
}

async function hop(x1, y1, dur, height) {
  const h = st.hero, x0 = h.x, y0 = h.y;
  if (Math.abs(x1 - x0) > 2) h.facing = Math.sign(x1 - x0);
  await K.tween(dur, (t) => {
    h.x = K.lerp(x0, x1, t);
    h.y = K.lerp(y0, y1, t) - Math.sin(t * Math.PI) * height;
  });
}

// ---------- scénky ----------
// panáček přijde ke spícímu stromu; dokud se s ním nedomluví, jde klikat jen na strom
async function intro() {
  K.busy++;
  await heroGo([[400, LG]], 280);
  st.phase = 'tree';
  K.busy--;
}

const mouth = (sec) => { st.mouthUntil = K.time + sec; };
const KEYS_SHOW = 7; // jak dlouho je poprvé vidět bublina s klíči (animace se točí po 5 s)
function showKeys(sec) {
  st.bubble = { kind: 'klice', t0: K.time, until: K.time + sec };
  mouth(Math.min(sec, 2.2));
}

async function treeClick() {
  K.busy++;
  if (st.treeStage === 0) {
    // 1. pootevře oči a zabručí „nebuď mě“, pak je zase zavře
    st.treeStage = 1;
    await K.tween(0.35, (t) => { st.tree = t * 0.5; });
    K.sound('nebudme');
    mouth(1.2);
    await K.after(1.4);
    await K.tween(0.7, (t) => { st.tree = 0.5 * (1 - t); });
  } else if (st.treeStage === 1) {
    // 2. probudí se a protáhne (zavrzá)
    st.treeStage = 2;
    st.stretchT = K.time;
    K.sound('vrzani');
    await K.tween(0.8, (t) => { st.tree = t; });
  } else if (st.treeStage === 2) {
    // 3. „co je?“ — panáček ukáže sníh — strom: mrak je zamčený, sežeň klíče — dá batoh
    st.treeStage = 3;
    st.hero.facing = -1;
    K.sound('coje');
    mouth(0.9);
    st.bubble = { kind: 'coje', t0: K.time, until: K.time + 1.5 };
    await K.after(1.6);
    st.heroBubbleUntil = K.time + 1.9;
    await K.after(2.1);
    showKeys(KEYS_SHOW);
    await K.after(KEYS_SHOW);
    if (!K.state.bag) await giveBag();
    st.hero.facing = 1;
    st.phase = 'free';
  } else {
    // později jen připomene klíče
    K.sound('vrzani');
    showKeys(5.3);
  }
  K.busy--;
}

// batoh visí na větvi, strom ho shodí a přeletí do HUD
async function giveBag() {
  st.bagHang = false;
  const from = { x: BAG.x, y: BAG.y }, bag = K.BAG;
  const fly = { item: 'batoh', x: from.x, y: from.y, s: 70 };
  K.flyingItems.push(fly);
  await K.tween(1.2, (t) => {
    const e = K.ease(t);
    fly.x = K.lerp(from.x, bag.x, e);
    fly.y = K.lerp(from.y, bag.y, e) - Math.sin(t * Math.PI) * 140;
    fly.s = K.lerp(70, 46, e);
  });
  K.flyingItems.splice(K.flyingItems.indexOf(fly), 1);
  K.state.bag = true;
  K.bagT = K.time;
  K.bagBump = K.time;
  K.sound('odmena');
  await K.after(1.2);
}

async function growSteps() {
  K.busy++;
  K.sound('chorose');
  await K.tween(1.4, (t) => { st.steps = t; });
  await heroGo(CLIMB, 260, true);
  st.onWall = true;
  K.busy--;
}

async function tapIcicle(i) {
  const ic = ICICLES[i];
  K.busy++;
  if (!st.onWall) {
    // ze země nedosáhne: vyskočí a nic
    await hop(st.hero.x, st.hero.y, 0.35, 46);
    K.busy--;
    return;
  }
  await heroGo([[ic.x, WALL_TOP]], 330, true);
  await hop(ic.x, WALL_TOP, 0.28, 22); // dupne na převis
  st.iceT[i] = K.time;
  const y0 = ic.iy + ic.len, d = { x: ic.x, y: y0 };
  st.drops.push(d);
  K.sound('triangl'); // padající kapka
  await K.tween(0.6, (t) => { d.y = K.lerp(y0, ic.hy, t * t); });
  st.drops.splice(st.drops.indexOf(d), 1);
  if (ic.hit === 'voda' || ic.hit === 'kamen') st.rings.push({ x: ic.x, y: ic.hy, t: K.time }); // cákne
  if (ic.hit === 'roh') st.headT = K.time; // ťukne o kamenný roh, beran sebou škubne
  if (ic.hit === 'mech') st.wet.push({ x: ic.x, y: ic.hy + 8, t: K.time }); // mech kapku vsákne
  K.busy--;
  if (ic.hit === 'krk') return wake();
}

async function wake() {
  K.busy++;
  st.phase = 'wake';
  st.ramT = K.time;
  st.eyes = 1;
  K.sound('beran'); // probouzející se beran
  await K.after(0.7);
  // otřepe se: mech z něj odletí v chomáčcích
  K.sound('otrepani');
  st.shiver = true;
  for (let i = 0; i < 26; i++) {
    const a = K.rand(Math.PI * 1.05, Math.PI * 1.95);
    st.clumps.push({ x: RAM_X + K.rand(-160, 160), y: 880 + K.rand(-60, 10), vx: Math.cos(a) * K.rand(150, 420), vy: Math.sin(a) * K.rand(250, 520), r: K.rand(7, 16), rot: K.rand(0, 6) });
  }
  await K.tween(1.0, (t) => { st.moss = 1 - t; });
  st.shiver = false;
  await K.tween(1.1, (t) => { st.stand = K.ease(t); });
  await K.after(0.5);
  // panáček seskočí z převisu na hřbet a přejde na druhý břeh
  await heroGo([[1000, WALL_TOP]], 330, true);
  await hop(1110, 745, 0.75, 50); // dolů z převisu na hřbet
  await heroGo([[1190, 747]], 240, true);
  await hop(1360, 800, 0.55, 60); // na mechový balvan na druhém břehu
  // beran jde po proudu za stádem, panáček po schodech ke Klínovkám
  K.tween(2.6, (t) => { st.out = t; });
  await heroGo(EXIT_PATH, 300);
  K.state.solved.les = true;
  K.addRam(true);
  st.phase = 'done';
  await K.fadeTo(1, 0.9, K.FOREST_FADE);
  K.busy--;
  K.go('louka', { from: 'les' });
}

// ---------- vstup z louky a pomocníci pro start/testy ----------
K.enterForest = async (dir) => {
  K.forestTrip = { dir, busy: K.busy };
  K.busy = 1;
  await K.fadeTo(1, 0.8, K.FOREST_FADE);
  K.busy = 0;
  K.go('les');
};

// beran se přidá ke stádu; z lesa vyjde na kraji louky a dojde ke stádu
K.addRam = (fromForest) => {
  if (!K.sheep.length) K.makeSheep();
  if (K.sheep.some((sh) => sh.ram)) return;
  const pt = K.randomInPolygon(K.L.louka);
  const [a] = K.forestSpan();
  const start = fromForest && a > 0 ? K.L.cesta[a - 1] : pt;
  K.sheep.push({
    x: start.x, y: start.y, tx: pt.x, ty: pt.y, facing: -1, phase: 0, wait: 0,
    headUp: false, scarf: '#6b4a30', rot: 0, mode: 'graze', ram: true,
  });
};

// les přeskočit (ladění, scény chalup, finále)
K.forestDone = () => {
  K.state.solved.les = true;
  K.state.bag = true;
  K.addRam(false);
};

// ---------- kresba ----------
function drawBackdrop(ctx) {
  K.paper(ctx, '#dfe1d6');
  ctx.save();
  // vzdálené kmeny v mlze
  for (let i = 0; i < 16; i++) {
    const x = 380 + i * 105 + K.hash(i) * 60, w = 14 + K.hash(i + 30) * 26;
    ctx.globalAlpha = 0.12 + K.hash(i + 60) * 0.12;
    ctx.fillStyle = '#5d6355';
    ctx.fillRect(x, 0, w, 880);
  }
  ctx.restore();
}

function poly(ctx, pts, fill, lw = 5) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = lw;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawStreamBack(ctx) {
  // protější svah koryta a kameny v něm
  poly(ctx, [[640, 880], [1400, 868], [1400, WATER], [640, WATER]], '#77725f', 0);
  ctx.fillStyle = '#8f8b80';
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 3;
  [[760, 930, 40], [1230, 925, 46], [1330, 935, 34], [700, 940, 28]].forEach(([x, y, r]) => {
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  });
  ctx.fillStyle = '#56737c';
  ctx.fillRect(640, WATER, 760, K.H - WATER);
}

function drawStreamFront(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(86, 120, 130, 0.62)';
  ctx.fillRect(640, WATER, 760, K.H - WATER);
  ctx.strokeStyle = 'rgba(235, 245, 248, 0.7)';
  ctx.lineWidth = 3;
  ctx.setLineDash([26, 40]);
  for (let r = 0; r < 4; r++) {
    ctx.lineDashOffset = -K.time * (40 + r * 12) - r * 30;
    ctx.beginPath(); ctx.moveTo(650, WATER + 18 + r * 30); ctx.lineTo(1390, WATER + 18 + r * 30); ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
  drawRings(ctx);
}

// kruhy po kapkách
function drawRings(ctx) {
  ctx.save();
  ctx.strokeStyle = 'rgba(235, 245, 248, 0.8)';
  ctx.lineWidth = 3;
  st.rings = st.rings.filter((g) => K.time - g.t < 1.2);
  for (const g of st.rings) {
    const t = (K.time - g.t) / 1.2;
    ctx.globalAlpha = 1 - t;
    ctx.beginPath(); ctx.ellipse(g.x, (g.y ?? WATER) + 4, 6 + t * 30, 2 + t * 8, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

// voda z fotomontáže přes spodek berana (beran leží a stojí v potoce); maska s měkkou hladinou
let waterOver = null;
function drawWaterOver(ctx, bg) {
  if (!waterOver) {
    waterOver = document.createElement('canvas');
    waterOver.width = 700;
    waterOver.height = 150;
    const w = waterOver.getContext('2d');
    w.drawImage(bg, 680, 930, 700, 150, 0, 0, 700, 150);
    w.globalCompositeOperation = 'destination-in';
    const g = w.createLinearGradient(0, 0, 0, 60);
    g.addColorStop(0, 'rgba(0, 0, 0, 0)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    w.fillStyle = g;
    w.fillRect(0, 0, 700, 150);
  }
  ctx.drawImage(waterOver, 680, 930);
}

function drawBanks(ctx) {
  // pravý břeh s kamennými schody nahoru ke Klínovkám
  poly(ctx, [[1330, 1090], [1345, 960], [1395, 868], [1640, 862], [1640, 830], [1700, 830], [1700, 790], [1780, 790],
    [1780, 750], [1860, 750], [1860, 712], [1940, 712], [1940, 1090]], '#857b5c');
  ctx.fillStyle = '#a39e92';
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 3;
  [[1640, 830], [1700, 790], [1780, 750], [1860, 712]].forEach(([x, y], i) => {
    ctx.fillRect(x, y, 82, 30);
    ctx.strokeRect(x, y, 82, 30);
    K.stroke(ctx, [[x + 4, y + 2], [x + 78, y + 2]], 4, 820 + i, 1); // mech na hraně schodu
  });
  ctx.strokeStyle = '#5f7a3a';
  [[1400, 866], [1480, 864], [1560, 862]].forEach(([x, y], i) => K.stroke(ctx, [[x, y], [x + 30, y - 4], [x + 60, y]], 6, 840 + i, 1.5));
}

function drawWall(ctx) {
  const outline = [[WALL_X, 880], [WALL_X, 462], [700, 458], [704, 1090], [WALL_X, 1090]];
  poly(ctx, outline, '#857f72');
  ctx.save();
  ctx.beginPath();
  outline.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.clip();
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 3;
  for (let r = 0; r < 13; r++) {
    const y = 466 + r * 44;
    for (let c = -1; c < 6; c++) {
      const x = WALL_X + c * 66 + (r % 2) * 33, k = K.hash(r * 9 + c);
      ctx.fillStyle = k < 0.33 ? '#8f8b80' : k < 0.66 ? '#a39e92' : '#7f8a6a';
      ctx.beginPath(); ctx.roundRect(x + 3, y + 3, 60, 38, 10); ctx.fill(); ctx.stroke();
    }
  }
  ctx.restore();
  // převis ze skály nad potokem
  poly(ctx, [[690, 452], [1072, 456], [1082, 476], [1060, 496], [1000, 500], [930, 506], [860, 501], [790, 508], [700, 510]], '#8f8b80');
  // mech a jinovatka na hraně
  ctx.strokeStyle = '#5f7a3a';
  K.stroke(ctx, [[WALL_X, 462], [540, 456], [700, 456], [880, 452], [1070, 456]], 9, 860, 1.5);
  ctx.strokeStyle = 'rgba(250, 252, 255, 0.85)';
  K.stroke(ctx, [[WALL_X + 6, 456], [560, 451], [760, 450], [960, 448], [1060, 451]], 3, 870, 1.5);
}

function drawIcicles(ctx) {
  ICICLES.forEach((ic, i) => {
    const x = ic.x + shakeOf(st.iceT[i], 4);
    ctx.fillStyle = 'rgba(226, 240, 250, 0.92)';
    ctx.strokeStyle = '#6f8fa8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 11, ic.iy - 4); ctx.lineTo(x + 11, ic.iy - 4); ctx.lineTo(x + 1, ic.iy + ic.len); ctx.closePath();
    ctx.fill(); ctx.stroke();
  });
  ctx.fillStyle = 'rgba(160, 205, 230, 0.95)';
  for (const d of st.drops) { ctx.beginPath(); ctx.ellipse(d.x, d.y, 5, 8, 0, 0, Math.PI * 2); ctx.fill(); }
}

function drawLeftGround(ctx) {
  poly(ctx, [[-20, 862], [640, 866], [706, 962], [706, 1090], [-20, 1090]], '#857b5c');
  // listí a mech
  for (let i = 0; i < 40; i++) {
    const x = K.hash(i + 200) * 680, y = 880 + K.hash(i + 300) * 190;
    ctx.fillStyle = i % 3 ? '#6e5a3c' : '#6f8a45';
    ctx.beginPath(); ctx.ellipse(x, y, 9, 4, K.hash(i) * 3, 0, Math.PI * 2); ctx.fill();
  }
}

function drawShelf(ctx, x, y, k, w = 46) {
  if (k <= 0) return;
  ctx.save();
  ctx.fillStyle = '#efe3c8';
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x - 8, y, w * k, 15 * k, 0, Math.PI, 0);
  ctx.lineTo(x - 8 + w * k, y + 4 * k);
  ctx.lineTo(x - 8 - w * k, y + 4 * k);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.lineWidth = 1.5;
  for (let g = -2; g <= 2; g++) K.stroke(ctx, [[x - 8 + g * 9 * k, y + 3 * k], [x - 8 + g * 13 * k, y - 8 * k]], 1.5, 900 + g, 0.5);
  ctx.restore();
}

function drawStump(ctx) {
  ctx.save();
  ctx.fillStyle = '#7a5a3c';
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 4;
  ctx.fillRect(STUMP.x - 32, STUMP.y - 18, 64, 54);
  ctx.strokeRect(STUMP.x - 32, STUMP.y - 18, 64, 54);
  ctx.fillStyle = '#b08c62';
  ctx.beginPath(); ctx.ellipse(STUMP.x, STUMP.y - 18, 32, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
  // malé choroše na pařezu, po kliknutí vyrostou po zídce
  const pulse = st.steps === 0 && st.phase === 'free' ? 1 + Math.sin(K.time * 3) * 0.05 : 1;
  if (st.steps < 1) {
    drawShelf(ctx, STUMP.x - 18, STUMP.y + 2, pulse, 18);
    drawShelf(ctx, STUMP.x - 24, STUMP.y + 20, pulse, 14);
  }
  // rostou postupně odspodu; při steps = 1 jsou všechny celé
  const lag = 0.6 / SHELVES.length;
  SHELVES.forEach((s, i) => drawShelf(ctx, s.x, s.y, K.ease(K.clamp(st.steps * (1 + lag * SHELVES.length) - i * lag))));
}

// photo = kmen je ve fotomontáži, kreslí se jen obličej a batoh
function drawTree(ctx, photo) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (!photo) {
    poly(ctx, [[18, -10], [206, -10], [210, 700], [252, 884], [-30, 890], [22, 700]], '#8c857a');
    poly(ctx, [[200, 312], [300, 286], [306, 302], [206, 338]], '#8c857a', 4);
    ctx.strokeStyle = 'rgba(29, 23, 18, 0.45)';
    for (let i = 0; i < 6; i++) {
      const x = 42 + i * 28;
      K.stroke(ctx, [[x, 0], [x + 6, 150], [x - 4, 290], [x + 5, 360]], 2, 950 + i, 1);
      K.stroke(ctx, [[x + 2, 540], [x - 5, 660], [x + 8, 820]], 2, 960 + i, 1);
    }
  }
  // obličej v kůře: oči, suk jako nos, ústa; při probuzení se protáhne (zachvěje)
  ctx.translate(shakeOf(st.stretchT, 5), 0);
  const open = st.tree, blink = st.treeStage >= 2 && (K.time % 4.3) < 0.13;
  const talking = K.time < st.mouthUntil;
  ctx.strokeStyle = K.INK;
  K.stroke(ctx, [[58, 388], [80, 374], [102, 380]], 6, 970, 1);
  K.stroke(ctx, [[130, 374], [152, 366], [174, 378]], 6, 971, 1);
  [[80, 412], [152, 404]].forEach(([ex, ey]) => {
    if (open < 0.1 || blink) {
      K.stroke(ctx, [[ex - 16, ey], [ex, ey + 6], [ex + 16, ey]], 4, 972, 0.6);
      return;
    }
    ctx.fillStyle = '#f4f1ea';
    ctx.beginPath(); ctx.ellipse(ex, ey, 17, 12 * open, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 4; ctx.stroke();
    const look = K.clamp((st.hero.x - ex) / 300, -1, 1) * 6;
    ctx.fillStyle = K.INK;
    ctx.beginPath(); ctx.arc(ex + look, ey + 2, 5 * open, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = '#6b6258';
  ctx.beginPath(); ctx.ellipse(118, 450, 12, 18, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  const mo = talking ? 6 + Math.abs(Math.sin(K.time * 11)) * 14 : 0;
  if (mo > 0) {
    ctx.fillStyle = '#2a211a';
    ctx.beginPath(); ctx.ellipse(116, 496, 24, mo, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else K.stroke(ctx, [[92, 494], [116, 500], [142, 492]], 4, 975, 0.6);
  if (st.treeStage < 2 && open < 0.1) {
    // spí: z pusy stoupají „z“
    ctx.font = '600 34px Georgia, serif';
    ctx.fillStyle = '#f3e6c8';
    const z = (K.time * 0.45) % 1;
    ctx.globalAlpha = 1 - z;
    ctx.fillText('z', 150 + z * 40, 480 - z * 90);
    ctx.globalAlpha = 1;
  }
  // batoh na větvi
  if (st.bagHang) {
    K.stroke(ctx, [[BAG.x, BAG.hook], [BAG.x, BAG.y - 30]], 3, 980, 0.6);
    ctx.fillStyle = '#c9a46a';
    ctx.beginPath(); ctx.roundRect(BAG.x - 23, BAG.y - 17, 46, 50, 11); ctx.fill();
    K.drawIcon(ctx, 'batoh', BAG.x, BAG.y, 70);
  }
  ctx.restore();
}

// zámek; open 0–1 = třmen se zvedne a pootočí
function drawLock(ctx, x, y, size, open) {
  const u = size / 24;
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 2.4 * u;
  ctx.save();
  ctx.translate(5 * u, -1 * u - open * 4 * u);
  ctx.rotate(-open * 0.6);
  ctx.beginPath(); ctx.arc(-5 * u, 0, 5 * u, Math.PI, 0); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#d9b14a';
  ctx.beginPath(); ctx.roundRect(-7.5 * u, -1 * u, 15 * u, 11 * u, 1.5 * u); ctx.fill(); ctx.stroke();
  ctx.fillStyle = K.INK;
  ctx.beginPath(); ctx.arc(0, 3.5 * u, 1.6 * u, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// bubliny stromu: „?“ a animovaná „mrak je zamčený, sežeň klíče“ — klíče jeden po druhém naskočí
// do řady, zámek se otevře a z mraku začne sněžit (smyčka po 5 s)
const KEYS_LOOP = 5, KEY_STEP = 0.5;
function drawTreeBubble(ctx) {
  const b = st.bubble;
  if (!b || K.time > b.until) return;
  const age = K.time - b.t0;
  const a = K.clamp(Math.min(b.until - K.time, age) / 0.25);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(255, 252, 244, 0.97)';
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 4;
  const circle = (cx, cy, cr) => { ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); };
  if (b.kind === 'coje') {
    circle(196, 470, 8); circle(232, 438, 13);
    circle(300, 384, 52);
    ctx.fillStyle = K.INK;
    ctx.font = '700 66px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', 300, 407);
    ctx.restore();
    return;
  }
  const x = 650, y = 180, r = 132, n = K.ITEMS.length;
  circle(205, 455, 9); circle(285, 372, 15); circle(400, 266, 22);
  circle(x, y, r);
  const t = age % KEYS_LOOP;
  const openAt = n * KEY_STEP + 0.4;
  const open = K.clamp((t - openAt) / 0.4);
  const snow = K.clamp((t - openAt - 0.3) / 0.3) * K.clamp((KEYS_LOOP - t) / 0.3);
  // sníh pod mrakem (oříznutý bublinou)
  if (snow > 0) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r - 4, 0, Math.PI * 2); ctx.clip();
    ctx.globalAlpha = a * snow;
    for (let j = 0; j < 12; j++) {
      const fx = x - 78 + ((j * 47) % 156) + Math.sin(K.time * 2 + j) * 5;
      const fy = y - 10 + ((K.time * 45 + j * 29) % 62);
      K.drawIcon(ctx, 'snih', fx, fy, 13, '#6f8fa8');
    }
    ctx.restore();
  }
  // mrak (po odemčení ztmavne jako sněhový)
  const g = Math.round(K.lerp(212, 182, open));
  ctx.fillStyle = `rgb(${g}, ${g + 5}, ${g + 10})`;
  ctx.beginPath();
  [[-52, -34, 32], [-10, -58, 42], [40, -38, 34], [0, -22, 40]].forEach(([dx, dy, cr]) => {
    ctx.moveTo(x + dx + cr, y + dy);
    ctx.arc(x + dx, y + dy, cr, 0, Math.PI * 2);
  });
  ctx.fill();
  ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x - 6, y - 36, 70, 26, 0, 0, Math.PI * 2); ctx.fill();
  drawLock(ctx, x - 6, y - 40, 40, open);
  // řada míst na klíče, klíče postupně naskočí
  for (let i = 0; i < n; i++) {
    const kx = x + (i - (n - 1) / 2) * 44, ky = y + 72;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(kx, ky, 18, 0, Math.PI * 2); ctx.stroke();
    const kt = t - i * KEY_STEP;
    if (kt <= 0) continue;
    const p = K.clamp(kt / 0.25), pop = p < 1 ? p * (1 + Math.sin(p * Math.PI) * 0.4) : 1;
    K.drawIcon(ctx, 'klic', kx, ky, 26 * pop, open > 0 ? '#9a7a1e' : K.INK);
  }
  ctx.restore();
}

// starý beran: vleže mechový balvan s kamennými rohy, hlavou k zídce (doleva)
function drawRam(ctx) {
  const sd = st.stand, lie = 1 - sd;
  const snore = st.snoreT !== null && K.time - st.snoreT < 1.2 ? 2.5 : 1;
  const breath = lie * Math.sin(K.time * 1.3) * 0.035 * snore;
  const jig = st.shiver ? Math.sin(K.time * 50) * 5 : shakeOf(st.ramT, 6);
  const cx = RAM_X + jig, cy = K.lerp(905, 815, sd);
  const rx = K.lerp(190, 175, sd), ry = K.lerp(85, 72, sd) * (1 + breath);
  ctx.save();
  if (st.out > 0) {
    // odchází po proudu k divákovi (průhlednost řeší K.withAlpha u volání)
    ctx.translate(-st.out * 160, st.out * 300);
  }
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = K.INK;
  if (sd > 0) {
    const step = st.out > 0 ? Math.sin(K.time * 8) * 14 : 0;
    [-120, -60, 60, 120].forEach((lx, i) => {
      const fx = cx + lx + (i % 2 ? step : -step);
      ctx.lineWidth = 18; ctx.strokeStyle = K.INK;
      ctx.beginPath(); ctx.moveTo(cx + lx, cy + ry * 0.5); ctx.lineTo(fx, cy + ry * 0.5 + 120 * sd); ctx.stroke();
      ctx.lineWidth = 11; ctx.strokeStyle = '#4a4038';
      ctx.beginPath(); ctx.moveTo(cx + lx, cy + ry * 0.5); ctx.lineTo(fx, cy + ry * 0.5 + 120 * sd); ctx.stroke();
    });
  }
  // tělo z chomáčů: mech → stará šedivá vlna
  const m = st.moss, mix = (a, b) => a.map((v, i) => Math.round(K.lerp(v, b[i], m)));
  const body = `rgb(${mix([214, 208, 194], [111, 127, 69])})`;
  ctx.fillStyle = body;
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2, pr = ry * 0.42;
    const px = cx + Math.cos(a) * rx * 0.84, py = cy + Math.sin(a) * ry * 0.74;
    ctx.moveTo(px + pr, py);
    ctx.arc(px + K.hash(k) * 4, py, pr, 0, Math.PI * 2);
  }
  ctx.stroke();
  ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.86, ry * 0.8, 0, 0, Math.PI * 2); ctx.fill();
  const mossImg = K.img(MOSS);
  if (m > 0 && K.ready(mossImg)) {
    // skutečný mech z fotky, oříznutý tvarem těla: vypadá jako obrostlý balvan
    ctx.save();
    ctx.globalAlpha *= m;
    ctx.beginPath();
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2, pr = ry * 0.42;
      const px = cx + Math.cos(a) * rx * 0.84, py = cy + Math.sin(a) * ry * 0.74;
      ctx.moveTo(px + pr, py);
      ctx.arc(px + K.hash(k) * 4, py, pr, 0, Math.PI * 2);
    }
    ctx.ellipse(cx, cy, rx * 0.86, ry * 0.8, 0, 0, Math.PI * 2);
    ctx.clip('nonzero');
    ctx.drawImage(mossImg, cx - rx - 40, cy - ry - 40, (rx + 40) * 2, (ry + 40) * 2);
    // stín zespodu, ať je to oblé
    const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
    g.addColorStop(0, 'rgba(255, 255, 240, 0.08)');
    g.addColorStop(1, 'rgba(20, 25, 10, 0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - rx - 40, cy - ry - 40, (rx + 40) * 2, (ry + 40) * 2);
    ctx.restore();
  } else if (m > 0) {
    // chomáčky mechu a lišejníku
    ctx.save();
    ctx.globalAlpha *= m;
    for (let i = 0; i < 46; i++) {
      const a = K.hash(i + 400) * Math.PI * 2, d = Math.sqrt(K.hash(i + 500));
      const px = cx + Math.cos(a) * rx * 0.85 * d, py = cy + Math.sin(a) * ry * 0.8 * d;
      ctx.fillStyle = i % 4 ? '#4d6b2e' : '#a9b47a';
      ctx.beginPath(); ctx.arc(px, py, 4 + K.hash(i + 600) * 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  // mokrá místa, kde mech vsákl kapku
  st.wet = st.wet.filter((w) => K.time - w.t < 3);
  for (const w of st.wet) {
    ctx.fillStyle = `rgba(40, 60, 30, ${0.6 * (1 - (K.time - w.t) / 3)})`;
    ctx.beginPath(); ctx.ellipse(w.x, w.y, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
  }
  // hlava
  const hj = shakeOf(st.headT, 5);
  const hx = cx - rx - 30 + hj + sd * 10, hy = K.lerp(cy + 15, cy - 45, sd);
  ctx.fillStyle = '#5c534a';
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.ellipse(hx, hy, 46, 33, -0.25 * lie, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // vousy
  K.stroke(ctx, [[hx - 14, hy + 28], [hx - 18, hy + 52], [hx - 4, hy + 30]], 4, 990, 1);
  if (st.eyes) {
    ctx.fillStyle = '#f4e9c8';
    ctx.beginPath(); ctx.ellipse(hx - 14, hy - 8, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = K.INK;
    ctx.fillRect(hx - 19, hy - 9, 10, 2.5); // vodorovná zornice
  } else {
    K.stroke(ctx, [[hx - 22, hy - 8], [hx - 14, hy - 4], [hx - 6, hy - 8]], 3, 991, 0.4);
    // spí: z nozder stoupají „z“
    ctx.font = '600 30px Georgia, serif';
    ctx.fillStyle = K.INK;
    const z = (K.time * 0.5) % 1;
    ctx.save();
    ctx.globalAlpha *= 1 - z;
    ctx.fillText('z', hx - 70 - z * 20, hy - 30 - z * 60);
    ctx.restore();
  }
  // rohy jako kámen: velká spirála dozadu kolem ucha
  const ox = hx + 18, oy = hy - 12;
  const pts = [];
  for (let k = 0; k <= 44; k++) {
    const a = -Math.PI / 2 + k * 0.16, r = 46 * (1 - k / 60);
    pts.push([ox + Math.cos(a) * r, oy + Math.sin(a) * r]);
  }
  for (const [w, c] of [[22, K.INK], [15, '#9a958b']]) {
    ctx.strokeStyle = c;
    for (let k = 1; k < pts.length; k++) {
      ctx.lineWidth = w * (1 - k / 70);
      ctx.beginPath(); ctx.moveTo(...pts[k - 1]); ctx.lineTo(...pts[k]); ctx.stroke();
    }
  }
  ctx.strokeStyle = 'rgba(29, 23, 18, 0.55)';
  ctx.lineWidth = 2;
  for (let k = 3; k < pts.length - 4; k += 4) {
    const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) || 1;
    const w = 6 * (1 - k / 70);
    ctx.beginPath(); ctx.moveTo(x0 - (nx / l) * w, y0 - (ny / l) * w); ctx.lineTo(x0 + (nx / l) * w, y0 + (ny / l) * w); ctx.stroke();
  }
  ctx.restore();
}

function drawClumps(ctx) {
  ctx.save();
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 2;
  for (const c of st.clumps) {
    ctx.fillStyle = '#5a7a35';
    ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r, c.r * 0.7, c.rot, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

const inRam = (p) => ((p.x - RAM_X) / 230) ** 2 + ((p.y - 895) / 110) ** 2 < 1;
const inTree = (p) => (p.x < 215 && p.y > 300 && p.y < 860) || K.dist(p, { x: 120, y: 440 }) < 120;
const icicleAt = (p) => ICICLES.findIndex((ic) => Math.abs(p.x - ic.x) < 30 && p.y > ic.iy - 30 && p.y < ic.iy + ic.len + 25);

K.scenes.les = {
  get st() { return st; }, // pro testy
  enter() {
    st = init();
    K.hero.visible = true;
    K.fade.a = 1;
    K.fadeTo(0, 0.9, K.FOREST_FADE);
    intro();
  },
  update(dt) {
    for (const c of st.clumps) {
      c.vy += 900 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rot += dt * 4;
    }
    st.clumps = st.clumps.filter((c) => c.y < K.H + 40);
  },
  draw(ctx) {
    const bg = K.img(BG), photo = K.ready(bg);
    if (photo) {
      ctx.drawImage(bg, 0, 0, K.W, K.H);
      K.withAlpha(ctx, 1 - st.out, drawRam);
      drawWaterOver(ctx, bg);
      drawRings(ctx);
    } else {
      drawBackdrop(ctx);
      drawStreamBack(ctx);
      K.withAlpha(ctx, 1 - st.out, drawRam);
      drawStreamFront(ctx);
      drawBanks(ctx);
      drawWall(ctx);
    }
    drawIcicles(ctx);
    if (!photo) drawLeftGround(ctx);
    drawStump(ctx);
    drawTree(ctx, photo);
    const h = st.hero;
    K.drawHero(ctx, h.x, h.y, HERO_S, { facing: h.facing, walking: h.walking, phase: h.phase, halo: false });
    if (K.time < st.heroBubbleUntil) K.drawBubble(ctx, h.x + 24, h.y - 220, 0.95, 'snih');
    if (st.phase === 'tree' && K.busy === 0) K.drawHint(ctx, 118, 440, 90);
    drawClumps(ctx);
    drawTreeBubble(ctx);
    if (K.debug) {
      ctx.strokeStyle = 'rgba(200, 0, 0, 0.7)';
      ICICLES.forEach((ic) => ctx.strokeRect(ic.x - 30, ic.iy - 30, 60, ic.len + 55));
    }
  },
  hot(p) {
    if (st.phase === 'tree') return inTree(p);
    if (st.phase !== 'free') return false;
    return icicleAt(p) >= 0 || (st.steps === 0 && K.dist(p, STUMP) < 70) || (st.moss > 0 && inRam(p)) || inTree(p);
  },
  click(p) {
    if (st.phase === 'tree') return inTree(p) && treeClick();
    if (st.phase !== 'free') return;
    const i = icicleAt(p);
    if (i >= 0) return tapIcicle(i);
    if (st.steps === 0 && K.dist(p, STUMP) < 70) return growSteps();
    if (inRam(p)) { st.snoreT = K.time; K.sound('chrapot'); return; }
    if (inTree(p)) treeClick();
  },
};
