// Kuchyně na Kantorské (Daniel 2026-11-09, podle fotky z Paseků 1916 v Albu ze starých Krkonoš:
// „Do bramborové vůně předl dobrácký kocour. Děda vypravoval, babka přikládala a také poslouchala.“)
//
// Úkol: semínka sněžné květiny jsou v hrnku na polici nad sporákem. Panáček na ni nedosáhne.
// - Na začátku je v kuchyni kouř (oheň jen čadí z otevřených dvířek), babka i děda kašlou (Daniel 2026-11-10).
//   Okno je vysoko: panáček vezme pohrabáč z tyče sporáku, háčkem zachytí spodek křídla a okno přitáhne
//   dovnitř. Kouř vytáhne ven, pohrabáč vrátí na tyč. (Pohrabáč je můj nápad, Daniel chtěl jen „otevřít okno“.)
// - Děda: klik → vyfoukne kouř a z kouře se složí obrázky: sněžná květina, hrnek se semínky (nápověda).
// - Babka klečí u sporáku, oheň jen doutná a roští došlo (klik → bublina s roštím).
// - Panáček přinese náruč z hromádky roští u dveří (hromádka zmizí) → babka přiloží → oheň, hrnec s
//   bramborami se rozvaří, křížaly na tyči se v teple rozhoupou.
// - Vůně brambor dojde až na kamna, kde na dece spí kocour. Probudí se, protáhne a jde za vůní:
//   seskočí na římsu kamen a na polici, po polici dojde k hrnku a shodí ho. Hrnek spadne do koše
//   a semínka se vysypou. Kocour se vrátí po polici a skočí dědovi na hlavu, děda se lekne a upustí
//   fajfku (Daniel 2026-11-13). Kocour seskočí dolů a přede, děda se zlobí.
// - Panáček vybere z koše semínka (→ batoh) i hrnek a sebere fajfku (nástroje pro studánku u božích
//   muk: do hrnku nabere vodu, fajfka se hodí na žábu). Až má všechno, odejde dveřmi.
// Pozadí je prázdná kuchyně (prompt A), věci z promptu E jsou samostatně. Babka a děda jsou kresby
// s lišejníkem (Daniel 2026-11-12, prompty B2 a C2 v pics/podklady-kuchyne/PROMPT-postavy-lisejnik.md),
// každý v několika pózách, mezi nimiž se krátce prolne. Koš je DOČASNĚ vyříznutý ze staré verze
// (kuchyne-A.png), kocour je ZÁSTUPNÝ (kreslený, čeká na prompt D).
// Podklady: python tools/kuchyne.py (pozadí, věci), python tools/postavy.py (babka, děda)
const KITCHEN = (() => {
const S = 'assets/sceny/';
const BG = S + 'kuchyne.jpg';
const IMG = {
  babka: [1, 2, 3, 4, 5].map((i) => S + `kuchyne-babka-${i}.png`), kos: S + 'kuchyne-kos.png',
  deda: [1, 2, 3, 4].map((i) => S + `kuchyne-deda-${i}.png`),
  hrnek: S + 'kuchyne-hrnek.png', rosti: S + 'kuchyne-rosti.png', naruc: S + 'kuchyne-naruc.png',
  pohrabac: S + 'kuchyne-pohrabac.png', ven: S + 'kuchyne-okno-ven.png', fajfka: 'assets/predmety/fajfka.png',
  krizaly: [1, 2, 3].map((i) => S + `kuchyne-krizaly-${i}.png`),
};
for (const f of [BG, ...Object.values(IMG).flat()]) K.img(f);
const FADE = '#2a2118';

// souřadnice v pozadí 1920×1080; levé horní rohy výřezů vypisuje tools/kuchyne.py
const BOX = { kos: { x: 352, y: 841 }, pohrabac: { x: 755, y: 663 } };
// pózy babky a dědy: kotva = bod výřezu na podlaze (vypisuje tools/postavy.py), AT = kam na podlahu
// babka: 1 smutně kouká do ohně, 2 kašle, 3 prosí, 4 přikládá (ruce k dvířkům), 5 spokojená
// děda: 1 dýmka v puse, 2 kašle, 3 vyfukuje kouř a kouká nahoru, 4 se směje
// dědovy pózy pro kocoura na hlavě: leknutí a zlost. Až budou nové pózy 5 a 6 (úprava C3 v
// pics/podklady-kuchyne/PROMPT-postavy-lisejnik.md), přepnout na 5 a 6; do té doby 3 a 1 s třesením.
const DEDA_STARTLE = 3, DEDA_ANGRY = 1;
const POSE_ANCHOR = { babka: [[1, 498], [1, 478], [1, 501], [1, 408], [1, 519]], deda: [[310, 588], [320, 533], [336, 615], [311, 603]] };
const GRANNY_AT = { x: 83, y: 975 }; // paty
const GRANDPA_AT = { x: 1400, y: 1008 }; // pravá noha stoličky
const POSE_FADE = 0.18;
const FY = 1045; // chodidla na podlaze
const HERO_S = 1.9; // Daniel 2026-11-13: hrdina větší (dřív 1.3)
// výskok s pohrabáčem k oknu: háček má být ve stejné výšce jako dřív při HERO_S 1.3 a výskoku 88
const WIN_HOP = Math.max(16, 88 - 122 * (HERO_S - 1.3));
const DOOR_X = 1990; // dveře vpravo za obrazem
const START_X = 1580;
const EXIT = { x: 90, y: 990 };
const SHELF_Y = 309; // horní hrana police
const MUG_X = 520; // hrnek na levém konci police
const BASKET = { x: 446, y: 858 }; // střed otvoru koše
// přední stěna koše (kreslí se přes hrnek a semínka): spodní půlka okraje otvoru a stěna dolů ke dnu
const BASKET_FRONT = { rx: 88, ry: 16, x0: 352, x1: 540, bottom: 1015 };
const DOOR = { x: 478, y: 682, w: 124, h: 116 }; // dvířka topeniště (pant vlevo), otevřená
const FIRE = { x0: 490, x1: 590, y0: 694, y1: 788 }; // otvor topeniště
const POT = { x: 595, y: 540 }; // okraj hrnce pod poklicí
const LID = { x: 515, y: 506, w: 166, h: 40 };
const OKNO = { x: 1446, y: 400, w: 148, h: 214 }; // křídlo okna (pant vlevo), OKNO v tools/kuchyne.py
const WIN_STAND = 1560; // odtud háčkem dosáhne na spodek křídla
const WIN_OPEN = 1.75; // otevřené křídlo (rad)
const POKER_X = 770;
const MOUTH = { x: 1243, y: 543 }; // dědova ústa, když vyfukuje (póza 3)
const GRANDPA_COUGH = { x: 1184, y: 618 }; // pěst u úst (póza 2)
const PIPE = { x: 1135, y: 573 }; // hlavička dýmky (póza 1)
const GRANNY_MOUTH = { x: 262, y: 622 }; // kapesník u úst (póza 2)
const CLOUD = { x: 1135, y: 228, r: 92 }; // obláček z kouře s nápovědou
const PILE = { x: 1735, y: 975 }; // hromádka roští u dveří: střed spodku
const TWIGS_AT = 1590; // kde si panáček vezme roští
const GIVE_X = 610; // kde podá roští babce (před dvířky)
const GRANNY_HANDS = { x: 488, y: 819 }; // dlaně v póze 4 (u dvířek)
const WATCH_X = 880; // odkud se pak dívá
// křížaly visí z tyče pod stropem nad kamny
const STRINGS = [1050, 1100, 1150].map((x) => ({ x, y: 126 }));
// kocour: z deky na kamnech na římsu, skok na polici, po polici k hrnku, skok na zem
const CAT_S = 1.35;
const CAT_K = 0.72; // kocour z obrázku je menší než dřív kreslený (Daniel 2026-11-13)
const CAT_BED = { x: 1290, y: 292 };
const CAT_BLANKET_END = 1100;
const CAT_LEDGE = { x: 1036, y: 357 };
const CAT_SHELF = 975;
const CAT_SNIFF = 662; // hlavou nad hrncem
const CAT_BUMP = 610; // hlavou u hrnku
const CAT_HEAD = { x: 1285, y: 452 }; // na dědově pleši (póza 3)
const CAT_FLOOR = { x: 720, y: 1040 }; // pak sedí na zemi u sporáku (ne na fajfce)
// dědova fajfka: vypadne mu z ruky, když se lekne kocoura, a panáček ji sebere (→ studánka u božích muk)
const PIPE_HAND = { x: 1095, y: 650 };
const PIPE_FLOOR = { x: 1010, y: 1000, rot: -Math.PI / 2 + 0.12 }; // leží na boku, náustek vlevo
const PIPE_HIT = { x: 1010, y: 995, r: 85 };

const poly = (pts) => pts.map(([x, y]) => ({ x, y }));
const GRANNY = poly([[80, 985], [90, 700], [150, 520], [260, 468], [340, 520], [395, 700], [380, 985]]);
const GRANDPA = poly([[1085, 1010], [1090, 600], [1120, 440], [1200, 400], [1330, 410], [1400, 560], [1415, 1010]]);
// klikací místa (stejná čísla kreslí i ?debug)
const BUNDLE_HIT = { x: 1610, y: 800, w: 250, h: 185 };
const SHELF_HIT = { x: 440, y: 250, w: 560, h: 80 };
const WIN_HIT = { x: 1430, y: 385, w: 180, h: 260 };
const POKER_HIT = { x: 745, y: 655, w: 55, h: 215 };
const BASKET_HIT = { x: BASKET.x, y: 930, rx: 110, ry: 90 };
const inRect = (p, r) => p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h;
const inPipe = (p) => st.pipe.state === 'floor' && K.dist(p, PIPE_HIT) < PIPE_HIT.r;
const inBasket = (p) => ((p.x - BASKET_HIT.x) / BASKET_HIT.rx) ** 2 + ((p.y - BASKET_HIT.y) / BASKET_HIT.ry) ** 2 < 1;

let st = null;
const init = () => ({
  phase: 'intro', // intro → smoke → air (otevírá okno) → free → chain (oheň, kocour) → seeds → done
  hero: { x: DOOR_X, y: FY, facing: -1, walking: false, phase: 0, hopY: 0, reach: false },
  heroIcon: null, grannyIcon: null,
  smoke: 1, win: 0, poker: 'rail', // rail | hero
  cough: { granny: -9, grandpa: -9, hero: -9 }, nextCough: 1.2, coughWho: 0,
  lean: 0, reach: false, angryT: -9, startleT: -9, carry: false, pile: true, twigs: null,
  pipe: { state: 'hand', x: PIPE_HAND.x, y: PIPE_HAND.y, rot: 0.3 }, // hand | fall | floor | taken
  pose: { babka: { k: 1, prev: 1, t: -9 }, deda: { k: 1, prev: 1, t: -9 } },
  fire: 0, boil: 0, smell: 0, lidT: -9,
  strings: STRINGS.map(() => ({ bumpT: -9 })),
  cat: { x: CAT_BED.x, y: CAT_BED.y, pose: 'sleep', facing: -1, phase: 0, rot: 0, earT: -9, purrT: -9 },
  mug: { state: 'shelf', x: MUG_X, y: SHELF_Y - 25, rot: 0, s: 1 },
  seeds: [], taken: false,
  cloud: null, steam: [], puffs: [], wisps: [], nextPuff: 3, nextLid: 0,
});

// ---------- pohyb ----------
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
    K.walkStep(before, h.phase, true); // dřevěná podlaha
  });
  h.walking = false;
}

