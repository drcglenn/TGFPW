/* Patched, Not Rebuilt: ligament engine. Loads after film-core.js (the muscle engine),
   reusing its math, color, label, runner and muscle-field helpers. */

const LC = {
  coll: '#eee1bf', collHi: '#fbf3dc', crimp: 'rgba(130,100,55,.55)',
  vessel: '#d8263c', nerve: '#f4d63c', blood: '#5a0a15', fibrin: '#f5f1e8',
  neut: '#a54fe0', m1: '#e23a45', m2: '#3fc46f', fib: '#f08a30', col3: '#f7e58c', col1: '#e2a523',
  tcell: '#5aa0ff', plt: '#f3c9d3', syn: '#f1cf5c', gran: '#b96a76', scar: '#e6d29c', bone: '#e8dfcb', boneLo: '#a99d82'
};
Object.assign(COL, { 'MODEL/THEORY': COL.THEORY, 'MIXED/ANIMAL': COL.ANIMAL, 'ANIMAL/LIMITED HUMAN': COL.ANIMAL, 'HUMAN · GUIDELINE': COL.HUMAN });

/* ---------- ligament field: 6 collagen bundles, epiligament above and below ---------- */
const LIG = { cx: 800, y0: 296, dy: 56, bh: 46, top: [206, 262], bot: [606, 662] };
const LROWS = [];
for (let i = 0; i < 6; i++) { const r = R(1000 + i * 11); LROWS.push({ i, y: LIG.y0 + i * LIG.dy, j: r.r(-30, 30), gw: r.r(120, 165), k: [2, 0, 4, 1, 5, 3][i], ph: r.r(0, 6) }); }
const LCELLS = []; { const r = R(77); for (let i = 0; i < 22; i++) { const row = i % 5; LCELLS.push({ x: r.r(30, 1570), y: LROWS[row].y + LIG.dy / 2, seed: r.r(0, 6) }); } }
const EPICELLS = []; { const r = R(78); for (let i = 0; i < 12; i++) EPICELLS.push({ x: r.r(60, 1540), y: i % 2 ? r.r(615, 652) : r.r(215, 252), seed: r.r(0, 6) }); }
const RECEPT = [[210, 1], [470, 3], [700, 0], [860, 4], [1010, 2], [1240, 4], [1450, 1]].map(([x, row], i) => ({ x, y: LROWS[row].y, i }));
const DIPS = [[250, -1], [610, -1], [1180, -1], [1430, -1], [380, 1], [1050, 1], [1320, 1]];

