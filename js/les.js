// Les mezi dolní a horní loukou (cesta z Klášterky ke Klínovkám). Otevře se sám, když panáček poprvé
// dojde na kraj lesa (skrytý úsek cesty, viz K.forestSpan v louka.js); cestou zpět už je vyřešený.
//
// Příběh (Daniel 2026-11-08, krkonošská dřevěná lávka místo převisu):
// - Přes potok vedla lávka ze tří kmenů. Povodeň utrhla její pravou půlku, zbyla jen holá vysoká pravá
//   opěra a na jejím kraji suchá souška bez kůry. Potok je ledový (u kraje se panáček otřese zimou).
// - Panáček vyleze po kořenech stromu na lávku a dojde na roztříštěný konec (zavrávorá).
// - Rampouch je jedna ze 3 věcí pro sněžnou květinu (s vodou a semínky, viz K.ITEMS): první rampouch, nad
//   kterým panáček dupne (kromě toho nad krkem berana), se utrhne a skočí do batohu (Daniel 2026-11-09);
//   jen pokud už batoh má (bez něj se rampouch jen zachvěje nebo kápne).
//   Bez rampouchu po spadlé soušce nepřejde (ukáže ho v bublině a utrhne si jiný).
// - Rampouchy pod lávkou jsou ve stínu větve s listím: když na lávku dupne, jen se zachvějí.
//   Panáček větev stáhne do potoka (odplave), vysvitne slunce, rampouchy se zalesknou a teprve pak kapou.
// - V korytě pod mezerou spí zatoulaný starý beran, hlavou proti proudu (od nás), obrostlý mechem jako
//   balvan; vykukují jen vršky rohů. Jen poslední rampouch mu kápne za krk.
// - Beran se otřepe, postaví, otočí bokem a trkne do pravé opěry. Ta praskne, souška zavrže a spadne
//   doleva přes mezeru na konec lávky (zvuk strom-pada.mp3, rána v čase STROM_RANA); po ní panáček
//   přejde. Uražený beran odejde proti proudu do mlhy (na louce se pak přidá ke stádu).
// - Strom s obličejem v kůře: 1. klik pootevře oči („nebuď mě“), 2. se probudí, 3. „co je?“ (fraktura)
//   — panáček ukáže sníh a strom mu v herbáři ukáže sněžnou květinu: semínka, voda, rampouch → zasadit
//   → vyroste → pyl se snáší jako sníh na hory (Daniel 2026-11-09); pak dá batoh. Když ho hráč vynechá,
//   probudí ho rána padající soušky.
K.FOREST_FADE = '#1f2a1c';
// Pozadí: dva obrázky od Daniela (2026-11-08), python tools/les_lavka.py: les.jpg (souška stojí) a
// les-po.jpg (souška leží přes mezeru), výřez soušky a záplata místa za ní. Souřadnice níže jsou změřené
// na nich. Dokud se obrázek nenačte, kreslí se zjednodušená papírová verze.
const BG = 'assets/sceny/les.jpg';
const BG_PO = 'assets/sceny/les-po.jpg';
const SNAG_IMG = 'assets/sceny/les-souska.png';
const SNAG_PATCH = 'assets/sceny/les-za-souskou.png';
const SNAG_BOX = { x: 1220, y: 0 }; // SOUSKA_BOX v tools/les_lavka.py
// maska vody v potoce (python tools/voda_les.py) — textura vody se posouvá po proudu
const WATER_MASK = 'assets/sceny/les-voda.png';
const VODA_BOX = { x: 790, y: 840, w: 410, h: 240 }; // stejný výřez jako BOX v tools/voda_les.py
const FLOW_SPEED = 32; // px/s, proud teče k divákovi (dolů)
for (const f of [BG, BG_PO, SNAG_IMG, SNAG_PATCH, WATER_MASK]) K.img(f);

const LG = 860; // chodidla na levém břehu (listí pod stromem)
const HERO_S = 1.6;
// lávka: chodidla na horní ploše kmenů (mírně klesá doprava), roztříštěný konec u TIP_X
const deckY = (x) => 576 + (x - 480) * 0.018;
const TIP_X = 985;
// z břehu na lávku po kořenech stromu
const UP = [[390, LG], [410, 760], [440, 668], [480, deckY(480)]];
const DOWN = UP.slice().reverse();
const EDGE = { x: 770, y: 890 }; // kraj potoka na levém břehu (dál panáček do ledové vody nejde)
const RAM_X = 1040; // beran leží v korytě pod mezerou, hlavou proti proudu
const RAM_BASE = 878;
// spící beran má na sobě kůži velkého balvanu z pozadí (zrcadlově), ať splyne s ostatními kameny
const RAM_SKIN = { x: 1060, y: 860, w: 245, h: 140 };
// kameny před beranem: přes jeho spodek se znovu nakreslí pozadí, ať leží za nimi
const ROCKS = [
  [[950, 935], [955, 885], [975, 870], [1010, 865], [1045, 867], [1070, 880], [1080, 910], [1078, 935]],
  [[1005, 1000], [1010, 970], [1030, 930], [1065, 895], [1100, 872], [1150, 850], [1210, 842], [1250, 847],
    [1295, 875], [1315, 910], [1330, 1000]],
];
// rampouchy pod předním kmenem lávky: iy = spodek kmene, kam kápnou (krk = probudí berana)
const ICICLES = [
  { x: 760, iy: 646, len: 80, hit: 'kamen', hy: 735 },
  { x: 830, iy: 647, len: 105, hit: 'kamen', hy: 724 },
  { x: 900, iy: 648, len: 90, hit: 'kamen', hy: 770 },
  { x: 970, iy: 649, len: 115, hit: 'roh', hy: 776 },
  { x: 1040, iy: 650, len: 80, hit: 'krk', hy: 795 },
];
// pravá opěra (do ní beran trkne) a cesta z ní po schodech nahoru ke Klínovkám
const ABUT_X = 1270;
const EXIT_PATH = [[1600, 612], [1680, 622], [1730, 585], [1770, 548], [1815, 512], [1860, 482], [2040, 440]];
const BAG = { x: 548, y: 205, hook: 132 }; // batoh visí na konci ulomené větve stromu
// obličej v kůře stromu (oči, nos, ústa; tam, kde kůra obličej sama naznačuje)
const FACE = { l: [283, 245], r: [338, 240], nose: [312, 280], mouth: [311, 320] };

// Souška: kmen nad kořenovým krčkem se otočí kolem PIV doleva a dopadne na konec lávky. Na konci leží
// jako v les-po.jpg (osa prochází bodem 1000, 507 se sklonem 0,143, je o kus delší a tlustší), pak se
// na ten obrázek prolne. A = směr kmene ve stoje (k vršku 1285, 8), B = vleže (ke špičce vlevo).
const SNAG_PIV = { x: 1414, y: 522 };
const SNAG_A = Math.atan2(8 - 522, 1285 - 1414);
const SNAG_B = Math.atan2(-0.143, -1);
const SNAG_END = { y: 507 + (1414 - 1000) * 0.143, len: 1.54, wid: 1.12 };
const STROM_RANA = 4.15; // s od začátku strom-pada.mp3 (tools/zvuky.py)
const trunkY = (x) => 490 + (x - 1050) * 0.143; // chodidla na ležícím kmeni

// větev s listím leží na lávce a listí visí přes přední kmen: stíní rampouchy
const BRANCH_C = { x: 890, y: 578 };
const LEAF_COLS = ['#8a5a2b', '#a46c33', '#6e4824', '#b5813f'];
const LEAVES = Array.from({ length: 40 }, (_, i) => {
  const droop = K.hash(i + 720); // 0 = leží nahoře, 1 = visí přes hranu
  return {
    x: 770 + (i / 39) * 245 + (K.hash(i + 700) - 0.5) * 16,
    y: 576 + droop * 92 + K.hash(i + 740) * 8,
    droop, rot: (K.hash(i + 760) - 0.5) * 2.4 + droop * 1.3, col: LEAF_COLS[i % 4], s: 0.9 + K.hash(i + 780) * 0.5,
  };
});

const shakeOf = (t0, amt) => {
  const d = K.time - (t0 ?? -9);
  return d < 0.45 ? Math.sin(d * 60) * amt * (1 - d / 0.45) : 0;
};

