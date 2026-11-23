// Děda v kuchyni jako papírová loutka (Daniel 2026-11-22, prompty D1–D3 v pics/podklady-kuchyne/
// PROMPT-postavy-lisejnik.md; python tools/sprity.py → K.SPRITY.dedaD2 a dedaD3). Sedí na stoličce;
// kostra, kroky, chvění a přechody jsou společné (js/loutky.js). Výraz hraje jedna z pěti hlav.
// Fajfku v dílech nemá: kreslí ji tahle loutka do ruky (nebo k puse) a kuchyně ji po leknutí pustí na
// zem stejným obrázkem; pak má ruce prázdné a už nekouří.
// Díly jsou zrcadlené (postava kouká doprava); v kuchyni se kreslí obráceně (facing -1).
(() => {
  const PIPE_SRC = 'assets/predmety/fajfka.png';
  const PIPE_S = 0.85; // fajfka vůči obrázku předmětu (ten je 240 px vysoký)
  // body na fajfce (podíl obrázku): kde ji drží, náustek, víčko hlavičky (odtud jde kouř)
  const PIPE = { grip: [0.45, 0.45], tip: [0.05, 0.03], bowl: [0.72, 0.68] };
  // klouby dílů jako podíly šířky a výšky obrázku (po zrcadlení, postava kouká doprava)
  const PARTS = {
    stolicka: { seat: [0.5, 0.07], floor: [0.5, 1] },
    trup: { pelvis: [0.45, 0.9], neck: [0.55, 0.06], shF: [0.27, 0.3], shB: [0.6, 0.28], hipF: [0.4, 0.86], hipB: [0.55, 0.86] },
    stehno: { a: [0.5, 0.15], b: [0.5, 0.87] },
    bota: { a: [0.35, 0.1], b: [0.3, 0.95] },
    paze: { a: [0.5, 0.15], b: [0.5, 0.86] },
    predlokti: { a: [0.5, 0.15], b: [0.5, 0.95] },
    ruka: { a: [0.5, 0.08], b: [0.5, 0.97], grip: [0.5, 0.55] },
    pest: { a: [0.6, 0.1], b: [0.45, 0.9], grip: [0.5, 0.6] },
    drzi: { a: [0.55, 0.08], b: [0.5, 0.9], grip: [0.45, 0.6] },
    hlavaKlid: { neck: [0.45, 0.78], mouth: [0.86, 0.6], top: [0.45, 0.04] },
    hlavaKasel: { neck: [0.38, 0.75], mouth: [0.75, 0.6], top: [0.5, 0.03] },
    hlavaFouka: { neck: [0.53, 0.9], mouth: [0.86, 0.56], top: [0.4, 0.08] },
    hlavaLek: { neck: [0.45, 0.76], mouth: [0.82, 0.62], top: [0.5, 0.03] },
    hlavaZlost: { neck: [0.4, 0.75], mouth: [0.82, 0.62], top: [0.5, 0.03] },
  };
  // úhly jako u hrdiny: ruce vůči trupu (0 = visí, kladně = dozadu), nohy vůči zemi (sedí: stehno vodorovně
  // dopředu, lýtko svisle); lean = předklon, lift = nadskočení v px dílů
  const KEYS = ['lean', 'neck', 'lift', 'sF', 'eF', 'wF', 'sB', 'eB', 'wB', 'hF', 'kF', 'hB', 'kB'];
  const SIT = { lean: 0.06, neck: 0.04, lift: 0, sF: -0.3, eF: -0.6, wF: 0.1, sB: -0.25, eB: -0.6, wB: 0.1, // ruce na kolenou
    hF: -1.5, kF: 1.5, hB: -1.4, kB: 1.35, head: 'hlavaKlid', handF: 'ruka', handB: 'ruka' };
  // o.mode: 'kouri' (fajfka v puse) | 'tah' (zavře oči a dlouze potáhne, nadme se) | 'bez' (ruce na kolenou) | 'kasel'
  //   | 'fouka' (kouř nahoru) | 'lek' | 'zlost';
  // o.pipe: má fajfku v ruce
  function target(o, tm, t) {
    const q = { ...SIT };
    q.lean += 0.012 * Math.sin(t * 1.6); // dýchá
    if (o.mode === 'kouri') Object.assign(q, { sF: -0.3, eF: -1.9, wF: 0.3, handF: 'drzi' }); // ruka s fajfkou u prsou
    else if (o.mode === 'tah') {
      const u = K.LOUTKA_UTIL.smooth(K.LOUTKA_UTIL.ramp(tm, 0.2, 1.2)); // nádech: zakloní se a narovná
      Object.assign(q, { lean: 0.02 - 0.12 * u, neck: -0.05 - 0.1 * u, sF: -0.35, eF: -1.95, wF: 0.3, handF: 'drzi' });
    }
    else if (o.mode === 'kasel') {
      Object.assign(q, { lean: 0.38, neck: 0.25, sF: -0.95, eF: -2.0, wF: -0.2, handF: 'pest', head: 'hlavaKasel' });
      q.lean += 0.07 * Math.abs(Math.sin(t * 19)); // záchvaty
    } else if (o.mode === 'fouka') {
      Object.assign(q, { lean: -0.12, neck: -0.3, sF: -0.35, eF: -1.45, wF: 0.1, handF: 'drzi', head: 'hlavaFouka' });
    } else if (o.mode === 'lek') {
      const j = Math.sin(Math.PI * K.LOUTKA_UTIL.ramp(tm, 0, 0.45)); // nadskočí ze stoličky
      Object.assign(q, { lean: -0.15, neck: -0.2, lift: -38 * j, sF: -2.8, eF: -0.3, wF: 0.2, sB: -2.6, eB: -0.45, wB: 0.2,
        hF: -1.5 + 0.35 * j, kF: 1.5 - 0.6 * j, head: 'hlavaLek' });
    } else if (o.mode === 'zlost') {
      Object.assign(q, { lean: 0.15, neck: 0.1, sF: -2.5, eF: -1.3 + 0.3 * Math.sin(t * 14), wF: 0.2, handF: 'pest', head: 'hlavaZlost' });
    }
    if (o.pipe) {
      if (o.mode === 'kasel') { q.handB = 'drzi'; q.pipe = 'B'; } // zakuckal se: fajfka ve druhé ruce na koleni
      else if (o.mode === 'kouri' || o.mode === 'tah') { q.pipe = 'F'; q.pipeMouth = true; }
      else { q.handF = 'drzi'; q.pipe = 'F'; }
    }
    return q;
  }

  // fajfka ve světě: drží ji za stopku v ruce, náustek míří k puse (kouří) nebo šikmo nahoru k obličeji
  // Obrázek fajfky sedí na dědu koukajícího doleva (kuchyně); kouká-li doprava, kreslí se zrcadlově (m = −1),
  // jinak by hlavička vyšla na špatné straně stopky.
  function pipePose(r) {
    const { q, g, W, s, f } = r, img = K.img(PIPE_SRC);
    if (!q.pipe || !K.ready(img)) return null;
    const G = g.grip[q.pipe];
    const T = q.pipeMouth ? g.mouth : [G[0] + 25, G[1] - 100];
    const gw = W(G), tw = W(T), ps = s * PIPE_S, m = f < 0 ? 1 : -1;
    const iw = img.width * ps, ih = img.height * ps;
    const loc = (P, A) => [m * (P[0] - A[0]) * iw, (P[1] - A[1]) * ih]; // bod obrázku vůči A (po zrcadlení)
    const vi = loc(PIPE.tip, PIPE.grip);
    const rot = Math.atan2(tw.y - gw.y, tw.x - gw.x) - Math.atan2(vi[1], vi[0]);
    const R = (v) => [v[0] * Math.cos(rot) - v[1] * Math.sin(rot), v[0] * Math.sin(rot) + v[1] * Math.cos(rot)];
    // při kouření sedí náustek přesně v puse (stopka jde rukou), jinak drží fajfku za stopku
    const [A, aw] = q.pipeMouth ? [PIPE.tip, tw] : [PIPE.grip, gw];
    const c = R(loc([0.5, 0.5], A)), b = R(loc(PIPE.bowl, A));
    return { img, x: aw.x + c[0], y: aw.y + c[1], rot, s: ps, m, bowl: { x: aw.x + b[0], y: aw.y + b[1] - 6 } };
  }
  let pipe = null;
  const drawPipe = (ctx) => {
    if (!pipe) return;
    ctx.save();
    ctx.translate(pipe.x, pipe.y);
    ctx.rotate(pipe.rot);
    ctx.scale(pipe.m * pipe.s, pipe.s);
    ctx.drawImage(pipe.img, -pipe.img.width / 2, -pipe.img.height / 2);
    ctx.restore();
  };

  const L = K.sediciLoutka({
    sets: [['dedaD2', ['stolicka', 'trup', 'stehno', 'bota', 'paze', 'predlokti', 'ruka', 'pest', 'drzi',
      'stehno2', 'bota2', 'paze2', 'predlokti2', 'ruka2', 'pest2', 'drzi2']],
    ['dedaD3', ['hlavaKlid', 'hlavaKasel', 'hlavaFouka', 'hlavaLek', 'hlavaZlost']]],
    parts: PARTS, base: 'stolicka', legs: true, keys: KEYS, lag: { eF: 1.5, eB: 1.5, wF: 2.2, wB: 2.2 },
    target, key: (o) => o.mode + (o.pipe ? '+' : ''),
    // fajfka pod prsty ruky, která ji drží (ve vzdálené ruce až přes nohy, ať ji nohy nepřekryjí)
    hook: (id, when, ctx, r) => {
      if ((id === 'F' && when === 'before' && r.q.pipe === 'F') || (id === 'legF' && when === 'after' && r.q.pipe === 'B')) drawPipe(ctx);
    },
  });

  // x, y = podlaha pod středem stoličky; vrací body ve světě: mouth (pusa), top (temeno, kam skočí kocour),
  // pipe (kde je fajfka: x, y, rot, s — odsud ji kuchyně pustí na zem), bowl (víčko fajfky, kouř); null = nenačteno.
  // ctx = null: nic nekreslí, jen posune pózu a vrátí body
  K.drawDeda = (ctx, x, y, s, o) => {
    const r = L.draw(null, x, y, s, o);
    if (!r) return null;
    pipe = pipePose(r);
    if (ctx) L.draw(ctx, x, y, s, o);
    return { mouth: r.W(r.g.mouth), top: r.W(r.g.top), pipe, bowl: pipe && pipe.bowl };
  };
  K.dedaTick = (o) => { L.draw(null, 0, 0, 1, o); };
})();
