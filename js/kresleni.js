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
// y = chodidla, s = měřítko (výška ~130·s)
// ---------- hrdina jako loutka ----------
// Danielovy díly (2026-11-13, python tools/sprity.py): hlava s čepicí z troudnatce (3 výrazy, prompt H2,
// K.SPRITY.hrdinaDily) a kloubové díly z H3 (K.SPRITY.hrdinaKlouby): trup, paže + předloktí a stehno +
// lýtko, bližší i vzdálené. Ruka se ohýbá v rameni a lokti, noha v kyčli a koleni.
// Klouby v px dílů (kotva každého dílu = střed horního kraje), postava hlavou doprava:
const HJ = {
  hip: { f: [62, 168], b: [70, 166] }, // kyčle na trupu
  shoulder: { f: [64, 50], b: [50, 48] }, // ramena na trupu
  neck: [75, 28], // spodek krku hlavy na trupu
  upper: 100, // rameno → loket
  thigh: 118, // kyčel → koleno
  mouth: [13, -33], // pusa vůči spodku krku hlavy
};
// úhly (rad, 0 = visí dolů, kladně = konec jde dozadu) podle toho, co panáček dělá
// o.reachA = jak daleko od svislice míří natažená ruka (výchozí 0.4; kuchyně ho dolaďuje k oknu)
function heroAngles(o) {
  const ph = o.phase || 0, walk = o.walking ? 1 : 0;
  const legs = (side) => {
    const p = ph + (side === 'f' ? 0 : Math.PI);
    return { thigh: -0.38 * walk * Math.sin(p), knee: walk * 0.55 * Math.max(0, Math.cos(p)) };
  };
  const arm = { f: { up: 0.3 * walk * Math.sin(ph), fore: -0.25 }, b: { up: -0.3 * walk * Math.sin(ph), fore: -0.25 } };
  if (o.arm === 'hold') arm.f = { up: -0.1, fore: -0.55 }; // drží něco před sebou v pase (hrnek)
  if (o.arm === 'mouth') arm.f = { up: -0.55, fore: -2.35 }; // ruka u pusy (fajfka)
  if (o.reach) arm.f = { up: -(Math.PI - (o.reachA ?? 0.4)), fore: -0.15 }; // natahuje se nahoru
  if (o.wave) arm.f = { up: -(Math.PI - 0.7), fore: -0.6 + Math.sin(K.time * 10) * 0.45 };
  return { legF: legs('f'), legB: legs('b'), armF: arm.f, armB: arm.b };
}
const rotV = (a, len) => [-Math.sin(a) * len, Math.cos(a) * len]; // vektor délky len pod úhlem a
const addV = (p, a, len) => { const v = rotV(a, len); return [p[0] + v[0], p[1] + v[1]]; };
// polohy kloubů v px dílů vůči chodidlům (trup se posadí tak, aby níž položené chodidlo bylo na zemi)
function heroJoints(o, P) {
  const a = heroAngles(o);
  // noha s trupem v počátku: kyčel → koleno → chodidlo
  const leg = (side, l) => {
    const hip = HJ.hip[side], knee = addV(hip, l.thigh, HJ.thigh);
    return { hip, knee, toe: addV(knee, l.thigh + l.knee, P.lytko.sp.h), l };
  };
  const lf = leg('f', a.legF), lb = leg('b', a.legB);
  const T = [-HJ.hip.f[0], -Math.max(lf.toe[1], lb.toe[1])]; // levý horní roh trupu (nejnižší chodidlo na y = 0)
  const at = (p) => [T[0] + p[0], T[1] + p[1]];
  const moved = (g) => ({ hip: at(g.hip), knee: at(g.knee), l: g.l });
  const arm = (side, an) => {
    const sh = at(HJ.shoulder[side]), elbow = addV(sh, an.up, HJ.upper);
    const fore = P[side === 'f' ? 'predlokti' : 'predlokti2'].sp.h * 0.92;
    return { sh, elbow, hand: addV(elbow, an.up + an.fore, fore), an };
  };
  const neck = at(HJ.neck);
  return { T, neck, armF: arm('f', a.armF), armB: arm('b', a.armB), legF: moved(lf), legB: moved(lb), top: neck[1] - P.hlava.sp.ay };
}
function heroParts(face) {
  const g = (n) => K.sprite('hrdinaKlouby', n);
  const h = (n) => K.sprite('hrdinaDily', n);
  const P = { trup: g('trup'), paze: g('paze'), predlokti: g('predlokti'), paze2: g('paze2'), predlokti2: g('predlokti2'),
    stehno: g('stehno'), lytko: g('lytko'), stehno2: g('stehno2'), lytko2: g('lytko2'),
    hlava: h(face === 'wet' ? 'hlavaMzouri' : face === 'startle' ? 'hlavaLek' : 'hlava') };
  return Object.values(P).every(Boolean) ? P : null;
}
// měřítko: celá loutka (chodidla → vršek čepice ve stoji s klidnou hlavou) = 150 * s jako dřív panáček z čar
let heroRef = 0;
// díly a klouby pro dané volby; v jednom snímku se pro stejné volby počítají jen jednou
// (scéna kreslí panáčka a pak se ptá na jeho ruku a pusu)
const heroCache = { t: -1, map: new Map() };
function heroSolve(o) {
  if (heroCache.t !== K.time) { heroCache.t = K.time; heroCache.map.clear(); }
  const key = [o.face, o.arm, o.reach ? 1 : 0, o.reachA, o.wave ? 1 : 0, o.walking ? 1 : 0, o.walking ? o.phase : 0].join('|');
  let r = heroCache.map.get(key);
  if (r === undefined) {
    const P = heroParts(o.face);
    if (P && !heroRef) {
      const neutral = heroParts(null);
      if (neutral) heroRef = -heroJoints({}, neutral).top;
    }
    r = P && heroRef ? { P, j: heroJoints(o, P) } : null;
    heroCache.map.set(key, r);
  }
  return r;
}
// přední ruka a pusa ve světě (pro pohrabáč, hrnek, fajfku); null, dokud se loutka nenačte.
// Předat stejné volby jako drawHero (walking, phase, arm, reach…), ať ruka sedí i v chůzi.
K.heroHand = (x, y, s, o = {}) => {
  const r = heroSolve(o);
  if (!r) return null;
  const k = (150 * s) / heroRef, f = o.facing || 1;
  return { x: x + f * k * r.j.armF.hand[0], y: y + k * r.j.armF.hand[1] };
};
K.heroMouth = (x, y, s, o = {}) => {
  const r = heroSolve(o);
  if (!r) return null;
  const k = (150 * s) / heroRef, f = o.facing || 1;
  return { x: x + f * k * (r.j.neck[0] + HJ.mouth[0]), y: y + k * (r.j.neck[1] + HJ.mouth[1]) };
};
// o.face: 'wet' (mžourá: mokrý, kašle) | 'startle' (vyděšený); o.arm: 'hold' | 'mouth'; o.reach (+ o.reachA), o.wave;
// o.halo (výchozí ano): světlý obrys, ať je malý panáček vidět na fotce louky
function drawHeroPuppet(ctxIn, x, y, s, o) {
  const r = heroSolve(o);
  if (!r) return false;
  const { P, j } = r, k = (150 * s) / heroRef, f = o.facing || 1;
  let ctx = ctxIn; // plátno, do kterého se právě kreslí díly (hra, nebo pomocné plátno pro obrys)
  const part = (p, at, rot) => {
    ctx.save();
    ctx.translate(at[0], at[1]);
    if (rot) ctx.rotate(rot);
    ctx.drawImage(p.img, -p.sp.ax, -p.sp.ay);
    ctx.restore();
  };
  const arm = (a, up, fore) => { part(fore, a.elbow, a.an.up + a.an.fore); part(up, a.sh, a.an.up); };
  const leg = (l, th, sh) => { part(sh, l.knee, l.l.thigh + l.l.knee); part(th, l.hip, l.l.thigh); };
  const puppet = (c, px, py) => {
    ctx = c;
    c.save();
    c.translate(px, py);
    c.scale(f * k, k);
    arm(j.armB, P.paze2, P.predlokti2); // vzdálená ruka a noha za trupem
    leg(j.legB, P.stehno2, P.lytko2);
    leg(j.legF, P.stehno, P.lytko);
    c.drawImage(P.trup.img, j.T[0], j.T[1]);
    part(P.hlava, j.neck, o.reach ? -0.12 : 0);
    arm(j.armF, P.paze, P.predlokti); // bližší ruka před trupem
    c.restore();
  };
  if (o.halo === false) { puppet(ctxIn, x, y); return true; }
  // světlý obrys kolem celé postavy: nejdřív bokem do plátna, pak jednou se stínem (jinak by záře
  // každého dílu zamlžila díly pod ním)
  const out = ctxIn, R = Math.ceil(heroRef * k * 0.75) + 12; // loutka se vejde do čtverce 2R kolem pasu
  const hc = heroHaloCanvas(2 * R);
  const g = hc.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, hc.width, hc.height);
  puppet(g, R, 1.5 * R);
  out.save();
  out.shadowColor = 'rgba(255, 252, 240, 0.9)';
  out.shadowBlur = Math.max(2, 5 * s);
  out.drawImage(hc, 0, 0, 2 * R, 2 * R, x - R, y - 1.5 * R, 2 * R, 2 * R);
  out.restore();
  return true;
}
let heroHalo = null;
function heroHaloCanvas(size) {
  if (!heroHalo) heroHalo = document.createElement('canvas');
  if (heroHalo.width < size || heroHalo.height < size) heroHalo.width = heroHalo.height = Math.max(size, heroHalo.width);
  return heroHalo;
}

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
K.drawHorse = (ctx, x, y, s, o = {}) => {
  const f = o.facing || 1;
  const st = o.walking ? Math.sin(o.phase || 0) * 10 * s : 0;
  twoPass(ctx, false, () => {
    const lw = 5 * s;
    ctx.fillStyle = '#8a5a3a';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(x, y - 70 * s, 55 * s, 24 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    [[-40, st], [-28, -st], [30, st], [42, -st]].forEach(([lx, sx], i) => stroke(ctx, [[x + lx * s, y - 52 * s], [x + lx * s + sx, y]], lw, 70 + i));
    stroke(ctx, [[x + f * 45 * s, y - 80 * s], [x + f * 70 * s, y - 130 * s]], 10 * s, 75);
    ctx.beginPath();
    ctx.ellipse(x + f * 82 * s, y - 128 * s, 22 * s, 11 * s, f * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    stroke(ctx, [[x - f * 55 * s, y - 75 * s], [x - f * 72 * s, y - 40 * s]], lw, 76);
  });
};

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

// ---------- ikony ----------
// batoh je fotka (Daniel 2026-11-10, python tools/batoh.py); dokud se nenačte, kreslí se čárou
// ikony z obrázků (batoh, nástroje); dokud se nenačtou, kreslí se čarou
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
    case 'plan':
      ctx.strokeRect(-8 * u, -10 * u, 16 * u, 20 * u);
      L([[-5, 6], [5, -6]]); L([[-5, 6], [-5, 2]]); L([[0, 0], [0, 4]]); L([[5, -6], [5, -2]]);
      break;
    case 'lyze':
      L([[-9, 9], [8, -8], [10, -10]]); L([[9, 9], [-8, -8], [-10, -10]]);
      break;
    case 'kotva':
      L([[0, -10], [0, 7]]); L([[-7, 7], [7, 7]]); C(0, -10, 2, true);
      break;
    case 'lano':
      C(0, 0, 9); C(0, 0, 6); C(0, 0, 3);
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
    case 'ovceLyze':
      // přání ovcí: lyže a vločka
      L([[-10, 8], [6, -9], [8, -11]]); L([[-4, 10], [10, -5], [11, -8]]);
      ctx.save(); ctx.translate(-6 * u, -6 * u); ctx.scale(0.45, 0.45);
      for (let a = 0; a < 3; a++) {
        const c = Math.cos(a * Math.PI / 3) * 10, s = Math.sin(a * Math.PI / 3) * 10;
        L([[-c, -s], [c, s]]);
      }
      ctx.restore();
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
    case 'klic':
      C(-5, 0, 4); L([[-1, 0], [10, 0]]); L([[6, 0], [6, 4]]); L([[9, 0], [9, 3]]);
      break;
    case 'zamek':
      ctx.strokeRect(-7 * u, -1 * u, 14 * u, 11 * u);
      ctx.beginPath(); ctx.arc(0, -1 * u, 5 * u, Math.PI, 0); ctx.stroke();
      break;
    case 'zpet':
      L([[8, 0], [-8, 0]]); L([[-2, -6], [-8, 0], [-2, 6]]);
      break;
    case 'znovu':
      ctx.beginPath(); ctx.arc(0, 0, 8 * u, -Math.PI * 0.3, Math.PI * 1.5); ctx.stroke();
      L([[0, -12], [0, -8], [4, -6]]);
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
    case 'pohrabac':
      // pohrabáč: očko nahoře, tyč a háček dole
      C(-2, -9, 2.6);
      L([[-1.6, -6.4], [1.4, 8]]);
      L([[1.4, 8], [2.4, 11], [6, 10.4], [6.4, 7]]);
      break;
    case 'rosti':
      // volná náruč roští (nesvázaná, Daniel 2026-11-09)
      L([[-11, 6], [10, -3]]); L([[-10, -2], [11, 5]]); L([[-8, 9], [9, 0]]);
      L([[-6, -6], [8, 8]]); L([[-2, 10], [4, -9]]); L([[5, -7], [7, -10]]); L([[-9, 2], [-11, -1]]);
      break;
    case 'ohen':
      ctx.beginPath();
      ctx.moveTo(0, -10 * u);
      ctx.quadraticCurveTo(8 * u, 0, 0, 9 * u);
      ctx.quadraticCurveTo(-8 * u, 0, 0, -10 * u);
      ctx.fill();
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
