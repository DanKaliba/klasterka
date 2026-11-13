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

// Vrchol Zadní Planiny (tetřívek, oko bere, zasazení květiny) je ve vlastním souboru js/vrchol.js
