/* quiet-draw: a chart kit for claude.ai widgets. One call draws one or more cards:
   QD.draw('id', spec | [spec, ...]). Each spec: {type, title, sub, foot, h, ...data}. */
(function (g) {
  'use strict';
  var C = { paper: '#F7F4EE', inner: '#FBF9F4', edge: '#D9D2C4', ink: '#1F1E1B', m1: '#6B675E', m2: '#8F8A80', grid: '#E7E1D5',
    clay: '#D97757', olive: '#7C8F5A', sky: '#5B8EC4', sun: '#E3B04B', plum: '#8E7CC3', grey: '#8F8A80', gold: '#A8802A' };
  var PAL = [C.clay, C.plum, C.grey, C.sky, C.sun, C.olive];
  var SANS = '-apple-system,BlinkMacSystemFont,"PingFang SC","Segoe UI",sans-serif', SERIF = 'Fraunces,Georgia,serif';
  var LWC_URL = 'https://cdn.jsdelivr.net/npm/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js';
  var NS = 'http://www.w3.org/2000/svg';
  var styled = false, lwcP = null;

  function style() {
    if (styled) return; styled = true;
    var l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&display=swap'; document.head.appendChild(l);
    var s = document.createElement('style');
    s.textContent = [
      '.qd{font-family:' + SANS + ';color:' + C.ink + ';display:flex;flex-direction:column;gap:14px}',
      '.qd-card{background:' + C.paper + ';border:1px solid ' + C.edge + ';border-radius:12px;padding:14px 12px 10px}',
      '.qd-card h3{font-family:' + SERIF + ';font-weight:500;font-size:19px;line-height:1.25;margin:0 0 2px;color:' + C.ink + '}',
      '.qd-sub{font-size:12px;color:' + C.m1 + ';margin:0 0 8px}',
      '.qd-ft{font-size:11px;color:' + C.m2 + ';margin:6px 2px 0}',
      '.qd svg{display:block;width:100%;height:auto}',
      '.qd-key{display:flex;flex-wrap:wrap;gap:12px;font-size:12px;color:' + C.m1 + ';margin:6px 2px 0}',
      '.qd-key i{display:inline-block;width:12px;height:3px;border-radius:2px;vertical-align:middle;margin-right:5px}',
      '.qd-tabs{display:flex;gap:6px;margin:2px 0 8px;flex-wrap:wrap}',
      '.qd-tabs button{font:inherit;font-size:12.5px;padding:5px 10px;border-radius:8px;border:1px solid ' + C.edge + ';background:' + C.inner + ';color:' + C.m1 + ';cursor:pointer}',
      '.qd-tabs button.on{background:' + C.ink + ';color:' + C.paper + ';border-color:' + C.ink + '}',
      '.qd-sl{display:flex;align-items:center;gap:10px;font-size:12px;color:' + C.m1 + ';margin:4px 2px 2px}',
      '.qd-sl input{flex:1;accent-color:' + C.sky + '}',
      '.qd-ro{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px}',
      '.qd-ro div{background:' + C.inner + ';border:1px solid ' + C.grid + ';border-radius:8px;padding:6px 8px}',
      '.qd-ro b{display:block;font-family:' + SERIF + ';font-weight:500;font-size:19px}',
      '.qd-ro span{font-size:10.5px;color:' + C.m2 + '}',
      '.qd-cal .dy{display:grid;grid-template-columns:54px 1fr;gap:10px;padding:9px 0;border-top:1px solid ' + C.grid + '}',
      '.qd-cal .dy:first-child{border-top:none}',
      '.qd-cal .dy.hot{background:#FBEFE3;border-radius:8px;margin:0 -6px;padding:9px 6px;border-top-color:transparent}',
      '.qd-cal .dd{font-family:' + SERIF + ';font-size:17px;line-height:1.1}',
      '.qd-cal .dd small{display:block;font-family:' + SANS + ';font-size:10.5px;color:' + C.m2 + '}',
      '.qd-cal .ev{font-size:13px;line-height:1.45}',
      '.qd-m{color:' + C.m2 + '}.qd-me{color:' + C.sky + ';font-weight:600}',
      '.qd-nums{display:flex;flex-wrap:wrap;gap:22px;margin:8px 2px 4px}',
      '.qd-nums div{display:flex;flex-direction:column}',
      '.qd-nums b{font-family:' + SERIF + ';font-weight:500;font-size:30px;line-height:1.1}',
      '.qd-nums span{font-size:12px;color:' + C.m1 + '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function lwc() {
    if (g.LightweightCharts) return Promise.resolve(g.LightweightCharts);
    if (!lwcP) lwcP = new Promise(function (res, rej) {
      var e = document.createElement('script'); e.src = LWC_URL;
      e.onload = function () { res(g.LightweightCharts); }; e.onerror = rej; document.head.appendChild(e);
    });
    return lwcP;
  }

  /* ---------- small helpers ---------- */
  function el(tag, cls, text, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  function rich(parent, s) { // **bold**, _muted_, [blue]
    String(s).split(/(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\])/).forEach(function (p) {
      if (!p) return;
      if (/^\*\*.*\*\*$/.test(p)) el('b', null, p.slice(2, -2), parent);
      else if (/^_.*_$/.test(p)) el('span', 'qd-m', p.slice(1, -1), parent);
      else if (/^\[.*\]$/.test(p)) el('span', 'qd-me', p.slice(1, -1), parent);
      else parent.appendChild(document.createTextNode(p));
    });
  }
  function svg(parent, w, h, label) { var s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 ' + w + ' ' + h); s.setAttribute('role', 'img'); if (label) s.setAttribute('aria-label', label); parent.appendChild(s); return s; }
  function E(p, tag, a) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; }
  function T(p, x, y, s, o) { o = o || {}; var e = E(p, 'text', { x: x, y: y, 'font-family': o.f || SANS, 'font-size': o.s || 11, fill: o.c || C.m1, 'text-anchor': o.a || 'start', 'font-weight': o.w || 400 }); e.textContent = s; return e; }
  function tw(s, size) { var n = 0; for (var i = 0; i < s.length; i++) n += s.charCodeAt(i) > 255 ? 1 : 0.56; return n * (size || 11); }
  function pct(v, d) { return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d == null ? 1 : d) + '%'; }
  function nice(lo, hi, n) { var span = hi - lo, step = Math.pow(10, Math.floor(Math.log10(span / n))), m = span / n / step; step *= m > 5 ? 10 : m > 2 ? 5 : m > 1 ? 2 : 1; var t = []; for (var v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) t.push(+v.toFixed(6)); return t; }
  function dateOf(d, year) { return d.length === 5 ? (year || new Date().getFullYear()) + '-' + d : d; }
  function etToChicago(s) { // 'YYYY-MM-DD HH:MM' Eastern -> unix seconds shown as Chicago clock
    var m = s.match(/(\d+)-(\d+)-(\d+)[ T](\d+):(\d+)/); return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 1, +m[5]) / 1000;
  }

  // label placer: avoids earlier labels and given dots
  function Placer(w, h) { this.b = []; this.w = w; this.h = h; }
  Placer.prototype.hit = function (r) {
    if (r.x0 < 0 || r.x1 > this.w || r.y0 < 0 || r.y1 > this.h) return true;
    for (var i = 0; i < this.b.length; i++) { var q = this.b[i]; if (r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0) return true; }
    return false;
  };
  Placer.prototype.add = function (r) { this.b.push(r); };
  Placer.prototype.dot = function (x, y, rad) { this.add({ x0: x - rad, x1: x + rad, y0: y - rad, y1: y + rad }); };
  Placer.prototype.place = function (x, y, text, size, cands) {
    var wdt = tw(text, size), best = null;
    cands = cands || [[8, 4, 'start'], [-8, 4, 'end'], [0, -9, 'middle'], [0, 17, 'middle'], [8, -7, 'start'], [-8, -7, 'end'], [8, 15, 'start'], [-8, 15, 'end']];
    for (var i = 0; i < cands.length; i++) {
      var c = cands[i], lx = x + c[0], ly = y + c[1], x0 = c[2] === 'start' ? lx : c[2] === 'end' ? lx - wdt : lx - wdt / 2;
      var r = { x0: x0, x1: x0 + wdt, y0: ly - size * 0.8, y1: ly + size * 0.2 };
      if (!this.hit(r)) { best = { x: lx, y: ly, a: c[2], r: r }; break; }
      if (!best) best = { x: lx, y: ly, a: c[2], r: r };
    }
    this.add(best.r); return best;
  };

  function card(root, s) {
    var c = el('div', 'qd-card', null, root);
    if (s.title) el('h3', null, s.title, c);
    if (s.sub) el('p', 'qd-sub', s.sub, c);
    var body = el('div', null, null, c);
    return { c: c, body: body, foot: function (t) { if (t) el('p', 'qd-ft', t, c); } };
  }
  function base(extra) {
    var b = { layout: { attributionLogo: false, background: { color: 'transparent' }, textColor: C.m1, fontSize: 11, fontFamily: SANS },
      grid: { vertLines: { visible: false }, horzLines: { color: C.grid } }, rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false }, crosshair: { mode: 0 }, handleScroll: false, handleScale: false, autoSize: true };
    for (var k in extra) b[k] = extra[k];
    return b;
  }
  var CREDIT = 'Charts by TradingView Lightweight Charts';

  /* ---------- chart types ---------- */
  var R = {};

  // Daily (or weekly) candles with volume, moving averages, levels and notes.
  // bars: [[date,o,h,l,c,volM]], date 'MM-DD' (with year) or 'YYYY-MM-DD'; ma: [20] ; lines: [{p, c}] ; marks: [{d, t, up, c}]
  R.candles = function (k, s, L) {
    var box = el('div', null, null, k.body); box.style.height = (s.h || 300) + 'px';
    var ch = L.createChart(box, base({ rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.06, bottom: 0.24 } }, timeScale: { borderVisible: false, rightOffset: s.right || 7 } }));
    var t = function (r) { return dateOf(r[0], s.year); };
    var cs = ch.addCandlestickSeries({ upColor: C.olive, downColor: C.clay, borderVisible: false, wickUpColor: C.olive, wickDownColor: C.clay, priceLineVisible: false });
    cs.setData(s.bars.map(function (r) { return { time: t(r), open: r[1], high: r[2], low: r[3], close: r[4] }; }));
    var lvl = (s.lines || []).map(function (l) { return l.p; });
    if (lvl.length) cs.applyOptions({ autoscaleInfoProvider: function (orig) { var r = orig(); if (r && r.priceRange) { lvl.forEach(function (p) { r.priceRange.minValue = Math.min(r.priceRange.minValue, p); r.priceRange.maxValue = Math.max(r.priceRange.maxValue, p); }); } return r; } });
    if (s.bars[0].length > 5) {
      var vs = ch.addHistogramSeries({ priceScaleId: 'v', priceFormat: { type: 'volume' }, lastValueVisible: false, priceLineVisible: false });
      ch.priceScale('v').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      vs.setData(s.bars.map(function (r) { return { time: t(r), value: r[5], color: r[4] >= r[1] ? 'rgba(124,143,90,.35)' : 'rgba(217,119,87,.35)' }; }));
    }
    (s.ma === undefined ? [20] : s.ma || []).forEach(function (n, j) {
      var m = []; for (var i = n - 1; i < s.bars.length; i++) { var x = 0; for (var q = i - n + 1; q <= i; q++) x += s.bars[q][4]; m.push({ time: t(s.bars[i]), value: +(x / n).toFixed(2) }); }
      ch.addLineSeries({ color: [C.sun, C.plum, C.sky][j % 3], lineWidth: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false }).setData(m);
    });
    (s.lines || []).forEach(function (l) { cs.createPriceLine({ price: l.p, color: l.c || C.sky, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '' }); });
    if (s.marks) cs.setMarkers(s.marks.map(function (m) { return { time: dateOf(m.d, s.year), position: m.up ? 'belowBar' : 'aboveBar', color: m.c || (m.up ? C.olive : C.ink), shape: m.up ? 'arrowUp' : 'arrowDown', text: m.t }; })
      .sort(function (a, b) { return a.time < b.time ? -1 : 1; }));
    ch.timeScale().fitContent();
    k.foot(s.foot ? s.foot + ' · ' + CREDIT : CREDIT);
  };

  // Several names over sessions, % against one reference price.
  // segs: [['2026-11-13 15:35', 54], ['2026-11-15 20:00', 7]] (ET start, bar count), step: 5 (min)
  // series: [{n, base, v:[...], c, w}] ; marks: [{s:'NVDA', i: 54, t:'Jensen news', up}] ; ref: 'Fri close' ; pct: true
  R.session = function (k, s, L) {
    var box = el('div', null, null, k.body); box.style.height = (s.h || 230) + 'px';
    var ch = L.createChart(box, base({ timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false, rightOffset: s.right || 10 } }));
    var step = (s.step || 5) * 60, times = [];
    s.segs.forEach(function (sg) { var t0 = etToChicago(sg[0]); for (var i = 0; i < sg[1]; i++) times.push(t0 + i * step); });
    var usePct = s.pct !== false, fmt = usePct ? { type: 'custom', formatter: function (p) { return pct(p); } } : undefined;
    var made = {}, key = el('div', 'qd-key', null, null);
    s.series.forEach(function (sr, j) {
      var col = sr.c || PAL[j % PAL.length];
      var ls = ch.addLineSeries({ color: col, lineWidth: sr.w || (j === 0 ? 3 : 2), priceLineVisible: false, lastValueVisible: true, priceFormat: fmt });
      ls.setData(sr.v.map(function (v, i) { return { time: times[i], value: usePct ? +((v / sr.base - 1) * 100).toFixed(2) : v }; }).filter(function (p) { return p.time != null && p.value != null && !isNaN(p.value); }));
      made[sr.n] = ls;
      var sp = el('span', null, null, key), ii = el('i', null, null, sp); ii.style.background = col; sp.appendChild(document.createTextNode(sr.n));
      if (j === 0 && s.ref) ls.createPriceLine({ price: usePct ? 0 : sr.base, color: C.m2, lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: s.ref });
    });
    var by = {}; (s.marks || []).forEach(function (m) { (by[m.s] = by[m.s] || []).push({ time: times[m.i], position: m.up ? 'belowBar' : 'aboveBar', color: m.c || C.sky, shape: m.dot ? 'circle' : m.up ? 'arrowUp' : 'arrowDown', text: m.t }); });
    for (var n in by) if (made[n]) made[n].setMarkers(by[n].sort(function (a, b) { return a.time - b.time; }));
    ch.timeScale().fitContent();
    k.body.appendChild(key);
    k.foot(s.foot ? s.foot + ' · ' + CREDIT : CREDIT);
  };

  // Rows of moves with an optional band. rows: [[label, v, v2]] ; band: 9.6 ; bandLabel ; notes: ['text', ...] ; dotLabel
  R.moves = function (k, s) {
    var rows = s.rows, H = rows.length * 22 + 26 + (s.notes ? s.notes.length * 16 + 10 : 0), sv = svg(k.body, 350, H, s.title);
    var mx = s.band || 0; rows.forEach(function (r) { mx = Math.max(mx, Math.abs(r[1]), r[2] != null ? Math.abs(r[2]) : 0); });
    var cx = 190, sc = 112 / mx, X = function (v) { return cx + v * sc; }, top = 22;
    if (s.band) {
      E(sv, 'rect', { x: X(-s.band), y: top - 6, width: X(s.band) - X(-s.band), height: rows.length * 22 + 4, fill: C.sun, opacity: 0.18 });
      T(sv, X(-s.band) + 3, top - 9, pct(-s.band), { s: 10, c: C.gold }); T(sv, X(s.band) - 3, top - 9, pct(s.band), { s: 10, c: C.gold, a: 'end' });
    }
    E(sv, 'line', { x1: cx, x2: cx, y1: top - 6, y2: top + rows.length * 22, stroke: C.m2 });
    rows.forEach(function (r, i) {
      var y = top + i * 22 + 8, c = r[1] >= 0 ? C.olive : C.clay;
      T(sv, 4, y + 4, r[0], { s: 11.5, c: C.ink });
      E(sv, 'rect', { x: Math.min(cx, X(r[1])), y: y - 5, width: Math.abs(X(r[1]) - cx), height: 10, rx: 2, fill: c });
      if (r[2] != null) E(sv, 'circle', { cx: X(r[2]), cy: y, r: 3, fill: C.ink });
      T(sv, 346, y + 4, pct(r[1]), { s: 11, c: c, a: 'end', w: 600 });
    });
    (s.notes || []).forEach(function (n, i) { T(sv, 4, top + rows.length * 22 + 20 + i * 16, n, { s: i ? 11 : 11.5, c: i ? C.m1 : C.ink, w: i ? 400 : 600 }); });
    k.foot(s.foot);
  };

  // Open interest by strike, puts left and calls right. rows: [[strike, callOI, putOI]] ; price ; priceLabel ; notes: [{k, side, t}] ; cap
  R.oi = function (k, s) {
    var rows = s.rows.slice().sort(function (a, b) { return b[0] - a[0]; }), h = 17, top = 30, H = top + rows.length * h + 8, sv = svg(k.body, 350, H, s.title);
    var all = []; rows.forEach(function (r) { all.push(r[1], r[2]); }); all.sort(function (a, b) { return a - b; });
    var cap = s.cap || Math.max(all[Math.floor(all.length * 0.92)] * 1.05, 1), W = 128, L = function (x) { return Math.min(x, cap) / cap * W; };
    T(sv, 150, 16, 'PUTS', { s: 11, c: C.clay, a: 'end', w: 700 }); T(sv, 200, 16, 'CALLS', { s: 11, c: C.olive, a: 'start', w: 700 });
    var lab = function (v) { return v >= 1000 ? Math.round(v / 1000) + 'k' : String(v); }, big = cap * 0.5;
    rows.forEach(function (r, i) {
      var y = top + i * h, whole = Math.abs(r[0] - Math.round(r[0] / 10) * 10) < 1e-9;
      T(sv, 175, y + 12, String(r[0]), { s: 11, c: C.ink, a: 'middle', w: whole ? 700 : 400 });
      var over = r[2] > cap;
      E(sv, 'rect', { x: 155 - L(r[2]), y: y + 3, width: L(r[2]), height: 11, rx: 2, fill: C.clay, opacity: over ? 0.35 : 0.85 });
      E(sv, 'rect', { x: 195, y: y + 3, width: L(r[1]), height: 11, rx: 2, fill: C.olive, opacity: r[1] > cap ? 0.35 : 0.85 });
      if (over) T(sv, 155 - W + 4, y + 12, lab(r[2]) + (s.overNote ? ' · ' + s.overNote : ''), { s: 10, c: C.ink });
      else if (r[2] >= big) T(sv, 155 - L(r[2]) - 4, y + 12, lab(r[2]), { s: 10, c: C.clay, a: 'end' });
      if (r[1] > cap) T(sv, 199, y + 12, lab(r[1]), { s: 10, c: C.ink });
      else if (r[1] >= big) T(sv, 195 + L(r[1]) + 4, y + 12, lab(r[1]), { s: 10, c: C.olive });
    });
    var yAt = function (v) { for (var i = 0; i < rows.length - 1; i++) if (v <= rows[i][0] && v >= rows[i + 1][0]) return top + i * h + 8 + (rows[i][0] - v) / (rows[i][0] - rows[i + 1][0]) * h; return null; };
    if (s.price != null) { var py = yAt(s.price); if (py != null) { E(sv, 'line', { x1: 8, x2: 342, y1: py, y2: py, stroke: C.sky, 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }); T(sv, 342, py - 4, s.priceLabel || String(s.price), { s: 10.5, c: C.sky, a: 'end', w: 600 }); } }
    (s.notes || []).forEach(function (n) {
      var r = rows.filter(function (x) { return x[0] === n.k; })[0]; if (!r) return; var y = yAt(n.k) || top;
      if (n.side === 'put') T(sv, 155 - L(r[2]) - 4 - (r[2] >= big ? 26 : 0), y + 4, n.t, { s: 10.5, c: C.sky, a: 'end', w: 600 });
      else T(sv, 195 + L(r[1]) + 6 + (r[1] >= big ? 26 : 0), y + 4, n.t, { s: 10.5, c: C.sky, w: 600 });
    });
    k.foot(s.foot);
  };

  // Scatter with optional diagonal. pts: [[name, x, y, bold]] ; diag: true ; xl, yl ; above, below (labels for the halves) ; lo, hi
  R.scatter = function (k, s) {
    var sv = svg(k.body, 350, s.H || 300, s.title), x0 = 40, x1 = 340, y0 = (s.H || 300) - 30, y1 = 12;
    var vals = []; s.pts.forEach(function (p) { vals.push(p[1], p[2]); });
    var lo = s.lo != null ? s.lo : Math.min.apply(null, vals), hi = s.hi != null ? s.hi : Math.max.apply(null, vals), pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    var ticks = nice(lo, hi, 4); lo = Math.min(lo, ticks[0]); hi = Math.max(hi, ticks[ticks.length - 1]);
    var X = function (v) { return x0 + (v - lo) / (hi - lo) * (x1 - x0); }, Y = function (v) { return y0 - (v - lo) / (hi - lo) * (y0 - y1); };
    ticks.forEach(function (v) { E(sv, 'line', { x1: x0, x2: x1, y1: Y(v), y2: Y(v), stroke: C.grid }); T(sv, x0 - 6, Y(v) + 4, String(v), { s: 10, a: 'end' }); T(sv, X(v), y0 + 16, String(v), { s: 10, a: 'middle' }); });
    var P = new Placer(350, s.H || 300);
    if (s.diag) {
      E(sv, 'polygon', { points: [X(lo), Y(lo), X(hi), Y(hi), X(lo), Y(hi)].join(' '), fill: C.sun, opacity: 0.12 });
      E(sv, 'line', { x1: X(lo), y1: Y(lo), x2: X(hi), y2: Y(hi), stroke: C.m2, 'stroke-dasharray': '4 3' });
      if (s.above) { T(sv, x0 + 8, y1 + 26, s.above, { s: 11, c: C.gold, w: 600 }); P.add({ x0: x0 + 8, x1: x0 + 8 + tw(s.above, 11), y0: y1 + 16, y1: y1 + 28 }); }
      if (s.below) { var bx = x1 - 8, by = y0 - 26; T(sv, bx, by, s.below, { s: 11, c: C.m2, a: 'end', w: 600 }); P.add({ x0: bx - tw(s.below, 11), x1: bx, y0: by - 10, y1: by + 2 }); }
    }
    if (s.xl) { T(sv, x1, y0 - 6, s.xl, { s: 10, a: 'end' }); P.add({ x0: x1 - tw(s.xl, 10), x1: x1, y0: y0 - 15, y1: y0 }); }
    if (s.yl) { T(sv, x0 + 4, y1 + 10, s.yl, { s: 10 }); P.add({ x0: x0, x1: x0 + 4 + tw(s.yl, 10), y0: y1, y1: y1 + 12 }); }
    s.pts.forEach(function (p) { P.dot(X(p[1]), Y(p[2]), p[3] ? 7 : 5.5); });
    s.pts.forEach(function (p) {
      var up = p[2] > p[1], c = s.diag ? (up ? C.clay : C.sky) : (p[4] || C.clay);
      E(sv, 'circle', { cx: X(p[1]), cy: Y(p[2]), r: p[3] ? 6 : 4.5, fill: c, stroke: '#fff', 'stroke-width': 1 });
      var q = P.place(X(p[1]), Y(p[2]), p[0], 11); T(sv, q.x, q.y, p[0], { s: 11, c: C.ink, a: q.a, w: p[3] ? 700 : 400 });
    });
    k.foot(s.foot);
  };

  // Lines over a numeric x (days to expiry etc). series: [{n, c, pts:[[x,y]]}] ; logx ; xticks: [[x,label]] ; notes: [{x,y,t,c}] ; vlines: [{x,t}]
  R.curves = function (k, s) {
    var H = s.H || 250, sv = svg(k.body, 350, H, s.title), a0 = 34, a1 = 300, b0 = H - 28, b1 = 10;
    var xs = [], ys = []; s.series.forEach(function (sr) { sr.pts.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); });
    var xl = Math.min.apply(null, xs), xh = Math.max.apply(null, xs), yl = s.ylo != null ? s.ylo : Math.min.apply(null, ys), yh = s.yhi != null ? s.yhi : Math.max.apply(null, ys);
    var yt = nice(yl, yh, 4); yl = Math.min(yl, yt[0]); yh = Math.max(yh, yt[yt.length - 1]);
    var fx = s.logx ? function (v) { return Math.log(v); } : function (v) { return v; };
    var X = function (v) { return a0 + (fx(v) - fx(xl)) / (fx(xh) - fx(xl) || 1) * (a1 - a0); }, Y = function (v) { return b0 - (v - yl) / (yh - yl) * (b0 - b1); };
    yt.forEach(function (v) { E(sv, 'line', { x1: a0, x2: a1, y1: Y(v), y2: Y(v), stroke: C.grid }); T(sv, a0 - 6, Y(v) + 4, String(v), { s: 10, a: 'end' }); });
    (s.xticks || []).forEach(function (t) { T(sv, X(t[0]), b0 + 16, t[1], { s: 10, a: 'middle' }); });
    (s.vlines || []).forEach(function (v) { E(sv, 'line', { x1: X(v.x), x2: X(v.x), y1: b1, y2: b0, stroke: C.sky, 'stroke-dasharray': '3 3' }); if (v.t) T(sv, X(v.x) + 4, b0 - 6, v.t, { s: 10, c: C.sky }); });
    var P = new Placer(350, H);
    s.series.forEach(function (sr, j) {
      var col = sr.c || PAL[j % PAL.length];
      E(sv, 'polyline', { points: sr.pts.map(function (p) { return X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); }).join(' '), fill: 'none', stroke: col, 'stroke-width': sr.w || 2.2, 'stroke-linejoin': 'round' });
    });
    s.series.forEach(function (sr, j) {
      var col = sr.c || PAL[j % PAL.length], l = sr.pts[sr.pts.length - 1];
      var q = P.place(X(l[0]), Y(l[1]), sr.n, 11, [[5, 4, 'start'], [5, -6, 'start'], [5, 14, 'start'], [5, -14, 'start'], [5, 22, 'start']]);
      T(sv, q.x, q.y, sr.n, { s: 11, c: col, a: q.a, w: 700 });
    });
    (s.notes || []).forEach(function (n) {
      if (n.dot) E(sv, 'circle', { cx: X(n.x), cy: Y(n.y), r: 3.5, fill: n.c || C.ink });
      var q = P.place(X(n.x), Y(n.y), n.t, 10.5, [[6, 4, 'start'], [0, -9, 'middle'], [-6, 4, 'end'], [0, 16, 'middle']]);
      T(sv, q.x, q.y, n.t, { s: 10.5, c: n.c || C.ink, a: q.a, w: 600 });
    });
    k.foot(s.foot);
  };

  // Option spread payoff with a days-left slider. spreads: [{n, type:'c'|'p', k1 (long), k2 (short), v1, v2, cost, f, o, days, iv, lo, hi, ttl, sb, fl, ol}]
  R.payoff = function (k, s) {
    var NN = function (x) { var t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989423 * Math.exp(-x * x / 2), p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; };
    var bs = function (ty, S, K, v, T) { if (T <= 0) return ty === 'c' ? Math.max(S - K, 0) : Math.max(K - S, 0); var r = 0.04, d1 = (Math.log(S / K) + (r + v * v / 2) * T) / (v * Math.sqrt(T)), d2 = d1 - v * Math.sqrt(T); return ty === 'c' ? S * NN(d1) - K * Math.exp(-r * T) * NN(d2) : K * Math.exp(-r * T) * NN(-d2) - S * NN(-d1); };
    var val = function (p, S, d) { return bs(p.type, S, p.k1, p.v1, d / 365) - bs(p.type, S, p.k2, p.v2, d / 365); };
    var h3 = k.c.querySelector('h3'), sub = k.c.querySelector('.qd-sub');
    if (!h3) { h3 = el('h3', null, '', null); k.c.insertBefore(h3, k.body); }
    if (!sub) { sub = el('p', 'qd-sub', '', null); k.c.insertBefore(sub, k.body); }
    var tabs = s.spreads.length > 1 ? el('div', 'qd-tabs', null, k.body) : null, btn = [];
    var sv = svg(k.body, 350, 230, 'Spread value by price');
    var slw = el('div', 'qd-sl', null, k.body), dl = el('span', null, '', slw), sl = el('input', null, null, slw); sl.type = 'range'; sl.min = 0; sl.step = 1;
    var ro = el('div', 'qd-ro', null, k.body), cells = [0, 1, 2].map(function () { var d = el('div', null, null, ro); return { b: el('b', null, '', d), l: el('span', null, '', d) }; });
    var cur = 0;
    function draw() {
      var p = s.spreads[cur], d = +sl.value; while (sv.firstChild) sv.removeChild(sv.firstChild);
      h3.textContent = p.ttl || ''; sub.textContent = p.sb || '';
      var x0 = 40, x1 = 342, y0 = 200, y1 = 12, w = Math.abs(p.k2 - p.k1), pl0 = -p.cost, pl1 = w - p.cost;
      var lo = p.lo || p.f * 0.8, hi = p.hi || p.f * 1.25;
      var X = function (v) { return x0 + (v - lo) / (hi - lo) * (x1 - x0); }, Y = function (v) { return y0 - (v - pl0) / (pl1 - pl0) * (y0 - y1 - 10) - 5; };
      var sd = p.iv * Math.sqrt(p.days / 365), a = p.f * Math.exp(-sd), b = p.f * Math.exp(sd);
      E(sv, 'rect', { x: X(Math.max(a, lo)), y: y1, width: X(Math.min(b, hi)) - X(Math.max(a, lo)), height: y0 - y1, fill: C.sun, opacity: 0.13 });
      T(sv, X(Math.max(a, lo)) + 3, y1 + 11, '1σ by expiry', { s: 10, c: C.gold });
      E(sv, 'line', { x1: x0, x2: x1, y1: Y(0), y2: Y(0), stroke: C.m2 });
      [pl0, 0, pl1].forEach(function (v) { T(sv, x0 - 5, Y(v) + 4, (v > 0 ? '+' : v < 0 ? '−' : '') + '$' + Math.abs(v * 100).toFixed(0), { s: 9.5, a: 'end' }); });
      nice(lo, hi, 4).forEach(function (v) { T(sv, X(v), y0 + 16, String(v), { s: 10, a: 'middle' }); });
      var pts = function (dd) { var r = []; for (var i = 0; i <= 120; i++) { var q = lo + (hi - lo) * i / 120; r.push(X(q).toFixed(1) + ',' + Y(val(p, q, dd) - p.cost).toFixed(1)); } return r.join(' '); };
      E(sv, 'polyline', { points: pts(0), fill: 'none', stroke: C.m2, 'stroke-width': 1.4, 'stroke-dasharray': '4 3' });
      E(sv, 'polyline', { points: pts(d), fill: 'none', stroke: C.ink, 'stroke-width': 2.4, 'stroke-linejoin': 'round' });
      var P = new Placer(350, 230);
      [[p.f, C.m1, (p.fl || 'last') + ' ' + p.f], p.o != null ? [p.o, C.sky, (p.ol || 'now') + ' ' + p.o] : null].forEach(function (m) {
        if (!m) return; var v = val(p, m[0], d) - p.cost; E(sv, 'circle', { cx: X(m[0]), cy: Y(v), r: 4.5, fill: m[1], stroke: '#fff', 'stroke-width': 1.2 }); P.dot(X(m[0]), Y(v), 5);
      });
      [[p.f, C.m1, (p.fl || 'last') + ' ' + p.f], p.o != null ? [p.o, C.sky, (p.ol || 'now') + ' ' + p.o] : null].forEach(function (m) {
        if (!m) return; var v = val(p, m[0], d) - p.cost, q = P.place(X(m[0]), Y(v), m[2], 10.5, [[0, -10, 'middle'], [0, 17, 'middle'], [8, 4, 'start'], [-8, 4, 'end']]);
        T(sv, q.x, q.y, m[2], { s: 10.5, c: m[1], a: q.a, w: 600 });
      });
      dl.textContent = d + (d === 1 ? ' day' : ' days') + ' left';
      var at = p.o != null ? p.o : p.f, vf = val(p, at, d), pl = (vf - p.cost) * 100;
      cells[0].b.textContent = '$' + vf.toFixed(2); cells[0].l.textContent = 'value at ' + at;
      cells[1].b.textContent = (pl >= 0 ? '+' : '−') + '$' + Math.abs(pl).toFixed(0); cells[1].b.style.color = pl >= 0 ? C.olive : C.clay; cells[1].l.textContent = 'per spread vs cost';
      cells[2].b.textContent = (p.type === 'c' ? p.k1 + p.cost : p.k1 - p.cost).toFixed(2); cells[2].l.textContent = 'break-even at expiry';
    }
    function pick(i) { cur = i; sl.max = s.spreads[i].days; sl.value = s.spreads[i].days; btn.forEach(function (b, j) { b.className = j === i ? 'on' : ''; }); draw(); }
    if (tabs) s.spreads.forEach(function (p, i) { var b = el('button', null, p.n, tabs); b.type = 'button'; b.onclick = function () { pick(i); }; btn.push(b); });
    sl.oninput = draw; pick(0);
    k.foot(s.foot || 'Black-Scholes with each leg\'s IV · drag the slider toward expiry');
  };

  // Day-by-day list. rows: [{d:'Tue', s:'11/17', ev:'text with **bold** _muted_ [blue]', me:'blue plan line', hot:true}]
  R.calendar = function (k, s) {
    var w = el('div', 'qd-cal', null, k.body);
    s.rows.forEach(function (r) {
      var dy = el('div', 'dy' + (r.hot ? ' hot' : ''), null, w), dd = el('div', 'dd', r.d, dy); el('small', null, r.s || ' ', dd);
      var ev = el('div', 'ev', null, dy); rich(ev, r.ev || '');
      if (r.me) { el('br', null, null, ev); el('span', 'qd-me', r.me, ev); }
    });
    k.foot(s.foot);
  };

  // Grouped ranking of changes. groups: [['Chips', [['NVDA', -0.2, bold], ...]], ...] ; unit '%'
  R.rank = function (k, s) {
    var n = 0; s.groups.forEach(function (g2) { n += g2[1].length; });
    var H = 24 + s.groups.length * 22 + n * 21 + 10, sv = svg(k.body, 350, H, s.title), L0 = 72, R0 = 296;
    var vs = []; s.groups.forEach(function (g2) { g2[1].forEach(function (r) { vs.push(r[1]); }); });
    var lo = Math.min(0, Math.min.apply(null, vs)), hi = Math.max(0, Math.max.apply(null, vs)), pad = (hi - lo) * 0.06 || 1; lo -= pad; hi += pad;
    var X = function (v) { return L0 + (v - lo) / (hi - lo) * (R0 - L0); }, y = 18, top = y;
    nice(lo, hi, 4).forEach(function (v) { T(sv, X(v), 12, v === 0 ? '0' : pct(v, 0), { s: 10, c: C.m2, a: 'middle' }); });
    var marks = [];
    s.groups.forEach(function (g2) {
      y += 20; T(sv, 4, y, g2[0], { f: SERIF, s: 13, c: C.m1, w: 500 }); y += 2;
      g2[1].forEach(function (r) {
        y += 21; var c = r[1] >= 0 ? C.olive : C.clay;
        T(sv, 10, y + 4, r[0], { s: 12.5, c: C.ink, w: r[2] ? 800 : 500 });
        marks.push([y, r[1], c]);
        T(sv, 346, y + 4, pct(r[1]), { s: 12, c: c, a: 'end', w: 600 });
      });
      y += 4;
    });
    nice(lo, hi, 4).forEach(function (v) { E(sv, 'line', { x1: X(v), x2: X(v), y1: top, y2: y, stroke: v === 0 ? C.m2 : C.grid, 'stroke-dasharray': v === 0 ? '4 4' : '' }); });
    marks.forEach(function (m) { E(sv, 'line', { x1: X(0), x2: X(m[1]), y1: m[0], y2: m[0], stroke: m[2], 'stroke-width': 2.2 }); E(sv, 'circle', { cx: X(m[1]), cy: m[0], r: 4, fill: m[2] }); });
    sv.setAttribute('viewBox', '0 0 350 ' + (y + 8));
    k.foot(s.foot);
  };

  // A few big numbers. items: [{v:'−7.5%', l:'MSTR · 103.20', c:'clay'}]
  R.nums = function (k, s) {
    var w = el('div', 'qd-nums', null, k.body);
    s.items.forEach(function (it) { var d = el('div', null, null, w), b = el('b', null, it.v, d); b.style.color = C[it.c] || it.c || C.ink; el('span', null, it.l, d); });
    k.foot(s.foot);
  };


  /* ---------- Labubu's TA, drawn the way he reads a chart ---------- */
  function ema(a, n) { var k = 2 / (n + 1), o = [], p = null; for (var i = 0; i < a.length; i++) { p = p == null ? a[i] : a[i] * k + p * (1 - k); o.push(p); } return o; }
  function sma(a, n) { var o = [], t = 0; for (var i = 0; i < a.length; i++) { t += a[i]; if (i >= n) t -= a[i - n]; o.push(i >= n - 1 ? t / n : null); } return o; }
  function wkey(d) { var t = new Date(d + 'T12:00:00Z'), day = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - day); return t.toISOString().slice(0, 10); }
  function ema8w(dates, c) { // weekly 8 EMA, the current week updating with each day, as it shows on his daily chart
    var k = 2 / 9, base = null, wk = null, last = null, o = [];
    for (var i = 0; i < c.length; i++) { var w = wkey(dates[i]); if (w !== wk) { if (last != null) base = base == null ? last : last; wk = w; } var v = base == null ? c[i] : c[i] * k + base * (1 - k); o.push(v); last = v; }
    return o;
  }
  function prevRange(dates, H, L, keyf) { // high and low of the previous completed period
    var n = dates.length, cur = keyf(dates[n - 1]), prev = null, hi = -Infinity, lo = Infinity;
    for (var i = n - 1; i >= 0; i--) { var kk = keyf(dates[i]); if (kk === cur) continue; if (prev == null) prev = kk; if (kk !== prev) break; hi = Math.max(hi, H[i]); lo = Math.min(lo, L[i]); }
    return prev == null ? null : [hi, lo];
  }
  // The full read of a daily chart, Labubu's way. Claude reads this in the background (QD.observe, or `node read.js`);
  // the picture the reader sees draws only the few pieces that carry the point.
  function analyze(B, year) {
    var n = B.length, D = B.map(function (r) { return dateOf(r[0], year); });
    var O = B.map(function (r) { return r[1]; }), H = B.map(function (r) { return r[2]; }), L = B.map(function (r) { return r[3]; }), Cl = B.map(function (r) { return r[4]; }), V = B.map(function (r) { return r[5] || 0; });
    var A = { n: n, D: D, O: O, H: H, L: L, C: Cl, V: V, last: n - 1, px: Cl[n - 1] };
    A.ema = { 5: ema(Cl, 5), 10: ema(Cl, 10), 21: ema(Cl, 21), 50: ema(Cl, 50), '8W': ema8w(D, Cl) };
    if (n >= 230) A.ema['200S'] = sma(Cl, 200);
    var px = A.px, last = A.last, fv = [];
    for (var i = 2; i < n; i++) {
      if (L[i] > H[i - 2]) fv.push({ lo: H[i - 2], hi: L[i], i: i - 1, up: true });
      if (H[i] < L[i - 2]) fv.push({ lo: H[i], hi: L[i - 2], i: i - 1, up: false });
    }
    fv.forEach(function (z) { for (var j = z.i + 2; j < n; j++) { if (z.up) { if (L[j] <= z.lo) { z.dead = true; break; } z.hi = Math.min(z.hi, Math.max(z.lo, L[j])); } else { if (H[j] >= z.hi) { z.dead = true; break; } z.lo = Math.max(z.lo, Math.min(z.hi, H[j])); } } });
    fv = fv.filter(function (z) { return !z.dead && z.hi - z.lo > px * 0.004 && z.i >= n - 100; });
    A.gapsBelow = fv.filter(function (z) { return z.hi <= px; }).sort(function (a, b) { return b.hi - a.hi; }).slice(0, 2);
    A.gapsAbove = fv.filter(function (z) { return z.lo >= px; }).sort(function (a, b) { return a.lo - b.lo; }).slice(0, 2);
    var sw = [], P = 3;
    for (var i = P; i < n - P; i++) {
      var hh = true, ll = true; for (var j = i - P; j <= i + P; j++) { if (H[j] > H[i]) hh = false; if (L[j] < L[i]) ll = false; }
      if (hh) sw.push({ i: i, v: H[i], hi: true }); if (ll) sw.push({ i: i, v: L[i], hi: false });
    }
    var lH = null, lL = null; sw.forEach(function (p) { if (p.hi) { p.t = lH == null ? '' : p.v > lH.v ? 'HH' : 'LH'; lH = p; } else { p.t = lL == null ? '' : p.v > lL.v ? 'HL' : 'LL'; lL = p; } });
    A.swings = sw; A.lastHigh = lH; A.lastLow = lL; A.brk = null;
    if (lH && px > lH.v) A.brk = { up: true, t: lH.t === 'LH' ? 'CHoCH' : 'BOS', v: lH.v };
    else if (lL && px < lL.v) A.brk = { up: false, t: lL.t === 'HL' ? 'CHoCH' : 'BOS', v: lL.v };
    var pw = prevRange(D, H, L, wkey), pm = prevRange(D, H, L, function (d) { return d.slice(0, 7); });
    A.levels = { PDH: H[last - 1], PDL: L[last - 1] }; if (pw) { A.levels.PWH = pw[0]; A.levels.PWL = pw[1]; } if (pm) { A.levels.PMH = pm[0]; A.levels.PML = pm[1]; }
    var w0 = Math.max(0, n - 60), vlo = Math.min.apply(null, L.slice(w0)), vhi = Math.max.apply(null, H.slice(w0)), NB = 32, bins = new Array(NB).fill(0), bw = (vhi - vlo) / NB || 1;
    for (var i = w0; i <= last; i++) { var a = Math.floor((L[i] - vlo) / bw), b = Math.min(NB - 1, Math.floor((H[i] - vlo) / bw)), m = b - a + 1; for (var q = a; q <= b; q++) bins[q] += V[i] / m; }
    var mx = 0; bins.forEach(function (v, q) { if (v > bins[mx]) mx = q; }); A.volNode = vlo + (mx + 0.5) * bw;
    var av = sma(V, 20), up = 0, dn = 0; for (var i = Math.max(1, n - 20); i < n; i++) { if (Cl[i] >= Cl[i - 1]) up += V[i]; else dn += V[i]; }
    A.udVol = dn ? up / dn : null; A.from5 = (px / A.ema[5][last] - 1) * 100;
    A.bigVol = null; for (var i = Math.max(1, n - 20); i <= last; i++) if (av[i - 1] && V[i] > av[i - 1] * 1.8 && (!A.bigVol || V[i] / av[i - 1] > A.bigVol.x)) A.bigVol = { i: i, x: V[i] / av[i - 1] };
    // what the last few closes did at each line: test and fail, reclaim, lose
    A.events = [];
    ['10', '21', '50', '8W'].forEach(function (k) {
      var e = A.ema[k], found = null;
      for (var i = Math.max(1, n - 6); i <= last; i++) {
        var c0 = Cl[i - 1], c1 = Cl[i], l0 = e[i - 1], l1 = e[i];
        if (c0 < l0 && c1 > l1) found = { i: i, k: k, t: 'reclaimed' };
        else if (c0 > l0 && c1 < l1) found = { i: i, k: k, t: 'lost' };
        else if (c1 < l1 && H[i] >= l1 * 0.997) found = { i: i, k: k, t: 'tested from below and failed' };
        else if (c1 > l1 && L[i] <= l1 * 1.003) found = { i: i, k: k, t: 'tested from above and held' };
      }
      if (found) A.events.push(found);
    });
    // the latest low or high that hasn't had three bars after it yet, so the newest swing still shows
    var rl = Math.min.apply(null, L.slice(n - 3)), rh = Math.max.apply(null, H.slice(n - 3)), il = L.lastIndexOf(rl), ih = H.lastIndexOf(rh);
    if (lL && il > lL.i + 2 && rl < lL.v) A.newLow = { i: il, v: rl }; if (lH && ih > lH.i + 2 && rh > lH.v) A.newHigh = { i: ih, v: rh };
    var lows20 = Math.min.apply(null, L.slice(Math.max(0, n - 21), last)), highs20 = Math.max.apply(null, H.slice(Math.max(0, n - 21), last));
    if (L[last] < lows20 && Cl[last] > lows20) A.events.push({ i: last, k: '20D low', t: 'swept and closed back above' });
    if (H[last] > highs20 && Cl[last] < highs20) A.events.push({ i: last, k: '20D high', t: 'swept and closed back below' });
    return A;
  }
  function observe(A, name) { // plain-text read for Claude, not for the picture
    var f = function (v) { return v == null ? '-' : v.toFixed(v < 100 ? 2 : 1); }, d = function (i) { return A.D[i].slice(5).replace('-', '/'); }, last = A.last, px = A.px, out = [];
    out.push((name || '') + ' ' + d(last) + ' close ' + f(px));
    var e = A.ema, side = function (k) { var v = e[k][last], sl = e[k][last] - e[k][Math.max(0, last - 5)]; return k + ' ' + f(v) + (px > v ? ' (above' : ' (below') + ', ' + (sl > 0 ? 'rising' : 'falling') + ')'; };
    out.push('EMA ' + ['5', '10', '21', '50', '8W'].map(side).join(' · '));
    var ord = ['5', '10', '21', '50'].map(function (k) { return e[k][last]; }), bull = ord.every(function (v, i) { return i === 0 || ord[i - 1] >= v; }), bear = ord.every(function (v, i) { return i === 0 || ord[i - 1] <= v; });
    out.push('Stack ' + (bull ? 'bullish 5>10>21>50' : bear ? 'bearish 5<10<21<50' : 'mixed') + ' · from 5D ' + (A.from5 >= 0 ? '+' : '') + A.from5.toFixed(1) + '%');
    out.push('Structure ' + A.swings.filter(function (p) { return p.t; }).slice(-5).map(function (p) { return p.t + ' ' + f(p.v) + ' ' + d(p.i); }).join(' · ') + (A.brk ? ' · now ' + A.brk.t + (A.brk.up ? ' up' : ' down') + ' through ' + f(A.brk.v) : ''));
    out.push('Gaps above ' + (A.gapsAbove.map(function (z) { return f(z.lo) + '-' + f(z.hi) + ' (' + d(z.i) + ')'; }).join(', ') || 'none') + ' · below ' + (A.gapsBelow.map(function (z) { return f(z.lo) + '-' + f(z.hi) + ' (' + d(z.i) + ')'; }).join(', ') || 'none'));
    out.push('Levels ' + Object.keys(A.levels).map(function (k) { return k + ' ' + f(A.levels[k]); }).join(' · '));
    out.push('Volume node ' + f(A.volNode) + ' · U/D 20d ' + (A.udVol ? A.udVol.toFixed(2) : '-') + (A.bigVol ? ' · biggest day ' + d(A.bigVol.i) + ' ' + A.bigVol.x.toFixed(1) + 'x avg' : ''));
    if (A.newLow) out.push('Fresh low ' + f(A.newLow.v) + ' ' + d(A.newLow.i) + ' (under the last swing low, not yet confirmed)'); if (A.newHigh) out.push('Fresh high ' + f(A.newHigh.v) + ' ' + d(A.newHigh.i) + ' (over the last swing high, not yet confirmed)');
    if (A.events.length) out.push('Recent ' + A.events.map(function (x) { return d(x.i) + ' ' + x.k + ' ' + x.t; }).join(' · '));
    return out.join('\n');
  }

  // The picture the reader sees: candles and volume, plus only what Claude chose to show.
  // bars ; year ; show (55) ; invert ; ema: [21] (periods or '8W' to draw) ; levels: ['PWH'] ; gaps: 'above'|'below'|true ;
  // zones: [{lo,hi,t,c}] ; lines: [{p,t}] ; marks: [{d,t,up}] ; structure: false ; reads: false ; full: true draws everything
  R.ta = function (k, s) {
    var A = analyze(s.bars, s.year), n = A.n, D = A.D, O = A.O, H = A.H, L = A.L, Cl = A.C, V = A.V, last = A.last, px = A.px;
    var full = !!s.full, show = Math.min(s.show || 55, n), i0 = n - show, inv = !!s.invert;
    var emas = full ? ['8W', '50', '21', '10', '5'] : (s.ema || [21]).map(String);
    var gaps = full || s.gaps === true ? A.gapsBelow.concat(A.gapsAbove) : s.gaps === 'above' ? A.gapsAbove.slice(0, 1) : s.gaps === 'below' ? A.gapsBelow.slice(0, 1) : [];
    var lvl = full ? Object.keys(A.levels) : (s.levels || []);
    var zones = (s.zones || []).slice();
    var W = 350, HH = 318, x0 = 6, x1 = 262, gx = 266, y0 = 14, y1 = 238, vy0 = 252, vy1 = 298, sv = svg(k.body, W, HH, s.title);
    var pr = []; for (var i = i0; i <= last; i++) pr.push(H[i], L[i]);
    emas.forEach(function (e) { for (var i = i0; i <= last; i++) pr.push(A.ema[e][i]); });
    (s.lines || []).forEach(function (l) { pr.push(l.p); }); lvl.forEach(function (x) { if (A.levels[x] != null) pr.push(A.levels[x]); });
    gaps.concat(zones).forEach(function (z) { pr.push(z.lo, z.hi); });
    var plo = Math.min.apply(null, pr), phi = Math.max.apply(null, pr), pad = (phi - plo) * 0.06; plo -= pad; phi += pad;
    var X = function (i) { return x0 + (i - i0 + 0.5) / show * (x1 - x0); }, Y = function (v) { var t = (v - plo) / (phi - plo); return inv ? y0 + t * (y1 - y0) : y1 - t * (y1 - y0); };
    var cw = Math.max(1.5, (x1 - x0) / show * 0.62), clip = function (v) { return Math.max(y0, Math.min(y1, v)); };
    var ticks = nice(plo, phi, 4); ticks.forEach(function (v) { E(sv, 'line', { x1: x0, x2: x1, y1: Y(v), y2: Y(v), stroke: C.grid }); });
    if (inv) T(sv, x0 + 2, y0 + 10, 'FLIPPED · read it as a long', { s: 10, c: C.clay, w: 700 });
    gaps.forEach(function (z) { var a = clip(Y(z.hi)), b = clip(Y(z.lo)), x = Math.max(x0, X(z.i) - cw / 2); E(sv, 'rect', { x: x, y: Math.min(a, b), width: x1 - x, height: Math.max(2, Math.abs(b - a)), fill: z.up ? C.olive : C.clay, opacity: 0.18 }); });
    zones.forEach(function (z) { var a = clip(Y(z.hi)), b = clip(Y(z.lo)); E(sv, 'rect', { x: x0, y: Math.min(a, b), width: x1 - x0, height: Math.max(2, Math.abs(b - a)), fill: z.c || C.sky, opacity: 0.14 }); });
    var ECOL = { '5': C.sun, '10': '#F0A04B', '21': '#E67E22', '50': '#C0392B', '8W': C.plum, '200S': C.m1 };
    var Pl = new Placer(W, HH), tags = [];
    emas.forEach(function (e) { var a = A.ema[e], p = []; for (var i = i0; i <= last; i++) p.push(X(i).toFixed(1) + ',' + clip(Y(a[i])).toFixed(1)); E(sv, 'polyline', { points: p.join(' '), fill: 'none', stroke: ECOL[e] || C.m1, 'stroke-width': full ? 1.6 : 2.2, 'stroke-linejoin': 'round' }); if (!full) tags.push([(e === '8W' ? '8W' : e + 'D') + ' ' + a[last].toFixed(a[last] < 100 ? 2 : 1), a[last], ECOL[e]]); });
    for (var i = i0; i <= last; i++) {
      var c = Cl[i] >= O[i] ? C.olive : C.clay, x = X(i);
      E(sv, 'line', { x1: x, x2: x, y1: Y(H[i]), y2: Y(L[i]), stroke: c, 'stroke-width': 1 });
      var a = Y(O[i]), b = Y(Cl[i]); E(sv, 'rect', { x: x - cw / 2, y: Math.min(a, b), width: cw, height: Math.max(1, Math.abs(b - a)), fill: c });
      Pl.add({ x0: x - cw / 2, x1: x + cw / 2, y0: Math.min(Y(H[i]), Y(L[i])), y1: Math.max(Y(H[i]), Y(L[i])) });
    }
    lvl.forEach(function (x) { var v = A.levels[x]; if (v == null) return; E(sv, 'line', { x1: x0, x2: x1, y1: Y(v), y2: Y(v), stroke: C.m1, 'stroke-width': 1, 'stroke-dasharray': '1 3' }); tags.push([x + ' ' + v.toFixed(v < 100 ? 2 : 1), v, C.m1]); });
    (s.lines || []).forEach(function (l) { E(sv, 'line', { x1: x0, x2: x1, y1: Y(l.p), y2: Y(l.p), stroke: C.sky, 'stroke-dasharray': '5 3', 'stroke-width': 1.2 }); tags.push([(l.t ? l.t + ' ' : '') + l.p, l.p, C.sky]); });
    zones.forEach(function (z) { if (z.t) tags.push([z.t, (z.lo + z.hi) / 2, z.c || C.sky]); });
    gaps.forEach(function (z) { tags.push(['gap ' + z.lo.toFixed(0) + '–' + z.hi.toFixed(0), (z.lo + z.hi) / 2, z.up ? C.olive : C.clay]); });
    var ly = Y(px), used = [ly];
    tags.sort(function (a, b) { return Y(a[1]) - Y(b[1]); }).forEach(function (t) {
      var ty = Y(t[1]); if (ty < y0 - 2 || ty > y1 + 2) return; var y = ty, dir = ty < ly ? -1 : 1; while (used.some(function (u) { return Math.abs(u - y) < 12; })) y += 12 * dir; used.push(y);
      if (Math.abs(y - ty) > 1) E(sv, 'line', { x1: x1, y1: ty, x2: gx - 1, y2: y - 3, stroke: t[2], 'stroke-width': 0.6 });
      T(sv, gx, y + 1, t[0].length > 15 ? t[0].slice(0, 15) : t[0], { s: 9.5, c: t[2], w: 700 });
    });
    E(sv, 'rect', { x: gx - 2, y: ly - 7, width: 44, height: 14, rx: 3, fill: Cl[last] >= O[last] ? C.olive : C.clay }); T(sv, gx + 20, ly + 4, px.toFixed(px < 100 ? 2 : 1), { s: 10, c: '#fff', a: 'middle', w: 700 });
    ticks.forEach(function (v) { var y = Y(v); if (y < y0 + 14 && inv) return; T(sv, x0 + 1, y - 3, String(v), { s: 9.5, c: C.m2 }); });
    if (full || s.structure) {
      var SW = { HH: 'LL', LL: 'HH', LH: 'HL', HL: 'LH' };
      A.swings.filter(function (p) { return p.i >= i0 && p.t; }).slice(-5).forEach(function (p) {
        var t = inv ? SW[p.t] : p.t, top = inv ? !p.hi : p.hi, q = Pl.place(X(p.i), Y(p.v), t, 9.5, top ? [[0, -6, 'middle'], [0, -16, 'middle']] : [[0, 14, 'middle'], [0, 24, 'middle']]);
        T(sv, q.x, q.y, t, { s: 9.5, c: t[0] === 'H' ? C.olive : C.clay, a: 'middle', w: 700 });
      });
    }
    (s.marks || []).forEach(function (m) {
      var i = D.indexOf(dateOf(m.d, s.year)); if (i < i0) return; var top = inv ? !!m.up : !m.up, y = top ? Math.min(Y(H[i]), Y(L[i])) : Math.max(Y(H[i]), Y(L[i]));
      var q = Pl.place(X(i), y, m.t, 10.5, top ? [[0, -8, 'middle'], [0, -20, 'middle'], [-8, -8, 'end'], [8, -8, 'start']] : [[0, 17, 'middle'], [0, 29, 'middle'], [-8, 17, 'end'], [8, 17, 'start']]);
      T(sv, q.x, q.y, m.t, { s: 10.5, c: m.c || C.ink, a: q.a, w: 600 });
    });
    var vm = Math.max.apply(null, V.slice(i0)) || 1;
    for (var i = i0; i <= last; i++) { var h = V[i] / vm * (vy1 - vy0); E(sv, 'rect', { x: X(i) - cw / 2, y: vy1 - h, width: cw, height: h, fill: Cl[i] >= O[i] ? C.olive : C.clay, opacity: 0.35 }); }
    var step = Math.max(1, Math.round(show / 5)); for (var i = last; i >= i0; i -= step) T(sv, X(i), HH - 4, D[i].slice(5).replace('-', '/'), { s: 9.5, a: 'middle' });
    var foot = s.foot || '';
    if (full || s.reads) { var st = inv ? -A.from5 : A.from5; foot += (foot ? ' · ' : '') + (st >= 0 ? '+' : '−') + Math.abs(st).toFixed(1) + '% from 5D' + (A.udVol ? ' · U/D vol ' + A.udVol.toFixed(2) : '') + (inv ? ' · as flipped' : ''); }
    k.foot(foot);
  };
  R.ta.analyze = analyze; R.ta.observe = observe;

  // Relative strength against a benchmark. dates: ["MM-DD"], bench: {n, c:[...]}, series: [{n, c:[...], cl}], year
  R.rs = function (k, s) {
    var n = s.dates.length, b = s.bench.c, H = s.H || 250, sv = svg(k.body, 350, H, s.title), x0 = 6, x1 = 262, y0 = 12, y1 = H - 26;
    var lines = s.series.map(function (sr, j) { return { n: sr.n, c: sr.cl || PAL[j % PAL.length], v: sr.c.map(function (v, i) { return ((v / sr.c[0]) / (b[i] / b[0]) - 1) * 100; }) }; });
    var all = [0]; lines.forEach(function (l) { all = all.concat(l.v); });
    var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all), pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;
    var X = function (i) { return x0 + i / (n - 1) * (x1 - x0); }, Y = function (v) { return y1 - (v - lo) / (hi - lo) * (y1 - y0); };
    nice(lo, hi, 4).forEach(function (v) { E(sv, 'line', { x1: x0, x2: x1, y1: Y(v), y2: Y(v), stroke: v === 0 ? C.m2 : C.grid, 'stroke-dasharray': v === 0 ? '4 3' : '' }); T(sv, x0 + 2, Y(v) - 3, v === 0 ? '= ' + s.bench.n : pct(v, 0), { s: 9.5, c: C.m2 }); });
    var P = new Placer(350, H);
    lines.sort(function (a, c) { return c.v[n - 1] - a.v[n - 1]; }).forEach(function (l) {
      E(sv, 'polyline', { points: l.v.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' '), fill: 'none', stroke: l.c, 'stroke-width': 2, 'stroke-linejoin': 'round' });
    });
    lines.forEach(function (l) { var v = l.v[n - 1], q = P.place(x1, Y(v), l.n + ' ' + pct(v), 10.5, [[4, 4, 'start'], [4, -6, 'start'], [4, 14, 'start'], [4, -16, 'start'], [4, 24, 'start']]); T(sv, q.x, q.y, l.n + ' ' + pct(v), { s: 10.5, c: l.c, a: q.a, w: 700 }); });
    var step = Math.max(1, Math.round(n / 4)); for (var i = n - 1; i >= 0; i -= step) T(sv, X(i), H - 8, s.dates[i].replace('-', '/'), { s: 9.5, a: 'middle' });
    k.foot(s.foot || ('Each line: the name against ' + s.bench.n + ' since ' + s.dates[0].replace('-', '/') + '; up means it beat ' + s.bench.n));
  };

  var NEEDS_LWC = { candles: 1, session: 1 };
  function draw(target, specs) {
    style();
    var root = typeof target === 'string' ? document.getElementById(target) : target;
    var wrap = el('div', 'qd', null, root);
    specs = Array.isArray(specs) ? specs : [specs];
    var need = specs.some(function (s) { return NEEDS_LWC[s.type]; });
    var cards = specs.map(function (s) { return card(wrap, s); });
    var go = function (L) {
      specs.forEach(function (s, i) {
        try { R[s.type](cards[i], s, L); }
        catch (e) { el('p', 'qd-ft', 'Could not draw this chart: ' + e.message, cards[i].c); if (g.console) console.error(e); }
      });
    };
    if (need) lwc().then(go, function () { go(null); }); else go(null);
  }

  g.QD = { draw: draw, C: C, types: Object.keys(R), version: '1.2.0', analyze: analyze, observe: observe };
  if (typeof module !== 'undefined' && module.exports) module.exports = g.QD;
})(typeof window !== 'undefined' ? window : globalThis);
