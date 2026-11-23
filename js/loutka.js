// Ladění loutek: ?scena=loutka (hrdina), volitelně &pohyb=stoj|chuze|saha|drzi|fajfka|mava|lek|mokry;
// ?scena=loutka&postava=deda (děda z kuchyně), &pohyb=kouri|tah|bez|kasel|fouka|lek|zlost|fajfka (s fajfkou v ruce);
// ?scena=loutka&postava=babka, &pohyb=smutna|kasel|prosi|priklada|spokojena;
// ?scena=loutka&postava=kocour, &pohyb=spi|budi|protah|chuze|skok|prikrc|cich|tuka|sedi|prede|hlava|tlapka.
// Tlačítka nahoře přepínají pohyb, klik jinam = otočka. Loutka je velká, ať jsou vidět klouby;
// červený kroužek = ruka / fajfka, modrý = pusa (u dědy i temeno, kam skáče kocour).
(() => {
  const HERO_MODES = [
    ['stoj', {}], ['chuze', { walking: true }], ['saha', { reach: true }], ['drzi', { arm: 'hold' }],
    ['fajfka', { arm: 'mouth' }], ['mava', { wave: true }], ['lek', { face: 'startle' }], ['mokry', { face: 'wet' }],
  ];
  const DEDA_MODES = [
    ['kouri', { mode: 'kouri', pipe: true }], ['tah', { mode: 'tah', pipe: true }], ['bez', { mode: 'bez' }], ['kasel', { mode: 'kasel', pipe: true }],
    ['fouka', { mode: 'fouka', pipe: true }], ['lek', { mode: 'lek' }], ['zlost', { mode: 'zlost' }],
    ['fajfka', { mode: 'bez', pipe: true }],
  ];
  const BABKA_MODES = [
    ['smutna', { pose: 1 }], ['kasel', { pose: 2 }], ['prosi', { pose: 3 }], ['priklada', { pose: 4 }], ['spokojena', { pose: 5 }],
  ];
  // kocour: pózy jako v kuchyni; spi→probudí se (cukne uchem a zvedne hlavu), mnau/tlapka/tuka = krátké pohyby
  // (opakují se každé 2 s), prede = sedí a přede
  const KOCOUR_MODES = [
    ['spi', { pose: 'sleep' }], ['budi', { pose: 'sleep', wake: true }], ['protah', { pose: 'stretch' }], ['chuze', { pose: 'walk' }],
    ['skok', { pose: 'leap' }], ['prikrc', { pose: 'prep' }], ['cich', { pose: 'sniff' }], ['tuka', { pose: 'sniff', tap: true }],
    ['sedi', { pose: 'sit' }], ['prede', { pose: 'sit', purr: true }], ['hlava', { pose: 'crouch' }], ['tlapka', { pose: 'walk', shake: true }],
  ];
  const S = 3.4, CAT_S = 3.2, FY = 1010, BTN_Y = 130, SPEED = 170; // tlačítka pod HUD
  const st = { who: 'hrdina', mode: 'stoj', x: 960, facing: 1, phase: 0 };
  const modes = () => (st.who === 'deda' ? DEDA_MODES : st.who === 'babka' ? BABKA_MODES : st.who === 'kocour' ? KOCOUR_MODES : HERO_MODES);
  const btnW = () => (modes().length > 8 ? 150 : 210);
  const opts = () => {
    const m = modes().find((v) => v[0] === st.mode) || modes()[0];
    const o = { ...m[1], facing: st.facing, phase: st.phase, halo: false };
    if (st.who === 'kocour') { // krátké pohyby se opakují každé 2 s
      const t0 = Math.floor(K.time / 2) * 2;
      if (o.wake) o.earT = t0;
      if (o.tap) o.tapT = t0;
      if (o.shake) { o.shakeT = t0; o.meowT = t0; }
      if (o.purr) o.purrT = t0;
    }
    return o;
  };
  const ring = (ctx, p, c) => {
    if (!p) return;
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
    ctx.stroke();
  };
  K.scenes.loutka = {
    st,
    enter() {
      st.who = ['deda', 'babka', 'kocour'].includes(K.params.get('postava')) ? K.params.get('postava') : 'hrdina';
      st.mode = modes()[0][0];
      if (st.who === 'deda') st.facing = -1;
      const p = K.params.get('pohyb');
      if (p && modes().some((m) => m[0] === p)) st.mode = p;
      K.hero.visible = false;
    },
    update(dt) {
      if (st.who === 'deda') { K.dedaTick(opts()); return; }
      if (st.who === 'babka') { K.drawBabka(null, st.x, FY, 1.4, opts()); return; }
      if (st.who === 'kocour') K.drawKocour(null, st.x, FY, CAT_S, opts());
      else K.heroTick(opts());
      if (st.mode !== 'chuze') return;
      st.x += st.facing * SPEED * dt;
      // stejný krok jako ve scénách (hrdina: fáze = dráha / 20 při HERO_S 1.9, kocour: dráha / 14 v px kuchyně)
      st.phase += st.who === 'kocour' ? (SPEED * dt) / (14 * CAT_S / 0.72) : (SPEED * dt) / (20 * (S / 1.9));
      if (st.x > 1560) st.facing = -1;
      if (st.x < 360) st.facing = 1;
    },
    draw(ctx) {
      K.paper(ctx);
      ctx.fillStyle = 'rgba(60, 40, 20, 0.18)';
      ctx.fillRect(0, FY, K.W, 3);
      const o = opts();
      ctx.lineWidth = 3;
      if (st.who === 'deda') {
        const g = K.drawDeda(ctx, st.x, FY, 1.4, o);
        if (g) { ring(ctx, g.mouth, '#2c6fb5'); ring(ctx, g.top, '#2c6fb5'); ring(ctx, g.bowl, '#c0392b'); }
      } else if (st.who === 'babka') {
        const g = K.drawBabka(ctx, st.x, FY, 1.4, o);
        if (g) { ring(ctx, g.mouth, '#2c6fb5'); ring(ctx, g.hands, '#c0392b'); }
      } else if (st.who === 'kocour') {
        const g = K.drawKocour(ctx, st.x, FY, CAT_S, o);
        if (g) { ring(ctx, g.nose, '#2c6fb5'); ring(ctx, g.top, '#2c6fb5'); ring(ctx, g.paw, '#c0392b'); }
      } else {
        K.drawHero(ctx, st.x, FY, S, o);
        ring(ctx, K.heroHand(st.x, FY, S, o), '#c0392b');
        ring(ctx, K.heroMouth(st.x, FY, S, o), '#2c6fb5');
      }
      ctx.font = '30px Georgia, serif';
      ctx.textAlign = 'center';
      modes().forEach(([n], i) => {
        ctx.fillStyle = n === st.mode ? '#1d1712' : 'rgba(29, 23, 18, 0.45)';
        ctx.fillText(n, 100 + i * btnW(), BTN_Y);
      });
    },
    hot() { return true; },
    click(p) {
      if (p.y < BTN_Y + 30) {
        const i = Math.round((p.x - 100) / btnW());
        if (modes()[i]) st.mode = modes()[i][0];
        return;
      }
      st.facing = -st.facing;
    },
  };
})();