const hop = (height, dur = 0.3) => K.tween(dur, (t) => { st.hero.hopY = Math.sin(t * Math.PI) * height; });

async function catGo(pts, speed) {
  const c = st.cat;
  for (const [x, y] of pts) {
    const x0 = c.x, y0 = c.y, d = Math.hypot(x - x0, y - y0);
    if (d < 1) continue;
    if (Math.abs(x - x0) > 2) c.facing = Math.sign(x - x0);
    const ph0 = c.phase;
    await K.tween(d / speed, (t) => { c.x = K.lerp(x0, x, t); c.y = K.lerp(y0, y, t); c.phase = ph0 + (d * t) / 14; });
  }
}

async function catLeap(x1, y1, dur, height) {
  const c = st.cat, x0 = c.x, y0 = c.y;
  c.facing = Math.sign(x1 - x0) || c.facing;
  c.pose = 'leap';
  await K.tween(dur, (t) => {
    c.x = K.lerp(x0, x1, t);
    c.y = K.lerp(y0, y1, t * t) - Math.sin(t * Math.PI) * height;
    // tělo míří ve směru letu (nahoru → dolů)
    c.rot = K.lerp(-0.35, 0.6, t) * (y1 > y0 ? 1 : -1);
  });
  c.rot = 0;
}

// ---------- scénky ----------
async function intro() {
  K.busy++;
  await heroGo(START_X, 280);
  st.cough.hero = K.time; // v kouři se zakucká i panáček
  K.sound('kasel', { volume: 0.4, rate: 1.4 });
  st.phase = 'smoke';
  K.busy--;
}

function cough(who) {
  st.cough[who] = K.time;
  K.sound('kasel', { volume: 0.5, rate: who === 'granny' ? 1.15 : who === 'hero' ? 1.4 : 0.85 });
  const m = who === 'granny' ? GRANNY_MOUTH : who === 'grandpa' ? GRANDPA_COUGH : { x: st.hero.x + 18 * st.hero.facing, y: FY - 175 };
  const dir = who === 'grandpa' ? -1 : who === 'granny' ? 1 : st.hero.facing;
  for (let i = 0; i < 4; i++) puffAt(m.x, m.y, dir * K.rand(40, 90), -K.rand(10, 40), 0.8);
}

// bez pohrabáče na okno nedosáhne (jen dvakrát vyskočí); s ním háčkem zachytí spodek křídla a přitáhne ho dovnitř
async function windowTry() {
  K.busy++;
  const h = st.hero;
  await heroGo(WIN_STAND);
  h.facing = -1;
  h.reach = true;
  if (st.poker !== 'hero') {
    await hop(40, 0.36);
    await hop(30, 0.32);
    h.reach = false; // nedosáhne (bez nápovědy, Daniel 2026-11-10: pohrabáč musí hráč najít sám)
    K.busy--;
    return;
  }
  st.phase = 'air';
  await K.tween(0.3, (t) => { h.hopY = Math.sin((t * Math.PI) / 2) * WIN_HOP; }); // háček zachytí rám
  K.sound('vrzani', { volume: 0.5 });
  const x0 = h.x;
  await K.tween(1.1, (t) => {
    const e = K.ease(t);
    h.hopY = WIN_HOP * (1 - Math.min(1, t * 1.6));
    h.x = x0 - 80 * e; // couvá a táhne
    st.win = e;
  });
  h.reach = false;
  const drained = K.tween(4.5, (t) => { st.smoke = 1 - K.ease(t); }); // kouř vytáhne oknem
  await K.after(0.5);
  await heroGo(POKER_X + 26); // pohrabáč zpátky na tyč
  h.facing = -1;
  await hop(18, 0.28);
  st.poker = 'rail';
  K.sound('tuk', { volume: 0.4 });
  await drained;
  st.phase = 'free';
  st.nextPuff = K.time + 1.5;
  K.busy--;
}

async function takePoker() {
  K.busy++;
  await heroGo(POKER_X + 26);
  st.hero.facing = -1;
  await hop(20, 0.28);
  st.poker = 'hero';
  K.sound('tuk', { volume: 0.4 });
  K.busy--;
}

