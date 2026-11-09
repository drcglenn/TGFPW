/* Inside the Strain: rendering engine.
   Every frame is a pure function of time, so the film can be scrubbed and
   rendered frame-by-frame to video. Logical canvas is 1600 x 900. */

const W = 1600, H = 900;
const D2R = Math.PI / 180;
const F = {
  display: '"Barlow Condensed","Arial Narrow",sans-serif',
  body: '"Barlow",system-ui,sans-serif',
  mono: '"JetBrains Mono",ui-monospace,monospace'
};
const COL = {
  bg: '#0a0d15',
  fiber: '#d65a6e', regen: '#ef9aa7', necro: '#7c5d6b', band: '#2e0710',
  lamina: '#e8b94a', sat: '#4b8fe8',
  fascia: '#dfe6ee', cap: '#d0243a', nerve: '#f4d63c',
  ca: '#63ff8a', calpain: '#ff6fd0',
  rbc: '#c31d2e', fibrin: '#f3efe6',
  neut: '#efe2c2', m1: '#f28a25', m2: '#3fc46f', fib: '#a174e0',
  col3: '#94d3ff', col1: '#3a6ee0',
  text: '#eef1f6', dim: '#9aa5b8', accent: '#f2b84b',
  HUMAN: '#3fd0b0', ANIMAL: '#f2a33b', THEORY: '#b08cff'
};

