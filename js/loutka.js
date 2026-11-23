// Ladění loutek: ?scena=loutka (hrdina), volitelně &pohyb=stoj|chuze|saha|drzi|fajfka|mava|lek|mokry;
// ?scena=loutka&postava=deda (děda z kuchyně), &pohyb=kouri|bez|kasel|fouka|lek|zlost|fajfka (s fajfkou v ruce);
// ?scena=loutka&postava=babka, &pohyb=smutna|kasel|prosi|priklada|spokojena.
// Tlačítka nahoře přepínají pohyb, klik jinam = otočka. Loutka je velká, ať jsou vidět klouby;
// červený kroužek = ruka / fajfka, modrý = pusa (u dědy i temeno, kam skáče kocour).
(() => {
  const HERO_MODES = [
    ['stoj', {}], ['chuze', { walking: true }], ['saha', { reach: true }], ['drzi', { arm: 'hold' }],
    ['fajfka', { arm: 'mouth' }], ['mava', { wave: true }], ['lek', { face: 'startle' }], ['mokry', { face: 'wet' }],
  ];
  const DEDA_MODES = [
    ['kouri', { mode: 'kouri', pipe: true }], ['bez', { mode: 'bez' }], ['kasel', { mode: 'kasel', pipe: true }],
    ['fouka', { mode: 'fouka', pipe: true }], ['lek', { mode: 'lek' }], ['zlost', { mode: 'zlost' }],
    ['fajfka', { mode: 'bez', pipe: true }],
  ];
  const BABKA_MODES = [
    ['smutna', { pose: 1 }], ['kasel', { pose: 2 }], ['prosi', { pose: 3 }], ['priklada', { pose: 4 }], ['spokojena', { pose: 5 }],
  ];
  const S = 3.4, FY = 1010, BTN_W = 210, BTN_Y = 130, SPEED = 170; // tlačítka pod HUD
  const st = { who: 'hrdina', mode: 'stoj', x: 960, facing: 1, phase: 0 };
  const modes = () => (st.who === 'deda' ? DEDA_MODES : st.who === 'babka' ? BABKA_MODES : HERO_MODES);
  const opts = () => {
    const m = modes().find((v) => v[0] === st.mode) || modes()[0];
    return { ...m[1], facing: st.facing, phase: st.phase, halo: false };
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
      st.who = ['deda', 'babka'].includes(K.params.get('postava')) ? K.params.get('postava') : 'hrdina';
      st.mode = modes()[0][0];
      if (st.who === 'deda') st.facing = -1;
      const p = K.params.get('pohyb');
      if (p && modes().some((m) => m[0] === p)) st.mode = p;
      K.hero.visible = false;
    },
    update(dt) {
      if (st.who === 'deda') { K.dedaTick(opts()); return; }
      if (st.who === 'babka') { K.drawBabka(null, st.x, FY, 1.4, opts()); return; }
      K.heroTick(opts());
      if (st.mode !== 'chuze') return;
      st.x += st.facing * SPEED * dt;
      st.phase += (SPEED * dt) / (20 * (S / 1.9)); // stejný krok jako ve scénách (fáze = dráha / 20 při HERO_S 1.9)
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
      } else {
        K.drawHero(ctx, st.x, FY, S, o);
        ring(ctx, K.heroHand(st.x, FY, S, o), '#c0392b');
        ring(ctx, K.heroMouth(st.x, FY, S, o), '#2c6fb5');
      }
      ctx.font = '30px Georgia, serif';
      ctx.textAlign = 'center';
      modes().forEach(([n], i) => {
        ctx.fillStyle = n === st.mode ? '#1d1712' : 'rgba(29, 23, 18, 0.45)';
        ctx.fillText(n, 120 + i * BTN_W, BTN_Y);
      });
    },
    hot() { return true; },
    click(p) {
      if (p.y < BTN_Y + 30) {
        const i = Math.round((p.x - 120) / BTN_W);
        if (modes()[i]) st.mode = modes()[i][0];
        return;
      }
      st.facing = -st.facing;
    },
  };
})();
