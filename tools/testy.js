// Skriptované průchody hrou pro headless Chrome (Playwright tu nejde). Spouští se ?test&skript=<jméno>.
// Kroky: ['ceka', ms] | ['klik', x, y] | ['klikOvce', i] | ['klikChalupa', id] | ['cekaVolno'] (busy 0)
//        | ['bezLesa'] (les jako prošlý, ať dlouhé procházky po louce nečekají na lesní scénu)
// Na konci zapíše render_game_to_text() do <pre id="stav"> a do titulku.
// strom: 1. pootevře oči, 2. probudí se, 3. „co je?“ + bublina s klíči + batoh
// od třetího kliku na strom do začátku herbáře: bublina „?“ (2,0 s) + panáček ukáže sníh (2,1 s), viz treeTalk v les.js
const TREE_TALK = 4100;
const STROM = [['klik', 312, 280], ['cekaVolno'], ['klik', 312, 280], ['cekaVolno'], ['klik', 312, 280], ['cekaVolno']];
// lesní scéna (bez stromu — probudí ho až rána padající soušky): stáhnout větev z lávky (vysvitne
// slunce), rampouch nad krkem berana → trk do opěry, souška spadne přes mezeru; pak utrhnout rampouch
// (do batohu) a přejít po kmeni → louka
// (konec čeká jen na odchod z lesa: rozběhnutá cesta do chalupy drží busy až do jejího detailu)
const VETEV = [['klik', 890, 585], ['cekaVolno']];
const KRK = ['klik', 1040, 690];
const PRES = [['cekaVolno'], ['klik', 900, 690], ['cekaVolno'], ['klik', 1500, 600]];
const LES = [['ceka', 300], ['cekaVolno'], ...VETEV, KRK, ...PRES, ['cekaMimo', 'les']];
// kuchyně: kouř → pohrabáč z tyče sporáku → okno; pak roští od dveří babce → … → semínka z koše
const OKNO = [['cekaVolno'], ['klik', 772, 760], ['cekaVolno'], ['klik', 1515, 520], ['cekaVolno']];
// … kocour skočí dědovi na hlavu, fajfka spadne → panáček sebere fajfku a pak semínka s hrnkem z koše
const KUCHYNE = [...OKNO, ['klik', 1735, 900], ['cekaVolno'], ['klik', 1010, 995], ['cekaVolno'], ['klik', 446, 920]];
const LES_BERAN = [['cekaScena', 'les'], ['cekaVolno'], ...VETEV, KRK];
// studánka u božích muk (js/muka.js)
const MUKA_VETVE = [['cekaVolno'], ['klik', 1030, 752], ['cekaVolno'], ['klik', 1115, 764], ['cekaVolno'], ['klik', 1205, 754], ['cekaVolno']];
const MUKA_ZABA = [['klik', 1060, 752], ['cekaVolno']];
const MUKA_HRNEK = [['klikNastroj', 'hrnecek'], ['klik', 1677, 815]]; // hrnek z batůžku pod konec žlábku
const MUKA_DYM = [['klikNastroj', 'fajfka'], ['klik', 1060, 752]]; // fajfka z batůžku na žábu
// žába: 1. se nafoukne, 2. cvrkne, 3. panáček na ni foukne dým z dědovy fajfky
const MUKA_FAJFKA = [...MUKA_VETVE, ...MUKA_ZABA, ...MUKA_ZABA, ...MUKA_DYM, ['cekaVolno']];
const MUKA_CELA = [...MUKA_FAJFKA, ...MUKA_HRNEK];
window.SCENARE = {
  uvod: [['ceka', 3000]],
  ovce: [['ceka', 2500], ['klikOvce', 0], ['ceka', 600]],
  // z louky do lesa (otevře se sám na kraji lesa), po vyřešení dojde panáček až na Kantorskou
  cesta: [['ceka', 2500], ['klikOvce', 0], ['ceka', 300], ['klikChalupa', 'kantorska'], ['cekaScena', 'les'], ...LES,
    ['cekaScena', 'kantorska'], ['ceka', 500]],
  // ?scena=les: nejdřív špatně (ledová voda, ve stínu se rampouch jen zachvěje, konec lávky,
  // chrápající beran), screenshot před stažením větve
  les: [['cekaScena', 'les'], ['cekaVolno'], ['klik', 900, 950], ['cekaVolno'], ['klik', 900, 690], ['cekaVolno'],
    ['klik', 1500, 600], ['cekaVolno'], ['klik', 1040, 830], ['ceka', 400]],
  lesIntro: [['ceka', 2600]],
  lesStrom: [['cekaScena', 'les'], ['cekaVolno'], ['klik', 312, 280], ['ceka', 600]],
  lesOtazka: [['cekaScena', 'les'], ['cekaVolno'], ...STROM.slice(0, 5), ['ceka', 1500]],
  // otazník: rozepsaný tah, tečka v přerůstání
  lesOtazka1: [['cekaScena', 'les'], ['cekaVolno'], ...STROM.slice(0, 5), ['ceka', 450]],
  lesOtazka2: [['cekaScena', 'les'], ['cekaVolno'], ...STROM.slice(0, 5), ['ceka', 1020]],
  // herbář: strom ukazuje postup (semínka, voda, rampouch, zasazení, růst, pyl) — snímky v čase smyčky
  lesHerbar1: [['cekaScena', 'les'], ['cekaVolno'], ...STROM.slice(0, 5), ['ceka', TREE_TALK + 2000]],
  lesHerbar2: [['cekaScena', 'les'], ['cekaVolno'], ...STROM.slice(0, 5), ['ceka', TREE_TALK + 7200]],
  lesHerbar3: [['cekaScena', 'les'], ['cekaVolno'], ...STROM.slice(0, 5), ['ceka', TREE_TALK + 9800]],
  lesKlice: [['cekaScena', 'les'], ['cekaVolno'], ...STROM.slice(0, 5), ['ceka', TREE_TALK + 3300]],
  lesVoda: [['cekaScena', 'les'], ['cekaVolno'], ['klik', 900, 950], ['ceka', 1500]],
  lesKonecLavky: [['cekaScena', 'les'], ['cekaVolno'], ['klik', 700, 590], ['cekaVolno'], ['klik', 1500, 600], ['ceka', 1300]],
  lesVetev: [['cekaScena', 'les'], ['cekaVolno'], ['klik', 890, 585], ['ceka', 1500]],
  // bez batohu se rampouch jen zachvěje (nic do batohu); s batohem od stromu ho první dupnutí utrhne,
  // další na slunci kápne
  lesRampouch: [['cekaScena', 'les'], ['cekaVolno'], ['klik', 830, 690], ['ceka', 1200]],
  lesRampouchBatoh: [['cekaScena', 'les'], ['cekaVolno'], ...STROM, ['klik', 830, 690], ['cekaVolno'], ['ceka', 300]],
  lesSlunce: [['cekaScena', 'les'], ['cekaVolno'], ...STROM, ...VETEV, ['klik', 830, 690], ['cekaVolno'], ['klik', 900, 690], ['ceka', 1250]],
  // bez rampouchu po kmeni nepřejde (bublina s rampouchem)
  lesBezRampouchu: [['cekaScena', 'les'], ['cekaVolno'], ...VETEV, KRK, ['cekaVolno'], ['klik', 1500, 600], ['ceka', 1500]],
  lesBeran: [...LES_BERAN, ['ceka', 4000]],
  lesBokem: [...LES_BERAN, ['ceka', 5500]],
  lesTrk: [...LES_BERAN, ['ceka', 6800]],
  lesVrze: [...LES_BERAN, ['ceka', 10500]],
  lesPad: [...LES_BERAN, ['ceka', 13050]],
  lesLavka: [...LES_BERAN, ['ceka', 13800]],
  lesOdchod: [...LES_BERAN, ['ceka', 30000]],
  // ovce, která se ptá po beranovi (poslední), a tetřívek na sloupu (klik = zatoká)
  beranOvce: [['ceka', 2500], ['klikOvce', 5], ['ceka', 800]],
  tetrivek: [['ceka', 2500], ['klik', 539, 592], ['ceka', 700]],
  // chůze kamkoli: po dolní louce rovnou, na horní louku přes cestu lesem (les přeskočený)
  chuze: [['bezLesa'], ['ceka', 2500], ['klik', 250, 800], ['ceka', 5000], ['klik', 1100, 370], ['ceka', 26000]],
  chuze1: [['bezLesa'], ['ceka', 2500], ['klik', 250, 800], ['ceka', 5000]],
  lesKonec: [['cekaScena', 'les'], ...LES, ['ceka', 1500]],
  skocka: [['ceka', 800], ['klik', 1450, 480], ['ceka', 300], ['klik', 1450, 480], ['ceka', 300], ['klik', 1450, 480], ['ceka', 1500], ['klik', 1360, 830], ['ceka', 600]],
  // kuchyně: kouř (kašel) → bez pohrabáče na okno nedosáhne → s pohrabáčem okno otevře, kouř vytáhne
  kantorska: [['ceka', 2600]],
  kuchKasel: [['cekaVolno'], ['klik', 1250, 750], ['ceka', 300]],
  kuchOknoBez: [['cekaVolno'], ['klik', 1515, 520], ['cekaVolno'], ['ceka', 300]],
  kuchPohrabac: [['cekaVolno'], ['klik', 772, 760], ['cekaVolno'], ['klik', 1515, 520], ['ceka', 1900]],
  kuchHak: [['cekaVolno'], ['klik', 772, 760], ['cekaVolno'], ['klik', 1515, 520], ['ceka', 2900]],
  kuchVzduch: [...OKNO, ['ceka', 300]],
  // pak děda (nápověda z kouře), roští od dveří babce → oheň → kocour shodí hrnek → semínka z koše
  kuchDeda: [...OKNO, ['klik', 1250, 750], ['ceka', 2600]],
  kuchBabka: [...OKNO, ['klik', 300, 750], ['cekaVolno'], ['ceka', 300]],
  kuchPolice: [...OKNO, ['klik', 560, 290], ['ceka', 900]],
  kuchNesu: [...OKNO, ['klik', 1735, 900], ['ceka', 4500]],
  kuchPrilozi: [...OKNO, ['klik', 1735, 900], ['ceka', 7050]],
  kuchOhen: [...OKNO, ['klik', 1735, 900], ['ceka', 9000]],
  kuchKocour: [...OKNO, ['klik', 1735, 900], ['ceka', 15000]],
  kuchPolicka: [...OKNO, ['klik', 1735, 900], ['ceka', 19500]],
  kuchHrnek: [...OKNO, ['klik', 1735, 900], ['ceka', 23200]],
  kuchHlava: [...OKNO, ['klik', 1735, 900], ['ceka', 29300]],
  kuchKos: [...OKNO, ['klik', 1735, 900], ['cekaVolno'], ['ceka', 500]],
  kuchFajfka: [...OKNO, ['klik', 1735, 900], ['cekaVolno'], ['klik', 1010, 995], ['cekaVolno'], ['ceka', 300]],
  kuchHotovo: [...KUCHYNE, ['cekaScena', 'louka'], ['ceka', 300]],
  // zpět: rovnou prolnutí na louku, žádná chůze přes celou kuchyni
  kuchZpet: [['cekaScena', 'kantorska'], ['cekaVolno'], ['klik', 90, 990], ['ceka', 900]],
  // studánka u božích muk: větvičky → žába; kořen panáčka vyleká; žába se postaví, pak cvrkne;
  // had z kořene ji vyžene → pramen se vyčistí → hrnek z kuchyně pod žlábek
  kriz: [['cekaVolno'], ['ceka', 300]],
  krizOci: [...MUKA_VETVE.slice(0, 3), ['ceka', 300]],
  krizZaba: [...MUKA_VETVE, ['ceka', 300]],
  krizVelka: [...MUKA_VETVE, ['klik', 1060, 752], ['ceka', 800]],
  krizCvrk: [...MUKA_VETVE, ...MUKA_ZABA, ['klik', 1060, 752], ['ceka', 700]],
  krizVytazena: [...MUKA_VETVE, ['klikNastroj', 'fajfka'], ['ceka', 300]], // fajfka v ruce u kurzoru
  krizDym: [...MUKA_VETVE, ...MUKA_DYM, ['ceka', 2600]],
  krizSmrad: [...MUKA_VETVE, ...MUKA_DYM, ['ceka', 3100]],
  krizUtek: [...MUKA_VETVE, ...MUKA_DYM, ['ceka', 5000]],
  // holou rukou: žába pořád jen cvrká, od 2. cvrknutí bublina s fajfkou
  krizRukou: [...MUKA_VETVE, ...MUKA_ZABA, ...MUKA_ZABA, ['klik', 1060, 752], ['ceka', 3300]],
  krizCista: [...MUKA_FAJFKA, ['ceka', 300]],
  krizSucho: [['cekaVolno'], ...MUKA_HRNEK, ['ceka', 1300]],
  // klik na žlábek bez hrnku v ruce: dlaně pod tekoucím žlábkem, voda proteče mezi prsty
  krizDlane: [...MUKA_VETVE, ...MUKA_DYM, ['cekaVolno'], ['klik', 1677, 815], ['ceka', 2600]],
  krizNalevani: [...MUKA_FAJFKA, ...MUKA_HRNEK, ['ceka', 2600]],
  krizHotovo: [...MUKA_CELA, ['cekaScena', 'louka'], ['ceka', 300]],
  jelinek: [['ceka', 800], ['klik', 800, 800], ['ceka', 1600], ['klik', 1150, 800], ['ceka', 1600], ['klik', 1500, 800], ['ceka', 1600]],
  klinovka: [['ceka', 800], ['klik', 690, 810], ['ceka', 800], ['klik', 690, 810], ['ceka', 800], ['klik', 1000, 800], ['ceka', 1500]],
  // semínka, voda, rampouch na hrudku → květina vyroste a práší
  vrchol: [['ceka', 800], ['klik', 1290, 580], ['cekaVolno'], ['klik', 1290, 580], ['cekaVolno'], ['klik', 1290, 580], ['ceka', 6500]],
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
  ['klikChalupa', 'kantorska'], ['cekaScena', 'les'], ...LES, ['cekaScena', 'kantorska'], ['ceka', 700],
  ...KUCHYNE, ['cekaScena', 'louka'], ['ceka', 1500],
  ...navstiv('kriz', MUKA_CELA),
  ['klikVrchol'], ['cekaScena', 'vrchol'], ['ceka', 700],
  ['klik', 1290, 580], ['cekaVolno'], ['klik', 1290, 580], ['cekaVolno'], ['klik', 1290, 580],
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
      if (s[0] === 'klikNastroj') p = K.toolPos(K.TOOLS.indexOf(s[1])); // vytáhne nástroj z batůžku
      if (s[0] === 'klikVlek') { const V = K.L.vlek; p = { x: V.sloup.x, y: (V.sloup.y + V.pata.y) / 2 }; }
      K.mouse = p;
      K.click(p);
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

