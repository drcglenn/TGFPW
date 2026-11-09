/* Inside the Strain: scenes, captions, tie-in cards, and the timeline. */

/* ---------- shared bits ---------- */
function torn() { return FROWS.filter(r => r.torn); }
function pacman(ctx, x, y, r, dir, t) {
  const m = .22 + .22 * Math.abs(Math.sin(t * 9 + x));
  const a0 = dir > 0 ? 0 : Math.PI;
  ctx.fillStyle = COL.calpain; ctx.shadowColor = COL.calpain; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, a0 + m * Math.PI, a0 - m * Math.PI + Math.PI * 2); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
}
function spindle(ctx, x0, y0, x1, y1, w, col, sheen = 0, t = 0) {
  const L = Math.hypot(x1 - x0, y1 - y0), an = Math.atan2(y1 - y0, x1 - x0);
  ctx.save(); ctx.translate(x0, y0); ctx.rotate(an);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(L * .22, -w * .66, L * .7, -w * .56, L, 0); ctx.bezierCurveTo(L * .7, w * .56, L * .22, w * .66, 0, 0); ctx.closePath();
  const g = ctx.createLinearGradient(0, -w / 2, 0, w / 2); g.addColorStop(0, shade(col, -.4)); g.addColorStop(.35, shade(col, .2)); g.addColorStop(1, shade(col, -.5));
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(80,10,25,.35)'; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let k = -w / 2; k < w / 2; k += 5) { ctx.moveTo(0, k * .3); ctx.quadraticCurveTo(L / 2, k, L, k * .3); } ctx.stroke();
  if (sheen > 0) {
    ctx.fillStyle = `rgba(225,232,242,${.2 * sheen})`; ctx.fillRect(0, -w, L, w * 2);
    const hx0 = ((t * 140) % (L + 300)) - 150; const sg = ctx.createLinearGradient(hx0 - 110, 0, hx0 + 110, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, `rgba(245,250,255,${.5 * sheen})`); sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, -w, L, w * 2);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(240,236,228,.92)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-55, 0); ctx.lineTo(4, 0); ctx.moveTo(L - 4, 0); ctx.lineTo(L + 48, 0); ctx.stroke();
  ctx.restore();
}
function fasciaSheet(ctx, x0, x1, y, h, off, a = 1) {
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(150,162,182,.9)'); g.addColorStop(.42, 'rgba(238,243,249,.97)'); g.addColorStop(1, 'rgba(120,132,152,.9)');
  ctx.fillStyle = g; rr(ctx, x0, y, x1 - x0, h, Math.min(8, h / 2)); ctx.fill();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(110,122,145,.42)'; ctx.lineWidth = 1.1; ctx.beginPath();
  const st = 16; const ph = ((off % st) + st) % st;
  for (let x = x0 - 60 + ph; x < x1 + 60; x += st) { ctx.moveTo(x, y); ctx.lineTo(x + h, y + h); ctx.moveTo(x + h, y); ctx.lineTo(x, y + h); }
  ctx.stroke(); ctx.restore(); ctx.restore();
}
function gelLayer(ctx, x0, x1, y0, y1, t, dens, offTop, offBot) {
  const hg = y1 - y0, wd = x1 - x0;
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, `rgba(150,215,255,${.09 + .05 * dens})`); g.addColorStop(.5, `rgba(195,236,255,${.17 - .05 * dens})`); g.addColorStop(1, `rgba(150,215,255,${.09 + .05 * dens})`);
  ctx.fillStyle = g; ctx.fillRect(x0, y0, wd, hg);
  if (dens > 0) {
    const r = R(55 + y0);
    for (let i = 0; i < 46; i++) {
      const x = x0 + r.r(0, wd), y = y0 + r.r(8, hg - 8), rad = r.r(18, 46);
      const gg = ctx.createRadialGradient(x, y, 1, x, y, rad); gg.addColorStop(0, `rgba(236,228,210,${.3 * dens})`); gg.addColorStop(1, 'rgba(236,228,210,0)');
      ctx.fillStyle = gg; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    ctx.strokeStyle = `rgba(255,248,228,${.55 * dens})`; ctx.lineWidth = 1.3;
    for (let i = 0; i < 70; i++) {
      const u = r.f(); const x = x0 + ((r.r(0, wd) + lerp(offBot, offTop, u)) % wd + wd) % wd, y = y0 + 6 + u * (hg - 12);
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let k = 1; k <= 6; k++) ctx.lineTo(x + k * 5 * (1 + dens), y + Math.sin(k * 2.2 + i) * 5 * dens);
      ctx.stroke();
    }
  }
  const r = R(7 + y0);
  for (let i = 0; i < 110; i++) {
    const u = r.f(); const x = x0 + ((r.r(0, wd) + lerp(offBot, offTop, u)) % wd + wd) % wd; const y = y0 + 4 + u * (hg - 8);
    ctx.fillStyle = `rgba(225,248,255,${.7 * (1 - .65 * dens)})`; ctx.beginPath(); ctx.arc(x, y, 1.7, 0, 7); ctx.fill();
  }
}
function pill(ctx, x, y, a, c1, c2, rot = -.5) {
  if (a <= .01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot);
  rr(ctx, -34, -14, 68, 28, 14); ctx.fillStyle = c1; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = c2; ctx.fillRect(0, -14, 34, 28); ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5; rr(ctx, -34, -14, 68, 28, 14); ctx.stroke(); ctx.restore();
}

/* ---------- intro ---------- */
function introDraw(ctx, t) {
  const s = F0(); s.t = t; drawField(ctx, s);
  ctx.fillStyle = 'rgba(6,8,13,.8)'; ctx.fillRect(0, 0, W, H);
  const a = seg(t, .2, 1.2);
  bigText(ctx, 'PEAK WELLNESS SPORTS CHIROPRACTIC  ·  CLINICAL EDUCATION', 800, 220, 19, a, { font: F.mono, weight: 500, color: COL.accent });
  bigText(ctx, 'INSIDE THE STRAIN', 800, 340, 132, a);
  bigText(ctx, 'What happens inside a hamstring after a strain, from second 0 to month 6+', 800, 404, 32, seg(t, .8, 1.8), { font: F.body, weight: 500, color: '#c9d1de' });
  const la = seg(t, 1.6, 2.6);
  ctx.save(); ctx.globalAlpha *= la;
  const items = [['HUMAN', 'human data'], ['ANIMAL', 'animal or lab data only'], ['THEORY', 'proposed, not yet tested directly']];
  ctx.font = `500 21px ${F.body}`;
  let total = 0; const ws = items.map(([k, d]) => { ctx.font = `700 15px ${F.mono}`; const pw = ctx.measureText(k).width + 18; ctx.font = `500 21px ${F.body}`; const w = pw + 10 + ctx.measureText(d).width; total += w; return [pw, w]; });
  total += 60 * 2; let x = 800 - total / 2;
  items.forEach(([k, d], i) => { tagPill(ctx, k, x, 500, 1); ctx.fillStyle = '#c9d1de'; ctx.font = `500 21px ${F.body}`; ctx.textBaseline = 'middle'; ctx.fillText(d, x + ws[i][0] + 10, 501); ctx.textBaseline = 'alphabetic'; x += ws[i][1] + 60; });
  ctx.restore();
  ctx.save(); ctx.globalAlpha *= seg(t, 2.6, 3.6); ctx.font = `400 23px ${F.body}`; ctx.fillStyle = COL.dim; ctx.textAlign = 'center';
  wrap(ctx, 'Most of the cellular timeline comes from rodent models. Human healing follows the same sequence but probably runs more slowly, especially in larger injuries (Edouard et al., Nature Reviews Disease Primers, 2023).', 1080)
    .forEach((l, i) => ctx.fillText(l, 800, 600 + i * 33));
  ctx.restore();
}

