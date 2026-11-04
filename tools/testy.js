// Skriptované průchody hrou pro headless Chrome (Playwright tu nejde). Spouští se ?test&skript=<jméno>.
// Kroky: ['ceka', ms] | ['klik', x, y] | ['klikOvce', i] | ['klikChalupa', id]
// Na konci zapíše render_game_to_text() do <pre id="stav"> a do titulku.
window.SCENARE = {
  uvod: [['ceka', 3000]],
  ovce: [['ceka', 2500], ['klikOvce', 0], ['ceka', 600]],
  cesta: [['ceka', 2500], ['klikOvce', 0], ['ceka', 300], ['klikChalupa', 'skocka'], ['ceka', 4000]],
  spisovatel: [['ceka', 2500], ['klikOvce', 0], ['ceka', 300], ['klikChalupa', 'spisovatel'], ['ceka', 12000],
    ['klik', 640, 780], ['ceka', 300], ['klik', 950, 680], ['ceka', 8000]],
  detailSpisovatel: [['ceka', 800], ['klik', 640, 780], ['ceka', 300], ['klik', 950, 680], ['ceka', 2500]],
  skocka: [['ceka', 800], ['klik', 1450, 480], ['ceka', 300], ['klik', 1450, 480], ['ceka', 300], ['klik', 1450, 480], ['ceka', 1500], ['klik', 1360, 830], ['ceka', 600]],
  kantorska: [['ceka', 800], ['klik', 820, 745], ['ceka', 200], ['klik', 1260, 745], ['ceka', 900]],
  kriz: [['ceka', 800], ['klik', 760, 300], ['ceka', 300], ['klik', 1060, 820], ['ceka', 400], ['klik', 1236, 870], ['ceka', 900],
    ['klik', 1320, 902], ['ceka', 900], ['klik', 1405, 892], ['ceka', 2800]],
  kriz2: [['ceka', 800], ['klik', 1236, 870], ['ceka', 900], ['klik', 1320, 902], ['ceka', 900], ['klik', 1405, 892], ['ceka', 2800],
    ['klik', 1060, 820], ['ceka', 1200]],
  ranc: [['ceka', 800], ['klik', 1080, 760], ['ceka', 3500], ['klik', 1480, 850], ['ceka', 500]],
  jelinek: [['ceka', 800], ['klik', 800, 800], ['ceka', 1600], ['klik', 1150, 800], ['ceka', 1600], ['klik', 1500, 800], ['ceka', 1600]],
  klinovka: [['ceka', 800], ['klik', 690, 810], ['ceka', 800], ['klik', 690, 810], ['ceka', 800], ['klik', 1000, 800], ['ceka', 1500]],
  vrchol: [['ceka', 800], ['klik', 1100, 230], ['ceka', 300], ['klik', 1100, 230], ['ceka', 300], ['klik', 1100, 230], ['ceka', 2600]],
  finale: [['ceka', 1000]],
  konec: [['ceka', 3000]],
  dokonce: [['cekaVlek'], ['ceka', 200], ['klikVlek'], ['cekaKonec'], ['ceka', 3000]],
  vlek: [['cekaVlek'], ['klikVlek'], ['ceka', 9000]],
  lyzovani: [['cekaVlek'], ['klikVlek'], ['ceka', 24000]],
  lyzovani2: [['cekaVlek'], ['klikVlek'], ['ceka', 31000]],
  stopy: [['ceka', 2500], ['klik', 866, 809], ['ceka', 4000], ['klik', 519, 931], ['ceka', 1500]],
  ptacek: [['cekaVlek'], ['ceka', 600]],
  odlet: [['cekaVlek'], ['ceka', 300], ['klikVlek'], ['ceka', 900]],
  daleko: [['ceka', 2500], ['klikOvce', 0], ['ceka', 300], ['klikChalupa', 'klinovka'], ['ceka', 14000]],
  daleko2: [['ceka', 2500], ['klikOvce', 0], ['ceka', 300], ['klikChalupa', 'klinovka'], ['ceka', 24000]],
};

