// Směšovač (Daniel 2026-11-22: „abych mohl zvuky vyladit ručně“). Klávesa M (nebo ?mix v adrese) otevře
// panel vpravo: hudba, ztlumení hudby pod zvuky, stádo, kroky, bečení a hlasitost každého souboru zvlášť.
// Hraje se dál normálně, takže jde ladit přímo při hraní; „Naposledy zaznělo“ ukáže, co právě hrálo.
// Nastavení se ukládá v prohlížeči (localStorage) a platí jen tam. Tlačítko „Kopírovat nastavení“ dá
// JSON do schránky: ten pošle Daniel, hodnoty se zapíšou do js/jadro.js natrvalo a uložené se pak smaže.
(() => {
  const KEY = 'klasterka-mix';
  // [vlastnost K, popis, max]
  const GLOBALS = [
    ['MUSIC_VOLUME', 'Hudba', 1],
    ['DUCK', 'Hudba pod zvukem (podíl, 0.35 = 35 %)', 1],
    ['DUCK_FROM', 'Ztlumit hudbu od hlasitosti zvuku', 1],
    ['FLOCK_VOLUME', 'Stádo (smyčka)', 1],
    ['STEP_VOLUME', 'Kroky', 1],
    ['BLEAT_VOLUME', 'Bečení ovcí', 1],
    ['LIFT_VOLUME', 'Vlek (smyčka ve finále)', 1],
  ];
  const LOOPS = ['stado', 'vlek']; // řídí je posuvníky nahoře, ne seznam souborů
  const MUSIC = /^hudba/; // skladby: posuvník hlasitosti, bez ▶ (hrají samy podle scény)
  const QUIET = /^(krok|led)-/; // kroky hrají pořád, do „naposledy“ se nepíšou
  const GAIN_MAX = 3;
  const defaults = {
    globals: Object.fromEntries(GLOBALS.map(([k]) => [k, K[k]])),
    gain: { ...K.SOUND_GAIN },
  };

  // uložené nastavení z prohlížeče
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } };
  const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* bez úložiště */ } };
  const saved = read();
  if (saved) {
    for (const [k] of GLOBALS) if (typeof saved.globals?.[k] === 'number') K[k] = saved.globals[k];
    Object.assign(K.SOUND_GAIN, saved.gain || {});
  }
  const state = () => ({
    globals: Object.fromEntries(GLOBALS.map(([k]) => [k, K[k]])),
    gain: Object.fromEntries(Object.entries(K.SOUND_GAIN).filter(([n, g]) => g !== (defaults.gain[n] ?? 1))),
  });
  const save = () => write(state());

  let panel = null;
  let recent = []; // naposledy zahrané soubory (nejnovější první)
  const rows = {}; // jméno → { row, flash }
  K.onSoundPlay = (name) => {
    if (!panel || panel.hidden) return;
    const r = rows[name];
    if (r) r.flash();
    if (QUIET.test(name) || LOOPS.includes(name) || MUSIC.test(name)) return;
    recent = [name, ...recent.filter((n) => n !== name)].slice(0, 6);
    renderRecent();
  };

  const css = `
#mix{position:fixed;top:8px;right:8px;width:400px;max-height:calc(100vh - 16px);overflow:auto;z-index:10;
 background:rgba(20,17,13,.94);color:#f3e6c8;font:14px/1.35 Georgia,serif;border:1px solid #3a3226;border-radius:8px;
 padding:10px 12px;box-sizing:border-box}
#mix h2{font-size:17px;margin:4px 0 8px;font-weight:600;display:flex;justify-content:space-between;align-items:center}
#mix h3{font-size:14px;margin:14px 0 4px;color:#b9aa8a;font-weight:normal;border-bottom:1px solid #3a3226}
#mix .r{display:grid;grid-template-columns:1fr 132px 42px 28px;gap:6px;align-items:center;padding:2px 4px;border-radius:4px}
#mix .r.g{grid-template-columns:1fr 132px 42px}
#mix .r.on{background:#5a4423}
#mix input[type=range]{width:132px;accent-color:#f0c27a}
#mix .v{text-align:right;font-variant-numeric:tabular-nums}
#mix .ch{color:#f0c27a}
#mix button{background:#3a3226;color:#f3e6c8;border:1px solid #5a4d3a;border-radius:4px;cursor:pointer;font:inherit;padding:2px 8px}
#mix button:hover{background:#4a4030}
#mix .p{padding:0 4px}
#mix input[type=search]{width:100%;box-sizing:border-box;margin:4px 0;background:#14110d;color:#f3e6c8;border:1px solid #3a3226;padding:4px}
#mix .bar{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
#mix textarea{width:100%;height:90px;margin-top:6px;background:#14110d;color:#f3e6c8;border:1px solid #3a3226;font:12px monospace}
#mix small{color:#b9aa8a}`;

  const el = (tag, props = {}, ...kids) => {
    const e = Object.assign(document.createElement(tag), props);
    for (const k of kids) e.append(k);
    return e;
  };
  const fmt = (v) => v.toFixed(2);

  // řádek s posuvníkem; get/set čtou a zapisují hodnotu, def = výchozí (zvýrazní se změna)
  const slider = (label, max, get, set, def, play) => {
    const v = el('span', { className: 'v' });
    const name = el('span', { textContent: label });
    const input = el('input', { type: 'range', min: 0, max, step: 0.01 });
    const sync = () => {
      input.value = get();
      v.textContent = fmt(get());
      name.className = Math.abs(get() - def) > 0.001 ? 'ch' : '';
    };
    input.oninput = () => { set(+input.value); sync(); save(); };
    input.ondblclick = () => { set(def); sync(); save(); }; // dvojklik = výchozí
    const row = el('div', { className: play ? 'r' : 'r g' }, name, input, v);
    if (play) row.append(el('button', { className: 'p', textContent: '▶', title: 'přehrát (na 100 %)', onclick: play }));
    sync();
    return { row, sync };
  };

  const soundRow = (n) => {
    const s = slider(n, GAIN_MAX, () => K.SOUND_GAIN[n] ?? 1, (g) => { K.SOUND_GAIN[n] = g; }, defaults.gain[n] ?? 1,
      MUSIC.test(n) ? null : () => K.sound(n));
    let t = 0;
    const flash = () => {
      s.row.classList.add('on');
      clearTimeout(t);
      t = setTimeout(() => s.row.classList.remove('on'), 700);
    };
    return { ...s, flash };
  };

  let recentBox, listBox, globalsRows = [];
  const renderRecent = () => {
    recentBox.replaceChildren(...(recent.length
      ? recent.map((n) => soundRow(n).row)
      : [el('small', { textContent: 'Zatím nic. Hraj a tady se objeví, co právě zaznělo.' })]));
  };

  // seznam souborů: výpis složky z lokálního serveru, jinak to, co hra zatím načetla
  const loadNames = async () => {
    let names = [];
    try {
      const html = await (await fetch('assets/zvuky/')).text();
      names = [...html.matchAll(/href="([^"/]+)\.mp3"/g)].map((m) => decodeURIComponent(m[1]));
    } catch { /* bez výpisu */ }
    if (!names.length) names = K.soundNames();
    return [...new Set(names)].filter((n) => !LOOPS.includes(n)).sort((a, b) => a.localeCompare(b, 'cs'));
  };

  const build = async () => {
    const style = el('style', { textContent: css });
    document.head.append(style);
    panel = el('div', { id: 'mix' });
    // klávesy v panelu nesmí spouštět klávesy hry (šipky na posuvníku by posouvaly prvky v editoru, E editor,
    // F celá obrazovka); projde jen M, ať jde panel zavřít a znovu otevřít, i když v něm zůstal fokus
    // (posuvník, tlačítko). Při psaní do hledání nepropadne ani M.
    panel.addEventListener('keydown', (e) => {
      const typing = e.target.matches('input[type=search], textarea');
      if (typing || (e.key !== 'm' && e.key !== 'M')) e.stopPropagation();
    });
    const close = el('button', {
      textContent: '×', title: 'zavřít (M)',
      onclick: () => { panel.hidden = true; document.activeElement?.blur(); },
    });
    panel.append(el('h2', {}, el('span', { textContent: 'Směšovač' }), close));
    panel.append(el('small', { textContent: 'Dvojklik na posuvník = výchozí hodnota. Změněné jsou žlutě. Ukládá se v tomto prohlížeči.' }));

    panel.append(el('h3', { textContent: 'Celkově' }));
    globalsRows = GLOBALS.map(([k, label, max]) => slider(label, max, () => K[k], (v) => { K[k] = v; }, defaults.globals[k]));
    for (const g of globalsRows) panel.append(g.row);

    panel.append(el('h3', { textContent: 'Naposledy zaznělo' }));
    recentBox = el('div');
    panel.append(recentBox);
    renderRecent();

    panel.append(el('h3', { textContent: 'Všechny zvuky (násobek hlasitosti)' }));
    const filter = el('input', { type: 'search', placeholder: 'hledat…' });
    listBox = el('div');
    panel.append(filter, listBox);
    const names = await loadNames();
    for (const n of names) {
      const r = soundRow(n);
      rows[n] = r;
      r.row.dataset.name = n;
      listBox.append(r.row);
    }
    filter.oninput = () => {
      const q = filter.value.trim().toLowerCase();
      for (const r of listBox.children) r.hidden = q && !r.dataset.name.includes(q);
    };

    const out = el('textarea', { readOnly: true, hidden: true });
    const copy = el('button', {
      textContent: 'Kopírovat nastavení',
      onclick: async () => {
        out.value = JSON.stringify(state(), null, 1);
        out.hidden = false;
        out.select();
        try { await navigator.clipboard.writeText(out.value); copy.textContent = 'Zkopírováno ✓'; } catch { copy.textContent = 'Zkopíruj z pole níže'; }
        setTimeout(() => { copy.textContent = 'Kopírovat nastavení'; }, 2000);
      },
    });
    const reset = el('button', {
      textContent: 'Vše výchozí',
      onclick: () => {
        for (const [k] of GLOBALS) K[k] = defaults.globals[k];
        for (const n of Object.keys(K.SOUND_GAIN)) delete K.SOUND_GAIN[n];
        Object.assign(K.SOUND_GAIN, defaults.gain);
        try { localStorage.removeItem(KEY); } catch { /* bez úložiště */ }
        for (const g of globalsRows) g.sync();
        for (const r of Object.values(rows)) r.sync();
        renderRecent();
      },
    });
    panel.append(el('div', { className: 'bar' }, copy, reset), out);
    document.body.append(panel);
  };

  const toggle = () => {
    if (!panel) return build();
    panel.hidden = !panel.hidden;
  };
  addEventListener('keydown', (e) => { if (e.key === 'm' || e.key === 'M') toggle(); });
  if (K.params.has('mix')) addEventListener('load', toggle);
})();