/* ---------- Scene 0: the healthy muscle ---------- */
const XS = (() => {
  const fas = [{ x: 800, y: 440 }];
  for (let k = 0; k < 6; k++) { const a = (k * 60 - 90) * D2R; fas.push({ x: 800 + 190 * Math.cos(a), y: 440 + 190 * Math.sin(a) }); }
  const r = R(9);
  fas.forEach(f => {
    f.fibers = [];
    for (let gy = -88; gy <= 88; gy += 20) for (let gx = -92; gx <= 92; gx += 23) {
      const ox = gx + (Math.abs(Math.round(gy / 20)) % 2 ? 11.5 : 0);
      if (Math.hypot(ox, gy) < 80) f.fibers.push({ x: f.x + ox + r.r(-1.5, 1.5), y: f.y + gy + r.r(-1.5, 1.5), rad: r.r(9, 10.6), nuc: r.r(0, 6.28), sat: r.f() < .08 });
    }
    f.caps = []; for (let k = 0; k < 9; k++) f.caps.push({ a: r.r(0, 6.28), d: r.r(8, 78) });
  });
  return fas;
})();
function drawThigh(ctx, t) {
  bg(ctx, '#151a26', '#06080d');
  const k = eio(seg(t, 4.6, 9)); const z = 1 + 5 * Math.pow(seg(t, 4.6, 9), 2);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-lerp(800, 872, k), -lerp(450, 470, k));
  ctx.beginPath(); ctx.moveTo(560, 70); ctx.bezierCurveTo(520, 250, 600, 560, 650, 860); ctx.lineTo(930, 860); ctx.bezierCurveTo(980, 560, 1060, 260, 1040, 70); ctx.bezierCurveTo(900, 30, 700, 30, 560, 70); ctx.closePath();
  const sg = ctx.createLinearGradient(560, 0, 1040, 0); sg.addColorStop(0, 'rgba(196,150,128,.2)'); sg.addColorStop(.5, 'rgba(226,182,158,.3)'); sg.addColorStop(1, 'rgba(176,130,110,.2)');
  ctx.fillStyle = sg; ctx.fill(); ctx.strokeStyle = 'rgba(240,205,185,.5)'; ctx.lineWidth = 2; ctx.stroke();
  const fa = seg(t, 2.6, 4);
  spindle(ctx, 764, 300, 750, 780, 92, '#a8384b', fa, t);
  spindle(ctx, 800, 190, 722, 800, 66, '#c84a5e', fa, t);
  spindle(ctx, 842, 190, 905, 790, 100, '#d65a6e', fa, t + 1);
  ctx.restore();
  const la = 1 - seg(t, 4.4, 5);
  callout(ctx, 'Hamstrings (posterior thigh)', 1120, 300, 880, 360, win(t, .8, 6) * la);
  callout(ctx, 'Epimysium: deep fascia, shiny and white', 1120, 560, 900, 560, seg(t, 3, 3.6) * la);
}
function drawXsec(ctx, t) {
  bg(ctx, '#171522', '#06080d');
  const k = eio(seg(t, 14.6, 19)); const z = 1 + 2.7 * k; const foc = XS[2];
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-lerp(800, foc.x, k), -lerp(440, foc.y, k));
  ctx.fillStyle = '#2a1822'; ctx.beginPath(); ctx.arc(800, 440, 322, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(170,225,255,.22)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(800, 440, 310, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(225,248,255,.8)';
  for (let i = 0; i < 40; i++) { const a = i / 40 * 6.283 + t * .12 * (i % 2 ? 1 : -.6); ctx.beginPath(); ctx.arc(800 + 310 * Math.cos(a), 440 + 310 * Math.sin(a), 1.6, 0, 7); ctx.fill(); }
  for (const [lw, c] of [[14, 'rgba(140,150,170,.9)'], [8, 'rgba(236,242,248,.95)']]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(800, 440, 327, 0, 7); ctx.stroke(); }
  XS.forEach((f, fi) => {
    ctx.strokeStyle = 'rgba(170,225,255,.22)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(f.x, f.y, 98, 0, 7); ctx.stroke();
    ctx.fillStyle = '#3a1d2a'; ctx.beginPath(); ctx.arc(f.x, f.y, 92, 0, 7); ctx.fill();
    for (const fb of f.fibers) {
      ctx.fillStyle = COL.fiber; ctx.beginPath(); ctx.arc(fb.x, fb.y, fb.rad, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,190,200,.35)'; ctx.beginPath(); ctx.arc(fb.x - 2.5, fb.y - 2.5, fb.rad * .45, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,235,235,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(fb.x, fb.y, fb.rad + 1.2, 0, 7); ctx.stroke();
      ctx.fillStyle = '#4a1d5c'; ctx.beginPath(); ctx.arc(fb.x + Math.cos(fb.nuc) * (fb.rad - 2.5), fb.y + Math.sin(fb.nuc) * (fb.rad - 2.5), 2, 0, 7); ctx.fill();
      if (fb.sat) { ctx.fillStyle = '#3a6fbf'; ellipse(ctx, fb.x + Math.cos(fb.nuc + 2) * (fb.rad - .5), fb.y + Math.sin(fb.nuc + 2) * (fb.rad - .5), 3.4, 1.8, fb.nuc + 2 + Math.PI / 2); ctx.fill(); }
    }
    for (const c of f.caps) { ctx.fillStyle = COL.cap; ctx.beginPath(); ctx.arc(f.x + Math.cos(c.a) * c.d, f.y + Math.sin(c.a) * c.d, 2.6, 0, 7); ctx.fill(); }
    for (const [lw, c] of [[6, 'rgba(140,150,170,.9)'], [3, 'rgba(236,242,248,.95)']]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(f.x, f.y, 92, 0, 7); ctx.stroke(); }
  });
  ctx.restore();
  const la = 1 - seg(t, 14.3, 14.9);
  callout(ctx, 'Epimysium wraps the whole muscle', 1130, 190, 1083, 277, seg(t, 9.6, 10.2) * la);
  callout(ctx, 'Perimysium wraps each fascicle', 1130, 650, 1045, 581, seg(t, 10.8, 11.4) * la);
  const fb = XS[5].fibers[12];
  callout(ctx, 'Endomysium wraps each fiber', 120, 660, fb.x, fb.y, seg(t, 12, 12.6) * la);
  callout(ctx, 'Hyaluronan-rich gliding layer', 120, 190, 531, 285, seg(t, 13.2, 13.8) * la, { sub: 'made in part by fasciacytes' });
}
function drawLong(ctx, t) {
  bg(ctx);
  const y = 492, h = 190;
  const offA = 34 * Math.sin(t * .9), offB = -24 * Math.sin(t * .9);
  gelLayer(ctx, 0, W, 158, 238, t, 0, offA, offB);
  fasciaSheet(ctx, -60, W + 60, 130, 28, offA);
  fasciaSheet(ctx, -60, W + 60, 238, 16, offB);
  // capillary
  const cy = 660;
  ctx.lineCap = 'round';
  for (const [lw, c] of [[20, '#6a0c19'], [14, COL.cap], [3, 'rgba(255,160,170,.4)']]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); for (let x = -20; x <= W + 20; x += 10) { const yy = cy + 6 * Math.sin(x / 140); x === -20 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke(); }
  ctx.fillStyle = '#ff9aa4';
  for (let k = 0; k < 30; k++) { const x = ((t * 70 + k * 61) % (W + 40)) - 20; ctx.beginPath(); ellipse(ctx, x, cy + 6 * Math.sin(x / 140), 4.5, 3.4); ctx.fill(); }
  laminaSeg(ctx, -40, W + 40, y, h, 1, { lw: 3, fill: .07 });
  const nucX = [150, 420, 690, 960, 1230, 1500];
  fiberSeg(ctx, -40, W + 40, y, h, { sp: 15, striA: .45, sw: 3.4, phase: 0, nuc: nucX, nucRx: 20, nucRy: 8 });
  const da = seg(t, 25, 26.5);
  if (da > 0) {
    ctx.save(); rr(ctx, -40, y - h / 2, W + 80, h, h * .32); ctx.clip();
    nucX.forEach((nx, i) => {
      ctx.fillStyle = i % 2 ? `rgba(120,200,255,${.13 * da})` : `rgba(255,255,255,${.1 * da})`; ctx.fillRect(nx - 135, y - h / 2, 270, h);
      if (i === 2) { ctx.fillStyle = `rgba(242,184,75,${(.12 + .1 * Math.sin(t * 4)) * da})`; ctx.fillRect(nx - 135, y - h / 2, 270, h); }
    });
    ctx.strokeStyle = `rgba(255,255,255,${.6 * da})`; ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i < nucX.length - 1; i++) { const mx = (nucX[i] + nucX[i + 1]) / 2; ctx.moveTo(mx, y - h / 2); ctx.lineTo(mx, y + h / 2); }
    ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }
  satCell(ctx, 820, y - h / 2 + 5, .15, -1, 2.4);
  // nerve and NMJ
  const nx = 1100, ny = y - h / 2 - 6;
  ctx.beginPath(); ctx.moveTo(1060, 254); ctx.quadraticCurveTo(1120, 320, nx, ny); strokeNerve(ctx);
  ctx.save(); ctx.translate(nx, ny); ctx.scale(1.8, 1.8); nmj(ctx, 0, 0); ctx.restore();
  ctx.fillStyle = '#fff6b0'; for (let k = 0; k < 3; k++) { const f = (t * .8 + k / 3) % 1; const p = qpt([1060, 254], [1120, 320], [nx, ny], f); ctx.beginPath(); ctx.arc(p[0], p[1], 3.5, 0, 7); ctx.fill(); }
  // myofascial force transmission
  const fa = seg(t, 28.6, 29.4);
  if (fa > 0) {
    ctx.save(); ctx.globalAlpha *= fa; const A0 = ctx.globalAlpha; ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 3;
    for (const ax of [260, 560, 1320]) {
      const pulse = (t * 1.2 + ax / 300) % 1; const y0 = y - h / 2 - 10, y1 = 262;
      ctx.globalAlpha = A0 * (.4 + .6 * (1 - pulse));
      ctx.beginPath(); ctx.moveTo(ax, y0); ctx.lineTo(ax, y1 + 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax - 9, y1 + 18); ctx.lineTo(ax, y1 + 2); ctx.lineTo(ax + 9, y1 + 18); ctx.fill();
    }
    ctx.restore();
  }
  callout(ctx, 'Fascial sheets glide on the HA layer', 1150, 198, 1000, 198, win(t, 19.6, 28.4));
  callout(ctx, 'Basal lamina', 140, 360, 300, y - h / 2 - 5, seg(t, 19.6, 20.2));
  callout(ctx, 'Satellite cell (dormant)', 620, 330, 820, y - h / 2 + 5, seg(t, 20.6, 21.2), { color: 'rgba(110,170,255,.9)' });
  callout(ctx, 'Capillary', 160, 740, 300, cy, seg(t, 21.6, 22.2));
  callout(ctx, 'Neuromuscular junction', 1440, 330, nx + 20, ny, seg(t, 22.6, 23.2), { align: 'right', color: 'rgba(244,214,60,.9)' });
  callout(ctx, 'Myonucleus', 520, 740, 690, y + h / 2 - 7, seg(t, 25, 25.6));
  callout(ctx, 'Myonuclear domain: one nucleus, one stretch', 1440, 740, 690 + 100, y + 40, seg(t, 26, 26.6), { align: 'right' });
  callout(ctx, 'Force passes sideways into fascia', 300, 300, 260, 300, seg(t, 29, 29.6));
}
function scene0(ctx, t) {
  const xA = seg(t, 7.6, 9), xB = seg(t, 17.6, 19);
  if (xA < 1) drawThigh(ctx, t);
  if (xA > 0 && xB < 1) { ctx.save(); ctx.globalAlpha *= xA; drawXsec(ctx, t); ctx.restore(); }
  if (xB > 0) { ctx.save(); ctx.globalAlpha *= xB; drawLong(ctx, t); ctx.restore(); }
}

/* ---------- Scene 1: the injury ---------- */
function sprintPose(t) {
  const k = eio(seg(t, .3, 6.6));
  return { x: 700, y: 350, s: .9, hipF: lerp(66, 80, k), kneeF: lerp(102, 16, k), hipB: -24, kneeB: lerp(32, 20, k), armF: -58, armB: 52, lean: 14, ham: clamp(seg(t, 1, 6.4) + .15 * Math.sin(t * 9) * seg(t, 4, 6.6)) };
}
function hamPoint(o) {
  const th = o.hipF * D2R; const d = [Math.sin(th), Math.cos(th)], n = [-Math.cos(th), Math.sin(th)];
  return [o.x + o.s * (d[0] * 80 + n[0] * 24), o.y + o.s * (d[1] * 80 + n[1] * 24)];
}
function sprint(ctx, t) {
  const A0 = ctx.globalAlpha;
  bg(ctx, '#141a28', '#05070c');
  const o = sprintPose(t); const hp = hamPoint(o);
  const zk = eio(seg(t, 6.2, 8.2)); const z = 1 + 2.2 * zk;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-lerp(800, hp[0], zk), -lerp(450, hp[1], zk));
  ctx.fillStyle = '#10151f'; ctx.fillRect(-400, 762, W + 800, 400);
  ctx.strokeStyle = 'rgba(230,236,245,.28)'; ctx.lineWidth = 3;
  for (let k = -3; k < 12; k++) { ctx.beginPath(); ctx.moveTo(k * 180, 762); ctx.lineTo(k * 180 - 260, 1000); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(230,236,245,.5)'; ctx.beginPath(); ctx.moveTo(-400, 762); ctx.lineTo(W + 400, 762); ctx.stroke();
  drawRunner(ctx, o);
  const ta = seg(t, 2.5, 6.6);
  if (ta > 0) {
    ctx.strokeStyle = `rgba(255,120,120,${.6 * ta})`; ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) { const r = 40 + ((t * 40 + k * 22) % 66); ctx.globalAlpha = A0 * (1 - (r - 40) / 66); ctx.beginPath(); ctx.arc(hp[0], hp[1], r, -.6, .6); ctx.stroke(); ctx.beginPath(); ctx.arc(hp[0], hp[1], r, Math.PI - .6, Math.PI + .6); ctx.stroke(); }
    ctx.globalAlpha = A0;
  }
  ctx.restore();
  const la = 1 - seg(t, 6, 6.6);
  callout(ctx, 'Late swing, slowed down', 1150, 200, null, null, seg(t, .5, 1.1) * la);
  callout(ctx, 'Eccentric load: lengthening while contracting', 1150, 560, hp[0], hp[1], seg(t, 3, 3.6) * la, { color: 'rgba(255,110,120,.9)' });
  bigText(ctx, '0.1× SPEED', 1552, 150, 22, win(t, .5, 7.2) * .8, { font: F.mono, weight: 500, color: COL.dim, align: 'right' });
}
function s1fieldState(tt) {
  const s = F0(); s.t = tt + 8;
  s.stretch = eio(seg(tt, 0, 3.2)); s.tension = seg(tt, 1.5, 3.2);
  if (tt >= 3.2) { s.snapped = true; s.stretch = 0; s.tension = 0; s.open = elasticOut(seg(tt, 3.2, 5)); s.flash = 1 - seg(tt, 3.2, 3.7); s.fasciaTear = eo(seg(tt, 3.2, 4.4)); s.bleed = .75 * seg(tt, 10.6, 14); }
  return s;
}
function scene1(ctx, t) {
  const x = seg(t, 7.2, 8.2);
  if (x < 1) sprint(ctx, t);
  if (x > 0) {
    ctx.save(); ctx.globalAlpha *= x; const tt = t - 8; const s = s1fieldState(tt); drawField(ctx, s);
    const r3 = FROWS[3], r2 = FROWS[2], e3 = ends(r3, s), e2 = ends(r2, s);
    callout(ctx, 'Sarcomeres pulled apart under load', 1060, 150, e3.c + 60, r3.y - 20, win(tt, .5, 3.2));
    callout(ctx, 'Rupture near the MTJ / aponeurosis', 1060, 150, e3.c, r3.y, win(tt, 3.7, 9.5));
    callout(ctx, 'Broken ends recoil and retract', 150, 150, e2.Le, r2.y, win(tt, 4.5, 10.5));
    callout(ctx, 'Basal lamina torn', 1080, 764, e3.Le + 2, r3.y + FIELD.fh / 2 + 5, seg(tt, 7.4, 8), { color: 'rgba(232,185,74,.9)' });
    callout(ctx, 'Basal lamina intact, now an empty tube', 140, 764, e2.c - 30, r2.y + FIELD.fh / 2 + 5, seg(tt, 8, 8.6), { color: 'rgba(232,185,74,.9)' });
    const cp = CAPS[2]; callout(ctx, 'Capillaries tear and bleed', 1060, 150, FIELD.cx + cp.j - 80 * s.open, cp.y, seg(tt, 10.8, 11.4), { color: 'rgba(255,90,100,.9)' });
    ctx.restore();
  }
}

/* ---------- Scene 2: minutes to hours ---------- */
function st2(t) {
  const s = stInjured(t + 30);
  s.bleed = lerp(.75, 1, seg(t, 0, 3)); s.clot = seg(t, 1.5, 7);
  s.necro = seg(t, 8.5, 19); s.band = eo(seg(t, 18.3, 19.1)); s.bandFlash = seg(t, 18.6, 19) * (1 - seg(t, 19, 20.2)); s.hyp = seg(t, 23, 28);
  return s;
}
function scene2(ctx, t) {
  const s = st2(t); drawField(ctx, s);
  const ca = win(t, 8, 22.5, 1);
  if (ca > 0) {
    ctx.save(); const A0 = ctx.globalAlpha; ctx.fillStyle = COL.ca; ctx.shadowColor = COL.ca; ctx.shadowBlur = 10;
    for (const row of torn()) {
      const e = ends(row, s); const front = s.necro * row.nz + 24;
      for (const side of [-1, 1]) for (let k = 0; k < 16; k++) {
        const f = (t * .42 + k / 16 + row.i * .13) % 1;
        const x = side < 0 ? e.Le - f * front : e.Re + f * front; const y = row.y + Math.sin(k * 2.3 + row.i) * FIELD.fh * .3;
        ctx.globalAlpha = A0 * ca * (1 - f * .6); ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill();
      }
    }
    ctx.restore();
  }
  const pa = win(t, 12, 21.5, .6);
  if (pa > 0) {
    ctx.save(); ctx.globalAlpha *= pa;
    for (const row of torn()) {
      const e = ends(row, s); const front = s.necro * row.nz;
      pacman(ctx, e.Le - front + 10, row.y - 9, 9, -1, t); pacman(ctx, e.Le - front + 24, row.y + 10, 8, -1, t + .4);
      pacman(ctx, e.Re + front - 10, row.y - 9, 9, 1, t + .2); pacman(ctx, e.Re + front - 24, row.y + 10, 8, 1, t + .7);
    }
    ctx.restore();
  }
  const r3 = FROWS[3], e3 = ends(r3, s), r1 = FROWS[1], e1 = ends(r1, s), r4 = FROWS[4], e4 = ends(r4, s);
  callout(ctx, 'Hematoma clots into a fibrin mesh', 1060, 150, e3.c + 10, r3.y + 40, win(t, 3, 8));
  callout(ctx, 'A solid 3D plug, not a hollow box', 1060, 764, e3.c, r3.y + 120, win(t, 5, 8.2));
  callout(ctx, 'Ca²⁺ floods in', 150, 150, e1.Le - 30, r1.y, win(t, 8.6, 12.6), { color: 'rgba(99,255,138,.9)' });
  callout(ctx, 'Calpain + ROS: secondary injury spreads', 150, 150, e1.Le - s.necro * r1.nz + 10, r1.y - 9, win(t, 12.6, 18.3), { color: 'rgba(255,111,208,.9)' });
  callout(ctx, 'Contraction band reseals the membrane', 150, 764, e4.Lb, r4.y + FIELD.fh / 2, win(t, 19, 23.5));
  callout(ctx, 'Hypoxia: oxygen supply cut off', 1060, 150, 900, 300, seg(t, 24.4, 25));
}