// děda vyfoukne kouř a z něj nápověda: sněžná květina → hrnek se semínky
const CLOUD_LEN = 4.6;
function grandpaHint() {
  if (st.cloud && K.time - st.cloud.t0 < CLOUD_LEN) return;
  st.cloud = { t0: K.time };
  K.sound('dymka');
  for (let i = 0; i < 8; i++) puffAt(MOUTH.x - 14, MOUTH.y + 4, -K.rand(60, 120), -K.rand(30, 80), 0.9);
}

function puffAt(x, y, vx, vy, life = 1.8) {
  st.puffs.push({ x, y, vx, vy, r: K.rand(6, 11), t0: K.time, life: life * K.rand(0.8, 1.2) });
}

async function grannyAsk() {
  K.busy++;
  await heroGo(GIVE_X);
  st.hero.facing = -1;
  st.grannyIcon = { icon: 'rosti', until: K.time + 2 };
  K.busy--;
}

async function reachShelf() {
  K.busy++;
  await heroGo(MUG_X + 70);
  st.hero.facing = -1;
  await hop(46, 0.42);
  await hop(30, 0.34);
  st.heroIcon = { icon: 'hrnek', until: K.time + 1.6 };
  K.busy--;
}

async function catPet() {
  const c = st.cat;
  c.earT = K.time;
  c.purrT = K.time;
  K.sound('predeni', { volume: 0.7 });
}

// náruč roští od dveří → babka přiloží → oheň, pára, vůně → kocour → hrnek spadne do koše
async function fetchTwigs() {
  K.busy++;
  st.phase = 'chain';
  await heroGo(TWIGS_AT);
  st.hero.facing = 1;
  await hop(16, 0.26);
  K.sound('sustot');
  st.pile = false; // celá hromádka je v náruči, v rohu zůstane prázdno
  st.carry = true;
  await heroGo(GIVE_X, 260);
  st.hero.facing = -1;
  // babka si roští vezme a strčí ho do ohně
  st.carry = false;
  st.reach = true; // babka natáhne ruce (póza 4)
  const from = { x: st.hero.x - 10, y: FY - 250 };
  st.twigs = { x: from.x, y: from.y, s: 1, rot: -Math.PI / 2, a: 1 };
  await K.tween(0.6, (t) => {
    const e = K.ease(t);
    st.twigs.x = K.lerp(from.x, GRANNY_HANDS.x, e);
    st.twigs.y = K.lerp(from.y, GRANNY_HANDS.y, e) - Math.sin(t * Math.PI) * 50;
    st.twigs.rot = K.lerp(-Math.PI / 2, -0.25, e);
    st.twigs.s = K.lerp(1, 0.8, e);
  });
  const hx = st.twigs.x, hy = st.twigs.y;
  await K.tween(0.7, (t) => {
    const e = K.ease(t);
    st.lean = Math.sin(t * Math.PI); // předkloní se ke dvířkům
    st.twigs.x = K.lerp(hx, (FIRE.x0 + FIRE.x1) / 2, e);
    st.twigs.y = K.lerp(hy, FIRE.y1 - 30, e);
    st.twigs.s = K.lerp(0.8, 0.45, e);
    st.twigs.a = 1 - K.clamp((t - 0.6) / 0.4);
  });
  st.lean = 0;
  st.reach = false;
  st.twigs = null;
  K.sound('praskani');
  await K.tween(1.4, (t) => { st.fire = K.ease(t); });
  await heroGo(WATCH_X, 240);
  st.hero.facing = -1;
  await K.after(0.6);
  st.nextLid = K.time;
  await K.tween(1.8, (t) => { st.boil = t; });
  await K.after(0.4);
  await K.tween(2.6, (t) => { st.smell = t; }); // vlnky vůně dojdou až ke kocourovi
  await catWake();
  K.busy--;
}

async function catWake() {
  const c = st.cat;
  c.earT = K.time;
  await K.after(0.8);
  c.pose = 'stretch';
  K.sound('mnau');
  await K.after(1.3);
  c.pose = 'walk';
  await catGo([[CAT_BLANKET_END, CAT_BED.y]], 150); // pod křížalami: zavadí o ně
  await catLeap(CAT_LEDGE.x, CAT_LEDGE.y, 0.4, 20);
  K.sound('tuk', { volume: 0.35 });
  await catLeap(CAT_SHELF, SHELF_Y, 0.5, 40);
  K.sound('tuk', { volume: 0.5 });
  c.pose = 'walk';
  await catGo([[CAT_SNIFF, SHELF_Y]], 140);
  c.pose = 'sniff'; // čichá dolů k hrnci
  await K.after(1.4);
  c.pose = 'walk';
  await catGo([[CAT_BUMP, SHELF_Y]], 110);
  c.pose = 'sniff';
  await mugFall();
  await K.after(0.6);
  // kocour se vrátí po polici a skočí dědovi na hlavu; děda se lekne a upustí fajfku (Daniel 2026-11-13)
  c.pose = 'walk';
  await catGo([[CAT_SHELF, SHELF_Y]], 160);
  await catLeap(CAT_HEAD.x, CAT_HEAD.y, 0.65, 60);
  c.pose = 'sit';
  c.facing = -1;
  await grandpaStartle();
  await K.after(0.7);
  await catLeap(CAT_FLOOR.x, CAT_FLOOR.y, 0.85, 60);
  K.sound('tuk', { volume: 0.4 });
  c.pose = 'sit';
  c.facing = -1; // kouká k ohni a hrnci
  c.purrT = K.time;
  K.sound('predeni', { volume: 0.7 });
  st.angryT = K.time; // děda se zlobí (Daniel 2026-11-13: nesmát se, naštvaný a polekaný)
  K.sound('bruceni', { volume: 0.6 });
  st.phase = 'seeds';
}

// děda vyskočí leknutím (póza 3, kouká nahoru na kocoura), fajfka mu vypadne z ruky a skutálí se na zem
async function grandpaStartle() {
  st.startleT = K.time;
  K.sound('lek', { volume: 0.6 });
  K.sound('mnau', { volume: 0.5, rate: 1.3 });
  const c = st.cat, p = st.pipe;
  K.tween(0.45, (t) => { c.y = CAT_HEAD.y - Math.sin(t * Math.PI) * 40; }); // kocour s ním nadskočí
  p.state = 'fall';
  await K.tween(0.75, (t) => {
    p.x = K.lerp(PIPE_HAND.x, PIPE_FLOOR.x, t);
    p.y = K.lerp(PIPE_HAND.y, PIPE_FLOOR.y, t * t) - Math.sin(t * Math.PI) * 70;
    p.rot = K.lerp(0.3, PIPE_FLOOR.rot - Math.PI * 2, t); // jednou se protočí
  });
  p.rot = PIPE_FLOOR.rot;
  K.sound('tuk', { volume: 0.5, rate: 0.8 });
  await K.tween(0.25, (t) => { p.y = PIPE_FLOOR.y - Math.sin(t * Math.PI) * 10; }); // poskočí
  p.state = 'floor';
}

async function mugFall() {
  const m = st.mug;
  m.state = 'fall';
  K.sound('hrnek', { volume: 0.6 });
  // kocour ho šťouchne přes levý okraj police
  const x00 = m.x;
  await K.tween(0.35, (t) => { m.rot = -0.6 * K.ease(t); m.x = x00 - 14 * t; });
  const x0 = m.x, y0 = m.y;
  await K.tween(0.65, (t) => {
    m.x = K.lerp(x0, BASKET.x + 12, t);
    m.y = K.lerp(y0, BASKET.y - 8, t * t);
    m.rot = K.lerp(-0.6, -1.5, t); // dopadne na bok, otvorem doleva
    m.s = K.lerp(1, 1.12, t); // padá dopředu k nám
  });
  m.state = 'basket';
  K.sound('buch', { volume: 0.4 });
  K.sound('semena', { volume: 0.6 });
  // semínka se vysypou do koše
  for (let i = 0; i < 26; i++) {
    st.seeds.push({ x: m.x - K.rand(0, 36), y: m.y - 6, vx: K.rand(-110, 50), vy: K.rand(-170, -40),
      floor: BASKET.y + K.rand(-8, 6), rot: K.rand(0, 6), land: false });
  }
}