let st = null;
const init = () => ({
  phase: 'intro',
  hero: { x: -90, y: LG, facing: 1, walking: false, phase: 0, shivT: null, wobT: null },
  onBridge: false,
  tree: 0, treeStage: 0, stretchT: null, mouthUntil: -9, bubble: null, heroIcon: null, taken: -1, bagHang: !K.state.bag,
  // beran: moss 1 = obrostlý, stand 0–1, turn 0 = zády k nám → 1 = bokem, face 1 = hlavou doleva, −1 doprava
  moss: 1, stand: 0, turn: 0, face: -1, eyes: 0, shiver: false, ramT: null, headT: null, snoreT: null,
  ram: { x: RAM_X, dy: 0, s: 1, alpha: 1, walk: false },
  sun: 0, glintT: null,
  branch: { state: 'on', k: 0, t0: 0 },
  // souška: stand → moving → down; a = úhel osy, py = výška krčku, len/wid = protažení, after = prolnutí na les-po
  snag: { state: 'stand', a: SNAG_A, py: SNAG_PIV.y, len: 1, wid: 1, after: 0 },
  crack: 0, quakeT: null,
  drops: [], rings: [], wet: [], clumps: [], iceT: [], leaves: [], dust: [],
});

// ---------- pohyb panáčka ----------
// wood = po kořenech, lávce a spadlém kmeni: tytéž kroky, ale hlouběji a tlumeněji (jako po dřevě)
async function heroGo(pts, speed = 330, wood = false) {
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
      K.walkStep(before, h.phase, wood);
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

// po kořenech stromu na lávku a zpátky dolů
async function toBridge() {
  if (st.onBridge) return;
  await heroGo([[UP[0][0], LG]], 330);
  await heroGo(UP.slice(1), 240, true);
  st.onBridge = true;
}

async function toGround() {
  if (!st.onBridge) return;
  await heroGo([[UP[UP.length - 1][0], deckY(UP[UP.length - 1][0])]], 330, true);
  await heroGo(DOWN.slice(1), 240, true);
  st.onBridge = false;
}

const onDeck = (x) => heroGo([[x, deckY(x)]], 330, true);

// ---------- scénky ----------
async function intro() {
  K.busy++;
  await heroGo([[300, LG]], 280);
  st.phase = 'free';
  K.busy--;
}

const mouth = (sec) => { st.mouthUntil = K.time + sec; };
const PLAN_SHOW = 11; // jak dlouho je vidět herbář (jedna celá smyčka kroků, PLAN_LOOP)
function showPlan(sec) {
  st.bubble = { kind: 'herbar', t0: K.time, until: K.time + sec };
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
    await treeTalk();
  } else {
    // později jen připomene klíče
    K.sound('vrzani');
    showPlan(PLAN_SHOW);
  }
  K.busy--;
}

// 3. „co je?“ — panáček ukáže sníh — strom: mrak je zamčený, sežeň klíče — dá batoh
async function treeTalk() {
  st.treeStage = 3;
  const face = st.hero.facing;
  st.hero.facing = -1;
  K.sound('coje');
  mouth(0.9);
  st.bubble = { kind: 'coje', t0: K.time, until: K.time + 1.9 };
  await K.after(2.0);
  st.heroIcon = { icon: 'snih', until: K.time + 1.9 };
  await K.after(2.1);
  showPlan(PLAN_SHOW);
  await K.after(PLAN_SHOW);
  if (!K.state.bag) await giveBag();
  st.hero.facing = face;
}

// rána padající soušky probudí strom, pokud s ním panáček ještě nemluvil
async function treeCrash() {
  st.stretchT = K.time;
  if (st.treeStage >= 3) return;
  K.sound('vrzani');
  const from = st.tree;
  await K.tween(0.6, (t) => { st.tree = K.lerp(from, 1, t); });
  st.treeStage = 2;
  await treeTalk();
}

// batoh visí na větvi, strom ho shodí a přeletí do HUD
async function giveBag() {
  st.bagHang = false;
  const from = { x: BAG.x, y: BAG.y }, bag = K.BAG;
  const fly = { item: 'batoh', x: from.x, y: from.y, s: 90 };
  K.flyingItems.push(fly);
  await K.tween(1.2, (t) => {
    const e = K.ease(t);
    fly.x = K.lerp(from.x, bag.x, e);
    fly.y = K.lerp(from.y, bag.y, e) - Math.sin(t * Math.PI) * 140;
    fly.s = K.lerp(90, 46, e);
  });
  K.flyingItems.splice(K.flyingItems.indexOf(fly), 1);
  K.state.bag = true;
  K.bagT = K.time;
  K.bagBump = K.time;
  K.sound('odmena');
  await K.after(1.2);
}

// ledová voda: dojde ke kraji, otřese se zimou a couvne
async function toWater() {
  K.busy++;
  await toGround();
  await heroGo([[EDGE.x, EDGE.y]], 300);
  st.hero.shivT = K.time;
  K.sound('brr');
  await K.after(0.9);
  await heroGo([[EDGE.x - 70, LG]], 220);
  K.busy--;
}

// lávka končí nad potokem: dojde na roztříštěný konec, zavrávorá a vrátí se
async function toTip() {
  K.busy++;
  await toBridge();
  await onDeck(TIP_X);
  st.hero.facing = 1;
  st.hero.wobT = K.time;
  K.sound('vravorani');
  await K.after(1.1);
  await heroGo([[TIP_X - 80, deckY(TIP_X - 80)]], 200, true);
  K.busy--;
}

async function walkGround(x) {
  K.busy++;
  await toGround();
  await heroGo([[K.clamp(x, 60, EDGE.x - 30), LG]], 330);
  K.busy--;
}

async function walkDeck(x) {
  K.busy++;
  await toBridge();
  await onDeck(K.clamp(x, 490, TIP_X - 30));
  K.busy--;
}

// větev s listím stáhne z lávky do potoka; vysvitne slunce a rampouchy se zalesknou
async function pullBranch() {
  K.busy++;
  await toBridge();
  await onDeck(750);
  st.hero.facing = 1;
  await hop(740, deckY(740), 0.3, 14); // zatáhne
  K.sound('vetev');
  st.branch.state = 'fall';
  for (const l of LEAVES) {
    st.leaves.push({ x: l.x, y: l.y, rot: l.rot, col: l.col, s: l.s, vy: K.rand(150, 240), sway: K.rand(0, 6),
      floor: K.rand(860, 900), land: null });
  }
  await K.tween(0.8, (t) => { st.branch.k = t; });
  K.sound('splouchnuti');
  st.rings.push({ x: BRANCH_C.x + 30, y: 872, t: K.time });
  st.branch.state = 'float';
  st.branch.t0 = K.time;
  await K.after(0.9);
  K.sound('slunce');
  await K.tween(2.2, (t) => { st.sun = K.ease(t); });
  st.glintT = K.time; // zalesknou se všechny naráz
  await K.after(0.6);
  K.busy--;
}

async function tapIcicle(i) {
  const ic = ICICLES[i];
  K.busy++;
  await toBridge();
  const x = Math.min(ic.x, TIP_X - 10);
  await onDeck(x);
  await hop(x, deckY(x), 0.28, 22); // dupne na lávku
  st.iceT[i] = K.time;
  // utrhne se, jen když už má od stromu batoh (Daniel 2026-11-10: dřív šel vzít rampouch bez batohu)
  if (K.state.bag && !hasIcicle() && ic.hit !== 'krk') {
    await takeIcicle(i);
    K.busy--;
    return;
  }
  if (st.sun < 1) {
    // ve stínu jsou zmrzlé: zachvějí se, ale nekápnou
    K.sound('cinkani');
    K.busy--;
    return;
  }
  const y0 = ic.iy + ic.len, d = { x: ic.x, y: y0 };
  st.drops.push(d);
  triangle(); // padající kapka cinkne
  await K.tween(0.6, (t) => { d.y = K.lerp(y0, ic.hy, t * t); });
  st.drops.splice(st.drops.indexOf(d), 1);
  if (ic.hit === 'kamen') st.rings.push({ x: ic.x, y: ic.hy, t: K.time }); // cákne
  if (ic.hit === 'roh') st.headT = K.time; // ťukne o kamenný roh, beran sebou škubne
  K.busy--;
  if (ic.hit === 'krk') {
    if (st.phase === 'free') return wake();
    st.rings.push({ x: ic.x, y: 860, t: K.time }); // beran už odešel, kápne do potoka
  }
}

const hasIcicle = () => K.state.items.includes('rampouch');
// cinknutí trianglu (dvě Danielovy nahrávky, náhodně): padající kapka i utržený rampouch
const triangle = (rate = 1) => K.sound(`triangl-${1 + Math.floor(Math.random() * 2)}`, { volume: 0.6, rate: rate * K.rand(0.97, 1.03) });

