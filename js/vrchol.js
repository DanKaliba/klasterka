// Vrchol Zadní Planiny: tetřívek s ocasem z karet, oko bere a pak zasazení sněžné květiny.
// Daniel 2026-11-13: „Na vrcholu sedí tetřívek. Jeho ocas je vějíř karet. Hrdina ho musí porazit
// v jednodušší verzi hry oko bere (karty upravené na historii Krkonoš: zvířata, povolání, rostliny).
// Když ho porazí, odletí.“ Návrh a balíček: pics/podklady-vrchol/PROMPT-vrchol.md (mockup odsouhlasený).
//
// Hra (beze slov), Daniel 2026-11-18:
// - Po planině se chodí klikem na zem. Tetřívek pustí kluka jen ke GUARD_X; dál ho zastraší a kluk couvne.
// - Klik na tetřívka: kluk ho poprosí o hrudku (bublina s květinou z herbáře), tetřívek odmítne a nabídne karty.
// - Hraje se o místo. Kluk táhne (karta s plusem nebo klik na ocas) a skončí dlaní („stačí“), pak táhne
//   tetřívek aspoň do 17; je ješitný a na 17–18 občas táhne dál (po každé své výhře víc).
// - S každou kartou tetřívek hodí zobákem kamínek na zub rabuše (grónská dřevěná mapa) podle součtu.
//   Přes 21 se kamínek skutálí do trávy a kolo je prohrané. Dvě esa hned na začátku = oko. Remíza = nové kolo.
// - Kluk vyhraje kolo → tetřívek zlomí svou rabuši, karty mu vypadají z ocasu a odletí. Tetřívek vyhraje →
//   zatoká a kluk ho může vyzvat znovu (nikdy slepá ulička). Krakonoš u kluka = tetřívek se lekne.
// - Pak na hrudku semínka, voda, rampouch → květina vyroste, rozkvete, práší → finále.
// Obrázky: tetřívek (prompt T), karty (KA, KK), rub (KR), rabuše (KR2), pozadí (V) v pics/podklady-vrchol/.
const VRCHOL = (() => {
// sněžná květina: pět fází růstu vedle sebe (python tools/kvetina.py, Daniel 2026-11-24); čísla vypíše skript
const FLOWER = 'assets/sceny/kvetina-faze.webp';
const FAZE_N = 5, FAZE_KRCEK = 455, FAZE_VYSKA = 407; // řádek kořenového krčku, výška rozkvetlé nad krčkem (px listu)
// pozadí: Danielův obrázek (2026-11-18, prompt V, python tools/vrchol.py). Mužík, plochý kámen i hrudka
// jsou v něm; hra na ně kreslí karty, rabuše a mokrou hrudku (vrstva z pozadí).
const BG = 'assets/sceny/vrchol.jpg';
const WET = { src: 'assets/sceny/vrchol-hrudka.png', x: 1330, y: 545 }; // ztmavená hrudka, přikryje se po zalití
K.img(FLOWER);
K.img(BG);
K.img(WET.src);
const bgReady = () => K.ready(K.img(BG));
const EXIT = { x: 90, y: 990 };
const FADE = '#efe6d2';

const HERO_Y = 1040, HERO_S = 2.4, HERO_X = 300;
// dědova fajfka z kuchyně (Daniel 2026-11-26): vytažená z batůžku a použitá ve scéně = kluk si párkrát potáhne
// a vyfoukne dým; stejný obrázek a natočení jako u studánky (muka.js), měřítko podle HERO_S
const PIPE_IMG = 'assets/predmety/fajfka.png', PIPE_S = 0.34 * HERO_S / 1.4, PIPE_ROT = 0.45;
K.img(PIPE_IMG);
const CAIRN = { x: 451, y: 590 }; // mužík (pata); jeho funkci Daniel ještě vymyslí
const MOUND = { x: 1480, y: 585 }; // hrudka rašeliny (vršek 567, pata 630), na ní sedí tetřívek
const GROUSE = { x: 1478, y: 578 }; // tetřívek (chodidla), kouká doleva
const PLANT_X = MOUND.x - 190; // kam kluk dojde zasadit
const GUARD_X = MOUND.x - 430; // dál kluka tetřívek nepustí (zastraší ho)
const WALK_Y = 640; // klik pod touhle čarou = kluk tam dojde
const PLANT_H = 400;
const TABLE = { x: 1115, y: 785, rx: 510, ry: 90 }; // plochý kámen = stůl (v pozadí; kreslí se jen bez něj)
const CARD_W = 112, CARD_H = 200; // poměr jako Danielovy karty
// obrázky karet: sada v K.SPRITY podle barvy, jméno bez diakritiky (sýkora → sykora)
const CARD_SET = { zvirata: 'kartyZvirata', rostliny: 'kartyRostlinyPovolani', povolani: 'kartyRostlinyPovolani', krakonos: 'kartaKrakonos' };
const ascii = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const HAND = { hero: { x0: 720, x1: 1010, y: 785 }, grouse: { x0: 1250, x1: 1500, y: 775 } };
const STICK = { hero: { x: 600, y: 935 }, grouse: { x: 1130, y: 935 }, len: 480 };
const TAIL = { x: GROUSE.x + 42, y: GROUSE.y - 218, r: 130 }; // vějíř ocasu (klik = karta)
const BEAK = { x: 19, y: -247 }; // karta v zobáku (póza pluck), vůči chodidlům
// na tahu je kluk: dvě tlačítka mezi ním a kamenem (Daniel 2026-11-18: hráč se musí moct rozhodnout)
const BTN = { draw: { x: 520, y: 700 }, stand: { x: 520, y: 830 }, r: 44 };

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
  hero: { x: -80, facing: 1, walking: false, phase: 0, waveT: -9, arm: null, face: null, pipe: false },
  smoke: [],
  grouse: { state: 'display', x: GROUSE.x, y: GROUSE.y, rot: 0, pluckT: -9, tokT: -9, scareT: -9, refuseT: -9, threatT: -9, hopY: 0, flap: 0 },
  deck: shuffle(fullDeck()), heroCards: [], grouseCards: [], flying: null,
  stick: { hero: 0, grouse: 0, heroBreakT: -9, grouseBreakT: -9, heroFall: null, grouseFall: null }, tallyFly: null,
  asked: false, talk: null, fluff: [], grouseMatches: 0, fallingCards: [],
  step: 0, seeds: 0, wet: 0, frost: 0, grow: 0, bloom: 0, pollen: [], snow: 0, fly: null,
});