// z koše vezme semínka (→ batoh) i hrnek (→ nástroj, nabere do něj vodu u studánky)
async function takeSeeds() {
  K.busy++;
  await heroGo(BASKET.x + 120);
  st.hero.facing = -1;
  await hop(18, 0.28);
  st.taken = true;
  st.seeds = [];
  st.mug.state = 'taken';
  await Promise.all([
    K.solve('kantorska', 'semena', { x: BASKET.x, y: BASKET.y }),
    K.after(0.25).then(() => K.giveTool('hrnecek', { x: BASKET.x + 12, y: BASKET.y - 8 })),
  ]);
  K.busy--;
  await leaveWhenDone();
}

async function takePipe() {
  K.busy++;
  await heroGo(PIPE_FLOOR.x + (st.hero.x < PIPE_FLOOR.x ? -110 : 110));
  st.hero.facing = Math.sign(PIPE_FLOOR.x - st.hero.x);
  await hop(18, 0.28);
  st.pipe.state = 'taken';
  await K.giveTool('fajfka', { x: PIPE_FLOOR.x, y: PIPE_FLOOR.y });
  K.busy--;
  await leaveWhenDone();
}

// odejde, až má semínka, hrnek i fajfku (bez nich by u studánky nepochodil)
async function leaveWhenDone() {
  if (!st.taken || st.pipe.state !== 'taken') return;
  st.phase = 'done';
  await K.after(0.6);
  await leave(true);
}

// po vyřešení odejde panáček dveřmi; tlačítko zpět rovnou prolne zpátky na louku
async function leave(walk = false) {
  K.busy++;
  if (walk) await heroGo(DOOR_X - 80, 340);
  await K.fadeTo(1, 0.6, '#efe6d2');
  K.busy--;
  K.go('louka', { from: 'kantorska' });
}

// ---------- kresba ----------
// kus pozadí jako samostatný obrázek (poklice, dvířka, křídlo okna)
const cuts = {};
function cutBg(bg, name, r) {
  if (!cuts[name]) {
    const c = document.createElement('canvas');
    c.width = r.w; c.height = r.h;
    c.getContext('2d').drawImage(bg, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
    cuts[name] = c;
  }
  return cuts[name];
}

// otáčení kolem svislého pantu vlevo: úhel 0 = zavřeno, kladný = k nám; svislé proužky, bližší je vyšší
function drawSwing(ctx, art, r, angle, grow, shade) {
  const N = 28, cw = r.w / N, cos = Math.cos(angle), sin = Math.sin(angle);
  for (let i = 0; i < N; i++) {
    const u0 = i / N, u1 = (i + 1) / N;
    const xa = r.x + r.w * u0 * cos, xb = r.x + r.w * u1 * cos;
    const k = 1 + grow * ((u0 + u1) / 2) * sin, hh = r.h * k;
    ctx.drawImage(art, i * cw, 0, cw, r.h, Math.min(xa, xb) - 0.5, r.y + (r.h - hh) / 2, Math.abs(xb - xa) + 1, hh);
  }
  if (shade > 0) {
    ctx.fillStyle = `rgba(20, 12, 6, ${shade})`;
    const x1 = r.x + r.w * cos, hh = r.h * (1 + grow * sin);
    ctx.beginPath();
    ctx.moveTo(r.x, r.y); ctx.lineTo(x1, r.y + (r.h - hh) / 2); ctx.lineTo(x1, r.y + (r.h + hh) / 2); ctx.lineTo(r.x, r.y + r.h);
    ctx.fill();
  }
}

function drawWindow(ctx, bg) {
  if (st.win <= 0) return;
  const ven = K.img(IMG.ven);
  if (K.ready(ven)) ctx.drawImage(ven, OKNO.x, OKNO.y);
  const a = st.win * WIN_OPEN;
  drawSwing(ctx, cutBg(bg, 'okno', OKNO), OKNO, a, 0.2, 0.3 * Math.sin(Math.min(a, Math.PI / 2)));
}

// dvířka topeniště: otevřená doleva (babka u nich klečí), uvnitř tma, uhlíky a oheň
function drawFireDoor(ctx, bg) {
  ctx.fillStyle = '#120a06';
  ctx.fillRect(FIRE.x0, FIRE.y0, FIRE.x1 - FIRE.x0, FIRE.y1 - FIRE.y0);
  drawFire(ctx);
  if (bg) drawSwing(ctx, cutBg(bg, 'dvirka', DOOR), DOOR, 2.05, 0.12, 0.45);
}

const FLAME_PAD = 8;
let flameCanvas = null;
function drawFire(ctx) {
  const F = FIRE, w = F.x1 - F.x0, k = st.fire;
  ctx.save();
  ctx.beginPath(); ctx.rect(F.x0, F.y0, w, F.y1 - F.y0); ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  // doutnající uhlíky
  const ember = 0.28 + Math.sin(K.time * 1.7) * 0.07;
  const eg = ctx.createRadialGradient((F.x0 + F.x1) / 2, F.y1 - 8, 2, (F.x0 + F.x1) / 2, F.y1 - 8, 60);
  eg.addColorStop(0, `rgba(255, 90, 30, ${ember + k * 0.4})`);
  eg.addColorStop(1, 'rgba(120, 20, 0, 0)');
  ctx.fillStyle = eg;
  ctx.fillRect(F.x0, F.y0, w, F.y1 - F.y0);
  // plameny: měkké jazyky různé výšky a šířky, každý se třepotá jinak; kreslí se na malé plátno
  // a rozmaže se najednou (filtr na každý jazyk zvlášť by byl 11 průchodů za snímek)
  if (k > 0) {
    flameCanvas ??= Object.assign(document.createElement('canvas'), { width: w + 2 * FLAME_PAD, height: F.y1 - F.y0 + 2 * FLAME_PAD });
    const main = ctx;
    ctx = flameCanvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, flameCanvas.width, flameCanvas.height);
    ctx.translate(FLAME_PAD - F.x0, FLAME_PAD - F.y0);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 11; i++) {
      const hs = K.hash(i + 900), bx = F.x0 + 4 + (w - 8) * ((i + 0.5 * K.hash(i + 950)) / 11);
      const n = Math.sin(K.time * (6 + hs * 5) + i * 1.9) * 0.55 + Math.sin(K.time * (14 + hs * 6) + i * 3.1) * 0.3;
      const hgt = (24 + 48 * hs * hs + n * 14) * k, fw = 6 + 7 * K.hash(i + 970);
      const g = ctx.createLinearGradient(0, F.y1 - 6, 0, F.y1 - 8 - hgt);
      g.addColorStop(0, `rgba(255, 225, 120, ${0.8 * k})`);
      g.addColorStop(0.45, `rgba(255, 140, 40, ${0.55 * k})`);
      g.addColorStop(1, 'rgba(200, 50, 0, 0)');
      ctx.fillStyle = g;
      const sway = Math.sin(K.time * (4 + hs * 3) + i) * 6;
      ctx.beginPath();
      ctx.moveTo(bx - fw, F.y1 - 4);
      ctx.bezierCurveTo(bx - fw * 1.2, F.y1 - hgt * 0.45, bx + sway * 0.5 - fw * 0.3, F.y1 - hgt * 0.8, bx + sway, F.y1 - 8 - hgt);
      ctx.bezierCurveTo(bx + sway * 0.5 + fw * 0.3, F.y1 - hgt * 0.8, bx + fw * 1.2, F.y1 - hgt * 0.45, bx + fw, F.y1 - 4);
      ctx.fill();
    }
    ctx = main;
    ctx.filter = 'blur(2.5px)';
    ctx.drawImage(flameCanvas, F.x0 - FLAME_PAD, F.y0 - FLAME_PAD);
    ctx.filter = 'none';
  }
  ctx.restore();
}