// dupnutím se rampouch utrhne a panáček ho chytí do batohu
async function takeIcicle(i) {
  const ic = ICICLES[i];
  st.taken = i;
  triangle(1.12); // utržený rampouch zazvoní o kus výš než kapka
  await K.solve('rampouch', 'rampouch', { x: ic.x, y: ic.iy + ic.len / 2 });
}

function puff(x, y, n, o = {}) {
  const hh = o.h ?? 30;
  for (let i = 0; i < n; i++) {
    st.dust.push({ x: x + K.rand(-8, 8), y: y + K.rand(-hh, hh), vx: K.rand(o.vx0 ?? 30, o.vx1 ?? 220),
      vy: K.rand(-120, 40), r: K.rand(10, 24), t0: K.time, life: K.rand(0.9, 1.6), col: o.col ?? '200, 196, 186' });
  }
}

// kameny vypadlé z opěry
function chips(x0, x1, y0, y1, n, vx0, vx1) {
  for (let i = 0; i < n; i++) {
    st.clumps.push({ x: K.rand(x0, x1), y: K.rand(y0, y1), vx: K.rand(vx0, vx1), vy: K.rand(-160, 0), r: K.rand(5, 12),
      rot: K.rand(0, 6), col: '#8d877c' });
  }
}

// bod soušky (souřadnice na pozadí) → kde právě je, když se kácí
function snagPoint(x, y) {
  const S = st.snag;
  const dx = x - SNAG_PIV.x, dy = y - SNAG_PIV.y;
  const u = dx * Math.cos(-SNAG_A) - dy * Math.sin(-SNAG_A), v = dx * Math.sin(-SNAG_A) + dy * Math.cos(-SNAG_A);
  const U = u * S.len, V = v * S.wid;
  return { x: SNAG_PIV.x + U * Math.cos(S.a) - V * Math.sin(S.a), y: S.py + U * Math.sin(S.a) + V * Math.cos(S.a) };
}

// souška zavrže a praská, nakloní se a padá doleva; dopadne na konec lávky v čase rány ve zvuku
async function snagFall() {
  const S = st.snag;
  S.state = 'moving';
  K.sound('strom-pada');
  const creak = STROM_RANA - 1.0, lean = -0.07;
  await K.tween(creak, (t) => {
    S.a = SNAG_A + lean * t * t + Math.sin(t * creak * 7) * 0.012 * (0.3 + t);
  });
  const a0 = S.a;
  await K.tween(1.0, (t) => {
    const e = t * t;
    S.a = K.lerp(a0, SNAG_B, e);
    S.py = K.lerp(SNAG_PIV.y, SNAG_END.y, e);
    S.len = K.lerp(1, SNAG_END.len, e);
    S.wid = K.lerp(1, SNAG_END.wid, e);
  });
  // rána: lávka se otřese, rampouchy se rozechvějí, zvedne se prach
  S.state = 'down';
  st.quakeT = K.time;
  ICICLES.forEach((ic, i) => { st.iceT[i] = K.time; }); // rampouchy se rozechvějí
  for (let i = 0; i < 6; i++) {
    const p = snagPoint(SNAG_PIV.x + Math.cos(SNAG_A) * 90 * i, SNAG_PIV.y + Math.sin(SNAG_A) * 90 * i);
    puff(p.x, p.y, 5, { vx0: -120, vx1: 120, h: 14 });
  }
  if (st.onBridge) hop(st.hero.x, st.hero.y, 0.3, 26); // panáčka to nadhodí
  await K.tween(0.35, (t) => { S.after = t; });
}

// uražený beran se otočí zády k nám a odejde proti proudu do mlhy
async function ramLeave() {
  const r = st.ram;
  await K.tween(0.45, (t) => { st.turn = 1 - t; });
  r.walk = true;
  const x0 = r.x;
  await K.tween(3, (t) => {
    r.x = K.lerp(x0, 1150, t);
    r.dy = -150 * t - Math.abs(Math.sin(t * 18)) * 6;
    r.s = K.lerp(1, 0.42, t);
    r.alpha = K.clamp((1 - t) / 0.35);
  });
  r.walk = false;
  r.alpha = 0;
}

async function wake() {
  K.busy++;
  st.phase = 'wake';
  st.ramT = K.time;
  st.eyes = 1;
  K.sound('beran'); // probouzející se beran
  // panáček se lekne a uteče z konce lávky blíž ke stromu
  const back = onDeck(560);
  await K.after(0.7);
  // otřepe se: mech z něj odletí v chomáčcích
  K.sound('otrepani');
  st.shiver = true;
  for (let i = 0; i < 26; i++) {
    const a = K.rand(Math.PI * 1.05, Math.PI * 1.95);
    st.clumps.push({ x: RAM_X + K.rand(-130, 130), y: 825 + K.rand(-50, 10), vx: Math.cos(a) * K.rand(150, 420), vy: Math.sin(a) * K.rand(250, 520), r: K.rand(7, 16), rot: K.rand(0, 6) });
  }
  await K.tween(1.0, (t) => { st.moss = 1 - t; });
  st.shiver = false;
  await K.tween(1.0, (t) => { st.stand = K.ease(t); });
  await back;
  st.hero.facing = 1;
  await K.after(0.3);
  // otočí se bokem hlavou k pravé opěře, couvne a rozběhne se
  await K.tween(0.45, (t) => { st.turn = t; });
  const r = st.ram;
  r.walk = true;
  await K.tween(0.8, (t) => { r.x = K.lerp(RAM_X, 960, K.ease(t)); });
  r.walk = false;
  K.sound('frkani');
  st.headT = K.time;
  await K.after(0.6);
  r.walk = true;
  await K.tween(0.3, (t) => { r.x = K.lerp(960, ABUT_X - 215, t * t); });
  r.walk = false;
  // trk!
  K.sound('trknuti');
  st.quakeT = K.time;
  st.headT = K.time;
  puff(ABUT_X, 740, 20, { vx0: -240, vx1: -20 });
  chips(ABUT_X, ABUT_X + 20, 640, 790, 9, -140, -20);
  hop(st.hero.x, st.hero.y, 0.3, 26); // panáčka to nadhodí
  await K.tween(0.4, (t) => { r.x = K.lerp(ABUT_X - 215, ABUT_X - 260, K.ease(t)); });
  K.sound('praskani');
  await K.tween(0.9, (t) => { st.crack = t; });
  // z vršku opěry se sesypou kameny, souška se uvolní; uražený beran odchází
  chips(1300, 1450, 590, 610, 8, -60, 60);
  puff(1380, 600, 10, { vx0: -80, vx1: 80, h: 10 });
  const leave = ramLeave();
  await K.after(0.6);
  await snagFall();
  await K.after(0.4);
  await treeCrash();
  await leave;
  // přes mezeru už vede kmen; panáček přejde, až to hráč řekne (a má rampouch)
  st.phase = 'cross';
  K.busy--;
}

// po spadlé soušce na pravou opěru a po schodech nahoru; bez rampouchu se zastaví na konci lávky
async function crossOver() {
  K.busy++;
  await toBridge();
  await onDeck(TIP_X);
  st.hero.facing = 1;
  if (!hasIcicle()) {
    st.heroIcon = { icon: 'rampouch', until: K.time + 2.2 };
    await K.after(0.4);
    K.busy--;
    return;
  }
  st.phase = 'done';
  await hop(1050, trunkY(1050), 0.5, 50);
  await heroGo([[1320, trunkY(1320)]], 240, true);
  await hop(1500, 608, 0.6, 70); // přes vyvrácené kořeny na opěru
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
  if (!K.state.items.includes('rampouch')) K.state.items.push('rampouch');
  K.addRam(false);
};

// ---------- kresba ----------
function poly(ctx, pts, fill, lw = 5) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = lw;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
  if (lw) ctx.stroke();
}

// papírová verze, dokud se nenačte obrázek (jen tvary, bez detailů)
function drawPaper(ctx) {
  K.paper(ctx, '#dfe1d6');
  ctx.save();
  for (let i = 0; i < 16; i++) {
    const x = 380 + i * 105 + K.hash(i) * 60, w = 14 + K.hash(i + 30) * 26;
    ctx.globalAlpha = 0.12 + K.hash(i + 60) * 0.12;
    ctx.fillStyle = '#5d6355';
    ctx.fillRect(x, 0, w, 880);
  }
  ctx.restore();
  poly(ctx, [[700, 860], [1300, 850], [1300, 1090], [700, 1090]], '#56737c', 0);
  poly(ctx, [[-20, 640], [420, 620], [700, 880], [760, 1090], [-20, 1090]], '#857b5c');
  poly(ctx, [[405, 615], [700, 612], [700, 850], [405, 850]], '#857f72');
  poly(ctx, [[1270, 610], [1650, 600], [1920, 470], [1920, 1090], [1330, 1090], [1270, 1000]], '#857f72');
  poly(ctx, [[1600, 610], [1920, 470], [1920, 700], [1600, 760]], '#a39463', 3);
  poly(ctx, [[440, 560], [1040, 575], [1060, 648], [440, 640]], '#9b7d55', 4);
  ctx.strokeStyle = K.INK;
  K.stroke(ctx, [[375, 455], [870, 500], [1160, 640]], 6, 600, 1);
  // strom
  poly(ctx, [[-10, -10], [400, -10], [430, 600], [360, 650], [-10, 660]], '#8c857a');
  poly(ctx, [[400, 140], [575, 120], [580, 136], [405, 172]], '#8c857a', 4);
}

