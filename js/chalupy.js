// Detaily chalup a vrcholu. Každý detail = kulisa + pár klikacích míst + malý stavový automat.
// Úkoly jsou ZÁSTUPNÉ, dokud je Daniel nevymyslí a nenakreslí. Nakreslené pozadí se zapne
// polem bg: 'assets/sceny/<id>.jpg' a klikací místa se pak jen posunou na nové souřadnice.
const GROUND = 860;
const HERO_X = 230;
const EXIT = { x: 90, y: 990 };

const shake = (t0, amt = 8) => {
  const d = K.time - (t0 || -9);
  return d < 0.45 ? Math.sin(d * 60) * amt * (1 - d / 0.45) : 0;
};

function closeup(id, spec) {
  let st = null;
  const scene = {
    get st() { return st; }, // pro testy
    enter() {
      st = spec.init();
      K.hero.visible = true;
      K.fadeTo(0, 0.6, '#efe6d2');
    },
    draw(ctx) {
      const bg = spec.bg && K.img(spec.bg);
      if (bg && K.ready(bg)) ctx.drawImage(bg, 0, 0, K.W, K.H);
      else {
        K.paper(ctx, spec.paper);
        K.ground(ctx, GROUND, spec.groundColor);
      }
      spec.draw(ctx, st);
      K.drawHero(ctx, HERO_X, GROUND + 40, 1.8, { facing: 1, halo: false, wave: st.cheer });
      K.drawRoundButton(ctx, EXIT.x, EXIT.y, 'zpet');
      if (K.debug) {
        ctx.strokeStyle = 'rgba(200, 0, 0, 0.7)';
        for (const s of spec.spots) { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.stroke(); }
      }
    },
    spotAt(p) {
      return spec.spots.find((s) => (!s.when || s.when(st)) && (s.hit ? s.hit(p, st) : K.dist(p, s) < s.r));
    },
    hot(p) {
      return K.dist(p, EXIT) < 45 || !!scene.spotAt(p);
    },
    click(p) {
      if (K.dist(p, EXIT) < 45) return scene.leave();
      const s = scene.spotAt(p);
      if (s) s.click(st, scene);
    },
    async reward(item, from) {
      K.busy++;
      st.cheer = true;
      await K.solve(id, item, from);
      await K.after(0.7);
      K.busy--;
      scene.leave();
    },
    async leave() {
      K.busy++;
      await K.fadeTo(1, 0.5, '#efe6d2');
      K.busy--;
      K.go('louka', { from: id });
    },
  };
  K.scenes[id] = scene;
}

