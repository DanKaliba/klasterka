// Kocour v kuchyni jako papírová loutka (Daniel 2026-11-23, prompty KL1–KL4 v pics/podklady-postavy/
// PROMPT-postavy.md; python tools/sprity.py → K.SPRITY.kocourKL2–KL4). Stejně jako hrdina, děda a babka:
// díly na mosazných nýtech, póza po krocích 12× za s, kloub každý krok trochu ujede, přechody s dobíháním
// a otočka přes hranu kartonu.
// Kostra (kocour kouká doprava): nýtek uprostřed zad spojuje hrudník a zadek; na hrudníku hlava (jedna z pěti
// = výraz) a přední nohy (paže, předloktí s tlapkou), na zadku zadní nohy (kýta, lýtko s hleznem a tlapou)
// a ocas ze tří článků. Spí jako klubíčko (jeden díl) s přinýtovanou hlavou a ocasem.
(() => {
  const U = K.LOUTKA_UTIL;
  // klouby dílů jako podíly šířky a výšky obrázku
  const PARTS = {
    hrudnik: { mid: [0.15, 0.49], neck: [0.85, 0.33], sh: [0.57, 0.67] },
    zadek: { mid: [0.88, 0.5], tail: [0.07, 0.25], hip: [0.28, 0.69], seat: [0.3, 1] }, // seat = spodek kýty (sedí na něm)
    ocasA: { a: [0.88, 0.25], b: [0.12, 0.78] },
    ocasB: { a: [0.92, 0.5], b: [0.08, 0.5] },
    ocasC: { a: [0.95, 0.55], b: [0.05, 0.2] },
    paze: { a: [0.5, 0.15], b: [0.5, 0.88] },
    predlokti: { a: [0.48, 0.08], b: [0.5, 0.88], sole: [0.62, 1] },
    stehno: { a: [0.55, 0.42], b: [0.42, 0.93] },
    lytko: { a: [0.45, 0.07], b: [0.55, 0.86], sole: [0.68, 1] },
    hlavaKlid: { neck: [0.35, 0.75], nose: [0.96, 0.55], top: [0.45, 0.02] },
    hlavaSpi: { neck: [0.35, 0.78], nose: [0.96, 0.6], top: [0.45, 0.02] },
    hlavaZiva: { neck: [0.35, 0.75], nose: [0.96, 0.45], top: [0.45, 0.02] },
    hlavaMnau: { neck: [0.35, 0.85], nose: [0.96, 0.5], top: [0.3, 0.05] },
    hlavaCich: { neck: [0.35, 0.85], nose: [0.97, 0.45], top: [0.45, 0.02] },
    klubko: { floor: [0.5, 0.93], neck: [0.9, 0.5], tail: [0.12, 0.85] },
  };
  const SETS = [
    ['kocourKL2', ['hrudnik', 'zadek', 'ocasA', 'ocasB', 'ocasC']],
    ['kocourKL3', ['paze', 'predlokti', 'stehno', 'lytko', 'paze2', 'predlokti2', 'stehno2', 'lytko2']],
    ['kocourKL4', ['hlavaKlid', 'hlavaSpi', 'hlavaZiva', 'hlavaMnau', 'hlavaCich', 'klubko']],
  ];
  // úhly jako u hrdiny: 0 = noha visí, kladně = konec jde dozadu; rf / rr = natočení hrudníku / zadku
  // (kladně = přední konec dolů), neck = hlava vůči hrudníku, t1–t3 = články ocasu (t1 vůči zadku)
  const KEYS = ['rf', 'rr', 'neck', 'sF', 'eF', 'sB', 'eB', 'hF', 'kF', 'hB', 'kB', 't1', 't2', 't3'];
  const LAG = { eF: 1.5, eB: 1.5, kF: 1.5, kB: 1.5, t2: 1.8, t3: 2.6 };
  const STAND = { rf: 0, rr: 0, neck: 0, sF: 0, eF: 0, sB: 0.06, eB: -0.04, hF: 0.12, kF: -0.12, hB: 0.02, kB: -0.06,
    t1: 2.55, t2: 0.35, t3: 0.5, head: 'hlavaKlid' };
  const WALK_STEPS = 8;

  // o.pose: sleep | stretch | walk | leap | prep (přikrčí se před skokem) | sniff | sit | crouch (na dědově hlavě);
  // o.phase = dráha chůze, o.earT (cukne uchem / probouzí se), o.purrT (přede), o.meowT (mňoukne),
  // o.shakeT (otřepe si tlapku), o.tapT (ťuká tlapkou do hrnku)
  function target(o, tm, t) {
    const q = { ...STAND };
    const since = (v) => (v == null ? 99 : t - v);
    const pose = o.pose || 'walk';
    if (pose === 'sleep') {
      q.ball = true;
      q.head = 'hlavaSpi';
      q.neck = 0.35;
      q.t1 = -1.45; q.t2 = -0.15; q.t3 = -0.35;
      const e = since(o.earT);
      if (e < 0.4) q.neck += 0.12 * Math.sin(e * 40); // cukne hlavou s uchem
      if (e >= 0.4 && e < 2.2) { q.head = 'hlavaKlid'; q.neck = -0.25; } // probudí se a zvedne hlavu
      return q;
    }
    if (pose === 'walk') {
      const d = (2 * Math.PI) / WALK_STEPS, p = Math.floor((o.phase || 0) / d) * d;
      const leg = (ph) => [0.42 * Math.sin(ph), 0.7 * Math.max(0, -Math.cos(ph))];
      [q.sF, q.eF] = leg(p);
      [q.sB, q.eB] = leg(p + Math.PI);
      const hind = (ph) => [0.36 * Math.sin(ph), 0.55 * Math.max(0, -Math.cos(ph))];
      [q.hF, q.kF] = hind(p + Math.PI);
      [q.hB, q.kB] = hind(p);
      q.kF -= 0.12; q.kB -= 0.06;
      q.neck = 0.05 * Math.sin(2 * p);
      q.rf = 0.025 * Math.sin(2 * p);
      q.t1 = 2.5 + 0.08 * Math.sin(p);
      q.t2 = 0.3 + 0.18 * Math.sin(p - d);
      q.t3 = 0.45 + 0.3 * Math.sin(p - 2 * d);
    } else if (pose === 'stretch') {
      const u = U.smooth(U.ramp(tm, 0, 0.5));
      Object.assign(q, U.mix({ ...q }, { rf: 0.55, rr: -0.28, neck: -0.75, sF: -1.05, eF: -0.15, sB: -0.95, eB: -0.2,
        hF: 0.22, kF: -0.2, hB: 0.12, kB: -0.12, t1: 2.95, t2: 0.1, t3: 0.25 }, u));
      q.head = tm > 0.25 && tm < 1.6 ? 'hlavaZiva' : 'hlavaKlid';
      q.t3 += 0.15 * Math.sin(t * 6);
    } else if (pose === 'leap') {
      Object.assign(q, { rf: -0.08, rr: 0.06, neck: -0.08, sF: -1.35, eF: -0.15, sB: -1.15, eB: -0.25,
        hF: 1.3, kF: -0.15, hB: 1.1, kB: -0.05, t1: 1.75, t2: 0.05 + 0.15 * Math.sin(t * 14), t3: -0.15 + 0.25 * Math.sin(t * 14 - 1) });
      q.air = true;
    } else if (pose === 'prep' || pose === 'crouch') {
      // přikrčí se: lokty a kolena složené, břicho u země; před skokem vrtí zadkem
      Object.assign(q, { rf: 0.12, rr: -0.06, neck: -0.1, sF: 0.55, eF: -1.45, sB: 0.6, eB: -1.4,
        hF: -0.95, kF: 1.75, hB: -0.85, kB: 1.65, t1: 1.6, t2: 0.25, t3: 0.35 });
      if (pose === 'prep') q.rr += 0.07 * Math.sin(t * 28);
      else { q.head = 'hlavaMnau'; q.t3 += 0.35 * Math.sin(t * 9); } // na hlavě: uši dozadu, ocas šlehá
    } else if (pose === 'sniff') {
      Object.assign(q, { rf: 0.3, rr: 0.04, neck: 0.5, sF: -0.3, sB: -0.24, hF: 0.08, hB: -0.02, head: 'hlavaCich' });
      q.neck += 0.07 * Math.abs(Math.sin(t * 7)); // ťuká nosem
    } else if (pose === 'sit') {
      Object.assign(q, { rf: -1.0, rr: -0.6, neck: 0.85, sF: 1.0, eF: 0, sB: 1.06, eB: -0.02,
        hF: -0.7, kF: 2.7, hB: -0.65, kB: 2.6, t1: 0.5, t2: -1.5, t3: -0.45, head: 'hlavaSpi' });
      q.tailFront = true; // ocas kolem tlapek, před nimi
      if (Math.sin(t * 0.7) < -0.75 && since(o.purrT) > 2.5) q.head = 'hlavaKlid'; // občas otevře oči
      if (since(o.purrT) < 2.5) { q.neck += 0.08 * Math.sin(t * 5); q.t3 += 0.3 * Math.sin(t * 9); } // přede, otírá se
    }
    if (since(o.meowT) < 0.55) q.head = 'hlavaMnau';
    // otřepe si přední tlapku (rozpálená římsa)
    const sh = since(o.shakeT);
    if (sh < 0.7) { q.sF = -0.7 + 0.25 * Math.sin(sh * 45); q.eF = 0.9 + 0.5 * Math.sin(sh * 45 + 1); }
    // ťuká tlapkou do hrnku: dvakrát zvedne tlapku dopředu a dolů
    const tp = since(o.tapT);
    if (tp < 1.0) { const k = Math.abs(Math.sin(tp * Math.PI * 2)); q.sF = -0.35 - 0.9 * k; q.eF = -0.1 + 0.5 * (1 - k); }
    return q;
  }
  const key = (o) => o.pose || 'walk';

  // zobrazená póza (jeden kocour na scénu): přechod, dobíhání, cukání kloubů, otočka
  const S = { key: null, t0: 0, last: -9, from: null, cur: null, facing: 0, flipFrom: 1, flipT: -9 };
  function display(o) {
    const k = key(o);
    if (S.cur && S.last === K.time && S.key === k) return S.cur;
    const tq = Math.floor(K.time * U.FPS) / U.FPS;
    const gap = K.time - S.last > 0.5 || K.time < S.last;
    if (k !== S.key) {
      // z klubíčka a do něj se nepřechází (jiné díly), jinak póza doběhne za 0,3 s
      S.from = gap || !S.cur || S.cur.base.ball || k === 'sleep' ? null : S.cur.base;
      S.t0 = tq;
      S.key = k;
    }
    S.last = K.time;
    const q = target(o, tq - S.t0, tq);
    if (S.from) {
      const w = U.smooth(Math.min(1, (tq - S.t0) / 0.3));
      for (const n of KEYS) q[n] = S.from[n] + (q[n] - S.from[n]) * w ** (LAG[n] || 1);
      if (w >= 1) S.from = null;
    }
    const base = { ...q };
    const step = Math.floor(K.time * U.FPS);
    KEYS.forEach((n, i) => { q[n] += (K.hash(step * 11.7 + i * 4.1 + 90) - 0.5) * U.JITTER; });
    const f = o.facing || 1;
    if (!S.facing || gap) { S.facing = f; S.flipT = -9; }
    else if (f !== S.facing) { S.flipFrom = S.facing; S.facing = f; S.flipT = tq; }
    const u = Math.min(1, (tq - S.flipT) / 0.25);
    let sx = u >= 1 ? f : S.flipFrom + (f - S.flipFrom) * u;
    if (Math.abs(sx) < 0.08) sx = 0.08 * f;
    S.cur = { q, base, sx, g: null };
    return S.cur;
  }

  let P = null;
  function parts() {
    if (P) return P;
    const out = {};
    for (const [set, names] of SETS) {
      for (const n of names) {
        const sp = K.sprite(set, n);
        if (!sp) return null;
        out[n] = sp;
      }
    }
    P = out;
    return P;
  }

  // díly na místech (px dílů, počátek = nýtek uprostřed zad, y dolů); dy posadí nejnižší tlapu na zem
  function rig(q) {
    const loc = (n, k) => { const f = PARTS[n.replace(/2$/, '')][k]; return [f[0] * P[n].sp.w, f[1] * P[n].sp.h]; };
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
    const tail = (at, A) => {
      const t1 = bone('ocasA', at, A + q.t1), t2 = bone('ocasB', t1.end, A + q.t1 + q.t2);
      const t3 = bone('ocasC', t2.end, A + q.t1 + q.t2 + q.t3);
      return { id: 'tail', parts: [t3, t2, t1], pins: [t2.at, t3.at] };
    };
    if (q.ball) {
      const ball = place('klubko', [0, 0], 0, loc('klubko', 'floor'));
      const head = place(q.head, map(ball, loc('klubko', 'neck')), q.neck, loc(q.head, 'neck'));
      const layers = [{ id: 'ball', parts: [ball] }, tail(map(ball, loc('klubko', 'tail')), 0),
        { id: 'head', parts: [head], pins: [head.at] }];
      return { layers, dy: 0, nose: map(head, loc(q.head, 'nose')), top: map(head, loc(q.head, 'top')) };
    }
    const rear = place('zadek', [0, 0], q.rr, loc('zadek', 'mid'));
    const chest = place('hrudnik', [0, 0], q.rf, loc('hrudnik', 'mid'));
    const head = place(q.head, map(chest, loc('hrudnik', 'neck')), q.rf + q.neck, loc(q.head, 'neck'));
    const front = (X, suf) => {
      const A = q.rf + q['s' + X];
      const up = bone('paze' + suf, map(chest, loc('hrudnik', 'sh')), A);
      const lo = bone('predlokti' + suf, up.end, A + q['e' + X]);
      return { parts: [lo, up], pins: [up.at, lo.at], sole: map(lo, loc('predlokti' + suf, 'sole')) };
    };
    const hind = (X, suf) => {
      const A = q.rr + q['h' + X];
      const th = bone('stehno' + suf, map(rear, loc('zadek', 'hip')), A);
      const lo = bone('lytko' + suf, th.end, A + q['k' + X]);
      return { parts: [lo, th], pins: [th.at, lo.at], sole: map(lo, loc('lytko' + suf, 'sole')) };
    };
    const fF = front('F', ''), fB = front('B', '2'), hF = hind('F', ''), hB = hind('B', '2');
    const ground = Math.max(fF.sole[1], fB.sole[1], hF.sole[1], hB.sole[1], map(rear, loc('zadek', 'seat'))[1]);
    const tl = tail(map(rear, loc('zadek', 'tail')), q.rr);
    const layers = [
      ...(q.tailFront ? [] : [tl]),
      { id: 'legB', parts: [...hB.parts, ...fB.parts], pins: [hB.pins[1], fB.pins[1]] },
      { id: 'body', parts: [rear, chest], pins: [[0, 0]] },
      { id: 'legF', parts: [...hF.parts, ...fF.parts], pins: [...hF.pins, ...fF.pins] },
      { id: 'head', parts: [head], pins: [head.at] },
      ...(q.tailFront ? [tl] : []),
    ];
    return { layers, ground, nose: map(head, loc(q.head, 'nose')), top: map(head, loc(q.head, 'top')), paw: fF.sole };
  }
  // výška hřbetu nad zemí ve stoji: ve skoku se kocour drží v ní (tlapy nejsou na zemi)
  let standGround = 0;

  // x, y = země pod nýtkem uprostřed zad, s = měřítko (1 = px dřívějšího kocoura z obrázku), o viz target;
  // o.rot natočí celého kocoura kolem x, y (skok). Vrací body ve světě { nose, top, paw } nebo null, dokud
  // se díly nenačtou. ctx = null: jen posune pózu.
  K.drawKocour = (ctx, x, y, s, o) => {
    if (!parts()) return null;
    if (!standGround) standGround = rig({ ...STAND }).ground;
    const d = display(o);
    const g = d.g || (d.g = rig(d.q));
    const dy = g.dy !== undefined ? g.dy : d.q.air ? -standGround : -g.ground;
    const rot = (o.rot || 0) * (o.facing || 1);
    const c = Math.cos(rot), sn = Math.sin(rot);
    const W = (p) => {
      const px = d.sx * s * p[0], py = s * (p[1] + dy);
      return { x: x + px * c - py * sn, y: y + px * sn + py * c };
    };
    const out = { nose: W(g.nose), top: W(g.top), paw: g.paw ? W(g.paw) : null };
    if (!ctx) return out;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(d.sx * s, s);
    ctx.translate(0, dy);
    if (d.q.ball) { // klubíčko dýchá (od podlahy)
      ctx.scale(1, 1 + 0.025 * Math.sin(K.time * 1.8));
    }
    if (K.time - (o.purrT ?? -99) < 2.5) ctx.translate(Math.sin(K.time * 40) * 0.6, 0); // přede
    ctx.shadowColor = 'rgba(40, 28, 16, 0.35)';
    ctx.shadowBlur = Math.max(1, 3 * s);
    ctx.shadowOffsetX = Math.max(1, 2 * s);
    ctx.shadowOffsetY = Math.max(1, 2.5 * s);
    const pr = U.PIN_R * 0.55; // kocour je malý: menší nýtky
    for (const L of g.layers) {
      for (const pl of L.parts) {
        ctx.save();
        ctx.translate(pl.at[0], pl.at[1]);
        ctx.rotate(pl.rot);
        ctx.drawImage(P[pl.n].img, -pl.a[0], -pl.a[1]);
        ctx.restore();
      }
      if (L.pins) for (const p of L.pins) ctx.drawImage(U.pinImg(), p[0] - pr, p[1] - pr, 2 * pr, 2 * pr);
    }
    ctx.restore();
    return out;
  };
})();