/* ---------- math ---------- */
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eo = t => 1 - Math.pow(1 - t, 3);
const elasticOut = t => {
  if (t <= 0) return 0; if (t >= 1) return 1;
  return Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
};
/* fade in at a, out at b */
const win = (t, a, b, f = 0.5) => seg(t, a, a + f) * (1 - seg(t, b - f, b));
function mulberry(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function R(seed) { const r = mulberry(seed); return { f: () => r(), r: (a, b) => a + (b - a) * r() }; }

/* ---------- color ---------- */
function hx(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
const rgbs = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const rgba = (h, a) => rgbs(hx(h), a);
function mixHex(a, b, t) {
  const A = hx(a), B = hx(b); t = clamp(t);
  return '#' + [0, 1, 2].map(i => Math.round(lerp(A[i], B[i], t)).toString(16).padStart(2, '0')).join('');
}
function shade(h, amt, a = 1) { const c = hx(h); const to = amt < 0 ? 0 : 255; const p = Math.abs(amt); return rgbs(c.map(v => v + (to - v) * p), a); }

/* ---------- drawing primitives ---------- */
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, Math.max(0, w), Math.max(0, h), Math.max(0, Math.min(r, w / 2, h / 2))); }
function wrap(ctx, text, maxW) {
  const words = String(text).split(' '); const lines = []; let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line); return lines;
}
function ellipse(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, Math.PI * 2); }
function qpt(p0, p1, p2, t) { const u = 1 - t; return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]; }
function qpath(ctx, p0, p1, p2, g) {
  ctx.beginPath(); ctx.moveTo(p0[0], p0[1]);
  const n = Math.max(2, Math.ceil(24 * g));
  for (let i = 1; i <= n; i++) { const p = qpt(p0, p1, p2, g * i / n); ctx.lineTo(p[0], p[1]); }
}
function smoothClosed(ctx, p) {
  ctx.beginPath(); const n = p.length; const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const s0 = m(p[n - 1], p[0]); ctx.moveTo(s0[0], s0[1]);
  for (let i = 0; i < n; i++) { const nx = m(p[i], p[(i + 1) % n]); ctx.quadraticCurveTo(p[i][0], p[i][1], nx[0], nx[1]); }
  ctx.closePath();
}
function bg(ctx, c1 = '#181521', c2 = '#06080d') {
  ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(800, 430, 60, 800, 430, 950);
  g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

/* A muscle fiber segment seen lengthwise. */
function fiberSeg(ctx, x0, x1, y, h, o = {}) {
  if (x1 - x0 < 1) return;
  const a = o.alpha ?? 1; if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a;
  const base = o.color || COL.fiber;
  const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, shade(base, -0.45)); g.addColorStop(0.3, shade(base, 0.22));
  g.addColorStop(0.62, base); g.addColorStop(1, shade(base, -0.55));
  ctx.fillStyle = g;
  rr(ctx, x0, y - h / 2, x1 - x0, h, o.r ?? h * 0.32); ctx.fill();
  const sa = o.striA ?? 0.5;
  if (sa > 0.01) {
    ctx.save(); ctx.clip();
    const sp = o.sp || 9, ph = o.phase ?? 0;
    ctx.strokeStyle = `rgba(60,6,20,${sa})`; ctx.lineWidth = o.sw || Math.max(1.4, sp * 0.24);
    if (o.dash) ctx.setLineDash([3, 5]);
    ctx.beginPath();
    let x = ph - Math.ceil((ph - x0) / sp) * sp;
    for (; x < x1; x += sp) { const jx = o.dash ? Math.sin(x * 1.7) * 2 : 0; ctx.moveTo(x + jx, y - h / 2); ctx.lineTo(x - jx, y + h / 2); }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }
  if (o.nuc) {
    const mode = o.nucMode || 'edge'; const m = o.nucMid ?? 0;
    o.nuc.forEach((nx, k) => {
      if (nx < x0 + 6 || nx > x1 - 6) return;
      const side = k % 2 ? 1 : -1;
      const ny = mode === 'center' ? y : y + side * (h / 2 - 7) * (1 - m);
      ctx.fillStyle = '#4a1d5c'; ellipse(ctx, nx, ny, o.nucRx || 10, o.nucRy || 4.4); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,255,.25)'; ellipse(ctx, nx - 2, ny - 1, (o.nucRx || 10) * .4, 1.3); ctx.fill();
    });
  }
  ctx.restore();
}
/* Basal lamina: two thin gold lines hugging the fiber, open at torn ends. */
function laminaSeg(ctx, x0, x1, y, h, a = 1, o = {}) {
  if (a <= 0.01 || x1 - x0 < 1) return;
  const off = h / 2 + 5;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = rgba(COL.lamina, o.fill ?? 0.06); ctx.fillRect(x0, y - off, x1 - x0, off * 2);
  ctx.strokeStyle = rgba(COL.lamina, 0.8); ctx.lineWidth = o.lw || 2.2;
  ctx.beginPath(); ctx.moveTo(x0, y - off); ctx.lineTo(x1, y - off); ctx.moveTo(x0, y + off); ctx.lineTo(x1, y + off); ctx.stroke();
  const rag = (x, dir) => {
    ctx.beginPath();
    for (const s of [-1, 1]) {
      ctx.moveTo(x, y + s * off); ctx.lineTo(x + dir * 7, y + s * (off + 6)); ctx.lineTo(x + dir * 3, y + s * (off + 10));
    }
    ctx.stroke();
  };
  if (o.rR) rag(x1, 1); if (o.rL) rag(x0, -1);
  ctx.restore();
}
function satCell(ctx, x, y, glow, side = -1, sc = 1) {
  const g = clamp(glow, 0, 1.8);
  ctx.save();
  if (g > 0.05) { ctx.shadowColor = 'rgba(110,180,255,.95)'; ctx.shadowBlur = 18 * g; }
  ctx.fillStyle = g > 1 ? mixHex('#6fb3ff', '#d6ecff', g - 1) : mixHex('#264878', '#6fb3ff', g);
  ellipse(ctx, x, y, 15 * sc, 5.6 * sc); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = mixHex('#0f2246', '#1d3f84', g * .6); ellipse(ctx, x, y + side * -0.4, 8 * sc, 3.1 * sc); ctx.fill();
  ctx.restore();
}
function blob(ctx, x, y, r, t, seed, amp = 0.16) {
  ctx.beginPath();
  for (let i = 0; i <= 18; i++) {
    const th = i / 18 * Math.PI * 2;
    const rad = r * (1 + amp * Math.sin(3 * th + t * 1.3 + seed) + amp * .6 * Math.sin(5 * th - t * .9 + seed * 2));
    const px = x + Math.cos(th) * rad, py = y + Math.sin(th) * rad;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
/* Macrophage. m = 0 (M1 orange) .. 1 (M2 green). */
function macro(ctx, x, y, r, m, t, seed, o = {}) {
  const c = mixHex(COL.m1, COL.m2, m);
  ctx.save(); ctx.globalAlpha *= (o.alpha ?? 1);
  if (o.glow) { ctx.shadowColor = rgba(c, .9); ctx.shadowBlur = 20 * o.glow; }
  const g = ctx.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r * 1.2);
  g.addColorStop(0, shade(c, .35)); g.addColorStop(1, shade(c, -.25));
  ctx.fillStyle = g; blob(ctx, x, y, r, t, seed); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = shade(c, -.55, .9); ellipse(ctx, x + r * .1, y + r * .05, r * .42, r * .28, seed); ctx.fill();
  const n = o.debris ?? 2;
  for (let k = 0; k < n; k++) { ctx.fillStyle = 'rgba(70,50,55,.85)'; ellipse(ctx, x - r * .45 + k * r * .3, y - r * .35 + (k % 2) * r * .55, r * .13, r * .1); ctx.fill(); }
  ctx.restore();
}
function neut(ctx, x, y, t, seed, a = 1) {
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = COL.neut; blob(ctx, x, y, 9, t * 2, seed, .08); ctx.fill();
  ctx.fillStyle = '#7b4aa8';
  for (let k = 0; k < 3; k++) { const th = seed + k * 2.1; ctx.beginPath(); ctx.arc(x + Math.cos(th) * 3.6, y + Math.sin(th) * 3.6, 2.8, 0, 7); ctx.fill(); }
  ctx.restore();
}
function fibroCell(ctx, x, y, ang, len, a = 1, o = {}) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = o.color || COL.fib;
  ctx.beginPath(); ctx.moveTo(-len, 0); ctx.quadraticCurveTo(0, -11, len, 0); ctx.quadraticCurveTo(0, 11, -len, 0); ctx.fill();
  if (o.actin) {
    ctx.strokeStyle = `rgba(255,70,80,${0.9 * o.actin})`; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-len * .8, -2); ctx.lineTo(len * .8, -2); ctx.moveTo(-len * .7, 2.5); ctx.lineTo(len * .7, 2.5); ctx.stroke();
  }
  ctx.fillStyle = '#4b2a7a'; ellipse(ctx, 0, 0, 7, 3.6); ctx.fill();
  ctx.restore();
}
function debrisChunk(ctx, x, y, s, a, seed) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#6d5560';
  blob(ctx, x, y, s, seed, seed, .3); ctx.fill(); ctx.restore();
}
/* Signal dots travelling along a bowed curve. */
function signal(ctx, x0, y0, x1, y1, t, color, a = 1, bow = 40, n = 5) {
  if (a <= 0.01) return;
  const p1 = [(x0 + x1) / 2 + (y1 - y0) * bow / 200, (y0 + y1) / 2 - Math.abs(x1 - x0) * bow / 200 - bow * .4];
  ctx.save(); ctx.globalAlpha *= a;
  ctx.strokeStyle = rgba(color, .35); ctx.setLineDash([4, 7]); ctx.lineWidth = 1.6;
  qpath(ctx, [x0, y0], p1, [x1, y1], 1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10;
  for (let k = 0; k < n; k++) { const f = ((t * .55 + k / n) % 1); const p = qpt([x0, y0], p1, [x1, y1], f); ctx.beginPath(); ctx.arc(p[0], p[1], 3.2, 0, 7); ctx.fill(); }
  ctx.restore();
}
function ring(ctx, x, y, r, color, a, lw = 3) {
  if (a <= 0.01) return; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, 7); ctx.stroke(); ctx.restore();
}