/* ---------- Scene 3: inflammation ---------- */
function st3(t) {
  const s = stInjured(t + 60); s.bleed = 1; s.clot = 1; s.necro = 1; s.band = 1; s.hyp = 1;
  s.cleared = seg(t, 11, 17); s.satGlow = seg(t, 18, 22); return s;
}
const NEUTS = Array.from({ length: 24 }, (_, i) => { const r = R(500 + i); const top = i % 2 === 0; return { sx: r.r(560, 1040), sy: top ? CAPS[0].y : CAPS[5].y, tx: FIELD.cx + r.r(-90, 90), ty: r.r(250, 610), t0: 3.8 + i * .13, seed: r.r(0, 6) }; });
function macroSpots(s, t) {
  const out = [];
  torn().forEach((row, ri) => {
    const e = ends(row, s);
    out.push({ x: lerp(e.Le - 6, e.Lb + 18, s.cleared), y: row.y, side: -1, row, seed: ri * 2 });
    out.push({ x: lerp(e.Re + 6, e.Rb - 18, s.cleared), y: row.y, side: 1, row, seed: ri * 2 + 1 });
  });
  for (let k = 0; k < 6; k++) { const r = R(900 + k); out.push({ x: FIELD.cx + r.r(-70, 70) + Math.sin(t * .4 + k) * 8, y: 250 + k * 70 + Math.cos(t * .3 + k) * 6, plug: true, seed: 20 + k }); }
  return out;
}
function scene3(ctx, t) {
  const s = st3(t); drawField(ctx, s);
  const pa = win(t, 0, 9.5, 1);
  if (pa > 0) for (const row of torn()) {
    const e = ends(row, s);
    for (const cx of [(e.Lb + e.Le) / 2, (e.Rb + e.Re) / 2]) for (let k = 0; k < 2; k++) { const f = (t * .7 + k * .5 + row.i * .21) % 1; ring(ctx, cx, row.y, 10 + f * 95, '#ff4458', pa * (1 - f) * .8, 2.5); }
  }
  for (const n of NEUTS) {
    const p = eo(seg(t, n.t0, n.t0 + 3)); const a = seg(t, n.t0, n.t0 + .3) * (1 - .6 * seg(t, 16, 20)); if (a <= 0) continue;
    neut(ctx, lerp(n.sx, n.tx, p) + Math.sin(t * 2 + n.seed) * 3, lerp(n.sy, n.ty, p) + Math.cos(t * 1.7 + n.seed) * 3, t, n.seed, a);
  }
  const spots = macroSpots(s, t);
  spots.forEach((m, i) => {
    const t0 = 7.5 + (i % 8) * .35; const p = eo(seg(t, t0, t0 + 2.5)); if (p <= 0) return;
    const sy = m.plug ? (i % 2 ? CAPS[0].y : CAPS[5].y) : m.row.y + (m.side < 0 ? 42 : -42);
    const x = m.x, y = lerp(sy, m.y, p);
    if (!m.plug && s.cleared > 0 && s.cleared < 1) { for (let k = 0; k < 3; k++) debrisChunk(ctx, x + m.side * (14 + k * 9), m.row.y + (k - 1) * 12, 4, .8, k + i); }
    macro(ctx, x, y, m.plug ? 19 : 17, 0, t, m.seed, { alpha: seg(t, t0, t0 + .4), debris: Math.round(1 + 2 * s.cleared) });
  });
  const sa = win(t, 17.6, 24.2, .6);
  if (sa > 0) spots.filter(m => !m.plug).forEach(m => { const sl = satList(m.row, s); const tg = m.side < 0 ? sl[0] : sl[2]; signal(ctx, m.x, m.y - 10, tg[0], m.row.y - FIELD.fh / 2, t + m.seed, '#ffb070', sa, 34, 3); });
  const r2 = FROWS[2], e2 = ends(r2, s), r4 = FROWS[4], e4 = ends(r4, s);
  callout(ctx, 'DAMPs: alarm signals', 1060, 150, (e2.Re + e2.Rb) / 2 + 40, r2.y - 30, win(t, .5, 4.4), { color: 'rgba(255,70,90,.9)' });
  callout(ctx, 'Neutrophils leave intact capillaries', 150, 150, NEUTS[2].sx, CAPS[0].y, win(t, 4.2, 9));
  callout(ctx, 'M1 macrophages engulf debris', 1060, 764, e4.Re + 20, r4.y, win(t, 9, 14.2), { color: 'rgba(242,138,37,.9)' });
  callout(ctx, 'Empty basal-lamina tunnel', 150, 764, (e4.Lb + e4.Le) / 2 + 20, r4.y + FIELD.fh / 2 + 5, win(t, 14.4, 18.4), { color: 'rgba(232,185,74,.9)' });
  callout(ctx, 'TNF · IL-1β · IL-6: wake up!', 150, 150, satList(r2, s)[0][0], r2.y - FIELD.fh / 2, seg(t, 18.4, 19), { color: 'rgba(110,170,255,.9)' });
}

/* ---------- Scene 4: the M1 to M2 switch ---------- */
function st4(t) { const s = st3(17 + 7); s.t = t + 90; s.cleared = 1; s.satGlow = 1; s.granul = .3 * seg(t, 0, 22); s.hyp = lerp(1, .85, seg(t, 0, 22)); return s; }
function scene4(ctx, t) {
  const s = st4(t); drawField(ctx, s);
  const spots = macroSpots(s, t);
  spots.forEach((m, i) => {
    const t0 = 1.5 + i * .45; const mm = eio(seg(t, t0, t0 + 2.5));
    macro(ctx, m.x, m.y, m.plug ? 19 : 17, mm, t, m.seed, { debris: mm > .5 ? 0 : 2, glow: mm * .5 });
    if (!m.plug) { const sl = satList(m.row, s); const tg = m.side < 0 ? sl[0] : sl[2]; signal(ctx, m.x, m.y - 8, tg[0], m.row.y - FIELD.fh / 2, t + m.seed, '#b9ffd2', win(t, Math.max(5.5, t0 + 2.5), 15.6, .8), 30, 3); }
  });
  const r2 = FROWS[2], e2 = ends(r2, s);
  callout(ctx, 'Efferocytosis complete: M1 → M2', 1060, 150, e2.Re + 20, r2.y, win(t, 1.6, 10.4), { color: 'rgba(63,196,111,.9)' });
  callout(ctx, 'IL-10 · IGF-1 · growth factors', 150, 150, satList(r2, s)[0][0], r2.y - FIELD.fh / 2, win(t, 5.6, 15.4), { color: 'rgba(63,196,111,.9)' });
  // re-injury inset
  const ia = win(t, 15.6, 22, .5);
  if (ia > 0) {
    const u = t - 15.6; const x = 1000, y = 470, w = 540, h = 290;
    ctx.save(); ctx.globalAlpha *= ia;
    ctx.fillStyle = 'rgba(8,11,18,.94)'; rr(ctx, x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,90,100,.8)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = `700 18px ${F.mono}`; ctx.fillStyle = '#ff6b76'; ctx.fillText('RE-INJURY', x + 20, y + 34);
    const back = eio(seg(u, 2.2, 4));
    for (let k = 0; k < 5; k++) { const dy = eo(seg(u, 1.3 + k * .12, 2 + k * .12)); if (dy > 0) debrisChunk(ctx, x + 120 + k * 75, lerp(y + 40, y + 205, dy), 10, 1, k + 3); }
    for (let k = 0; k < 3; k++) macro(ctx, x + 140 + k * 130, y + 160, 30, 1 - back, t, k * 3, { debris: back > .5 ? 3 : 0, glow: .4 });
    if (u > 1.3 && u < 2.1) { ctx.fillStyle = `rgba(255,80,90,${.3 * (1 - seg(u, 1.3, 2.1))})`; rr(ctx, x, y, w, h, 12); ctx.fill(); }
    ctx.font = `600 21px ${F.body}`; ctx.fillStyle = COL.text; ctx.globalAlpha *= seg(u, 3.6, 4.2); ctx.fillText('New rubble: back to demolition', x + 20, y + h - 22);
    ctx.restore();
  }
}
function nsaidShot(ctx, t) {
  bg(ctx, '#151520', '#06080d');
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(800, 140); ctx.lineTo(800, 760); ctx.stroke();
  const site = (ox, oy, lvl, sc, glow) => {
    const A0 = ctx.globalAlpha;
    fiberSeg(ctx, ox - 380, ox - 60, oy, 62, { sp: 9, nuc: [ox - 300, ox - 180] });
    laminaSeg(ctx, ox - 380, ox - 60, oy, 62); ctx.fillStyle = COL.band; rr(ctx, ox - 66, oy - 31, 11, 62, 3); ctx.fill();
    ctx.fillStyle = '#9a4c5c'; blob(ctx, ox + 30, oy, 70, 1, 2, .1); ctx.fill();
    const r = R(sc);
    ctx.save(); ctx.fillStyle = '#ff7ab8'; ctx.shadowColor = '#ff7ab8'; ctx.shadowBlur = 8;
    for (let k = 0; k < 34; k++) { const an = r.r(0, 6.28); const f = (t * .35 + r.f()) % 1; ctx.globalAlpha = A0 * (1 - f) * lvl; ctx.beginPath(); ctx.arc(ox + 30 + Math.cos(an) * (20 + f * 200), oy + Math.sin(an) * (20 + f * 150), 3, 0, 7); ctx.fill(); }
    ctx.restore();
    satCell(ctx, ox - 230, oy - 28, glow, -1, 1.6);
    signal(ctx, ox, oy - 20, ox - 230, oy - 34, t, '#ff7ab8', lvl, 40, 4);
  };
  const lvlL = 1 - .78 * eo(seg(t, 3, 5.5));
  bigText(ctx, 'NSAIDs', 90, 200, 46, 1, { align: 'left' });
  bigText(ctx, 'Ibuprofen · naproxen · ketorolac. Block COX in the injured tissue.', 90, 238, 22, 1, { align: 'left', font: F.body, weight: 500, color: COL.dim });
  site(470, 520, lvlL, 11, .4 + .9 * lvlL);
  const pp = eo(seg(t, 1.6, 3)); pill(ctx, lerp(480, 520, pp), lerp(300, 470, pp), win(t, 1.4, 4.2), '#f5f0e6', '#f28a25');
  callout(ctx, 'Local prostaglandins ↓, including signals to satellite cells', 90, 700, 240, 492, seg(t, 4.4, 5), { size: 19 });
  const ra = seg(t, 7.6, 8.4);
  ctx.save(); ctx.globalAlpha *= ra;
  bigText(ctx, 'Acetaminophen', 870, 200, 46, 1, { align: 'left' });
  bigText(ctx, 'Works mainly in the central nervous system.', 870, 238, 22, 1, { align: 'left', font: F.body, weight: 500, color: COL.dim });
  const hx0 = 1020, hy = 380;
  ctx.fillStyle = '#2c3a58'; ctx.beginPath(); ctx.arc(hx0, hy, 82, 0, 7); ctx.fill(); ctx.fillRect(hx0 - 30, hy + 60, 60, 60);
  ctx.fillStyle = '#d98fa2'; for (const [dx, dy, rr2] of [[-25, -20, 30], [12, -32, 30], [32, -6, 26], [-6, 8, 28]]) { ctx.beginPath(); ctx.arc(hx0 + dx, hy + dy, rr2, 0, 7); ctx.fill(); }
  const kk = eio(seg(t, 10, 13)); const kx = 1250, ky = 380;
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(kx, ky, 54, .75 * Math.PI, 2.25 * Math.PI); ctx.stroke();
  ctx.strokeStyle = COL.accent; ctx.beginPath(); ctx.arc(kx, ky, 54, .75 * Math.PI, lerp(2.25, .95, kk) * Math.PI); ctx.stroke();
  ctx.fillStyle = '#e8ecf3'; ctx.beginPath(); ctx.arc(kx, ky, 40, 0, 7); ctx.fill();
  const ia = lerp(2.25, .95, kk) * Math.PI; ctx.strokeStyle = '#1b2438'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + Math.cos(ia) * 32, ky + Math.sin(ia) * 32); ctx.stroke();
  bigText(ctx, 'PAIN', kx, ky + 90, 20, 1, { font: F.mono, weight: 600, color: COL.dim });
  const lit = Math.round(6 * (1 - .7 * kk));
  for (let k = 0; k < 6; k++) { ctx.fillStyle = k < lit ? COL.accent : 'rgba(255,255,255,.14)'; rr(ctx, 1340 + k * 22, ky + 30 - k * 12, 14, 20 + k * 12, 3); ctx.fill(); }
  const p2 = eo(seg(t, 8.6, 9.8)); pill(ctx, lerp(1180, 1060, p2), lerp(560, 400, p2), win(t, 8.4, 11), '#f5f0e6', '#4b8fe8');
  ctx.save(); ctx.translate(0, 0); site(1290, 640, 1, 23, 1.2); ctx.restore();
  ctx.restore();
  callout(ctx, 'Injury-site signals stay on', 1500, 760, 1260, 600, seg(t, 12.6, 13.2) * ra, { align: 'right', size: 19 });
}