function LF0() {
  return {
    t: 0, crimp: 1, stretch: 0, tension: 0, tearP: -1, torn: null, epiTear: 0, bleed: 0, clot: 0, cellDeath: 0, deadClear: 0,
    plt: 0, gf: 0, granul: 0, granEdge: 0, vessels: 0, retract: 0, col3: 0, col1End: 0, col1: 0, align: 0, braid: 0, contract: 0,
    recSig: 1, scarRecept: 1, spurt: 0, flash: 0, gapScale: 1, epiShift: 0, cells: 1, healed: 0
  };
}
function lInj(t) { const s = LF0(); s.t = t; s.tearP = 2; s.crimp = .3; s.epiTear = 1; s.bleed = 1; s.cellDeath = 1; return s; }
function isTorn(row, s) { return s.torn ? s.torn.includes(row.i) : true; }
function lEnds(row, s) {
  if (!isTorn(row, s) || s.tearP < row.k * .1) return null;
  const c = LIG.cx + row.j; const op = elasticOut(clamp((s.tearP - row.k * .1) / .3));
  const half = op * row.gw / 2 * s.gapScale * (1 - .18 * s.contract);
  return { c, Le: c - half, Re: c + half, op };
}
function bundle(ctx, x0, x1, y, h, crimp, o = {}) {
  if (x1 - x0 < 1) return;
  ctx.save(); ctx.globalAlpha *= (o.alpha ?? 1);
  const col = o.color || LC.coll;
  const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, shade(col, -.38)); g.addColorStop(.3, shade(col, .28)); g.addColorStop(.65, col); g.addColorStop(1, shade(col, -.48));
  ctx.fillStyle = g; rr(ctx, x0, y - h / 2, x1 - x0, h, o.r ?? 7); ctx.fill();
  ctx.save(); ctx.clip();
  const amp = 5 * crimp, wl = 46, n = Math.max(3, Math.round(h / 6));
  ctx.strokeStyle = o.line || LC.crimp; ctx.lineWidth = 1.3; ctx.beginPath();
  for (let k = 1; k < n; k++) {
    const yy = y - h / 2 + k * h / n;
    for (let x = x0; x <= x1 + 8; x += 8) { const py = yy + amp * Math.sin(x / wl * 2 * Math.PI + (o.ph || 0)); x === x0 ? ctx.moveTo(x, py) : ctx.lineTo(x, py); }
  }
  ctx.stroke(); ctx.restore(); ctx.restore();
}
function mop(ctx, x, y, h, dir, fray, seed, t) {
  if (fray <= 0) return;
  const r = R(seed); ctx.save(); ctx.strokeStyle = LC.collHi; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  for (let k = 0; k < 13; k++) {
    const yy = y - h / 2 + 3 + k * (h - 6) / 12; const L = (10 + r.f() * 30) * fray; const an = (r.f() - .5) * 1.2 * fray; const wob = Math.sin(t * 1.5 + k) * 2 * fray;
    ctx.beginPath(); ctx.moveTo(x - dir * 3, yy); ctx.quadraticCurveTo(x + dir * L * .5, yy + an * L * .3 + wob, x + dir * L * Math.cos(an), yy + L * Math.sin(an) + wob); ctx.stroke();
  }
  ctx.restore();
}
function epiBand(ctx, y0, y1, s, side) {
  const t = s.t, gw = 72 * s.epiTear;
  const parts = s.epiTear > 0 ? [[-40, LIG.cx - gw], [LIG.cx + gw, W + 40]] : [[-40, W + 40]];
  const vy = side < 0 ? y0 + 18 : y1 - 18, ny = side < 0 ? y0 + 38 : y1 - 38;
  for (const [a, b] of parts) {
    ctx.save(); rr(ctx, a, y0, b - a, y1 - y0, 12);
    ctx.fillStyle = 'rgba(143,163,189,.26)'; ctx.fill(); ctx.strokeStyle = 'rgba(190,205,224,.55)'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.clip();
    ctx.strokeStyle = 'rgba(205,218,235,.16)'; ctx.lineWidth = 1; ctx.beginPath();
    const off = ((s.epiShift * side % 22) + 22) % 22;
    for (let x = a - 60 + off; x < b + 60; x += 22) { ctx.moveTo(x, y0); ctx.lineTo(x + 34, y1); }
    ctx.stroke();
    const wav = (yy, amp, ph) => { ctx.beginPath(); for (let x = a; x <= b + 9; x += 10) { const xx = Math.min(x, b); const py = yy + amp * Math.sin(xx / 80 + ph) + 0; x === a ? ctx.moveTo(xx, py) : ctx.lineTo(xx, py); } };
    ctx.lineCap = 'round';
    wav(vy, 4, side); ctx.strokeStyle = '#6a0c19'; ctx.lineWidth = 7; ctx.stroke(); wav(vy, 4, side); ctx.strokeStyle = LC.vessel; ctx.lineWidth = 4.2; ctx.stroke();
    wav(ny, 3, side * 2); ctx.strokeStyle = 'rgba(40,30,0,.7)'; ctx.lineWidth = 4.5; ctx.stroke(); wav(ny, 3, side * 2); ctx.strokeStyle = LC.nerve; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.fillStyle = '#ff8a95';
    for (let k = 0; k < 22; k++) { const x = a + ((t * 50 + k * 71) % (W + 80)); if (x > a + 4 && x < b - 4) { ctx.beginPath(); ctx.arc(x, vy + 4 * Math.sin(x / 80 + side), 1.6, 0, 7); ctx.fill(); } }
    ctx.restore();
  }
  // backup (progenitor) cells living in the sheath
  if (s.cells > 0) for (const c of EPICELLS) if ((c.y < 400) === (side < 0) && Math.abs(c.x - LIG.cx) > gw + 10) fibroCell(ctx, c.x, c.y, 0, 11, .75 * s.cells, { color: '#c98a52' });
  // bursting vessel ends
  if (s.epiTear > 0 && s.spurt > 0) {
    const ba = s.spurt;
    ctx.save(); ctx.fillStyle = LC.vessel;
    for (const d of [-1, 1]) for (let k = 0; k < 9; k++) {
      const f = (t * .7 + k / 9) % 1; const x = LIG.cx + d * gw - d * f * 60 + Math.sin(k * 3) * 10, y = vy - side * f * 70;
      ctx.globalAlpha = (1 - f) * ba; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
}
function drawDips(ctx, s) {
  ctx.save(); ctx.lineCap = 'round';
  for (const [x, side] of DIPS) {
    if (s.epiTear > 0 && Math.abs(x - LIG.cx) < 200) continue;
    const y0 = side < 0 ? LIG.top[1] - 6 : LIG.bot[0] + 6, y1 = y0 - side * 46;
    ctx.strokeStyle = 'rgba(216,38,60,.85)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + 14, (y0 + y1) / 2, x + 4, y1); ctx.stroke();
  }
  ctx.restore();
}
function receptor(ctx, x, y, glow, a = 1) {
  if (a <= .01) return;
  ctx.save(); ctx.globalAlpha *= a;
  if (glow > .1) { ctx.shadowColor = '#fff27a'; ctx.shadowBlur = 18 * glow; }
  ctx.strokeStyle = mixHex('#8a7a2a', '#fff27a', glow); ctx.lineWidth = 2;
  ellipse(ctx, x, y, 11, 6); ctx.stroke(); ellipse(ctx, x, y, 5, 2.6); ctx.stroke();
  ctx.restore();
}
function drawReceptors(ctx, s) {
  const t = s.t;
  for (const r of RECEPT) {
    const inScar = Math.abs(r.x - LIG.cx) < 120 && s.tearP > 0;
    if (inScar && s.healed <= 0 && s.col1 <= 0) continue;
    const dimA = inScar ? s.scarRecept : 1; if (inScar && r.i % 2 && s.scarRecept < .7) continue;
    const blink = Math.max(0, Math.sin(t * 2.6 + r.i * 1.7));
    const g = (.25 + .75 * blink) * dimA;
    ctx.strokeStyle = `rgba(244,214,60,${.45 * dimA})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(r.x + 8, r.y - 3); ctx.quadraticCurveTo(r.x + 30, r.y - 60, r.x + 20, LIG.top[1] - 4); ctx.stroke();
    receptor(ctx, r.x, r.y, g, .55 + .45 * dimA);
    if (s.recSig > 0 && blink > .2) { const f = (t * .9 + r.i * .3) % 1; const p = qpt([r.x + 8, r.y - 3], [r.x + 30, r.y - 60], [r.x + 20, LIG.top[1] - 4], f); ctx.fillStyle = `rgba(255,246,170,${s.recSig * dimA})`; ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, 7); ctx.fill(); }
  }
}
function lPlugPath(ctx, s) {
  const rows = LROWS.filter(r => lEnds(r, s)); if (!rows.length) return false;
  const L = [], Rt = [];
  rows.forEach(r => { const e = lEnds(r, s); L.push([e.Le, r.y]); Rt.push([e.Re, r.y]); });
  const top = rows[0].y - LIG.bh / 2 - 16 + 6 * s.contract, bot = rows[rows.length - 1].y + LIG.bh / 2 + 16 - 6 * s.contract;
  smoothClosed(ctx, [[L[0][0] + 6, top], ...L, [L[L.length - 1][0] + 6, bot], [Rt[Rt.length - 1][0] - 6, bot], ...Rt.slice().reverse(), [Rt[0][0] - 6, top]]);
  return true;
}
function drawLPlug(ctx, s) {
  const a = clamp(Math.max(s.bleed * 1.3, s.granul, s.col1)); if (a <= .01) return;
  ctx.save(); if (!lPlugPath(ctx, s)) { ctx.restore(); return; }
  ctx.globalAlpha *= a; const A0 = ctx.globalAlpha; const t = s.t;
  ctx.fillStyle = mixHex(LC.blood, '#741826', s.clot * .4); ctx.fill(); ctx.clip();
  const X0 = 600, X1 = 1000, Y0 = 250, Y1 = 640, cy = 436, hh = 175;
  const gcol = mixHex(LC.gran, LC.scar, Math.max(s.col1 * .9, s.healed));
  if (s.granul > 0) {
    if (s.granEdge) {
      const reach = (hh + 20) * s.granul;
      for (const d of [-1, 1]) {
        const y0 = cy + d * (hh + 20), y1 = cy + d * (hh + 20 - reach);
        const g = ctx.createLinearGradient(0, y0, 0, y1 + -d * -26); g.addColorStop(0, gcol); g.addColorStop(Math.max(0, 1 - 26 / Math.max(26, reach)), gcol); g.addColorStop(1, rgba(gcol, 0));
        ctx.fillStyle = g; ctx.fillRect(0, Math.min(y0, y1 + d * -26), W, Math.abs(y1 - y0) + 26);
      }
    } else { ctx.globalAlpha = A0 * s.granul; ctx.fillStyle = gcol; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = A0; }
    const r = R(91); const ga = .35 * s.granul * (1 - Math.max(s.col1, s.healed) * .8);
    for (let i = 0; i < 240; i++) { const x = r.r(X0, X1), y = r.r(Y0, Y1), rad = r.r(1.4, 3.4); ctx.fillStyle = r.f() < .5 ? `rgba(255,215,215,${ga})` : `rgba(90,20,35,${ga})`; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill(); }
  }
  const fa = s.clot * .62 * (1 - s.granul * .5) * (1 - s.col1);
  if (fa > .01) {
    const r = R(92); ctx.strokeStyle = LC.fibrin; ctx.lineWidth = 1.1;
    for (let i = 0; i < 90; i++) {
      const x = r.r(X0 + 80, X1 - 80), y = r.r(Y0, Y1), an = r.r(0, Math.PI), L = r.r(36, 110), d = r.r(0, .6);
      const g = eo(seg(s.clot, d, d + .4)); if (g <= 0) continue;
      ctx.globalAlpha = A0 * fa * (.5 + .5 * r.f());
      const dx = Math.cos(an) * L / 2 * g, dy = Math.sin(an) * L / 2 * g;
      ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.quadraticCurveTo(x + dy * .2, y - dx * .2, x + dx, y + dy); ctx.stroke();
    }
    ctx.globalAlpha = A0;
  }
  if (s.plt > 0) {
    const r = R(93);
    for (let i = 0; i < 46; i++) {
      const x = r.r(X0 + 100, X1 - 100), y = r.r(Y0 + 20, Y1 - 20), d = r.r(0, .7), bt = r.r(0, .8);
      const p = eo(seg(s.plt, d, d + .3)); if (p <= 0) continue;
      const burst = seg(s.gf, bt, bt + .2);
      if (burst < 1) { ctx.globalAlpha = A0 * p * (1 - burst); ctx.fillStyle = LC.plt; ellipse(ctx, x, y, 5 * (1 + burst * .5), 3.4); ctx.fill(); }
      if (burst > 0 && burst < 1) ring(ctx, x, y, 4 + burst * 16, '#fff2a8', (1 - burst) * A0, 1.6);
    }
    ctx.globalAlpha = A0;
  }
  if (s.col3 > 0) {
    const r = R(123); ctx.strokeStyle = LC.col3; ctx.lineWidth = 1.4;
    for (let i = 0; i < 80; i++) {
      const x = r.r(X0 + 110, X1 - 110), y = r.r(Y0, Y1), an0 = r.r(0, Math.PI), L = r.r(36, 100), d = r.r(0, .7), ph = r.r(0, 6);
      const g = seg(s.col3, d, d + .3); if (g <= 0) continue;
      const an = lerp(an0, an0 > Math.PI / 2 ? Math.PI : 0, s.align);
      ctx.globalAlpha = A0 * .85 * g; ctx.beginPath();
      for (let k = 0; k <= 18; k++) { const u = (k / 18 - .5) * L * g; const w = Math.sin(k * .9 + ph) * 3.5 * (1 - .6 * s.align); const px = x + Math.cos(an) * u - Math.sin(an) * w, py = y + Math.sin(an) * u + Math.cos(an) * w; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    }
    ctx.globalAlpha = A0;
  }
  const rope = (x, y, L, an, g, ph, braid) => {
    const ca = Math.cos(an), sa = Math.sin(an);
    ctx.globalAlpha = A0 * g; ctx.lineCap = 'round';
    const strands = braid > 0 ? [-1, 1] : [0];
    for (const st of strands) {
      ctx.beginPath();
      for (let k = 0; k <= 20; k++) { const u = (k / 20 - .5) * L; const w = st * 2.6 * braid * Math.sin(k * 1.1 + ph); const px = x + ca * u - sa * w, py = y + sa * u + ca * w; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.strokeStyle = st < 0 ? '#c88d16' : st > 0 ? '#f2c45a' : LC.col1; ctx.lineWidth = braid > 0 ? 3 : 4.2; ctx.stroke();
    }
    if (braid > .3) {
      ctx.strokeStyle = `rgba(255,236,170,${braid})`; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let k = 2; k < 20; k += 3) { const u = (k / 20 - .5) * L; ctx.moveTo(x + ca * u + sa * 4, y + sa * u - ca * 4); ctx.lineTo(x + ca * u - sa * 4, y + sa * u + ca * 4); }
      ctx.stroke();
    }
  };
  if (s.col1End > 0) {
    const r = R(150);
    for (const row of LROWS) { const e = lEnds(row, s); if (!e) continue; for (const d of [-1, 1]) for (let k = 0; k < 2; k++) { const g = seg(s.col1End, r.f() * .5, 1); const x0 = d < 0 ? e.Le : e.Re; rope(x0 - d * 22, row.y + (k ? 10 : -10), 44, r.r(-.15, .15), g * (1 - s.col1 * .6), r.r(0, 6), 0); } }
  }
  if (s.col1 > 0) {
    const r = R(171);
    for (let i = 0; i < 40; i++) {
      const x = LIG.cx + r.r(-90, 90), y = r.r(Y0 + 10, Y1 - 10), an0 = r.r(-1.3, 1.3), L = r.r(50, 120), d = r.r(0, .65), ph = r.r(0, 6);
      const g = seg(s.col1, d, d + .3); if (g <= 0) continue;
      rope(x, y, L, lerp(an0, an0 * .06, s.align), g, ph, s.braid);
    }
    ctx.globalAlpha = A0;
  }
  if (s.healed > 0) {
    ctx.globalAlpha = A0 * s.healed * .5; ctx.strokeStyle = 'rgba(160,125,70,.6)'; ctx.lineWidth = 1.2;
    for (let k = 0; k < 18; k++) { const y = Y0 + 12 + k * 21; ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y + Math.sin(k) * 3); ctx.stroke(); }
    ctx.globalAlpha = A0;
  }
  ctx.restore();
}
function sproutPath(x, side, k) { const y0 = side < 0 ? LIG.top[1] - 4 : LIG.bot[0] + 4; const y1 = 436 + side * (14 + k * 10); return { p0: [x, y0], p1: [x + (k % 2 ? 40 : -40), (y0 + y1) / 2], p2: [x + (k % 2 ? -10 : 12), y1] }; }
function drawLSprouts(ctx, s) {
  if (s.vessels <= 0) return;
  const xs = [-62, -22, 24, 64]; ctx.save(); ctx.lineCap = 'round';
  xs.forEach((dx, k) => {
    for (const side of [-1, 1]) {
      const g = clamp(s.vessels * (1.1 - .08 * k)) * (1 - .65 * s.retract); if (g <= 0) continue;
      const { p0, p1, p2 } = sproutPath(LIG.cx + dx + side * 8, side, k);
      ctx.globalAlpha = 1 - .7 * s.retract;
      qpath(ctx, p0, p1, p2, g); ctx.strokeStyle = '#7a0e1c'; ctx.lineWidth = 6; ctx.stroke();
      qpath(ctx, p0, p1, p2, g); ctx.strokeStyle = '#ff3349'; ctx.lineWidth = 3.4; ctx.stroke();
      if (g > .45) { const b0 = qpt(p0, p1, p2, .5); const b2 = [b0[0] + (k % 2 ? 34 : -34), b0[1] + side * 26]; qpath(ctx, b0, [(b0[0] + b2[0]) / 2, b0[1]], b2, clamp((g - .45) / .5)); ctx.strokeStyle = '#ff3349'; ctx.lineWidth = 2.4; ctx.stroke(); }
      if (g < .98) { const tp = qpt(p0, p1, p2, g); ctx.strokeStyle = 'rgba(255,170,175,.9)'; ctx.lineWidth = 1.1; for (let q = 0; q < 4; q++) { const th = (side < 0 ? Math.PI / 2 : -Math.PI / 2) + (q - 1.5) * .45; ctx.beginPath(); ctx.moveTo(tp[0], tp[1]); ctx.lineTo(tp[0] + Math.cos(th) * 10, tp[1] + Math.sin(th) * 10); ctx.stroke(); } }
    }
  });
  ctx.restore();
}
function drawResident(ctx, s) {
  if (s.cells <= 0) return;
  for (const c of LCELLS) {
    const near = s.tearP > 0 && Math.abs(c.x - LIG.cx) < 260;
    const d = near ? s.cellDeath * (1 - Math.abs(c.x - LIG.cx) / 400) : 0;
    const inGap = s.tearP > 0 && Math.abs(c.x - LIG.cx) < 95;
    if (inGap) continue;
    const a = (1 - (near ? s.deadClear : 0)) * s.cells; if (a <= .02) continue;
    const dd = clamp(d * 1.6);
    fibroCell(ctx, c.x, c.y, 0, lerp(14, 8, dd), a * lerp(.95, .6, dd), { color: mixHex('#d98a48', '#6f6a6a', dd) });
  }
}
function drawLigField(ctx, s) {
  bg(ctx, '#171a24', '#06080d');
  epiBand(ctx, LIG.top[0], LIG.top[1], s, -1); epiBand(ctx, LIG.bot[0], LIG.bot[1], s, 1);
  drawDips(ctx, s);
  const pre = s.tearP < 0;
  for (const row of LROWS) {
    const h = LIG.bh * (1 - .08 * s.stretch) * (s.healed && false ? 1 : 1);
    const e = lEnds(row, s);
    if (!e) {
      bundle(ctx, -40, W + 40, row.y, h, s.crimp, { ph: row.ph });
      if (s.tension > 0 && isTorn(row, s)) { const c = LIG.cx + row.j; const g = ctx.createRadialGradient(c, row.y, 2, c, row.y, 70); g.addColorStop(0, `rgba(255,250,220,${.8 * s.tension})`); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.fillRect(c - 80, row.y - 60, 160, 120); }
      continue;
    }
    bundle(ctx, -40, e.Le, row.y, h, s.crimp, { ph: row.ph });
    bundle(ctx, e.Re, W + 40, row.y, h, s.crimp, { ph: row.ph + 1 });
    const fray = (1 - s.col1 * .8) * (1 - s.healed);
    mop(ctx, e.Le, row.y, h, 1, fray * e.op, 500 + row.i, s.t); mop(ctx, e.Re, row.y, h, -1, fray * e.op, 600 + row.i, s.t);
  }
  drawResident(ctx, s);
  drawReceptors(ctx, s);
  if (s.tearP > 0) drawLPlug(ctx, s);
  drawLSprouts(ctx, s);
  if (s.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${s.flash * .85})`; ctx.fillRect(0, 0, W, H); }
}
function ligFieldIn(ctx, s, x, y, w, h, z, fx = 800, fy = 436, over) {
  ctx.save(); rr(ctx, x, y, w, h, 10); ctx.clip();
  ctx.translate(x + w / 2, y + h / 2); ctx.scale(z, z); ctx.translate(-fx, -fy);
  drawLigField(ctx, s); if (over) over(ctx); ctx.restore();
}
/* screen point for a field point inside ligFieldIn */
const fpt = (px, py, x, y, w, h, z, fx = 800, fy = 436) => [x + w / 2 + (px - fx) * z, y + h / 2 + (py - fy) * z];

/* ---------- cells ---------- */
function pacRed(ctx, x, y, r, t, seed, m = 0, a = 1) {
  ctx.save(); ctx.globalAlpha *= a;
  if (m < .5) {
    const mouth = (.18 + .2 * Math.abs(Math.sin(t * 7 + seed))) * (1 - m * 2);
    const dir = seed % 2 ? 0 : Math.PI;
    ctx.fillStyle = mixHex(LC.m1, LC.m2, m); ctx.shadowColor = rgba(LC.m1, .8); ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, dir + mouth * Math.PI, dir - mouth * Math.PI + Math.PI * 2); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = mixHex(LC.m1, LC.m2, m); ctx.shadowColor = rgba(LC.m2, .8); ctx.shadowBlur = 10;
    blob(ctx, x, y, r, t, seed, .14); ctx.fill();
  }
  ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(30,10,15,.55)'; ellipse(ctx, x + 2, y - 2, r * .32, r * .22); ctx.fill();
  ctx.restore();
}
function dot(ctx, x, y, r, c, a = 1, glow = 0) { if (a <= .01) return; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = c; if (glow) { ctx.shadowColor = c; ctx.shadowBlur = glow; } ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore(); }
function counter(ctx, txt, sub, x = 1290) {
  ctx.save(); ctx.fillStyle = 'rgba(8,11,18,.86)'; rr(ctx, x, 18, 270, 76, 12); ctx.fill(); ctx.strokeStyle = 'rgba(242,184,75,.5)'; ctx.lineWidth = 1.2; ctx.stroke();
  bigText(ctx, txt, x + 135, 72, txt.length > 8 ? 36 : 44, 1, { font: F.mono, weight: 700, color: COL.accent });
  if (sub) bigText(ctx, sub, x + 135, 90, 13, 1, { font: F.mono, weight: 500, color: COL.dim });
  ctx.restore();
}

/* ---------- the knee (front view; viewer's left = medial) ---------- */
function rot(p, c, deg) { const a = -deg * D2R, x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)]; }
function ligBand(ctx, p0, p1, w, crimp, tear, t, o = {}) {
  const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
  ctx.save(); ctx.translate(p0[0], p0[1]); ctx.rotate(an);
  if (o.glow > 0) { ctx.shadowColor = 'rgba(255,90,90,.9)'; ctx.shadowBlur = 26 * o.glow; }
  const gap = (o.gap ?? 26) * tear, m = L * (o.at ?? .5);
  if (tear <= 0) bundle(ctx, 0, L, 0, w, crimp, { r: w / 2, color: o.color });
  else { bundle(ctx, 0, m - gap / 2, 0, w, crimp, { r: w / 2, color: o.color }); bundle(ctx, m + gap / 2, L, 0, w, crimp, { r: w / 2, color: o.color }); ctx.shadowBlur = 0; mop(ctx, m - gap / 2, 0, w, 1, tear, 41, t); mop(ctx, m + gap / 2, 0, w, -1, tear, 42, t); }
  ctx.restore();
}
function knee(ctx, o) {
  const t = o.t || 0;
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.s, o.s);
  const bone = path => { const g = ctx.createLinearGradient(-200, 0, 200, 0); g.addColorStop(0, LC.boneLo); g.addColorStop(.5, LC.bone); g.addColorStop(1, LC.boneLo); ctx.fillStyle = g; path(); ctx.fill(); ctx.strokeStyle = 'rgba(80,70,50,.7)'; ctx.lineWidth = 2; ctx.stroke(); };
  if (o.swell > 0) { const g = ctx.createRadialGradient(0, 0, 40, 0, 0, 260 + 70 * o.swell); g.addColorStop(0, `rgba(255,120,110,${.3 * o.swell})`); g.addColorStop(1, 'rgba(255,120,110,0)'); ctx.fillStyle = g; ellipse(ctx, 0, 0, 280 + 80 * o.swell, 220 + 60 * o.swell); ctx.fill(); ctx.strokeStyle = `rgba(255,150,140,${.5 * o.swell})`; ctx.lineWidth = 2; ellipse(ctx, 0, 10, 190 + 50 * o.swell, 150 + 40 * o.swell); ctx.stroke(); }
  const syn = o.syn ?? .35;
  ctx.fillStyle = `rgba(241,207,92,${.3 * syn})`; ellipse(ctx, 0, 6, 160, 78); ctx.fill(); ctx.strokeStyle = `rgba(241,207,92,${.7 * syn})`; ctx.lineWidth = 2; ctx.stroke();
  bone(() => { ctx.beginPath(); ctx.moveTo(-58, -400); ctx.lineTo(58, -400); ctx.lineTo(62, -150); ctx.bezierCurveTo(125, -110, 152, -60, 142, -20); ctx.bezierCurveTo(132, 8, 62, 14, 22, -6); ctx.lineTo(-22, -6); ctx.bezierCurveTo(-62, 14, -132, 8, -142, -20); ctx.bezierCurveTo(-152, -60, -125, -110, -62, -150); ctx.closePath(); });
  const c = [0, 10], v = o.valgus || 0;
  ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(-v * D2R); ctx.translate(-c[0], -c[1]);
  bone(() => { ctx.beginPath(); ctx.moveTo(-148, 24); ctx.bezierCurveTo(-60, 12, 60, 12, 148, 24); ctx.lineTo(142, 62); ctx.bezierCurveTo(100, 92, 70, 112, 60, 150); ctx.lineTo(55, 420); ctx.lineTo(-55, 420); ctx.lineTo(-60, 150); ctx.bezierCurveTo(-70, 112, -100, 92, -142, 62); ctx.closePath(); });
  bone(() => rr(ctx, 112, 78, 30, 330, 12));
  ctx.restore();
  // ACL inside the joint (behind), MCL on the medial side
  const aT = rot([-26, 28], c, v);
  if (o.acl !== false) ligBand(ctx, [26, -34], aT, 17, o.crimp ?? 1, o.aclTear || 0, t, { glow: o.aclGlow || 0, gap: 22 });
  const mT = rot([-130, 150], c, v);
  ligBand(ctx, [-142, -66], mT, 26, o.crimp ?? 1, o.mclTear || 0, t, { glow: o.mclGlow || 0, at: .45 });
  ctx.restore();
  const S = p => [o.x + p[0] * o.s, o.y + p[1] * o.s];
  return { mcl: S([(-142 + mT[0]) / 2, (-66 + mT[1]) / 2]), acl: S([(26 + aT[0]) / 2, (-34 + aT[1]) / 2]), syn: S([90, 30]) };
}

