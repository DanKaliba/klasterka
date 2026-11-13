// Vrchol Zadní Planiny: tetřívek s ocasem z karet, oko bere a pak zasazení sněžné květiny.
// Daniel 2026-11-13: „Na vrcholu sedí tetřívek. Jeho ocas je vějíř karet. Hrdina ho musí porazit
// v jednodušší verzi hry oko bere (karty upravené na historii Krkonoš: zvířata, povolání, rostliny).
// Když ho porazí, odletí.“ Návrh a balíček: pics/podklady-vrchol/PROMPT-vrchol.md (mockup odsouhlasený).
//
// Hra (beze slov):
// - Tetřívek sedí na hrudce, kam se má zasadit květina, a toká s ocasem roztaženým jako vějíř karet.
// - Klik na tetřívka: vyzve ke hře a zobákem podá klukovi první kartu.
// - Klik na ocas = další karta. Klik na svoje karty (nebo na kluka) = „stačí“, kluk zvedne dlaň.
// - Pak táhne tetřívek, aspoň do 17; je ješitný a na 17–18 občas táhne dál (po vyhraném zápase víc).
// - Cíl: co nejblíž 21. Přes 21 rabuše (vroubkovaný klacík se součtem) praskne a kolo je prohrané.
//   Dvě esa hned na začátku = oko, okamžitá výhra. Remíza = nové kolo.
// - Vyhrané kolo kluka = kamínek na kamenného mužíka, tetřívka = vytržené pírko v trávě.
// - Kdo první vyhraje 2 kola: kluk → tetřívkovi vypadají karty z ocasu a odletí; tetřívek →
//   zatoká, kamínky i pírka zmizí a hraje se znovu (nikdy slepá ulička).
// - Pak jako dřív: na hrudku semínka, voda, rampouch → květina vyroste, rozkvete, práší → finále.
// Tetřívek je Danielův obrázek (prompt T); karty a kulisa jsou zatím papírové (prompty KA, KR v PROMPT-vrchol.md).
const VRCHOL = (() => {
const FLOWER = 'assets/sceny/kvetina.webp';
// pozadí: dočasně obloha, hřebeny a kopec jako PNG (Daniel 2026-11-13 odsouhlasil); stačí vyměnit soubor
const BG = 'assets/sceny/vrchol.png';
K.img(FLOWER);
K.img(BG);
const EXIT = { x: 90, y: 990 };
const FADE = '#efe6d2';

const HERO_Y = 1040, HERO_S = 2.4, HERO_X = 300;
const CAIRN = { x: 470, y: 640 };
const MOUND = { x: 1430, y: 676 }; // hrudka hlíny, na ní sedí tetřívek
const GROUSE = { x: 1430, y: 660 }; // tetřívek (chodidla), kouká doleva
const PLANT_X = MOUND.x - 190; // kam kluk dojde zasadit
const PLANT_H = 400;
const TABLE = { x: 1100, y: 885, rx: 540, ry: 125 }; // plochý kámen = stůl
const CARD_W = 112, CARD_H = 200; // poměr jako Danielovy karty
// obrázky karet: sada v K.SPRITY podle barvy, jméno bez diakritiky (sýkora → sykora)
const CARD_SET = { zvirata: 'kartyZvirata', rostliny: 'kartyRostlinyPovolani', povolani: 'kartyRostlinyPovolani' };
const ascii = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const HAND = { hero: { x0: 720, x1: 1010, y: 860 }, grouse: { x0: 1250, x1: 1500, y: 850 } };
const STICK = { hero: { x: 580, y: 990 }, grouse: { x: 1120, y: 990 }, len: 520 };
const TAIL = { x: GROUSE.x + 42, y: GROUSE.y - 218, r: 130 }; // vějíř ocasu (klik = karta)
const BEAK = { x: 19, y: -247 }; // karta v zobáku (póza pluck), vůči chodidlům
const WIN = 2; // vyhraná kola na výhru

// balíček: barvy jako tetřívek (černá, červená, bílá), hodnoty jako v oku bere (král 2, eso 11)
const SUITS = {
  zvirata: { col: '#1c1c22', cards: [['sýkora', 7], ['výr', 8], ['tetřev', 9], ['liška', 10], ['jelen', 2], ['medvěd', 11]] },
  rostliny: { col: '#c42020', cards: [['borůvka', 7], ['prha', 8], ['hořec', 9], ['jeřáb', 10], ['kosodřevina', 2], ['smrk', 11]] },
  povolani: { col: '#fcfcfa', light: true, cards: [['ovčák', 7], ['dřevorubec', 8], ['tkadlec', 9], ['horník', 10], ['sklář', 2], ['učitel', 11]] },
};
// Krakonoš = žolík: platí 1, nebo 11, podle toho, co se hodí (můj nápad, Daniel odsouhlasil mockup)
const fullDeck = () => [
  ...Object.entries(SUITS).flatMap(([suit, s]) => s.cards.map(([name, value]) => ({ suit, name, value }))),
  { suit: 'krakonos', name: 'Krakonoš', value: 1, joker: true },
];
// v testu (?test) náhoda se semínkem, ať se hra dá přehrát
let seed = 11;
const rnd = () => {
  if (!K.paused) return Math.random();
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function total(cards) {
  let t = 0, joker = false;
  for (const c of cards) { if (c.joker) joker = true; else t += c.value; }
  if (joker) t += t + 11 <= 21 ? 11 : 1;
  return t;
}
const isOko = (cards) => cards.length === 2 && cards.every((c) => c.value === 11 && !c.joker);

let st = null;
const init = () => ({
  phase: 'intro', // intro → idle → hero → grouse → (idle | plant) → bloom → done
  hero: { x: -80, facing: 1, walking: false, phase: 0, waveT: -9, arm: null, face: null },
  grouse: { state: 'display', x: GROUSE.x, y: GROUSE.y, rot: 0, pluckT: -9, tokT: -9, flap: 0 },
  deck: shuffle(fullDeck()), heroCards: [], grouseCards: [], flying: null,
  stick: { hero: 0, grouse: 0, heroBreakT: -9, grouseBreakT: -9 },
  score: { hero: 0, grouse: 0 }, pebbleFly: null, feathers: [], grouseMatches: 0, fallingCards: [],
  step: 0, seeds: 0, wet: 0, frost: 0, grow: 0, bloom: 0, pollen: [], snow: 0, fly: null,
});

// ---------- kluk ----------
async function heroGo(x, speed = 320) {
  const h = st.hero, x0 = h.x, d = Math.abs(x - x0);
  if (d < 1) return;
  h.facing = Math.sign(x - x0);
  h.walking = true;
  const ph0 = h.phase;
  await K.tween(d / speed, (t) => {
    const before = h.phase;
    h.x = K.lerp(x0, x, t);
    h.phase = ph0 + (d * t) / 20;
    K.walkStep(before, h.phase);
  });
  h.walking = false;
}

// ---------- karty ----------
const slot = (who, i, n) => {
  const H = HAND[who], step = n > 1 ? Math.min(120, (H.x1 - H.x0) / (n - 1)) : 0;
  return { x: H.x0 + i * step, y: H.y, rot: (i - (n - 1) / 2) * 0.05 };
};
// tetřívek vytáhne kartu z ocasu zobákem a položí ji před hráče (lícem nahoru)
async function deal(who) {
  const g = st.grouse;
  if (!st.deck.length) {
    // došly karty (skoro nemožné): dobere celý balíček kromě karet na stole
    const out = new Set([...st.heroCards, ...st.grouseCards].map((c) => c.name));
    st.deck = shuffle(fullDeck().filter((c) => !out.has(c.name)));
  }
  const card = st.deck.pop();
  g.state = 'pluck';
  g.pluckT = K.time;
  await K.after(0.35);
  K.sound('karta', { volume: 0.6, rate: K.rand(0.9, 1.1) });
  const hand = who === 'hero' ? st.heroCards : st.grouseCards;
  const to = slot(who, hand.length, hand.length + 1);
  const from = { x: g.x + BEAK.x, y: g.y + BEAK.y }; // zobák
  st.flying = { card, x: from.x, y: from.y, rot: 0.4, face: 0 };
  g.state = 'display';
  await K.tween(0.55, (t) => {
    const e = K.ease(t);
    st.flying.x = K.lerp(from.x, to.x, e);
    st.flying.y = K.lerp(from.y, to.y, e) - Math.sin(t * Math.PI) * 140;
    st.flying.rot = K.lerp(0.4, to.rot, e) + Math.sin(t * Math.PI) * 0.6;
    st.flying.face = t; // v půlce letu se otočí lícem nahoru
  });
  st.flying = null;
  hand.push(card);
  // rabuše se dovroubkuje k novému součtu
  const key = who === 'hero' ? 'hero' : 'grouse', from0 = st.stick[key], to0 = Math.min(25, total(hand));
  await K.tween(0.35, (t) => { st.stick[key] = K.lerp(from0, to0, t); });
  if (card.joker && who === 'hero') { st.grouse.tokT = K.time; K.sound('frkani', { volume: 0.6 }); } // Krakonoše se lekne
}

// ---------- kolo ----------
async function startRound() {
  K.busy++;
  st.phase = 'deal';
  const g = st.grouse;
  g.tokT = K.time;
  K.sound('tetrivek-tokani', { volume: 0.7 });
  await K.after(0.6);
  st.hero.arm = 'hold';
  await deal('hero');
  st.hero.arm = null;
  st.phase = 'hero';
  K.busy--;
}

async function heroDraw() {
  K.busy++;
  st.hero.arm = 'hold';
  await deal('hero');
  st.hero.arm = null;
  const t = total(st.heroCards);
  if (isOko(st.heroCards)) { K.busy--; return roundEnd('hero'); }
  if (t > 21) {
    st.stick.heroBreakT = K.time;
    K.sound('prasknuti');
    st.hero.face = 'startle';
    await K.after(1.0);
    st.hero.face = null;
    K.busy--;
    return roundEnd('grouse');
  }
  K.busy--;
}

// kluk zvedne dlaň: „stačí“ → hraje tetřívek
async function heroStand() {
  K.busy++;
  st.phase = 'grouse';
  st.hero.waveT = K.time;
  await K.after(0.7);
  const g = st.grouse;
  // aspoň do 17; na 17–18 ho ješitnost láká táhnout dál, po vyhraném zápase ještě víc
  const greed = 0.3 + 0.2 * Math.min(2, st.grouseMatches);
  for (;;) {
    const t = total(st.grouseCards);
    if (isOko(st.grouseCards)) break;
    if (t >= 19 || (t >= 17 && rnd() > greed)) break;
    await deal('grouse');
    await K.after(0.35);
    if (total(st.grouseCards) > 21) {
      st.stick.grouseBreakT = K.time;
      K.sound('prasknuti');
      g.state = 'sulk';
      await K.after(1.0);
      break;
    }
  }
  K.busy--;
  const h = total(st.heroCards), gt = total(st.grouseCards);
  if (isOko(st.grouseCards) || (gt <= 21 && gt > h)) return roundEnd('grouse');
  if (gt > 21 || h > gt) return roundEnd('hero');
  return roundEnd(null); // remíza
}

async function roundEnd(winner) {
  K.busy++;
  st.phase = 'end';
  const g = st.grouse, h = st.hero;
  if (winner === 'hero') {
    // kamínek na kamenného mužíka
    h.waveT = K.time;
    g.state = 'sulk';
    K.sound('frkani', { volume: 0.5 });
    const top = pebbleAt(st.score.hero);
    const from = { x: h.x + 30, y: HERO_Y - 160 };
    st.pebbleFly = { x: from.x, y: from.y };
    await K.tween(0.7, (t) => {
      st.pebbleFly.x = K.lerp(from.x, top.x, K.ease(t));
      st.pebbleFly.y = K.lerp(from.y, top.y, K.ease(t)) - Math.sin(t * Math.PI) * 120;
    });
    st.pebbleFly = null;
    st.score.hero++;
    K.sound('kaminek');
  } else if (winner === 'grouse') {
    // tetřívek si vytrhne pírko a pyšně ho odhodí do trávy
    g.state = 'display';
    g.tokT = K.time;
    K.sound('tetrivek-tokani', { volume: 0.8 });
    await K.after(0.4);
    st.feathers.push({ x: GROUSE.x + 150 + st.score.grouse * 46, y: GROUSE.y + 40, t0: K.time });
    K.sound('sustot', { volume: 0.4 });
    st.score.grouse++;
  }
  await K.after(1.2);
  // karty zpátky do ocasu, rabuše znovu celé
  await gatherCards();
  g.state = 'display';
  if (st.score.hero >= WIN) { K.busy--; return grouseDefeat(); }
  if (st.score.grouse >= WIN) {
    // tetřívek vyhrál zápas: zatoká, kamínky a pírka zmizí, hraje se znovu
    g.tokT = K.time;
    K.sound('tetrivek-tokani');
    await K.after(1.0);
    st.score = { hero: 0, grouse: 0 };
    st.feathers = [];
    st.grouseMatches++;
    st.phase = 'idle';
    K.busy--;
    return;
  }
  K.busy--;
  await startRound();
}

async function gatherCards() {
  const all = [...st.heroCards, ...st.grouseCards];
  const fromH = st.heroCards.map((c, i) => ({ c, ...slot('hero', i, st.heroCards.length) }));
  const fromG = st.grouseCards.map((c, i) => ({ c, ...slot('grouse', i, st.grouseCards.length) }));
  st.gather = [...fromH, ...fromG].map((f) => ({ ...f, x0: f.x, y0: f.y }));
  st.heroCards = [];
  st.grouseCards = [];
  K.sound('karta', { volume: 0.5, rate: 0.8 });
  const s0 = { ...st.stick };
  await K.tween(0.7, (t) => {
    const e = K.ease(t);
    for (const f of st.gather) {
      f.x = K.lerp(f.x0, TAIL.x, e);
      f.y = K.lerp(f.y0, TAIL.y, e) - Math.sin(t * Math.PI) * 80;
      f.s = 1 - 0.5 * e;
    }
    st.stick.hero = s0.hero * (1 - e);
    st.stick.grouse = s0.grouse * (1 - e);
  });
  st.gather = null;
  st.stick = { hero: 0, grouse: 0, heroBreakT: -9, grouseBreakT: -9 };
  st.deck = shuffle([...st.deck, ...all]); // zastrčí je zpátky do ocasu a zamíchá
}

// prohrál: karty mu vypadají z ocasu a odletí
async function grouseDefeat() {
  K.busy++;
  const g = st.grouse;
  g.state = 'sulk';
  K.sound('frkani');
  // karty se rozletí do trávy kolem hrudky a pomalu zmizí (vítr je odnese)
  st.fallingCards = Array.from({ length: 9 }, (_, i) => ({
    x: TAIL.x + K.rand(-90, 90), y: TAIL.y + K.rand(-60, 40), vx: K.rand(-260, 260), vy: K.rand(-160, -40),
    rot: K.rand(-1, 1), vr: K.rand(-3, 3), t0: K.time + i * 0.06, ground: MOUND.y + K.rand(50, 160),
  }));
  st.deck = [];
  await K.after(1.6);
  g.state = 'fly';
  K.sound('tetrivek');
  const x0 = g.x, y0 = g.y;
  await K.tween(2.2, (t) => {
    g.x = K.lerp(x0, -200, t);
    g.y = K.lerp(y0, 80, K.ease(t)) - Math.sin(t * Math.PI) * 120;
    g.flap = t;
  });
  g.state = 'gone';
  st.phase = 'plant';
  await heroGo(PLANT_X, 300);
  st.hero.facing = 1;
  K.busy--;
}

const pebbleAt = (i) => ({ x: CAIRN.x + (i % 2 ? 6 : -4), y: CAIRN.y - 160 - i * 22 });

// ---------- zasazení květiny (jako dřív) ----------
async function plantStep() {
  K.busy++;
  const item = K.ITEMS[st.step], from = K.slotPos(K.ITEMS.indexOf(item));
  st.fly = { item, x: from.x, y: from.y };
  await K.tween(0.9, (t) => {
    const e = K.ease(t);
    st.fly.x = K.lerp(from.x, MOUND.x, e);
    st.fly.y = K.lerp(from.y, MOUND.y - 40, e) - Math.sin(t * Math.PI) * 120;
  });
  st.fly = null;
  st.step++;
  if (item === 'semena') {
    K.sound('sustot');
    await K.tween(0.5, (t) => { st.seeds = t; });
  } else if (item === 'voda') {
    K.sound('voda');
    await K.tween(1.0, (t) => { st.wet = t; });
  } else {
    K.sound('cinkani');
    await K.tween(0.8, (t) => { st.frost = t; });
    await bloom();
  }
  K.busy--;
}
// vyroste, rozkvete, práší jako sníh → finále
async function bloom() {
  st.phase = 'bloom';
  await K.after(0.4);
  K.sound('chorose');
  await K.tween(3.2, (t) => { st.grow = t; });
  K.sound('slunce');
  st.hero.waveT = K.time + 99; // mává až do konce
  await K.tween(1.2, (t) => { st.bloom = t; });
  await K.after(1.5);
  K.sound('vitr');
  await K.tween(2.5, (t) => { st.snow = t; });
  st.phase = 'done';
  await K.fadeTo(1, 1.5, '#000');
  K.go('finale');
}

// ---------- kresba ----------
const flakes = Array.from({ length: 160 }, () => ({ x: Math.random() * K.W, y: Math.random() * K.H, z: Math.random() }));

function drawScenery(ctx) {
  const bg = K.img(BG);
  if (K.ready(bg)) { ctx.drawImage(bg, 0, 0, K.W, K.H); return; }
  // obloha, hřebeny v dálce, vrchol s trávou (stejné jako vrchol.png, dokud se nenačte)
  const sky = ctx.createLinearGradient(0, 0, 0, 600);
  sky.addColorStop(0, '#d6dee2');
  sky.addColorStop(1, '#ece6d6');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, K.W, K.H);
  const ridge = (base, amp, f1, f2, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, K.H);
    for (let x = 0; x <= K.W + 40; x += 40) ctx.lineTo(x, base - amp * Math.sin(x / f1) - amp * 0.5 * Math.sin(x / f2));
    ctx.lineTo(K.W, K.H);
    ctx.closePath();
    ctx.fill();
  };
  ridge(470, 40, 210, 77, '#aab4ba');
  ridge(545, 30, 300, 140, '#8c968c');
  ctx.fillStyle = '#b8a878';
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, K.H); ctx.lineTo(0, 700); ctx.lineTo(500, 620); ctx.lineTo(1100, 590); ctx.lineTo(1600, 640); ctx.lineTo(K.W, 700); ctx.lineTo(K.W, K.H);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawCairn(ctx) {
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 3;
  ctx.fillStyle = '#96928a';
  for (const [dx, dy, r] of [[0, 0, 62], [2, -60, 46], [-2, -104, 34], [0, -136, 24]]) {
    ctx.beginPath(); ctx.ellipse(CAIRN.x + dx, CAIRN.y + dy, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  // kamínky za vyhraná kola
  ctx.fillStyle = '#ded6c4';
  for (let i = 0; i < st.score.hero; i++) {
    const p = pebbleAt(i);
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 17, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  if (st.pebbleFly) { ctx.beginPath(); ctx.ellipse(st.pebbleFly.x, st.pebbleFly.y, 17, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
}

function drawMound(ctx) {
  const wet = st.wet;
  ctx.fillStyle = `rgb(${Math.round(K.lerp(122, 78, wet))}, ${Math.round(K.lerp(96, 62, wet))}, ${Math.round(K.lerp(70, 46, wet))})`;
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(MOUND.x, MOUND.y, 110, 30, 0, Math.PI, 0); ctx.lineTo(MOUND.x + 110, MOUND.y + 8);
  ctx.lineTo(MOUND.x - 110, MOUND.y + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (st.seeds > 0 && st.grow < 0.2) {
    ctx.fillStyle = '#f2ece0';
    ctx.globalAlpha = st.seeds;
    [[-30, -12], [6, -20], [34, -10]].forEach(([dx, dy]) => {
      ctx.beginPath(); ctx.ellipse(MOUND.x + dx, MOUND.y + dy, 7, 4.5, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }
  if (st.frost > 0) {
    ctx.strokeStyle = `rgba(235, 245, 252, ${0.9 * st.frost})`;
    ctx.lineWidth = 3;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(MOUND.x + Math.cos(a) * 60, MOUND.y + Math.sin(a) * 16);
      ctx.lineTo(MOUND.x + Math.cos(a) * 110, MOUND.y + Math.sin(a) * 34);
      ctx.stroke();
    }
  }
}

// papírová karta: s = měřítko, face 0 = rub, 1 = líc (v letu se otáčí přes hranu)
function drawCard(ctx, card, x, y, rot = 0, face = 1, s = 1) {
  const w = CARD_W, h = CARD_H, flip = Math.abs(Math.cos(face * Math.PI)); // 1 → 0 → 1
  const showFace = face > 0.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s * Math.max(0.04, flip), s);
  ctx.fillStyle = '#fffcf4'; // papírový okraj
  ctx.beginPath(); ctx.roundRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10, 14); ctx.fill();
  ctx.fillStyle = '#ece2cc';
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 11); ctx.fill(); ctx.stroke();
  if (!showFace) {
    const rub = K.sprite('vrcholVeci', 'rub'); // rub z Danielova obrázku (prompt KR): čtyři tetřívčí pera
    if (rub) { ctx.drawImage(rub.img, -w / 2, -h / 2, w, h); ctx.restore(); return; }
    // rub: kreslená tetřívčí pera na krémovém papíře (dokud se nenačte obrázek)
    ctx.strokeStyle = '#5a5248';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
      const px = -w / 2 + 22 + j * 34 + (i % 2) * 14, py = -h / 2 + 22 + i * 31;
      if (px > w / 2 - 14) continue;
      ctx.beginPath(); ctx.ellipse(px, py, 7, 13, 0.25, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px - 3, py + 13); ctx.lineTo(px + 3, py - 13); ctx.stroke();
    }
    ctx.restore();
    return;
  }
  const S = SUITS[card.suit], col = S ? S.col : '#7a5a2a', light = S && S.light;
  // hodnota = puntíky v rozích (v barvě barvy, přes vygumované puntíky z obrázku)
  const pips = (cx, cy, n) => {
    const cols = n > 4 ? 3 : 2, rows = Math.ceil(n / cols), r = 3.8;
    for (let i = 0; i < n; i++) {
      const px = cx + ((i % cols) - (cols - 1) / 2) * r * 2.6, py = cy + (Math.floor(i / cols) - (rows - 1) / 2) * r * 2.6;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
      if (light) { ctx.strokeStyle = K.INK; ctx.lineWidth = 1; ctx.stroke(); }
    }
  };
  // obrázek karty (Daniel 2026-11-13, prompt KA, python tools/sprity.py; puntíky z obrázku jsou vygumované)
  const spr = K.sprite(CARD_SET[card.suit], ascii(card.name));
  if (spr) {
    ctx.drawImage(spr.img, -w / 2, -h / 2, w, h);
    pips(-w / 2 + 21, -h / 2 + 27, card.value);
    pips(w / 2 - 21, h / 2 - 27, card.value);
    ctx.restore();
    return;
  }
  ctx.strokeStyle = light ? K.INK : col;
  ctx.lineWidth = light ? 4 : 2;
  ctx.beginPath(); ctx.roundRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 8); ctx.stroke();
  if (light) { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke(); }
  pips(-w / 2 + 22, -h / 2 + 26, card.value);
  pips(w / 2 - 22, h / 2 - 26, card.value);
  // bez obrázku (Krakonoš, nebo dokud se nenačte): ovál a jméno
  ctx.fillStyle = '#d6ccb6';
  ctx.strokeStyle = '#786e5f';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(0, 6, w * 0.36, h * 0.27, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = K.INK;
  ctx.font = `bold ${card.name.length > 8 ? 14 : 18}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(card.name, 0, 6);
  if (card.value === 2) {
    // korunka krále
    ctx.fillStyle = col;
    ctx.strokeStyle = K.INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    [[-14, -38], [-14, -50], [-7, -44], [0, -54], [7, -44], [14, -50], [14, -38]].forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

function drawHands(ctx) {
  const hover = K.mouse && st.phase === 'hero' && K.busy === 0 && inHand(K.mouse);
  st.heroCards.forEach((c, i, a) => {
    const p = slot('hero', i, a.length);
    drawCard(ctx, c, p.x, p.y - (hover ? 10 : 0), p.rot);
  });
  st.grouseCards.forEach((c, i, a) => { const p = slot('grouse', i, a.length); drawCard(ctx, c, p.x, p.y, p.rot); });
  if (st.gather) for (const f of st.gather) drawCard(ctx, f.c, f.x, f.y, f.rot, 1, f.s);
  if (st.flying) { const f = st.flying; drawCard(ctx, f.card, f.x, f.y, f.rot, f.face, 0.85 + 0.15 * f.face); }
}

// rabuše: vroubkovaný klacík, vybarvené vruby = součet karet; přes 21 praskne
function drawStick(ctx, who) {
  const S = STICK[who], n = st.stick[who], br = K.time - st.stick[who === 'hero' ? 'heroBreakT' : 'grouseBreakT'];
  const len = STICK.len, step = (len - 30) / 21;
  const broken = br >= 0 && br < 99 && n > 21;
  const spr = K.sprite('vrcholVeci', 'rabuse');
  if (spr) return drawStickSprite(ctx, who, spr, n, broken, br);
  const half = (x0, x1, rot) => {
    ctx.save();
    ctx.translate(S.x + (x0 + x1) / 2, S.y + 13);
    ctx.rotate(rot);
    ctx.translate(-(x0 + x1) / 2, -13);
    ctx.fillStyle = '#b08e60';
    ctx.strokeStyle = K.INK;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x0, 0, x1 - x0, 26, 12); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 21; i++) {
      const nx = 15 + step * (i + 0.5);
      if (nx < x0 || nx > x1) continue;
      if (i < Math.floor(n + 0.001)) {
        ctx.fillStyle = who === 'hero' ? '#c47828' : '#46464f';
        ctx.fillRect(nx - step / 2 + 2, 4, step - 4, 18);
      }
      const deep = (i + 1) % 7 === 0;
      ctx.beginPath(); ctx.moveTo(nx, 0); ctx.lineTo(nx, deep ? 14 : 9); ctx.lineWidth = deep ? 3 : 2; ctx.stroke();
    }
    ctx.restore();
  };
  if (!broken) return half(0, len, 0);
  const a = Math.min(1, br * 4) * 0.25;
  half(0, len / 2, -a);
  half(len / 2, len, a);
}

// rabuše z Danielova obrázku (prompt KR): opravdový klacík s 25 zářezy (změřené v tools/sprity.py).
// Zářezy se podle součtu vybarví; 21. zářez má červenou rysku (hranice), přes 21 klacík praskne vejpůl.
function drawStickSprite(ctx, who, { sp, img }, n, broken, br) {
  const S = STICK[who], len = STICK.len, h = (len * sp.h) / sp.w;
  const fill = who === 'hero' ? 'rgba(196, 70, 30, 0.9)' : 'rgba(34, 34, 44, 0.9)';
  const nw = len * 0.012, nh = h * 0.32;
  const half = (f0, f1, rot) => {
    const cx = S.x + (len * (f0 + f1)) / 2, cy = S.y + h / 2;
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(rot); ctx.translate(-cx, -cy);
    ctx.beginPath(); ctx.rect(S.x + len * f0, S.y - 10, len * (f1 - f0), h + 20); ctx.clip();
    ctx.drawImage(img, S.x, S.y, len, h);
    sp.notches.forEach((f, i) => {
      const x = S.x + f * len;
      if (i < Math.floor(n + 0.001)) {
        ctx.fillStyle = fill;
        ctx.beginPath(); ctx.roundRect(x - nw / 2, S.y + 2, nw, nh, 2); ctx.fill();
      }
      if (i === 20) {
        ctx.strokeStyle = '#c42020';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, S.y + nh + 4); ctx.lineTo(x, S.y + h - 5); ctx.stroke();
      }
    });
    ctx.restore();
  };
  if (!broken) return half(0, 1, 0);
  const a = Math.min(1, br * 4) * 0.25;
  half(0, 0.5, -a);
  half(0.5, 1, a);
}

// tetřívek z Danielova obrázku (2026-11-13, prompt T, python tools/sprity.py): pózy sit / display / pluck /
// sulk / fly, všechny koukají doleva, kotva = pařáty. Před hrou sedí a občas zatoká (vějíř), ve hře toká.
function drawGrouseSprite(ctx) {
  const g = st.grouse;
  const tok = Math.max(0, 1 - (K.time - g.tokT) / 1.2);
  let pose = g.state === 'pluck' && K.time - g.pluckT < 0.5 ? 'pluck' : g.state === 'sulk' ? 'sulk' : g.state === 'fly' ? 'fly' : 'display';
  if (pose === 'display' && st.phase === 'idle' && tok <= 0) pose = 'sit';
  const spr = K.sprite('tetrivek', pose);
  if (!spr) return false;
  const { sp, img } = spr;
  ctx.save();
  ctx.translate(g.x, g.y + (pose === 'fly' ? Math.sin(K.time * 14) * 8 : 0));
  // tokání: nafoukne se a zachvěje; poražený se třese
  const puff = 1 + 0.05 * tok, shake = pose === 'sulk' ? Math.sin(K.time * 40) * 1.5 : 0;
  ctx.translate(shake, 0);
  ctx.scale(puff * (sp.right ? -1 : 1), puff);
  ctx.drawImage(img, -sp.ax, -sp.ay);
  ctx.restore();
  return true;
}

// tetřívek z papíru (dokud se nenačte obrázek): kouká doleva, chodidla v (x, y)
function drawGrouse(ctx) {
  const g = st.grouse;
  if (g.state === 'gone') return;
  if (drawGrouseSprite(ctx)) return;
  const tok = Math.max(0, 1 - (K.time - g.tokT) / 1.2); // tokání: nafoukne krk, zachvěje ocasem
  const sulk = g.state === 'sulk', fly = g.state === 'fly', pluck = g.state === 'pluck' && K.time - g.pluckT < 0.5;
  const nCards = fly ? 0 : g.state === 'sulk' && st.fallingCards.length ? 3 : Math.max(3, Math.round(9 * Math.min(1, st.deck.length / 12)));
  ctx.save();
  ctx.translate(g.x, g.y);
  if (fly) ctx.rotate(-0.15);
  const puff = 1 + 0.08 * tok + (sulk ? 0.06 : 0);
  ctx.scale(puff, puff);
  ctx.lineJoin = 'round';
  // ocas: vějíř karet rubem ven
  if (nCards) {
    const spread = sulk ? 0.5 : 1;
    for (let i = 0; i < nCards; i++) {
      const u = nCards > 1 ? i / (nCards - 1) : 0.5;
      const a = (-1.2 + 2.4 * u) * spread + Math.sin(K.time * 30) * 0.02 * tok + (sulk ? 0.5 : 0);
      const r = 120;
      drawCard(ctx, null, 70 + Math.sin(a) * r, -95 - Math.cos(a) * r * (sulk ? 0.7 : 1), a, 0, 0.6);
    }
  }
  ctx.strokeStyle = '#fbf8f0';
  ctx.lineWidth = 10;
  const body = () => { ctx.beginPath(); ctx.ellipse(10, -65 + (sulk ? 6 : 0), 105, sulk ? 66 : 58, 0, 0, Math.PI * 2); };
  body(); ctx.stroke(); // papírový okraj
  ctx.fillStyle = '#1d1f27';
  body(); ctx.fill();
  ctx.strokeStyle = K.INK; ctx.lineWidth = 3; body(); ctx.stroke();
  // bílé peří pod ocasem a bílá páska na křídle
  ctx.fillStyle = '#f6f4ee';
  ctx.beginPath(); ctx.ellipse(70, -40, 40, 22, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f6f4ee'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(-30, -60); ctx.lineTo(60, -54); ctx.stroke();
  if (fly) {
    // křídla mávají
    const w = Math.sin(g.flap * 40) * 0.6;
    ctx.fillStyle = '#1d1f27';
    ctx.strokeStyle = K.INK; ctx.lineWidth = 3;
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(-10, -80); ctx.lineTo(-60 + side * 20, -80 - 120 * (0.5 + w * side * 0.5)); ctx.lineTo(60, -90); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  } else {
    // svěšená křídla při tokání, nohy
    ctx.strokeStyle = K.INK; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-20, -12); ctx.lineTo(-24, 0); ctx.moveTo(30, -12); ctx.lineTo(30, 0); ctx.stroke();
  }
  // krk a hlava: tokání = hlava dopředu a níž, tahání karty = hlava otočená k ocasu
  const hx = pluck ? 60 : -100 - 14 * tok, hy = pluck ? -150 : sulk ? -100 : -120 + 14 * tok;
  ctx.fillStyle = '#1d1f27';
  ctx.strokeStyle = '#fbf8f0'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.ellipse(hx, hy, 34 + 10 * tok, 32 + 6 * tok, 0, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
  ctx.strokeStyle = K.INK; ctx.lineWidth = 3; ctx.stroke();
  const dir = pluck ? 1 : -1;
  ctx.fillStyle = '#4a4038';
  ctx.beginPath(); ctx.moveTo(hx + dir * 28, hy - 2); ctx.lineTo(hx + dir * 52, hy + 6); ctx.lineTo(hx + dir * 28, hy + 12); ctx.closePath(); ctx.fill(); ctx.stroke();
  // červená růže nad okem (jediná barva) a oko
  ctx.fillStyle = '#c42020';
  ctx.beginPath(); ctx.ellipse(hx + dir * 6, hy - 18, 18 + 6 * tok, 9 + 3 * tok, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = sulk ? '#1d1f27' : '#f0d070';
  ctx.beginPath(); ctx.arc(hx + dir * 10, hy - 4, 5, 0, Math.PI * 2); ctx.fill();
  if (pluck) drawCard(ctx, null, hx + 60, hy + 10, 0.8, 0, 0.45); // karta v zobáku
  ctx.restore();
}

function drawFeathers(ctx) {
  for (const f of st.feathers) {
    ctx.save();
    ctx.translate(f.x, f.y - Math.max(0, 1 - (K.time - f.t0)) * 60);
    ctx.rotate(-0.3);
    ctx.fillStyle = '#1d1f27';
    ctx.strokeStyle = K.INK;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-20, 3); ctx.lineTo(20, -2); ctx.stroke();
    ctx.restore();
  }
}

function drawFalling(ctx) {
  for (const c of st.fallingCards) {
    const t = K.time - c.t0;
    if (t < 0 || t > 5) continue;
    const y = Math.min(c.ground, c.y + c.vy * t + 300 * t * t);
    ctx.globalAlpha = Math.min(1, (5 - t) / 1.5);
    drawCard(ctx, null, c.x + c.vx * Math.min(t, 1.4), y, c.rot + c.vr * Math.min(t, 1.2), 0, 0.6);
    ctx.globalAlpha = 1;
  }
}

function drawFlower(ctx) {
  const img = K.img(FLOWER);
  if (st.grow > 0 && K.ready(img)) {
    const s = (PLANT_H / img.height) * K.lerp(0.12, 1, K.ease(st.grow));
    ctx.save();
    ctx.translate(MOUND.x, MOUND.y + 14);
    ctx.scale(s, s);
    ctx.drawImage(img, -img.width / 2, -img.height);
    ctx.restore();
    if (st.bloom > 0) {
      const g = ctx.createRadialGradient(MOUND.x, MOUND.y - PLANT_H * 0.7, 10, MOUND.x, MOUND.y - PLANT_H * 0.7, 220);
      g.addColorStop(0, `rgba(235, 245, 255, ${0.45 * st.bloom})`);
      g.addColorStop(1, 'rgba(235, 245, 255, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(MOUND.x - 240, MOUND.y - PLANT_H - 120, 480, PLANT_H + 160);
    }
  }
  for (const p of st.pollen) {
    const a = Math.sin(((K.time - p.t0) / p.life) * Math.PI);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * a})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------- klikání ----------
const inHand = (p) => {
  const n = st.heroCards.length;
  if (!n) return false;
  const a = slot('hero', 0, n), b = slot('hero', n - 1, n);
  return p.x > a.x - CARD_W / 2 && p.x < b.x + CARD_W / 2 && Math.abs(p.y - HAND.hero.y) < CARD_H / 2 + 10;
};
const inHero = (p) => Math.abs(p.x - st.hero.x) < 80 && p.y < HERO_Y && p.y > HERO_Y - 150 * HERO_S;
const inTail = (p) => K.dist(p, TAIL) < TAIL.r;
const inGrouse = (p) => inTail(p) || K.dist(p, { x: GROUSE.x - 20, y: GROUSE.y - 150 }) < 130;
const canExit = () => ['idle', 'plant'].includes(st.phase) && st.step === 0;

const scene = {
  get st() { return st; }, // pro testy
  total, // pro testy (hráčova strategie)
  enter() {
    // rozehraná hra zůstane (kluk si může dojít na louku a vrátit se), po finále začne znovu
    if (!st || st.phase === 'done') st = init();
    K.preloadSounds(['karta', 'prasknuti', 'kaminek', 'tetrivek-tokani', 'frkani', 'tetrivek', 'sustot']);
    K.fade.a = 1;
    K.fadeTo(0, 0.6, FADE);
    if (st.phase === 'intro' || st.phase === 'idle') {
      st.hero.x = -80;
      K.busy++;
      heroGo(HERO_X, 300).then(() => { st.hero.facing = 1; st.phase = 'idle'; K.busy--; });
    }
  },
  update(dt) {
    for (const p of st.pollen) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx += 6 * dt; p.vy -= 4 * dt; }
    st.pollen = st.pollen.filter((p) => K.time - p.t0 < p.life);
    if (st.bloom >= 1 && st.phase !== 'done') {
      for (let i = 0; i < 3; i++) {
        const y = MOUND.y - PLANT_H * K.rand(0.45, 0.95);
        st.pollen.push({ x: MOUND.x + K.rand(-40, 40), y, vx: K.rand(20, 120), vy: K.rand(-90, -20), t0: K.time, life: K.rand(2, 4), r: K.rand(1.5, 4) });
      }
    }
    // nečinný tetřívek občas zatoká (zve ke hře)
    if (st.phase === 'idle' && K.busy === 0 && K.time - st.grouse.tokT > 4) st.grouse.tokT = K.time;
    if (st.snow > 0) {
      for (const f of flakes) {
        f.y += (60 + f.z * 160) * dt;
        f.x += Math.sin(K.time + f.z * 9) * 20 * dt;
        if (f.y > K.H) { f.y = -10; f.x = Math.random() * K.W; }
      }
    }
  },
  draw(ctx) {
    drawScenery(ctx);
    drawCairn(ctx);
    drawMound(ctx);
    drawFlower(ctx);
    drawGrouse(ctx);
    drawFalling(ctx);
    drawFeathers(ctx);
    if (st.grouse.state !== 'gone' || st.heroCards.length) {
      // kamenný stůl a rabuše jen během hry
      ctx.fillStyle = '#9e9a92';
      ctx.strokeStyle = K.INK;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(TABLE.x, TABLE.y, TABLE.rx, TABLE.ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#aaa69e';
      ctx.beginPath(); ctx.ellipse(TABLE.x, TABLE.y - 10, TABLE.rx - 40, TABLE.ry - 30, 0, 0, Math.PI * 2); ctx.fill();
      drawStick(ctx, 'hero');
      drawStick(ctx, 'grouse');
    }
    drawHands(ctx);
    const h = st.hero;
    K.drawHero(ctx, h.x, HERO_Y, HERO_S, { facing: h.facing, walking: h.walking, phase: h.phase, halo: false,
      wave: K.time - h.waveT < 0.9 || h.waveT > K.time, arm: h.arm, face: h.face });
    if (st.fly) K.drawIcon(ctx, st.fly.item, st.fly.x, st.fly.y, 46);
    if (st.snow > 0) {
      ctx.fillStyle = '#fff';
      for (const f of flakes) {
        ctx.globalAlpha = st.snow * 0.9;
        ctx.beginPath(); ctx.arc(f.x, f.y, 2 + f.z * 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (canExit()) K.drawRoundButton(ctx, EXIT.x, EXIT.y, 'zpet');
  },
  hot(p) {
    if (canExit() && K.dist(p, EXIT) < 45) return true;
    if (st.phase === 'idle') return inGrouse(p);
    if (st.phase === 'hero') return inTail(p) || inHand(p) || inHero(p);
    if (st.phase === 'plant') return st.step < 3 && K.dist(p, MOUND) < 120;
    return false;
  },
  async click(p) {
    if (canExit() && K.dist(p, EXIT) < 45) {
      K.busy++;
      await K.fadeTo(1, 0.5, FADE);
      K.busy--;
      return K.go('louka', { from: 'vrchol' });
    }
    if (st.phase === 'idle' && inGrouse(p)) return startRound();
    if (st.phase === 'hero') {
      if (inTail(p)) return heroDraw();
      if (inHand(p) || inHero(p)) return heroStand();
    }
    if (st.phase === 'plant' && st.step < 3 && K.dist(p, MOUND) < 120) return plantStep();
  },
};
return scene;
})();
K.scenes.vrchol = VRCHOL;