/* ---------- Scene 5: supply lines ---------- */
function st5(t) { const s = st4(22); s.t = t + 120; s.granul = lerp(.3, .6, seg(t, 0, 20)); s.vessels = seg(t, 1, 17); s.vegf = win(t, 2, 17.5, 1); s.o2 = seg(t, 9, 12); s.hyp = 1; return s; }
function m2Plug(ctx, s, t, n = 6) { const spots = macroSpots(s, t); spots.forEach(m => macro(ctx, m.x, m.y, m.plug ? 19 : 17, 1, t, m.seed, { debris: 0, glow: .3 })); return spots; }
function scene5(ctx, t) {
  const s = st5(t); drawField(ctx, s); const spots = m2Plug(ctx, s, t);
  spots.filter(m => m.plug).slice(0, 4).forEach((m, k) => { const cp = CAPS[1 + k]; const g = sproutGeo(cp, s, k % 2 ? 1 : -1); const tip = qpt(g.o, g.ctl, g.m, clamp(s.vessels)); signal(ctx, m.x, m.y, tip[0], tip[1], t + k, '#ffc45a', win(t, 2, 16, .8) * (1 - s.vessels * .7), 20, 3); });
  const cp = CAPS[2], g = sproutGeo(cp, s, -1), tip = qpt(g.o, g.ctl, g.m, clamp(s.vessels));
  callout(ctx, 'Capillary sprouts with growth cones', 150, 150, tip[0], tip[1], win(t, 1.5, 10.6), { color: 'rgba(255,90,100,.9)' });
  callout(ctx, 'VEGF from macrophages guides them in', 1060, 150, spots[spots.length - 3].x, spots[spots.length - 3].y, win(t, 5.6, 10.8), { color: 'rgba(255,196,90,.9)' });
  callout(ctx, 'Oxygen arrives: hypoxia lifts', 1060, 764, 860, 520, win(t, 11, 20), { color: 'rgba(255,255,255,.8)' });
}
function shockShot(ctx, t) {
  const s = st5(14); s.t = t + 160; s.vessels = lerp(.5, .9, eio(seg(t, 6, 8))); s.vegf = 1; s.vesselGlow = .6 + .4 * Math.sin(t * 6); s.satGlow = 1.6; s.o2 = .6; s.hyp = 1;
  drawField(ctx, s); m2Plug(ctx, s, t);
  ctx.save();
  for (let k = 0; k < 3; k++) { const f = (t * 1.1 + k / 3) % 1; ctx.strokeStyle = `rgba(160,220,255,${(1 - f) * .7})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(800, 70, 40 + f * 820, 20 + f * 560, 0, .05 * Math.PI, .95 * Math.PI); ctx.stroke(); }
  ctx.fillStyle = '#c9d3e3'; rr(ctx, 770, -20, 60, 74, 10); ctx.fill(); ctx.fillStyle = '#6f8bb8'; rr(ctx, 760, 46, 80, 22, 8); ctx.fill();
  ctx.restore();
  const flip = seg(t, 6, 8); const day = flip < .5 ? 'DAY 4' : 'DAY 7';
  ctx.save(); ctx.fillStyle = 'rgba(8,11,18,.85)'; rr(ctx, 1240, 120, 300, 120, 12); ctx.fill();
  bigText(ctx, day, 1390, 205, 70, 1, { font: F.mono, weight: 700, color: flip > .5 ? COL.accent : COL.text });
  if (t > 5.6 && t < 8.6 && Math.floor(t * 4) % 2 === 0) bigText(ctx, '▶▶', 1290, 160, 26, 1, { font: F.mono, color: COL.accent });
  ctx.restore();
  callout(ctx, 'Rat data: treated muscle at day 4 ≈ untreated at day 7', 150, 764, null, null, seg(t, 8, 8.6), { color: 'rgba(242,163,59,.95)' });
}

/* ---------- Scene 6: granulation tissue ---------- */
function st6(t) { const s = st5(20); s.t = t + 180; s.vessels = 1; s.vegf = 0; s.o2 = .4; s.hyp = .1; s.granul = lerp(.6, 1, seg(t, 0, 6)); s.col3 = seg(t, 6, 16); s.col1 = .22 * seg(t, 15.5, 19); s.shimmer = seg(t, 18, 20); return s; }
const FIBS = Array.from({ length: 14 }, (_, i) => { const r = R(700 + i); const fromTop = i % 2 === 0; return { sx: FIELD.cx + r.r(-160, 160), sy: fromTop ? 215 : 645, tx: FIELD.cx + r.r(-80, 80), ty: r.r(260, 600), an: r.r(-1.2, 1.2), t0: 3.6 + i * .45, seed: r.r(0, 6) }; });
function drawFibs(ctx, t, a = 1, actin = 0, tx = null) {
  for (const f of FIBS) { const p = eio(seg(t, f.t0, f.t0 + 4)); const al = seg(t, f.t0, f.t0 + .4) * a; if (al <= 0) continue;
    const x = (tx ? tx(f) : lerp(f.sx, f.tx, p)) + Math.sin(t * .5 + f.seed) * 4, y = lerp(f.sy, f.ty, p) + Math.cos(t * .4 + f.seed) * 4;
    fibroCell(ctx, x, y, lerp(Math.PI / 2, f.an, p), 22, al, { actin }); }
}
function scene6(ctx, t) {
  const s = st6(t); drawField(ctx, s); m2Plug(ctx, s, t); drawFibs(ctx, t);
  callout(ctx, 'Granulation tissue: red and grainy', 1060, 150, 860, 330, win(t, .8, 7));
  callout(ctx, 'Fibroblasts climb the fibrin scaffold', 150, 150, lerp(FIBS[2].sx, FIBS[2].tx, eio(seg(t, FIBS[2].t0, FIBS[2].t0 + 4))), lerp(FIBS[2].sy, FIBS[2].ty, eio(seg(t, FIBS[2].t0, FIBS[2].t0 + 4))), win(t, 5.6, 11.4), { color: 'rgba(161,116,224,.95)' });
  callout(ctx, 'Type III collagen: thin, random, weak', 1060, 764, 820, 480, win(t, 11, 18.4), { color: 'rgba(148,211,255,.95)' });
  callout(ctx, 'Type I comes later', 1060, 150, 790, 420, win(t, 15.6, 19), { color: 'rgba(58,110,224,.95)' });
  callout(ctx, 'Week 1: like wet cement', 1060, 764, 800, 560, seg(t, 18.6, 19.2));
}

/* ---------- Scene 7: satellite cells (close-up of one tunnel) ---------- */
const S7P = [340, 530, 720, 910, 1100];
function s7cells(t) {
  const act = seg(t, .5, 2.5), split = eio(seg(t, 3, 5.5)), line = eio(seg(t, 6, 10)), diff = seg(t, 8, 14);
  const cells = []; let order = 0;
  S7P.forEach((px, i) => {
    const py = i % 2 ? 515 : 345;
    for (const d of [0, 1]) {
      const self = i === 2 && d === 1;
      const sx = px + (d ? 1 : -1) * 24 * split, sy = py + (i % 2 ? -1 : 1) * 8 * split;
      let tx, ty; if (self) { tx = 735; ty = 343; } else { tx = 290 + order * 95; ty = 430; order++; }
      const x = lerp(sx, tx, line), y = lerp(sy, ty, line);
      const rx = self ? lerp(lerp(19, 13, split), 18, line) : lerp(lerp(19, 13, split), 46, line);
      const ry = self ? lerp(lerp(6, 9, split), 6, line) : lerp(lerp(6, 9, split), 21, line);
      const glow = act * (self ? 1 - .85 * seg(t, 20, 23) : 1);
      cells.push({ x, y, rx, ry, glow, self, diff: self ? 0 : diff });
    }
  });
  return cells;
}
function scene7(ctx, t) {
  bg(ctx);
  const y = 430;
  ctx.save(); ctx.fillStyle = '#7f4655'; rr(ctx, 1385, 150, 300, 560, 30); ctx.fill(); ctx.clip();
  const r = R(4); ctx.strokeStyle = 'rgba(148,211,255,.7)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 40; i++) { const x = r.r(1390, 1600), yy = r.r(160, 700), an = r.r(0, 3.14); ctx.beginPath(); ctx.moveTo(x, yy); ctx.quadraticCurveTo(x + 20, yy + 10, x + Math.cos(an) * 60, yy + Math.sin(an) * 60); ctx.stroke(); }
  ctx.restore();
  laminaSeg(ctx, 60, 1392, y, 180, 1, { lw: 3, fill: .08, rR: true });
  const fuseL = seg(t, 23, 25.5), grow = eio(seg(t, 23, 26));
  fiberSeg(ctx, -40, 242, y, 180, { sp: 14, striA: .45, sw: 3, nuc: [60, 170], nucRx: 18, nucRy: 7 });
  ctx.fillStyle = COL.band; ctx.globalAlpha = 1 - .9 * fuseL; rr(ctx, 236, y - 90, 13, 180, 4); ctx.fill(); ctx.globalAlpha = 1;
  const cells = s7cells(t); const f = eio(seg(t, 10, 14));
  if (f > 0) {
    const x0 = lerp(244, 236, fuseL), x1 = lerp(1096, 1372, grow);
    const nuc = cells.filter(c => !c.self).map(c => c.x); for (let x = 1145; x < x1 - 30; x += 95) nuc.push(x);
    ctx.save(); ctx.globalAlpha *= f;
    fiberSeg(ctx, x0, x1, y, lerp(44, 60, f), { color: COL.regen, striA: .3 * seg(t, 14, 22), sp: 11, nuc, nucMode: 'center', nucRx: 13, nucRy: 7, r: 26 });
    const da = win(t, 15, 20.6, .6);
    if (da > 0) nuc.slice(0, 9).forEach((nx, i) => { ctx.fillStyle = i % 2 ? `rgba(120,200,255,${.3 * da})` : `rgba(255,255,255,${.22 * da})`; ctx.fillRect(nx - 47, y - 30, 94, 60); });
    if (grow > 0 && grow < 1) { const gx = x1; const gg = ctx.createRadialGradient(gx, y, 2, gx, y, 50); gg.addColorStop(0, 'rgba(255,220,230,.8)'); gg.addColorStop(1, 'rgba(255,220,230,0)'); ctx.fillStyle = gg; ctx.fillRect(gx - 50, y - 50, 100, 100); }
    ctx.restore();
  }
  for (const c of cells) {
    const a = c.self ? 1 : 1 - f; if (a <= .01) continue;
    ctx.save(); ctx.globalAlpha *= a;
    if (c.glow > .05) { ctx.shadowColor = 'rgba(110,180,255,.9)'; ctx.shadowBlur = 22 * c.glow; }
    ctx.fillStyle = mixHex(mixHex('#264878', '#6fb3ff', c.glow), '#e8a3b8', c.diff);
    ellipse(ctx, c.x, c.y, c.rx, c.ry); ctx.fill(); ctx.shadowBlur = 0;
    const pinch = seg(t, 3, 4.5) * (1 - seg(t, 4.5, 5.5));
    ctx.fillStyle = '#132a55';
    ellipse(ctx, c.x, c.y, Math.max(5, c.rx * .32), Math.max(2.6, c.ry * .45)); ctx.fill();
    if (pinch > 0 && !c.self) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(c.x - 1, c.y - c.ry, 2, c.ry * 2 * pinch); }
    ctx.restore();
  }
  const c0 = cells[0], cs = cells.find(c => c.self), last = cells[cells.length - 1];
  callout(ctx, 'Satellite cells activate: MyoD / Myf5', 150, 150, c0.x, c0.y, win(t, .8, 5.8), { color: 'rgba(110,170,255,.9)' });
  callout(ctx, 'Myoblasts proliferate', 1060, 150, cells[5].x, cells[5].y, win(t, 3.6, 6.2), { color: 'rgba(110,170,255,.9)' });
  callout(ctx, 'They line up inside the empty basal-lamina tunnel', 1060, 150, 1000, y - 95, win(t, 6.2, 10.2), { color: 'rgba(232,185,74,.9)' });
  callout(ctx, 'Myogenin on: myoblasts fuse', 150, 764, cells[3].x, cells[3].y + 22, win(t, 10.4, 15.2), { color: 'rgba(239,154,167,.95)' });
  callout(ctx, 'Myotube with a central row of nuclei', 1060, 764, cells[7].x, y, win(t, 13.2, 15.4), { color: 'rgba(239,154,167,.95)' });
  callout(ctx, 'Each nucleus runs one domain', 1060, 764, cells[6].x, y + 30, win(t, 15.6, 20.4));
  callout(ctx, 'Self-renewal: back under the lamina', 150, 150, cs.x, cs.y, win(t, 20, 24.2), { color: 'rgba(110,170,255,.9)' });
  callout(ctx, 'Grows toward the scar and fuses onto the stump', 150, 764, lerp(1096, 1372, grow), y + 30, seg(t, 23.4, 24));
}

/* ---------- Scene 8: breaking through ---------- */
function st8(t) {
  const s = st6(22); s.t = t + 220; s.o2 = 0; s.hyp = 0; s.shimmer = 0;
  s.col3 = 1; s.col1 = lerp(.25, .6, seg(t, 0, 24)); s.prune = .2;
  s.myo = lerp(.6, 1, seg(t, 0, 2.5)); s.fingers = eio(seg(t, 2.5, 16)); s.shrink = eio(seg(t, 6, 18)); s.zipper = seg(t, 6, 8);
  s.nerveRegrow = seg(t, 17, 23); s.satGlow = lerp(1, .35, seg(t, 0, 10)); return s;
}
function dayAt(t) { const k = [[0, 5], [6, 7], [11, 14], [16.5, 21]]; if (t >= 16.5) return 21; for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1][0]) return Math.round(lerp(k[i][1], k[i + 1][1], seg(t, k[i][0], k[i + 1][0]))); return 21; }
function counter(ctx, txt, sub) {
  ctx.save(); ctx.fillStyle = 'rgba(8,11,18,.86)'; rr(ctx, 1290, 108, 270, 96, 12); ctx.fill(); ctx.strokeStyle = 'rgba(242,184,75,.5)'; ctx.lineWidth = 1.2; ctx.stroke();
  bigText(ctx, txt, 1425, 172, 54, 1, { font: F.mono, weight: 700, color: COL.accent });
  if (sub) bigText(ctx, sub, 1425, 196, 15, 1, { font: F.mono, weight: 500, color: COL.dim });
  ctx.restore();
}
function scene8(ctx, t) {
  const s = st8(t); drawField(ctx, s); drawFibs(ctx, 30, .5);
  counter(ctx, 'DAY ' + dayAt(t));
  const r3 = FROWS[3], e3 = ends(r3, s), r2 = FROWS[2];
  callout(ctx, 'Branches pierce both sides of the scar', 150, 150, e3.BL + s.fingers * 40, r3.y - 3, win(t, 1.5, 10.8));
  callout(ctx, 'Mini-myotendinous junctions anchor each tip', 1060, 764, e3.c + 14, r3.y + 11, win(t, 6.4, 16.2), { color: 'rgba(215,236,255,.9)' });
  callout(ctx, 'Scar condenses', 1060, 150, e3.BR, r3.y - 60, win(t, 11, 16.4));
  callout(ctx, 'Thin seam of scar between interlaced fibers', 150, 764, e3.c, FROWS[4].y + 30, win(t, 16.6, 21.6), { color: 'rgba(58,110,224,.95)' });
  callout(ctx, 'Nerves regrow, new NMJs form', 150, 150, ends(r2, s).Lb + 40, r2.y - 10, seg(t, 21.6, 22.2), { color: 'rgba(244,214,60,.9)' });
}
function splitShot(ctx, t) {
  bg(ctx);
  const a = st8(26); a.gapScale = .75; a.fingers = eio(seg(t, 0, 4)); a.shrink = eio(seg(t, 0, 4.5)); a.nerveRegrow = 0; a.t = t;
  const b = st8(26); b.gapScale = 1.45; b.fingers = .42 * eio(seg(t, 0, 4)); b.shrink = .1 * eio(seg(t, 0, 4)); b.wall = 1; b.col1 = 1; b.curl = seg(t, 3, 5); b.zipper = .5; b.nerveRegrow = 0; b.t = t;
  fieldIn(ctx, a, 40, 150, 750, 600, 1);
  fieldIn(ctx, b, 810, 150, 750, 600, 1);
  for (const [x, txt, c] of [[60, 'Small gap, controlled scar', COL.HUMAN], [830, 'Large gap, excessive scar', '#ff6b76']]) {
    ctx.fillStyle = 'rgba(8,11,18,.88)'; rr(ctx, x, 166, 410, 42, 8); ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = `600 23px ${F.body}`; ctx.fillStyle = COL.text; ctx.textBaseline = 'middle'; ctx.fillText(txt, x + 16, 188); ctx.textBaseline = 'alphabetic';
  }
  callout(ctx, 'Fingers interlock', 520, 700, 415, 440, seg(t, 4, 4.6));
  callout(ctx, 'Dense wall: fibers stop and curl', 1540, 700, 1185, 440, seg(t, 5.4, 6), { align: 'right', color: 'rgba(255,107,118,.9)' });
}

/* ---------- Scene 9: remodeling ---------- */
function st9(t) {
  const s = st8(26); s.t = t + 260;
  s.col1 = lerp(.6, 1, seg(t, 2, 14)); s.col3 = 1 - .9 * seg(t, 3, 14); s.align = eio(seg(t, 6, 16)); s.braid = seg(t, 6, 14);
  s.mature = eio(seg(t, 0, 10)); s.contract = eio(seg(t, 12, 20)); s.prune = lerp(.2, 1, seg(t, 4, 14)); s.satGlow = .3; return s;
}
function calAt(t) { const k = [['WEEK 2', 0], ['WEEK 4', 4.5], ['WEEK 8', 9], ['MONTH 3', 14], ['MONTH 6', 19]]; let c = k[0][0]; for (const [n, s] of k) if (t >= s) c = n; return c; }
function scene9(ctx, t) {
  const s = st9(t); drawField(ctx, s);
  const ma = seg(t, 11, 13);
  if (ma > 0) {
    for (let i = 1; i <= 4; i++) {
      const ra = FROWS[i], rb = FROWS[i + 1]; const ea = ends(ra, s), eb = ends(rb, s); const c = (ea.c + eb.c) / 2; const y = (ra.y + rb.y) / 2;
      const tug = Math.sin(t * 2.2 + i) * 2;
      fibroCell(ctx, c - 8 - tug, y - 4, .1, 15, ma, { actin: 1 }); fibroCell(ctx, c + 10 + tug, y + 6, -.1, 15, ma, { actin: 1 });
    }
  }
  counter(ctx, calAt(t));
  const r3 = FROWS[3], e3 = ends(r3, s);
  callout(ctx, 'Fibers thicken, nuclei move to the edge', 150, 150, e3.Lb + 40, r3.y - FIELD.fh / 2 + 7, win(t, .6, 6.2));
  callout(ctx, 'Type III → type I: ropes braid and align', 1060, 764, e3.c, FROWS[4].y + 40, win(t, 6.2, 12.2), { color: 'rgba(58,110,224,.95)' });
  callout(ctx, 'Myofibroblasts winch the scar tighter', 150, 764, ends(FROWS[4], s).c - 8, (FROWS[4].y + FROWS[5].y) / 2, win(t, 12.4, 18.2), { color: 'rgba(161,116,224,.95)' });
  callout(ctx, 'Still actively remodeling at month 6', 150, 150, e3.c, r3.y - 50, seg(t, 19, 19.6));
}
function loadVsImmob(ctx, t) {
  bg(ctx);
  const panel = (px, loaded, a) => {
    if (a <= .01) return;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = 'rgba(255,255,255,.03)'; rr(ctx, px, 150, 720, 600, 14); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.stroke();
    const c = px + 360; const seam = loaded ? 13 : 44; const shrink = loaded ? 0 : 70;
    for (let k = 0; k < 4; k++) {
      const y = 300 + k * 100;
      fiberSeg(ctx, px + 40 + shrink, c - seam, y, 54, { sp: 9, nuc: [px + 150, px + 280] });
      fiberSeg(ctx, c + seam, px + 680 - shrink, y, 54, { sp: 9, nuc: [px + 470, px + 600] });
    }
    ctx.fillStyle = loaded ? '#2b3d78' : '#22305f'; rr(ctx, c - seam, 250, seam * 2, 400, 8); ctx.fill();
    const r = R(loaded ? 3 : 8); ctx.lineCap = 'round';
    for (let i = 0; i < (loaded ? 16 : 34); i++) {
      const y = r.r(262, 640); ctx.strokeStyle = r.f() < .5 ? '#3a6ee0' : '#5b8cf0'; ctx.lineWidth = 3; ctx.beginPath();
      if (loaded) { ctx.moveTo(c - seam - 6, y); ctx.lineTo(c + seam + 6, y + r.r(-2, 2)); }
      else { const x = c + r.r(-seam, seam); ctx.moveTo(x - 30, y); ctx.bezierCurveTo(x + 40, y - 40, x - 40, y + 50, x + 30, y + r.r(-30, 30)); }
      ctx.stroke();
    }
    if (loaded) {
      const p = .5 + .5 * Math.sin(t * 3);
      ctx.fillStyle = `rgba(242,184,75,${.5 + .5 * p})`;
      for (const [x, d] of [[px + 30, -1], [px + 690, 1]]) { ctx.beginPath(); ctx.moveTo(x + d * 22, 450); ctx.lineTo(x, 432); ctx.lineTo(x, 468); ctx.closePath(); ctx.fill(); }
    }
    ctx.font = `600 24px ${F.body}`; ctx.fillStyle = COL.text; ctx.fillText(loaded ? 'Loaded: aligned rope, thin scar' : 'Immobilized: tangled, shortened scar', px + 24, 200);
    ctx.restore();
  };
  panel(60, true, seg(t, 0, .6)); panel(820, false, seg(t, 4.2, 4.8));
}

/* ---------- Scene 10: the fascial layer ---------- */
function scene10(ctx, t) {
  bg(ctx, '#141826', '#06080d');
  const dens = seg(t, 5.5, 10.5) * (1 - .88 * eio(seg(t, 23, 28)));
  const u = t * 1.1; const ue = u - dens * .9 * Math.sin(6 * u) / 6; const amp = 64 * (1 - .5 * dens);
  const o0 = amp * Math.sin(ue), o2 = -amp * Math.sin(ue);
  const ys = [170, 290, 410];
  gelLayer(ctx, 0, W, 202, 290, t, dens, o0, 0);
  gelLayer(ctx, 0, W, 322, 410, t, dens, 0, o2);
  const warm = win(t, 23, 28, 1.2);
  if (warm > 0) { ctx.fillStyle = `rgba(255,150,60,${.16 * warm})`; ctx.fillRect(0, 202, W, 88); ctx.fillRect(0, 322, W, 88); }
  fasciaSheet(ctx, -80, W + 80, ys[0], 32, o0); fasciaSheet(ctx, -80, W + 80, ys[1], 32, 0); fasciaSheet(ctx, -80, W + 80, ys[2], 32, o2);
  const v = 1 - .9 * dens * Math.cos(6 * u); const flash = dens * seg(v, 1.2, 1.85);
  for (const [nx, ny] of [[330, 246], [760, 366], [1130, 246], [1420, 366]]) {
    ctx.save(); ctx.strokeStyle = mixHex('#8a7a2a', '#fff27a', flash); ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    if (flash > .1) { ctx.shadowColor = '#fff27a'; ctx.shadowBlur = 24 * flash; }
    ctx.beginPath(); ctx.moveTo(nx - 50, ny + 30); ctx.lineTo(nx, ny); ctx.lineTo(nx + 18, ny - 16); ctx.moveTo(nx, ny); ctx.lineTo(nx + 22, ny + 8); ctx.moveTo(nx, ny); ctx.lineTo(nx - 4, ny - 22); ctx.stroke(); ctx.restore();
  }
  // muscle with an intramuscular scar seam below
  for (let k = 0; k < 3; k++) {
    const y = 520 + k * 70;
    fiberSeg(ctx, -40, 778, y, 48, { sp: 9, nuc: [120, 400, 650] }); fiberSeg(ctx, 822, W + 40, y, 48, { sp: 9, nuc: [950, 1250, 1500] });
    for (const [oy, d] of [[-12, 1], [4, 1], [-4, -1], [12, -1]]) fiberSeg(ctx, d > 0 ? 772 : 806, d > 0 ? 812 : 828, y + oy, 8, { color: COL.fiber, striA: .2, r: 4 });
  }
  ctx.fillStyle = 'rgba(43,61,120,.9)'; rr(ctx, 790, 478, 20, 225, 6); ctx.fill();
  ctx.strokeStyle = '#5b8cf0'; ctx.lineWidth = 2.5; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.moveTo(791, 488 + k * 24); ctx.lineTo(809, 488 + k * 24); ctx.stroke(); }
  // intervention
  const ha = win(t, 22.4, 27.8, .8);
  if (ha > 0) {
    const hx0 = 600 + 120 * Math.sin((t - 22.4) * 1.6), hy0 = lerp(70, 132, seg(t, 22.4, 23.4));
    ctx.save(); ctx.globalAlpha *= ha; ctx.fillStyle = '#e9d6c7'; ctx.strokeStyle = '#8b6f5e'; ctx.lineWidth = 2;
    rr(ctx, hx0 - 90, hy0 - 10, 180, 46, 22); ctx.fill(); ctx.stroke();
    for (let k = 0; k < 4; k++) { rr(ctx, hx0 - 82 + k * 42, hy0 - 52, 34, 56, 16); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = COL.accent; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx0 + d * 150, 150); ctx.lineTo(hx0 + d * 120, 136); ctx.lineTo(hx0 + d * 120, 164); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  callout(ctx, 'HA-rich gliding layer between fascial sheets', 1060, 150, 1000, 246, win(t, .5, 5.6), { color: 'rgba(150,215,255,.9)' });
  callout(ctx, 'Densification: thicker, stickier gel', 1060, 150, 1000, 246, win(t, 6, 11.2), { color: 'rgba(236,228,210,.9)' });
  callout(ctx, 'Stick-slip gliding irritates free nerve endings', 1060, 150, 1130, 246, win(t, 11.4, 16), { color: 'rgba(244,214,60,.9)' });
  callout(ctx, 'Between the layers: densified gel, potentially reversible', 150, 764, 400, 366, win(t, 16, 22.2), { color: 'rgba(236,228,210,.9)' });
  callout(ctx, 'Deep inside the muscle: collagen scar, permanent', 1060, 764, 800, 640, win(t, 16.6, 22.2), { color: 'rgba(58,110,224,.95)' });
  callout(ctx, 'Proposed mechanism: movement and shear restore gliding', 150, 764, null, null, seg(t, 23.4, 24), { color: 'rgba(176,140,255,.95)' });
}

/* ---------- Scene 11: why function is often not fully restored ---------- */
function muscleShape(ctx, cx, cy, w, h) {
  ctx.beginPath(); ctx.moveTo(cx - w / 2, cy); ctx.bezierCurveTo(cx - w / 4, cy - h * .75, cx + w / 4, cy - h * .75, cx + w / 2, cy); ctx.bezierCurveTo(cx + w / 4, cy + h * .75, cx - w / 4, cy + h * .75, cx - w / 2, cy); ctx.closePath();
}
function scene11(ctx, t) {
  bg(ctx);
  const muscle = (cx, healed) => {
    const w = 470, h = healed ? lerp(150, 128, seg(t, 5, 8)) : 150, cy = 430;
    ctx.save(); muscleShape(ctx, cx, cy, w, h);
    const g = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2); g.addColorStop(0, '#7a2433'); g.addColorStop(.4, '#e0707f'); g.addColorStop(1, '#6a1d2b'); ctx.fillStyle = g; ctx.fill(); ctx.clip();
    ctx.strokeStyle = 'rgba(80,10,25,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = -h / 2; k < h / 2; k += 6) { ctx.moveTo(cx - w / 2, cy + k * .2); ctx.quadraticCurveTo(cx, cy + k, cx + w / 2, cy + k * .2); } ctx.stroke();
    if (healed) {
      ctx.fillStyle = '#2b3d78'; ctx.fillRect(cx - 14, cy - h, 28, h * 2);
      const fa = seg(t, 6, 8); const r = R(31); ctx.fillStyle = `rgba(250,226,140,${.8 * fa})`;
      for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.arc(cx + r.r(-200, 200), cy + r.r(-50, 50), r.r(3, 6), 0, 7); ctx.fill(); }
    }
    const pulse = .5 + .5 * Math.sin(t * 3);
    const hg = ctx.createRadialGradient(cx, cy, 5, cx, cy, healed ? 120 : 260);
    if (healed) { hg.addColorStop(0, `rgba(255,236,120,${.75 + .2 * pulse})`); hg.addColorStop(.4, `rgba(255,110,40,${.55})`); hg.addColorStop(1, 'rgba(255,80,40,0)'); }
    else { hg.addColorStop(0, `rgba(255,170,80,${.22 + .05 * pulse})`); hg.addColorStop(1, 'rgba(255,170,80,.08)'); }
    ctx.fillStyle = hg; ctx.fillRect(cx - w / 2, cy - h, w, h * 2);
    ctx.restore();
    ctx.strokeStyle = 'rgba(240,236,228,.9)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - w / 2 - 70, cy); ctx.lineTo(cx - w / 2 + 6, cy); ctx.moveTo(cx + w / 2 - 6, cy); ctx.lineTo(cx + w / 2 + 70, cy); ctx.stroke();
    const pa = .5 + .5 * Math.sin(t * 3);
    ctx.fillStyle = `rgba(242,184,75,${.5 + .5 * pa})`;
    for (const d of [-1, 1]) { const x = cx + d * (w / 2 + 92); ctx.beginPath(); ctx.moveTo(x + d * 24, cy); ctx.lineTo(x, cy - 16); ctx.lineTo(x, cy + 16); ctx.closePath(); ctx.fill(); }
    bigText(ctx, healed ? 'HEALED (SCAR SEAM)' : 'HEALTHY', cx, cy + 135, 24, 1, { font: F.mono, weight: 600, color: COL.dim });
  };
  muscle(440, false); muscle(1160, true);
  // brain and dimmer
  const dim = eio(seg(t, 10.5, 13));
  ctx.fillStyle = '#d98fa2'; for (const [dx, dy, r2] of [[-22, -8, 26], [12, -18, 26], [28, 4, 22], [-4, 12, 24]]) { ctx.beginPath(); ctx.arc(800 + dx, 175 + dy, r2, 0, 7); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.14)'; rr(ctx, 880, 160, 150, 14, 7); ctx.fill();
  ctx.fillStyle = COL.accent; rr(ctx, 880, 160, 150 * (1 - .7 * dim), 14, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(880 + 150 * (1 - .7 * dim), 167, 11, 0, 7); ctx.fill();
  bigText(ctx, 'DRIVE TO INJURED MUSCLE', 955, 205, 13, 1, { font: F.mono, weight: 600, color: COL.dim });
  for (const [cx, lvl] of [[440, 1], [1160, 1 - .75 * dim]]) {
    const p0 = [800, 210], p2 = [cx, 345], p1 = [(800 + cx) / 2, 250];
    ctx.strokeStyle = 'rgba(244,214,60,.25)'; ctx.lineWidth = 2; qpath(ctx, p0, p1, p2, 1); ctx.stroke();
    ctx.fillStyle = COL.nerve; ctx.shadowColor = COL.nerve; ctx.shadowBlur = 10;
    const n = Math.max(1, Math.round(6 * lvl));
    for (let k = 0; k < n; k++) { const f = (t * .7 + k / n) % 1; const p = qpt(p0, p1, p2, f); ctx.globalAlpha = .3 + .7 * lvl; ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
  const chips = [['The scar is not muscle', 0.6], ['MTJ architecture not fully rebuilt', 5], ['Atrophy and fat infiltration', 6.6], ['Neural inhibition', 10.8], ['Reduced fascial gliding', 13, 'THEORY'], ['Return before the tissue matures', 16]];
  ctx.font = `600 21px ${F.body}`;
  const rowsY = [640, 694]; let ri = 0, x = 0; const line = [[], []];
  chips.forEach((c, i) => { line[i < 3 ? 0 : 1].push(c); });
  line.forEach((cs, li) => {
    const widths = cs.map(c => ctx.measureText(c[0]).width + 30 + (c[2] ? 90 : 0)); const tot = widths.reduce((a, b) => a + b, 0) + 16 * (cs.length - 1); let xx = 800 - tot / 2;
    cs.forEach((c, k) => {
      const a = seg(t, c[1], c[1] + .5);
      ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgba(8,11,18,.85)'; rr(ctx, xx, rowsY[li] - 20, widths[k], 40, 20); ctx.fill(); ctx.strokeStyle = 'rgba(242,184,75,.6)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = COL.text; ctx.font = `600 21px ${F.body}`; ctx.textBaseline = 'middle'; ctx.fillText(c[0], xx + 15, rowsY[li] + 1); ctx.textBaseline = 'alphabetic';
      if (c[2]) tagPill(ctx, c[2], xx + widths[k] - 98, rowsY[li], 1, 13);
      ctx.restore(); xx += widths[k] + 16;
    });
  });
}

/* ---------- Scene 12: the phase-matched plan ---------- */
const PLAN = [
  ['0–48 h', 'Bleeding, calcium surge, contraction band, M1 cleanup', 'Stop activity, compress, elevate, protect. No eccentric loading. Acetaminophen preferred for pain.', '#c31d2e'],
  ['Days 2–5', 'Granulation tissue ("wet cement"), capillary ingrowth, M1→M2 switch', 'Pain-free isometrics: day 2 for mild strains, nearer day 5 for larger ones. Avoid both immobilization and aggressive loading.', '#e98a96'],
  ['Days 5–21', 'Myotubes, fibers pierce the scar, type III collagen', 'Progressive isotonic, then dynamic loading. Consider E-stim [ANIMAL] and ESWT [ANIMAL]. Gentle fascial work around the site.', '#94d3ff'],
  ['Weeks 3–12', 'Type I collagen, fiber maturation, scar contraction', 'Lengthening and eccentric work at long muscle lengths. Restore fascial gliding. Use criteria-based return to sport.', '#3a6ee0'],
  ['Months 3–6+', 'Ongoing remodeling, atrophy risk', 'Keep up eccentric strengthening (e.g., Nordic curls) after return to play.', '#f2b84b']
];
function planTable(ctx, t) {
  bg(ctx);
  const X = [60, 290, 820, 1540], top = 140;
  ctx.font = `700 16px ${F.mono}`; ctx.fillStyle = COL.dim;
  ['PHASE / TIME', 'BIOLOGY ON SCREEN', 'ATHLETIC TRAINER ACTION'].forEach((h, i) => ctx.fillText(h, X[i] + 18, top + 30));
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X[0], top + 46); ctx.lineTo(X[3], top + 46); ctx.stroke();
  let y = top + 46;
  PLAN.forEach((row, i) => {
    const t0 = 3 + i * 5.6; const active = t >= t0 && t < t0 + 5.6; const seen = t >= t0;
    ctx.font = `500 21px ${F.body}`;
    const l1 = wrap(ctx, row[1], X[2] - X[1] - 36), l2 = wrap(ctx, row[2].replace(/\s*\[ANIMAL\]/g, ' ‡'), X[3] - X[2] - 36);
    const rh = Math.max(l1.length, l2.length, 1) * 28 + 30;
    const a = seen ? 1 : .35;
    if (active) { ctx.fillStyle = 'rgba(242,184,75,.1)'; ctx.fillRect(X[0], y, X[3] - X[0], rh); }
    ctx.fillStyle = row[3]; ctx.globalAlpha = a; ctx.fillRect(X[0], y + 8, 5, rh - 16);
    ctx.fillStyle = COL.text; ctx.font = `700 26px ${F.display}`; ctx.fillText(row[0].toUpperCase(), X[0] + 18, y + 38);
    ctx.font = `500 21px ${F.body}`; ctx.fillStyle = '#c9d1de'; l1.forEach((l, k) => ctx.fillText(l, X[1] + 18, y + 36 + k * 28));
    ctx.fillStyle = COL.text; l2.forEach((l, k) => ctx.fillText(l, X[2] + 18, y + 36 + k * 28));
    ctx.globalAlpha = 1;
    y += rh; ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(X[0], y); ctx.lineTo(X[3], y); ctx.stroke();
  });
  ctx.fillStyle = COL.dim; ctx.font = `500 17px ${F.body}`; ctx.fillText('‡ animal data only', X[2] + 18, y + 30);
  tagPill(ctx, 'ANIMAL', X[2] + 170, y + 24, 1, 13);
}
function finale(ctx, t) {
  const pull = seg(t, 0, 2.6);
  if (pull < 1) { const s = st9(26); s.t = t + 300; const z = lerp(1, .45, eio(pull)); ctx.save(); bg(ctx); ctx.globalAlpha *= 1 - eio(pull); ctx.translate(800, 430); ctx.scale(z, z); ctx.translate(-800, -430); drawField(ctx, s); ctx.restore(); }
  const ra = seg(t, 1.4, 3.2); if (ra <= 0) return;
  ctx.save(); ctx.globalAlpha *= ra;
  bg(ctx, '#141a28', '#05070c');
  const off = (t * 520) % 180;
  ctx.fillStyle = '#10151f'; ctx.fillRect(0, 700, W, 200);
  ctx.strokeStyle = 'rgba(230,236,245,.28)'; ctx.lineWidth = 3;
  for (let k = -2; k < 12; k++) { const x = k * 180 - off; ctx.beginPath(); ctx.moveTo(x, 700); ctx.lineTo(x - 240, 900); ctx.stroke(); }
  const rc = runCycle(t * 2 * Math.PI * 1.25);
  drawRunner(ctx, { x: 520, y: 300 + rc.bob, s: .8, ...rc, lean: 16, ham: .35, scar: .55 + .35 * Math.sin(t * 3) });
  ctx.restore();
  bigText(ctx, 'Healed is not the same as remodeled.', 1130, 380, 60, seg(t, 5, 6), { weight: 700 });
  bigText(ctx, 'KEEP LOADING.', 1130, 480, 96, seg(t, 7.4, 8.2), { weight: 800, color: COL.accent });
}
const REFS = [
  'Edouard et al. Nature Reviews Disease Primers, 2023', 'Boivin et al. American Journal of Sports Medicine, 2023', 'Zissler et al. American Journal of Sports Medicine, 2017',
  'Kanzaki et al. J Muscle Research and Cell Motility, 2022', 'Wang et al. BioMed Research International, 2020', 'Morelli et al. American Journal of Sports Medicine, 2018',
  'Bryant et al. PLoS One, 2016', 'Mackey et al. FASEB Journal, 2016', 'Mackey et al. Scand J Med Sci Sports, 2012', 'Jomard et al. Scientific Reports, 2025',
  'Gao & Zhao. J International Medical Research, 2026', 'Pieters et al. Sports Medicine, 2021', 'Tsai et al. American Journal of Sports Medicine, 2021',
  'Kirkness et al. Frontiers in Physiology, 2026', 'Amstel et al. Musculoskeletal Science & Practice, 2026', 'Du et al. Surgical and Radiologic Anatomy, 2026', 'Gao & Gao. Frontiers in Physiology, 2026'
];
function refsDraw(ctx, t) {
  bg(ctx);
  bigText(ctx, 'SOURCES CITED IN THIS FILM', 800, 150, 40, seg(t, 0, .6));
  ctx.save(); ctx.globalAlpha *= seg(t, .4, 1.2); ctx.font = `500 21px ${F.body}`; ctx.fillStyle = '#c9d1de';
  REFS.forEach((r, i) => { const col = i < 9 ? 0 : 1, row = i < 9 ? i : i - 9; ctx.fillText(r, col ? 830 : 110, 230 + row * 48); });
  ctx.fillStyle = COL.dim; ctx.font = `500 18px ${F.mono}`; ctx.textAlign = 'center';
  ctx.fillText('Evidence labels: HUMAN = human data · ANIMAL = animal or lab data only · THEORY = proposed, not yet tested directly', 800, 720);
  ctx.restore();
}

/* ---------- clinical tie-in cards ---------- */
function drawCardBody(ctx, data, t) {
  const x = 140, w = 1320, y = 118;
  let fs = 26, layout, total;
  const doLayout = () => {
    layout = []; total = 0; ctx.font = `500 ${fs}px ${F.body}`;
    for (const it of data.items) { const lines = wrap(ctx, it.text, w - 140); const h = lines.length * fs * 1.3 + (it.cite || it.tag ? 30 : 0) + 18; layout.push({ it, lines, h }); total += h; }
  };
  doLayout(); while (total > 600 && fs > 19) { fs--; doLayout(); }
  const ph = total + 150;
  ctx.save(); ctx.globalAlpha *= seg(t, 0, .6);
  ctx.fillStyle = 'rgba(12,16,26,.96)'; rr(ctx, x, y, w, ph, 16); ctx.fill(); ctx.strokeStyle = 'rgba(242,184,75,.35)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.font = `600 16px ${F.mono}`; ctx.fillStyle = COL.accent; ctx.fillText('CLINICAL TIE-IN', x + 50, y + 46);
  ctx.font = `700 44px ${F.display}`; ctx.fillStyle = COL.text; ctx.fillText(data.title.toUpperCase(), x + 50, y + 96);
  ctx.restore();
  let yy = y + 138;
  layout.forEach((L, i) => {
    const a = seg(t, .7 + i * 2.6, 1.3 + i * 2.6); if (a > 0) {
      ctx.save(); ctx.globalAlpha *= a; ctx.translate((1 - a) * 14, 0);
      ctx.fillStyle = L.it.tag ? COL[L.it.tag] : COL.accent; rr(ctx, x + 52, yy + 6 - fs * .5, 12, 12, 2); ctx.fill();
      ctx.font = `500 ${fs}px ${F.body}`; ctx.fillStyle = COL.text;
      L.lines.forEach((l, k) => ctx.fillText(l, x + 84, yy + 12 + k * fs * 1.3));
      let cy = yy + 12 + (L.lines.length - 1) * fs * 1.3 + 30, cx = x + 84;
      if (L.it.tag) { cx += tagPill(ctx, L.it.tag, cx, cy - 6, 1, 13) + 12; }
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

/* ---------- the scene list ---------- */
const B = (t, s, p) => ({ t, s, p });
const SCENES = [
  {
    num: 'SCENE 00', title: 'The Healthy Muscle', when: 'Cold open', shots: [
      { d: 9, draw: introDraw, noHeader: true, card: true, voice: [{ t: 0, text: 'Inside the Strain. What happens inside a hamstring after a strain, from second zero to month six and beyond.' }, { t: 2.6, text: 'Most of this cellular timeline comes from rodent models. Human healing follows the same sequence, but probably runs more slowly, especially in larger injuries.' }] },
      {
        d: 32, draw: scene0, beats: [
          B(0, 'Skeletal muscle is built like a cable inside a cable inside a cable.', 'Picture a thick electrical cable.'),
          B(4.6, 'The epimysium, the deep fascia, wraps the whole muscle.', 'The outer jacket is the fascia.'),
          B(9.4, 'Perimysium wraps each bundle of fibers (fascicle). Endomysium wraps each individual fiber.', 'Inside are bundles of wires. Each bundle has its own sleeve, and each wire has its own thin coating.'),
          B(13.6, 'Between fascial layers, a hyaluronan-rich loose connective tissue, made in part by fasciacytes, lets the layers glide.', 'Between the sleeves is a slippery gel, like lubricant, so everything slides smoothly.'),
          B(19.4, 'The basal lamina is fused to each fiber. Satellite cells, the muscle\'s stem cells, sit dormant just beneath it.', 'Tucked under that coating are "spare-parts" cells waiting for an emergency.'),
          B(24.8, 'Each nucleus along the fiber manages one stretch of it: the myonuclear domain.', 'Each wire has many control centers, and each one runs its own stretch.'),
          B(28.6, 'All layers are continuous with each other and the tendon, and pass force sideways: myofascial force transmission.', 'All the layers connect to the tendon and share the load.')
        ]
      }
    ]
  },
  {
    num: 'SCENE 01', title: 'The Injury', when: 'Second 0', shots: [
      {
        d: 22, draw: scene1, badges: t => t > 15 ? [['HUMAN', 'Boivin 2023 · Edouard 2023']] : [], beats: [
          B(0, 'Strains usually happen during a forceful eccentric contraction, like the late swing phase of sprinting.', 'The muscle is stretched hard while it\'s pulling.'),
          B(4.4, 'The hamstring is lengthening under load as the knee extends.', 'Like a rubber band yanked while it\'s already tight.'),
          B(8.4, 'Failure usually occurs near the myotendinous junction or the aponeurosis.', 'Inside, the wires get pulled to their limit.'),
          B(11.4, 'The fibers rupture, and the broken ends recoil and retract, leaving a gap.', 'Some wires snap, and the broken ends spring apart.'),
          B(15.4, 'In shearing-type strains the basal lamina sleeves tear too, so regeneration is less orderly and more scar forms.', 'Some of the coatings tear too, which makes the repair messier.'),
          B(18.8, 'Capillaries in the gap tear and bleed.', 'The tiny blood vessels in between break and bleed.')
        ]
      }
    ]
  },
  {
    num: 'SCENE 02', title: 'Bleeding, Calcium, and the Seal', when: 'Minutes to hours', shots: [
      {
        d: 30, draw: scene2, beats: [
          B(0, 'Hematoma: blood fills the gap and clots into a fibrin mesh.', 'Blood fills the hole and clots, like an internal scab.'),
          B(4.6, 'The fibrin net runs in every direction. It is a solid plug, not a hollow box.', 'The clot is a solid plug that fills the whole hole.'),
          B(8.4, 'Calcium pours into torn fibers through the ruptured membrane and stretch-activated channels.', 'Inside the broken wires, calcium rushes in like water through a cracked dam.'),
          B(12.6, 'Calcium activates calpain. With reactive oxygen species, damage spreads along the fiber: secondary injury.', 'It turns on "scissor" enzymes that start chopping the wire from the inside.'),
          B(18.4, 'Within hours, a contraction band of hypercontracted filaments reseals the membrane and stops the spread.', 'Each wire builds an emergency bulkhead, like a watertight door on a ship.'),
          B(21.6, 'This happens automatically. It does not depend on the athlete contracting the muscle.', 'So the flooding doesn\'t spread down the whole wire.'),
          B(24.2, 'Torn vessels and swelling cut off oxygen to the area, which can kill more fibers.', 'Less blood flow means less oxygen, which can hurt more of the muscle.')
        ]
      },
      card({
        title: 'What limits secondary damage', items: [
          { text: 'Stop activity right away. Compress and elevate to control bleeding and swelling.' },
          { text: 'Avoid eccentric loading in the first days.' },
          { text: 'Myth to correct: voluntary isometrics in the first hours do not "build" the contraction band. Tension across a fresh tear can widen the gap.' },
          { text: 'Immediate active mobilization in rats produced larger scars and frequent re-rupture. About 5 days of relative rest let granulation tissue bridge the gap first.', tag: 'ANIMAL', cite: 'Wang et al., BioMed Research International, 2020' },
          { text: 'No proven treatment blocks the calcium cascade after injury in humans. Pre-exercise L-arginine shows promise as prevention only. Antioxidant supplements have not helped.', cite: 'Kanzaki et al., 2022' }
        ]
      })
    ]
  },
  {
    num: 'SCENE 03', title: 'The Demolition Crew', when: 'Hours to day 3', shots: [
      {
        d: 24, draw: scene3, beats: [
          B(0, 'Damaged cells release alarm molecules (DAMPs) that call in immune cells.', 'An alarm goes off.'),
          B(4.2, 'Neutrophils arrive within hours.', 'First the "fire trucks" arrive: neutrophils.'),
          B(8.6, 'Pro-inflammatory M1 macrophages follow and dominate the first ~3 days, engulfing necrotic debris.', 'Then the demolition crew, M1 macrophages, eats up the broken pieces.'),
          B(14.2, 'Behind each contraction band the dead segment is cleared, leaving an empty basal-lamina tube.', 'Behind each bulkhead, the old wire gets cleared out, leaving an empty sleeve.'),
          B(18.2, 'TNF, IL-1β and IL-6 also tell satellite cells to wake up and multiply.', 'While they clean up, they shout "wake up!" to the spare-parts cells.'),
          B(21.6, 'Inflammation here is not only damage. It is the starting signal for regeneration.', 'This inflammation is the starting gun for repair.')
        ]
      }
    ]
  },
  {
    num: 'SCENE 04', title: 'The Switch: M1 to M2', when: 'Days 3–8', shots: [
      {
        d: 22, draw: scene4, beats: [
          B(0, 'After eating dead cells (efferocytosis), macrophages reprogram into M2 "repair" macrophages.', 'Once the demolition crew finishes eating the rubble, they change uniforms.'),
          B(5.4, 'M2 cells release IL-10, IGF-1 and growth factors that calm inflammation and drive satellite-cell differentiation and fusion.', 'They become the construction crew.'),
          B(10.6, 'M1 and M2 are ends of a continuum. Finishing the cleanup triggers the switch, not inflammation simply fading.', 'Cleaning up faster means rebuilding starts sooner.'),
          B(15.6, 'Repeated re-injury restarts M1 activity and pushes toward chronic inflammation and fibrosis.', 'Re-injuring the muscle dumps new rubble on the site, so demolition starts all over again.')
        ]
      },
      {
        d: 17, draw: nsaidShot, badges: t => t > 12.6 ? [['ANIMAL', 'Acetaminophen: Jomard 2025']] : [], beats: [
          B(0, 'NSAIDs block COX enzymes in the injured tissue, which lowers local prostaglandins.', 'Anti-inflammatories like ibuprofen quiet the signals at the injury.'),
          B(4.8, 'Some of those prostaglandins are signals satellite cells use.', 'Some of those signals are ones the repair cells listen for.'),
          B(8.6, 'Acetaminophen works mainly in the central nervous system and has little effect on local prostaglandins.', 'Acetaminophen turns the pain volume down in the brain.'),
          B(12.8, 'In mice it did not impair regeneration.', 'The signals at the injury stay on.')
        ]
      },
      card({
        title: 'Pain medication during regeneration', items: [
          { text: 'Short-term NSAID use gave small benefits in strength loss, soreness and CK. No human study followed outcomes beyond 14 days.', tag: 'HUMAN', cite: 'Morelli et al., AJSM 2018 (meta-analysis, 41 studies)' },
          { text: 'In animals, effects turned negative with longer courses or later timing. Ketorolac at 47 h impaired regeneration in mice, though the macrophage switch was unaffected.', tag: 'ANIMAL', cite: 'Morelli 2018 · Bryant et al., PLoS One 2016' },
          { text: 'Conflicting: ibuprofen 1,200 mg/day (2 wk before, 4 wk after) increased satellite-cell activation and sped remodeling at 30 days in an e-stim injury model.', tag: 'HUMAN', cite: 'Mackey et al., FASEB J 2016 · overall evidence leans to harm: Mackey 2012' },
          { text: 'Acetaminophen did not impair regeneration in mice.', tag: 'ANIMAL', cite: 'Jomard et al., Scientific Reports 2025' },
          { text: 'Position: prefer acetaminophen for pain. If an NSAID is used, keep it short. Avoid regular use over several weeks during regeneration. Mind GI, kidney and bleeding risk.' }
        ]
      })
    ]
  },
  {
    num: 'SCENE 05', title: 'Supply Lines', when: 'Day ~3 onward', shots: [
      {
        d: 20, draw: scene5, beats: [
          B(0, 'New capillaries sprout from intact vessels at the edges and grow into the clot and granulation tissue.', 'A construction site needs roads for delivery trucks.'),
          B(5.4, 'They are visible by about day 3, driven by VEGF released by macrophages.', 'New tiny blood vessels get built into the hole.'),
          B(10.8, 'Oxygen delivery is rate-limiting. Regeneration moves only as fast as the supply lines advance.', 'Construction can only go as fast as the roads reach it.'),
          B(15.8, 'The goal is to restore blood flow, not to flood the tissue with oxygen.', 'The goal is good blood flow, not extra oxygen.')
        ]
      },
      {
        d: 13, draw: shockShot, badges: [['ANIMAL', 'Rat data · Zissler 2017']], beats: [
          B(0, 'Shockwave in rats: one session increased satellite-cell recruitment, proliferation and differentiation.', 'In rats, one shockwave session sped up the repair crews.'),
          B(6, 'Treated muscle reached at day 4 what untreated muscle reached at day 7. Controlled human trials in acute strains are lacking.', 'Treated muscle was about 3 days ahead. It hasn\'t been tested well in people yet.')
        ]
      },
      card({
        title: 'Supporting the supply lines', items: [
          { text: 'Support blood flow with pain-guided early movement, swelling control and nicotine avoidance.' },
          { text: 'Shockwave (ESWT): faster regeneration in rats. Reviews describe VEGF- and eNOS-driven vessel growth. Controlled human trials in acute strains are lacking.', tag: 'ANIMAL', cite: 'Zissler et al., 2017 · Gao & Zhao, J Int Med Res 2026' },
          { text: 'Hyperbaric oxygen improved oxygenation and regeneration in rat contusions. Human data are lacking, and it is not standard care.', tag: 'ANIMAL' }
        ]
      })
    ]
  },
  {
    num: 'SCENE 06', title: 'Granulation Tissue and the Scar Plug', when: 'Days 1–7', shots: [
      {
        d: 22, draw: scene6, beats: [
          B(0, 'Fibrin and fibronectin from the clot cross-link into granulation tissue, a primary extracellular matrix.', 'The clot turns into a soft, temporary filler, like packing a pothole.'),
          B(5.4, 'It anchors fibroblasts, which lay down tenascin-C and fibronectin, then type III collagen.', 'Builder cells (fibroblasts) climb the sticky scaffolding and lay down thin thread.'),
          B(11, 'New capillary loops make the tissue red and grainy, which is where "granulation" comes from.', 'Tiny new blood vessels make it look red and grainy.'),
          B(15.4, 'Type III fibers start out disorganized. Type I, which provides most tensile strength, comes later.', 'Later they swap the thread for rope.'),
          B(18.8, 'The plug fills the gap stump to stump. In week one it holds, but tears easily.', 'In the first week it\'s like wet cement: it holds, but it tears easily.')
        ]
      }
    ]
  },
  {
    num: 'SCENE 07', title: 'Waking the Rebuilders', when: 'Days 3–7', shots: [
      {
        d: 26, draw: scene7, beats: [
          B(0, 'Activated satellite cells switch on MyoD and Myf5 and multiply as myoblasts.', 'The spare-parts cells wake up and copy themselves.'),
          B(6, 'They multiply inside the empty basal-lamina tunnels.', 'They line up inside the empty sleeve.'),
          B(10.2, 'They switch on myogenin and fuse into a multinucleated myotube.', 'Then they merge together into one long cell.'),
          B(15.2, 'Each nucleus can only support a limited length of fiber, so a long fiber needs many nuclei.', 'One "foreman" can\'t run the whole thing, so many workers combine into one building with lots of foremen.'),
          B(20, 'Some satellite cells self-renew, restocking the reserve for future injuries.', 'A few spare-parts cells go back to sleep so they\'re ready for next time.'),
          B(23.2, 'Myotubes become new fibers or fuse onto the surviving stumps.', 'The new cell grows toward the gap like a train through a tunnel.')
        ]
      },
      card({
        title: 'Electrical stimulation', items: [
          { text: 'Rat strain model: low-frequency e-stim, 20 Hz, 30 minutes twice daily, started at day 5.', tag: 'ANIMAL', cite: 'Wang et al., 2020' },
          { text: 'It increased MyoD and myogenin and produced more mature, well-ordered fibers.' },
          { text: 'Day 5 was chosen on purpose: after granulation tissue had bridged the gap.' }
        ]
      })
    ]
  },
  {
    num: 'SCENE 08', title: 'Breaking Through', when: 'Days 5–21', shots: [
      {
        d: 26, draw: scene8, beats: [
          B(0, 'From about day 5, regenerating stumps send out branches that pierce into both sides of the scar.', 'Imagine two tunnel crews digging into a hill from opposite sides.'),
          B(6, 'Each branch anchors to scar collagen through new mini-myotendinous junctions.', 'Each crew digs lots of small tunnels with its "fingers."'),
          B(11, 'Day 14: the scar condenses, and the fibers close most of the gap.', 'The hill keeps getting smaller.'),
          B(16.5, 'Day 21: fibers from both sides interlace, with a thin seam of scar between them.', 'Where they meet, the fingers interlock like clasped hands.'),
          B(21.4, 'Nerves regrow along old paths and new NMJs form. Regeneration peaks ~2 weeks and slows by ~4 weeks.', 'The dirt left between the fingers is the permanent scar.')
        ]
      },
      {
        d: 10, draw: splitShot, beats: [
          B(0, 'Small gap with controlled scar: many fingers interlock.', 'The smaller the hill, the less dirt is left.'),
          B(5, 'Large gap with excessive scar: a dense wall blocks the fibers, which stop and curl.', 'A big hill leaves a wall the crews can\'t dig through.')
        ]
      },
      card({
        title: 'Tipping the balance toward muscle', items: [
          { text: 'Keep the gap small with early compression and protection.' },
          { text: 'Relative rest for about the first 3–5 days, then progressive, pain-guided loading: isometric, then isotonic, then dynamic.' },
          { text: 'Avoid prolonged immobilization. It leads to a larger, more disorganized, contracted scar.', cite: 'Wang et al., 2020' },
          { text: 'Too much TGF-β1 drives fibroblasts toward dense scar. Antifibrotic agents and PRP are experimental.', tag: 'ANIMAL', cite: 'Tsai et al., 2021 · Boivin et al., 2023' }
        ]
      })
    ]
  },
  {
    num: 'SCENE 09', title: 'Remodeling', when: 'Week 1 to month 6+', shots: [
      {
        d: 26, draw: scene9, beats: [
          B(0, 'New fibers grow thicker, move their nuclei to the edge, and line up their sarcomeres. Capillaries are pruned back.', 'The new muscle "wires" bulk up and get organized.'),
          B(6, 'Collagen shifts from type III to type I, thickens, cross-links, and aligns with the direction of pull.', 'The scar\'s thread gets swapped for rope, and the rope gets braided tight.'),
          B(12, 'Fibroblasts become myofibroblasts, which pull on the collagen like tiny winches. The scar contracts.', 'The scar also shrinks, like shrink-wrap tightening.'),
          B(18.4, 'Remodeling lasts months. In human strains, MRI still shows active repair at 6 months, after return to sport.', 'Even after an athlete feels fine, the inside is still finishing construction for months.')
        ]
      },
      {
        d: 9, draw: loadVsImmob, beats: [
          B(0, 'Loaded muscle: aligned collagen, thin scar.', 'Loaded muscle: neat rope, thin scar.'),
          B(4.4, 'Immobilized muscle: a tangled, shortened scar.', 'Immobilized muscle: a tangled, short scar.')
        ]
      },
      card({
        title: 'Speeding the type III → type I shift', items: [
          { text: 'Progressive mechanical loading drives collagen synthesis and alignment.' },
          { text: 'Ensure adequate protein and energy intake.' },
          { text: 'Avoid smoking and long courses of NSAIDs or corticosteroids.' },
          { text: 'Cross-linking runs on biological time. Loading improves quality and alignment more than it shortens the calendar.' }
        ]
      })
    ]
  },
  {
    num: 'SCENE 10', title: 'The Fascial Layer', when: 'Stecco\'s densification model', shots: [
      {
        d: 32, draw: scene10, badges: [['THEORY', 'Proposed model']], beats: [
          B(0, 'Carla Stecco\'s group describes densification of the hyaluronan-rich layer between fascial sheets.', 'Between the sleeves of the muscle is a slippery gel.'),
          B(5.6, 'After trauma, overuse, disuse or inflammation, the layer becomes more viscous, without true fibrosis having to be present.', 'After an injury, or after not moving much, that gel can get thick and sticky, like honey left in the fridge.'),
          B(11.2, 'Gliding is reduced, and free nerve endings may become irritated.', 'The layers stop sliding well, which can feel tight or sore even after the tear has healed.'),
          B(16.2, 'Two depths: the collagen scar inside the muscle is permanent. Densified gel is proposed to be reversible.', 'The scar inside the muscle is permanent. The sticky gel may not be.'),
          B(22.4, 'Movement and manual shear are proposed to restore gliding. Direct human evidence for HA changes is limited.', 'Moving, and possibly hands-on treatment, may help warm the "honey" back up.'),
          B(27.6, 'The muscle model and the fascial model complement each other.', 'So things glide again.')
        ]
      },
      card({
        title: 'Fascial work: evidence status', items: [
          { text: 'Myofascial release is consistently associated with short-term improvements in pain and range of motion.' },
          { text: 'Long-term functional outcomes and direct structural change in fascia are inconsistent.' },
          { text: 'Best supported as an adjunct that helps athletes move and engage in active rehab, not as stand-alone treatment.', cite: 'Gao & Gao, Frontiers in Physiology, 2026' },
          { text: 'Proposed calcium–hyaluronan feedback loop; fascial stiffening may impair regeneration, so treat both muscle and fascia.', tag: 'THEORY', cite: 'Kirkness 2026 · Amstel 2026' },
          { text: 'Timing: gentle work and movement around the injury in subacute and remodeling phases. No aggressive deep work on the tear in week 1.' }
        ]
      })
    ]
  },
  {
    num: 'SCENE 11', title: 'Why Function Isn\'t Fully Restored', when: 'After "healed"', shots: [
      {
        d: 22, draw: scene11, beats: [
          B(0, 'The scar is not muscle. It is stiffer, does not contract, and changes how force passes through the muscle.', 'The patch works, but it\'s a patch, not the original.'),
          B(5, 'The folded myotendinous junction may never fully return. Atrophy and fat infiltration develop.', 'The weak spot isn\'t fully rebuilt, and the muscle can shrink.'),
          B(10.6, 'Neural inhibition: the injured muscle is under-activated, especially in eccentric work at long lengths.', 'The brain also protects the area by "turning down" the muscle.'),
          B(15.8, 'Returning to sport before the tissue has matured contributes to the high re-injury rate.', 'So the muscle gets weaker unless it\'s trained back up.')
        ]
      }
    ]
  },
  {
    num: 'SCENE 12', title: 'The Phase-Matched Plan', when: 'Putting it together', shots: [
      {
        d: 32, draw: planTable, beats: [
          B(0, 'Time the stimulus to the biology.', 'Match the rehab to what the tissue is doing.'),
          B(3, '0–48 h: stop, compress, elevate, protect. No eccentric loading. Acetaminophen preferred.', 'First two days: stop, compress, elevate, protect.'),
          B(8.6, 'Days 2–5: pain-free isometrics. Avoid both immobilization and aggressive loading.', 'Days 2 to 5: gentle, pain-free holds.'),
          B(14.2, 'Days 5–21: progressive isotonic, then dynamic loading. Gentle fascial work around the site.', 'Days 5 to 21: build up the loading step by step.'),
          B(19.8, 'Weeks 3–12: lengthening and eccentric work at long muscle lengths. Criteria-based return to sport.', 'Weeks 3 to 12: strength at long lengths, and return when the tests say so.'),
          B(25.4, 'Months 3–6+: keep up eccentric strengthening, like Nordic curls, after return to play.', 'Months 3 to 6 and beyond: keep training it after they\'re back.')
        ]
      },
      {
        d: 15, draw: finale, beats: [
          B(0, 'Healing is a race between muscle regrowth and scar, inside a fascial system that has to keep gliding.', 'Healing is a race between new muscle and scar.'),
          B(5, 'Protect the wet cement, feed the supply lines, load the rebuilders, align the rope, and keep the layers sliding.', 'Protect the wet cement, feed the supply lines, load the rebuilders, align the rope, and keep the layers sliding.')
        ]
      },
      { d: 10, draw: refsDraw, card: true, noHeader: true, voice: [{ t: .5, text: 'The sources cited in this film are listed on screen.' }] }
    ]
  }
];

/* ---------- timeline ---------- */
let TOTAL = 0;
for (const sc of SCENES) { sc.start = TOTAL; let st = 0; for (const sh of sc.shots) { sh.start = st; st += sh.d; } sc.dur = st; TOTAL += st; }
function locate(T) {
  T = clamp(T, 0, TOTAL - .001);
  for (const sc of SCENES) if (T < sc.start + sc.dur) {
    const lt = T - sc.start;
    for (let i = 0; i < sc.shots.length; i++) { const sh = sc.shots[i]; if (lt < sh.start + sh.d) return { sc, sh, i, lt, st: lt - sh.start }; }
  }
  const sc = SCENES[SCENES.length - 1]; const i = sc.shots.length - 1; return { sc, sh: sc.shots[i], i, lt: sc.dur, st: sc.shots[i].d };
}
function chrome(ctx, L, mode, T) {
  const { sc, sh, st } = L;
  const g = ctx.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, 'rgba(6,8,13,.88)'); g.addColorStop(1, 'rgba(6,8,13,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 120);
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
    let b = null; for (const x of sh.beats) if (st >= x.t) b = x;
    if (b) {
      const a = seg(st, b.t, b.t + .35) * (1 - seg(st, sh.d - .3, sh.d));
      const gb = ctx.createLinearGradient(0, 782, 0, H); gb.addColorStop(0, 'rgba(6,8,13,0)'); gb.addColorStop(.3, 'rgba(6,8,13,.82)'); gb.addColorStop(1, 'rgba(6,8,13,.92)');
      ctx.fillStyle = gb; ctx.fillRect(0, 782, W, H - 782);
      ctx.save(); ctx.globalAlpha *= a; ctx.font = `500 30px ${F.body}`; ctx.fillStyle = COL.text; ctx.textAlign = 'center';
      const lines = wrap(ctx, mode === 'plain' ? b.p : b.s, 1300).slice(0, 3);
      lines.forEach((l, i) => ctx.fillText(l, 800, 868 - (lines.length - 1 - i) * 40));
      ctx.restore();
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, H - 4, W, 4);
  ctx.fillStyle = COL.accent; ctx.fillRect(0, H - 4, W * T / TOTAL, 4);
}
function renderFilm(ctx, T, mode = 'sci') {
  const L = locate(T);
  ctx.save(); L.sh.draw(ctx, L.st, L.sh.d, L); ctx.restore();
  ctx.save(); chrome(ctx, L, mode, T); ctx.restore();
  return L;
}