function drawRings(ctx) {
  ctx.save();
  ctx.strokeStyle = 'rgba(235, 245, 248, 0.8)';
  ctx.lineWidth = 3;
  st.rings = st.rings.filter((g) => K.time - g.t < 1.2);
  for (const g of st.rings) {
    const t = (K.time - g.t) / 1.2;
    ctx.globalAlpha = 1 - t;
    ctx.beginPath(); ctx.ellipse(g.x, g.y + 4, 6 + t * 30, 2 + t * 8, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// Tekoucí potok: voda vyříznutá maskou se posouvá dolů a dvě kopie posunuté o půl periody se
// prolínají (když jedna skočí zpět na začátek, má nulovou váhu), takže proud teče bez švu.
let flow = null;
function drawFlow(ctx, bg) {
  const mask = K.img(WATER_MASK), B = VODA_BOX;
  if (!K.ready(mask)) return;
  if (!flow) {
    flow = { tex: canvasOf(B.w, B.h), out: canvasOf(B.w, B.h) };
    const t = flow.tex.getContext('2d');
    t.drawImage(bg, B.x, B.y, B.w, B.h, 0, 0, B.w, B.h);
    t.globalCompositeOperation = 'destination-in';
    t.drawImage(mask, 0, 0);
  }
  const o = flow.out.getContext('2d');
  o.globalCompositeOperation = 'source-over';
  o.globalAlpha = 1;
  o.clearRect(0, 0, B.w, B.h);
  const P = 36, u = ((K.time * FLOW_SPEED) / P) % 1;
  o.globalCompositeOperation = 'lighter'; // váhy se sčítají na 1
  for (const [ph, w] of [[u, 1 - Math.abs(1 - 2 * u)], [(u + 0.5) % 1, Math.abs(1 - 2 * u)]]) {
    o.globalAlpha = w;
    o.drawImage(flow.tex, Math.sin(K.time * 1.7 + ph * 6) * 1.2, ph * P);
  }
  o.globalAlpha = 1;
  o.globalCompositeOperation = 'destination-in';
  o.drawImage(mask, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.drawImage(flow.out, B.x, B.y);
  ctx.restore();
}

// kameny před beranem: znovu pozadí ořízlé obrysem kamenů, beran pak leží za nimi
function drawRocksOver(ctx, bg) {
  ctx.save();
  ctx.beginPath();
  for (const r of ROCKS) r.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.clip();
  ctx.drawImage(bg, 0, 0, K.W, K.H);
  ctx.restore();
}

// souška jako samostatný dílek (výřez z pozadí) otočený kolem kořenového krčku
function drawSnag(ctx, photo) {
  const S = st.snag;
  if (S.after >= 1 && photo) return;
  const img = K.img(SNAG_IMG);
  if (photo && (S.state === 'stand' || !K.ready(img))) return; // stojí = je v pozadí
  ctx.save();
  ctx.globalAlpha *= 1 - S.after;
  ctx.translate(SNAG_PIV.x, S.py);
  ctx.rotate(S.a);
  ctx.scale(S.len, S.wid);
  ctx.rotate(-SNAG_A);
  ctx.translate(-SNAG_PIV.x, -SNAG_PIV.y);
  if (photo) ctx.drawImage(img, SNAG_BOX.x, SNAG_BOX.y);
  else poly(ctx, [[1395, 522], [1435, 522], [1300, 10], [1272, 10]], '#d9d6cf', 3);
  ctx.restore();
}

// prasklina v líci pravé opěry, kam beran trkl
function drawCrack(ctx) {
  if (st.crack <= 0) return;
  const pts = [[1290, 790], [1276, 760], [1288, 730], [1274, 700], [1286, 668], [1276, 640], [1290, 612]];
  const n = Math.max(2, Math.round(st.crack * pts.length));
  ctx.save();
  ctx.strokeStyle = K.INK;
  K.stroke(ctx, pts.slice(0, n), 4, 1010, 0.8);
  ctx.restore();
}

function drawLeaf(ctx, x, y, rot, s, col) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.fillStyle = col;
  ctx.strokeStyle = 'rgba(40, 25, 12, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-12, 0); ctx.quadraticCurveTo(0, -8, 12, 0); ctx.quadraticCurveTo(0, 8, -12, 0);
  ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke();
  ctx.restore();
}

function drawBranch(ctx) {
  const b = st.branch;
  if (b.state === 'gone') return;
  let x = 0, y = 0, a = 0, s = 1, alpha = 1;
  if (b.state === 'fall') { x = 30 * b.k; y = 290 * b.k * b.k; a = 0.5 * b.k; }
  if (b.state === 'float') {
    // odplouvá po proudu k divákovi
    const age = K.time - b.t0;
    x = 30 + age * 6; y = 290 + age * 40; a = 0.5 + age * 0.05; s = 1 + age * 0.06; alpha = K.clamp(1 - age / 4.5);
    if (alpha <= 0) return;
  }
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(BRANCH_C.x + x, BRANCH_C.y + y);
  ctx.rotate(a);
  ctx.scale(s, s);
  ctx.translate(-BRANCH_C.x, -BRANCH_C.y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const main = [[765, 580], [840, 575], [910, 578], [975, 574], [1012, 582]];
  const twigs = [[[840, 575], [862, 550]], [[910, 578], [930, 602]], [[975, 574], [995, 550]], [[875, 577], [888, 604]],
    [[800, 577], [788, 554]]];
  for (const [w, c] of [[11, K.INK], [6, '#6b5138']]) {
    ctx.strokeStyle = c;
    K.stroke(ctx, main, w, 1020, 1);
    twigs.forEach((tw, i) => K.stroke(ctx, tw, w * 0.55, 1030 + i, 0.6));
  }
  if (b.state === 'on') {
    // listí: část leží nahoře, část visí na stopkách přes přední kmen před rampouchy
    ctx.strokeStyle = 'rgba(60, 40, 22, 0.8)';
    ctx.lineWidth = 2;
    for (const l of LEAVES) {
      const sway = Math.sin(K.time * 1.3 + l.x * 0.05) * 2 * l.droop;
      if (l.droop > 0.35) { ctx.beginPath(); ctx.moveTo(l.x, 580); ctx.lineTo(l.x + sway, l.y - 6); ctx.stroke(); }
      drawLeaf(ctx, l.x + sway, l.y, l.rot, l.s, l.col);
    }
  }
  ctx.restore();
}

// paprsek: každý řádek má vodorovný přechod (měkké okraje), dolů se rozšiřuje a slábne
let sunRay = null;
function buildSunRay() {
  const W = 460, H = 900, c = canvasOf(W, H), g = c.getContext('2d');
  for (let y = 0; y < H; y++) {
    const f = y / H, half = K.lerp(140, 220, f);
    const a = Math.sin(Math.min(1, f / 0.3) * Math.PI / 2) * (1 - Math.max(0, (f - 0.75) / 0.25)) * 0.5;
    const lg = g.createLinearGradient(W / 2 - half, 0, W / 2 + half, 0);
    lg.addColorStop(0, 'rgba(255, 236, 185, 0)');
    lg.addColorStop(0.5, `rgba(255, 236, 185, ${a})`);
    lg.addColorStop(1, 'rgba(255, 236, 185, 0)');
    g.fillStyle = lg;
    g.fillRect(W / 2 - half, y, half * 2, 1);
  }
  return c;
}

// stín větve na rampouších, po stažení větve sluneční paprsek mlhou mezi smrky
const SUN_FROM = { x: 1560, y: -40 }, SUN_TO = { x: 900, y: 700 };
function drawLight(ctx) {
  const sh = 1 - st.sun;
  ctx.save();
  if (sh > 0) {
    ctx.save();
    ctx.translate(895, 690);
    ctx.scale(1.6, 1);
    const g = ctx.createRadialGradient(0, 0, 20, 0, 0, 150);
    g.addColorStop(0, `rgba(12, 18, 14, ${0.4 * sh})`);
    g.addColorStop(1, 'rgba(12, 18, 14, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(-160, -160, 320, 320);
    ctx.restore();
  }
  if (st.sun > 0) {
    if (!sunRay) sunRay = buildSunRay();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = st.sun * (1 + Math.sin(K.time * 0.7) * 0.08);
    ctx.translate(SUN_FROM.x, SUN_FROM.y);
    ctx.rotate(Math.atan2(SUN_FROM.x - SUN_TO.x, SUN_TO.y - SUN_FROM.y));
    ctx.drawImage(sunRay, -sunRay.width / 2, 0);
  }
  ctx.restore();
}

function sparkle(ctx, x, y, r) {
  if (r < 0.5) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 250, 0.95)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r);
  ctx.moveTo(x - r * 0.4, y - r * 0.4); ctx.lineTo(x + r * 0.4, y + r * 0.4);
  ctx.moveTo(x - r * 0.4, y + r * 0.4); ctx.lineTo(x + r * 0.4, y - r * 0.4);
  ctx.stroke();
  ctx.restore();
}

function drawIcicles(ctx) {
  const sun = st.sun;
  const flash = st.glintT !== null ? K.clamp(1 - (K.time - st.glintT) / 1.2) : 0;
  ICICLES.forEach((ic, i) => {
    if (i === st.taken) return;
    const x = ic.x + shakeOf(st.iceT[i], 4);
    const c = Math.round(K.lerp(196, 236, sun));
    ctx.fillStyle = `rgba(${c - 10}, ${c + 4}, ${Math.min(255, c + 16)}, 0.92)`;
    ctx.strokeStyle = '#6f8fa8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 11, ic.iy - 4); ctx.lineTo(x + 11, ic.iy - 4); ctx.lineTo(x + 1, ic.iy + ic.len); ctx.closePath();
    ctx.fill(); ctx.stroke();
    if (sun > 0) {
      // odlesk po délce a kapka, která se tvoří na špičce
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * sun})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 5, ic.iy + 2); ctx.lineTo(x - 1, ic.iy + ic.len * 0.75); ctx.stroke();
      ctx.fillStyle = `rgba(200, 228, 245, ${K.clamp(sun * 2 - 1)})`;
      ctx.beginPath(); ctx.arc(x + 1, ic.iy + ic.len + 4, 4.5, 0, Math.PI * 2); ctx.fill();
      const tw = Math.max(0, Math.sin(K.time * 2.2 + i * 1.7)) ** 14;
      sparkle(ctx, x - 2, ic.iy + ic.len * 0.4, (tw * 12 + flash * 22) * sun);
    }
  });
}