// celá hra od začátku do titulku
const navstiv = (id, kroky) => [['klikChalupa', id], ['cekaScena', id], ['ceka', 700], ...kroky, ['cekaScena', 'louka'], ['ceka', 1500]];
window.SCENARE.cela = [
  ['ceka', 2500], ['klikOvce', 0], ['ceka', 300],
  ...navstiv('spisovatel', [['klik', 640, 780], ['ceka', 300], ['klik', 950, 680]]),
  ...navstiv('skocka', [['klik', 1450, 480], ['ceka', 300], ['klik', 1450, 480], ['ceka', 300], ['klik', 1450, 480], ['ceka', 1500], ['klik', 1360, 830]]),
  ...navstiv('kantorska', [['klik', 1260, 745]]),
  ...navstiv('kriz', [['klik', 1236, 870], ['ceka', 900], ['klik', 1320, 902], ['ceka', 900], ['klik', 1405, 892], ['ceka', 2800], ['klik', 1060, 820]]),
  ...navstiv('ranc', [['klik', 1080, 760], ['ceka', 3500], ['klik', 1480, 850]]),
  ...navstiv('jelinek', [['klik', 800, 800], ['ceka', 1600], ['klik', 1150, 800], ['ceka', 1600], ['klik', 1500, 800], ['ceka', 1600], ['klikKolo']]),
  ...navstiv('klinovka', [['klik', 690, 810], ['ceka', 800], ['klik', 690, 810], ['ceka', 800], ['klik', 1000, 800]]),
  ['klikVrchol'], ['cekaScena', 'vrchol'], ['ceka', 700],
  ['klik', 1100, 230], ['ceka', 300], ['klik', 1100, 230], ['ceka', 300], ['klik', 1100, 230],
  ['cekaScena', 'finale'], ['cekaVlek'], ['ceka', 500], ['klikVlek'], ['cekaKonec'], ['ceka', 2500],
];

(async () => {
  const name = K.params.get('skript');
  const steps = window.SCENARE[name] || [];
  const tick = () => new Promise((r) => setTimeout(r, 0));
  // update po 50 ms, mezi tím tick pro doběhnutí awaitů ve scénkách; kreslí se jen na konci kroku
  const wait = async (ms) => {
    for (let t = 0; t < ms; t += 50) {
      for (let i = 0; i < 3; i++) K.update(1 / 60);
      await tick();
    }
    window.advanceTime(1);
  };
  const target = K.params.get('scena') || 'louka';
  while (K.scene !== K.scenes[target]) await new Promise((r) => setTimeout(r, 20));
  // čekání na podmínku, nejvýš 60 s herního času
  const waitFor = async (cond, label) => {
    for (let t = 0; t < 60000 && !cond(); t += 50) await wait(50);
    if (!cond()) console.log('TIMEOUT ' + label);
  };
  const sceneIs = (n) => () => K.scene === K.scenes[n] && K.busy === 0;
  for (const s of steps) {
    if (s[0] === 'ceka') await wait(s[1]);
    else if (s[0] === 'cekaScena') await waitFor(sceneIs(s[1]), s[1]);
    else if (s[0] === 'cekaVlek') await waitFor(() => K.finale.waiting, 'vlek');
    else if (s[0] === 'cekaKonec') await waitFor(() => K.finale.ended, 'konec');
    else {
      let p;
      if (s[0] === 'klik') p = { x: s[1], y: s[2] };
      if (s[0] === 'klikOvce') { const sh = K.sheep[s[1]]; p = { x: sh.x, y: sh.y - 20 * K.scaleAt(sh.x, sh.y) }; }
      if (s[0] === 'klikChalupa') p = K.L.chalupy.find((c) => c.id === s[1]);
      if (s[0] === 'klikKolo') p = K.scene.st.wheel;
      if (s[0] === 'klikVrchol') p = K.L.vrchol;
      if (s[0] === 'klikVlek') { const V = K.L.vlek; p = { x: V.sloup.x, y: (V.sloup.y + V.pata.y) / 2 }; }
      K.mouse = p;
      if (K.busy === 0 && K.scene.click) K.scene.click(p);
      await wait(50);
    }
  }
  const pre = document.createElement('pre');
  pre.id = 'stav';
  pre.textContent = window.render_game_to_text();
  document.body.appendChild(pre);
  document.title = 'HOTOVO';
  console.log('STAV ' + pre.textContent);
})();

