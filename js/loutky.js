// Společný základ papírových loutek, které se nehnou z místa (děda na stoličce js/deda.js, babka v kleku
// js/babka.js). Stejné jako hrdina (js/kresleni.js): díly na mosazných nýtech, póza se mění po krocích
// 12× za s, kloub každý krok trochu ujede, při změně stavu se přechází a předloktí s rukou dobíhají,
// každý díl vrhá stín na díl pod sebou.
// Kostra (postava kouká doprava, ve hře se dá kreslit obráceně): podstavec (stolička / sukně v kleku)
// stojí na podlaze, na něm v bodě „seat“ trup (pánev), na trupu hlava (jedna z několika = výraz) a dvě
// ruce (paže, předloktí, ruka jednoho z tvarů); děda má navíc nohy (stehno, lýtko s botou).
// def: { sets: [[sada, [díly]]], parts: { díl: { klouby jako podíly obrázku } }, base: 'díl podstavce',
//   legs: bool, keys: [úhly], lag: { úhel: exponent }, target(o, tm, t) → póza, key(o) → stav,
//   hook(id, kdy, ctx, g, q) → kreslení navíc před ('before') / po ('after') vrstvě id }
K.sediciLoutka = (def) => {
  const U = K.LOUTKA_UTIL;
  const S = { key: null, t0: 0, last: -9, from: null, cur: null };
  function display(o) {
    const key = def.key(o);
    if (S.cur && S.last === K.time && S.key === key) return S.cur;
    const tq = Math.floor(K.time * U.FPS) / U.FPS;
    const gap = K.time - S.last > 0.5 || K.time < S.last; // dlouho se nekreslila: bez přechodu
    if (key !== S.key) {
      S.from = gap || !S.cur ? null : S.cur.base;
      S.t0 = tq;
      S.key = key;
    }
    S.last = K.time;
    const q = def.target(o, tq - S.t0, tq);
    if (S.from) {
      const w = U.smooth(Math.min(1, (tq - S.t0) / 0.3));
      for (const k of def.keys) q[k] = S.from[k] + (q[k] - S.from[k]) * w ** (def.lag[k] || 1);
      if (w >= 1) S.from = null;
    }
    const base = { ...q };
    const step = Math.floor(K.time * U.FPS);
    def.keys.forEach((k, i) => { if (k !== 'lift') q[k] += (K.hash(step * 13.1 + i * 5.3 + 40) - 0.5) * U.JITTER; });
    S.cur = { q, base };
    return S.cur;
  }

  let P = null;
  function parts() {
    if (P) return P;
    const out = {};
    for (const [set, names] of def.sets) {
      for (const n of names) {
        const sp = K.sprite(set, n);
        if (!sp) return null;
        out[n] = sp;
      }
    }
    P = out;
    return P;
  }

  // díly na místech (px dílů, počátek = podlaha pod středem podstavce, y dolů)
  function rig(q) {
    const loc = (n, key) => { const f = def.parts[n.replace(/2$/, '')][key]; return [f[0] * P[n].sp.w, f[1] * P[n].sp.h]; };
    const map = (pl, p) => {
      const c = Math.cos(pl.rot), s = Math.sin(pl.rot), x = p[0] - pl.a[0], y = p[1] - pl.a[1];
      return [pl.at[0] + x * c - y * s, pl.at[1] + x * s + y * c];
    };
    const place = (n, at, rot, a) => ({ n, at, rot, a });
    const bone = (n, at, ang) => {
      const a = loc(n, 'a'), b = loc(n, 'b');
      const pl = place(n, at, ang - Math.atan2(a[0] - b[0], b[1] - a[1]), a);
      pl.end = map(pl, b);
      return pl;
    };
    const base = place(def.base, [0, 0], 0, loc(def.base, 'floor'));
    const seat = map(base, loc(def.base, 'seat'));
    const torso = place('trup', [seat[0], seat[1] + q.lift], q.lean, loc('trup', 'pelvis'));
    const head = place(q.head, map(torso, loc('trup', 'neck')), q.lean + q.neck, loc(q.head, 'neck'));
    const arm = (X, suf) => {
      const A = q.lean + q['s' + X];
      const up = bone('paze' + suf, map(torso, loc('trup', 'sh' + X)), A);
      const fore = bone('predlokti' + suf, up.end, A + q['e' + X]);
      const hn = q['hand' + X] + suf, hand = bone(hn, fore.end, A + q['e' + X] + q['w' + X]);
      return { parts: [hand, fore, up], pins: [up.at, fore.at, hand.at], grip: map(hand, loc(hn, 'grip')) };
    };
    const leg = (X, suf) => {
      const th = bone('stehno' + suf, map(torso, loc('trup', 'hip' + X)), q['h' + X]);
      const sh = bone('bota' + suf, th.end, q['h' + X] + q['k' + X]);
      return { parts: [sh, th], pins: [sh.at] };
    };
    const aF = arm('F', ''), aB = arm('B', '2');
    const layers = [{ id: 'base', parts: [base] }, { id: 'B', parts: aB.parts, pins: aB.pins.slice(1) }];
    if (def.legs) {
      const lF = leg('F', ''), lB = leg('B', '2');
      layers.push({ id: 'legB', parts: lB.parts, pins: lB.pins }, { id: 'legF', parts: lF.parts, pins: lF.pins });
    }
    layers.push({ id: 'body', parts: [torso, head] }, { id: 'F', parts: aF.parts, pins: aF.pins });
    return { layers, grip: { F: aF.grip, B: aB.grip }, mouth: map(head, loc(q.head, 'mouth')), top: map(head, loc(q.head, 'top')) };
  }

  // x, y = podlaha pod středem podstavce, s = měřítko, o.facing = -1 obráceně; vrací { q, g, W, s, f } (body
  // loutky ve světě přes W) nebo null, dokud se díly nenačtou. ctx = null: jen posune pózu, nekreslí.
  function draw(ctx, x, y, s, o) {
    if (!parts()) return null;
    const d = display(o), q = d.q, f = o.facing || 1;
    const g = d.g || (d.g = rig(q)); // kostra jednou za snímek (update i kreslení dostanou tutéž pózu)
    const W = (p) => ({ x: x + f * s * p[0], y: y + s * p[1] });
    const out = { q, g, W, s, f };
    if (!ctx) return out;
    ctx.save();
    ctx.shadowColor = 'rgba(40, 28, 16, 0.35)';
    ctx.shadowBlur = Math.max(1, 3 * s);
    ctx.shadowOffsetX = Math.max(1, 2 * s);
    ctx.shadowOffsetY = Math.max(1, 2.5 * s);
    for (const L of g.layers) {
      if (def.hook) def.hook(L.id, 'before', ctx, out);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(f * s, s);
      for (const pl of L.parts) {
        ctx.save();
        ctx.translate(pl.at[0], pl.at[1]);
        ctx.rotate(pl.rot);
        ctx.drawImage(P[pl.n].img, -pl.a[0], -pl.a[1]);
        ctx.restore();
      }
      if (L.pins) for (const p of L.pins) ctx.drawImage(U.pinImg(), p[0] - U.PIN_R, p[1] - U.PIN_R, 2 * U.PIN_R, 2 * U.PIN_R);
      ctx.restore();
      if (def.hook) def.hook(L.id, 'after', ctx, out);
    }
    ctx.restore();
    return out;
  }
  return { draw };
};
