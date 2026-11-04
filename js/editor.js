// Editor rozložení nad fotkou. E = zapnout/vypnout. Změny se průběžně ukládají v prohlížeči,
// C je stáhne jako js/rozlozeni.js (a zkopíruje do schránky) — tím soubor v projektu nahradíš.
const HELP = [
  'EDITOR  (E zavřít)',
  'táhni body myší',
  'kolečko nad chalupou = velikost',
  'Shift+klik na bod cesty = les (skrytý) ano/ne',
  'N = nový bod cesty u myši,  Del = smazat bod pod myší',
  'S = zimní snímek; šipky = posun zimních snímků',
  'M = podklad z mapy (OSM): cesty, potoky, vlek, chalupy',
  'vlek, chumel a bílou hranu svahu lad na zimním snímku (S)',
  'C = stáhnout rozlozeni.js,  R = zahodit změny',
];
const WINTER_FRAME = '2026-01-05_0900';

const ed = K.editor = {
  active: K.params.has('editor'),
  winter: false,
  map: K.params.has('mapa'),
  drag: null,
  hoverH: null,
  msg: '',
  msgUntil: 0,

  handles() {
    const L = K.L, m = this.winter ? 1 : 0;
    const sx = L.snih.x * m, sy = L.snih.y * m;
    const hs = [];
    L.chalupy.forEach((c) => hs.push({ obj: c, kind: 'chalupa', label: c.id || '·', dx: sx, dy: sy }));
    L.chalupy.forEach((c) => c.komin && hs.push({ obj: c.komin, kind: 'bod', label: 'komín', dx: sx, dy: sy }));
    L.cesta.forEach((c, i) => hs.push({ obj: c, kind: 'cesta', label: String(i), i }));
    hs.push({ obj: L.vrchol, kind: 'bod', label: 'vrchol' });
    // vlek, chumel a hrana jsou jen v zimě → souřadnice rovnou zimního snímku, bez posunu
    hs.push({ obj: L.vlek.dole, kind: 'bod', label: 'vlek: dráty za hranou' });
    hs.push({ obj: L.vlek.sloup, kind: 'bod', label: 'vlek: vršek sloupu' });
    hs.push({ obj: L.vlek.nahore, kind: 'bod', label: 'vlek: dráty z obrazu' });
    hs.push({ obj: L.vlek.pata, kind: 'bod', label: 'pata sloupu' });
    hs.push({ obj: L.vlek.start, kind: 'bod', label: 'začátek sjezdu' });
    hs.push({ obj: L.vlek.sjezd, kind: 'bod', label: 'konec sjezdu' });
    hs.push({ obj: L.chumel, kind: 'bod', label: 'chumel' });
    L.louka.forEach((c) => hs.push({ obj: c, kind: 'louka', label: '' }));
    L.obzor.forEach((c) => hs.push({ obj: c, kind: 'obzor', label: '' }));
    L.hrana.forEach((c) => hs.push({ obj: c, kind: 'hrana', label: '' }));
    return hs.map((h) => ({ ...h, x: h.obj.x + (h.dx || 0), y: h.obj.y + (h.dy || 0) }));
  },

  at(p) {
    let best = null, bd = 16;
    for (const h of this.handles()) {
      const d = K.dist(h, p);
      if (d < bd) { bd = d; best = h; }
    }
    return best;
  },

  save() {
    try { localStorage.setItem(K.LS_KEY, JSON.stringify(K.L)); } catch (e) { /* bez úložiště jen v paměti */ }
  },

  say(msg) { this.msg = msg; this.msgUntil = K.time + 3; },

  down(p, e) {
    const h = this.at(p);
    if (!h) return;
    if (e.shiftKey && h.kind === 'cesta') {
      if (h.obj.skryto) delete h.obj.skryto; else h.obj.skryto = true;
      return this.save();
    }
    this.drag = { h, ox: p.x - h.x, oy: p.y - h.y };
  },
  move(p) {
    this.hoverH = this.at(p);
    K.canvas.style.cursor = this.drag ? 'grabbing' : this.hoverH ? 'grab' : 'crosshair';
    if (!this.drag) return;
    const { h, ox, oy } = this.drag;
    h.obj.x = Math.round(p.x - ox - (h.dx || 0));
    h.obj.y = Math.round(p.y - oy - (h.dy || 0));
  },
  up() {
    if (this.drag) { this.drag = null; this.save(); }
  },

  key(e) {
    const L = K.L;
    if (e.key === 's' || e.key === 'S') this.winter = !this.winter;
    else if (e.key === 'm' || e.key === 'M') this.map = !this.map;
    else if (e.key.startsWith('Arrow') && this.winter) {
      const d = e.shiftKey ? 5 : 1;
      if (e.key === 'ArrowLeft') L.snih.x -= d;
      if (e.key === 'ArrowRight') L.snih.x += d;
      if (e.key === 'ArrowUp') L.snih.y -= d;
      if (e.key === 'ArrowDown') L.snih.y += d;
      this.save();
      e.preventDefault();
    } else if ((e.key === 'n' || e.key === 'N') && K.mouse) {
      const n = K.nearestPathIndex(K.mouse).index;
      L.cesta.splice(n + 1, 0, { x: Math.round(K.mouse.x), y: Math.round(K.mouse.y) });
      this.save();
    } else if (e.key === 'Delete' && this.hoverH && this.hoverH.kind === 'cesta' && L.cesta.length > 2) {
      L.cesta.splice(this.hoverH.i, 1);
      this.hoverH = null;
      this.save();
    } else if (e.key === 'c' || e.key === 'C') this.exportFile();
    else if (e.key === 'r' || e.key === 'R') {
      if (!confirm('Zahodit změny z editoru a vrátit rozložení ze souboru?')) return;
      try { localStorage.removeItem(K.LS_KEY); } catch (err) { /* nic */ }
      K.L = JSON.parse(JSON.stringify(window.ROZLOZENI));
      this.say('vráceno na rozlozeni.js');
    }
  },

  wheel(e) {
    const h = this.hoverH;
    if (!h || h.kind !== 'chalupa') return;
    h.obj.w = Math.max(6, Math.round(h.obj.w * (e.deltaY < 0 ? 1.1 : 0.9)));
    this.save();
    e.preventDefault();
  },

  exportFile() {
    const L = { ...K.L, verze: K.L.verze + 1 };
    const text = [
      '// Rozložení scény nad fotkou (souřadnice v pixelech snímku 1920×1080).',
      '// Ladí se v editoru (klávesa E) a exportuje klávesou C — export tenhle soubor celý nahradí.',
      '// Při ruční změně zvyš "verze", jinak prohlížeč dál používá rozpracovaný stav z editoru.',
      'window.ROZLOZENI = ' + JSON.stringify(L, null, 2) + ';',
      '',
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
    a.download = 'rozlozeni.js';
    a.click();
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    // nová verze v souboru = rozpracovaný stav se po nahrazení souboru zahodí sám
    K.L.verze = L.verze;
    this.save();
    this.say('staženo rozlozeni.js (verze ' + L.verze + ') — nahraď jím js/rozlozeni.js');
  },

  // OpenStreetMap promítnutá do snímku (js/teren.js); co zakrývá terén, je jen tečkovaně
  drawMap(ctx) {
    const T = window.TEREN, m = this.winter ? 1 : 0;
    ctx.save();
    ctx.translate(K.L.snih.x * m, K.L.snih.y * m);
    const col = { cesta: '#ff9a1a', stezka: '#ff4a4a', potok: '#4aa8ff', vlek: '#ff3dff' };
    for (const c of T.cary) {
      for (let i = 1; i < c.body.length; i++) {
        const [ax, ay, av] = c.body[i - 1], [bx, by, bv] = c.body[i];
        ctx.strokeStyle = col[c.druh];
        ctx.lineWidth = av && bv ? 3 : 1;
        ctx.setLineDash(av && bv ? [] : [3, 5]);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    ctx.font = '600 13px system-ui, sans-serif';
    for (const h of T.stavby) {
      ctx.fillStyle = '#fff200';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(h.x, h.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      const t = `${h.jmeno || 'dům'} ${h.m} m`;
      ctx.fillStyle = '#000';
      ctx.fillText(t, h.x + 7, h.y + 17);
      ctx.fillStyle = '#fff200';
      ctx.fillText(t, h.x + 6, h.y + 16);
    }
    ctx.restore();
  },

  draw(ctx) {
    const L = K.L;
    if (this.winter) K.drawFrame(ctx, WINTER_FRAME);
    ctx.save();
    if (this.map) this.drawMap(ctx);
    ctx.lineWidth = 2;
    // cesta
    ctx.strokeStyle = 'rgba(255, 230, 0, 0.9)';
    ctx.beginPath();
    L.cesta.forEach((c, i) => (i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y)));
    ctx.stroke();
    // louka (kde se pasou ovce)
    ctx.strokeStyle = 'rgba(120, 255, 120, 0.9)';
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    L.louka.forEach((c, i) => (i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y)));
    ctx.closePath();
    ctx.stroke();
    // obzor (nad ním svítí hvězdy)
    ctx.strokeStyle = 'rgba(140, 200, 255, 0.9)';
    ctx.beginPath();
    L.obzor.forEach((c, i) => (i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y)));
    ctx.stroke();
    // hrana svahu (za ní jedou ovce na vleku)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    L.hrana.forEach((c, i) => (i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y)));
    ctx.stroke();
    // vlek: lano a sjezd
    const V = L.vlek;
    ctx.strokeStyle = 'rgba(255, 120, 200, 0.9)';
    ctx.beginPath();
    ctx.moveTo(V.dole.x, V.dole.y);
    ctx.lineTo(V.sloup.x, V.sloup.y);
    ctx.lineTo(V.nahore.x, V.nahore.y);
    ctx.moveTo(V.start.x, V.start.y);
    ctx.lineTo(V.sjezd.x, V.sjezd.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '600 14px system-ui, sans-serif';
    for (const h of this.handles()) {
      const col = { chalupa: '#ff8a3d', cesta: h.obj.skryto ? '#888' : '#ffe600', bod: '#ff78c8', louka: '#78ff78', obzor: '#8cc8ff', hrana: '#ffffff' }[h.kind];
      ctx.fillStyle = col;
      ctx.strokeStyle = '#000';
      ctx.beginPath();
      if (h.kind === 'chalupa') {
        ctx.rect(h.x - h.obj.w / 2, h.y - h.obj.w / 2, h.obj.w, h.obj.w);
        ctx.globalAlpha = 0.35;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
        ctx.beginPath();
      }
      ctx.arc(h.x, h.y, h === this.hoverH ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (h.label) {
        ctx.fillStyle = '#000';
        ctx.fillText(h.label, h.x + 9, h.y - 7);
        ctx.fillStyle = '#fff';
        ctx.fillText(h.label, h.x + 8, h.y - 8);
      }
    }
    // nápověda
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(K.W - 470, K.H - 30 - HELP.length * 22, 460, HELP.length * 22 + 20);
    ctx.fillStyle = '#fff';
    HELP.forEach((t, i) => ctx.fillText(t, K.W - 458, K.H - 22 - (HELP.length - 1 - i) * 22));
    if (this.winter) ctx.fillText(`zimní posun: x ${L.snih.x}, y ${L.snih.y}`, K.W - 458, K.H - 40 - HELP.length * 22);
    if (this.msgUntil > K.time) {
      ctx.font = '600 22px system-ui, sans-serif';
      ctx.fillText(this.msg, 480, 40);
    }
    ctx.restore();
  },
};

addEventListener('keydown', (e) => {
  if (e.key === 'e' || e.key === 'E') {
    ed.active = !ed.active;
    ed.drag = null;
    K.canvas.style.cursor = 'default';
    return;
  }
  if (ed.active) ed.key(e);
});
K.canvas.addEventListener('wheel', (e) => { if (ed.active) ed.wheel(e); }, { passive: false });
