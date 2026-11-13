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

// Kantorská (kuchyně, semínka sněžné květiny) je ve vlastním souboru js/kuchyne.js

// Boží muka se studánkou a žábou (voda) jsou ve vlastním souboru js/muka.js

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

// ============ Vrchol Zadní Planiny: zasadit sněžnou květinu ============
// (Daniel 2026-11-09) Panáček na hrudku hlíny postupně dá semínka, zaleje je vodou ze studánky a přiloží
// rampouch (každý klik = další věc z batohu, pořadí jako v herbáři stromu). Květina vyroste, rozkvete a
// pyl z jejích zvonků se rozletí přes hory jako sníh → finále. Kulisa je zatím papírová (zástupná),
// květina je Danielův obrázek (python tools/kvetina.py).
const FLOWER = 'assets/sceny/kvetina.webp';
K.img(FLOWER);
const MOUND = { x: 1290, y: 584 };
const PLANT_H = 400; // výška rozkvetlé květiny na obrazovce
const flakes = Array.from({ length: 160 }, () => ({ x: Math.random() * K.W, y: Math.random() * K.H, z: Math.random() }));
K.scenes.vrchol = {
  st: null,
  enter() {
    this.st = { step: 0, seeds: 0, wet: 0, frost: 0, frostT: null, grow: 0, bloom: 0, pollen: [], snow: 0, fly: null, done: false };
    K.fadeTo(0, 0.6, '#efe6d2');
  },
  update(dt) {
    const st = this.st;
    for (const p of st.pollen) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx += 6 * dt;
      p.vy -= 4 * dt;
    }
    st.pollen = st.pollen.filter((p) => K.time - p.t0 < p.life);
    if (st.bloom >= 1 && !st.done) {
      // zralé zvonky práší
      for (let i = 0; i < 3; i++) {
        const y = MOUND.y - PLANT_H * K.rand(0.45, 0.95);
        st.pollen.push({ x: MOUND.x + K.rand(-40, 40), y, vx: K.rand(20, 120), vy: K.rand(-90, -20), t0: K.time, life: K.rand(2, 4), r: K.rand(1.5, 4) });
      }
    }
    if (st.snow <= 0) return;
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
    // hrudka hlíny: se semínky, mokrá, s jinovatkou
    const wet = st.wet;
    ctx.fillStyle = `rgb(${Math.round(K.lerp(122, 78, wet))}, ${Math.round(K.lerp(96, 62, wet))}, ${Math.round(K.lerp(70, 46, wet))})`;
    ctx.beginPath(); ctx.ellipse(MOUND.x, MOUND.y, 70, 22, 0, Math.PI, 0); ctx.lineTo(MOUND.x + 70, MOUND.y + 6);
    ctx.lineTo(MOUND.x - 70, MOUND.y + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (st.seeds > 0 && st.grow < 0.2) {
      ctx.fillStyle = '#f2ece0';
      [[-22, -8], [6, -14], [26, -6]].forEach(([dx, dy]) => {
        ctx.globalAlpha = st.seeds;
        ctx.beginPath(); ctx.ellipse(MOUND.x + dx, MOUND.y + dy, 7, 4.5, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
    if (st.frost > 0) {
      // jinovatka po rampouchu
      ctx.strokeStyle = `rgba(235, 245, 252, ${0.9 * st.frost})`;
      ctx.lineWidth = 3;
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + (i / 8) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(MOUND.x + Math.cos(a) * 40, MOUND.y + Math.sin(a) * 12);
        ctx.lineTo(MOUND.x + Math.cos(a) * 74, MOUND.y + Math.sin(a) * 26);
        ctx.stroke();
      }
    }
    // květina roste z hrudky
    const img = K.img(FLOWER);
    if (st.grow > 0 && K.ready(img)) {
      const s = (PLANT_H / img.height) * K.lerp(0.12, 1, K.ease(st.grow));
      ctx.save();
      ctx.translate(MOUND.x, MOUND.y + 14);
      ctx.scale(s, s);
      ctx.drawImage(img, -img.width / 2, -img.height);
      ctx.restore();
      if (st.bloom > 0) {
        // rozkvetlé zvonky se rozzáří
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
    K.drawHero(ctx, 1140, 600, 1.6, { facing: 1, halo: false, wave: st.bloom > 0 });
    if (st.fly) K.drawIcon(ctx, st.fly.item, st.fly.x, st.fly.y, 46);
    if (st.step < 3 && K.busy === 0) K.drawHint(ctx, MOUND.x, MOUND.y - 10, 70);
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
    if (st.step === 0) K.drawRoundButton(ctx, EXIT.x, EXIT.y, 'zpet');
  },
  hot(p) {
    return (this.st.step < 3 && K.dist(p, MOUND) < 110) || (this.st.step === 0 && K.dist(p, EXIT) < 45);
  },
  async click(p) {
    const st = this.st;
    if (st.step === 0 && K.dist(p, EXIT) < 45) {
      K.busy++;
      await K.fadeTo(1, 0.5, '#efe6d2');
      K.busy--;
      return K.go('louka', { from: 'vrchol' });
    }
    if (st.step >= 3 || K.dist(p, MOUND) > 110) return;
    K.busy++;
    // další věc z batohu přiletí na hrudku
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
      await this.bloom();
    }
    K.busy--;
  },
  // vyroste, rozkvete, práší jako sníh → finále
  async bloom() {
    const st = this.st;
    await K.after(0.4);
    K.sound('chorose');
    await K.tween(3.2, (t) => { st.grow = t; });
    K.sound('slunce');
    await K.tween(1.2, (t) => { st.bloom = t; });
    await K.after(1.5);
    K.sound('vitr');
    await K.tween(2.5, (t) => { st.snow = t; });
    st.done = true;
    await K.fadeTo(1, 1.5, '#000');
    K.go('finale');
  },
};