/* ---------- cards, chrome, timeline ---------- */
function drawCardBody(ctx, data, t) {
  const x = 140, w = 1320, y = 118;
  let fs = 26, layout, total;
  const doLayout = () => {
    layout = []; total = 0; ctx.font = `500 ${fs}px ${F.body}`;
    for (const it of data.items) { const lines = wrap(ctx, it.text, w - 140); const h = lines.length * fs * 1.3 + (it.cite || it.tag ? 30 : 0) + 18; layout.push({ it, lines, h }); total += h; }
  };
  doLayout(); while (total > 600 && fs > 19) { fs--; doLayout(); }
  ctx.save(); ctx.globalAlpha *= seg(t, 0, .6);
  ctx.fillStyle = 'rgba(12,16,26,.96)'; rr(ctx, x, y, w, total + 150, 16); ctx.fill(); ctx.strokeStyle = 'rgba(242,184,75,.35)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.font = `600 16px ${F.mono}`; ctx.fillStyle = COL.accent; ctx.fillText(data.kicker || 'CLINICAL TIE-IN', x + 50, y + 46);
  ctx.font = `700 44px ${F.display}`; ctx.fillStyle = COL.text; ctx.fillText(data.title.toUpperCase(), x + 50, y + 96);
  ctx.restore();
  let yy = y + 138;
  layout.forEach((L, i) => {
    const a = seg(t, .7 + i * 2.6, 1.3 + i * 2.6);
    if (a > 0) {
      ctx.save(); ctx.globalAlpha *= a; ctx.translate((1 - a) * 14, 0);
      ctx.fillStyle = L.it.tag ? COL[L.it.tag] : COL.accent; rr(ctx, x + 52, yy + 6 - fs * .5, 12, 12, 2); ctx.fill();
      ctx.font = `500 ${fs}px ${F.body}`; ctx.fillStyle = COL.text;
      L.lines.forEach((l, k) => ctx.fillText(l, x + 84, yy + 12 + k * fs * 1.3));
      const cy = yy + 12 + (L.lines.length - 1) * fs * 1.3 + 30; let cx = x + 84;
      if (L.it.tag) cx += tagPill(ctx, L.it.tag, cx, cy - 6, 1, 13) + 12;
      if (L.it.cite) { ctx.font = `500 16px ${F.mono}`; ctx.fillStyle = COL.dim; ctx.fillText(L.it.cite, cx, cy); }
      ctx.restore();
    }
    yy += L.h;
  });
}
function card(data) {
  return {
    d: data.d || 2.4 + data.items.length * 2.6 + 3.2, card: true, badges: data.badges, cardData: data,
    draw: (ctx, t, d, L) => {
      const prev = L && L.sc.shots[L.i - 1];
      if (prev && !prev.card) prev.draw(ctx, prev.d - .01, prev.d, L); else bg(ctx);
      ctx.fillStyle = `rgba(5,7,12,${.82 * seg(t, 0, .6)})`; ctx.fillRect(0, 0, W, H);
      drawCardBody(ctx, data, t);
    }
  };
}
const B = (t, s, p) => ({ t, s, p });
function chrome(ctx, L, mode, T) {
  const { sc, sh, st } = L;
  const g = ctx.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, 'rgba(6,8,13,.88)'); g.addColorStop(1, 'rgba(6,8,13,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1100, 120);
  if (!sh.noHeader) {
    ctx.font = `500 16px ${F.mono}`; ctx.fillStyle = COL.dim; ctx.fillText(sc.num, 48, 42);
    ctx.font = `700 40px ${F.display}`; ctx.fillStyle = COL.text; const ttl = sc.title.toUpperCase(); ctx.fillText(ttl, 48, 82);
    const tw = ctx.measureText(ttl).width; ctx.font = `500 22px ${F.body}`; ctx.fillStyle = COL.accent; ctx.fillText(sc.when, 48 + tw + 18, 81);
  }
  const bl = typeof sh.badges === 'function' ? sh.badges(st) : (sh.badges || []);
  let bx = W - 48;
  for (const [kind, note] of bl) {
    ctx.font = `500 15px ${F.mono}`; const nw = note ? ctx.measureText(note).width : 0;
    ctx.font = `700 15px ${F.mono}`; const pw = ctx.measureText(kind).width + 18;
    const x0 = bx - pw - (note ? nw + 10 : 0);
    tagPill(ctx, kind, x0, 52, 1);
    if (note) { ctx.font = `500 15px ${F.mono}`; ctx.fillStyle = COL.dim; ctx.textBaseline = 'middle'; ctx.fillText(note, x0 + pw + 10, 53); ctx.textBaseline = 'alphabetic'; }
    bx = x0 - 20;
  }
  if (mode !== 'off' && !sh.card && sh.beats) {
    let b = null, prev = null; for (const x of sh.beats) if (st >= x.t) { prev = b; b = x; }
    if (b) {
      const txt = mode === 'plain' ? b.p : b.s;
      const same = prev && (mode === 'plain' ? prev.p : prev.s) === txt;
      const a = (same ? 1 : seg(st, b.t, b.t + .35)) * (1 - seg(st, sh.d - .3, sh.d));
      const gb = ctx.createLinearGradient(0, 782, 0, H); gb.addColorStop(0, 'rgba(6,8,13,0)'); gb.addColorStop(.3, 'rgba(6,8,13,.82)'); gb.addColorStop(1, 'rgba(6,8,13,.92)');
      ctx.fillStyle = gb; ctx.fillRect(0, 782, W, H - 782);
      ctx.save(); ctx.globalAlpha *= a; ctx.font = `500 30px ${F.body}`; ctx.fillStyle = COL.text; ctx.textAlign = 'center';
      const lines = wrap(ctx, txt, 1300).slice(0, 3);
      lines.forEach((l, i) => ctx.fillText(l, 800, 868 - (lines.length - 1 - i) * 40));
      ctx.restore();
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, H - 4, W, 4);
  ctx.fillStyle = COL.accent; ctx.fillRect(0, H - 4, W * T / TOTAL, 4);
}