function drawDrops(ctx) {
  ctx.fillStyle = 'rgba(160, 205, 230, 0.95)';
  for (const d of st.drops) { ctx.beginPath(); ctx.ellipse(d.x, d.y, 5, 8, 0, 0, Math.PI * 2); ctx.fill(); }
}

// obličej v kůře stromu (kmen je na pozadí) a batoh na větvi
function drawTree(ctx) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // při probuzení se protáhne (zachvěje)
  ctx.translate(shakeOf(st.stretchT, 5), 0);
  const open = st.tree, blink = st.treeStage >= 2 && (K.time % 4.3) < 0.13;
  const talking = K.time < st.mouthUntil;
  const [lx, ly] = FACE.l, [rx, ry] = FACE.r;
  ctx.strokeStyle = K.INK;
  K.stroke(ctx, [[lx - 19, ly - 22], [lx, ly - 32], [lx + 18, ly - 26]], 5, 970, 1);
  K.stroke(ctx, [[rx - 18, ry - 25], [rx, ry - 34], [rx + 18, ry - 23]], 5, 971, 1);
  [FACE.l, FACE.r].forEach(([ex, ey]) => {
    if (open < 0.1 || blink) {
      K.stroke(ctx, [[ex - 13, ey], [ex, ey + 5], [ex + 13, ey]], 3.5, 972, 0.6);
      return;
    }
    ctx.fillStyle = '#f4f1ea';
    ctx.beginPath(); ctx.ellipse(ex, ey, 14, 10 * open, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3.5; ctx.stroke();
    const look = K.clamp((st.hero.x - ex) / 300, -1, 1) * 5;
    ctx.fillStyle = K.INK;
    ctx.beginPath(); ctx.arc(ex + look, ey + 2, 4.2 * open, 0, Math.PI * 2); ctx.fill();
  });
  const [mx, my] = FACE.mouth;
  const mo = talking ? 5 + Math.abs(Math.sin(K.time * 11)) * 12 : 0;
  ctx.lineWidth = 3.5;
  if (mo > 0) {
    ctx.fillStyle = '#2a211a';
    ctx.beginPath(); ctx.ellipse(mx, my, 20, mo, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else K.stroke(ctx, [[mx - 20, my - 2], [mx, my + 4], [mx + 20, my - 3]], 3.5, 975, 0.6);
  if (st.treeStage < 2 && open < 0.1) {
    // spí: z pusy stoupají „z“
    ctx.font = '600 34px Georgia, serif';
    ctx.fillStyle = '#f3e6c8';
    const z = (K.time * 0.45) % 1;
    ctx.globalAlpha = 1 - z;
    ctx.fillText('z', mx + 34 + z * 40, my - 10 - z * 90);
    ctx.globalAlpha = 1;
  }
  // batoh na větvi
  if (st.bagHang) {
    // visí za poutko na řemínku (fotka batohu, viz K.drawIcon)
    K.stroke(ctx, [[BAG.x, BAG.hook], [BAG.x, BAG.y - 38]], 3, 980, 0.6);
    K.drawIcon(ctx, 'batoh', BAG.x, BAG.y, 90);
  }
  ctx.restore();
}

// Herbář sněžné květiny (python tools/herbar.py) v kulaté bublině jako ostatní bubliny stromu. Kroky se
// střídají jeden po druhém přes celou bublinu (Daniel 2026-11-09): semínka, voda ze džbánku, rampouch,
// zasazení s klíčkem, květina roste odspodu, ze zvonku se snáší pyl jako sníh na hory.
// r = oblast kroku v px obrázku 640×640, d = jak dlouho je vidět (s).
const HERBAR = 'assets/sceny/herbar.jpg', HERBAR_FADED = 'assets/sceny/herbar-vybledly.jpg';
K.img(HERBAR);
K.img(HERBAR_FADED);
const PLAN_STEPS = [
  { d: 1.4, r: [60, 50, 160, 136] }, // semínka
  { d: 1.5, r: [88, 166, 212, 384] }, // džbánek s vodou
  { d: 1.4, r: [504, 43, 574, 245] }, // rampouch
  { d: 1.6, r: [22, 376, 212, 604] }, // zasazení, klíček
  { d: 2.6, r: [204, 33, 445, 632], grow: 1.6 }, // květina roste odspodu
  { d: 2.6, r: [452, 350, 638, 604], snow: true }, // zralý zvonek, pyl, hory
];
const PLAN_LOOP = PLAN_STEPS.reduce((sum, st0) => sum + st0.d, 0);
const PLAN_FADE = 0.35; // prolnutí mezi kroky
const PLAN_BUBBLE = { x: 800, y: 228, r: 214 };

// výřezy kroků s rozmazanými okraji (ať nejsou vidět obdélníky) a barva pergamenu na výplň bubliny
let planArt = null;
function buildPlanArt(full, faded) {
  const F = 44; // šířka rozmazaného okraje (px obrázku)
  const cut = (img, [x0, y0, x1, y1]) => {
    const w = x1 - x0, h = y1 - y0, c = canvasOf(w, h), g = c.getContext('2d');
    g.drawImage(img, x0, y0, w, h, 0, 0, w, h);
    g.globalCompositeOperation = 'destination-in';
    for (const [ax, ay, bx, by, len] of [[0, 0, w, 0, w], [0, 0, 0, h, h]]) {
      const lg = g.createLinearGradient(ax, ay, bx, by), e = Math.min(0.45, F / len);
      lg.addColorStop(0, 'rgba(0, 0, 0, 0)');
      lg.addColorStop(e, 'rgba(0, 0, 0, 1)');
      lg.addColorStop(1 - e, 'rgba(0, 0, 0, 1)');
      lg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      g.fillStyle = lg;
      g.fillRect(0, 0, w, h);
    }
    return c;
  };
  // průměrná barva vybledlého listu = pergamen
  const probe = canvasOf(16, 16), pg = probe.getContext('2d');
  pg.drawImage(faded, 0, 0, 16, 16);
  const d = pg.getImageData(0, 0, 16, 16).data, sum = [0, 0, 0];
  for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) sum[k] += d[i + k];
  planArt = {
    paper: `rgb(${sum.map((v) => Math.round(v / 256)).join(', ')})`,
    steps: PLAN_STEPS.map((st0) => cut(full, st0.r)),
  };
}

// jeden krok vycentrovaný v kruhu o poloměru 320 (k = viditelnost, u = 0–1 čas v kroku)
function drawPlanStep(ctx, i, k, u, t) {
  const step = PLAN_STEPS[i], [x0, y0, x1, y1] = step.r, w = x1 - x0, h = y1 - y0;
  const sc = Math.min(2.2, 440 / w, 500 / h);
  const dw = w * sc, dh = h * sc, dx = 320 - dw / 2, dy = 320 - dh / 2;
  ctx.save();
  ctx.globalAlpha *= k;
  if (step.grow) {
    // roste odspodu nahoru
    const top = K.lerp(dy + dh, dy, K.ease(K.clamp((u * step.d) / step.grow)));
    ctx.beginPath(); ctx.rect(dx - 10, top, dw + 20, dy + dh - top); ctx.clip();
  }
  ctx.drawImage(planArt.steps[i], dx, dy, dw, dh);
  ctx.restore();
  if (step.snow) {
    // pyl ze zvonku se snáší jako sníh k horám
    const bx = dx + (528 - x0) * sc, by = dy + (445 - y0) * sc, my = dy + (560 - y0) * sc;
    for (let j = 0; j < 16; j++) {
      const f = (t * 0.35 + j / 16) % 1;
      const fx = bx + Math.sin(j * 2.3 + t * 1.5) * (10 + f * 60), fy = by + f * (my - by);
      ctx.globalAlpha = k * Math.sin(f * Math.PI) * K.clamp(u * 3);
      K.drawIcon(ctx, 'snih', fx, fy, 14 + (j % 3) * 4, '#8fb0c8');
    }
  }
}

function drawPlan(ctx, t, a) {
  const full = K.img(HERBAR), faded = K.img(HERBAR_FADED);
  const B = PLAN_BUBBLE, ready = K.ready(full) && K.ready(faded);
  if (ready && !planArt) buildPlanArt(full, faded);
  // bublina: pergamenová výplň, obrys stejně jako ostatní bubliny
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = planArt ? planArt.paper : '#efe4c8';
  ctx.beginPath(); ctx.arc(B.x, B.y, B.r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (ready) {
    ctx.save();
    ctx.beginPath(); ctx.arc(B.x, B.y, B.r - 2, 0, Math.PI * 2); ctx.clip();
    // jemně zažloutlé okraje jako starý papír
    const g = ctx.createRadialGradient(B.x, B.y, B.r * 0.55, B.x, B.y, B.r);
    g.addColorStop(0, 'rgba(160, 120, 60, 0)');
    g.addColorStop(1, 'rgba(160, 120, 60, 0.22)');
    ctx.fillStyle = g;
    ctx.fillRect(B.x - B.r, B.y - B.r, B.r * 2, B.r * 2);
    ctx.translate(B.x, B.y);
    ctx.scale(B.r / 320, B.r / 320);
    ctx.translate(-320, -320);
    ctx.globalAlpha = a;
    // který krok právě běží; na konci se prolne do dalšího (poslední zpět do prvního)
    let start = 0, i = 0;
    while (i < PLAN_STEPS.length - 1 && t >= start + PLAN_STEPS[i].d) start += PLAN_STEPS[i++].d;
    const d = PLAN_STEPS[i].d, u = (t - start) / d, left = d - (t - start);
    const fadeOut = K.clamp(left / PLAN_FADE);
    drawPlanStep(ctx, i, fadeOut, u, t);
    if (fadeOut < 1) drawPlanStep(ctx, (i + 1) % PLAN_STEPS.length, 1 - fadeOut, 0, t);
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(B.x, B.y, B.r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// otazník stromu kreslený tahem: od kulatého horního konce dolů, pak hranatá tečka jednou zapulsuje
// (tvar podle Danielovy předlohy, souřadnice předlohy 420×630, střed tvaru ASK_C)
const ASK_PTS = [[114, 148], [104, 100], [134, 62], [200, 48], [262, 60], [300, 108], [304, 170], [283, 234],
  [248, 290], [220, 335], [207, 372], [205, 404]];
const ASK_W = [10, 12, 11, 10, 15, 24, 28, 25, 19, 15, 14, 14];   // poloviční tloušťka tahu v bodech
const ASK_BALL = { x: 123, y: 175, r: 38 }, ASK_DOT = { x: 195, y: 566, r: 47 }, ASK_C = { x: 212, y: 330 };
const ASK_S = 0.135, ASK_DRAW = [0.15, 0.75], ASK_POP = [0.8, 1.2];   // měřítko, čas tahu a tečky (s od otevření bubliny)
const ASK_LINE = (() => {
  // Catmull-Rom přes body, šířka lineárně mezi body
  const P = ASK_PTS, out = [], n = 10;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(i - 1, 0)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(i + 2, P.length - 1)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0[0], p1[0], p2[0], p3[0]), y: f(p0[1], p1[1], p2[1], p3[1]), w: ASK_W[i] + (ASK_W[i + 1] - ASK_W[i]) * t });
    }
  }
  out.push({ x: P[P.length - 1][0], y: P[P.length - 1][1], w: ASK_W[ASK_W.length - 1] });
  return out;
})();