/* ---------- labels ---------- */
function callout(ctx, txt, bx, by, tx, ty, a = 1, o = {}) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.font = `600 ${o.size || 21}px ${F.body}`;
  const sub = o.sub; let w = ctx.measureText(txt).width;
  if (sub) { ctx.font = `500 16px ${F.mono}`; w = Math.max(w, ctx.measureText(sub).width); }
  w += 24; const h = sub ? 56 : 34;
  const x = o.align === 'right' ? bx - w : o.align === 'center' ? bx - w / 2 : bx; const y = by - h / 2;
  if (tx != null) {
    const ax = clamp(tx, x, x + w), ay = clamp(ty, y, y + h);
    ctx.strokeStyle = 'rgba(238,241,246,.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(tx, ty, 3.6, 0, 7); ctx.fill();
  }
  ctx.fillStyle = 'rgba(8,11,18,.84)'; rr(ctx, x, y, w, h, 6); ctx.fill();
  ctx.strokeStyle = o.color || 'rgba(242,184,75,.75)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = COL.text; ctx.font = `600 ${o.size || 21}px ${F.body}`; ctx.textBaseline = 'middle';
  ctx.fillText(txt, x + 12, sub ? y + 19 : by + 1);
  if (sub) { ctx.fillStyle = COL.dim; ctx.font = `500 16px ${F.mono}`; ctx.fillText(sub, x + 12, y + 41); }
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}
function tagPill(ctx, kind, x, y, a = 1, size = 15) {
  ctx.save(); ctx.globalAlpha *= a;
  ctx.font = `700 ${size}px ${F.mono}`; const label = kind; const w = ctx.measureText(label).width + 18; const h = size + 12;
  ctx.fillStyle = rgba(COL[kind] || COL.accent, .16); rr(ctx, x, y - h / 2, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = COL[kind] || COL.accent; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = COL[kind] || COL.accent; ctx.textBaseline = 'middle'; ctx.fillText(label, x + 9, y + 1); ctx.textBaseline = 'alphabetic';
  ctx.restore(); return w;
}
function bigText(ctx, txt, x, y, size, a = 1, o = {}) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.font = `${o.weight || 700} ${size}px ${o.font || F.display}`;
  ctx.fillStyle = o.color || COL.text; ctx.textAlign = o.align || 'center'; ctx.fillText(txt, x, y); ctx.restore();
}

/* ---------- the injury field (longitudinal view of 7 fibers) ---------- */
const FIELD = { cx: 800, y0: 178, dy: 84, fh: 54 };
const FROWS = [];
for (let i = 0; i < 7; i++) {
  const r = R(101 + i * 7);
  FROWS.push({
    i, y: FIELD.y0 + i * FIELD.dy, j: (i === 0 || i === 6) ? 0 : r.r(-46, 46),
    gw: r.r(180, 240), nz: r.r(100, 132), torn: i >= 1 && i <= 5, lt: [1, 3, 4].includes(i),
    nuc: Array.from({ length: 15 }, (_, k) => -40 + k * 118 + r.r(-25, 25))
  });
}
const CAPS = [];
for (let k = 0; k < 6; k++) { const r = R(301 + k * 13); CAPS.push({ k, y: FIELD.y0 + FIELD.dy / 2 + k * FIELD.dy, j: r.r(-40, 40), torn: k >= 1 && k <= 4, ph: r.r(0, 6) }); }

function F0() {
  return {
    t: 0, stretch: 0, snapped: false, open: 0, tension: 0, flash: 0, bleed: 0, clot: 0, hyp: 0, necro: 0, band: 0, bandFlash: 0,
    cleared: 0, granul: 0, col3: 0, col1: 0, align: 0, braid: 0, myo: 0, mature: 0, fingers: 0, shrink: 0, contract: 0,
    vessels: 0, vegf: 0, prune: 0, o2: 0, vesselGlow: 0, satGlow: 0, shimmer: 0, fasciaTear: 0, gapScale: 1,
    zipper: 0, curl: 0, wall: 0, nerveRegrow: 0
  };
}
function stInjured(t) { const s = F0(); s.t = t; s.snapped = true; s.open = 1; s.fasciaTear = 1; return s; }
function ends(row, s) {
  const c = FIELD.cx + row.j; const half = s.open * row.gw / 2 * s.gapScale; const seam = lerp(30, 16, s.contract);
  return { c, Le: c - half, Re: c + half, Lb: c - half - row.nz, Rb: c + half + row.nz, BL: lerp(c - half, c - seam, s.shrink), BR: lerp(c + half, c + seam, s.shrink) };
}

