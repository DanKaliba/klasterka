// Boží muka nad Kantorskou: zanesená studánka a žába (Daniel 2026-11-12: „studánka je zaneřáděná
// a pod větvičkami sedí žába; hrdina musí studánku vyčistit a žábu vyhnat“; „žába se brání, hrdina ji
// musí něčím zahnat“; 2026-11-13 změnil: „žábu zažene hrdina tak, že začne kouřit fajfku a foukat dým
// na žábu. žábě kouř smrdí a odskáče pryč.“ Dřívější had z kořene je pryč.)
//
// Úkol (beze slov):
// - Ve studánce leží tři hromádky smrkových větviček, na hladině listí a bahno. Ze žlábku neteče nic.
// - Klik na větvičky: panáček je jednu po druhé vytáhne a odhodí na hromádku. Po první zpod zbylých
//   vykouknou oči, po třetí je vidět celá žába. Sedí přímo na vývěru pramene a ucpává ho.
// - Klik na žábu: 1. se postaví na zadní a dělá se větší (kvákne), 2. se otočí a cvrkne panáčkovi do
//   obličeje, ten se otřepe a couvne (a znovu při každém dalším kliku holou rukou).
// - Fajfka (Daniel 2026-11-13: point & click): hráč ji vytáhne z batůžku (klik na ni v HUD) a klikne
//   s ní na žábu. Panáček si ji dá do pusy, dvakrát bafne a foukne na žábu dým. Žábě smrdí, vyděsí se
//   a třemi skoky uteče doleva pryč. Od druhého cvrknutí má panáček bublinu s fajfkou (nápověda, můj nápad).
// - Pramen se uvolní: probublá, bahno odplave žlábkem, listí sjede přes jeho konec, voda se vyčistí.
// - Klik na konec žlábku: panáček podrží hrnek z kuchyně na Kantorské (Daniel 2026-11-13, místo džbánku,
//   scény na sebe navazují). Dokud neteče, hrnkem zatřese a schová ho. Když teče, nabere vodu → batoh.
//   Hrnek se taky musí vytáhnout z batůžku. Bez hrnku v ruce nastaví dlaně: voda proteče mezi prsty (nápověda, že je potřeba nádoba; můj nápad).
//   Studánka si pamatuje, co se v ní už udělalo, takže se pro hrnek dá dojít a vrátit se.
// Kříž podle Danielových fotek (pics/muka): šedý kovový kříž, zlatý Kristus, podstavec z červeného
// pískovce s deskou (nápis Ž 131,2, hra je beze slov, takže jen zlaté čáry). Klik na Krista = zaleskne se.
// Žába je Danielův obrázek (prompt Z v pics/podklady-muka/PROMPT-zaba.md, python tools/zaba.py).
// Póza 3 (cvrknutí: hlava vlevo, zvednutý zadek vpravo k panáčkovi) je z úpravy zaba-Z2.jpeg.
// Pozadí muka.jpg a vrstvy z něj: python tools/muka.py (prompt P v pics/podklady-muka/PROMPT-pozadi.md).
const MUKA = (() => {
const S = 'assets/sceny/';
const BG = S + 'muka.jpg';
const FROG_IMG = [1, 2, 3, 4, 5].map((k) => S + `zaba-${k}.png`);
for (const f of [BG, ...FROG_IMG, S + 'kuchyne-hrnek.png', 'assets/predmety/fajfka.png', S + 'muka-voda.png', S + 'muka-obruba.png', S + 'muka-stovik.png']) K.img(f);
// kotvy póz (vypisuje tools/zaba.py): střed spodku, u skoku (5) střed obrázku
const FROG_ANCHOR = [[63, 94], [53, 161], [52, 130], [66, 89], [77, 84]];
const FROG_RIGHT = [true, true, false, true, false]; // kam póza na obrázku kouká (3 = hlava vlevo)
const FROG_REAR = [60, -60]; // zadek pózy 3 vůči kotvě (odtud cvrkne)
const FROG_S = 0.85;
const FADE = '#efe6d2';
const EXIT = { x: 90, y: 990 };

// souřadnice změřené na pozadí muka.jpg (px snímku 1920×1080)
const FY = 885; // chodidla panáčka: tráva těsně před přední obrubou studánky
const HERO_S = 1.4;
const START_X = 1990; // přijde zprava (za šťovíkem)
const ENTER_X = 1560;
const BASIN = { x: 1140, y: 785, rx: 200, ry: 44 }; // hladina (přibližná elipsa: mráčky kalu, listí)
const SOURCE = { x: 1055, y: 760 }; // vývěr pramene vzadu ve studánce
const FROG_AT = { x: 1060, y: 792 };
const PEEK_LINE = 740; // nad touhle čarou koukají oči zpod větviček
const TROUGH = { x0: 1325, y0: 742, x1: 1668, y1: 779 }; // dno žlábku na fotce (začátek → konec)
const SPOUT = { x: 1672, y: 781 };
const SPOUT_GROUND = 850; // tráva pod koncem žlábku
const JUG_FILL = { x: 1676, y: FY + 6 }; // dno hrnku pod koncem žlábku
const MUG_IMG = S + 'kuchyne-hrnek.png'; // hrnek z kuchyně (63×51)
const MUG_S = 0.95; // menší, ať se vejde do ruky loutky
const MUG_H = 51 * MUG_S;
const SPOUT_HIT = { x: SPOUT.x + 5, y: 815, r: 70 };
const HEAP = { x: 1440, y: 712 }; // kam letí vytažené větvičky (tráva za studánkou)
const PIPE_IMG = 'assets/predmety/fajfka.png'; // dědova fajfka (svisle, náustek nahoře, 240 px)
const PIPE_S = 0.34;
const PIPE_ROT = 0.45; // jak moc fajfka v puse míří hlavičkou dopředu
const CHRIST = { x: 450, y: 255, r: 130 };
const TWIGS = [{ x: 1030, y: 752, rot: -0.3 }, { x: 1115, y: 764, rot: 0.12 }, { x: 1205, y: 754, rot: -0.15 }];
// útěk žáby doleva před podstavcem kříže a pryč ze scény
const ESCAPE = [{ x: 820, y: 870 }, { x: 560, y: 890 }, { x: 260, y: 895 }, { x: -140, y: 895 }];
// vrstvy vyříznuté z pozadí (python tools/muka.py vypíše levý horní roh každé)
const LAYERS = {
  voda: { src: S + 'muka-voda.png', x: 936, y: 734 }, // hladina: přes ni kal, a znovu přes nohy žáby
  obruba: { src: S + 'muka-obruba.png', x: 850, y: 780 }, // přední kameny
  stovik: { src: S + 'muka-stovik.png', x: 1230, y: 850 }, // šťovík v rohu, panáček jde za ním
};

const MUD = [107, 88, 62];
const CLEAR = [118, 170, 196];
const mix = (a, b, t) => a.map((v, i) => Math.round(K.lerp(v, b[i], t)));

let st = null;
const init = () => ({
  phase: 'intro', // intro → free → done
  hero: { x: START_X, y: FY, facing: -1, walking: false, phase: 0, hopY: 0, lean: 0, reach: false, wetT: -9 },
  twigs: TWIGS.map((t) => ({ ...t, gone: false, fly: false })),
  heap: 0,
  pipe: false, // panáček má fajfku v puse
  smoke: [], // obláčky dýmu
  heroIcon: null, // myšlenková bublina panáčka { icon, until }
  // žába: hidden (pod větvičkami) | peek (vykukují oči) | shown | big | squirt | scared | leap | gone
  frog: { state: 'hidden', x: FROG_AT.x, y: FROG_AT.y, flip: false, rot: 0, tries: 0, stinkT: -9 },
  drops: [],
  flow: 0, clear: 0, // pramen teče / voda se čistí
  floaters: Array.from({ length: 7 }, (_, i) => ({
    x: BASIN.x - 120 + i * 38 + K.rand(-10, 10), y: BASIN.y + K.rand(-18, 14), rot: K.rand(0, 6), c: i % 3, gone: false,
  })),
  clouds: [], bubbles: [],
  jug: { x: JUG_FILL.x, y: JUG_FILL.y, full: 0, held: false, shakeT: -9 }, // hrnek v ruce
  glintT: -9,
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
    K.walkStep(before, h.phase);
  });
  h.walking = false;
}
const face = (dir) => { st.hero.facing = dir; };
const lean = (to, dur = 0.25) => { const a = st.hero.lean; return K.tween(dur, (t) => { st.hero.lean = K.lerp(a, to, K.ease(t)); }); };
const hop = (height, dur = 0.3) => K.tween(dur, (t) => { st.hero.hopY = Math.sin(t * Math.PI) * height; });
// couvne (dívá se pořád stejným směrem)
const backOff = (dx, dur = 0.3) => { const x0 = st.hero.x; return K.tween(dur, (t) => { st.hero.x = x0 + dx * K.ease(t); st.hero.hopY = Math.sin(t * Math.PI) * 22; }); };

// ---------- scénky ----------
async function intro() {
  K.busy++;
  await heroGo(ENTER_X, 300);
  st.phase = 'free';
  K.busy--;
}

async function pullTwig(i) {
  K.busy++;
  const b = st.twigs[i];
  await heroGo(b.x + 95);
  face(-1);
  await lean(0.35);
  K.sound('sustot');
  b.fly = true;
  const from = { ...b }, to = { x: HEAP.x + st.heap * 22 - 20, y: HEAP.y - st.heap * 8 };
  lean(0, 0.3);
  await K.tween(0.75, (t) => {
    b.x = K.lerp(from.x, to.x, t);
    b.y = K.lerp(from.y, to.y, t) - Math.sin(t * Math.PI) * 240;
    b.rot = from.rot + t * (5 + i);
  });
  b.gone = true;
  b.x = to.x; b.y = to.y; b.rot = 0.1 * (st.heap - 1);
  st.heap++;
  const left = st.twigs.filter((t) => !t.gone).length;
  if (left === 2) st.frog.state = 'peek'; // zpod zbylých větviček vykouknou oči
  if (left === 0) {
    st.frog.state = 'shown';
    K.sound('kvak', { volume: 0.35, rate: 1.1 });
  }
  K.busy--;
}

// klik na žábu: s fajfkou v ruce (vytaženou z batůžku) na ni panáček foukne dým;
// holou rukou: 1. se postaví a dělá se větší, 2. a další cvrkne panáčkovi do obličeje
async function frogTouch(held) {
  K.busy++;
  const f = st.frog;
  if (held === 'fajfka') {
    await pipeSmoke();
    K.busy--;
    springFree();
    return;
  }
  const n = f.tries++;
  await heroGo(f.x + 135);
  face(-1);
  await lean(0.3, 0.3);
  if (n === 0) {
    f.state = 'big';
    K.sound('kvak');
    await K.after(0.15);
    await Promise.all([lean(-0.1, 0.2), backOff(50, 0.3)]);
    await K.after(1.0);
    f.state = 'shown';
    await lean(0, 0.2);
  } else {
    await squirt();
    // od druhého cvrknutí si panáček vzpomene na dědovu fajfku (v batůžku, nebo v kuchyni)
    if (n >= 2) st.heroIcon = { icon: 'fajfka', until: K.time + 1.8 };
  }
  K.busy--;
}

async function squirt() {
  const f = st.frog, h = st.hero;
  f.state = 'squirt';
  await K.after(0.35);
  K.sound('cvrk');
  // proud kapek ze zadku žáby do obličeje panáčka
  const from = { x: f.x + FROG_REAR[0] * FROG_S, y: f.y + FROG_REAR[1] * FROG_S }, to = mouth();
  for (let i = 0; i < 18; i++) {
    st.drops.push({ x0: from.x, y0: from.y, x1: to.x + K.rand(-10, 10), y1: to.y + K.rand(-12, 12), t0: K.time + i * 0.025, dur: 0.32 });
  }
  await K.after(0.4);
  h.wetT = K.time;
  K.sound('brr', { volume: 0.6, rate: 1.3 });
  await Promise.all([lean(-0.15, 0.2), backOff(60, 0.35)]);
  await K.after(0.6);
  await lean(0, 0.2);
  f.state = 'shown';
}

// fajfka: panáček si ji dá do pusy, dvakrát bafne (z hlavičky se kouří) a foukne dým na žábu.
// Žábě smrdí: vyděsí se, nad ní se vlní smrad a odskáče pryč.
const mouth = () => {
  const h = st.hero;
  return K.heroMouth(h.x, h.y - h.hopY, HERO_S, { facing: h.facing }) || { x: h.x + h.facing * 14, y: h.y - 143 - h.hopY };
};
function pipeBowl() {
  const m = mouth(), L = 240 * PIPE_S * 0.92, rot = -st.hero.facing * PIPE_ROT;
  return { x: m.x - Math.sin(rot) * L, y: m.y + Math.cos(rot) * L };
}
async function pipeSmoke() {
  const f = st.frog, h = st.hero;
  await heroGo(f.x + 190);
  face(-1);
  h.pipe = true;
  for (let i = 0; i < 2; i++) {
    K.sound('dymka', { volume: 0.6 });
    const b = pipeBowl();
    for (let k = 0; k < 3; k++) {
      st.smoke.push({ x0: b.x, y0: b.y - 6, x1: b.x + K.rand(-14, 14), y1: b.y - 90, t0: K.time + k * 0.12, dur: 1.4, r0: 4, r1: 16 });
    }
    await K.after(0.7);
  }
  // nádech a velký fouk k žábě
  await hop(8, 0.3);
  K.sound('foukani');
  const m = mouth();
  for (let k = 0; k < 9; k++) {
    st.smoke.push({ x0: m.x - 10, y0: m.y, x1: f.x + K.rand(-35, 35), y1: f.y - 55 + K.rand(-30, 20), t0: K.time + k * 0.06, dur: 1.5, r0: 6, r1: 30 + K.rand(0, 16) });
  }
  await K.after(0.9);
  f.state = 'scared';
  f.stinkT = K.time;
  K.sound('kvak', { volume: 0.7, rate: 1.5 });
  await K.after(1.1);
  await frogEscape();
  h.pipe = false;
}

async function frogEscape() {
  const f = st.frog;
  f.state = 'leap';
  for (const p of ESCAPE) {
    const x0 = f.x, y0 = f.y;
    K.sound('plesk', { volume: 0.4 });
    await K.tween(0.42, (t) => {
      f.x = K.lerp(x0, p.x, t);
      f.y = K.lerp(y0, p.y, t) - Math.sin(t * Math.PI) * 120;
      f.rot = K.lerp(0.35, -0.35, t); // odraz čumákem nahoru, dopad čumákem dolů
    });
    await K.after(0.12);
  }
  f.state = 'gone';
}

// pramen se uvolní: probublá, bahno a listí odplavou žlábkem, voda se vyčistí a teče
async function springFree() {
  K.busy++;
  K.sound('bublani');
  await K.tween(1.2, (t) => { st.flow = t; });
  K.sound('voda');
  await K.tween(3.5, (t) => { st.clear = K.ease(t); });
  K.busy--;
}

// held = nástroj v ruce (hrnek se musí vytáhnout z batůžku, jinak panáček nastaví dlaně)
// hrnek drží loutka v přední ruce před sebou (arm 'hold'), dno kousek pod dlaní; bez loutky nízko u nohou
const MUG_BELOW_HAND = 40;
function mugAt() {
  const h = st.hero, hp = K.heroHand(h.x, h.y - h.hopY, HERO_S, { facing: h.facing, arm: 'hold' });
  return hp ? { x: hp.x, y: hp.y + MUG_BELOW_HAND } : { x: h.x + h.facing * 52, y: h.y + 6 - h.hopY };
}
// kde stát, aby byl hrnek přesně pod koncem žlábku (panáček kouká doleva)
function mugStandX() {
  const hp = K.heroHand(0, 0, HERO_S, { facing: -1, arm: 'hold' });
  return JUG_FILL.x - (hp ? hp.x : -52);
}

async function jugTry(held) {
  K.busy++;
  const j = st.jug, h = st.hero;
  await heroGo(mugStandX(), 260);
  face(-1);
  const ready = st.clear > 0.98;
  if (held !== 'hrnecek') {
    // bez hrnku v ruce nastaví dlaně: z mokrého pramínku proteče voda mezi prsty, panáček si otřepe ruce
    h.reach = true;
    await K.after(0.6);
    if (st.flow > 0.5) {
      K.sound('splouchnuti', { volume: 0.4 });
      for (let i = 0; i < 6; i++) {
        st.drops.push({ x0: SPOUT.x + 10, y0: SPOUT.y + 50, x1: SPOUT.x + K.rand(-30, 50), y1: SPOUT_GROUND + 5, t0: K.time + i * 0.08, dur: 0.35 });
      }
      await K.after(0.6);
      h.wetT = K.time;
    } else {
      await K.after(0.5);
    }
    h.reach = false;
    K.busy--;
    return;
  }
  j.held = true;
  j.full = 0;
  await K.after(0.4);
  if (!ready) {
    // pod suchým žlábkem: nic neteče, zatřese hrnkem a schová ho
    await K.after(0.6);
    j.shakeT = K.time;
    await K.after(0.6);
    j.held = false;
    K.busy--;
    return;
  }
  K.sound('nalevani');
  await K.tween(1.6, (t) => { j.full = t; });
  st.phase = 'done';
  K.dropTool('hrnecek'); // hrnek s vodou je teď „voda“ v batohu
  j.held = false;
  await K.solve('kriz', 'voda', { x: j.x, y: j.y - 60 });
  await K.after(0.5);
  K.busy--;
  await leave(true);
}

async function leave(walk = false) {
  K.busy++;
  if (walk) await heroGo(START_X - 40, 340);
  await K.fadeTo(1, 0.5, FADE);
  K.busy--;
  K.go('louka', { from: 'kriz' });
}

// ---------- kresba ----------
// vrstva vyříznutá z pozadí (null, dokud se nenačte)
function layer(name) {
  const img = K.img(LAYERS[name].src);
  return K.ready(img) ? img : null;
}

// kal: hladina z pozadí obarvená do hněda (jednou, do vlastního plátna)
let mudCanvas = null;
function mudLayer() {
  if (mudCanvas) return mudCanvas;
  const img = layer('voda');
  if (!img) return null;
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = `rgb(${MUD})`;
  g.fillRect(0, 0, c.width, c.height);
  mudCanvas = c;
  return c;
}
const MUD_A = 0.82; // jak hustý je kal na začátku

function drawGlint(ctx, x, y, t0) {
  const gt = K.time - t0;
  if (gt >= 1.2) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const a = Math.sin((gt / 1.2) * Math.PI);
  const r = ctx.createRadialGradient(x, y, 0, x, y, 260);
  r.addColorStop(0, `rgba(255, 220, 120, ${0.55 * a})`);
  r.addColorStop(1, 'rgba(255, 220, 120, 0)');
  ctx.fillStyle = r;
  ctx.fillRect(x - 260, y - 260, 520, 520);
  ctx.restore();
}

// hladina: přes fotku čisté vody kal, který se po uvolnění pramene rozplyne
function drawWater(ctx) {
  const B = BASIN, L = LAYERS.voda;
  ctx.save();
  const mud = mudLayer();
  if (mud && st.clear < 1) {
    ctx.globalAlpha = MUD_A * (1 - st.clear);
    ctx.drawImage(mud, L.x, L.y);
    ctx.globalAlpha = 1;
  }
  // bahenní mráčky z vývěru
  ctx.save();
  ctx.beginPath(); ctx.ellipse(B.x, B.y, B.rx, B.ry, 0, 0, Math.PI * 2); ctx.clip();
  for (const c of st.clouds) {
    const u = (K.time - c.t0) / c.life;
    ctx.fillStyle = `rgba(92, 70, 44, ${0.55 * (1 - u)})`;
    ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r * (0.6 + u), c.r * 0.35 * (0.6 + u), 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // kroužky na hladině z vývěru
  if (st.flow > 0) {
    ctx.strokeStyle = `rgba(235, 245, 250, ${0.7 * st.flow})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const u = (K.time * 0.7 + i / 3) % 1;
      ctx.globalAlpha = 1 - u;
      ctx.beginPath(); ctx.ellipse(SOURCE.x, SOURCE.y, 10 + u * 70, 3 + u * 18, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.restore();
}

// nohy žáby ve vodě: přes spodek žáby se znovu nakreslí hladina (i s kalem)
function drawWaterOver(ctx, x, y) {
  const img = layer('voda'), L = LAYERS.voda;
  if (!img) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(x - 90, y - 10, 180, 60); ctx.clip();
  ctx.globalAlpha = 0.8;
  ctx.drawImage(img, L.x, L.y);
  const mud = mudLayer();
  if (mud && st.clear < 1) {
    ctx.globalAlpha = 0.8 * MUD_A * (1 - st.clear);
    ctx.drawImage(mud, L.x, L.y);
  }
  ctx.restore();
}

// vrstva z pozadí na svém místě (přední kameny obruby, šťovík)
function drawLayer(ctx, name) {
  const img = layer(name);
  if (img) ctx.drawImage(img, LAYERS[name].x, LAYERS[name].y);
}

function drawFloaters(ctx) {
  const cols = ['#9a6a2e', '#b88a3a', '#7a5a34'];
  for (const l of st.floaters) {
    if (l.gone) continue;
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate(l.rot);
    ctx.fillStyle = cols[l.c];
    ctx.strokeStyle = K.INK;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 13, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke();
    ctx.restore();
  }
}

// voda v žlábku z fotky a pramínek z jeho konce (do hrnku, nebo do trávy)
function drawTrough(ctx) {
  if (st.flow <= 0) return;
  const T = TROUGH;
  const c = mix(MUD, CLEAR, st.clear);
  ctx.save();
  ctx.strokeStyle = `rgba(${c}, ${0.9 * st.flow})`;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.setLineDash([16, 10]);
  ctx.lineDashOffset = -K.time * 80;
  ctx.beginPath(); ctx.moveTo(T.x0, T.y0 - 3); ctx.lineTo(T.x1, T.y1 - 3); ctx.stroke();
  ctx.setLineDash([]);
  const bottom = st.jug.held && Math.abs(st.jug.x - JUG_FILL.x) < 30 ? st.jug.y - MUG_H + 8 : SPOUT_GROUND;
  ctx.lineWidth = 5 * st.flow;
  ctx.beginPath(); ctx.moveTo(SPOUT.x, SPOUT.y - 2);
  ctx.quadraticCurveTo(SPOUT.x + 10, SPOUT.y + 6, SPOUT.x + 10, bottom);
  ctx.stroke();
  ctx.restore();
}

function drawTwig(ctx, b, seed) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.rot);
  ctx.strokeStyle = '#5b4330';
  K.stroke(ctx, [[-70, 0], [70, 0]], 6, seed);
  K.stroke(ctx, [[-20, 0], [10, -22]], 4, seed + 3);
  ctx.strokeStyle = '#3d5a3a';
  for (let i = -60; i <= 60; i += 12) {
    K.stroke(ctx, [[i, 0], [i + 12, -16]], 4, seed + i, 0.8);
    K.stroke(ctx, [[i, 0], [i + 12, 16]], 4, seed + i + 1, 0.8);
  }
  ctx.restore();
}

// žába z Danielova obrázku; k = póza 1–5, facingRight = kam má koukat; bez obrázku papírová zástupná
function drawFrogPose(ctx, k, x, y, facingRight, rot = 0) {
  const img = K.img(FROG_IMG[k - 1]);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(FROG_S * (facingRight === FROG_RIGHT[k - 1] ? 1 : -1), FROG_S);
  if (K.ready(img)) {
    const [ax, ay] = FROG_ANCHOR[k - 1];
    ctx.drawImage(img, -ax, -ay);
  } else {
    ctx.fillStyle = '#b07a3e';
    ctx.strokeStyle = K.INK;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, -36, 56, 36, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c9a23a';
    ctx.beginPath(); ctx.arc(34, -66, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

function drawFrog(ctx) {
  const f = st.frog;
  if (f.state === 'shown') drawFrogPose(ctx, 1, f.x, f.y, true);
  else if (f.state === 'big') drawFrogPose(ctx, 2, f.x, f.y + 6, true);
  else if (f.state === 'scared') drawFrogPose(ctx, 4, f.x + Math.sin(K.time * 60) * 2, f.y, true);
  else if (f.state === 'leap') drawFrogPose(ctx, 5, f.x, f.y - 50, false, f.rot);
  else if (f.state === 'squirt') drawFrogPose(ctx, 3, f.x, f.y, false); // zadkem k panáčkovi
}

// jen oči zpod větviček (horní kraj ospalé pózy)
function drawPeek(ctx) {
  const f = st.frog;
  ctx.save();
  ctx.beginPath(); ctx.rect(f.x - 70, f.y - 160, 160, PEEK_LINE - (f.y - 160)); ctx.clip();
  drawFrogPose(ctx, 1, f.x, f.y, true);
  ctx.restore();
}

// dědova fajfka v puse panáčka: náustek u pusy, hlavička visí dopředu dolů
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

// obláčky dýmu: rostou, zpomalují a mizí
function drawSmoke(ctx) {
  ctx.save();
  for (const p of st.smoke) {
    const u = (K.time - p.t0) / p.dur;
    if (u < 0 || u > 1) continue;
    const e = 1 - (1 - u) * (1 - u);
    const x = K.lerp(p.x0, p.x1, e) + Math.sin(K.time * 2 + p.r1) * 6 * u;
    const y = K.lerp(p.y0, p.y1, e);
    ctx.fillStyle = `rgba(232, 230, 222, ${0.75 * (1 - u)})`;
    ctx.beginPath(); ctx.arc(x, y, K.lerp(p.r0, p.r1, e), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// smrad nad vyděšenou žábou: tři zelenkavé vlnky stoupají vzhůru
function drawStink(ctx) {
  const f = st.frog, d = K.time - f.stinkT;
  if (d > 2.2 || !['scared', 'leap'].includes(f.state)) return;
  ctx.save();
  const a = Math.min(1, (2.2 - d) * 2);
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    const x0 = f.x + i * 26, y0 = f.y - 95 - ((d * 40 + i * 12) % 40);
    ctx.beginPath();
    for (let k = 0; k <= 10; k++) {
      const y = y0 - k * 5;
      const x = x0 + Math.sin(k * 0.9 + K.time * 6 + i) * 6;
      if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    // světlý lem, ať je vlnka vidět i na rezavé trávě
    ctx.strokeStyle = `rgba(245, 242, 225, ${0.7 * a})`;
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.strokeStyle = `rgba(78, 104, 28, ${0.95 * a})`;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.restore();
}

// hrnek z kuchyně (fotka), p = střed dna; voda se v něm zvedá k okraji
function drawJug(ctx, p, full) {
  const img = K.img(MUG_IMG);
  if (!K.ready(img)) return;
  const w = img.width * MUG_S;
  ctx.drawImage(img, p.x - w / 2, p.y - MUG_H, w, MUG_H);
  if (full > 0) {
    ctx.fillStyle = `rgba(95, 168, 211, ${0.9 * full})`;
    ctx.beginPath(); ctx.ellipse(p.x - 4 * MUG_S, p.y - MUG_H + 6, 22 * MUG_S * Math.min(1, full * 1.5), 4, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawDrops(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(200, 225, 235, 0.95)';
  for (const d of st.drops) {
    const u = (K.time - d.t0) / d.dur;
    if (u < 0 || u > 1) continue;
    const x = K.lerp(d.x0, d.x1, u), y = K.lerp(d.y0, d.y1, u) - Math.sin(u * Math.PI) * 60;
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

const inTwig = (p) => st.twigs.findIndex((b) => !b.gone && !b.fly && K.dist(p, b) < 75);
const frogHit = (p) => st.frog.state === 'shown' && K.dist(p, { x: st.frog.x, y: st.frog.y - 40 }) < 70;
const jugHit = (p) => K.dist(p, SPOUT_HIT) < SPOUT_HIT.r; // konec žlábku

const scene = {
  get st() { return st; }, // pro testy
  enter() {
    // rozdělaná studánka zůstane, jak byla (pro hrnek se dá dojít do kuchyně a vrátit se)
    if (!st || st.phase === 'done') st = init();
    else {
      st.phase = 'intro';
      Object.assign(st.hero, { x: START_X, facing: -1, walking: false, hopY: 0, lean: 0, reach: false });
      st.jug.held = false;
      st.heroIcon = null;
    }
    K.preloadSounds(['kvak', 'plesk', 'cvrk', 'dymka', 'foukani', 'bublani', 'nalevani', 'sustot', 'splouchnuti', 'voda', 'brr']);
    K.hero.visible = true;
    K.fade.a = 1;
    K.fadeTo(0, 0.6, FADE);
    intro();
  },
  update(dt) {
    st.drops = st.drops.filter((d) => K.time - d.t0 < d.dur);
    st.smoke = st.smoke.filter((p) => K.time - p.t0 < p.dur);
    // z uvolněného vývěru stoupají bublinky a odplouvá bahno
    if (st.flow > 0 && Math.random() < dt * 10 * st.flow) {
      st.bubbles.push({ x: SOURCE.x + K.rand(-10, 10), y: SOURCE.y + 4, t0: K.time, life: K.rand(0.4, 0.8) });
    }
    st.bubbles = st.bubbles.filter((b) => K.time - b.t0 < b.life);
    if (st.flow > 0 && st.clear < 0.85 && Math.random() < dt * 6) {
      st.clouds.push({ x: SOURCE.x + K.rand(-10, 20), y: SOURCE.y + K.rand(-4, 8), r: K.rand(20, 36), t0: K.time, life: K.rand(1.6, 2.4), vx: K.rand(50, 90) });
    }
    for (const c of st.clouds) c.x += c.vx * dt;
    st.clouds = st.clouds.filter((c) => K.time - c.t0 < c.life);
    // listí z hladiny proud odnese žlábkem
    if (st.flow > 0.5) {
      for (const l of st.floaters) {
        if (l.gone) continue;
        if (l.x < TROUGH.x0) {
          l.x += (40 + (l.x - BASIN.x + 200) * 0.25) * dt;
          l.y += (BASIN.y - 8 - l.y) * dt * 1.5;
        } else if (l.x < SPOUT.x) {
          l.x += 140 * dt;
          l.y = K.lerp(TROUGH.y0, TROUGH.y1, (l.x - TROUGH.x0) / (TROUGH.x1 - TROUGH.x0)) - 10;
        } else {
          l.y += 260 * dt;
          l.x += 20 * dt;
          if (l.y > 1000) l.gone = true;
        }
        l.rot += dt * 2;
      }
    }
  },
  draw(ctx) {
    const bg = K.img(BG);
    if (K.ready(bg)) ctx.drawImage(bg, 0, 0, K.W, K.H);
    else K.paper(ctx);
    drawGlint(ctx, CHRIST.x, CHRIST.y, st.glintT);
    drawWater(ctx);
    drawTrough(ctx);
    const f = st.frog;
    if (f.state !== 'leap') {
      drawFrog(ctx);
      if (['shown', 'big', 'squirt', 'scared'].includes(f.state)) drawWaterOver(ctx, f.x, f.y);
    }
    for (const b of st.bubbles) {
      const u = (K.time - b.t0) / b.life;
      ctx.strokeStyle = `rgba(240, 248, 252, ${1 - u})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(b.x, b.y - u * 10, 3 + u * 3, 0, Math.PI * 2); ctx.stroke();
    }
    drawFloaters(ctx);
    drawLayer(ctx, 'obruba');
    st.twigs.forEach((b, i) => !b.gone && !b.fly && drawTwig(ctx, b, 740 + i * 40));
    if (f.state === 'peek') drawPeek(ctx);
    // vytažené větvičky na hromádce
    st.twigs.forEach((b, i) => (b.gone || b.fly) && drawTwig(ctx, b, 740 + i * 40));
    drawStink(ctx);
    if (f.state === 'leap') drawFrog(ctx);
    const j = st.jug, h = st.hero;
    // panáček (náklon kolem chodidel), po cvrknutí se otřepává
    const wet = K.time - h.wetT < 0.7 ? Math.sin(K.time * 55) * 0.06 : 0;
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(-h.lean * h.facing + wet);
    K.drawHero(ctx, 0, -h.hopY, HERO_S, { facing: h.facing, walking: h.walking, phase: h.phase, halo: false, reach: h.reach,
      face: K.time - h.wetT < 1.3 ? 'wet' : null, arm: j.held ? 'hold' : h.pipe ? 'mouth' : null });
    ctx.restore();
    if (h.pipe) drawPipe(ctx);
    if (j.held) {
      const sh = K.time - j.shakeT < 0.6 ? Math.sin(K.time * 50) * 6 : 0;
      const m = mugAt();
      j.x = m.x;
      j.y = m.y;
      drawJug(ctx, { x: j.x + sh, y: j.y }, j.full);
    }
    drawDrops(ctx);
    drawSmoke(ctx);
    drawLayer(ctx, 'stovik');
    if (st.heroIcon && K.time < st.heroIcon.until) K.drawBubble(ctx, h.x + 24, h.y - 240, 0.95, st.heroIcon.icon);
    K.drawRoundButton(ctx, EXIT.x, EXIT.y, 'zpet');
    if (K.debug) {
      ctx.strokeStyle = 'rgba(200, 0, 0, 0.7)';
      ctx.lineWidth = 2;
      for (const c of [...st.twigs.map((b) => ({ ...b, r: 75 })), CHRIST, { x: f.x, y: f.y - 40, r: 70 }, SPOUT_HIT]) {
        ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.stroke();
      }
    }
  },
  hot(p) {
    if (K.dist(p, EXIT) < 45) return true;
    if (st.phase !== 'free' || K.busy) return false;
    return inTwig(p) >= 0 || frogHit(p) || jugHit(p) || K.dist(p, CHRIST) < CHRIST.r;
  },
  click(p) {
    if (K.dist(p, EXIT) < 45) return leave();
    if (st.phase !== 'free') return;
    const i = inTwig(p);
    if (i >= 0) return pullTwig(i);
    const held = K.held; // nástroj v ruce (vytažený z batůžku)
    if (frogHit(p)) return frogTouch(held);
    if (jugHit(p)) return jugTry(held);
    if (K.dist(p, CHRIST) < CHRIST.r) {
      if (K.time - st.glintT > 1.2) { st.glintT = K.time; K.sound('zvonek'); }
      return;
    }
    if (p.y > 840) {
      K.busy++;
      heroGo(K.clamp(p.x, 140, 1820)).then(() => K.busy--);
    }
  },
};
return scene;
})();
K.scenes.kriz = MUKA;