// kreslí se na vlastní plátno plnou barvou a do bubliny se vloží jedním drawImage: překryvy
// kulatých konců úseků by se jinak při prolínání bubliny (globalAlpha < 1) sčítaly do tmavých korálků
const ASK_BOX = { x: 60, y: 20, w: 300, h: 620 }, ASK_RES = 2;   // výřez předlohy, rozlišení plátna
let askCanvas = null;
function drawAsk(ctx, cx, cy, age) {
  const ease = (u) => u * u * (3 - 2 * u);
  const p = ease(K.clamp((age - ASK_DRAW[0]) / (ASK_DRAW[1] - ASK_DRAW[0])));
  if (p <= 0) return;
  const k = ASK_S * ASK_RES;
  askCanvas ??= Object.assign(document.createElement('canvas'), { width: Math.ceil(ASK_BOX.w * k), height: Math.ceil(ASK_BOX.h * k) });
  const g = askCanvas.getContext('2d');
  g.setTransform(k, 0, 0, k, -ASK_BOX.x * k, -ASK_BOX.y * k);
  g.clearRect(ASK_BOX.x, ASK_BOX.y, ASK_BOX.w, ASK_BOX.h);
  g.fillStyle = g.strokeStyle = K.INK;
  // kulatý konec naroste jako první kápnutí pera
  const br = ASK_BALL.r * ease(K.clamp(p / 0.08));
  g.beginPath(); g.arc(ASK_BALL.x, ASK_BALL.y, br, 0, Math.PI * 2); g.fill();
  const L = ASK_LINE, end = p * (L.length - 1);
  for (let j = 1; j <= Math.ceil(end); j++) {
    const a = L[j - 1], b = L[j], u = Math.min(1, end - (j - 1));
    // spodní konec je rovně useknutý, jinak kulaté spoje
    g.lineCap = j === L.length - 1 ? 'butt' : 'round';
    g.lineWidth = 2 * (a.w + (b.w - a.w) * u);
    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u); g.stroke();
  }
  // tečka: objeví se, přeroste a usadí se (jediný pulz); časuje ji jen ASK_POP
  const q = K.clamp((age - ASK_POP[0]) / (ASK_POP[1] - ASK_POP[0]));
  if (q > 0) {
    const r = ASK_DOT.r * (q < 0.55 ? 1.35 * (1 - (1 - q / 0.55) ** 2) : 1.35 - 0.35 * ease((q - 0.55) / 0.45));
    g.beginPath();
    g.moveTo(ASK_DOT.x, ASK_DOT.y - r); g.lineTo(ASK_DOT.x + r, ASK_DOT.y);
    g.lineTo(ASK_DOT.x, ASK_DOT.y + r); g.lineTo(ASK_DOT.x - r, ASK_DOT.y);
    g.closePath(); g.fill();
  }
  ctx.drawImage(askCanvas, cx + (ASK_BOX.x - ASK_C.x) * ASK_S, cy + (ASK_BOX.y - ASK_C.y) * ASK_S,
    ASK_BOX.w * ASK_S, ASK_BOX.h * ASK_S);
}