function drawFasciaBands(ctx, s) {
  const t = s.t;
  for (const [ys, yg] of [[96, 122], [732, 708]]) {
    // gel layer
    const g0 = Math.min(yg, yg + 26), g1 = g0 + 26;
    ctx.fillStyle = 'rgba(170,225,255,.07)'; ctx.fillRect(0, g0, W, g1 - g0);
    const r = R(ys);
    ctx.fillStyle = 'rgba(210,240,255,.55)';
    for (let k = 0; k < 40; k++) { const u = r.f(); const x = ((r.r(0, W) + t * 18 * (u - .5)) % W + W) % W; ctx.beginPath(); ctx.arc(x, g0 + 3 + u * 20, 1.3, 0, 7); ctx.fill(); }
    // sheet
    const tear = s.fasciaTear;
    const parts = tear > 0 ? [[-40, 800 - 26 * tear - 30], [800 + 26 * tear - 10, W + 40]] : [[-40, W + 40]];
    for (const [a, b] of parts) {
      const gr = ctx.createLinearGradient(0, ys, 0, ys + 26);
      gr.addColorStop(0, 'rgba(160,172,190,.85)'); gr.addColorStop(.4, 'rgba(236,242,248,.95)'); gr.addColorStop(1, 'rgba(130,142,162,.85)');
      ctx.fillStyle = gr; rr(ctx, a, ys, b - a, 26, 6); ctx.fill();
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(120,130,150,.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); for (let x = a - 40; x < b + 40; x += 14) { ctx.moveTo(x, ys); ctx.lineTo(x + 26, ys + 26); ctx.moveTo(x + 26, ys); ctx.lineTo(x, ys + 26); } ctx.stroke(); ctx.restore();
    }
    if (tear > 0) {
      ctx.strokeStyle = 'rgba(230,236,244,.7)'; ctx.lineWidth = 1.4;
      for (let k = 0; k < 6; k++) {
        const x = 800 - 26 * tear - 30 + k * 2, x2 = 800 + 26 * tear - 10 - k * 2;
        ctx.beginPath(); ctx.moveTo(x, ys + 4 + k * 3.5); ctx.lineTo(x + 10 * tear, ys + 6 + k * 3.5 + 3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x2, ys + 4 + k * 3.5); ctx.lineTo(x2 - 10 * tear, ys + 6 + k * 3.5 - 2); ctx.stroke();
      }
    }
    if (s.tension > 0) { const gg = ctx.createRadialGradient(800, ys + 13, 4, 800, ys + 13, 200); gg.addColorStop(0, `rgba(255,240,200,${.35 * s.tension})`); gg.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = gg; ctx.fillRect(560, ys - 30, 480, 90); }
  }
}
function capPath(ctx, cp, xa, xb) {
  ctx.beginPath();
  for (let x = xa; x <= xb + 9; x += 10) { const xx = Math.min(x, xb); const y = cp.y + 3 * Math.sin(xx / 70 + cp.ph); x === xa ? ctx.moveTo(xx, y) : ctx.lineTo(xx, y); }
}
function drawCap(ctx, cp, s) {
  const c = FIELD.cx + cp.j; const half = s.open * 80 * s.gapScale;
  const spans = (cp.torn && s.snapped) ? [[-40, c - half], [c + half, W + 40]] : [[-40, W + 40]];
  ctx.lineCap = 'round';
  for (const [a, b] of spans) {
    capPath(ctx, cp, a, b); ctx.strokeStyle = '#6a0c19'; ctx.lineWidth = 8; ctx.stroke();
    capPath(ctx, cp, a, b); ctx.strokeStyle = COL.cap; ctx.lineWidth = 4.6; ctx.stroke();
    capPath(ctx, cp, a, b); ctx.strokeStyle = 'rgba(255,150,160,.35)'; ctx.lineWidth = 1.2; ctx.stroke();
    // flowing red cells
    ctx.fillStyle = '#ff8a95';
    for (let k = 0; k < 26; k++) {
      const x = a + (((s.t * 55 + k * 67 + cp.k * 23) % (W + 80)) + (W + 80)) % (W + 80);
      if (x < b - 4 && x > a + 4) { ctx.beginPath(); ctx.arc(x, cp.y + 3 * Math.sin(x / 70 + cp.ph), 1.6, 0, 7); ctx.fill(); }
    }
  }
}
function sproutGeo(cp, s, side) {
  const c = FIELD.cx + cp.j; const half = s.open * 80 * s.gapScale;
  const o = [c + side * half, cp.y + 3 * Math.sin((c + side * half) / 70 + cp.ph)];
  const m = [c + side * 4, cp.y + 14 * Math.sin(cp.k * 1.7)];
  const ctl = [(o[0] + m[0]) / 2, (o[1] + m[1]) / 2 + (cp.k % 2 ? -30 : 30) * side];
  return { o, m, ctl };
}
function drawSprouts(ctx, cp, s) {
  const t = s.t; const A0 = ctx.globalAlpha;
  for (const side of [-1, 1]) {
    const { o, m, ctl } = sproutGeo(cp, s, side);
    const g = clamp(s.vessels * (1.05 + .1 * Math.sin(cp.k * 3 + side)));
    if (g <= 0) continue;
    ctx.save(); ctx.lineCap = 'round';
    if (s.vesselGlow > 0) { ctx.shadowColor = 'rgba(255,90,100,.9)'; ctx.shadowBlur = 16 * s.vesselGlow; }
    qpath(ctx, o, ctl, m, g); ctx.strokeStyle = '#7a0e1c'; ctx.lineWidth = 6; ctx.stroke();
    qpath(ctx, o, ctl, m, g); ctx.strokeStyle = COL.cap; ctx.lineWidth = 3.4; ctx.stroke();
    // a side loop that is later pruned
    const lp = clamp(g * 1.2) * (1 - s.prune);
    if (lp > 0.02) {
      const b0 = qpt(o, ctl, m, .35); const b2 = [b0[0] + side * -6, b0[1] + (cp.k % 2 ? 46 : -46)]; const b1 = [b0[0] - side * 50, (b0[1] + b2[1]) / 2];
      ctx.globalAlpha *= lp; qpath(ctx, b0, b1, b2, clamp(g * 1.3)); ctx.strokeStyle = '#c7303f'; ctx.lineWidth = 2.6; ctx.stroke(); ctx.globalAlpha /= lp;
    }
    ctx.shadowBlur = 0;
    const tip = qpt(o, ctl, m, g);
    if (g < 0.98) {
      ctx.strokeStyle = 'rgba(255,170,175,.9)'; ctx.lineWidth = 1.2;
      for (let k = 0; k < 4; k++) { const th = (side < 0 ? 0 : Math.PI) + (k - 1.5) * .45 + Math.sin(t * 3 + k) * .1; ctx.beginPath(); ctx.moveTo(tip[0], tip[1]); ctx.lineTo(tip[0] + Math.cos(th) * 11, tip[1] + Math.sin(th) * 11); ctx.stroke(); }
      if (s.vegf > 0) {
        ctx.fillStyle = `rgba(255,196,90,${.9 * s.vegf})`;
        for (let k = 0; k < 5; k++) { const f = clamp(g + (1 - g) * ((k / 5 + 1 - (t * .5 % 1)) % 1)); const p = qpt(o, ctl, m, f); ctx.beginPath(); ctx.arc(p[0], p[1] + Math.sin(k + t) * 4, 2.6, 0, 7); ctx.fill(); }
      }
    }
    if (s.o2 > 0) {
      ctx.fillStyle = `rgba(255,255,255,${.8 * s.o2})`;
      for (let k = 0; k < 6; k++) {
        const f = (k + .5) / 6 * g; const p = qpt(o, ctl, m, f); const ph = (t * .6 + k * .37) % 1;
        ctx.globalAlpha = A0 * (1 - ph) * s.o2; ctx.beginPath(); ctx.arc(p[0] + Math.sin(k * 5) * 22 * ph, p[1] + (k % 2 ? 1 : -1) * 30 * ph, 2.2, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = A0;
    }
    ctx.restore();
  }
}
function plugShape(ctx, s) {
  const rows = FROWS.filter(r => r.torn);
  const top = rows[0].y - FIELD.fh / 2 - 28 + 12 * s.contract, bot = rows[rows.length - 1].y + FIELD.fh / 2 + 28 - 12 * s.contract;
  const L = [], Rt = [];
  rows.forEach(r => { const e = ends(r, s); L.push([e.BL, r.y]); Rt.push([e.BR, r.y]); });
  const pts = [[L[0][0] + 8, top], ...L, [L[L.length - 1][0] + 8, bot], [Rt[Rt.length - 1][0] - 8, bot], ...Rt.slice().reverse(), [Rt[0][0] - 8, top]];
  smoothClosed(ctx, pts);
}
function drawPlug(ctx, s) {
  const a = clamp(Math.max(s.bleed * 1.25, s.granul)); if (a <= 0.01) return;
  const t = s.t;
  const base = mixHex(mixHex('#4a0a14', '#b45f6f', s.granul), '#2b3d78', s.col1 * .85 + s.wall * .15);
  ctx.save(); plugShape(ctx, s); ctx.globalAlpha *= a; const A0 = ctx.globalAlpha; ctx.fillStyle = base; ctx.fill(); ctx.clip();
  const X0 = 500, X1 = 1100, Y0 = 190, Y1 = 670;
  if (s.granul > 0) {
    const r = R(77); const ga = .38 * s.granul * (1 - s.col1 * .8);
    for (let i = 0; i < 300; i++) { const x = r.r(X0, X1), y = r.r(Y0, Y1), rad = r.r(1.4, 3.6); ctx.fillStyle = r.f() < .5 ? `rgba(255,205,210,${ga})` : `rgba(80,15,30,${ga})`; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill(); }
  }
  // red cells spilled from torn capillaries
  const rbcA = (1 - s.granul) * clamp(s.bleed * 1.4);
  if (rbcA > 0.01) {
    const r = R(55);
    for (let i = 0; i < 110; i++) {
      const cp = CAPS[1 + (i % 4)]; const side = r.f() < .5 ? -1 : 1; const c = FIELD.cx + cp.j; const half = s.open * 80;
      const sx = c + side * half, sy = cp.y; const fx = FIELD.cx + r.r(-120, 120), fy = cp.y + r.r(-70, 70);
      const d = r.r(0, .55); const p = eo(seg(s.bleed, d, d + .45));
      if (p <= 0) continue;
      const x = lerp(sx, fx, p) + Math.sin(t * .8 + i) * 2, y = lerp(sy, fy, p) + Math.cos(t * .7 + i) * 2;
      ctx.globalAlpha = A0 * rbcA; ctx.fillStyle = COL.rbc; ellipse(ctx, x, y, 6.4, 5.2, i); ctx.fill();
      ctx.fillStyle = '#8c1220'; ellipse(ctx, x, y, 2.8, 2.2, i); ctx.fill();
    }
    ctx.globalAlpha = A0;
  }
  // fibrin mesh
  const fa = s.clot * .62 * (1 - s.granul * .55) * (1 - s.col1);
  if (fa > 0.01) {
    const r = R(91); ctx.strokeStyle = COL.fibrin; ctx.lineWidth = 1.1;
    for (let i = 0; i < 110; i++) {
      const x = r.r(X0 + 60, X1 - 60), y = r.r(Y0, Y1), an = r.r(0, Math.PI), L = r.r(40, 130), d = r.r(0, .6);
      const g = eo(seg(s.clot, d, d + .4)); if (g <= 0) continue;
      ctx.globalAlpha = A0 * fa * (.5 + .5 * r.f());
      const dx = Math.cos(an) * L / 2 * g, dy = Math.sin(an) * L / 2 * g;
      ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.quadraticCurveTo(x + dy * .2, y - dx * .2, x + dx, y + dy); ctx.stroke();
    }
    ctx.globalAlpha = A0;
  }
  // type III collagen: thin wavy, random
  if (s.col3 > 0) {
    const r = R(123); ctx.strokeStyle = COL.col3; ctx.lineWidth = 1.5;
    for (let i = 0; i < 70; i++) {
      const x = r.r(X0 + 90, X1 - 90), y = r.r(Y0, Y1), an = r.r(0, Math.PI), L = r.r(40, 110), d = r.r(0, .7), ph = r.r(0, 6);
      const g = seg(s.col3, d, d + .3); if (g <= 0) continue;
      ctx.globalAlpha = A0 * .85 * g; ctx.beginPath();
      for (let k = 0; k <= 20; k++) { const u = (k / 20 - .5) * L * g; const w = Math.sin(k * .9 + ph) * 3.5; const px = x + Math.cos(an) * u - Math.sin(an) * w, py = y + Math.sin(an) * u + Math.cos(an) * w; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    }
    ctx.globalAlpha = A0;
  }
  // type I collagen: thick ropes that align and braid
  const nRope = 34 + Math.round(40 * s.wall);
  if (s.col1 > 0) {
    const r = R(171);
    for (let i = 0; i < nRope; i++) {
      const x = FIELD.cx + r.r(-130, 130) * (1 + s.wall * .4), y = r.r(Y0 + 10, Y1 - 10), an0 = r.r(-1.4, 1.4), L = r.r(60, 150), d = r.r(0, .65), ph = r.r(0, 6);
      const g = seg(s.col1, d, d + .3); if (g <= 0) continue;
      const an = lerp(an0, an0 * .06, s.align);
      const ca = Math.cos(an), sa = Math.sin(an);
      ctx.globalAlpha = A0 * g;
      for (const strand of (s.braid > 0 ? [-1, 1] : [0])) {
        ctx.beginPath();
        for (let k = 0; k <= 24; k++) {
          const u = (k / 24 - .5) * L; const w = strand * 2.4 * s.braid * Math.sin(k * 1.1 + ph) + (1 - s.align) * Math.sin(k * .5 + ph) * 4;
          const px = x + ca * u - sa * w, py = y + sa * u + ca * w; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.strokeStyle = s.braid > 0 ? (strand < 0 ? '#2f5bc8' : '#5b8cf0') : COL.col1; ctx.lineWidth = s.braid > 0 ? 3 : 4.4; ctx.lineCap = 'round'; ctx.stroke();
      }
    }
    ctx.globalAlpha = A0;
  }
  if (s.shimmer > 0) {
    const x = 450 + ((t * 160) % 800);
    const g = ctx.createLinearGradient(x - 70, 0, x + 70, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, `rgba(255,255,255,${.22 * s.shimmer})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 70, Y0, 140, Y1 - Y0);
  }
  ctx.restore();
}
function regenStyle(s) {
  return { color: mixHex(COL.regen, COL.fiber, s.mature), striA: .12 + .36 * s.mature, sp: 8.5, nucMode: 'edge', nucMid: 1 - s.mature };
}
function drawRow(ctx, row, s) {
  const { fh } = FIELD; const y = row.y; const pre = !s.snapped;
  const h = fh * (1 - .1 * s.stretch * (pre ? 1 : 0)); const sp = 9 * (1 + .55 * s.stretch * (pre ? 1 : 0));
  const e = ends(row, s);
  if (!row.torn || pre) {
    laminaSeg(ctx, -40, W + 40, y, h);
    fiberSeg(ctx, -40, W + 40, y, h, { sp, phase: FIELD.cx, nuc: row.nuc });
    if (row.torn && s.tension > 0) {
      const g = ctx.createRadialGradient(e.c, y, 2, e.c, y, 70);
      g.addColorStop(0, `rgba(255,250,220,${.85 * s.tension})`); g.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = g; ctx.fillRect(e.c - 80, y - 60, 160, 120);
    }
    return;
  }
  if (row.lt) { laminaSeg(ctx, -40, e.Le + 3, y, h, 1, { rR: true }); laminaSeg(ctx, e.Re - 3, W + 40, y, h, 1, { rL: true }); }
  else laminaSeg(ctx, -40, W + 40, y, h, 1, { fill: .09 });
  const front = s.necro * row.nz;
  const hL = e.Le - front, hR = e.Re + front;
  fiberSeg(ctx, -40, hL, y, h, { sp: 8.6, phase: -40, nuc: row.nuc });
  fiberSeg(ctx, hR, W + 40, y, h, { sp: 8.6, phase: W, nuc: row.nuc });
  if (front > 0.5 && s.cleared < 1) {
    const sty = { color: COL.necro, striA: .28, dash: true, sp: 8, alpha: 1 };
    fiberSeg(ctx, hL, lerp(e.Le, hL, s.cleared), y, h * .9, sty);
    fiberSeg(ctx, lerp(e.Re, hR, s.cleared), hR, y, h * .9, sty);
  }
  if (front < 4 && s.myo <= 0) { // frayed fresh ends
    ctx.strokeStyle = 'rgba(240,140,155,.8)'; ctx.lineWidth = 1.3;
    for (let k = 0; k < 7; k++) {
      const yy = y - h / 2 + 6 + k * (h - 12) / 6;
      ctx.beginPath(); ctx.moveTo(e.Le - 2, yy); ctx.lineTo(e.Le + 6 + (k * 7) % 11, yy + Math.sin(k * 3) * 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(e.Re + 2, yy); ctx.lineTo(e.Re - 6 - (k * 5) % 11, yy + Math.cos(k * 3) * 3); ctx.stroke();
    }
  }
  // regenerating fiber inside the tunnel and beyond
  if (s.myo > 0) {
    const st = regenStyle(s); const hh = h * lerp(.6, 1, s.mature);
    const endL = s.myo < 1 ? e.Lb + s.myo * (e.Le - e.Lb) : Math.max(e.Le, e.BL);
    const endR = s.myo < 1 ? e.Rb - s.myo * (e.Rb - e.Re) : Math.min(e.Re, e.BR);
    const nucL = [], nucR = []; for (let x = e.Lb + 16; x < endL - 8; x += 30) nucL.push(x); for (let x = e.Rb - 16; x > endR + 8; x -= 30) nucR.push(x);
    fiberSeg(ctx, e.Lb - 2, endL, y, hh, { ...st, nuc: nucL, nucRx: 8, nucRy: 3.8, nucMode: 'edge' });
    fiberSeg(ctx, endR, e.Rb + 2, y, hh, { ...st, nuc: nucR, nucRx: 8, nucRy: 3.8, nucMode: 'edge' });
  }
  if (s.band > 0) {
    const ba = s.band * (1 - .9 * clamp(s.myo * 1.4));
    if (ba > 0.01) {
      ctx.save(); ctx.globalAlpha *= ba; ctx.fillStyle = COL.band;
      rr(ctx, e.Lb - 6, y - h / 2 - 1, 11, h + 2, 3); ctx.fill(); rr(ctx, e.Rb - 5, y - h / 2 - 1, 11, h + 2, 3); ctx.fill();
      if (s.bandFlash > 0) { ctx.globalAlpha *= s.bandFlash; ctx.fillStyle = '#ffe3c0'; ctx.fillRect(e.Lb - 3, y - h / 2, 5, h); ctx.fillRect(e.Rb - 2, y - h / 2, 5, h); }
      ctx.restore();
    }
  }
}
function drawFingers(ctx, row, s) {
  const e = ends(row, s); const st = regenStyle(s);
  const tipL = e.BL + s.fingers * ((e.c + 16) - e.BL), tipR = e.BR - s.fingers * (e.BR - (e.c - 16));
  const offL = [-17, -3, 11], offR = [-10, 4, 18];
  const one = (x0, x1, y, dir) => {
    if (Math.abs(x1 - x0) < 2) return;
    const a = Math.min(x0, x1), b = Math.max(x0, x1);
    if (s.curl > 0) {
      ctx.save(); ctx.strokeStyle = st.color; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, y); const mid = lerp(x0, x1, .6); ctx.lineTo(mid, y);
      ctx.quadraticCurveTo(x1, y, x1 - dir * 4, y + (y < row.y ? -14 : 14) * s.curl); ctx.stroke(); ctx.restore();
    } else fiberSeg(ctx, a, b, y, 10, { ...st, r: 5, sp: 7, striA: st.striA * .8 });
    if (s.zipper > 0) {
      const tx = x1; ctx.save(); ctx.globalAlpha *= s.zipper; ctx.strokeStyle = '#d7ecff'; ctx.lineWidth = 1.4;
      ctx.beginPath(); for (let k = 0; k <= 4; k++) { const yy = y - 6 + k * 3; ctx.lineTo(tx + dir * ((k % 2) ? 5 : 0), yy); } ctx.stroke(); ctx.restore();
    }
  };
  offL.forEach((o, k) => { const L = (tipL - e.BL) * (.8 + .2 * ((k * 7) % 3) / 2); one(e.BL - 3, e.BL + L, row.y + o, 1); });
  offR.forEach((o, k) => { const L = (e.BR - tipR) * (.8 + .2 * ((k * 5) % 3) / 2); one(e.BR + 3, e.BR - L, row.y + o, -1); });
}
function satList(row, s) {
  const e = ends(row, s);
  if (row.torn && s.snapped) return [[e.Lb - 58, -1], [e.Lb - 196, 1], [e.Rb + 72, -1], [e.Rb + 210, 1]];
  return [[430 + row.j * 3, -1], [1190 - row.j * 2, 1]];
}
function drawSats(ctx, s) {
  for (const row of FROWS) for (const [x, sd] of satList(row, s)) satCell(ctx, x, row.y + sd * (FIELD.fh / 2 - 3), s.satGlow, sd);
}
function nmj(ctx, x, y, a = 1) {
  if (a <= .01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#f6c445'; ellipse(ctx, x, y, 14, 7); ctx.fill();
  ctx.strokeStyle = '#a5761a'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = -2; k <= 2; k++) { ctx.moveTo(x + k * 4.5, y - 4); ctx.lineTo(x + k * 4.5, y + 4); } ctx.stroke(); ctx.restore();
}
function nervePath(ctx, pts, g = 1) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  const n = pts.length - 1; const upto = g * n;
  for (let i = 1; i <= n; i++) {
    if (i - 1 >= upto) break; const f = clamp(upto - (i - 1));
    ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f));
  }
}
function strokeNerve(ctx) { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(40,30,0,.8)'; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = COL.nerve; ctx.lineWidth = 3.2; ctx.stroke(); }
function drawNerve(ctx, s) {
  const r1 = FROWS[1], r2 = FROWS[2], r0 = FROWS[0];
  nervePath(ctx, [[120, 132], [210, 128], [250, 168]]); strokeNerve(ctx);
  nervePath(ctx, [[210, 120], [300, 210], [330, 252]]); strokeNerve(ctx);
  nervePath(ctx, [[300, 210], [280, 290], [292, 336]]); strokeNerve(ctx);
  nmj(ctx, 252, r0.y - 8); nmj(ctx, 332, r1.y - 8); nmj(ctx, 294, r2.y - 8);
  if (s.nerveRegrow > 0) {
    const e = ends(r2, s);
    const tx = e.Lb + 40;
    nervePath(ctx, [[330, 252], [440, 232], [560, 300], [tx - 20, 306], [tx, r2.y - 10]], s.nerveRegrow); strokeNerve(ctx);
    nmj(ctx, tx, r2.y - 8, seg(s.nerveRegrow, .9, 1));
  }
}
function drawField(ctx, s) {
  bg(ctx);
  ctx.strokeStyle = 'rgba(230,210,220,.05)'; ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) { const y = FROWS[i].y - FIELD.fh / 2 - 9; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  drawFasciaBands(ctx, s);
  for (const cp of CAPS) drawCap(ctx, cp, s);
  for (const row of FROWS) drawRow(ctx, row, s);
  if (s.open > 0.01) drawPlug(ctx, s);
  if (s.vessels > 0) for (const cp of CAPS) if (cp.torn) drawSprouts(ctx, cp, s);
  if (s.fingers > 0 || s.shrink > 0) for (const row of FROWS) if (row.torn) drawFingers(ctx, row, s);
  drawSats(ctx, s);
  drawNerve(ctx, s);
  if (s.hyp > 0) {
    const a = s.hyp * (1 - .92 * s.vessels) * .6;
    const g = ctx.createRadialGradient(800, 420, 40, 800, 420, 560);
    g.addColorStop(0, `rgba(70,96,142,${a})`); g.addColorStop(1, 'rgba(70,96,142,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (s.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${s.flash * .85})`; ctx.fillRect(0, 0, W, H); }
}
/* Draw the field scaled into a window (for split screens, insets). */
function fieldIn(ctx, s, x, y, w, h, z, fx = 800, fy = 430) {
  ctx.save(); rr(ctx, x, y, w, h, 10); ctx.clip();
  ctx.translate(x + w / 2, y + h / 2); ctx.scale(z, z); ctx.translate(-fx, -fy);
  drawField(ctx, s); ctx.restore();
}

/* ---------- the runner ---------- */
function limb(P, th, k, L1, L2) {
  const K = [P[0] + L1 * Math.sin(th * D2R), P[1] + L1 * Math.cos(th * D2R)]; const ph = (th - k) * D2R;
  const A = [K[0] + L2 * Math.sin(ph), K[1] + L2 * Math.cos(ph)];
  return { K, A, ph, F: [A[0] + 52 * Math.cos(ph), A[1] - 52 * Math.sin(ph)] };
}
function drawRunner(ctx, o) {
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.s, o.s); ctx.globalAlpha *= (o.alpha ?? 1);
  const P = [0, 0]; const lean = o.lean ?? 12;
  const S = [250 * Math.sin(lean * D2R), -250 * Math.cos(lean * D2R)];
  const ln = (a, b, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
  const arm = (al) => { const E = [S[0] + 118 * Math.sin(al * D2R), S[1] + 118 * Math.cos(al * D2R)]; const fa = (al + 95) * D2R; return { E, Hd: [E[0] + 105 * Math.sin(fa), E[1] + 105 * Math.cos(fa)] }; };
  const dark = '#1b2438', body = '#2c3a58', rim = '#7186b3';
  const B = limb(P, o.hipB, o.kneeB, 230, 220);
  const aB = arm(o.armB);
  for (const [w, c] of [[50, '#3a4a6c'], [44, dark]]) { ln(P, B.K, w, c); ln(B.K, B.A, w - 12, c); ln(B.A, B.F, w - 26, c); ln(S, aB.E, w - 18, c); ln(aB.E, aB.Hd, w - 22, c); }
  for (const [w, c] of [[78, rim], [72, body]]) ln(P, S, w, c);
  ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(S[0] + 14, S[1] - 58, 38, 0, 7); ctx.fill();
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(S[0] + 14, S[1] - 58, 35, 0, 7); ctx.fill();
  const Fr = limb(P, o.hipF, o.kneeF, 230, 220);
  for (const [w, c] of [[54, rim], [48, body]]) { ln(P, Fr.K, w, c); ln(Fr.K, Fr.A, w - 12, c); ln(Fr.A, Fr.F, w - 26, c); }
  // hamstring on the posterior thigh
  const th = o.hipF * D2R; const d = [Math.sin(th), Math.cos(th)], n = [-Math.cos(th), Math.sin(th)];
  const h0 = [P[0] + d[0] * 26 + n[0] * 14, P[1] + d[1] * 26 + n[1] * 14], h2 = [Fr.K[0] - d[0] * 18 + n[0] * 12, Fr.K[1] - d[1] * 18 + n[1] * 12];
  const h1 = [(h0[0] + h2[0]) / 2 + n[0] * 12, (h0[1] + h2[1]) / 2 + n[1] * 12];
  if (o.ham > 0) {
    ctx.save(); ctx.shadowColor = 'rgba(255,60,70,.9)'; ctx.shadowBlur = 30 * o.ham;
    qpath(ctx, h0, h1, h2, 1); ctx.strokeStyle = mixHex('#7a2433', '#ff4d5e', o.ham); ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
  }
  if (o.scar > 0) {
    const p = qpt(h0, h1, h2, .3);
    ctx.save(); ctx.shadowColor = 'rgba(120,190,255,1)'; ctx.shadowBlur = 26; ctx.strokeStyle = `rgba(150,205,255,${o.scar})`; ctx.lineWidth = 3;
    ellipse(ctx, p[0], p[1], 20, 9, th + Math.PI / 2); ctx.stroke(); ctx.restore();
  }
  const aF = arm(o.armF);
  for (const [w, c] of [[38, rim], [32, body]]) { ln(S, aF.E, w, c); ln(aF.E, aF.Hd, w - 4, c); }
  ctx.restore();
  return { P, hip: [o.x, o.y], ham: [o.x + qpt(h0, h1, h2, .3)[0] * o.s, o.y + qpt(h0, h1, h2, .3)[1] * o.s] };
}
function runCycle(ph) {
  const leg = p => ({ th: 18 + 42 * Math.sin(p), k: 14 + 100 * Math.pow(Math.max(0, Math.cos(p - .35)), 1.4) });
  const A = leg(ph), B = leg(ph + Math.PI);
  return { hipF: A.th, kneeF: A.k, hipB: B.th, kneeB: B.k, armF: -10 - 45 * Math.sin(ph), armB: -10 + 45 * Math.sin(ph), bob: 8 * Math.cos(2 * ph) };
}
