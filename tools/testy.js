// Skriptované průchody hrou pro headless Chrome (Playwright tu nejde). Spouští se ?test&skript=<jméno>.
// Kroky: ['ceka', ms] | ['klik', x, y] | ['klikOvce', i] | ['klikChalupa', id] | ['cekaVolno'] (busy 0)
//        | ['bezLesa'] (les jako prošlý, ať dlouhé procházky po louce nečekají na lesní scénu)
// Na konci zapíše render_game_to_text() do <pre id="stav"> a do titulku.
// strom: 1. pootevře oči, 2. probudí se, 3. „co je?“ + bublina s klíči + batoh
const STROM = [['klik', 118, 440], ['cekaVolno'], ['klik', 118, 440], ['cekaVolno'], ['klik', 118, 440], ['cekaVolno']];
// lesní scéna: strom → choroše → schody na zídku, správný rampouch → beran → přechod na louku
// (konec čeká jen na odchod z lesa: rozběhnutá cesta do chalupy drží busy až do jejího detailu)
const LES = [['ceka', 300], ...STROM, ['klik', 590, 925], ['cekaVolno'], ['klik', 955, 430], ['cekaMimo', 'les']];
window.SCENARE = {
  uvod: [['ceka', 3000]],
  ovce: [['ceka', 2500], ['klikOvce', 0], ['ceka', 600]],
  // z louky do lesa (otevře se sám na kraji lesa), po vyřešení dojde panáček až do Skočky
  cesta: [['ceka', 2500], ['klikOvce', 0], ['ceka', 300], ['klikChalupa', 'skocka'], ['cekaScena', 'les'], ...LES,
    ['cekaScena', 'skocka'], ['ceka', 500]],
  // ?scena=les: nejdřív špatně (ze země, voda, roh, mech), screenshot před probuzením
  les: [['cekaScena', 'les'], ...STROM, ['klik', 955, 430], ['cekaVolno'], ['klik', 590, 925], ['cekaVolno'], ['klik', 815, 440], ['cekaVolno'],
    ['klik', 885, 430], ['cekaVolno'], ['klik', 1090, 900], ['klik', 1025, 400], ['cekaVolno'], ['ceka', 400]],
  lesIntro: [['ceka', 2600]],
  lesStrom: [['cekaScena', 'les'], ['klik', 118, 440], ['ceka', 600]],
  lesKlice: [['cekaScena', 'les'], ['klik', 118, 440], ['cekaVolno'], ['klik', 118, 440], ['cekaVolno'], ['klik', 118, 440], ['ceka', 7000]],
  lesBeran: [['cekaScena', 'les'], ...STROM, ['klik', 590, 925], ['cekaVolno'], ['klik', 955, 430], ['ceka', 3600]],
  lesPrechod: [['cekaScena', 'les'], ...STROM, ['klik', 590, 925], ['cekaVolno'], ['klik', 955, 430], ['ceka', 6300]],
  lesOdchod: [['cekaScena', 'les'], ...STROM, ['klik', 590, 925], ['cekaVolno'], ['klik', 955, 430], ['ceka', 8000]],
  // ovce, která se ptá po beranovi (poslední), a tetřívek na sloupu (klik = zatoká)
  beranOvce: [['ceka', 2500], ['klikOvce', 5], ['ceka', 800]],
  tetrivek: [['ceka', 2500], ['klik', 539, 592], ['ceka', 700]],
  // chůze kamkoli: po dolní louce rovnou, na horní louku přes cestu lesem (les přeskočený)
  chuze: [['bezLesa'], ['ceka', 2500], ['klik', 250, 800], ['ceka', 5000], ['klik', 1100, 370], ['ceka', 26000]],
  chuze1: [['bezLesa'], ['ceka', 2500], ['klik', 250, 800], ['ceka', 5000]],
  lesKonec: [['cekaScena', 'les'], ...LES, ['ceka', 1500]],
  skocka: [['ceka', 800], ['klik', 1450, 480], ['ceka', 300], ['klik', 1450, 480], ['ceka', 300], ['klik', 1450, 480], ['ceka', 1500], ['klik', 1360, 830], ['ceka', 600]],
  kantorska: [['ceka', 800], ['klik', 820, 745], ['ceka', 200], ['klik', 1260, 745], ['ceka', 900]],
  kriz: [['ceka', 800], ['klik', 760, 300], ['ceka', 300], ['klik', 1060, 820], ['ceka', 400], ['klik', 1236, 870], ['ceka', 900],
    ['klik', 1320, 902], ['ceka', 900], ['klik', 1405, 892], ['ceka', 2800]],
  kriz2: [['ceka', 800], ['klik', 1236, 870], ['ceka', 900], ['klik', 1320, 902], ['ceka', 900], ['klik', 1405, 892], ['ceka', 2800],
    ['klik', 1060, 820], ['ceka', 1200]],
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
  daleko: [['bezLesa'], ['ceka', 2500], ['klikOvce', 0], ['ceka', 300], ['klikChalupa', 'klinovka'], ['ceka', 14000]],
  daleko2: [['bezLesa'], ['ceka', 2500], ['klikOvce', 0], ['ceka', 300], ['klikChalupa', 'klinovka'], ['ceka', 24000]],
};

// celá hra od začátku do titulku
const navstiv = (id, kroky) => [['klikChalupa', id], ['cekaScena', id], ['ceka', 700], ...kroky, ['cekaScena', 'louka'], ['ceka', 1500]];
window.SCENARE.cela = [
  ['ceka', 2500], ['klikOvce', 0], ['ceka', 300],
  ['klikChalupa', 'skocka'], ['cekaScena', 'les'], ...LES, ['cekaScena', 'skocka'], ['ceka', 700],
  ['klik', 1450, 480], ['ceka', 300], ['klik', 1450, 480], ['ceka', 300], ['klik', 1450, 480], ['ceka', 1500], ['klik', 1360, 830],
  ['cekaScena', 'louka'], ['ceka', 1500],
  ...navstiv('kantorska', [['klik', 1260, 745]]),
  ...navstiv('kriz', [['klik', 1236, 870], ['ceka', 900], ['klik', 1320, 902], ['ceka', 900], ['klik', 1405, 892], ['ceka', 2800], ['klik', 1060, 820]]),
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
    else if (s[0] === 'cekaMimo') await waitFor(() => K.scene !== K.scenes[s[1]], 'mimo ' + s[1]);
    else if (s[0] === 'cekaVolno') await waitFor(() => K.busy === 0, 'volno');
    else if (s[0] === 'bezLesa') K.forestDone();
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

