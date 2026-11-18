# quiet-draw

A chart kit for claude.ai widgets: warm card, clean lines, the point written on the chart.
Candles and session lines use TradingView Lightweight Charts 4.2.0 (loaded on demand from jsDelivr); everything else is plain SVG.

Load it from `https://cdn.jsdelivr.net/gh/eldenring2004/quiet-draw@v1/qd.js` and call `QD.draw('id', spec | [spec, ...])`.
Every spec takes `title`, `sub`, `foot`, and `h` (height, for the two engine charts). `examples/widget.html` shows the loader in a widget.

| type | data |
|---|---|
| `candles` | `bars:[["MM-DD",o,h,l,c,volM]]`, `year`, `ma:[20]`, `lines:[{p}]` (strike lines, dashed blue), `marks:[{d,t,up,c}]` |
| `session` | `segs:[["YYYY-MM-DD HH:MM" ET, count]]`, `step` (min, 5), `series:[{n,base,v:[...],c,w}]`, `ref`, `marks:[{s,i,t,up,dot,c}]`, `pct` |
| `moves` | `rows:[[label, v, v2]]` (v2 = the dot), `band`, `notes:[line, ...]` |
| `oi` | `rows:[[strike, callOI, putOI]]`, `price`, `priceLabel`, `notes:[{k,side,t}]`, `cap`, `overNote` |
| `scatter` | `pts:[[name,x,y,bold]]`, `diag`, `above`, `below`, `xl`, `yl`, `lo`, `hi` |
| `curves` | `series:[{n,c,w,pts:[[x,y]]}]`, `logx`, `xticks:[[x,label]]`, `vlines:[{x,t}]`, `notes:[{x,y,t,c,dot}]` |
| `payoff` | `spreads:[{n,type:'c'|'p',k1,k2,v1,v2,cost,f,o,fl,ol,days,iv,lo,hi,ttl,sb}]` (interactive: tabs and a days-left slider) |
| `calendar` | `rows:[{d,s,ev,me,hot}]`; in `ev`, `**bold**`, `_muted_`, `[blue]` |
| `rank` | `groups:[[group,[[name,v,bold]]]]` |
| `nums` | `items:[{v,l,c}]` (`c` = clay, olive, sky, ink or a hex) |
| `ta` | the picture for one name: candles and volume plus only what the point needs. `bars:[["MM-DD",o,h,l,c,volM]]` (90+), `year`, `show` (55), `invert` (flip for a short), `ema:[21]` (which lines: 5, 10, 21, 50, '8W'), `gaps:'above'|'below'|true`, `levels:['PWH',...]`, `zones:[{lo,hi,t,c}]`, `lines:[{p,t}]`, `marks:[{d,t,up}]`, `structure`, `reads`; `full:true` draws everything (for checking, not for the reader). |
| `rs` | relative strength: `dates`, `bench:{n,c}`, `series:[{n,c,cl}]`; each line is the name against the benchmark since the first date |

Colours: clay `#D97757` down, olive `#7C8F5A` up, sky `#5B8EC4` Claude's marks, sun `#E3B04B` averages, plum `#8E7CC3`, grey `#8F8A80`.
Labels on SVG charts are placed by a small collision check, so a new picture doesn't need a render pass.

Two layers. `QD.analyze(bars)` and `QD.observe(...)` (or `node read.js NAME bars.json`) give Claude the full read in text: every EMA and its slope, the stack, distance from the 5D, swing structure and breaks, unfilled gaps, PDH/PDL/PWH/PWL/PMH/PML, the volume node, U/D volume, the biggest volume day, and what the last closes did at the 10/21/50/8W lines. That read is for Claude's own analysis. The picture the reader sees draws only the one or two pieces that carry the point.

Labubu's method behind it: daily EMA 5/10/21/50 plus the 8-week EMA (10D the momentum line and 21D the bull/bear line on a hot name), previous day/week/month highs and lows as the levels everyone watches, ICT fair-value gaps and structure breaks, closes only (a night or intraday poke doesn't count), distance above the 5D as the sell-into-strength gauge, and for a short the chart turned upside down and read as a long.

Release: tag `v1` for this version. A change that would alter an existing chart gets a new tag (`v2`) so old pictures keep their look.