// ---------- kluk ----------
const heroGo = (x, speed = 320) => K.walkSide(st.hero, x, speed);

// volná chůze po planině (Daniel 2026-11-18: jako jinde, klik na zem). Dokud tetřívek sedí na hrudce,
// pustí kluka jen ke GUARD_X; když chce dál, tetřívek ho zastraší a kluk couvne.
async function walkTo(x) {
  K.busy++;
  const guarded = st.grouse.state !== 'gone', lim = guarded ? GUARD_X : 1800;
  await heroGo(K.clamp(x, 140, lim), 320);
  if (guarded && x > lim + 20) await intimidate();
  K.busy--;
}
async function intimidate() {
  const g = st.grouse, h = st.hero, x0 = g.x;
  g.state = 'display';
  g.tokT = K.time;
  g.threatT = K.time;
  K.sound('tetrivek-tokani', { volume: 1, rate: 0.85 });
  K.sound('frkani', { volume: 0.8 });
  // výpad z hrudky ke klukovi
  await K.tween(0.35, (t) => { g.x = K.lerp(x0, x0 - 160, K.ease(t)); g.hopY = -Math.sin(t * Math.PI) * 60; });
  h.face = 'startle';
  // kluk couvne pozpátku, pořád čelem k tetřívkovi
  const hx0 = h.x, hx1 = Math.max(140, h.x - 240), ph0 = h.phase;
  h.walking = true;
  const back = K.tween(0.45, (t) => {
    const before = h.phase;
    h.x = K.lerp(hx0, hx1, K.ease(t));
    h.phase = ph0 + (hx0 - h.x) / 20;
    K.walkStep(before, h.phase);
  }).then(() => { h.walking = false; });
  await K.tween(0.6, (t) => { g.x = K.lerp(x0 - 160, x0, K.ease(t)); g.hopY = -Math.sin(t * Math.PI) * 35; });
  g.hopY = 0;
  await back;
  await K.after(0.3);
  h.face = null;
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
  K.sound(K.KARTA, { volume: 0.6, rate: K.rand(0.9, 1.1) });
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
  // tetřívek hodí zobákem kamínek na zub rabuše podle nového součtu (Daniel 2026-11-18)
  const to0 = Math.min(25, total(hand)), at = knobAt(who, to0);
  if (at) {
    g.state = 'pluck';
    g.pluckT = K.time;
    await K.after(0.2);
    const from = { x: g.x + BEAK.x, y: g.y + BEAK.y };
    st.tallyFly = { who, x: from.x, y: from.y, rot: 0 };
    g.state = 'display';
    await K.tween(0.5, (t) => {
      const e = K.ease(t);
      st.tallyFly.x = K.lerp(from.x, at.x, e);
      st.tallyFly.y = K.lerp(from.y, at.y, e) - Math.sin(t * Math.PI) * 160;
      st.tallyFly.rot = t * 5;
    });
    st.tallyFly = null;
    st.stick[who] = to0;
    K.sound('kaminek', { volume: 0.5, rate: K.rand(1.1, 1.3) });
  } else {
    const from0 = st.stick[who];
    await K.tween(0.35, (t) => { st.stick[who] = K.lerp(from0, to0, t); });
  }
  if (card.joker && who === 'hero') await grouseScare();
}

