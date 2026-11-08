// Start hry a ladicí přepínače v adrese:
//   ?scena=<louka|les|skocka|kantorska|kriz|jelinek|klinovka|vrchol|finale>
//   ?vse        — všechny úkoly hotové, v batohu všechny 3 věci (rovnou na vrchol)
//   ?les        — les už prošlý (batoh od stromu, beran ve stádu)
//   ?finale=40  — finále přetočené o 40 s
//   ?rychle=4   — čtyřnásobná rychlost
//   ?editor     — rovnou otevřít editor rozložení
//   ?debug      — vykreslit cestu a klikací místa
//   ?test       — čas stojí, posouvá ho window.advanceTime(ms)
(async () => {
  const ctx = K.ctx;
  // načítací obrazovka: jen papír a ovečka
  K.scene = {
    draw(c) {
      K.paper(c);
      K.drawSheep(c, K.W / 2, K.H / 2 + 40, 2, { halo: false, walking: true, phase: K.time * 6 });
    },
  };
  K.start();

  await K.load([K.frameSrc('2025-12-28_1300'), K.frameSrc('2026-01-05_0900')]);
  // zbytek snímků pro finále se načítá na pozadí během hraní
  K.load(window.SNIMKY.map(K.frameSrc));

  const scena = K.params.get('scena') || 'louka';
  // les se přeskočí i při skoku rovnou do chalupy, na vrchol nebo do finále (batoh je potřeba pro HUD)
  if (K.params.has('vse') || K.params.has('les') || !['louka', 'les'].includes(scena)) K.forestDone();
  if (K.params.has('vse')) {
    K.state.asked = true;
    for (const [id, item] of Object.entries(K.CHALETS)) { K.state.solved[id] = true; K.state.items.push(item); }
  }
  if (scena === 'finale') {
    await K.load(window.SNIMKY.map(K.frameSrc));
    for (const it of K.ITEMS) if (!K.state.items.includes(it)) K.state.items.push(it);
  }
  if (scena === 'vrchol') for (const it of K.ITEMS) if (!K.state.items.includes(it)) K.state.items.push(it);
  K.go(K.scenes[scena] ? scena : 'louka');
  if (K.paused) window.advanceTime(16);
  if (K.params.has('skript')) {
    const s = document.createElement('script');
    s.src = 'tools/testy.js';
    document.body.appendChild(s);
  }
})();

// stav hry jako text pro automatické testy (souřadnice: px snímku 1920×1080, počátek vlevo nahoře, y dolů)
window.render_game_to_text = () => {
  const name = Object.keys(K.scenes).find((k) => K.scenes[k] === K.scene) || 'nacitani';
  const hp = K.hero.pos;
  const out = {
    scena: name,
    busy: K.busy,
    fade: +K.fade.a.toFixed(2),
    snimek: K.frameNow,
    ovceSePtaly: K.state.asked,
    batoh: K.state.bag,
    hotove: Object.keys(K.state.solved),
    predmety: K.state.items,
    zvuky: K.soundStats,
    hrdina: { x: Math.round(hp.x), y: Math.round(hp.y), bodCesty: +K.hero.p.toFixed(2), jde: K.hero.target !== null, volne: !!K.hero.off, videt: K.hero.visible },
    ovce: K.sheep.map((s) => ({ x: Math.round(s.x), y: Math.round(s.y), rezim: s.mode })),
  };
  if (name === 'les') {
    const s = K.scene.st;
    out.les = { faze: s.phase, naLavce: s.onBridge, mech: +s.moss.toFixed(2), beranStoji: +s.stand.toFixed(2),
      slunce: +s.sun.toFixed(2), vetev: s.branch.state, souska: s.snag.state, strom: s.treeStage };
  }
  if (name === 'finale') {
    const F = K.finale;
    out.finale = { t: +F.t.toFixed(1), klic: F.i, ceka: F.waiting && !F.liftOn, vlek: +F.liftSpeed.toFixed(2), konec: !!F.ended };
  }
  return JSON.stringify(out);
};