// bubliny stromu: kreslený „?“ a herbář se sněžnou květinou
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
    circle(366, 312, 8); circle(400, 282, 13);
    circle(452, 250, 52);
    drawAsk(ctx, 452, 250, age);
    ctx.restore();
    return;
  }
  // od pusy k listu herbáře
  circle(372, 305, 8); circle(430, 284, 12); circle(505, 262, 17);
  drawPlan(ctx, age % PLAN_LOOP, a);
  ctx.restore();
}

// kamenný roh: spirála (mir = -1 zrcadlově, levý roh při pohledu zezadu)
function drawHorn(ctx, ox, oy, R, mir = 1, ink = K.INK) {
  const pts = [];
  for (let k = 0; k <= 44; k++) {
    const a = -Math.PI / 2 + k * 0.16, r = R * (1 - k / 60);
    pts.push([ox + mir * Math.cos(a) * r, oy + Math.sin(a) * r]);
  }
  for (const [w, c] of [[R * 0.48, ink], [R * 0.33, '#9a958b']]) {
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
    const w = R * 0.13 * (1 - k / 70);
    ctx.beginPath(); ctx.moveTo(x0 - (nx / l) * w, y0 - (ny / l) * w); ctx.lineTo(x0 + (nx / l) * w, y0 + (ny / l) * w); ctx.stroke();
  }
}

const woolOf = (m) => `rgb(${[214, 208, 194].map((v, i) => Math.round(K.lerp(v, [111, 127, 69][i], m))).join(', ')})`;