// Krakonoš u kluka: tetřívek se lekne (Daniel 2026-11-18: dřív jen zatokal, nebylo to poznat).
// Vyskočí, načepýří se, třese se, uletí mu pár pírek, chvíli se krčí a pak se zase naparuje.
async function grouseScare() {
  const g = st.grouse;
  g.scareT = K.time;
  K.sound('tetrivek', { volume: 0.7, rate: 1.3 });
  K.sound('frkani', { volume: 0.8 });
  for (let i = 0; i < 7; i++) {
    st.fluff.push({ x: g.x + K.rand(-60, 80), y: g.y - K.rand(120, 260), vx: K.rand(-120, 120), vy: K.rand(-160, -60),
      rot: K.rand(0, 6), vr: K.rand(-4, 4), t0: K.time });
  }
  await K.after(1.6);
}

// ---------- rozhovor beze slov (Daniel 2026-11-18) ----------
// Kluk poprosí o hrudku (bublina s květinou), tetřívek odmítne (přeškrtnutá květina, vrtí se) a nabídne
// hru (vějíř karet). Hraje se o místo: jedno vyhrané kolo stačí. Při další hře už jen nabídne karty.
async function say(who, icon, dur) {
  st.talk = { who, icon };
  await K.after(dur);
  st.talk = null;
  await K.after(0.15);
}
async function challenge() {
  K.busy++;
  const g = st.grouse, h = st.hero;
  if (Math.abs(h.x - HERO_X) > 5) await heroGo(HERO_X, 320); // hraje se z místa vlevo od kamene
  h.facing = 1;
  if (!st.asked) {
    st.asked = true;
    h.waveT = K.time; // ukáže na hrudku
    K.sound('sustot', { volume: 0.3 });
    K.sound(K.HLAS.snih); // „sníh“ jako u stromu v lese (Daniel 2026-11-22)
    await say('hero', 'kvetina', 1.4);
    g.refuseT = K.time;
    K.sound('frkani', { volume: 0.6 });
    await say('grouse', 'kvetinaNe', 1.4);
  }
  g.tokT = K.time;
  K.sound(K.KARTA, { volume: 0.6 });
  await say('grouse', 'karty', 1.3);
  K.busy--;
  await startRound();
}

// bublina s květinou z herbáře, jakou ukazuje strom v lese (K.HERBAR, K.herbarCut, K.herbarPaper z js/les.js);
// no = přeškrtnutá („tady ne“)
let flowerArt = null;
function drawFlowerBubble(ctx, x, y, no) {
  const r = 78, by = y - r - 30, H = K.HERBAR;
  if (!flowerArt && H && K.ready(K.img(H.src)) && K.ready(K.img(H.faded))) {
    flowerArt = { canvas: K.herbarCut(K.img(H.src), H.flower, 40), paper: K.herbarPaper(K.img(H.faded)) };
  }
  ctx.save();
  ctx.fillStyle = flowerArt ? flowerArt.paper : 'rgba(244, 236, 216, 0.97)';
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.arc(x, by, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 12, by + r - 4); ctx.lineTo(x - 5, y); ctx.lineTo(x + 12, by + r - 4); ctx.fill(); ctx.stroke();
  if (flowerArt) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, by, r - 3, 0, Math.PI * 2); ctx.clip();
    const c = flowerArt.canvas, h = r * 1.9, w = (h * c.width) / c.height;
    ctx.drawImage(c, x - w / 2, by - h / 2, w, h);
    ctx.restore();
  } else K.drawIcon(ctx, 'kvetina', x, by, r * 1.2, K.INK);
  if (no) {
    ctx.strokeStyle = '#b8261c';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - r * 0.6, by + r * 0.6); ctx.lineTo(x + r * 0.6, by - r * 0.6); ctx.stroke();
  }
  ctx.restore();
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
  K.sound(K.HLAS.jeste); // „ještě jednu“
  st.hero.arm = 'hold';
  await deal('hero');
  st.hero.arm = null;
  const t = total(st.heroCards);
  if (isOko(st.heroCards)) { K.busy--; return roundEnd('hero'); }
  if (t > 21) {
    // přes 21: kamínek se z posledního zubu skutálí do trávy
    dropPebble('hero');
    K.sound('kaminek', { volume: 0.5, rate: 0.8 });
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
  K.sound(K.HLAS.staci); // „stačí“
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
      dropPebble('grouse');
      K.sound('kaminek', { volume: 0.5, rate: 0.8 });
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
    K.sound(K.HLAS.vitezstvi);
    // tetřívek prohrál: ze vzteku klovne do své rabuše a zlomí ji (Daniel 2026-11-18)
    g.state = 'pluck';
    g.pluckT = K.time;
    await K.after(0.3);
    st.stick.grouseBreakT = K.time;
    dropPebble('grouse'); // spadl-li už (přetáhl), zůstane ležet
    K.sound('prasknuti');
    g.state = 'sulk';
    K.sound('frkani', { volume: 0.5 });
    h.waveT = K.time;
  } else if (winner === 'grouse') {
    // tetřívek vyhrál: pyšně zatoká; kluk ho může vyzvat znovu
    g.state = 'display';
    g.tokT = K.time;
    K.sound('tetrivek-tokani', { volume: 0.8 });
  }
  await K.after(1.2);
  // karty zpátky do ocasu, rabuše znovu celé
  await gatherCards();
  g.state = 'display';
  if (winner === 'hero') { K.busy--; return grouseDefeat(); } // hrál o místo a prohrál: odletí
  if (winner === 'grouse') {
    st.grouseMatches++; // příště je ješitnější (táhne odvážněji)
    st.phase = 'idle';
    K.busy--;
    return;
  }
  K.busy--;
  await startRound(); // remíza: hned další kolo
}

