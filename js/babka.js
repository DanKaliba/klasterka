// Babka v kuchyni jako papírová loutka (Daniel 2026-11-23, prompty E1–E3 v pics/podklady-kuchyne/
// PROMPT-postavy-lisejnik.md; python tools/sprity.py → K.SPRITY.babkaE2 a babkaE3). Klečí u kamen: spodek
// v kleku je jeden díl (sukně přes kolena), ohýbá se v pase, ruce v rameni, lokti a zápěstí. Výraz hraje
// jedna ze čtyř hlav se šátkem ze skutečné látky. Kostra je společná s dědou (js/loutky.js).
(() => {
  // klouby dílů jako podíly šířky a výšky obrázku (postava kouká doprava)
  const PARTS = {
    spodek: { seat: [0.55, 0.1], floor: [0.5, 1] },
    trup: { pelvis: [0.5, 0.82], neck: [0.6, 0.1], shF: [0.3, 0.3], shB: [0.62, 0.28] }, // krk zajede do límce
    paze: { a: [0.5, 0.1], b: [0.5, 0.88] },
    predlokti: { a: [0.22, 0.12], b: [0.8, 0.88] },
    ruka: { a: [0.5, 0.92], b: [0.5, 0.05], grip: [0.5, 0.45] }, // prsty nahoru: kloub je dole
    dlan: { a: [0.06, 0.5], b: [0.97, 0.45], grip: [0.55, 0.4] }, // dlaní nahoru, zápěstí vlevo
    kapesnik: { a: [0.15, 0.85], b: [0.7, 0.15], grip: [0.7, 0.2] },
    hlavaSmutna: { neck: [0.43, 0.72], mouth: [0.7, 0.57], top: [0.55, 0.03] },
    hlavaKasel: { neck: [0.43, 0.72], mouth: [0.68, 0.55], top: [0.55, 0.03] },
    hlavaProsi: { neck: [0.43, 0.72], mouth: [0.72, 0.55], top: [0.55, 0.03] },
    hlavaSpokojena: { neck: [0.43, 0.72], mouth: [0.64, 0.53], top: [0.55, 0.03] },
  };
  const KEYS = ['lean', 'neck', 'lift', 'sF', 'eF', 'wF', 'sB', 'eB', 'wB'];
  // klečí, ruce na kolenou (úhly jako u hrdiny: 0 = visí, kladně = dozadu; lean = předklon)
  const KNEEL = { lean: 0.12, neck: 0.12, lift: 0, sF: -0.35, eF: -0.5, wF: 0, sB: -0.3, eB: -0.55, wB: 0,
    head: 'hlavaSmutna', handF: 'ruka', handB: 'ruka' };
  // o.pose: 1 smutně kouká do ohně, 2 kašle, 3 prosí o roští, 4 natahuje ruce ke dvířkům, 5 spokojená;
  // o.lean (0–1): předkloní se ke dvířkům, když strká roští do ohně
  function target(o, tm, t) {
    const q = { ...KNEEL };
    q.lean += 0.012 * Math.sin(t * 1.9); // dýchá
    if (o.pose === 2) {
      Object.assign(q, { lean: 0.35, neck: 0.2, sF: -0.9, eF: -2.0, wF: 0, handF: 'kapesnik', head: 'hlavaKasel' });
      q.lean += 0.06 * Math.abs(Math.sin(t * 17));
    } else if (o.pose === 3) {
      Object.assign(q, { lean: 0.02, neck: -0.18, sF: -1.0, eF: -0.45, wF: 0.55, handF: 'dlan', head: 'hlavaProsi' });
    } else if (o.pose === 4) {
      Object.assign(q, { lean: 0.45, neck: 0.08, sF: -1.15, eF: -0.2, wF: 0.5, handF: 'dlan', sB: -1.05, eB: -0.25, wB: 0.5, handB: 'dlan' });
    } else if (o.pose === 5) {
      Object.assign(q, { lean: 0, neck: 0.02, sF: -0.2, eF: -1.05, wF: 0.2, sB: -0.15, eB: -1.1, wB: 0.2, head: 'hlavaSpokojena' });
    }
    q.lean += 0.35 * (o.lean || 0);
    return q;
  }
  const L = K.sediciLoutka({
    sets: [['babkaE2', ['spodek', 'trup', 'paze', 'predlokti', 'ruka', 'dlan', 'kapesnik', 'paze2', 'predlokti2', 'ruka2', 'dlan2', 'kapesnik2']],
      ['babkaE3', ['hlavaSmutna', 'hlavaKasel', 'hlavaProsi', 'hlavaSpokojena']]],
    parts: PARTS, base: 'spodek', legs: false, keys: KEYS, lag: { eF: 1.5, eB: 1.5, wF: 2.2, wB: 2.2 },
    target, key: (o) => String(o.pose),
  });
  // x, y = podlaha pod středem spodku; vrací body ve světě: mouth (pusa), hands (mezi dlaněmi, kam jí
  // kluk podá roští), top; null = nenačteno. ctx = null: jen posune pózu a vrátí body
  K.drawBabka = (ctx, x, y, s, o) => {
    const r = L.draw(ctx, x, y, s, o);
    if (!r) return null;
    const f = r.W(r.g.grip.F), b = r.W(r.g.grip.B);
    return { mouth: r.W(r.g.mouth), top: r.W(r.g.top), hands: { x: (f.x + b.x) / 2, y: (f.y + b.y) / 2 } };
  };
})();