// ============ Spisovatel: rozsviť svíčku, spisovatel se probudí a napíše plán vleku ============
closeup('spisovatel', {
  init: () => ({ match: false, lit: false, awake: false, writing: false, hand: null }),
  draw(ctx, st) {
    K.drawHouse(ctx, 1520, GROUND + 10, 520, 330, { lit: st.lit });
    // pařez se sirkami
    ctx.fillStyle = '#8b6a48';
    ctx.strokeStyle = K.INK;
    ctx.lineWidth = 4;
    ctx.fillRect(590, 790, 100, 80);
    ctx.strokeRect(590, 790, 100, 80);
    if (!st.match) {
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(615, 768, 50, 22);
      ctx.strokeRect(615, 768, 50, 22);
    }
    // stůl, papír, svíčka
    K.stroke(ctx, [[860, 720], [1120, 720]], 8, 200);
    K.stroke(ctx, [[880, 720], [880, GROUND + 10]], 6, 201);
    K.stroke(ctx, [[1100, 720], [1100, GROUND + 10]], 6, 202);
    ctx.fillStyle = '#fffdf6';
    ctx.fillRect(1010, 708, 70, 10);
    const sx = 950 + shake(st.shakeT);
    ctx.fillStyle = '#f6efd9';
    ctx.fillRect(sx - 9, 664, 18, 56);
    ctx.strokeRect(sx - 9, 664, 18, 56);
    if (st.lit) {
      const fl = 1 + Math.sin(K.time * 20) * 0.08;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(sx, 640, 0, sx, 640, 160);
      g.addColorStop(0, 'rgba(255, 200, 90, 0.45)');
      g.addColorStop(1, 'rgba(255, 200, 90, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(sx - 160, 480, 320, 320);
      ctx.restore();
      ctx.save();
      ctx.translate(sx, 650);
      ctx.scale(fl, fl);
      K.drawIcon(ctx, 'ohen', 0, 0, 30, '#e67e22');
      ctx.restore();
    }
    const o = { hat: 'baret', sit: true, facing: -1, sleep: !st.awake, arm: st.writing ? 'write' : st.hand ? 'hold' : null };
    K.drawPerson(ctx, 1170, GROUND + 10, 1.7, o);
    if (st.hand) K.drawIcon(ctx, 'plan', o.hand.x, o.hand.y, 60);
    // sirka „v ruce“ jde za kurzorem
    if (st.match && !st.lit && K.mouse) {
      K.stroke(ctx, [[K.mouse.x, K.mouse.y + 40], [K.mouse.x, K.mouse.y]], 5, 210);
      K.drawIcon(ctx, 'ohen', K.mouse.x, K.mouse.y - 8, 18, '#e67e22');
    }
  },
  spots: [
    { x: 640, y: 780, r: 60, when: (st) => !st.match, click: (st) => { st.match = true; K.sound('sirka'); } },
    {
      x: 950, y: 680, r: 60, when: (st) => !st.lit,
      async click(st, scene) {
        if (!st.match) { st.shakeT = K.time; return; }
        st.lit = true;
        K.sound('svicka');
        K.busy++;
        await K.after(0.9);
        st.awake = true;
        st.writing = true;
        K.sound('psani');
        await K.after(1.8);
        st.writing = false;
        st.hand = true;
        await K.after(0.5);
        K.busy--;
        scene.reward('plan', { x: 1100, y: 720 });
      },
    },
    { x: 1170, y: 780, r: 90, when: (st) => !st.lit, click: () => K.sound('chrapot') },
  ],
});

// ============ Skočka: zatřes stromem, spadnou lyže ============
closeup('skocka', {
  init: () => ({ shakes: 0, skisY: 430, skisRot: 0, down: false }),
  draw(ctx, st) {
    // můstek
    ctx.strokeStyle = K.INK;
    K.stroke(ctx, [[420, 470], [520, 520], [640, 640], [760, 760], [900, 800]], 7, 300);
    [[520, 520], [640, 640], [760, 760]].forEach(([x, y], i) => K.stroke(ctx, [[x, y], [x, GROUND + 10]], 4, 310 + i));
    K.drawPerson(ctx, 1020, GROUND + 10, 1.7, { hat: 'cepice', facing: 1, arm: st.done ? 'up' : null });
    // strom
    const tx = 1450 + shake(st.shakeT, 14);
    ctx.fillStyle = '#6b4a30';
    ctx.fillRect(tx - 30, 560, 60, GROUND - 550);
    ctx.strokeRect(tx - 30, 560, 60, GROUND - 550);
    ctx.fillStyle = '#3d5a3a';
    [[620, 260], [480, 210], [340, 160]].forEach(([y, w]) => {
      ctx.beginPath();
      ctx.moveTo(tx - w, y);
      ctx.lineTo(tx, y - 210);
      ctx.lineTo(tx + w, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    // lyže v koruně / na zemi
    if (!st.done) {
      ctx.save();
      ctx.translate(st.down ? 1360 : tx + 10, st.skisY);
      ctx.rotate(st.skisRot);
      K.drawIcon(ctx, 'lyze', 0, 0, 110);
      ctx.restore();
    }
  },
  spots: [
    {
      x: 1450, y: 480, r: 220, when: (st) => st.shakes < 3,
      async click(st) {
        st.shakes++;
        st.shakeT = K.time;
        K.sound('sustot');
        if (st.shakes < 3) return;
        K.busy++;
        await K.tween(0.8, (t) => { st.skisY = K.lerp(430, GROUND - 30, t * t); st.skisRot = t * 1.6; });
        st.down = true;
        st.skisRot = Math.PI / 2;
        K.sound('buch');
        K.busy--;
      },
    },
    {
      x: 1360, y: GROUND - 30, r: 80, when: (st) => st.down && !st.done,
      click: (st, scene) => { st.done = true; scene.reward('lyze', { x: 1360, y: GROUND - 30 }); },
    },
  ],
});

// ============ Kantorská: kolik ovcí je na tabuli? ============
const CARD_DOTS = [2, 4, 3];
const CARD_X = [820, 1040, 1260];
closeup('kantorska', {
  init: () => ({ wrongT: [], correct: false }),
  draw(ctx, st) {
    ctx.fillStyle = '#2f4a3a';
    ctx.strokeStyle = '#6b4a30';
    ctx.lineWidth = 16;
    ctx.fillRect(780, 240, 600, 320);
    ctx.strokeRect(780, 240, 600, 320);
    for (let i = 0; i < 3; i++) K.drawSheep(ctx, 860 + i * 125, 420, 1.0, { halo: false, facing: 1 });
    ctx.fillStyle = '#e8e8e0';
    ctx.font = '700 80px Georgia, serif';
    ctx.fillText('= ?', 1215, 440);
    CARD_X.forEach((x, i) => {
      const dx = shake(st.wrongT[i], 10);
      const glow = st.correct && i === 2;
      ctx.fillStyle = glow ? '#fff6c8' : '#fffdf6';
      ctx.strokeStyle = K.INK;
      ctx.lineWidth = 4;
      ctx.fillRect(x - 70 + dx, 690, 140, 110);
      ctx.strokeRect(x - 70 + dx, 690, 140, 110);
      ctx.fillStyle = K.INK;
      for (let d = 0; d < CARD_DOTS[i]; d++) {
        ctx.beginPath();
        ctx.arc(x + dx - ((CARD_DOTS[i] - 1) * 28) / 2 + d * 28, 745, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    // zvonek
    ctx.save();
    ctx.translate(1600, 300);
    ctx.rotate(st.correct ? Math.sin(K.time * 18) * 0.4 : 0);
    ctx.fillStyle = '#d4a017';
    ctx.strokeStyle = K.INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-40, 90);
    ctx.quadraticCurveTo(-36, 10, 0, 0);
    ctx.quadraticCurveTo(36, 10, 40, 90);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    K.stroke(ctx, [[1600, 220], [1600, 300]], 4, 400);
    K.drawPerson(ctx, 1560, GROUND + 10, 1.8, { hat: 'drdol', facing: -1, arm: st.correct ? 'up' : 'hold' });
  },
  spots: CARD_X.map((x, i) => ({
    x, y: 745, r: 75, when: (st) => !st.correct,
    async click(st, scene) {
      if (CARD_DOTS[i] !== 3) { st.wrongT[i] = K.time; K.sound('spatne'); return; }
      st.correct = true;
      K.sound('zvonek');
      K.busy++;
      await K.after(1.2);
      K.busy--;
      scene.reward('kotva', { x: 1500, y: 640 });
    },
  })),
});

// ============ Boží muka nad Kantorskou: vyčisti studánku, natoč vodu do džbánku ============
// Kříž podle Danielových fotek (pics/muka): šedý kovový kříž, zlatý Kristus, podstavec z červeného
// pískovce s deskou (nápis Ž 131,2 — hra je beze slov, takže jen zlaté čáry). Pod křížem studánka,
// ze které teče voda trubkou do Kantorské.
const CROSS_X = 760;
const SPOUT = { x: 1262, y: 880 };
const JUG_HOME = { x: 1060, y: GROUND - 4 };
const JUG_FILL = { x: 1268, y: SPOUT.y + 92 }; // hrdlo těsně pod žlábkem

function drawWaysideCross(ctx, x, g, glint) {
  ctx.save();
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  // kamenná plotna a pískovcový podstavec
  ctx.fillStyle = '#cfc8b8';
  ctx.beginPath();
  ctx.moveTo(x - 170, g + 14); ctx.lineTo(x - 140, g - 12); ctx.lineTo(x + 150, g - 12); ctx.lineTo(x + 175, g + 14);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9c5546';
  const block = (x0, y0, x1, y1) => { ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); };
  block(x - 120, g - 170, x + 120, g - 10);
  block(x - 138, g - 205, x + 138, g - 170);
  ctx.beginPath(); // oblouk nad římsou
  ctx.moveTo(x - 105, g - 205); ctx.lineTo(x - 105, g - 245);
  ctx.quadraticCurveTo(x, g - 300, x + 105, g - 245); ctx.lineTo(x + 105, g - 205);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  block(x - 72, g - 310, x + 72, g - 262);
  // deska s nápisem (jen zlaté čáry)
  ctx.fillStyle = '#3a3d40';
  block(x - 82, g - 155, x + 82, g - 30);
  ctx.strokeStyle = '#d9b14a';
  [-120, -95, -70, -45].forEach((dy, i) => K.stroke(ctx, [[x - 60 + (i % 2) * 12, g + dy], [x + 60 - (i % 2) * 12, g + dy]], 3, 700 + i, 0.8));
  // kovový kříž s rozšířenými konci a nýty
  ctx.strokeStyle = K.INK;
  ctx.fillStyle = '#8d949a';
  const top = g - 760, bar = g - 610;
  block(x - 20, top, x + 20, g - 310);
  block(x - 210, bar - 20, x + 210, bar + 20);
  [[x, top, 0], [x - 210, bar, 1], [x + 210, bar, 1]].forEach(([ex, ey, side]) => {
    ctx.beginPath();
    if (side) ctx.ellipse(ex, ey, 14, 30, 0, 0, Math.PI * 2);
    else ctx.ellipse(ex, ey, 30, 14, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  });
  ctx.fillStyle = '#4a4f54';
  [[x, top + 12], [x, top + 60], [x - 200, bar], [x + 200, bar], [x, g - 360], [x, g - 330]].forEach(([rx, ry]) => {
    ctx.beginPath(); ctx.arc(rx, ry, 5, 0, Math.PI * 2); ctx.fill();
  });
  // zlatý Kristus; po kliknutí se zalesknou
  ctx.strokeStyle = '#c99a1e';
  ctx.lineCap = 'round';
  K.stroke(ctx, [[x - 170, bar - 12], [x - 14, bar + 22], [x + 14, bar + 22], [x + 170, bar - 12]], 12, 720, 0.6);
  ctx.fillStyle = '#d9b14a';
  ctx.beginPath(); ctx.arc(x, bar + 2, 17, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 20, bar + 24); ctx.lineTo(x + 20, bar + 24); ctx.lineTo(x + 14, bar + 130); ctx.lineTo(x - 14, bar + 130);
  ctx.closePath(); ctx.fill();
  K.stroke(ctx, [[x - 6, bar + 130], [x - 4, bar + 215]], 11, 721, 0.6);
  K.stroke(ctx, [[x + 6, bar + 130], [x + 2, bar + 215]], 11, 722, 0.6);
  const gt = K.time - (glint ?? -9);
  if (gt < 1.2) {
    ctx.globalCompositeOperation = 'lighter';
    const a = Math.sin((gt / 1.2) * Math.PI);
    const r = ctx.createRadialGradient(x, bar + 40, 0, x, bar + 40, 260);
    r.addColorStop(0, `rgba(255, 220, 120, ${0.55 * a})`);
    r.addColorStop(1, 'rgba(255, 220, 120, 0)');
    ctx.fillStyle = r;
    ctx.fillRect(x - 260, bar - 220, 520, 520);
  }
  ctx.restore();
}

function drawSpruceBranch(ctx, b, seed) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.rot);
  ctx.strokeStyle = '#5b4330';
  K.stroke(ctx, [[-70, 0], [70, 0]], 6, seed);
  ctx.strokeStyle = '#3d5a3a';
  for (let i = -60; i <= 60; i += 14) {
    K.stroke(ctx, [[i, 0], [i + 12, -16]], 4, seed + i, 0.8);
    K.stroke(ctx, [[i, 0], [i + 12, 16]], 4, seed + i + 1, 0.8);
  }
  ctx.restore();
}

function drawJug(ctx, p, full) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = '#c98b5a';
  ctx.strokeStyle = K.INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-18, -78); ctx.lineTo(18, -78);
  ctx.quadraticCurveTo(14, -60, 34, -40); ctx.quadraticCurveTo(46, -10, 26, 0);
  ctx.lineTo(-26, 0); ctx.quadraticCurveTo(-46, -10, -34, -40); ctx.quadraticCurveTo(-14, -60, -18, -78);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(40, -46, 16, -Math.PI / 2, Math.PI / 2); ctx.stroke(); // ucho
  if (full > 0) {
    ctx.fillStyle = `rgba(95, 168, 211, ${full})`;
    ctx.beginPath(); ctx.ellipse(0, -78, 17, 5, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

closeup('kriz', {
  paper: '#e9e4d4',
  groundColor: '#b9c08e',
  init: () => ({
    branches: [{ x: 1236, y: 870, rot: -0.35 }, { x: 1320, y: 902, rot: 0.15 }, { x: 1405, y: 892, rot: -0.1 }],
    flow: 0, jug: { ...JUG_HOME }, full: 0, glintT: null, jugT: null, done: false,
  }),
  draw(ctx, st) {
    // Kantorská dole vpravo, vede k ní trubka ze studánky
    K.drawHouse(ctx, 1790, GROUND + 6, 200, 140, { lit: st.flow >= 1, roof: '#7a3b2e' });
    ctx.strokeStyle = '#6d5a4a';
    K.stroke(ctx, [[1450, 912], [1600, 925], [1700, 930]], 8, 730);
    if (st.flow > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(95, 168, 211, 0.9)';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 18]);
      ctx.lineDashOffset = -K.time * 60;
      ctx.globalAlpha = st.flow;
      ctx.beginPath(); ctx.moveTo(1450, 912); ctx.lineTo(1600, 925); ctx.lineTo(1700, 930); ctx.stroke();
      ctx.restore();
    }
    if (st.flow >= 1) K.drawPerson(ctx, 1660, GROUND + 10, 1.1, { hat: 'drdol', facing: -1, arm: 'up' });
    drawWaysideCross(ctx, CROSS_X, GROUND + 10, st.glintT);
    // studánka: kamenná obruba, voda z dřevěného žlábku
    ctx.save();
    ctx.strokeStyle = K.INK;
    ctx.lineWidth = 4;
    const mud = [107, 90, 67], water = [95, 168, 211];
    const c = mud.map((m, i) => Math.round(K.lerp(m, water[i], st.flow)));
    ctx.fillStyle = `rgb(${c})`;
    ctx.beginPath(); ctx.ellipse(1330, 905, 120, 34, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a8a196';
    for (let a = 0; a < 14; a++) {
      const t = (a / 14) * Math.PI * 2;
      ctx.beginPath(); ctx.ellipse(1330 + Math.cos(t) * 124, 905 + Math.sin(t) * 38, 20, 11, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#8b6a48';
    ctx.beginPath(); ctx.moveTo(1150, 850); ctx.lineTo(SPOUT.x, SPOUT.y - 8); ctx.lineTo(SPOUT.x, SPOUT.y + 4); ctx.lineTo(1150, 864);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (st.flow > 0) {
      ctx.fillStyle = 'rgba(95, 168, 211, 0.95)';
      for (let i = 0; i < 6; i++) {
        const t = (K.time * 2.2 + i / 6) % 1;
        ctx.globalAlpha = st.flow;
        ctx.beginPath(); ctx.arc(SPOUT.x + 4 + t * 6, SPOUT.y + t * 30, 5 - t * 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
    st.branches.forEach((b, i) => !b.gone && drawSpruceBranch(ctx, b, 740 + i * 40));
    drawJug(ctx, { x: st.jug.x + shake(st.jugT), y: st.jug.y }, st.full);
  },
  spots: [
    ...[0, 1, 2].map((i) => ({
      x: 0, y: 0, r: 80,
      when: (st) => !st.branches[i].gone && !st.branches[i].fly,
      hit: (p, st) => K.dist(p, st.branches[i]) < 80,
      async click(st) {
        const b = st.branches[i], from = { ...b };
        b.fly = true;
        K.sound('sustot');
        await K.tween(0.7, (t) => { b.x = from.x + t * 420; b.y = from.y - Math.sin(t * Math.PI) * 260 - t * 120; b.rot = from.rot + t * 5; });
        b.gone = true;
        if (!st.branches.every((o) => o.gone)) return;
        K.busy++;
        K.sound('voda');
        await K.tween(1.6, (t) => { st.flow = t; });
        K.busy--;
      },
    })),
    {
      x: 0, y: 0, r: 70, when: (st) => !st.done,
      hit: (p, st) => K.dist(p, { x: st.jug.x, y: st.jug.y - 40 }) < 70,
      async click(st, scene) {
        if (st.flow < 1) { st.jugT = K.time; return; }
        st.done = true;
        K.busy++;
        await K.tween(0.8, (t) => { st.jug.x = K.lerp(JUG_HOME.x, JUG_FILL.x, K.ease(t)); st.jug.y = K.lerp(JUG_HOME.y, JUG_FILL.y, K.ease(t)) - Math.sin(t * Math.PI) * 80; });
        await K.tween(1.2, (t) => { st.full = t; });
        K.busy--;
        scene.reward('voda', { x: st.jug.x, y: st.jug.y - 60 });
      },
    },
    { x: CROSS_X, y: GROUND - 560, r: 200, when: (st) => !st.glintT || K.time - st.glintT > 1.2, click: (st) => { st.glintT = K.time; K.sound('zvonek'); } },
  ],
});

// ============ Ranč: otevři ohradu, kůň odejde a pod ním leží lano ============
closeup('ranc', {
  init: () => ({ open: 0, horseX: 1480, walking: false, horseT: null }),
  draw(ctx, st) {
    if (st.open >= 1) {
      ctx.strokeStyle = K.INK;
      for (let i = 0; i < 3; i++) {
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(1480, GROUND - 6 - i * 4, 60 - i * 12, 18 - i * 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // ohrada
    ctx.strokeStyle = K.INK;
    [700, 860, 1000, 1160, 1320, 1700].forEach((x, i) => K.stroke(ctx, [[x, 690], [x, GROUND + 10]], 9, 500 + i));
    [730, 790].forEach((y, r) => {
      K.stroke(ctx, [[700, y], [1000, y]], 6, 510 + r);
      K.stroke(ctx, [[1160, y], [1700, y]], 6, 520 + r);
    });
    // branka se otáčí kolem sloupku vlevo
    const gw = 160 * Math.cos(st.open * 1.3);
    [730, 790].forEach((y, r) => K.stroke(ctx, [[1000, y], [1000 + gw, y + st.open * 40]], 6, 530 + r));
    K.drawHorse(ctx, st.horseX + shake(st.horseT, 6), GROUND + 6, 1.4, { facing: -1, walking: st.walking, phase: K.time * 8 });
    K.drawPerson(ctx, 560, GROUND + 10, 1.8, { hat: 'klobouk', facing: 1, arm: st.open >= 1 ? 'hold' : null });
  },
  spots: [
    {
      x: 1080, y: 760, r: 100, when: (st) => st.open === 0,
      async click(st) {
        K.sound('vrzani');
        K.busy++;
        await K.tween(0.7, (t) => { st.open = t; });
        st.walking = true;
        K.sound('kopyta');
        await K.tween(2.2, (t) => { st.horseX = K.lerp(1480, 900, K.ease(t)); });
        st.walking = false;
        K.busy--;
      },
    },
    { x: 1480, y: 780, r: 110, when: (st) => st.open === 0, click: (st) => { st.horseT = K.time; K.sound('rehtani'); } },
    {
      x: 1480, y: GROUND - 10, r: 80, when: (st) => st.open >= 1 && !st.done,
      click: (st, scene) => { st.done = true; scene.reward('lano', { x: 1480, y: GROUND - 10 }); },
    },
  ],
});

// ============ Jelínek: najdi jelínka v keřích, upustí kolo ============
const BUSH_X = [800, 1150, 1500];
closeup('jelinek', {
  init: () => ({ deerAt: Math.floor(Math.random() * 3), shakeT: [], deer: null, bird: null, wheel: null }),
  draw(ctx, st) {
    BUSH_X.forEach((x, i) => {
      const dx = shake(st.shakeT[i], 12);
      ctx.fillStyle = '#4f6b3c';
      ctx.strokeStyle = K.INK;
      ctx.lineWidth = 4;
      ctx.beginPath();
      [[-80, -40, 60], [0, -80, 75], [80, -40, 60], [-40, -10, 55], [40, -10, 55]].forEach(([bx, by, r]) => {
        ctx.moveTo(x + dx + bx + r, GROUND + by);
        ctx.arc(x + dx + bx, GROUND + by, r, 0, Math.PI * 2);
      });
      ctx.fill();
      ctx.stroke();
    });
    if (st.deer) K.drawDeer(ctx, st.deer.x, st.deer.y, 1.6, { facing: 1 });
    if (st.bird) K.drawBird(ctx, st.bird.x, st.bird.y, 1.4);
    if (st.wheel && !st.done) K.drawIcon(ctx, 'kolo', st.wheel.x, st.wheel.y, 80);
  },
  spots: BUSH_X.map((x, i) => ({
    x, y: GROUND - 60, r: 120, when: (st) => !st.deer,
    async click(st) {
      st.shakeT[i] = K.time;
      K.sound('sustot');
      if (i !== st.deerAt) {
        st.bird = { x, y: GROUND - 120 };
        K.sound('ptak');
        await K.tween(1.4, (t) => { st.bird.x = x + t * 500; st.bird.y = GROUND - 120 - t * 700; });
        st.bird = null;
        return;
      }
      K.busy++;
      st.deer = { x, y: GROUND - 40 };
      await K.tween(1.0, (t) => {
        st.deer.x = x + t * 260;
        st.deer.y = GROUND - 40 - Math.sin(t * Math.PI) * 220;
      });
      st.wheel = { x: x + 60, y: GROUND - 20 };
      K.sound('buch');
      K.busy--;
    },
  })).concat([{
    // kolo, které jelínek upustil — leží podle toho, ze kterého keře vyskočil
    x: 0, y: 0, r: 80, when: (st) => st.wheel && !st.done,
    hit: (p, st) => K.dist(p, st.wheel) < 80,
    click: (st, scene) => { st.done = true; scene.reward('kolo', st.wheel); },
  }]),
});

// ============ Nová Klínovka: dvě polena do kamen, zatopit, hospodský uvaří čaj ============
closeup('klinovka', {
  init: () => ({ logs: 0, fire: false, flying: null, hand: false }),
  draw(ctx, st) {
    K.drawHouse(ctx, 1450, GROUND + 10, 560, 360, { smoke: st.fire, lit: st.fire, roof: '#4a5a6a' });
    // hranice dřeva
    ctx.fillStyle = '#9a7048';
    ctx.strokeStyle = K.INK;
    ctx.lineWidth = 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4 - r; c++) {
        ctx.beginPath();
        ctx.arc(640 + c * 44 + r * 22, GROUND - 20 - r * 40, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    // kamna
    const kx = 1000 + shake(st.shakeT);
    ctx.fillStyle = '#3b3b3b';
    ctx.lineWidth = 5;
    ctx.fillRect(kx - 85, GROUND - 130, 170, 140);
    ctx.strokeRect(kx - 85, GROUND - 130, 170, 140);
    ctx.fillRect(kx + 40, GROUND - 400, 26, 270);
    ctx.fillStyle = st.fire ? '#f39c12' : '#222';
    ctx.beginPath();
    ctx.arc(kx, GROUND - 60, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < st.logs && !st.fire; i++) K.stroke(ctx, [[kx - 25, GROUND - 70 + i * 14], [kx + 25, GROUND - 70 + i * 14]], 8, 600 + i);
    if (st.flying) {
      ctx.fillStyle = '#9a7048';
      ctx.beginPath();
      ctx.arc(st.flying.x, st.flying.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    const o = { hat: 'kuchar', facing: -1, shiver: !st.fire, arm: st.hand ? 'hold' : null };
    K.drawPerson(ctx, 1230, GROUND + 10, 1.8, o);
    if (st.hand) K.drawIcon(ctx, 'caj', o.hand.x, o.hand.y - 10, 60);
  },
  spots: [
    {
      x: 690, y: GROUND - 50, r: 100, when: (st) => st.logs < 2 && !st.flying,
      async click(st) {
        K.sound('poleno');
        st.flying = { x: 690, y: GROUND - 60 };
        await K.tween(0.6, (t) => { st.flying.x = K.lerp(690, 1000, t); st.flying.y = GROUND - 60 - Math.sin(t * Math.PI) * 220; });
        st.flying = null;
        st.logs++;
      },
    },
    {
      x: 1000, y: GROUND - 60, r: 100, when: (st) => !st.fire,
      async click(st, scene) {
        if (st.logs < 2) { st.shakeT = K.time; return; }
        st.fire = true;
        K.sound('ohen');
        K.busy++;
        await K.after(1.4);
        st.hand = true;
        await K.after(0.4);
        K.busy--;
        scene.reward('caj', { x: 1180, y: 720 });
      },
    },
  ],
});

// ============ Vrchol Zadní Planiny: polechtej mrak, začne sněžit ============
// ZÁSTUPNÝ úkol — skutečný vymyslí Daniel.
const flakes = Array.from({ length: 160 }, () => ({ x: Math.random() * K.W, y: Math.random() * K.H, z: Math.random() }));
K.scenes.vrchol = {
  st: null,
  enter() {
    this.st = { tickles: 0, t: null, snow: 0 };
    K.fadeTo(0, 0.6, '#efe6d2');
  },
  update(dt) {
    if (this.st.snow <= 0) return;
    for (const f of flakes) {
      f.y += (60 + f.z * 160) * dt;
      f.x += Math.sin(K.time + f.z * 9) * 20 * dt;
      if (f.y > K.H) { f.y = -10; f.x = Math.random() * K.W; }
    }
  },
  draw(ctx) {
    const st = this.st;
    K.paper(ctx, '#e7e1d6');
    // kopec s vrcholem
    ctx.fillStyle = '#c9b98f';
    ctx.strokeStyle = K.INK;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-10, K.H);
    ctx.quadraticCurveTo(300, 760, 1100, 560);
    ctx.quadraticCurveTo(1600, 650, K.W + 10, 820);
    ctx.lineTo(K.W + 10, K.H);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // kamenný mužík na vrcholu
    ctx.fillStyle = '#8d8a84';
    [[1100, 548, 36], [1102, 512, 26], [1098, 484, 18]].forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    // mrak — s každým polechtáním tmavší
    const grey = 250 - st.tickles * 45;
    const dx = shake(st.t, 18);
    ctx.fillStyle = `rgb(${grey}, ${grey}, ${grey + 4})`;
    ctx.beginPath();
    [[-150, 20, 90], [-50, -30, 120], [80, -20, 110], [180, 30, 80], [20, 50, 90]].forEach(([x, y, r]) => {
      ctx.moveTo(1100 + dx + x + r, 230 + y);
      ctx.arc(1100 + dx + x, 230 + y, r, 0, Math.PI * 2);
    });
    ctx.fill();
    ctx.stroke();
    K.drawHero(ctx, 860, 690, 1.6, { facing: 1, halo: false, wave: st.tickles > 0 });
    if (st.snow > 0) {
      ctx.fillStyle = '#fff';
      for (const f of flakes) {
        ctx.globalAlpha = st.snow * 0.9;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 2 + f.z * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (st.tickles < 3) K.drawRoundButton(ctx, EXIT.x, EXIT.y, 'zpet');
  },
  hot(p) {
    return (this.st.tickles < 3 && K.dist(p, { x: 1100, y: 230 }) < 230) || K.dist(p, EXIT) < 45;
  },
  async click(p) {
    const st = this.st;
    if (st.tickles < 3 && K.dist(p, EXIT) < 45) {
      K.busy++;
      await K.fadeTo(1, 0.5, '#efe6d2');
      K.busy--;
      return K.go('louka', { from: 'vrchol' });
    }
    if (st.tickles >= 3 || K.dist(p, { x: 1100, y: 230 }) > 230) return;
    st.tickles++;
    st.t = K.time;
    K.sound('mrak');
    if (st.tickles < 3) return;
    K.busy++;
    K.sound('vitr');
    await K.tween(2.5, (t) => { st.snow = t; });
    await K.fadeTo(1, 1.5, '#000');
    K.busy--;
    K.go('finale');
  },
};