async function gatherCards() {
  const all = [...st.heroCards, ...st.grouseCards];
  const fromH = st.heroCards.map((c, i) => ({ c, ...slot('hero', i, st.heroCards.length) }));
  const fromG = st.grouseCards.map((c, i) => ({ c, ...slot('grouse', i, st.grouseCards.length) }));
  st.gather = [...fromH, ...fromG].map((f) => ({ ...f, x0: f.x, y0: f.y }));
  st.heroCards = [];
  st.grouseCards = [];
  K.sound(K.KARTA, { volume: 0.5, rate: 0.8 });
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
  st.stick = { hero: 0, grouse: 0, heroBreakT: -9, grouseBreakT: -9, heroFall: null, grouseFall: null };
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


// ---------- zasazení květiny (jako dřív) ----------
// from = odkud položka letí: z batohu (klik na hrudku), nebo od kurzoru (přetažená položka)
async function plantStep(from0) {
  K.busy++;
  const item = K.ITEMS[st.step], from = from0 || K.slotPos(K.ITEMS.indexOf(item));
  if (from0) st.fly = { item, x: from.x, y: from.y }; // přetažená položka zůstane, kde ji pustil, než kluk dojde
  if (Math.abs(st.hero.x - PLANT_X) > 5) { await heroGo(PLANT_X, 320); st.hero.facing = 1; }
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
    K.sound(K.TRIANGL, { volume: 0.6, rate: 1.12 }); // rampouch cinkne jako v lese
    await K.tween(0.8, (t) => { st.frost = t; });
    await bloom();
  }
  K.busy--;
}
// na hrudku přetáhl jinou položku, než je na řadě: kluk si vzpomene, co patří dřív
async function plantWrong() {
  K.busy++;
  if (Math.abs(st.hero.x - PLANT_X) > 5) { await heroGo(PLANT_X, 320); st.hero.facing = 1; }
  await say('hero', K.ITEMS[st.step], 1.4);
  K.busy--;
}
// ---------- fajfka ----------
function heroOpts() {
  const h = st.hero;
  return { facing: h.facing, walking: h.walking, phase: h.phase, halo: false,
    wave: K.time - h.waveT < 0.9 || h.waveT > K.time, arm: h.pipe ? 'mouth' : h.arm, face: h.face };
}
const mouth = () => K.heroMouth(st.hero.x, HERO_Y, HERO_S, heroOpts())
  || { x: st.hero.x + st.hero.facing * 24, y: HERO_Y - 245 };