// beran zezadu (hlavou proti proudu); vleže hrbolatý mechový balvan, vykukují jen vršky rohů
// (souřadnice od kopyt uprostřed)
function drawRamBack(ctx, jig) {
  const sd = st.stand, m = st.moss;
  const snore = st.snoreT !== null && K.time - st.snoreT < 1.2 ? 2.5 : 1;
  const breath = (1 - sd) * Math.sin(K.time * 1.3) * 0.02 * snore;
  const cx = jig, cy = K.lerp(-43, -112, sd);
  const rx = K.lerp(135, 112, sd), ry = K.lerp(66, 74, sd) * (1 + breath);
  // nohy (při odchodu střídavě kráčí)
  if (sd > 0) {
    const step = st.ram.walk ? Math.sin(K.time * 10) * 10 : 0;
    [[-20, '#3a322b'], [20, '#3a322b'], [-50, '#4a4038'], [50, '#4a4038']].forEach(([lx, c], i) => {
      const y0 = cy + ry * 0.4, y1 = K.lerp(y0, 0, sd) - Math.max(0, i % 2 ? step : -step);
      ctx.lineWidth = 18; ctx.strokeStyle = K.INK;
      ctx.beginPath(); ctx.moveTo(cx + lx, y0); ctx.lineTo(cx + lx * 0.9, y1); ctx.stroke();
      ctx.lineWidth = 11; ctx.strokeStyle = c;
      ctx.beginPath(); ctx.moveTo(cx + lx, y0); ctx.lineTo(cx + lx * 0.9, y1); ctx.stroke();
    });
  }
  // hlava za hřbetem a rohy: vleže vykukují jen vršky, šedé jako dva oblé kamínky
  const hj = shakeOf(st.headT, 5);
  const ink = `rgba(29, 23, 18, ${K.lerp(1, 0.4, m)})`;
  const hx = cx + hj, hy = K.lerp(cy - ry * 0.72, cy - ry - 26, sd);
  ctx.fillStyle = m > 0.5 ? '#6a645a' : '#5c534a';
  ctx.strokeStyle = ink;
  ctx.lineWidth = K.lerp(5, 2.5, m);
  ctx.beginPath(); ctx.ellipse(hx, hy, 34, 28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  const R = K.lerp(30, 32, sd);
  drawHorn(ctx, hx - 42, hy - 2, R, -1, ink);
  drawHorn(ctx, hx + 42, hy - 2, R, 1, ink);
  // tělo: hrbolatý obrys se zploštělým spodkem, ať vypadá jako balvan
  const N = 36, pts = [], flat = K.lerp(0.62, 1, sd);
  for (let k = 0; k < N; k++) {
    const a = (k / N) * Math.PI * 2;
    const j = 1 + (K.hash((k >> 1) + 1200) - 0.5) * 0.14 * m + Math.abs(Math.sin(a * 6)) * 0.07 * (1 - m);
    pts.push([cx + Math.cos(a) * rx * j, cy + Math.min(Math.sin(a) * ry * j, ry * flat)]);
  }
  const body = () => {
    ctx.beginPath();
    const mid = (i) => { const [x0, y0] = pts[i % N], [x1, y1] = pts[(i + 1) % N]; return [(x0 + x1) / 2, (y0 + y1) / 2]; };
    ctx.moveTo(...mid(0));
    for (let i = 1; i <= N; i++) ctx.quadraticCurveTo(...pts[i % N], ...mid(i));
    ctx.closePath();
  };
  body();
  ctx.fillStyle = woolOf(m);
  ctx.fill();
  const bg = K.img(BG);
  ctx.save();
  body();
  ctx.clip();
  // vlna z kotrče jako u ostatních ovcí (výřez těla z dílů OV2), mech přes ni
  const fleece = K.sprite('ovceDily', 'telo');
  if (fleece) {
    const { sp, img } = fleece;
    ctx.drawImage(img, sp.w * 0.15, sp.h * 0.15, sp.w * 0.7, sp.h * 0.7, cx - rx - 12, cy - ry - 12, (rx + 12) * 2, (ry + 12) * 2);
  }
  if (m > 0 && K.ready(bg)) {
    ctx.globalAlpha *= m;
    const S = RAM_SKIN;
    ctx.scale(-1, 1);
    ctx.drawImage(bg, S.x, S.y, S.w, S.h, -cx - rx - 12, cy - ry - 12, (rx + 12) * 2, (ry + 12) * 2);
    ctx.scale(-1, 1);
    ctx.globalAlpha /= m;
  }
  // stín zespodu, ať je to oblé
  const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
  g.addColorStop(0, 'rgba(255, 255, 240, 0.08)');
  g.addColorStop(1, `rgba(20, 25, 10, ${K.lerp(0.5, 0.3, m)})`);
  ctx.fillStyle = g;
  ctx.fillRect(cx - rx - 40, cy - ry - 40, (rx + 40) * 2, (ry + 40) * 2);
  ctx.restore();
  // obrys: obrostlý jako kámen jen měkký tmavý, vlna jako ostatní ovce perem
  body();
  ctx.strokeStyle = `rgba(29, 23, 18, ${K.lerp(1, 0.25, m)})`;
  ctx.lineWidth = K.lerp(5, 2, m);
  ctx.stroke();
}

// beran bokem jako loutka z Danielových dílů (2026-11-13: tělo z kotrče, hlava s rohy, nohy tuší),
// hlavou doleva; čumák je tam, kde byl u kresleného berana (RAM_SNOUT), ať trkne do souše na stejném místě
const RAM_SIDE_S = 3.0, RAM_SNOUT = -241;
function drawRamSideSprite(ctx, jig) {
  const o = { ram: true, headUp: true, walking: st.ram.walk, phase: K.time * 12, facing: -1 };
  const head = K.sprite('ovceDily', 'hlavaBeran');
  if (!head || !K.sprite('ovceDily', 'telo')) return false;
  const s = RAM_SIDE_S * 1.15, n = K.sheepNeck(s, o);
  const snout = -(n.x + (head.sp.w - head.sp.ax) * n.k); // hlavou doleva
  K.drawSheep(ctx, jig + RAM_SNOUT - snout, 0, RAM_SIDE_S, o);
  return true;
}

// beran bokem, hlavou doleva (doprava řeší zrcadlení u volání); kreslený, dokud se nenačte obrázek
function drawRamSide(ctx, jig) {
  if (drawRamSideSprite(ctx, jig)) return;
  const cx = jig, cy = -90, rx = 175, ry = 72;
  const step = st.ram.walk ? Math.sin(K.time * 12) * 14 : 0;
  [-120, -60, 60, 120].forEach((lx, i) => {
    const fx = cx + lx + (i % 2 ? step : -step);
    ctx.lineWidth = 18; ctx.strokeStyle = K.INK;
    ctx.beginPath(); ctx.moveTo(cx + lx, cy + ry * 0.5); ctx.lineTo(fx, 0); ctx.stroke();
    ctx.lineWidth = 11; ctx.strokeStyle = '#4a4038';
    ctx.beginPath(); ctx.moveTo(cx + lx, cy + ry * 0.5); ctx.lineTo(fx, 0); ctx.stroke();
  });
  // tělo z chomáčů staré šedivé vlny
  ctx.fillStyle = woolOf(st.moss);
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
  // hlava
  const hj = shakeOf(st.headT, 5);
  const hx = cx - rx - 20 + hj, hy = cy - 45;
  ctx.fillStyle = '#5c534a';
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.ellipse(hx, hy, 46, 33, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  K.stroke(ctx, [[hx - 14, hy + 28], [hx - 18, hy + 52], [hx - 4, hy + 30]], 4, 990, 1); // vousy
  ctx.fillStyle = '#f4e9c8';
  ctx.beginPath(); ctx.ellipse(hx - 14, hy - 8, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = K.INK;
  ctx.fillRect(hx - 19, hy - 9, 10, 2.5); // vodorovná zornice
  ctx.strokeStyle = K.INK;
  K.stroke(ctx, [[hx - 26, hy - 18], [hx - 6, hy - 14]], 4, 992, 0.4); // zamračené obočí
  drawHorn(ctx, hx + 18, hy - 12, 46, 1);
}

function drawRam(ctx) {
  const r = st.ram;
  const jig = st.shiver ? Math.sin(K.time * 50) * 5 : shakeOf(st.ramT, 6);
  ctx.save();
  ctx.translate(r.x, RAM_BASE + r.dy);
  // otočení bokem = „zúžení“ na hranu a zpět; bokem hlavou doprava = zrcadlově
  const turnSq = Math.max(0.05, Math.abs(1 - 2 * st.turn));
  ctx.scale(turnSq * r.s * (st.turn >= 0.5 ? st.face : 1), r.s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (st.turn < 0.5) drawRamBack(ctx, jig);
  else drawRamSide(ctx, jig);
  ctx.restore();
}

function drawClumps(ctx) {
  ctx.save();
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 2;
  for (const c of st.clumps) {
    ctx.fillStyle = c.col ?? '#5a7a35';
    ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r, c.r * 0.7, c.rot, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

function drawParticles(ctx) {
  for (const l of st.leaves) {
    ctx.save();
    ctx.globalAlpha = l.land === null ? 1 : K.clamp(1 - (K.time - l.land) / 2);
    drawLeaf(ctx, l.x, l.y, l.rot, l.s, l.col);
    ctx.restore();
  }
  for (const d of st.dust) {
    const t = (K.time - d.t0) / d.life;
    ctx.fillStyle = `rgba(${d.col}, ${0.55 * (1 - t)})`;
    ctx.beginPath(); ctx.arc(d.x, d.y, d.r * (1 + t), 0, Math.PI * 2); ctx.fill();
  }
}

const inRam = (p) => st.stand === 0 && ((p.x - RAM_X) / 150) ** 2 + ((p.y - 830) / 75) ** 2 < 1;
const inTree = (p) => (p.x < 400 && p.y < 600) || K.dist(p, { x: 312, y: 280 }) < 130 || K.dist(p, BAG) < 60;
const inBranch = (p) => st.branch.state === 'on' && p.x > 760 && p.x < 1020 && p.y > 540 && p.y < 625;
const icicleAt = (p) => ICICLES.findIndex((ic, i) => i !== st.taken
  && Math.abs(p.x - ic.x) < 30 && p.y > ic.iy - 30 && p.y < ic.iy + ic.len + 25);
const inDeck = (p) => p.x > 430 && p.x < TIP_X + 40 && p.y > 520 && p.y < 660;
// voda a protější břeh (tam se chce dostat)
const inFar = (p) => p.x > 1080 || (p.x > 760 && p.y > 700);
const inGround = (p) => p.x < 760 && p.y > 680;

K.scenes.les = {
  get st() { return st; }, // pro testy
  enter() {
    st = init();
    flow = null;
    K.preloadSounds(['triangl-1', 'triangl-2', 'strom-pada']);
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
    if (st.branch.state === 'float' && K.time - st.branch.t0 > 4.5) st.branch.state = 'gone';
    for (const l of st.leaves) {
      if (l.land === null) {
        l.y += l.vy * dt;
        l.x += (Math.sin(K.time * 2 + l.sway) * 40 - 8) * dt;
        l.rot += Math.sin(K.time * 3 + l.sway) * 2 * dt;
        if (l.y >= l.floor) l.land = K.time;
      } else {
        l.y += 30 * dt; // po proudu
        l.x += 4 * dt;
      }
    }
    st.leaves = st.leaves.filter((l) => l.land === null || K.time - l.land < 2);
    for (const d of st.dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= 0.96; d.vy *= 0.96; }
    st.dust = st.dust.filter((d) => K.time - d.t0 < d.life);
  },
  draw(ctx) {
    const bg = K.img(BG), photo = K.ready(bg);
    ctx.save();
    if (st.quakeT !== null) {
      // otřes: obraz se trochu zvětší, ať se při posunu neukáže okraj
      ctx.translate(K.W / 2 + shakeOf(st.quakeT, 12), K.H / 2 + shakeOf(st.quakeT, 5));
      ctx.scale(1.02, 1.02);
      ctx.translate(-K.W / 2, -K.H / 2);
    }
    if (photo) {
      ctx.drawImage(bg, 0, 0, K.W, K.H);
      const S = st.snag, patch = K.img(SNAG_PATCH), po = K.img(BG_PO);
      if (S.state !== 'stand' && K.ready(patch)) ctx.drawImage(patch, SNAG_BOX.x, SNAG_BOX.y);
      if (S.after > 0 && K.ready(po)) {
        ctx.globalAlpha = S.after;
        ctx.drawImage(po, 0, 0, K.W, K.H);
        ctx.globalAlpha = 1;
      }
      drawFlow(ctx, bg);
      if (st.ram.alpha > 0) {
        K.withAlpha(ctx, st.ram.alpha, drawRam);
        drawRocksOver(ctx, bg);
      }
    } else {
      drawPaper(ctx);
      K.withAlpha(ctx, st.ram.alpha, drawRam);
    }
    drawRings(ctx);
    drawIcicles(ctx);
    drawBranch(ctx);
    drawSnag(ctx, photo);
    drawCrack(ctx);
    drawDrops(ctx);
    drawLight(ctx);
    drawTree(ctx);
    const h = st.hero;
    ctx.save();
    const shiv = h.shivT !== null && K.time - h.shivT < 0.8 ? Math.sin(K.time * 70) * 3 : 0;
    ctx.translate(h.x + shiv, h.y);
    if (h.wobT !== null && K.time - h.wobT < 1.1) {
      // vrávorá na konci lávky
      const t = (K.time - h.wobT) / 1.1;
      ctx.rotate(Math.sin(t * Math.PI * 5) * 0.22 * (1 - t));
    }
    K.drawHero(ctx, 0, 0, HERO_S, { facing: h.facing, walking: h.walking, phase: h.phase, halo: false });
    ctx.restore();
    if (st.heroIcon && K.time < st.heroIcon.until) K.drawBubble(ctx, h.x + 24, h.y - 220, 0.95, st.heroIcon.icon);
    if (st.phase === 'free' && st.treeStage === 0 && K.busy === 0) K.drawHint(ctx, FACE.nose[0], FACE.nose[1], 80);
    drawClumps(ctx);
    drawParticles(ctx);
    drawTreeBubble(ctx);
    if (K.debug) {
      ctx.strokeStyle = 'rgba(200, 0, 0, 0.7)';
      ICICLES.forEach((ic) => ctx.strokeRect(ic.x - 30, ic.iy - 30, 60, ic.len + 55));
      ctx.strokeRect(760, 540, 260, 85);
      ctx.strokeRect(430, 520, TIP_X + 40 - 430, 140);
    }
    ctx.restore();
  },
  hot(p) {
    if (st.phase !== 'free' && st.phase !== 'cross') return false;
    return inTree(p) || inBranch(p) || icicleAt(p) >= 0 || inRam(p) || inFar(p) || (!st.onBridge && inDeck(p));
  },
  click(p) {
    if (st.phase !== 'free' && st.phase !== 'cross') return;
    if (inTree(p)) return treeClick();
    if (inBranch(p)) return pullBranch();
    const i = icicleAt(p);
    if (i >= 0) return tapIcicle(i);
    if (inRam(p)) { st.snoreT = K.time; K.sound('chrapot'); return; }
    if (inDeck(p)) return walkDeck(p.x);
    if (st.phase === 'cross' && inFar(p)) return crossOver();
    if (inFar(p)) return st.onBridge ? toTip() : toWater();
    if (inGround(p)) return walkGround(p.x);
  },
};
