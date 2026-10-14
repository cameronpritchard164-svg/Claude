// @ts-nocheck
// Server-rendered dashboard HTML: dark surface, GrabCo brand accents, inline
// SVG charts with hover tooltips and table views.
import { STORES } from './whop'

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const money = (n, c = 'USD') => (c === 'USD' ? '$' : c + ' ') + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const num = (n) => Number(n || 0).toLocaleString('en-US')
const pct = (n) => (isFinite(n) ? (n * 100).toFixed(n * 100 >= 10 ? 0 : 1) + '%' : '–')
const compact = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K' : String(Math.round(n)))
const day = (t) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const when = (iso) => (iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Perth' }) : '–')

export const CSS = `
:root{color-scheme:dark;--bg:#0f0f10;--surface:#1a1a19;--surface-2:#232322;--line:#2c2c2b;--text:#f0efec;--text-2:#c3c2b7;--muted:#8a8982;
--clausegrab:#e66767;--diddygrab:#9085e9;--seq:#3987e5;--seq-2:#1c5cab;--good:#0ca30c;--warn:#fab219;--bad:#d03b3b;--brand:#e66767;--brand-2:#9085e9}
*{box-sizing:border-box}html{font-size:16px}
body{margin:0;background:var(--bg);color:var(--text);font-family:Poppins,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.45;-webkit-font-smoothing:antialiased}
a{color:inherit}
.wrap{max-width:1240px;margin:0 auto;padding:20px 16px 60px}
header.top{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:6px 0 18px;border-bottom:1px solid var(--line);margin-bottom:18px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:12px}
.brand .mark{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--brand),var(--brand-2));display:grid;place-items:center;font-weight:800;color:#fff;letter-spacing:.02em;box-shadow:0 0 24px rgba(230,103,103,.35)}
.brand h1{font-size:1.05rem;margin:0;font-weight:700;letter-spacing:.04em}
.brand small{display:block;color:var(--muted);font-weight:400;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase}
.filters{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.seg{display:inline-flex;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:3px}
.seg a{padding:6px 12px;border-radius:8px;text-decoration:none;font-size:.85rem;color:var(--text-2)}
.seg a.on{background:var(--surface-2);color:var(--text);box-shadow:inset 0 0 0 1px var(--line)}
.meta{color:var(--muted);font-size:.78rem}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:0 0 18px}
.tile{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 16px;position:relative;overflow:hidden}
.tile:before{content:"";position:absolute;inset:0 auto 0 0;width:3px;background:var(--accent,var(--line))}
.tile .l{font-size:.74rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
.tile .v{font-size:1.75rem;font-weight:700;margin-top:4px;line-height:1.1}
.tile .s{font-size:.78rem;color:var(--text-2);margin-top:6px}
.hero .v{font-size:2.6rem}
.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:14px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px;grid-column:span 12;min-width:0}
@media(min-width:900px){.c6{grid-column:span 6}.c4{grid-column:span 4}.c8{grid-column:span 8}}
.card h2{font-size:.95rem;margin:0 0 2px;font-weight:600}
.card .sub{color:var(--muted);font-size:.78rem;margin:0 0 12px}
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:.8rem;color:var(--text-2);margin:0 0 8px}
.legend i{display:inline-block;width:14px;height:3px;border-radius:2px;vertical-align:middle;margin-right:6px}
.legend i.sq{height:10px;width:10px;border-radius:3px}
.chart{position:relative}
.chart svg{display:block;width:100%;height:auto;overflow:visible}
.chart .ax{fill:var(--muted);font-size:11px;font-variant-numeric:tabular-nums}
.chart .grid{stroke:var(--line);stroke-width:1}
.chart .hit{fill:transparent}
.tip{position:absolute;pointer-events:none;background:#0b0b0b;border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:.8rem;min-width:140px;display:none;z-index:5;box-shadow:0 8px 30px rgba(0,0,0,.5)}
.tip .d{color:var(--muted);margin-bottom:4px}
.tip .r{display:flex;justify-content:space-between;gap:12px}.tip .r b{font-variant-numeric:tabular-nums}
.tip .r i{display:inline-block;width:12px;height:3px;border-radius:2px;margin-right:6px;vertical-align:middle}
.bars{display:grid;gap:8px}
.bar{display:grid;grid-template-columns:minmax(90px,1.2fr) 4fr auto;gap:10px;align-items:center;font-size:.82rem}
.bar .n{color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar .t{height:14px;background:var(--surface-2);border-radius:4px;overflow:hidden}
.bar .f{height:100%;border-radius:0 4px 4px 0;background:var(--seq)}
.bar .v{font-variant-numeric:tabular-nums;color:var(--text);min-width:3ch;text-align:right}
.funnel .bar .f{background:var(--fill)}
table{width:100%;border-collapse:collapse;font-size:.82rem}
th{text-align:left;color:var(--muted);font-weight:500;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;padding:6px 8px;border-bottom:1px solid var(--line)}
td{padding:8px;border-bottom:1px solid var(--line);vertical-align:top;font-variant-numeric:tabular-nums}
td.r,th.r{text-align:right}
.dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:middle}
.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:.72rem;background:var(--surface-2);color:var(--text-2)}
.pill.good{color:#9be29b}.pill.warn{color:#ffd27a}.pill.bad{color:#ff9b9b}
details.tv{margin-top:10px}details.tv summary{cursor:pointer;color:var(--muted);font-size:.78rem}
.empty{color:var(--muted);font-size:.85rem;padding:18px 0;text-align:center}
.note{background:var(--surface);border:1px solid var(--line);border-left:3px solid var(--warn);border-radius:12px;padding:12px 14px;font-size:.85rem;margin-bottom:16px}
form.setup{max-width:520px;margin:40px auto;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:24px}
form.setup label{display:block;font-size:.8rem;color:var(--text-2);margin:14px 0 6px}
form.setup input{width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--text);font-size:.95rem}
form.setup button,.btn{margin-top:18px;padding:10px 16px;border-radius:10px;border:0;background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;font-weight:600;cursor:pointer;font-size:.95rem}
form.setup p{color:var(--text-2);font-size:.85rem}
.err{color:#ff9b9b;font-size:.85rem}
footer{margin-top:30px;color:var(--muted);font-size:.75rem;text-align:center}
`

export const page = (title, body, { wide = true } = {}) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<meta name="robots" content="noindex,nofollow"><link rel="icon" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body><div class="wrap">${body}</div>${SCRIPT}</body></html>`

// ---- charts ---------------------------------------------------------------

// Multi-series line chart. series: [{name,color,values:[n]}], labels: [string]
export function lineChart(id, labels, series, { fmt = num, height = 220 } = {}) {
  const W = 720, H = height, L = 42, R = 12, T = 12, B = 28
  const n = labels.length
  const max = Math.max(1, ...series.flatMap((s) => s.values))
  const yMax = niceMax(max)
  const x = (i) => (n <= 1 ? L + (W - L - R) / 2 : L + ((W - L - R) * i) / (n - 1))
  const y = (v) => T + (H - T - B) * (1 - v / yMax)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax)
  const grid = ticks.map((v) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${compact(v)}</text>`).join('')
  const every = Math.max(1, Math.ceil(n / 8))
  const xl = labels.map((lb, i) => (i % every === 0 || i === n - 1 ? `<text class="ax" x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(lb)}</text>` : '')).join('')
  const paths = series
    .map((s) => {
      const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
      const area = `${d} L${x(n - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`
      const dots = s.values.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="4" fill="${s.color}" stroke="var(--surface)" stroke-width="2"/>`).join('')
      return `<path d="${area}" fill="${s.color}" opacity=".1"/><path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${n <= 31 ? dots : ''}`
    })
    .join('')
  const hits = labels.map((_, i) => `<rect class="hit" data-i="${i}" x="${(x(i) - (W - L - R) / Math.max(1, n - 1) / 2).toFixed(1)}" y="${T}" width="${((W - L - R) / Math.max(1, n - 1)).toFixed(1)}" height="${H - T - B}"/>`).join('')
  const data = { labels, series: series.map((s) => ({ name: s.name, color: s.color, values: s.values })), kind: 'line', fmt: fmt === money ? 'money' : 'num' }
  const legend = series.length > 1 ? `<div class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>` : ''
  return `${legend}<div class="chart" data-chart='${esc(JSON.stringify(data))}'><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(series.map((s) => s.name).join(', '))}">${grid}${xl}${paths}<line class="xh" x1="0" x2="0" y1="${T}" y2="${H - B}" stroke="var(--text-2)" stroke-width="1" opacity="0"/>${hits}</svg><div class="tip"></div></div>${tableView(labels, series, fmt)}`
}