function pipeBowl() {
  const m = mouth(), L = 240 * PIPE_S * 0.92, rot = -st.hero.facing * PIPE_ROT;
  return { x: m.x - Math.sin(rot) * L, y: m.y + Math.cos(rot) * L };
}
const canSmoke = () => K.held === 'fajfka' && ['idle', 'hero', 'plant'].includes(st.phase);
// párkrát potáhne (z hlavičky se kouří), vyfoukne dým šikmo nahoru a fajfku schová (vrátí se do batůžku sama)
async function smokePipe() {
  const h = st.hero;
  K.busy++;
  h.pipe = true;
  for (let i = 0; i < 3; i++) {
    await K.after(0.35);
    K.sound(K.DYMKA, { volume: 0.6, rate: K.rand(0.9, 1.05) });
    const b = pipeBowl();
    for (let k = 0; k < 3; k++) {
      st.smoke.push({ x0: b.x, y0: b.y - 8, x1: b.x + K.rand(-20, 20), y1: b.y - 140, t0: K.time + k * 0.12, dur: 1.4, r0: 6, r1: 24 });
    }
    await K.after(0.55);
  }
  K.sound('foukani');
  const m = mouth();
  for (let k = 0; k < 8; k++) {
    st.smoke.push({ x0: m.x + h.facing * 10, y0: m.y, x1: m.x + h.facing * K.rand(120, 260), y1: m.y - K.rand(90, 200),
      t0: K.time + k * 0.07, dur: 1.8, r0: 8, r1: 40 + K.rand(0, 20) });
  }
  await K.after(1.2);
  h.pipe = false;
  K.busy--;
}
function drawPipe(ctx) {
  const img = K.img(PIPE_IMG);
  if (!K.ready(img)) return;
  const m = mouth();
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.rotate(-st.hero.facing * PIPE_ROT);
  ctx.scale(PIPE_S, PIPE_S);
  ctx.drawImage(img, -img.width / 2, 0);
  ctx.restore();
}
// obláčky dýmu: rostou, zpomalují a mizí (jako u studánky)
function drawSmoke(ctx) {
  for (const p of st.smoke) {
    const u = (K.time - p.t0) / p.dur;
    if (u < 0 || u > 1) continue;
    const e = 1 - (1 - u) * (1 - u);
    ctx.fillStyle = `rgba(232, 230, 222, ${0.75 * (1 - u)})`;
    ctx.beginPath();
    ctx.arc(K.lerp(p.x0, p.x1, e) + Math.sin(K.time * 2 + p.r1) * 6 * u, K.lerp(p.y0, p.y1, e), K.lerp(p.r0, p.r1, e), 0, Math.PI * 2);
    ctx.fill();
  }
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
  // obloha, hřebeny v dálce, vrchol s trávou (náhrada, dokud se vrchol.jpg nenačte)
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
  if (!bgReady()) {
    for (const [dx, dy, r] of [[0, -20, 62], [2, -80, 46], [-2, -124, 34], [0, -166, 24]]) {
      ctx.beginPath(); ctx.ellipse(CAIRN.x + dx, CAIRN.y + dy, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }
}

function drawMound(ctx) {
  const wet = st.wet;
  ctx.strokeStyle = K.INK;
  if (bgReady()) {
    // hrudka je v pozadí; po zalití se přes ni prolne její ztmavená kopie
    const img = K.img(WET.src);
    if (wet > 0 && K.ready(img)) { ctx.globalAlpha = wet; ctx.drawImage(img, WET.x, WET.y); ctx.globalAlpha = 1; }
  } else {
    ctx.fillStyle = `rgb(${Math.round(K.lerp(122, 78, wet))}, ${Math.round(K.lerp(96, 62, wet))}, ${Math.round(K.lerp(70, 46, wet))})`;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(MOUND.x, MOUND.y + 45, 130, 60, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
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
  // žolík (Krakonoš, platí 1 nebo 11): jeden puntík v kroužku, hnědý jako hlína
  const jokerMark = (cx, cy) => {
    ctx.fillStyle = '#7a4e26';
    ctx.strokeStyle = '#7a4e26';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 6.5, 0, Math.PI * 2); ctx.stroke();
  };
  // obrázek karty (Daniel 2026-11-13, prompt KA, python tools/sprity.py; puntíky z obrázku jsou vygumované)
  const spr = K.sprite(CARD_SET[card.suit], ascii(card.name));
  if (spr) {
    ctx.drawImage(spr.img, -w / 2, -h / 2, w, h);
    if (card.joker) {
      // Krakonoš má v rozích paroží a kopyto, značka jde těsně do rohu
      jokerMark(-w / 2 + 15, -h / 2 + 16);
      jokerMark(w / 2 - 15, h / 2 - 16);
    } else {
      pips(-w / 2 + 21, -h / 2 + 27, card.value);
      pips(w / 2 - 21, h / 2 - 27, card.value);
    }
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
  st.heroCards.forEach((c, i, a) => { const p = slot('hero', i, a.length); drawCard(ctx, c, p.x, p.y, p.rot); });
  st.grouseCards.forEach((c, i, a) => { const p = slot('grouse', i, a.length); drawCard(ctx, c, p.x, p.y, p.rot); });
  if (st.gather) for (const f of st.gather) drawCard(ctx, f.c, f.x, f.y, f.rot, 1, f.s);
  if (st.flying) { const f = st.flying; drawCard(ctx, f.card, f.x, f.y, f.rot, f.face, 0.85 + 0.15 * f.face); }
}

// rabuše: obrázek grónské mapy s kamínkem (drawStickMap); bez obrázku vroubkovaný klacík, vybarvené vruby = součet
function drawStick(ctx, who) {
  const S = STICK[who], n = st.stick[who], bt = st.stick[who + 'BreakT'], br = K.time - bt;
  const len = STICK.len, step = (len - 30) / 21;
  const broken = bt !== -9 && br >= 0; // -9 = celá
  const spr = K.sprite('rabuse2', 'rabuse');
  if (spr) return drawStickMap(ctx, who, spr, n, broken, br);
  // bez obrázku: zlomí se i při přetažení (kamínek tu není), ať je přetažení vidět
  const fall = st.stick[who + 'Fall'], fbBroken = broken || n > 21;
  const fbr = broken ? br : fall ? K.time - fall.t : 1;
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
  if (!fbBroken) return half(0, len, 0);
  const a = Math.min(1, fbr * 4) * 0.25;
  half(0, len / 2, -a);
  half(len / 2, len, a);
}

// rabuše jako grónská dřevěná mapa (Daniel 2026-11-18, prompt KR2, python tools/sprity.py): 22 vyřezaných
// zubů (změřené v sp.knobs). Kamínek leží na zubu podle součtu karet (21 = poslední „dobrý“ zub, 22 = přes);
// přes 21 se skutálí do trávy. Když tetřívek prohraje kolo, svou rabuši zlomí: ukážou se zlomené kusy.
const TALLY_W = 34; // šířka kamínku na rabuši
function knobAt(who, n) {
  const spr = K.sprite('rabuse2', 'rabuse');
  if (!spr || n < 1) return null;
  const kn = spr.sp.knobs, S = STICK[who], len = STICK.len, h = (spr.sp.h * len) / spr.sp.w;
  const [fx, fy] = kn[Math.min(n, kn.length) - 1];
  return { x: S.x + fx * len, y: S.y + fy * h + 7 }; // kamínek sedí v hlavičce zubu
}
// kamínek začne padat: poloha zamrzne na zubu, kde ležel (pozdější volání nic nezmění)
function dropPebble(who) {
  if (st.stick[who + 'Fall']) return;
  const at = knobAt(who, Math.round(st.stick[who]));
  if (at) st.stick[who + 'Fall'] = { t: K.time, x: at.x, y: at.y };
}
function drawTallyPebble(ctx, x, y, rot = 0, a = 1) {
  const peb = K.sprite('rabuse2', 'kaminek');
  if (!peb || a <= 0) return;
  const ph = (TALLY_W * peb.sp.h) / peb.sp.w;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y - ph / 2);
  ctx.rotate(rot);
  ctx.drawImage(peb.img, -TALLY_W / 2, -ph / 2, TALLY_W, ph);
  ctx.restore();
}
function drawStickMap(ctx, who, { sp, img }, n, broken, br) {
  const S = STICK[who], len = STICK.len, k = len / sp.w, h = sp.h * k;
  if (!broken) ctx.drawImage(img, S.x, S.y, len, h);
  else {
    // zlomené kusy (ze stejného obrázku) odskočí od sebe
    const e = K.ease(Math.min(1, br * 4));
    for (const [pose, side] of [['zlomenaL', -1], ['zlomenaP', 1]]) {
      const p = K.sprite('rabuse2', pose);
      if (!p) continue;
      const w = p.sp.w * k, ph = p.sp.h * k, x = side < 0 ? S.x - 8 * e : S.x + len - w + 8 * e, y = S.y + h - ph;
      const px = side < 0 ? x + w : x; // otáčí se kolem lomu
      ctx.save();
      ctx.translate(px, S.y + h); ctx.rotate(side * 0.06 * e); ctx.translate(-px, -(S.y + h));
      ctx.drawImage(p.img, x, y, w, ph);
      ctx.restore();
    }
  }
  // kamínek na zubu podle součtu; spadne (z místa, kde ležel), když hráč přetáhne nebo se rabuše zlomí
  if (st.tallyFly && st.tallyFly.who === who) return;
  const fall = st.stick[who + 'Fall'];
  if (fall) {
    const ft = K.time - fall.t, ground = S.y + h + 14, y = Math.min(ground, fall.y + 260 * ft * ft);
    return drawTallyPebble(ctx, fall.x + 70 * Math.min(ft, 0.8), y, ft * 7, 1 - K.clamp((ft - 1.2) / 0.5));
  }
  if (n < 1) return;
  const at = knobAt(who, Math.round(n));
  drawTallyPebble(ctx, at.x, at.y);
}

// tetřívek z Danielova obrázku (2026-11-13, prompt T, python tools/sprity.py): pózy sit / display / pluck /
// sulk / fly, všechny koukají doleva, kotva = pařáty. Před hrou sedí a občas zatoká (vějíř), ve hře toká.
function drawGrouseSprite(ctx) {
  const g = st.grouse;
  const tok = Math.max(0, 1 - (K.time - g.tokT) / 1.2);
  let pose = g.state === 'pluck' && K.time - g.pluckT < 0.5 ? 'pluck' : g.state === 'sulk' ? 'sulk' : g.state === 'fly' ? 'fly' : 'display';
  if (pose === 'display' && st.phase === 'idle' && tok <= 0) pose = 'sit';
  const sc = K.time - g.scareT, scared = sc >= 0 && sc < 1.6; // leknutí z Krakonoše
  if (scared && g.state !== 'fly') pose = 'display'; // fly a sulk nemají celý karetní ocas
  const spr = K.sprite('tetrivek', pose);
  if (!spr) return false;
  const { sp, img } = spr;
  ctx.save();
  // leknutí: vyskočí, dopadne a přikrčí se, třese se víc než poražený
  const hop = scared && sc < 0.45 ? -Math.sin((sc / 0.45) * Math.PI) * 90 : 0;
  ctx.translate(g.x, g.y + hop + g.hopY + (pose === 'fly' && !scared ? Math.sin(K.time * 14) * 8 : 0));
  // tokání: nafoukne se a zachvěje; poražený se třese
  const cower = scared && sc >= 0.45 ? 0.93 + 0.07 * K.clamp((sc - 1.1) / 0.5) : 1;
  const rf = K.time - g.refuseT, refusing = rf >= 0 && rf < 0.9; // odmítne: zavrtí se (jako vrtění hlavou)
  const th = K.time - g.threatT, threat = th >= 0 && th < 1.1 ? Math.sin(Math.min(1, th / 0.25) * Math.PI / 2) * (1 - K.clamp((th - 0.8) / 0.3)) : 0; // zastrašení: nafoukne se
  const puff = (1 + 0.05 * tok) * cower * (1 + 0.14 * threat), shake = scared ? Math.sin(K.time * 45) * 5 : refusing ? Math.sin(rf * 22) * 9 * (1 - rf / 0.9) : pose === 'sulk' ? Math.sin(K.time * 40) * 1.5 : 0;
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

// pírka, která tetřívkovi uletí leknutím: plachtí dolů a zmizí
function drawFluff(ctx) {
  st.fluff = st.fluff.filter((f) => K.time - f.t0 < 2.4);
  for (const f of st.fluff) {
    const t = K.time - f.t0;
    ctx.save();
    ctx.globalAlpha = 1 - K.clamp((t - 1.6) / 0.8);
    ctx.translate(f.x + f.vx * t + Math.sin(t * 5 + f.rot) * 14, f.y + f.vy * t + 110 * t * t * 0.5);
    ctx.rotate(f.rot + f.vr * t);
    ctx.fillStyle = '#1d1f27';
    ctx.beginPath(); ctx.ellipse(0, 0, 17, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(240, 240, 240, 0.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-13, 1.5); ctx.lineTo(13, -1.5); ctx.stroke();
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

// jedna fáze z listu kvetina-faze.webp (krček na MOUND, k = viditelnost)
function drawPhase(ctx, img, i, k) {
  if (k <= 0) return;
  const w = img.width / FAZE_N, s = PLANT_H / FAZE_VYSKA;
  ctx.save();
  ctx.globalAlpha *= k;
  ctx.translate(MOUND.x, MOUND.y + 14);
  ctx.scale(s, s);
  ctx.drawImage(img, i * w, 0, w, img.height, -w / 2, -FAZE_KRCEK, w, img.height);
  ctx.restore();
}

function drawFlower(ctx) {
  const img = K.img(FLOWER);
  if (st.grow > 0 && K.ready(img)) {
    // růst prolíná fáze klíček → růžice → poupě → rozkvetlá; rozzáření pak přejde do fáze s pylem
    const pos = K.ease(st.grow) * 3, i = Math.min(2, Math.floor(pos)), f = K.ease(K.clamp(pos - i));
    ctx.save();
    if (st.grow < 0.08) ctx.globalAlpha = st.grow / 0.08; // klíček vyraší z hrudky
    // stará fáze drží do půlky prolnutí, pak mizí (jinak by prosvítala pozadím, nebo zdvojila zvonky)
    const fade = (u) => 1 - K.clamp((u - 0.5) * 2);
    const from = st.bloom > 0 ? 3 : i, to = from + 1, u = st.bloom > 0 ? K.ease(st.bloom) : f;
    drawPhase(ctx, img, from, fade(u));
    drawPhase(ctx, img, to, u);
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
const choosing = () => st.phase === 'hero' && K.busy === 0;
const onBtn = (p, b) => K.dist(p, b) < BTN.r;
const inTail = (p) => K.dist(p, TAIL) < TAIL.r;
const inGrouse = (p) => inTail(p) || K.dist(p, { x: GROUSE.x - 20, y: GROUSE.y - 150 }) < 130;
const canExit = () => ['idle', 'plant'].includes(st.phase) && st.step === 0;

const scene = {
  get st() { return st; }, // pro testy
  total, // pro testy (hráčova strategie)
  dropPebble, // pro testy (spadlý kamínek)
  // hudba: s tetřívkem, a když odletí a sází se květina (Daniel 2026-11-22)
  music: () => (st && ['plant', 'bloom', 'done'].includes(st.phase) ? 'hudba-vrchol-kytka' : 'hudba-vrchol'),
  enter() {
    // rozehraná hra zůstane (kluk si může dojít na louku a vrátit se), po finále začne znovu
    if (!st || st.phase === 'done') st = init();
    K.preloadSounds([...K.DYMKA, 'foukani', K.KARTA, 'prasknuti', 'kaminek', 'tetrivek-tokani', 'frkani', 'tetrivek', 'sustot', K.TRIANGL, K.HLAS.jeste, K.HLAS.staci, K.HLAS.vitezstvi, K.HLAS.snih,
      'chorose', 'slunce', 'vitr', 'voda']);
    K.fade.a = 1;
    K.fadeTo(0, 0.6, FADE);
    if (st.phase === 'intro' || st.phase === 'idle') {
      st.hero.x = -80;
      K.busy++;
      heroGo(HERO_X, 300).then(() => { st.hero.facing = 1; st.phase = 'idle'; K.busy--; });
    }
  },
  update(dt) {
    st.smoke = st.smoke.filter((p) => K.time - p.t0 < p.dur);
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
    drawFluff(ctx);
    if (st.grouse.state !== 'gone' || st.heroCards.length) {
      // rabuše jen během hry (kamenný stůl je v pozadí, nakreslí se jen, když se pozadí nenačte)
      if (!bgReady()) {
        ctx.fillStyle = '#9e9a92';
        ctx.strokeStyle = K.INK;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(TABLE.x, TABLE.y, TABLE.rx, TABLE.ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#aaa69e';
        ctx.beginPath(); ctx.ellipse(TABLE.x, TABLE.y - 10, TABLE.rx - 40, TABLE.ry - 30, 0, 0, Math.PI * 2); ctx.fill();
      }
      drawStick(ctx, 'hero');
      drawStick(ctx, 'grouse');
    }
    drawHands(ctx);
    if (st.tallyFly) drawTallyPebble(ctx, st.tallyFly.x, st.tallyFly.y, st.tallyFly.rot);
    if (st.talk) {
      const t = st.talk, x = t.who === 'hero' ? st.hero.x + 60 : st.grouse.x - 170, y = t.who === 'hero' ? HERO_Y - 370 : st.grouse.y - 250;
      if (t.icon === 'kvetina' || t.icon === 'kvetinaNe') drawFlowerBubble(ctx, x, y, t.icon === 'kvetinaNe');
      else K.drawBubble(ctx, x, y, 1.3, t.icon);
    }
    K.drawHero(ctx, st.hero.x, HERO_Y, HERO_S, heroOpts());
    if (st.hero.pipe) drawPipe(ctx);
    drawSmoke(ctx);
    if (st.fly) K.drawIcon(ctx, st.fly.item, st.fly.x, st.fly.y, 46);
    if (st.snow > 0) {
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = st.snow * 0.9;
      ctx.beginPath(); // všechny vločky jednou cestou, jedno vyplnění místo 160
      for (const f of flakes) { const r = 2 + f.z * 5; ctx.moveTo(f.x + r, f.y); ctx.arc(f.x, f.y, r, 0, Math.PI * 2); }
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (canExit()) K.drawRoundButton(ctx, EXIT.x, EXIT.y, 'zpet');
    if (choosing()) {
      // ještě kartu / stačí
      const m = K.mouse;
      K.drawRoundButton(ctx, BTN.draw.x, BTN.draw.y, 'kartaDalsi', !(m && onBtn(m, BTN.stand)));
      K.drawRoundButton(ctx, BTN.stand.x, BTN.stand.y, 'dlan', !!(m && onBtn(m, BTN.stand)));
    }
  },
  pickItems: () => !!st && st.phase === 'plant' && st.step < 3, // položky z batohu jdou vzít a pustit na hrudku
  hot(p) {
    if (canExit() && K.dist(p, EXIT) < 45) return true;
    if (canSmoke()) return true;
    if (st.phase === 'idle') return inGrouse(p);
    if (st.phase === 'hero') return inTail(p) || onBtn(p, BTN.draw) || onBtn(p, BTN.stand);
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
    if (canSmoke()) return smokePipe(); // fajfka v ruce: kamkoli do scény = potáhne si
    if (st.phase === 'idle' && inGrouse(p)) return challenge();
    if (st.phase === 'hero') {
      if (inTail(p) || onBtn(p, BTN.draw)) return heroDraw();
      if (onBtn(p, BTN.stand)) return heroStand();
    }
    if (st.phase === 'plant' && st.step < 3 && K.dist(p, MOUND) < 120) {
      // stačí klik na hrudku (položky jdou po řadě), nebo položku z batohu přetáhnout jako fajfku na žábu.
      // Špatná položka ani hrnek se nezasadí: kluk ukáže, co patří na řadu (Daniel 2026-11-26; fajfka = kouří)
      const held = K.held;
      if (!held || held === K.ITEMS[st.step]) return plantStep(held ? { x: p.x + 18, y: p.y + 22 } : null);
      return plantWrong();
    }
    if ((st.phase === 'idle' || st.phase === 'plant') && p.y > WALK_Y) return walkTo(p.x);
  },
};
return scene;
})();
K.scenes.vrchol = VRCHOL;