// záře ohně do kuchyně (na babku, koš, podlahu)
function drawGlow(ctx) {
  const k = st.fire;
  if (k > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const fl = 0.85 + Math.sin(K.time * 9) * 0.08 + Math.sin(K.time * 23) * 0.05;
    const g = ctx.createRadialGradient(540, 745, 20, 540, 745, 460);
    g.addColorStop(0, `rgba(255, 140, 50, ${0.22 * k * fl})`);
    g.addColorStop(1, 'rgba(255, 120, 40, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(80, 285, 920, 795);
    ctx.restore();
  }
}

// babka a děda: pózy podle toho, co se děje, mezi pózami krátké prolnutí; dýchají a při kašli sebou škubnou
const coughK = (t0) => { const t = K.time - t0; return t < 0.9 ? Math.sin(t * 24) * (1 - t / 0.9) : 0; };
const COUGH_POSE = 1.2; // jak dlouho po zakašlání drží pózu s rukou u úst
function grannyPose() {
  if (K.time - st.cough.granny < COUGH_POSE) return 2;
  if (st.reach) return 4;
  if (st.grannyIcon && K.time < st.grannyIcon.until) return 3;
  return st.fire > 0 ? 5 : 1;
}
function grandpaPose() {
  if (K.time - st.startleT < 1.6) return DEDA_STARTLE; // leknutí: kouká nahoru na kocoura
  if (K.time - st.cough.grandpa < COUGH_POSE) return 2;
  if (st.cloud && K.time - st.cloud.t0 < CLOUD_LEN) return 3;
  if (K.time - st.angryT < 3.2) return DEDA_ANGRY;
  return 1;
}
function setPose(who, k) {
  const p = st.pose[who];
  if (k !== p.k) { p.prev = p.k; p.k = k; p.t = K.time; }
}
function drawFigure(ctx, who, at, dx, jerk, breath) {
  const p = st.pose[who];
  const u = K.clamp((K.time - p.t) / POSE_FADE);
  const one = (pose, alpha) => {
    const img = K.img(IMG[who][pose - 1]);
    if (!K.ready(img) || alpha <= 0) return;
    const [ax, ay] = POSE_ANCHOR[who][pose - 1];
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, at.x - ax + dx, at.y - ay + jerk);
  };
  ctx.save();
  // dech: lehce se natahuje nahoru od podlahy
  ctx.translate(at.x, at.y);
  ctx.scale(1, 1 + breath);
  ctx.translate(-at.x, -at.y);
  if (u < 1) one(p.prev, 1 - u);
  one(p.k, u < 1 ? Math.min(1, u * 1.5) : 1);
  ctx.restore();
}
function drawGranny(ctx) {
  const k = coughK(st.cough.granny);
  drawFigure(ctx, 'babka', GRANNY_AT, 12 * st.lean, Math.abs(k) * 3, Math.sin(K.time * 1.7) * 0.006);
}
function drawGrandpa(ctx) {
  const k = coughK(st.cough.grandpa), sT = K.time - st.startleT, aT = K.time - st.angryT;
  const jump = sT < 0.45 ? -Math.sin((sT / 0.45) * Math.PI) * 40 : 0; // leknutím nadskočí
  const shake = aT < 1.4 ? Math.sin(K.time * 32) * 4 * (1 - aT / 1.4) : 0; // vztekle se otřese
  drawFigure(ctx, 'deda', GRANDPA_AT, shake, Math.abs(k) * 3 + jump, Math.sin(K.time * 1.3 + 1) * 0.006);
}
function drawPipe(ctx) {
  const p = st.pipe;
  if (p.state === 'fall' || p.state === 'floor') drawImgAt(ctx, IMG.fajfka, p.x, p.y, 1, p.rot);
}

function drawSteam(ctx) {
  for (const s of st.steam) {
    const t = (K.time - s.t0) / s.life;
    ctx.fillStyle = `rgba(245, 242, 236, ${0.32 * (1 - t) * Math.min(1, t * 5)})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (1 + t * 2), 0, Math.PI * 2); ctx.fill();
  }
}

// vlnky vůně z hrnce: dokud kocour spí nahoře, míří k němu, pak jen stoupají
function drawSmell(ctx) {
  if (st.smell <= 0) return;
  const c = st.cat, up = c.pose === 'sit' || st.phase === 'seeds' || st.phase === 'done';
  const T = up ? { x: POT.x + 40, y: POT.y - 260 } : { x: c.x - 30 * c.facing, y: c.y - 40 };
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 244, 222, 0.75)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let j = 0; j < 3; j++) {
    const x0 = POT.x - 30 + j * 30, y0 = POT.y - 20;
    const pts = [];
    const N = 40, n = Math.round(N * st.smell);
    for (let i = 0; i <= n; i++) {
      const u = i / N;
      // nahoru, pak ohnout k cíli; vlnění putuje po čáře
      const bx = K.lerp(x0, T.x, u * u), by = K.lerp(y0, T.y, Math.sqrt(u));
      const wv = Math.sin(u * 14 - K.time * 4 + j * 2) * 9 * Math.sin(u * Math.PI);
      pts.push([bx + wv, by + wv * 0.3]);
    }
    if (pts.length < 2) continue;
    ctx.globalAlpha = 0.55 + 0.25 * Math.sin(K.time * 2 + j);
    ctx.setLineDash([18, 14]);
    ctx.lineDashOffset = -K.time * 30;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
  ctx.restore();
}

function drawPuffs(ctx) {
  for (const p of st.puffs) {
    const t = (K.time - p.t0) / p.life;
    ctx.fillStyle = `rgba(232, 230, 224, ${0.5 * (1 - t)})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + t * 2.2), 0, Math.PI * 2); ctx.fill();
  }
}

// kouř v kuchyni: dvě vrstvy měkkých chomáčů (hustší pod stropem) pomalu plují; po otevření okna
// zeslábnou, poplují k oknu a chomáčky vytékají ven
let smokeTex = null;
function makeSmoke() {
  const c = Object.assign(document.createElement('canvas'), { width: 480, height: 270 });
  const g = c.getContext('2d');
  for (let i = 0; i < 70; i++) {
    const x = K.hash(i + 300) * 480, y = K.hash(i + 400) ** 1.7 * 270, r = 28 + K.hash(i + 500) * 64;
    for (const ox of [-480, 0, 480]) { // dlaždice navazuje vodorovně
      const gr = g.createRadialGradient(x + ox, y, 0, x + ox, y, r);
      gr.addColorStop(0, 'rgba(168, 160, 148, 0.32)');
      gr.addColorStop(1, 'rgba(168, 160, 148, 0)');
      g.fillStyle = gr;
      g.fillRect(x + ox - r, y - r, 2 * r, 2 * r);
    }
  }
  return c;
}
function drawSmoke(ctx) {
  const k = st.smoke;
  if (k > 0.002) {
    smokeTex ??= makeSmoke();
    ctx.save();
    const tint = ctx.createLinearGradient(0, 0, 0, K.H);
    tint.addColorStop(0, `rgba(120, 112, 100, ${0.38 * k})`);
    tint.addColorStop(1, `rgba(120, 112, 100, ${0.12 * k})`);
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, K.W, K.H);
    const pull = st.phase === 'air' || st.phase === 'free' ? (1 - k) * 900 : 0; // táhne k oknu
    for (const [sp, dy, a] of [[14, 0, 0.9], [-9, 140, 0.7]]) {
      const off = (((K.time * sp + pull) % K.W) + K.W) % K.W;
      ctx.globalAlpha = k * a;
      ctx.drawImage(smokeTex, off - K.W, dy, K.W, K.H);
      ctx.drawImage(smokeTex, off, dy, K.W, K.H);
    }
    ctx.restore();
  }
  for (const w of st.wisps) {
    const t = (K.time - w.t0) / w.life;
    ctx.fillStyle = `rgba(200, 194, 182, ${0.45 * (1 - t) * Math.min(1, t * 4)})`;
    ctx.beginPath(); ctx.arc(w.x, w.y, w.r * (1 + t), 0, Math.PI * 2); ctx.fill();
  }
}