// Grouped column chart. Same inputs as lineChart.
export function columnChart(id, labels, series, { fmt = num, height = 220 } = {}) {
  const W = 720, H = height, L = 42, R = 12, T = 12, B = 28
  const n = labels.length, k = series.length
  const max = Math.max(1, ...series.flatMap((s) => s.values))
  const yMax = niceMax(max)
  const slot = (W - L - R) / Math.max(1, n)
  const bw = Math.min(24, (slot - 6) / k - 2)
  const y = (v) => T + (H - T - B) * (1 - v / yMax)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax)
  const grid = ticks.map((v) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${compact(v)}</text>`).join('')
  const every = Math.max(1, Math.ceil(n / 8))
  const xl = labels.map((lb, i) => (i % every === 0 || i === n - 1 ? `<text class="ax" x="${L + slot * i + slot / 2}" y="${H - 8}" text-anchor="middle">${esc(lb)}</text>` : '')).join('')
  const bars = labels
    .map((_, i) =>
      series
        .map((s, j) => {
          const v = s.values[i] || 0
          const x0 = L + slot * i + (slot - (bw * k + 2 * (k - 1))) / 2 + j * (bw + 2)
          const h = Math.max(0, y(0) - y(v))
          const rr = Math.min(4, h)
          return v > 0 ? `<path d="M${x0},${y(0)} v-${(h - rr).toFixed(1)} a${rr},${rr} 0 0 1 ${rr},-${rr} h${(bw - 2 * rr).toFixed(1)} a${rr},${rr} 0 0 1 ${rr},${rr} v${(h - rr).toFixed(1)} z" fill="${s.color}"/>` : ''
        })
        .join(''),
    )
    .join('')
  const hits = labels.map((_, i) => `<rect class="hit" data-i="${i}" x="${L + slot * i}" y="${T}" width="${slot}" height="${H - T - B}"/>`).join('')
  const data = { labels, series: series.map((s) => ({ name: s.name, color: s.color, values: s.values })), kind: 'bar', fmt: fmt === money ? 'money' : 'num' }
  const legend = series.length > 1 ? `<div class="legend">${series.map((s) => `<span><i class="sq" style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>` : ''
  return `${legend}<div class="chart" data-chart='${esc(JSON.stringify(data))}'><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(series.map((s) => s.name).join(', '))}">${grid}${xl}${bars}<line class="xh" x1="0" x2="0" y1="${T}" y2="${H - B}" stroke="var(--text-2)" stroke-width="1" opacity="0"/>${hits}</svg><div class="tip"></div></div>${tableView(labels, series, fmt)}`
}

const niceMax = (m) => {
  const p = Math.pow(10, Math.floor(Math.log10(m)))
  const f = m / p
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nf * p
}

const tableView = (labels, series, fmt) =>
  `<details class="tv"><summary>Table view</summary><table><thead><tr><th>Day</th>${series.map((s) => `<th class="r">${esc(s.name)}</th>`).join('')}</tr></thead><tbody>${labels
    .map((l, i) => `<tr><td>${esc(l)}</td>${series.map((s) => `<td class="r">${fmt(s.values[i] || 0)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></details>`

// Horizontal bar list for breakdowns (top N + Other).
export function barList(rows, { max = 8, fmt = num, fill } = {}) {
  if (!rows.length) return `<div class="empty">No data yet</div>`
  const top = rows.slice(0, max)
  const rest = rows.slice(max).reduce((s, r) => s + r.value, 0)
  if (rest > 0) top.push({ name: 'Other', value: rest })
  const m = Math.max(1, ...top.map((r) => r.value))
  return `<div class="bars">${top
    .map((r) => `<div class="bar" title="${esc(r.name)}: ${fmt(r.value)}"><span class="n">${esc(r.name || '(unknown)')}</span><span class="t"><span class="f" style="width:${((r.value / m) * 100).toFixed(1)}%${fill ? `;background:${fill}` : ''}"></span></span><span class="v">${fmt(r.value)}</span></div>`)
    .join('')}</div>`
}

// Funnel: steps [{name,value}] rendered as an ordinal ramp of one hue.
export function funnel(steps, color) {
  const m = Math.max(1, steps[0]?.value || 0)
  const ramp = ['#3987e5', '#256abf', '#184f95']
  return `<div class="bars funnel">${steps
    .map((s, i) => {
      const rate = i === 0 ? '' : ` <span class="pill">${pct(steps[i - 1].value ? s.value / steps[i - 1].value : 0)} of prev</span>`
      return `<div class="bar"><span class="n">${esc(s.name)}${rate}</span><span class="t"><span class="f" style="width:${((s.value / m) * 100).toFixed(1)}%;--fill:${ramp[i] || ramp[2]}"></span></span><span class="v">${num(s.value)}</span></div>`
    })
    .join('')}</div>`
}

export const tile = (label, value, sub = '', accent = '', hero = false) =>
  `<div class="tile${hero ? ' hero' : ''}" style="--accent:${accent || 'var(--line)'}"><div class="l">${esc(label)}</div><div class="v">${value}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>`

export const storeDot = (store) => (store ? `<span class="dot" style="background:${store.color}"></span>${esc(store.name)}` : '<span class="dot" style="background:var(--muted)"></span>Other')

export { money, num, pct, day, when }

// Crosshair + tooltip for every chart on the page (one tooltip, every series).
const SCRIPT = `<script>
(function(){
  document.querySelectorAll('.chart').forEach(function(ch){
    var data=JSON.parse(ch.getAttribute('data-chart'));var svg=ch.querySelector('svg');var tip=ch.querySelector('.tip');var xh=svg.querySelector('.xh');
    var fmt=function(v){return data.fmt==='money'?'$'+Number(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):Number(v).toLocaleString('en-US')};
    function show(i,hit){
      var rows=data.series.map(function(s){var r=document.createElement('div');r.className='r';var l=document.createElement('span');var k=document.createElement('i');k.style.background=s.color;l.appendChild(k);l.appendChild(document.createTextNode(s.name));var b=document.createElement('b');b.textContent=fmt(s.values[i]||0);r.appendChild(l);r.appendChild(b);return r});
      tip.textContent='';var d=document.createElement('div');d.className='d';d.textContent=data.labels[i];tip.appendChild(d);rows.forEach(function(r){tip.appendChild(r)});
      var bb=hit.getBoundingClientRect(),cb=ch.getBoundingClientRect();var cx=bb.left-cb.left+bb.width/2;
      tip.style.display='block';var tw=tip.offsetWidth;tip.style.left=Math.max(0,Math.min(cb.width-tw,cx-tw/2))+'px';tip.style.top=(bb.top-cb.top-8)+'px';
      if(xh){var vb=svg.viewBox.baseVal;var sx=vb.width/svg.getBoundingClientRect().width;var x=(bb.left-svg.getBoundingClientRect().left+bb.width/2)*sx;xh.setAttribute('x1',x);xh.setAttribute('x2',x);xh.setAttribute('opacity','.5')}
    }
    svg.querySelectorAll('.hit').forEach(function(h){h.setAttribute('tabindex','0');['pointermove','pointerenter','focus'].forEach(function(ev){h.addEventListener(ev,function(){show(+h.dataset.i,h)})})});
    ['pointerleave','blur'].forEach(function(ev){svg.addEventListener(ev,function(){tip.style.display='none';if(xh)xh.setAttribute('opacity','0')},true)});
  });
})();
</script>`
