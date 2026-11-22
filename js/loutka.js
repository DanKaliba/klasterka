// Ladění loutky hrdiny: ?scena=loutka, volitelně &pohyb=stoj|chuze|saha|drzi|fajfka|mava|lek|mokry.
// Tlačítka nahoře přepínají pohyb, klik jinam = otočka. Loutka je velká, ať jsou vidět klouby;
// červený kroužek = kde ruka drží věc (K.heroHand), modrý = pusa (K.heroMouth).
(() => {
  const MODES = [
    ['stoj', {}], ['chuze', { walking: true }], ['saha', { reach: true }], ['drzi', { arm: 'hold' }],
    ['fajfka', { arm: 'mouth' }], ['mava', { wave: true }], ['lek', { face: 'startle' }], ['mokry', { face: 'wet' }],
  ];
  const S = 3.4, FY = 1010, BTN_W = 210, BTN_Y = 130, SPEED = 170; // tlačítka pod HUD
  const st = { mode: 'stoj', x: 960, facing: 1, phase: 0 };
  const opts = () => ({ ...MODES.find((m) => m[0] === st.mode)[1], facing: st.facing, phase: st.phase, halo: false });
  K.scenes.loutka = {
    st,
    enter() {
      const p = K.params.get('pohyb');
      if (p && MODES.some((m) => m[0] === p)) st.mode = p;
      K.hero.visible = false;
    },
    update(dt) {
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
      K.drawHero(ctx, st.x, FY, S, o);
      const h = K.heroHand(st.x, FY, S, o), m = K.heroMouth(st.x, FY, S, o);
      ctx.lineWidth = 3;
      for (const [p, c] of [[h, '#c0392b'], [m, '#2c6fb5']]) {
        if (!p) continue;
        ctx.strokeStyle = c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.font = '30px Georgia, serif';
      ctx.textAlign = 'center';
      MODES.forEach(([n], i) => {
        ctx.fillStyle = n === st.mode ? '#1d1712' : 'rgba(29, 23, 18, 0.45)';
        ctx.fillText(n, 120 + i * BTN_W, BTN_Y);
      });
    },
    hot() { return true; },
    click(p) {
      if (p.y < BTN_Y + 30) {
        const i = Math.round((p.x - 120) / BTN_W);
        if (MODES[i]) st.mode = MODES[i][0];
        return;
      }
      st.facing = -st.facing;
    },
  };
})();
