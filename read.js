#!/usr/bin/env node
// Claude's background TA read, Labubu's way: node read.js NAME bars.json [more NAME bars.json ...]
// bars.json is a moomoo_history result (data.columns + data.rows, daily ohlcv) or [["YYYY-MM-DD"|"MM-DD",o,h,l,c,volM],...] (MM-DD needs YEAR=2026 in env).
const fs = require('fs'), path = require('path');
const QD = require(path.join(__dirname, 'qd.js'));
function bars(j) {
  const d = j.data || j;
  if (d && d.rows && d.columns) {
    const c = d.columns, ix = k => c.indexOf(k);
    return d.rows.map(r => [String(r[ix('time_key')]).slice(0, 10), +r[ix('open')], +r[ix('high')], +r[ix('low')], +r[ix('close')], +(r[ix('volume')] || 0) / 1e6]);
  }
  return d;
}
const a = process.argv.slice(2);
for (let i = 0; i + 1 < a.length; i += 2) {
  const b = bars(JSON.parse(fs.readFileSync(a[i + 1], 'utf8')));
  console.log(QD.observe(QD.analyze(b, process.env.YEAR || '2026'), a[i]) + '\n');
}