// obláček kouře s obrázky (jako bubliny stromu, jen z kouře)
function drawCloud(ctx) {
  const cl = st.cloud;
  if (!cl) return;
  const age = K.time - cl.t0;
  if (age > CLOUD_LEN) { st.cloud = null; return; }
  const a = K.clamp(Math.min(age / 0.5, (CLOUD_LEN - age) / 0.5));
  const C = CLOUD, grow = K.ease(K.clamp(age / 0.6));
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(238, 236, 230, 0.93)';
  // řetízek obláčků od dýmky
  [[1236, 462, 9], [1208, 408, 14], [1174, 348, 20]].forEach(([x, y, r], i) => {
    ctx.beginPath(); ctx.arc(x + Math.sin(K.time * 1.4 + i) * 2, y, r * grow, 0, Math.PI * 2); ctx.fill();
  });
  // nadýchaný okraj z kroužků
  for (let i = 0; i < 11; i++) {
    const an = (i / 11) * Math.PI * 2 + 0.3;
    const rr = C.r * (0.78 + 0.08 * Math.sin(K.time * 1.3 + i * 2));
    ctx.beginPath();
    ctx.arc(C.x + Math.cos(an) * rr, C.y + Math.sin(an) * rr * 0.82, C.r * 0.36 * grow, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath(); ctx.ellipse(C.x, C.y, C.r * grow, C.r * 0.84 * grow, 0, 0, Math.PI * 2); ctx.fill();
  // obrázky: květina, pak hrnek (prolnutí)
  const sw = 2.2;
  const k1 = K.clamp(Math.min((age - 0.4) / 0.3, (sw - age) / 0.3));
  const k2 = K.clamp(Math.min((age - sw) / 0.3, (CLOUD_LEN - 0.3 - age) / 0.3));
  ctx.globalAlpha = a * k1;
  K.drawIcon(ctx, 'kvetina', C.x, C.y, 120, '#4f4a44');
  ctx.globalAlpha = a * k2;
  K.drawIcon(ctx, 'hrnek', C.x, C.y + 6, 120, '#4f4a44');
  ctx.restore();
}

function drawImgAt(ctx, src, x, y, s, rot, alpha = 1) {
  const img = K.img(src);
  if (!K.ready(img)) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();
}

// křížaly na tyči: v teple od ohně se houpou víc, kocour o ně zavadí
function drawStrings(ctx) {
  st.strings.forEach((sg, i) => {
    const img = K.img(IMG.krizaly[i]);
    if (!K.ready(img)) return;
    const p = STRINGS[i], bt = K.time - sg.bumpT;
    const a = Math.sin(K.time * (1.1 + i * 0.17) + i * 1.7) * (0.012 + 0.05 * st.fire)
      + (bt < 3 ? Math.sin(bt * 6) * Math.exp(-bt * 1.4) * 0.22 : 0);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(a);
    ctx.drawImage(img, -img.width / 2, -2);
    ctx.restore();
  });
}

function drawPile(ctx) {
  if (!st.pile) return;
  const img = K.img(IMG.rosti);
  if (!K.ready(img)) return;
  ctx.fillStyle = 'rgba(30, 18, 8, 0.35)';
  ctx.beginPath(); ctx.ellipse(PILE.x, PILE.y - 6, img.width * 0.48, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.drawImage(img, PILE.x - img.width / 2, PILE.y - img.height);
}

// pohrabáč: na tyči sporáku, nebo v ruce panáčka háčkem nahoru
function drawPoker(ctx, onRail) {
  const img = K.img(IMG.pohrabac);
  if (!K.ready(img)) return;
  if (onRail) {
    if (st.poker === 'rail') ctx.drawImage(img, BOX.pohrabac.x, BOX.pohrabac.y);
    return;
  }
  if (st.poker !== 'hero') return;
  const h = st.hero, f = h.facing, s = HERO_S, y = h.y - h.hopY;
  const hand = h.reach ? [h.x + f * 8 * s, y - 122 * s] : [h.x + f * 21 * s, y - 60 * s];
  ctx.save();
  ctx.translate(hand[0], hand[1]);
  ctx.rotate(Math.PI + (h.reach ? 0 : f * 0.35));
  ctx.drawImage(img, -img.width / 2, -10);
  ctx.restore();
}

function drawMug(ctx) {
  const m = st.mug;
  if (m.state !== 'taken') drawImgAt(ctx, IMG.hrnek, m.x, m.y, m.s, m.rot);
  drawSeeds(ctx);
}

let basketFront = null;
function cutBasketFront(img) {
  const F = BASKET_FRONT, x = F.x0, y = BASKET.y, w = F.x1 - F.x0, h = F.bottom - y;
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
  const g = c.getContext('2d');
  g.translate(-x, -y);
  g.beginPath();
  g.ellipse(BASKET.x, BASKET.y, F.rx, F.ry, 0, 0, Math.PI);
  g.lineTo(F.x0, F.bottom); g.lineTo(F.x1, F.bottom); g.lineTo(F.x1, BASKET.y);
  g.closePath();
  g.clip();
  g.drawImage(img, BOX.kos.x, BOX.kos.y);
  return { c, x, y };
}

function drawSeeds(ctx) {
  ctx.save();
  for (const s of st.seeds) {
    ctx.fillStyle = '#efe7cf';
    ctx.strokeStyle = 'rgba(70, 55, 40, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(s.x, s.y, 3.2, 5, s.rot, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

// ---------- kocour (ZÁSTUPNÝ, kreslený) ----------
const FUR = '#8e877e', FUR_D = '#5d5750', FUR_L = '#cfc8bc';
function catPath(ctx, f, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath(); f(); ctx.fill(); ctx.stroke();
}
function catHead(ctx, hx, hy, r, eyes, tilt = 0) {
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(tilt);
  const earT = K.time - st.cat.earT, twitch = earT < 0.4 ? Math.sin(earT * 50) * 0.25 : 0;
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(sx * r * 0.55, -r * 0.6);
    ctx.rotate(sx * 0.25 + (sx > 0 ? twitch : 0));
    catPath(ctx, () => { ctx.moveTo(-r * 0.32, r * 0.2); ctx.lineTo(0, -r * 0.62); ctx.lineTo(r * 0.32, r * 0.2); ctx.closePath(); }, FUR);
    ctx.restore();
  }
  catPath(ctx, () => ctx.ellipse(0, 0, r * 1.08, r * 0.92, 0, 0, Math.PI * 2), FUR);
  ctx.fillStyle = FUR_L;
  ctx.beginPath(); ctx.ellipse(r * 0.35, r * 0.4, r * 0.42, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 2.2;
  if (eyes) {
    ctx.fillStyle = '#c9b25a';
    for (const ex of [0.05, 0.55]) {
      ctx.beginPath(); ctx.ellipse(ex * r, -r * 0.08, r * 0.17, r * 0.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = K.INK;
      ctx.beginPath(); ctx.ellipse(ex * r, -r * 0.08, r * 0.05, r * 0.16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9b25a';
    }
  } else {
    for (const ex of [0.05, 0.55]) { ctx.beginPath(); ctx.arc(ex * r, -r * 0.12, r * 0.16, 0.2, Math.PI - 0.2); ctx.stroke(); }
  }
  ctx.fillStyle = '#b07a6c';
  ctx.beginPath(); ctx.moveTo(r * 0.72, r * 0.18); ctx.lineTo(r * 0.92, r * 0.2); ctx.lineTo(r * 0.82, r * 0.34); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function catStripes(ctx, pts) {
  ctx.save();
  ctx.strokeStyle = FUR_D;
  ctx.lineWidth = 3;
  for (const [x, y, len, a] of pts) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
  }
  ctx.restore();
}
function catLeg(ctx, x0, y0, x1, y1) {
  ctx.save();
  ctx.strokeStyle = K.INK; ctx.lineWidth = 11; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = FUR; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.restore();
}
function catTail(ctx, pts, w = 10) {
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [col, lw] of [[K.INK, w + 5], [FUR, w]]) {
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]);
    ctx.stroke();
  }
  ctx.restore();
}

// kocour je Danielův obrázek (2026-11-13, prompt KC: kresba tuší, srst z jívových kočiček, python
// tools/sprity.py): pózy sleep / stretch / walk / leap / sniff / sit, kotva = střed spodku tlap.
// Obrázek je ve velikosti dřív kresleného kocoura (CAT_S), ve hře se zmenší na CAT_K.
function drawCat(ctx) {
  const c = st.cat, t = K.time, spr = K.sprite('kocour', c.pose);
  if (!spr) return drawCatPaper(ctx);
  const { sp, img } = spr;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(c.facing * CAT_K, CAT_K);
  ctx.rotate(c.rot); // zrcadlení už směr otočí samo
  if (!sp.right) ctx.scale(-1, 1);
  if (c.pose === 'sleep') ctx.scale(1, 1 + Math.sin(t * 1.8) * 0.025); // dýchá
  if (t - c.purrT < 2.5) ctx.translate(Math.sin(t * 40) * 0.6, 0); // přede
  const bob = c.pose === 'walk' ? Math.abs(Math.sin(c.phase)) * 3 : 0;
  ctx.drawImage(img, -sp.ax, -sp.ay - bob);
  ctx.restore();
}

// kreslený kocour (dokud se nenačte obrázek)
function drawCatPaper(ctx) {
  const c = st.cat, t = K.time;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(c.facing * CAT_S, CAT_S); // kreslí se hlavou doprava
  ctx.rotate(c.rot); // zrcadlení už směr otočí samo
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 2.6;
  ctx.lineJoin = 'round';
  const purr = t - c.purrT < 2.5 ? Math.sin(t * 40) * 0.6 : 0;
  if (c.pose === 'sleep') {
    const br = 1 + Math.sin(t * 1.8) * 0.035;
    catTail(ctx, [[-44, -14], [-50, 6], [10, 6], [36, -4]], 9);
    catPath(ctx, () => ctx.ellipse(-4, -24 * br, 50, 24 * br, 0, 0, Math.PI * 2), FUR);
    catStripes(ctx, [[-30, -44, 12, 1.4], [-14, -47, 12, 1.5], [2, -47, 12, 1.6]]);
    catHead(ctx, 34, -22 + purr, 15, false, 0.25);
  } else if (c.pose === 'sit') {
    catTail(ctx, [[-16, -6], [-30, 2], [10, 8], [34, 0]], 9);
    catPath(ctx, () => ctx.ellipse(0, -36 + purr * 0.5, 24, 38, 0.08, 0, Math.PI * 2), FUR);
    ctx.fillStyle = FUR_L;
    ctx.beginPath(); ctx.ellipse(10, -34, 11, 24, 0.1, 0, Math.PI * 2); ctx.fill();
    catStripes(ctx, [[-22, -50, 10, 0.2], [-23, -36, 10, 0.1], [-22, -22, 10, 0]]);
    catLeg(ctx, 8, -20, 12, -3);
    catLeg(ctx, 18, -20, 22, -3);
    catHead(ctx, 8, -84, 17, Math.sin(t * 0.7) > -0.6, -0.1); // občas spokojeně přimhouří oči
  } else {
    // stojí, jde, čichá, protahuje se, skáče
    const walk = c.pose === 'walk';
    const sw = walk ? Math.sin(c.phase) : 0;
    const stretch = c.pose === 'stretch', leap = c.pose === 'leap', sniff = c.pose === 'sniff';
    const tailUp = stretch ? -76 : -64;
    catTail(ctx, [[-42, -42], [-62, -50], [-70, tailUp - 10 + sw * 4], [-58, tailUp]], 9);
    if (leap) {
      catLeg(ctx, 30, -36, 62, -30); catLeg(ctx, 24, -32, 56, -22);
      catLeg(ctx, -32, -36, -66, -26); catLeg(ctx, -26, -32, -60, -18);
    } else {
      const fy = stretch ? -10 : -28;
      catLeg(ctx, 28, fy, 30 + sw * 10 + (stretch ? 24 : 0), 0);
      catLeg(ctx, 20, fy, 20 - sw * 10 + (stretch ? 22 : 0), 0);
      catLeg(ctx, -28, -30, -30 - sw * 10, 0);
      catLeg(ctx, -20, -30, -20 + sw * 10, 0);
    }
    ctx.save();
    ctx.translate(0, -38);
    ctx.rotate(stretch ? 0.22 : 0);
    catPath(ctx, () => ctx.ellipse(0, stretch ? 8 : 0, leap ? 54 : 46, stretch ? 16 : 20, 0, 0, Math.PI * 2), FUR);
    catStripes(ctx, [[-24, -18, 12, 1.5], [-8, -20, 12, 1.6], [8, -19, 12, 1.7]]);
    ctx.restore();
    if (sniff) catHead(ctx, 56, -24 + Math.sin(t * 8) * 1.5, 16, true, 0.5);
    else if (stretch) catHead(ctx, 62, -18, 16, false, 0.3);
    else catHead(ctx, 50, -56 - Math.abs(sw) * 2, 16, true, 0);
  }
  ctx.restore();
}

// papírová verze, dokud se nenačte obrázek
function drawPaper(ctx) {
  K.paper(ctx, '#e4dccb');
  K.ground(ctx, 960, '#8a6a48');
}

const inCat = (p) => K.dist(p, { x: st.cat.x, y: st.cat.y - 30 * CAT_S * CAT_K }) < 70 * CAT_S * CAT_K;
const busyPhase = () => st.phase === 'intro' || st.phase === 'air' || st.phase === 'chain' || st.phase === 'done';

const scene = {
  get st() { return st; }, // pro testy
  enter() {
    st = init();
    K.preloadSounds(['praskani', 'predeni', 'mnau', 'dymka', 'hrnek', 'semena', 'poklice', 'tuk', 'kasel', 'vrzani']);
    K.hero.visible = true;
    K.fade.a = 1;
    K.fadeTo(0, 0.7, '#efe6d2');
    intro();
  },
  update(dt) {
    setPose('babka', grannyPose());
    setPose('deda', grandpaPose());
    // v kouři babka s dědou střídavě kašlou; z dvířek čadí
    if (st.smoke > 0.35 && K.time > st.nextCough) {
      st.nextCough = K.time + K.rand(1.6, 3);
      cough(['granny', 'grandpa', 'granny', 'grandpa', 'hero'][st.coughWho++ % 5]);
    }
    if (st.smoke > 0.2 && Math.random() < dt * 5 * st.smoke) {
      puffAt(K.rand(FIRE.x0 + 10, FIRE.x1 - 10), FIRE.y0 + 6, K.rand(-15, 25), -K.rand(40, 80), 2.2);
    }
    // kouř vytéká oknem
    if (st.win > 0.5 && st.smoke > 0.05 && Math.random() < dt * 30 * st.smoke) {
      st.wisps.push({ x: K.rand(OKNO.x - 160, OKNO.x + 40), y: K.rand(OKNO.y, OKNO.y + OKNO.h), vx: K.rand(120, 220), vy: -K.rand(10, 50),
        r: K.rand(14, 26), t0: K.time, life: K.rand(0.9, 1.5) });
    }
    for (const w of st.wisps) { w.x += w.vx * dt; w.y += w.vy * dt; }
    st.wisps = st.wisps.filter((w) => K.time - w.t0 < w.life);
    // pára z hrnce
    if (st.boil > 0 && Math.random() < st.boil * dt * 14) {
      st.steam.push({ x: POT.x + K.rand(-70, 70), y: POT.y - 4, vx: K.rand(-10, 25), vy: -K.rand(50, 100),
        r: K.rand(8, 14), t0: K.time, life: K.rand(1.4, 2.2) });
    }
    for (const s of st.steam) { s.x += s.vx * dt; s.y += s.vy * dt; s.vx += 6 * dt; }
    st.steam = st.steam.filter((s) => K.time - s.t0 < s.life);
    // poklice občas zacvaká
    if (st.boil > 0.6 && K.time > st.nextLid) {
      st.lidT = K.time;
      st.nextLid = K.time + K.rand(2.6, 4.2);
      K.sound('poklice', { volume: 0.25 });
    }
    // děda (až je čistý vzduch) občas bafne z dýmky
    if (st.smoke < 0.3 && K.time > st.nextPuff && st.pose.deda.k === 1) {
      st.nextPuff = K.time + K.rand(4, 7);
      for (let i = 0; i < 3; i++) puffAt(PIPE.x, PIPE.y - 6, -K.rand(10, 30), -K.rand(30, 50));
    }
    for (const p of st.puffs) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.98; p.vy *= 0.985; }
    st.puffs = st.puffs.filter((p) => K.time - p.t0 < p.life);
    // kocour jde po dece pod křížalami a zavadí o ně
    const c = st.cat;
    if (c.y < CAT_BED.y + 5 && c.pose === 'walk') {
      st.strings.forEach((sg, i) => { if (Math.abs(c.x - 40 * CAT_S * c.facing - STRINGS[i].x) < 12 && K.time - sg.bumpT > 1) sg.bumpT = K.time; });
    }
    for (const s of st.seeds) {
      if (s.land) continue;
      s.vy += 900 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += dt * 8;
      if (s.vy > 0 && s.y >= s.floor) {
        s.y = s.floor;
        s.x = K.clamp(s.x, BASKET.x - 70, BASKET.x + 70);
        s.land = true;
      }
    }
  },
  draw(ctx) {
    const bg = K.img(BG), photo = K.ready(bg);
    if (photo) ctx.drawImage(bg, 0, 0, K.W, K.H);
    else drawPaper(ctx);
    if (photo) drawWindow(ctx, bg);
    drawPoker(ctx, true);
    drawStrings(ctx);
    drawFireDoor(ctx, photo ? bg : null);
    if (photo && st.boil > 0) {
      // poklice nadskakuje
      const lt = K.time - st.lidT;
      const dy = lt < 0.5 ? Math.abs(Math.sin(lt * 38)) * 4 * (1 - lt / 0.5) : 0;
      if (dy > 0.2) ctx.drawImage(cutBg(bg, 'poklice', LID), LID.x, LID.y - dy);
    }
    drawGranny(ctx);
    const kos = K.img(IMG.kos);
    if (K.ready(kos)) ctx.drawImage(kos, BOX.kos.x, BOX.kos.y);
    drawMug(ctx);
    if (st.mug.state === 'basket' && K.ready(kos)) {
      // přední stěna koše znovu přes hrnek a semínka, ať leží uvnitř
      basketFront ??= cutBasketFront(kos);
      ctx.drawImage(basketFront.c, basketFront.x, basketFront.y);
    }
    drawGrandpa(ctx);
    drawPipe(ctx);
    drawGlow(ctx);
    drawSteam(ctx);
    drawSmell(ctx);
    drawCat(ctx);
    drawPile(ctx);
    drawPuffs(ctx);
    if (st.twigs) drawImgAt(ctx, IMG.naruc, st.twigs.x, st.twigs.y, st.twigs.s, st.twigs.rot, st.twigs.a);
    const h = st.hero, ck = coughK(st.cough.hero);
    K.drawHero(ctx, h.x + ck * 3, h.y - h.hopY, HERO_S, { facing: h.facing, walking: h.walking, phase: h.phase, halo: false, reach: h.reach });
    drawPoker(ctx, false);
    // náruč roští nad hlavou
    if (st.carry) drawImgAt(ctx, IMG.naruc, h.x + h.facing * 6, h.y - 202 * HERO_S - h.hopY + Math.abs(Math.sin(h.phase)) * 3, 1, Math.PI / 2 - 0.08 * h.facing);
    drawSmoke(ctx);
    if (st.heroIcon && K.time < st.heroIcon.until) K.drawBubble(ctx, h.x + 24, h.y - 240, 0.95, st.heroIcon.icon);
    if (st.grannyIcon && K.time < st.grannyIcon.until) K.drawBubble(ctx, 500, 520, 0.95, st.grannyIcon.icon);
    drawCloud(ctx);
    K.drawRoundButton(ctx, EXIT.x, EXIT.y, 'zpet');
    if (K.debug) {
      ctx.strokeStyle = 'rgba(200, 0, 0, 0.7)';
      ctx.lineWidth = 2;
      for (const P of [GRANNY, GRANDPA]) { ctx.beginPath(); P.forEach(({ x, y }, i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke(); }
      for (const R of [BUNDLE_HIT, SHELF_HIT, WIN_HIT, POKER_HIT]) ctx.strokeRect(R.x, R.y, R.w, R.h);
      for (const q of [MOUTH, GRANDPA_COUGH, PIPE, GRANNY_MOUTH, GRANNY_HANDS, GRANNY_AT, GRANDPA_AT]) ctx.strokeRect(q.x - 6, q.y - 6, 12, 12);
      const B = BASKET_HIT;
      ctx.beginPath(); ctx.ellipse(B.x, B.y, B.rx, B.ry, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(BASKET.x, BASKET.y, BASKET_FRONT.rx, BASKET_FRONT.ry, 0, 0, Math.PI * 2); ctx.stroke();
    }
  },
  hot(p) {
    if (K.dist(p, EXIT) < 45) return true;
    if (busyPhase()) return false;
    if (st.phase === 'smoke') {
      return inRect(p, WIN_HIT) || (st.poker === 'rail' && inRect(p, POKER_HIT)) || K.inPolygon(p, GRANNY) || K.inPolygon(p, GRANDPA);
    }
    if (st.phase === 'seeds' && ((!st.taken && inBasket(p)) || inPipe(p))) return true;
    return K.inPolygon(p, GRANDPA) || ((st.cat.pose === 'sleep' || st.cat.pose === 'sit') && inCat(p))
      || (st.fire === 0 && ((st.pile && inRect(p, BUNDLE_HIT)) || K.inPolygon(p, GRANNY)))
      || (st.mug.state === 'shelf' && inRect(p, SHELF_HIT));
  },
  click(p) {
    if (K.dist(p, EXIT) < 45) return leave();
    if (busyPhase()) return;
    if (st.phase === 'smoke') {
      if (inRect(p, WIN_HIT)) return windowTry();
      if (st.poker === 'rail' && inRect(p, POKER_HIT)) return takePoker();
      if (K.inPolygon(p, GRANNY)) return cough('granny');
      if (K.inPolygon(p, GRANDPA)) return cough('grandpa');
    } else {
      if (st.phase === 'seeds' && inPipe(p)) return takePipe();
      if (st.phase === 'seeds' && !st.taken && inBasket(p)) return takeSeeds();
      if (K.inPolygon(p, GRANDPA)) return grandpaHint();
      if ((st.cat.pose === 'sleep' || st.cat.pose === 'sit') && inCat(p)) return catPet();
      if (st.fire === 0 && st.pile && inRect(p, BUNDLE_HIT)) return fetchTwigs();
      if (st.mug.state === 'shelf' && inRect(p, SHELF_HIT)) return reachShelf();
      if (st.fire === 0 && K.inPolygon(p, GRANNY)) return grannyAsk();
    }
    if (p.y > 900) {
      K.busy++;
      heroGo(K.clamp(p.x, 120, 1800)).then(() => K.busy--);
    }
  },
};
return scene;
})();
K.scenes.kantorska = KITCHEN;
