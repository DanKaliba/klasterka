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
K.drawHero = (ctx, x, y, s, o = {}) => {
  const f = o.facing || 1;
  const sw = o.walking ? Math.sin(o.phase || 0) : 0;
  const bob = o.walking ? Math.abs(Math.cos(o.phase || 0)) * 3 * s : 0;
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  twoPass(ctx, o.halo !== false, (pass) => {
    const lw = (pass ? 4.5 : 9) * Math.max(s, 0.35);
    const hy = y - 52 * s - bob, ny = y - 92 * s - bob;
    stroke(ctx, [[x, hy], [x + sw * 20 * s, y]], lw, 1);
    stroke(ctx, [[x, hy], [x - sw * 20 * s, y]], lw, 2);
    stroke(ctx, [[x, ny], [x, hy]], lw, 3);
    const armUp = o.wave ? -40 * s + Math.sin(K.time * 10) * 8 * s : 0;
    stroke(ctx, [[x, ny + 6 * s], [x + f * (16 + sw * 10) * s, ny + 34 * s + armUp]], lw, 4);
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

// ---------- ovce ----------
// o.skis, o.rot (náklon/kotrmelec), o.headUp, o.scarf (barva šály), o.hang (visí na kotvě)
K.drawSheep = (ctx, x, y, s, o = {}) => {
  const f = o.facing || 1;
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
      stroke(ctx, [[-40 * s, 27 * s], [34 * s, 27 * s], [44 * s, 21 * s]].map(([a, b]) => [a * f, b]), lw, 30, 0.6);
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

K.drawBird = (ctx, x, y, s) => {
  twoPass(ctx, false, () => {
    const w = Math.sin(K.time * 18) * 10 * s;
    stroke(ctx, [[x - 18 * s, y - w], [x, y], [x + 18 * s, y - w]], 4 * s, 90);
  });
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
K.drawIcon = (ctx, name, x, y, size, color = INK) => {
  const u = size / 24;
  ctx.save();
  ctx.translate(x, y);
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
